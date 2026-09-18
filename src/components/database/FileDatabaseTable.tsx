
// src/components/database/FileDatabaseTable.tsx
"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from 'next/link';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Eye, Trash2, Loader2, Copy, ArrowUpDown, ArrowUp, ArrowDown, Move, Printer } from "lucide-react";
import PrintableReportModal from "./PrintableReportModal";
import type { DataEntryFormData, SiteWorkStatus, SiteDetailFormData, ApplicationType, UserRole } from "@/lib/schemas";
import { 
    LOGGING_PUMPING_TEST_PURPOSE_OPTIONS,
    PUBLIC_DEPOSIT_APPLICATION_TYPES,
    PRIVATE_APPLICATION_TYPES,
    COLLECTOR_APPLICATION_TYPES,
    PLAN_FUND_APPLICATION_TYPES
} from "@/lib/schemas";
import { format, isValid, parseISO } from "date-fns";
import Image from "next/image";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { useFileEntries } from "@/hooks/useFileEntries";
import { useAuth } from "@/hooks/useAuth";
import { useDataStore } from "@/hooks/use-data-store";
import { cn } from "@/lib/utils";
import { v4 as uuidv4 } from 'uuid';
import { usePendingUpdates } from "@/hooks/usePendingUpdates";
import {
  Tooltip,
  TooltipProvider,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";
import { MoveCopyFileDialog } from "../shared/MoveCopyDialogs";

const ITEMS_PER_PAGE = 50;

const safeParseDate = (dateValue: any): Date | null => {
  if (!dateValue) return null;
  if (dateValue instanceof Date && isValid(dateValue)) return dateValue;
  if (typeof dateValue === 'string') {
    const parsed = parseISO(dateValue);
    if (isValid(parsed)) return parsed;
  }
  if (typeof dateValue === 'object' && dateValue.toDate) {
    const parsed = dateValue.toDate();
    if (isValid(parsed)) return parsed;
  }
  return null;
};

const getStatusColorClass = (status: SiteWorkStatus | undefined): string => {
    if (!status) return 'text-muted-foreground';
    if (status === 'Work Cancelled') return 'text-gray-500 line-through';
    const completedOrFailed: string[] = ["Work Completed", "Bill Prepared", "Payment Completed", "Utilization Certificate Issued", "Work Failed", "Completed", "Work Cancelled"];
    if (completedOrFailed.includes(status as SiteWorkStatus)) return 'text-red-600';
    if (status === 'Refund Pending') return 'text-yellow-600';
    return 'text-green-600';
};

interface FileDatabaseTableProps {
  fileEntries: DataEntryFormData[];
  isLoading: boolean;
  searchActive: boolean;
  totalEntries: number;
  isReadOnly?: boolean;
  currentPage?: number;
  userRole?: UserRole;
  currentModule?: string;
  activeTab?: string;
}

type SortKey = keyof DataEntryFormData | 'firstRemittanceDate' | 'financialBalance';


export default function FileDatabaseTable({ 
  fileEntries, 
  isLoading, 
  searchActive, 
  totalEntries, 
  isReadOnly = false,
  currentPage = 1,
  userRole,
  currentModule,
  activeTab
}: FileDatabaseTableProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const { deleteFileEntry, addFileEntry, moveCopyFile, updateFileEntry } = useFileEntries(); 
  const { user, authIsLoading } = useAuth() as any;
  const { allFileEntries } = useDataStore();

  const lastId = searchParams?.get('lastId');
  const [deleteItem, setDeleteItem] = useState<DataEntryFormData | null>(null);
  const [itemToMove, setItemToMove] = useState<DataEntryFormData | null>(null);
  const [selectedPrintEntry, setSelectedPrintEntry] = useState<DataEntryFormData | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [sortConfig, setSortConfig] = useState<{ key: SortKey; direction: 'asc' | 'desc' } | null>({ key: 'firstRemittanceDate', direction: 'desc' });

  const canDelete = !isReadOnly && user?.role === 'admin';
  const canCopy = !isReadOnly && user?.role === 'admin';

  // Helper to compute net balance for a file
  const getEntryFinancials = useCallback((entry: DataEntryFormData) => {
    const rem = (entry.remittanceDetails || []).reduce((sum, r) => sum + (Number(r.amountRemitted) || 0), 0);
    const pay = (entry.paymentDetails || []).reduce((sum, p) => sum + (Number(p.totalPaymentPerEntry) || 0), 0);
    
    // Reappropriation debit (given to other files)
    const reapDebit = (entry.reappropriationDetails || []).reduce((sum, r) => {
      const val = r.asGiven !== undefined && r.asGiven !== null ? Number(r.asGiven) : (Number(r.amount) || 0);
      return sum + val;
    }, 0);
    
    // Inward credit to this file from other files
    let reapCredit = 0;
    const normalizedFileNo = entry.fileNo?.toLowerCase().trim();
    if (normalizedFileNo && allFileEntries) {
      allFileEntries.forEach(other => {
        if (other.fileNo?.toLowerCase().trim() === normalizedFileNo) return;
        other.reappropriationDetails?.forEach(r => {
          if (r.refFileNo?.toLowerCase().trim() === normalizedFileNo) {
            const val = r.asGiven !== undefined && r.asGiven !== null ? Number(r.asGiven) : (Number(r.amount) || 0);
            reapCredit += val;
          }
        });
      });
    }

    const totalCredit = rem + reapCredit;
    const totalDebit = pay + reapDebit;
    const balance = totalCredit - totalDebit;

    return { rem, pay, reapCredit, reapDebit, totalCredit, totalDebit, balance };
  }, [allFileEntries]);

  // Helper to find the latest available date (Remittance or Inward Re-appropriation Credit)
  const getDisplayDate = useCallback((entry: DataEntryFormData): Date | null => {
    let latestDate: Date | null = null;

    // 1. Check all remittance dates
    entry.remittanceDetails?.forEach(rd => {
      const d = safeParseDate(rd.dateOfRemittance);
      if (d && (!latestDate || d > latestDate)) latestDate = d;
    });

    // 2. Check all inward re-appropriation dates (credits)
    const normalizedFileNo = entry.fileNo?.toLowerCase().trim();
    if (normalizedFileNo && allFileEntries) {
      allFileEntries.forEach(otherEntry => {
        if (otherEntry.fileNo?.toLowerCase().trim() === normalizedFileNo) return;
        otherEntry.reappropriationDetails?.forEach(reapp => {
          if (reapp.refFileNo?.toLowerCase().trim() === normalizedFileNo) {
            const d = safeParseDate(reapp.date);
            if (d && (!latestDate || d > latestDate)) latestDate = d;
          }
        });
      });
    }
    return latestDate;
  }, [allFileEntries]);

  const requestSort = (key: SortKey) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const getSortIcon = (key: SortKey) => {
    if (!sortConfig || sortConfig.key !== key) return <ArrowUpDown className="ml-2 h-3 w-3 opacity-30 group-hover:opacity-100" />;
    if (sortConfig.direction === 'asc') return <ArrowUp className="ml-2 h-3 w-3" />;
    return <ArrowDown className="ml-2 h-3 w-3" />;
  };

  const sortedFileEntries = useMemo(() => {
    let sortableItems = [...fileEntries];
    if (sortConfig !== null) {
      sortableItems.sort((a, b) => {
        let aValue: any = a[sortConfig.key as keyof DataEntryFormData];
        let bValue: any = b[sortConfig.key as keyof DataEntryFormData];
        
        if (sortConfig.key === 'firstRemittanceDate') {
          const dateA = getDisplayDate(a);
          const dateB = getDisplayDate(b);
          aValue = dateA?.getTime() || 0;
          bValue = dateB?.getTime() || 0;
        } else if (sortConfig.key === 'financialBalance') {
          const finA = getEntryFinancials(a);
          const finB = getEntryFinancials(b);
          aValue = finA.balance;
          bValue = finB.balance;
        }
        
        if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return sortableItems;
  }, [fileEntries, sortConfig, getDisplayDate, getEntryFinancials]);

  useEffect(() => {
    if (!isLoading && lastId) {
      const timer = setTimeout(() => {
        const element = document.getElementById(`row-${lastId}`);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
          element.classList.add('bg-primary/10');
          setTimeout(() => element.classList.remove('bg-primary/10'), 2000);
        }
      }, 600);
      return () => clearTimeout(timer);
    }
  }, [isLoading, lastId]);

  const getDetailUrl = (item: DataEntryFormData) => {
    if (!item.id) return '#';
    const hasInvestigationPurpose = item.siteDetails?.some(site => site.purpose === 'GW Investigation');
    const hasLoggingPumpingPurpose = item.siteDetails?.some(site => site.purpose && LOGGING_PUMPING_TEST_PURPOSE_OPTIONS.includes(site.purpose as any));

    let workType = '';
    const appType = item.applicationType as any;

    if (hasInvestigationPurpose && !hasLoggingPumpingPurpose) {
        workType = 'gwInvestigation';
    } else if (hasLoggingPumpingPurpose && !hasInvestigationPurpose) {
        workType = 'loggingPumpingTest';
    } else if (appType && (PUBLIC_DEPOSIT_APPLICATION_TYPES as any).includes(appType)) {
        workType = 'public';
    } else if (appType && (PRIVATE_APPLICATION_TYPES as any).includes(appType)) {
        workType = 'private';
    } else if (appType && (COLLECTOR_APPLICATION_TYPES as any).includes(appType)) {
        workType = 'collector';
    } else if (appType && (PLAN_FUND_APPLICATION_TYPES as any).includes(appType)) {
        workType = 'planFund';
    } else {
        workType = 'public';
    }

    const queryParams = new URLSearchParams({ id: item.id });
    if (workType) queryParams.set('workType', workType);
    if (isReadOnly) queryParams.set('readOnly', 'true');
    if (currentPage > 1) queryParams.set('page', String(currentPage));
    if (activeTab) queryParams.set('tab', activeTab);
    
    return `/dashboard/data-entry?${queryParams.toString()}`;
  };

  const handleViewClick = (item: DataEntryFormData) => {
    const url = getDetailUrl(item);
    if (url !== '#') {
      router.push(url);
    }
  };

  const confirmDelete = async () => {
    if (!canDelete || !deleteItem || !deleteItem.id) return;
    setIsDeleting(true);
    try {
        await deleteFileEntry(deleteItem.id);
        toast({ title: "File Entry Deleted" });
    } catch (error: any) {
        toast({ title: "Error Deleting File", description: error.message, variant: "destructive" });
    } finally {
        setIsDeleting(false);
        setDeleteItem(null);
    }
  };

  const handleMoveCopyFileConfirm = async (op: 'move' | 'copy', target: string) => {
    if (!itemToMove || !itemToMove.id) return;
    try {
        await moveCopyFile(itemToMove.id, op, target);
        toast({ title: op === 'move' ? "File Moved" : "File Copied" });
    } catch (error: any) {
        toast({ title: "Operation Failed", description: error.message, variant: "destructive" });
    }
  };

  if (isLoading || authIsLoading) {
    return <div className="flex items-center justify-center py-10"><Loader2 className="h-8 w-8 animate-spin text-primary" /><p className="ml-2 text-muted-foreground">Loading data...</p></div>;
  }

  if (sortedFileEntries.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-center">
          <Image src="https://placehold.co/128x128/F0F2F5/3F51B5.png?text=No+Files" width={100} height={100} alt="No files" className="mb-4 opacity-70 rounded-lg" data-ai-hint="empty box document"/>
          <h3 className="text-xl font-semibold">No Files Found</h3>
          <p className="text-muted-foreground">{searchActive ? "No files match your search." : "There are no file entries recorded yet."}</p>
      </div>
    );
  }

  return (
    <>
      <div className="max-h-[70vh] overflow-y-auto overflow-x-auto rounded-md border border-border/60 shadow-2xs">
        <Table className="min-w-[920px] relative border-collapse">
          <TableHeader className="sticky top-0 bg-secondary z-20 shadow-xs">
            <TableRow>
              <TableHead className="w-[50px] min-w-[50px] px-2 py-3 text-sm">Sl. No.</TableHead>
              <TableHead className="w-[110px] min-w-[110px] px-2 py-3 text-sm"><Button variant="ghost" className="p-0 hover:bg-transparent font-bold" onClick={() => requestSort('fileNo')}>File No. {getSortIcon('fileNo')}</Button></TableHead>
              <TableHead className="min-w-[160px] px-2 py-3 text-sm"><Button variant="ghost" className="p-0 hover:bg-transparent font-bold" onClick={() => requestSort('applicantName')}>Applicant Name {getSortIcon('applicantName')}</Button></TableHead>
              <TableHead className="min-w-[200px] px-2 py-3 text-sm">Site Name(s)</TableHead>
              <TableHead className="min-w-[100px] px-2 py-3 text-sm">Purpose(s)</TableHead>
              <TableHead className="w-[110px] min-w-[110px] px-2 py-3 text-sm"><Button variant="ghost" className="p-0 hover:bg-transparent font-bold" onClick={() => requestSort('firstRemittanceDate')}>Remittance {getSortIcon('firstRemittanceDate')}</Button></TableHead>
              {userRole === 'supervisor' || userRole === 'investigator' ? (
                <TableHead className="w-[120px] min-w-[120px] px-2 py-3 text-sm">Work Status</TableHead>
              ) : (
                <TableHead className="w-[120px] min-w-[120px] px-2 py-3 text-sm"><Button variant="ghost" className="p-0 hover:bg-transparent font-bold" onClick={() => requestSort('fileStatus')}>File Status {getSortIcon('fileStatus')}</Button></TableHead>
              )}
              <TableHead className="w-[130px] min-w-[130px] px-2 py-3 text-sm text-right"><Button variant="ghost" className="p-0 hover:bg-transparent font-bold" onClick={() => requestSort('financialBalance')}>Financial Health {getSortIcon('financialBalance')}</Button></TableHead>
              <TableHead className="text-center w-[125px] min-w-[125px] px-2 py-3 text-sm sticky right-0 bg-secondary z-30 shadow-[-6px_0_8px_-4px_rgba(0,0,0,0.12)]">Actions</TableHead>
            </TableRow>
          </TableHeader>
            <TableBody>
              {sortedFileEntries.map((entry, index) => {
                let sitesToDisplay: SiteDetailFormData[] = entry.siteDetails || [];
                if (user?.role === 'supervisor' || user?.role === 'investigator') {
                    sitesToDisplay = sitesToDisplay.filter(site => {
                        const isAssignedSupervisor = user.role === 'supervisor' && (site.supervisorUid === user.uid || (user.name && site.supervisorName?.includes(user.name)));
                        const isAssignedInvestigator = site.nameOfInvestigator === user.name || site.vesInvestigator === user.name;
                        return isAssignedSupervisor || isAssignedInvestigator;
                    });
                }
                const displayDate = getDisplayDate(entry);
                const detailUrl = getDetailUrl(entry);

                return (
                <TableRow key={entry.id} id={`row-${entry.id}`} className="group transition-colors duration-150 hover:bg-muted/50">
                  <TableCell className="w-[50px] min-w-[50px] px-2 py-2 text-sm text-center font-mono">{(currentPage - 1) * 50 + index + 1}</TableCell>
                  <TableCell className="w-[110px] min-w-[110px] px-2 py-2 text-sm">
                    <Link
                        href={detailUrl}
                        className="font-mono text-sm text-primary font-bold hover:underline"
                    >
                        {entry.fileNo}
                    </Link>
                  </TableCell>
                  <TableCell className="min-w-[160px] px-2 py-2 text-sm">{entry.applicantName}</TableCell>
                  <TableCell className="min-w-[200px] px-2 py-2 text-sm">
                    {sitesToDisplay.length > 0 ? sitesToDisplay.map((site, idx) => (
                      <span key={idx} className={cn("font-semibold", getStatusColorClass(site.workStatus as SiteWorkStatus))}>
                        {site.nameOfSite}{idx < sitesToDisplay.length - 1 ? ', ' : ''}
                      </span>
                    )) : <span className="text-muted-foreground italic">No assigned sites for this file.</span>}
                  </TableCell>
                  <TableCell className="min-w-[100px] px-2 py-2 text-sm">
                    {sitesToDisplay.map((site, idx) => (
                      <span key={idx} className={cn(getStatusColorClass(site.workStatus as SiteWorkStatus))}>
                          {site.purpose || 'N/A'}{idx < sitesToDisplay.length - 1 ? ', ' : ''}
                      </span>
                    ))}
                  </TableCell>
                  <TableCell className="w-[110px] min-w-[110px] px-2 py-2 text-sm">
                    {displayDate ? format(displayDate, "dd/MM/yyyy") : "N/A"}
                  </TableCell>
                  {userRole === 'supervisor' || userRole === 'investigator' ? (
                    <TableCell className="w-[120px] min-w-[120px] px-2 py-2 text-sm">
                        {sitesToDisplay.map((site, idx) => (
                            <span key={idx} className={cn("font-semibold", getStatusColorClass(site.workStatus as SiteWorkStatus))}>
                                {site.workStatus || 'N/A'}{idx < sitesToDisplay.length - 1 ? ', ' : ''}
                            </span>
                        ))}
                    </TableCell>
                  ) : (
                    <TableCell className="font-semibold w-[120px] min-w-[120px] px-2 py-2 text-sm">{entry.fileStatus}</TableCell>
                  )}
                  {(() => {
                    const fin = getEntryFinancials(entry);
                    return (
                      <TableCell className="w-[130px] min-w-[130px] px-2 py-2 text-sm text-right">
                        {fin.totalCredit === 0 && fin.totalDebit === 0 ? (
                          <span className="text-xs text-muted-foreground font-mono">₹0</span>
                        ) : fin.balance > 0 ? (
                          <div className="flex flex-col items-end">
                            <span className="text-xs font-semibold font-mono text-emerald-600 dark:text-emerald-400">
                              +₹{fin.balance.toLocaleString('en-IN')}
                            </span>
                            <span className="text-[10px] text-muted-foreground uppercase tracking-tight">Surplus</span>
                          </div>
                        ) : fin.balance === 0 ? (
                          <div className="flex flex-col items-end">
                            <span className="text-xs font-semibold font-mono text-blue-600 dark:text-blue-400">
                              ₹0.00
                            </span>
                            <span className="text-[10px] text-muted-foreground uppercase tracking-tight">Balanced</span>
                          </div>
                        ) : (
                          <div className="flex flex-col items-end">
                            <span className="text-xs font-bold font-mono text-red-600 dark:text-red-400">
                              -₹{Math.abs(fin.balance).toLocaleString('en-IN')}
                            </span>
                            <span className="text-[10px] text-red-500 font-semibold uppercase tracking-tight">Deficit</span>
                          </div>
                        )}
                      </TableCell>
                    );
                  })()}
                  <TableCell className="text-right w-[125px] min-w-[125px] px-2 py-2 sticky right-0 bg-card group-hover:bg-muted/90 transition-colors shadow-[-6px_0_8px_-4px_rgba(0,0,0,0.12)] z-10">
                      <div className="flex items-center justify-end space-x-1 shrink-0">
                        <TooltipProvider><Tooltip><TooltipTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => handleViewClick(entry)}><Eye className="h-4 w-4" /></Button>
                        </TooltipTrigger><TooltipContent><p>View Details</p></TooltipContent></Tooltip></TooltipProvider>
                        {canCopy && (
                            <TooltipProvider><Tooltip><TooltipTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => setItemToMove(entry)}><Move className="h-4 w-4" /></Button>
                            </TooltipTrigger><TooltipContent><p>Move or Copy File</p></TooltipContent></Tooltip></TooltipProvider>
                        )}
                        {canDelete && (
                            <TooltipProvider><Tooltip><TooltipTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0 text-destructive hover:text-destructive/90 hover:bg-destructive/10" onClick={() => setDeleteItem(entry)} disabled={isDeleting}>
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger><TooltipContent><p>Delete File</p></TooltipContent></Tooltip></TooltipProvider>
                        )}
                      </div>
                  </TableCell>
                </TableRow>
              )})}
            </TableBody>
        </Table>
      </div>
      <AlertDialog open={!!deleteItem} onOpenChange={() => setDeleteItem(null)}>
          <AlertDialogContent>
          <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>Delete file <strong>{deleteItem?.fileNo}</strong>? This cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
              <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={confirmDelete} className="bg-destructive" disabled={isDeleting}>
              {isDeleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Delete"}
              </AlertDialogAction>
          </AlertDialogFooter>
          </AlertDialogContent>
      </AlertDialog>

      <MoveCopyFileDialog
        isOpen={!!itemToMove}
        onClose={() => setItemToMove(null)}
        onConfirm={handleMoveCopyFileConfirm}
        fileNo={itemToMove?.fileNo || ''}
        currentModule={currentModule}
      />

      <PrintableReportModal
        isOpen={!!selectedPrintEntry}
        onClose={() => setSelectedPrintEntry(null)}
        entry={selectedPrintEntry ? (allFileEntries?.find(f => f.id === selectedPrintEntry.id || f.fileNo === selectedPrintEntry.fileNo) || selectedPrintEntry) : null}
        moduleType={currentModule}
        onSave={async (updatedEntry) => {
          if (updatedEntry.id) {
            await updateFileEntry(updatedEntry.id, updatedEntry);
            setSelectedPrintEntry(updatedEntry);
          }
        }}
      />
    </>
  );
}

