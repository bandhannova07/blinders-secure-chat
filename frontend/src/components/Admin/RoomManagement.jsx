import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Plus, Trash2, Crown, Sword, Key, BookOpen, Shield } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';

const RoomManagement = () => {
  const { user: currentUser } = useAuth();
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newRoom, setNewRoom] = useState({
    name: '',
    role: 'shield-circle',
    description: ''
  });

  const roleIcons = {
    'president': Crown,
    'vice-president': Sword,
    'team-core': Key,
    'study-circle': BookOpen,
    'shield-circle': Shield
  };

  const roleEmojis = {
    'president': '👑',
    'vice-president': '⚔️',
    'team-core': '🔑',
    'study-circle': '📚',
    'shield-circle': '🛡️'
  };

  const roleColors = {
    'president': 'text-yellow-400 bg-yellow-400/10',
    'vice-president': 'text-red-400 bg-red-400/10',
    'team-core': 'text-blue-400 bg-blue-400/10',
    'study-circle': 'text-green-400 bg-green-400/10',
    'shield-circle': 'text-purple-400 bg-purple-400/10'
  };

  useEffect(() => {
    loadRooms();
  }, []);

  const loadRooms = async () => {
    try {
      const response = await axios.get('/admin/rooms');
      setRooms(response.data.rooms);
    } catch (error) {
      toast.error('Failed to load rooms');
      console.error('Error loading rooms:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRoom = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/admin/rooms', newRoom);
      toast.success('Room created successfully');
      setShowCreateModal(false);
      setNewRoom({ name: '', role: 'shield-circle', description: '' });
      loadRooms();
    } catch (error) {
      toast.error('Failed to create room');
      console.error('Error creating room:', error);
    }
  };

  const handleDeleteRoom = async (roomId, roomName) => {
    if (window.confirm(`Are you sure you want to delete "${roomName}"? This will also delete all messages in this room. This action cannot be undone.`)) {
      try {
        await axios.delete(`/admin/rooms/${roomId}`);
        toast.success('Room deleted successfully');
        loadRooms();
      } catch (error) {
        toast.error('Failed to delete room');
        console.error('Error deleting room:', error);
      }
    }
  };

  const getRoleLevel = (role) => {
    const levels = {
      'president': 5,
      'vice-president': 4,
      'team-core': 3,
      'study-circle': 2,
      'shield-circle': 1
    };
    return levels[role] || 0;
  };

  // Sort rooms by hierarchy (highest level first)
  const sortedRooms = rooms.sort((a, b) => getRoleLevel(b.role) - getRoleLevel(a.role));

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blinders-gold"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-blinders-gold">Room Management</h2>
          <p className="text-gray-400">Manage chat rooms and their access levels</p>
        </div>
        {currentUser?.role === 'president' && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="btn-primary flex items-center space-x-2"
          >
            <Plus className="h-5 w-5" />
            <span>Create Room</span>
          </button>
        )}
      </div>

      {/* Rooms Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {sortedRooms.map((room) => {
          const IconComponent = roleIcons[room.role];
          
          return (
            <div key={room.id} className="card hover:glow-gold transition-all duration-300">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="text-3xl">{roleEmojis[room.role]}</div>
                  <div>
                    <h3 className="text-lg font-semibold text-white">{room.name}</h3>
                    <p className={`text-sm capitalize px-2 py-1 rounded-full ${roleColors[room.role]}`}>
                      {room.role.replace('-', ' ')}
                    </p>
                  </div>
                </div>
                
                {currentUser?.role === 'president' && (
                  <button
                    onClick={() => handleDeleteRoom(room.id, room.name)}
                    className="p-2 rounded-lg bg-red-600 hover:bg-red-700 text-white transition-colors duration-200"
                    title="Delete Room"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
              
              <div className="space-y-3">
                <p className="text-gray-400 text-sm">
                  {room.description || 'No description provided'}
                </p>
                
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>Created: {new Date(room.createdAt).toLocaleDateString()}</span>
                  <span>By: {room.createdBy?.username}</span>
                </div>
                
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>Last Activity: {new Date(room.lastActivity).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {rooms.length === 0 && (
        <div className="text-center py-12">
          <Shield className="h-16 w-16 text-gray-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-400 mb-2">No Rooms Found</h3>
          <p className="text-gray-500">Create your first room to get started</p>
        </div>
      )}

      {/* Create Room Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-blinders-dark border border-blinders-gray rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-xl font-bold text-blinders-gold mb-4">Create New Room</h3>
            
            <form onSubmit={handleCreateRoom} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Room Name</label>
                <input
                  type="text"
                  value={newRoom.name}
                  onChange={(e) => setNewRoom({ ...newRoom, name: e.target.value })}
                  className="input-field w-full"
                  placeholder="Enter room name"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Access Level</label>
                <select
                  value={newRoom.role}
                  onChange={(e) => setNewRoom({ ...newRoom, role: e.target.value })}
                  className="input-field w-full"
                >
                  <option value="shield-circle">🛡️ Shield Circle</option>
                  <option value="study-circle">📚 Study Circle</option>
                  <option value="team-core">🔑 Team Core</option>
                  <option value="vice-president">⚔️ Vice President</option>
                  <option value="president">👑 President</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Description</label>
                <textarea
                  value={newRoom.description}
                  onChange={(e) => setNewRoom({ ...newRoom, description: e.target.value })}
                  className="input-field w-full"
                  placeholder="Enter room description (optional)"
                  rows="3"
                />
              </div>
              
              <div className="flex space-x-3 pt-4">
                <button type="submit" className="btn-primary flex-1">
                  Create Room
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="btn-secondary flex-1"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default RoomManagement;
