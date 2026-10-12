import { pool } from '../config/db.js'
import { createForUser } from './notifications.service.js'

/**
 * Find all overdue tasks that haven't been notified about in the last 24h,
 * group them per user, create one notification per user, and let
 * createForUser fire the push.
 */
export async function scanOverdueTasks() {
  const [rows] = await pool.query(`
    SELECT
      t.id            AS task_id,
      t.user_id       AS user_id,
      t.task_date     AS task_date,
      t.type          AS type,
      p.name          AS plant_name
    FROM tasks t
    JOIN plants p ON p.id = t.plant_id
    WHERE t.status = 'pending'
      AND t.task_date < CURDATE()
      AND p.archived_at IS NULL
      AND (t.last_overdue_notified_at IS NULL
           OR t.last_overdue_notified_at < NOW() - INTERVAL 24 HOUR)
  `)

  if (!rows.length) return { notifiedUsers: 0, notifiedTasks: 0 }

  // Group by user
  const byUser = new Map()
  for (const r of rows) {
    if (!byUser.has(r.user_id)) byUser.set(r.user_id, [])
    byUser.get(r.user_id).push(r)
  }

  let notifiedUsers = 0

  for (const [userId, tasks] of byUser) {
    const count = tasks.length
    const preview = tasks
      .slice(0, 3)
      .map(t => `${t.plant_name} (${t.type})`)
      .join(', ')
    const more = count > 3 ? `, +${count - 3} more` : ''
    const text = count === 1
      ? `${tasks[0].plant_name} ${tasks[0].type.toLowerCase()} is overdue`
      : `${count} overdue tasks: ${preview}${more}`

    await createForUser(userId, {
      text,
      icon: '⚠',
      page: 'schedule',
      plantId: count === 1 ? tasks[0].task_id && null : null, // only link if single
    })

    // Mark them so we don't re-notify for 24h
    const taskIds = tasks.map(t => t.task_id)
    await pool.query(
      `UPDATE tasks SET last_overdue_notified_at = NOW()
        WHERE id IN (${taskIds.map(() => '?').join(',')})`,
      taskIds,
    )

    notifiedUsers++
  }

  return { notifiedUsers, notifiedTasks: rows.length }
}