import React from 'react';
import { WifiOff, RefreshCw } from 'lucide-react';

interface OfflineBannerProps {
  isOnline: boolean;
  queuedCount: number;
  onSyncNow?: () => void;
  isSyncing?: boolean;
}

export const OfflineBanner: React.FC<OfflineBannerProps> = ({
  isOnline,
  queuedCount,
  onSyncNow,
  isSyncing,
}) => {
  if (isOnline && queuedCount === 0) return null;

  if (!isOnline) {
    return (
      <div className="bg-amber-500 text-white px-4 py-2 text-xs font-medium shadow-sm transition-all flex items-center justify-between">
        <div className="flex items-center gap-2 max-w-2xl">
          <WifiOff className="w-4 h-4 shrink-0 animate-pulse" />
          <span>
            <strong>Offline Mode:</strong> You are currently offline. All timetable updates are securely saved to your device and will automatically sync across your devices once back online.
            {queuedCount > 0 && ` (${queuedCount} pending change${queuedCount > 1 ? 's' : ''})`}
          </span>
        </div>
        {onSyncNow && (
          <button
            onClick={onSyncNow}
            disabled={isSyncing}
            className="flex items-center gap-1.5 px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-semibold shrink-0 transition"
          >
            <RefreshCw className={`w-3 h-3 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>Retry Connection</span>
          </button>
        )}
      </div>
    );
  }

  // Back online with pending items
  if (queuedCount > 0) {
    return (
      <div className="bg-indigo-600 text-white px-4 py-2 text-xs font-medium shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-2">
          <RefreshCw className={`w-4 h-4 shrink-0 ${isSyncing ? 'animate-spin' : ''}`} />
          <span>Back online! Synchronizing {queuedCount} offline change{queuedCount > 1 ? 's' : ''} to all your devices...</span>
        </div>
        {onSyncNow && (
          <button
            onClick={onSyncNow}
            disabled={isSyncing}
            className="px-2.5 py-1 bg-indigo-700 hover:bg-indigo-800 rounded-lg text-xs font-semibold transition"
          >
            {isSyncing ? 'Syncing...' : 'Sync Now'}
          </button>
        )}
      </div>
    );
  }

  return null;
};
