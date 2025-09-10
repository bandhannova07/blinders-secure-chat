const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('cloudinary').v2;
const crypto = require('crypto');
const path = require('path');

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// File size limits (in bytes)
const FILE_SIZE_LIMITS = {
  image: 10 * 1024 * 1024,    // 10MB
  video: 100 * 1024 * 1024,   // 100MB
  audio: 50 * 1024 * 1024,    // 50MB
  document: 25 * 1024 * 1024, // 25MB
  pdf: 25 * 1024 * 1024,      // 25MB
  other: 10 * 1024 * 1024     // 10MB
};

// Allowed file types
const ALLOWED_MIME_TYPES = [
  // Images
  'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml',
  // Videos
  'video/mp4', 'video/avi', 'video/mov', 'video/wmv', 'video/webm',
  // Audio
  'audio/mp3', 'audio/wav', 'audio/ogg', 'audio/m4a', 'audio/aac',
  // Documents
  'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'text/plain', 'text/csv', 'application/json', 'application/xml'
];

// Get media type from mime type
function getMediaType(mimeType) {
  if (mimeType.startsWith('image/')) return 'image';
  if (mimeType.startsWith('video/')) return 'video';
  if (mimeType.startsWith('audio/')) return 'audio';
  if (mimeType === 'application/pdf') return 'pdf';
  if (mimeType.includes('document') || mimeType.includes('text') || mimeType.includes('sheet') || mimeType.includes('presentation')) return 'document';
  return 'other';
}

// Generate secure filename
function generateSecureFilename(originalName) {
  const timestamp = Date.now();
  const randomBytes = crypto.randomBytes(8).toString('hex');
  const ext = path.extname(originalName);
  return `blinders_${timestamp}_${randomBytes}${ext}`;
}

// Cloudinary storage configuration
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => {
    const mediaType = getMediaType(file.mimetype);
    const secureFilename = generateSecureFilename(file.originalname);
    
    return {
      folder: `blinders-secure-chat/${mediaType}s`,
      public_id: secureFilename.replace(/\.[^/.]+$/, ""), // Remove extension
      resource_type: mediaType === 'video' ? 'video' : mediaType === 'audio' ? 'video' : 'auto',
      allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'mp4', 'avi', 'mov', 'wmv', 'webm', 'mp3', 'wav', 'ogg', 'm4a', 'aac', 'pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt', 'csv', 'json', 'xml'],
      transformation: mediaType === 'image' ? [
        { width: 1920, height: 1080, crop: 'limit', quality: 'auto:good' }
      ] : undefined
    };
  }
});

// File filter function
const fileFilter = (req, file, cb) => {
  // Check if file type is allowed
  if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    return cb(new Error(`File type ${file.mimetype} is not allowed`), false);
  }

  // Check file size based on type
  const mediaType = getMediaType(file.mimetype);
  const maxSize = FILE_SIZE_LIMITS[mediaType] || FILE_SIZE_LIMITS.other;
  
  // Note: multer doesn't provide file size in fileFilter, so we'll check it later
  cb(null, true);
};

// Create multer upload middleware
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: Math.max(...Object.values(FILE_SIZE_LIMITS)), // Use the largest limit
    files: 5 // Maximum 5 files per request
  }
});

// Virus scanning simulation (replace with actual antivirus service)
async function scanFile(fileBuffer, filename) {
  try {
    // Simulate virus scanning
    // In production, integrate with services like:
    // - ClamAV
    // - VirusTotal API
    // - AWS GuardDuty
    // - Azure Defender
    
    console.log(`🔍 Scanning file: ${filename}`);
    
    // Simulate scan delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Basic checks for suspicious content
    const suspiciousExtensions = ['.exe', '.bat', '.cmd', '.scr', '.pif', '.com'];
    const hasSuspiciousExtension = suspiciousExtensions.some(ext => 
      filename.toLowerCase().endsWith(ext)
    );
    
    if (hasSuspiciousExtension) {
      return {
        status: 'infected',
        threats: ['Suspicious executable file'],
        scanTime: new Date()
      };
    }
    
    // Check for common malware signatures in buffer
    const malwareSignatures = ['X5O!P%@AP[4\\PZX54(P^)7CC)7}$EICAR']; // EICAR test string
    const fileContent = fileBuffer.toString('ascii');
    
    for (const signature of malwareSignatures) {
      if (fileContent.includes(signature)) {
        return {
          status: 'infected',
          threats: ['Test malware signature detected'],
          scanTime: new Date()
        };
      }
    }
    
    return {
      status: 'clean',
      threats: [],
      scanTime: new Date()
    };
  } catch (error) {
    console.error('File scan error:', error);
    return {
      status: 'error',
      error: error.message,
      scanTime: new Date()
    };
  }
}

// Validate file size after upload
function validateFileSize(file) {
  const mediaType = getMediaType(file.mimetype);
  const maxSize = FILE_SIZE_LIMITS[mediaType] || FILE_SIZE_LIMITS.other;
  
  if (file.size > maxSize) {
    throw new Error(`File size ${(file.size / 1024 / 1024).toFixed(2)}MB exceeds limit of ${(maxSize / 1024 / 1024).toFixed(2)}MB for ${mediaType} files`);
  }
}

// Delete file from Cloudinary
async function deleteFromCloudinary(publicId, resourceType = 'auto') {
  try {
    const result = await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
    return result;
  } catch (error) {
    console.error('Cloudinary deletion error:', error);
    throw error;
  }
}

module.exports = {
  upload,
  cloudinary,
  scanFile,
  validateFileSize,
  deleteFromCloudinary,
  getMediaType,
  generateSecureFilename,
  FILE_SIZE_LIMITS,
  ALLOWED_MIME_TYPES
};
