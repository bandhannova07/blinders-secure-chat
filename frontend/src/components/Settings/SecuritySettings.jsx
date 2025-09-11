import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Shield, Lock, Key, Eye, EyeOff, Check, X, AlertTriangle } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import SecretCodeSetup from '../Auth/SecretCodeSetup';

const SecuritySettings = () => {
  const { user } = useAuth();
  const [showSecretCodeSetup, setShowSecretCodeSetup] = useState(false);
  const [showDisableModal, setShowDisableModal] = useState(false);
  const [disablePassword, setDisablePassword] = useState('');
  const [showDisablePassword, setShowDisablePassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleDisableSecretCode = async (e) => {
    e.preventDefault();
    
    if (!disablePassword) {
      toast.error('Please enter your password');
      return;
    }

    setLoading(true);
    try {
      await axios.post('/auth/disable-secret-code', {
        password: disablePassword
      });
      
      toast.success('Secret code disabled successfully');
      setShowDisableModal(false);
      setDisablePassword('');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to disable secret code');
    } finally {
      setLoading(false);
    }
  };

  if (user?.role !== 'president') {
    return (
      <div className="bg-blinders-dark border border-blinders-light-gray rounded-lg p-6">
        <div className="flex items-center space-x-3 mb-4">
          <Shield className="h-6 w-6 text-blinders-gold" />
          <h2 className="text-xl font-bold text-blinders-gold">Security Settings</h2>
        </div>
        <p className="text-gray-400">Security settings are only available to the President.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Two-Factor Authentication Section */}
      <div className="bg-blinders-dark border border-blinders-light-gray rounded-lg p-6">
        <div className="flex items-center space-x-3 mb-4">
          <Shield className="h-6 w-6 text-blinders-gold" />
          <h2 className="text-xl font-bold text-blinders-gold">Two-Factor Authentication</h2>
        </div>

        <div className="space-y-4">
          {/* Secret Code 2FA */}
          <div className="bg-blinders-gray rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Key className="h-5 w-5 text-yellow-400" />
                <div>
                  <h3 className="font-semibold text-white">Secret Code</h3>
                  <p className="text-sm text-gray-400">
                    Additional security layer for President login
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                {user.secretCodeEnabled ? (
                  <>
                    <span className="text-green-400 text-sm font-medium">Enabled</span>
                    <button
                      onClick={() => setShowDisableModal(true)}
                      className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm transition-colors"
                    >
                      Disable
                    </button>
                  </>
                ) : (
                  <>
                    <span className="text-gray-400 text-sm font-medium">Disabled</span>
                    <button
                      onClick={() => setShowSecretCodeSetup(true)}
                      className="bg-blinders-gold hover:bg-yellow-500 text-blinders-black px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
                    >
                      Setup
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Security Notice */}
          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <AlertTriangle className="h-5 w-5 text-yellow-400 mt-0.5" />
              <div>
                <p className="text-yellow-400 font-medium text-sm">Security Recommendation</p>
                <p className="text-yellow-300 text-sm mt-1">
                  Enable secret code for enhanced security. This adds an extra layer of protection to your President account.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Account Security Section */}
      <div className="bg-blinders-dark border border-blinders-light-gray rounded-lg p-6">
        <div className="flex items-center space-x-3 mb-4">
          <Lock className="h-6 w-6 text-blinders-gold" />
          <h2 className="text-xl font-bold text-blinders-gold">Account Security</h2>
        </div>

        <div className="space-y-4">
          <div className="bg-blinders-gray rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-white">Password</h3>
                <p className="text-sm text-gray-400">
                  Last changed: Never (Default password in use)
                </p>
              </div>
              <button className="bg-blinders-gold hover:bg-yellow-500 text-blinders-black px-4 py-2 rounded-lg text-sm font-semibold transition-colors">
                Change Password
              </button>
            </div>
          </div>

          <div className="bg-blinders-gray rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-white">Login Sessions</h3>
                <p className="text-sm text-gray-400">
                  Manage active login sessions
                </p>
              </div>
              <button className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg text-sm transition-colors">
                View Sessions
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Secret Code Setup Modal */}
      <SecretCodeSetup
        isOpen={showSecretCodeSetup}
        onClose={() => setShowSecretCodeSetup(false)}
        onComplete={() => {
          // Refresh user data or update state as needed
          window.location.reload();
        }}
      />

      {/* Disable Secret Code Modal */}
      {showDisableModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-blinders-dark border border-blinders-light-gray rounded-lg max-w-md w-full mx-4 p-6">
            <div className="flex items-center space-x-3 mb-6">
              <AlertTriangle className="h-6 w-6 text-red-400" />
              <h2 className="text-xl font-bold text-red-400">Disable Secret Code</h2>
            </div>

            <p className="text-gray-300 mb-6">
              Are you sure you want to disable the secret code? This will reduce the security of your President account.
            </p>

            <form onSubmit={handleDisableSecretCode} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Confirm with your password
                </label>
                <div className="relative">
                  <input
                    type={showDisablePassword ? 'text' : 'password'}
                    value={disablePassword}
                    onChange={(e) => setDisablePassword(e.target.value)}
                    className="w-full px-4 py-3 bg-blinders-gray border border-blinders-light-gray rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    placeholder="Enter your password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowDisablePassword(!showDisablePassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                  >
                    {showDisablePassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="submit"
                  disabled={loading || !disablePassword}
                  className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg flex-1 flex items-center justify-center space-x-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  ) : (
                    <>
                      <Check className="h-5 w-5" />
                      <span>Disable Secret Code</span>
                    </>
                  )}
                </button>
                
                <button
                  type="button"
                  onClick={() => {
                    setShowDisableModal(false);
                    setDisablePassword('');
                  }}
                  disabled={loading}
                  className="bg-blinders-gray hover:bg-gray-600 text-white px-6 py-3 rounded-lg flex items-center justify-center space-x-2 transition-colors disabled:opacity-50"
                >
                  <X className="h-5 w-5" />
                  <span>Cancel</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SecuritySettings;
