const jwt = require('jsonwebtoken');
const User = require('../models/User');

module.exports = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'No token provided' });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId);
    if (!user) return res.status(401).json({ message: 'User not found' });
    if (user.isBanned) return res.status(403).json({ message: 'Account suspended' });

    // Reject tokens from displaced sessions (another device logged in after this one)
    if (decoded.loginVersion !== undefined && decoded.loginVersion !== user.loginVersion) {
      return res.status(401).json({ code: 'SESSION_REPLACED', message: 'You signed in on another device. Please log in again.' });
    }

    req.user = user;
    next();
  } catch {
    res.status(401).json({ message: 'Invalid or expired token' });
  }
};
