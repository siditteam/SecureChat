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
  };
};

module.exports = mongoose.model('User', userSchema);
