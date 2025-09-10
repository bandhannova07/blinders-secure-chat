const express = require('express');
const Room = require('../models/Room');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Get accessible rooms for current user
router.get('/', authenticateToken, async (req, res) => {
  try {
    const allRooms = await Room.find({ isActive: true })
      .populate('createdBy', 'username')
      .sort({ role: -1 }); // Sort by role hierarchy

    // Filter rooms based on user's access level
    const accessibleRooms = allRooms.filter(room => 
      req.user.canAccessRoom(room.role)
    );

    const roomsWithIcons = accessibleRooms.map(room => ({
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

// Get specific room details
router.get('/:roomId', authenticateToken, async (req, res) => {
  try {
    const { roomId } = req.params;

    const room = await Room.findById(roomId)
      .populate('createdBy', 'username');

    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }

    if (!req.user.canAccessRoom(room.role)) {
      return res.status(403).json({ error: 'Access denied to this room' });
    }

    res.json({
      room: {
        id: room._id,
        name: room.name,
        role: room.role,
        description: room.description,
        icon: room.getIcon(),
        createdBy: room.createdBy,
        createdAt: room.createdAt,
        lastActivity: room.lastActivity
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
