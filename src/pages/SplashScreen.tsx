import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import logo from '@/assets/saleslive-logo.png';

export const SplashScreen: React.FC = () => {
  const navigate = useNavigate();
  
  // State to control the entrance and exit animations
  const [mounted, setMounted] = useState(false);
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    // 1. Trigger entrance animation immediately after mount
    const startTimer = setTimeout(() => setMounted(true), 100);

    // 2. Trigger exit animation (fade/zoom out) at 3.0 seconds
    const exitTimer = setTimeout(() => setExiting(true), 3000);

    // 3. Actually navigate away at 3.8 seconds (giving the exit animation time to finish)
    const navigateTimer = setTimeout(() => {
      navigate('/login', { replace: true });
    }, 3800);
    
    return () => {
      clearTimeout(startTimer);
      clearTimeout(exitTimer);
      clearTimeout(navigateTimer);
    };
  }, [navigate]);

  return (
    <div
      className={`flex min-h-screen flex-col items-center justify-center bg-background transition-all duration-700 ease-in-out ${
        exiting ? 'opacity-0 scale-110' : 'opacity-100 scale-100'
      }`}
    >
      <div className="flex flex-col items-center gap-6">
        {/* Logo Container with Pop-in animation */}
        <div 
          className={`relative transition-all duration-1000 ease-out transform ${
            mounted ? 'scale-100 opacity-100 translate-y-0' : 'scale-50 opacity-0 translate-y-10'
          }`}
        >
          {/* Optional: A glowing ring effect behind the logo */}
          <div className="absolute inset-0 rounded-full bg-primary/20 blur-xl animate-pulse" />
          
          <img
            src={logo}
            alt="SalesLive"
            className="relative h-28 w-28 object-contain drop-shadow-lg"
          />
        </div>

        {/* Text Container with Staggered Delay */}
        <div className="flex flex-col items-center gap-2">
          <h1 
            className={`text-4xl font-bold gradient-brand-text transition-all duration-700 delay-300 ease-out transform ${
              mounted ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
            }`}
          >
            SalesLive
          </h1>
          
          <p 
            className={`text-sm text-muted-foreground transition-all duration-700 delay-500 ease-out transform ${
              mounted ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
            }`}
          >
            Offline-first billing solution
          </p>
        </div>

        {/* Loading Indicator (Bouncing Dots) - Appears after delay */}
        <div 
          className={`flex gap-2 mt-8 transition-opacity duration-1000 delay-700 ${
            mounted ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <div className="h-2 w-2 rounded-full bg-primary animate-bounce [animation-delay:-0.3s]"></div>
          <div className="h-2 w-2 rounded-full bg-primary animate-bounce [animation-delay:-0.15s]"></div>
          <div className="h-2 w-2 rounded-full bg-primary animate-bounce"></div>
        </div>
      </div>
    </div>
  );
};