
// src/components/dashboard/DashboardDialogs.tsx
"use client";

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { format, isWithinInterval, startOfDay, endOfDay, isValid, parseISO } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import type { DataEntryFormData } from '@/lib/schemas';
import { 
    LOGGING_PUMPING_TEST_PURPOSE_OPTIONS,
    PUBLIC_DEPOSIT_APPLICATION_TYPES,
    PRIVATE_APPLICATION_TYPES,
    COLLECTOR_APPLICATION_TYPES,
    PLAN_FUND_APPLICATION_TYPES,
    ApplicationType
} from '@/lib/schemas';
import type { ArsEntry } from '@/hooks/useArsEntries';
import { FileDown, Trash2, Loader2, AlertTriangle } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { app, db } from '@/lib/firebase';
import type { UserProfile } from '@/hooks/useAuth';
import Link from 'next/link';

interface DetailDialogColumn {
  key: string;
  label: string;
  isNumeric?: boolean;
}

interface DialogState {
  isOpen: boolean;
  title: string;
  data: any[];
  columns: DetailDialogColumn[];
  type: 'detail' | 'rig' | 'age' | 'month' | 'fileStatus' | 'finance';
}

interface DashboardDialogsProps {
  dialogState: DialogState;
  setDialogState: React.Dispatch<React.SetStateAction<DialogState>>;
  allFileEntries: DataEntryFormData[];
  allArsEntries: ArsEntry[];
  financeDates?: { start?: Date, end?: Date };
  currentUser?: UserProfile | null;
}

const formatDateSafe = (dateValue: any): string => {
  if (!dateValue) return 'N/A';
  if (dateValue instanceof Date) return isValid(dateValue) ? format(dateValue, 'dd/MM/yyyy') : 'N/A';
  if (typeof dateValue === 'object' && dateValue !== null && typeof (dateValue as any).seconds === 'number') {
    return format(new Date((dateValue as any).seconds * 1000), 'dd/MM/yyyy');
  }
  if (typeof dateValue === 'string') {
    const parsed = new Date(dateValue);
    if (isValid(parsed)) return format(parsed, 'dd/MM/yyyy');
  }
  return 'N/A';
};

export default function DashboardDialogs({ dialogState, setDialogState, allFileEntries, allArsEntries, financeDates, currentUser }: DashboardDialogsProps) {
  const { toast } = useToast();
  const { isOpen, title, data, columns, type } = dialogState;
  const [deletingItem, setDeletingItem] = useState<any | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  
  const getFileDetailUrl = (row: any) => {
    const fileNo = row.fileNo;
    if (!fileNo || fileNo === 'N/A' || fileNo === '-') return '#';

    // 1. Check if it's an ARS Scheme (from module)
    if (row.id && (row.applicantName === 'ARS Scheme' || row.purpose === 'ARS Scheme')) {
      return `/dashboard/ars/entry?id=${row.id}`;
    }

    // 2. Check regular files
    const entry = allFileEntries.find(e => e.fileNo === fileNo);
    if (entry && entry.id) {
      const hasInvestigationPurpose = entry.siteDetails?.some(site => site.purpose === 'GW Investigation');
      const hasLoggingPumpingPurpose = entry.siteDetails?.some(site => site.purpose && LOGGING_PUMPING_TEST_PURPOSE_OPTIONS.includes(site.purpose as any));

      let workType = '';
      const appType = entry.applicationType as ApplicationType;

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

      const queryParams = new URLSearchParams({ id: entry.id });
      if (workType) queryParams.set('workType', workType);
      
      return `/dashboard/data-entry?${queryParams.toString()}`;
    }

    return '#';
  };

  const handleFileNoClick = (row: any) => {
    const url = getFileDetailUrl(row);
    if (url === '#') {
      toast({ title: "Record Not Found", description: "The source record for this File No could not be identified.", variant: "destructive" });
      return;
    }
    // For standard left-click, use current window or handled via Link component
  };

  const handleDeleteFee = async () => {
    if (!deletingItem || !deletingItem.appId) return;
    if (!currentUser || (currentUser.role !== 'admin' && currentUser.role !== 'superAdmin' && currentUser.role !== 'engineer')) {
      toast({
        title: "Permission Denied",
        description: "You do not have permission to delete fee entries.",
        variant: "destructive"
      });
      return;
    }
    setIsDeleting(true);
    try {
      const office = (deletingItem.officeLocation || currentUser?.officeLocation || '').toLowerCase();
      if (!office) {
        throw new Error("Office location could not be determined for this record.");
      }
      
      const docRef = doc(db, `offices/${office}/agencyApplications`, deletingItem.appId);
      const docSnap = await getDoc(docRef);
      if (!docSnap.exists()) {
        throw new Error("Agency application document not found in database.");
      }
      const appData = docSnap.data();

      if (deletingItem.sourceType === 'applicationFeesArray') {
        const fees: any[] = appData.applicationFees || [];
        let removed = false;
        const updatedFees = fees.filter(f => {
          if (removed) return true;
          if (deletingItem.feeId && f.id) {
            if (f.id === deletingItem.feeId) {
              removed = true;
              return false;
            }
            return true;
          }
          const matchesDate = !deletingItem.rawPaymentDate || (formatDateSafe(f.applicationFeePaymentDate) === formatDateSafe(deletingItem.rawPaymentDate));
          const matchesAmount = Number(f.applicationFeeAmount) === Number(deletingItem.originalFeeAmount ?? deletingItem.rawAmount);
          if (matchesDate && matchesAmount) {
            removed = true;
            return false;
          }
          return true;
        });

        await updateDoc(docRef, {
          applicationFees: updatedFees,
          updatedAt: serverTimestamp()
        });
      } else if (deletingItem.sourceType === 'rigDirectFee' && deletingItem.rigId) {
        const rigs: any[] = (appData.rigs || []).map((r: any) => {
          if (r.id === deletingItem.rigId) {
            return {
              ...r,
              applicationFee: null,
              applicationChallanAmount: null,
              applicationPaymentDate: null,
              applicationChallanNo: null
            };
          }
          return r;
        });

        await updateDoc(docRef, {
          rigs,
          updatedAt: serverTimestamp()
        });
      } else if (deletingItem.sourceType === 'agencyDirectFee') {
        await updateDoc(docRef, {
          agencyApplicationFee: null,
          agencyApplicationChallanAmount: null,
          agencyApplicationPaymentDate: null,
          agencyApplicationChallanNo: null,
          updatedAt: serverTimestamp()
        });
      }

      setDialogState(prev => ({
        ...prev,
        data: prev.data.filter(item => item !== deletingItem)
      }));

      toast({
        title: "Fee Entry Deleted",
        description: `Successfully deleted fee entry of ₹${(Number(deletingItem.rawAmount) || 0).toLocaleString('en-IN')}. The agency registration record remains intact.`,
      });
      setDeletingItem(null);
    } catch (err: any) {
      console.error("Error deleting fee entry:", err);
      toast({
        title: "Delete Failed",
        description: err.message || "Failed to delete fee entry.",
        variant: "destructive"
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const exportDialogDataToExcel = async () => {
    const reportTitle = title;
    const exportableColumns = columns.filter(col => col.key !== 'action');
    const columnLabels = exportableColumns.map(col => col.label);
    
    if (data.length === 0) {
      toast({ title: "No Data to Export", variant: "default" });
      return;
    }

    const ExcelJS = (await import('exceljs')).default;
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet(title.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 30));

    worksheet.addRow(["Ground Water Department"]).commit();
    worksheet.addRow([reportTitle]).commit();
    worksheet.addRow([`Report generated on: ${format(new Date(), 'dd/MM/yyyy HH:mm')}`]).commit();
    worksheet.addRow([]).commit();

    const numCols = columnLabels.length;
    worksheet.mergeCells(1, 1, 1, numCols);
    worksheet.mergeCells(2, 1, 2, numCols);
    worksheet.mergeCells(3, 1, 3, numCols);

    worksheet.getCell('A1').alignment = { horizontal: 'center' };
    worksheet.getCell('A2').alignment = { horizontal: 'center' };
    
    worksheet.getRow(1).font = { bold: true, size: 16 };
    worksheet.getRow(2).font = { bold: true, size: 14 };
    
    const headerRow = worksheet.addRow(columnLabels);
    headerRow.font = { bold: true };
    headerRow.eachCell(cell => {
      cell.fill = { type: 'pattern', pattern:'solid', fgColor:{argb:'F0F0F0'} };
      cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
    });

    data.forEach(rowData => {
      const values = exportableColumns.map(col => rowData[col.key] ?? '');
      const newRow = worksheet.addRow(values);
      newRow.eachCell((cell, colNumber) => {
          cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
          if (exportableColumns[colNumber - 1]?.isNumeric) {
            cell.alignment = { horizontal: 'right' };
          }
      });
    });

     worksheet.columns.forEach((column, i) => {
        let maxLength = 0;
        column.eachCell!({ includeEmpty: true }, (cell) => {
            let columnLength = cell.value ? cell.value.toString().length : 10;
            if (columnLength > maxLength) {
                maxLength = columnLength;
            }
        });
        column.width = maxLength < 10 ? 10 : maxLength + 2;
    });
    
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `gwd_report_${title.replace(/[^a-zA-Z0-9]/g, '_')}_${format(new Date(), 'yyyyMMdd_HHmmss')}.xlsx`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: "Excel Exported" });
  };
  
  const userRole = currentUser?.role;
  const isFileNoClickable = userRole !== 'superAdmin' && userRole !== 'investigator' && userRole !== 'supervisor';
  const isDeleteAllowed = userRole === 'admin' || userRole === 'superAdmin' || userRole === 'engineer';
  
  return (
    <>
      <Dialog open={isOpen} onOpenChange={(open) => setDialogState({ ...dialogState, isOpen: open })}>
        <DialogContent onPointerDownOutside={(e) => e.preventDefault()} className="max-w-5xl w-[95vw] p-0 flex flex-col h-[90vh] z-[60]">
          <DialogHeader className="p-6 pb-4 border-b shrink-0">
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription>
              Showing {data.length} records. {financeDates?.start && financeDates?.end ? `from ${format(financeDates.start, "dd/MM/yyyy")} to ${format(financeDates.end, "dd/MM/yyyy")}` : ""}.
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 min-h-0 px-6 py-4 overflow-hidden">
              <ScrollArea className="h-full w-full">
                <div className="min-w-full pb-4">
                  {data.length > 0 ? (
                    <Table className="min-w-[950px] w-full">
                      <TableHeader className="sticky top-0 bg-background z-10 shadow-sm">
                        <TableRow>
                          {columns.map(col => 
                            <TableHead key={col.key} className={cn('whitespace-nowrap font-bold text-xs bg-background', col.isNumeric && 'text-right', col.key === 'action' && 'text-center')}>{col.label}</TableHead>
                          )}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {data.map((row, rowIndex) => {
                          const detailUrl = getFileDetailUrl(row);
                          return (
                          <TableRow key={rowIndex}>
                            {columns.map(col => (
                              <TableCell key={col.key} className={cn('text-xs whitespace-nowrap', col.key === 'agencyName' && 'whitespace-normal min-w-[200px]', col.isNumeric && 'text-right font-mono', col.key === 'action' && 'text-center')}>
                                {col.key === 'fileNo' ? (
                                    <Link 
                                        href={detailUrl}
                                        className={cn(
                                            "font-mono text-xs text-primary font-bold transition-all",
                                            isFileNoClickable ? "hover:underline" : "cursor-default text-primary/80"
                                        )}
                                        onClick={(e) => {
                                          if (!isFileNoClickable || detailUrl === '#') {
                                            e.preventDefault();
                                            if (detailUrl === '#') handleFileNoClick(row);
                                          }
                                        }}
                                        onContextMenu={(e) => {
                                          if (isFileNoClickable && detailUrl !== '#') {
                                            e.preventDefault();
                                            window.open(detailUrl, '_blank', 'noopener,noreferrer');
                                          }
                                        }}
                                    >
                                        {row[col.key]}
                                    </Link>
                                ) : col.key === 'feeSource' ? (
                                    <span className={cn(
                                        "inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold border whitespace-nowrap",
                                        row[col.key] === 'Application Fee'
                                            ? "bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950 dark:text-sky-300 dark:border-sky-800"
                                            : "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950 dark:text-purple-300 dark:border-purple-800"
                                    )}>
                                        {row[col.key]}
                                    </span>
                                ) : col.key === 'action' ? (
                                    (row.action === 'delete' && isDeleteAllowed) ? (
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          className="h-7 w-7 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                                          title="Delete this fee entry from database"
                                          onClick={() => setDeletingItem(row)}
                                        >
                                          <Trash2 className="h-3.5 w-3.5" />
                                        </Button>
                                    ) : null
                                ) : (
                                  row[col.key]
                                )}
                              </TableCell>
                            ))}
                          </TableRow>
                        )})}
                      </TableBody>
                    </Table>
                  ) : (
                    <p className="text-center text-muted-foreground py-8">No details found for the selected criteria.</p>
                  )}
                </div>
                <ScrollBar orientation="horizontal" />
                <ScrollBar orientation="vertical" />
              </ScrollArea>
          </div>
          <DialogFooter className="p-6 pt-4 border-t shrink-0">
            <Button variant="outline" onClick={exportDialogDataToExcel} disabled={data.length === 0}><FileDown className="mr-2 h-4 w-4" /> Export Excel</Button>
            <DialogClose asChild><Button type="button" variant="secondary">Close</Button></DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirmation Alert Dialog for Deleting Fee Entry */}
      {deletingItem && (
        <AlertDialog open={!!deletingItem} onOpenChange={(open) => { if (!open && !isDeleting) setDeletingItem(null); }}>
          <AlertDialogContent className="z-[100] max-w-md">
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2 text-destructive">
                <AlertTriangle className="h-5 w-5" /> Delete Fee Entry
              </AlertDialogTitle>
              <AlertDialogDescription asChild>
                <div className="space-y-2 pt-2 text-foreground text-sm">
                  <span>
                    Are you sure you want to delete this fee entry of <strong className="text-primary font-mono">₹{(Number(deletingItem.rawAmount) || 0).toLocaleString('en-IN')}</strong> for agency <strong>{deletingItem.agencyName}</strong>?
                  </span>
                  <span className="block text-xs text-muted-foreground bg-muted p-2 rounded border">
                    Note: This will permanently remove only this fee record from the database. The agency registration file itself will NOT be deleted.
                  </span>
                </div>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isDeleting} onClick={() => setDeletingItem(null)}>Cancel</AlertDialogCancel>
              <Button
                variant="destructive"
                disabled={isDeleting}
                onClick={handleDeleteFee}
                className="gap-2"
              >
                {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                {isDeleting ? 'Deleting...' : 'Delete Fee'}
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </>
  );
}

