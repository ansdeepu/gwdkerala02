
// src/components/shared/SiteDialogContent.tsx
"use client";

import { useForm, FormProvider, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { Save, X, Info, Loader2, UserPlus, Users } from "lucide-react";
import { MalayalamInput } from "@/components/ui/malayalam-input-helper";
import {
  SiteDetailSchema,
  type SiteDetailFormData,
  siteWorkStatusOptions,
  sitePurposeOptions,
  type SitePurpose,
  siteDiameterOptions,
  siteTypeOfRigOptions,
  siteConditionsOptions,
  drillingConditionsOptions,
  developingConditionsOptions,
  schemeConditionsOptions,
  yieldCategoryOptions,
  type Constituency,
  type StaffMember,
  type Bidder,
  designationOptions,
  type RigCompressor
} from '@/lib/schemas';
import type { E_tender } from '@/hooks/useE_tenders';
import { calculateWorkCommencementDate } from '@/lib/holidayUtils';
import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format, isValid, parseISO } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import MediaManager from '@/components/shared/MediaManager';

const toDateOrNull = (value: any): Date | null => {
    if (!value) return null;
    if (value instanceof Date) return value;
    if (typeof value === 'object' && value !== null && typeof (value as any).seconds === 'number') {
        return new Date((value as any).seconds * 1000);
    }
    if (typeof value === 'string') {
        const parsed = new Date(value);
        if (!isNaN(parsed.getTime())) return parsed;
    }
    return null;
};

const formatDateForInput = (date: any): string => {
    if (!date) return '';
    const d = toDateOrNull(date);
    return d ? format(d, 'yyyy-MM-dd') : '';
};

// Filtered status options as requested by the user
const SITE_DIALOG_WORK_STATUS_OPTIONS = [
  "Under Process",
  "Additional Fund Awaited",
  "TS Pending",
  "Refund Pending",
  "Department Rig Allotted",
  "Tendered",
  "Selection Notice Issued",
  "Work Order Issued",
  "Work in Progress",
  "Work Failed",
  "Work Cancelled",
  "Work Completed"
] as const;

export default function SiteDialogContent({ initialData, onConfirm, onCancel, isReadOnly, isSupervisor, supervisorList, allLsgConstituencyMaps, allE_tenders, allStaffMembers, allBidders, allRigCompressors, workTypeContext, applicationType, paymentDetails, remittanceDetails }: {
    initialData: Partial<SiteDetailFormData>;
    onConfirm: (data: SiteDetailFormData) => void;
    onCancel: () => void;
    isReadOnly: boolean;
    isSupervisor: boolean;
    supervisorList: (StaffMember & { uid: string; name: string; })[];
    allLsgConstituencyMaps: any[];
    allE_tenders: E_tender[];
    allStaffMembers: StaffMember[];
    allBidders: Bidder[];
    allRigCompressors: RigCompressor[];
    workTypeContext: 'public' | 'private' | 'collector' | 'planFund' | 'gwInvestigation' | 'loggingPumpingTest' | null;
    applicationType?: string | null;
    paymentDetails?: any[];
    remittanceDetails?: any[];
}) {
    const hasExplicitCasing6kg = initialData?.casing6kgPipe !== undefined && initialData?.casing6kgPipe !== null;
    const initialCasing6kg = hasExplicitCasing6kg ? initialData.casing6kgPipe : (initialData?.casingPipeUsed || "");
    const initialObValue = (initialData?.surveyOB !== undefined && initialData?.surveyOB !== null)
        ? String(initialData.surveyOB)
        : "";

    const computedExpenditure = useMemo(() => {
        if (!paymentDetails || !Array.isArray(paymentDetails) || paymentDetails.length === 0) {
            return initialData?.totalExpenditure !== undefined && initialData?.totalExpenditure !== null ? Number(initialData.totalExpenditure) : undefined;
        }
        let total = 0;
        let foundAny = false;
        const siteName = (initialData?.nameOfSite || '').trim().toLowerCase();
        const sitePurpose = (initialData?.purpose || '').trim().toLowerCase();
        const siteId = initialData?.id;

        for (const payment of paymentDetails) {
            if (payment.siteAllocations && Array.isArray(payment.siteAllocations)) {
                for (const alloc of payment.siteAllocations) {
                    const allocName = (alloc.siteName || '').trim().toLowerCase();
                    const allocPurpose = (alloc.purpose || '').trim().toLowerCase();
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
        if (foundAny) return total;
        return initialData?.totalExpenditure !== undefined && initialData?.totalExpenditure !== null ? Number(initialData.totalExpenditure) : undefined;
    }, [paymentDetails, initialData?.nameOfSite, initialData?.purpose, initialData?.id, initialData?.totalExpenditure]);

    const initialMatchedTender = useMemo(() => {
        if (!allE_tenders || allE_tenders.length === 0) return null;
        const normTenderNo = initialData?.tenderNo?.trim().toUpperCase();
        if (normTenderNo && normTenderNo !== '_CLEAR_' && normTenderNo !== 'QUOTATION') {
            const found = allE_tenders.find(t => t.eTenderNo && t.eTenderNo.trim().toUpperCase() === normTenderNo);
            if (found) return found;
        }
        const siteFileNo = (initialData as any)?.fileNo;
        const siteId = initialData?.id;
        const siteName = (initialData?.nameOfSite || '').trim().toLowerCase();
        return allE_tenders.find(t => {
            if (!t.eTenderNo) return false;
            const fileMatch = siteFileNo && [t.fileNo, t.fileNo2, t.fileNo3, t.fileNo4].some(f => {
                if (!f || !siteFileNo) return false;
                const cleanF = f.trim().toUpperCase().replace(/^[A-Z][A-Z0-9_]*\//, '');
                const cleanSite = siteFileNo.trim().toUpperCase().replace(/^[A-Z][A-Z0-9_]*\//, '');
                return cleanF === cleanSite;
            });
            const siteMatch = (siteId && (t.selectedSiteIds || []).includes(siteId)) || 
                (t.linkedSites || []).some((ls: any) => (siteId && ls.siteId === siteId) || (siteName && (ls.nameOfSite || '').trim().toLowerCase() === siteName));
            return fileMatch || siteMatch;
        });
    }, [allE_tenders, initialData]);

    const initialComputedStartDate = useMemo(() => {
        if (initialData?.startDate && String(initialData.startDate).trim() !== '') {
            return formatDateForInput(initialData.startDate);
        }
        if (initialMatchedTender && (initialMatchedTender.presentStatus === 'Work Order Issued' || initialMatchedTender.presentStatus === 'Supply Order Issued') && initialMatchedTender.dateWorkOrder) {
            return calculateWorkCommencementDate(initialMatchedTender.dateWorkOrder) || "";
        }
        return "";
    }, [initialData?.startDate, initialMatchedTender]);

    const form = useForm<SiteDetailFormData>({
        resolver: zodResolver(SiteDetailSchema),
        defaultValues: {
            ...initialData,
            startDate: initialComputedStartDate,
            totalExpenditure: computedExpenditure !== undefined ? computedExpenditure : (initialData?.totalExpenditure ?? undefined),
            casing6kgPipe: initialCasing6kg ?? "",
            casing8kgPipe: initialData?.casing8kgPipe ?? "",
            casing10kgPipe: initialData?.casing10kgPipe ?? "",
            casingPipeUsed: initialData?.casingPipeUsed ?? "",
            surveyRecommendedCasingPipe: initialData?.surveyRecommendedCasingPipe ?? "",
            surveyOB: initialObValue,
            surveyRecommendedOB: initialData?.surveyRecommendedOB ?? "",
            dateOfCompletion: formatDateForInput(initialData?.dateOfCompletion),
            arsSanctionedDate: formatDateForInput(initialData?.arsSanctionedDate),
            isAwaitingTS: initialData?.isAwaitingTS ?? false,
            workImages: initialData?.workImages || [],
            workVideos: initialData?.workVideos || [],
        },
    });
    
    const { control, setValue, watch, handleSubmit, getValues } = form;

    const { fields: imageFields, append: appendImage, remove: removeImage, update: updateImage } = useFieldArray({ control, name: "workImages" });
    const { fields: videoFields, append: appendVideo, remove: removeVideo, update: updateVideo } = useFieldArray({ control, name: "workVideos" });

    const watchedPurpose = watch('purpose');
    const watchedWorkStatus = watch('workStatus');
    const watchedLsg = watch("localSelfGovt");
    const watchedTenderNo = watch('tenderNo');
    const watchedContractorName = watch('contractorName');
    const watchedSupervisorName = watch('supervisorName');
    const watchedSiteConditions = watch('siteConditions');
    const watchedDrillingConditions = watch('drillingConditions');
    const watchedDevelopingConditions = watch('developingConditions');
    const watchedSchemeConditions = watch('schemeConditions');
    const watchedCompletionDate = watch('dateOfCompletion');
    const watchedStartDate = watch('startDate');
    const watchedEstimateAmount = watch('estimateAmount');
    const watchedRemittedAmount = watch('remittedAmount');
    const watchedTsAmount = watch('tsAmount');
    const watchedIsAwaitingTS = watch('isAwaitingTS');
    const watchedTotalDepth = watch('totalDepth');
    const watchedDateOfDrilling = watch('dateOfDrilling');

    const totalRemittedAmount = useMemo(() => {
        if (remittanceDetails && Array.isArray(remittanceDetails)) {
            return remittanceDetails.reduce((sum, r) => sum + (Number(r?.amountRemitted) || 0), 0);
        }
        return 0;
    }, [remittanceDetails]);

    const isPrivateWork = workTypeContext === 'private';
    const isPrivateIrrigation = applicationType === 'Private_Irrigation' || applicationType === 'Private Irrigation';
    const isDeptRigWork = watchedSiteConditions === 'Accessible to Dept. Rig';
    const isQuotation = watchedTenderNo === 'Quotation';

    // Filter diameter options based on Purpose
    const filteredSiteDiameterOptions = useMemo(() => {
        if (watchedPurpose === 'TWC' || watchedPurpose === 'TW Dev') {
            return (siteDiameterOptions || []).filter(d => !d.includes('110') && !d.includes('4.5'));
        }
        if (watchedPurpose === 'BWC' || watchedPurpose === 'BW Dev') {
            return (siteDiameterOptions || []).filter(d => !d.includes('200') && !d.includes('8'));
        }
        if (watchedPurpose === 'FPW' || watchedPurpose === 'FPW Dev') {
            return (siteDiameterOptions || []).filter(d => !d.includes('150') && !d.includes('6') && !d.includes('200') && !d.includes('8'));
        }
        return siteDiameterOptions || [];
    }, [watchedPurpose]);

    const [isManualSupervisor, setIsManualSupervisor] = useState(false);

    const supervisorListNames = useMemo(() => {
        const targetDesignations = ["Master Driller", "Senior Driller", "Driller", "Driller Mechanic", "Drilling Assistant", "Tracer", "Draftsman"];
        const filtered = (allStaffMembers || []).filter(s => 
            s.status === 'Active' && 
            s.designation && 
            targetDesignations.includes(s.designation as any)
        );

        const designationOrder = (designationOptions as unknown as string[]) || [];
        return filtered.sort((a, b) => {
            const indexA = a.designation ? designationOrder.indexOf(a.designation) : 999;
            const indexB = b.designation ? designationOrder.indexOf(b.designation) : 999;
            if (indexA !== indexB) return indexA - indexB;
            return a.name.localeCompare(b.name);
        });
    }, [allStaffMembers]);

    // Initialize manual entry state if current name isn't in the list
    useEffect(() => {
        if (initialData?.supervisorName && (isQuotation || isPrivateWork || isDeptRigWork)) {
            const isInList = supervisorListNames.some(s => s.name === initialData.supervisorName);
            if (!isInList) {
                setIsManualSupervisor(true);
            }
        }
    }, [initialData, supervisorListNames, isQuotation, isPrivateWork, isDeptRigWork]);

    useEffect(() => {
        if (!watchedLsg || !allLsgConstituencyMaps) {
            return;
        }
        const map = allLsgConstituencyMaps.find(m => m.name === watchedLsg);
        const constituencies = map?.constituencies || [];
        
        if (constituencies.length === 1) {
            const autoValue = constituencies[0];
            if (getValues('constituency') !== autoValue) {
                setValue('constituency', autoValue as Constituency, { shouldDirty: true, shouldValidate: true });
            }
        } else {
            const current = getValues('constituency');
            if (current && !constituencies.includes(current)) {
                setValue('constituency', undefined);
            }
        }
    }, [watchedLsg, allLsgConstituencyMaps, setValue, getValues]);

    const watchedCasing10kg = watch('casing10kgPipe');
    const watchedCasing8kg = watch('casing8kgPipe');
    const watchedCasing6kg = watch('casing6kgPipe');
    const watchedInner6kg = watch('innerCasing6kgPipe');
    const watchedInner4kg = watch('innerCasing4kgPipe');
    const watchedDiameter = watch('diameter');

    const casingDiameterHint = useMemo(() => {
        if (!watchedDiameter) return "";
        if (watchedDiameter.includes("110") || watchedDiameter.includes("4.5")) {
            return "ø140 mm";
        }
        if (watchedDiameter.includes("150") || watchedDiameter.includes("6")) {
            return "ø180 mm";
        }
        return "";
    }, [watchedDiameter]);

    const endCapHint = useMemo(() => {
        if (!watchedDiameter) return "";
        if (watchedPurpose === 'TWC' || watchedPurpose === 'TW Dev') {
            if (watchedDiameter.includes("150") || watchedDiameter.includes("6")) {
                return "1 No. and ø150 mm";
            }
            if (watchedDiameter.includes("200") || watchedDiameter.includes("8")) {
                return "1 No. and ø200 mm";
            }
            return "";
        }
        if (watchedDiameter.includes("110") || watchedDiameter.includes("4.5")) {
            return "1 No. and ø140 mm";
        }
        if (watchedDiameter.includes("150") || watchedDiameter.includes("6")) {
            return "1 No. and ø180 mm";
        }
        return "";
    }, [watchedDiameter, watchedPurpose]);

    const twcPlainPipeLabel = useMemo(() => {
        if (watchedDiameter?.includes("150") || watchedDiameter?.includes("6")) {
            return "150mm Plain Pipe (m)";
        }
        if (watchedDiameter?.includes("200") || watchedDiameter?.includes("8")) {
            return "200mm Plain Pipe (m)";
        }
        return "200/150mm Plain Pipe (m)";
    }, [watchedDiameter]);

    const twcRibbedPipeLabel = useMemo(() => {
        if (watchedDiameter?.includes("150") || watchedDiameter?.includes("6")) {
            return "150mm Ribbed Pipe (m)";
        }
        if (watchedDiameter?.includes("200") || watchedDiameter?.includes("8")) {
            return "200mm Ribbed Pipe (m)";
        }
        return "200/150mm Ribbed Pipe (m)";
    }, [watchedDiameter]);

    const twcBailPlugLabel = useMemo(() => {
        if (watchedDiameter?.includes("150") || watchedDiameter?.includes("6")) {
            return "150mm Bail Plug";
        }
        if (watchedDiameter?.includes("200") || watchedDiameter?.includes("8")) {
            return "200mm Bail Plug";
        }
        return "200/150mm Bail Plug";
    }, [watchedDiameter]);

    useEffect(() => {
        const v10 = parseFloat(watchedCasing10kg || '0') || 0;
        const v8 = parseFloat(watchedCasing8kg || '0') || 0;
        const v6 = parseFloat(watchedCasing6kg || '0') || 0;
        const totalCasing = v10 + v8 + v6;
        setValue('casingPipeUsed', totalCasing > 0 ? totalCasing.toString() : '');
    }, [watchedCasing10kg, watchedCasing8kg, watchedCasing6kg, setValue]);

    useEffect(() => {
        const i6 = parseFloat(watchedInner6kg || '0') || 0;
        const i4 = parseFloat(watchedInner4kg || '0') || 0;
        const totalInner = i6 + i4;
        setValue('innerCasingPipe', totalInner > 0 ? totalInner.toString() : '');
    }, [watchedInner6kg, watchedInner4kg, setValue]);
    
    const isCompletionDateRequired = watchedWorkStatus === 'Work Completed' || watchedWorkStatus === 'Work Failed';

    const isWellPurpose = useMemo(() => ['BWC', 'TWC', 'FPW'].includes(watchedPurpose as any), [watchedPurpose]);
    const isDevPurpose = useMemo(() => ['BW Dev', 'TW Dev', 'FPW Dev'].includes(watchedPurpose as any), [watchedPurpose]);
    const isMWSSPurpose = useMemo(() => ['MWSS', 'MWSS Ext', 'Pumping Scheme', 'MWSS Pump Reno'].includes(watchedPurpose as any), [watchedPurpose]);
    const isHPSPurpose = useMemo(() => ['HPS', 'HPR'].includes(watchedPurpose as any), [watchedPurpose]);
    const isARSPurpose = useMemo(() => watchedPurpose === 'ARS', [watchedPurpose]);

    const filteredPurposeOptions = useMemo(() => {
        if (isPrivateWork) {
            return ["BWC", "TWC", "FPW", "BW Dev", "TW Dev", "FPW Dev"];
        }
        const arsIndex = (sitePurposeOptions || []).indexOf("ARS");
        if (arsIndex === -1) return sitePurposeOptions;
        return sitePurposeOptions.slice(0, arsIndex + 1);
    }, [isPrivateWork]);

    const isFieldReadOnly = useCallback((isSupervisorEditable: boolean) => {
        if (isReadOnly) {
            if (isSupervisor && isSupervisorEditable) {
                return false; // Supervisors can edit this specific field
            }
            return true;
        }
        if (isSupervisor) {
            return !isSupervisorEditable;
        }
        return false;
    }, [isReadOnly, isSupervisor]);

    const sortedLsgMaps = useMemo(() => {
        return [...(allLsgConstituencyMaps || [])].sort((a, b) => a.name.localeCompare(b.name));
    }, [allLsgConstituencyMaps]);
    
    const constituencyOptionsForLsg = useMemo(() => {
        if (!watchedLsg || !allLsgConstituencyMaps) return [];
        const map = allLsgConstituencyMaps.find(m => m.name === watchedLsg);
        if (!map || !map.constituencies) return [];
        return [...map.constituencies].sort((a, b) => a.localeCompare(b));
    }, [watchedLsg, allLsgConstituencyMaps]);
    
    const handleLsgChange = useCallback((lsgName: string, fieldOnChange: (v: string) => void) => {
        const normalized = lsgName === '_clear_' ? '' : lsgName;
        fieldOnChange(normalized);
    }, []);

    const isConstituencyDisabled = useMemo(() => {
        if (isFieldReadOnly(false)) return true;
        if (!watchedLsg) return true;
        if (constituencyOptionsForLsg.length <= 1) return true;
        return false;
    }, [isFieldReadOnly, watchedLsg, constituencyOptionsForLsg]);

    // Helper to match file numbers cleanly by stripping office prefixes
    const matchFileNo = useCallback((f1?: string | null, f2?: string | null): boolean => {
        if (!f1 || !f2) return false;
        const clean1 = f1.trim().toUpperCase();
        const clean2 = f2.trim().toUpperCase();
        if (clean1 === clean2) return true;
        const stripOfficePrefix = (str: string) => str.replace(/^[A-Z][A-Z0-9_]*\//, '');
        return stripOfficePrefix(clean1) === stripOfficePrefix(clean2);
    }, []);

    // Effect to auto-fetch matching e-Tender No. if tenderNo is not explicitly set
    useEffect(() => {
        if (!watchedTenderNo && allE_tenders && allE_tenders.length > 0) {
            const siteFileNo = (initialData as any)?.fileNo;
            const siteId = initialData?.id;
            const siteName = (initialData?.nameOfSite || '').trim().toLowerCase();

            const matchingTender = allE_tenders.find(t => {
                if (!t.eTenderNo) return false;
                const fileMatch = siteFileNo && [t.fileNo, t.fileNo2, t.fileNo3, t.fileNo4].some(f => matchFileNo(f, siteFileNo));
                const siteMatch = (t.selectedSiteIds || []).includes(siteId || '') || 
                    (t.linkedSites || []).some((ls: any) => ls.siteId === siteId || (siteName && (ls.nameOfSite || '').trim().toLowerCase() === siteName));
                return fileMatch || siteMatch;
            });

            if (matchingTender && matchingTender.eTenderNo) {
                setValue('tenderNo', matchingTender.eTenderNo);
            }
        }
    }, [watchedTenderNo, allE_tenders, initialData, setValue, matchFileNo]);

    const matchingTenderInStore = (allE_tenders || []).find(t => 
        (t.eTenderNo && t.eTenderNo.trim().toUpperCase() === (watchedTenderNo || '').trim().toUpperCase()) ||
        ((t as any).tenderNo && (t as any).tenderNo.trim().toUpperCase() === (watchedTenderNo || '').trim().toUpperCase())
    );
    const isTenderSelected = !!(watchedTenderNo && watchedTenderNo !== 'Quotation' && watchedTenderNo !== '_clear_' && matchingTenderInStore);
    const prevTenderNoRef = useRef<any>(initialData?.tenderNo);

    // If site has a recorded tenderNo that does not exist in allE_tenders (e.g. deleted e-tender), auto-clear it
    useEffect(() => {
        if (watchedTenderNo && watchedTenderNo !== 'Quotation' && watchedTenderNo !== '_clear_' && allE_tenders && allE_tenders.length > 0) {
            const exists = allE_tenders.some(t => 
                (t.eTenderNo && t.eTenderNo.trim().toUpperCase() === watchedTenderNo.trim().toUpperCase()) ||
                ((t as any).tenderNo && (t as any).tenderNo.trim().toUpperCase() === watchedTenderNo.trim().toUpperCase())
            );
            if (!exists) {
                setValue('tenderNo', undefined);
                if (!isPrivateWork && !isDeptRigWork) {
                    setValue('contractorName', '');
                    setValue('quotedPercentage', '');
                }
            }
        }
    }, [watchedTenderNo, allE_tenders, setValue, isPrivateWork, isDeptRigWork]);

    useEffect(() => {
        if (isTenderSelected) {
            const selectedTender = (allE_tenders || []).find(t => t.eTenderNo === watchedTenderNo);
            if (selectedTender) {
                const validBidders = (selectedTender.bidders || []).filter((b: Bidder) => b.status === 'Accepted' && typeof b.quotedAmount === 'number' && b.quotedAmount > 0);
                const l1Bidder = validBidders.length > 0 ? validBidders.reduce((lowest: Bidder, current: Bidder) => (lowest.quotedAmount! < current.quotedAmount!) ? lowest : current) : null;
                if (l1Bidder) {
                    setValue('contractorName', `${l1Bidder.name}, ${l1Bidder.address}`);
                }
                
                if (l1Bidder && l1Bidder.quotedPercentage !== undefined && l1Bidder.quotedPercentage !== null) {
                    setValue('quotedPercentage', `${l1Bidder.quotedPercentage}% ${l1Bidder.aboveBelow || ''}`.trim());
                }

                const staffIdentities: string[] = [];
                const addStaffInfo = (name?: string | null) => {
                    if (!name) return;
                    const staff = (allStaffMembers || []).find(s => s.name === name);
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
                
                const joinedInfo = staffIdentities.join(', ');
                if (joinedInfo) {
                    setValue('supervisorName', joinedInfo);
                    setValue('supervisorUid', null);
                }

                // Default site's Start Date after 4th day of Work Order Date (skipping Sundays and Public Holidays) if blank
                if (!getValues('startDate') && (selectedTender.presentStatus === 'Work Order Issued' || selectedTender.presentStatus === 'Supply Order Issued') && selectedTender.dateWorkOrder) {
                    const autoStart = calculateWorkCommencementDate(selectedTender.dateWorkOrder);
                    if (autoStart) {
                        setValue('startDate', autoStart, { shouldDirty: true });
                    }
                }

                // Tender details linked
            }
        } else if (watchedTenderNo === '_clear_') {
            if (!isPrivateWork && !isDeptRigWork) {
                setValue('contractorName', '');
                setValue('supervisorName', '');
                setValue('supervisorUid', undefined);
                setValue('quotedPercentage', '');
            }
        }

        prevTenderNoRef.current = watchedTenderNo;
    }, [watchedTenderNo, isTenderSelected, isQuotation, allE_tenders, allStaffMembers, setValue, getValues, isPrivateWork, isDeptRigWork]);

    // Automated Work Status Calculation based on Priority Rules
    useEffect(() => {
        const activeCondition = watchedDrillingConditions || watchedDevelopingConditions || watchedSchemeConditions;

        // 1. Terminal / Final Outcomes (Highest Priority)
        // Work Completed - Completion Date is present
        if (watchedCompletionDate && String(watchedCompletionDate).trim() !== '') {
            setValue('workStatus', 'Work Completed');
            return;
        }
        // Work Failed - Drilling Conditions is Failed (or Collapsed)
        if (activeCondition === 'Failed' || activeCondition === 'Collapsed') {
            setValue('workStatus', 'Work Failed');
            return;
        }
        // Work Cancelled - Drilling Conditions is Cancelled
        if (activeCondition === 'Cancelled') {
            setValue('workStatus', 'Work Cancelled');
            return;
        }
        // Refund Pending - Conditions is Refund
        if (activeCondition === 'Refund') {
            setValue('workStatus', 'Refund Pending');
            return;
        }

        // 2. Active Execution Stage
        // Work in Progress - Start Date is not blank (or actual drilling/execution commenced)
        const hasStarted = watchedStartDate && String(watchedStartDate).trim() !== '';
        const hasActualDrilling = (Number(watchedTotalDepth) > 0) || (watchedDateOfDrilling && String(watchedDateOfDrilling).trim() !== '');
        if (hasStarted || hasActualDrilling) {
            setValue('workStatus', 'Work in Progress');
            return;
        }

        // 3. e-Tender / Rig Allotment Stage
        let activeTender: any = null;
        if (watchedTenderNo && watchedTenderNo !== '_clear_' && watchedTenderNo !== 'Quotation') {
            const cleanWatched = watchedTenderNo.trim().toUpperCase();
            activeTender = (allE_tenders || []).find(t => 
                (t.eTenderNo && t.eTenderNo.trim().toUpperCase() === cleanWatched) ||
                ((t as any).tenderNo && (t as any).tenderNo.trim().toUpperCase() === cleanWatched)
            );
        }
        if (!activeTender && allE_tenders && allE_tenders.length > 0) {
            const siteFileNo = (initialData as any)?.fileNo;
            const siteId = initialData?.id;
            const siteName = (initialData?.nameOfSite || '').trim().toLowerCase();
            activeTender = allE_tenders.find(t => {
                if (!t.eTenderNo) return false;
                const fileMatch = siteFileNo && [t.fileNo, t.fileNo2, t.fileNo3, t.fileNo4].some(f => matchFileNo(f, siteFileNo));
                const siteMatch = (siteId && (t.selectedSiteIds || []).includes(siteId)) || 
                    (t.linkedSites || []).some((ls: any) => (siteId && ls.siteId === siteId) || (siteName && (ls.nameOfSite || '').trim().toLowerCase() === siteName));
                return fileMatch || siteMatch;
            });
        }

        if (activeTender) {
            const ts = activeTender.presentStatus;
            // Work Order Issued - is already linked with e-tender module
            if (ts === 'Work Order Issued' || ts === 'Supply Order Issued') {
                if (!watchedStartDate && activeTender.dateWorkOrder) {
                    const autoStart = calculateWorkCommencementDate(activeTender.dateWorkOrder);
                    if (autoStart) {
                        setValue('startDate', autoStart);
                        setValue('workStatus', 'Work in Progress');
                        return;
                    }
                }
                setValue('workStatus', 'Work Order Issued');
                return;
            }
            // Selection Notice Issued - is already linked with e-tender module
            if (ts === 'Selection Notice Issued') {
                setValue('workStatus', 'Selection Notice Issued');
                return;
            }
            // Tendered - is already linked with e-tender module
            if (!ts || !['Cancelled', 'Tender Cancelled', 'Retender', 'Re-tender'].includes(ts)) {
                setValue('workStatus', 'Tendered');
                return;
            }
        } else if (watchedTenderNo === 'Quotation') {
            setValue('workStatus', 'Tendered');
            return;
        } else if (watchedTenderNo && watchedTenderNo !== '_clear_' && (!allE_tenders || allE_tenders.length === 0)) {
            setValue('workStatus', 'Tendered');
            return;
        }

        // Department Rig Allotted - Rig and Site Accessibility is Accessible to Dept. Rig
        if (watchedSiteConditions === 'Accessible to Dept. Rig') {
            setValue('workStatus', 'Department Rig Allotted');
            return;
        }

        // 4. Financial & TS Readiness
        // Additional Fund Awaited - Estimate Amount (₹) is greater than Remitted Amount (₹)
        const est = Number(watchedEstimateAmount) || 0;
        const siteRem = (watchedRemittedAmount !== undefined && watchedRemittedAmount !== null && watchedRemittedAmount !== '') 
            ? Number(watchedRemittedAmount) 
            : null;
        const rem = (siteRem !== null && !isNaN(siteRem)) ? siteRem : (totalRemittedAmount || 0);

        if (workTypeContext !== 'planFund' && est > 0 && est > rem) {
            setValue('workStatus', 'Additional Fund Awaited');
            return;
        }

        // TS Pending - Only when explicitly toggled ON as Awaiting TS (and TS Amount is zero or not yet sanctioned)
        const ts = Number(watchedTsAmount) || 0;
        if (watchedIsAwaitingTS && (!ts || ts === 0)) {
            setValue('workStatus', 'TS Pending');
            return;
        }

        // 5. Baseline State (Lowest Priority)
        // Under Process - Sites having no Drilling Details (Actuals), Developing Details, Scheme Details and remaining sections
        setValue('workStatus', 'Under Process');
    }, [
        watchedCompletionDate,
        watchedStartDate,
        watchedTotalDepth,
        watchedDateOfDrilling,
        watchedDrillingConditions,
        watchedDevelopingConditions,
        watchedSchemeConditions,
        watchedSiteConditions,
        watchedEstimateAmount,
        watchedRemittedAmount,
        watchedTsAmount,
        watchedIsAwaitingTS,
        watchedTenderNo,
        totalRemittedAmount,
        allE_tenders,
        initialData,
        matchFileNo,
        workTypeContext,
        setValue
    ]);

    const rigOptions = useMemo(() => {
        const allUnits = allRigCompressors || [];
        
        // 1. Active Internal Rigs
        const activeInternal = allUnits
            .filter(r => !r.isExternal && r.status !== 'Garaged')
            .map(r => r.typeOfRigUnit || '')
            .filter(Boolean);
            
        // 2. Active External Rigs
        const activeExternal = allUnits
            .filter(r => r.isExternal && r.status !== 'Garaged')
            .map(r => `${r.typeOfRigUnit} - ${r.externalOffice || 'Unknown'}`)
            .filter(val => val && !val.startsWith('undefined'));

        // 3. Fixed Private Options
        const privateOptions = ["Private Rig - DTH", "Private Rig - Rotary", "Private Rig - Calyx"];

        // 4. Garaged Rigs (To be placed at the bottom)
        const garaged = allUnits
            .filter(r => r.status === 'Garaged')
            .map(r => {
                const base = r.isExternal 
                    ? `${r.typeOfRigUnit} - ${r.externalOffice || 'Unknown'}`
                    : (r.typeOfRigUnit || '');
                return `${base} (Garaged)`;
            })
            .filter(val => val && !val.startsWith('undefined') && val !== ' (Garaged)');

        return [
            ...Array.from(new Set(activeInternal)).sort(),
            ...Array.from(new Set(activeExternal)).sort(),
            ...privateOptions,
            ...Array.from(new Set(garaged)).sort()
        ];
    }, [allRigCompressors]);

    const handleDialogSubmit = (data: SiteDetailFormData) => {
        const v10 = parseFloat(data.casing10kgPipe || '0') || 0;
        const v8 = parseFloat(data.casing8kgPipe || '0') || 0;
        const v6 = parseFloat(data.casing6kgPipe || '0') || 0;
        const totalCasing = v10 + v8 + v6;
        const computedCasingUsed = totalCasing > 0 ? totalCasing.toString() : '';

        const finalExp = computedExpenditure !== undefined ? computedExpenditure : (data.totalExpenditure ?? initialData?.totalExpenditure ?? undefined);

        const updatedData = {
            ...data,
            casing6kgPipe: data.casing6kgPipe ?? "",
            casing8kgPipe: data.casing8kgPipe ?? "",
            casing10kgPipe: data.casing10kgPipe ?? "",
            casingPipeUsed: totalCasing > 0 ? totalCasing.toString() : "",
            totalExpenditure: finalExp,
        };
        onConfirm(updatedData);
    };

    return (
        <div className="flex flex-col h-full overflow-hidden">
            <DialogHeader className="p-6 pb-4 shrink-0 border-b">
                <DialogTitle>{initialData?.nameOfSite ? `Edit Site Details: ${initialData.nameOfSite}` : 'Add New Site'}</DialogTitle>
            </DialogHeader>
            <div className="flex-1 min-h-0">
                <ScrollArea className="h-full px-6 py-4">
                    <Form {...form}>
                        <form id="site-dialog-form" onSubmit={handleSubmit(handleDialogSubmit)} className="space-y-6">
                            <Card>
                                <CardHeader><CardTitle className="text-lg text-primary">Main Details</CardTitle></CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <FormField name="nameOfSite" control={control} render={({ field }) => <FormItem><FormLabel>Name of Site (English) <span className="text-destructive">*</span></FormLabel><FormControl><Textarea {...field} value={field.value ?? ""} placeholder="e.g. Community Borewell / Site Name" readOnly={isFieldReadOnly(false)} className="min-h-[40px]" /></FormControl><FormMessage /></FormItem>} />
                                        <FormField name="nameOfSiteMl" control={control} render={({ field }) => <FormItem><FormLabel>Name of Site (Malayalam)</FormLabel><FormControl><MalayalamInput value={field.value ?? ""} onChange={(val) => field.onChange(val)} englishValue={form.watch('nameOfSite') || ""} multiline rows={2} disabled={isFieldReadOnly(false)} /></FormControl><FormMessage /></FormItem>} />
                                        <FormField name="purpose" control={control} render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Purpose <span className="text-destructive">*</span></FormLabel>
                                                <Select onValueChange={(val) => field.onChange(val === '_clear_' ? undefined : val)} value={field.value || ""} disabled={isFieldReadOnly(false)}>
                                                    <FormControl><SelectTrigger><SelectValue placeholder="Select Purpose" /></SelectTrigger></FormControl>
                                                    <SelectContent className="max-h-80">
                                                        <SelectItem value="_clear_">-- Clear Selection --</SelectItem>
                                                        {(filteredPurposeOptions || []).map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                                                    </SelectContent>
                                                </Select>
                                                <FormMessage />
                                            </FormItem>
                                        )} />
                                        <FormField name="localSelfGovt" control={control} render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Local Self Govt. <span className="text-destructive">*</span></FormLabel>
                                                <Select onValueChange={(value) => handleLsgChange(value, field.onChange)} value={field.value || ""} disabled={isFieldReadOnly(false)}>
                                                    <FormControl><SelectTrigger><SelectValue placeholder="Select LSG"/></SelectTrigger></FormControl>
                                                    <SelectContent className="max-h-80">
                                                        <SelectItem value="_clear_" onSelect={(e) => { e.preventDefault(); field.onChange(undefined); }}>-- Clear Selection --</SelectItem>
                                                        {(sortedLsgMaps || []).map(map => <SelectItem key={map.id} value={map.name}>{map.name}</SelectItem>)}
                                                    </SelectContent>
                                                </Select>
                                                <FormMessage/>
                                            </FormItem>
                                        )} />
                                        <FormField name="constituency" control={control} render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Constituency (LAC)</FormLabel>
                                                <Select onValueChange={(val) => field.onChange(val === '_clear_' ? undefined : val)} value={field.value || ""} disabled={isConstituencyDisabled}>
                                                    <FormControl><SelectTrigger><SelectValue placeholder={!watchedLsg ? "Select LSG first" : "Select Constituency"}/></SelectTrigger></FormControl>
                                                    <SelectContent className="max-h-80">
                                                        <SelectItem value="_clear_">-- Clear Selection --</SelectItem>
                                                        {(constituencyOptionsForLsg || []).map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                                                    </SelectContent>
                                                </Select>
                                                <FormMessage/>
                                            </FormItem>
                                        )} />
                                        <FormField name="latitude" control={control} render={({ field }) => <FormItem><FormLabel>Latitude</FormLabel><FormControl><Input type="number" step="any" {...field} value={field.value ?? ""} placeholder="e.g. 8.5241" onChange={e => field.onChange(e.target.value === '' ? null : Number(e.target.value))} readOnly={isFieldReadOnly(true)} /></FormControl><FormMessage /></FormItem>} />
                                        <FormField name="longitude" control={control} render={({ field }) => <FormItem><FormLabel>Longitude</FormLabel><FormControl><Input type="number" step="any" {...field} value={field.value ?? ""} placeholder="e.g. 76.9366" onChange={e => field.onChange(e.target.value === '' ? null : Number(e.target.value))} readOnly={isFieldReadOnly(true)} /></FormControl><FormMessage /></FormItem>} />
                                    </div>
                                </CardContent>
                            </Card>

                                            {isWellPurpose && (
                                                <Card>
                                                    <CardHeader><CardTitle className="text-lg text-primary">Investigation Details (Recommended)</CardTitle></CardHeader>
                                                    <CardContent className="space-y-4">
                                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                            <FormField name="surveyRecommendedDiameter" control={control} render={({ field }) => (
                                                                <FormItem>
                                                                    <FormLabel>Diameter (mm)</FormLabel>
                                                                    <Select onValueChange={(val) => field.onChange(val === '_clear_' ? undefined : val)} value={field.value || ""} disabled={isFieldReadOnly(false)}>
                                                                        <FormControl><SelectTrigger><SelectValue placeholder="Select Diameter" /></SelectTrigger></FormControl>
                                                                        <SelectContent>
                                                                            <SelectItem value="_clear_">-- Clear Selection --</SelectItem>
                                                                            {(filteredSiteDiameterOptions || []).map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                                                                        </SelectContent>
                                                                    </Select>
                                                                    <FormMessage />
                                                                </FormItem>
                                                            )}/>
                                                            <FormField name="surveyRecommendedTD" control={control} render={({ field }) => <FormItem><FormLabel>Total Depth (m)</FormLabel><FormControl><Input {...field} value={field.value || ''} placeholder="e.g. 130.00" readOnly={isFieldReadOnly(false)}/></FormControl><FormMessage /></FormItem>} />
                                                            
                                                            {watchedPurpose === 'BWC' && (
                                                             <>
                                                                 <FormField name="surveyRecommendedOB" control={control} render={({ field }) => <FormItem><FormLabel>OB (m)</FormLabel><FormControl><Input {...field} value={field.value || ''} placeholder="e.g. 17.50" readOnly={isFieldReadOnly(false)}/></FormControl><FormMessage /></FormItem>} />
                                                                 <FormField name="surveyRecommendedCasingPipe" control={control} render={({ field }) => <FormItem><FormLabel>Casing Pipe (m)</FormLabel><FormControl><Input {...field} value={field.value || ''} placeholder="e.g. 18.00" readOnly={isFieldReadOnly(false)}/></FormControl><FormMessage /></FormItem>} />
                                                             </>
                                                          )}

                                                          {watchedPurpose === 'TWC' && (
                                                                <>
                                                                    <FormField name="surveyRecommendedPlainPipe" control={control} render={({ field }) => <FormItem><FormLabel>Plain Pipe (m)</FormLabel><FormControl><Input {...field} value={field.value || ''} placeholder="e.g. 24.00" readOnly={isFieldReadOnly(false)}/></FormControl><FormMessage /></FormItem>} />
                                                                    <FormField name="surveyRecommendedSlottedPipe" control={control} render={({ field }) => <FormItem><FormLabel>Slotted Pipe (m)</FormLabel><FormControl><Input {...field} value={field.value || ''} placeholder="e.g. 12.00" readOnly={isFieldReadOnly(false)}/></FormControl><FormMessage /></FormItem>} />
                                                                    <FormField name="surveyRecommendedMsCasingPipe" control={control} render={({ field }) => <FormItem><FormLabel>MS Casing Pipe (m)</FormLabel><FormControl><Input {...field} value={field.value || ''} placeholder="e.g. 12.00" readOnly={isFieldReadOnly(false)}/></FormControl><FormMessage /></FormItem>} />
                                                                </>
                                                            )}

                                                            {watchedPurpose === 'FPW' && (
                                                                <FormField name="casingPipeUsed" control={control} render={({ field }) => <FormItem><FormLabel>Casing Pipe (m)</FormLabel><FormControl><Input {...field} value={field.value || ''} placeholder="e.g. 15.00" readOnly={isFieldReadOnly(false)}/></FormControl><FormMessage /></FormItem>} />
                                                            )}
                                                            <FormField name="plotArea" control={control} render={({ field }) => (
                                                                <FormItem>
                                                                    <FormLabel>Plot Area (in Cents)</FormLabel>
                                                                    <FormControl>
                                                                        <Input type="number" step="any" {...field} value={field.value ?? ""} placeholder="e.g. 10.5" onChange={e => field.onChange(e.target.value === '' ? null : Number(e.target.value))} readOnly={isFieldReadOnly(false)}/>
                                                                    </FormControl>
                                                                    <FormMessage />
                                                                </FormItem>
                                                            )}/>
                                                        </div>
                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                            <FormField name="surveyLocation" control={control} render={({ field }) => (
                                                                <FormItem>
                                                                    <FormLabel>Well Location</FormLabel>
                                                                    <FormControl><Textarea {...field} value={field.value || ''} placeholder="e.g. North-East corner of the plot..." readOnly={isFieldReadOnly(false)} className="min-h-[40px]" /></FormControl>
                                                                    <FormMessage />
                                                                </FormItem>
                                                            )}/>
                                                            <FormField name="surveyRemarks" control={control} render={({ field }) => (
                                                                <FormItem>
                                                                    <FormLabel>Investigation Remarks</FormLabel>
                                                                    <FormControl><Textarea {...field} value={field.value || ''} placeholder="e.g. Recommended for 110mm borewell..." readOnly={isFieldReadOnly(false)} className="min-h-[40px]" /></FormControl>
                                                                    <FormMessage />
                                                                </FormItem>
                                                            )}/>
                                                        </div>
                                                    </CardContent>
                                                </Card>
                                            )}

                                            <Card>
                                                <CardHeader><CardTitle className="text-lg text-primary">Work Implementation</CardTitle></CardHeader>
                                                <CardContent className="space-y-4">
                                                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                                        <FormField name="siteConditions" control={control} render={({ field }) => (
                                                            <FormItem>
                                                                <FormLabel>Rig and Site Accessibility</FormLabel>
                                                                <Select onValueChange={(val) => field.onChange(val === '_clear_' ? undefined : val)} value={field.value || ""} disabled={isFieldReadOnly(false)}>
                                                                    <FormControl><SelectTrigger><SelectValue placeholder="Select Conditions" /></SelectTrigger></FormControl>
                                                                    <SelectContent>
                                                                        <SelectItem value="_clear_">-- Clear Selection --</SelectItem>
                                                                        {(siteConditionsOptions || []).map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                                                                    </SelectContent>
                                                                </Select>
                                                                <FormMessage />
                                                            </FormItem>
                                                        )}/>
                                                        <FormField name="estimateAmount" control={control} render={({ field }) => <FormItem><FormLabel>Estimate Amount (₹)</FormLabel><FormControl><Input type="number" step="any" {...field} value={field.value ?? ""} placeholder="e.g. 45000" onChange={e => field.onChange(e.target.value === '' ? null : Number(e.target.value))} readOnly={isFieldReadOnly(false)} /></FormControl><FormMessage /></FormItem>} />
                                                        <FormField name="remittedAmount" control={control} render={({ field }) => <FormItem><FormLabel>Remitted Amount (₹)</FormLabel><FormControl><Input type="number" step="any" {...field} value={field.value ?? ""} placeholder="e.g. 45000" onChange={e => field.onChange(e.target.value === '' ? null : Number(e.target.value))} readOnly={isFieldReadOnly(false)} /></FormControl><FormMessage /></FormItem>} />
                                                        <FormField 
                                                            name="tsAmount" 
                                                            control={control} 
                                                            render={({ field }) => (
                                                                <FormItem>
                                                                    <div className="flex items-center justify-between">
                                                                        <FormLabel>TS Amount (₹)</FormLabel>
                                                                        <FormField
                                                                            name="isAwaitingTS"
                                                                            control={control}
                                                                            render={({ field: switchField }) => (
                                                                                <div className="flex items-center space-x-1.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 px-2 py-0.5 rounded text-xs">
                                                                                    <span className={cn("text-[11px] font-medium select-none cursor-pointer", switchField.value ? "text-amber-800 dark:text-amber-300 font-semibold" : "text-muted-foreground")} onClick={() => !isFieldReadOnly(false) && switchField.onChange(!switchField.value)}>
                                                                                        Awaiting TS
                                                                                    </span>
                                                                                    <Switch
                                                                                        id="isAwaitingTS-toggle"
                                                                                        checked={!!switchField.value}
                                                                                        onCheckedChange={(checked) => {
                                                                                            switchField.onChange(checked);
                                                                                        }}
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
                                                                            onChange={e => {
                                                                                const val = e.target.value === '' ? null : Number(e.target.value);
                                                                                field.onChange(val);
                                                                                if (val && val > 0) {
                                                                                    setValue('isAwaitingTS', false);
                                                                                }
                                                                            }} 
                                                                            readOnly={isFieldReadOnly(false)} 
                                                                        />
                                                                    </FormControl>
                                                                    <FormMessage />
                                                                </FormItem>
                                                            )} 
                                                        />
                                                    </div>
                                                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                                        {!isPrivateWork && !isDeptRigWork && (
                                                            <>
                                                                <FormField name="tenderNo" control={control} render={({ field }) => (
                                                                    <FormItem>
                                                                        <FormLabel>Tender No.</FormLabel>
                                                                        <Select onValueChange={(val) => field.onChange(val === '_clear_' ? undefined : val)} value={field.value || ""} disabled={isTenderSelected || isFieldReadOnly(false)}>
                                                                            <FormControl><SelectTrigger className={cn((isTenderSelected || isFieldReadOnly(false)) && "bg-muted cursor-not-allowed")}><SelectValue placeholder="Select Tender or Quotation" /></SelectTrigger></FormControl>
                                                                            <SelectContent className="max-h-80">
                                                                                <SelectItem value="_clear_">-- Clear Selection --</SelectItem>
                                                                                <SelectItem value="Quotation">Quotation</SelectItem>
                                                                                {(allE_tenders || []).filter(t => t.eTenderNo).map(t => <SelectItem key={t.id} value={t.eTenderNo!}>{t.eTenderNo}</SelectItem>)}
                                                                            </SelectContent>
                                                                        </Select>
                                                                        <FormMessage />
                                                                    </FormItem>
                                                                )} />
                                                                <FormField name="quotedPercentage" control={control} render={({ field }) => (
                                                                    <FormItem>
                                                                        <FormLabel>Quoted Percentage of L1</FormLabel>
                                                                        <FormControl>
                                                                            <Input 
                                                                                type="text" 
                                                                                {...field} 
                                                                                value={field.value ?? ''} 
                                                                                readOnly={isTenderSelected || isFieldReadOnly(false)} 
                                                                                className={cn((isTenderSelected || isFieldReadOnly(false)) && "bg-muted cursor-not-allowed")} 
                                                                                placeholder="e.g. 10% Below"
                                                                            />
                                                                        </FormControl>
                                                                        <FormMessage />
                                                                    </FormItem>
                                                                )} />
                                                                <FormField name="contractorName" control={control} render={({ field }) => (
                                                                    <FormItem>
                                                                        <FormLabel>Contractor</FormLabel>
                                                                        {isQuotation ? (
                                                                            <Select 
                                                                                onValueChange={(val) => {
                                                                                    if (val === '_clear_') {
                                                                                        field.onChange('');
                                                                                    } else {
                                                                                        const bidder = allBidders?.find(b => b.name === val);
                                                                                        field.onChange(bidder ? `${bidder.name}, ${bidder.address || ''}` : val);
                                                                                    }
                                                                                }} 
                                                                                value={watchedContractorName ? watchedContractorName.split(',')[0].trim() : ""}
                                                                                disabled={isTenderSelected || isFieldReadOnly(false)}
                                                                            >
                                                                                <FormControl><SelectTrigger className={cn((isTenderSelected || isFieldReadOnly(false)) && "bg-muted cursor-not-allowed")}><SelectValue placeholder="Select Contractor" /></SelectTrigger></FormControl>
                                                                                <SelectContent className="max-h-80">
                                                                                    <SelectItem value="_clear_">-- Clear Selection --</SelectItem>
                                                                                    {(allBidders || []).filter(b => b.name).map(b => <SelectItem key={b.id} value={b.name!}>{b.name}</SelectItem>)}
                                                                                </SelectContent>
                                                                            </Select>
                                                                        ) : (
                                                                            <FormControl><Textarea {...field} value={field.value ?? ''} readOnly={isTenderSelected || isFieldReadOnly(false)} className={cn((isTenderSelected || isFieldReadOnly(false)) && "bg-muted cursor-not-allowed min-h-[40px]")} /></FormControl>
                                                                        )}
                                                                        <FormMessage />
                                                                    </FormItem>
                                                                )} />
                                                            </>
                                                        )}
                                                        <FormField name="supervisorName" control={control} render={({ field }) => (
                                                            <FormItem className={isPrivateWork || isDeptRigWork ? "md:col-span-4" : ""}>
                                                                <div className="flex justify-between items-center mb-1">
                                                                    <FormLabel>Supervisor</FormLabel>
                                                                    {(isQuotation || isPrivateWork || isDeptRigWork) && !isTenderSelected && !isFieldReadOnly(false) && (
                                                                        <Button 
                                                                            type="button" 
                                                                            variant="link" 
                                                                            className="h-auto p-0 text-[10px] font-bold text-primary" 
                                                                            onClick={() => {
                                                                                setIsManualSupervisor(!isManualSupervisor);
                                                                                if (!isManualSupervisor) {
                                                                                    setValue('supervisorUid', null);
                                                                                }
                                                                            }}
                                                                        >
                                                                            {isManualSupervisor ? "Pick from List" : "Manual Entry"}
                                                                        </Button>
                                                                    )}
                                                                </div>
                                                                {((isQuotation || isPrivateWork || isDeptRigWork) && !isManualSupervisor && !isTenderSelected) ? (
                                                                    <Select 
                                                                        onValueChange={(val) => {
                                                                            if (val === '_clear_') {
                                                                                field.onChange('');
                                                                                setValue('supervisorUid', undefined);
                                                                                setValue('supervisorDesignation', undefined);
                                                                            } else {
                                                                                const staff = supervisorListNames.find(s => s.name === val);
                                                                                if (staff) {
                                                                                    field.onChange(staff.name);
                                                                                    const linkedUser = supervisorList.find(u => u.name === staff.name);
                                                                                    setValue('supervisorUid', linkedUser?.uid || null);
                                                                                    setValue('supervisorDesignation', staff.designation);
                                                                                }
                                                                            }
                                                                        }} 
                                                                        value={watchedSupervisorName || ""}
                                                                        disabled={isTenderSelected || isFieldReadOnly(false)}
                                                                    >
                                                                        <FormControl><SelectTrigger className={cn((isTenderSelected || isFieldReadOnly(false)) && "bg-muted cursor-not-allowed")}><SelectValue placeholder="Select Supervisor" /></SelectTrigger></FormControl>
                                                                        <SelectContent className="max-h-80">
                                                                            <SelectItem value="_clear_">-- Clear Selection --</SelectItem>
                                                                            {(supervisorListNames || []).map(s => <SelectItem key={s.id} value={s.name}>{s.name} ({s.designation})</SelectItem>)}
                                                                        </SelectContent>
                                                                    </Select>
                                                                ) : (
                                                                    <FormControl>
                                                                        <Textarea 
                                                                            {...field} 
                                                                            value={field.value ?? ''} 
                                                                            readOnly={isTenderSelected || isFieldReadOnly(false)} 
                                                                            className={cn((isTenderSelected || isFieldReadOnly(false)) && "bg-muted cursor-not-allowed min-h-[40px]")} 
                                                                            placeholder={isManualSupervisor ? "Enter external staff name..." : ""}
                                                                        />
                                                                    </FormControl>
                                                                )}
                                                                <FormMessage />
                                                            </FormItem>
                                                        )}/>
                                                    </div>
                                                    <FormField name="implementationRemarks" control={control} render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel>Implementation Remarks</FormLabel>
                                                            <FormControl><Textarea {...field} value={field.value || ''} placeholder="Any specific remarks about implementation..." readOnly={isFieldReadOnly(false)} /></FormControl>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}/>
                                                </CardContent>
                                            </Card>

                                             {isWellPurpose && (
                                                <Card>
                                                    <CardHeader><CardTitle className="text-lg text-primary">Drilling Details (Actuals)</CardTitle></CardHeader>
                                                    <CardContent className="space-y-4">
                                                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                                            <FormField name="diameter" control={control} render={({ field }) => (
                                                                <FormItem>
                                                                    <FormLabel>Actual Diameter <span className="text-destructive">*</span></FormLabel>
                                                                    <Select onValueChange={(val) => field.onChange(val === '_clear_' ? undefined : val)} value={field.value || ""} disabled={isFieldReadOnly(true)}>
                                                                        <FormControl><SelectTrigger><SelectValue placeholder="Select Diameter" /></SelectTrigger></FormControl>
                                                                        <SelectContent>
                                                                            <SelectItem value="_clear_">-- Clear Selection --</SelectItem>
                                                                            {(filteredSiteDiameterOptions || []).map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                                                                        </SelectContent>
                                                                    </Select>
                                                                    <FormMessage />
                                                                </FormItem>
                                                            )}/>
                                                            <FormField name="totalDepth" control={control} render={({ field }) => <FormItem><FormLabel>Actual TD (m)</FormLabel><FormControl><Input type="number" step="any" {...field} value={field.value ?? ""} placeholder="e.g. 130.00" onChange={e => field.onChange(e.target.value === '' ? null : Number(e.target.value))} readOnly={isFieldReadOnly(true)}/></FormControl><FormMessage /></FormItem>} />
                                                                                             {watchedPurpose === 'BWC' && (
                                                                 <>
                                                                     <FormField name="surveyOB" control={control} render={({ field }) => <FormItem><FormLabel>Actual OB (m)</FormLabel><FormControl><Input {...field} value={field.value || ""} placeholder="e.g. 17.50" readOnly={isFieldReadOnly(true)}/></FormControl><FormMessage /></FormItem>} />
                                                                     <FormField name="casing10kgPipe" control={control} render={({ field }) => (
                                                                        <FormItem>
                                                                            <FormLabel>Casing 10 kg/cm² (m)</FormLabel>
                                                                            <FormControl><Input {...field} value={field.value || ""} placeholder="e.g. 0.00" readOnly={isFieldReadOnly(true)}/></FormControl>
                                                                            {casingDiameterHint && <FormDescription className="text-xs text-muted-foreground font-medium">{casingDiameterHint}</FormDescription>}
                                                                            <FormMessage />
                                                                        </FormItem>
                                                                    )} />
                                                                     <FormField name="casing8kgPipe" control={control} render={({ field }) => (
                                                                        <FormItem>
                                                                            <FormLabel>Casing 8 kg/cm² (m)</FormLabel>
                                                                            <FormControl><Input {...field} value={field.value || ""} placeholder="e.g. 0.00" readOnly={isFieldReadOnly(true)}/></FormControl>
                                                                            {casingDiameterHint && <FormDescription className="text-xs text-muted-foreground font-medium">{casingDiameterHint}</FormDescription>}
                                                                            <FormMessage />
                                                                        </FormItem>
                                                                    )} />
                                                                     <FormField name="casing6kgPipe" control={control} render={({ field }) => (
                                                                        <FormItem>
                                                                            <FormLabel>Casing 6 kg/cm² (m)</FormLabel>
                                                                            <FormControl><Input {...field} value={field.value || ""} placeholder="e.g. 18.00" readOnly={isFieldReadOnly(true)}/></FormControl>
                                                                            {casingDiameterHint && <FormDescription className="text-xs text-muted-foreground font-medium">{casingDiameterHint}</FormDescription>}
                                                                            <FormMessage />
                                                                        </FormItem>
                                                                    )} />
                                                                     <FormField name="casingPipeUsed" control={control} render={({ field }) => <FormItem><FormLabel>Total Casing Pipe (m)</FormLabel><FormControl><Input {...field} value={field.value || ""} placeholder="Auto-calculated (e.g. 18.00)" readOnly={true} className="bg-muted text-muted-foreground font-semibold" /></FormControl><FormMessage /></FormItem>} />
                                                                     <FormField name="outerCasingPipe" control={control} render={({ field }) => <FormItem><FormLabel>Outer Casing (m)</FormLabel><FormControl><Input {...field} value={field.value || ""} placeholder="e.g. 15.00" readOnly={isFieldReadOnly(true)}/></FormControl><FormMessage /></FormItem>} />
                                                                     <FormField name="outerCasingPressure" control={control} render={({ field }) => <FormItem><FormLabel>Outer Casing Pressure (kg/cm²)</FormLabel><FormControl><Input {...field} value={field.value || ""} placeholder="e.g. 6" readOnly={isFieldReadOnly(true)}/></FormControl><FormMessage /></FormItem>} />
                                                                     <FormField name="innerCasing6kgPipe" control={control} render={({ field }) => <FormItem><FormLabel>Inner Casing 6 kg/cm² (m)</FormLabel><FormControl><Input {...field} value={field.value || ""} placeholder="e.g. 12.00" readOnly={isFieldReadOnly(true)}/></FormControl><FormMessage /></FormItem>} />
                                                                     <FormField name="innerCasing4kgPipe" control={control} render={({ field }) => <FormItem><FormLabel>Inner Casing 4 kg/cm² (m)</FormLabel><FormControl><Input {...field} value={field.value || ""} placeholder="e.g. 6.00" readOnly={isFieldReadOnly(true)}/></FormControl><FormMessage /></FormItem>} />
                                                                     <FormField name="innerCasingPipe" control={control} render={({ field }) => <FormItem><FormLabel>Total Inner Casing (m)</FormLabel><FormControl><Input {...field} value={field.value || ""} placeholder="Auto-calculated (e.g. 18.00)" readOnly={true} className="bg-muted text-muted-foreground font-semibold" /></FormControl><FormMessage /></FormItem>} />
                                                                 </>
                                                            )}

                                                            {watchedPurpose === 'TWC' && (
                                                                <>
                                                                    <FormField name="pilotDrillingDepth" control={control} render={({ field }) => <FormItem><FormLabel>Pilot Drilling (m)</FormLabel><FormControl><Input {...field} value={field.value || ''} placeholder="e.g. 50.00" readOnly={isFieldReadOnly(true)}/></FormControl><FormMessage /></FormItem>} />
                                                                    <FormField name="reaming12InchBit" control={control} render={({ field }) => <FormItem><FormLabel>Reaming 12&quot; Bit (m)</FormLabel><FormControl><Input {...field} value={field.value || ''} placeholder="e.g. 20.00" readOnly={isFieldReadOnly(true)}/></FormControl><FormMessage /></FormItem>} />
                                                                    <FormField name="reaming16InchBit" control={control} render={({ field }) => <FormItem><FormLabel>Reaming 16&quot; Bit (m)</FormLabel><FormControl><Input {...field} value={field.value || ''} placeholder="e.g. 20.00" readOnly={isFieldReadOnly(true)}/></FormControl><FormMessage /></FormItem>} />
                                                                    <FormField name="reaming22InchBit" control={control} render={({ field }) => <FormItem><FormLabel>Reaming 22&quot; Bit (m)</FormLabel><FormControl><Input {...field} value={field.value || ''} placeholder="e.g. 20.00" readOnly={isFieldReadOnly(true)}/></FormControl><FormMessage /></FormItem>} />
                                                                    <FormField name="outerCasingPipe" control={control} render={({ field }) => <FormItem><FormLabel>18&quot; MS Casing Pipe (m)</FormLabel><FormControl><Input {...field} value={field.value || ''} placeholder="e.g. 12.00" readOnly={isFieldReadOnly(true)}/></FormControl><FormMessage /></FormItem>} />
                                                                    <FormField name="surveyPlainPipe" control={control} render={({ field }) => <FormItem><FormLabel>{twcPlainPipeLabel}</FormLabel><FormControl><Input {...field} value={field.value || ''} placeholder="e.g. 30.00" readOnly={isFieldReadOnly(true)}/></FormControl><FormMessage /></FormItem>} />
                                                                    <FormField name="surveySlottedPipe" control={control} render={({ field }) => <FormItem><FormLabel>{twcRibbedPipeLabel}</FormLabel><FormControl><Input {...field} value={field.value || ''} placeholder="e.g. 18.00" readOnly={isFieldReadOnly(true)}/></FormControl><FormMessage /></FormItem>} />
                                                                    <FormField name="bailPlug" control={control} render={({ field }) => <FormItem><FormLabel>{twcBailPlugLabel}</FormLabel><FormControl><Input {...field} value={field.value || ''} placeholder="e.g. 1 No. (0.5m)" readOnly={isFieldReadOnly(true)}/></FormControl><FormMessage /></FormItem>} />
                                                                </>
                                                            )}

                                                            {watchedPurpose === 'FPW' && (
                                                                <FormField name="casingPipeUsed" control={control} render={({ field }) => <FormItem><FormLabel>Casing Pipe (m)</FormLabel><FormControl><Input {...field} value={field.value || ''} placeholder="e.g. 15.00" readOnly={isFieldReadOnly(true)}/></FormControl><FormMessage /></FormItem>} />
                                                            )}

                                                            <FormField name="yieldDischarge" control={control} render={({ field }) => <FormItem><FormLabel>Yield (LPH)</FormLabel><FormControl><Input {...field} value={field.value || ''} placeholder="e.g. 5000" readOnly={isFieldReadOnly(true)}/></FormControl><FormMessage /></FormItem>} />
                                                            <FormField name="yieldCategory" control={control} render={({ field }) => (
                                                                <FormItem>
                                                                    <FormLabel>Yield Category</FormLabel>
                                                                    <Select onValueChange={(val) => field.onChange(val === '_clear_' ? undefined : val)} value={field.value || ""} disabled={isFieldReadOnly(true)}>
                                                                        <FormControl><SelectTrigger><SelectValue placeholder="Select Category" /></SelectTrigger></FormControl>
                                                                        <SelectContent>
                                                                            <SelectItem value="_clear_">-- Clear Selection --</SelectItem>
                                                                            {yieldCategoryOptions.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
                                                                        </SelectContent>
                                                                    </Select>
                                                                    <FormMessage />
                                                                </FormItem>
                                                            )}/>
                                                            <FormField name="zoneDetails" control={control} render={({ field }) => <FormItem><FormLabel>Zone Details (m)</FormLabel><FormControl><Input {...field} value={field.value || ''} placeholder={watchedPurpose === 'TWC' ? "e.g. 45 - 52, 78 - 85" : "e.g. 45 , 78, 85"} readOnly={isFieldReadOnly(true)}/></FormControl><FormMessage /></FormItem>} />
                                                            <FormField name="waterLevel" control={control} render={({ field }) => <FormItem><FormLabel>Static Water (m)</FormLabel><FormControl><Input {...field} value={field.value || ''} placeholder="e.g. 12.50" readOnly={isFieldReadOnly(true)}/></FormControl><FormMessage /></FormItem>} />
                                                            <FormField name="endCap" control={control} render={({ field }) => (
                                                                <FormItem>
                                                                    <FormLabel>End Cap</FormLabel>
                                                                    <Select onValueChange={(val) => field.onChange(val === '_clear_' ? undefined : val)} value={field.value || ""} disabled={isFieldReadOnly(true)}>
                                                                        <FormControl><SelectTrigger><SelectValue placeholder="Select End Cap" /></SelectTrigger></FormControl>
                                                                        <SelectContent>
                                                                            <SelectItem value="_clear_">-- Clear Selection --</SelectItem>
                                                                            <SelectItem value="Yes">Yes</SelectItem>
                                                                            <SelectItem value="No">No</SelectItem>
                                                                        </SelectContent>
                                                                    </Select>
                                                                    {endCapHint && <FormDescription className="text-xs text-muted-foreground font-medium">{endCapHint}</FormDescription>}
                                                                    <FormMessage />
                                                                </FormItem>
                                                            )}/>
                                                            
                                                            <FormField name="typeOfRig" control={control} render={({ field }) => (
                                                                <FormItem>
                                                                    <FormLabel>Type of Rig</FormLabel>
                                                                    <Select onValueChange={(val) => field.onChange(val === '_clear_' ? undefined : val)} value={field.value || ""} disabled={isFieldReadOnly(true)}>
                                                                        <FormControl><SelectTrigger><SelectValue placeholder="Select Rig" /></SelectTrigger></FormControl>
                                                                        <SelectContent>
                                                                            <SelectItem value="_clear_">-- Clear Selection --</SelectItem>
                                                                            {(rigOptions || []).map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                                                                        </SelectContent>
                                                                    </Select>
                                                                    <FormMessage />
                                                                </FormItem>
                                                            )}/>
                                                            <FormField name="drillingConditions" control={control} render={({ field }) => (
                                                                <FormItem>
                                                                    <FormLabel>Drilling Conditions</FormLabel>
                                                                    <Select onValueChange={(val) => field.onChange(val === '_clear_' ? undefined : val)} value={field.value || ""} disabled={isFieldReadOnly(true)}>
                                                                        <FormControl><SelectTrigger><SelectValue placeholder="Select Drilling Conditions" /></SelectTrigger></FormControl>
                                                                        <SelectContent>
                                                                            <SelectItem value="_clear_">-- Clear Selection --</SelectItem>
                                                                            {(drillingConditionsOptions || []).map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                                                                        </SelectContent>
                                                                    </Select>
                                                                    <FormMessage />
                                                                </FormItem>
                                                            )}/>
                                                            {watchedPurpose === 'TWC' && (
                                                                <FormField name="geophysicalLogging" control={control} render={({ field }) => (
                                                                    <FormItem>
                                                                        <FormLabel>Geophysical Logging</FormLabel>
                                                                        <Select onValueChange={(val) => field.onChange(val === '_clear_' ? undefined : val)} value={field.value || ""} disabled={isFieldReadOnly(true)}>
                                                                            <FormControl><SelectTrigger><SelectValue placeholder="Select Geophysical Logging" /></SelectTrigger></FormControl>
                                                                            <SelectContent>
                                                                                <SelectItem value="_clear_">-- Clear Selection --</SelectItem>
                                                                                <SelectItem value="Yes">Yes</SelectItem>
                                                                                <SelectItem value="No">No</SelectItem>
                                                                            </SelectContent>
                                                                        </Select>
                                                                        <FormMessage />
                                                                    </FormItem>
                                                                )}/>
                                                            )}
                                                        </div>
                                                        <FormField name="drillingRemarks" control={control} render={({ field }) => (
                                                            <FormItem>
                                                                <FormLabel>Drilling Remarks</FormLabel>
                                                                <FormControl><Textarea {...field} value={field.value || ''} placeholder="Any specific remarks about drilling actuals..." readOnly={isFieldReadOnly(true)} className="min-h-[40px]" /></FormControl>
                                                                <FormMessage />
                                                            </FormItem>
                                                        )}/>
                                                    </CardContent>
                                                </Card>
                                            )}

                                            {isDevPurpose && (
                                                <Card>
                                                    <CardHeader><CardTitle className="text-lg text-primary">Developing Details</CardTitle></CardHeader>
                                                    <CardContent className="space-y-4">
                                                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                                            <FormField name="diameter" control={control} render={({ field }) => (
                                                                <FormItem>
                                                                    <FormLabel>Actual Diameter <span className="text-destructive">*</span></FormLabel>
                                                                    <Select onValueChange={(val) => field.onChange(val === '_clear_' ? undefined : val)} value={field.value || ""} disabled={isFieldReadOnly(true)}>
                                                                        <FormControl><SelectTrigger><SelectValue placeholder="Select Diameter" /></SelectTrigger></FormControl>
                                                                        <SelectContent>
                                                                            <SelectItem value="_clear_">-- Clear Selection --</SelectItem>
                                                                            {(filteredSiteDiameterOptions || []).map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                                                                        </SelectContent>
                                                                    </Select>
                                                                    <FormMessage />
                                                                </FormItem>
                                                            )}/>
                                                            <FormField name="totalDepth" control={control} render={({ field }) => <FormItem><FormLabel>Actual TD (m)</FormLabel><FormControl><Input type="number" step="any" {...field} value={field.value ?? ""} placeholder="e.g. 130.00" onChange={e => field.onChange(e.target.value === '' ? null : Number(e.target.value))} readOnly={isFieldReadOnly(true)}/></FormControl><FormMessage /></FormItem>} />
                                                            <FormField name="yieldDischarge" control={control} render={({ field }) => <FormItem><FormLabel>Discharge (LPH)</FormLabel><FormControl><Input {...field} value={field.value || ''} placeholder="e.g. 5000" readOnly={isFieldReadOnly(true)}/></FormControl><FormMessage /></FormItem>} />
                                                            <FormField name="yieldCategory" control={control} render={({ field }) => (
                                                                <FormItem>
                                                                    <FormLabel>Discharge Category</FormLabel>
                                                                    <Select onValueChange={(val) => field.onChange(val === '_clear_' ? undefined : val)} value={field.value || ""} disabled={isFieldReadOnly(true)}>
                                                                        <FormControl><SelectTrigger><SelectValue placeholder="Select Category" /></SelectTrigger></FormControl>
                                                                        <SelectContent>
                                                                            <SelectItem value="_clear_">-- Clear Selection --</SelectItem>
                                                                            {yieldCategoryOptions.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
                                                                        </SelectContent>
                                                                    </Select>
                                                                    <FormMessage />
                                                                </FormItem>
                                                            )}/>
                                                            <FormField name="waterLevel" control={control} render={({ field }) => <FormItem><FormLabel>Static Water (m)</FormLabel><FormControl><Input {...field} value={field.value || ''} placeholder="e.g. 12.50" readOnly={isFieldReadOnly(true)}/></FormControl><FormMessage /></FormItem>} />
                                                            <FormField name="endCap" control={control} render={({ field }) => (
                                                                <FormItem>
                                                                    <FormLabel>End Cap</FormLabel>
                                                                    <Select onValueChange={(val) => field.onChange(val === '_clear_' ? undefined : val)} value={field.value || ""} disabled={isFieldReadOnly(true)}>
                                                                        <FormControl><SelectTrigger><SelectValue placeholder="Select End Cap" /></SelectTrigger></FormControl>
                                                                        <SelectContent>
                                                                            <SelectItem value="_clear_">-- Clear Selection --</SelectItem>
                                                                            <SelectItem value="Yes">Yes</SelectItem>
                                                                            <SelectItem value="No">No</SelectItem>
                                                                        </SelectContent>
                                                                    </Select>
                                                                    {endCapHint && <FormDescription className="text-xs text-muted-foreground font-medium">{endCapHint}</FormDescription>}
                                                                    <FormMessage />
                                                                </FormItem>
                                                            )}/>
                                                            <FormField name="developingConditions" control={control} render={({ field }) => (
                                                                <FormItem>
                                                                    <FormLabel>Developing Conditions</FormLabel>
                                                                    <Select onValueChange={(val) => field.onChange(val === '_clear_' ? undefined : val)} value={field.value || ""} disabled={isFieldReadOnly(true)}>
                                                                        <FormControl><SelectTrigger><SelectValue placeholder="Select Developing Conditions" /></SelectTrigger></FormControl>
                                                                        <SelectContent>
                                                                            <SelectItem value="_clear_">-- Clear Selection --</SelectItem>
                                                                            {(developingConditionsOptions || []).map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                                                                        </SelectContent>
                                                                    </Select>
                                                                    <FormMessage />
                                                                </FormItem>
                                                            )}/>
                                                        </div>
                                                        <FormField name="developingRemarks" control={control} render={({ field }) => (
                                                            <FormItem>
                                                                <FormLabel>Developing Remarks</FormLabel>
                                                                <FormControl><Textarea {...field} value={field.value || ''} placeholder="Any specific remarks about developing..." readOnly={isFieldReadOnly(true)} className="min-h-[40px]" /></FormControl>
                                                                <FormMessage />
                                                            </FormItem>
                                                        )}/>
                                                    </CardContent>
                                                </Card>
                                            )}

                                            {isMWSSPurpose && (
                                                <Card>
                                                    <CardHeader><CardTitle className="text-lg text-primary">Scheme Details</CardTitle></CardHeader>
                                                    <CardContent className="space-y-4">
                                                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                                            <FormField name="yieldDischarge" control={control} render={({ field }) => <FormItem><FormLabel>Well Discharge (LPH)</FormLabel><FormControl><Input {...field} value={field.value || ''} placeholder="e.g. 5000" readOnly={isFieldReadOnly(true)}/></FormControl><FormMessage /></FormItem>} />
                                                            <FormField name="pumpDetails" control={control} render={({ field }) => <FormItem><FormLabel>Pump Details</FormLabel><FormControl><Input {...field} value={field.value || ''} placeholder="e.g. 5 HP Submersible Pump" readOnly={isFieldReadOnly(true)}/></FormControl><FormMessage /></FormItem>} />
                                                            <FormField name="pumpingLineLength" control={control} render={({ field }) => <FormItem><FormLabel>Pumping Line (m)</FormLabel><FormControl><Input {...field} value={field.value || ''} placeholder="e.g. 25.00" readOnly={isFieldReadOnly(true)}/></FormControl><FormMessage /></FormItem>} />
                                                            <FormField name="deliveryLineLength" control={control} render={({ field }) => <FormItem><FormLabel>Delivery Line (m)</FormLabel><FormControl><Input {...field} value={field.value || ''} placeholder="e.g. 50.00" readOnly={isFieldReadOnly(true)}/></FormControl><FormMessage /></FormItem>} />
                                                            <FormField name="waterTankCapacity" control={control} render={({ field }) => <FormItem><FormLabel>Tank Capacity (L)</FormLabel><FormControl><Input {...field} value={field.value || ''} placeholder="e.g. 5000" readOnly={isFieldReadOnly(true)}/></FormControl><FormMessage /></FormItem>} />
                                                            <FormField name="noOfTapConnections" control={control} render={({ field }) => <FormItem><FormLabel># Taps</FormLabel><FormControl><Input type="number" {...field} value={field.value ?? ""} placeholder="e.g. 12" onChange={e => field.onChange(e.target.value === '' ? null : Number(e.target.value))} readOnly={isFieldReadOnly(true)} /></FormControl><FormMessage /></FormItem>} />
                                                            <FormField name="noOfBeneficiary" control={control} render={({ field }) => <FormItem><FormLabel># Beneficiaries</FormLabel><FormControl><Input {...field} value={field.value || ''} placeholder="e.g. 45" readOnly={isFieldReadOnly(true)} /></FormControl><FormMessage /></FormItem>} />
                                                            <FormField name="schemeConditions" control={control} render={({ field }) => (
                                                                <FormItem>
                                                                    <FormLabel>Scheme Conditions</FormLabel>
                                                                    <Select onValueChange={(val) => field.onChange(val === '_clear_' ? undefined : val)} value={field.value || ""} disabled={isFieldReadOnly(true)}>
                                                                        <FormControl><SelectTrigger><SelectValue placeholder="Select Scheme Conditions" /></SelectTrigger></FormControl>
                                                                        <SelectContent>
                                                                            <SelectItem value="_clear_">-- Clear Selection --</SelectItem>
                                                                            {(schemeConditionsOptions || []).map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                                                                        </SelectContent>
                                                                    </Select>
                                                                    <FormMessage />
                                                                </FormItem>
                                                            )}/>
                                                        </div>
                                                        <FormField name="schemeRemarks" control={control} render={({ field }) => (
                                                            <FormItem>
                                                                <FormLabel>Scheme Remarks</FormLabel>
                                                                <FormControl><Textarea {...field} value={field.value || ''} placeholder="Any specific remarks about the scheme..." readOnly={isFieldReadOnly(true)} className="min-h-[40px]" /></FormControl>
                                                                <FormMessage />
                                                            </FormItem>
                                                        )}/>
                                                    </CardContent>
                                                </Card>
                                            )}

                                            {isHPSPurpose && (
                                                <Card>
                                                    <CardHeader><CardTitle className="text-lg text-primary">Scheme Details</CardTitle></CardHeader>
                                                    <CardContent className="space-y-4">
                                                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                                            <FormField name="totalDepth" control={control} render={({ field }) => <FormItem><FormLabel>Depth Erected (m)</FormLabel><FormControl><Input type="number" step="any" {...field} value={field.value ?? ""} placeholder="e.g. 35.00" onChange={e => field.onChange(e.target.value === '' ? null : Number(e.target.value))} readOnly={isFieldReadOnly(true)}/></FormControl><FormMessage /></FormItem>} />
                                                            <FormField name="waterLevel" control={control} render={({ field }) => <FormItem><FormLabel>Water Level (m)</FormLabel><FormControl><Input {...field} value={field.value || ''} placeholder="e.g. 12.50" readOnly={isFieldReadOnly(true)}/></FormControl><FormMessage /></FormItem>} />
                                                            <FormField name="noOfBeneficiary" control={control} render={({ field }) => <FormItem><FormLabel># Beneficiaries</FormLabel><FormControl><Input {...field} value={field.value || ''} placeholder="e.g. 45" readOnly={isFieldReadOnly(true)} /></FormControl><FormMessage /></FormItem>} />
                                                            <FormField name="schemeConditions" control={control} render={({ field }) => (
                                                                <FormItem>
                                                                    <FormLabel>Scheme Conditions</FormLabel>
                                                                    <Select onValueChange={(val) => field.onChange(val === '_clear_' ? undefined : val)} value={field.value || ""} disabled={isFieldReadOnly(true)}>
                                                                        <FormControl><SelectTrigger><SelectValue placeholder="Select Scheme Conditions" /></SelectTrigger></FormControl>
                                                                        <SelectContent>
                                                                            <SelectItem value="_clear_">-- Clear Selection --</SelectItem>
                                                                            {(schemeConditionsOptions || []).map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                                                                        </SelectContent>
                                                                    </Select>
                                                                    <FormMessage />
                                                                </FormItem>
                                                            )}/>
                                                        </div>
                                                        <FormField name="schemeRemarks" control={control} render={({ field }) => (
                                                            <FormItem>
                                                                <FormLabel>Scheme Remarks</FormLabel>
                                                                <FormControl><Textarea {...field} value={field.value || ''} placeholder="Any specific remarks about the scheme..." readOnly={isFieldReadOnly(true)} className="min-h-[40px]" /></FormControl>
                                                                <FormMessage />
                                                            </FormItem>
                                                        )}/>
                                                    </CardContent>
                                                </Card>
                                            )}

                                            {isARSPurpose && (
                                                <Card>
                                                    <CardHeader><CardTitle className="text-lg text-primary">Scheme Details</CardTitle></CardHeader>
                                                    <CardContent className="space-y-4">
                                                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                                            <FormField name="arsNumberOfStructures" control={control} render={({ field }) => <FormItem><FormLabel>Number of Structures</FormLabel><FormControl><Input type="number" {...field} value={field.value ?? ""} placeholder="e.g. 2" onChange={e => field.onChange(e.target.value === '' ? null : Number(e.target.value))} readOnly={isFieldReadOnly(true)}/></FormControl><FormMessage /></FormItem>} />
                                                            <FormField name="arsStorageCapacity" control={control} render={({ field }) => <FormItem><FormLabel>Storage Capacity (m³)</FormLabel><FormControl><Input type="number" {...field} value={field.value ?? ""} placeholder="e.g. 250" onChange={e => field.onChange(e.target.value === '' ? null : Number(e.target.value))} readOnly={isFieldReadOnly(true)}/></FormControl><FormMessage /></FormItem>} />
                                                            <FormField name="arsNumberOfFillings" control={control} render={({ field }) => <FormItem><FormLabel>Number of Fillings</FormLabel><FormControl><Input type="number" {...field} value={field.value ?? ""} placeholder="e.g. 4" onChange={e => field.onChange(e.target.value === '' ? null : Number(e.target.value))} readOnly={isFieldReadOnly(true)} /></FormControl><FormMessage /></FormItem>} />
                                                            <FormField name="noOfBeneficiary" control={control} render={({ field }) => <FormItem><FormLabel># Beneficiaries</FormLabel><FormControl><Input {...field} value={field.value || ''} placeholder="e.g. 45" readOnly={isFieldReadOnly(true)} /></FormControl><FormMessage /></FormItem>} />
                                                            <FormField name="schemeConditions" control={control} render={({ field }) => (
                                                                <FormItem>
                                                                    <FormLabel>Scheme Conditions</FormLabel>
                                                                    <Select onValueChange={(val) => field.onChange(val === '_clear_' ? undefined : val)} value={field.value || ""} disabled={isFieldReadOnly(true)}>
                                                                        <FormControl><SelectTrigger><SelectValue placeholder="Select Scheme Conditions" /></SelectTrigger></FormControl>
                                                                        <SelectContent>
                                                                            <SelectItem value="_clear_">-- Clear Selection --</SelectItem>
                                                                            {(schemeConditionsOptions || []).map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                                                                        </SelectContent>
                                                                    </Select>
                                                                    <FormMessage />
                                                                </FormItem>
                                                            )}/>
                                                        </div>
                                                        <FormField name="schemeRemarks" control={control} render={({ field }) => (
                                                            <FormItem>
                                                                <FormLabel>Scheme Remarks</FormLabel>
                                                                <FormControl><Textarea {...field} value={field.value || ''} placeholder="Any specific remarks about the ARS scheme..." readOnly={isFieldReadOnly(true)} className="min-h-[40px]" /></FormControl>
                                                                <FormMessage />
                                                            </FormItem>
                                                        )}/>
                                                    </CardContent>
                                                </Card>
                                            )}

                                            <Card>
                                                <CardHeader><CardTitle className="text-lg text-primary">Work Status</CardTitle></CardHeader>
                                                <CardContent className="space-y-4">
                                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                        <FormField name="workStatus" control={control} render={({ field }) => (
                                                            <FormItem>
                                                                <FormLabel>Work Status <span className="text-muted-foreground font-normal text-xs">(Auto-populated)</span></FormLabel>
                                                                <FormControl>
                                                                    <Input 
                                                                        type="text" 
                                                                        {...field} 
                                                                        value={field.value || "Under Process"} 
                                                                        readOnly 
                                                                        disabled 
                                                                        className="bg-muted/60 font-semibold cursor-not-allowed text-foreground"
                                                                    />
                                                                </FormControl>
                                                                <p className="text-[11px] text-muted-foreground mt-0.5">Auto-computed from conditions, dates, and tender status</p>
                                                                <FormMessage />
                                                            </FormItem>
                                                        )} />
                                                        <FormField name="startDate" control={control} render={({ field }) => (
                                                            <FormItem>
                                                                <FormLabel>Start Date</FormLabel>
                                                                <FormControl><Input type="date" {...field} value={field.value || ''} readOnly={isFieldReadOnly(true)} /></FormControl>
                                                                <p className="text-[11px] text-muted-foreground mt-0.5">Defaults to 4th day after Work Order Date (skipping Sundays & Public Holidays)</p>
                                                                <FormMessage />
                                                            </FormItem>
                                                        )} />
                                                        <FormField name="dateOfCompletion" control={control} render={({ field }) => <FormItem><FormLabel>Completion Date {isCompletionDateRequired && <span className="text-destructive">*</span>}</FormLabel><FormControl><Input type="date" {...field} value={field.value || ''} readOnly={isFieldReadOnly(true)} /></FormControl><FormMessage /></FormItem>} />
                                                        <FormField name="totalExpenditure" control={control} render={({ field }) => (
                                                            <FormItem>
                                                                <FormLabel>Total Expenditure (₹)</FormLabel>
                                                                <FormControl>
                                                                    <Input 
                                                                        type="text" 
                                                                        {...field} 
                                                                        value={field.value !== undefined && field.value !== null && (field.value as any) !== '' ? `₹${Number(field.value).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '₹0.00'} 
                                                                        readOnly 
                                                                        disabled 
                                                                        className="bg-muted/60 font-semibold cursor-not-allowed text-foreground"
                                                                    />
                                                                </FormControl>
                                                                <p className="text-[11px] text-muted-foreground mt-0.5">Auto-computed from Payment Details</p>
                                                                <FormMessage />
                                                            </FormItem>
                                                        )} />
                                                        {isPrivateIrrigation && (
                                                            <FormField name="subsidyAmount" control={control} render={({ field }) => (
                                                                <FormItem>
                                                                    <FormLabel>Subsidy Amount (₹)</FormLabel>
                                                                    <FormControl>
                                                                        <Input type="number" step="any" {...field} value={field.value ?? ""} placeholder="e.g. 15000" onChange={e => field.onChange(e.target.value === '' ? null : Number(e.target.value))} readOnly={isFieldReadOnly(true)} />
                                                                    </FormControl>
                                                                    <FormMessage />
                                                                </FormItem>
                                                            )} />
                                                        )}
                                                        <FormField name="workRemarks" control={control} render={({ field }) => (
                                                            <FormItem className="md:col-span-3">
                                                                <FormLabel>Work Remarks</FormLabel>
                                                                <FormControl><Textarea {...field} value={field.value ?? ""} placeholder="Add any final remarks about the work status..." readOnly={isFieldReadOnly(true)} /></FormControl>
                                                                <FormMessage />
                                                            </FormItem>
                                                        )} />
                                                    </div>
                                                </CardContent>
                                            </Card>

                                            <Card>
                                                <CardHeader><CardTitle className="text-lg text-primary">Media Gallery</CardTitle></CardHeader>
                                                <CardContent className="space-y-6">
                                                    <MediaManager
                                                        title="Work Images"
                                                        type="image"
                                                        fields={imageFields}
                                                        append={appendImage}
                                                        remove={removeImage}
                                                        update={updateImage}
                                                        isReadOnly={isFieldReadOnly(true)}
                                                        officeLocation={(initialData as any)?.officeLocation || (initialData as any)?.district}
                                                        fileNo={initialData?.fileNo || (initialData as any)?.currentFileNo}
                                                        siteName={form.watch('nameOfSite') || initialData?.nameOfSite}
                                                    />
                                                    <Separator />
                                                    <MediaManager
                                                        title="Work Videos"
                                                        type="video"
                                                        fields={videoFields}
                                                        append={appendVideo}
                                                        remove={removeVideo}
                                                        update={updateVideo}
                                                        isReadOnly={isFieldReadOnly(true)}
                                                        officeLocation={(initialData as any)?.officeLocation || (initialData as any)?.district}
                                                        fileNo={initialData?.fileNo || (initialData as any)?.currentFileNo}
                                                        siteName={form.watch('nameOfSite') || initialData?.nameOfSite}
                                                    />
                                                </CardContent>
                                            </Card>
                        </form>
                    </Form>
                </ScrollArea>
            </div>
            <div className="flex justify-end p-6 pt-4 shrink-0 border-t gap-2">
                <Button variant="outline" type="button" onClick={onCancel}>{isReadOnly ? 'Close' : 'Cancel'}</Button>
                {!isReadOnly && <Button type="submit" form="site-dialog-form">Save Changes</Button>}
            </div>
        </div>
    );
}
