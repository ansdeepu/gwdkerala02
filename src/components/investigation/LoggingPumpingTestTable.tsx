
// src/components/investigation/LoggingPumpingTestTable.tsx
"use client";

import React, { useState, useMemo, useEffect, useCallback } from "react";
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
import { Eye, Trash2, Loader2, ArrowUpDown, ArrowUp, ArrowDown, Move } from "lucide-react";
import type { DataEntryFormData, SiteWorkStatus } from "@/lib/schemas";
import { format, isValid, parseISO } from "date-fns";
import Image from "next/image";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { useFileEntries } from "@/hooks/useFileEntries";
import { useAuth } from "@/hooks/useAuth";
import { useDataStore } from "@/hooks/use-data-store";
import { cn } from "@/lib/utils";
import { MoveCopyFileDialog } from "../shared/MoveCopyDialogs";

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
    if (status === 'Work Completed' || status === 'Completed') return 'text-green-600';
    if (status === 'Pending') return 'text-yellow-600';
    return 'text-muted-foreground';
};

interface LoggingPumpingTestTableProps {
  fileEntries: DataEntryFormData[];
  isLoading: boolean;
  searchActive: boolean;
  totalEntries: number;
  activeTab?: string;
  currentPage?: number;
}

type SortKey = keyof DataEntryFormData | 'firstRemittanceDate' | 'financialBalance';

export default function LoggingPumpingTestTable({ fileEntries, isLoading, searchActive, totalEntries, activeTab, currentPage = 1 }: LoggingPumpingTestTableProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const { deleteFileEntry, moveCopyFile } = useFileEntries(); 
  const { user, authIsLoading } = useAuth() as any;
  const { allFileEntries } = useDataStore();

  const lastId = searchParams?.get('lastId');
  const [deleteItem, setDeleteItem] = useState<DataEntryFormData | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [itemToMove, setItemToMove] = useState<DataEntryFormData | null>(null);
  const [sortConfig, setSortConfig] = useState<{ key: SortKey; direction: 'asc' | 'desc' } | null>({ key: 'firstRemittanceDate', direction: 'desc' });

  const canDelete = user?.role === 'admin';
  const canCopy = user?.role === 'admin';

  // Helper for net balance
  const getEntryFinancials = useCallback((entry: DataEntryFormData) => {
    const rem = (entry.remittanceDetails || []).reduce((sum, r) => sum + (Number(r.amountRemitted) || 0), 0);
    const pay = (entry.paymentDetails || []).reduce((sum, p) => sum + (Number(p.totalPaymentPerEntry) || 0), 0);
    
    const reapDebit = (entry.reappropriationDetails || []).reduce((sum, r) => {
      const val = r.asGiven !== undefined && r.asGiven !== null ? Number(r.asGiven) : (Number(r.amount) || 0);
      return sum + val;
    }, 0);
    
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

    return { totalCredit, totalDebit, balance };
  }, [allFileEntries]);

  const getDisplayDate = useCallback((entry: DataEntryFormData): Date | null => {
    let latestDate: Date | null = null;
    entry.remittanceDetails?.forEach(rd => {
      const d = safeParseDate(rd.dateOfRemittance);
      if (d && (!latestDate || d > latestDate)) latestDate = d;
    });
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
    const queryParams = new URLSearchParams({ 
        id: item.id, 
        workType: 'loggingPumpingTest',
        tab: activeTab || '',
        page: String(currentPage)
    });
    return `/dashboard/data-entry?${queryParams.toString()}`;
  };

  const handleViewClick = (item: DataEntryFormData) => {
    const url = getDetailUrl(item);
    if (url !== '#') {
      router.push(url);
    }
  };

  const confirmDelete = async () => {
    if (!deleteItem || !deleteItem.id) return;
    setIsDeleting(true);
    try {
        await deleteFileEntry(deleteItem.id);
        toast({ title: "File Deleted" });
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
            <h3 className="text-xl font-semibold">No Logging &amp; Pumping Test Files Found</h3>
            <p className="text-muted-foreground">{searchActive ? "No files match your search criteria." : "There are no files in this category."}</p>
        </div>
    );
  }

  return (
    <>
      <TooltipProvider>
        <div className="max-h-[70vh] overflow-y-auto overflow-x-auto rounded-md border border-border/60 shadow-2xs">
          <Table className="min-w-[920px] relative border-collapse">
            <TableHeader className="sticky top-0 bg-secondary z-20 shadow-xs">
              <TableRow>
                <TableHead className="w-[50px] min-w-[50px]">#</TableHead>
                <TableHead className="w-[110px] min-w-[110px]"><Button variant="ghost" className="p-0 hover:bg-transparent font-bold text-left" onClick={() => requestSort('fileNo')}>File No. {getSortIcon('fileNo')}</Button></TableHead>
                <TableHead className="min-w-[160px]"><Button variant="ghost" className="p-0 hover:bg-transparent font-bold text-left" onClick={() => requestSort('applicantName')}>Applicant {getSortIcon('applicantName')}</Button></TableHead>
                <TableHead className="min-w-[200px]">Site Name(s)</TableHead>
                <TableHead className="w-[110px] min-w-[110px]"><Button variant="ghost" className="p-0 hover:bg-transparent font-bold text-left" onClick={() => requestSort('firstRemittanceDate')}>Remittance {getSortIcon('firstRemittanceDate')}</Button></TableHead>
                <TableHead className="w-[120px] min-w-[120px]">
                  {user?.role === 'investigator' ? (
                    "Work Status"
                  ) : (
                    <Button variant="ghost" className="p-0 hover:bg-transparent font-bold text-left" onClick={() => requestSort('fileStatus')}>
                      File Status {getSortIcon('fileStatus')}
                    </Button>
                  )}
                </TableHead>
                <TableHead className="w-[130px] min-w-[130px] text-right"><Button variant="ghost" className="p-0 hover:bg-transparent font-bold" onClick={() => requestSort('financialBalance')}>Financial Health {getSortIcon('financialBalance')}</Button></TableHead>
                <TableHead className="text-center w-[130px] min-w-[130px] px-2 py-3 sticky right-0 bg-secondary z-30 shadow-[-6px_0_8px_-4px_rgba(0,0,0,0.12)]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedFileEntries.map((entry, index) => {
                const displayDate = getDisplayDate(entry);
                const detailUrl = getDetailUrl(entry);
                return (
                <TableRow key={entry.id} id={`row-${entry.id}`} className="group transition-colors duration-150 hover:bg-muted/50">
                  <TableCell className="text-center font-mono w-[50px] min-w-[50px]">{(currentPage - 1) * 50 + index + 1}</TableCell>
                  <TableCell className="font-medium w-[110px] min-w-[110px]">
                    <Link
                        href={detailUrl}
                        className="font-mono text-sm text-primary font-bold hover:underline"
                    >
                        {entry.fileNo}
                    </Link>
                  </TableCell>
                  <TableCell className="text-xs min-w-[160px]">{entry.applicantName}</TableCell>
                  <TableCell className="min-w-[200px]">
                    {(entry.siteDetails || []).map((site, idx) => (
                      <span key={idx} className={cn("font-semibold text-xs", getStatusColorClass(site.workStatus as SiteWorkStatus))}>
                        {site.nameOfSite}{idx < entry.siteDetails!.length - 1 ? ', ' : ''}
                      </span>
                    ))}
                  </TableCell>
                  <TableCell className="text-xs w-[110px] min-w-[110px]">
                    {displayDate ? format(displayDate, "dd/MM/yyyy") : "N/A"}
                  </TableCell>
                  <TableCell className="font-semibold text-xs w-[120px] min-w-[120px]">
                    {user?.role === 'investigator' ? (
                      <div className="flex flex-col gap-0.5">
                        {(entry.siteDetails || []).map((site, idx) => (
                          <span key={idx} className={cn("text-[10px] font-bold uppercase", getStatusColorClass(site.workStatus as SiteWorkStatus))}>
                            {site.workStatus || 'N/A'}
                          </span>
                        ))}
                      </div>
                    ) : (
                      entry.fileStatus
                    )}
                  </TableCell>
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
                  <TableCell className="text-right w-[130px] min-w-[130px] px-2 py-2 sticky right-0 bg-card group-hover:bg-muted/90 transition-colors shadow-[-6px_0_8px_-4px_rgba(0,0,0,0.12)] z-10">
                    <div className="flex items-center justify-end space-x-1 shrink-0">
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => handleViewClick(entry)}>
                                  <Eye className="h-4 w-4" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent><p>View Details</p></TooltipContent>
                        </Tooltip>
                        {canCopy && (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => setItemToMove(entry)}><Move className="h-4 w-4" /></Button>
                              </TooltipTrigger>
                              <TooltipContent><p>Move or Copy File</p></TooltipContent>
                            </Tooltip>
                        )}
                        {canDelete && 
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0 text-destructive hover:text-destructive/90 hover:bg-destructive/10" onClick={() => setDeleteItem(entry)}>
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent><p>Delete File</p></TooltipContent>
                          </Tooltip>
                        }
                    </div>
                  </TableCell>
                </TableRow>
              )})}
            </TableBody>
          </Table>
        </div>
      </TooltipProvider>

      <AlertDialog open={!!deleteItem} onOpenChange={() => setDeleteItem(null)}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Delete this file?</AlertDialogTitle></AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <MoveCopyFileDialog
        isOpen={!!itemToMove}
        onClose={() => setItemToMove(null)}
        onConfirm={handleMoveCopyFileConfirm}
        fileNo={itemToMove?.fileNo || ''}
        currentModule="loggingPumpingTest"
      />
    </>
  );
}

