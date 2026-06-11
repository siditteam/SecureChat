const express = require('express');
const mongoose = require('mongoose');
const Message = require('../models/Message');
const auth = require('../middleware/auth');

const router = express.Router();

router.get('/:userId', auth, async (req, res) => {
  try {
    const { userId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: 'Invalid user ID' });
    }

    // Block check: if either side has blocked the other, deny
    const other = await require('../models/User').findById(userId).select('blockedUsers');
    if (!other) return res.status(404).json({ message: 'User not found' });
    const meBlocked = (req.user.blockedUsers || []).map(String).includes(userId);
    const otherBlockedMe = (other.blockedUsers || []).map(String).includes(req.user._id.toString());
    if (meBlocked || otherBlockedMe) return res.status(403).json({ message: 'Access denied.' });

    const { before, limit = 50 } = req.query;

    const conditions = [
      {
        $or: [
          { sender: req.user._id, receiver: userId },
          { sender: userId, receiver: req.user._id },
        ],
      },
      { isDeleted: false },
      {
        $or: [{ expiresAt: null }, { expiresAt: { $gt: new Date() } }],
      },
      {
        $nor: [
          { viewOnce: true, receiver: req.user._id, mediaViewed: true },
        ],
      },
    ];

    if (before) {
      const beforeDate = new Date(before);
      if (!isNaN(beforeDate.getTime())) {
        conditions.push({ createdAt: { $lt: beforeDate } });
      }
    }

    const messages = await Message.find({ $and: conditions })
      .sort({ createdAt: -1 })
      .limit(Math.min(parseInt(limit) || 50, 100))
      .populate('sender', 'username');

    res.json(messages.reverse());
  } catch (err) {
    console.error('Messages fetch error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
