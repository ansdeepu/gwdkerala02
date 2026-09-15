// src/components/e-tender/NewBidderForm.tsx
"use client";

import React, { useEffect } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, Save, X, UserPlus } from 'lucide-react';
import { z } from 'zod';
import { type Bidder, NewBidderSchema, type NewBidderFormData, BIDDER_TYPES } from '@/lib/schemas/eTenderSchema';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { formatCase } from '@/lib/utils';


const createDefaultBidder = (): NewBidderFormData => ({
    name: '',
    address: '',
    phoneNo: '',
    secondaryPhoneNo: '',
    bidderType: 'Contractor',
    email: '',
    govtOrderAndDate: '',
    maxQuotedPercentageAboveL1: undefined,
    tenderFeeExemption: 'Yes',
    emdExemption: 'Yes',
    performanceGuaranteeExemption: 'Yes',
    additionalPgExemption: 'Yes',
    order: 0,
});

interface NewBidderFormProps {
    onSubmit: (data: NewBidderFormData) => Promise<void>;
    onCancel: () => void;
    isSubmitting: boolean;
    initialData?: Bidder | null;
}

export default function NewBidderForm({ onSubmit, onCancel, isSubmitting, initialData }: NewBidderFormProps) {
    const form = useForm<NewBidderFormData>({
        resolver: zodResolver(NewBidderSchema),
        defaultValues: initialData || createDefaultBidder(),
    });

    const selectedBidderType = form.watch('bidderType');
    const isLabourSociety = selectedBidderType === 'Labour Contract Society' || selectedBidderType === 'Labour Society';

    useEffect(() => {
        if (initialData) {
            form.reset({
                ...createDefaultBidder(),
                ...initialData,
                bidderType: initialData.bidderType === 'Labour Society' ? 'Labour Contract Society' : (initialData.bidderType || 'Contractor'),
                tenderFeeExemption: initialData.tenderFeeExemption || 'Yes',
                emdExemption: initialData.emdExemption || 'Yes',
                performanceGuaranteeExemption: initialData.performanceGuaranteeExemption || 'Yes',
                additionalPgExemption: initialData.additionalPgExemption || 'Yes',
            });
        } else {
            form.reset(createDefaultBidder());
        }
    }, [initialData, form]);

    const handleInternalSubmit = (data: NewBidderFormData) => {
        const formattedData = {
            ...data,
            name: formatCase(data.name) ?? data.name,
            address: formatCase(data.address) ?? data.address
        };
        onSubmit(formattedData);
    };

    return (
        <FormProvider {...form}>
            <form onSubmit={form.handleSubmit(handleInternalSubmit)} className="flex flex-col h-full">
                <DialogHeader className="p-6 pb-4">
                    <DialogTitle>{initialData ? 'Edit Bidder Details' : 'Add New Bidder'}</DialogTitle>
                    <DialogDescription>Enter the contact and registration details for the bidder.</DialogDescription>
                </DialogHeader>
                <div className="flex-1 overflow-y-auto max-h-[65vh] p-6 py-2">
                    <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField name="name" control={form.control} render={({ field }) => ( <FormItem><FormLabel>Bidder Name</FormLabel><FormControl><Input {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem> )}/>
                            <FormField name="address" control={form.control} render={({ field }) => ( <FormItem><FormLabel>Address</FormLabel><FormControl><Textarea {...field} className="min-h-[100px]" value={field.value ?? ''} /></FormControl><FormMessage /></FormItem> )}/>
                        </div>
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField name="phoneNo" control={form.control} render={({ field }) => ( <FormItem><FormLabel>Phone No.</FormLabel><FormControl><Input {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem> )}/>
                            <FormField name="secondaryPhoneNo" control={form.control} render={({ field }) => ( <FormItem><FormLabel>Secondary Phone No.</FormLabel><FormControl><Input {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem> )}/>
                         </div>
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField
                                name="bidderType"
                                control={form.control}
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Bidder Type</FormLabel>
                                        <Select
                                            onValueChange={(val) => field.onChange(val)}
                                            value={field.value === 'Labour Society' ? 'Labour Contract Society' : (field.value || 'Contractor')}
                                        >
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select Bidder Type" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="Contractor">Contractor</SelectItem>
                                                <SelectItem value="Firm">Firm</SelectItem>
                                                <SelectItem value="Labour Contract Society">Labour Contract Society</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField name="email" control={form.control} render={({ field }) => ( <FormItem><FormLabel>Email ID</FormLabel><FormControl><Input type="email" {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem> )}/>
                         </div>

                         {isLabourSociety && (
                            <div className="space-y-4 pt-2">
                                <FormField
                                    name="govtOrderAndDate"
                                    control={form.control}
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Govt order and date</FormLabel>
                                            <FormControl>
                                                <Input
                                                    placeholder="Enter Govt. Order No. and Date"
                                                    {...field}
                                                    value={field.value ?? ''}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <div className="rounded-lg border border-border/80 bg-muted/30 p-4 space-y-4">
                                    <div className="border-b border-border/60 pb-2">
                                        <h4 className="text-sm font-semibold text-foreground">Exemptions & Concessions</h4>
                                    </div>

                                    <FormField
                                        name="maxQuotedPercentageAboveL1"
                                        control={form.control}
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Maximum quoted percentage above L1</FormLabel>
                                                <FormControl>
                                                    <Input
                                                        type="number"
                                                        step="any"
                                                        placeholder="e.g. 10"
                                                        {...field}
                                                        value={(field.value === undefined || field.value === null || (typeof field.value === 'number' && isNaN(field.value))) ? '' : field.value}
                                                        onChange={(e) => {
                                                            const val = e.target.value.trim();
                                                            if (val === '') {
                                                                field.onChange(undefined);
                                                            } else {
                                                                const num = parseFloat(val);
                                                                field.onChange(isNaN(num) ? undefined : num);
                                                            }
                                                        }}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <FormField
                                            name="tenderFeeExemption"
                                            control={form.control}
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Tender Fee Exemption</FormLabel>
                                                    <Select onValueChange={field.onChange} value={field.value || 'Yes'}>
                                                        <FormControl>
                                                            <SelectTrigger>
                                                                <SelectValue placeholder="Select" />
                                                            </SelectTrigger>
                                                        </FormControl>
                                                        <SelectContent>
                                                            <SelectItem value="Yes">Exempted</SelectItem>
                                                            <SelectItem value="No">Not Exempted</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />

                                        <FormField
                                            name="emdExemption"
                                            control={form.control}
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>EMD Exemption</FormLabel>
                                                    <Select onValueChange={field.onChange} value={field.value || 'Yes'}>
                                                        <FormControl>
                                                            <SelectTrigger>
                                                                <SelectValue placeholder="Select" />
                                                            </SelectTrigger>
                                                        </FormControl>
                                                        <SelectContent>
                                                            <SelectItem value="Yes">Exempted</SelectItem>
                                                            <SelectItem value="No">Not Exempted</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <FormField
                                            name="performanceGuaranteeExemption"
                                            control={form.control}
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Performance Guarantee Exemption</FormLabel>
                                                    <Select onValueChange={field.onChange} value={field.value || 'Yes'}>
                                                        <FormControl>
                                                            <SelectTrigger>
                                                                <SelectValue placeholder="Select" />
                                                            </SelectTrigger>
                                                        </FormControl>
                                                        <SelectContent>
                                                            <SelectItem value="Yes">Exempted</SelectItem>
                                                            <SelectItem value="No">Not Exempted</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />

                                        <FormField
                                            name="additionalPgExemption"
                                            control={form.control}
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Additional PG Exemption</FormLabel>
                                                    <Select onValueChange={field.onChange} value={field.value || 'Yes'}>
                                                        <FormControl>
                                                            <SelectTrigger>
                                                                <SelectValue placeholder="Select" />
                                                            </SelectTrigger>
                                                        </FormControl>
                                                        <SelectContent>
                                                            <SelectItem value="Yes">Exempted</SelectItem>
                                                            <SelectItem value="No">Not Exempted</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                </div>
                            </div>
                         )}
                    </div>
                </div>
                <DialogFooter className="p-6 pt-4 mt-auto">
                    <Button variant="outline" type="button" onClick={onCancel} disabled={isSubmitting}>
                        <X className="mr-2 h-4 w-4" /> Cancel
                    </Button>
                    <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />} {initialData ? 'Save Changes' : 'Add Bidder'}
                    </Button>
                </DialogFooter>
            </form>
        </FormProvider>
    );
}
