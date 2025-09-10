import React, { useState, useRef } from 'react';
import { Upload, X, File, Image, Video, Music, FileText, AlertCircle, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';

const MediaUpload = ({ onUploadComplete, roomId = null, className = '' }) => {
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef(null);

  const maxFileSizes = {
    'image': 10 * 1024 * 1024, // 10MB
    'video': 100 * 1024 * 1024, // 100MB
    'audio': 50 * 1024 * 1024, // 50MB
    'document': 25 * 1024 * 1024, // 25MB
    'other': 10 * 1024 * 1024 // 10MB
  };

  const getFileType = (file) => {
    if (file.type.startsWith('image/')) return 'image';
    if (file.type.startsWith('video/')) return 'video';
    if (file.type.startsWith('audio/')) return 'audio';
    if (file.type.includes('pdf') || file.type.includes('document') || file.type.includes('text')) return 'document';
    return 'other';
  };

  const getFileIcon = (fileType) => {
    switch (fileType) {
      case 'image': return <Image className="w-5 h-5" />;
      case 'video': return <Video className="w-5 h-5" />;
      case 'audio': return <Music className="w-5 h-5" />;
      case 'document': return <FileText className="w-5 h-5" />;
      default: return <File className="w-5 h-5" />;
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const validateFile = (file) => {
    const fileType = getFileType(file);
    const maxSize = maxFileSizes[fileType];
    
    if (file.size > maxSize) {
      return `File size exceeds ${formatFileSize(maxSize)} limit for ${fileType} files`;
    }
    
    return null;
  };

  const handleFiles = (newFiles) => {
    const validFiles = [];
    const errors = [];

    Array.from(newFiles).forEach(file => {
      const error = validateFile(file);
      if (error) {
        errors.push(`${file.name}: ${error}`);
      } else {
        const fileWithMetadata = {
          file,
          id: Date.now() + Math.random(),
          name: file.name,
          size: file.size,
          type: getFileType(file),
          status: 'ready'
        };
        validFiles.push(fileWithMetadata);
      }
    });

    if (errors.length > 0) {
      toast.error(`File validation errors:\n${errors.join('\n')}`);
    }

    setFiles(prev => [...prev, ...validFiles]);
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleFileInput = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFiles(e.target.files);
    }
  };

  const removeFile = (fileId) => {
    setFiles(prev => prev.filter(f => f.id !== fileId));
  };

  const uploadFiles = async () => {
    if (files.length === 0) return;

    setUploading(true);
    const formData = new FormData();
    
    files.forEach(fileObj => {
      formData.append('files', fileObj.file);
    });

    if (roomId) {
      formData.append('roomId', roomId);
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/media/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      const result = await response.json();

      if (response.ok) {
        // Update file statuses
        setFiles(prev => prev.map(f => ({
          ...f,
          status: 'uploaded'
        })));

        toast.success(result.message);
        
        if (onUploadComplete) {
          onUploadComplete(result.uploaded);
        }

        // Clear files after successful upload
        setTimeout(() => {
          setFiles([]);
        }, 2000);

      } else {
        throw new Error(result.error || 'Upload failed');
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Upload failed: ' + error.message);
      
      // Mark files as failed
      setFiles(prev => prev.map(f => ({
        ...f,
        status: 'error'
      })));
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 ${className}`}>
      {/* Upload Area */}
      <div
        className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
          dragActive
            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
            : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400" />
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
          Drag and drop files here, or{' '}
          <button
            onClick={() => fileInputRef.current?.click()}
            className="text-blue-500 hover:text-blue-600 font-medium"
          >
            browse
          </button>
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Max sizes: Images 10MB, Videos 100MB, Audio 50MB, Documents 25MB
        </p>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          onChange={handleFileInput}
          className="hidden"
          accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.txt"
        />
      </div>

      {/* File List */}
      {files.length > 0 && (
        <div className="mt-4 space-y-2">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Selected Files ({files.length})
          </h4>
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {files.map(fileObj => (
              <div
                key={fileObj.id}
                className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded border"
              >
                <div className="flex items-center space-x-2 flex-1 min-w-0">
                  {getFileIcon(fileObj.type)}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300 truncate">
                      {fileObj.name}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {formatFileSize(fileObj.size)} • {fileObj.type}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  {fileObj.status === 'uploaded' && (
                    <CheckCircle className="w-4 h-4 text-green-500" />
                  )}
                  {fileObj.status === 'error' && (
                    <AlertCircle className="w-4 h-4 text-red-500" />
                  )}
                  {fileObj.status === 'ready' && (
                    <button
                      onClick={() => removeFile(fileObj.id)}
                      className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                      disabled={uploading}
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Upload Button */}
      {files.length > 0 && (
        <div className="mt-4 flex justify-end">
          <button
            onClick={uploadFiles}
            disabled={uploading || files.every(f => f.status !== 'ready')}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
          >
            {uploading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Uploading...</span>
              </>
            ) : (
              <>
                <Upload className="w-4 h-4" />
                <span>Upload Files</span>
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
};

export default MediaUpload;
