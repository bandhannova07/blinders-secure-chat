import React from 'react';

const BlindersLogo = ({ size = 'medium', showText = true, className = '' }) => {
  const sizeClasses = {
    small: 'w-8 h-8',
    medium: 'w-12 h-12',
    large: 'w-16 h-16',
    xl: 'w-24 h-24'
  };

  const textSizes = {
    small: 'text-lg',
    medium: 'text-xl',
    large: 'text-2xl',
    xl: 'text-4xl'
  };

  return (
    <div className={`flex items-center space-x-3 ${className}`}>
      {/* Logo Icon */}
      <div className={`${sizeClasses[size]} relative flex items-center justify-center`}>
        {/* Outer Ring */}
        <div className="absolute inset-0 rounded-full border-2 border-blinders-gold opacity-80"></div>
        
        {/* Inner Design */}
        <div className="relative flex items-center justify-center">
          {/* Crown Symbol */}
          <svg 
            className="w-3/4 h-3/4 text-blinders-gold" 
            fill="currentColor" 
            viewBox="0 0 24 24"
          >
            <path d="M5 16L3 4l5.5 5L12 4l3.5 5L21 4l-2 12H5zm2.7-2h8.6l.9-5.4-2.1 1.7L12 8l-3.1 2.3-2.1-1.7L7.7 14z"/>
          </svg>
          
          {/* Decorative Dots */}
          <div className="absolute -top-1 -right-1 w-2 h-2 bg-blinders-gold rounded-full opacity-60"></div>
          <div className="absolute -bottom-1 -left-1 w-1.5 h-1.5 bg-blinders-gold rounded-full opacity-40"></div>
        </div>
        
        {/* Glow Effect */}
        <div className="absolute inset-0 rounded-full bg-blinders-gold opacity-10 blur-sm"></div>
      </div>

      {/* Text */}
      {showText && (
        <div className="flex flex-col">
          <h1 className={`${textSizes[size]} font-bold text-blinders-gold tracking-wide`}>
            BLINDERS
          </h1>
          {size !== 'small' && (
            <p className="text-xs text-gray-400 -mt-1 tracking-widest uppercase">
              Secure Chat
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default BlindersLogo;
