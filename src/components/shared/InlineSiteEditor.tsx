"use client";

import React, { useMemo, useEffect, useCallback, useState, useRef } from "react";
import { useFormContext, useFieldArray, Controller } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MalayalamInput } from "@/components/ui/malayalam-input-helper";
import { GpsCoordinateCapture } from "@/components/shared/GpsCoordinateCapture";
import MediaManager from "@/components/shared/MediaManager";
import {
  siteWorkStatusOptions,
  sitePurposeOptions,
  siteDiameterOptions,
  siteTypeOfRigOptions,
  siteConditionsOptions,
  typeOfDisputeOptions,
  drillingConditionsOptions,
  developingConditionsOptions,
  schemeConditionsOptions,
  yieldCategoryOptions,
  type StaffMember,
  type Bidder,
  type RigCompressor,
  type SiteWorkStatus,
} from "@/lib/schemas";
import type { E_tender } from "@/hooks/useE_tenders";
import { calculateWorkCommencementDate } from "@/lib/holidayUtils";
import { isSiteTargetedByTender, isFinalSiteStatus, isStartDateReached } from "@/lib/tenderUtils";
import { cn } from "@/lib/utils";
import { format, isValid } from "date-fns";
import {
  MapPin,
  FileText,
  Wrench,
  Activity,
  Image as ImageIcon,
  DollarSign,
  AlertCircle,
  HelpCircle,
} from "lucide-react";

export const SITE_DIALOG_WORK_STATUS_OPTIONS = [
  "Under Process",
  "Additional Fund Awaited",
  "TS Pending",
  "Tender Pending",
  "Refund Pending",
  "Department Rig Allotted",
  "Tendered",
  "Selection Notice Issued",
  "Work Order Issued",
  "Work in Progress",
  "Work Failed",
  "Work Cancelled",
  "Work Completed",
] as const;

interface InlineSiteEditorProps {
  siteIndex: number;
  isReadOnly?: boolean;
  isSupervisor?: boolean;
  supervisorList?: (StaffMember & { uid: string; name: string })[];
  allLsgConstituencyMaps?: any[];
  allE_tenders?: E_tender[];
  allStaffMembers?: StaffMember[];
  allBidders?: Bidder[];
  allRigCompressors?: RigCompressor[];
  workTypeContext?: "public" | "private" | "collector" | "planFund" | "gwInvestigation" | "loggingPumpingTest" | null;
  applicationType?: string | null;
  paymentDetails?: any[];
  remittanceDetails?: any[];
  docPath?: string | null;
  officeLocation?: string;
  fileNo?: string;
}

const formatDateForInput = (date: any): string => {
  if (!date) return "";
  if (date instanceof Date) return isValid(date) ? format(date, "yyyy-MM-dd") : "";
  if (typeof date === "object" && date !== null && typeof date.seconds === "number") {
    const d = new Date(date.seconds * 1000);
    return isValid(d) ? format(d, "yyyy-MM-dd") : "";
  }
  if (typeof date === "string") {
    const parsed = new Date(date);
    return isValid(parsed) ? format(parsed, "yyyy-MM-dd") : "";
  }
  return "";
};

export function InlineSiteEditor({
  siteIndex,
  isReadOnly = false,
  isSupervisor = false,
  supervisorList = [],
  allLsgConstituencyMaps = [],
  allE_tenders = [],
  allStaffMembers = [],
  allBidders = [],
  allRigCompressors = [],
  workTypeContext = null,
  applicationType = null,
  paymentDetails = [],
  remittanceDetails = [],
  docPath = null,
  officeLocation = "kollam",
  fileNo = "General",
}: InlineSiteEditorProps) {
  const { control, watch, setValue, getValues } = useFormContext();
  const fieldPrefix = `siteDetails.${siteIndex}`;

  const [isManualSupervisor, setIsManualSupervisor] = useState(false);

  // Field arrays for images & videos
  const {
    fields: imageFields,
    append: appendImage,
    remove: removeImage,
    update: updateImage,
  } = useFieldArray({
    control,
    name: `${fieldPrefix}.workImages` as any,
  });

  const {
    fields: videoFields,
    append: appendVideo,
    remove: removeVideo,
    update: updateVideo,
  } = useFieldArray({
    control,
    name: `${fieldPrefix}.workVideos` as any,
  });

  // Watched fields
  const watchedNameOfSite = watch(`${fieldPrefix}.nameOfSite`);
  const watchedPurpose = watch(`${fieldPrefix}.purpose`);
  const watchedWorkStatus = watch(`${fieldPrefix}.workStatus`);
  const watchedLsg = watch(`${fieldPrefix}.localSelfGovt`);
  const watchedTenderNo = watch(`${fieldPrefix}.tenderNo`);
  const watchedContractorName = watch(`${fieldPrefix}.contractorName`);
  const watchedSupervisorName = watch(`${fieldPrefix}.supervisorName`);
  const watchedSiteConditions = watch(`${fieldPrefix}.siteConditions`);
  const watchedTypeOfDispute = watch(`${fieldPrefix}.typeOfDispute`);
  const watchedDrillingConditions = watch(`${fieldPrefix}.drillingConditions`);
  const watchedDevelopingConditions = watch(`${fieldPrefix}.developingConditions`);
  const watchedSchemeConditions = watch(`${fieldPrefix}.schemeConditions`);
  const watchedCompletionDate = watch(`${fieldPrefix}.dateOfCompletion`);
  const watchedStartDate = watch(`${fieldPrefix}.startDate`);
  const watchedTsAmount = watch(`${fieldPrefix}.tsAmount`);
  const watchedTotalDepth = watch(`${fieldPrefix}.totalDepth`);
  const watchedDiameter = watch(`${fieldPrefix}.diameter`);
  const watchedDateOfDrilling = watch(`${fieldPrefix}.dateOfDrilling`);

  const watchedCasing10kg = watch(`${fieldPrefix}.casing10kgPipe`);
  const watchedCasing8kg = watch(`${fieldPrefix}.casing8kgPipe`);
  const watchedCasing6kg = watch(`${fieldPrefix}.casing6kgPipe`);

  // Purpose categorizations
  const isPrivateWork = workTypeContext === "private";
  const isPrivateIrrigation = applicationType === "Private_Irrigation" || applicationType === "Private Irrigation";
  const isDeptRigWork = watchedSiteConditions === "Accessible to Dept. Rig";
  const isQuotation = watchedTenderNo === "Quotation";

  const isWellPurpose = useMemo(() => {
    return ["BWC", "TWC", "FPW", "BW Dev", "TW Dev", "FPW Dev"].includes(watchedPurpose);
  }, [watchedPurpose]);

  const isRigPurpose = useMemo(() => {
    return ["BWC", "TWC", "FPW", "BW Dev", "TW Dev", "FPW Dev"].includes(watchedPurpose);
  }, [watchedPurpose]);

  const isDevPurpose = useMemo(() => {
    return ["BW Dev", "TW Dev", "FPW Dev"].includes(watchedPurpose);
  }, [watchedPurpose]);

  const isMWSSPurpose = useMemo(() => watchedPurpose === "MWSS", [watchedPurpose]);
  const isHPSPurpose = useMemo(() => watchedPurpose === "HPS" || watchedPurpose === "HPR", [watchedPurpose]);
  const isARSPurpose = useMemo(() => watchedPurpose === "ARS", [watchedPurpose]);

  // Read-only logic: supervisors can edit certain actuals fields
  const isFieldReadOnly = useCallback(
    (isSupervisorEditable: boolean) => {
      if (isReadOnly) {
        if (isSupervisor && isSupervisorEditable) return false;
        return true;
      }
      if (isSupervisor) {
        return !isSupervisorEditable;
      }
      return false;
    },
    [isReadOnly, isSupervisor]
  );

  // LSG & Constituency
  const sortedLsgMaps = useMemo(() => {
    return [...(allLsgConstituencyMaps || [])].sort((a, b) => a.name.localeCompare(b.name));
  }, [allLsgConstituencyMaps]);

  const constituencyOptionsForLsg = useMemo(() => {
    if (!watchedLsg || !allLsgConstituencyMaps) return [];
    const map = allLsgConstituencyMaps.find((m) => m.name === watchedLsg);
    if (!map || !map.constituencies) return [];
    return [...map.constituencies].sort((a, b) => a.localeCompare(b));
  }, [watchedLsg, allLsgConstituencyMaps]);

  const handleLsgChange = useCallback(
    (lsgName: string, fieldOnChange: (v: string) => void) => {
      const normalized = lsgName === "_clear_" ? "" : lsgName;
      fieldOnChange(normalized);
      // If LSG has constituencies, auto-select if only 1, otherwise reset constituency
      const map = (allLsgConstituencyMaps || []).find((m) => m.name === normalized);
      if (map && map.constituencies && map.constituencies.length === 1) {
        setValue(`${fieldPrefix}.constituency`, map.constituencies[0], { shouldDirty: true });
      } else {
        setValue(`${fieldPrefix}.constituency`, "", { shouldDirty: true });
      }
    },
    [allLsgConstituencyMaps, fieldPrefix, setValue]
  );

  const isConstituencyDisabled = useMemo(() => {
    if (isFieldReadOnly(false)) return true;
    if (!watchedLsg) return true;
    if (constituencyOptionsForLsg.length <= 1) return true;
    return false;
  }, [isFieldReadOnly, watchedLsg, constituencyOptionsForLsg]);

  // Filter diameter options based on Purpose
  const filteredSiteDiameterOptions = useMemo(() => {
    if (watchedPurpose === "TWC" || watchedPurpose === "TW Dev") {
      return (siteDiameterOptions || []).filter((d) => !d.includes("110") && !d.includes("4.5"));
    }
    if (watchedPurpose === "BWC" || watchedPurpose === "BW Dev") {
      return (siteDiameterOptions || []).filter((d) => !d.includes("200") && !d.includes("8"));
    }
    if (watchedPurpose === "FPW" || watchedPurpose === "FPW Dev") {
      return (siteDiameterOptions || []).filter(
        (d) => !d.includes("150") && !d.includes("6") && !d.includes("200") && !d.includes("8")
      );
    }
    return siteDiameterOptions || [];
  }, [watchedPurpose]);

  const filteredPurposeOptions = useMemo(() => {
    if (!isPrivateWork) return sitePurposeOptions;
    const arsIndex = sitePurposeOptions.indexOf("ARS");
    if (arsIndex === -1) return sitePurposeOptions;
    return sitePurposeOptions.slice(0, arsIndex + 1);
  }, [isPrivateWork]);

  // Auto-calculated casing pipe used
  useEffect(() => {
    const v10 = parseFloat(watchedCasing10kg || "0") || 0;
    const v8 = parseFloat(watchedCasing8kg || "0") || 0;
    const v6 = parseFloat(watchedCasing6kg || "0") || 0;
    const total = v10 + v8 + v6;
    if (total > 0) {
      setValue(`${fieldPrefix}.casingPipeUsed`, total.toString(), { shouldDirty: true });
    }
  }, [watchedCasing10kg, watchedCasing8kg, watchedCasing6kg, fieldPrefix, setValue]);

  // Expenditure auto-computation from Payment Details
  const computedExpenditure = useMemo(() => {
    if (!paymentDetails || !Array.isArray(paymentDetails) || paymentDetails.length === 0) {
      const existing = watch(`${fieldPrefix}.totalExpenditure`);
      return existing !== undefined && existing !== null ? Number(existing) : 0;
    }
    let total = 0;
    let foundAny = false;
    const siteName = (watchedNameOfSite || "").trim().toLowerCase();
    const sitePurpose = (watchedPurpose || "").trim().toLowerCase();
    const siteId = watch(`${fieldPrefix}.id`);

    for (const payment of paymentDetails) {
      if (payment.siteAllocations && Array.isArray(payment.siteAllocations)) {
        for (const alloc of payment.siteAllocations) {
          const allocName = (alloc.siteName || "").trim().toLowerCase();
          const allocPurpose = (alloc.purpose || "").trim().toLowerCase();
          const allocId = alloc.siteId;

          let isMatch = false;
          if (allocId && siteId && allocId === siteId) {
            isMatch = true;
          } else if (allocName && siteName && allocName === siteName) {
            if (allocPurpose && sitePurpose) {
              isMatch = allocPurpose === sitePurpose;
            } else if (!allocPurpose && !sitePurpose) {
              isMatch = true;
            }
          }

          if (isMatch) {
            total += Number(alloc.amount) || 0;
            foundAny = true;
          }
        }
      } else if (payment.nameOfSite && siteName) {
        const pSiteName = payment.nameOfSite.trim().toLowerCase();
        if (pSiteName === siteName || (sitePurpose && pSiteName === `${siteName} (${sitePurpose})`.toLowerCase())) {
          total += Number(payment.totalPaymentPerEntry) || 0;
          foundAny = true;
        }
      }
    }
    return foundAny ? total : (Number(watch(`${fieldPrefix}.totalExpenditure`)) || 0);
  }, [paymentDetails, watchedNameOfSite, watchedPurpose, fieldPrefix, watch]);

  // Keep total expenditure synced
  useEffect(() => {
    if (computedExpenditure !== undefined && computedExpenditure !== null) {
      const cur = watch(`${fieldPrefix}.totalExpenditure`);
      if (cur !== computedExpenditure) {
        setValue(`${fieldPrefix}.totalExpenditure`, computedExpenditure, { shouldDirty: true });
      }
    }
  }, [computedExpenditure, fieldPrefix, setValue, watch]);

  // e-Tender Matching
  const matchingTenderInStore = useMemo(() => {
    if (!watchedTenderNo || watchedTenderNo === "Quotation" || watchedTenderNo === "_clear_") return null;
    const clean = watchedTenderNo.trim().toUpperCase();
    return (allE_tenders || []).find(
      (t) =>
        (t.eTenderNo && t.eTenderNo.trim().toUpperCase() === clean) ||
        ((t as any).tenderNo && (t as any).tenderNo.trim().toUpperCase() === clean)
    );
  }, [watchedTenderNo, allE_tenders]);

  const isTenderSelected = !!matchingTenderInStore;

  // Tender selection side-effects (L1 Contractor, Quoted %, Supervisor, Scheduled Start Date)
  useEffect(() => {
    if (isTenderSelected && matchingTenderInStore) {
      const selectedTender = matchingTenderInStore;
      const validBidders = (selectedTender.bidders || []).filter(
        (b: Bidder) => b.status === "Accepted" && typeof b.quotedAmount === "number" && b.quotedAmount > 0
      );
      const l1Bidder =
        validBidders.length > 0
          ? validBidders.reduce((lowest: Bidder, cur: Bidder) =>
              (lowest.quotedAmount || 0) < (cur.quotedAmount || 0) ? lowest : cur
            )
          : null;

      if (l1Bidder) {
        setValue(`${fieldPrefix}.contractorName`, `${l1Bidder.name}, ${l1Bidder.address || ""}`, {
          shouldDirty: true,
        });
        if (l1Bidder.quotedPercentage !== undefined && l1Bidder.quotedPercentage !== null) {
          setValue(
            `${fieldPrefix}.quotedPercentage`,
            `${l1Bidder.quotedPercentage}% ${l1Bidder.aboveBelow || ""}`.trim(),
            { shouldDirty: true }
          );
        }
      }

      // Supervisor
      const staffIdentities: string[] = [];
      const addStaffInfo = (name?: string | null) => {
        if (!name) return;
        const staff = (allStaffMembers || []).find((s) => s.name === name);
        if (staff) {
          staffIdentities.push(`${staff.name} (${staff.designation})`);
        } else {
          staffIdentities.push(name);
        }
      };
      addStaffInfo(selectedTender.nameOfAssistantEngineer);
      addStaffInfo(selectedTender.supervisor1Name);
      addStaffInfo(selectedTender.supervisor2Name);
      addStaffInfo(selectedTender.supervisor3Name);

      const joinedInfo = staffIdentities.join(", ");
      if (joinedInfo) {
        setValue(`${fieldPrefix}.supervisorName`, joinedInfo, { shouldDirty: true });
        setValue(`${fieldPrefix}.supervisorUid`, null, { shouldDirty: true });
      }

      // Default start date if blank and not completed
      const curComp = getValues(`${fieldPrefix}.dateOfCompletion`);
      const curStatus = getValues(`${fieldPrefix}.workStatus`);
      const isCompleted = (curComp && String(curComp).trim() !== "") || isFinalSiteStatus(curStatus);
      const curStart = getValues(`${fieldPrefix}.startDate`);

      if (
        !isCompleted &&
        !curStart &&
        (selectedTender.presentStatus === "Work Order Issued" ||
          selectedTender.presentStatus === "Supply Order Issued") &&
        selectedTender.dateWorkOrder
      ) {
        const autoStart = calculateWorkCommencementDate(selectedTender.dateWorkOrder);
        if (autoStart) {
          setValue(`${fieldPrefix}.startDate`, autoStart, { shouldDirty: true });
        }
      }
    } else if (watchedTenderNo === "_clear_") {
      if (!isPrivateWork && !isDeptRigWork) {
        setValue(`${fieldPrefix}.contractorName`, "", { shouldDirty: true });
        setValue(`${fieldPrefix}.supervisorName`, "", { shouldDirty: true });
        setValue(`${fieldPrefix}.supervisorUid`, null, { shouldDirty: true });
        setValue(`${fieldPrefix}.quotedPercentage`, "", { shouldDirty: true });
      }
    }
  }, [
    isTenderSelected,
    matchingTenderInStore,
    watchedTenderNo,
    allStaffMembers,
    fieldPrefix,
    setValue,
    getValues,
    isPrivateWork,
    isDeptRigWork,
  ]);

  // Scheduled Start Date hint calculation
  const expectedStartFormatted = useMemo(() => {
    if (
      matchingTenderInStore &&
      (matchingTenderInStore.presentStatus === "Work Order Issued" ||
        matchingTenderInStore.presentStatus === "Supply Order Issued") &&
      matchingTenderInStore.dateWorkOrder
    ) {
      const auto = calculateWorkCommencementDate(matchingTenderInStore.dateWorkOrder);
      if (auto) {
        const parts = auto.split("-");
        if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
        return auto;
      }
    }
    return null;
  }, [matchingTenderInStore]);

  // Automated Work Status Calculation based on Priority Rules
  useEffect(() => {
    // 1. Terminal / Final Outcomes & Disputes (Highest Priority)
    if (watchedCompletionDate && String(watchedCompletionDate).trim() !== "") {
      setValue(`${fieldPrefix}.workStatus`, "Work Completed", { shouldDirty: true });
      return;
    }
    if (watchedTypeOfDispute && watchedTypeOfDispute !== "None") {
      setValue(`${fieldPrefix}.workStatus`, "Land / Work Dispute", { shouldDirty: true });
      return;
    }
    const activeCondition = watchedDrillingConditions || watchedDevelopingConditions || watchedSchemeConditions;
    if (activeCondition === "Land Disputes" || activeCondition === "Work Disputes and Conflicts") {
      setValue(`${fieldPrefix}.workStatus`, "Land / Work Dispute", { shouldDirty: true });
      return;
    }
    if (activeCondition === "Failed" || activeCondition === "Collapsed") {
      setValue(`${fieldPrefix}.workStatus`, "Work Failed", { shouldDirty: true });
      return;
    }
    if (activeCondition === "Cancelled") {
      setValue(`${fieldPrefix}.workStatus`, "Work Cancelled", { shouldDirty: true });
      return;
    }
    if (activeCondition === "Refund") {
      setValue(`${fieldPrefix}.workStatus`, "Refund Pending", { shouldDirty: true });
      return;
    }

    // 2. Active Execution Stage
    const hasStarted = watchedStartDate && String(watchedStartDate).trim() !== "";
    const hasActualDrilling =
      Number(watchedTotalDepth) > 0 || (watchedDateOfDrilling && String(watchedDateOfDrilling).trim() !== "");
    if (hasStarted || hasActualDrilling) {
      setValue(`${fieldPrefix}.workStatus`, "Work in Progress", { shouldDirty: true });
      return;
    }

    // 3. e-Tender / Rig Allotment Stage
    if (matchingTenderInStore) {
      const ts = matchingTenderInStore.presentStatus;
      if (ts === "Work Order Issued" || ts === "Supply Order Issued") {
        const isSiteCompleted =
          (watchedCompletionDate && String(watchedCompletionDate).trim() !== "") ||
          isFinalSiteStatus(watchedWorkStatus);
        if (!isSiteCompleted) {
          const startDateReached = isStartDateReached(watchedStartDate);
          if (startDateReached || hasActualDrilling) {
            setValue(`${fieldPrefix}.workStatus`, "Work in Progress", { shouldDirty: true });
          } else {
            setValue(`${fieldPrefix}.workStatus`, "Work Order Issued", { shouldDirty: true });
          }
        }
        return;
      }
      if (ts === "Selection Notice Issued") {
        setValue(`${fieldPrefix}.workStatus`, "Selection Notice Issued", { shouldDirty: true });
        return;
      }
      if (!ts || !["Cancelled", "Tender Cancelled", "Retender", "Re-tender"].includes(ts)) {
        setValue(`${fieldPrefix}.workStatus`, "Tendered", { shouldDirty: true });
        return;
      }
    } else if (watchedTenderNo === "Quotation") {
      setValue(`${fieldPrefix}.workStatus`, "Tendered", { shouldDirty: true });
      return;
    }

    // 4. Rig Accessibility & TS Allocation
    const ts = Number(watchedTsAmount) || 0;
    const isRig = ["BWC", "TWC", "FPW", "BW Dev", "TW Dev", "FPW Dev"].includes(watchedPurpose as any);

    if (isRig) {
      if (watchedSiteConditions === "Accessible to Dept. Rig" && ts > 0) {
        setValue(`${fieldPrefix}.workStatus`, "Department Rig Allotted", { shouldDirty: true });
        return;
      }
      if (watchedSiteConditions === "Accessible to Private Rig" && ts > 0) {
        setValue(`${fieldPrefix}.workStatus`, "Tender Pending", { shouldDirty: true });
        return;
      }
    } else {
      if (ts > 0) {
        setValue(`${fieldPrefix}.workStatus`, "Tender Pending", { shouldDirty: true });
        return;
      }
    }
  }, [
    watchedCompletionDate,
    watchedTypeOfDispute,
    watchedDrillingConditions,
    watchedDevelopingConditions,
    watchedSchemeConditions,
    watchedStartDate,
    watchedTotalDepth,
    watchedDateOfDrilling,
    matchingTenderInStore,
    watchedTenderNo,
    watchedTsAmount,
    watchedSiteConditions,
    watchedPurpose,
    watchedWorkStatus,
    fieldPrefix,
    setValue,
  ]);

  // Casing hint
  const casingDiameterHint = useMemo(() => {
    if (watchedDiameter?.includes("150") || watchedDiameter?.includes("6")) {
      return "For 150mm (6″) dia: 10kg/8kg/6kg PVC or MS Casing";
    }
    if (watchedDiameter?.includes("110") || watchedDiameter?.includes("4.5")) {
      return "For 110mm (4.5″) dia: 6kg/4kg PVC Casing";
    }
    return null;
  }, [watchedDiameter]);

  // Rig compressor options
  const rigOptions = useMemo(() => {
    const list = (allRigCompressors || []).map((r) => r.name || (r as any).rigNumber || "");
    return Array.from(new Set(list)).filter(Boolean);
  }, [allRigCompressors]);

  // Staff supervisors
  const supervisorListNames = useMemo(() => {
    return (allStaffMembers || []).filter((s) => s.name);
  }, [allStaffMembers]);

  return (
    <div className="bg-slate-50/70 dark:bg-slate-900/40 p-4 sm:p-5 rounded-xl border border-slate-200/90 dark:border-slate-800 space-y-4">
      <Tabs defaultValue="main" className="w-full">
        {/* TAB NAVIGATION HEADER - 5 distinct, well-organized tabs */}
        <TabsList className="grid grid-cols-2 sm:grid-cols-5 w-full bg-slate-200/70 dark:bg-slate-800/70 p-1.5 h-auto gap-1.5 rounded-lg border border-slate-300/60 dark:border-slate-700/60">
          <TabsTrigger
            value="main"
            className="text-xs sm:text-sm font-medium py-2.5 px-2 gap-1.5 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900 data-[state=active]:text-purple-700 dark:data-[state=active]:text-purple-300 data-[state=active]:shadow-xs rounded-md"
          >
            <MapPin className="h-4 w-4 text-purple-600 shrink-0" />
            <span className="truncate">1. Main & Location</span>
          </TabsTrigger>
          <TabsTrigger
            value="recommended"
            className="text-xs sm:text-sm font-medium py-2.5 px-2 gap-1.5 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900 data-[state=active]:text-blue-700 dark:data-[state=active]:text-blue-300 data-[state=active]:shadow-xs rounded-md"
          >
            <FileText className="h-4 w-4 text-blue-600 shrink-0" />
            <span className="truncate">2. Investigation & Rec.</span>
          </TabsTrigger>
          <TabsTrigger
            value="implementation"
            className="text-xs sm:text-sm font-medium py-2.5 px-2 gap-1.5 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900 data-[state=active]:text-amber-700 dark:data-[state=active]:text-amber-300 data-[state=active]:shadow-xs rounded-md"
          >
            <Wrench className="h-4 w-4 text-amber-600 shrink-0" />
            <span className="truncate">3. Work & Actuals</span>
          </TabsTrigger>
          <TabsTrigger
            value="status"
            className="text-xs sm:text-sm font-medium py-2.5 px-2 gap-1.5 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900 data-[state=active]:text-emerald-700 dark:data-[state=active]:text-emerald-300 data-[state=active]:shadow-xs rounded-md"
          >
            <Activity className="h-4 w-4 text-emerald-600 shrink-0" />
            <span className="truncate">4. Status & Exp.</span>
          </TabsTrigger>
          <TabsTrigger
            value="media"
            className="text-xs sm:text-sm font-medium py-2.5 px-2 gap-1.5 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900 data-[state=active]:text-rose-700 dark:data-[state=active]:text-rose-300 data-[state=active]:shadow-xs rounded-md"
          >
            <ImageIcon className="h-4 w-4 text-rose-600 shrink-0" />
            <span className="truncate">5. Media ({imageFields.length + videoFields.length})</span>
          </TabsTrigger>
        </TabsList>

        {/* ========================================================================= */}
        {/* TAB 1: Main & Location Details */}
        {/* ========================================================================= */}
        <TabsContent value="main" className="space-y-4 pt-4">
          <Card className="border border-slate-200 dark:border-slate-800 shadow-none">
            <CardHeader className="py-3 px-4 bg-muted/30 border-b">
              <CardTitle className="text-sm font-bold text-purple-700 dark:text-purple-400 flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Main & Location Details
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  name={`${fieldPrefix}.nameOfSite`}
                  control={control}
                  render={({ field }) => (
                    <FormItem className="md:col-span-1">
                      <FormLabel className="text-xs font-semibold">
                        Name of Site (English) <span className="text-destructive">*</span>
                      </FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          value={field.value ?? ""}
                          placeholder="e.g. Community Borewell / Site Name"
                          readOnly={isFieldReadOnly(false)}
                          className="min-h-[42px] bg-background text-sm"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  name={`${fieldPrefix}.nameOfSiteMl`}
                  control={control}
                  render={({ field }) => (
                    <FormItem className="md:col-span-1">
                      <FormLabel className="text-xs font-semibold">Name of Site (Malayalam)</FormLabel>
                      <FormControl>
                        <MalayalamInput
                          value={field.value ?? ""}
                          onChange={(val) => field.onChange(val)}
                          englishValue={watchedNameOfSite || ""}
                          multiline
                          rows={2}
                          disabled={isFieldReadOnly(false)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  name={`${fieldPrefix}.purpose`}
                  control={control}
                  render={({ field }) => (
                    <FormItem className="md:col-span-1">
                      <FormLabel className="text-xs font-semibold">
                        Purpose <span className="text-destructive">*</span>
                      </FormLabel>
                      <Select
                        onValueChange={(val) => field.onChange(val === "_clear_" ? undefined : val)}
                        value={field.value || ""}
                        disabled={isFieldReadOnly(false)}
                      >
                        <FormControl>
                          <SelectTrigger className="bg-background">
                            <SelectValue placeholder="Select Purpose" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="max-h-80">
                          <SelectItem value="_clear_">-- Clear Selection --</SelectItem>
                          {(filteredPurposeOptions || []).map((o) => (
                            <SelectItem key={o} value={o}>
                              {o}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  name={`${fieldPrefix}.localSelfGovt`}
                  control={control}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-semibold">
                        Local Self Govt. (LSG) <span className="text-destructive">*</span>
                      </FormLabel>
                      <Select
                        onValueChange={(value) => handleLsgChange(value, field.onChange)}
                        value={field.value || ""}
                        disabled={isFieldReadOnly(false)}
                      >
                        <FormControl>
                          <SelectTrigger className="bg-background">
                            <SelectValue placeholder="Select LSG" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="max-h-80">
                          <SelectItem value="_clear_">-- Clear Selection --</SelectItem>
                          {(sortedLsgMaps || []).map((map) => (
                            <SelectItem key={map.id} value={map.name}>
                              {map.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  name={`${fieldPrefix}.constituency`}
                  control={control}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-semibold">Constituency (LAC)</FormLabel>
                      <Select
                        onValueChange={(val) => field.onChange(val === "_clear_" ? undefined : val)}
                        value={field.value || ""}
                        disabled={isConstituencyDisabled}
                      >
                        <FormControl>
                          <SelectTrigger className="bg-background">
                            <SelectValue placeholder={!watchedLsg ? "Select LSG first" : "Select Constituency"} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="max-h-80">
                          <SelectItem value="_clear_">-- Clear Selection --</SelectItem>
                          {(constituencyOptionsForLsg || []).map((o) => (
                            <SelectItem key={o} value={o}>
                              {o}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  name={`${fieldPrefix}.plotArea`}
                  control={control}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-semibold">Plot Area (in Cents)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="any"
                          {...field}
                          value={field.value ?? ""}
                          placeholder="e.g. 10.5"
                          onChange={(e) =>
                            field.onChange(e.target.value === "" ? null : Number(e.target.value))
                          }
                          readOnly={isFieldReadOnly(false)}
                          className="bg-background"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* GPS Coordinates Section */}
              <div className="border-t pt-3 mt-3">
                <FormLabel className="text-xs font-semibold text-muted-foreground block mb-2">
                  GPS Coordinates & Location Capture
                </FormLabel>
                <GpsCoordinateCapture
                  control={control}
                  setValue={setValue}
                  latFieldName={`${fieldPrefix}.latitude` as any}
                  lngFieldName={`${fieldPrefix}.longitude` as any}
                  isReadOnly={isFieldReadOnly(true)}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ========================================================================= */}
        {/* TAB 2: Investigation & Recommended Works */}
        {/* ========================================================================= */}
        <TabsContent value="recommended" className="space-y-4 pt-4">
          <Card className="border border-slate-200 dark:border-slate-800 shadow-none">
            <CardHeader className="py-3 px-4 bg-muted/30 border-b">
              <CardTitle className="text-sm font-bold text-blue-700 dark:text-blue-400 flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Investigation Details (Recommended Specs)
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  name={`${fieldPrefix}.surveyRecommendedDiameter`}
                  control={control}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-semibold">Recommended Diameter (mm)</FormLabel>
                      <Select
                        onValueChange={(val) => field.onChange(val === "_clear_" ? undefined : val)}
                        value={field.value || ""}
                        disabled={isFieldReadOnly(false)}
                      >
                        <FormControl>
                          <SelectTrigger className="bg-background">
                            <SelectValue placeholder="Select Diameter" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="_clear_">-- Clear Selection --</SelectItem>
                          {(filteredSiteDiameterOptions || []).map((o) => (
                            <SelectItem key={o} value={o}>
                              {o}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  name={`${fieldPrefix}.surveyRecommendedTD`}
                  control={control}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-semibold">Recommended Total Depth (m)</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          value={field.value || ""}
                          placeholder="e.g. 130.00"
                          readOnly={isFieldReadOnly(false)}
                          className="bg-background"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {watchedPurpose === "BWC" && (
                  <>
                    <FormField
                      name={`${fieldPrefix}.surveyRecommendedOB`}
                      control={control}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs font-semibold">Recommended OB (m)</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              value={field.value || ""}
                              placeholder="e.g. 17.50"
                              readOnly={isFieldReadOnly(false)}
                              className="bg-background"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      name={`${fieldPrefix}.surveyRecommendedCasingPipe`}
                      control={control}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs font-semibold">Recommended Casing Pipe (m)</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              value={field.value || ""}
                              placeholder="e.g. 18.00"
                              readOnly={isFieldReadOnly(false)}
                              className="bg-background"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </>
                )}

                {watchedPurpose === "TWC" && (
                  <>
                    <FormField
                      name={`${fieldPrefix}.surveyRecommendedPlainPipe`}
                      control={control}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs font-semibold">Recommended Plain Pipe (m)</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              value={field.value || ""}
                              placeholder="e.g. 24.00"
                              readOnly={isFieldReadOnly(false)}
                              className="bg-background"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      name={`${fieldPrefix}.surveyRecommendedSlottedPipe`}
                      control={control}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs font-semibold">Recommended Slotted Pipe (m)</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              value={field.value || ""}
                              placeholder="e.g. 12.00"
                              readOnly={isFieldReadOnly(false)}
                              className="bg-background"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      name={`${fieldPrefix}.surveyRecommendedMsCasingPipe`}
                      control={control}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs font-semibold">Recommended MS Casing Pipe (m)</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              value={field.value || ""}
                              placeholder="e.g. 12.00"
                              readOnly={isFieldReadOnly(false)}
                              className="bg-background"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </>
                )}

                {watchedPurpose === "FPW" && (
                  <FormField
                    name={`${fieldPrefix}.casingPipeUsed`}
                    control={control}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-semibold">Casing Pipe (m)</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            value={field.value || ""}
                            placeholder="e.g. 15.00"
                            readOnly={isFieldReadOnly(false)}
                            className="bg-background"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t pt-3">
                <FormField
                  name={`${fieldPrefix}.surveyLocation`}
                  control={control}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-semibold">Well / Spot Location</FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          value={field.value || ""}
                          placeholder="e.g. North-East corner of the plot, 15m from boundary..."
                          readOnly={isFieldReadOnly(false)}
                          className="min-h-[50px] bg-background text-sm"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  name={`${fieldPrefix}.surveyRemarks`}
                  control={control}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-semibold">Investigation Remarks</FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          value={field.value || ""}
                          placeholder="e.g. Recommended for 110mm borewell with 18m casing..."
                          readOnly={isFieldReadOnly(false)}
                          className="min-h-[50px] bg-background text-sm"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ========================================================================= */}
        {/* TAB 3: Work Implementation & Drilling Actuals */}
        {/* ========================================================================= */}
        <TabsContent value="implementation" className="space-y-6 pt-4">
          {/* Sub-Card 1: Work Implementation */}
          <Card className="border border-slate-200 dark:border-slate-800 shadow-none">
            <CardHeader className="py-3 px-4 bg-muted/30 border-b">
              <CardTitle className="text-sm font-bold text-amber-700 dark:text-amber-400 flex items-center gap-2">
                <Wrench className="h-4 w-4" />
                Work Implementation (Tender, Contractor, & Estimates)
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {isRigPurpose && (
                  <FormField
                    name={`${fieldPrefix}.siteConditions`}
                    control={control}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-semibold">Rig & Site Accessibility</FormLabel>
                        <Select
                          onValueChange={(val) => field.onChange(val === "_clear_" ? undefined : val)}
                          value={field.value || ""}
                          disabled={isFieldReadOnly(false)}
                        >
                          <FormControl>
                            <SelectTrigger className="bg-background">
                              <SelectValue placeholder="Select Conditions" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="_clear_">-- Clear Selection --</SelectItem>
                            {(siteConditionsOptions || []).map((o) => (
                              <SelectItem key={o} value={o}>
                                {o}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                <FormField
                  name={`${fieldPrefix}.typeOfDispute`}
                  control={control}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-semibold">Type of Dispute</FormLabel>
                      <Select
                        onValueChange={(val) => field.onChange(val || "None")}
                        value={field.value || "None"}
                        disabled={isFieldReadOnly(false)}
                      >
                        <FormControl>
                          <SelectTrigger className="bg-background">
                            <SelectValue placeholder="Select Dispute" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {(typeOfDisputeOptions || []).map((o) => (
                            <SelectItem key={o} value={o}>
                              {o}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  name={`${fieldPrefix}.estimateAmount`}
                  control={control}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-semibold">Estimate Amount (₹)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="any"
                          {...field}
                          value={field.value ?? ""}
                          placeholder="e.g. 45000"
                          onChange={(e) =>
                            field.onChange(e.target.value === "" ? null : Number(e.target.value))
                          }
                          readOnly={isFieldReadOnly(false)}
                          className="bg-background"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  name={`${fieldPrefix}.remittedAmount`}
                  control={control}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-semibold">Remitted Amount (₹)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="any"
                          {...field}
                          value={field.value ?? ""}
                          placeholder="e.g. 45000"
                          onChange={(e) =>
                            field.onChange(e.target.value === "" ? null : Number(e.target.value))
                          }
                          readOnly={isFieldReadOnly(false)}
                          className="bg-background"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  name={`${fieldPrefix}.tsAmount`}
                  control={control}
                  render={({ field }) => (
                    <FormItem>
                      <div className="flex items-center justify-between">
                        <FormLabel className="text-xs font-semibold">TS Amount (₹)</FormLabel>
                        <FormField
                          name={`${fieldPrefix}.isAwaitingTS`}
                          control={control}
                          render={({ field: switchField }) => (
                            <div className="flex items-center space-x-1 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 px-1.5 py-0.5 rounded text-[11px]">
                              <span
                                className={cn(
                                  "font-medium select-none cursor-pointer",
                                  switchField.value
                                    ? "text-amber-800 dark:text-amber-300 font-semibold"
                                    : "text-muted-foreground"
                                )}
                                onClick={() => !isFieldReadOnly(false) && switchField.onChange(!switchField.value)}
                              >
                                Awaiting TS
                              </span>
                              <Switch
                                checked={!!switchField.value}
                                onCheckedChange={(checked) => switchField.onChange(checked)}
                                disabled={isFieldReadOnly(false)}
                                className="scale-75 origin-right data-[state=checked]:bg-amber-600"
                              />
                            </div>
                          )}
                        />
                      </div>
                      <FormControl>
                        <Input
                          type="number"
                          step="any"
                          {...field}
                          value={field.value ?? ""}
                          placeholder="e.g. 45000"
                          onChange={(e) => {
                            const val = e.target.value === "" ? null : Number(e.target.value);
                            field.onChange(val);
                            if (val && val > 0) {
                              setValue(`${fieldPrefix}.isAwaitingTS`, false);
                            }
                          }}
                          readOnly={isFieldReadOnly(false)}
                          className="bg-background"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Tender & Contractor Fields */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 border-t pt-3">
                {!isPrivateWork && !isDeptRigWork && (
                  <>
                    <FormField
                      name={`${fieldPrefix}.tenderNo`}
                      control={control}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs font-semibold">Tender No. / Quotation</FormLabel>
                          <Select
                            onValueChange={(val) => field.onChange(val === "_clear_" ? undefined : val)}
                            value={field.value || ""}
                            disabled={isTenderSelected || isFieldReadOnly(false)}
                          >
                            <FormControl>
                              <SelectTrigger
                                className={cn(
                                  "bg-background",
                                  (isTenderSelected || isFieldReadOnly(false)) && "bg-muted cursor-not-allowed"
                                )}
                              >
                                <SelectValue placeholder="Select Tender or Quotation" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent className="max-h-80">
                              <SelectItem value="_clear_">-- Clear Selection --</SelectItem>
                              <SelectItem value="Quotation">Quotation</SelectItem>
                              {(allE_tenders || [])
                                .filter((t) => t.eTenderNo)
                                .map((t) => (
                                  <SelectItem key={t.id} value={t.eTenderNo!}>
                                    {t.eTenderNo}
                                  </SelectItem>
                                ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      name={`${fieldPrefix}.quotedPercentage`}
                      control={control}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs font-semibold">Quoted Percentage of L1</FormLabel>
                          <FormControl>
                            <Input
                              type="text"
                              {...field}
                              value={field.value ?? ""}
                              readOnly={isTenderSelected || isFieldReadOnly(false)}
                              className={cn(
                                "bg-background",
                                (isTenderSelected || isFieldReadOnly(false)) && "bg-muted cursor-not-allowed"
                              )}
                              placeholder="e.g. 10% Below"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      name={`${fieldPrefix}.contractorName`}
                      control={control}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs font-semibold">Contractor Name</FormLabel>
                          {isQuotation ? (
                            <Select
                              onValueChange={(val) => {
                                if (val === "_clear_") {
                                  field.onChange("");
                                } else {
                                  const bidder = allBidders?.find((b) => b.name === val);
                                  field.onChange(bidder ? `${bidder.name}, ${bidder.address || ""}` : val);
                                }
                              }}
                              value={watchedContractorName ? watchedContractorName.split(",")[0].trim() : ""}
                              disabled={isTenderSelected || isFieldReadOnly(false)}
                            >
                              <FormControl>
                                <SelectTrigger
                                  className={cn(
                                    "bg-background",
                                    (isTenderSelected || isFieldReadOnly(false)) && "bg-muted cursor-not-allowed"
                                  )}
                                >
                                  <SelectValue placeholder="Select Contractor" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent className="max-h-80">
                                <SelectItem value="_clear_">-- Clear Selection --</SelectItem>
                                {(allBidders || [])
                                  .filter((b) => b.name)
                                  .map((b) => (
                                    <SelectItem key={b.id} value={b.name!}>
                                      {b.name}
                                    </SelectItem>
                                  ))}
                              </SelectContent>
                            </Select>
                          ) : (
                            <FormControl>
                              <Textarea
                                {...field}
                                value={field.value ?? ""}
                                readOnly={isTenderSelected || isFieldReadOnly(false)}
                                className={cn(
                                  "min-h-[40px] bg-background text-sm",
                                  (isTenderSelected || isFieldReadOnly(false)) && "bg-muted cursor-not-allowed"
                                )}
                              />
                            </FormControl>
                          )}
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </>
                )}

                <FormField
                  name={`${fieldPrefix}.supervisorName`}
                  control={control}
                  render={({ field }) => (
                    <FormItem className={isPrivateWork || isDeptRigWork ? "md:col-span-4" : ""}>
                      <div className="flex justify-between items-center mb-1">
                        <FormLabel className="text-xs font-semibold">Supervisor</FormLabel>
                        {(isQuotation || isPrivateWork || isDeptRigWork) &&
                          !isTenderSelected &&
                          !isFieldReadOnly(false) && (
                            <Button
                              type="button"
                              variant="link"
                              className="h-auto p-0 text-[10px] font-bold text-primary"
                              onClick={() => {
                                setIsManualSupervisor(!isManualSupervisor);
                                if (!isManualSupervisor) {
                                  setValue(`${fieldPrefix}.supervisorUid`, null);
                                }
                              }}
                            >
                              {isManualSupervisor ? "Pick from Staff" : "Manual Entry"}
                            </Button>
                          )}
                      </div>
                      {(isQuotation || isPrivateWork || isDeptRigWork) && !isManualSupervisor && !isTenderSelected ? (
                        <Select
                          onValueChange={(val) => {
                            if (val === "_clear_") {
                              field.onChange("");
                              setValue(`${fieldPrefix}.supervisorUid`, undefined);
                              setValue(`${fieldPrefix}.supervisorDesignation`, undefined);
                            } else {
                              const staff = supervisorListNames.find((s) => s.name === val);
                              if (staff) {
                                field.onChange(staff.name);
                                const linkedUser = supervisorList.find((u) => u.name === staff.name);
                                setValue(`${fieldPrefix}.supervisorUid`, linkedUser?.uid || null);
                                setValue(`${fieldPrefix}.supervisorDesignation`, staff.designation);
                              }
                            }
                          }}
                          value={watchedSupervisorName || ""}
                          disabled={isTenderSelected || isFieldReadOnly(false)}
                        >
                          <FormControl>
                            <SelectTrigger
                              className={cn(
                                "bg-background",
                                (isTenderSelected || isFieldReadOnly(false)) && "bg-muted cursor-not-allowed"
                              )}
                            >
                              <SelectValue placeholder="Select Supervisor" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="max-h-80">
                            <SelectItem value="_clear_">-- Clear Selection --</SelectItem>
                            {(supervisorListNames || []).map((s) => (
                              <SelectItem key={s.id} value={s.name}>
                                {s.name} ({s.designation})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <FormControl>
                          <Textarea
                            {...field}
                            value={field.value ?? ""}
                            readOnly={isTenderSelected || isFieldReadOnly(false)}
                            className={cn(
                              "min-h-[40px] bg-background text-sm",
                              (isTenderSelected || isFieldReadOnly(false)) && "bg-muted cursor-not-allowed"
                            )}
                            placeholder={isManualSupervisor ? "Enter external staff name..." : ""}
                          />
                        </FormControl>
                      )}
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                name={`${fieldPrefix}.implementationRemarks`}
                control={control}
                render={({ field }) => (
                  <FormItem className="border-t pt-3">
                    <FormLabel className="text-xs font-semibold">Implementation Remarks</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        value={field.value || ""}
                        placeholder="Any specific remarks about implementation..."
                        readOnly={isFieldReadOnly(false)}
                        className="min-h-[40px] bg-background text-sm"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Sub-Card 2: Drilling Actuals / Execution */}
          {isWellPurpose && (
            <Card className="border border-slate-200 dark:border-slate-800 shadow-none">
              <CardHeader className="py-3 px-4 bg-muted/30 border-b">
                <CardTitle className="text-sm font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-2">
                  <Activity className="h-4 w-4" />
                  Drilling Details (Actuals & Pipe Details)
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <FormField
                    name={`${fieldPrefix}.diameter`}
                    control={control}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-semibold">
                          Actual Diameter <span className="text-destructive">*</span>
                        </FormLabel>
                        <Select
                          onValueChange={(val) => field.onChange(val === "_clear_" ? undefined : val)}
                          value={field.value || ""}
                          disabled={isFieldReadOnly(true)}
                        >
                          <FormControl>
                            <SelectTrigger className="bg-background">
                              <SelectValue placeholder="Select Diameter" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="_clear_">-- Clear Selection --</SelectItem>
                            {(filteredSiteDiameterOptions || []).map((o) => (
                              <SelectItem key={o} value={o}>
                                {o}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    name={`${fieldPrefix}.totalDepth`}
                    control={control}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-semibold">Actual Total Depth (m)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="any"
                            {...field}
                            value={field.value ?? ""}
                            placeholder="e.g. 130.00"
                            onChange={(e) =>
                              field.onChange(e.target.value === "" ? null : Number(e.target.value))
                            }
                            readOnly={isFieldReadOnly(true)}
                            className="bg-background"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {watchedPurpose === "BWC" && (
                    <>
                      <FormField
                        name={`${fieldPrefix}.surveyOB`}
                        control={control}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs font-semibold">Actual Overburden OB (m)</FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                value={field.value || ""}
                                placeholder="e.g. 17.50"
                                readOnly={isFieldReadOnly(true)}
                                className="bg-background"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        name={`${fieldPrefix}.casing10kgPipe`}
                        control={control}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs font-semibold">Casing 10 kg/cm² (m)</FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                value={field.value || ""}
                                placeholder="e.g. 0.00"
                                readOnly={isFieldReadOnly(true)}
                                className="bg-background"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        name={`${fieldPrefix}.casing8kgPipe`}
                        control={control}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs font-semibold">Casing 8 kg/cm² (m)</FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                value={field.value || ""}
                                placeholder="e.g. 0.00"
                                readOnly={isFieldReadOnly(true)}
                                className="bg-background"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        name={`${fieldPrefix}.casing6kgPipe`}
                        control={control}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs font-semibold">Casing 6 kg/cm² (m)</FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                value={field.value || ""}
                                placeholder="e.g. 18.00"
                                readOnly={isFieldReadOnly(true)}
                                className="bg-background"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        name={`${fieldPrefix}.casingPipeUsed`}
                        control={control}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs font-semibold">Total Casing Pipe (m)</FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                value={field.value || ""}
                                placeholder="Auto-calculated sum"
                                readOnly={true}
                                className="bg-muted text-muted-foreground font-semibold"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </>
                  )}

                  <FormField
                    name={`${fieldPrefix}.yieldDischarge`}
                    control={control}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-semibold">Actual Yield (LPH)</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            value={field.value || ""}
                            placeholder="e.g. 5000"
                            readOnly={isFieldReadOnly(true)}
                            className="bg-background font-mono"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    name={`${fieldPrefix}.yieldCategory`}
                    control={control}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-semibold">Yield Category</FormLabel>
                        <Select
                          onValueChange={(val) => field.onChange(val === "_clear_" ? undefined : val)}
                          value={field.value || ""}
                          disabled={isFieldReadOnly(true)}
                        >
                          <FormControl>
                            <SelectTrigger className="bg-background">
                              <SelectValue placeholder="Select Category" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="_clear_">-- Clear Selection --</SelectItem>
                            {yieldCategoryOptions.map((cat) => (
                              <SelectItem key={cat} value={cat}>
                                {cat}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    name={`${fieldPrefix}.zoneDetails`}
                    control={control}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-semibold">Zone Details (m)</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            value={field.value || ""}
                            placeholder="e.g. 45 - 52, 78 - 85"
                            readOnly={isFieldReadOnly(true)}
                            className="bg-background"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    name={`${fieldPrefix}.waterLevel`}
                    control={control}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-semibold">Static Water Level (m)</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            value={field.value || ""}
                            placeholder="e.g. 12.50"
                            readOnly={isFieldReadOnly(true)}
                            className="bg-background"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    name={`${fieldPrefix}.typeOfRig`}
                    control={control}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-semibold">Type of Rig</FormLabel>
                        <Select
                          onValueChange={(val) => field.onChange(val === "_clear_" ? undefined : val)}
                          value={field.value || ""}
                          disabled={isFieldReadOnly(true)}
                        >
                          <FormControl>
                            <SelectTrigger className="bg-background">
                              <SelectValue placeholder="Select Rig" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="_clear_">-- Clear Selection --</SelectItem>
                            {(rigOptions || []).map((o) => (
                              <SelectItem key={o} value={o}>
                                {o}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    name={`${fieldPrefix}.drillingConditions`}
                    control={control}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-semibold">Drilling Conditions</FormLabel>
                        <Select
                          onValueChange={(val) => field.onChange(val === "_clear_" ? undefined : val)}
                          value={field.value || ""}
                          disabled={isFieldReadOnly(true)}
                        >
                          <FormControl>
                            <SelectTrigger className="bg-background">
                              <SelectValue placeholder="Select Drilling Conditions" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="_clear_">-- Clear Selection --</SelectItem>
                            {(drillingConditionsOptions || []).map((o) => (
                              <SelectItem key={o} value={o}>
                                {o}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  name={`${fieldPrefix}.drillingRemarks`}
                  control={control}
                  render={({ field }) => (
                    <FormItem className="border-t pt-3">
                      <FormLabel className="text-xs font-semibold">Drilling Remarks</FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          value={field.value || ""}
                          placeholder="Any specific remarks about drilling actuals..."
                          readOnly={isFieldReadOnly(true)}
                          className="min-h-[40px] bg-background text-sm"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* ========================================================================= */}
        {/* TAB 4: Work Status & Expenditure */}
        {/* ========================================================================= */}
        <TabsContent value="status" className="space-y-4 pt-4">
          <Card className="border border-slate-200 dark:border-slate-800 shadow-none">
            <CardHeader className="py-3 px-4 bg-muted/30 border-b">
              <CardTitle className="text-sm font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Work Status, Dates, & Expenditure
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  name={`${fieldPrefix}.workStatus`}
                  control={control}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-semibold">
                        Work Status <span className="text-muted-foreground font-normal">(Auto-calculated)</span>
                      </FormLabel>
                      <Select
                        onValueChange={(val) => field.onChange(val)}
                        value={field.value || "Under Process"}
                        disabled={isFieldReadOnly(true)}
                      >
                        <FormControl>
                          <SelectTrigger className="bg-background font-semibold">
                            <SelectValue placeholder="Work Status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="max-h-80">
                          {SITE_DIALOG_WORK_STATUS_OPTIONS.map((status) => (
                            <SelectItem key={status} value={status}>
                              {status}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        Auto-computed from conditions, dates, and tender status. Can be adjusted if needed.
                      </p>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  name={`${fieldPrefix}.startDate`}
                  control={control}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-semibold">Work Start Date</FormLabel>
                      <FormControl>
                        <Input
                          type="date"
                          {...field}
                          value={field.value || ""}
                          readOnly={isFieldReadOnly(true)}
                          className="bg-background"
                        />
                      </FormControl>
                      {!field.value && expectedStartFormatted ? (
                        <p className="text-[11px] text-amber-700 dark:text-amber-400 font-medium mt-1 flex items-center gap-1 bg-amber-50 dark:bg-amber-950/50 px-2 py-0.5 rounded border border-amber-200 dark:border-amber-800/50">
                          💡 Scheduled Start: <span className="font-bold">{expectedStartFormatted}</span> (Work Order +
                          4 days)
                        </p>
                      ) : (
                        <p className="text-[11px] text-muted-foreground mt-0.5">
                          Auto-fills when reaching Work Order + 4 days, or enter manually.
                        </p>
                      )}
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  name={`${fieldPrefix}.dateOfCompletion`}
                  control={control}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-semibold">Completion Date</FormLabel>
                      <FormControl>
                        <Input
                          type="date"
                          {...field}
                          value={field.value || ""}
                          readOnly={isFieldReadOnly(true)}
                          className="bg-background font-semibold"
                        />
                      </FormControl>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        Entering this automatically marks the site as &ldquo;Work Completed&rdquo;.
                      </p>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  name={`${fieldPrefix}.totalExpenditure`}
                  control={control}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-semibold">Total Expenditure (₹)</FormLabel>
                      <FormControl>
                        <Input
                          type="text"
                          value={
                            field.value !== undefined && field.value !== null && field.value !== ""
                              ? `₹${Number(field.value).toLocaleString("en-IN", {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2,
                                })}`
                              : "₹0.00"
                          }
                          readOnly
                          disabled
                          className="bg-muted font-semibold cursor-not-allowed text-foreground"
                        />
                      </FormControl>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        Auto-computed from Payment Details allocations.
                      </p>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {isPrivateIrrigation && (
                  <FormField
                    name={`${fieldPrefix}.subsidyAmount`}
                    control={control}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-semibold">Subsidy Amount (₹)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="any"
                            {...field}
                            value={field.value ?? ""}
                            placeholder="e.g. 15000"
                            onChange={(e) =>
                              field.onChange(e.target.value === "" ? null : Number(e.target.value))
                            }
                            readOnly={isFieldReadOnly(true)}
                            className="bg-background"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                <FormField
                  name={`${fieldPrefix}.workRemarks`}
                  control={control}
                  render={({ field }) => (
                    <FormItem className="md:col-span-3">
                      <FormLabel className="text-xs font-semibold">Work Remarks</FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          value={field.value ?? ""}
                          placeholder="Add any final remarks about the work status..."
                          readOnly={isFieldReadOnly(true)}
                          className="min-h-[45px] bg-background text-sm"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ========================================================================= */}
        {/* TAB 5: Media Gallery (Images & Videos) */}
        {/* ========================================================================= */}
        <TabsContent value="media" className="space-y-6 pt-4">
          <Card className="border border-slate-200 dark:border-slate-800 shadow-none">
            <CardHeader className="py-3 px-4 bg-muted/30 border-b">
              <CardTitle className="text-sm font-bold text-rose-700 dark:text-rose-400 flex items-center gap-2">
                <ImageIcon className="h-4 w-4" />
                Media Gallery (Photos & Videos)
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-6">
              {/* Work Images */}
              <div>
                <MediaManager
                  title="Work Images"
                  type="image"
                  fields={imageFields}
                  append={appendImage}
                  remove={removeImage}
                  update={updateImage}
                  isReadOnly={isFieldReadOnly(true)}
                  officeLocation={officeLocation}
                  fileNo={fileNo}
                  siteName={watchedNameOfSite}
                  siteId={watch(`${fieldPrefix}.id`)}
                  docPath={docPath}
                />
              </div>

              <Separator />

              {/* Work Videos */}
              <div>
                <MediaManager
                  title="Work Videos"
                  type="video"
                  fields={videoFields}
                  append={appendVideo}
                  remove={removeVideo}
                  update={updateVideo}
                  isReadOnly={isFieldReadOnly(true)}
                  officeLocation={officeLocation}
                  fileNo={fileNo}
                  siteName={watchedNameOfSite}
                  siteId={watch(`${fieldPrefix}.id`)}
                  docPath={docPath}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
