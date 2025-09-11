import React, { useEffect, useState } from 'react';
import { Shield, ExternalLink } from 'lucide-react';

const LocalhostRestriction = ({ children }) => {
  const [isLocalhost, setIsLocalhost] = useState(false);
  const [isProduction, setIsProduction] = useState(false);

  useEffect(() => {
    const hostname = window.location.hostname;
    const isLocal = hostname === 'localhost' || hostname === '127.0.0.1' || hostname.startsWith('192.168.');
    const isProd = process.env.NODE_ENV === 'production' || process.env.REACT_APP_ENV === 'production';
    
    setIsLocalhost(isLocal);
    setIsProduction(isProd);
  }, []);

  // If it's localhost in production, show restriction message
  if (isLocalhost && isProduction) {
    return (
      <div className="min-h-screen bg-blinders-black flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-blinders-dark border border-blinders-gray rounded-lg p-8 text-center">
          <div className="mb-6">
            <Shield className="h-16 w-16 text-blinders-gold mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-blinders-gold mb-2">Access Restricted</h1>
            <p className="text-gray-300">
              This application cannot be accessed via localhost in production mode.
            </p>
          </div>
          
          <div className="bg-blinders-gray rounded-lg p-4 mb-6">
            <h3 className="text-white font-semibold mb-2">Security Notice</h3>
            <p className="text-sm text-gray-400">
              For security reasons, this secure chat application is restricted from running on localhost 
              in production environments. Please use the official deployed URL.
            </p>
          </div>

          <div className="space-y-3">
            <p className="text-sm text-gray-400">
              Please access the application through:
            </p>
            <a
              href="https://blinders-secure-chat.netlify.app"
              className="inline-flex items-center space-x-2 bg-blinders-gold text-blinders-black px-4 py-2 rounded-lg font-semibold hover:bg-blinders-light-gold transition-colors duration-200"
            >
              <ExternalLink className="h-4 w-4" />
              <span>Go to Official Site</span>
            </a>
          </div>

          <div className="mt-8 pt-4 border-t border-blinders-gray">
            <p className="text-xs text-gray-500">
              By order of the BLINDERS
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Otherwise, render the app normally
  return children;
};

export default LocalhostRestriction;
