import React, { useState, useContext } from 'react';
import { AuthContext } from '../../contexts/AuthContext';
import axios from 'axios';
import toast from 'react-hot-toast';

const Settings = ({ onClose }) => {
  const { user, updateUser } = useContext(AuthContext);
  const [newUsername, setNewUsername] = useState(user?.username || '');
  const [isLoading, setIsLoading] = useState(false);

  const handleUsernameChange = async (e) => {
    e.preventDefault();
    
    if (!newUsername.trim() || newUsername.trim().length < 3) {
      toast.error('Username must be at least 3 characters long');
      return;
    }

    if (newUsername.trim() === user.username) {
      toast.error('Please enter a different username');
      return;
    }

    setIsLoading(true);
    
    try {
      const token = localStorage.getItem('token');
      const response = await axios.put(
        `${import.meta.env.VITE_API_URL}/api/auth/change-username`,
        { newUsername: newUsername.trim() },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      // Update user context
      updateUser({ ...user, username: newUsername.trim() });
      
      toast.success('Username updated successfully!');
      setNewUsername(newUsername.trim());
    } catch (error) {
      console.error('Username change error:', error);
      toast.error(error.response?.data?.error || 'Failed to update username');
    } finally {
      setIsLoading(false);
    }
  };

  const getRoleDisplayName = (role) => {
    const roleNames = {
      'president': 'President',
      'vice-president': 'Vice President',
      'team-core': 'Team Core',
      'study-circle': 'Study Circle',
      'shield-circle': 'Shield Circle'
    };
    return roleNames[role] || role;
  };

  const getRoleEmoji = (role) => {
    const emojis = {
      'president': '👑',
      'vice-president': '⚔️',
      'team-core': '🔑',
      'study-circle': '📚',
      'shield-circle': '🛡️'
    };
    return emojis[role] || '👤';
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-blinders-dark rounded-lg p-6 w-full max-w-md mx-4">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-blinders-gold">Settings</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* User Info */}
        <div className="mb-6 p-4 bg-blinders-gray rounded-lg">
          <div className="flex items-center space-x-3 mb-2">
            <span className="text-2xl">{getRoleEmoji(user?.role)}</span>
            <div>
              <h3 className="font-semibold text-white">{user?.username}</h3>
              <p className="text-sm text-gray-400">{getRoleDisplayName(user?.role)}</p>
            </div>
          </div>
        </div>

        {/* Username Change Form */}
        <form onSubmit={handleUsernameChange} className="space-y-4">
          <div>
            <label htmlFor="newUsername" className="block text-sm font-medium text-gray-300 mb-2">
              Change Username
            </label>
            <input
              type="text"
              id="newUsername"
              value={newUsername}
              onChange={(e) => setNewUsername(e.target.value)}
              className="w-full px-3 py-2 bg-blinders-gray border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blinders-gold focus:border-transparent"
              placeholder="Enter new username"
              minLength={3}
              maxLength={30}
              disabled={isLoading}
            />
            <p className="text-xs text-gray-500 mt-1">
              Username must be 3-30 characters long
            </p>
          </div>

          <div className="flex space-x-3">
            <button
              type="submit"
              disabled={isLoading || !newUsername.trim() || newUsername.trim() === user?.username}
              className="flex-1 bg-blinders-gold text-blinders-dark py-2 px-4 rounded-md font-medium hover:bg-yellow-400 focus:outline-none focus:ring-2 focus:ring-blinders-gold focus:ring-offset-2 focus:ring-offset-blinders-dark disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? 'Updating...' : 'Update Username'}
            </button>
            
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-600 text-white py-2 px-4 rounded-md font-medium hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 focus:ring-offset-blinders-dark transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>

        {/* Additional Settings Placeholder */}
        <div className="mt-6 pt-6 border-t border-gray-600">
          <h4 className="text-sm font-medium text-gray-300 mb-3">Account Information</h4>
          <div className="space-y-2 text-sm text-gray-400">
            <p>Role: {getRoleDisplayName(user?.role)}</p>
            <p>Member since: {new Date(user?.createdAt).toLocaleDateString()}</p>
            <p>Last active: {new Date(user?.lastSeen).toLocaleString()}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
