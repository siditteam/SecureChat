const express = require('express');
const User = require('../models/User');
const Message = require('../models/Message');
const Report = require('../models/Report');
const InviteApplication = require('../models/InviteApplication');
const auth = require('../middleware/auth');
const adminMiddleware = require('../middleware/admin');

const router = express.Router();

// POST /api/admin/claim-first — promotes caller to admin if no admins exist yet
router.post('/claim-first', auth, async (req, res) => {
  try {
    const adminCount = await User.countDocuments({ isAdmin: true });
    if (adminCount > 0) return res.status(403).json({ message: 'An admin already exists' });
    req.user.isAdmin = true;
    await req.user.save();
    res.json({ user: req.user.toPublicJSON() });
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
});

// All routes below require auth + admin role
router.use(auth, adminMiddleware);

// GET /api/admin/stats
router.get('/stats', async (req, res) => {
  try {
    const now = Date.now();
    const [
      totalUsers,
      totalMessages,
      onlineUsers,
      newUsersToday,
      newUsersWeek,
      messagesLast24h,
      bannedUsers,
      adminUsers,
    ] = await Promise.all([
      User.countDocuments(),
      Message.countDocuments({ isDeleted: false }),
      User.countDocuments({ isOnline: true }),
      User.countDocuments({ createdAt: { $gte: new Date(now - 24 * 60 * 60 * 1000) } }),
      User.countDocuments({ createdAt: { $gte: new Date(now - 7 * 24 * 60 * 60 * 1000) } }),
      Message.countDocuments({ createdAt: { $gte: new Date(now - 24 * 60 * 60 * 1000) }, isDeleted: false }),
      User.countDocuments({ isBanned: true }),
      User.countDocuments({ isAdmin: true }),
    ]);
    res.json({ totalUsers, totalMessages, onlineUsers, newUsersToday, newUsersWeek, messagesLast24h, bannedUsers, adminUsers });
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/admin/users?page=1&limit=20&q=search
router.get('/users', async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, parseInt(req.query.limit) || 20);
    const q = req.query.q?.trim();
    const filter = q ? { username: { $regex: q, $options: 'i' } } : {};

    const [users, total] = await Promise.all([
      User.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit),
      User.countDocuments(filter),
    ]);

    res.json({ users: users.map((u) => u.toPublicJSON()), total, page, pages: Math.ceil(total / limit) });
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT /api/admin/users/:id/ban — toggle ban status
router.put('/users/:id/ban', async (req, res) => {
  try {
    const target = await User.findById(req.params.id);
    if (!target) return res.status(404).json({ message: 'User not found' });
    if (target.isAdmin) return res.status(400).json({ message: 'Cannot ban an admin' });
    target.isBanned = !target.isBanned;
    await target.save();
    res.json({ user: target.toPublicJSON() });
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT /api/admin/users/:id/admin — toggle admin role
router.put('/users/:id/admin', async (req, res) => {
  try {
    if (req.params.id === req.user._id.toString()) {
      return res.status(400).json({ message: 'Cannot change your own admin status' });
    }
    const target = await User.findById(req.params.id);
    if (!target) return res.status(404).json({ message: 'User not found' });
    target.isAdmin = !target.isAdmin;
    await target.save();
    res.json({ user: target.toPublicJSON() });
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/admin/conversations?page=1&limit=20&q=username
router.get('/conversations', async (req, res) => {
  try {
    const page  = Math.max(1, parseInt(req.query.page)  || 1);
    const limit = Math.min(50, parseInt(req.query.limit) || 20);
    const q     = req.query.q?.trim();

    const matchFilter = { isDeleted: false };
    if (q) {
      const matched = await User.find({ username: { $regex: q, $options: 'i' } }).select('_id');
      const ids = matched.map((u) => u._id);
      if (ids.length === 0) return res.json({ conversations: [], total: 0, page, pages: 0 });
      matchFilter.$or = [{ sender: { $in: ids } }, { receiver: { $in: ids } }];
    }

    const pipeline = [
      { $match: matchFilter },
      {
        $addFields: {
          pair: {
            $cond: {
              if: { $lt: [{ $toString: '$sender' }, { $toString: '$receiver' }] },
              then: { u1: '$sender', u2: '$receiver' },
              else: { u1: '$receiver', u2: '$sender' },
            },
          },
        },
      },
      { $group: { _id: '$pair', lastAt: { $max: '$createdAt' }, count: { $sum: 1 } } },
      { $sort: { lastAt: -1 } },
    ];

    const [rows, countResult] = await Promise.all([
      Message.aggregate([...pipeline, { $skip: (page - 1) * limit }, { $limit: limit }]),
      Message.aggregate([...pipeline, { $count: 'total' }]),
    ]);

    const total = countResult[0]?.total ?? 0;

    const conversations = (
      await Promise.all(
        rows.map(async (c) => {
          const [u1, u2] = await Promise.all([
            User.findById(c._id.u1).select('username avatar'),
            User.findById(c._id.u2).select('username avatar'),
          ]);
          if (!u1 || !u2) return null;
          return {
            user1: { _id: u1._id, username: u1.username, avatar: u1.avatar },
            user2: { _id: u2._id, username: u2.username, avatar: u2.avatar },
            messageCount: c.count,
            lastAt: c.lastAt,
          };
        })
      )
    ).filter(Boolean);

    res.json({ conversations, total, page, pages: Math.ceil(total / limit) });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/admin/conversations/:uid1/:uid2?page=1&limit=50
router.get('/conversations/:uid1/:uid2', async (req, res) => {
  try {
    const { uid1, uid2 } = req.params;
    const page  = Math.max(1, parseInt(req.query.page)  || 1);
    const limit = Math.min(100, parseInt(req.query.limit) || 50);

    const filter = {
      isDeleted: false,
      $or: [
        { sender: uid1, receiver: uid2 },
        { sender: uid2, receiver: uid1 },
      ],
    };

    const [messages, total] = await Promise.all([
      Message.find(filter)
        .populate('sender',   'username avatar')
        .populate('receiver', 'username avatar')
        .sort({ createdAt: 1 })
        .skip((page - 1) * limit)
        .limit(limit),
      Message.countDocuments(filter),
    ]);

    res.json({ messages, total, page, pages: Math.ceil(total / limit) });
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
});

// DELETE /api/admin/users/:id — delete user + their messages
router.delete('/users/:id', async (req, res) => {
  try {
    if (req.params.id === req.user._id.toString()) {
      return res.status(400).json({ message: 'Cannot delete your own account' });
    }
    const target = await User.findById(req.params.id);
    if (!target) return res.status(404).json({ message: 'User not found' });
    if (target.isAdmin) return res.status(400).json({ message: 'Cannot delete an admin account' });
    await Promise.all([
      User.findByIdAndDelete(req.params.id),
      Message.deleteMany({ $or: [{ sender: req.params.id }, { receiver: req.params.id }] }),
    ]);
    res.json({ message: 'User deleted' });
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
});

// ── Reports queue ─────────────────────────────────────────────────────────────
router.get('/reports', async (req, res) => {
  try {
    const status = req.query.status || 'pending';
    const reports = await Report.find({ status })
      .sort({ createdAt: -1 })
      .populate('reporter', 'username')
      .populate('reported', 'username accountStatus isBanned');
    res.json(reports);
  } catch { res.status(500).json({ message: 'Server error' }); }
});

// PUT /api/admin/reports/:id — review: dismiss | warn | remove
router.put('/reports/:id', async (req, res) => {
  try {
    const { action, adminNote } = req.body; // action: 'dismiss' | 'warn' | 'remove'
    const report = await Report.findById(req.params.id).populate('reported');
    if (!report) return res.status(404).json({ message: 'Report not found' });

    report.reviewedBy = req.user._id;
    report.reviewedAt = new Date();
    report.adminNote = adminNote || '';

    if (action === 'dismiss') {
      report.status = 'dismissed';
    } else if (action === 'warn') {
      report.status = 'warned';
      await User.findByIdAndUpdate(report.reported._id, { accountStatus: 'warned' });
    } else if (action === 'remove') {
      const { reason } = req.body;
      report.status = 'removed';
      await User.findByIdAndUpdate(report.reported._id, {
        isBanned: true,
        accountStatus: 'removed',
        removalReason: reason || adminNote || 'Violation of community guidelines',
        removedAt: new Date(),
      });
    } else {
      return res.status(400).json({ message: 'Invalid action. Use dismiss | warn | remove' });
    }

    await report.save();
    res.json({ ok: true, status: report.status });
  } catch { res.status(500).json({ message: 'Server error' }); }
});

// ── Appeals ───────────────────────────────────────────────────────────────────
router.get('/appeals', async (req, res) => {
  try {
    const users = await User.find({ accountStatus: 'appealing' })
      .select('username appealMessage appealSubmittedAt removalReason createdAt')
      .sort({ appealSubmittedAt: -1 });
    res.json(users);
  } catch { res.status(500).json({ message: 'Server error' }); }
});

// PUT /api/admin/users/:id/restore — accept appeal, restore account
router.put('/users/:id/restore', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    user.isBanned = false;
    user.accountStatus = 'active';
    user.removalReason = null;
    user.removedAt = null;
    await user.save();
    res.json({ user: user.toPublicJSON() });
  } catch { res.status(500).json({ message: 'Server error' }); }
});

// PUT /api/admin/users/:id/reject-appeal — reject appeal, keep banned
router.put('/users/:id/reject-appeal', async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.params.id, { accountStatus: 'removed' });
    res.json({ ok: true });
  } catch { res.status(500).json({ message: 'Server error' }); }
});

// ── Invite Applications ────────────────────────────────────────────────────────

// GET /api/admin/applications?status=pending
router.get('/applications', async (req, res) => {
  try {
    const status = req.query.status || 'pending';
    const apps = await InviteApplication.find({ status })
      .sort({ createdAt: -1 })
      .limit(200);
    res.json(apps);
  } catch { res.status(500).json({ message: 'Server error' }); }
});

// PUT /api/admin/applications/:id — approve | reject
router.put('/applications/:id', async (req, res) => {
  try {
    const { action, note } = req.body;
    const app = await InviteApplication.findById(req.params.id);
    if (!app) return res.status(404).json({ message: 'Application not found' });

    if (action !== 'approve' && action !== 'reject') {
      return res.status(400).json({ message: 'Invalid action. Use approve | reject' });
    }

    app.status = action === 'approve' ? 'approved' : 'rejected';
    app.reviewNote = note || '';
    app.reviewedAt = new Date();
    app.reviewedBy = req.user._id;
    await app.save();

    res.json({ ok: true, status: app.status });
  } catch { res.status(500).json({ message: 'Server error' }); }
});

// PUT /api/admin/users/:id/promote — manually graduate from probation
router.put('/users/:id/promote', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    user.accountStatus = 'active';
    user.probationEndsAt = null;
    if (user.inviteTokens === 0) user.inviteTokens = 2;
    await user.save();
    res.json({ user: user.toPublicJSON() });
  } catch { res.status(500).json({ message: 'Server error' }); }
});

module.exports = router;

// ── Blocked users management (admin) ────────────────────────────────────────
router.get('/blocked', async (req, res) => {
  try {
    const rows = await User.find({ blockedUsers: { $exists: true, $ne: [] } }).select('username blockedUsers').populate('blockedUsers', 'username');
    res.json(rows.map((u) => ({ _id: u._id.toString(), username: u.username, blocked: (u.blockedUsers || []).map((b) => ({ _id: b._id.toString(), username: b.username })) })));
  } catch (err) {
    console.error('admin blocked list error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

router.put('/users/:id/unblock/:blockedId', async (req, res) => {
  try {
    const { id, blockedId } = req.params;
    const user = await User.findById(id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    user.blockedUsers = (user.blockedUsers || []).filter((b) => b.toString() !== blockedId.toString());
    await user.save();
    res.json({ message: 'Unblocked', user: user.toPublicJSON() });
  } catch (err) {
    console.error('admin unblock error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});
