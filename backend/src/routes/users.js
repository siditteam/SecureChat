const express = require('express');
const mongoose = require('mongoose');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const User = require('../models/User');
const auth = require('../middleware/auth');

const router = express.Router();

const avatarsDir = path.join(__dirname, '../../uploads/avatars');
if (!fs.existsSync(avatarsDir)) fs.mkdirSync(avatarsDir, { recursive: true });

const avatarUpload = multer({
  storage: multer.diskStorage({
    destination: avatarsDir,
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase() || '.jpg';
      cb(null, `avatar-${req.user._id}${ext}`);
    },
  }),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) =>
    cb(null, ['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(file.mimetype)),
});

// PUT /api/users/me — update bio + settings
router.put('/me', auth, async (req, res) => {
  try {
    const { bio, settings } = req.body;
    const user = req.user;
    if (bio !== undefined) user.bio = String(bio).slice(0, 150);
    if (settings && typeof settings === 'object') {
      if (typeof settings.showOnlineStatus === 'boolean') user.settings.showOnlineStatus = settings.showOnlineStatus;
      if (typeof settings.readReceipts === 'boolean') user.settings.readReceipts = settings.readReceipts;
      if (typeof settings.notifications === 'boolean') user.settings.notifications = settings.notifications;
    }
    await user.save();
    res.json({ user: user.toPublicJSON() });
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/users/me/avatar — upload avatar image
router.post('/me/avatar', auth, avatarUpload.single('avatar'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No valid image uploaded.' });
    const user = req.user;
    if (user.avatar) {
      const old = path.join(avatarsDir, user.avatar);
      if (fs.existsSync(old)) fs.unlinkSync(old);
    }
    user.avatar = req.file.filename;
    await user.save();
    res.json({ avatar: req.file.filename, user: user.toPublicJSON() });
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
});

// DELETE /api/users/me/avatar — remove avatar
router.delete('/me/avatar', auth, async (req, res) => {
  try {
    const user = req.user;
    if (user.avatar) {
      const filepath = path.join(avatarsDir, user.avatar);
      if (fs.existsSync(filepath)) fs.unlinkSync(filepath);
      user.avatar = null;
      await user.save();
    }
    res.json({ user: user.toPublicJSON() });
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/users/avatar/:filename — serve avatar (public, no auth needed)
router.get('/avatar/:filename', (req, res) => {
  const { filename } = req.params;
  if (!filename || filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
    return res.status(400).json({ message: 'Invalid filename.' });
  }
  const filepath = path.join(avatarsDir, filename);
  if (!fs.existsSync(filepath)) return res.status(404).send('Not found');
  res.sendFile(filepath);
});

// GET /api/users/search?q=...
router.get('/search', auth, async (req, res) => {
  try {
    const { q } = req.query;
    if (!q || q.trim().length < 2) return res.json([]);
    const users = await User.find({
      username: { $regex: q.trim(), $options: 'i' },
      _id: { $ne: req.user._id },
    }).limit(10);
    res.json(users.map((u) => u.toPublicJSON()));
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/users/by-username/:username — public endpoint for QR landing page
router.get('/by-username/:username', async (req, res) => {
  try {
    const user = await User.findOne({ username: req.params.username });
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ _id: user._id.toString(), username: user.username });
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/users/:id
router.get('/:id', auth, async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid user ID' });
    }
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user.toPublicJSON());
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
