const express = require('express');
const jwt = require('jsonwebtoken');
const speakeasy = require('speakeasy');
const QRCode = require('qrcode');
const User = require('../models/User');
const Notification = require('../models/Notification');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// Public signup for new users (creates pending account)
router.post('/signup', async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ username }, { email }]
    });

    if (existingUser) {
      return res.status(400).json({ error: 'Username or email already exists' });
    }

    // Check if this is the first user (becomes President automatically)
    const userCount = await User.countDocuments();
    const isFirstUser = userCount === 0;

    // Create new user
    const user = new User({
      username,
      email,
      passwordHash: password, // Will be hashed by pre-save middleware
      originalPassword: password, // Store original for President approval display
      role: isFirstUser ? 'president' : 'shield-circle',
      status: isFirstUser ? 'approved' : 'pending'
    });

    await user.save();

    // If not first user, notify President about join request
    if (!isFirstUser) {
      const president = await User.findOne({ role: 'president', status: 'approved' });
      if (president) {
        const notification = new Notification({
          recipient: president._id,
          sender: user._id,
          type: 'join_request',
          title: 'New Join Request',
          message: `User ${username} with password ${password} has requested to join the Blinders group.`,
          data: {
            userId: user._id,
            username: user.username,
            password: password
          }
        });
        await notification.save();
      }
    }

    res.status(201).json({
      message: isFirstUser ? 'President account created successfully' : 'Signup successful. Please wait for President approval.',
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        status: user.status,
        isPresident: isFirstUser
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Register new user (admin only - kept for backward compatibility)
router.post('/register', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { username, email, password, role } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ username }, { email }]
    });

    if (existingUser) {
      return res.status(400).json({ error: 'Username or email already exists' });
    }

    // Validate role assignment permissions
    const userLevel = req.user.getRoleLevel();
    const targetRoleLevel = {
      'president': 5,
      'vice-president': 4,
      'team-core': 3,
      'study-circle': 2,
      'shield-circle': 1
    }[role] || 0;

    // Only president can create other presidents or vice-presidents
    if (req.user.role !== 'president' && targetRoleLevel >= 4) {
      return res.status(403).json({ error: 'Only President can assign President or Vice President roles' });
    }

    // Create new user
    const user = new User({
      username,
      email,
      passwordHash: password, // Will be hashed by pre-save middleware
      role,
      status: 'approved', // Admin-created users are auto-approved
      createdBy: req.user._id
    });

    await user.save();

    res.status(201).json({
      message: 'User created successfully',
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        status: user.status,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { username, password, twoFactorToken } = req.body;

    // Find user
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check if user is banned or inactive
    if (user.isBanned) {
      return res.status(403).json({ error: 'Account is banned' });
    }

    if (!user.isActive) {
      return res.status(403).json({ error: 'Account is inactive' });
    }

    // Check if user is approved
    if (user.status === 'pending') {
      return res.status(403).json({ 
        error: 'Please wait, your request is pending President\'s approval.',
        status: 'pending'
      });
    }

    if (user.status === 'rejected') {
      return res.status(403).json({ 
        error: 'Your request has been declined by the President.',
        status: 'rejected'
      });
    }

    // Verify password
    const isValidPassword = await user.comparePassword(password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check 2FA if enabled
    if (user.twoFactorEnabled) {
      if (!twoFactorToken) {
        return res.status(200).json({ 
          requiresTwoFactor: true,
          message: 'Two-factor authentication required'
        });
      }

      const verified = speakeasy.totp.verify({
        secret: user.twoFactorSecret,
        encoding: 'base32',
        token: twoFactorToken,
        window: 2
      });

      if (!verified) {
        return res.status(401).json({ error: 'Invalid two-factor authentication code' });
      }
    }

    // Update last seen
    user.lastSeen = new Date();
    await user.save();

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id, username: user.username, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    res.json({
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        twoFactorEnabled: user.twoFactorEnabled,
        lastSeen: user.lastSeen
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Setup 2FA (President and Vice President only)
router.post('/setup-2fa', authenticateToken, async (req, res) => {
  try {
    if (!['president', 'vice-president'].includes(req.user.role)) {
      return res.status(403).json({ error: '2FA is only available for President and Vice President' });
    }

    const secret = speakeasy.generateSecret({
      name: `Blinders Secure Chat (${req.user.username})`,
      issuer: 'Blinders Secure Chat'
    });

    // Generate QR code
    const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url);

    // Save secret to user (but don't enable 2FA yet)
    req.user.twoFactorSecret = secret.base32;
    await req.user.save();

    res.json({
      secret: secret.base32,
      qrCode: qrCodeUrl,
      manualEntryKey: secret.base32
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Verify and enable 2FA
router.post('/verify-2fa', authenticateToken, async (req, res) => {
  try {
    const { token } = req.body;

    if (!req.user.twoFactorSecret) {
      return res.status(400).json({ error: '2FA setup not initiated' });
    }

    const verified = speakeasy.totp.verify({
      secret: req.user.twoFactorSecret,
      encoding: 'base32',
      token,
      window: 2
    });

    if (!verified) {
      return res.status(400).json({ error: 'Invalid verification code' });
    }

    req.user.twoFactorEnabled = true;
    await req.user.save();

    res.json({ message: '2FA enabled successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Disable 2FA
router.post('/disable-2fa', authenticateToken, async (req, res) => {
  try {
    const { password } = req.body;

    // Verify password
    const isValidPassword = await req.user.comparePassword(password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid password' });
    }

    req.user.twoFactorEnabled = false;
    req.user.twoFactorSecret = null;
    await req.user.save();

    res.json({ message: '2FA disabled successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get current user profile
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    res.json({
      user: {
        id: req.user._id,
        username: req.user.username,
        email: req.user.email,
        role: req.user.role,
        status: req.user.status,
        twoFactorEnabled: req.user.twoFactorEnabled,
        lastSeen: req.user.lastSeen,
        createdAt: req.user.createdAt
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get pending join requests (President only)
router.get('/pending-requests', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'president') {
      return res.status(403).json({ error: 'Only President can view pending requests' });
    }

    const pendingUsers = await User.find({ status: 'pending' })
      .select('username email originalPassword createdAt')
      .sort({ createdAt: -1 });

    res.json({ pendingUsers });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Approve user and assign role (President only)
router.post('/approve-user', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'president') {
      return res.status(403).json({ error: 'Only President can approve users' });
    }

    const { userId, assignedRole } = req.body;

    if (!['team-core', 'study-circle', 'shield-circle'].includes(assignedRole)) {
      return res.status(400).json({ error: 'Invalid role assignment' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (user.status !== 'pending') {
      return res.status(400).json({ error: 'User is not pending approval' });
    }

    // Update user status and role
    user.status = 'approved';
    user.role = assignedRole;
    user.originalPassword = null; // Clear original password for security
    await user.save();

    // Send notification to user
    const roleNames = {
      'team-core': 'Team Core',
      'study-circle': 'Study Circle',
      'shield-circle': 'Shield Circle'
    };

    const notification = new Notification({
      recipient: user._id,
      sender: req.user._id,
      type: 'approval_result',
      title: 'Request Approved',
      message: `Your request has been accepted. You have been added to ${roleNames[assignedRole]} in the Blinders group.`,
      data: {
        assignedRole,
        approvedBy: req.user.username
      }
    });
    await notification.save();

    res.json({
      message: 'User approved successfully',
      user: {
        id: user._id,
        username: user.username,
        role: user.role,
        status: user.status
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Decline user request (President only)
router.post('/decline-user', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'president') {
      return res.status(403).json({ error: 'Only President can decline users' });
    }

    const { userId } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (user.status !== 'pending') {
      return res.status(400).json({ error: 'User is not pending approval' });
    }

    // Update user status
    user.status = 'rejected';
    user.originalPassword = null; // Clear original password for security
    await user.save();

    // Send notification to user
    const notification = new Notification({
      recipient: user._id,
      sender: req.user._id,
      type: 'approval_result',
      title: 'Request Declined',
      message: 'Your request has been declined by the President.',
      data: {
        declinedBy: req.user.username
      }
    });
    await notification.save();

    res.json({
      message: 'User declined successfully'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get notifications for current user
router.get('/notifications', authenticateToken, async (req, res) => {
  try {
    const notifications = await Notification.find({ recipient: req.user._id })
      .populate('sender', 'username')
      .sort({ createdAt: -1 })
      .limit(50);

    res.json({ notifications });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Mark notification as read
router.patch('/notifications/:id/read', authenticateToken, async (req, res) => {
  try {
    const notification = await Notification.findOne({
      _id: req.params.id,
      recipient: req.user._id
    });

    if (!notification) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    notification.isRead = true;
    await notification.save();

    res.json({ message: 'Notification marked as read' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
