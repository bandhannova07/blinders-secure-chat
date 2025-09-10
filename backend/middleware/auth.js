const jwt = require('jsonwebtoken');
const User = require('../models/User');

const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ error: 'Access token required' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId).select('-passwordHash');
    
    if (!user) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    if (user.isBanned) {
      return res.status(403).json({ error: 'User is banned' });
    }

    if (!user.isActive) {
      return res.status(403).json({ error: 'User account is inactive' });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired' });
    }
    return res.status(403).json({ error: 'Invalid token' });
  }
};

const requireRole = (minRole) => {
  const roleLevels = {
    'shield-circle': 1,
    'study-circle': 2,
    'team-core': 3,
    'vice-president': 4,
    'president': 5
  };

  return (req, res, next) => {
    const userLevel = roleLevels[req.user.role] || 0;
    const requiredLevel = roleLevels[minRole] || 0;

    if (userLevel < requiredLevel) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    next();
  };
};

const requirePresident = (req, res, next) => {
  if (req.user.role !== 'president') {
    return res.status(403).json({ error: 'President access required' });
  }
  next();
};

const requireAdmin = (req, res, next) => {
  if (!['president', 'vice-president'].includes(req.user.role)) {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};

module.exports = {
  authenticateToken,
  requireRole,
  requirePresident,
  requireAdmin
};
