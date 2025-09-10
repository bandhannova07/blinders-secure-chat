const mongoose = require('mongoose');

const mediaSchema = new mongoose.Schema({
  filename: {
    type: String,
    required: true
  },
  originalName: {
    type: String,
    required: true
  },
  mimeType: {
    type: String,
    required: true
  },
  size: {
    type: Number,
    required: true
  },
  url: {
    type: String,
    required: true
  },
  cloudinaryId: {
    type: String,
    required: true
  },
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  messageId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message',
    default: null
  },
  roomId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Room',
    default: null
  },
  mediaType: {
    type: String,
    enum: ['image', 'video', 'audio', 'document', 'pdf', 'other'],
    required: true
  },
  isPublic: {
    type: Boolean,
    default: false
  },
  isEncrypted: {
    type: Boolean,
    default: false
  },
  encryptionKey: {
    type: String,
    default: null
  },
  scanStatus: {
    type: String,
    enum: ['pending', 'clean', 'infected', 'error'],
    default: 'pending'
  },
  scanResults: {
    type: Object,
    default: null
  },
  downloadCount: {
    type: Number,
    default: 0
  },
  lastAccessed: {
    type: Date,
    default: Date.now
  },
  expiresAt: {
    type: Date,
    default: null
  },
  tags: [{
    type: String
  }],
  metadata: {
    width: Number,
    height: Number,
    duration: Number,
    format: String,
    quality: String
  }
}, {
  timestamps: true
});

// Index for efficient queries
mediaSchema.index({ uploadedBy: 1, createdAt: -1 });
mediaSchema.index({ roomId: 1, createdAt: -1 });
mediaSchema.index({ mediaType: 1 });
mediaSchema.index({ scanStatus: 1 });

// Auto-expire media if expiration is set
mediaSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Get media type from mime type
mediaSchema.methods.getMediaType = function() {
  if (this.mimeType.startsWith('image/')) return 'image';
  if (this.mimeType.startsWith('video/')) return 'video';
  if (this.mimeType.startsWith('audio/')) return 'audio';
  if (this.mimeType === 'application/pdf') return 'pdf';
  if (this.mimeType.includes('document') || this.mimeType.includes('text')) return 'document';
  return 'other';
};

// Check if user can access this media
mediaSchema.methods.canAccess = function(userId, userRole) {
  // Owner can always access
  if (this.uploadedBy.toString() === userId.toString()) return true;
  
  // Public media can be accessed by anyone
  if (this.isPublic) return true;
  
  // President can access everything
  if (userRole === 'president') return true;
  
  // For room-specific media, check room access
  if (this.roomId) {
    // This would need room access logic
    return true; // Simplified for now
  }
  
  return false;
};

module.exports = mongoose.model('Media', mediaSchema);
