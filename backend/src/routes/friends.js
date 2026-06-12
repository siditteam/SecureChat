const express = require('express');
const mongoose = require('mongoose');
const FriendRequest = require('../models/FriendRequest');
const User = require('../models/User');
const auth = require('../middleware/auth');
const ss = require('../socketState');

const router = express.Router();

// ── Send friend request ───────────────────────────────────────────────────────
router.post('/request/:userId', auth, async (req, res) => {
  try {
    const senderId = req.user._id.toString();
    const { userId: receiverId } = req.params;

    if (senderId === receiverId) return res.status(400).json({ message: "You can't add yourself." });
    if (!mongoose.Types.ObjectId.isValid(receiverId)) return res.status(400).json({ message: 'Invalid user.' });

    const receiver = await User.findById(receiverId);
    if (!receiver) return res.status(404).json({ message: 'User not found.' });

    // Check if the OTHER person already sent a request → auto-accept
    const reverseRequest = await FriendRequest.findOne({
      sender: receiverId, receiver: senderId, status: 'pending',
    });
    if (reverseRequest) {
      reverseRequest.status = 'accepted';
      await reverseRequest.save();
      const sender = await User.findById(senderId);
      ss.emit(receiverId, 'friend_request_accepted', { by: { _id: senderId, username: sender.username } });
      return res.json({ status: 'accepted', message: 'You are now friends!' });
    }

    // Check existing
    let request = await FriendRequest.findOne({ sender: senderId, receiver: receiverId });
    if (request) {
      if (request.status === 'accepted') return res.status(409).json({ message: 'Already friends.' });
      if (request.status === 'pending')  return res.status(409).json({ message: 'Request already sent.' });
      // Was rejected — allow resend
      request.status = 'pending';
      await request.save();
    } else {
      request = await FriendRequest.create({ sender: senderId, receiver: receiverId });
    }

    // Notify recipient in real-time
    ss.emit(receiverId, 'new_friend_request', {
      _id: request._id,
      sender: { _id: senderId, username: req.user.username },
    });

    res.status(201).json({
      status: 'pending',
      message: 'Friend request sent.',
      requestId: request._id.toString(),
      isSender: true,
    });
  } catch (err) {
    if (err.code === 11000) return res.status(409).json({ message: 'Request already exists.' });
    console.error('send-request error:', err);
    res.status(500).json({ message: 'Server error.' });
  }
});

// ── Accept ────────────────────────────────────────────────────────────────────
router.put('/accept/:requestId', auth, async (req, res) => {
  try {
    const request = await FriendRequest.findOne({
      _id: req.params.requestId, receiver: req.user._id, status: 'pending',
    });
    if (!request) return res.status(404).json({ message: 'Request not found.' });

    request.status = 'accepted';
    await request.save();

    // Notify sender
    ss.emit(request.sender.toString(), 'friend_request_accepted', {
      by: { _id: req.user._id.toString(), username: req.user.username },
    });

    res.json({ message: 'Friend request accepted.' });
  } catch {
    res.status(500).json({ message: 'Server error.' });
  }
});

// ── Reject ────────────────────────────────────────────────────────────────────
router.put('/reject/:requestId', auth, async (req, res) => {
  try {
    const request = await FriendRequest.findOne({
      _id: req.params.requestId, receiver: req.user._id, status: 'pending',
    });
    if (!request) return res.status(404).json({ message: 'Request not found.' });

    request.status = 'rejected';
    await request.save();
    res.json({ message: 'Request rejected.' });
  } catch {
    res.status(500).json({ message: 'Server error.' });
  }
});

// ── Cancel outgoing / unfriend ────────────────────────────────────────────────
router.delete('/:userId', auth, async (req, res) => {
  try {
    await FriendRequest.deleteOne({
      $or: [
        { sender: req.user._id, receiver: req.params.userId },
        { sender: req.params.userId, receiver: req.user._id },
      ],
    });
    res.json({ message: 'Done.' });
  } catch {
    res.status(500).json({ message: 'Server error.' });
  }
});

// ── List accepted friends ─────────────────────────────────────────────────────
router.get('/', auth, async (req, res) => {
  try {
    const docs = await FriendRequest.find({
      $or: [{ sender: req.user._id }, { receiver: req.user._id }],
      status: 'accepted',
    }).populate('sender receiver', 'username phone publicKey isOnline lastSeen');

    const friends = docs.map((d) => {
      const f = d.sender._id.toString() === req.user._id.toString() ? d.receiver : d.sender;
      return f.toPublicJSON();
    });

    res.json(friends);
  } catch {
    res.status(500).json({ message: 'Server error.' });
  }
});

// ── Incoming pending requests ─────────────────────────────────────────────────
router.get('/requests/incoming', auth, async (req, res) => {
  try {
    const docs = await FriendRequest.find({
      receiver: req.user._id, status: 'pending',
    }).populate('sender', 'username isOnline');
    res.json(docs);
  } catch {
    res.status(500).json({ message: 'Server error.' });
  }
});

// ── Outgoing pending requests ─────────────────────────────────────────────────
router.get('/requests/outgoing', auth, async (req, res) => {
  try {
    const docs = await FriendRequest.find({
      sender: req.user._id, status: 'pending',
    }).populate('receiver', 'username isOnline');
    res.json(docs);
  } catch {
    res.status(500).json({ message: 'Server error.' });
  }
});

// ── Status with a specific user ───────────────────────────────────────────────
router.get('/status/:userId', auth, async (req, res) => {
  try {
    const doc = await FriendRequest.findOne({
      $or: [
        { sender: req.user._id, receiver: req.params.userId },
        { sender: req.params.userId, receiver: req.user._id },
      ],
    });
    if (!doc) return res.json({ status: 'none' });
    res.json({
      status: doc.status,
      requestId: doc._id.toString(),
      isSender: doc.sender.toString() === req.user._id.toString(),
    });
  } catch {
    res.status(500).json({ message: 'Server error.' });
  }
});

// ── Block a user ─────────────────────────────────────────────────────────────
router.post('/block/:userId', auth, async (req, res) => {
  try {
    const { userId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(userId)) return res.status(400).json({ message: 'Invalid user.' });
    if (req.user._id.toString() === userId) return res.status(400).json({ message: "You can't block yourself." });

    // add to blockedUsers
    await User.findByIdAndUpdate(req.user._id, { $addToSet: { blockedUsers: userId } });

    // remove any friend requests / friendships between the two
    await FriendRequest.deleteMany({
      $or: [
        { sender: req.user._id, receiver: userId },
        { sender: userId, receiver: req.user._id },
      ],
    });

    res.json({ blocked: true });
  } catch (err) {
    console.error('block error:', err);
    res.status(500).json({ message: 'Server error.' });
  }
});

// ── Unblock a user ───────────────────────────────────────────────────────────
router.delete('/block/:userId', auth, async (req, res) => {
  try {
    const { userId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(userId)) return res.status(400).json({ message: 'Invalid user.' });
    await User.findByIdAndUpdate(req.user._id, { $pull: { blockedUsers: userId } });
    res.json({ blocked: false });
  } catch (err) {
    console.error('unblock error:', err);
    res.status(500).json({ message: 'Server error.' });
  }
});

// ── List blocked users ────────────────────────────────────────────────────────
router.get('/blocked', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate('blockedUsers', 'username avatar isOnline lastSeen');
    res.json(user.blockedUsers || []);
  } catch (err) {
    console.error('blocked list error:', err);
    res.status(500).json({ message: 'Server error.' });
  }
});

module.exports = router;
