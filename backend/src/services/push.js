const webpush = require('web-push');

const vEmail   = (process.env.VAPID_EMAIL       || '').trim();
const vPublic  = (process.env.VAPID_PUBLIC_KEY  || '').trim();
const vPrivate = (process.env.VAPID_PRIVATE_KEY || '').trim();

const ready = !!(vEmail && vPublic && vPrivate);

if (ready) {
  try {
    webpush.setVapidDetails(vEmail, vPublic, vPrivate);
    console.info('[push] VAPID configured');
  } catch (err) {
    console.warn('[push] VAPID config error:', err?.message);
  }
} else {
  console.warn('[push] VAPID not configured — push disabled. Set VAPID_EMAIL, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY.');
}

/**
 * Send a push notification to a user document.
 * Throws { message: 'PUSH_EXPIRED' } if subscription is gone (caller should clear it).
 */
async function sendPush(user, { title, body, tag, data } = {}) {
  if (!ready || !user?.pushSubscription) return false;
  if (user.settings?.notifications === false) return false;

  const sub = typeof user.pushSubscription === 'string'
    ? JSON.parse(user.pushSubscription)
    : user.pushSubscription;

  const payload = JSON.stringify({
    title: title || 'Unddr',
    body:  body  || 'New message',
    icon:  '/assets/pngs/logo-unddr-teal-icon-128.png',
    badge: '/assets/pngs/logo-unddr-teal-icon-128.png',
    tag:   tag   || 'unddr',
    vibrate: [200, 100, 200],
    renotify: true,
    data: data || { url: '/' },
  });

  try {
    await webpush.sendNotification(sub, payload);
    return true;
  } catch (err) {
    if (err.statusCode === 410 || err.statusCode === 404) {
      throw Object.assign(new Error('PUSH_EXPIRED'), { statusCode: err.statusCode });
    }
    throw err;
  }
}

module.exports = { sendPush, vapidReady: ready };
