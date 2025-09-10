import React, { useState } from 'react';
import { Shield, Eye, EyeOff, Lock, Check } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';

const SecretCodeSetup = ({ onComplete, onSkip }) => {
  const [secretCode, setSecretCode] = useState('');
  const [confirmCode, setConfirmCode] = useState('');
  const [showCode, setShowCode] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSetup = async (e) => {
    e.preventDefault();
    
    if (secretCode.length < 6) {
      toast.error('Secret code must be at least 6 characters long');
      return;
    }

    if (secretCode !== confirmCode) {
      toast.error('Secret codes do not match');
      return;
    }

    setLoading(true);
    try {
      await axios.post('/auth/setup-secret-code', { secretCode });
      toast.success('Secret code setup successfully!');
      onComplete();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to setup secret code');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-blinders-black flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="mx-auto h-16 w-16 bg-blinders-gold rounded-full flex items-center justify-center mb-4">
            <Shield className="h-8 w-8 text-blinders-black" />
          </div>
          <h2 className="text-3xl font-bold text-white mb-2">
            Setup Secret Code
          </h2>
          <p className="text-gray-400">
            As President, you need a secret code for enhanced security
          </p>
        </div>

        <form onSubmit={handleSetup} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Secret Code
            </label>
            <div className="relative">
              <input
                type={showCode ? 'text' : 'password'}
                value={secretCode}
                onChange={(e) => setSecretCode(e.target.value)}
                className="w-full px-4 py-3 bg-blinders-gray border border-blinders-light-gray rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blinders-gold focus:border-transparent"
                placeholder="Enter your secret code"
                required
                minLength={6}
              />
              <button
                type="button"
                onClick={() => setShowCode(!showCode)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
              >
                {showCode ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Minimum 6 characters. Use a strong, memorable code.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Confirm Secret Code
            </label>
            <div className="relative">
              <input
                type={showConfirm ? 'text' : 'password'}
                value={confirmCode}
                onChange={(e) => setConfirmCode(e.target.value)}
                className="w-full px-4 py-3 bg-blinders-gray border border-blinders-light-gray rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blinders-gold focus:border-transparent"
                placeholder="Confirm your secret code"
                required
                minLength={6}
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
              >
                {showConfirm ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
            {confirmCode && (
              <div className="flex items-center mt-1">
                {secretCode === confirmCode ? (
                  <div className="flex items-center text-green-400 text-xs">
                    <Check className="h-3 w-3 mr-1" />
                    Codes match
                  </div>
                ) : (
                  <div className="text-red-400 text-xs">
                    Codes do not match
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="space-y-3">
            <button
              type="submit"
              disabled={loading || secretCode !== confirmCode || secretCode.length < 6}
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-blinders-black bg-blinders-gold hover:bg-yellow-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blinders-gold disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blinders-black mr-2"></div>
                  Setting up...
                </div>
              ) : (
                <div className="flex items-center">
                  <Lock className="h-4 w-4 mr-2" />
                  Setup Secret Code
                </div>
              )}
            </button>

            <button
              type="button"
              onClick={onSkip}
              className="w-full py-3 px-4 border border-blinders-light-gray rounded-lg text-sm font-medium text-gray-300 hover:text-white hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors"
            >
              Skip for now
            </button>
          </div>
        </form>

        <div className="bg-blinders-gray rounded-lg p-4 border border-blinders-light-gray">
          <div className="flex items-start space-x-3">
            <Shield className="h-5 w-5 text-blinders-gold flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-medium text-white mb-1">
                Enhanced Security
              </h4>
              <p className="text-xs text-gray-400">
                Your secret code adds an extra layer of security to your President account. 
                It will be required along with your password for future logins.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SecretCodeSetup;
