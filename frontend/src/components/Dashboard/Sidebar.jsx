import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useSocket } from '../../contexts/SocketContext';
import axios from 'axios';
import { Crown, Sword, Key, BookOpen, Shield, X } from 'lucide-react';
import toast from 'react-hot-toast';
import UserDirectory from './UserDirectory';

const Sidebar = ({ onRoomSelect, selectedRoom, onClose }) => {
  const { user } = useAuth();
  const { joinRoom, currentRoom } = useSocket();
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);

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
  }, []);

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
          <div className="text-center py-8">
            <Shield className="h-12 w-12 text-gray-600 mx-auto mb-3" />
            <p className="text-gray-400">No rooms available</p>
          </div>
        ) : (
          sortedRooms.map((room) => {
            const IconComponent = roleIcons[room.role];
            const isSelected = selectedRoom?.id === room.id;
            const isCurrentRoom = currentRoom?.roomId === room.id;
            
            return (
              <div
                key={room.id}
                onClick={() => handleRoomClick(room)}
                className={`
                  room-item cursor-pointer p-3 rounded-lg transition-all duration-200
                  ${isSelected || isCurrentRoom 
                    ? 'bg-blinders-gold text-blinders-black' 
                    : 'hover:bg-blinders-gray'
                  }
                  ${isCurrentRoom ? 'glow-gold' : ''}
                `}
              >
                <div className="flex items-center space-x-3">
                  <div className="flex-shrink-0">
                    <div className="text-2xl">{roleEmojis[room.role]}</div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`font-semibold truncate ${
                      isSelected || isCurrentRoom ? 'text-blinders-black' : 'text-white'
                    }`}>
                      {room.name}
                    </p>
                    <p className={`text-sm truncate ${
                      isSelected || isCurrentRoom ? 'text-blinders-dark' : 'text-gray-400'
                    }`}>
                      {room.description || `${room.role.replace('-', ' ')} level`}
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
          })
        )}
      </div>

      {/* User Directory */}
      <div className="border-t border-blinders-gray pt-4 mb-4">
        <UserDirectory />
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
