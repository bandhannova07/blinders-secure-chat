import React, { useState } from 'react';
import Login from './Login';
import SecretCodeSetup from './SecretCodeSetup';
import { useAuth } from '../../contexts/AuthContext';

const AuthWrapper = () => {
  const { user } = useAuth();
  const [showSecretCodeSetup, setShowSecretCodeSetup] = useState(false);

  const handleLoginSuccess = (result) => {
    if (result.needsSecretCodeSetup) {
      setShowSecretCodeSetup(true);
    }
  };

  const handleSecretCodeSetupComplete = () => {
    setShowSecretCodeSetup(false);
  };

  const handleSecretCodeSetupSkip = () => {
    setShowSecretCodeSetup(false);
  };

  if (showSecretCodeSetup) {
    return (
      <SecretCodeSetup 
        onComplete={handleSecretCodeSetupComplete}
        onSkip={handleSecretCodeSetupSkip}
      />
    );
  }

  return <Login onLoginSuccess={handleLoginSuccess} />;
};

export default AuthWrapper;
