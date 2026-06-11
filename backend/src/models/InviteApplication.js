const mongoose = require('mongoose');

const schema = new mongoose.Schema({
  name:     { type: String, required: true, trim: true, maxlength: 100 },
  email:    { type: String, required: true, trim: true, lowercase: true, maxlength: 200 },
  phone:    { type: String, required: true, trim: true },
  social:   { type: String, required: true, trim: true, maxlength: 150 },
  platform: { type: String, enum: ['instagram', 'facebook', 'twitter', 'other'], default: 'instagram' },
  why:      { type: String, trim: true, maxlength: 600, default: '' },
  status:   { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  reviewNote: { type: String, default: '' },
  reviewedAt: Date,
  reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

schema.index({ email: 1 });
schema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model('InviteApplication', schema);
