import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Shield, Eye, EyeOff, Lock, Check, X } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';

const SecretCodeSetup = ({ isOpen, onClose, onComplete }) => {
  const { user } = useAuth();
  const [secretCode, setSecretCode] = useState('');
  const [confirmSecretCode, setConfirmSecretCode] = useState('');
  const [showSecretCode, setShowSecretCode] = useState(false);
  const [showConfirmSecretCode, setShowConfirmSecretCode] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSetup = async (e) => {
    e.preventDefault();
    
    if (!secretCode || !confirmSecretCode) {
      toast.error('Please fill in both fields');
      return;
    }

    if (secretCode !== confirmSecretCode) {
      toast.error('Secret codes do not match');
      return;
    }

    if (secretCode.length < 6) {
      toast.error('Secret code must be at least 6 characters long');
      return;
    }

    setLoading(true);
    try {
      await axios.post('/auth/setup-secret-code', {
        secretCode,
        confirmSecretCode
      });
      
      toast.success('Secret code setup successfully!');
      setSecretCode('');
      setConfirmSecretCode('');
      onComplete?.();
      onClose();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to setup secret code');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || user?.role !== 'president') return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-blinders-dark border border-blinders-light-gray rounded-lg max-w-md w-full mx-4 p-6">
        <div className="flex items-center space-x-3 mb-6">
          <Shield className="h-6 w-6 text-blinders-gold" />
          <h2 className="text-xl font-bold text-blinders-gold">Setup Secret Code</h2>
        </div>

        <p className="text-gray-300 mb-6">
          As President, you can setup an additional secret code for enhanced security. 
          This code will be required every time you login.
        </p>

        <form onSubmit={handleSetup} className="space-y-4">
          {/* Secret Code Input */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Secret Code
            </label>
            <div className="relative">
              <input
                type={showSecretCode ? 'text' : 'password'}
                value={secretCode}
                onChange={(e) => setSecretCode(e.target.value)}
                className="w-full px-4 py-3 bg-blinders-gray border border-blinders-light-gray rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blinders-gold focus:border-transparent"
                placeholder="Enter secret code (min 6 characters)"
                minLength={6}
                required
              />
              <button
                type="button"
                onClick={() => setShowSecretCode(!showSecretCode)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
              >
                {showSecretCode ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
          </div>

          {/* Confirm Secret Code Input */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Confirm Secret Code
            </label>
            <div className="relative">
              <input
                type={showConfirmSecretCode ? 'text' : 'password'}
                value={confirmSecretCode}
                onChange={(e) => setConfirmSecretCode(e.target.value)}
                className="w-full px-4 py-3 bg-blinders-gray border border-blinders-light-gray rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blinders-gold focus:border-transparent"
                placeholder="Confirm secret code"
                minLength={6}
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirmSecretCode(!showConfirmSecretCode)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
              >
                {showConfirmSecretCode ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
          </div>

          {/* Security Notice */}
          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <Lock className="h-5 w-5 text-yellow-400 mt-0.5" />
              <div>
                <p className="text-yellow-400 font-medium text-sm">Security Notice</p>
                <p className="text-yellow-300 text-sm mt-1">
                  Keep your secret code safe and memorable. You'll need it every time you login as President.
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-3 pt-4">
            <button
              type="submit"
              disabled={loading || !secretCode || !confirmSecretCode}
              className="bg-blinders-gold hover:bg-yellow-500 text-blinders-black px-6 py-3 rounded-lg flex-1 flex items-center justify-center space-x-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blinders-black"></div>
              ) : (
                <>
                  <Check className="h-5 w-5" />
                  <span>Setup Secret Code</span>
                </>
              )}
            </button>
            
            <button
              type="button"
              onClick={onClose}
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
  );
};

export default SecretCodeSetup;
