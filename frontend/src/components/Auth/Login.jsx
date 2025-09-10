import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Eye, EyeOff, Shield, Crown } from 'lucide-react';
import toast from 'react-hot-toast';

const Login = () => {
  const { login } = useAuth();
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    twoFactorToken: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [requiresTwoFactor, setRequiresTwoFactor] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const result = await login(
        formData.username, 
        formData.password, 
        requiresTwoFactor ? formData.twoFactorToken : null
      );

      if (result.requiresTwoFactor) {
        setRequiresTwoFactor(true);
        toast.success('Enter your 2FA code to continue');
      }
    } catch (error) {
      console.error('Login error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blinders-black via-blinders-dark to-blinders-gray">
      <div className="max-w-md w-full mx-4">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <Crown className="h-12 w-12 text-blinders-gold mr-2" />
            <Shield className="h-12 w-12 text-blinders-gold" />
          </div>
          <h1 className="text-4xl font-bold text-blinders-gold mb-2 text-shadow">
            Blinders Secure Chat
          </h1>
          <p className="text-gray-400">
            By order of the Peaky Blinders
          </p>
        </div>

        {/* Login Form */}
        <div className="card glow-gold">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-300 mb-2">
                Username
              </label>
              <input
                type="text"
                id="username"
                name="username"
                value={formData.username}
                onChange={handleChange}
                className="input-field w-full"
                placeholder="Enter your username"
                required
                disabled={loading}
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="input-field w-full pr-10"
                  placeholder="Enter your password"
                  required
                  disabled={loading}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400" />
                  )}
                </button>
              </div>
            </div>

            {requiresTwoFactor && (
              <div className="animate-fade-in">
                <label htmlFor="twoFactorToken" className="block text-sm font-medium text-gray-300 mb-2">
                  Two-Factor Authentication Code
                </label>
                <input
                  type="text"
                  id="twoFactorToken"
                  name="twoFactorToken"
                  value={formData.twoFactorToken}
                  onChange={handleChange}
                  className="input-field w-full"
                  placeholder="Enter 6-digit code"
                  maxLength="6"
                  required
                  disabled={loading}
                />
                <p className="text-xs text-gray-400 mt-1">
                  Enter the code from your authenticator app
                </p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full flex items-center justify-center space-x-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blinders-black"></div>
                  <span>Authenticating...</span>
                </>
              ) : (
                <>
                  <Shield className="h-5 w-5" />
                  <span>Enter the Blinders</span>
                </>
              )}
            </button>
          </form>

          {/* Default Credentials Info */}
          <div className="mt-6 p-4 bg-blinders-gray rounded-lg border border-blinders-light-gray">
            <h3 className="text-sm font-semibold text-blinders-gold mb-2">Default Credentials:</h3>
            <div className="text-xs text-gray-300 space-y-1">
              <p><strong>Username:</strong> president</p>
              <p><strong>Password:</strong> BlindersPresident123!</p>
              <p className="text-gray-400 mt-2">
                Use these credentials to access the system as President and create other users.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-8 text-gray-400 text-sm">
          <p>Secure • Encrypted • Hierarchical</p>
        </div>
      </div>
    </div>
  );
};

export default Login;
