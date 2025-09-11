import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useSocket } from '../../contexts/SocketContext';
import { Users, Crown, Shield, Eye, Clock, Wifi, WifiOff } from 'lucide-react';
import axios from 'axios';

const UserDirectory = () => {
  const { user } = useAuth();
  const { connected, onlineUsers } = useSocket();
  const [allUsers, setAllUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAllUsers();
    // Refresh user list every 30 seconds
    const interval = setInterval(fetchAllUsers, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchAllUsers = async () => {
    try {
      const response = await axios.get('/admin/users/directory');
      setAllUsers(response.data.users || []);
    } catch (error) {
      console.error('Error fetching user directory:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRoleName = (role) => {
    const roleNames = {
      'president': 'President',
      'vice-president': 'Vice President',
      'team-core': 'Team Core',
      'study-circle': 'Study Circle',
      'shield-circle': 'Shield Circle'
    };
    return roleNames[role] || role;
  };

  const getRoleIcon = (role) => {
    switch (role) {
      case 'president':
        return <Crown className="h-4 w-4 text-yellow-400" />;
      case 'vice-president':
        return <Shield className="h-4 w-4 text-red-400" />;
      case 'team-core':
        return <Crown className="h-4 w-4 text-blue-400" />;
      case 'study-circle':
        return <Eye className="h-4 w-4 text-green-400" />;
      case 'shield-circle':
        return <Shield className="h-4 w-4 text-purple-400" />;
      default:
        return <Users className="h-4 w-4 text-gray-400" />;
    }
  };

  const getRoleColor = (role) => {
    const colors = {
      'president': 'text-yellow-400',
      'vice-president': 'text-red-400',
      'team-core': 'text-blue-400',
      'study-circle': 'text-green-400',
      'shield-circle': 'text-purple-400'
    };
    return colors[role] || 'text-gray-400';
  };

  const isUserOnline = (userId) => {
    return onlineUsers.some(onlineUser => onlineUser.userId === userId);
  };

  const getLastActiveTime = (lastSeen) => {
    if (!lastSeen) return 'Never';
    
    const now = new Date();
    const lastSeenDate = new Date(lastSeen);
    const diffInMinutes = Math.floor((now - lastSeenDate) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays}d ago`;
  };

  // Sort users by role hierarchy, then by online status, then by username
  const sortedUsers = allUsers.sort((a, b) => {
    const roleOrder = { 'president': 5, 'vice-president': 4, 'team-core': 3, 'study-circle': 2, 'shield-circle': 1 };
    const aRoleLevel = roleOrder[a.role] || 0;
    const bRoleLevel = roleOrder[b.role] || 0;
    
    if (aRoleLevel !== bRoleLevel) return bRoleLevel - aRoleLevel;
    
    const aOnline = isUserOnline(a._id);
    const bOnline = isUserOnline(b._id);
    
    if (aOnline !== bOnline) return bOnline - aOnline;
    
    return a.username.localeCompare(b.username);
  });

  if (loading) {
    return (
      <div className="space-y-3">
        <div className="flex items-center space-x-2 mb-4">
          <Users className="h-5 w-5 text-blinders-gold" />
          <h3 className="text-lg font-semibold text-blinders-gold">User Directory</h3>
        </div>
        {[1, 2, 3].map((i) => (
          <div key={i} className="animate-pulse">
            <div className="h-16 bg-blinders-gray rounded-lg"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <Users className="h-5 w-5 text-blinders-gold" />
          <h3 className="text-lg font-semibold text-blinders-gold">User Directory</h3>
        </div>
        <span className="text-xs text-gray-400 bg-blinders-gray px-2 py-1 rounded-full">
          {allUsers.length} members
        </span>
      </div>

      {/* Users List */}
      <div className="space-y-2 max-h-96 overflow-y-auto">
        {sortedUsers.length === 0 ? (
          <div className="text-center py-6">
            <Users className="h-12 w-12 text-gray-600 mx-auto mb-3" />
            <p className="text-gray-400 text-sm">No users found</p>
          </div>
        ) : (
          sortedUsers.map((targetUser) => {
            const isOnline = isUserOnline(targetUser._id);
            const isCurrentUser = targetUser._id === user?.id;
            
            return (
              <div
                key={targetUser._id}
                className={`p-3 rounded-lg border transition-all duration-200 ${
                  isCurrentUser 
                    ? 'bg-blinders-gold/10 border-blinders-gold/30' 
                    : 'bg-blinders-gray/50 border-blinders-light-gray/30 hover:bg-blinders-gray/70'
                }`}
              >
                <div className="flex items-center space-x-3">
                  {/* Avatar */}
                  <div className="relative">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${
                      isCurrentUser ? 'bg-blinders-gold text-blinders-black' : 'bg-blinders-dark text-white'
                    }`}>
                      {targetUser.username.charAt(0).toUpperCase()}
                    </div>
                    {/* Online Status Indicator */}
                    <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-blinders-dark ${
                      isOnline ? 'bg-green-400' : 'bg-gray-500'
                    }`}></div>
                  </div>

                  {/* User Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-1">
                      <p className={`font-medium truncate ${isCurrentUser ? 'text-blinders-gold' : 'text-white'}`}>
                        {targetUser.username}
                        {isCurrentUser && <span className="text-xs ml-1">(You)</span>}
                      </p>
                      {targetUser.username === 'president-LordBandhan' && (
                        <span className="text-xs bg-yellow-500 text-black px-1.5 py-0.5 rounded-full font-semibold">
                          ADMIN
                        </span>
                      )}
                    </div>
                    
                    {/* Role */}
                    <div className="flex items-center space-x-2 mb-1">
                      {getRoleIcon(targetUser.role)}
                      <span className={`text-xs font-medium ${getRoleColor(targetUser.role)}`}>
                        {getRoleName(targetUser.role)}
                      </span>
                    </div>
                    
                    {/* Status */}
                    <div className="flex items-center space-x-2 text-xs text-gray-400">
                      {isOnline ? (
                        <>
                          <Wifi className="h-3 w-3 text-green-400" />
                          <span className="text-green-400">Online</span>
                        </>
                      ) : (
                        <>
                          <WifiOff className="h-3 w-3" />
                          <span>Offline</span>
                        </>
                      )}
                      <span>•</span>
                      <Clock className="h-3 w-3" />
                      <span>{getLastActiveTime(targetUser.lastSeen)}</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default UserDirectory;
