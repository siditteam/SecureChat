const express = require('express');
const mongoose = require('mongoose');
const Message = require('../models/Message');
const auth = require('../middleware/auth');
const ss = require('../socketState');

const router = express.Router();

// ── GET pinned message for a conversation ─────────────────────────────────────
// MUST be declared before /:id so Express doesn't match "pinned" as an :id param
router.get('/pinned/:userId', auth, async (req, res) => {
  try {
    const { userId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: 'Invalid user ID' });
    }

    const pinned = await Message.findOne({
      $or: [
        { sender: req.user._id, receiver: userId },
        { sender: userId, receiver: req.user._id },
      ],
      pinnedAt: { $ne: null },
      isDeleted: false,
    })
      .sort({ pinnedAt: -1 })
      .populate('sender', 'username');

    res.json(pinned || null);
  } catch (err) {
    console.error('pinned fetch error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// ── GET messages in a conversation ───────────────────────────────────────────
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
      // Hide messages the current user has deleted for themselves
      { deletedFor: { $nin: [req.user._id] } },
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

// ── CLEAR conversation for me (adds me to deletedFor on every message) ────────
// Must be before /:id to avoid Express matching "conversation" as an id param
router.delete('/conversation/:userId', auth, async (req, res) => {
  try {
    const { userId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: 'Invalid user ID' });
    }
    await Message.updateMany(
      {
        $or: [
          { sender: req.user._id, receiver: userId },
          { sender: userId, receiver: req.user._id },
        ],
      },
      { $addToSet: { deletedFor: req.user._id } }
    );
    res.json({ ok: true });
  } catch (err) {
    console.error('clear conversation error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// ── DELETE a message ──────────────────────────────────────────────────────────
// Body: { forEveryone: boolean }
router.delete('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid message ID' });
    }

    const message = await Message.findById(id);
    if (!message) return res.status(404).json({ message: 'Message not found' });

    const isSender = message.sender.toString() === req.user._id.toString();
    const { forEveryone } = req.body || {};

    if (forEveryone && isSender) {
      // Hard delete for everyone
      message.isDeleted = true;
      await message.save();

      // Notify the other party in real-time
      const otherId = isSender ? message.receiver.toString() : message.sender.toString();
      ss.emit(otherId, 'message_deleted', { messageId: id });

      return res.json({ deleted: true, forEveryone: true });
    }

    // "Delete for me" — just add caller to deletedFor
    await Message.findByIdAndUpdate(id, { $addToSet: { deletedFor: req.user._id } });
    return res.json({ deleted: true, forEveryone: false });
  } catch (err) {
    console.error('delete message error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// ── PIN a message ─────────────────────────────────────────────────────────────
router.put('/:id/pin', auth, async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid message ID' });
    }

    const message = await Message.findById(id).populate('sender', 'username');
    if (!message) return res.status(404).json({ message: 'Message not found' });

    // Verify caller is part of this conversation
    const myId = req.user._id.toString();
    if (message.sender._id.toString() !== myId && message.receiver.toString() !== myId) {
      return res.status(403).json({ message: 'Access denied.' });
    }

    message.pinnedAt = new Date();
    message.pinnedBy = req.user._id;
    await message.save();

    const msgObj = message.toObject();

    // Notify the other party
    const otherId = message.sender._id.toString() === myId
      ? message.receiver.toString()
      : message.sender._id.toString();
    ss.emit(otherId, 'message_pinned', { message: msgObj });

    res.json(msgObj);
  } catch (err) {
    console.error('pin message error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// ── UNPIN a message ───────────────────────────────────────────────────────────
router.delete('/:id/pin', auth, async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid message ID' });
    }

    const message = await Message.findById(id).populate('sender', 'username');
    if (!message) return res.status(404).json({ message: 'Message not found' });

    const myId = req.user._id.toString();
    if (message.sender._id.toString() !== myId && message.receiver.toString() !== myId) {
      return res.status(403).json({ message: 'Access denied.' });
    }

    message.pinnedAt = null;
    message.pinnedBy = null;
    await message.save();

    // Notify the other party
    const otherId = message.sender._id.toString() === myId
      ? message.receiver.toString()
      : message.sender._id.toString();
    ss.emit(otherId, 'message_unpinned', { messageId: id });

    res.json({ unpinned: true });
  } catch (err) {
    console.error('unpin message error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
