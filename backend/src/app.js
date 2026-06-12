const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/auth');
const inviteRoutes = require('./routes/invites');
const friendRoutes = require('./routes/friends');
const adminRoutes = require('./routes/admin');

const app = express();
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/invites', inviteRoutes);
app.use('/api/friends', friendRoutes);
app.use('/api/admin', adminRoutes);

module.exports = app;
