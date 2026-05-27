require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const authRoutes = require('./src/routes/auth');
const userRoutes = require('./src/routes/users');
const messageRoutes = require('./src/routes/messages');
const friendRoutes = require('./src/routes/friends');
const mediaRoutes = require('./src/routes/media');
const adminRoutes = require('./src/routes/admin');
const initSocket = require('./src/socket');
const Message = require('./src/models/Message');

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));

// Stricter rate limit on auth endpoints
app.use('/api/auth', rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { message: 'Too many requests, try again later.' },
}));

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/friends', friendRoutes);
app.use('/api/media', mediaRoutes);
app.use('/api/admin', adminRoutes);

app.get('/health', (_, res) => res.json({ status: 'ok' }));

initSocket(io);

// Clean up expired messages every 60 seconds
setInterval(async () => {
  try {
    const { deletedCount } = await Message.deleteMany({
      expiresAt: { $lte: new Date() },
    });
    if (deletedCount > 0) console.log(`Removed ${deletedCount} expired message(s)`);
  } catch (err) {
    console.error('Cleanup error:', err);
  }
}, 60_000);

mongoose
  .connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/securechat')
  .then(async () => {
    console.log('MongoDB connected');
    // Drop indexes from the old schema (email, password) that no longer exist
    try {
      const col = mongoose.connection.collection('users');
      const indexes = await col.indexes();
      for (const idx of indexes) {
        if (idx.key.email !== undefined || idx.key.password !== undefined) {
          await col.dropIndex(idx.name);
          console.log(`Migration: dropped obsolete index "${idx.name}"`);
        }
      }
    } catch { /* collection may not exist yet — fine */ }
  })
  .catch((err) => { console.error('MongoDB connection failed:', err); process.exit(1); });

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
