import webpush from 'web-push'
import { pool } from '../config/db.js'
import { randomUUID } from 'node:crypto'
import { env } from '../config/env.js'

webpush.setVapidDetails(
  env.VAPID_SUBJECT,
  env.VAPID_PUBLIC_KEY,
  env.VAPID_PRIVATE_KEY,
)

export function getPublicKey() {
  return env.VAPID_PUBLIC_KEY
}

export async function saveSubscription(userId, subscription, userAgent = null) {
  if (!subscription?.endpoint || !subscription?.keys?.p256dh || !subscription?.keys?.auth) {
    throw new Error('Invalid subscription object')
  }
  const id = randomUUID().replace(/-/g, '').slice(0, 26)
  await pool.query(
    `INSERT INTO push_subscriptions (id, user_id, endpoint, p256dh, auth, user_agent)
     VALUES (?, ?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE
       user_id      = VALUES(user_id),
       p256dh       = VALUES(p256dh),
       auth         = VALUES(auth),
       user_agent   = VALUES(user_agent),
       last_seen_at = NOW()`,
    [id, userId, subscription.endpoint, subscription.keys.p256dh, subscription.keys.auth, userAgent],
  )
}

export async function removeSubscription(userId, endpoint) {
  if (!endpoint) return
  await pool.query(
    'DELETE FROM push_subscriptions WHERE user_id = ? AND endpoint = ?',
    [userId, endpoint],
  )
}

export async function sendPushToUser(userId, { title, body, data = {} }) {
  const [rows] = await pool.query(
    'SELECT endpoint, p256dh, auth FROM push_subscriptions WHERE user_id = ?',
    [userId],
  )
  if (!rows.length) return

  const payload = JSON.stringify({
    title,
    body,
    data: { ...data, link: data.link || '/' },
  })

  const staleEndpoints = []

  await Promise.all(
    rows.map(async (row) => {
      const subscription = {
        endpoint: row.endpoint,
        keys: { p256dh: row.p256dh, auth: row.auth },
      }
      try {
        await webpush.sendNotification(subscription, payload, { TTL: 3600 })
      } catch (err) {
        // 404 / 410 mean the subscription is dead — prune it
        if (err.statusCode === 404 || err.statusCode === 410) {
          staleEndpoints.push(row.endpoint)
        } else {
          console.error('[push] send failed:', err.statusCode, err.body || err.message)
        }
      }
    }),
  )

  if (staleEndpoints.length) {
    await pool.query(
      `DELETE FROM push_subscriptions WHERE endpoint IN (${staleEndpoints.map(() => '?').join(',')})`,
      staleEndpoints,
    )
  }
}