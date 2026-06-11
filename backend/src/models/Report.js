const mongoose = require('mongoose');

const REASONS = ['hostile', 'harassment', 'doxxing', 'spam', 'impersonation', 'real_world_harm', 'other'];

const reportSchema = new mongoose.Schema({
  reporter:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  reported:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  reason:     { type: String, enum: REASONS, required: true },
  description:{ type: String, default: '', maxlength: 500 },
  status:     { type: String, enum: ['pending', 'reviewed', 'dismissed', 'warned', 'removed'], default: 'pending' },
  reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  reviewedAt: { type: Date, default: null },
  adminNote:  { type: String, default: '' },
}, { timestamps: true });

reportSchema.index({ reporter: 1, reported: 1 }, { unique: true });

module.exports = mongoose.model('Report', reportSchema);
