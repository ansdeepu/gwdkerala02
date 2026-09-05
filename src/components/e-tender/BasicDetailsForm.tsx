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
import { Loader2, Save, X } from 'lucide-react';
import type { E_tenderFormData, BasicDetailsFormData } from '@/lib/schemas/eTenderSchema';
import { formatDateForInput, toDateOrNull, getRateDetailForDate, calculateStructuredRate } from './utils';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '../ui/select';
import { useDataStore } from '@/hooks/use-data-store';
import { useTenderData } from './TenderDataContext';
import { zodResolver } from '@hookform/resolvers/zod';
import { BasicDetailsSchema } from '@/lib/schemas/eTenderSchema';
import { formatCase } from '@/lib/utils';
import { format, isValid } from 'date-fns';

interface BasicDetailsFormProps {
  onSubmit: (data: Partial<E_tenderFormData>) => void;
  onCancel: () => void;
  isSubmitting: boolean;
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

export default function BasicDetailsForm({ onSubmit, onCancel, isSubmitting }: BasicDetailsFormProps) {
    const { allRateDescriptionDetails, allFileEntries } = useDataStore();
    const { tender } = useTenderData();

    const form = useForm<BasicDetailsFormData>({
        resolver: zodResolver(BasicDetailsSchema),
        defaultValues: {
            ...tender,
            tenderDate: formatDateForInput(tender.tenderDate),
            selectedSiteIds: tender.selectedSiteIds || [],
            linkedSites: tender.linkedSites || [],
            // dateTimeOfReceipt and dateTimeOfOpening are kept as Date/String objects in the form state
            // but the DateTimePicker12h handles the conversion for the UI.
        }
    });
    
    const { control, setValue, handleSubmit, watch, formState: { isDirty } } = form;

    const [estimateAmount, tenderType, tenderDate, fileNo, fileNo2, fileNo3, fileNo4, selectedSiteIds] = watch([
        'estimateAmount',
        'tenderType',
        'tenderDate',
        'fileNo',
        'fileNo2',
        'fileNo3',
        'fileNo4',
        'selectedSiteIds'
    ]);

    const matchingFiles = React.useMemo(() => {
        const enteredNos = [fileNo, fileNo2, fileNo3, fileNo4]
            .filter((f): f is string => typeof f === 'string' && f.trim().length > 0)
            .map(f => f.trim().toUpperCase());

        if (enteredNos.length === 0 || !allFileEntries) return [];

        const matchFileNo = (fileNoInDb?: string | null, searchNo?: string | null): boolean => {
            if (!fileNoInDb || !searchNo) return false;
            const dbClean = fileNoInDb.trim().toUpperCase();
            const searchClean = searchNo.trim().toUpperCase();
            if (!searchClean) return false;
            if (dbClean === searchClean) return true;

            const stripOfficePrefix = (str: string) => str.replace(/^[A-Z][A-Z0-9_]*\//, '');
            const dbNoPrefix = stripOfficePrefix(dbClean);
            const searchNoPrefix = stripOfficePrefix(searchClean);

            return dbNoPrefix === searchNoPrefix;
        };

        return allFileEntries.filter(entry => 
            enteredNos.some(targetNo => matchFileNo(entry.fileNo, targetNo))
        );
    }, [fileNo, fileNo2, fileNo3, fileNo4, allFileEntries]);

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
        const amount = (typeof estimateAmount !== 'number' || isNaN(estimateAmount)) ? 0 : estimateAmount;

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

        const selectedIds = data.selectedSiteIds && data.selectedSiteIds.length > 0 
            ? data.selectedSiteIds 
            : availableSites.map(s => s.siteId);

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
            nameOfWork: formatCase(data.nameOfWork) ?? data.nameOfWork,
            nameOfWorkMalayalam: formatCase(data.nameOfWorkMalayalam) ?? data.nameOfWorkMalayalam,
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

                            {availableSites.length > 0 && (
                                <div className="border rounded-md p-3.5 bg-muted/20 space-y-2.5">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <h4 className="text-xs font-bold text-foreground flex items-center gap-1.5 uppercase tracking-wide">
                                                Select Sites for Tender ({availableSites.filter(s => (selectedSiteIds || availableSites.map(x => x.siteId)).includes(s.siteId)).length}/{availableSites.length} selected)
                                            </h4>
                                            <p className="text-[11px] text-muted-foreground">
                                                Uncheck sites assigned to Dept. Rig or other tasks.
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

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
                                        {availableSites.map(site => {
                                            const currentSelected = selectedSiteIds || availableSites.map(s => s.siteId);
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
                            )}
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
                                <FormField name="periodOfCompletion" control={control} render={({ field }) => ( <FormItem><FormLabel>Period of Completion (Days)</FormLabel><FormControl><Input type="number" {...field} value={(field.value === undefined || field.value === null || isNaN(field.value)) ? '' : field.value} onChange={e => field.onChange(e.target.valueAsNumber)}/></FormControl><FormMessage /></FormItem> )}/>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <FormField name="estimateAmount" control={control} render={({ field }) => ( <FormItem><FormLabel>Tender Amount (Rs.)</FormLabel><FormControl><Input type="number" {...field} value={(field.value === undefined || field.value === null || isNaN(field.value)) ? '' : field.value} onChange={e => field.onChange(e.target.valueAsNumber)} /></FormControl><FormMessage /></FormItem> )}/>
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
                            <FormField name="detailedEstimateUrl" control={control} render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Detailed Estimate PDF Link</FormLabel>
                                    <FormControl><Input {...field} value={field.value ?? ''} placeholder="https://docs.google.com/..." /></FormControl>
                                    <FormDescription className="text-xs">Enter a public Google Drive link for the estimate PDF.</FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}/>
                        </div>
                    </ScrollArea>
                </div>
                <DialogFooter className="p-6 pt-4">
                    <Button variant="outline" type="button" onClick={onCancel} disabled={isSubmitting}>
                        <X className="mr-2 h-4 w-4" /> Cancel
                    </Button>
                    <Button type="submit" disabled={isSubmitting || (tender.id !== 'new' && !isDirty)}>
                        {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />} Save Details
                    </Button>
                </DialogFooter>
            </form>
        </FormProvider>
    );
}
