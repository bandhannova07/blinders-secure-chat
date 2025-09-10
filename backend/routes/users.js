const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { authenticateToken } = require('../middleware/auth');

// Get user directory - all registered users with basic info
router.get('/directory', authenticateToken, async (req, res) => {
  try {
    const users = await User.find(
      { status: 'approved' }, // Only approved users
      {
        username: 1,
        email: 1,
        role: 1,
        joinedAt: 1,
        lastSeen: 1,
        _id: 1
      }
    ).sort({ joinedAt: -1 });

    res.json({
      success: true,
      users: users
    });
  } catch (error) {
    console.error('Error fetching user directory:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch user directory'
    });
  }
});

// Update user's last seen timestamp
router.put('/update-last-seen', authenticateToken, async (req, res) => {
  try {
    await User.findByIdAndUpdate(
      req.user.id,
      { lastSeen: new Date() },
      { new: true }
    );

    res.json({
      success: true,
      message: 'Last seen updated'
    });
  } catch (error) {
    console.error('Error updating last seen:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update last seen'
    });
  }
});

module.exports = router;
