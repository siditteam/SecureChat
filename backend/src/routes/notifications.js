const express = require('express');
const webpush = require('web-push');
const authMiddleware = require('../middleware/auth');
const User = require('../models/User');

const router = express.Router();

webpush.setVapidDetails(
  process.env.VAPID_EMAIL,
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

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
