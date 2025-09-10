import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Eye, EyeOff, Shield, Crown } from 'lucide-react';
import toast from 'react-hot-toast';
import SecretCodeSetup from './SecretCodeSetup';
import SecretCodeInput from './SecretCodeInput';

const Login = () => {
  const { login, signup } = useAuth();
  const [isSignup, setIsSignup] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    twoFactorToken: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [requiresTwoFactor, setRequiresTwoFactor] = useState(false);
  const [pendingApproval, setPendingApproval] = useState(false);
  const [requiresSecretCode, setRequiresSecretCode] = useState(false);
  const [requiresSecretCodeSetup, setRequiresSecretCodeSetup] = useState(false);
  const [loginCredentials, setLoginCredentials] = useState({ username: '', password: '' });

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
      if (isSignup) {
        const result = await signup(formData.username, formData.email, formData.password);
        if (result.user.status === 'pending') {
          setPendingApproval(true);
          toast.success('Signup successful! Please wait for President approval.');
        } else if (result.user.isPresident) {
          toast.success('Welcome, President! You are now logged in.');
        }
      } else {
        const result = await login(
          formData.username, 
          formData.password, 
          requiresTwoFactor ? formData.twoFactorToken : null
        );

        if (result.requiresTwoFactor) {
          setRequiresTwoFactor(true);
          toast.success('Enter your 2FA code to continue');
        } else if (result.requiresSecretCode) {
          setLoginCredentials({ username: formData.username, password: formData.password });
          setRequiresSecretCode(true);
          toast.success('Enter your secret code to continue');
        } else if (result.requiresSecretCodeSetup) {
          setLoginCredentials({ username: formData.username, password: formData.password });
          setRequiresSecretCodeSetup(true);
          toast.success('Please set up your secret code');
        }
      }
    } catch (error) {
      console.error('Auth error:', error);
      if (error.message.includes('pending')) {
        setPendingApproval(true);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSecretCodeSubmit = async (secretCode) => {
    setLoading(true);
    try {
      await login(loginCredentials.username, loginCredentials.password, null, secretCode);
      toast.success('Welcome, President!');
    } catch (error) {
      console.error('Secret code login error:', error);
      toast.error(error.message || 'Invalid secret code');
    } finally {
      setLoading(false);
    }
  };

  const handleSecretCodeSetupComplete = () => {
    setRequiresSecretCodeSetup(false);
    setRequiresSecretCode(false);
    setFormData({ username: '', email: '', password: '', twoFactorToken: '' });
    setLoginCredentials({ username: '', password: '' });
    toast.success('Secret code setup completed! Please login again.');
  };

  const handleBackToLogin = () => {
    setRequiresSecretCode(false);
    setRequiresSecretCodeSetup(false);
    setRequiresTwoFactor(false);
    setLoginCredentials({ username: '', password: '' });
  };

  const toggleMode = () => {
    setIsSignup(!isSignup);
    setFormData({ username: '', email: '', password: '', twoFactorToken: '' });
    setRequiresTwoFactor(false);
    setPendingApproval(false);
  };

  // Show secret code setup screen
  if (requiresSecretCodeSetup) {
    return (
      <SecretCodeSetup
        username={loginCredentials.username}
        password={loginCredentials.password}
        onSetupComplete={handleSecretCodeSetupComplete}
        onBack={handleBackToLogin}
      />
    );
  }

  // Show secret code input screen
  if (requiresSecretCode) {
    return (
      <SecretCodeInput
        onSubmit={handleSecretCodeSubmit}
        onBack={handleBackToLogin}
        loading={loading}
      />
    );
  }

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
            {isSignup ? 'Join the Blinders' : 'By order of the BLINDERS'}
          </p>
        </div>

        {/* Auth Form */}
        <div className="card glow-gold">
          {pendingApproval ? (
            <div className="text-center py-8">
              <div className="mb-4">
                <Shield className="h-16 w-16 text-yellow-500 mx-auto mb-4" />
              </div>
              <h3 className="text-xl font-semibold text-blinders-gold mb-2">
                Awaiting Approval
              </h3>
              <p className="text-gray-300 mb-4">
                Please wait, your request is pending President's approval.
              </p>
              <button
                onClick={() => setPendingApproval(false)}
                className="btn-secondary"
              >
                Back to Login
              </button>
            </div>
          ) : (
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

            {isSignup && (
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="input-field w-full"
                  placeholder="Enter your email"
                  required
                  disabled={loading}
                />
              </div>
            )}

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
                  <span>{isSignup ? 'Join the Blinders' : 'Enter the Blinders'}</span>
                </>
              )}
            </button>

            {/* Toggle between Login and Signup */}
            <div className="mt-6 text-center">
              <button
                type="button"
                onClick={toggleMode}
                className="text-blinders-gold hover:text-yellow-400 text-sm font-medium transition-colors"
              >
                {isSignup ? 'Already have an account? Login here' : 'New to Blinders? Sign up here'}
              </button>
            </div>
            </form>
          )}
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
