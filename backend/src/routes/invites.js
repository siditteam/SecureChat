const express = require('express');
const Invite = require('../models/Invite');
const User = require('../models/User');
const auth = require('../middleware/auth');

const router = express.Router();

// GET /api/invites/mine — my generated invites
router.get('/mine', auth, async (req, res) => {
  try {
    const invites = await Invite.find({ createdBy: req.user._id })
      .sort({ createdAt: -1 })
      .populate('usedBy', 'username createdAt');

    // Mark expired ones
    const now = new Date();
    const result = invites.map((inv) => ({
      _id: inv._id,
      code: inv.code,
      status: inv.status === 'active' && inv.expiresAt < now ? 'expired' : inv.status,
      expiresAt: inv.expiresAt,
      usedAt: inv.usedAt,
      usedBy: inv.usedBy ? { username: inv.usedBy.username } : null,
      createdAt: inv.createdAt,
    }));
    res.json(result);
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/invites/generate — spend 1 token, create invite
router.post('/generate', auth, async (req, res) => {
  try {
    const user = req.user;

    if (user.accountStatus === 'probation') {
      const daysLeft = Math.ceil((new Date(user.probationEndsAt) - Date.now()) / 86_400_000);
      return res.status(403).json({
        message: `Invites unlock after your probation period (${daysLeft} day${daysLeft === 1 ? '' : 's'} left).`,
      });
    }

    if (user.inviteTokens < 1) {
      return res.status(403).json({ message: "You've used all your invite tokens." });
    }

    user.inviteTokens -= 1;
    await user.save();

    const invite = await Invite.create({ createdBy: user._id });
    res.status(201).json({ code: invite.code, expiresAt: invite.expiresAt });
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/invites/:code — public, check invite validity
router.get('/:code', async (req, res) => {
  try {
    const invite = await Invite.findOne({ code: req.params.code })
      .populate('createdBy', 'username avatar')
      .populate('usedBy', 'username');

    if (!invite) return res.status(404).json({ message: 'Invite not found' });

    const expired = invite.expiresAt < new Date();
    const status = expired && invite.status === 'active' ? 'expired' : invite.status;

    res.json({
      code: invite.code,
      status,
      inviter: invite.createdBy ? { username: invite.createdBy.username, avatar: invite.createdBy.avatar } : null,
      usedBy: invite.usedBy ? { username: invite.usedBy.username } : null,
      expiresAt: invite.expiresAt,
    });
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
