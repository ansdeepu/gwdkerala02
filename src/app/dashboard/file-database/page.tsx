
// src/app/dashboard/file-database/page.tsx
"use client";

import React, { useState, useMemo, useEffect, useCallback } from "react";
import FileDatabaseTable from "@/components/database/FileDatabaseTable";
import { Card, CardContent } from "@/components/ui/card";
import { useFileEntries } from "@/hooks/useFileEntries";
import { usePageHeader } from "@/hooks/usePageHeader";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import PaginationControls from "@/components/shared/PaginationControls";
import { useAuth } from "@/hooks/useAuth";
import { useDataStore } from "@/hooks/use-data-store";
import { DebouncedSearchInput } from "@/components/shared/DebouncedSearchInput";
import { matchesAllDataSearch } from "@/lib/searchUtils";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Download, FileSpreadsheet, RefreshCw, AlertCircle, CheckCircle2, Clock, Wallet, TrendingUp, TrendingDown } from "lucide-react";
import { PUBLIC_DEPOSIT_APPLICATION_TYPES, PRIVATE_APPLICATION_TYPES, COLLECTOR_APPLICATION_TYPES, PLAN_FUND_APPLICATION_TYPES } from "@/lib/schemas";
import type { DataEntryFormData } from "@/lib/schemas";

const ITEMS_PER_PAGE = 50;

export default function FileDatabasePage() {
  const { setHeader } = usePageHeader();
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const [currentPage, setCurrentPage] = useState(1);
  const { user } = useAuth();
  const { allFileEntries, searchTerms, setModuleSearchTerm } = useDataStore();
  
  const searchTerm = searchTerms['file-database'] || "";
  const setSearchTerm = (term: string) => setModuleSearchTerm('file-database', term);

  const tabFromUrl = searchParams?.get('filter') || "all";
  const [activeFilter, setActiveFilter] = useState(tabFromUrl);

  useEffect(() => {
    setHeader('All File Entries', 'Browse, search, filter, and inspect financial health for all submitted file entries.');
  }, [setHeader]);

  useEffect(() => {
    const page = searchParams?.get('page');
    if (page && !isNaN(parseInt(page))) {
      setCurrentPage(parseInt(page));
    } else {
      setCurrentPage(1);
    }
  }, [searchParams]);

  useEffect(() => {
    if (tabFromUrl && tabFromUrl !== activeFilter) {
      setActiveFilter(tabFromUrl);
    }
  }, [tabFromUrl, activeFilter]);

  const { fileEntries, isLoading } = useFileEntries();

  const handleFilterChange = (filter: string) => {
    setActiveFilter(filter);
    setCurrentPage(1);
    const params = new URLSearchParams(searchParams?.toString());
    params.set('filter', filter);
    params.set('page', '1');
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  // Helper for computing financial balance
  const computeFinancials = useCallback((entry: DataEntryFormData) => {
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

  // Global search filtering
  const searchedEntries = useMemo(() => {
    if (!searchTerm.trim()) return fileEntries;
    return fileEntries.filter(entry => matchesAllDataSearch(entry, searchTerm));
  }, [fileEntries, searchTerm]);

  // Tab categorization filtering
  const filteredEntries = useMemo(() => {
    return searchedEntries.filter(entry => {
      if (activeFilter === 'all') return true;
      
      const appType = entry.applicationType as any;
      const { balance } = computeFinancials(entry);
      const isCompleted = (entry.siteDetails || []).length > 0 && entry.siteDetails!.every(s => 
        ['Work Completed', 'Completed', 'Payment Completed', 'Utilization Certificate Issued'].includes(s.workStatus || '')
      );
      const isCancelled = (entry.siteDetails || []).length > 0 && entry.siteDetails!.every(s => s.workStatus === 'Work Cancelled');

      if (activeFilter === 'active') {
        return !isCompleted && !isCancelled;
      }
      if (activeFilter === 'completed') {
        return isCompleted;
      }
      if (activeFilter === 'deficit') {
        return balance < 0;
      }
      if (activeFilter === 'public') {
        return (PUBLIC_DEPOSIT_APPLICATION_TYPES as any).includes(appType) || (PRIVATE_APPLICATION_TYPES as any).includes(appType) || !appType;
      }
      if (activeFilter === 'collector') {
        return (COLLECTOR_APPLICATION_TYPES as any).includes(appType);
      }
      if (activeFilter === 'planFund') {
        return (PLAN_FUND_APPLICATION_TYPES as any).includes(appType);
      }
      return true;
    });
  }, [searchedEntries, activeFilter, computeFinancials]);

  // Calculate overall metrics for the filtered files
  const metrics = useMemo(() => {
    let totalRem = 0;
    let totalExp = 0;
    let deficitCount = 0;

    filteredEntries.forEach(entry => {
      const { totalCredit, totalDebit, balance } = computeFinancials(entry);
      totalRem += totalCredit;
      totalExp += totalDebit;
      if (balance < 0) deficitCount += 1;
    });

    return {
      totalFiles: filteredEntries.length,
      totalRem,
      totalExp,
      netBalance: totalRem - totalExp,
      deficitCount
    };
  }, [filteredEntries, computeFinancials]);

  // Pagination
  const totalPages = Math.ceil(filteredEntries.length / ITEMS_PER_PAGE);
  const paginatedEntries = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredEntries.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredEntries, currentPage]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    const params = new URLSearchParams(searchParams?.toString());
    params.set('page', String(page));
    router.push(`?${params.toString()}`);
  };

  // Export filtered entries to CSV
  const handleExportCSV = () => {
    if (filteredEntries.length === 0) return;
    
    const headers = ["Sl No", "File No", "Applicant Name", "Application Type", "Sites", "Purposes", "Remittance Total", "Expenditure Total", "Net Balance", "File Status"];
    
    const rows = filteredEntries.map((entry, idx) => {
      const { totalCredit, totalDebit, balance } = computeFinancials(entry);
      const sites = (entry.siteDetails || []).map(s => s.nameOfSite || '').join('; ');
      const purposes = (entry.siteDetails || []).map(s => s.purpose || '').join('; ');

      return [
        idx + 1,
        `"${entry.fileNo || ''}"`,
        `"${(entry.applicantName || '').replace(/"/g, '""')}"`,
        `"${entry.applicationType || ''}"`,
        `"${sites.replace(/"/g, '""')}"`,
        `"${purposes.replace(/"/g, '""')}"`,
        totalCredit,
        totalDebit,
        balance,
        `"${entry.fileStatus || ''}"`
      ];
    });

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `GWD_File_Database_${activeFilter}_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-4">
      {/* Top Controls: Search, Filters, and Export */}
      <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        <div className="flex-1 max-w-md">
          <DebouncedSearchInput
            placeholder="Search by File No, applicant, site, amount..."
            value={searchTerm}
            onDebouncedChange={setSearchTerm}
            className="w-full bg-background"
          />
        </div>
        <div className="flex items-center gap-2 self-end md:self-auto">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleExportCSV} 
            disabled={filteredEntries.length === 0}
            className="h-9 gap-1.5 shadow-2xs"
          >
            <Download className="h-4 w-4 text-primary" />
            <span>Export CSV</span>
          </Button>
        </div>
      </div>

      {/* Metrics Banner */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="p-3 bg-card border border-border/70 rounded-lg shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Total Files</span>
            <FileSpreadsheet className="h-4 w-4 text-primary" />
          </div>
          <div className="mt-1 text-xl font-bold font-mono text-foreground">
            {metrics.totalFiles.toLocaleString('en-IN')}
          </div>
        </div>
        <div className="p-3 bg-card border border-border/70 rounded-lg shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Total Remittance</span>
            <TrendingUp className="h-4 w-4 text-emerald-600" />
          </div>
          <div className="mt-1 text-lg font-bold font-mono text-emerald-600 dark:text-emerald-400">
            ₹{metrics.totalRem.toLocaleString('en-IN')}
          </div>
        </div>
        <div className="p-3 bg-card border border-border/70 rounded-lg shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Total Expenditure</span>
            <TrendingDown className="h-4 w-4 text-red-500" />
          </div>
          <div className="mt-1 text-lg font-bold font-mono text-red-600 dark:text-red-400">
            ₹{metrics.totalExp.toLocaleString('en-IN')}
          </div>
        </div>
        <div className="p-3 bg-card border border-border/70 rounded-lg shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Net Balance</span>
            <Wallet className="h-4 w-4 text-blue-600" />
          </div>
          <div className={`mt-1 text-lg font-bold font-mono ${metrics.netBalance >= 0 ? 'text-blue-600 dark:text-blue-400' : 'text-red-600'}`}>
            ₹{metrics.netBalance.toLocaleString('en-IN')}
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="overflow-x-auto pb-1">
        <Tabs value={activeFilter} onValueChange={handleFilterChange} className="w-full">
          <TabsList className="h-9 p-1 bg-muted/80">
            <TabsTrigger value="all" className="text-xs px-3">All Files ({searchedEntries.length})</TabsTrigger>
            <TabsTrigger value="active" className="text-xs px-3">Active / In Progress</TabsTrigger>
            <TabsTrigger value="completed" className="text-xs px-3">Completed</TabsTrigger>
            <TabsTrigger value="deficit" className="text-xs px-3 text-red-600 dark:text-red-400">
              Deficit ({searchedEntries.filter(e => computeFinancials(e).balance < 0).length})
            </TabsTrigger>
            <TabsTrigger value="public" className="text-xs px-3">Public Deposit</TabsTrigger>
            <TabsTrigger value="collector" className="text-xs px-3">Collector Deposit</TabsTrigger>
            <TabsTrigger value="planFund" className="text-xs px-3">Plan Fund</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Main Table Card */}
      <Card className="shadow-lg border-border/70">
        <CardContent className="pt-4 px-3 sm:px-6">
          <div className="flex justify-center pb-3">
            {totalPages > 1 && <PaginationControls currentPage={currentPage} totalPages={totalPages} onPageChange={handlePageChange} />}
          </div>
          <FileDatabaseTable 
            fileEntries={paginatedEntries} 
            isLoading={isLoading} 
            searchActive={!!searchTerm.trim() || activeFilter !== 'all'} 
            totalEntries={filteredEntries.length}
            currentPage={currentPage}
            userRole={user?.role}
            currentModule="all"
          />
          <div className="flex justify-center pt-4">
            {totalPages > 1 && <PaginationControls currentPage={currentPage} totalPages={totalPages} onPageChange={handlePageChange} />}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

