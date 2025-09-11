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
            className="w-full h-full" 
            viewBox="0 0 120 120"
            fill="none"
          >
            <defs>
              <radialGradient id="goldGradient" cx="50%" cy="30%" r="70%">
                <stop offset="0%" stopColor="#FFD700" stopOpacity="1" />
                <stop offset="50%" stopColor="#D4AF37" stopOpacity="1" />
                <stop offset="100%" stopColor="#B8860B" stopOpacity="1" />
              </radialGradient>
              
              <linearGradient id="crownGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#FFD700" stopOpacity="1" />
                <stop offset="50%" stopColor="#D4AF37" stopOpacity="1" />
                <stop offset="100%" stopColor="#B8860B" stopOpacity="1" />
              </linearGradient>
              
              <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
                <feDropShadow dx="2" dy="4" stdDeviation="3" floodColor="#000000" floodOpacity="0.3"/>
              </filter>
              
              <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
                <feMerge> 
                  <feMergeNode in="coloredBlur"/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>
            </defs>
            
            <circle cx="60" cy="60" r="50" fill="url(#goldGradient)" opacity="0.15" filter="url(#glow)"/>
            <circle cx="60" cy="60" r="48" fill="none" stroke="url(#goldGradient)" strokeWidth="2" opacity="0.6"/>
            <circle cx="60" cy="60" r="42" fill="none" stroke="#D4AF37" strokeWidth="3" opacity="0.9"/>
            
            <path d="M30 75 L25 45 L40 58 L60 40 L80 58 L95 45 L90 75 Z" 
                  fill="url(#crownGradient)" 
                  filter="url(#shadow)" 
                  opacity="0.95"/>
            
            <path d="M35 70 L85 70 L87 55 L75 65 L60 50 L45 65 L33 55 Z" 
                  fill="#FFD700" 
                  opacity="0.8"/>
            
            <circle cx="45" cy="62" r="2" fill="#FF6B6B" opacity="0.8"/>
            <circle cx="60" cy="58" r="2.5" fill="#4ECDC4" opacity="0.8"/>
            <circle cx="75" cy="62" r="2" fill="#45B7D1" opacity="0.8"/>
            
            <polygon points="40,58 45,45 50,58" fill="url(#crownGradient)" opacity="0.9"/>
            <polygon points="55,50 60,35 65,50" fill="url(#crownGradient)" opacity="0.9"/>
            <polygon points="70,58 75,45 80,58" fill="url(#crownGradient)" opacity="0.9"/>
            
            <circle cx="85" cy="35" r="3" fill="#D4AF37" opacity="0.7" filter="url(#glow)"/>
            <circle cx="35" cy="85" r="2.5" fill="#D4AF37" opacity="0.6" filter="url(#glow)"/>
            <circle cx="90" cy="80" r="2" fill="#FFD700" opacity="0.5"/>
            <circle cx="30" cy="40" r="1.5" fill="#FFD700" opacity="0.4"/>
            
            <path d="M20 60 Q30 50, 40 60" stroke="#D4AF37" strokeWidth="2" fill="none" opacity="0.6"/>
            <path d="M80 60 Q90 50, 100 60" stroke="#D4AF37" strokeWidth="2" fill="none" opacity="0.6"/>
            
            <circle cx="60" cy="55" r="8" fill="none" stroke="#FFD700" strokeWidth="1" opacity="0.4"/>
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
