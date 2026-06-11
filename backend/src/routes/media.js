const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Message = require('../models/Message');
const auth = require('../middleware/auth');

const router = express.Router();

const uploadsDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

const ALLOWED_MIME = [
  'image/jpeg', 'image/png', 'image/gif', 'image/webp',
  'video/mp4', 'video/webm', 'video/quicktime',
];

const storage = multer.diskStorage({
  destination: uploadsDir,
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase() || '.bin';
    cb(null, `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50 MB
  fileFilter: (req, file, cb) => cb(null, ALLOWED_MIME.includes(file.mimetype)),
});

// ── Upload ────────────────────────────────────────────────────────────────────
router.post('/upload', auth, upload.single('media'), (req, res) => {
  if (!req.file) return res.status(400).json({ message: 'No valid file uploaded.' });
  const mediaType = req.file.mimetype.startsWith('video/') ? 'video' : 'image';
  res.json({ filename: req.file.filename, mediaType });
});

// ── Serve (authenticated + ownership check) ───────────────────────────────────
router.get('/:filename', auth, async (req, res) => {
  try {
    const { filename } = req.params;
    // Block path traversal
    if (!filename || filename.includes('/') || filename.includes('\\') || filename.includes('..')) {
      return res.status(400).json({ message: 'Invalid filename.' });
    }

    const msg = await Message.findOne({
      mediaUrl: filename,
      $or: [{ sender: req.user._id }, { receiver: req.user._id }],
      isDeleted: false,
      $or: [{ expiresAt: null }, { expiresAt: { $gt: new Date() } }],
    });
    if (!msg) return res.status(403).json({ message: 'Access denied.' });

    // Block check: if either side has blocked the other, deny
    const otherId = msg.sender.toString() === req.user._id.toString() ? msg.receiver : msg.sender;
    const other = await require('../models/User').findById(otherId).select('blockedUsers');
    const meBlocked = (req.user.blockedUsers || []).map(String).includes(otherId.toString());
    const otherBlockedMe = (other && (other.blockedUsers || []).map(String).includes(req.user._id.toString()));
    if (meBlocked || otherBlockedMe) return res.status(403).json({ message: 'Access denied.' });

    const filepath = path.join(uploadsDir, filename);
    if (!fs.existsSync(filepath)) {
      return res.status(404).json({ message: 'Media no longer available.' });
    }

    res.sendFile(filepath);
  } catch (err) {
    console.error('serve media error:', err);
    res.status(500).json({ message: 'Server error.' });
  }
});

// ── Mark viewed (receiver only; deletes file if viewOnce) ─────────────────────
router.post('/:filename/viewed', auth, async (req, res) => {
  try {
    const { filename } = req.params;
    if (!filename || filename.includes('/') || filename.includes('\\') || filename.includes('..')) {
      return res.status(400).json({ message: 'Invalid filename.' });
    }

    const msg = await Message.findOne({
      mediaUrl: filename,
      receiver: req.user._id,
      isDeleted: false,
      $or: [{ expiresAt: null }, { expiresAt: { $gt: new Date() } }],
    });
    if (!msg) return res.status(403).json({ message: 'Access denied.' });

    // Block check for viewed endpoint as well
    const otherId2 = msg.sender.toString() === req.user._id.toString() ? msg.receiver : msg.sender;
    const other2 = await require('../models/User').findById(otherId2).select('blockedUsers');
    const meBlocked2 = (req.user.blockedUsers || []).map(String).includes(otherId2.toString());
    const otherBlockedMe2 = (other2 && (other2.blockedUsers || []).map(String).includes(req.user._id.toString()));
    if (meBlocked2 || otherBlockedMe2) return res.status(403).json({ message: 'Access denied.' });

    if (!msg.mediaViewed) {
      msg.mediaViewed = true;
      await msg.save();

      if (msg.viewOnce) {
        try { fs.unlinkSync(path.join(uploadsDir, filename)); } catch { /* already gone */ }
      }
    }

    res.json({ viewed: true });
  } catch (err) {
    console.error('viewed error:', err);
    res.status(500).json({ message: 'Server error.' });
  }
});

module.exports = router;
