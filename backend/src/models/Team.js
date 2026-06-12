const mongoose = require('mongoose');

// Placeholder model — teams are a paid feature (plan='paid' required).
// Full implementation (roles, channels, billing) is deferred post-MVP.
const teamSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 50 },
  handle: { type: String, required: true, unique: true, trim: true, lowercase: true, maxlength: 30 },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

module.exports = mongoose.model('Team', teamSchema);
