const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  email: {
    type: String,
    required: false,
    unique: true,
    sparse: true,
    trim: true
  },
  password: {
    type: String,
    required: true
  },
  originalPassword: {
    type: String,
    required: false
  },
  role: {
    type: String,
    enum: ['president', 'vice-president', 'team-core', 'study-circle', 'shield-circle'],
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  isPermanent: {
    type: Boolean,
    default: false
  },
  lastLogin: {
    type: Date,
    default: null
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isBanned: {
    type: Boolean,
    default: false
  },
  twoFactorSecret: {
    type: String,
    default: null
  },
  twoFactorEnabled: {
    type: Boolean,
    default: false
  },
  secretCode: {
    type: String,
    default: null
  },
  secretCodeEnabled: {
    type: Boolean,
    default: false
  },
  lastSeen: {
    type: Date,
    default: Date.now
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  }
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Get role hierarchy level
userSchema.methods.getRoleLevel = function() {
  const roleLevels = {
    'president': 5,
    'vice-president': 4,
    'team-core': 3,
    'study-circle': 2,
    'shield-circle': 1
  };
  return roleLevels[this.role] || 0;
};

// Check if user can access room
userSchema.methods.canAccessRoom = function(roomRole) {
  const userLevel = this.getRoleLevel();
  const roomLevel = {
    'president': 5,
    'vice-president': 4,
    'team-core': 3,
    'study-circle': 2,
    'shield-circle': 1
  }[roomRole] || 0;
  
  return userLevel >= roomLevel;
};

module.exports = mongoose.model('User', userSchema);
