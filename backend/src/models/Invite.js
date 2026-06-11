const crypto = require('crypto');
const mongoose = require('mongoose');

const inviteSchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
    unique: true,
    default: () => crypto.randomBytes(10).toString('hex'),
  },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  usedBy:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  usedAt:    { type: Date, default: null },
  expiresAt: { type: Date, default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) },
  status:    { type: String, enum: ['active', 'used', 'expired', 'revoked'], default: 'active' },
}, { timestamps: true });

module.exports = mongoose.model('Invite', inviteSchema);
