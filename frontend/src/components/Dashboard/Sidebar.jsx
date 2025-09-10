import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useSocket } from '../../contexts/SocketContext';
import axios from 'axios';
import { Crown, Sword, Key, BookOpen, Shield, X, Users, Clock } from 'lucide-react';
import toast from 'react-hot-toast';

const Sidebar = ({ onRoomSelect, selectedRoom, onClose }) => {
  const { user } = useAuth();
  const { joinRoom, currentRoom } = useSocket();
  const [rooms, setRooms] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [onlineUsers, setOnlineUsers] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [usersLoading, setUsersLoading] = useState(true);

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
    'president': 'text-yellow-400 border-yellow-400',
    'vice-president': 'text-red-400 border-red-400',
    'team-core': 'text-blue-400 border-blue-400',
    'study-circle': 'text-green-400 border-green-400',
    'shield-circle': 'text-purple-400 border-purple-400'
  };

  useEffect(() => {
    fetchRooms();
    fetchUsers();
  }, []);

  // Listen for real-time user status updates
  useEffect(() => {
    const { socket } = useSocket();
    if (socket) {
      socket.on('user-online', (data) => {
        setOnlineUsers(prev => new Set([...prev, data.userId]));
      });

      socket.on('user-offline', (data) => {
        setOnlineUsers(prev => {
          const newSet = new Set(prev);
          newSet.delete(data.userId);
          return newSet;
        });
      });

      socket.on('users-status', (data) => {
        setOnlineUsers(new Set(data.onlineUsers));
      });

      return () => {
        socket.off('user-online');
        socket.off('user-offline');
        socket.off('users-status');
      };
    }
  }, [useSocket]);

  const fetchRooms = async () => {
    try {
      const response = await axios.get('/rooms');
      setRooms(response.data.rooms);
    } catch (error) {
      toast.error('Failed to load rooms');
      console.error('Error fetching rooms:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await axios.get('/users/directory');
      setAllUsers(response.data.users);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setUsersLoading(false);
    }
  };

  const formatLastSeen = (lastSeen) => {
    if (!lastSeen) return 'Never';
    
    const now = new Date();
    const lastSeenDate = new Date(lastSeen);
    const diffMs = now - lastSeenDate;
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return lastSeenDate.toLocaleDateString();
  };

  const handleRoomClick = (room) => {
    onRoomSelect(room);
    joinRoom(room.id);
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
  
  // Sort users by hierarchy (highest level first)
  const sortedUsers = allUsers.sort((a, b) => getRoleLevel(b.role) - getRoleLevel(a.role));

  if (loading) {
    return (
      <div className="sidebar w-80 p-4">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-blinders-gold">Rooms</h2>
          <button onClick={onClose} className="md:hidden">
            <X className="h-6 w-6 text-gray-400" />
          </button>
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse">
              <div className="h-12 bg-blinders-gray rounded-lg"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="sidebar w-80 p-4 h-full overflow-y-auto flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-blinders-gold">Rooms</h2>
        <button onClick={onClose} className="md:hidden">
          <X className="h-6 w-6 text-gray-400" />
        </button>
      </div>

      {/* User Info */}
      <div className="mb-6 p-3 bg-blinders-gray rounded-lg border border-blinders-light-gray">
        <div className="flex items-center space-x-3">
          <div className="text-2xl">{roleEmojis[user?.role]}</div>
          <div>
            <p className="font-semibold text-white">{user?.username}</p>
            <p className={`text-sm capitalize ${roleColors[user?.role]?.split(' ')[0]}`}>
              {user?.role?.replace('-', ' ')}
            </p>
          </div>
        </div>
      </div>

      {/* Rooms List */}
      <div className="space-y-2 mb-6">
        <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
          Available Rooms
        </h3>
        
        {sortedRooms.length === 0 ? (
          <div className="text-center py-4">
            <Shield className="h-8 w-8 text-gray-600 mx-auto mb-2" />
            <p className="text-gray-400 text-sm">No rooms available</p>
          </div>
        ) : (
          <div className="space-y-1 max-h-48 overflow-y-auto">
            {sortedRooms.map((room) => {
              const IconComponent = roleIcons[room.role];
              const isSelected = selectedRoom?.id === room.id;
              const isCurrentRoom = currentRoom?.roomId === room.id;
              
              return (
                <div
                  key={room.id}
                  onClick={() => handleRoomClick(room)}
                  className={`
                    room-item cursor-pointer p-2 rounded-lg transition-all duration-200
                    ${isSelected || isCurrentRoom 
                      ? 'bg-blinders-gold text-blinders-black' 
                      : 'hover:bg-blinders-gray'
                    }
                    ${isCurrentRoom ? 'glow-gold' : ''}
                  `}
                >
                  <div className="flex items-center space-x-2">
                    <div className="flex-shrink-0">
                      <div className="text-lg">{roleEmojis[room.role]}</div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`font-medium truncate text-sm ${
                        isSelected || isCurrentRoom ? 'text-blinders-black' : 'text-white'
                      }`}>
                        {room.name}
                      </p>
                    </div>
                    {isCurrentRoom && (
                      <div className="flex-shrink-0">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* User Directory */}
      <div className="space-y-2 flex-1 overflow-y-auto">
        <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3 flex items-center">
          <Users className="h-4 w-4 mr-2" />
          User Directory
        </h3>
        
        {usersLoading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="h-12 bg-blinders-gray rounded-lg"></div>
              </div>
            ))}
          </div>
        ) : sortedUsers.length === 0 ? (
          <div className="text-center py-4">
            <Users className="h-8 w-8 text-gray-600 mx-auto mb-2" />
            <p className="text-gray-400 text-sm">No users found</p>
          </div>
        ) : (
          <div className="space-y-1">
            {sortedUsers.map((userData) => {
              const isOnline = onlineUsers.has(userData._id);
              const isCurrentUser = userData._id === user?.id;
              
              return (
                <div
                  key={userData._id}
                  className={`
                    p-2 rounded-lg transition-all duration-200
                    ${isCurrentUser ? 'bg-blinders-gold bg-opacity-20 border border-blinders-gold' : 'hover:bg-blinders-gray'}
                  `}
                >
                  <div className="flex items-center space-x-2">
                    <div className="flex-shrink-0 relative">
                      <div className="text-lg">{roleEmojis[userData.role]}</div>
                      <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-blinders-black ${
                        isOnline ? 'bg-green-500' : 'bg-gray-500'
                      }`}></div>
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <p className={`font-medium truncate text-sm ${
                          isCurrentUser ? 'text-blinders-gold' : 'text-white'
                        }`}>
                          {userData.username}
                          {isCurrentUser && <span className="text-xs ml-1">(You)</span>}
                        </p>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <p className={`text-xs capitalize truncate ${roleColors[userData.role]?.split(' ')[0] || 'text-gray-400'}`}>
                          {userData.role?.replace('-', ' ')}
                        </p>
                        
                        <div className="flex items-center space-x-1 text-xs text-gray-500">
                          <Clock className="h-3 w-3" />
                          <span>{isOnline ? 'Online' : formatLastSeen(userData.lastSeen)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="mt-4 pt-4 border-t border-blinders-gray flex-shrink-0">
        <p className="text-xs text-gray-500 text-center">
          By order of the BLINDERS
        </p>
      </div>
    </div>
  );
};

export default Sidebar;
