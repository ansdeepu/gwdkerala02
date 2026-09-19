// src/components/e-tender/BasicDetailsForm.tsx
"use client";

import React, { useEffect, useCallback } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { FormField, FormItem, FormLabel, FormControl, FormMessage, FormDescription } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { MalayalamInput } from '@/components/ui/malayalam-input-helper';
import { DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, Save, X, FileText, Upload, Trash2, CheckCircle2 } from 'lucide-react';
import type { E_tenderFormData, BasicDetailsFormData } from '@/lib/schemas/eTenderSchema';
import { formatDateForInput, toDateOrNull, getRateDetailForDate, calculateStructuredRate } from './utils';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '../ui/select';
import { useDataStore } from '@/hooks/use-data-store';
import { useTenderData } from './TenderDataContext';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { uploadTenderEstimateToGoogleDrive } from '@/lib/googleDriveUploadClient';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import GoogleDriveSetupDialog from '@/components/shared/GoogleDriveSetupDialog';
import { zodResolver } from '@hookform/resolvers/zod';
import { BasicDetailsSchema } from '@/lib/schemas/eTenderSchema';
import { formatCase } from '@/lib/utils';
import { format, isValid } from 'date-fns';

interface BasicDetailsFormProps {
  onSubmit: (data: Partial<E_tenderFormData>) => void;
  onCancel: () => void;
  isSubmitting: boolean;
  initialData?: Partial<E_tenderFormData>;
}

const DateTimePicker12h = ({ 
    label, 
    value, 
    onChange,
    disabled
}: { 
    label: string, 
    value: any, 
    onChange: (date: Date | null) => void,
    disabled?: boolean
}) => {
    const d = toDateOrNull(value);
    const datePart = d ? format(d, 'yyyy-MM-dd') : '';
    
    // UI parts
    const h = d ? (d.getHours() % 12 || 12) : 10;
    const m = d ? d.getMinutes() : 0;
    const ampm = d ? (d.getHours() >= 12 ? 'PM' : 'AM') : 'AM';

    const handleDateChange = (newDate: string) => {
        if (!newDate) {
            onChange(null);
            return;
        }
        const hour24 = ampm === 'PM' ? (h === 12 ? 12 : h + 12) : (h === 12 ? 0 : h);
        const date = new Date(newDate);
        date.setHours(hour24, m, 0, 0);
        onChange(date);
    };

    const handleTimeChange = (newH: number, newM: number, newAmpm: string) => {
        if (!datePart) return;
        const hour24 = newAmpm === 'PM' ? (newH === 12 ? 12 : newH + 12) : (newH === 12 ? 0 : newH);
        const date = new Date(datePart);
        date.setHours(hour24, newM, 0, 0);
        onChange(date);
    };

    return (
        <FormItem className="space-y-1">
            <FormLabel>{label}</FormLabel>
            <div className="flex flex-wrap items-center gap-2">
                <FormControl>
                    <Input 
                        type="date" 
                        className="w-[150px]" 
                        value={datePart} 
                        onChange={(e) => handleDateChange(e.target.value)}
                        disabled={disabled}
                    />
                </FormControl>
                <div className="flex items-center gap-1">
                    <Select 
                        value={String(h)} 
                        onValueChange={(val) => handleTimeChange(parseInt(val), m, ampm)}
                        disabled={disabled || !datePart}
                    >
                        <SelectTrigger className="w-[65px] h-10"><SelectValue /></SelectTrigger>
                        <SelectContent className="max-h-60">
                            {Array.from({ length: 12 }, (_, i) => String(i + 1)).map(hour => (
                                <SelectItem key={hour} value={hour}>{hour}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <span className="font-bold">:</span>
                    <Select 
                        value={String(m).padStart(2, '0')} 
                        onValueChange={(val) => handleTimeChange(h, parseInt(val), ampm)}
                        disabled={disabled || !datePart}
                    >
                        <SelectTrigger className="w-[65px] h-10"><SelectValue /></SelectTrigger>
                        <SelectContent className="max-h-60">
                            {Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0')).map(min => (
                                <SelectItem key={min} value={min}>{min}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <Select 
                        value={ampm} 
                        onValueChange={(val) => handleTimeChange(h, m, val)}
                        disabled={disabled || !datePart}
                    >
                        <SelectTrigger className="w-[75px] h-10"><SelectValue /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="AM">AM</SelectItem>
                            <SelectItem value="PM">PM</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>
            <FormMessage />
        </FormItem>
    );
};

export default function BasicDetailsForm({ onSubmit, onCancel, isSubmitting, initialData }: BasicDetailsFormProps) {
    const { allRateDescriptionDetails, allFileEntries } = useDataStore();
    const { tender } = useTenderData();
    const { user } = useAuth();
    const { toast } = useToast();

    const [isUploadingEstimate, setIsUploadingEstimate] = React.useState(false);
    const [uploadProgressText, setUploadProgressText] = React.useState('');
    const [estimateUploadProgress, setEstimateUploadProgress] = React.useState<{
        percent: number;
        statusText: string;
        fileName: string;
        fileSizeMB: string;
    } | null>(null);
    const [isDriveSetupOpen, setIsDriveSetupOpen] = React.useState(false);
    const fileInputRef = React.useRef<HTMLInputElement>(null);

    const effectiveOffice = tender.officeLocation || user?.officeLocation || 'General';

    const cleanWorkMalayalam = (val?: string | null) => {
        if (!val) return '';
        return val
            .replace(/\bMla\s*-\s*Sdf\b/gi, 'MLA - SDF')
            .replace(/\bMla-Sdf\b/gi, 'MLA - SDF')
            .replace(/\bmla\s*-\s*sdf\b/gi, 'MLA - SDF')
            .replace(/\bMla\b/g, 'MLA')
            .replace(/\bSdf\b/g, 'SDF');
    };

    const cleanWorkEnglish = (val?: string | null) => {
        if (!val) return '';
        return formatCase(val)
            ?.replace(/\bMla\s*-\s*Sdf\b/gi, 'MLA - SDF')
            .replace(/\bMla-Sdf\b/gi, 'MLA - SDF')
            .replace(/\bmla\s*-\s*sdf\b/gi, 'MLA - SDF')
            .replace(/\bMla\b/g, 'MLA')
            .replace(/\bSdf\b/g, 'SDF') ?? val;
    };

    const mergedData = { ...tender, ...(initialData || {}) };

    const form = useForm<BasicDetailsFormData>({
        resolver: zodResolver(BasicDetailsSchema),
        defaultValues: {
            ...mergedData,
            nameOfWork: cleanWorkEnglish(mergedData.nameOfWork),
            nameOfWorkMalayalam: cleanWorkMalayalam(mergedData.nameOfWorkMalayalam),
            estimateAmount: (mergedData.estimateAmount !== undefined && mergedData.estimateAmount !== null && !isNaN(Number(mergedData.estimateAmount)))
                ? Number(mergedData.estimateAmount)
                : null,
            tenderDate: formatDateForInput(mergedData.tenderDate),
            selectedSiteIds: mergedData.selectedSiteIds || [],
            linkedSites: mergedData.linkedSites || [],
            detailedEstimateUrl: mergedData.detailedEstimateUrl ?? '',
            detailedEstimateDriveFileId: mergedData.detailedEstimateDriveFileId ?? null,
            detailedEstimateFileName: mergedData.detailedEstimateFileName ?? null,
            detailedEstimateUploadedAt: mergedData.detailedEstimateUploadedAt ?? null,
            // dateTimeOfReceipt and dateTimeOfOpening are kept as Date/String objects in the form state
            // but the DateTimePicker12h handles the conversion for the UI.
        }
    });
    
    const { control, setValue, handleSubmit, watch, formState: { isDirty } } = form;

    const [
        estimateAmount, 
        tenderType, 
        tenderDate, 
        fileNo, 
        fileNo2, 
        fileNo3, 
        fileNo4, 
        selectedSiteIds,
        detailedEstimateUrl,
        detailedEstimateFileName,
        eTenderNo
    ] = watch([
        'estimateAmount',
        'tenderType',
        'tenderDate',
        'fileNo',
        'fileNo2',
        'fileNo3',
        'fileNo4',
        'selectedSiteIds',
        'detailedEstimateUrl',
        'detailedEstimateFileName',
        'eTenderNo'
    ]);

    const handleFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
            toast({
                title: "Invalid File Format",
                description: "Please upload a valid PDF document (.pdf).",
                variant: "destructive",
            });
            if (fileInputRef.current) fileInputRef.current.value = '';
            return;
        }

        // Strict 25MB check for Detailed Estimate PDF
        const MAX_PDF_SIZE_BYTES = 25 * 1024 * 1024;
        if (file.size > MAX_PDF_SIZE_BYTES) {
            const sizeMb = (file.size / (1024 * 1024)).toFixed(1);
            toast({
                title: "File Exceeds 25MB Limit",
                description: `Selected PDF "${file.name}" (${sizeMb} MB) exceeds maximum allowed upload limit of 25MB. Please upload a smaller or compressed PDF.`,
                variant: "destructive",
            });
            if (fileInputRef.current) fileInputRef.current.value = '';
            return;
        }

        const fileSizeMB = (file.size / (1024 * 1024)).toFixed(1);
        setIsUploadingEstimate(true);
        setUploadProgressText(`Uploading Detailed Estimate PDF (${fileSizeMB} MB) to Google Drive...`);
        setEstimateUploadProgress({
            percent: 10,
            statusText: `Preparing Detailed Estimate PDF (${fileSizeMB} MB)...`,
            fileName: file.name,
            fileSizeMB,
        });

        try {
            let result;
            if (typeof uploadTenderEstimateToGoogleDrive === 'function') {
                result = await uploadTenderEstimateToGoogleDrive({
                    file,
                    officeLocation: effectiveOffice,
                    tenderNo: eTenderNo || tender.eTenderNo,
                    onProgress: (percent, statusText) => {
                        setEstimateUploadProgress({
                            percent,
                            statusText,
                            fileName: file.name,
                            fileSizeMB,
                        });
                    },
                });
            } else {
                // Inline resilient fallback if module chunk is stale
                const base64Data = await new Promise<string>((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onload = () => {
                        const dataUrl = reader.result as string;
                        resolve(dataUrl.split(',')[1] || '');
                    };
                    reader.onerror = reject;
                    reader.readAsDataURL(file);
                });
                const cleanTenderNo = (eTenderNo || tender.eTenderNo) ? String(eTenderNo || tender.eTenderNo).replace(/[/\\?%*:|"<>]/g, '_').trim() : 'Draft';
                const cleanOriginalName = String(file.name).replace(/[/\\?%*:|"<>]/g, '_').trim();
                const fileName = `Detailed_Estimate_${cleanTenderNo}_${cleanOriginalName}`;

                const response = await fetch("/api/drive-upload", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        base64Data,
                        fileName,
                        mimeType: "application/pdf",
                        officeLocation: effectiveOffice,
                        rootFolder: "GWD_e-Tender",
                        skipSubFolder: true,
                        type: "document",
                    }),
                });
                result = await response.json();
            }

            if (result && result.success && (result.url || result.viewUrl)) {
                const finalUrl = result.viewUrl || result.url || '';
                const driveFileId = result.fileId || '';
                const fileName = result.fileName || file.name;

                setValue('detailedEstimateUrl', finalUrl, { shouldDirty: true });
                setValue('detailedEstimateDriveFileId', driveFileId, { shouldDirty: true });
                setValue('detailedEstimateFileName', fileName, { shouldDirty: true });
                setValue('detailedEstimateUploadedAt', new Date().toISOString(), { shouldDirty: true });

                setEstimateUploadProgress({
                    percent: 100,
                    statusText: "Detailed Estimate PDF uploaded successfully!",
                    fileName: file.name,
                    fileSizeMB,
                });

                toast({
                    title: "Detailed Estimate Uploaded",
                    description: `Saved to keralagwd@gmail.com Google Drive: GWD_e-Tender > ${effectiveOffice}`,
                });
            } else {
                if (result.requiresSetup) {
                    toast({
                        title: "Google Drive Setup Required",
                        description: "Google Drive integration for keralagwd@gmail.com is not yet configured. Please configure it now.",
                        variant: "destructive",
                    });
                    setIsDriveSetupOpen(true);
                } else {
                    toast({
                        title: "Upload Failed",
                        description: result.error || "Failed to upload Detailed Estimate to Google Drive.",
                        variant: "destructive",
                    });
                }
            }
        } catch (err: any) {
            toast({
                title: "Upload Error",
                description: err?.message || "An unexpected error occurred during file upload.",
                variant: "destructive",
            });
        } finally {
            setIsUploadingEstimate(false);
            setUploadProgressText('');
            setTimeout(() => setEstimateUploadProgress(null), 3000);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const handleRemoveEstimate = () => {
        setValue('detailedEstimateUrl', '', { shouldDirty: true });
        setValue('detailedEstimateDriveFileId', null, { shouldDirty: true });
        setValue('detailedEstimateFileName', null, { shouldDirty: true });
        setValue('detailedEstimateUploadedAt', null, { shouldDirty: true });
        toast({
            title: "Detailed Estimate Cleared",
            description: "The estimate attachment has been removed from this tender.",
        });
    };

    const matchFileNo = useCallback((fileNoInDb?: string | null, searchNo?: string | null): boolean => {
        if (!fileNoInDb || !searchNo) return false;
        const dbClean = fileNoInDb.trim().toUpperCase();
        const searchClean = searchNo.trim().toUpperCase();
        if (!searchClean) return false;
        if (dbClean === searchClean) return true;

        const stripOfficePrefix = (str: string) => str.replace(/^[A-Z][A-Z0-9_]*\//, '');
        const dbNoPrefix = stripOfficePrefix(dbClean);
        const searchNoPrefix = stripOfficePrefix(searchClean);

        return dbNoPrefix === searchNoPrefix;
    }, []);

    const matchingFiles = React.useMemo(() => {
        const enteredNos = [fileNo, fileNo2, fileNo3, fileNo4]
            .filter((f): f is string => typeof f === 'string' && f.trim().length > 0)
            .map(f => f.trim().toUpperCase());

        if (enteredNos.length === 0 || !allFileEntries) return [];

        return allFileEntries.filter(entry => 
            enteredNos.some(targetNo => matchFileNo(entry.fileNo, targetNo))
        );
    }, [fileNo, fileNo2, fileNo3, fileNo4, allFileEntries, matchFileNo]);

    // When editing file numbers, completely clear the selection of sites belonging to the edited/replaced file
    const prevFileNosRef = React.useRef<{ fileNo: string; fileNo2: string; fileNo3: string; fileNo4: string }>({
        fileNo: (tender.fileNo || '').trim(),
        fileNo2: (tender.fileNo2 || '').trim(),
        fileNo3: (tender.fileNo3 || '').trim(),
        fileNo4: (tender.fileNo4 || '').trim(),
    });

    useEffect(() => {
        const prev = prevFileNosRef.current;
        const current = {
            fileNo: (fileNo || '').trim(),
            fileNo2: (fileNo2 || '').trim(),
            fileNo3: (fileNo3 || '').trim(),
            fileNo4: (fileNo4 || '').trim(),
        };

        const changedOldFileNos: string[] = [];
        if (prev.fileNo !== current.fileNo && prev.fileNo) changedOldFileNos.push(prev.fileNo);
        if (prev.fileNo2 !== current.fileNo2 && prev.fileNo2) changedOldFileNos.push(prev.fileNo2);
        if (prev.fileNo3 !== current.fileNo3 && prev.fileNo3) changedOldFileNos.push(prev.fileNo3);
        if (prev.fileNo4 !== current.fileNo4 && prev.fileNo4) changedOldFileNos.push(prev.fileNo4);

        if (changedOldFileNos.length > 0 && Array.isArray(allFileEntries)) {
            const oldSiteIdsToRemove = new Set<string>();
            changedOldFileNos.forEach(oldFn => {
                const oldFileEntry = allFileEntries.find(e => matchFileNo(e.fileNo, oldFn));
                if (oldFileEntry && Array.isArray(oldFileEntry.siteDetails)) {
                    oldFileEntry.siteDetails.forEach((site: any, idx: number) => {
                        const sId = site.id || `${oldFileEntry.fileNo}_${idx}`;
                        oldSiteIdsToRemove.add(sId);
                    });
                }
            });

            if (oldSiteIdsToRemove.size > 0 && Array.isArray(selectedSiteIds) && selectedSiteIds.length > 0) {
                const filtered = selectedSiteIds.filter(id => !oldSiteIdsToRemove.has(id));
                if (filtered.length !== selectedSiteIds.length) {
                    setValue('selectedSiteIds', filtered, { shouldDirty: true, shouldValidate: true });
                }
            }
        }

        prevFileNosRef.current = current;
    }, [fileNo, fileNo2, fileNo3, fileNo4, allFileEntries, selectedSiteIds, setValue, matchFileNo]);

    const availableSites = React.useMemo(() => {
        const sitesList: Array<{
            fileNo: string;
            siteId: string;
            nameOfSite: string;
            purpose?: string;
            workStatus?: string;
        }> = [];

        matchingFiles.forEach(file => {
            if (Array.isArray(file.siteDetails)) {
                file.siteDetails.forEach((site, idx) => {
                    const sId = site.id || `${file.fileNo}_${idx}`;
                    sitesList.push({
                        fileNo: file.fileNo || '',
                        siteId: sId,
                        nameOfSite: site.nameOfSite || `Site ${idx + 1}`,
                        purpose: site.purpose || 'N/A',
                        workStatus: site.workStatus || 'Pending'
                    });
                });
            }
        });

        return sitesList;
    }, [matchingFiles]);

    const calculateFees = useCallback(() => {
        const amount = (typeof estimateAmount !== 'number' || isNaN(estimateAmount) || estimateAmount === null) ? 0 : estimateAmount;

        if (amount === 0) {
            setValue('tenderFormFee', 0, { shouldValidate: true, shouldDirty: true });
            setValue('emd', 0, { shouldValidate: true, shouldDirty: true });
            return;
        }

        const tDate = toDateOrNull(tenderDate);
        let fee: number | string = 0;
        let emd: number | string = 0;
        const roundToNext100 = (num: number) => Math.ceil(num / 100) * 100;

        // Use GWD Rates if available
        const feeDetail = getRateDetailForDate(allRateDescriptionDetails, 'tenderFee', tDate);
        const emdDetail = getRateDetailForDate(allRateDescriptionDetails, 'emd', tDate);

        if (feeDetail?.structuredData) {
            fee = calculateStructuredRate(feeDetail.structuredData, tenderType || 'Work', amount);
            // If structured rate returns 0, but it's "Work" type, use legacy fallback as safety
            if (fee === 0 && tenderType === 'Work' && amount > 0) {
                if (amount <= 50000) fee = 300;
                else if (amount <= 1000000) fee = Math.max(500, Math.min(amount * 0.002, 2000));
                else if (amount <= 10000000) fee = 2500;
                else if (amount <= 20000000) fee = 5000;
                else if (amount <= 50000000) fee = 7500;
                else if (amount <= 100000000) fee = 10000;
                else fee = 15000;
            }
        } else {
            // Fallback to legacy logic if no structured data
            if (tenderType === 'Work' && amount > 0) {
                if (amount <= 50000) fee = 300;
                else if (amount <= 1000000) fee = Math.max(500, Math.min(amount * 0.002, 2000));
                else if (amount <= 10000000) fee = Math.max(2500, Math.min(amount * 0.002, 25000));
                else fee = Math.max(15000, Math.min(amount * 0.002, 25000));
            } else if (tenderType === 'Purchase' && amount > 0) {
                if (amount <= 100000) fee = 0;
                else if (amount <= 1000000) fee = Math.max(400, Math.min(amount * 0.002, 1500));
                else fee = Math.min(amount * 0.0015, 25000);
            }
        }
        
        if (typeof fee === 'number') fee = roundToNext100(fee);
        else if (fee === "No Fee") fee = 0;
        else fee = parseFloat(String(fee).replace(/[^0-9.]/g, '')) || 0;

        if (emdDetail?.structuredData) {
            emd = calculateStructuredRate(emdDetail.structuredData, tenderType || 'Work', amount);
        } else {
            // Fallback to legacy logic if no structured data
            if ((tenderType || 'Work') === 'Work') {
                // Common GWD/PWD standard: 2.5% of PAC subject to a maximum of 50,000 for works up to 2 crore
                if (amount <= 20000000) emd = Math.min(amount * 0.025, 50000);
                else if (amount <= 50000000) emd = 100000;
                else if (amount <= 100000000) emd = 200000;
                else emd = 500000;
            } else if (tenderType === 'Purchase') {
                if (amount > 0 && amount <= 20000000) emd = amount * 0.01;
                else emd = 0;
            }
        }

        // Safety fallback if EMD structured rate is 0 or empty for Work type with PAC > 0
        if ((!emd || emd === 0) && (tenderType || 'Work') === 'Work' && amount > 0) {
            if (amount <= 20000000) emd = Math.min(amount * 0.025, 50000);
            else if (amount <= 50000000) emd = 100000;
            else if (amount <= 100000000) emd = 200000;
            else emd = 500000;
        } else if ((!emd || emd === 0) && tenderType === 'Purchase' && amount > 0) {
            if (amount <= 20000000) emd = amount * 0.01;
            else emd = 0;
        }

        if (typeof emd === 'number') emd = roundToNext100(emd);
        else if (emd === "No EMD") emd = 0;
        else emd = parseFloat(String(emd).replace(/[^0-9.]/g, '')) || 0;

        setValue('tenderFormFee', fee as number, { shouldValidate: true, shouldDirty: true });
        setValue('emd', emd as number, { shouldValidate: true, shouldDirty: true });
    }, [estimateAmount, tenderType, tenderDate, allRateDescriptionDetails, setValue]);

    useEffect(() => {
        calculateFees();
    }, [calculateFees]);
     
    const onFormSubmit = (data: BasicDetailsFormData) => {
        const cleanFileNo = (val: string | null | undefined) => {
            if (!val) return val;
            return val.replace(/^[a-zA-Z]{2,}[a-zA-Z\s\/\\-]*?(?=\d)/, '').trim();
        };

        const selectedIds = Array.isArray(data.selectedSiteIds) ? data.selectedSiteIds : [];

        const linkedSites = availableSites
            .filter(s => selectedIds.includes(s.siteId))
            .map(s => ({
                fileNo: s.fileNo,
                siteId: s.siteId,
                nameOfSite: s.nameOfSite,
                purpose: s.purpose
            }));

        const formData: Partial<E_tenderFormData> = {
            ...data,
            selectedSiteIds: selectedIds,
            linkedSites: linkedSites,
            fileNo: cleanFileNo(data.fileNo),
            fileNo2: cleanFileNo(data.fileNo2),
            fileNo3: cleanFileNo(data.fileNo3),
            fileNo4: cleanFileNo(data.fileNo4),
            nameOfWork: cleanWorkEnglish(data.nameOfWork),
            nameOfWorkMalayalam: cleanWorkMalayalam(data.nameOfWorkMalayalam),
        };
        onSubmit(formData);
    };

    return (
        <FormProvider {...form}>
            <form onSubmit={handleSubmit(onFormSubmit)} className="flex flex-col h-full">
                <DialogHeader className="p-6 pb-4">
                    <DialogTitle>Basic Tender Details</DialogTitle>
                    <DialogDescription>Enter the fundamental details for this tender.</DialogDescription>
                </DialogHeader>
                <div className="flex-1 min-h-0">
                    <ScrollArea className="h-full px-6 py-4">
                        <div className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <FormField name="eTenderNo" control={control} render={({ field }) => ( <FormItem><FormLabel>eTender No.</FormLabel><FormControl><Input {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem> )}/>
                                <FormField name="tenderDate" control={control} render={({ field }) => ( <FormItem><FormLabel>Tender Date</FormLabel><FormControl><Input type="date" {...field} value={formatDateForInput(field.value)} onChange={(e) => field.onChange(e.target.value || null)}/></FormControl><FormMessage /></FormItem> )}/>
                            </div>
                             <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                <FormField name="fileNo" control={control} render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>File No. 1</FormLabel>
                                        <FormControl>
                                            <Input 
                                                {...field} 
                                                value={field.value ?? ''} 
                                                onChange={(e) => {
                                                    const cleaned = e.target.value.replace(/^[a-zA-Z]{2,}[a-zA-Z\s\/\\-]*?(?=\d)/, '');
                                                    field.onChange(cleaned);
                                                }}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}/>
                                <FormField name="fileNo2" control={control} render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>File No. 2</FormLabel>
                                        <FormControl>
                                            <Input 
                                                {...field} 
                                                value={field.value ?? ''} 
                                                onChange={(e) => {
                                                    const cleaned = e.target.value.replace(/^[a-zA-Z]{2,}[a-zA-Z\s\/\\-]*?(?=\d)/, '');
                                                    field.onChange(cleaned);
                                                }}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}/>
                                <FormField name="fileNo3" control={control} render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>File No. 3</FormLabel>
                                        <FormControl>
                                            <Input 
                                                {...field} 
                                                value={field.value ?? ''} 
                                                onChange={(e) => {
                                                    const cleaned = e.target.value.replace(/^[a-zA-Z]{2,}[a-zA-Z\s\/\\-]*?(?=\d)/, '');
                                                    field.onChange(cleaned);
                                                }}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}/>
                                <FormField name="fileNo4" control={control} render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>File No. 4</FormLabel>
                                        <FormControl>
                                            <Input 
                                                {...field} 
                                                value={field.value ?? ''} 
                                                onChange={(e) => {
                                                    const cleaned = e.target.value.replace(/^[a-zA-Z]{2,}[a-zA-Z\s\/\\-]*?(?=\d)/, '');
                                                    field.onChange(cleaned);
                                                }}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}/>
                            </div>
                            <p className="text-[11px] text-muted-foreground leading-snug -mt-2">
                                Office code (e.g., GWDKLM) is not required. Enter only number/year (e.g., 1956/2023) for each File No.
                            </p>

                            {availableSites.length > 0 && (() => {
                                const currentSelected = Array.isArray(selectedSiteIds) ? selectedSiteIds : [];
                                const selectedCount = availableSites.filter(s => currentSelected.includes(s.siteId)).length;
                                return (
                                <div className="border rounded-md p-3.5 bg-muted/20 space-y-2.5">
                                    <div className="flex items-center justify-between flex-wrap gap-2">
                                        <div>
                                            <h4 className="text-xs font-bold text-foreground flex items-center gap-1.5 uppercase tracking-wide">
                                                Select Sites for Tender ({selectedCount}/{availableSites.length} selected)
                                            </h4>
                                            <p className="text-[11px] text-muted-foreground">
                                                Check specific sites to include in this tender. Unchecked sites remain in their pre-tender status.
                                            </p>
                                        </div>
                                        <div className="flex gap-2">
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                className="h-6 text-[11px] px-2"
                                                onClick={() => {
                                                    const allIds = availableSites.map(s => s.siteId);
                                                    setValue('selectedSiteIds', allIds, { shouldDirty: true, shouldValidate: true });
                                                }}
                                            >
                                                Select All
                                            </Button>
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                className="h-6 text-[11px] px-2 text-muted-foreground"
                                                onClick={() => {
                                                    setValue('selectedSiteIds', [], { shouldDirty: true, shouldValidate: true });
                                                }}
                                            >
                                                Clear
                                            </Button>
                                        </div>
                                    </div>

                                    {selectedCount === 0 && (
                                        <div className="text-[11px] text-amber-800 dark:text-amber-300 bg-amber-50/80 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 rounded px-2.5 py-1.5">
                                            No sites selected yet. Check the boxes below or click &quot;Select All&quot;. Unselected sites will not be marked as Tendered.
                                        </div>
                                    )}

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
                                        {availableSites.map(site => {
                                            const isSelected = currentSelected.includes(site.siteId);
                                            return (
                                                <label
                                                    key={site.siteId}
                                                    className={`flex items-start gap-2.5 p-2 rounded border text-xs cursor-pointer transition-colors ${
                                                        isSelected
                                                            ? 'bg-primary/5 border-primary/40 font-medium'
                                                            : 'bg-background hover:bg-muted/40 border-border text-muted-foreground'
                                                    }`}
                                                >
                                                    <input
                                                        type="checkbox"
                                                        checked={isSelected}
                                                        className="mt-0.5 rounded border-gray-300 text-primary focus:ring-primary h-3.5 w-3.5"
                                                        onChange={(e) => {
                                                            let updated: string[];
                                                            if (e.target.checked) {
                                                                updated = [...new Set([...currentSelected, site.siteId])];
                                                            } else {
                                                                updated = currentSelected.filter(id => id !== site.siteId);
                                                            }
                                                            setValue('selectedSiteIds', updated, { shouldDirty: true, shouldValidate: true });
                                                        }}
                                                    />
                                                    <div className="flex-1 min-w-0">
                                                        <div className="font-semibold text-foreground truncate flex items-center gap-1.5 flex-wrap">
                                                            <span>{site.nameOfSite}</span>
                                                            <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded font-mono font-normal">
                                                                File: {site.fileNo}
                                                            </span>
                                                        </div>
                                                        <div className="text-[11px] text-muted-foreground mt-0.5 flex flex-wrap gap-x-2 gap-y-0.5">
                                                            <span><strong>Purpose:</strong> {site.purpose}</span>
                                                            <span>• <strong>Status:</strong> {site.workStatus}</span>
                                                        </div>
                                                    </div>
                                                </label>
                                            );
                                        })}
                                    </div>
                                </div>
                                );
                            })()}
                            <div className="grid grid-cols-1 gap-4">
                               <FormField name="nameOfWork" control={control} render={({ field }) => ( <FormItem><FormLabel>Name of Work</FormLabel><FormControl><Textarea {...field} value={field.value ?? ''} className="min-h-[60px]"/></FormControl><FormMessage /></FormItem> )}/>
                               <FormField name="nameOfWorkMalayalam" control={control} render={({ field }) => ( <FormItem><FormLabel>Name of Work (in Malayalam)</FormLabel><FormControl><MalayalamInput value={field.value ?? ''} onChange={field.onChange} englishValue={watch('nameOfWork') || ''} multiline rows={2} className="min-h-[60px]"/></FormControl><FormMessage /></FormItem> )}/>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <FormField name="location" control={control} render={({ field }) => ( <FormItem><FormLabel>Location</FormLabel><FormControl><Input {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem> )}/>
                                <FormField name="tenderType" control={control} render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Type of Tender</FormLabel>
                                        <Select onValueChange={field.onChange} value={field.value ?? undefined}>
                                            <FormControl><SelectTrigger><SelectValue placeholder="Select Type" /></SelectTrigger></FormControl>
                                            <SelectContent>
                                                <SelectItem value="Work">Work</SelectItem>
                                                <SelectItem value="Purchase">Purchase</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}/>
                                <FormField 
                                  name="periodOfCompletion" 
                                  control={control} 
                                  render={({ field }) => ( 
                                    <FormItem>
                                      <FormLabel>Period of Completion (Days)</FormLabel>
                                      <FormControl>
                                        <Input 
                                          type="number" 
                                          {...field} 
                                          value={(field.value === undefined || field.value === null || (typeof field.value === 'number' && isNaN(field.value))) ? '' : field.value} 
                                          onChange={e => {
                                            const val = e.target.value.trim();
                                            if (val === '') {
                                              field.onChange(null);
                                            } else {
                                              const num = parseInt(val, 10);
                                              field.onChange(isNaN(num) ? null : num);
                                            }
                                          }}
                                        />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem> 
                                  )}
                                />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <FormField 
                                  name="estimateAmount" 
                                  control={control} 
                                  render={({ field }) => ( 
                                    <FormItem>
                                      <FormLabel>Tender Amount (Rs.)</FormLabel>
                                      <FormControl>
                                        <Input 
                                          type="number" 
                                          step="any"
                                          {...field} 
                                          value={(field.value === undefined || field.value === null || (typeof field.value === 'number' && isNaN(field.value))) ? '' : field.value} 
                                          onChange={e => {
                                            const val = e.target.value.trim();
                                            if (val === '') {
                                              field.onChange(null);
                                            } else {
                                              const num = parseFloat(val);
                                              field.onChange(isNaN(num) ? null : num);
                                            }
                                          }} 
                                        />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem> 
                                  )}
                                />
                                <FormField name="tenderFormFee" control={control} render={({ field }) => ( 
                                    <FormItem>
                                        <FormLabel>Tender Fee (Rs.)</FormLabel>
                                        <FormControl><Input readOnly type="number" {...field} value={(field.value === undefined || field.value === null || isNaN(field.value)) ? '' : field.value} className="bg-muted/50 font-semibold" /></FormControl>
                                        <FormDescription className="text-xs">Auto-calculated and rounded up.</FormDescription>
                                        <FormMessage />
                                    </FormItem> 
                                )}/>
                                <FormField name="emd" control={control} render={({ field }) => ( 
                                    <FormItem>
                                        <FormLabel>EMD (Rs.)</FormLabel>
                                        <FormControl><Input readOnly type="number" {...field} value={(field.value === undefined || field.value === null || isNaN(field.value)) ? '' : field.value} className="bg-muted/50 font-semibold" /></FormControl>
                                        <FormDescription className="text-xs">Auto-calculated and rounded up.</FormDescription>
                                        <FormMessage />
                                    </FormItem> 
                                )}/>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <FormField 
                                    name="dateTimeOfReceipt" 
                                    control={control} 
                                    render={({ field }) => (
                                        <DateTimePicker12h 
                                            label="Last Date & Time of Receipt" 
                                            value={field.value} 
                                            onChange={field.onChange} 
                                        />
                                    )}
                                />
                                <FormField 
                                    name="dateTimeOfOpening" 
                                    control={control} 
                                    render={({ field }) => (
                                        <DateTimePicker12h 
                                            label="Date & Time of Opening" 
                                            value={field.value} 
                                            onChange={field.onChange} 
                                        />
                                    )}
                                />
                            </div>

                            {/* Detailed Estimate PDF Upload - Stored directly into keralagwd@gmail.com Drive > GWD_e-Tender > [Sub-Office] */}
                            <div className="space-y-2 border rounded-lg p-4 bg-muted/20">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <Label className="text-sm font-semibold flex items-center gap-1.5 text-foreground">
                                            <FileText className="h-4 w-4 text-primary" /> Detailed Estimate PDF
                                        </Label>
                                        <p className="text-xs text-muted-foreground mt-0.5">
                                            Uploads directly to <span className="font-medium text-foreground">keralagwd@gmail.com</span> Drive folder: <span className="font-mono text-primary font-semibold">GWD_e-Tender / {effectiveOffice}</span>
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-[11px] text-muted-foreground font-normal px-2 py-0.5 rounded bg-muted/60 border hidden sm:inline">
                                            Max: 25MB
                                        </span>
                                        {detailedEstimateUrl && (
                                            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 text-xs gap-1 font-normal">
                                                <CheckCircle2 className="h-3 w-3 text-green-600" /> Uploaded to Drive
                                            </Badge>
                                        )}
                                    </div>
                                </div>

                                <input 
                                    ref={fileInputRef}
                                    type="file"
                                    accept="application/pdf,.pdf"
                                    className="hidden"
                                    onChange={handleFileSelected}
                                    disabled={isUploadingEstimate || isSubmitting}
                                />

                                {(isUploadingEstimate || estimateUploadProgress) ? (
                                    <div className="p-4 rounded-xl border border-primary/30 bg-primary/5 space-y-3 shadow-sm">
                                        <div className="flex items-center justify-between gap-3">
                                            <div className="flex items-center gap-2.5 min-w-0">
                                                <div className="h-9 w-9 rounded-lg bg-primary/15 flex items-center justify-center text-primary shrink-0">
                                                    {estimateUploadProgress?.percent === 100 ? (
                                                        <CheckCircle2 className="h-5 w-5 text-green-600" />
                                                    ) : (
                                                        <Loader2 className="h-5 w-5 animate-spin text-primary" />
                                                    )}
                                                </div>
                                                <div className="min-w-0">
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        <p className="text-xs font-semibold text-foreground truncate">
                                                            {estimateUploadProgress?.fileName ? `Uploading: ${estimateUploadProgress.fileName}` : (uploadProgressText || 'Uploading PDF to Google Drive...')}
                                                        </p>
                                                        {estimateUploadProgress?.fileSizeMB && (
                                                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-muted text-muted-foreground font-mono">
                                                                {estimateUploadProgress.fileSizeMB} MB
                                                            </span>
                                                        )}
                                                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 font-medium border border-amber-200/50">
                                                            Max 25MB
                                                        </span>
                                                    </div>
                                                    <p className="text-[11px] text-primary/80 truncate mt-0.5">
                                                        {estimateUploadProgress?.statusText || uploadProgressText || 'Processing Detailed Estimate PDF...'}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="text-right shrink-0">
                                                <span className="text-sm font-bold text-primary">
                                                    {estimateUploadProgress ? `${estimateUploadProgress.percent}%` : '...'}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Animated Progress Bar Track */}
                                        <div className="w-full bg-primary/20 rounded-full h-2.5 overflow-hidden">
                                            <div
                                                className="bg-primary h-2.5 rounded-full transition-all duration-300 ease-out"
                                                style={{ width: `${estimateUploadProgress?.percent ?? 25}%` }}
                                            />
                                        </div>

                                        <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                                            <span className="truncate">
                                                Folder: <code className="text-[10px]">GWD_e-Tender / {effectiveOffice}</code>
                                            </span>
                                            <span className="shrink-0 font-medium text-emerald-700 dark:text-emerald-400">
                                                keralagwd@gmail.com Drive
                                            </span>
                                        </div>
                                    </div>
                                ) : detailedEstimateUrl ? (
                                    <div className="flex items-center justify-between p-3 rounded-lg border bg-background">
                                        <div className="flex items-center gap-3 overflow-hidden">
                                            <div className="h-10 w-10 rounded-lg bg-red-100 dark:bg-red-950 flex items-center justify-center text-red-600 dark:text-red-400 shrink-0">
                                                <FileText className="h-5 w-5" />
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-sm font-medium truncate text-foreground">
                                                    {detailedEstimateFileName || 'Detailed_Estimate.pdf'}
                                                </p>
                                                <p className="text-xs text-muted-foreground">
                                                    Saved in Google Drive ({effectiveOffice} sub-office folder). Download is available in Tender PDF Reports section.
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 shrink-0">
                                            <Button 
                                                type="button" 
                                                variant="outline" 
                                                size="sm"
                                                onClick={() => fileInputRef.current?.click()}
                                                disabled={isSubmitting}
                                                className="text-xs h-8"
                                            >
                                                <Upload className="h-3.5 w-3.5 mr-1" /> Replace PDF
                                            </Button>
                                            <Button 
                                                type="button" 
                                                variant="ghost" 
                                                size="sm"
                                                onClick={handleRemoveEstimate}
                                                disabled={isSubmitting}
                                                className="text-xs h-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                                            >
                                                <Trash2 className="h-3.5 w-3.5 mr-1" /> Remove
                                            </Button>
                                        </div>
                                    </div>
                                ) : (
                                    <div 
                                        onClick={() => fileInputRef.current?.click()}
                                        className="flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-lg bg-background hover:bg-muted/40 cursor-pointer transition-colors space-y-2 border-muted-foreground/30 hover:border-primary"
                                    >
                                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                                            <Upload className="h-5 w-5" />
                                        </div>
                                        <div className="text-center">
                                            <p className="text-sm font-medium text-foreground">Click to upload Detailed Estimate PDF</p>
                                            <p className="text-xs font-semibold text-amber-700 dark:text-amber-400 mt-1">
                                                Maximum size: up to 25MB
                                            </p>
                                            <p className="text-xs text-muted-foreground mt-0.5">
                                                Saved directly to <span className="font-semibold text-foreground">keralagwd@gmail.com</span> Google Drive under <span className="font-semibold text-foreground">My Drive &gt; GWD_e-Tender &gt; {effectiveOffice}</span>
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </ScrollArea>
                </div>
                <DialogFooter className="p-6 pt-4">
                    <Button variant="outline" type="button" onClick={onCancel} disabled={isSubmitting || isUploadingEstimate}>
                        <X className="mr-2 h-4 w-4" /> Cancel
                    </Button>
                    <Button type="submit" disabled={isSubmitting || isUploadingEstimate}>
                        {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />} Save Details
                    </Button>
                </DialogFooter>
            </form>
            <GoogleDriveSetupDialog open={isDriveSetupOpen} onOpenChange={setIsDriveSetupOpen} />
        </FormProvider>
    );
}
