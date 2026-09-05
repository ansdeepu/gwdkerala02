
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
  yieldCategoryOptions,
  type Constituency,
  type StaffMember,
  type Bidder,
  designationOptions,
  type RigCompressor
} from '@/lib/schemas';
import type { E_tender } from '@/hooks/useE_tenders';
import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format, isValid, parseISO } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DialogHeader, DialogTitle } from "@/components/ui/dialog";
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
  "Technical Sanction",
  "Refund Pending",
  "Department Rig Allotted",
  "Tendered",
  "Tender Process",
  "Selection Notice Issued",
  "Work Order Issued",
  "Work in Progress",
  "Work Failed",
  "Work Cancelled",
  "Work Completed",
  "File Under Process",
  "Pending"
] as const;

export default function SiteDialogContent({ initialData, onConfirm, onCancel, isReadOnly, isSupervisor, supervisorList, allLsgConstituencyMaps, allE_tenders, allStaffMembers, allBidders, allRigCompressors, workTypeContext, applicationType, paymentDetails }: {
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
}) {
    const hasExplicitCasing6kg = initialData?.casing6kgPipe !== undefined && initialData?.casing6kgPipe !== null;
    const hasExplicitCasing8kg = initialData?.casing8kgPipe !== undefined && initialData?.casing8kgPipe !== null;
    const hasExplicitCasing10kg = initialData?.casing10kgPipe !== undefined && initialData?.casing10kgPipe !== null;
    const fallbackCasing = (!hasExplicitCasing6kg && !hasExplicitCasing8kg && !hasExplicitCasing10kg)
        ? (initialData?.casingPipeUsed || initialData?.surveyRecommendedCasingPipe || "")
        : "";
    const initialCasing6kg = hasExplicitCasing6kg ? initialData.casing6kgPipe : fallbackCasing;
    const initialObValue = (initialData?.surveyOB !== undefined && initialData?.surveyOB !== null)
        ? String(initialData.surveyOB)
        : (initialData?.surveyRecommendedOB ? String(initialData.surveyRecommendedOB) : "");

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

    const form = useForm<SiteDetailFormData>({
        resolver: zodResolver(SiteDetailSchema),
        defaultValues: {
            ...initialData,
            totalExpenditure: computedExpenditure !== undefined ? computedExpenditure : (initialData?.totalExpenditure ?? undefined),
            casing6kgPipe: initialCasing6kg ?? "",
            casing8kgPipe: initialData?.casing8kgPipe ?? "",
            casing10kgPipe: initialData?.casing10kgPipe ?? "",
            casingPipeUsed: initialData?.casingPipeUsed ?? fallbackCasing,
            surveyRecommendedCasingPipe: initialData?.surveyRecommendedCasingPipe ?? "",
            surveyOB: initialObValue,
            surveyRecommendedOB: initialData?.surveyRecommendedOB ?? "",
            dateOfCompletion: formatDateForInput(initialData?.dateOfCompletion),
            arsSanctionedDate: formatDateForInput(initialData?.arsSanctionedDate),
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

    const isTenderSelected = !!(watchedTenderNo && watchedTenderNo !== 'Quotation' && watchedTenderNo !== '_clear_');
    const prevTenderNoRef = useRef<any>(initialData?.tenderNo);

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

                // Sync Work Status according to e-Tender progress
                const ts = selectedTender.presentStatus;
                let targetStatus = "Tendered";
                if (ts === "Work Order Issued" || ts === "Supply Order Issued") {
                    targetStatus = "Work Order Issued";
                } else if (ts === "Selection Notice Issued") {
                    targetStatus = "Selection Notice Issued";
                } else if (ts === "Tender Cancelled" || ts === "Cancelled" || ts === "Retender" || ts === "Re-tender") {
                    targetStatus = "Under Process";
                }
                
                const currentWS = getValues('workStatus');
                if (!currentWS || currentWS === '' || currentWS === 'Under Process' || currentWS === 'Tender Process' || ['Tendered', 'Selection Notice Issued', 'Work Order Issued'].includes(currentWS)) {
                    setValue('workStatus', targetStatus as any);
                }
            }
        } else if (watchedTenderNo === '_clear_') {
            if (!isPrivateWork && !isDeptRigWork) {
                setValue('contractorName', '');
                setValue('supervisorName', '');
                setValue('supervisorUid', undefined);
                setValue('quotedPercentage', '');
            }
        }

        // If workStatus is empty/unassigned, default to 'Under Process'
        if (!getValues('workStatus')) {
            setValue('workStatus', 'Under Process' as any);
        }

        prevTenderNoRef.current = watchedTenderNo;
    }, [watchedTenderNo, isTenderSelected, isQuotation, allE_tenders, allStaffMembers, setValue, getValues, isPrivateWork, isDeptRigWork]);

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
                                                        <FormField name="tsAmount" control={control} render={({ field }) => <FormItem><FormLabel>TS Amount (₹)</FormLabel><FormControl><Input type="number" step="any" {...field} value={field.value ?? ""} placeholder="e.g. 45000" onChange={e => field.onChange(e.target.value === '' ? null : Number(e.target.value))} readOnly={isFieldReadOnly(false)} /></FormControl><FormMessage /></FormItem>} />
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
                                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                            <FormField name="totalDepth" control={control} render={({ field }) => <FormItem><FormLabel>Depth Erected (m)</FormLabel><FormControl><Input type="number" step="any" {...field} value={field.value ?? ""} placeholder="e.g. 35.00" onChange={e => field.onChange(e.target.value === '' ? null : Number(e.target.value))} readOnly={isFieldReadOnly(true)}/></FormControl><FormMessage /></FormItem>} />
                                                            <FormField name="waterLevel" control={control} render={({ field }) => <FormItem><FormLabel>Water Level (m)</FormLabel><FormControl><Input {...field} value={field.value || ''} placeholder="e.g. 12.50" readOnly={isFieldReadOnly(true)}/></FormControl><FormMessage /></FormItem>} />
                                                            <FormField name="noOfBeneficiary" control={control} render={({ field }) => <FormItem><FormLabel># Beneficiaries</FormLabel><FormControl><Input {...field} value={field.value || ''} placeholder="e.g. 45" readOnly={isFieldReadOnly(true)} /></FormControl><FormMessage /></FormItem>} />
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
                                                                <FormLabel>Work Status <span className="text-destructive">*</span></FormLabel>
                                                                <Select onValueChange={(val) => field.onChange(val === '_clear_' ? undefined : val)} value={field.value || "Under Process"} disabled={isFieldReadOnly(true)}>
                                                                    <FormControl><SelectTrigger><SelectValue placeholder="Select Status" /></SelectTrigger></FormControl>
                                                                    <SelectContent className="max-h-80">
                                                                        <SelectItem value="_clear_">-- Clear Selection --</SelectItem>
                                                                        {Array.from(new Set([
                                                                            ...(field.value && !(SITE_DIALOG_WORK_STATUS_OPTIONS as readonly string[]).includes(field.value) ? [field.value] : []),
                                                                            ...SITE_DIALOG_WORK_STATUS_OPTIONS
                                                                        ])).map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                                                                    </SelectContent>
                                                                </Select>
                                                                <FormMessage />
                                                            </FormItem>
                                                        )} />
                                                        <FormField name="startDate" control={control} render={({ field }) => <FormItem><FormLabel>Start Date</FormLabel><FormControl><Input type="date" {...field} value={field.value || ''} readOnly={isFieldReadOnly(true)} /></FormControl><FormMessage /></FormItem>} />
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
