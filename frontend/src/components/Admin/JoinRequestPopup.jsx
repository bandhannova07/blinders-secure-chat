import React, { useState } from 'react';
import { X, Crown, UserCheck, UserX, Shield } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';

const JoinRequestPopup = ({ request, onClose, onApprove, onDecline }) => {
  const [selectedRole, setSelectedRole] = useState('shield-circle');
  const [loading, setLoading] = useState(false);

  const roleOptions = [
    { value: 'shield-circle', label: 'Shield Circle', icon: Shield, color: 'text-blue-500' },
    { value: 'study-circle', label: 'Study Circle', icon: Shield, color: 'text-green-500' },
    { value: 'team-core', label: 'Team Core', icon: Shield, color: 'text-purple-500' },
    { value: 'vice-president', label: 'Vice President', icon: Crown, color: 'text-orange-500' }
  ];

  const handleApprove = async () => {
    try {
      setLoading(true);
      await axios.post('/auth/approve-user', {
        userId: request._id,
        assignedRole: selectedRole
      });
      
      toast.success(`User approved as ${roleOptions.find(r => r.value === selectedRole)?.label}`);
      onApprove(request._id, selectedRole);
      onClose();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to approve user');
    } finally {
      setLoading(false);
    }
  };

  const handleDecline = async () => {
    try {
      setLoading(true);
      await axios.post('/auth/decline-user', {
        userId: request._id
      });
      
      toast.success('User request declined');
      onDecline(request._id);
      onClose();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to decline user');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md mx-4 border border-gray-700">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-2">
            <Crown className="h-5 w-5 text-yellow-500" />
            <h3 className="text-lg font-semibold text-white">New Join Request</h3>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* User Details */}
        <div className="mb-6 space-y-3">
          <div className="bg-gray-700 rounded-lg p-4">
            <div className="space-y-2">
              <div>
                <span className="text-gray-400 text-sm">Username:</span>
                <p className="text-white font-medium">{request.username}</p>
              </div>
              <div>
                <span className="text-gray-400 text-sm">Email:</span>
                <p className="text-white">{request.email}</p>
              </div>
              <div>
                <span className="text-gray-400 text-sm">Password:</span>
                <p className="text-white font-mono bg-gray-800 px-2 py-1 rounded">
                  {request.originalPassword}
                </p>
              </div>
              <div>
                <span className="text-gray-400 text-sm">Requested:</span>
                <p className="text-white">{new Date(request.createdAt).toLocaleString()}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Role Selection */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Assign Role:
          </label>
          <select
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value)}
            className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {roleOptions.map((role) => (
              <option key={role.value} value={role.value}>
                {role.label}
              </option>
            ))}
          </select>
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-3">
          <button
            onClick={handleApprove}
            disabled={loading}
            className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-green-800 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2"
          >
            <UserCheck className="h-4 w-4" />
            <span>{loading ? 'Approving...' : 'Approve'}</span>
          </button>
          
          <button
            onClick={handleDecline}
            disabled={loading}
            className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-red-800 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2"
          >
            <UserX className="h-4 w-4" />
            <span>{loading ? 'Declining...' : 'Decline'}</span>
          </button>
        </div>

        {/* Close Button */}
        <div className="mt-4">
          <button
            onClick={onClose}
            className="w-full bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default JoinRequestPopup;
