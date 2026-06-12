const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  phone: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 3,
    maxlength: 20,
  },
  // RSA-OAEP public key (JWK JSON string) for E2EE
  publicKey: { type: String, default: null },
  isOnline: { type: Boolean, default: false },
  lastSeen: { type: Date, default: Date.now },
  avatar: { type: String, default: null },
  bio: { type: String, default: '', maxlength: 150 },
  isAdmin: { type: Boolean, default: false },
  isBanned: { type: Boolean, default: false },
  settings: {
    showOnlineStatus: { type: Boolean, default: true },
    readReceipts: { type: Boolean, default: true },
    notifications: { type: Boolean, default: true },
  },
  pushSubscription: { type: String, default: null },
  // Invite / probation system
  inviteTokens:    { type: Number, default: 0 },
  probationEndsAt: { type: Date, default: null },
  invitedBy:       { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  vouchedBy:       { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  accountStatus:   { type: String, enum: ['probation', 'active', 'warned', 'suspended', 'removed', 'appealing'], default: 'probation' },
  // Moderation
  removalReason:      { type: String, default: null },
  removedAt:          { type: Date, default: null },
  hasAppealed:        { type: Boolean, default: false },
  appealMessage:      { type: String, default: null },
  appealSubmittedAt:  { type: Date, default: null },
  blockedUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  // Increments on every login — stale JWTs from other devices become invalid
  loginVersion: { type: Number, default: 0 },
  // Monetization: 'free' (default) or 'paid'
  plan: { type: String, enum: ['free', 'paid'], default: 'free' },
}, { timestamps: true });

userSchema.methods.toPublicJSON = function () {
  return {
    _id: this._id.toString(),
    username: this.username,
    phone: this.phone,
    publicKey: this.publicKey,
    isOnline: this.isOnline,
    lastSeen: this.lastSeen,
    avatar: this.avatar,
    bio: this.bio,
    isAdmin: this.isAdmin,
    isBanned: this.isBanned,
    settings: this.settings,
    createdAt: this.createdAt,
    inviteTokens: this.inviteTokens,
    probationEndsAt: this.probationEndsAt,
    invitedBy: this.invitedBy,
    vouchedBy: this.vouchedBy,
    accountStatus: this.accountStatus,
    hasAppealed: this.hasAppealed,
    removalReason: this.removalReason,
    plan: this.plan,
  };
};

module.exports = mongoose.model('User', userSchema);
