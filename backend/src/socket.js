const jwt = require('jsonwebtoken');
const User = require('./models/User');
const Message = require('./models/Message');
const ss = require('./socketState');

module.exports = (io) => {
  ss.setIO(io);

  // Authenticate socket connections
  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) return next(new Error('No token'));
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = decoded.userId;
      next();
    } catch {
      next(new Error('Authentication failed'));
    }
  });

  io.on('connection', async (socket) => {
    const userId = socket.userId;
    ss.onlineUsers.set(userId, socket.id);

    await User.findByIdAndUpdate(userId, { isOnline: true });
    socket.broadcast.emit('user_status', { userId, isOnline: true });

    // Deliver pending messages
    const pending = await Message.find({
      receiver: userId, deliveryStatus: 'sent', isDeleted: false,
    });
    for (const msg of pending) {
      await Message.findByIdAndUpdate(msg._id, { deliveryStatus: 'delivered', deliveredAt: new Date() });
      ss.emit(msg.sender.toString(), 'message_delivered', { messageId: msg._id.toString() });
    }

    // ── Send message ────────────────────────────────────────────────────────
    socket.on('send_message', async (data, callback) => {
      try {
        const {
          receiverId,
          encryptedContent, encryptedKeyForReceiver, encryptedKeyForSender, iv,
          mediaUrl, mediaType, viewOnce,
          expiresIn,
        } = data;

        if (!receiverId) return callback?.({ success: false, error: 'Missing receiverId' });

        const hasText = encryptedContent && encryptedKeyForReceiver && encryptedKeyForSender && iv;
        const hasMedia = !!mediaUrl;
        if (!hasText && !hasMedia) return callback?.({ success: false, error: 'Missing content' });

        const expiresAt = expiresIn ? new Date(Date.now() + expiresIn * 1000) : null;
        const message = await Message.create({
          sender: userId,
          receiver: receiverId,
          ...(hasText && { encryptedContent, encryptedKeyForReceiver, encryptedKeyForSender, iv }),
          ...(hasMedia && { mediaUrl, mediaType, viewOnce: !!viewOnce }),
          expiresAt,
        });

        await message.populate('sender', 'username');
        const msgObj = message.toObject();
        msgObj._id = msgObj._id.toString();
        msgObj.sender._id = msgObj.sender._id.toString();
        msgObj.receiver = msgObj.receiver.toString();

        const receiverSocketId = ss.onlineUsers.get(receiverId);
        if (receiverSocketId) {
          io.to(receiverSocketId).emit('new_message', msgObj);
          await Message.findByIdAndUpdate(message._id, { deliveryStatus: 'delivered', deliveredAt: new Date() });
          msgObj.deliveryStatus = 'delivered';
        }

        callback?.({ success: true, message: msgObj });
      } catch (err) {
        console.error('send_message error:', err);
        callback?.({ success: false, error: 'Failed to send' });
      }
    });

    // ── Mark read ───────────────────────────────────────────────────────────
    socket.on('mark_read', async ({ senderId }) => {
      try {
        const result = await Message.updateMany(
          { sender: senderId, receiver: userId, deliveryStatus: { $ne: 'read' } },
          { deliveryStatus: 'read', readAt: new Date() }
        );
        if (result.modifiedCount > 0) {
          ss.emit(senderId, 'messages_read', { by: userId });
        }
      } catch (err) {
        console.error('mark_read error:', err);
      }
    });

    // ── Typing ──────────────────────────────────────────────────────────────
    socket.on('typing',      ({ receiverId }) => ss.emit(receiverId, 'user_typing',      { userId }));
    socket.on('stop_typing', ({ receiverId }) => ss.emit(receiverId, 'user_stop_typing', { userId }));

    // ── Disconnect ──────────────────────────────────────────────────────────
    socket.on('disconnect', async () => {
      ss.onlineUsers.delete(userId);
      const lastSeen = new Date();
      await User.findByIdAndUpdate(userId, { isOnline: false, lastSeen });
      socket.broadcast.emit('user_status', { userId, isOnline: false, lastSeen });
    });
  });
};
