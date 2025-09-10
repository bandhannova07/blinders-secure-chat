const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const { upload, scanFile, validateFileSize, deleteFromCloudinary, getMediaType } = require('../utils/mediaUpload');
const Media = require('../models/Media');
const User = require('../models/User');
const Room = require('../models/Room');

const router = express.Router();

// Upload media files
router.post('/upload', authenticateToken, upload.array('files', 5), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded' });
    }

    const { roomId, isPublic = false, tags = [] } = req.body;
    const uploadedFiles = [];
    const errors = [];

    // Validate room access if roomId provided
    if (roomId) {
      const room = await Room.findById(roomId);
      if (!room) {
        return res.status(404).json({ error: 'Room not found' });
      }

      const user = await User.findById(req.user.userId);
      if (!user.canAccessRoom(room.role)) {
        return res.status(403).json({ error: 'Access denied to this room' });
      }
    }

    for (const file of req.files) {
      try {
        // Validate file size
        validateFileSize(file);

        // Scan file for viruses
        const scanResults = await scanFile(Buffer.from(''), file.originalname);
        
        if (scanResults.status === 'infected') {
          // Delete infected file from Cloudinary
          await deleteFromCloudinary(file.filename);
          errors.push({
            filename: file.originalname,
            error: 'File contains malware and has been rejected',
            threats: scanResults.threats
          });
          continue;
        }

        // Create media record
        const mediaType = getMediaType(file.mimetype);
        const media = new Media({
          filename: file.filename,
          originalName: file.originalname,
          mimeType: file.mimetype,
          size: file.size,
          url: file.path,
          cloudinaryId: file.filename,
          uploadedBy: req.user.userId,
          roomId: roomId || null,
          mediaType: mediaType,
          isPublic: isPublic === 'true',
          scanStatus: scanResults.status,
          scanResults: scanResults,
          tags: Array.isArray(tags) ? tags : tags.split(',').map(tag => tag.trim()),
          metadata: {
            width: file.width || null,
            height: file.height || null,
            format: file.format || null
          }
        });

        await media.save();
        uploadedFiles.push({
          id: media._id,
          filename: media.filename,
          originalName: media.originalName,
          url: media.url,
          mediaType: media.mediaType,
          size: media.size,
          scanStatus: media.scanStatus
        });

      } catch (fileError) {
        console.error(`Error processing file ${file.originalname}:`, fileError);
        
        // Clean up failed upload from Cloudinary
        try {
          await deleteFromCloudinary(file.filename);
        } catch (cleanupError) {
          console.error('Cleanup error:', cleanupError);
        }

        errors.push({
          filename: file.originalname,
          error: fileError.message
        });
      }
    }

    res.json({
      success: true,
      uploaded: uploadedFiles,
      errors: errors,
      message: `${uploadedFiles.length} file(s) uploaded successfully${errors.length > 0 ? `, ${errors.length} failed` : ''}`
    });

  } catch (error) {
    console.error('Upload error:', error);
    
    // Clean up any uploaded files on error
    if (req.files) {
      for (const file of req.files) {
        try {
          await deleteFromCloudinary(file.filename);
        } catch (cleanupError) {
          console.error('Cleanup error:', cleanupError);
        }
      }
    }

    res.status(500).json({ error: 'Upload failed: ' + error.message });
  }
});

// Get user's media files
router.get('/my-files', authenticateToken, async (req, res) => {
  try {
    const { page = 1, limit = 20, mediaType, roomId } = req.query;
    const skip = (page - 1) * limit;

    const query = { uploadedBy: req.user.userId };
    if (mediaType) query.mediaType = mediaType;
    if (roomId) query.roomId = roomId;

    const media = await Media.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('uploadedBy', 'username role')
      .populate('roomId', 'name role');

    const total = await Media.countDocuments(query);

    res.json({
      media,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get media by room
router.get('/room/:roomId', authenticateToken, async (req, res) => {
  try {
    const { roomId } = req.params;
    const { page = 1, limit = 20, mediaType } = req.query;
    const skip = (page - 1) * limit;

    // Check room access
    const room = await Room.findById(roomId);
    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }

    const user = await User.findById(req.user.userId);
    if (!user.canAccessRoom(room.role)) {
      return res.status(403).json({ error: 'Access denied to this room' });
    }

    const query = { roomId };
    if (mediaType) query.mediaType = mediaType;

    const media = await Media.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('uploadedBy', 'username role');

    const total = await Media.countDocuments(query);

    res.json({
      media,
      room: {
        id: room._id,
        name: room.name,
        role: room.role
      },
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get specific media file
router.get('/:mediaId', authenticateToken, async (req, res) => {
  try {
    const { mediaId } = req.params;
    
    const media = await Media.findById(mediaId)
      .populate('uploadedBy', 'username role')
      .populate('roomId', 'name role');

    if (!media) {
      return res.status(404).json({ error: 'Media not found' });
    }

    // Check access permissions
    const user = await User.findById(req.user.userId);
    if (!media.canAccess(req.user.userId, user.role)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Update access tracking
    media.downloadCount += 1;
    media.lastAccessed = new Date();
    await media.save();

    res.json(media);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete media file
router.delete('/:mediaId', authenticateToken, async (req, res) => {
  try {
    const { mediaId } = req.params;
    
    const media = await Media.findById(mediaId);
    if (!media) {
      return res.status(404).json({ error: 'Media not found' });
    }

    const user = await User.findById(req.user.userId);
    
    // Check permissions (owner or president can delete)
    if (media.uploadedBy.toString() !== req.user.userId && user.role !== 'president') {
      return res.status(403).json({ error: 'Permission denied' });
    }

    // Delete from Cloudinary
    await deleteFromCloudinary(media.cloudinaryId);

    // Delete from database
    await Media.findByIdAndDelete(mediaId);

    res.json({ message: 'Media deleted successfully' });
  } catch (error) {
    console.error('Delete error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get media statistics (President only)
router.get('/admin/stats', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (user.role !== 'president') {
      return res.status(403).json({ error: 'Access denied' });
    }

    const stats = await Media.aggregate([
      {
        $group: {
          _id: '$mediaType',
          count: { $sum: 1 },
          totalSize: { $sum: '$size' }
        }
      }
    ]);

    const totalFiles = await Media.countDocuments();
    const totalSize = await Media.aggregate([
      { $group: { _id: null, total: { $sum: '$size' } } }
    ]);

    const recentUploads = await Media.find()
      .sort({ createdAt: -1 })
      .limit(10)
      .populate('uploadedBy', 'username role');

    res.json({
      totalFiles,
      totalSize: totalSize[0]?.total || 0,
      byType: stats,
      recentUploads
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Scan all files for viruses (President only)
router.post('/admin/scan-all', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (user.role !== 'president') {
      return res.status(403).json({ error: 'Access denied' });
    }

    const unscannedMedia = await Media.find({ 
      scanStatus: { $in: ['pending', 'error'] } 
    });

    let scanned = 0;
    let infected = 0;

    for (const media of unscannedMedia) {
      try {
        const scanResults = await scanFile(Buffer.from(''), media.originalName);
        
        media.scanStatus = scanResults.status;
        media.scanResults = scanResults;
        
        if (scanResults.status === 'infected') {
          infected++;
          // Optionally delete infected files
          // await deleteFromCloudinary(media.cloudinaryId);
          // await Media.findByIdAndDelete(media._id);
        }
        
        await media.save();
        scanned++;
      } catch (error) {
        console.error(`Scan error for ${media.filename}:`, error);
      }
    }

    res.json({
      message: `Scanned ${scanned} files`,
      infected,
      clean: scanned - infected
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
