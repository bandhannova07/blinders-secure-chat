import React, { useState } from 'react';
import { Eye, EyeOff, Lock, Shield, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import axios from 'axios';

const SecretCodeSetup = ({ username, password, onSetupComplete, onBack }) => {
  const [secretCode, setSecretCode] = useState('');
  const [confirmSecretCode, setConfirmSecretCode] = useState('');
  const [showSecretCode, setShowSecretCode] = useState(false);
  const [showConfirmCode, setShowConfirmCode] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!secretCode || !confirmSecretCode) {
      toast.error('Please fill in all fields');
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
      const response = await axios.post('/auth/setup-secret-code', {
        username,
        password,
        secretCode,
        confirmSecretCode
      });

      if (response.data.success) {
        toast.success('Secret code setup completed successfully!');
        onSetupComplete();
      } else {
        toast.error(response.data.error || 'Setup failed');
      }
    } catch (error) {
      console.error('Secret code setup error:', error);
      toast.error(error.response?.data?.error || 'Setup failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-blinders-black flex items-center justify-center p-4">
      <div className="bg-blinders-dark border border-blinders-light-gray rounded-lg p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <Shield className="h-16 w-16 text-blinders-gold" />
          </div>
          <h1 className="text-2xl font-bold text-blinders-gold mb-2">
            President Security Setup
          </h1>
          <p className="text-gray-400 text-sm">
            Set up your secret code for enhanced security
          </p>
        </div>

        <div className="bg-yellow-900 bg-opacity-20 border border-yellow-600 rounded-lg p-4 mb-6">
          <div className="flex items-start space-x-3">
            <AlertCircle className="h-5 w-5 text-yellow-500 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-yellow-200">
              <p className="font-medium mb-1">Important Security Notice</p>
              <p>Your secret code provides additional security for the President account. Keep it safe and don't share it with anyone.</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="secretCode" className="block text-sm font-medium text-gray-300 mb-2">
              Secret Code
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                id="secretCode"
                type={showSecretCode ? 'text' : 'password'}
                value={secretCode}
                onChange={(e) => setSecretCode(e.target.value)}
                className="w-full pl-10 pr-12 py-3 bg-blinders-gray border border-blinders-light-gray rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blinders-gold focus:border-transparent"
                placeholder="Enter your secret code"
                minLength={6}
                required
              />
              <button
                type="button"
                onClick={() => setShowSecretCode(!showSecretCode)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-300"
              >
                {showSecretCode ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
          </div>

          <div>
            <label htmlFor="confirmSecretCode" className="block text-sm font-medium text-gray-300 mb-2">
              Confirm Secret Code
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                id="confirmSecretCode"
                type={showConfirmCode ? 'text' : 'password'}
                value={confirmSecretCode}
                onChange={(e) => setConfirmSecretCode(e.target.value)}
                className="w-full pl-10 pr-12 py-3 bg-blinders-gray border border-blinders-light-gray rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blinders-gold focus:border-transparent"
                placeholder="Confirm your secret code"
                minLength={6}
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirmCode(!showConfirmCode)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-300"
              >
                {showConfirmCode ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
          </div>

          <div className="flex space-x-4">
            <button
              type="button"
              onClick={onBack}
              className="flex-1 py-3 px-4 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors duration-200"
              disabled={loading}
            >
              Back
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-3 px-4 bg-blinders-gold text-blinders-black font-semibold rounded-lg hover:bg-yellow-500 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Setting up...' : 'Complete Setup'}
            </button>
          </div>
        </form>

        <div className="mt-6 text-center">
          <p className="text-xs text-gray-500">
            By order of the BLINDERS
          </p>
        </div>
      </div>
    </div>
  );
};

export default SecretCodeSetup;
