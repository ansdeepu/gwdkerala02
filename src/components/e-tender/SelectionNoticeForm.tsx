"use client";
// src/components/e-tender/SelectionNoticeForm.tsx

import React, { useEffect, useMemo, useCallback } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Loader2, Save, X, Info } from 'lucide-react';
import { SelectionNoticeDetailsSchema, type E_tenderFormData, type SelectionNoticeDetailsFormData } from '@/lib/schemas/eTenderSchema';
import { formatDateForInput, toDateOrNull, getRateDetailForDate } from './utils';
import { useDataStore, defaultRateDescriptions } from '@/hooks/use-data-store';
import { useTenderData } from './TenderDataContext';
import { cn } from '@/lib/utils';
import { Separator } from '../ui/separator';

interface SelectionNoticeFormProps {
    onSubmit: (data: Partial<E_tenderFormData>) => void;
    onCancel: () => void;
    isSubmitting: boolean;
    l1Amount?: number | null;
    hasRejectedBids?: boolean;
}

const parseStampPaperLogic = (description: string) => {
    const rateBasisMatch = description.match(/([\d,]+)\s*(?:for every|per)\s*[₹Rs\.]?\s*([\d,]+)/i);
    const minMatch = description.match(/(?:minimum|min)(?:\s*of)?\s*[₹Rs\.]?\s*([\d,]+)/i);
    const maxMatch = description.match(/(?:maximum|max)(?:\s*of)?\s*[₹Rs\.]?\s*([\d,]+)/i);
    
    const parseNumber = (str: string | undefined) => str ? parseInt(str.replace(/,/g, ''), 10) : undefined;

    const result = {
        rate: rateBasisMatch ? parseNumber(rateBasisMatch[1]) : 100,
        basis: rateBasisMatch ? parseNumber(rateBasisMatch[2]) : 100000,
        min: minMatch ? parseNumber(minMatch[1]) : 200,
        max: maxMatch ? parseNumber(maxMatch[1]) : 100000,
    };

    if (result.rate === 1 && result.basis === 100000) {
        result.rate = 100;
    }

    return result;
};

const parseAdditionalPerformanceGuaranteeLogic = (description: string) => {
    const betweenMatch = description.match(/between\s+([\d.]+)%\s*(?:to|and)\s*([\d.]+)%/i);
    const upToMatch = description.match(/up\s*to\s*([\d.]+)%/i);
    const moreThanMatch = description.match(/more\s+than\s+([\d.]+)%/i);

    if (betweenMatch) {
        const lower = parseFloat(betweenMatch[1]);
        const threshold = lower > 10 ? 0.10 : lower / 100;
        return { threshold };
    }
    if (upToMatch) {
        return { threshold: parseFloat(upToMatch[1]) / 100 };
    }
    if (moreThanMatch) {
        return { threshold: parseFloat(moreThanMatch[1]) / 100 };
    }
    
    return { threshold: 0.10 }; 
};


export default function SelectionNoticeForm({ onSubmit, onCancel, isSubmitting, l1Amount, hasRejectedBids }: SelectionNoticeFormProps) {
    const { tender } = useTenderData();
    const { allRateDescriptionDetails } = useDataStore();
    const isNewTender = tender?.id === 'new';

    const tenderDate = toDateOrNull(tender?.tenderDate);

    const stampPaperDetail = useMemo(() => {
        return getRateDetailForDate(allRateDescriptionDetails, 'stampPaper', tenderDate);
    }, [allRateDescriptionDetails, tenderDate]);

    const performanceGuaranteeDetail = useMemo(() => {
        return getRateDetailForDate(allRateDescriptionDetails, 'performanceGuarantee', tenderDate);
    }, [allRateDescriptionDetails, tenderDate]);

    const additionalPerformanceGuaranteeDetail = useMemo(() => {
        return getRateDetailForDate(allRateDescriptionDetails, 'additionalPerformanceGuarantee', tenderDate);
    }, [allRateDescriptionDetails, tenderDate]);

    const stampPaperDescription = useMemo(() => {
        return tender?.stampPaperDescription || stampPaperDetail?.description || defaultRateDescriptions.stampPaper;
    }, [tender?.stampPaperDescription, stampPaperDetail]);
    
    const performanceGuaranteeDescription = useMemo(() => {
        return tender?.performanceGuaranteeDescription || performanceGuaranteeDetail?.description || defaultRateDescriptions.performanceGuarantee;
    }, [tender?.performanceGuaranteeDescription, performanceGuaranteeDetail]);
    
    const additionalPerformanceGuaranteeDescription = useMemo(() => {
        return tender?.additionalPerformanceGuaranteeDescription || additionalPerformanceGuaranteeDetail?.description || defaultRateDescriptions.additionalPerformanceGuarantee;
    }, [tender?.additionalPerformanceGuaranteeDescription, additionalPerformanceGuaranteeDetail]);

    const calculateStampPaperValue = useCallback((amount?: number | null): number => {
        const logic = parseStampPaperLogic(stampPaperDescription);
        const { rate, basis, min, max } = logic;
        if (amount === undefined || amount === null || amount <= 0) return min ?? 0;
        
        const duty = Math.ceil(amount / (basis || 100000)) * (rate || 100); 
        const roundedDuty = Math.ceil(duty / 100) * 100;
        return Math.max(min ?? 0, Math.min(roundedDuty, max ?? Infinity));
    }, [stampPaperDescription]);

    const calculateAdditionalPG = useCallback((estimateAmount?: number | null, tenderAmount?: number | null): number => {
        if (!estimateAmount || !tenderAmount || tenderAmount >= estimateAmount) return 0;
        
        const logic = parseAdditionalPerformanceGuaranteeLogic(additionalPerformanceGuaranteeDescription);
        const percentageDifference = (estimateAmount - tenderAmount) / estimateAmount;
        
        if (percentageDifference > logic.threshold) {
            const excessPercentage = percentageDifference - logic.threshold;
            const additionalPG = excessPercentage * estimateAmount;
            return Math.ceil(additionalPG / 100) * 100;
        }
        return 0;
    }, [additionalPerformanceGuaranteeDescription]);


    const initialValues = useMemo(() => {
        const baseAmountType = tender?.amountType || 'Contract Amount';
        const baseAmount = baseAmountType === 'Tender Amount' ? tender.estimateAmount : (l1Amount ?? tender.contractAmount ?? undefined);

        const pgRateMatch = performanceGuaranteeDescription.match(/(\d+)%/);
        const pgRate = pgRateMatch ? parseInt(pgRateMatch[1], 10) / 100 : 0.05;

        const pg = baseAmount ? Math.ceil((baseAmount * pgRate) / 100) * 100 : 0;
        const stamp = calculateStampPaperValue(baseAmount);

        const quotedContractAmount = l1Amount ?? tender.contractAmount ?? undefined;
        const additionalPg = calculateAdditionalPG(tender?.estimateAmount ?? undefined, quotedContractAmount);

        return {
            selectionNoticeDate: formatDateForInput(tender?.selectionNoticeDate),
            performanceGuaranteeAmount: tender?.performanceGuaranteeAmount !== undefined && tender?.performanceGuaranteeAmount !== null 
                ? tender.performanceGuaranteeAmount 
                : pg,
            additionalPerformanceGuaranteeAmount: tender?.additionalPerformanceGuaranteeAmount !== undefined && tender?.additionalPerformanceGuaranteeAmount !== null 
                ? tender.additionalPerformanceGuaranteeAmount 
                : additionalPg,
            stampPaperAmount: tender?.stampPaperAmount !== undefined && tender?.stampPaperAmount !== null 
                ? tender.stampPaperAmount 
                : stamp,
            amountType: baseAmountType,
        };
    }, [tender, l1Amount, performanceGuaranteeDescription, calculateStampPaperValue, calculateAdditionalPG]);

    const form = useForm<SelectionNoticeDetailsFormData>({
        resolver: zodResolver(SelectionNoticeDetailsSchema),
        defaultValues: initialValues,
    });
    
    const { handleSubmit, setValue, getValues, watch, reset, formState: { isDirty } } = form;

    useEffect(() => {
        reset(initialValues);
    }, [initialValues, reset]);

    const handleFormSubmit = (data: SelectionNoticeDetailsFormData) => {
        const formData: Partial<E_tenderFormData> = { ...data };
        if (isNewTender || !tender?.performanceGuaranteeDescription) {
            formData.performanceGuaranteeDescription = performanceGuaranteeDescription;
        }
        if (isNewTender || !tender?.additionalPerformanceGuaranteeDescription) {
            formData.additionalPerformanceGuaranteeDescription = additionalPerformanceGuaranteeDescription;
        }
        if (isNewTender || !tender?.stampPaperDescription) {
            formData.stampPaperDescription = stampPaperDescription;
        }

        onSubmit(formData);
    };

    return (
        <FormProvider {...form}>
            <form onSubmit={handleSubmit(handleFormSubmit)} className="flex flex-col h-auto">
                <DialogHeader className="p-6 pb-4 shrink-0">
                    <DialogTitle>Selection Notice Details</DialogTitle>
                    <DialogDescription>Enter details related to the selection notice.</DialogDescription>
                </DialogHeader>
                <div className="px-6 py-4">
                    <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField name="selectionNoticeDate" control={form.control} render={({ field }) => ( 
                                <FormItem>
                                    <FormLabel>Selection Notice Date</FormLabel>
                                    <FormControl><Input type="date" {...field} value={formatDateForInput(field.value)} /></FormControl>
                                    <FormMessage />
                                </FormItem> 
                            )}/>
                            <FormField name="amountType" control={form.control} render={({ field }) => ( 
                                <FormItem>
                                    <FormLabel>Basis for Calculation</FormLabel>
                                    <Select 
                                        onValueChange={(val) => {
                                            field.onChange(val);
                                            const baseAmount = val === 'Tender Amount' ? tender.estimateAmount : (l1Amount ?? tender.contractAmount ?? undefined);
                                            const pgRateMatch = performanceGuaranteeDescription.match(/(\d+)%/);
                                            const pgRate = pgRateMatch ? parseInt(pgRateMatch[1], 10) / 100 : 0.05;
                                            const pg = baseAmount ? Math.ceil((baseAmount * pgRate) / 100) * 100 : 0;
                                            const stamp = calculateStampPaperValue(baseAmount);
                                            const quotedContractAmount = l1Amount ?? tender.contractAmount ?? undefined;
                                            const additionalPg = calculateAdditionalPG(tender?.estimateAmount ?? undefined, quotedContractAmount);
                                            
                                            setValue('performanceGuaranteeAmount', pg, { shouldValidate: true, shouldDirty: true });
                                            setValue('additionalPerformanceGuaranteeAmount', additionalPg, { shouldValidate: true, shouldDirty: true });
                                            setValue('stampPaperAmount', stamp, { shouldValidate: true, shouldDirty: true });
                                        }} 
                                        defaultValue={field.value ?? undefined} 
                                        value={field.value ?? undefined}
                                    >
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select basis" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="Tender Amount">Tender Amount</SelectItem>
                                            <SelectItem value="Contract Amount">Contract Amount</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem> 
                            )}/>
                            {hasRejectedBids && (
                                <div className="p-3 bg-muted/30 border rounded-md flex items-center col-span-2 gap-3">
                                    <Info className="h-5 w-5 text-primary shrink-0" />
                                    <p className="text-[10px] text-muted-foreground leading-tight">Rejected bids found. You can manually override the agreed amount below if negotiations occurred.</p>
                                </div>
                            )}
                        </div>

                        <Separator />

                        <div className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
                                <FormField name="performanceGuaranteeAmount" control={form.control} render={({ field }) => ( 
                                    <FormItem>
                                        <FormLabel>Performance Guarantee (₹)</FormLabel>
                                        <FormControl>
                                            <Input 
                                                type="number" 
                                                {...field} 
                                                value={field.value ?? ""} 
                                                onChange={e => field.onChange(e.target.value === '' ? null : Number(e.target.value))} 
                                            />
                                        </FormControl>
                                        <FormDescription className="text-[10px] leading-tight">Based on 5% of the contract value (rounded up).</FormDescription>
                                        <FormMessage />
                                    </FormItem> 
                                 )}/>

                                <FormField name="additionalPerformanceGuaranteeAmount" control={form.control} render={({ field }) => ( 
                                    <FormItem>
                                        <FormLabel>Additional PG (₹)</FormLabel>
                                        <FormControl>
                                            <Input 
                                                type="number" 
                                                {...field} 
                                                value={field.value ?? ""} 
                                                onChange={e => field.onChange(e.target.value === '' ? null : Number(e.target.value))} 
                                            />
                                        </FormControl>
                                        <FormDescription className="text-[10px] leading-tight">Required for low bids; based on GWD Rates threshold.</FormDescription>
                                        <FormMessage />
                                    </FormItem> 
                                 )}/>
                                <FormField name="stampPaperAmount" control={form.control} render={({ field }) => ( 
                                    <FormItem>
                                        <FormLabel>Stamp Paper (₹)</FormLabel>
                                        <FormControl>
                                            <Input 
                                                type="number" 
                                                {...field} 
                                                value={field.value ?? ""} 
                                                onChange={e => field.onChange(e.target.value === '' ? null : Number(e.target.value))}
                                            />
                                        </FormControl>
                                        <FormDescription className="text-[10px] leading-tight">Calculated at ₹100 per lakh (min ₹200).</FormDescription>
                                        <FormMessage />
                                    </FormItem> 
                                 )}/>
                            </div>
                        </div>
                    </div>
                </div>
                <DialogFooter className="p-6 pt-4 shrink-0 border-t mt-4">
                    <Button variant="outline" type="button" onClick={onCancel} disabled={isSubmitting}>
                        <X className="mr-2 h-4 w-4" /> Cancel
                    </Button>
                    <Button type="submit" disabled={isSubmitting || !isDirty}>
                        {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />} Update Details
                    </Button>
                </DialogFooter>
            </form>
        </FormProvider>
    );
}
