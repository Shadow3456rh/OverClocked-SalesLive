import React from 'react';
import { Wifi, WifiOff } from 'lucide-react';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';

export const StatusBanner: React.FC = () => {
  const isOnline = useOnlineStatus();

  return (
    <div
      className={`flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium ${
        isOnline ? 'bg-success text-success-foreground' : 'bg-destructive text-destructive-foreground'
      }`}
    >
      {isOnline ? (
        <>
          <Wifi className="h-4 w-4" />
          <span>Online - Ready to sync</span>
        </>
      ) : (
        <>
          <WifiOff className="h-4 w-4" />
          <span>Offline - Changes saved locally</span>
        </>
      )}
    </div>
  );
};
