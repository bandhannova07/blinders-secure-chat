import React, { useState, useEffect } from 'react';
import { Search, Filter, Grid, List, Image, Video, Music, FileText, File, Calendar, User } from 'lucide-react';
import MediaViewer from './MediaViewer';
import toast from 'react-hot-toast';

const MediaGallery = ({ roomId = null, className = '' }) => {
  const [media, setMedia] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('grid');
  const [selectedMedia, setSelectedMedia] = useState(null);
  const [filters, setFilters] = useState({
    mediaType: '',
    search: ''
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0
  });

  useEffect(() => {
    fetchMedia();
  }, [roomId, filters, pagination.page]);

  const fetchMedia = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      const params = new URLSearchParams({
        page: pagination.page,
        limit: pagination.limit,
        ...(filters.mediaType && { mediaType: filters.mediaType })
      });

      const endpoint = roomId 
        ? `/api/media/room/${roomId}?${params}`
        : `/api/media/my-files?${params}`;

      const response = await fetch(`${import.meta.env.VITE_API_URL}${endpoint}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setMedia(data.media);
        setPagination(prev => ({
          ...prev,
          total: data.pagination.total,
          pages: data.pagination.pages
        }));
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch media');
      }
    } catch (err) {
      toast.error('Failed to load media: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleMediaDelete = (mediaId) => {
    setMedia(prev => prev.filter(m => m._id !== mediaId));
    setSelectedMedia(null);
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
    return new Date(dateString).toLocaleDateString();
  };

  const filteredMedia = media.filter(item => {
    if (filters.search) {
      return item.originalName.toLowerCase().includes(filters.search.toLowerCase()) ||
             (item.tags && item.tags.some(tag => tag.toLowerCase().includes(filters.search.toLowerCase())));
    }
    return true;
  });

  const renderGridView = () => (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
      {filteredMedia.map(item => (
        <div
          key={item._id}
          className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => setSelectedMedia(item._id)}
        >
          {/* Preview */}
          <div className="aspect-square bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
            {item.mediaType === 'image' ? (
              <img
                src={item.url}
                alt={item.originalName}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="text-gray-400">
                {getMediaIcon(item.mediaType)}
              </div>
            )}
          </div>
          
          {/* Info */}
          <div className="p-2">
            <p className="text-xs font-medium text-gray-700 dark:text-gray-300 truncate">
              {item.originalName}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {formatFileSize(item.size)}
            </p>
          </div>
        </div>
      ))}
    </div>
  );

  const renderListView = () => (
    <div className="space-y-2">
      {filteredMedia.map(item => (
        <div
          key={item._id}
          className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => setSelectedMedia(item._id)}
        >
          <div className="flex items-center space-x-4">
            {/* Icon/Preview */}
            <div className="flex-shrink-0">
              {item.mediaType === 'image' ? (
                <img
                  src={item.url}
                  alt={item.originalName}
                  className="w-12 h-12 object-cover rounded"
                />
              ) : (
                <div className="w-12 h-12 bg-gray-100 dark:bg-gray-700 rounded flex items-center justify-center">
                  {getMediaIcon(item.mediaType)}
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 truncate">
                {item.originalName}
              </h3>
              <div className="flex items-center space-x-4 text-xs text-gray-500 dark:text-gray-400 mt-1">
                <span>{formatFileSize(item.size)}</span>
                <span className="capitalize">{item.mediaType}</span>
                <div className="flex items-center space-x-1">
                  <Calendar className="w-3 h-3" />
                  <span>{formatDate(item.createdAt)}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <User className="w-3 h-3" />
                  <span>{item.uploadedBy?.username}</span>
                </div>
              </div>
            </div>

            {/* Status */}
            <div className="flex-shrink-0">
              {item.scanStatus && (
                <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                  item.scanStatus === 'clean' 
                    ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                    : item.scanStatus === 'infected'
                    ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                    : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                }`}>
                  {item.scanStatus}
                </div>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div className={`bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 ${className}`}>
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            {roomId ? 'Room Media' : 'My Files'}
          </h2>
          
          {/* View Mode Toggle */}
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded ${
                viewMode === 'grid'
                  ? 'bg-blue-500 text-white'
                  : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
              }`}
            >
              <Grid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded ${
                viewMode === 'list'
                  ? 'bg-blue-500 text-white'
                  : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
              }`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search files..."
              value={filters.search}
              onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Media Type Filter */}
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <select
              value={filters.mediaType}
              onChange={(e) => setFilters(prev => ({ ...prev, mediaType: e.target.value }))}
              className="pl-10 pr-8 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Types</option>
              <option value="image">Images</option>
              <option value="video">Videos</option>
              <option value="audio">Audio</option>
              <option value="document">Documents</option>
              <option value="other">Other</option>
            </select>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : filteredMedia.length === 0 ? (
          <div className="text-center py-8">
            <File className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <p className="text-gray-500 dark:text-gray-400">
              {filters.search || filters.mediaType ? 'No files match your filters' : 'No files uploaded yet'}
            </p>
          </div>
        ) : (
          <>
            {viewMode === 'grid' ? renderGridView() : renderListView()}
            
            {/* Pagination */}
            {pagination.pages > 1 && (
              <div className="flex items-center justify-center space-x-2 mt-6">
                <button
                  onClick={() => setPagination(prev => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
                  disabled={pagination.page === 1}
                  className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-800"
                >
                  Previous
                </button>
                
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Page {pagination.page} of {pagination.pages}
                </span>
                
                <button
                  onClick={() => setPagination(prev => ({ ...prev, page: Math.min(prev.pages, prev.page + 1) }))}
                  disabled={pagination.page === pagination.pages}
                  className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-800"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Media Viewer Modal */}
      {selectedMedia && (
        <MediaViewer
          mediaId={selectedMedia}
          onClose={() => setSelectedMedia(null)}
          onDelete={handleMediaDelete}
        />
      )}
    </div>
  );
};

export default MediaGallery;
