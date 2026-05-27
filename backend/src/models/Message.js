const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  receiver: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

  // E2EE text content — null for media-only messages
  encryptedContent: { type: String, default: null },
  iv: { type: String, default: null },
  encryptedKeyForReceiver: { type: String, default: null },
  encryptedKeyForSender: { type: String, default: null },

  // Media (Snapchat-style)
  mediaUrl: { type: String, default: null },
  mediaType: { type: String, enum: ['image', 'video', null], default: null },
  viewOnce: { type: Boolean, default: false },
  mediaViewed: { type: Boolean, default: false },

  deliveryStatus: {
    type: String,
    enum: ['sent', 'delivered', 'read'],
    default: 'sent',
  },
  deliveredAt: Date,
  readAt: Date,

  expiresAt: { type: Date, default: null, index: true },
  isDeleted: { type: Boolean, default: false },
}, { timestamps: true });

messageSchema.index({ sender: 1, receiver: 1, createdAt: -1 });
messageSchema.index({ receiver: 1, deliveryStatus: 1 });

module.exports = mongoose.model('Message', messageSchema);
