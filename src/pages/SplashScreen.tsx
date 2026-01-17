import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import logo from '@/assets/saleslive-logo.png';

export const SplashScreen: React.FC = () => {
  const navigate = useNavigate();
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    const timer1 = setTimeout(() => setFadeOut(true), 1500);
    const timer2 = setTimeout(() => navigate('/login', { replace: true }), 2000);
    
    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, [navigate]);

  return (
    <div
      className={`flex min-h-screen flex-col items-center justify-center bg-background transition-opacity duration-500 ${
        fadeOut ? 'opacity-0' : 'opacity-100'
      }`}
    >
      <div className="flex flex-col items-center gap-4">
        <img
          src={logo}
          alt="SalesLive"
          className="h-24 w-24 object-contain animate-pulse-slow"
        />
        <h1 className="text-3xl font-bold gradient-brand-text">SalesLive</h1>
        <p className="text-sm text-muted-foreground">Offline-first billing solution</p>
      </div>
    </div>
  );
};
