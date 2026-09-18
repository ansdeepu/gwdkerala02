// src/components/shared/OfflineDraftBanner.tsx
"use client";

import React from 'react';
import { WifiOff, Wifi, RefreshCw, HardDriveUpload, CheckCircle2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useOfflineFieldDraft } from '@/hooks/useOfflineFieldDraft';

export interface OfflineDraftBannerProps {
  formId?: string;
  className?: string;
  onSyncRequest?: () => void;
}

export function OfflineDraftBanner({ formId, className = "", onSyncRequest }: OfflineDraftBannerProps) {
  const { isOnline, pendingDrafts, syncPendingDrafts } = useOfflineFieldDraft();

  if (isOnline && pendingDrafts.length === 0) {
    return null;
  }

  return (
    <div className={`w-full p-2.5 rounded-lg border text-xs shadow-2xs transition-all flex flex-wrap items-center justify-between gap-2 ${
      !isOnline
        ? 'bg-amber-500/10 border-amber-500/30 text-amber-800 dark:text-amber-300'
        : 'bg-blue-500/10 border-blue-500/30 text-blue-800 dark:text-blue-300'
    } ${className}`}>
      <div className="flex items-center gap-2 min-w-0">
        {!isOnline ? (
          <>
            <WifiOff className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0 animate-pulse" />
            <div>
              <span className="font-semibold">Offline Mode (Field Draft Active)</span>
              <p className="text-[11px] opacity-80">Edits are saved locally on device and will sync automatically upon network reconnection.</p>
            </div>
          </>
        ) : (
          <>
            <Wifi className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <div>
              <span className="font-semibold">Back Online</span>
              <p className="text-[11px] opacity-80">{pendingDrafts.length} offline draft(s) stored locally on device.</p>
            </div>
          </>
        )}
      </div>

      <div className="flex items-center gap-2 ml-auto shrink-0">
        {pendingDrafts.length > 0 && (
          <Badge variant="outline" className="text-[10px] font-mono px-2 py-0.5 gap-1">
            <HardDriveUpload className="h-3 w-3" />
            {pendingDrafts.length} Local Drafts
          </Badge>
        )}
        {isOnline && pendingDrafts.length > 0 && (
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => {
              syncPendingDrafts();
              if (onSyncRequest) onSyncRequest();
            }}
            className="h-7 text-[11px] gap-1 px-2.5"
          >
            <RefreshCw className="h-3 w-3" /> Sync Now
          </Button>
        )}
      </div>
    </div>
  );
}

export default OfflineDraftBanner;
