const express = require('express');
const User = require('../models/User');
const Room = require('../models/Room');
const Message = require('../models/Message');
const { authenticateToken, requirePresident, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// Get all users (admin only)
router.get('/users', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const users = await User.find({})
      .select('-passwordHash -twoFactorSecret')
      .populate('createdBy', 'username')
      .sort({ createdAt: -1 });

    res.json({ users });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get user directory (admin only)
router.get('/users/directory', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const users = await User.find({ status: 'approved' })
      .select('username role status lastSeen createdAt')
      .sort({ lastSeen: -1 });

    res.json({ users });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update user role (President only)
router.put('/users/:userId/role', authenticateToken, requirePresident, async (req, res) => {
  try {
    const { userId } = req.params;
    const { role } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Prevent changing own role
    if (user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({ error: 'Cannot change your own role' });
    }

    user.role = role;
    await user.save();

    res.json({
      message: 'User role updated successfully',
      user: {
        id: user._id,
        username: user.username,
        role: user.role
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Ban/Unban user (admin only)
router.put('/users/:userId/ban', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    const { banned } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Prevent banning yourself
    if (user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({ error: 'Cannot ban yourself' });
    }

    // Vice President cannot ban President
    if (req.user.role === 'vice-president' && user.role === 'president') {
      return res.status(403).json({ error: 'Vice President cannot ban President' });
    }

    user.isBanned = banned;
    await user.save();

    res.json({
      message: `User ${banned ? 'banned' : 'unbanned'} successfully`,
      user: {
        id: user._id,
        username: user.username,
        isBanned: user.isBanned
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete user (President only)
router.delete('/users/:userId', authenticateToken, requirePresident, async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Prevent deleting yourself
    if (user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({ error: 'Cannot delete yourself' });
    }

    await User.findByIdAndDelete(userId);

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create room (President only)
router.post('/rooms', authenticateToken, requirePresident, async (req, res) => {
  try {
    const { name, role, description } = req.body;

    const room = new Room({
      name,
      role,
      description,
      createdBy: req.user._id
    });

    await room.save();

    res.status(201).json({
      message: 'Room created successfully',
      room: {
        id: room._id,
        name: room.name,
        role: room.role,
        description: room.description,
        icon: room.getIcon(),
        createdAt: room.createdAt
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all rooms (admin only)
router.get('/rooms', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const rooms = await Room.find({ isActive: true })
      .populate('createdBy', 'username')
      .sort({ role: -1, createdAt: -1 });

    const roomsWithIcons = rooms.map(room => ({
      id: room._id,
      name: room.name,
      role: room.role,
      description: room.description,
      icon: room.getIcon(),
      createdBy: room.createdBy,
      createdAt: room.createdAt,
      lastActivity: room.lastActivity
    }));

    res.json({ rooms: roomsWithIcons });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete room (President only)
router.delete('/rooms/:roomId', authenticateToken, requirePresident, async (req, res) => {
  try {
    const { roomId } = req.params;

    const room = await Room.findById(roomId);
    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }

    // Delete all messages in the room
    await Message.deleteMany({ room: roomId });

    // Delete the room
    await Room.findByIdAndDelete(roomId);

    res.json({ message: 'Room deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get system statistics (admin only)
router.get('/stats', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const activeUsers = await User.countDocuments({ isActive: true, isBanned: false });
    const bannedUsers = await User.countDocuments({ isBanned: true });
    const totalRooms = await Room.countDocuments({ isActive: true });
    const totalMessages = await Message.countDocuments();

    const usersByRole = await User.aggregate([
      { $group: { _id: '$role', count: { $sum: 1 } } }
    ]);

    const recentMessages = await Message.countDocuments({
      timestamp: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
    });

    res.json({
      stats: {
        totalUsers,
        activeUsers,
        bannedUsers,
        totalRooms,
        totalMessages,
        recentMessages,
        usersByRole
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
