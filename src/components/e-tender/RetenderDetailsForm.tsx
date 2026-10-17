// src/components/e-tender/RetenderDetailsForm.tsx
"use client";

import React, { useEffect } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, Save, X } from 'lucide-react';
import { RetenderDetailsSchema, type RetenderDetails } from '@/lib/schemas/eTenderSchema';
import { v4 as uuidv4 } from 'uuid';
import { formatDateForInput, toDateOrNull } from './utils';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '../ui/select';
import { format, isValid } from 'date-fns';

interface RetenderDetailsFormProps {
    onSubmit: (data: RetenderDetails) => void;
    onCancel: () => void;
    isSubmitting: boolean;
    initialData?: RetenderDetails | null;
}

const createDefaultRetender = (): RetenderDetails => ({
    id: uuidv4(),
    retenderDate: null,
    dateTimeOfPublishingRetender: null,
    lastDateOfReceipt: null,
    dateOfOpeningTender: null,
});

const getInitialRetenderValues = (initialData?: RetenderDetails | null): RetenderDetails => {
    if (!initialData) return createDefaultRetender();
    return {
        id: initialData.id || uuidv4(),
        retenderDate: formatDateForInput(initialData.retenderDate),
        dateTimeOfPublishingRetender: initialData.dateTimeOfPublishingRetender ? toDateOrNull(initialData.dateTimeOfPublishingRetender) : null,
        lastDateOfReceipt: initialData.lastDateOfReceipt ? toDateOrNull(initialData.lastDateOfReceipt) : null,
        dateOfOpeningTender: initialData.dateOfOpeningTender ? toDateOrNull(initialData.dateOfOpeningTender) : null,
    };
};

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
    
    const h = d ? (d.getHours() % 12 || 12) : 10;
    const m = d ? d.getMinutes() : 0;
    const ampm = d ? (d.getHours() >= 12 ? 'PM' : 'AM') : 'AM';

    const handleDateChange = (newDate: string) => {
        if (!newDate) {
            onChange(null);
            return;
        }
        // Calculate 24-hour hour based on currently selected h and ampm
        let hour24 = h;
        if (ampm === 'PM' && h !== 12) hour24 += 12;
        if (ampm === 'AM' && h === 12) hour24 = 0;
        const parts = newDate.split('-');
        if (parts.length === 3) {
            const date = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10), hour24, m, 0, 0);
            onChange(date);
        } else {
            const date = new Date(newDate);
            date.setHours(hour24, m, 0, 0);
            onChange(date);
        }
    };

    const handleTimeChange = (newH: number, newM: number, newAmpm: string) => {
        if (!datePart) return;
        // Calculate 24-hour hour based on newly selected newH and newAmpm
        let hour24 = newH;
        if (newAmpm === 'PM' && newH !== 12) hour24 += 12;
        if (newAmpm === 'AM' && newH === 12) hour24 = 0;
        const parts = datePart.split('-');
        if (parts.length === 3) {
            const date = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10), hour24, newM, 0, 0);
            onChange(date);
        } else {
            const date = new Date(datePart);
            date.setHours(hour24, newM, 0, 0);
            onChange(date);
        }
    };

    return (
        <FormItem className="space-y-1">
            <FormLabel>{label}</FormLabel>
            <div className="flex items-center gap-2 flex-nowrap">
                <FormControl>
                    <Input 
                        type="date" 
                        className="w-[150px] shrink-0" 
                        value={datePart} 
                        onChange={(e) => handleDateChange(e.target.value)}
                        disabled={disabled}
                    />
                </FormControl>
                <div className="flex items-center gap-1 shrink-0">
                    <Select 
                        key={`hour-${h}`}
                        value={String(h)} 
                        onValueChange={(val) => handleTimeChange(parseInt(val, 10), m, ampm)}
                        disabled={disabled || !datePart}
                    >
                        <SelectTrigger className="w-[65px] h-10 shrink-0">
                            <SelectValue placeholder="10" />
                        </SelectTrigger>
                        <SelectContent className="max-h-60">
                            {Array.from({ length: 12 }, (_, i) => String(i + 1)).map(hour => (
                                <SelectItem key={hour} value={hour}>{hour}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <span className="font-bold px-0.5 shrink-0">:</span>
                    <Select 
                        key={`min-${m}`}
                        value={String(m).padStart(2, '0')} 
                        onValueChange={(val) => handleTimeChange(h, parseInt(val, 10), ampm)}
                        disabled={disabled || !datePart}
                    >
                        <SelectTrigger className="w-[65px] h-10 shrink-0">
                            <SelectValue placeholder="00" />
                        </SelectTrigger>
                        <SelectContent className="max-h-60">
                            {Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0')).map(min => (
                                <SelectItem key={min} value={min}>{min}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <Select 
                        key={`ampm-${ampm}`}
                        value={ampm} 
                        onValueChange={(val) => handleTimeChange(h, m, val)}
                        disabled={disabled || !datePart}
                    >
                        <SelectTrigger className="w-[75px] h-10 shrink-0">
                            <SelectValue placeholder="AM" />
                        </SelectTrigger>
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

export default function RetenderDetailsForm({ onSubmit, onCancel, isSubmitting, initialData }: RetenderDetailsFormProps) {
    const form = useForm<RetenderDetails>({
        resolver: zodResolver(RetenderDetailsSchema),
        defaultValues: getInitialRetenderValues(initialData),
    });

    const { formState: { isDirty } } = form;

    useEffect(() => {
        form.reset(getInitialRetenderValues(initialData));
    }, [initialData, form]);

    return (
        <FormProvider {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col h-full">
                <DialogHeader className="p-6 pb-4 shrink-0 border-b">
                    <DialogTitle>{initialData?.id ? 'Edit Retender' : 'Add New Retender'}</DialogTitle>
                    <DialogDescription>Enter the new dates for the retender process.</DialogDescription>
                </DialogHeader>
                <div className="flex-1 min-h-0">
                    <ScrollArea className="h-full px-6 py-4">
                        <div className="space-y-4">
                            <FormField name="retenderDate" control={form.control} render={({ field }) => (
                                <FormItem><FormLabel>Re-Tender Date</FormLabel><FormControl><Input type="date" {...field} value={formatDateForInput(field.value)} onChange={(e) => field.onChange(e.target.value || null)}/></FormControl><FormMessage /></FormItem>
                            )}/>
                            <FormField 
                                name="dateTimeOfPublishingRetender" 
                                control={form.control} 
                                render={({ field }) => (
                                    <DateTimePicker12h 
                                        label="Date & Time of Publishing Retender" 
                                        value={field.value} 
                                        onChange={field.onChange} 
                                    />
                                )}
                            />
                            <FormField 
                                name="lastDateOfReceipt" 
                                control={form.control} 
                                render={({ field }) => (
                                    <DateTimePicker12h 
                                        label="New Last Date & Time" 
                                        value={field.value} 
                                        onChange={field.onChange} 
                                    />
                                )}
                            />
                            <FormField 
                                name="dateOfOpeningTender" 
                                control={form.control} 
                                render={({ field }) => (
                                    <DateTimePicker12h 
                                        label="New Opening Date & Time" 
                                        value={field.value} 
                                        onChange={field.onChange} 
                                    />
                                )}
                            />
                        </div>
                    </ScrollArea>
                </div>
                <DialogFooter className="p-6 pt-4 shrink-0 mt-auto border-t">
                    <Button variant="outline" type="button" onClick={onCancel} disabled={isSubmitting}>
                        <X className="mr-2 h-4 w-4" /> Cancel
                    </Button>
                    <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />} Save
                    </Button>
                </DialogFooter>
            </form>
        </FormProvider>
    );
}
