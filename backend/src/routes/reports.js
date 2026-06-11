const express = require('express');
const Report = require('../models/Report');
const User = require('../models/User');
const auth = require('../middleware/auth');

const router = express.Router();

const REASONS = ['hostile', 'harassment', 'doxxing', 'spam', 'impersonation', 'real_world_harm', 'other'];

// POST /api/reports/:userId — file a report
router.post('/:userId', auth, async (req, res) => {
  try {
    const { reason, description } = req.body;
    const reportedId = req.params.userId;

    if (reportedId === req.user._id.toString()) {
      return res.status(400).json({ message: "You can't report yourself." });
    }
    if (!REASONS.includes(reason)) {
      return res.status(400).json({ message: 'Invalid reason.' });
    }

    const reported = await User.findById(reportedId);
    if (!reported) return res.status(404).json({ message: 'User not found.' });

    const existing = await Report.findOne({ reporter: req.user._id, reported: reportedId });
    if (existing) return res.status(409).json({ message: 'You have already reported this user.' });

    await Report.create({
      reporter: req.user._id,
      reported: reportedId,
      reason,
      description: (description || '').slice(0, 500),
    });

    res.status(201).json({ ok: true });
  } catch (err) {
    if (err.code === 11000) return res.status(409).json({ message: 'Already reported.' });
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
