import React, { useState, useEffect } from 'react';
import { Users, Crown, Shield, Clock, Wifi, WifiOff } from 'lucide-react';
import axios from 'axios';
import { useSocket } from '../../contexts/SocketContext';

const UserDirectory = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const { socket, connected } = useSocket();

  const roleHierarchy = {
    'president': { label: 'President', icon: Crown, color: 'text-yellow-500', level: 5 },
    'vice-president': { label: 'Vice President', icon: Crown, color: 'text-orange-500', level: 4 },
    'team-core': { label: 'Team Core', icon: Shield, color: 'text-purple-500', level: 3 },
    'study-circle': { label: 'Study Circle', icon: Shield, color: 'text-green-500', level: 2 },
    'shield-circle': { label: 'Shield Circle', icon: Shield, color: 'text-blue-500', level: 1 }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    if (socket && connected) {
      // Listen for user status updates
      socket.on('user-status-update', (data) => {
        setUsers(prev => prev.map(user => 
          user._id === data.userId 
            ? { ...user, isOnline: data.isOnline, lastSeen: data.lastSeen }
            : user
        ));
      });

      socket.on('user-joined', (data) => {
        setUsers(prev => prev.map(user => 
          user._id === data.userId 
            ? { ...user, isOnline: true, lastSeen: new Date() }
            : user
        ));
      });

      socket.on('user-left', (data) => {
        setUsers(prev => prev.map(user => 
          user._id === data.userId 
            ? { ...user, isOnline: false, lastSeen: new Date() }
            : user
        ));
      });

      return () => {
        socket.off('user-status-update');
        socket.off('user-joined');
        socket.off('user-left');
      };
    }
  }, [socket, connected]);

  const fetchUsers = async () => {
    try {
      const response = await axios.get('/auth/users-directory');
      setUsers(response.data.users || []);
    } catch (error) {
      console.error('Failed to fetch users:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatLastSeen = (lastSeen) => {
    if (!lastSeen) return 'Never';
    
    const now = new Date();
    const lastSeenDate = new Date(lastSeen);
    const diffMs = now - lastSeenDate;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return lastSeenDate.toLocaleDateString();
  };

  const getRoleInfo = (role) => {
    return roleHierarchy[role] || roleHierarchy['shield-circle'];
  };

  // Sort users by role level (highest first), then by online status, then by last seen
  const sortedUsers = [...users].sort((a, b) => {
    const aRole = getRoleInfo(a.role);
    const bRole = getRoleInfo(b.role);
    
    // First by role level (highest first)
    if (aRole.level !== bRole.level) {
      return bRole.level - aRole.level;
    }
    
    // Then by online status (online first)
    if (a.isOnline !== b.isOnline) {
      return b.isOnline - a.isOnline;
    }
    
    // Finally by last seen (most recent first)
    return new Date(b.lastSeen || 0) - new Date(a.lastSeen || 0);
  });

  if (loading) {
    return (
      <div className="p-4">
        <div className="flex items-center space-x-2 mb-4">
          <Users className="h-5 w-5 text-blinders-gold" />
          <h3 className="text-lg font-semibold text-white">User Directory</h3>
        </div>
        <div className="text-gray-400 text-sm">Loading users...</div>
      </div>
    );
  }

  return (
    <div className="p-4 border-t border-blinders-gray">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <Users className="h-5 w-5 text-blinders-gold" />
          <h3 className="text-lg font-semibold text-white">User Directory</h3>
        </div>
        <span className="text-xs text-gray-400">{users.length} users</span>
      </div>

      <div className="space-y-2 max-h-64 overflow-y-auto">
        {sortedUsers.map((user) => {
          const roleInfo = getRoleInfo(user.role);
          const RoleIcon = roleInfo.icon;
          
          return (
            <div
              key={user._id}
              className="flex items-center space-x-3 p-2 rounded-lg bg-blinders-gray hover:bg-blinders-light-gray transition-colors"
            >
              {/* Online Status Indicator */}
              <div className="relative">
                <div className="w-8 h-8 rounded-full bg-gray-600 flex items-center justify-center">
                  <span className="text-sm">
                    {user.username.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-blinders-gray ${
                  user.isOnline ? 'bg-green-400' : 'bg-gray-500'
                }`}></div>
              </div>

              {/* User Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2">
                  <span className="text-white font-medium text-sm truncate">
                    {user.username}
                  </span>
                  <RoleIcon className={`h-3 w-3 ${roleInfo.color} flex-shrink-0`} />
                </div>
                
                <div className="flex items-center space-x-2 text-xs">
                  <span className={`${roleInfo.color} truncate`}>
                    {roleInfo.label}
                  </span>
                  <span className="text-gray-500">•</span>
                  <div className="flex items-center space-x-1 text-gray-400">
                    {user.isOnline ? (
                      <>
                        <Wifi className="h-3 w-3" />
                        <span>Online</span>
                      </>
                    ) : (
                      <>
                        <Clock className="h-3 w-3" />
                        <span>{formatLastSeen(user.lastSeen)}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {users.length === 0 && (
        <div className="text-center text-gray-400 text-sm py-4">
          No users found
        </div>
      )}
    </div>
  );
};

export default UserDirectory;
