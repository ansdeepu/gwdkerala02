// src/components/shared/VerifyDatabaseModal.tsx
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  CheckCircle2,
  Database,
  RefreshCw,
  Clock,
  HardDrive,
  ShieldCheck,
  AlertCircle,
  FileText,
  Layers,
} from 'lucide-react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { format } from 'date-fns';

interface VerifyDatabaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  fileId?: string | null;
  officeLocation?: string;
  fileNo?: string;
  localFormData?: any;
}

export default function VerifyDatabaseModal({
  isOpen,
  onClose,
  fileId,
  officeLocation = 'kollam',
  fileNo,
  localFormData,
}: VerifyDatabaseModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [cloudData, setCloudData] = useState<any | null>(null);
  const [lastFetchedAt, setLastFetchedAt] = useState<Date | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const fetchLiveDatabaseRecord = useCallback(async () => {
    if (!fileId) {
      setFetchError("No database document ID found (file must be saved first).");
      return;
    }

    setIsLoading(true);
    setFetchError(null);

    try {
      const effectiveOffice = (officeLocation || 'kollam').toLowerCase();
      const docPath = `offices/${effectiveOffice}/fileEntries/${fileId}`;
      const docRef = doc(db, docPath);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        // Fallback: try other office paths if not found
        const altOffices = ['kollam', 'thiruvananthapuram', 'kozhikode', 'malappuram', 'ernakulam', 'palakkad', 'thrissur', 'kottayam', 'alappuzha', 'pathanamthitta', 'idukki', 'wayanad', 'kannur', 'kasaragod'];
        let found = false;
        for (const alt of altOffices) {
          if (alt === effectiveOffice) continue;
          const altRef = doc(db, `offices/${alt}/fileEntries/${fileId}`);
          const altSnap = await getDoc(altRef);
          if (altSnap.exists()) {
            setCloudData({ ...altSnap.data(), _id: altSnap.id, _path: `offices/${alt}/fileEntries/${fileId}` });
            found = true;
            break;
          }
        }
        if (!found) {
          setFetchError(`Document not found in database path: ${docPath}`);
        }
      } else {
        setCloudData({ ...docSnap.data(), _id: docSnap.id, _path: docPath });
      }
      setLastFetchedAt(new Date());
    } catch (err: any) {
      console.error("Error fetching live database record:", err);
      setFetchError(err.message || "Failed to query Cloud Firestore.");
    } finally {
      setIsLoading(false);
    }
  }, [fileId, officeLocation]);

  useEffect(() => {
    if (isOpen) {
      fetchLiveDatabaseRecord();
    } else {
      setCloudData(null);
      setFetchError(null);
    }
  }, [isOpen, fetchLiveDatabaseRecord]);

  const parseFirestoreTimestamp = (val: any) => {
    if (!val) return 'N/A';
    if (val.toDate && typeof val.toDate === 'function') {
      return format(val.toDate(), 'dd/MM/yyyy, hh:mm:ss a');
    }
    if (val.seconds) {
      return format(new Date(val.seconds * 1000), 'dd/MM/yyyy, hh:mm:ss a');
    }
    try {
      return format(new Date(val), 'dd/MM/yyyy, hh:mm:ss a');
    } catch {
      return String(val);
    }
  };

  const formatDateToDDMMYYYY = (val: any) => {
    if (!val) return '';
    try {
      const d = new Date(val);
      if (isNaN(d.getTime())) return String(val);
      return format(d, 'dd/MM/yyyy');
    } catch {
      return String(val);
    }
  };

  const cloudSites = cloudData?.siteDetails || [];

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col p-0 overflow-hidden">
        <DialogHeader className="p-6 pb-4 border-b bg-muted/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div>
                <DialogTitle className="text-lg font-bold">Cloud Firestore Database Verification</DialogTitle>
                <DialogDescription className="text-xs">
                  Live verification directly against Cloud Firestore storage
                </DialogDescription>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchLiveDatabaseRecord}
              disabled={isLoading}
              className="h-8 text-xs gap-1.5"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {isLoading && (
            <div className="py-12 text-center text-muted-foreground flex flex-col items-center gap-3">
              <RefreshCw className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm font-medium">Querying Cloud Firestore backend...</p>
            </div>
          )}

          {fetchError && (
            <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive flex items-start gap-3">
              <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold text-sm">Database Read Error</h4>
                <p className="text-xs mt-1">{fetchError}</p>
              </div>
            </div>
          )}

          {!isLoading && !fetchError && cloudData && (
            <>
              {/* Database Document Summary Card */}
              <Card className="border-emerald-200 dark:border-emerald-800/60 bg-emerald-50/40 dark:bg-emerald-950/20">
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-xs font-semibold text-emerald-800 dark:text-emerald-300">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                      Document Verified in Cloud Firestore
                    </span>
                    <Badge variant="outline" className="text-[10px] bg-emerald-100 text-emerald-800 border-emerald-300">
                      LIVE RECORD
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs pt-1">
                    <div>
                      <span className="text-muted-foreground block text-[11px]">File Number</span>
                      <strong className="font-mono text-sm">{cloudData.fileNo || fileNo}</strong>
                    </div>
                    <div>
                      <span className="text-muted-foreground block text-[11px]">Firestore Document ID</span>
                      <strong className="font-mono text-xs">{cloudData._id || fileId}</strong>
                    </div>
                    <div>
                      <span className="text-muted-foreground block text-[11px]">Last Server Write Timestamp</span>
                      <span className="font-medium text-foreground flex items-center gap-1 mt-0.5">
                        <Clock className="h-3 w-3 text-muted-foreground" />
                        {parseFirestoreTimestamp(cloudData.updatedAt || cloudData.createdAt)}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block text-[11px]">Database Path</span>
                      <span className="font-mono text-[11px] text-muted-foreground truncate block">
                        {cloudData._path}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Sites Status Breakdown */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <Layers className="h-3.5 w-3.5" />
                    Saved Sites in Database ({cloudSites.length})
                  </h4>
                </div>

                {cloudSites.length === 0 ? (
                  <div className="p-4 text-center text-xs text-muted-foreground border rounded-lg">
                    No sites recorded in this document yet.
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {cloudSites.map((site: any, idx: number) => {
                      const hasTD = site.totalDepth !== null && site.totalDepth !== undefined && site.totalDepth !== '';
                      const hasCasing = Boolean(site.casingPipeUsed || site.casing6kgPipe || site.casing8kgPipe || site.casing10kgPipe);
                      const hasCompletion = Boolean(site.dateOfCompletion);

                      return (
                        <div
                          key={site.id || idx}
                          className="p-3.5 rounded-lg border bg-card text-card-foreground shadow-2xs space-y-2"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <div className="text-xs font-bold text-foreground">
                                Site #{idx + 1}: {site.nameOfSite || "Unnamed Site"}
                              </div>
                              <span className="text-[11px] text-muted-foreground">
                                Purpose: {site.purpose || 'N/A'} | Status: <strong className="text-foreground">{site.workStatus || 'N/A'}</strong>
                              </span>
                            </div>
                            <Badge
                              variant={site.workStatus === 'Work Completed' ? 'default' : 'secondary'}
                              className="text-[10px]"
                            >
                              {site.workStatus || 'Unknown'}
                            </Badge>
                          </div>

                          <div className="grid grid-cols-3 gap-2 pt-1 border-t text-[11px]">
                            <div className="p-2 rounded bg-muted/40">
                              <span className="text-muted-foreground block text-[10px]">Actual Total Depth</span>
                              <strong className={hasTD ? "text-blue-600 font-bold" : "text-muted-foreground font-normal"}>
                                {hasTD ? `${site.totalDepth} m` : 'Not recorded'}
                              </strong>
                            </div>
                            <div className="p-2 rounded bg-muted/40">
                              <span className="text-muted-foreground block text-[10px]">Casing Pipe Used</span>
                              <strong className={hasCasing ? "text-amber-600 font-bold" : "text-muted-foreground font-normal"}>
                                {hasCasing ? `${site.casingPipeUsed || site.casing6kgPipe || '0'} m` : 'Not recorded'}
                              </strong>
                            </div>
                            <div className="p-2 rounded bg-muted/40">
                              <span className="text-muted-foreground block text-[10px]">Completion Date</span>
                              <strong className={hasCompletion ? "text-emerald-600 font-bold" : "text-muted-foreground font-normal"}>
                                {hasCompletion ? formatDateToDDMMYYYY(site.dateOfCompletion) : 'Not completed'}
                              </strong>
                            </div>
                          </div>

                          <div className="flex flex-wrap gap-4 pt-1">
                            <div className="text-[11px] text-muted-foreground flex items-center gap-1.5 bg-muted/30 px-2 py-1 rounded">
                              <span>📸 Attached Photos:</span>
                              <strong className={site.workImages && site.workImages.length > 0 ? "text-emerald-600 dark:text-emerald-400 font-bold" : "text-muted-foreground font-normal"}>
                                {site.workImages?.length || 0} photo(s)
                              </strong>
                            </div>
                            <div className="text-[11px] text-muted-foreground flex items-center gap-1.5 bg-muted/30 px-2 py-1 rounded">
                              <span>🎥 Attached Videos:</span>
                              <strong className={site.workVideos && site.workVideos.length > 0 ? "text-emerald-600 dark:text-emerald-400 font-bold" : "text-muted-foreground font-normal"}>
                                {site.workVideos?.length || 0} video(s)
                              </strong>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        <DialogFooter className="p-4 border-t bg-muted/10 flex items-center justify-between sm:justify-between">
          <span className="text-[11px] text-muted-foreground">
            {lastFetchedAt && `Checked at ${format(lastFetchedAt, 'hh:mm:ss a')}`}
          </span>
          <Button variant="default" size="sm" onClick={onClose} className="text-xs">
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
