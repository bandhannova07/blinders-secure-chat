const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
require('dotenv').config();

// Import routes
const authRoutes = require('./routes/auth');
const adminRoutes = require('./routes/admin');
const messageRoutes = require('./routes/messages');
const roomRoutes = require('./routes/rooms');
const uploadRoutes = require('./routes/upload');

// Import socket handler
const SocketHandler = require('./socket/socketHandler');

// Import models
const User = require('./models/User');
const Room = require('./models/Room');

// Import utilities
const { ensurePresidentAccount } = require('./utils/presidentAccount');

const app = express();
const server = http.createServer(app);

// Enhanced localhost restriction middleware (only for production)
if (process.env.NODE_ENV === 'production') {
  app.use((req, res, next) => {
    const host = req.get('host');
    const origin = req.get('origin');
    const forwarded = req.get('x-forwarded-for');
    const realIp = req.get('x-real-ip');
    
    // Check for localhost in various headers
    const isLocalhost = (
      (host && (host.includes('localhost') || host.includes('127.0.0.1') || host.includes('192.168.'))) ||
      (origin && (origin.includes('localhost') || origin.includes('127.0.0.1') || origin.includes('192.168.'))) ||
      (forwarded && (forwarded.includes('127.0.0.1') || forwarded.includes('192.168.'))) ||
      (realIp && (realIp.includes('127.0.0.1') || realIp.includes('192.168.')))
    );
    
    // Block localhost access completely in production
    if (isLocalhost) {
      console.log(`🚫 Blocked localhost access attempt from: ${host || origin || forwarded || realIp}`);
      return res.status(403).json({
        error: 'Access Denied',
        message: 'Localhost access is not permitted. Please use the official deployed URL.',
        code: 'LOCALHOST_BLOCKED'
      });
    }
    
    next();
  });
}
const io = socketIo(server, {
  cors: {
    origin: ["https://blinders-secure-chat.netlify.app"],
    methods: ["GET", "POST"],
    credentials: true
  }
});

// Middleware
app.use(helmet({
  contentSecurityPolicy: false // Disable for development
}));

app.use(cors({
  origin: ["https://blinders-secure-chat.netlify.app"],
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/rooms', roomRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/media', require('./routes/media'));

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Initialize socket handler
const socketHandler = new SocketHandler(io);

// Database connection
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb+srv://bandhannova_mongodb_07:JcL2%40uci5w6JhBE@blinders-secure-chat.he477fw.mongodb.net/?retryWrites=true&w=majority&appName=blinders-secure-chat', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('MongoDB connected successfully');
    
    // Initialize default rooms and admin user
    await initializeDefaultData();
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

// Initialize default data
const initializeDefaultData = async () => {
  try {
    // Check if President user exists
    const president = await User.findOne({ role: 'president', status: 'approved' });
    
    if (!president) {
      console.log('No President found. First user to signup will become President automatically.');
    }

    // Create default rooms if they don't exist
    const defaultRooms = [
      { name: 'President Chamber', role: 'president', description: 'Private room for the President' },
      { name: 'Leadership Council', role: 'vice-president', description: 'President and Vice President discussions' },
      { name: 'Core Team Hub', role: 'team-core', description: 'Trusted inner circle communications' },
      { name: 'Study Hall', role: 'study-circle', description: 'Research and knowledge sharing' },
      { name: 'Shield Operations', role: 'shield-circle', description: 'Protection and moderation discussions' }
    ];

    for (const roomData of defaultRooms) {
      const existingRoom = await Room.findOne({ name: roomData.name, role: roomData.role });
      
      if (!existingRoom) {
        const room = new Room({
          ...roomData,
          createdBy: president?._id || (await User.findOne({ role: 'president' }))._id
        });
        
        await room.save();
        console.log(`Default room created: ${roomData.name}`);
      }
    }
    
    if (president) {
      console.log(`President found: ${president.username}`);
    }
  } catch (error) {
    console.error('Error initializing default data:', error);
  }
};

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Start server
const PORT = process.env.PORT || 10000;
const HOST = process.env.NODE_ENV === 'production' ? '0.0.0.0' : 'localhost';

const startServer = async () => {
  try {
    // Connect to database
    await connectDB();
    
    // Ensure permanent President account exists
    await ensurePresidentAccount();
    
    server.listen(PORT, HOST, () => {
      console.log(`🚀 Server running on ${HOST}:${PORT}`);
      console.log(`🔒 Localhost access is blocked for security`);
    });
    
    console.log(`📡 WebSocket server ready for connections`);
    console.log(`🌍 Environment: ${process.env.NODE_ENV || 'production'}`);
    console.log(`🔗 Frontend URL: ${process.env.FRONTEND_URL || 'http://blinders-secure-chat.netlify.app'}`);
    console.log(`👑 Permanent President account initialized`);
  } catch (error) {
    console.error('❌ Server startup failed:', error);
    process.exit(1);
  }
};

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('Process terminated');
    mongoose.connection.close();
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  server.close(() => {
    console.log('Process terminated');
    mongoose.connection.close();
  });
});

startServer().catch(console.error);
