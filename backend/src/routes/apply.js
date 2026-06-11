const express = require('express');
const rateLimit = require('express-rate-limit');
const InviteApplication = require('../models/InviteApplication');

const router = express.Router();

const applyLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  message: { message: 'Too many applications from this IP. Try again later.' },
});

// POST /api/apply — public, no auth required
router.post('/', applyLimiter, async (req, res) => {
  try {
    const { name, email, phone, social, platform, why } = req.body;

    if (!name?.trim() || !email?.trim() || !phone?.trim() || !social?.trim()) {
      return res.status(400).json({ message: 'Name, email, phone, and social handle are required.' });
    }

    // Block duplicate pending/approved applications
    const existing = await InviteApplication.findOne({
      $or: [
        { email: email.trim().toLowerCase(), status: { $in: ['pending', 'approved'] } },
        { phone: phone.trim(),               status: { $in: ['pending', 'approved'] } },
      ],
    });

    if (existing) {
      return res.status(409).json({ message: 'An application with this email or phone already exists. We will be in touch.' });
    }

    await InviteApplication.create({
      name:     name.trim(),
      email:    email.trim().toLowerCase(),
      phone:    phone.trim(),
      social:   social.trim(),
      platform: platform || 'instagram',
      why:      why?.trim() || '',
    });

    res.status(201).json({ ok: true });
  } catch (err) {
    console.error('apply error:', err);
    res.status(500).json({ message: 'Failed to submit application.' });
  }
});

module.exports = router;
