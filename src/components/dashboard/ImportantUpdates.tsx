
// src/components/dashboard/ImportantUpdates.tsx
"use client";

import React, { useMemo, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { DebouncedSearchInput } from "@/components/shared/DebouncedSearchInput";
import { cn } from "@/lib/utils";
import type { DataEntryFormData, SiteWorkStatus, PendingUpdate } from '@/lib/schemas';
import { useAuth } from '@/hooks/useAuth';
import { usePendingUpdates } from '@/hooks/usePendingUpdates';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { 
  Bell, 
  Search, 
  ExternalLink, 
  AlertCircle, 
  Clock, 
  Coins, 
  FileCheck2, 
  XCircle, 
  MapPin, 
  User as UserIcon,
  ChevronRight,
  Filter,
  Eye,
  FileText
} from 'lucide-react';

interface ImportantUpdatesProps {
  allFileEntries: DataEntryFormData[];
}

export interface AlertItem {
  key: string;
  id?: string;
  fileNo: string;
  applicantName: string;
  siteName: string;
  purpose: string;
  workStatus: string;
  workType?: string;
  category?: string;
  constituency?: string;
  district?: string;
  lsgName?: string;
  estimateAmount?: number;
  remarks?: string;
  type: 'work' | 'rejection';
  rejectionReason?: string;
  submittedByName?: string;
}

export default function ImportantUpdates({ allFileEntries }: ImportantUpdatesProps) {
  const router = useRouter();
  const { user } = useAuth();
  const { subscribeToPendingUpdates } = usePendingUpdates();
  const [rejectedUpdates, setRejectedUpdates] = useState<PendingUpdate[]>([]);
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedAlert, setSelectedAlert] = useState<AlertItem | null>(null);

  useEffect(() => {
    if (user?.role !== 'supervisor' || !user.uid) return;

    const unsubscribe = subscribeToPendingUpdates(updates => {
      const rejected = updates.filter(u => u.status === 'rejected' && u.submittedByUid === user.uid);
      setRejectedUpdates(rejected);
    });

    return () => unsubscribe();
  }, [user, subscribeToPendingUpdates]);

  const allAlerts = useMemo(() => {
    const items: AlertItem[] = [];
    const siteWorkStatusAlerts: SiteWorkStatus[] = ["Refund Pending", "Under Process", "TS Pending", "Additional Fund Awaited"];

    for (const entry of allFileEntries || []) {
      entry.siteDetails?.forEach((site, sIdx) => {
        if (site.workStatus && siteWorkStatusAlerts.includes(site.workStatus as SiteWorkStatus)) {
          const key = `${entry.id || entry.fileNo}-${sIdx}-${site.workStatus}`;
          items.push({
            key,
            id: entry.id,
            fileNo: entry.fileNo || 'N/A',
            applicantName: entry.applicantName || 'Unnamed Applicant',
            siteName: site.nameOfSite || `Site #${sIdx + 1}`,
            purpose: site.purpose || entry.purpose || 'N/A',
            workStatus: site.workStatus,
            workType: entry.workType,
            category: (entry as any).category,
            constituency: site.constituency || entry.constituency,
            district: entry.district,
            lsgName: site.lsgName,
            estimateAmount: site.siteEstimateAmount || entry.totalEstimateAmount,
            remarks: site.workRemarks || site.drillingRemarks || entry.remarks,
            type: 'work',
          });
        }
      });
    }

    if (user?.role === 'supervisor') {
      rejectedUpdates.forEach(update => {
        const firstSite = update.updatedSiteDetails?.[0];
        items.push({
          key: `rejection-${update.id}`,
          id: update.fileId,
          fileNo: update.fileNo || 'N/A',
          applicantName: 'Supervisor Update',
          siteName: firstSite?.nameOfSite || 'Updated Site',
          purpose: firstSite?.purpose || 'N/A',
          workStatus: 'Rejected',
          type: 'rejection',
          rejectionReason: update.notes || 'No specific reason provided.',
          submittedByName: update.submittedByName,
        });
      });
    }

    return items;
  }, [allFileEntries, rejectedUpdates, user]);

  // Counts per status category
  const filterCounts = useMemo(() => {
    const counts: Record<string, number> = {
      all: allAlerts.length,
      'Under Process': 0,
      'Refund Pending': 0,
      'TS Pending': 0,
      'Additional Fund Awaited': 0,
      rejection: 0,
    };

    allAlerts.forEach(item => {
      if (item.type === 'rejection') {
        counts.rejection = (counts.rejection || 0) + 1;
      } else if (counts[item.workStatus] !== undefined) {
        counts[item.workStatus]++;
      }
    });

    return counts;
  }, [allAlerts]);

  // Filtered and searched list
  const filteredAlerts = useMemo(() => {
    return allAlerts.filter(item => {
      // Category filter
      if (activeFilter === 'rejection' && item.type !== 'rejection') return false;
      if (activeFilter !== 'all' && activeFilter !== 'rejection' && item.workStatus !== activeFilter) return false;

      // Text search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesFile = item.fileNo.toLowerCase().includes(q);
        const matchesApplicant = item.applicantName.toLowerCase().includes(q);
        const matchesSite = item.siteName.toLowerCase().includes(q);
        const matchesPurpose = item.purpose.toLowerCase().includes(q);
        const matchesStatus = item.workStatus.toLowerCase().includes(q);
        return matchesFile || matchesApplicant || matchesSite || matchesPurpose || matchesStatus;
      }

      return true;
    });
  }, [allAlerts, activeFilter, searchQuery]);

  const getStatusBadgeStyle = (status: string, type: string) => {
    if (type === 'rejection' || status === 'Rejected') {
      return {
        bg: 'bg-red-500/10 text-red-700 border-red-200 dark:border-red-800 dark:text-red-400',
        dot: 'bg-red-500',
        icon: XCircle,
      };
    }
    switch (status) {
      case 'Refund Pending':
        return {
          bg: 'bg-amber-500/10 text-amber-700 border-amber-200 dark:border-amber-800 dark:text-amber-400',
          dot: 'bg-amber-500',
          icon: Coins,
        };
      case 'Under Process':
        return {
          bg: 'bg-blue-500/10 text-blue-700 border-blue-200 dark:border-blue-800 dark:text-blue-400',
          dot: 'bg-blue-500',
          icon: Clock,
        };
      case 'TS Pending':
        return {
          bg: 'bg-purple-500/10 text-purple-700 border-purple-200 dark:border-purple-800 dark:text-purple-400',
          dot: 'bg-purple-500',
          icon: FileCheck2,
        };
      case 'Additional Fund Awaited':
        return {
          bg: 'bg-emerald-500/10 text-emerald-700 border-emerald-200 dark:border-emerald-800 dark:text-emerald-400',
          dot: 'bg-emerald-500',
          icon: Coins,
        };
      default:
        return {
          bg: 'bg-muted text-muted-foreground border-border',
          dot: 'bg-muted-foreground',
          icon: AlertCircle,
        };
    }
  };

  const handleOpenDataEntry = (item: AlertItem) => {
    if (item.id) {
      const workTypeParam = item.workType ? `&workType=${item.workType}` : '';
      router.push(`/dashboard/data-entry?id=${item.id}${workTypeParam}`);
    } else {
      router.push(`/dashboard/data-entry?fileNo=${encodeURIComponent(item.fileNo)}`);
    }
  };

  const filterTabs = [
    { id: 'all', label: 'All', count: filterCounts.all },
    { id: 'Under Process', label: 'Under Process', count: filterCounts['Under Process'] || 0 },
    { id: 'Refund Pending', label: 'Refund Pending', count: filterCounts['Refund Pending'] || 0 },
    { id: 'TS Pending', label: 'TS Pending', count: filterCounts['TS Pending'] || 0 },
    { id: 'Additional Fund Awaited', label: 'Fund Awaited', count: filterCounts['Additional Fund Awaited'] || 0 },
    ...(filterCounts.rejection > 0 ? [{ id: 'rejection', label: 'Rejections', count: filterCounts.rejection }] : []),
  ];

  return (
    <>
      <Card className="shadow-lg h-[450px] flex flex-col border border-border/80 bg-card overflow-hidden">
        {/* Card Header */}
        <CardHeader className="p-3 pb-2.5 border-b border-border/50 shrink-0 bg-card space-y-2">
          <div className="flex items-center justify-between gap-1.5">
            <CardTitle className="text-sm font-semibold tracking-tight flex items-center gap-1.5 truncate">
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                <Bell className="h-3.5 w-3.5" />
              </div>
              <span className="truncate">Pending Actions</span>
              <Badge variant="secondary" className="font-mono text-[11px] px-1.5 py-0 h-4 font-bold shrink-0">
                {allAlerts.length}
              </Badge>
            </CardTitle>

            <Link href="/dashboard/pending-updates" className="shrink-0">
              <Button variant="ghost" size="sm" className="h-6 text-[11px] px-1.5 text-primary hover:text-primary hover:bg-primary/10 gap-0.5">
                <span>Manage</span>
                <ChevronRight className="h-3 w-3" />
              </Button>
            </Link>
          </div>

          {/* Unified Controls: Full-width Filter + Search */}
          <div className="space-y-1.5">
            <Select value={activeFilter} onValueChange={val => setActiveFilter(val)}>
              <SelectTrigger className="h-8 text-xs w-full bg-background px-2.5 font-medium border-border/80">
                <div className="flex items-center justify-between w-full pr-1">
                  <div className="flex items-center gap-1.5 truncate">
                    <Filter className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    <span className="text-muted-foreground font-normal">Status:</span>
                    <span className="font-semibold text-foreground truncate">
                      {filterTabs.find(t => t.id === activeFilter)?.label || 'All'}
                    </span>
                  </div>
                  <Badge variant="secondary" className="font-mono text-[10px] px-1.5 py-0 h-4 font-bold shrink-0 ml-2">
                    {filterTabs.find(t => t.id === activeFilter)?.count ?? allAlerts.length}
                  </Badge>
                </div>
              </SelectTrigger>
              <SelectContent align="start" className="w-[--radix-select-trigger-width] text-xs">
                {filterTabs.map(tab => (
                  <SelectItem key={tab.id} value={tab.id} className="text-xs py-2">
                    <div className="flex items-center justify-between w-full gap-3">
                      <span className="font-medium">{tab.label}</span>
                      <span className="font-mono text-[10px] font-bold text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                        {tab.count}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="relative min-w-[200px]">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground z-10 pointer-events-none" />
              <DebouncedSearchInput
                value={searchQuery}
                onSearchChange={setSearchQuery}
                placeholder="Search file, site, applicant..."
                className="h-8 pl-8 pr-7 text-xs bg-background focus-visible:ring-1"
              />
            </div>
          </div>
        </CardHeader>

        {/* Card Content - Scrollable List */}
        <CardContent className="flex-1 p-0 overflow-hidden min-h-0 bg-muted/20">
          {filteredAlerts.length > 0 ? (
            <ScrollArea className="h-full px-3 py-2.5">
              <div className="space-y-2.5 pb-2">
                {filteredAlerts.map(item => {
                  const style = getStatusBadgeStyle(item.workStatus, item.type);

                  return (
                    <div
                      key={item.key}
                      onClick={() => setSelectedAlert(item)}
                      className={cn(
                        "group relative p-3 rounded-lg border transition-all duration-150 cursor-pointer shadow-xs",
                        "bg-card hover:bg-accent/50 hover:border-primary/40 hover:shadow-sm",
                        item.type === 'rejection' ? 'border-red-200 dark:border-red-900/50 bg-red-500/5' : 'border-border/70'
                      )}
                    >
                      {/* Top row: File number badge & Status Badge directly after it */}
                      <div className="flex items-center justify-between gap-1.5 mb-1.5">
                        <div className="flex items-center gap-1.5 min-w-0 flex-wrap">
                          <span className="font-mono text-xs font-bold text-foreground bg-muted/90 px-2 py-0.5 rounded border border-border/70 shrink-0">
                            {item.fileNo}
                          </span>

                          <div
                            className={cn(
                              "inline-flex items-center gap-1.5 text-[11px] font-semibold px-2 py-0.5 rounded-full border shrink-0 whitespace-nowrap",
                              style.bg
                            )}
                          >
                            <span className={cn("h-1.5 w-1.5 rounded-full shrink-0", style.dot)} />
                            <span>{item.workStatus}</span>
                          </div>
                        </div>

                        <span className="font-semibold text-[10px] uppercase text-muted-foreground bg-muted/80 px-1.5 py-0.5 rounded border border-border/50 shrink-0">
                          {item.purpose}
                        </span>
                      </div>

                      {/* Middle: Site Name */}
                      <div className="font-semibold text-foreground text-xs leading-snug line-clamp-1 group-hover:text-primary transition-colors pr-4">
                        {item.siteName}
                      </div>

                      {/* Bottom row: Applicant details */}
                      <div className="text-[11px] text-muted-foreground flex items-center gap-1.5 mt-1.5 min-w-0 truncate">
                        <UserIcon className="h-3 w-3 shrink-0 text-muted-foreground/70" />
                        <span className="truncate">{item.applicantName}</span>
                        {item.constituency && (
                          <>
                            <span className="text-muted-foreground/40 shrink-0">•</span>
                            <span className="truncate">{item.constituency}</span>
                          </>
                        )}
                      </div>

                      {/* Rejection note if applicable */}
                      {item.type === 'rejection' && item.rejectionReason && (
                        <div className="mt-2 text-[11px] text-red-600 dark:text-red-400 font-medium line-clamp-1 bg-red-500/10 px-2 py-1 rounded">
                          Reason: {item.rejectionReason}
                        </div>
                      )}

                      {/* Hover Arrow */}
                      <div className="absolute right-2 bottom-2 opacity-0 group-hover:opacity-100 transition-opacity text-primary">
                        <ChevronRight className="h-3.5 w-3.5" />
                      </div>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          ) : (
            <div className="h-full flex flex-col items-center justify-center p-6 text-center text-muted-foreground">
              <AlertCircle className="h-8 w-8 text-muted-foreground/40 mb-2" />
              <p className="text-xs font-semibold text-foreground">No pending items found</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                {searchQuery ? `No matches for "${searchQuery}"` : "All files are currently up to date!"}
              </p>
              {searchQuery && (
                <Button variant="link" size="sm" onClick={() => setSearchQuery('')} className="text-xs h-7 mt-1">
                  Clear Search
                </Button>
              )}
            </div>
          )}
        </CardContent>

        {/* Footer Summary */}
        <div className="px-4 py-2 bg-muted/40 border-t border-border/40 shrink-0 flex items-center justify-between text-[11px] text-muted-foreground">
          <span>Showing {filteredAlerts.length} of {allAlerts.length} items</span>
          <span className="font-medium">Click any item for details</span>
        </div>
      </Card>

      {/* Details Quick Modal */}
      <Dialog open={selectedAlert !== null} onOpenChange={open => !open && setSelectedAlert(null)}>
        <DialogContent className="max-w-lg w-[94vw] p-6 gap-5">
          <DialogHeader className="space-y-2 pr-6">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="outline" className="font-mono text-xs px-2.5 py-1 font-bold bg-muted/60">
                File: {selectedAlert?.fileNo}
              </Badge>
              {selectedAlert && (
                <Badge
                  variant="outline"
                  className={cn("text-xs px-2.5 py-1 font-semibold", getStatusBadgeStyle(selectedAlert.workStatus, selectedAlert.type).bg)}
                >
                  {selectedAlert.workStatus}
                </Badge>
              )}
            </div>
            <DialogTitle className="text-lg font-bold text-foreground leading-snug">
              {selectedAlert?.siteName}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Detailed information for this pending action item.
            </DialogDescription>
          </DialogHeader>

          {selectedAlert && (
            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3.5 bg-muted/40 p-4 rounded-xl border border-border/60">
                <div className="space-y-1">
                  <span className="text-[11px] text-muted-foreground font-medium block">Applicant Name</span>
                  <span className="font-semibold text-foreground text-sm block">{selectedAlert.applicantName}</span>
                </div>
                <div className="space-y-1">
                  <span className="text-[11px] text-muted-foreground font-medium block">Purpose / Work</span>
                  <span className="font-semibold text-foreground text-sm block">{selectedAlert.purpose}</span>
                </div>
                {selectedAlert.constituency && (
                  <div className="space-y-1">
                    <span className="text-[11px] text-muted-foreground font-medium block">Constituency</span>
                    <span className="font-semibold text-foreground block">{selectedAlert.constituency}</span>
                  </div>
                )}
                {selectedAlert.district && (
                  <div className="space-y-1">
                    <span className="text-[11px] text-muted-foreground font-medium block">District</span>
                    <span className="font-semibold text-foreground block">{selectedAlert.district}</span>
                  </div>
                )}
                {selectedAlert.estimateAmount ? (
                  <div className="space-y-1">
                    <span className="text-[11px] text-muted-foreground font-medium block">Estimate Amount</span>
                    <span className="font-bold text-foreground font-mono text-sm block">₹{selectedAlert.estimateAmount.toLocaleString('en-IN')}</span>
                  </div>
                ) : null}
                {selectedAlert.category && (
                  <div className="space-y-1">
                    <span className="text-[11px] text-muted-foreground font-medium block">Category</span>
                    <span className="font-semibold text-foreground block">{selectedAlert.category}</span>
                  </div>
                )}
              </div>

              {selectedAlert.type === 'rejection' && selectedAlert.rejectionReason && (
                <div className="p-3.5 bg-red-500/10 border border-red-200 dark:border-red-900/50 rounded-xl text-red-700 dark:text-red-400 space-y-1">
                  <span className="font-bold block text-xs">Rejection Reason</span>
                  <p className="leading-relaxed text-xs">{selectedAlert.rejectionReason}</p>
                  {selectedAlert.submittedByName && (
                    <span className="text-[11px] text-red-600/80 block mt-1">Submitted by: {selectedAlert.submittedByName}</span>
                  )}
                </div>
              )}

              {selectedAlert.remarks && (
                <div className="p-3.5 bg-muted/30 border border-border/50 rounded-xl space-y-1">
                  <span className="text-[11px] text-muted-foreground font-medium block">Remarks</span>
                  <p className="text-foreground leading-relaxed">{selectedAlert.remarks}</p>
                </div>
              )}
            </div>
          )}

          <DialogFooter className="flex-row items-center justify-between sm:justify-between gap-3 border-t border-border/50 pt-4 mt-2">
            <DialogClose asChild>
              <Button variant="outline" size="sm" className="h-9 px-4 text-xs font-medium">
                Close
              </Button>
            </DialogClose>
            {selectedAlert && (
              <Button
                size="sm"
                className="h-9 px-4 text-xs font-semibold gap-2 shadow-sm"
                onClick={() => {
                  const alert = selectedAlert;
                  setSelectedAlert(null);
                  handleOpenDataEntry(alert);
                }}
              >
                <ExternalLink className="h-3.5 w-3.5" />
                <span>Open in Data Entry</span>
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

