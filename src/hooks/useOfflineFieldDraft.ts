// src/hooks/useOfflineFieldDraft.ts
"use client";

import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';

export interface OfflineDraftInfo {
  key: string;
  data: any;
  savedAt: string;
  fileNo?: string;
  applicantName?: string;
}

export function useOfflineFieldDraft(formKeyPrefix: string = 'gwd_field_draft_') {
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [pendingDrafts, setPendingDrafts] = useState<OfflineDraftInfo[]>([]);
  const { toast } = useToast();

  const loadPendingDrafts = useCallback(() => {
    if (typeof window === 'undefined') return;
    try {
      const drafts: OfflineDraftInfo[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(formKeyPrefix)) {
          const raw = localStorage.getItem(key);
          if (raw) {
            drafts.push(JSON.parse(raw));
          }
        }
      }
      setPendingDrafts(drafts);
    } catch (err) {
      console.error("Error reading offline drafts:", err);
    }
  }, [formKeyPrefix]);

  const syncPendingDrafts = useCallback(async () => {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('gwd-sync-offline-drafts'));
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    setIsOnline(navigator.onLine);

    const handleOnline = () => {
      setIsOnline(true);
      toast({
        title: "Network Connection Restored",
        description: "Back online! Auto-syncing field drafts to cloud...",
      });
      syncPendingDrafts();
    };

    const handleOffline = () => {
      setIsOnline(false);
      toast({
        title: "Offline Mode Active",
        description: "Network disconnected. Field edits will be saved locally on device.",
        variant: "destructive",
      });
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    loadPendingDrafts();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [loadPendingDrafts, syncPendingDrafts, toast]);

  const saveOfflineDraft = useCallback((draftId: string, data: any, metadata?: { fileNo?: string; applicantName?: string }) => {
    if (typeof window === 'undefined') return;
    const fullKey = `${formKeyPrefix}${draftId}`;
    const draftItem: OfflineDraftInfo = {
      key: fullKey,
      data,
      savedAt: new Date().toISOString(),
      fileNo: metadata?.fileNo || data.fileNo,
      applicantName: metadata?.applicantName || data.applicantName,
    };

    try {
      localStorage.setItem(fullKey, JSON.stringify(draftItem));
      loadPendingDrafts();
      
      if (!navigator.onLine) {
        toast({
          title: "Offline Draft Saved",
          description: `Form saved locally on phone. Will sync automatically when network returns.`,
        });
      }
    } catch (err) {
      console.error("Error saving offline draft:", err);
    }
  }, [formKeyPrefix, loadPendingDrafts, toast]);

  const removeOfflineDraft = useCallback((draftId: string) => {
    if (typeof window === 'undefined') return;
    const fullKey = `${formKeyPrefix}${draftId}`;
    try {
      localStorage.removeItem(fullKey);
      loadPendingDrafts();
    } catch (err) {
      console.error("Error clearing offline draft:", err);
    }
  }, [formKeyPrefix, loadPendingDrafts]);

  const syncPendingDrafts = useCallback(async () => {
    // Triggers custom sync event if listeners registered
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('gwd-sync-offline-drafts'));
    }
  }, []);

  return {
    isOnline,
    pendingDrafts,
    saveOfflineDraft,
    removeOfflineDraft,
    syncPendingDrafts,
  };
}
