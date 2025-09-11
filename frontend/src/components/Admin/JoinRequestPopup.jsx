import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { X, Check, UserPlus, Crown, Shield, Eye } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';

const JoinRequestPopup = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const [pendingUsers, setPendingUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [processingUser, setProcessingUser] = useState(null);
  const [selectedRole, setSelectedRole] = useState('');
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  useEffect(() => {
    if (isOpen && user?.role === 'president') {
      fetchPendingRequests();
    }
  }, [isOpen, user]);

  // Listen for real-time join request updates
  useEffect(() => {
    const handleRefresh = () => {
      if (isOpen && user?.role === 'president') {
        fetchPendingRequests();
      }
    };

    window.addEventListener('refreshJoinRequests', handleRefresh);
    return () => window.removeEventListener('refreshJoinRequests', handleRefresh);
  }, [isOpen, user]);

  // Poll for new requests every 10 seconds when popup is open
  useEffect(() => {
    if (!isOpen || user?.role !== 'president') return;

    const interval = setInterval(() => {
      fetchPendingRequests();
    }, 10000);

    return () => clearInterval(interval);
  }, [isOpen, user]);

  const fetchPendingRequests = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/auth/pending-requests');
      setPendingUsers(response.data.pendingUsers);
    } catch (error) {
      console.error('Error fetching pending requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = (user) => {
    setSelectedUser(user);
    setShowRoleModal(true);
    setSelectedRole('shield-circle'); // Default role
  };

  const confirmApproval = async () => {
    if (!selectedUser || !selectedRole) return;

    setProcessingUser(selectedUser._id);
    try {
      await axios.post('/auth/approve-user', {
        userId: selectedUser._id,
        assignedRole: selectedRole
      });
      
      toast.success(`${selectedUser.username} approved and assigned to ${getRoleName(selectedRole)}`);
      setPendingUsers(prev => prev.filter(u => u._id !== selectedUser._id));
      setShowRoleModal(false);
      setSelectedUser(null);
      setSelectedRole('');
    } catch (error) {
      toast.error('Failed to approve user');
      console.error('Error approving user:', error);
    } finally {
      setProcessingUser(null);
    }
  };

  const handleDecline = async (userId) => {
    setProcessingUser(userId);
    try {
      await axios.post('/auth/decline-user', { userId });
      toast.success('User request declined');
      setPendingUsers(prev => prev.filter(u => u._id !== userId));
    } catch (error) {
      toast.error('Failed to decline user');
      console.error('Error declining user:', error);
    } finally {
      setProcessingUser(null);
    }
  };

  const getRoleName = (role) => {
    const roleNames = {
      'team-core': 'Team Core',
      'study-circle': 'Study Circle',
      'shield-circle': 'Shield Circle'
    };
    return roleNames[role] || role;
  };

  const getRoleIcon = (role) => {
    switch (role) {
      case 'team-core':
        return <Crown className="h-4 w-4 text-blinders-gold" />;
      case 'study-circle':
        return <Eye className="h-4 w-4 text-blue-400" />;
      case 'shield-circle':
        return <Shield className="h-4 w-4 text-green-400" />;
      default:
        return <UserPlus className="h-4 w-4 text-gray-400" />;
    }
  };

  if (!isOpen || user?.role !== 'president') return null;

  return (
    <>
      {/* Main Popup */}
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-blinders-dark border border-blinders-light-gray rounded-lg max-w-2xl w-full mx-4 max-h-[80vh] overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-blinders-light-gray">
            <div className="flex items-center space-x-3">
              <UserPlus className="h-6 w-6 text-blinders-gold" />
              <h2 className="text-xl font-bold text-blinders-gold">Join Requests</h2>
              <span className="bg-blinders-gold text-blinders-black px-2 py-1 rounded-full text-sm font-semibold">
                {pendingUsers.length}
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
          <div className="p-6 overflow-y-auto max-h-[60vh]">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blinders-gold"></div>
                <span className="ml-2 text-gray-300">Loading requests...</span>
              </div>
            ) : pendingUsers.length === 0 ? (
              <div className="text-center py-8">
                <UserPlus className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-300 mb-2">No Pending Requests</h3>
                <p className="text-gray-400 mb-4">All join requests have been processed.</p>
                <button
                  onClick={onClose}
                  className="bg-blinders-gold hover:bg-yellow-500 text-blinders-black px-4 py-2 rounded-lg transition-colors"
                >
                  Close
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {pendingUsers.map((pendingUser) => (
                  <div key={pendingUser._id} className="bg-blinders-gray border border-blinders-light-gray rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-3">
                          <div className="w-10 h-10 bg-blinders-gold rounded-full flex items-center justify-center">
                            <span className="text-blinders-black font-bold text-sm">
                              {pendingUser.username.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <h3 className="font-semibold text-white">{pendingUser.username}</h3>
                            <p className="text-sm text-gray-400">{pendingUser.email}</p>
                          </div>
                        </div>
                        
                        <div className="bg-blinders-black p-3 rounded-lg mb-3">
                          <p className="text-sm text-gray-300 mb-1">
                            <strong>Password:</strong> 
                            <span className="font-mono bg-blinders-dark px-2 py-1 rounded ml-2 text-blinders-gold">
                              {pendingUser.originalPassword}
                            </span>
                          </p>
                          <p className="text-xs text-gray-400">
                            Requested: {new Date(pendingUser.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>

                      <div className="flex space-x-2 ml-4">
                        <button
                          onClick={() => handleApprove(pendingUser)}
                          disabled={processingUser === pendingUser._id}
                          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors disabled:opacity-50"
                        >
                          {processingUser === pendingUser._id ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          ) : (
                            <Check className="h-4 w-4" />
                          )}
                          <span>Accept</span>
                        </button>
                        
                        <button
                          onClick={() => handleDecline(pendingUser._id)}
                          disabled={processingUser === pendingUser._id}
                          className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors disabled:opacity-50"
                        >
                          <X className="h-4 w-4" />
                          <span>Decline</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
                
                {/* Close Button at Bottom */}
                <div className="flex justify-center pt-4 border-t border-blinders-light-gray">
                  <button
                    onClick={onClose}
                    className="bg-blinders-gray hover:bg-blinders-light-gray text-white px-6 py-2 rounded-lg transition-colors"
                  >
                    Close Panel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Role Selection Modal */}
      {showRoleModal && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-60">
          <div className="bg-blinders-dark border border-blinders-light-gray rounded-lg max-w-md w-full mx-4 p-6">
            <h3 className="text-xl font-bold text-blinders-gold mb-4">
              Assign Role to {selectedUser?.username}
            </h3>
            
            <div className="space-y-3 mb-6">
              {['team-core', 'study-circle', 'shield-circle'].map((role) => (
                <label key={role} className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="radio"
                    name="role"
                    value={role}
                    checked={selectedRole === role}
                    onChange={(e) => setSelectedRole(e.target.value)}
                    className="text-blinders-gold focus:ring-blinders-gold"
                  />
                  <div className="flex items-center space-x-2">
                    {getRoleIcon(role)}
                    <span className="text-white">{getRoleName(role)}</span>
                  </div>
                </label>
              ))}
            </div>

            <div className="flex space-x-3">
              <button
                onClick={confirmApproval}
                disabled={!selectedRole || processingUser}
                className="bg-blinders-gold hover:bg-yellow-500 text-blinders-black px-4 py-2 rounded-lg flex-1 flex items-center justify-center space-x-2 transition-colors disabled:opacity-50"
              >
                {processingUser ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blinders-black"></div>
                ) : (
                  <UserPlus className="h-4 w-4" />
                )}
                <span>Hire</span>
              </button>
              
              <button
                onClick={() => {
                  setShowRoleModal(false);
                  setSelectedUser(null);
                  setSelectedRole('');
                }}
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

export default JoinRequestPopup;
