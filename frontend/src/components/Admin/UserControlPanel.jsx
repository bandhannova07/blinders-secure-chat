import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { X, UserCog, Crown, Shield, Eye, Users, Trash2, Edit3, Save, AlertTriangle } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';

const UserControlPanel = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const [allUsers, setAllUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [newRole, setNewRole] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);

  useEffect(() => {
    if (isOpen && user?.role === 'president') {
      fetchAllUsers();
    }
  }, [isOpen, user]);

  const fetchAllUsers = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/admin/users');
      setAllUsers(response.data.users || []);
    } catch (error) {
      toast.error('Failed to fetch users');
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (userId, role) => {
    try {
      await axios.put(`/admin/users/${userId}/role`, { role });
      toast.success('User role updated successfully');
      setAllUsers(prev => prev.map(u => u._id === userId ? { ...u, role } : u));
      setEditingUser(null);
      setNewRole('');
    } catch (error) {
      toast.error('Failed to update user role');
      console.error('Error updating user role:', error);
    }
  };

  const handleDeleteUser = async (userId) => {
    try {
      await axios.delete(`/admin/users/${userId}`);
      toast.success('User deleted successfully');
      setAllUsers(prev => prev.filter(u => u._id !== userId));
      setShowDeleteConfirm(null);
    } catch (error) {
      toast.error('Failed to delete user');
      console.error('Error deleting user:', error);
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
      'president': 'text-yellow-400 bg-yellow-400/10',
      'vice-president': 'text-red-400 bg-red-400/10',
      'team-core': 'text-blue-400 bg-blue-400/10',
      'study-circle': 'text-green-400 bg-green-400/10',
      'shield-circle': 'text-purple-400 bg-purple-400/10'
    };
    return colors[role] || 'text-gray-400 bg-gray-400/10';
  };

  const canEditUser = (targetUser) => {
    // President can edit everyone except themselves
    return targetUser._id !== user?.id && targetUser.username !== 'president-LordBandhan';
  };

  if (!isOpen || user?.role !== 'president') return null;

  return (
    <>
      {/* Main Panel */}
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-blinders-dark border border-blinders-light-gray rounded-lg max-w-4xl w-full mx-4 max-h-[85vh] overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-blinders-light-gray">
            <div className="flex items-center space-x-3">
              <UserCog className="h-6 w-6 text-blinders-gold" />
              <h2 className="text-xl font-bold text-blinders-gold">User Control Panel</h2>
              <span className="bg-blinders-gold text-blinders-black px-2 py-1 rounded-full text-sm font-semibold">
                {allUsers.length}
              </span>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto max-h-[70vh]">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blinders-gold"></div>
                <span className="ml-2 text-gray-300">Loading users...</span>
              </div>
            ) : allUsers.length === 0 ? (
              <div className="text-center py-8">
                <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-300 mb-2">No Users Found</h3>
                <p className="text-gray-400">No registered users in the system.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {allUsers.map((targetUser) => (
                  <div key={targetUser._id} className="bg-blinders-gray border border-blinders-light-gray rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-3">
                          <div className="w-12 h-12 bg-blinders-gold rounded-full flex items-center justify-center">
                            <span className="text-blinders-black font-bold">
                              {targetUser.username.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-1">
                              <h3 className="font-semibold text-white text-lg">{targetUser.username}</h3>
                              {targetUser.username === 'president-LordBandhan' && (
                                <span className="text-xs bg-yellow-500 text-black px-2 py-1 rounded-full font-semibold">
                                  PROTECTED
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-gray-400 mb-2">{targetUser.email}</p>
                            
                            {/* Role Display/Edit */}
                            {editingUser === targetUser._id ? (
                              <div className="flex items-center space-x-2">
                                <select
                                  value={newRole}
                                  onChange={(e) => setNewRole(e.target.value)}
                                  className="bg-blinders-black border border-blinders-light-gray rounded px-3 py-1 text-white text-sm"
                                >
                                  <option value="">Select Role</option>
                                  <option value="vice-president">Vice President</option>
                                  <option value="team-core">Team Core</option>
                                  <option value="study-circle">Study Circle</option>
                                  <option value="shield-circle">Shield Circle</option>
                                </select>
                                <button
                                  onClick={() => handleRoleChange(targetUser._id, newRole)}
                                  disabled={!newRole}
                                  className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm disabled:opacity-50"
                                >
                                  <Save className="h-3 w-3" />
                                </button>
                                <button
                                  onClick={() => {
                                    setEditingUser(null);
                                    setNewRole('');
                                  }}
                                  className="bg-gray-600 hover:bg-gray-700 text-white px-3 py-1 rounded text-sm"
                                >
                                  Cancel
                                </button>
                              </div>
                            ) : (
                              <div className={`inline-flex items-center space-x-2 px-3 py-1 rounded-full text-sm font-medium ${getRoleColor(targetUser.role)}`}>
                                {getRoleIcon(targetUser.role)}
                                <span>{getRoleName(targetUser.role)}</span>
                              </div>
                            )}
                          </div>
                        </div>
                        
                        {/* User Details */}
                        <div className="bg-blinders-black p-3 rounded-lg mb-3">
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <p className="text-gray-400 mb-1">Status:</p>
                              <span className={`px-2 py-1 rounded text-xs font-medium ${
                                targetUser.status === 'approved' ? 'bg-green-600 text-white' : 
                                targetUser.status === 'pending' ? 'bg-yellow-600 text-white' : 
                                'bg-red-600 text-white'
                              }`}>
                                {targetUser.status}
                              </span>
                            </div>
                            <div>
                              <p className="text-gray-400 mb-1">Joined:</p>
                              <p className="text-white">{new Date(targetUser.createdAt).toLocaleDateString()}</p>
                            </div>
                            {targetUser.originalPassword && (
                              <div className="col-span-2">
                                <p className="text-gray-400 mb-1">Password:</p>
                                <span className="font-mono bg-blinders-dark px-2 py-1 rounded text-blinders-gold text-sm">
                                  {targetUser.originalPassword}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      {canEditUser(targetUser) && (
                        <div className="flex flex-col space-y-2 ml-4">
                          <button
                            onClick={() => {
                              setEditingUser(targetUser._id);
                              setNewRole(targetUser.role);
                            }}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg flex items-center space-x-2 text-sm transition-colors"
                          >
                            <Edit3 className="h-4 w-4" />
                            <span>Edit Role</span>
                          </button>
                          
                          <button
                            onClick={() => setShowDeleteConfirm(targetUser._id)}
                            className="bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-lg flex items-center space-x-2 text-sm transition-colors"
                          >
                            <Trash2 className="h-4 w-4" />
                            <span>Delete</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-60">
          <div className="bg-blinders-dark border border-red-500 rounded-lg max-w-md w-full mx-4 p-6">
            <div className="flex items-center space-x-3 mb-4">
              <AlertTriangle className="h-6 w-6 text-red-400" />
              <h3 className="text-xl font-bold text-red-400">Confirm Deletion</h3>
            </div>
            
            <p className="text-gray-300 mb-6">
              Are you sure you want to permanently delete this user? This action cannot be undone.
            </p>

            <div className="flex space-x-3">
              <button
                onClick={() => handleDeleteUser(showDeleteConfirm)}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg flex-1 flex items-center justify-center space-x-2 transition-colors"
              >
                <Trash2 className="h-4 w-4" />
                <span>Delete User</span>
              </button>
              
              <button
                onClick={() => setShowDeleteConfirm(null)}
                className="bg-blinders-gray hover:bg-gray-600 text-white px-4 py-2 rounded-lg flex-1 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default UserControlPanel;
