const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Room = require('../models/Room');
const Message = require('../models/Message');

class SocketHandler {
  constructor(io) {
    this.io = io;
    this.connectedUsers = new Map(); // userId -> socketId
    this.userRooms = new Map(); // userId -> Set of roomIds
    
    this.setupSocketHandlers();
  }

  setupSocketHandlers() {
    this.io.on('connection', (socket) => {
      console.log(`Socket connected: ${socket.id}`);

      // Authenticate socket connection
      socket.on('authenticate', async (token) => {
        try {
          const decoded = jwt.verify(token, process.env.JWT_SECRET);
          const user = await User.findById(decoded.userId).select('-passwordHash');
          
          if (!user || user.isBanned || !user.isActive) {
            socket.emit('auth-error', { error: 'Authentication failed' });
            return;
          }

          socket.userId = user._id.toString();
          socket.user = user;
          this.connectedUsers.set(socket.userId, socket.id);
          
          // Update user's last seen
          user.lastSeen = new Date();
          await user.save();

          socket.emit('authenticated', { 
            user: {
              id: user._id,
              username: user.username,
              role: user.role
            }
          });

          console.log(`User authenticated: ${user.username} (${socket.id})`);
        } catch (error) {
          socket.emit('auth-error', { error: 'Invalid token' });
        }
      });

      // Join room
      socket.on('join-room', async (roomId) => {
        try {
          if (!socket.user) {
            socket.emit('error', { error: 'Not authenticated' });
            return;
          }

          const room = await Room.findById(roomId);
          if (!room) {
            socket.emit('error', { error: 'Room not found' });
            return;
          }

          // Check if user can access room
          if (!socket.user.canAccessRoom(room.role)) {
            socket.emit('error', { error: 'Access denied to this room' });
            return;
          }

          // Join the room
          socket.join(roomId);
          
          // Track user's rooms
          if (!this.userRooms.has(socket.userId)) {
            this.userRooms.set(socket.userId, new Set());
          }
          this.userRooms.get(socket.userId).add(roomId);

          socket.emit('joined-room', { 
            roomId,
            roomName: room.name,
            roomIcon: room.getIcon()
          });

          // Notify others in the room
          socket.to(roomId).emit('user-joined', {
            userId: socket.userId,
            username: socket.user.username,
            role: socket.user.role
          });

          console.log(`${socket.user.username} joined room: ${room.name}`);
        } catch (error) {
          socket.emit('error', { error: error.message });
        }
      });

      // Leave room
      socket.on('leave-room', (roomId) => {
        try {
          if (!socket.user) {
            socket.emit('error', { error: 'Not authenticated' });
            return;
          }

          socket.leave(roomId);
          
          // Remove from user's rooms
          if (this.userRooms.has(socket.userId)) {
            this.userRooms.get(socket.userId).delete(roomId);
          }

          socket.emit('left-room', { roomId });

          // Notify others in the room
          socket.to(roomId).emit('user-left', {
            userId: socket.userId,
            username: socket.user.username
          });

          console.log(`${socket.user.username} left room: ${roomId}`);
        } catch (error) {
          socket.emit('error', { error: error.message });
        }
      });

      // Send message
      socket.on('send-message', async (data) => {
        try {
          if (!socket.user) {
            socket.emit('error', { error: 'Not authenticated' });
            return;
          }

          const { roomId, content, messageType = 'text' } = data;

          // Validate room access
          const room = await Room.findById(roomId);
          if (!room) {
            socket.emit('error', { error: 'Room not found' });
            return;
          }

          if (!socket.user.canAccessRoom(room.role)) {
            socket.emit('error', { error: 'Access denied to this room' });
            return;
          }

          // Create and save message
          const message = new Message({
            content,
            sender: socket.userId,
            room: roomId,
            messageType
          });

          await message.save();
          await message.populate('sender', 'username role');

          // Update room last activity
          room.lastActivity = new Date();
          await room.save();

          // Broadcast message to all users in the room
          this.io.to(roomId).emit('new-message', {
            _id: message._id,
            id: message._id,
            content: message.content,
            sender: {
              _id: message.sender._id,
              id: message.sender._id,
              username: message.sender.username,
              role: message.sender.role
            },
            room: roomId,
            messageType: message.messageType,
            timestamp: message.timestamp,
            isEncrypted: message.isEncrypted
          });

          console.log(`Message sent by ${socket.user.username} in room ${room.name}`);
        } catch (error) {
          socket.emit('error', { error: error.message });
        }
      });

      // Typing indicator
      socket.on('typing', (data) => {
        if (!socket.user) return;
        
        const { roomId, isTyping } = data;
        socket.to(roomId).emit('user-typing', {
          userId: socket.userId,
          username: socket.user.username,
          isTyping
        });
      });

      // Handle disconnect
      socket.on('disconnect', () => {
        if (socket.userId) {
          this.connectedUsers.delete(socket.userId);
          this.userRooms.delete(socket.userId);
          
          // Notify all rooms that user disconnected
          socket.broadcast.emit('user-disconnected', {
            userId: socket.userId,
            username: socket.user?.username
          });
        }
        
        console.log(`Socket disconnected: ${socket.id}`);
      });
    });
  }

  // Get online users in a room
  getOnlineUsersInRoom(roomId) {
    const onlineUsers = [];
    for (const [userId, socketId] of this.connectedUsers) {
      const userRooms = this.userRooms.get(userId);
      if (userRooms && userRooms.has(roomId)) {
        onlineUsers.push(userId);
      }
    }
    return onlineUsers;
  }

  // Send notification to specific user
  sendNotificationToUser(userId, notification) {
    const socketId = this.connectedUsers.get(userId);
    if (socketId) {
      this.io.to(socketId).emit('notification', notification);
    }
  }

  // Broadcast to all connected users
  broadcastToAll(event, data) {
    this.io.emit(event, data);
  }
}

module.exports = SocketHandler;
