// Convert the base64url VAPID key to the Uint8Array the browser expects
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  const output = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; ++i) output[i] = rawData.charCodeAt(i)
  return output
}

async function getVapidPublicKey() {
  const res = await fetch(`${import.meta.env.VITE_API_URL}/notifications/push/vapid-public-key`, {
    credentials: 'include',
  })
  if (!res.ok) throw new Error('Failed to fetch VAPID public key')
  const { data } = await res.json()
  return data.publicKey
}

export async function subscribeToPush() {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) return null

  const permission = await Notification.requestPermission()
  if (permission !== 'granted') return null

  const registration = await navigator.serviceWorker.register('/sw.js')
  await navigator.serviceWorker.ready

  const publicKey = await getVapidPublicKey()

  let subscription = await registration.pushManager.getSubscription()
  if (!subscription) {
    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicKey),
    })
  }

  await fetch(`${import.meta.env.VITE_API_URL}/notifications/push/subscribe`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ subscription: subscription.toJSON() }),
  })

  return subscription
}

export async function unsubscribeFromPush() {
  if (!('serviceWorker' in navigator)) return
  const registration = await navigator.serviceWorker.getRegistration('/sw.js')
  if (!registration) return
  const subscription = await registration.pushManager.getSubscription()
  if (!subscription) return

  await fetch(`${import.meta.env.VITE_API_URL}/notifications/push/subscribe`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ endpoint: subscription.endpoint }),
  })

  await subscription.unsubscribe()
}