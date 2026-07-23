"use client";

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useDataStore } from '@/hooks/use-data-store';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Search, 
  FileText, 
  Truck, 
  Briefcase, 
  Gavel, 
  Sparkles, 
  ChevronRight, 
  X,
  Building2,
  Calendar,
  User,
  Hash
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface SearchResultItem {
  id: string;
  category: 'Work Entry' | 'ARS Work' | 'Rig Registration' | 'e-Tender' | 'Vehicle';
  title: string;
  subtitle: string;
  fileNo?: string;
  applicant?: string;
  status?: string;
  challanNo?: string;
  office?: string;
  href: string;
  icon: React.ReactNode;
}

export function GlobalSearchCommand({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = Router();
  const [query, setQuery] = useState('');
  const {
    allFileEntries,
    allArsEntries,
    allAgencyApplications,
    allE_tenders,
    allDepartmentVehicles,
    allHiredVehicles,
  } = useDataStore();

  function Router() {
    return useRouter();
  }

  // Clear query on close
  useEffect(() => {
    if (!open) {
      setQuery('');
    }
  }, [open]);

  // Aggregate searchable items
  const results = useMemo<SearchResultItem[]>(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];

    const matched: SearchResultItem[] = [];

    // 1. File Entries (Deposit, Plan Fund, Investigation, etc.)
    allFileEntries.forEach((entry) => {
      const fileNo = (entry.fileNo || '').toLowerCase();
      const applicant = (entry.applicantName || '').toLowerCase();
      const subject = (entry.fileSubject || '').toLowerCase();
      const office = (entry.officeLocation || '').toLowerCase();
      
      // Check site details inside file entry
      const siteMatch = entry.siteDetails?.some((s) => 
        (s.nameOfSite || '').toLowerCase().includes(q) ||
        (s.contractorName || '').toLowerCase().includes(q) ||
        (s.challanNo || '').toLowerCase().includes(q)
      );

      if (
        fileNo.includes(q) ||
        applicant.includes(q) ||
        subject.includes(q) ||
        office.includes(q) ||
        siteMatch
      ) {
        const siteNames = entry.siteDetails?.map(s => s.nameOfSite).filter(Boolean).join(', ') || 'General Work';
        matched.push({
          id: entry.id || entry.fileNo || Math.random().toString(),
          category: 'Work Entry',
          title: entry.applicantName ? `${entry.applicantName}` : (entry.fileSubject || 'Deposit Work Entry'),
          subtitle: `File: ${entry.fileNo || 'N/A'} • Sites: ${siteNames}`,
          fileNo: entry.fileNo,
          applicant: entry.applicantName,
          status: entry.status || 'Active',
          office: entry.officeLocation,
          href: `/dashboard/data-entry?id=${entry.id}&workType=${entry.workType || 'public'}`,
          icon: <FileText className="h-4 w-4 text-sky-500" />,
        });
      }
    });

    // 2. ARS Entries
    allArsEntries.forEach((ars) => {
      const fileNo = (ars.fileNo || '').toLowerCase();
      const site = (ars.nameOfSite || '').toLowerCase();
      const lsg = (ars.localSelfGovt || '').toLowerCase();
      const contractor = (ars.arsContractorName || '').toLowerCase();
      const tender = (ars.arsTenderNo || '').toLowerCase();

      if (
        fileNo.includes(q) ||
        site.includes(q) ||
        lsg.includes(q) ||
        contractor.includes(q) ||
        tender.includes(q)
      ) {
        matched.push({
          id: ars.id,
          category: 'ARS Work',
          title: ars.nameOfSite || 'ARS Project',
          subtitle: `File: ${ars.fileNo || 'N/A'} • LSG: ${ars.localSelfGovt || 'N/A'} • Status: ${ars.arsStatus || 'Active'}`,
          fileNo: ars.fileNo,
          applicant: ars.localSelfGovt,
          status: ars.arsStatus,
          href: `/dashboard/ars/entry?id=${ars.id}`,
          icon: <Briefcase className="h-4 w-4 text-emerald-500" />,
        });
      }
    });

    // 3. Agency / Rig Registrations
    allAgencyApplications.forEach((app) => {
      const appNo = (app.applicationNumber || '').toLowerCase();
      const agency = (app.agencyName || '').toLowerCase();
      const owner = (app.ownerName || '').toLowerCase();
      const regNo = (app.registrationNumber || '').toLowerCase();
      const gst = (app.gstNumber || '').toLowerCase();
      
      const rigMatch = app.rigs?.some((r) =>
        (r.registrationNumber || '').toLowerCase().includes(q) ||
        (r.vehicleNumber || '').toLowerCase().includes(q) ||
        (r.rigType || '').toLowerCase().includes(q)
      );

      if (
        appNo.includes(q) ||
        agency.includes(q) ||
        owner.includes(q) ||
        regNo.includes(q) ||
        gst.includes(q) ||
        rigMatch
      ) {
        matched.push({
          id: app.id || app.applicationNumber || Math.random().toString(),
          category: 'Rig Registration',
          title: app.agencyName || app.ownerName || 'Rig Registration Agency',
          subtitle: `App No: ${app.applicationNumber || 'N/A'} • Reg: ${app.registrationNumber || 'Pending'} • Owner: ${app.ownerName || 'N/A'}`,
          fileNo: app.applicationNumber,
          applicant: app.ownerName,
          status: app.status || 'Active',
          href: `/dashboard/agency-registration?id=${app.id}`,
          icon: <Truck className="h-4 w-4 text-amber-500" />,
        });
      }
    });

    // 4. e-Tenders
    allE_tenders.forEach((et) => {
      const tNo = (et.tenderNo || '').toLowerCase();
      const work = (et.workName || '').toLowerCase();
      const bidderMatch = et.bidders?.some((b) => (b.bidderName || '').toLowerCase().includes(q));

      if (tNo.includes(q) || work.includes(q) || bidderMatch) {
        matched.push({
          id: et.id,
          category: 'e-Tender',
          title: et.workName || 'e-Tender Notice',
          subtitle: `Tender No: ${et.tenderNo || 'N/A'} • Status: ${et.status || 'Active'}`,
          fileNo: et.tenderNo,
          status: et.status,
          href: `/dashboard/e-tender?id=${et.id}`,
          icon: <Gavel className="h-4 w-4 text-purple-500" />,
        });
      }
    });

    // 5. Vehicles & Rigs
    allDepartmentVehicles.concat(allHiredVehicles as any).forEach((v) => {
      const reg = (v.vehicleNo || v.registrationNo || '').toLowerCase();
      const make = (v.makeModel || v.vehicleType || '').toLowerCase();
      const driver = (v.driverName || '').toLowerCase();

      if (reg.includes(q) || make.includes(q) || driver.includes(q)) {
        matched.push({
          id: v.id || reg || Math.random().toString(),
          category: 'Vehicle',
          title: `${v.vehicleNo || v.registrationNo || 'Vehicle'} (${v.makeModel || 'Department Vehicle'})`,
          subtitle: `Driver: ${v.driverName || 'N/A'} • Office: ${v.officeLocation || 'N/A'}`,
          fileNo: v.vehicleNo,
          status: v.status || 'Active',
          href: `/dashboard/vehicles`,
          icon: <Truck className="h-4 w-4 text-indigo-500" />,
        });
      }
    });

    return matched.slice(0, 30); // Cap at top 30 most relevant
  }, [query, allFileEntries, allArsEntries, allAgencyApplications, allE_tenders, allDepartmentVehicles, allHiredVehicles]);

  const handleSelect = useCallback(
    (href: string) => {
      onOpenChange(false);
      router.push(href);
    },
    [router, onOpenChange]
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="p-0 max-w-2xl overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xl bg-card">
        <DialogHeader className="sr-only">
          <DialogTitle>Global Search</DialogTitle>
        </DialogHeader>

        {/* Search Input Bar */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
          <Search className="h-5 w-5 text-muted-foreground shrink-0" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by File No, Applicant, Site Name, Challan No, or Rig No..."
            className="border-none shadow-none focus-visible:ring-0 text-base placeholder:text-muted-foreground/70 bg-transparent h-9 p-0"
            autoFocus
          />
          {query ? (
            <button
              onClick={() => setQuery('')}
              className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-slate-200/50 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          ) : (
            <kbd className="hidden sm:inline-flex items-center gap-1 rounded border border-slate-200 dark:border-slate-700 bg-background px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
              ESC
            </kbd>
          )}
        </div>

        {/* Results Area */}
        <ScrollArea className="max-h-[60vh] p-2">
          {!query.trim() ? (
            <div className="p-8 text-center text-muted-foreground space-y-3">
              <Sparkles className="h-8 w-8 mx-auto text-primary/60 animate-pulse" />
              <p className="text-sm font-medium text-foreground">Quick Search Across All Records</p>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                Type any File Number, Applicant Name, Challan Number, ARS Site, Rig Application, or Vehicle Number.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-2 pt-2 text-[11px]">
                <Badge variant="outline" className="bg-slate-100 dark:bg-slate-800/60 font-normal">
                  <Hash className="h-3 w-3 mr-1 text-sky-500" /> File Numbers
                </Badge>
                <Badge variant="outline" className="bg-slate-100 dark:bg-slate-800/60 font-normal">
                  <User className="h-3 w-3 mr-1 text-emerald-500" /> Applicant / Owner
                </Badge>
                <Badge variant="outline" className="bg-slate-100 dark:bg-slate-800/60 font-normal">
                  <Building2 className="h-3 w-3 mr-1 text-purple-500" /> ARS & Tenders
                </Badge>
                <Badge variant="outline" className="bg-slate-100 dark:bg-slate-800/60 font-normal">
                  <Truck className="h-3 w-3 mr-1 text-amber-500" /> Rigs & Vehicles
                </Badge>
              </div>
            </div>
          ) : results.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground">
              <p className="text-sm font-medium">No results found for &quot;{query}&quot;</p>
              <p className="text-xs text-muted-foreground mt-1">Try checking for typos or searching by File No or Applicant Name.</p>
            </div>
          ) : (
            <div className="space-y-1 p-1">
              <div className="px-3 py-1 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center justify-between">
                <span>Matching Records ({results.length})</span>
                <span className="text-[10px] font-normal text-muted-foreground/80">Press item to view</span>
              </div>
              {results.map((item) => (
                <button
                  key={item.category + item.id}
                  onClick={() => handleSelect(item.href)}
                  className="w-full text-left p-3 rounded-lg flex items-center justify-between gap-3 hover:bg-slate-100/80 dark:hover:bg-slate-800/80 transition-all duration-150 group border border-transparent hover:border-slate-200 dark:hover:border-slate-700"
                >
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 group-hover:bg-background transition-colors shrink-0 mt-0.5">
                      {item.icon}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm text-foreground truncate group-hover:text-primary transition-colors">
                          {item.title}
                        </span>
                        <Badge
                          variant="secondary"
                          className="text-[10px] px-1.5 py-0 font-medium shrink-0 bg-slate-100 dark:bg-slate-800"
                        >
                          {item.category}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground truncate mt-0.5 font-sans">
                        {item.subtitle}
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground/50 group-hover:text-primary group-hover:translate-x-0.5 transition-all shrink-0" />
                </button>
              ))}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
