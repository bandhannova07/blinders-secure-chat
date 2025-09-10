import React, { useState } from 'react';
import { Eye, EyeOff, Lock, Shield } from 'lucide-react';
import toast from 'react-hot-toast';

const SecretCodeInput = ({ onSubmit, onBack, loading }) => {
  const [secretCode, setSecretCode] = useState('');
  const [showSecretCode, setShowSecretCode] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!secretCode) {
      toast.error('Please enter your secret code');
      return;
    }

    if (secretCode.length < 6) {
      toast.error('Secret code must be at least 6 characters long');
      return;
    }

    onSubmit(secretCode);
  };

  return (
    <div className="min-h-screen bg-blinders-black flex items-center justify-center p-4">
      <div className="bg-blinders-dark border border-blinders-light-gray rounded-lg p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <Shield className="h-16 w-16 text-blinders-gold" />
          </div>
          <h1 className="text-2xl font-bold text-blinders-gold mb-2">
            President Verification
          </h1>
          <p className="text-gray-400 text-sm">
            Enter your secret code to complete login
          </p>
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
                autoFocus
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
              {loading ? 'Verifying...' : 'Verify'}
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

export default SecretCodeInput;
