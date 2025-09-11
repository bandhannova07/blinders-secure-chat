import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useSocket } from '../../contexts/SocketContext';
import { Menu, X, Crown, Shield, LogOut, Settings, Users, UserPlus, Database, UserCog } from 'lucide-react';

const Header = ({ toggleSidebar, sidebarOpen, onShowJoinRequests, onShowSettings, onShowMediaManagement, onShowUserControl }) => {
  const { logout, user } = useAuth();
  const { connected } = useSocket();

  const getRoleIcon = (role) => {
    const icons = {
      'president': '👑',
      'vice-president': '⚔️',
      'team-core': '🔑',
      'study-circle': '📚',
      'shield-circle': '🛡️'
    };
    return icons[role] || '👤';
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

  return (
    <header className="bg-blinders-dark border-b border-blinders-gray px-4 py-3 flex items-center justify-between">
      {/* Left Side */}
      <div className="flex items-center space-x-4">
        {/* Menu Button */}
        <button
          onClick={toggleSidebar}
          className="p-2 rounded-lg hover:bg-blinders-gray transition-colors duration-200"
        >
          {sidebarOpen ? (
            <X className="h-6 w-6 text-blinders-gold" />
          ) : (
            <Menu className="h-6 w-6 text-blinders-gold" />
          )}
        </button>

        {/* Logo */}
        <div className="flex items-center space-x-2">
          <Crown className="h-8 w-8 text-blinders-gold" />
          <div>
            <h1 className="text-xl font-bold text-blinders-gold">Blinders</h1>
            <p className="text-xs text-gray-400 -mt-1">Secure Chat</p>
          </div>
        </div>

        {/* Connection Status */}
        <div className="flex items-center space-x-2">
          <div className={`w-2 h-2 rounded-full ${connected ? 'bg-green-400' : 'bg-red-400'}`}></div>
          <span className="text-sm text-gray-400">
            {connected ? 'Connected' : 'Disconnected'}
          </span>
        </div>
      </div>

      {/* Right Side */}
      <div className="flex items-center space-x-4">
        {/* President Controls */}
        {user?.role === 'president' && (
          <div className="flex items-center space-x-2">
            <button
              onClick={onShowJoinRequests}
              className="flex items-center space-x-2 px-3 py-2 rounded-lg bg-blinders-gray hover:bg-blinders-light-gray transition-colors duration-200"
            >
              <UserPlus className="h-4 w-4 text-blinders-gold" />
              <span className="text-sm text-white">Join Requests</span>
            </button>
            <button
              onClick={onShowUserControl}
              className="flex items-center space-x-2 px-3 py-2 rounded-lg bg-blinders-gray hover:bg-blinders-light-gray transition-colors duration-200"
            >
              <UserCog className="h-4 w-4 text-blinders-gold" />
              <span className="text-sm text-white">User Control</span>
            </button>
          </div>
        )}

        {/* User Info */}
        <div className="flex items-center space-x-3">
          <div className="text-right">
            <div className="flex items-center space-x-2">
              <span className="text-sm font-semibold text-white">{user?.username}</span>
              <span className="text-lg">{getRoleIcon(user?.role)}</span>
            </div>
            <p className={`text-xs capitalize ${getRoleColor(user?.role)}`}>
              {user?.role?.replace('-', ' ')}
            </p>
          </div>

          {/* Settings Dropdown */}
          <div className="relative group">
            <button className="p-2 rounded-lg hover:bg-blinders-gray transition-colors duration-200">
              <Settings className="h-5 w-5 text-gray-400" />
            </button>
            
            {/* Dropdown Menu */}
            <div className="absolute right-0 mt-2 w-48 bg-blinders-dark border border-blinders-gray rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
              <div className="py-2">
                <button
                  onClick={onShowSettings}
                  className="flex items-center space-x-2 w-full px-4 py-2 text-sm text-white hover:bg-blinders-gray transition-colors duration-200"
                >
                  <Settings className="w-4 h-4" />
                  <span>Settings</span>
                </button>
                {user?.role === 'president' && (
                  <button
                    onClick={onShowMediaManagement}
                    className="flex items-center space-x-2 w-full px-4 py-2 text-sm text-white hover:bg-blinders-gray transition-colors duration-200"
                  >
                    <Database className="w-4 h-4" />
                    <span>Media Management</span>
                  </button>
                )}
                <button
                  onClick={logout}
                  className="flex items-center space-x-2 w-full px-4 py-2 text-sm text-red-400 hover:bg-blinders-gray transition-colors duration-200"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Logout</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
