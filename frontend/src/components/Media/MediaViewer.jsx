import React, { useState, useEffect } from 'react';
import { X, Download, Eye, Trash2, Calendar, User, FileText, Image, Video, Music, File } from 'lucide-react';
import toast from 'react-hot-toast';

const MediaViewer = ({ mediaId, onClose, onDelete }) => {
  const [media, setMedia] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (mediaId) {
      fetchMedia();
    }
  }, [mediaId]);

  const fetchMedia = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/media/${mediaId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setMedia(data);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch media');
      }
    } catch (err) {
      setError(err.message);
      toast.error('Failed to load media: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!media || !window.confirm('Are you sure you want to delete this file?')) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/media/${media._id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        toast.success('Media deleted successfully');
        if (onDelete) onDelete(media._id);
        onClose();
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete media');
      }
    } catch (err) {
      toast.error('Failed to delete media: ' + err.message);
    }
  };

  const getMediaIcon = (mediaType) => {
    switch (mediaType) {
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

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  const renderMediaPreview = () => {
    if (!media) return null;

    switch (media.mediaType) {
      case 'image':
        return (
          <div className="flex justify-center bg-gray-100 dark:bg-gray-800 rounded-lg p-4">
            <img
              src={media.url}
              alt={media.originalName}
              className="max-w-full max-h-96 object-contain rounded"
            />
          </div>
        );
      
      case 'video':
        return (
          <div className="flex justify-center bg-gray-100 dark:bg-gray-800 rounded-lg p-4">
            <video
              src={media.url}
              controls
              className="max-w-full max-h-96 rounded"
            >
              Your browser does not support the video tag.
            </video>
          </div>
        );
      
      case 'audio':
        return (
          <div className="flex justify-center bg-gray-100 dark:bg-gray-800 rounded-lg p-8">
            <div className="text-center">
              <Music className="w-16 h-16 mx-auto mb-4 text-gray-400" />
              <audio src={media.url} controls className="w-full max-w-md" />
            </div>
          </div>
        );
      
      default:
        return (
          <div className="flex justify-center bg-gray-100 dark:bg-gray-800 rounded-lg p-8">
            <div className="text-center">
              {getMediaIcon(media.mediaType)}
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                Preview not available for this file type
              </p>
            </div>
          </div>
        );
    }
  };

  if (!mediaId) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-900 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Media Viewer
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 overflow-y-auto max-h-[calc(90vh-120px)]">
          {loading && (
            <div className="flex items-center justify-center py-8">
              <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          )}

          {error && (
            <div className="text-center py-8">
              <p className="text-red-500">{error}</p>
            </div>
          )}

          {media && (
            <div className="space-y-6">
              {/* Media Preview */}
              {renderMediaPreview()}

              {/* Media Info */}
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      File Information
                    </h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center space-x-2">
                        {getMediaIcon(media.mediaType)}
                        <span className="font-medium">{media.originalName}</span>
                      </div>
                      <div className="text-gray-600 dark:text-gray-400">
                        Size: {formatFileSize(media.size)}
                      </div>
                      <div className="text-gray-600 dark:text-gray-400">
                        Type: {media.mimeType}
                      </div>
                      <div className="text-gray-600 dark:text-gray-400">
                        Category: {media.mediaType}
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Upload Details
                    </h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-400">
                        <User className="w-4 h-4" />
                        <span>{media.uploadedBy?.username || 'Unknown'}</span>
                      </div>
                      <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-400">
                        <Calendar className="w-4 h-4" />
                        <span>{formatDate(media.createdAt)}</span>
                      </div>
                      {media.roomId && (
                        <div className="text-gray-600 dark:text-gray-400">
                          Room: {media.roomId.name}
                        </div>
                      )}
                      <div className="text-gray-600 dark:text-gray-400">
                        Downloads: {media.downloadCount || 0}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Security Status */}
                {media.scanStatus && (
                  <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-600">
                    <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Security Status
                    </h3>
                    <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      media.scanStatus === 'clean' 
                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                        : media.scanStatus === 'infected'
                        ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                        : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                    }`}>
                      {media.scanStatus.charAt(0).toUpperCase() + media.scanStatus.slice(1)}
                    </div>
                  </div>
                )}

                {/* Tags */}
                {media.tags && media.tags.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-600">
                    <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Tags
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {media.tags.map((tag, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 rounded-full text-xs"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex justify-between items-center pt-4 border-t border-gray-200 dark:border-gray-700">
                <div className="flex space-x-2">
                  <a
                    href={media.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center space-x-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                  >
                    <Eye className="w-4 h-4" />
                    <span>View Full Size</span>
                  </a>
                  <a
                    href={media.url}
                    download={media.originalName}
                    className="flex items-center space-x-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download</span>
                  </a>
                </div>

                {/* Delete button - only show if user owns the file or is president */}
                <button
                  onClick={handleDelete}
                  className="flex items-center space-x-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Delete</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MediaViewer;
