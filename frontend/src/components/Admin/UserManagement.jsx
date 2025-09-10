import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Plus, Edit, Trash2, Ban, UserCheck, Crown, Sword, Key, BookOpen, Shield } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';

const UserManagement = () => {
  const { user: currentUser, register } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newUser, setNewUser] = useState({
    username: '',
    email: '',
    password: '',
    role: 'shield-circle'
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
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const response = await axios.get('/admin/users');
      setUsers(response.data.users);
    } catch (error) {
      toast.error('Failed to load users');
      console.error('Error loading users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    try {
      await register(newUser);
      setShowCreateModal(false);
      setNewUser({ username: '', email: '', password: '', role: 'shield-circle' });
      loadUsers();
    } catch (error) {
      console.error('Error creating user:', error);
    }
  };

  const handleUpdateRole = async (userId, newRole) => {
    try {
      await axios.put(`/admin/users/${userId}/role`, { role: newRole });
      toast.success('User role updated successfully');
      loadUsers();
    } catch (error) {
      toast.error('Failed to update user role');
      console.error('Error updating role:', error);
    }
  };

  const handleBanUser = async (userId, banned) => {
    try {
      await axios.put(`/admin/users/${userId}/ban`, { banned });
      toast.success(`User ${banned ? 'banned' : 'unbanned'} successfully`);
      loadUsers();
    } catch (error) {
      toast.error(`Failed to ${banned ? 'ban' : 'unban'} user`);
      console.error('Error banning user:', error);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      try {
        await axios.delete(`/admin/users/${userId}`);
        toast.success('User deleted successfully');
        loadUsers();
      } catch (error) {
        toast.error('Failed to delete user');
        console.error('Error deleting user:', error);
      }
    }
  };

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
          <h2 className="text-2xl font-bold text-blinders-gold">User Management</h2>
          <p className="text-gray-400">Manage users and their roles in the Blinders hierarchy</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="btn-primary flex items-center space-x-2"
        >
          <Plus className="h-5 w-5" />
          <span>Create User</span>
        </button>
      </div>

      {/* Users Table */}
      <div className="card">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-blinders-gray">
                <th className="text-left py-3 px-4 font-semibold text-gray-300">User</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-300">Role</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-300">Status</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-300">Created</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-300">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} className="border-b border-blinders-gray/50 hover:bg-blinders-gray/30">
                  <td className="py-3 px-4">
                    <div className="flex items-center space-x-3">
                      <div className="text-xl">{roleEmojis[user.role]}</div>
                      <div>
                        <p className="font-semibold text-white">{user.username}</p>
                        <p className="text-sm text-gray-400">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <select
                      value={user.role}
                      onChange={(e) => handleUpdateRole(user.id, e.target.value)}
                      disabled={user.id === currentUser?.id || (currentUser?.role !== 'president' && ['president', 'vice-president'].includes(user.role))}
                      className="input-field text-sm"
                    >
                      <option value="shield-circle">Shield Circle</option>
                      <option value="study-circle">Study Circle</option>
                      <option value="team-core">Team Core</option>
                      {currentUser?.role === 'president' && (
                        <>
                          <option value="vice-president">Vice President</option>
                          <option value="president">President</option>
                        </>
                      )}
                    </select>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center space-x-2">
                      <div className={`w-2 h-2 rounded-full ${user.isBanned ? 'bg-red-400' : user.isActive ? 'bg-green-400' : 'bg-gray-400'}`}></div>
                      <span className="text-sm text-gray-300">
                        {user.isBanned ? 'Banned' : user.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <p className="text-sm text-gray-400">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </p>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center space-x-2">
                      {user.id !== currentUser?.id && (
                        <>
                          <button
                            onClick={() => handleBanUser(user.id, !user.isBanned)}
                            disabled={currentUser?.role !== 'president' && user.role === 'president'}
                            className={`p-2 rounded-lg transition-colors duration-200 ${
                              user.isBanned 
                                ? 'bg-green-600 hover:bg-green-700 text-white' 
                                : 'bg-red-600 hover:bg-red-700 text-white'
                            }`}
                            title={user.isBanned ? 'Unban User' : 'Ban User'}
                          >
                            {user.isBanned ? <UserCheck className="h-4 w-4" /> : <Ban className="h-4 w-4" />}
                          </button>
                          
                          {currentUser?.role === 'president' && (
                            <button
                              onClick={() => handleDeleteUser(user.id)}
                              className="p-2 rounded-lg bg-red-600 hover:bg-red-700 text-white transition-colors duration-200"
                              title="Delete User"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create User Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-blinders-dark border border-blinders-gray rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-xl font-bold text-blinders-gold mb-4">Create New User</h3>
            
            <form onSubmit={handleCreateUser} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Username</label>
                <input
                  type="text"
                  value={newUser.username}
                  onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
                  className="input-field w-full"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Email</label>
                <input
                  type="email"
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                  className="input-field w-full"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Password</label>
                <input
                  type="password"
                  value={newUser.password}
                  onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                  className="input-field w-full"
                  required
                  minLength="6"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Role</label>
                <select
                  value={newUser.role}
                  onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                  className="input-field w-full"
                >
                  <option value="shield-circle">Shield Circle</option>
                  <option value="study-circle">Study Circle</option>
                  <option value="team-core">Team Core</option>
                  {currentUser?.role === 'president' && (
                    <>
                      <option value="vice-president">Vice President</option>
                      <option value="president">President</option>
                    </>
                  )}
                </select>
              </div>
              
              <div className="flex space-x-3 pt-4">
                <button type="submit" className="btn-primary flex-1">
                  Create User
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

export default UserManagement;
