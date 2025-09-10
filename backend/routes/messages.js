const express = require('express');
const Message = require('../models/Message');
const Room = require('../models/Room');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Get messages for a room
router.get('/room/:roomId', authenticateToken, async (req, res) => {
  try {
    const { roomId } = req.params;
    const { page = 1, limit = 50 } = req.query;

    // Check if room exists and user has access
    const room = await Room.findById(roomId);
    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }

    if (!req.user.canAccessRoom(room.role)) {
      return res.status(403).json({ error: 'Access denied to this room' });
    }

    const messages = await Message.find({ 
      room: roomId, 
      isDeleted: false 
    })
      .populate('sender', 'username role')
      .sort({ timestamp: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const totalMessages = await Message.countDocuments({ 
      room: roomId, 
      isDeleted: false 
    });

    res.json({
      messages: messages.reverse(), // Reverse to show oldest first
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalMessages / limit),
        totalMessages,
        hasMore: page * limit < totalMessages
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Send message (handled via WebSocket, but this endpoint exists for file uploads)
router.post('/send', authenticateToken, async (req, res) => {
  try {
    const { roomId, content, messageType = 'text' } = req.body;

    // Check if room exists and user has access
    const room = await Room.findById(roomId);
    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }

    if (!req.user.canAccessRoom(room.role)) {
      return res.status(403).json({ error: 'Access denied to this room' });
    }

    const message = new Message({
      content,
      sender: req.user._id,
      room: roomId,
      messageType
    });

    await message.save();
    await message.populate('sender', 'username role');

    // Update room last activity
    room.lastActivity = new Date();
    await room.save();

    res.status(201).json({ message });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete message (sender only or admin)
router.delete('/:messageId', authenticateToken, async (req, res) => {
  try {
    const { messageId } = req.params;

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ error: 'Message not found' });
    }

    // Check if user can delete (sender or admin)
    const canDelete = message.sender.toString() === req.user._id.toString() ||
                     ['president', 'vice-president'].includes(req.user.role);

    if (!canDelete) {
      return res.status(403).json({ error: 'Cannot delete this message' });
    }

    message.isDeleted = true;
    await message.save();

    res.json({ message: 'Message deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
