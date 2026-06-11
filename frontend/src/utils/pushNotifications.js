const API = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY;

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(base64);
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)));
}

export async function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) return null;
  try {
    const reg = await navigator.serviceWorker.register('/sw.js');
    return reg;
  } catch {
    return null;
  }
}

export async function subscribeToPush(authToken) {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    throw new Error('Push not supported in this browser');
  }

  const permission = await Notification.requestPermission();
  if (permission !== 'granted') throw new Error('Permission denied');

  const reg = await navigator.serviceWorker.ready;
  const subscription = await reg.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
  });

  await fetch(`${API}/notifications/subscribe`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${authToken}` },
    body: JSON.stringify({ subscription }),
  });

  return subscription;
}

export async function unsubscribeFromPush(authToken) {
  if (!('serviceWorker' in navigator)) return;

  const reg = await navigator.serviceWorker.ready;
  const subscription = await reg.pushManager.getSubscription();
  if (subscription) await subscription.unsubscribe();

  await fetch(`${API}/notifications/unsubscribe`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${authToken}` },
  });
}

export function getPermissionStatus() {
  if (!('Notification' in window)) return 'unsupported';
  return Notification.permission;
}

export function isPushSupported() {
  return 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
}
