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
      .populate('usedBy', 'username createdAt')
      .populate('vouchedBy', 'username');

    // Mark expired ones
    const now = new Date();
    const result = invites.map((inv) => ({
      _id: inv._id,
      code: inv.code,
      status: inv.status === 'active' && inv.expiresAt < now ? 'expired' : inv.status,
      expiresAt: inv.expiresAt,
      usedAt: inv.usedAt,
      usedBy: inv.usedBy ? { username: inv.usedBy.username } : null,
      vouchedBy: inv.vouchedBy ? { username: inv.vouchedBy.username } : null,
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
      .populate('usedBy', 'username')
      .populate('vouchedBy', 'username avatar');

    if (!invite) return res.status(404).json({ message: 'Invite not found' });

    const expired = invite.expiresAt < new Date();
    const status = expired && invite.status === 'active' ? 'expired' : invite.status;

    res.json({
      code: invite.code,
      status,
      inviter: invite.createdBy ? { username: invite.createdBy.username, avatar: invite.createdBy.avatar } : null,
      usedBy: invite.usedBy ? { username: invite.usedBy.username } : null,
      vouchedBy: invite.vouchedBy ? { username: invite.vouchedBy.username, avatar: invite.vouchedBy.avatar } : null,
      expiresAt: invite.expiresAt,
    });
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/invites/:code/vouch — mark an invite as vouched by the authenticated user
router.post('/:code/vouch', auth, async (req, res) => {
  try {
    const { code } = req.params;
    const invite = await Invite.findOne({ code, status: 'active' });
    if (!invite) return res.status(404).json({ message: 'Invite not found or not active.' });

    if (invite.expiresAt < new Date()) return res.status(400).json({ message: 'Invite has expired.' });

    if (String(invite.createdBy) === String(req.user._id)) return res.status(400).json({ message: 'You cannot vouch for your own invite.' });

    if (invite.vouchedBy) return res.status(400).json({ message: 'This invite has already been vouched.' });

    invite.vouchedBy = req.user._id;
    if (req.body.note) invite.vouchNote = String(req.body.note).slice(0, 300);
    await invite.save();

    const out = await Invite.findById(invite._id).populate('vouchedBy', 'username avatar');
    res.json({ code: out.code, vouchedBy: out.vouchedBy ? { username: out.vouchedBy.username, avatar: out.vouchedBy.avatar } : null });
  } catch (err) {
    console.error('vouch invite error', err);
    res.status(500).json({ message: 'Failed to vouch for invite.' });
  }
});

module.exports = router;
