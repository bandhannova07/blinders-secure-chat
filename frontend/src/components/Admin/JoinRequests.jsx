import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Users, Check, X, Crown, Shield, Eye, UserPlus, ArrowLeft } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';

const JoinRequests = ({ onBack }) => {
  const { user } = useAuth();
  const [pendingUsers, setPendingUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingUser, setProcessingUser] = useState(null);
  const [selectedRole, setSelectedRole] = useState('');
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  useEffect(() => {
    if (user?.role === 'president') {
      fetchPendingRequests();
    }
  }, [user]);

  const fetchPendingRequests = async () => {
    try {
      const response = await axios.get('/auth/pending-requests');
      setPendingUsers(response.data.pendingUsers);
    } catch (error) {
      toast.error('Failed to fetch pending requests');
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
        return <Users className="h-4 w-4 text-gray-400" />;
    }
  };

  if (user?.role !== 'president') {
    return (
      <div className="text-center py-8">
        <Shield className="h-16 w-16 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-400">Only the President can access join requests.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blinders-gold"></div>
        <span className="ml-2 text-gray-300">Loading requests...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <UserPlus className="h-6 w-6 text-blinders-gold" />
          <h2 className="text-2xl font-bold text-blinders-gold">Join Requests</h2>
          <span className="bg-blinders-gold text-blinders-black px-2 py-1 rounded-full text-sm font-semibold">
            {pendingUsers.length}
          </span>
        </div>
        {onBack && (
          <button
            onClick={onBack}
            className="btn-secondary flex items-center space-x-2"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back</span>
          </button>
        )}
      </div>

      {pendingUsers.length === 0 ? (
        <div className="card text-center py-8">
          <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-300 mb-2">No Pending Requests</h3>
          <p className="text-gray-400">All join requests have been processed.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {pendingUsers.map((pendingUser) => (
            <div key={pendingUser._id} className="card border border-blinders-light-gray">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
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
                  
                  <div className="bg-blinders-gray p-3 rounded-lg mb-3">
                    <p className="text-sm text-gray-300 mb-1">
                      <strong>Password:</strong> 
                      <span className="font-mono bg-blinders-black px-2 py-1 rounded ml-2">
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
                    className="btn-primary flex items-center space-x-2 px-4 py-2"
                  >
                    {processingUser === pendingUser._id ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blinders-black"></div>
                    ) : (
                      <Check className="h-4 w-4" />
                    )}
                    <span>Accept</span>
                  </button>
                  
                  <button
                    onClick={() => handleDecline(pendingUser._id)}
                    disabled={processingUser === pendingUser._id}
                    className="btn-danger flex items-center space-x-2 px-4 py-2"
                  >
                    <X className="h-4 w-4" />
                    <span>Decline</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Role Selection Modal */}
      {showRoleModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="card max-w-md w-full mx-4">
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
                className="btn-primary flex-1 flex items-center justify-center space-x-2"
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
                className="btn-secondary flex-1"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default JoinRequests;
