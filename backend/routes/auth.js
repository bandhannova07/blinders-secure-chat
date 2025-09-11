const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Notification = require('../models/Notification');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const speakeasy = require('speakeasy');
const QRCode = require('qrcode');
const { validatePresidentProtection, validatePresidentRoleAssignment, isPermanentPresident } = require('../utils/presidentAccount');

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
      password: password, // Will be hashed by pre-save middleware
      originalPassword: password, // Store original for President approval display
      role: isFirstUser ? 'president' : 'shield-circle',
      status: isFirstUser ? 'approved' : 'pending'
    });

    await user.save();

    // If not first user, notify President about join request
    if (!isFirstUser) {
      // Emit real-time notification via Socket.IO to President only
      const io = req.app.get('io');
      if (io) {
        // Find all connected President users and emit to them specifically
        const connectedSockets = io.sockets.sockets;
        connectedSockets.forEach((socket) => {
          if (socket.user && socket.user.role === 'president') {
            socket.emit('new-join-request', {
              userId: user._id,
              username: user.username,
              email: user.email,
              timestamp: new Date()
            });
          }
        });
      }
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

// Login route
router.post('/login', async (req, res) => {
  try {
    const { username, password, secretCode } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    // Find user by username
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check if user is banned
    if (user.isBanned) {
      return res.status(403).json({ error: 'Account is banned' });
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check for President secret code requirement
    if (user.role === 'president' && user.secretCodeEnabled) {
      if (!secretCode) {
        return res.status(200).json({ 
          requiresSecretCode: true,
          message: 'Secret code required for President login'
        });
      }

      // Verify secret code
      const isSecretCodeValid = await bcrypt.compare(secretCode, user.secretCode);
      if (!isSecretCodeValid) {
        return res.status(401).json({ error: 'Invalid secret code' });
      }
    }

    // Update last login for permanent President
    if (isPermanentPresident(user)) {
      user.lastLogin = new Date();
      await user.save();
      console.log(' Permanent President logged in');
    }

    // Check if user is approved (except for president)
    if (user.role !== 'president' && user.status !== 'approved') {
      return res.status(403).json({ 
        error: 'Account pending approval',
        message: 'Your account is waiting for approval from the President'
      });
    }

    if (user.status === 'rejected') {
      return res.status(403).json({ 
        error: 'Account rejected',
        message: 'Your account has been rejected by the President'
      });
    }

    // Generate JWT token with 1 hour expiry for President, default for others
    const expiresIn = user.role === 'president' ? '1h' : (process.env.JWT_EXPIRES_IN || '24h');
    const token = jwt.sign(
      { userId: user._id, username: user.username, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn }
    );

    res.json({
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        lastSeen: user.lastSeen
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

// Logout route
router.post('/logout', authenticateToken, (req, res) => {
  res.json({ message: 'Logged out successfully' });
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
  res.header('Access-Control-Allow-Origin', 'https://blinders-secure-chat.netlify.app');
  res.header('Access-Control-Allow-Credentials', 'true');
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

// Update username
router.put('/update-username', authenticateToken, async (req, res) => {
  try {
    const { username } = req.body;
    const userId = req.user.userId;

    if (!username || !username.trim()) {
      return res.status(400).json({ error: 'Username is required' });
    }

    const trimmedUsername = username.trim();

    // Check if username is already taken
    const existingUser = await User.findOne({ 
      username: trimmedUsername,
      _id: { $ne: userId }
    });

    if (existingUser) {
      return res.status(400).json({ error: 'Username is already taken' });
    }

    // Get current user to check protection
    const currentUser = await User.findById(userId);
    if (!currentUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Protect permanent President account from modification
    try {
      validatePresidentProtection(userId, currentUser);
    } catch (error) {
      return res.status(403).json({ error: error.message });
    }

    // Update username
    const user = await User.findByIdAndUpdate(
      userId,
      { username: trimmedUsername },
      { new: true }
    ).select('-password -originalPassword');

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ 
      success: true, 
      message: 'Username updated successfully',
      user: {
        id: user._id,
        username: user.username,
        role: user.role,
        status: user.status
      }
    });
  } catch (error) {
    console.error('Update username error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Change password
router.put('/change-password', authenticateToken, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.userId;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current password and new password are required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'New password must be at least 6 characters long' });
    }

    // Get user with password
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Protect permanent President account from password change
    try {
      validatePresidentProtection(userId, user);
    } catch (error) {
      return res.status(403).json({ error: error.message });
    }

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isCurrentPasswordValid) {
      return res.status(400).json({ error: 'Current password is incorrect' });
    }

    // Hash new password
    const saltRounds = 12;
    const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);

    // Update password
    await User.findByIdAndUpdate(userId, { password: hashedNewPassword });

    res.json({ 
      success: true, 
      message: 'Password changed successfully'
    });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Setup secret code for President (President only)
router.post('/setup-secret-code', authenticateToken, async (req, res) => {
  try {
    const { secretCode, confirmSecretCode } = req.body;

    if (req.user.role !== 'president') {
      return res.status(403).json({ error: 'Only President can setup secret code' });
    }

    if (!secretCode || !confirmSecretCode) {
      return res.status(400).json({ error: 'Secret code and confirmation are required' });
    }

    if (secretCode !== confirmSecretCode) {
      return res.status(400).json({ error: 'Secret codes do not match' });
    }

    if (secretCode.length < 6) {
      return res.status(400).json({ error: 'Secret code must be at least 6 characters long' });
    }

    // Hash the secret code
    const saltRounds = 12;
    const hashedSecretCode = await bcrypt.hash(secretCode, saltRounds);

    // Update user with secret code
    const user = await User.findById(req.user._id);
    user.secretCode = hashedSecretCode;
    user.secretCodeEnabled = true;
    await user.save();

    res.json({ 
      success: true,
      message: 'Secret code setup successfully' 
    });
  } catch (error) {
    console.error('Setup secret code error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Disable secret code for President (President only)
router.post('/disable-secret-code', authenticateToken, async (req, res) => {
  try {
    const { password } = req.body;

    if (req.user.role !== 'president') {
      return res.status(403).json({ error: 'Only President can disable secret code' });
    }

    if (!password) {
      return res.status(400).json({ error: 'Password is required' });
    }

    // Verify current password
    const user = await User.findById(req.user._id);
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid password' });
    }

    // Disable secret code
    user.secretCode = null;
    user.secretCodeEnabled = false;
    await user.save();

    res.json({ 
      success: true,
      message: 'Secret code disabled successfully' 
    });
  } catch (error) {
    console.error('Disable secret code error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
