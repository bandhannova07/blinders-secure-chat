import React, { useState } from 'react';
import { Shield, Eye, EyeOff, Lock, ArrowRight } from 'lucide-react';

const SecretCodeLogin = ({ onSubmit, loading, error }) => {
  const [secretCode, setSecretCode] = useState('');
  const [showSecretCode, setShowSecretCode] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (secretCode.trim()) {
      onSubmit(secretCode);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blinders-black via-blinders-dark to-blinders-gray flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <Shield className="h-12 w-12 text-blinders-gold" />
          </div>
          <h1 className="text-3xl font-bold text-blinders-gold mb-2">President Security</h1>
          <p className="text-gray-400">Enter your secret code to continue</p>
        </div>

        {/* Secret Code Form */}
        <div className="bg-blinders-dark border border-blinders-light-gray rounded-lg p-6 shadow-xl">
          <form onSubmit={handleSubmit} className="space-y-6">
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
                  placeholder="Enter your secret code"
                  required
                  autoFocus
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

            {/* Error Message */}
            {error && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3">
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}

            {/* Security Notice */}
            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <Lock className="h-5 w-5 text-yellow-400 mt-0.5" />
                <div>
                  <p className="text-yellow-400 font-medium text-sm">Enhanced Security</p>
                  <p className="text-yellow-300 text-sm mt-1">
                    This additional security step is required for President access.
                  </p>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || !secretCode.trim()}
              className="w-full bg-blinders-gold hover:bg-yellow-500 text-blinders-black px-6 py-3 rounded-lg flex items-center justify-center space-x-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blinders-black"></div>
              ) : (
                <>
                  <span>Continue</span>
                  <ArrowRight className="h-5 w-5" />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Footer */}
        <div className="text-center mt-8">
          <p className="text-xs text-gray-500">
            By order of the BLINDERS
          </p>
        </div>
      </div>
    </div>
  );
};

export default SecretCodeLogin;
