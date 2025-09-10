import React, { useState, useEffect } from 'react';
import { Users, Crown, Shield, Eye, EyeOff, ChevronDown, Trash2, UserCog } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';

const UserControlMenu = ({ user, onClose }) => {
  const [allUsers, setAllUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showPasswords, setShowPasswords] = useState({});
  const [selectedUser, setSelectedUser] = useState(null);
  const [showRoleModal, setShowRoleModal] = useState(false);

  const roleHierarchy = [
    { value: 'president', label: 'President', icon: Crown, color: 'text-yellow-500', level: 5 },
    { value: 'vice-president', label: 'Vice President', icon: Crown, color: 'text-orange-500', level: 4 },
    { value: 'team-core', label: 'Team Core', icon: Shield, color: 'text-purple-500', level: 3 },
    { value: 'study-circle', label: 'Study Circle', icon: Shield, color: 'text-green-500', level: 2 },
    { value: 'shield-circle', label: 'Shield Circle', icon: Shield, color: 'text-blue-500', level: 1 }
  ];

  useEffect(() => {
    fetchAllUsers();
  }, []);

  const fetchAllUsers = async () => {
    try {
      const response = await axios.get('/admin/users');
      setAllUsers(response.data.users || []);
    } catch (error) {
      toast.error('Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  const togglePasswordVisibility = (userId) => {
    setShowPasswords(prev => ({
      ...prev,
      [userId]: !prev[userId]
    }));
  };

  const handleRoleChange = async (userId, newRole) => {
    try {
      await axios.put(`/admin/users/${userId}/role`, { role: newRole });
      
      // Update local state
      setAllUsers(prev => prev.map(u => 
        u._id === userId ? { ...u, role: newRole } : u
      ));
      
      toast.success(`User role updated to ${roleHierarchy.find(r => r.value === newRole)?.label}`);
      setShowRoleModal(false);
      setSelectedUser(null);
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to update user role');
    }
  };

  const handleDeleteUser = async (userId, username) => {
    if (!confirm(`Are you sure you want to permanently delete user "${username}"? This action cannot be undone.`)) {
      return;
    }

    try {
      await axios.delete(`/admin/users/${userId}`);
      
      // Update local state
      setAllUsers(prev => prev.filter(u => u._id !== userId));
      
      toast.success(`User "${username}" deleted successfully`);
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to delete user');
    }
  };

  const getRoleInfo = (role) => {
    return roleHierarchy.find(r => r.value === role) || roleHierarchy[4];
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-gray-800 rounded-lg p-6">
          <div className="text-white">Loading users...</div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-gray-800 rounded-lg w-full max-w-4xl mx-4 max-h-[90vh] overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-700">
            <div className="flex items-center space-x-2">
              <Users className="h-6 w-6 text-yellow-500" />
              <h2 className="text-xl font-semibold text-white">User Management</h2>
              <span className="text-sm text-gray-400">({allUsers.length} users)</span>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* User List */}
          <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
            <div className="space-y-4">
              {allUsers.map((userData) => {
                const roleInfo = getRoleInfo(userData.role);
                const RoleIcon = roleInfo.icon;
                
                return (
                  <div key={userData._id} className="bg-gray-700 rounded-lg p-4 border border-gray-600">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <RoleIcon className={`h-5 w-5 ${roleInfo.color}`} />
                          <span className="text-white font-medium">{userData.username}</span>
                          <span className={`text-sm px-2 py-1 rounded ${roleInfo.color} bg-opacity-20`}>
                            {roleInfo.label}
                          </span>
                          {userData.status === 'pending' && (
                            <span className="text-xs px-2 py-1 rounded bg-yellow-600 text-yellow-100">
                              Pending
                            </span>
                          )}
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                          <div>
                            <span className="text-gray-400">Email:</span>
                            <p className="text-white">{userData.email}</p>
                          </div>
                          
                          <div>
                            <span className="text-gray-400">Password:</span>
                            <div className="flex items-center space-x-2">
                              <p className="text-white font-mono bg-gray-800 px-2 py-1 rounded">
                                {showPasswords[userData._id] 
                                  ? (userData.originalPassword || '••••••••') 
                                  : '••••••••'
                                }
                              </p>
                              <button
                                onClick={() => togglePasswordVisibility(userData._id)}
                                className="text-gray-400 hover:text-white"
                              >
                                {showPasswords[userData._id] ? 
                                  <EyeOff className="h-4 w-4" /> : 
                                  <Eye className="h-4 w-4" />
                                }
                              </button>
                            </div>
                          </div>
                          
                          <div>
                            <span className="text-gray-400">Joined:</span>
                            <p className="text-white">{new Date(userData.createdAt).toLocaleDateString()}</p>
                          </div>
                        </div>
                      </div>
                      
                      {/* Action Buttons */}
                      <div className="flex items-center space-x-2 ml-4">
                        <button
                          onClick={() => {
                            setSelectedUser(userData);
                            setShowRoleModal(true);
                          }}
                          className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm flex items-center space-x-1"
                        >
                          <UserCog className="h-4 w-4" />
                          <span>Change Role</span>
                        </button>
                        
                        {userData.role !== 'president' && (
                          <button
                            onClick={() => handleDeleteUser(userData._id, userData.username)}
                            className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm flex items-center space-x-1"
                          >
                            <Trash2 className="h-4 w-4" />
                            <span>Delete</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Role Change Modal */}
      {showRoleModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-60">
          <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md mx-4 border border-gray-700">
            <h3 className="text-lg font-semibold text-white mb-4">
              Change Role for {selectedUser.username}
            </h3>
            
            <div className="space-y-2 mb-6">
              {roleHierarchy.map((role) => {
                const RoleIcon = role.icon;
                return (
                  <button
                    key={role.value}
                    onClick={() => handleRoleChange(selectedUser._id, role.value)}
                    className={`w-full text-left p-3 rounded-lg border transition-colors ${
                      selectedUser.role === role.value
                        ? 'border-blue-500 bg-blue-600 bg-opacity-20'
                        : 'border-gray-600 hover:border-gray-500 hover:bg-gray-700'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <RoleIcon className={`h-5 w-5 ${role.color}`} />
                      <span className="text-white font-medium">{role.label}</span>
                      {selectedUser.role === role.value && (
                        <span className="text-xs text-blue-400">(Current)</span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
            
            <div className="flex space-x-3">
              <button
                onClick={() => {
                  setShowRoleModal(false);
                  setSelectedUser(null);
                }}
                className="flex-1 bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg"
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

export default UserControlMenu;
