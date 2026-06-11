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
const notificationRoutes = require('./src/routes/notifications');
const inviteRoutes = require('./src/routes/invites');
const reportRoutes = require('./src/routes/reports');
const applyRoutes  = require('./src/routes/apply');
const initSocket = require('./src/socket');
const User = require('./src/models/User');
const Message = require('./src/models/Message');

const app = express();
const server = http.createServer(app);

const ALLOWED_ORIGINS = process.env.FRONTEND_URL
  ? process.env.FRONTEND_URL.split(',').map(u => u.trim().replace(/\/$/, ''))
  : ['http://localhost:5173', 'http://10.0.0.156:5173'];

// Allow *.vercel.app for preview deployments
const ALLOW_VERCEL_PREVIEWS = process.env.ALLOW_VERCEL_PREVIEWS !== 'false';

console.log('CORS allowed origins:', ALLOWED_ORIGINS);

const isAllowedOrigin = (origin) => {
  if (!origin) return true;
  if (ALLOWED_ORIGINS.includes(origin)) return true;
  if (ALLOW_VERCEL_PREVIEWS && /^https:\/\/[a-z0-9-]+\.vercel\.app$/.test(origin)) return true;
  return false;
};

const corsOptions = {
  origin: (origin, cb) => {
    if (isAllowedOrigin(origin)) return cb(null, true);
    console.warn('CORS blocked origin:', origin);
    cb(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

const io = new Server(server, {
  cors: {
    origin: ALLOWED_ORIGINS,
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

app.use(helmet());
app.use(cors(corsOptions));
app.options('*', cors(corsOptions));
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
app.use('/api/notifications', notificationRoutes);
app.use('/api/invites', inviteRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/apply',   applyRoutes);

app.get('/health', (_, res) => res.json({ status: 'ok' }));

initSocket(io);

// Promote users whose probation has ended — grant 2 invite tokens
setInterval(async () => {
  try {
    const { modifiedCount } = await User.updateMany(
      { accountStatus: 'probation', probationEndsAt: { $lte: new Date() } },
      { accountStatus: 'active', inviteTokens: 2 }
    );
    if (modifiedCount > 0) console.log(`Promoted ${modifiedCount} user(s) from probation → active`);
  } catch (err) { console.error('Probation check error:', err); }
}, 60_000);

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

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is already in use. Stop the process using it or set a different PORT before starting.`);
    process.exit(1);
  }
  console.error('Server error:', err);
  process.exit(1);
});
