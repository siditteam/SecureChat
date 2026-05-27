const mongoose = require('mongoose');

const phoneOTPSchema = new mongoose.Schema({
  phone: { type: String, required: true, index: true },
  otp: { type: String, required: true },       // bcrypt-hashed
  verifiedToken: { type: String, default: null }, // set after correct OTP entry
  verified: { type: Boolean, default: false },
  attempts: { type: Number, default: 0 },
  expiresAt: { type: Date, required: true },
}, { timestamps: true });

// MongoDB TTL: auto-delete documents after expiresAt
phoneOTPSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('PhoneOTP', phoneOTPSchema);
