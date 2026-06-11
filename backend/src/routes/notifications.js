const express = require('express');
const webpush = require('web-push');
const authMiddleware = require('../middleware/auth');
const User = require('../models/User');

const router = express.Router();

// Configure VAPID details for web-push if valid env vars exist.
// web-push validates the "subject" (first arg) strictly — it must be a mailto: or https:// URL.
const vapidEmail = (process.env.VAPID_EMAIL || '').trim();
const vapidPublic = (process.env.VAPID_PUBLIC_KEY || '').trim();
const vapidPrivate = (process.env.VAPID_PRIVATE_KEY || '').trim();

function isValidVapidSubject(s) {
  if (!s) return false;
  return /^mailto:[^\s@]+@[^\s@]+$/.test(s) || /^https?:\/\//i.test(s);
}

if (isValidVapidSubject(vapidEmail) && vapidPublic && vapidPrivate) {
  try {
    webpush.setVapidDetails(vapidEmail, vapidPublic, vapidPrivate);
    console.info('web-push: VAPID details configured');
  } catch (err) {
    console.warn('web-push: failed to set VAPID details', err?.message || err);
  }
} else {
  console.warn('web-push: VAPID not configured. Set VAPID_EMAIL (mailto:you@domain or https://...), VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY in environment.');
}

router.get('/vapid-public-key', (req, res) => {
  res.json({ publicKey: process.env.VAPID_PUBLIC_KEY });
});

router.post('/subscribe', authMiddleware, async (req, res) => {
  try {
    const { subscription } = req.body;
    if (!subscription?.endpoint) {
      return res.status(400).json({ message: 'Invalid subscription' });
    }
    await User.findByIdAndUpdate(req.user._id, {
      pushSubscription: JSON.stringify(subscription),
      'settings.notifications': true,
    });
    res.json({ ok: true });
  } catch (err) {
    console.error('subscribe error:', err);
    res.status(500).json({ message: 'Failed to save subscription' });
  }
});

router.delete('/unsubscribe', authMiddleware, async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.user._id, {
      pushSubscription: null,
      'settings.notifications': false,
    });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ message: 'Failed to remove subscription' });
  }
});

module.exports = router;
