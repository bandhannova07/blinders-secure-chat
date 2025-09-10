import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { User, Lock, Bell, Shield, Save, X } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';

const Settings = ({ onClose }) => {
  const { user, updateUser } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(false);
  
  // Profile settings
  const [username, setUsername] = useState(user?.username || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const roleEmojis = {
    'president': '👑',
    'vice-president': '⚔️',
    'team-core': '🔑',
    'study-circle': '📚',
    'shield-circle': '🛡️'
  };

  const handleUsernameChange = async (e) => {
    e.preventDefault();
    if (!username.trim()) {
      toast.error('Username cannot be empty');
      return;
    }

    if (username === user.username) {
      toast.error('New username must be different from current username');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.put('/auth/update-username', {
        username: username.trim()
      });

      if (response.data.success) {
        updateUser({ ...user, username: username.trim() });
        toast.success('Username updated successfully');
      }
    } catch (error) {
      console.error('Error updating username:', error);
      toast.error(error.response?.data?.error || 'Failed to update username');
      setUsername(user.username); // Reset to original
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error('All password fields are required');
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }

    if (newPassword.length < 6) {
      toast.error('New password must be at least 6 characters long');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.put('/auth/change-password', {
        currentPassword,
        newPassword
      });

      if (response.data.success) {
        toast.success('Password changed successfully');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      }
    } catch (error) {
      console.error('Error changing password:', error);
      toast.error(error.response?.data?.error || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'security', label: 'Security', icon: Lock },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'privacy', label: 'Privacy', icon: Shield }
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-blinders-dark border border-blinders-gray rounded-lg w-full max-w-4xl h-[80vh] flex overflow-hidden">
        {/* Sidebar */}
        <div className="w-64 bg-blinders-black border-r border-blinders-gray p-4">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-blinders-gold">Settings</h2>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-blinders-gray transition-colors duration-200"
            >
              <X className="h-5 w-5 text-gray-400" />
            </button>
          </div>

          <div className="space-y-2">
            {tabs.map((tab) => {
              const IconComponent = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center space-x-3 p-3 rounded-lg transition-all duration-200 ${
                    activeTab === tab.id
                      ? 'bg-blinders-gold text-blinders-black'
                      : 'text-gray-300 hover:bg-blinders-gray'
                  }`}
                >
                  <IconComponent className="h-5 w-5" />
                  <span className="font-medium">{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 p-6 overflow-y-auto">
          {activeTab === 'profile' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-2xl font-bold text-white mb-2">Profile Settings</h3>
                <p className="text-gray-400">Manage your account information and preferences.</p>
              </div>

              {/* Current User Info */}
              <div className="bg-blinders-gray rounded-lg p-4 border border-blinders-light-gray">
                <div className="flex items-center space-x-4">
                  <div className="text-4xl">{roleEmojis[user?.role]}</div>
                  <div>
                    <h4 className="text-lg font-semibold text-white">{user?.username}</h4>
                    <p className="text-sm text-gray-400 capitalize">
                      {user?.role?.replace('-', ' ')}
                    </p>
                  </div>
                </div>
              </div>

              {/* Username Change */}
              <div className="bg-blinders-gray rounded-lg p-6 border border-blinders-light-gray">
                <h4 className="text-lg font-semibold text-white mb-4">Change Username</h4>
                <form onSubmit={handleUsernameChange} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      New Username
                    </label>
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="input-field w-full"
                      placeholder="Enter new username"
                      disabled={loading}
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={loading || username === user?.username}
                    className="btn-primary flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Save className="h-4 w-4" />
                    <span>{loading ? 'Updating...' : 'Update Username'}</span>
                  </button>
                </form>
              </div>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-2xl font-bold text-white mb-2">Security Settings</h3>
                <p className="text-gray-400">Manage your password and security preferences.</p>
              </div>

              {/* Password Change */}
              <div className="bg-blinders-gray rounded-lg p-6 border border-blinders-light-gray">
                <h4 className="text-lg font-semibold text-white mb-4">Change Password</h4>
                <form onSubmit={handlePasswordChange} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Current Password
                    </label>
                    <input
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      className="input-field w-full"
                      placeholder="Enter current password"
                      disabled={loading}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      New Password
                    </label>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="input-field w-full"
                      placeholder="Enter new password"
                      disabled={loading}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Confirm New Password
                    </label>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="input-field w-full"
                      placeholder="Confirm new password"
                      disabled={loading}
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="btn-primary flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Lock className="h-4 w-4" />
                    <span>{loading ? 'Changing...' : 'Change Password'}</span>
                  </button>
                </form>
              </div>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-2xl font-bold text-white mb-2">Notification Settings</h3>
                <p className="text-gray-400">Configure how you receive notifications.</p>
              </div>

              <div className="bg-blinders-gray rounded-lg p-6 border border-blinders-light-gray">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-white font-medium">Message Notifications</h4>
                      <p className="text-sm text-gray-400">Get notified when you receive new messages</p>
                    </div>
                    <input type="checkbox" className="toggle" defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-white font-medium">Join Request Notifications</h4>
                      <p className="text-sm text-gray-400">Get notified about new join requests (President only)</p>
                    </div>
                    <input type="checkbox" className="toggle" defaultChecked disabled={user?.role !== 'president'} />
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'privacy' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-2xl font-bold text-white mb-2">Privacy Settings</h3>
                <p className="text-gray-400">Control your privacy and data settings.</p>
              </div>

              <div className="bg-blinders-gray rounded-lg p-6 border border-blinders-light-gray">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-white font-medium">Message Encryption</h4>
                      <p className="text-sm text-gray-400">All messages are encrypted end-to-end</p>
                    </div>
                    <span className="text-green-400 font-medium">Enabled</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-white font-medium">Online Status</h4>
                      <p className="text-sm text-gray-400">Show when you're online to other users</p>
                    </div>
                    <input type="checkbox" className="toggle" defaultChecked />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Settings;
