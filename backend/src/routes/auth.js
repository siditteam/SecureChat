const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const express = require('express');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const User = require('../models/User');
const PhoneOTP = require('../models/PhoneOTP');
const Invite = require('../models/Invite');
const FriendRequest = require('../models/FriendRequest');
const authMiddleware = require('../middleware/auth');
const { sendSMS } = require('../services/sms');
const ss = require('../socketState');

const router = express.Router();

const generateToken = (userId, loginVersion) =>
  jwt.sign({ userId: userId.toString(), loginVersion }, process.env.JWT_SECRET, { expiresIn: '7d' });

const otpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 15,
  message: { message: 'Too many requests. Please try again later.' },
});

// E.164 format: +[country code][number], 8-15 digits total
const isValidPhone = (p) => /^\+[1-9]\d{6,14}$/.test(p);

// ── Send OTP ──────────────────────────────────────────────────────────────────
router.post('/send-otp', otpLimiter, async (req, res) => {
  try {
    const { phone } = req.body;
    if (!phone || !isValidPhone(phone)) {
      return res.status(400).json({ message: 'Invalid phone number. Use international format (e.g. +14155551234).' });
    }

    // 1 OTP per phone per 60 seconds
    const recent = await PhoneOTP.findOne({
      phone,
      createdAt: { $gt: new Date(Date.now() - 60_000) },
    });
    if (recent) {
      const wait = Math.ceil((recent.createdAt.getTime() + 60_000 - Date.now()) / 1000);
      return res.status(429).json({ message: `Please wait ${wait}s before requesting another code.` });
    }

    await PhoneOTP.deleteMany({ phone });

    const otp = String(Math.floor(100000 + Math.random() * 900000));
    const hashedOtp = await bcrypt.hash(otp, 8);

    await PhoneOTP.create({
      phone,
      otp: hashedOtp,
      expiresAt: new Date(Date.now() + 5 * 60_000),
    });

    const result = await sendSMS(phone, otp);

    const response = { message: 'Verification code sent.' };
    if (result.devMode) {
      response.devOtp = otp;
      response.devMode = true;
    }

    res.json(response);
  } catch (err) {
    console.error('send-otp error:', err);
    res.status(500).json({ message: 'Failed to send OTP.' });
  }
});

// ── Verify OTP ────────────────────────────────────────────────────────────────
router.post('/verify-otp', otpLimiter, async (req, res) => {
  try {
    const { phone, otp } = req.body;
    if (!phone || !otp) return res.status(400).json({ message: 'Phone and OTP required.' });

    const record = await PhoneOTP.findOne({ phone, verified: false });

    if (!record || record.expiresAt < new Date()) {
      return res.status(400).json({ message: 'Code expired. Please request a new one.' });
    }

    if (record.attempts >= 3) {
      await PhoneOTP.deleteOne({ _id: record._id });
      return res.status(400).json({ message: 'Too many failed attempts. Request a new code.' });
    }

    const valid = await bcrypt.compare(String(otp), record.otp);
    if (!valid) {
      record.attempts += 1;
      await record.save();
      const left = 3 - record.attempts;
      return res.status(400).json({
        message: left > 0
          ? `Incorrect code. ${left} attempt${left === 1 ? '' : 's'} remaining.`
          : 'Too many failed attempts. Request a new code.',
      });
    }

    const verifiedToken = crypto.randomBytes(32).toString('hex');
    record.verified = true;
    record.verifiedToken = verifiedToken;
    await record.save();

    const isRegistered = !!(await User.findOne({ phone }));
    res.json({ verifiedToken, isRegistered });
  } catch (err) {
    console.error('verify-otp error:', err);
    res.status(500).json({ message: 'Verification failed.' });
  }
});

// ── Complete registration ─────────────────────────────────────────────────────
router.post('/register', async (req, res) => {
  try {
    const { phone, verifiedToken, username, publicKey, inviteCode } = req.body;

    if (!phone || !verifiedToken || !username) {
      return res.status(400).json({ message: 'Phone, verifiedToken and username are required.' });
    }

    const record = await PhoneOTP.findOne({ phone, verifiedToken, verified: true });
    if (!record || record.expiresAt < new Date()) {
      return res.status(400).json({ message: 'Verification expired. Please start over.' });
    }

    if (await User.findOne({ phone })) {
      return res.status(409).json({ message: 'Phone already registered. Please log in.' });
    }

    if (!/^[a-zA-Z0-9_]{3,20}$/.test(username)) {
      return res.status(400).json({ message: 'Username: 3-20 chars, letters/numbers/underscores only.' });
    }

    if (await User.findOne({ username })) {
      return res.status(409).json({ message: 'Username taken. Try another.' });
    }

    // Validate invite code if provided
    let inviteDoc = null;
    if (inviteCode) {
      inviteDoc = await Invite.findOne({ code: inviteCode, status: 'active' });
      if (!inviteDoc || inviteDoc.expiresAt < new Date()) {
        return res.status(400).json({ message: 'This invite link has expired or already been used.' });
      }
    }

    const probationEndsAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    const user = await User.create({
      phone,
      username,
      publicKey: publicKey || null,
      accountStatus: 'probation',
      probationEndsAt,
      invitedBy: inviteDoc ? inviteDoc.createdBy : null,
      loginVersion: 1,
    });

    await PhoneOTP.deleteOne({ _id: record._id });

    // Consume invite + auto-friend
    if (inviteDoc) {
      inviteDoc.status = 'used';
      inviteDoc.usedBy = user._id;
      inviteDoc.usedAt = new Date();
      await inviteDoc.save();

      // Create accepted friendship both ways
      await FriendRequest.create({ sender: inviteDoc.createdBy, receiver: user._id, status: 'accepted' });
    }

    res.status(201).json({ token: generateToken(user._id, 1), user: user.toPublicJSON() });
  } catch (err) {
    console.error('register error:', err.message || err);
    if (err.code === 11000) {
      const field = Object.keys(err.keyValue || {})[0] || 'field';
      return res.status(409).json({ message: `${field} already in use. Try a different one.` });
    }
    res.status(500).json({ message: err.message || 'Registration failed.' });
  }
});

// ── Appeal a removal ──────────────────────────────────────────────────────────
router.post('/appeal', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'No token' });
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId);
    if (!user) return res.status(401).json({ message: 'User not found' });
    if (!user.isBanned) return res.status(400).json({ message: 'No removal to appeal.' });
    if (user.hasAppealed) return res.status(400).json({ message: 'You have already submitted an appeal.' });

    const { message } = req.body;
    if (!message?.trim()) return res.status(400).json({ message: 'Appeal message is required.' });

    user.appealMessage = message.trim().slice(0, 1000);
    user.hasAppealed = true;
    user.appealSubmittedAt = new Date();
    user.accountStatus = 'appealing';
    await user.save();

    res.json({ ok: true });
  } catch {
    res.status(500).json({ message: 'Failed to submit appeal.' });
  }
});

// ── Complete login ────────────────────────────────────────────────────────────
router.post('/login', async (req, res) => {
  try {
    const { phone, verifiedToken, publicKey } = req.body;

    if (!phone || !verifiedToken) {
      return res.status(400).json({ message: 'Phone and verifiedToken required.' });
    }

    const record = await PhoneOTP.findOne({ phone, verifiedToken, verified: true });
    if (!record || record.expiresAt < new Date()) {
      return res.status(400).json({ message: 'Verification expired. Please start over.' });
    }

    const user = await User.findOne({ phone });
    if (!user) {
      return res.status(404).json({ message: 'No account found for this number. Please register.' });
    }

    if (publicKey && publicKey !== user.publicKey) {
      user.publicKey = publicKey;
    }

    // Increment loginVersion — invalidates all other active sessions
    user.loginVersion = (user.loginVersion || 0) + 1;
    await user.save({ validateBeforeSave: false });

    // Kick any existing socket connection for this user
    ss.emit(String(user._id), 'session_replaced', {
      message: 'You signed in on another device. This session has ended.',
    });

    await PhoneOTP.deleteOne({ _id: record._id });

    res.json({ token: generateToken(user._id, user.loginVersion), user: user.toPublicJSON() });
  } catch (err) {
    console.error('login error:', err);
    res.status(500).json({ message: 'Login failed.' });
  }
});

// ── Current user ──────────────────────────────────────────────────────────────
router.get('/me', authMiddleware, (req, res) => {
  res.json({ user: req.user.toPublicJSON() });
});

module.exports = router;
