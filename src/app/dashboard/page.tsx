
// src/app/dashboard/page.tsx
"use client";

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useFileEntries } from "@/hooks/useFileEntries";
import { useStaffMembers } from "@/hooks/useStaffMembers";
import { useAgencyApplications } from '@/hooks/useAgencyApplications';
import { useAuth, updateUserLastActive } from '@/hooks/useAuth';
import { useAllFileEntriesForReports } from '@/hooks/useAllFileEntriesForReports';
import { usePageHeader } from '@/hooks/usePageHeader';
import FileStatusOverview from '@/components/dashboard/FileStatusOverview';
import NoticeBoard from '@/components/dashboard/NoticeBoard';
import ImportantUpdates from '@/components/dashboard/ImportantUpdates';
import ETenderNoticeBoard from '@/components/dashboard/ETenderNoticeBoard'; 
import WorkStatusByService from '@/components/dashboard/WorkStatusByService';
import ArsStatusOverview from '@/components/dashboard/ArsStatusOverview';
import RigRegistrationOverview from '@/components/dashboard/RigRegistrationOverview';
import WorkProgress from '@/components/dashboard/WorkProgress';
import SupervisorWork from '@/components/dashboard/SupervisorWork';
import DepartmentalRigWorks from '@/components/dashboard/DepartmentalRigWorks';
import DashboardDialogs from '@/components/dashboard/DashboardDialogs';
import FinanceOverview from '@/components/dashboard/FinanceOverview';
import RigFinancialSummary from '@/components/dashboard/RigFinancialSummary';
import ConstituencyWiseOverview from '@/components/dashboard/ConstituencyWiseOverview';
import PresentWorkDetails from '@/components/dashboard/PresentWorkDetails';
import { useDataStore } from '@/hooks/use-data-store';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { 
  PRIVATE_APPLICATION_TYPES, 
  LOGGING_PUMPING_TEST_PURPOSE_OPTIONS, 
  PUBLIC_DEPOSIT_APPLICATION_TYPES, 
  COLLECTOR_APPLICATION_TYPES, 
  PLAN_FUND_APPLICATION_TYPES 
} from '@/lib/schemas';
import { 
  Loader2, 
  Briefcase, 
  FolderKanban, 
  Layers, 
  MapPin, 
  IndianRupee, 
  Droplets, 
  Truck, 
  Receipt, 
  TrendingUp, 
  Users, 
  Gauge, 
  ArrowUpRight,
  Maximize2,
  X
} from 'lucide-react';
import { cn } from '@/lib/utils';

const COMPLETED_WORK_STATUSES: string[] = ["Work Completed", "Work Failed", "Completed"];
const ONGOING_STATUSES = ["Department Rig Allotted", "Work Order Issued", "Work in Progress"];

type SectionModalKey = 
  | 'present-work'
  | 'file-status'
  | 'work-status'
  | 'constituency'
  | 'finance'
  | 'ars'
  | 'rig-registration'
  | 'rig-financials'
  | 'work-progress'
  | 'supervisor-work'
  | 'rig-works'
  | null;

export default function DashboardPage() {
  const { setHeader } = usePageHeader();
  const { fileEntries: filteredFileEntries, isLoading: filteredEntriesLoading } = useFileEntries();
  const { reportEntries: allFileEntries, isReportLoading } = useAllFileEntriesForReports();
  const { staffMembers, isLoading: staffLoading } = useStaffMembers();
  const { user: currentUser, isLoading: authLoading } = useAuth();
  const { applications: agencyApplications, isLoading: agenciesLoading } = useAgencyApplications();
  const { 
    allRigCompressors,
    allArsEntries: arsEntries, 
    allUsers,
    isLoading: storeLoading 
  } = useDataStore();

  const [activeSection, setActiveSection] = useState<SectionModalKey>(null);

  const [dialogState, setDialogState] = useState({
    isOpen: false,
    title: "",
    data: [] as any[],
    columns: [] as { key: string; label: string; isNumeric?: boolean; }[],
    type: 'detail' as 'detail' | 'rig' | 'age' | 'month' | 'fileStatus' | 'finance'
  });
  
  const [financeDates, setFinanceDates] = useState<{ start?: Date, end?: Date }>({});
  const [arsDates, setArsDates] = useState<{ start?: Date, end?: Date }>({});
  const [constituencyDates, setConstituencyDates] = useState<{ start?: Date, end?: Date }>({});

  useEffect(() => {
    setHeader('Dashboard', 'A high-level executive overview of all departmental activities and key metrics.');
    if (currentUser?.uid) {
        updateUserLastActive(currentUser.uid, currentUser.officeLocation);
    }
  }, [setHeader, currentUser]);

  const dashboardData = useMemo(() => {
    if (filteredEntriesLoading || isReportLoading || staffLoading || authLoading || storeLoading || !currentUser) return null;

    return {
        allFileEntriesForSupervisor: filteredFileEntries || [],
        allFileEntries: allFileEntries || [],
        staffMembers: staffMembers || []
    };
  }, [filteredEntriesLoading, isReportLoading, staffLoading, authLoading, storeLoading, currentUser, filteredFileEntries, allFileEntries, staffMembers]);

  // Live Summary Statistics for Cards
  const summaryMetrics = useMemo(() => {
    if (!dashboardData) return null;
    const files = dashboardData.allFileEntries || [];
    const ars = arsEntries || [];
    const agencies = agencyApplications || [];
    const rigs = allRigCompressors || [];

    // 1. Present Ongoing Works Count
    let presentOngoingCount = 0;
    let presentDeposit = 0;
    let presentCollector = 0;
    let presentPrivate = 0;
    let presentPlanFund = 0;

    files.forEach(entry => {
      const appType = entry.applicationType as any;
      entry.siteDetails?.forEach(site => {
        if (site.workStatus && ONGOING_STATUSES.includes(site.workStatus) && site.workStatus !== 'Work Cancelled') {
          presentOngoingCount++;
          if (PRIVATE_APPLICATION_TYPES.includes(appType)) presentPrivate++;
          else if (COLLECTOR_APPLICATION_TYPES.includes(appType)) presentCollector++;
          else if (PLAN_FUND_APPLICATION_TYPES.includes(appType)) presentPlanFund++;
          else presentDeposit++;
        }
      });
    });

    const presentArs = ars.filter(a => a.arsStatus && ONGOING_STATUSES.includes(a.arsStatus) && a.arsStatus !== 'Work Cancelled').length;
    presentOngoingCount += presentArs;

    // 2. File Status Overview
    const nonArsFiles = files.filter(e => !e.applicationType?.includes("ARS"));
    const underProcessCount = nonArsFiles.filter(e => e.fileStatus === 'File Under Process' || !e.fileStatus).length;
    const workInitiatedCount = nonArsFiles.filter(e => e.fileStatus === 'Work Initiated' || e.fileStatus === 'Tender Process').length;
    const completedFilesCount = nonArsFiles.filter(e => e.fileStatus?.includes('Completed')).length;
    const closedFilesCount = nonArsFiles.filter(e => e.fileStatus === 'File Closed').length;

    // 3. Work Status By Service
    let totalInvestigation = 0;
    let totalDrilling = 0;
    let totalLoggingPumping = 0;
    let totalOtherServices = 0;

    files.forEach(entry => {
      entry.siteDetails?.forEach(site => {
        if (site.purpose === 'GW Investigation') totalInvestigation++;
        else if (site.purpose && LOGGING_PUMPING_TEST_PURPOSE_OPTIONS.includes(site.purpose as any)) totalLoggingPumping++;
        else if (site.purpose?.toLowerCase().includes('drill') || site.purpose?.toLowerCase().includes('bore')) totalDrilling++;
        else totalOtherServices++;
      });
    });

    // 4. Finance Totals
    let totalRemittance = 0;
    let totalExpenditure = 0;
    let totalEstimate = 0;

    files.forEach(entry => {
      totalRemittance += entry.totalRemittance || 0;
      totalEstimate += entry.totalEstimateAmount || 0;
      entry.siteDetails?.forEach(site => {
        totalExpenditure += site.totalExpenditure || 0;
      });
    });

    // 5. ARS Overview
    const arsCompleted = ars.filter(a => a.arsStatus && COMPLETED_WORK_STATUSES.includes(a.arsStatus)).length;
    const arsInProgress = ars.filter(a => a.arsStatus && ONGOING_STATUSES.includes(a.arsStatus)).length;

    // 6. Rig Registrations
    const validAgencies = agencies.filter(a => a.status === 'Approved' || a.status === 'Valid').length;
    const pendingAgencies = agencies.filter(a => a.status === 'Under Process' || a.status === 'Pending' || a.status === 'Payment Pending').length;

    // 7. Rig Financial Summary (Total Collections)
    let totalAgencyRevenue = 0;
    agencies.forEach(app => {
      totalAgencyRevenue += (app.applicationFee || 0) + (app.registrationFee || 0) + (app.securityDeposit || 0) + (app.inspectionFee || 0);
    });

    // 8. Departmental Rigs & Compressors
    const totalRigs = rigs.filter(r => r.type === 'Rig').length;
    const totalCompressors = rigs.filter(r => r.type === 'Compressor').length;

    return {
      present: {
        total: presentOngoingCount,
        deposit: presentDeposit,
        collector: presentCollector,
        private: presentPrivate,
        planFund: presentPlanFund,
        ars: presentArs
      },
      fileStatus: {
        total: nonArsFiles.length,
        underProcess: underProcessCount,
        workInitiated: workInitiatedCount,
        completed: completedFilesCount,
        closed: closedFilesCount
      },
      services: {
        total: totalInvestigation + totalDrilling + totalLoggingPumping + totalOtherServices,
        investigation: totalInvestigation,
        drilling: totalDrilling,
        loggingPumping: totalLoggingPumping
      },
      finance: {
        remittance: totalRemittance,
        expenditure: totalExpenditure,
        estimate: totalEstimate,
        balance: totalRemittance - totalExpenditure
      },
      ars: {
        total: ars.length,
        completed: arsCompleted,
        inProgress: arsInProgress
      },
      agencies: {
        total: agencies.length,
        valid: validAgencies,
        pending: pendingAgencies
      },
      agencyRevenue: {
        total: totalAgencyRevenue
      },
      machinery: {
        rigs: totalRigs,
        compressors: totalCompressors,
        total: rigs.length
      },
      staff: {
        total: (dashboardData.staffMembers || []).length
      }
    };
  }, [dashboardData, arsEntries, agencyApplications, allRigCompressors]);

  const {
      constituencyWorks,
      depositWorksCount,
      collectorWorksCount,
      planFundWorksCount,
      arsWorksCount,
      totalCompletedCount
  } = useMemo(() => {
      const relevantFileEntries = (allFileEntries || []).filter(entry => {
          const isInvestigationCategory = ['Govt', 'Private', 'Complaints'].includes((entry as any).category);
          const hasGwPurpose = entry.siteDetails?.some(site => site.purpose === 'GW Investigation');
          const hasLpPurpose = entry.siteDetails?.some(site => site.purpose && LOGGING_PUMPING_TEST_PURPOSE_OPTIONS.includes(site.purpose as any));

          if (isInvestigationCategory || hasGwPurpose || hasLpPurpose) return false;
          if (entry.applicationType && (PRIVATE_APPLICATION_TYPES as readonly string[]).includes(entry.applicationType as any)) return false;
          return true;
      });

      const allWorksFromFiles = relevantFileEntries.flatMap(entry =>
          (entry.siteDetails || [])
          .filter(site => site.workStatus !== 'Work Cancelled')
          .map(site => ({
              ...site,
              fileNo: entry.fileNo,
              applicantName: entry.applicantName,
              applicationType: entry.applicationType,
              constituency: site.constituency,
              purpose: site.purpose || 'N/A',
              dateOfCompletion: site.dateOfCompletion,
              totalExpenditure: site.totalExpenditure || 0,
              workStatus: site.workStatus
          }))
      );

      const arsWorks = (arsEntries || [])
          .filter(entry => entry.arsStatus !== 'Work Cancelled')
          .map(entry => ({
          nameOfSite: entry.nameOfSite,
          constituency: entry.constituency,
          purpose: entry.arsTypeOfScheme || 'ARS',
          fileNo: entry.fileNo,
          applicantName: 'ARS Scheme',
          workStatus: entry.arsStatus,
          dateOfCompletion: entry.dateOfCompletion,
          totalExpenditure: entry.totalExpenditure || 0,
      }));

      const allConstituencyWorks = [...allWorksFromFiles, ...arsWorks];
      const completedCount = allConstituencyWorks.filter(w => w.workStatus && COMPLETED_WORK_STATUSES.includes(w.workStatus)).length;

      let depositWorksCount = 0;
      let collectorWorksCount = 0;
      let planFundWorksCount = 0;

      relevantFileEntries.forEach(entry => {
          const siteCount = entry.siteDetails?.filter(s => s.workStatus !== 'Work Cancelled').length || 0;
          if (siteCount === 0) return;

          if (entry.applicationType) {
              if ((PUBLIC_DEPOSIT_APPLICATION_TYPES as readonly string[]).includes(entry.applicationType as any)) depositWorksCount += siteCount;
              else if ((COLLECTOR_APPLICATION_TYPES as readonly string[]).includes(entry.applicationType as any)) collectorWorksCount += siteCount;
              else if ((PLAN_FUND_APPLICATION_TYPES as readonly string[]).includes(entry.applicationType as any)) planFundWorksCount += siteCount;
          } else {
              depositWorksCount += siteCount;
          }
      });

      return {
          constituencyWorks: allConstituencyWorks,
          depositWorksCount,
          collectorWorksCount,
          planFundWorksCount,
          arsWorksCount: arsWorks.length,
          totalCompletedCount: completedCount
      };
  }, [allFileEntries, arsEntries]);

  const handleOpenDialog = useCallback((
    data: any[],
    title: string,
    columns: { key: string; label: string; isNumeric?: boolean; }[] = [],
    type: 'detail' | 'rig' | 'age' | 'month' | 'fileStatus' | 'finance' = 'detail'
  ) => {
    setDialogState({ isOpen: true, data, title, columns, type });
  }, []);

  const isPageLoading = authLoading || storeLoading || isReportLoading || agenciesLoading || filteredEntriesLoading || !dashboardData;

  if (isPageLoading) {
    return (
      <div className="flex h-[calc(100vh-10rem)] w-full items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-3 text-muted-foreground font-medium">Loading Departmental Dashboard...</p>
      </div>
    );
  }

  const formatCurrencyLakhs = (val: number) => {
    if (!val || isNaN(val)) return "₹0";
    if (val >= 10000000) return `₹${(val / 10000000).toFixed(2)} Cr`;
    if (val >= 100000) return `₹${(val / 100000).toFixed(2)} L`;
    return `₹${val.toLocaleString('en-IN')}`;
  };

  const sectionsConfig: {
    key: SectionModalKey;
    title: string;
    category: string;
    icon: React.ElementType;
    iconBg: string;
    iconColor: string;
    primaryMetric: string;
    primaryLabel: string;
    chips: { label: string; value: string | number }[];
    description: string;
  }[] = [
    {
      key: 'present-work',
      title: 'Present Work Details',
      category: 'Operations',
      icon: Briefcase,
      iconBg: 'bg-blue-500/10 dark:bg-blue-500/20',
      iconColor: 'text-blue-600 dark:text-blue-400',
      primaryMetric: `${summaryMetrics?.present.total ?? 0}`,
      primaryLabel: 'Active Ongoing Projects',
      chips: [
        { label: 'Deposit', value: summaryMetrics?.present.deposit ?? 0 },
        { label: 'Collector', value: summaryMetrics?.present.collector ?? 0 },
        { label: 'ARS', value: summaryMetrics?.present.ars ?? 0 },
        { label: 'Plan Fund', value: summaryMetrics?.present.planFund ?? 0 },
      ],
      description: 'Active ongoing site works, rig allocations, and in-progress field operations.'
    },
    {
      key: 'file-status',
      title: 'File Status Overview',
      category: 'Documentation',
      icon: FolderKanban,
      iconBg: 'bg-indigo-500/10 dark:bg-indigo-500/20',
      iconColor: 'text-indigo-600 dark:text-indigo-400',
      primaryMetric: `${summaryMetrics?.fileStatus.total ?? 0}`,
      primaryLabel: 'Total Managed Files',
      chips: [
        { label: 'Under Process', value: summaryMetrics?.fileStatus.underProcess ?? 0 },
        { label: 'Initiated', value: summaryMetrics?.fileStatus.workInitiated ?? 0 },
        { label: 'Completed', value: summaryMetrics?.fileStatus.completed ?? 0 },
        { label: 'Closed', value: summaryMetrics?.fileStatus.closed ?? 0 },
      ],
      description: 'Lifecycle stages, pending feasibility, tenders, and file age distribution.'
    },
    {
      key: 'work-status',
      title: 'Work Status by Service',
      category: 'Services',
      icon: Layers,
      iconBg: 'bg-emerald-500/10 dark:bg-emerald-500/20',
      iconColor: 'text-emerald-600 dark:text-emerald-400',
      primaryMetric: `${summaryMetrics?.services.total ?? 0}`,
      primaryLabel: 'Total Service Works',
      chips: [
        { label: 'Investigation', value: summaryMetrics?.services.investigation ?? 0 },
        { label: 'Drilling', value: summaryMetrics?.services.drilling ?? 0 },
        { label: 'Pumping/Logging', value: summaryMetrics?.services.loggingPumping ?? 0 },
      ],
      description: 'Investigation, drilling, filter point, tube well, and pumping test services.'
    },
    {
      key: 'constituency',
      title: 'Constituency Works',
      category: 'Legislative',
      icon: MapPin,
      iconBg: 'bg-amber-500/10 dark:bg-amber-500/20',
      iconColor: 'text-amber-600 dark:text-amber-400',
      primaryMetric: `${totalCompletedCount} / ${constituencyWorks.length}`,
      primaryLabel: 'Completed / Total Works',
      chips: [
        { label: 'Deposit', value: depositWorksCount },
        { label: 'Collector', value: collectorWorksCount },
        { label: 'Plan Fund', value: planFundWorksCount },
        { label: 'ARS', value: arsWorksCount },
      ],
      description: 'Constituency-wise schemes, completion rates, and fund distributions.'
    },
    {
      key: 'finance',
      title: 'Finance & Accounts',
      category: 'Financials',
      icon: IndianRupee,
      iconBg: 'bg-green-500/10 dark:bg-green-500/20',
      iconColor: 'text-green-600 dark:text-green-400',
      primaryMetric: formatCurrencyLakhs(summaryMetrics?.finance.remittance ?? 0),
      primaryLabel: 'Total Remittance Collected',
      chips: [
        { label: 'Exp', value: formatCurrencyLakhs(summaryMetrics?.finance.expenditure ?? 0) },
        { label: 'Bal', value: formatCurrencyLakhs(summaryMetrics?.finance.balance ?? 0) },
        { label: 'Est', value: formatCurrencyLakhs(summaryMetrics?.finance.estimate ?? 0) },
      ],
      description: 'Departmental remittances, expenditures, balances, and quarterly trends.'
    },
    {
      key: 'ars',
      title: 'ARS Schemes',
      category: 'Recharge',
      icon: Droplets,
      iconBg: 'bg-cyan-500/10 dark:bg-cyan-500/20',
      iconColor: 'text-cyan-600 dark:text-cyan-400',
      primaryMetric: `${summaryMetrics?.ars.total ?? 0}`,
      primaryLabel: 'Total ARS Schemes',
      chips: [
        { label: 'Completed', value: summaryMetrics?.ars.completed ?? 0 },
        { label: 'In Progress', value: summaryMetrics?.ars.inProgress ?? 0 },
        { label: 'Success %', value: summaryMetrics?.ars.total ? `${Math.round(((summaryMetrics.ars.completed) / summaryMetrics.ars.total) * 100)}%` : '0%' },
      ],
      description: 'Artificial Recharge Structure works, Local Self Govt schemes, and milestones.'
    },
    {
      key: 'rig-registration',
      title: 'Rig Registration (Agencies)',
      category: 'Agencies',
      icon: Truck,
      iconBg: 'bg-purple-500/10 dark:bg-purple-500/20',
      iconColor: 'text-purple-600 dark:text-purple-400',
      primaryMetric: `${summaryMetrics?.agencies.total ?? 0}`,
      primaryLabel: 'Registered Agencies',
      chips: [
        { label: 'Approved', value: summaryMetrics?.agencies.valid ?? 0 },
        { label: 'Pending', value: summaryMetrics?.agencies.pending ?? 0 },
      ],
      description: 'Private drilling agency registrations, renewals, certificates, and compliance.'
    },
    {
      key: 'rig-financials',
      title: 'Rig Financial Summary',
      category: 'Agency Revenue',
      icon: Receipt,
      iconBg: 'bg-rose-500/10 dark:bg-rose-500/20',
      iconColor: 'text-rose-600 dark:text-rose-400',
      primaryMetric: formatCurrencyLakhs(summaryMetrics?.agencyRevenue.total ?? 0),
      primaryLabel: 'Total Agency Collections',
      chips: [
        { label: 'Agencies', value: summaryMetrics?.agencies.total ?? 0 },
        { label: 'Fee Revenue', value: 'Live' },
      ],
      description: 'Application fees, registration fees, security deposits, and inspection charges.'
    },
    {
      key: 'work-progress',
      title: 'Work Progress & Milestones',
      category: 'Performance',
      icon: TrendingUp,
      iconBg: 'bg-orange-500/10 dark:bg-orange-500/20',
      iconColor: 'text-orange-600 dark:text-orange-400',
      primaryMetric: `${totalCompletedCount}`,
      primaryLabel: 'Works Fully Completed',
      chips: [
        { label: 'In Progress', value: summaryMetrics?.present.total ?? 0 },
        { label: 'Total Files', value: summaryMetrics?.fileStatus.total ?? 0 },
      ],
      description: 'Target achievements, monthly completion trajectories, and milestones.'
    },
    {
      key: 'supervisor-work',
      title: 'Field Staff & Supervisors',
      category: 'Personnel',
      icon: Users,
      iconBg: 'bg-teal-500/10 dark:bg-teal-500/20',
      iconColor: 'text-teal-600 dark:text-teal-400',
      primaryMetric: `${summaryMetrics?.staff.total ?? 0}`,
      primaryLabel: 'Department Staff Members',
      chips: [
        { label: 'Field Staff', value: 'Active' },
        { label: 'Workloads', value: 'Assigned' },
      ],
      description: 'Supervisors, hydrogeologists, geophysicists, and field inspection coverage.'
    },
    {
      key: 'rig-works',
      title: 'Departmental Rig Works',
      category: 'Machinery',
      icon: Gauge,
      iconBg: 'bg-sky-500/10 dark:bg-sky-500/20',
      iconColor: 'text-sky-600 dark:text-sky-400',
      primaryMetric: `${summaryMetrics?.machinery.total ?? 0}`,
      primaryLabel: 'Rigs & Compressors',
      chips: [
        { label: 'Rigs', value: summaryMetrics?.machinery.rigs ?? 0 },
        { label: 'Compressors', value: summaryMetrics?.machinery.compressors ?? 0 },
      ],
      description: 'Departmental rig utilization, drilling footage, maintenance, and deployment.'
    },
  ];

  return (
    <div className="space-y-6 pb-12">
      {/* 1. Top Row: 3 Essential Notice Widgets (Compact Daily Attention) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <ETenderNoticeBoard />
        <ImportantUpdates allFileEntries={dashboardData.allFileEntries} />
        <NoticeBoard staffMembers={dashboardData.staffMembers} />
      </div>

      {/* 2. Section Title & Subtitle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2 border-t border-border/40">
        <div>
          <h2 className="text-lg font-semibold tracking-tight text-foreground flex items-center gap-2">
            Executive Operations & Key Analytics
            <Badge variant="outline" className="text-xs font-normal border-primary/30 text-primary">
              11 Modules
            </Badge>
          </h2>
          <p className="text-xs text-muted-foreground">
            Click any section card or &apos;Open Full View&apos; to launch detailed interactive dashboards, filters, and records.
          </p>
        </div>
      </div>

      {/* 3. Main Section: 2 or 3-column Grid of Interactive Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {sectionsConfig.map((sec) => {
          const Icon = sec.icon;
          return (
            <div
              key={sec.key}
              onClick={() => setActiveSection(sec.key)}
              className="group relative flex flex-col justify-between rounded-xl border border-border/70 bg-card p-5 shadow-xs transition-all duration-200 hover:border-primary/50 hover:shadow-md hover:-translate-y-0.5 cursor-pointer"
            >
              <div>
                {/* Card Header: Icon + Category Badge */}
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3">
                    <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-lg transition-transform group-hover:scale-105", sec.iconBg)}>
                      <Icon className={cn("h-5 w-5", sec.iconColor)} />
                    </div>
                    <div>
                      <h3 className="font-semibold text-sm text-foreground tracking-tight group-hover:text-primary transition-colors">
                        {sec.title}
                      </h3>
                      <span className="text-[11px] font-medium text-muted-foreground">
                        {sec.category}
                      </span>
                    </div>
                  </div>

                  <div className="opacity-0 group-hover:opacity-100 transition-opacity text-primary">
                    <ArrowUpRight className="h-4 w-4" />
                  </div>
                </div>

                {/* Prominent Primary Metric */}
                <div className="my-3 py-1">
                  <div className="text-2xl font-bold tracking-tight text-foreground font-mono">
                    {sec.primaryMetric}
                  </div>
                  <div className="text-xs text-muted-foreground font-medium mt-0.5">
                    {sec.primaryLabel}
                  </div>
                </div>

                {/* Sub-Metric Chips */}
                <div className="flex flex-wrap gap-1.5 pt-2 border-t border-border/40">
                  {sec.chips.map((chip, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1 rounded-md bg-secondary/50 px-2 py-0.5 text-[11px] font-medium text-secondary-foreground"
                    >
                      <span className="text-muted-foreground">{chip.label}:</span>
                      <span className="font-bold text-foreground font-mono">{chip.value}</span>
                    </span>
                  ))}
                </div>
              </div>

              {/* Action Button Footer */}
              <div className="mt-4 pt-3 border-t border-border/40 flex items-center justify-between">
                <span className="text-[11px] text-muted-foreground line-clamp-1 pr-2">
                  {sec.description}
                </span>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 px-2 text-xs font-semibold text-primary hover:text-primary hover:bg-primary/10 shrink-0 group-hover:bg-primary/10"
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveSection(sec.key);
                  }}
                >
                  <Maximize2 className="h-3 w-3 mr-1" />
                  Open View
                </Button>
              </div>
            </div>
          );
        })}
      </div>

      {/* 4. Full-View Section Modal Dialog */}
      <Dialog open={activeSection !== null} onOpenChange={(open) => { if (!open) setActiveSection(null); }}>
        <DialogContent
          onPointerDownOutside={(e) => e.preventDefault()}
          className="max-w-7xl w-[96vw] max-h-[92vh] flex flex-col p-0 overflow-hidden shadow-2xl border-border z-50"
        >
          {/* Modal Header */}
          <DialogHeader className="px-6 py-4 border-b border-border bg-card shrink-0 flex flex-row items-center justify-between">
            <div className="space-y-0.5">
              <DialogTitle className="text-lg font-semibold flex items-center gap-2">
                {sectionsConfig.find(s => s.key === activeSection)?.title || 'Section View'}
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                {sectionsConfig.find(s => s.key === activeSection)?.description || ''}
              </DialogDescription>
            </div>
          </DialogHeader>

          {/* Modal Body Container with Smooth Scroll */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-background/50">
            {activeSection === 'present-work' && (
              <PresentWorkDetails 
                allFileEntries={dashboardData.allFileEntries} 
                allArsEntries={arsEntries} 
                onOpenDialog={handleOpenDialog} 
              />
            )}

            {activeSection === 'file-status' && (
              <FileStatusOverview 
                nonArsEntries={dashboardData.allFileEntries.filter(e => !e.applicationType?.includes("ARS"))}
                onOpenDialog={handleOpenDialog}
              />
            )}

            {activeSection === 'work-status' && (
              <WorkStatusByService 
                allFileEntries={dashboardData.allFileEntries}
                onOpenDialog={handleOpenDialog}
                currentUserRole={currentUser?.role}
              />
            )}

            {activeSection === 'constituency' && (
              <ConstituencyWiseOverview
                allWorks={constituencyWorks}
                depositWorksCount={depositWorksCount}
                collectorWorksCount={collectorWorksCount}
                planFundWorksCount={planFundWorksCount}
                arsWorksCount={arsWorksCount}
                totalCompletedCount={totalCompletedCount}
                onOpenDialog={handleOpenDialog}
                dates={constituencyDates}
                onSetDates={setConstituencyDates}
              />
            )}

            {activeSection === 'finance' && (
              <FinanceOverview 
                allFileEntries={dashboardData.allFileEntries}
                onOpenDialog={handleOpenDialog}
                dates={financeDates}
                onSetDates={setFinanceDates}
              />
            )}

            {activeSection === 'ars' && (
              <ArsStatusOverview 
                onOpenDialog={handleOpenDialog}
                dates={arsDates}
                onSetDates={setArsDates}
              />
            )}

            {activeSection === 'rig-registration' && (
              <RigRegistrationOverview 
                agencyApplications={agencyApplications}
                onOpenDialog={handleOpenDialog}
              />
            )}

            {activeSection === 'rig-financials' && (
              <RigFinancialSummary
                applications={agencyApplications}
                onCellClick={handleOpenDialog}
              />
            )}

            {activeSection === 'work-progress' && (
              <WorkProgress
                allFileEntries={dashboardData.allFileEntries}
                allArsEntries={arsEntries}
                onOpenDialog={handleOpenDialog}
                currentUser={currentUser}
              />
            )}

            {activeSection === 'supervisor-work' && (
              <SupervisorWork
                allFileEntries={dashboardData.allFileEntries}
                allArsEntries={arsEntries}
                allUsers={allUsers}
                staffMembers={dashboardData.staffMembers}
                onOpenDialog={handleOpenDialog}
              />
            )}

            {activeSection === 'rig-works' && (
              <DepartmentalRigWorks
                allFileEntries={dashboardData.allFileEntries}
                rigCompressors={allRigCompressors}
                onOpenDialog={handleOpenDialog}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* 5. Drill-Down Record Dialog (Excel Export & Data Lists) */}
      <DashboardDialogs 
        dialogState={dialogState}
        setDialogState={setDialogState}
        allFileEntries={dashboardData.allFileEntries}
        allArsEntries={arsEntries}
        financeDates={financeDates}
        currentUser={currentUser}
      />
    </div>
  );
}

