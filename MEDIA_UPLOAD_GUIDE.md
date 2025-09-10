# Media Upload System - Blinders Secure Chat

## Overview

The Blinders Secure Chat application now includes a comprehensive media upload system with cloud storage, virus scanning, and advanced security features. This guide covers the implementation, usage, and administration of the media upload functionality.

## Features

### Core Functionality
- **Multi-file Upload**: Support for uploading multiple files simultaneously
- **Cloud Storage**: Integration with Cloudinary for secure file storage
- **File Type Support**: Images, videos, audio, documents, and other file types
- **Size Limits**: Configurable file size limits per media type
- **Virus Scanning**: Simulated malware detection with placeholders for real antivirus integration
- **Access Control**: Role-based permissions for file access and management

### Security Features
- **File Validation**: MIME type and size validation
- **Secure Filenames**: Auto-generated secure filenames to prevent conflicts
- **Scan Status Tracking**: Files are marked as clean, infected, pending, or error
- **Role-based Access**: Different permissions for different user roles
- **Localhost Restriction**: Blocked access from localhost in production

## File Size Limits

| Media Type | Maximum Size |
|------------|--------------|
| Images     | 10 MB        |
| Videos     | 100 MB       |
| Audio      | 50 MB        |
| Documents  | 25 MB        |
| Other      | 10 MB        |

## API Endpoints

### Upload Media
```
POST /api/media/upload
Authorization: Bearer <token>
Content-Type: multipart/form-data

Body:
- files: File[] (up to 5 files)
- roomId: string (optional)
- isPublic: boolean (optional, default: false)
- tags: string[] (optional)
```

### Get User's Media
```
GET /api/media/my-files?page=1&limit=20&mediaType=image&roomId=<id>
Authorization: Bearer <token>
```

### Get Room Media
```
GET /api/media/room/:roomId?page=1&limit=20&mediaType=image
Authorization: Bearer <token>
```

### Get Specific Media
```
GET /api/media/:mediaId
Authorization: Bearer <token>
```

### Delete Media
```
DELETE /api/media/:mediaId
Authorization: Bearer <token>
```

### Admin Endpoints (President Only)

#### Get Media Statistics
```
GET /api/media/admin/stats
Authorization: Bearer <token>
```

#### Scan All Files
```
POST /api/media/admin/scan-all
Authorization: Bearer <token>
```

## Frontend Components

### MediaUpload Component
Located at: `frontend/src/components/Media/MediaUpload.jsx`

**Props:**
- `onUploadComplete`: Callback function called after successful upload
- `roomId`: Optional room ID to associate uploads with
- `className`: Additional CSS classes

**Usage:**
```jsx
import MediaUpload from '../Media/MediaUpload';

<MediaUpload
  onUploadComplete={(uploadedFiles) => {
    console.log('Files uploaded:', uploadedFiles);
  }}
  roomId={currentRoom?.id}
/>
```

### MediaViewer Component
Located at: `frontend/src/components/Media/MediaViewer.jsx`

**Props:**
- `mediaId`: ID of the media file to view
- `onClose`: Callback function to close the viewer
- `onDelete`: Callback function called after file deletion

**Features:**
- Preview for images, videos, and audio
- File information display
- Download and delete actions
- Security status indicator

### MediaGallery Component
Located at: `frontend/src/components/Media/MediaGallery.jsx`

**Props:**
- `roomId`: Optional room ID to filter media by room
- `className`: Additional CSS classes

**Features:**
- Grid and list view modes
- Search and filter functionality
- Pagination support
- Media type filtering

### MediaManagement Component (President Only)
Located at: `frontend/src/components/Admin/MediaManagement.jsx`

**Features:**
- System-wide media statistics
- Bulk virus scanning
- Advanced filtering and search
- User and file management
- Security status monitoring

## Chat Integration

### Media Messages
When files are uploaded through the chat interface, they are automatically sent as special media messages:

```json
{
  "type": "media",
  "content": "📎 filename.jpg",
  "mediaUrl": "https://cloudinary.com/...",
  "mediaType": "image",
  "mediaId": "64f8a1b2c3d4e5f6g7h8i9j0"
}
```

### Chat Interface Integration
- **Upload Button**: Paperclip icon in chat input opens upload panel
- **Gallery Button**: Image icon opens media gallery for the current room
- **Media Rendering**: Uploaded media is displayed inline in chat messages

## Database Schema

### Media Model
```javascript
{
  filename: String,           // Cloudinary filename
  originalName: String,       // Original filename
  mimeType: String,          // File MIME type
  size: Number,              // File size in bytes
  url: String,               // Cloudinary URL
  cloudinaryId: String,      // Cloudinary public ID
  uploadedBy: ObjectId,      // User who uploaded
  roomId: ObjectId,          // Associated room (optional)
  mediaType: String,         // image, video, audio, document, other
  isPublic: Boolean,         // Public access flag
  scanStatus: String,        // clean, infected, pending, error
  scanResults: Object,       // Scan results object
  tags: [String],           // File tags
  downloadCount: Number,     // Download counter
  lastAccessed: Date,       // Last access timestamp
  metadata: {
    width: Number,           // Image/video width
    height: Number,          // Image/video height
    format: String           // File format
  },
  createdAt: Date,
  updatedAt: Date
}
```

## Environment Variables

### Backend (.env)
```bash
# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME=your-cloudinary-cloud-name
CLOUDINARY_API_KEY=your-cloudinary-api-key
CLOUDINARY_API_SECRET=your-cloudinary-api-secret
```

### Frontend (.env)
```bash
VITE_API_URL=http://localhost:5000
VITE_SOCKET_URL=http://localhost:5000
```

## Installation & Setup

### 1. Install Dependencies
```bash
# Backend
cd backend
npm install cloudinary multer-storage-cloudinary

# Frontend dependencies are already included
```

### 2. Configure Cloudinary
1. Create a Cloudinary account at https://cloudinary.com
2. Get your cloud name, API key, and API secret
3. Add them to your backend `.env` file

### 3. Database Migration
The Media model will be automatically created when the server starts.

## Usage Guide

### For Regular Users

#### Uploading Files in Chat
1. Open a chat room
2. Click the paperclip icon in the message input
3. Drag and drop files or click "browse" to select files
4. Files are automatically validated and uploaded
5. Media messages appear in the chat

#### Viewing Media Gallery
1. Click the image icon in the chat interface
2. Browse uploaded files for the current room
3. Use filters to find specific file types
4. Click on any file to view details

### For President Users

#### Media Management Dashboard
1. Click the user menu in the header
2. Select "Media Management"
3. View system statistics and recent uploads
4. Use advanced filters to find specific files
5. Perform bulk operations like virus scanning

#### Security Monitoring
- Monitor scan status of all uploaded files
- View file access patterns and download counts
- Delete infected or inappropriate files
- Track storage usage and file types

## Security Considerations

### File Validation
- All files are validated by MIME type and size
- Malicious file extensions are blocked
- File content is scanned for viruses (simulated)

### Access Control
- Users can only access files they uploaded or files in rooms they have access to
- President users have full access to all files
- Public files can be accessed by any authenticated user

### Storage Security
- Files are stored on Cloudinary with secure URLs
- Original filenames are preserved but stored filenames are randomized
- File metadata includes security scan results

## Troubleshooting

### Common Issues

#### Upload Fails
- Check file size limits
- Verify Cloudinary configuration
- Ensure user has proper permissions
- Check network connectivity

#### Files Not Displaying
- Verify Cloudinary URLs are accessible
- Check browser console for errors
- Ensure proper authentication tokens

#### Virus Scan Issues
- Current implementation uses simulated scanning
- Integrate with real antivirus service for production
- Check scan status in media management dashboard

### Error Codes
- `400`: Bad request (invalid file, size limit exceeded)
- `401`: Unauthorized (invalid token)
- `403`: Forbidden (insufficient permissions)
- `404`: File not found
- `500`: Server error (Cloudinary issues, database errors)

## Future Enhancements

### Planned Features
- Real antivirus integration (ClamAV, VirusTotal)
- File compression and optimization
- Advanced media processing (thumbnails, transcoding)
- Bulk upload operations
- File sharing links with expiration
- Advanced analytics and reporting

### Performance Optimizations
- CDN integration for faster delivery
- Image optimization and resizing
- Lazy loading for media galleries
- Caching strategies for frequently accessed files

## Support

For technical support or questions about the media upload system:
- Check the application logs for detailed error messages
- Verify environment variables are properly configured
- Ensure Cloudinary account has sufficient quota
- Contact the development team for assistance

---

*This documentation is part of the Blinders Secure Chat application. For general application documentation, see README.md.*
