const mongoose = require('mongoose');

const schema = new mongoose.Schema({
  sender:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  receiver: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  status:   { type: String, enum: ['pending', 'accepted', 'rejected'], default: 'pending' },
}, { timestamps: true });

schema.index({ sender: 1, receiver: 1 }, { unique: true });
schema.index({ receiver: 1, status: 1 });

module.exports = mongoose.model('FriendRequest', schema);
