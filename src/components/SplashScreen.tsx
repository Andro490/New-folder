import React from 'react';
import darkLogoImg from '../assets/darkk.png';

export default function SplashScreen() {
  return (
    <div 
      className="fixed inset-0 flex flex-col items-center justify-center z-[9999] overflow-hidden"
      style={{ 
        backgroundColor: '#0a0a0a',
        backgroundImage: 'radial-gradient(circle at center, #1a1a1a 0%, #000000 100%)'
      }}
    >
      <style>
        {`
          @keyframes loadingBar {
            0% { width: 0%; left: 0%; }
            50% { width: 100%; left: 0%; }
            100% { width: 0%; left: 100%; }
          }
          .animate-loading-bar {
            animation: loadingBar 2s ease-in-out infinite;
            position: absolute;
          }
          @keyframes fadeLogo {
            0%, 100% { opacity: 0.5; transform: scale(0.98); }
            50% { opacity: 1; transform: scale(1.02); }
          }
          .animate-fade-logo {
            animation: fadeLogo 3s ease-in-out infinite;
          }
        `}
      </style>

      {/* Background glow */}
      <div 
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[250px] h-[250px] md:w-[400px] md:h-[400px] rounded-full blur-[100px] opacity-20 pointer-events-none"
        style={{ backgroundColor: '#f5c842' }}
      />
      
      <div className="relative z-10 flex flex-col items-center">
        <img 
          src={darkLogoImg} 
          alt="Loading..." 
          className="w-32 md:w-48 h-auto object-contain drop-shadow-2xl animate-fade-logo mb-10"
        />
        
        {/* Loading bar */}
        <div className="w-48 md:w-64 h-[2px] bg-gray-800 rounded-full overflow-hidden relative shadow-[0_0_10px_rgba(245,200,66,0.2)]">
          <div className="top-0 h-full bg-[#f5c842] rounded-full animate-loading-bar shadow-[0_0_15px_#f5c842]" />
        </div>
        
        <p className="mt-8 text-[#888888] text-[10px] uppercase tracking-[0.4em] font-bold animate-pulse">
          Loading Experience
        </p>
      </div>
    </div>
  );
}
