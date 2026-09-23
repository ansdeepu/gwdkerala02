
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
import { format, startOfMonth, endOfMonth, isWithinInterval, isValid, addYears, parseISO } from 'date-fns';
import { 
  PRIVATE_APPLICATION_TYPES, 
  LOGGING_PUMPING_TEST_PURPOSE_OPTIONS, 
  INVESTIGATION_WORK_STATUS_OPTIONS,
  LOGGING_PUMPING_TEST_WORK_STATUS_OPTIONS,
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
  X,
  BarChart3,
  Activity
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
    setHeader('Dashboard', 'Executive overview & key metrics');
    if (currentUser?.uid) {
        updateUserLastActive(currentUser.uid, currentUser.officeLocation);
    }
  }, [setHeader, currentUser]);

  const dashboardData = useMemo(() => {
    if (!currentUser) return null;

    return {
        allFileEntriesForSupervisor: filteredFileEntries || [],
        allFileEntries: allFileEntries || [],
        staffMembers: staffMembers || []
    };
  }, [currentUser, filteredFileEntries, allFileEntries, staffMembers]);

  // Helper to parse dates safely
  const safeParseDate = (dateValue: any): Date | null => {
    if (!dateValue) return null;
    if (dateValue instanceof Date) return isValid(dateValue) ? dateValue : null;
    if (typeof dateValue === 'object' && dateValue !== null) {
      if (typeof (dateValue as any).toDate === 'function') {
        try {
          const d = (dateValue as any).toDate();
          if (isValid(d)) return d;
        } catch {}
      }
      if (typeof (dateValue as any).seconds === 'number') {
        const d = new Date((dateValue as any).seconds * 1000);
        if (isValid(d)) return d;
      }
    }
    if (typeof dateValue === 'string') {
      const trimmed = dateValue.trim();
      if (!trimmed) return null;
      let parsed = parseISO(trimmed);
      if (isValid(parsed)) return parsed;
      const d = new Date(trimmed);
      if (isValid(d)) return d;
    }
    if (typeof dateValue === 'number') {
      const d = new Date(dateValue);
      if (isValid(d)) return d;
    }
    return null;
  };

  // Live Summary Statistics for Cards
  const summaryMetrics = useMemo(() => {
    if (!dashboardData) return null;
    const files = dashboardData.allFileEntries || [];
    const ars = arsEntries || [];
    const agencies = agencyApplications || [];
    const rigs = allRigCompressors || [];
    const today = new Date();

    // 1. Present Ongoing Works Count (Matching PresentWorkDetails.tsx)
    let presentDeposit = 0;
    let presentCollector = 0;
    let presentPrivate = 0;
    let presentPlanFund = 0;

    files.forEach(entry => {
      const appType = entry.applicationType as any;
      let groupKey = "deposit";
      if (PRIVATE_APPLICATION_TYPES.includes(appType)) groupKey = "private";
      else if (COLLECTOR_APPLICATION_TYPES.includes(appType)) groupKey = "collector";
      else if (PLAN_FUND_APPLICATION_TYPES.includes(appType)) groupKey = "planFund";
      else if (PUBLIC_DEPOSIT_APPLICATION_TYPES.includes(appType)) groupKey = "deposit";
      else if (!appType) groupKey = "deposit";

      entry.siteDetails?.forEach(site => {
        if (site.workStatus && ONGOING_STATUSES.includes(site.workStatus) && site.workStatus !== 'Work Cancelled') {
          if (groupKey === "private") presentPrivate++;
          else if (groupKey === "collector") presentCollector++;
          else if (groupKey === "planFund") presentPlanFund++;
          else presentDeposit++;
        }
      });
    });

    const presentArs = ars.filter(a => a.arsStatus && ONGOING_STATUSES.includes(a.arsStatus) && a.arsStatus !== 'Work Cancelled').length;
    const presentOngoingCount = presentDeposit + presentCollector + presentPrivate + presentPlanFund + presentArs;

    // 2. File Status Overview (Matching FileStatusOverview.tsx)
    const nonArsFiles = files.filter(e => !e.applicationType?.includes("ARS"));
    let depositWorksFileCount = 0;
    let gwInvestigationFileCount = 0;
    let loggingPumpingFileCount = 0;

    for (const entry of nonArsFiles) {
      const isInvestigationCategory = ['Govt', 'Private', 'Complaints'].includes((entry as any).category);
      const hasInvestigationPurpose = entry.siteDetails?.some(site => site.purpose === 'GW Investigation');
      const hasLoggingPumpingPurpose = entry.siteDetails?.some(site => site.purpose && LOGGING_PUMPING_TEST_PURPOSE_OPTIONS.includes(site.purpose as any));

      if ((isInvestigationCategory || hasInvestigationPurpose) && !hasLoggingPumpingPurpose) {
        gwInvestigationFileCount++;
      } else if (hasLoggingPumpingPurpose && !hasInvestigationPurpose) {
        loggingPumpingFileCount++;
      } else if (!isInvestigationCategory && !hasInvestigationPurpose && !hasLoggingPumpingPurpose) {
        depositWorksFileCount++;
      }
    }

    const underProcessCount = nonArsFiles.filter(e => e.fileStatus === 'File Under Process' || !e.fileStatus).length;
    const workInitiatedCount = nonArsFiles.filter(e => e.fileStatus === 'Work Initiated' || e.fileStatus === 'Tender Process').length;
    const completedFilesCount = nonArsFiles.filter(e => e.fileStatus?.includes('Completed')).length;
    const closedFilesCount = nonArsFiles.filter(e => e.fileStatus === 'File Closed').length;

    // 3. Work Status By Service (Matching WorkStatusByService.tsx)
    let totalDepositServiceSites = 0;
    let totalGwInvServiceSites = 0;
    let totalLpServiceSites = 0;

    const depositWorkServiceOrder = ["BWC", "TWC", "FPW", "BW Dev", "TW Dev", "FPW Dev", "MWSS", "MWSS Ext", "Pumping Scheme", "MWSS Pump Reno", "HPS", "HPR", "ARS"];
    const gwInvestigationServiceOrder = ["Open Well", "Bore Well", "Tube Well", "Filter Point Well"];
    const loggingPumpingTestServiceOrder = LOGGING_PUMPING_TEST_PURPOSE_OPTIONS;

    const DEPOSIT_WORK_STATUS_OPTIONS = [
      "Under Process", "Additional Fund Awaited", "TS Pending", "Refund Pending",
      "Department Rig Allotted", "Tendered", "Selection Notice Issued", "Work Order Issued",
      "Work in Progress", "Work Failed", "Work Cancelled", "Work Completed"
    ];

    files.forEach(entry => {
      const isInvestigationCategory = ['Govt', 'Private', 'Complaints'].includes((entry as any).category);
      const hasInvestigationPurpose = entry.siteDetails?.some(site => site.purpose === 'GW Investigation');
      const hasLoggingPumpingPurpose = entry.siteDetails?.some(site => site.purpose && LOGGING_PUMPING_TEST_PURPOSE_OPTIONS.includes(site.purpose as any));

      if ((isInvestigationCategory || hasInvestigationPurpose) && !hasLoggingPumpingPurpose) {
        entry.siteDetails?.forEach(sd => {
          if (sd.typeOfWell && sd.workStatus && (gwInvestigationServiceOrder as readonly string[]).includes(sd.typeOfWell) && (INVESTIGATION_WORK_STATUS_OPTIONS as readonly string[]).includes(sd.workStatus)) {
            totalGwInvServiceSites++;
          }
        });
      } else if (hasLoggingPumpingPurpose && !hasInvestigationPurpose) {
        entry.siteDetails?.forEach(sd => {
          if (sd.purpose && sd.workStatus && (loggingPumpingTestServiceOrder as readonly string[]).includes(sd.purpose) && (LOGGING_PUMPING_TEST_WORK_STATUS_OPTIONS as readonly string[]).includes(sd.workStatus)) {
            totalLpServiceSites++;
          }
        });
      } else if (!isInvestigationCategory && !hasInvestigationPurpose && !hasLoggingPumpingPurpose) {
        entry.siteDetails?.forEach(sd => {
          if (sd.purpose && sd.workStatus && (depositWorkServiceOrder as readonly string[]).includes(sd.purpose) && (DEPOSIT_WORK_STATUS_OPTIONS as readonly string[]).includes(sd.workStatus)) {
            totalDepositServiceSites++;
          }
        });
      }
    });

    const totalServiceWorksCount = totalDepositServiceSites + totalGwInvServiceSites + totalLpServiceSites;

    // 4. Finance Totals (Matching FinanceOverview.tsx)
    let sbiCredit = 0, stsbCredit = 0, sbiDebit = 0, stsbDebit = 0;
    let planFundExpenditure = 0, collectorFundExpenditure = 0;
    let planFundDeferredAmount = 0, collectorFundDeferredAmount = 0;
    let revenueHeadCreditDirect = 0;

    files.forEach(entry => {
      const appType = entry.applicationType as any;
      const isAdminSanctioned = appType && (COLLECTOR_APPLICATION_TYPES.includes(appType) || PLAN_FUND_APPLICATION_TYPES.includes(appType));
      const isPlanFund = appType && PLAN_FUND_APPLICATION_TYPES.includes(appType);
      const isCollectorFund = appType && COLLECTOR_APPLICATION_TYPES.includes(appType);
      const hasCancelledWork = isPlanFund && entry.siteDetails?.some(site => site.workStatus === 'Work Cancelled');

      entry.remittanceDetails?.forEach(rd => {
        const amount = Number(rd.amountRemitted) || 0;
        if (isAdminSanctioned) {
          if (isPlanFund && !hasCancelledWork) planFundDeferredAmount += amount;
          if (isCollectorFund) collectorFundDeferredAmount += amount;
        } else {
          if (rd.remittedAccount === 'Bank') sbiCredit += amount;
          else if (rd.remittedAccount === 'STSB') stsbCredit += amount;
        }
        if (rd.remittedAccount === 'Revenue Head') revenueHeadCreditDirect += amount;
      });

      entry.paymentDetails?.forEach(pd => {
        if (isAdminSanctioned) {
          const totalPaymentPerEntry = Number(pd.totalPaymentPerEntry) || 0;
          if (isPlanFund && !hasCancelledWork) planFundExpenditure += totalPaymentPerEntry;
          if (isCollectorFund) collectorFundExpenditure += totalPaymentPerEntry;
        } else {
          const debitAmount = (Number(pd.contractorsPayment) || 0) + (Number(pd.gst) || 0) + (Number(pd.incomeTax) || 0) + (Number(pd.kbcwb) || 0) + (Number(pd.refundToParty) || 0);
          if (pd.paymentAccount === 'Bank') sbiDebit += debitAmount;
          else if (pd.paymentAccount === 'STSB') stsbDebit += debitAmount;
        }
        if (pd.revenueHead) revenueHeadCreditDirect += (Number(pd.revenueHead) || 0);
      });
    });

    const totalOperationalCredit = sbiCredit + stsbCredit;
    const totalOperationalDebit = sbiDebit + stsbDebit;
    const operationalBalance = totalOperationalCredit - totalOperationalDebit;
    const totalAllRemittance = totalOperationalCredit + planFundDeferredAmount + collectorFundDeferredAmount + revenueHeadCreditDirect;
    const totalAllExpenditure = totalOperationalDebit + planFundExpenditure + collectorFundExpenditure;

    // 5. ARS Overview (Matching ArsStatusOverview.tsx)
    const validArsList = ars.filter(a => a.arsStatus !== 'Work Cancelled');
    const arsCompleted = validArsList.filter(a => a.arsStatus && COMPLETED_WORK_STATUSES.includes(a.arsStatus)).length;
    const arsInProgress = validArsList.filter(a => a.arsStatus && ["Proposal Submitted", "AS & TS Issued", "Tendered", "Selection Notice Issued", "Work Order Issued", "Work in Progress"].includes(a.arsStatus)).length;
    const arsSuccessRate = validArsList.length > 0 ? Math.round((arsCompleted / validArsList.length) * 100) : 0;

    // 6. Rig Registrations (Agencies & Rigs - matching RigRegistrationOverview.tsx logic)
    const completedAgencies = agencies.filter(app => app.status === 'Active');
    const pendingAgencies = agencies.filter(app => app.status !== 'Active');

    let activeRigsCount = 0;
    let expiredRigsCount = 0;
    let cancelledRigsCount = 0;

    completedAgencies.forEach(app => {
      (app.rigs || []).forEach(rig => {
        if (rig.status === 'Active') {
          const lastEffectiveDate = rig.renewals && rig.renewals.length > 0
            ? [...rig.renewals].sort((a, b) => (safeParseDate(b.renewalDate)?.getTime() ?? 0) - (safeParseDate(a.renewalDate)?.getTime() ?? 0))[0].renewalDate
            : rig.registrationDate;

          if (lastEffectiveDate) {
            const parsed = safeParseDate(lastEffectiveDate);
            if (parsed && isValid(parsed)) {
              const validityDate = new Date(addYears(parsed, 1).getTime() - 24 * 60 * 60 * 1000);
              if (isValid(validityDate) && today > validityDate) {
                expiredRigsCount++;
              } else {
                activeRigsCount++;
              }
            } else {
              activeRigsCount++;
            }
          } else {
            activeRigsCount++;
          }
        } else if (rig.status === 'Cancelled') {
          cancelledRigsCount++;
        }
      });
    });

    // 7. Rig Financial Summary (Total Collections matching RigFinancialSummary.tsx)
    let appFeesTotal = 0;
    let agencyRegFeesTotal = 0;
    let rigRegFeesTotal = 0;
    let renewalFeesTotal = 0;

    agencies.forEach(app => {
      app.applicationFees?.forEach(fee => {
        appFeesTotal += Number(fee.applicationFeeAmount) || 0;
      });
    });

    completedAgencies.forEach(app => {
      agencyRegFeesTotal += (Number(app.agencyRegistrationFee) || 0) + (Number(app.agencyAdditionalRegFee) || 0);

      app.rigs?.forEach(rig => {
        rigRegFeesTotal += (Number(rig.registrationFee) || 0) + (Number(rig.additionalRegistrationFee) || 0);

        rig.renewals?.forEach(renewal => {
          renewalFeesTotal += (Number(renewal.renewalFee) || 0) + (Number((renewal as any).fee) || 0);
        });
      });
    });

    const grandTotalAgencyRevenue = appFeesTotal + agencyRegFeesTotal + rigRegFeesTotal + renewalFeesTotal;

    // 8. Work Progress (Monthly & Ongoing breakdown matching WorkProgress.tsx)
    const currentMonthStart = startOfMonth(today);
    const currentMonthEnd = endOfMonth(today);
    const progressOngoingStatuses = ["Work Order Issued", "Work in Progress", "Department Rig Allotted", "Tendered", "Selection Notice Issued", "TS Pending", "Additional Fund Awaited", "Under Process", "Pending", "VES Pending"];

    let progressCompletedThisMonth = 0;
    let progressOngoingCount = 0;
    let progressAllTimeCompleted = 0;

    files.forEach(entry => {
      entry.siteDetails?.forEach(site => {
        if (site.workStatus && COMPLETED_WORK_STATUSES.includes(site.workStatus)) {
          progressAllTimeCompleted++;
          if (site.dateOfCompletion) {
            const compDate = safeParseDate(site.dateOfCompletion);
            if (compDate && isValid(compDate) && isWithinInterval(compDate, { start: currentMonthStart, end: currentMonthEnd })) {
              progressCompletedThisMonth++;
            }
          }
        }
        if (site.workStatus && progressOngoingStatuses.includes(site.workStatus)) {
          progressOngoingCount++;
        }
      });
    });

    ars.forEach(arsEntry => {
      if (arsEntry.arsStatus && COMPLETED_WORK_STATUSES.includes(arsEntry.arsStatus)) {
        progressAllTimeCompleted++;
        if (arsEntry.dateOfCompletion) {
          const compDate = safeParseDate(arsEntry.dateOfCompletion);
          if (compDate && isValid(compDate) && isWithinInterval(compDate, { start: currentMonthStart, end: currentMonthEnd })) {
            progressCompletedThisMonth++;
          }
        }
      }
      if (arsEntry.arsStatus && ["Proposal Submitted", "AS & TS Issued", "Tendered", "Selection Notice Issued", "Work Order Issued", "Work in Progress"].includes(arsEntry.arsStatus)) {
        progressOngoingCount++;
      }
    });

    let depositFilesCount = 0;
    let gwInvFilesCount = 0;
    let lpFilesCount = 0;

    files.forEach(entry => {
      const hasGwPurpose = entry.siteDetails?.some(site => site.purpose === 'GW Investigation');
      const hasLpPurpose = entry.siteDetails?.some(site => site.purpose && LOGGING_PUMPING_TEST_PURPOSE_OPTIONS.includes(site.purpose as any));
      if (hasGwPurpose && !hasLpPurpose) gwInvFilesCount++;
      else if (hasLpPurpose && !hasGwPurpose) lpFilesCount++;
      else if (!hasGwPurpose && !hasLpPurpose) depositFilesCount++;
    });

    // 9. Departmental Rigs & Compressors (Matching DepartmentalRigWorks.tsx)
    const internalRigs = rigs.filter(r => !r.isExternal);
    const activeInternalRigs = internalRigs.filter(r => r.status === 'Active' || !r.status).length;
    const garagedInternalRigs = internalRigs.filter(r => r.status === 'Garaged').length;

    let rigCompletedJobs = 0;
    let rigBalanceJobs = 0;

    internalRigs.forEach(rig => {
      files.forEach(entry => {
        entry.siteDetails?.forEach(site => {
          if (site.typeOfRig === rig.typeOfRigUnit && site.workStatus !== 'Work Cancelled') {
            if (COMPLETED_WORK_STATUSES.includes(site.workStatus as string)) {
              rigCompletedJobs++;
            } else if (ONGOING_STATUSES.includes(site.workStatus as string)) {
              rigBalanceJobs++;
            }
          }
        });
      });
    });

    // 10. Field Staff & Supervisors (Matching SupervisorWork.tsx)
    const activeFieldPersonnel = (allUsers || []).filter(u => u.isApproved && (u.role === 'supervisor' || u.role === 'investigator'));
    const totalStaffCount = (dashboardData.staffMembers || []).length;

    let totalAssignedWorks = 0;
    files.forEach(entry => {
      entry.siteDetails?.forEach(site => {
        if (site.workStatus && site.workStatus !== 'Work Cancelled' && (site.supervisorName || site.nameOfInvestigator || site.vesInvestigator)) {
          totalAssignedWorks++;
        }
      });
    });

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
        deposit: depositWorksFileCount,
        gwInv: gwInvestigationFileCount,
        loggingPumping: loggingPumpingFileCount,
        underProcess: underProcessCount,
        workInitiated: workInitiatedCount,
        completed: completedFilesCount,
        closed: closedFilesCount
      },
      services: {
        total: totalServiceWorksCount,
        deposit: totalDepositServiceSites,
        investigation: totalGwInvServiceSites,
        loggingPumping: totalLpServiceSites
      },
      finance: {
        remittance: totalAllRemittance,
        expenditure: totalAllExpenditure,
        balance: operationalBalance,
        sbiCredit,
        stsbCredit,
        sbiDebit,
        stsbDebit
      },
      ars: {
        total: validArsList.length,
        completed: arsCompleted,
        inProgress: arsInProgress,
        successRate: arsSuccessRate
      },
      agencies: {
        total: completedAgencies.length,
        totalApplications: agencies.length,
        activeRigs: activeRigsCount,
        expiredRigs: expiredRigsCount,
        cancelledRigs: cancelledRigsCount,
        pendingApps: pendingAgencies.length
      },
      agencyRevenue: {
        total: grandTotalAgencyRevenue,
        appFees: appFeesTotal,
        regFees: agencyRegFeesTotal + rigRegFeesTotal,
        renewalFees: renewalFeesTotal
      },
      progress: {
        completedThisMonth: progressCompletedThisMonth,
        ongoing: progressOngoingCount,
        allTimeCompleted: progressAllTimeCompleted,
        depositFiles: depositFilesCount,
        gwFiles: gwInvFilesCount,
        lpFiles: lpFilesCount
      },
      machinery: {
        totalUnits: internalRigs.length || rigs.length,
        activeUnits: activeInternalRigs,
        garagedUnits: garagedInternalRigs,
        completedJobs: rigCompletedJobs,
        balanceJobs: rigBalanceJobs
      },
      staff: {
        total: totalStaffCount,
        fieldPersonnel: activeFieldPersonnel.length,
        assignedWorks: totalAssignedWorks
      }
    };
  }, [dashboardData, arsEntries, agencyApplications, allRigCompressors, allUsers]);

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

  const isPageLoading = authLoading || !currentUser;

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
      primaryLabel: 'Active Ongoing Works',
      chips: [
        { label: 'Deposit', value: summaryMetrics?.present.deposit ?? 0 },
        { label: 'Collector', value: summaryMetrics?.present.collector ?? 0 },
        { label: 'Private', value: summaryMetrics?.present.private ?? 0 },
        { label: 'Plan Fund', value: summaryMetrics?.present.planFund ?? 0 },
        { label: 'ARS', value: summaryMetrics?.present.ars ?? 0 },
      ],
      description: 'Ongoing activities (Rig Allotted, Work Order, In Progress) across Deposit, Collector, Private, Plan Fund & ARS.'
    },
    {
      key: 'file-status',
      title: 'File Status Overview',
      category: 'Documentation',
      icon: FolderKanban,
      iconBg: 'bg-indigo-500/10 dark:bg-indigo-500/20',
      iconColor: 'text-indigo-600 dark:text-indigo-400',
      primaryMetric: `${summaryMetrics?.fileStatus.total ?? 0}`,
      primaryLabel: 'Total Non-ARS Files',
      chips: [
        { label: 'Deposit', value: summaryMetrics?.fileStatus.deposit ?? 0 },
        { label: 'GW Inv', value: summaryMetrics?.fileStatus.gwInv ?? 0 },
        { label: 'Logging/Test', value: summaryMetrics?.fileStatus.loggingPumping ?? 0 },
        { label: 'Closed', value: summaryMetrics?.fileStatus.closed ?? 0 },
      ],
      description: 'File lifecycle and age tracking across Deposit, GW Investigation, and Logging & Pumping files.'
    },
    {
      key: 'work-status',
      title: 'Work Status by Service',
      category: 'Services',
      icon: Layers,
      iconBg: 'bg-emerald-500/10 dark:bg-emerald-500/20',
      iconColor: 'text-emerald-600 dark:text-emerald-400',
      primaryMetric: `${summaryMetrics?.services.total ?? 0}`,
      primaryLabel: 'Total Service Works (Sites)',
      chips: [
        { label: 'Deposit', value: summaryMetrics?.services.deposit ?? 0 },
        { label: 'GW Inv', value: summaryMetrics?.services.investigation ?? 0 },
        { label: 'Logging/Test', value: summaryMetrics?.services.loggingPumping ?? 0 },
      ],
      description: 'Service breakdown across Deposit Works, GW Investigation, and Logging & Pumping test sites.'
    },
    {
      key: 'constituency',
      title: 'Constituency Works',
      category: 'Legislative',
      icon: MapPin,
      iconBg: 'bg-amber-500/10 dark:bg-amber-500/20',
      iconColor: 'text-amber-600 dark:text-amber-400',
      primaryMetric: `${totalCompletedCount} / ${constituencyWorks.length}`,
      primaryLabel: 'Completed / Total Public Works',
      chips: [
        { label: 'Deposit', value: depositWorksCount },
        { label: 'Collector', value: collectorWorksCount },
        { label: 'Plan Fund', value: planFundWorksCount },
        { label: 'ARS', value: arsWorksCount },
      ],
      description: 'Constituency-wise schemes across Deposit, Collector\'s, Plan Fund, and ARS works.'
    },
    {
      key: 'finance',
      title: 'Finance & Accounts',
      category: 'Financials',
      icon: IndianRupee,
      iconBg: 'bg-green-500/10 dark:bg-green-500/20',
      iconColor: 'text-green-600 dark:text-green-400',
      primaryMetric: formatCurrencyLakhs(summaryMetrics?.finance.remittance ?? 0),
      primaryLabel: 'Total Remittances / Sanctions',
      chips: [
        { label: 'Bank (SBI)', value: formatCurrencyLakhs(summaryMetrics?.finance.sbiCredit ?? 0) },
        { label: 'STSB', value: formatCurrencyLakhs(summaryMetrics?.finance.stsbCredit ?? 0) },
        { label: 'Expenditure', value: formatCurrencyLakhs(summaryMetrics?.finance.expenditure ?? 0) },
        { label: 'Liquid Bal', value: formatCurrencyLakhs(summaryMetrics?.finance.balance ?? 0) },
      ],
      description: 'Departmental remittances, bank/STSB accounts, expenditures, and liquid balances.'
    },
    {
      key: 'ars',
      title: 'ARS Schemes',
      category: 'Recharge',
      icon: Droplets,
      iconBg: 'bg-cyan-500/10 dark:bg-cyan-500/20',
      iconColor: 'text-cyan-600 dark:text-cyan-400',
      primaryMetric: `${summaryMetrics?.ars.total ?? 0}`,
      primaryLabel: 'Active ARS Schemes',
      chips: [
        { label: 'Completed', value: summaryMetrics?.ars.completed ?? 0 },
        { label: 'In Progress', value: summaryMetrics?.ars.inProgress ?? 0 },
        { label: 'Success Rate', value: `${summaryMetrics?.ars.successRate ?? 0}%` },
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
        { label: 'Active Rigs', value: summaryMetrics?.agencies.activeRigs ?? 0 },
        { label: 'Expired Rigs', value: summaryMetrics?.agencies.expiredRigs ?? 0 },
        { label: 'Pending Apps', value: summaryMetrics?.agencies.pendingApps ?? 0 },
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
        { label: 'Reg Fees', value: formatCurrencyLakhs(summaryMetrics?.agencyRevenue.regFees ?? 0) },
        { label: 'App Fees', value: formatCurrencyLakhs(summaryMetrics?.agencyRevenue.appFees ?? 0) },
        { label: 'Renewals', value: formatCurrencyLakhs(summaryMetrics?.agencyRevenue.renewalFees ?? 0) },
      ],
      description: 'Application fees, registration fees, security deposits, and renewal charges.'
    },
    {
      key: 'work-progress',
      title: 'Work Progress & Milestones',
      category: 'Performance',
      icon: TrendingUp,
      iconBg: 'bg-orange-500/10 dark:bg-orange-500/20',
      iconColor: 'text-orange-600 dark:text-orange-400',
      primaryMetric: `${summaryMetrics?.progress.completedThisMonth ?? 0}`,
      primaryLabel: `Completed (${format(new Date(), 'MMM yyyy')})`,
      chips: [
        { label: 'Ongoing', value: summaryMetrics?.progress.ongoing ?? 0 },
        { label: 'Deposit', value: summaryMetrics?.progress.depositFiles ?? 0 },
        { label: 'GW Inv', value: summaryMetrics?.progress.gwFiles ?? 0 },
        { label: 'All-Time', value: summaryMetrics?.progress.allTimeCompleted ?? 0 },
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
      primaryMetric: `${summaryMetrics?.staff.fieldPersonnel ?? 0}`,
      primaryLabel: 'Active Field Personnel',
      chips: [
        { label: 'Active Personnel', value: summaryMetrics?.staff.fieldPersonnel ?? 0 },
        { label: 'Assigned Sites', value: summaryMetrics?.staff.assignedWorks ?? 0 },
        { label: 'Total Staff', value: summaryMetrics?.staff.total ?? 0 },
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
      primaryMetric: `${summaryMetrics?.machinery.totalUnits ?? 0}`,
      primaryLabel: 'Departmental Rig Units',
      chips: [
        { label: 'Active', value: summaryMetrics?.machinery.activeUnits ?? 0 },
        { label: 'Garaged', value: summaryMetrics?.machinery.garagedUnits ?? 0 },
        { label: 'Works Done', value: summaryMetrics?.machinery.completedJobs ?? 0 },
        { label: 'In Progress', value: summaryMetrics?.machinery.balanceJobs ?? 0 },
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

      {/* 2. Section Title & Subtitle with Icon on the Left */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-border/40">
        <div>
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10 text-primary border border-primary/20 shadow-2xs">
              <BarChart3 className="w-4 h-4" />
            </div>
            <h2 className="text-lg font-semibold tracking-tight text-foreground">
              Executive Operations & Key Analytics
            </h2>
            <Badge variant="outline" className="text-xs font-normal border-primary/30 text-primary">
              11 Modules
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-1 ml-0.5">
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

