
// src/components/investigation/InvestigationDataEntryForm.tsx
"use client";

import React from 'react';
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useFieldArray, type FieldErrors, FormProvider, useWatch } from "react-hook-form";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Form,
} from "@/components/ui/form";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

import { Input } from "@/components/ui/input";
import { BankSelect } from "@/components/shared/BankSelect";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { Loader2, Trash2, PlusCircle, X, Save, Clock, Eye, ArrowUpDown, Copy, Info, ChevronLeft, ChevronRight, Edit, Move, Printer, FileText, CheckCircle2, ClipboardList, Receipt, RefreshCw, MapPin, CreditCard, BarChart3 } from "lucide-react";
import { getSiteNameStatusColorClass, renderWorkStatusPillBadge } from "@/lib/workStatusUtils";
import { calculateSiteExpenditure } from "@/components/shared/DataEntryForm";
import { MalayalamInput } from "@/components/ui/malayalam-input-helper";
import { type InvestigationReportDocType } from '@/components/investigation/InvestigationReportViewer';
import {
  DataEntrySchema,
  type DataEntryFormData,
  siteWorkStatusOptions,
  sitePurposeOptions,
  type SitePurpose,
  siteDiameterOptions,
  siteTypeOfRigOptions,
  fileStatusOptions,
  remittedAccountOptions,
  type RemittanceDetailFormData,
  RemittanceDetailSchema,
  type PaymentDetailFormData,
  PaymentDetailSchema,
  SiteDetailSchema,
  type SiteDetailFormData,
  applicationTypeDisplayMap,
  type ApplicationType,
  siteConditionsOptions,
  type UserRole,
  type SiteWorkStatus,
  constituencyOptions,
  type Constituency,
  INVESTIGATION_GOVT_TYPES,
  INVESTIGATION_PRIVATE_TYPES,
  INVESTIGATION_COMPLAINT_TYPES,
  LOGGING_PUMPING_TEST_PURPOSE_OPTIONS,
  LOGGING_PUMPING_TEST_GOVT_TYPES,
  LOGGING_PUMPING_TEST_PRIVATE_TYPES,
  INVESTIGATION_WORK_STATUS_OPTIONS,
  type Bidder,
  type MediaItem,
  typeOfWellOptions,
  type Designation,
  type ReappropriationDetailFormData,
  ReappropriationDetailSchema,
  PUBLIC_DEPOSIT_APPLICATION_TYPES,
  PRIVATE_APPLICATION_TYPES,
  COLLECTOR_APPLICATION_TYPES,
  PLAN_FUND_APPLICATION_TYPES,
  LOGGING_PUMPING_TEST_WORK_STATUS_OPTIONS,
  INVESTIGATION_FILE_STATUS_OPTIONS,
  type StaffMember,
} from '@/lib/schemas';
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useFileEntries } from "@/hooks/useFileEntries";
import { usePendingUpdates } from "@/hooks/usePendingUpdates";
import { z } from "zod";
import { useAuth, type UserProfile } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { getFirestore, doc, updateDoc, serverTimestamp, query, collection, where, getDocs, Timestamp, writeBatch, addDoc } from "firebase/firestore";
import { app } from "@/lib/firebase";
import { useDataStore } from "@/hooks/use-data-store";
import { 
  getModuleCategoryFromData,
  checkFileNumberConflict,
  findTargetFileEntry,
  matchPageTypeWithModuleCategory
} from "@/lib/moduleClassification";
import { ScrollArea } from "../ui/scroll-area";
import { format, isValid, parseISO } from "date-fns";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter as TableFooterComponent } from "@/components/ui/table";
import { v4 as uuidv4 } from 'uuid';
import { Tooltip, TooltipProvider, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Badge } from "@/components/ui/badge";
import InvestigationSiteDialog from '@/components/investigation/InvestigationSiteDialog';
import { MoveCopySiteDialog } from '../shared/MoveCopyDialogs';

const db = getFirestore(app);

const getStatusColorClass = (status: SiteWorkStatus | undefined | null): string => {
    return getSiteNameStatusColorClass(status);
};

const renderSiteStatusBadge = (status?: string | null) => {
  return renderWorkStatusPillBadge(status, "ml-2");
};

const toDateOrNull = (value: any): Date | null => {
    if (value === null || value === undefined || value === '') return null;
    if (value instanceof Date && isValid(value)) return value;
    if (typeof value === 'object' && value !== null && typeof value.seconds === 'number') {
        const d = new Date(value.seconds * 1000 + (value.nanoseconds || 0) / 1e6);
        if (isValid(d)) return d;
    }
    if (typeof value === 'string') {
        let d = parseISO(value); 
        if (isValid(d)) return d;
        d = new Date(value);
        if (isValid(d)) return d;
    }
    return null;
 };

const calculatePaymentEntryTotalGlobal = (payment: PaymentDetailFormData | undefined): number => {
  if (!payment) return 0;
  return (Number(payment.revenueHead) || 0) + (Number(payment.contractorsPayment) || 0) + (Number(payment.gst) || 0) + (Number(payment.incomeTax) || 0) + (Number(payment.kbcwb) || 0) + (Number(payment.refundToParty) || 0);
};

const getFormattedErrorMessages = (errors: FieldErrors<DataEntryFormData>): string[] => {
  const messages = new Set<string>();

  const formattedFieldName = (fieldName: string) => {
    return fieldName.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
  };

  function findMessages(obj: any, parentPath: string[] = []) {
    if (!obj) return;
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        const value = obj[key];
        const newPath = [...parentPath, key];
        
        if (value?.message && typeof value.message === 'string') {
          const pathString = newPath.map((part, index) => {
              if (!isNaN(parseInt(part))) {
                  const prevPart = newPath[index - 1];
                  const singular = prevPart.endsWith('s') ? prevPart.slice(0, -1) : prevPart;
                  return `${formattedFieldName(singular)} #${parseInt(part) + 1}`;
              }
              return formattedFieldName(part);
          }).join(' > ');
          messages.add(`${pathString}: ${value.message}`);
        } else if (value && typeof value === 'object' && key !== 'root') {
          findMessages(value, newPath);
        }
      }
    }
  }

  findMessages(errors);
  return Array.from(messages);
};

const createDefaultRemittanceDetail = (): RemittanceDetailFormData => ({ id: uuidv4(), amountRemitted: undefined, dateOfRemittance: "", remittedAccount: "Bank", remittanceRemarks: "" });
const createDefaultReappropriationDetail = (): ReappropriationDetailFormData => ({ type: "Outward", refFileNo: "", siteName: "", asGiven: undefined, expenditure: null, amount: undefined, date: "", remarks: "", pageType: "GW Investigation", fileDetails: "" });
const createDefaultPaymentDetail = (): PaymentDetailFormData => ({ id: uuidv4(), remittanceId: null, dateOfPayment: "", paymentAccount: "Bank", nameOfSite: "", revenueHead: undefined, contractorsPayment: undefined, gst: undefined, incomeTax: undefined, kbcwb: undefined, refundToParty: undefined, totalPaymentPerEntry: 0, paymentRemarks: "" });

const DetailRow = ({ label, value, className }: { label: string; value: any, className?: string }) => {
    if (value === null || value === undefined || value === '' || (Array.isArray(value) && value.length === 0)) {
        return null;
    }

    let displayValue = String(value);

    if (label.toLowerCase().includes('date') && value) {
        try {
            displayValue = format(new Date(value), "dd/MM/yyyy");
        } catch (e) { /* Keep original string if formatting fails */ }
    } else if (typeof value === 'number') {
        displayValue = value.toLocaleString('en-IN');
    }

    return (
        <div className={className}>
            <dt className="text-sm font-medium text-muted-foreground">{label}</dt>
            <dd className="text-sm font-semibold">{displayValue}</dd>
        </div>
    );
};


interface DataEntryFormProps {
    fileNoToEdit?: string;
    initialData: DataEntryFormData;
    allStaffMembers: StaffMember[];
    userRole?: UserRole;
    workTypeContext: 'public' | 'private' | 'collector' | 'planFund' | 'gwInvestigation' | 'loggingPumpingTest' | null;
    returnPath: string;
    pageToReturnTo: string | null;
    isFormDisabled?: boolean;
    allLsgConstituencyMaps: any[];
}

const formatDateForInput = (date: Date | string | null | undefined): string => {
    if (!date) return "";
    try { return format(new Date(date), 'yyyy-MM-dd'); } catch { return ""; }
};

const ApplicationDialogContent = ({ initialData, onConfirm, onCancel, workTypeContext, isEditing, fileIdToEdit }: {
    initialData: any,
    onConfirm: (data: any) => void,
    onCancel: () => void,
    workTypeContext: string | null,
    isEditing: boolean,
    fileIdToEdit?: string | null
}) => {
    const { user } = useAuth();
    const { toast } = useToast();
    const [isChecking, setIsChecking] = useState(false);
    const [data, setData] = useState({
        ...initialData,
        applicationType: initialData?.applicationType || undefined,
        category: initialData?.category || undefined,
    });
    const [errors, setErrors] = useState<{ fileNo?: string; applicantName?: string; applicationType?: string; category?: string; }>({});

    const pageTitle = workTypeContext === 'loggingPumpingTest' ? 'Logging & Pumping Test' : 'GW Investigation';

    const filteredAppTypeOptions: ApplicationType[] = useMemo(() => {
        let options: ApplicationType[] = [];
        if (workTypeContext === 'gwInvestigation') {
            if (data.category === 'Govt') options = [...INVESTIGATION_GOVT_TYPES];
            else if (data.category === 'Private') options = [...INVESTIGATION_PRIVATE_TYPES];
            else if (data.category === 'Complaints') options = [...INVESTIGATION_COMPLAINT_TYPES];
        }
        return Array.from(new Set(options));
    }, [data.category, workTypeContext]);

    useEffect(() => {
        if (filteredAppTypeOptions.length === 1 && data.applicationType !== filteredAppTypeOptions[0]) {
            setData((prev: any) => ({ ...prev, applicationType: filteredAppTypeOptions[0] }));
        }
    }, [filteredAppTypeOptions, data.applicationType]);

    const handleChange = (key: string, value: any) => {
        let finalValue = value;
        if (key === 'fileNo' && typeof value === 'string') {
            finalValue = value.replace(/^[a-zA-Z]{2,}[a-zA-Z\s\/\\-]*?(?=\d)/, '');
        }
        setData((prev: any) => ({ ...prev, [key]: finalValue }));
        if (finalValue && String(finalValue).trim()) {
            setErrors(prev => ({...prev, [key]: undefined}));
        }
         if (key === 'category') {
            setData((prev: any) => ({ ...prev, applicationType: undefined }));
        }
    };

    const handleSave = async () => {
        const fileNoCleaned = data.fileNo ? String(data.fileNo).replace(/^[a-zA-Z]{2,}[a-zA-Z\s\/\\-]*?(?=\d)/, '').trim() : '';
        const newErrors: { fileNo?: string; applicantName?: string; applicationType?: string; category?: string; } = {};
        if (!fileNoCleaned) {
            newErrors.fileNo = "File No is required.";
        }
        if (!data.applicantName?.trim()) {
            newErrors.applicantName = "Applicant Name is required.";
        }
        if (!data.applicationType) {
            newErrors.applicationType = "Type of Application is required.";
        }
        if (!data.category) {
            newErrors.category = "Category is required.";
        }

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        const finalData = { ...data, fileNo: fileNoCleaned };

        if (user?.officeLocation && fileNoCleaned) {
            setIsChecking(true);
            try {
                const fileNoTrimmed = fileNoCleaned.toUpperCase();
                const q = query(collection(db, `offices/${user.officeLocation.toLowerCase()}/fileEntries`), where("fileNo", "==", fileNoTrimmed));
                const querySnapshot = await getDocs(q);
                const existingDocs = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

                const conflictCheck = checkFileNumberConflict(
                    fileNoCleaned,
                    'gw_investigation',
                    isEditing ? fileIdToEdit : null,
                    existingDocs
                );

                if (conflictCheck.conflict) {
                    toast({
                        title: "Duplicate File Number",
                        description: conflictCheck.errorMessage || "This file number is already used for another GW Investigation file.",
                        variant: "destructive",
                    });
                    setIsChecking(false);
                    return;
                }
            } catch (error: any) {
                toast({
                    title: "Validation Error",
                    description: error?.message || "Could not verify file number. Please try again.",
                    variant: "destructive",
                });
                setIsChecking(false);
                return;
            }
            setIsChecking(false);
        }

        onConfirm(finalData);
    };

    const categoryOptions = useMemo(() => {
        if (workTypeContext === 'loggingPumpingTest') return ['Govt', 'Private'];
        if (workTypeContext === 'gwInvestigation') return ['Govt', 'Private', 'Complaints'];
        return [];
    }, [workTypeContext]);

    return (
      <div className="flex flex-col h-auto">
        <DialogHeader className="p-6 pb-4">
          <DialogTitle>{pageTitle} Application Details</DialogTitle>
        </DialogHeader>
        <div className="p-6 pt-0 space-y-4 flex-1">
             <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-start">
                <div className="space-y-2 col-span-1 md:col-span-1">
                    <Label htmlFor="fileNo">File No *</Label>
                    <Input id="fileNo" value={data.fileNo || ''} onChange={(e) => handleChange('fileNo', e.target.value)} disabled={isChecking}/>
                    <p className="text-[11px] text-muted-foreground leading-snug">
                        Office code (e.g., GWDKLM) is not required. Enter only number/year (e.g., 1956/2023).
                    </p>
                    {errors.fileNo && <p className="text-xs text-destructive mt-1">{errors.fileNo}</p>}
                </div>
                <div className="space-y-2 col-span-1 md:col-span-2">
                    <Label htmlFor="applicantName">Name & Address of Institution/Applicant *</Label>
                    <Textarea id="applicantName" value={data.applicantName || ''} onChange={(e) => handleChange('applicantName', e.target.value)} className="min-h-[40px]" disabled={isChecking}/>
                    {errors.applicantName && <p className="text-xs text-destructive mt-1">{errors.applicantName}</p>}
                </div>
                <div className="space-y-2 col-span-1 md:col-span-2">
                    <Label htmlFor="applicantNameMl">Name & Address of Institution/Applicant (Malayalam)</Label>
                    <MalayalamInput
                      id="applicantNameMl"
                      value={data.applicantNameMl || ''}
                      onChange={(val) => handleChange('applicantNameMl', val)}
                      englishValue={data.applicantName || ''}
                      multiline
                      rows={2}
                      disabled={isChecking}
                    />
                </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <div className="space-y-2"><Label>Phone No.</Label><Input value={data.phoneNo || ''} onChange={(e) => handleChange('phoneNo', e.target.value)} disabled={isChecking} /></div>
                <div className="space-y-2"><Label>Secondary Mobile No.</Label><Input value={data.secondaryMobileNo || ''} onChange={(e) => handleChange('secondaryMobileNo', e.target.value)} disabled={isChecking}/></div>
                <div className="space-y-2"><Label>Email ID</Label><Input type="email" value={data.emailId || ''} onChange={(e) => handleChange('emailId', e.target.value)} disabled={isChecking}/></div>

                <div className="space-y-2">
                    <Label>Category *</Label>
                    <Select onValueChange={(value) => handleChange('category', value)} value={data.category}>
                        <SelectTrigger><SelectValue placeholder="Select Category" /></SelectTrigger>
                        <SelectContent>
                            {categoryOptions.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
                        </SelectContent>
                    </Select>
                    {errors.category && <p className="text-xs text-destructive mt-1">{errors.category}</p>}
                </div>

                 <div className="space-y-2">
                    <Label>Type of Application *</Label>
                    {filteredAppTypeOptions.length === 1 ? (
                        <Input
                            value={applicationTypeDisplayMap[filteredAppTypeOptions[0] as ApplicationType] || filteredAppTypeOptions[0]}
                            readOnly
                            className="bg-muted font-semibold"
                        />
                    ) : (
                        <Select onValueChange={(value) => handleChange('applicationType', value as ApplicationType)} value={data.applicationType || ''} disabled={!data.category || isChecking}>
                            <SelectTrigger><SelectValue placeholder={!data.category ? "Select Category First" : "Select Type"} /></SelectTrigger>
                            <SelectContent className="max-h-80">
                                {filteredAppTypeOptions.map((o: ApplicationType) => <SelectItem key={o} value={o}>{applicationTypeDisplayMap[o] || o.replace(/_/g, " ")}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    )}
                     {errors.applicationType && <p className="text-xs text-destructive mt-1">{errors.applicationType}</p>}
                </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-2 border-t">
                <div className="space-y-2">
                    <Label htmlFor="bankName">Bank Name</Label>
                    <BankSelect id="bankName" value={data.bankName || ''} onChange={(val) => handleChange('bankName', val)} disabled={isChecking}/>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="branch">Branch</Label>
                    <Input id="branch" placeholder="e.g. Main Branch" value={data.branch || ''} onChange={(e) => handleChange('branch', e.target.value)} disabled={isChecking}/>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="bankAccountNo">Bank Account No.</Label>
                    <Input id="bankAccountNo" placeholder="e.g. 85829024542" value={data.bankAccountNo || ''} onChange={(e) => handleChange('bankAccountNo', e.target.value)} disabled={isChecking}/>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="ifsc">IFSC</Label>
                    <Input id="ifsc" placeholder="e.g. SBIN0012880" value={data.ifsc || ''} onChange={(e) => handleChange('ifsc', e.target.value)} disabled={isChecking}/>
                </div>
            </div>
        </div>
        <DialogFooter className="px-6 pb-6"><Button variant="outline" onClick={onCancel} disabled={isChecking}>Cancel</Button><Button onClick={handleSave} disabled={isChecking}>{isChecking ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}Save</Button></DialogFooter>
      </div>
    );
};

const RemittanceDialogContent = ({ initialData, onConfirm, onCancel, category }: { initialData?: any, onConfirm: (data: any) => void, onCancel: () => void, category?: string | null }) => {
    const form = useForm<RemittanceDetailFormData>({
      resolver: zodResolver(RemittanceDetailSchema),
      defaultValues: {
          ...createDefaultRemittanceDetail(),
          ...initialData,
          dateOfRemittance: formatDateForInput(initialData?.dateOfRemittance),
      },
    });

    const handleConfirmSubmit = (data: RemittanceDetailFormData) => {
        onConfirm(data);
    };

    const availableRemittanceAccounts = ["Bank", "STSB", "Revenue Head"];

    return (
      <Form {...form}>
        <form
          onSubmit={(e) => {
            e.stopPropagation();
            e.preventDefault();
            form.handleSubmit(handleConfirmSubmit)(e);
          }}
        >
            <DialogHeader className="p-6 pb-4">
                <DialogTitle>Remittance Details</DialogTitle>
                {category === 'Complaints' && (
                    <div className="flex items-start gap-2 p-3 mt-2 text-sm text-amber-800 bg-amber-100/50 border border-amber-200 rounded-md">
                        <Info className="h-4 w-4 mt-0.5 shrink-0" />
                        <p>For the &apos;Complaints&apos; category, remittance is not applicable. Please enter the amount as zero and select any bank account to proceed.</p>
                    </div>
                )}
            </DialogHeader>
            <div className="p-6 pt-4 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <FormField name="dateOfRemittance" control={form.control} render={({ field }) => ( <FormItem><FormLabel>Date <span className="text-destructive">*</span></FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem> )}/>
                    <FormField name="amountRemitted" control={form.control} render={({ field }) => ( 
                        <FormItem>
                            <FormLabel>Amount (₹)</FormLabel>
                            <FormControl>
                                <Input 
                                    type="number" 
                                    {...field} 
                                    value={field.value ?? ""} 
                                    onChange={e => field.onChange(e.target.value === '' ? null : Number(e.target.value))} 
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem> 
                    )}/>
                    <FormField name="remittedAccount" control={form.control} render={({ field }) => ( 
                        <FormItem>
                            <FormLabel>Account <span className="text-destructive">*</span></FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl><SelectTrigger><SelectValue placeholder="Select Account" /></SelectTrigger></FormControl>
                                <SelectContent>
                                    {availableRemittanceAccounts.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                                </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem> 
                    )}/>
                </div>
                <FormField name="remittanceRemarks" control={form.control} render={({ field }) => ( <FormItem><FormLabel>{category === 'Complaints' ? 'Remarks' : 'Remittance Remarks'}</FormLabel><FormControl><Textarea {...field} value={field.value ?? ''} placeholder="Add any remarks for this entry..." /></FormControl><FormMessage /></FormItem> )}/>
            </div>
            <DialogFooter className="p-6 pt-4">
                <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
                <Button type="submit">Save</Button>
            </DialogFooter>
        </form>
    </Form>
    );
};

const ReappropriationDialogContent = ({ initialData, onConfirm, onCancel }: { initialData?: any, onConfirm: (data: any) => void, onCancel: () => void }) => {
    const { allFileEntries, allArsEntries } = useDataStore();
    const form = useForm<ReappropriationDetailFormData>({
      resolver: zodResolver(ReappropriationDetailSchema),
      defaultValues: {
          ...createDefaultReappropriationDetail(),
          ...initialData,
          asReceived: initialData?.asReceived !== undefined ? initialData.asReceived : undefined,
          asGiven: initialData?.asGiven !== undefined ? initialData.asGiven : (initialData?.amount !== undefined ? initialData.amount : undefined),
          expenditure: initialData?.expenditure !== undefined ? initialData.expenditure : null,
          date: formatDateForInput(initialData?.date),
      },
    });

    const handleConfirmSubmit = (data: ReappropriationDetailFormData) => {
        const asGivenVal = Number(data.asGiven) || 0;
        const expVal = (data.expenditure !== null && data.expenditure !== undefined && !isNaN(Number(data.expenditure)) && Number(data.expenditure) > 0)
            ? Number(data.expenditure)
            : null;

        let effectiveAmount = asGivenVal;
        if (expVal !== null && expVal > 0) {
            effectiveAmount = asGivenVal > 0 ? Math.min(expVal, asGivenVal) : expVal;
        } else if (asGivenVal > 0) {
            effectiveAmount = asGivenVal;
        }

        onConfirm({
            ...data,
            amount: effectiveAmount,
        });
    };

    const watchedPageType = useWatch({ control: form.control, name: "pageType" });
    const watchedFileNo = useWatch({ control: form.control, name: "refFileNo" });
    const watchedSiteName = useWatch({ control: form.control, name: "siteName" });

    const prevSelectionRef = useRef<string | null>(
      initialData ? `${initialData.pageType || ''}|${initialData.refFileNo || ''}|${initialData.siteName || ''}` : null
    );

    const availableSiteOptions = useMemo(() => {
        if (!watchedPageType || !watchedFileNo) return [];
        const foundEntry = findTargetFileEntry(watchedFileNo, watchedPageType, allFileEntries, allArsEntries);
        if (!foundEntry) return [];

        if (watchedPageType === 'ARS' || foundEntry.arsTypeOfScheme) {
            if (!foundEntry?.nameOfSite) return [];
            const name = foundEntry.nameOfSite.trim();
            const purpose = (foundEntry.purpose || foundEntry.arsTypeOfScheme || '').trim();
            if (purpose && !name.includes(`(${purpose})`)) {
                return [`${name} (${purpose})`];
            }
            return [name];
        } else {
            if (!foundEntry?.siteDetails) return [];
            return (foundEntry.siteDetails || [])
                .map((s: any) => {
                    const name = (s.nameOfSite || s.siteName || '').trim();
                    const purpose = (s.purpose || '').trim();
                    if (!name) return '';
                    if (purpose && !name.includes(`(${purpose})`)) {
                        return `${name} (${purpose})`;
                    }
                    return name;
                })
                .filter((name: any): name is string => Boolean(name && typeof name === 'string' && name.trim()));
        }
    }, [watchedPageType, watchedFileNo, allFileEntries, allArsEntries]);

    const suggestions = useMemo(() => {
        if (!watchedPageType) return [];
        
        let filtered: string[] = [];
        if (watchedPageType === 'ARS') {
            filtered = allArsEntries.map(e => e.fileNo).filter(Boolean);
        } else {
            const source = allFileEntries.filter(entry => {
                const appType = entry.applicationType as any;
                if (watchedPageType === "Deposit Work") return PUBLIC_DEPOSIT_APPLICATION_TYPES.includes(appType) || PRIVATE_APPLICATION_TYPES.includes(appType) || COLLECTOR_APPLICATION_TYPES.includes(appType) || PLAN_FUND_APPLICATION_TYPES.includes(appType);
                
                const hasInvestigation = entry.siteDetails?.some(s => s.purpose === 'GW Investigation');
                const hasLoggingPumping = entry.siteDetails?.some(s => s.purpose && LOGGING_PUMPING_TEST_PURPOSE_OPTIONS.includes(s.purpose as any));
                
                if (watchedPageType === "GW Investigation") return hasInvestigation && !hasLoggingPumping;
                if (watchedPageType === "Logging & Pumping Test") return hasLoggingPumping && !hasInvestigation;
                
                return false;
            });
            filtered = source.map(e => e.fileNo).filter(Boolean);
        }
        return Array.from(new Set(filtered)).sort();
    }, [watchedPageType, allFileEntries, allArsEntries]);

    useEffect(() => {
        if (!watchedPageType || !watchedFileNo) {
            form.setValue('fileDetails', '');
            return;
        }

        const foundEntry = findTargetFileEntry(watchedFileNo, watchedPageType, allFileEntries, allArsEntries);

        if (foundEntry) {
            const applicant = foundEntry.applicantName ? foundEntry.applicantName.trim() : (foundEntry.nameOfSite || 'N/A');
            let formattedSite = '';
            if (watchedSiteName) {
                formattedSite = watchedSiteName;
            } else if (watchedPageType === 'ARS' || foundEntry.arsTypeOfScheme) {
                formattedSite = `${foundEntry.nameOfSite || 'N/A'}${foundEntry.arsTypeOfScheme ? ` (${foundEntry.arsTypeOfScheme})` : ''}`;
            } else {
                const sites = foundEntry.siteDetails || [];
                if (sites.length === 1) {
                    const s = sites[0];
                    formattedSite = `${s.nameOfSite || 'N/A'}${s.purpose ? ` (${s.purpose})` : ''}`;
                } else if (sites.length > 1) {
                    formattedSite = sites.map((s: any) => `${s.nameOfSite || 'N/A'}${s.purpose ? ` (${s.purpose})` : ''}`).join(', ');
                }
            }

            let finalDetails = '';
            if (formattedSite) {
                finalDetails = `${applicant}, Site: ${formattedSite}`;
            } else {
                finalDetails = applicant;
            }
            form.setValue('fileDetails', finalDetails);
        } else {
            form.setValue('fileDetails', 'File not found in database.');
        }
    }, [watchedPageType, watchedFileNo, watchedSiteName, allFileEntries, allArsEntries, form]);

    useEffect(() => {
        if (availableSiteOptions.length === 1 && !form.getValues('siteName')) {
            form.setValue('siteName', availableSiteOptions[0]);
        }
    }, [availableSiteOptions, form]);

    useEffect(() => {
        if (!watchedFileNo) {
            form.setValue('expenditure', null);
            prevSelectionRef.current = `${watchedPageType || ''}||`;
            return;
        }

        const currentKey = `${watchedPageType || ''}|${watchedFileNo || ''}|${watchedSiteName || ''}`;

        const targetEntry = findTargetFileEntry(watchedFileNo, watchedPageType, allFileEntries, allArsEntries);
        const isGw = (watchedPageType || '').trim().toLowerCase().includes('investigation') || (targetEntry && getModuleCategoryFromData(targetEntry) === 'gw_investigation');

        if (!targetEntry) {
            form.setValue('expenditure', isGw ? 0 : null);
            prevSelectionRef.current = currentKey;
            return;
        }

        const targetSites = (targetEntry as any).siteDetails || (targetEntry as any).sites || [];
        const targetPayments = (targetEntry as any).paymentDetails || (targetEntry as any).payments || [];

        let calculatedExp = 0;
        if (watchedSiteName) {
            const formatSiteName = (s: any) => {
                const n = (s.nameOfSite || s.siteName || '').trim();
                const p = (s.purpose || s.arsTypeOfScheme || '').trim();
                if (!n) return '';
                if (p && !n.toLowerCase().includes(`(${p.toLowerCase()})`)) return `${n} (${p})`.toLowerCase();
                return n.toLowerCase();
            };

            const tNameFull = watchedSiteName.trim().toLowerCase();
            const tNameSiteOnly = tNameFull.includes('site: ') ? tNameFull.split('site: ')[1].trim() : tNameFull;

            let matchedSite = targetSites.find((s: any) => {
                const sName = formatSiteName(s);
                return sName && (sName === tNameFull || sName === tNameSiteOnly);
            });

            if (!matchedSite) {
                matchedSite = targetSites.find((s: any) => {
                    const sName = formatSiteName(s);
                    if (!sName || sName.length < 5) return false;
                    return tNameFull.includes(sName) || sName.includes(tNameSiteOnly);
                });
            }

            if (matchedSite) {
                const exp = calculateSiteExpenditure(matchedSite, targetPayments);
                calculatedExp = exp > 0 ? exp : (isGw ? 0 : (Number(matchedSite.totalExpenditure) || 0));
            } else {
                calculatedExp = 0;
            }
        } else {
            const totalExp = targetSites.reduce((sum: number, s: any) => {
                const exp = calculateSiteExpenditure(s, targetPayments);
                return sum + (exp > 0 ? exp : (isGw ? 0 : (Number(s.totalExpenditure) || 0)));
            }, 0);
            calculatedExp = totalExp > 0 ? totalExp : (isGw ? 0 : (Number((targetEntry as any).totalExpenditure) || 0));
        }

        form.setValue('expenditure', targetEntry ? calculatedExp : (isGw ? 0 : (calculatedExp > 0 ? calculatedExp : null)));
        prevSelectionRef.current = currentKey;
    }, [watchedPageType, watchedFileNo, watchedSiteName, allFileEntries, allArsEntries, form]);

    const pageTypeOptions = [
        "Deposit Work",
        "GW Investigation",
        "Logging & Pumping Test"
    ];

    return (
      <Form {...form}>
        <form onSubmit={(e) => { e.stopPropagation(); e.preventDefault(); form.handleSubmit(handleConfirmSubmit)(e); }}>
            <DialogHeader className="p-6 pb-4">
                <DialogTitle>Re-appropriation Details</DialogTitle>
                <DialogDescription>Track funds transferred from this file to another file.</DialogDescription>
            </DialogHeader>
            <div className="p-6 pt-4 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField name="date" control={form.control} render={({ field }) => ( <FormItem><FormLabel>Date <span className="text-destructive">*</span></FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem> )}/>
                    <FormField name="pageType" control={form.control} render={({ field }) => ( 
                        <FormItem>
                            <FormLabel>Type of Page</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value || ""}>
                                <FormControl><SelectTrigger><SelectValue placeholder="Select Category" /></SelectTrigger></FormControl>
                                <SelectContent>
                                    {pageTypeOptions.map(opt => <SelectItem key={opt} value={opt}>{opt}</SelectItem>)}
                                </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem> 
                    )}/>
                    <FormField name="refFileNo" control={form.control} render={({ field }) => ( 
                        <FormItem>
                            <FormLabel>File No. <span className="text-destructive">*</span></FormLabel>
                            <FormControl>
                                <Input list="file-no-suggestions" placeholder="e.g., GWD/KLM/123" {...field} />
                            </FormControl>
                            <datalist id="file-no-suggestions">
                                {suggestions.map(no => <option key={no} value={no} />)}
                            </datalist>
                            <FormMessage />
                        </FormItem> 
                    )}/>
                    <FormField name="asGiven" control={form.control} render={({ field }) => ( 
                        <FormItem>
                            <FormLabel>AS Given (₹) <span className="text-destructive">*</span></FormLabel>
                            <FormControl>
                                <Input type="number" placeholder="e.g. 25000" {...field} value={field.value ?? ""} onChange={e => field.onChange(e.target.value === '' ? null : Number(e.target.value))} />
                            </FormControl>
                            <FormMessage />
                        </FormItem> 
                    )}/>
                    <FormField name="siteName" control={form.control} render={({ field }) => ( 
                        <FormItem>
                            <FormLabel>Name of Site</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value || ""}>
                                <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder={availableSiteOptions.length > 0 ? "Select Name of Site" : (watchedFileNo ? "No site names found for this File No." : "Select File No. first")} />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    {availableSiteOptions.length > 0 ? (
                                         availableSiteOptions.map((site: string, idx: number) => (
                                             <SelectItem key={`${site}-${idx}`} value={site}>
                                                 {site}
                                             </SelectItem>
                                         ))
                                    ) : (
                                        <SelectItem value="_empty" disabled>No site names available</SelectItem>
                                    )}
                                </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem> 
                    )}/>
                    <FormField name="expenditure" control={form.control} render={({ field }) => ( 
                        <FormItem>
                            <div className="flex items-center justify-between">
                                <FormLabel>Expenditure (₹)</FormLabel>
                                <span className="text-xs text-muted-foreground font-normal">(Auto-calculated)</span>
                            </div>
                            <FormControl>
                                <Input 
                                    placeholder="0.00" 
                                    {...field} 
                                    value={field.value !== null && field.value !== undefined ? (typeof field.value === 'number' ? field.value.toLocaleString('en-IN') : field.value) : "0.00"} 
                                    disabled
                                    readOnly
                                    className="bg-muted cursor-not-allowed font-medium text-foreground"
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem> 
                    )}/>
                    <FormField name="fileDetails" control={form.control} render={({ field }) => ( 
                        <FormItem>
                            <FormLabel>File Details</FormLabel>
                            <FormControl><Textarea {...field} className="bg-muted resize-none min-h-[60px]" value={field.value || ""} readOnly disabled/></FormControl>
                            <FormMessage />
                        </FormItem> 
                    )}/>
                    <FormField name="remarks" control={form.control} render={({ field }) => ( 
                        <FormItem>
                            <FormLabel>Remarks</FormLabel>
                            <FormControl><Textarea {...field} className="min-h-[70px]" value={field.value ?? ''} placeholder="Add any specific reasons or notes..." /></FormControl>
                            <FormMessage />
                        </FormItem> 
                    )}/>
                </div>
            </div>
            <DialogFooter className="p-6 pt-4">
                <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
                <Button type="submit">Save</Button>
            </DialogFooter>
        </form>
      </Form>
    );
};

const PaymentDialogContent = ({ initialData, onConfirm, onCancel, isDeferredFunding, siteDetails }: { initialData: any, onConfirm: (data: any) => void, onCancel: () => void, isDeferredFunding: boolean, siteDetails?: any[] }) => {
    const initialAllocations = useMemo(() => {
        if (!siteDetails || siteDetails.length === 0) return [];
        return siteDetails.map((s: any, idx: number) => {
            const siteName = s.nameOfSite || `Site #${idx + 1}`;
            const sPurpose = (s.purpose || '').trim().toLowerCase();
            const sName = siteName.trim().toLowerCase();

            const existing = initialData?.siteAllocations?.find((a: any) => {
                if (a.siteId && s.id && a.siteId === s.id) return true;
                const aName = (a.siteName || '').trim().toLowerCase();
                const aPurpose = (a.purpose || '').trim().toLowerCase();
                if (aName === sName) {
                    if (aPurpose && sPurpose) {
                        return aPurpose === sPurpose;
                    }
                    const sameNameSites = siteDetails.filter((other: any) => (other.nameOfSite || '').trim().toLowerCase() === sName);
                    if (sameNameSites.length === 1) {
                        return true;
                    }
                }
                return false;
            });

            return {
                siteName,
                siteId: s.id || '',
                purpose: s.purpose || '',
                workStatus: s.workStatus || '',
                amount: existing?.amount !== undefined && existing?.amount !== null ? existing.amount : undefined
            };
        });
    }, [siteDetails, initialData]);

    const [siteAllocations, setSiteAllocations] = useState<Array<{
        siteName: string;
        siteId?: string;
        purpose?: string;
        workStatus?: string;
        amount?: number | undefined;
    }>>(initialAllocations);

    useEffect(() => {
        setSiteAllocations(initialAllocations);
    }, [initialAllocations]);

    const form = useForm<PaymentDetailFormData>({
      resolver: zodResolver(PaymentDetailSchema),
      defaultValues: {
        ...createDefaultPaymentDetail(),
        ...initialData,
        dateOfPayment: formatDateForInput(initialData?.dateOfPayment),
      },
    });

    const handleConfirmSubmit = (data: PaymentDetailFormData) => {
        const cleanedAllocations = siteAllocations.map(a => ({
            siteName: a.siteName,
            siteId: a.siteId || undefined,
            purpose: a.purpose || undefined,
            workStatus: a.workStatus || undefined,
            amount: a.amount !== undefined && a.amount !== null && (a.amount as any) !== '' ? Number(a.amount) : undefined
        })).filter(a => a.amount !== undefined && a.amount > 0);

        const formatNameWithPurpose = (name?: string | null, purp?: string | null) => {
            const n = (name || '').trim();
            const p = (purp || '').trim();
            if (!n && !p) return 'Site 1';
            if (!n) return `(${p})`;
            if (!p || n.toLowerCase().includes(p.toLowerCase())) return n;
            return `${n} (${p})`;
        };

        let siteSummary = 'General / All Sites';
        if (cleanedAllocations.length === 1) {
            siteSummary = formatNameWithPurpose(cleanedAllocations[0].siteName, cleanedAllocations[0].purpose);
        } else if (cleanedAllocations.length > 1) {
            siteSummary = `${cleanedAllocations.length} Sites (${cleanedAllocations.map(a => formatNameWithPurpose(a.siteName, a.purpose)).join(', ')})`;
        }

        onConfirm({ 
            ...data, 
            nameOfSite: siteSummary,
            siteAllocations: cleanedAllocations,
        });
    };

    const isLinkedToRemittance = !!initialData?.remittanceId;

    const totalSiteAllocated = useMemo(() => {
        return siteAllocations.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
    }, [siteAllocations]);

    return (
        <Form {...form}>
             <form onSubmit={(e) => { e.preventDefault(); e.stopPropagation(); form.handleSubmit(handleConfirmSubmit)(e); }} className="flex flex-col h-full overflow-hidden">
                <DialogHeader className="p-6 pb-4 border-b shrink-0">
                    <DialogTitle>Payment Details</DialogTitle>
                </DialogHeader>
                <div className="flex-1 min-h-0 overflow-y-auto px-6 py-4 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField name="dateOfPayment" control={form.control} render={({ field }) => <FormItem><FormLabel>Date of Payment <span className="text-destructive">*</span></FormLabel><FormControl><Input type="date" {...field} value={field.value ?? ''} readOnly={isLinkedToRemittance} className={isLinkedToRemittance ? 'bg-muted/50' : ''}/></FormControl><FormMessage /></FormItem>} />
                        <FormField name="paymentAccount" control={form.control} render={({ field }) => <FormItem><FormLabel>Payment Account <span className="text-destructive">*</span></FormLabel><FormControl><Input {...field} value={field.value ?? ''}/></FormControl><FormMessage /></FormItem>} />
                    </div>

                    {/* Site-wise Payment Allocation Section */}
                    <div className="border rounded-lg p-4 bg-muted/20 space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="text-sm font-semibold text-foreground">Site-wise Payment Allocation</h4>
                          <p className="text-xs text-muted-foreground">Specify the expenditure allocated to each site for this payment voucher.</p>
                        </div>
                        {siteAllocations.length > 0 && totalSiteAllocated > 0 && (
                          <div className="text-right">
                            <span className="text-xs text-muted-foreground mr-1.5">Allocated:</span>
                            <span className="text-sm font-bold text-primary font-mono">₹{totalSiteAllocated.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                          </div>
                        )}
                      </div>

                      {siteAllocations.length === 0 ? (
                        <div className="p-3 text-center text-xs text-muted-foreground bg-background/50 border border-dashed rounded">
                          No sites added yet. Sites added in the Site Details section will appear here for payment expenditure allocation.
                        </div>
                      ) : (
                        <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                          {siteAllocations.map((alloc, sIdx) => (
                            <div key={sIdx} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2.5 rounded-md bg-background border text-sm">
                              <div className="flex-1 min-w-0">
                                <div className="font-medium text-xs text-foreground whitespace-normal break-words">
                                  Site #{sIdx + 1}: {alloc.siteName}{alloc.purpose && !alloc.siteName.toLowerCase().includes(alloc.purpose.toLowerCase()) ? ` (${alloc.purpose})` : ''}
                                </div>
                                {alloc.workStatus && (
                                  <div className="text-[11px] text-muted-foreground flex gap-2 mt-0.5">
                                    <span>Status: {alloc.workStatus}</span>
                                  </div>
                                )}
                              </div>
                              <div className="w-full sm:w-48 shrink-0 flex items-center gap-1.5">
                                <span className="text-xs text-muted-foreground font-semibold">₹</span>
                                <Input 
                                  type="number"
                                  step="any"
                                  placeholder="Expenditure (₹)"
                                  value={alloc.amount ?? ''}
                                  onChange={(e) => {
                                    const val = e.target.value === '' ? undefined : Number(e.target.value);
                                    setSiteAllocations(prev => {
                                      const copy = [...prev];
                                      copy[sIdx] = { ...copy[sIdx], amount: val };
                                      return copy;
                                    });
                                  }}
                                  className="h-8 text-xs font-mono"
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <Separator/>
                      <FormField 
                          name="revenueHead" 
                          control={form.control} 
                          render={({ field }) => (
                              <FormItem>
                                  <FormLabel>Revenue Head (₹)</FormLabel>
                                  <FormControl>
                                      <Input 
                                          type="number" 
                                          {...field} 
                                          value={field.value ?? ""}
                                          onChange={e => field.onChange(e.target.value === '' ? null : Number(e.target.value))} 
                                          readOnly={isLinkedToRemittance}
                                          className={isLinkedToRemittance ? 'bg-muted/50' : ''}
                                      />
                                  </FormControl>
                                  {isLinkedToRemittance && <FormDescription className="text-xs">Auto-managed by a &apos;Revenue Head&apos; remittance.</FormDescription>}
                                  <FormMessage />
                              </FormItem>
                          )}
                      />
                    <Separator/>
                    <FormField name="paymentRemarks" control={form.control} render={({ field }) => <FormItem><FormLabel>Payment Remarks</FormLabel><FormControl><Textarea {...field} value={field.value ?? ""} placeholder="Add any remarks for this payment entry..." /></FormControl><FormMessage /></FormItem>} />
                </div>
                <DialogFooter className="p-4 px-6 border-t shrink-0 flex items-center justify-end gap-2 bg-muted/20">
                    <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
                    <Button type="button" onClick={form.handleSubmit(handleConfirmSubmit)}>Save</Button>
                </DialogFooter>
             </form>
        </Form>
    );
};

export default function InvestigationDataEntryFormComponent({ fileNoToEdit, initialData, allStaffMembers, userRole, workTypeContext, returnPath, pageToReturnTo, isFormDisabled = false, allLsgConstituencyMaps }: DataEntryFormProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const fileIdToEdit = searchParams.get("id");
  const approveUpdateId = searchParams.get("approveUpdateId");

  const { addFileEntry, updateFileEntry, moveCopySite } = useFileEntries();
  const { createPendingUpdate } = usePendingUpdates();
  const { toast } = useToast();
  const { user } = useAuth();
  const { allFileEntries, allArsEntries } = useDataStore();
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAutoSaving, setIsAutoSaving] = useState(false);
  const [isManualDirty, setIsManualDirty] = useState(false);

  const parseDateValue = useCallback((val: any): Date | null => {
    if (!val) return null;
    if (val instanceof Date) return isNaN(val.getTime()) ? null : val;
    if (typeof val?.toDate === 'function') {
      const d = val.toDate();
      return isNaN(d.getTime()) ? null : d;
    }
    if (val?.seconds) {
      const d = new Date(val.seconds * 1000);
      return isNaN(d.getTime()) ? null : d;
    }
    const d = new Date(val);
    return isNaN(d.getTime()) ? null : d;
  }, []);

  const determineSaveType = useCallback((data: any): 'manual' | 'auto' | 'initial' => {
    if (data?.lastSavedType === 'auto' || data?.lastSavedType === 'manual') {
      return data.lastSavedType;
    }
    const sites = data?.siteDetails || [];
    const hasLinkedTender = sites.some((s: any) => 
      (s.tenderNo && s.tenderNo !== 'Quotation' && s.tenderNo !== '_clear_') ||
      ['Tendered', 'Selection Notice Issued', 'Work Order Issued'].includes(s.workStatus)
    );
    const fileStatus = data?.fileStatus;
    if (hasLinkedTender || ['Tender Process', 'Selection Notice Issued', 'Work Order Issued'].includes(fileStatus)) {
      return 'auto';
    }
    return data?.lastSavedType || 'manual';
  }, []);

  const [lastSavedType, setLastSavedType] = useState<'manual' | 'auto' | 'initial'>(() => {
    return determineSaveType(initialData);
  });
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(() => {
    const parsed = parseDateValue((initialData as any)?.updatedAt || (initialData as any)?.lastSavedAt || (initialData as any)?.createdAt);
    if (parsed) return parsed;
    return fileIdToEdit ? new Date() : null;
  });
  const lastSavedTypeRef = useRef<'manual' | 'auto' | 'initial'>(determineSaveType(initialData));
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);

  const serializeDataForSnapshot = useCallback((data: any) => {
    if (!data) return '';
    return JSON.stringify({
      fileStatus: data.fileStatus || '',
      totalRemittance: Number(data.totalRemittance) || 0,
      totalReappropriation: Number(data.totalReappropriation) || 0,
      totalReappropriationCredit: Number(data.totalReappropriationCredit) || 0,
      totalPaymentAllEntries: Number(data.totalPaymentAllEntries) || 0,
      overallBalance: Number(data.overallBalance) || 0,
      paymentDetails: (data.paymentDetails || []).map((p: any) => ({
        id: p.id || '',
        remittanceId: p.remittanceId || '',
        dateOfPayment: p.dateOfPayment || '',
        paymentAccount: p.paymentAccount || '',
        revenueHead: Number(p.revenueHead) || 0,
        contractorsPayment: Number(p.contractorsPayment) || 0,
        gst: Number(p.gst) || 0,
        incomeTax: Number(p.incomeTax) || 0,
        kbcwb: Number(p.kbcwb) || 0,
        refundToParty: Number(p.refundToParty) || 0,
        totalPaymentPerEntry: Number(p.totalPaymentPerEntry) || 0,
      })),
    });
  }, []);

  const savedSnapshotRef = useRef<string>(serializeDataForSnapshot(initialData));

  useEffect(() => {
    const parsed = parseDateValue((initialData as any)?.updatedAt || (initialData as any)?.lastSavedAt || (initialData as any)?.createdAt);
    if (parsed) {
      setLastSavedAt(parsed);
    } else if (fileIdToEdit) {
      setLastSavedAt(new Date());
    }
    const computedType = determineSaveType(initialData);
    setLastSavedType(computedType);
    lastSavedTypeRef.current = computedType;
    savedSnapshotRef.current = serializeDataForSnapshot(initialData);
  }, [initialData, fileIdToEdit, parseDateValue, serializeDataForSnapshot, determineSaveType]);

  const [activeAccordionItem, setActiveAccordionItem] = useState<string>("");
  const [reappAccordionValue, setReappAccordionValue] = useState<string>("");
  const [dialogState, setDialogState] = useState<{ type: null | 'application' | 'remittance' | 'reappropriation' | 'payment' | 'site' | 'reorderSite' | 'viewSite' | 'moveCopySite'; data: any, isView?: boolean }>({ type: null, data: null, isView: false });
  const [isReappInfoOpen, setIsReappInfoOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{ type: 'remittance' | 'reappropriation' | 'payment' | 'site'; index: number } | null>(null);

  const handleOpenReportInSameWindow = (docType: InvestigationReportDocType, siteIndex = 0) => {
    const currentFormData = getValues();
    const docId = fileIdToEdit || (initialData as any)?.id || currentFormData.fileNo || 'current';
    
    // Save draft in sessionStorage for immediate preview with current form values
    if (typeof window !== 'undefined') {
      try {
        const draftPayload = {
          ...currentFormData,
          id: fileIdToEdit || (initialData as any)?.id || currentFormData.fileNo,
        };
        window.sessionStorage.setItem(`gw_report_draft_${docId}`, JSON.stringify(draftPayload));
        window.sessionStorage.setItem('gw_report_draft_current', JSON.stringify(draftPayload));
      } catch (e) {
        console.warn("Could not cache draft report in sessionStorage", e);
      }
    }

    const currentUrl = typeof window !== 'undefined' ? `${window.location.pathname}${window.location.search}` : returnPath;
    router.push(`/dashboard/gw-investigation/print?id=${encodeURIComponent(docId)}&docType=${docType}&siteIndex=${siteIndex}&returnPath=${encodeURIComponent(currentUrl)}`);
  };

  const isEditor = userRole === 'admin' || userRole === 'scientist';
  const isSupervisor = userRole === 'supervisor';
  const isInvestigator = userRole === 'investigator';
  const isViewer = userRole === 'viewer';
  const isEditing = !!fileIdToEdit;
  
  const userDesignation = useMemo(() => {
    if (!user?.staffId) return null;
    return (allStaffMembers.find(s => s.id === user.staffId)?.designation as Designation) || null;
  }, [user, allStaffMembers]);

  const form = useForm<DataEntryFormData>({ 
    resolver: zodResolver(DataEntrySchema), 
    defaultValues: {
        ...initialData,
        fileStatus: (initialData.fileStatus || INVESTIGATION_FILE_STATUS_OPTIONS[0]) as any
    }
  });
  const { control, handleSubmit, setValue, getValues, watch, formState: { isDirty }, reset } = form;
  
  const currentFileNo = watch("fileNo");
  
  const { fields: remittanceFields, append: appendRemittance, remove: removeRemittance, update: updateRemittance } = useFieldArray({ control, name: "remittanceDetails" });
  const { fields: reappropriationFields, append: appendReappropriation, remove: removeReappropriation, update: updateReappropriation } = useFieldArray({ control, name: "reappropriationDetails" });
  const { fields: siteFields, append: appendSite, remove: removeSite, update: updateSite, move: moveSite } = useFieldArray({ control, name: "siteDetails" });
  const { fields: paymentFields, append: appendPayment, remove: removePayment, update: updatePayment, replace: replacePayments } = useFieldArray({ control, name: "paymentDetails" });

  const sortedPaymentFields = useMemo(() => {
    return paymentFields
      .map((item, originalIndex) => ({ ...item, _originalIndex: originalIndex }))
      .sort((a, b) => {
        const dateA = a.dateOfPayment ? new Date(a.dateOfPayment).getTime() : 0;
        const dateB = b.dateOfPayment ? new Date(b.dateOfPayment).getTime() : 0;
        return dateB - dateA; // Recent date first
      });
  }, [paymentFields]);

  const watchedRemittanceDetails = watch("remittanceDetails");
  const watchedReappropriationDetails = watch("reappropriationDetails");
  const watchedPaymentDetails = watch("paymentDetails");
  const watchedSiteDetails = useWatch({ control, name: "siteDetails" });

  useEffect(() => {
    reset({
        ...initialData,
        fileStatus: (initialData.fileStatus || INVESTIGATION_FILE_STATUS_OPTIONS[0]) as any
    });
    setIsManualDirty(false);
  }, [initialData, reset]);

  // Track any manual changes directly emitted by user typing/inputs
  useEffect(() => {
    const subscription = form.watch((_, { type }) => {
      if (type === 'change') {
        setIsManualDirty(true);
      }
    });
    return () => subscription.unsubscribe();
  }, [form]);

  const getReferencedExpenditure = useCallback((refFileNo: string, targetSiteName?: string | null, fallback?: number | null, pageType?: string | null) => {
      if (!refFileNo) return fallback ?? 0;
      const targetEntry = findTargetFileEntry(refFileNo, pageType, allFileEntries, allArsEntries);
      const isGw = (pageType || '').trim().toLowerCase().includes('investigation') || (targetEntry && getModuleCategoryFromData(targetEntry) === 'gw_investigation');
      if (!targetEntry) {
          if (isGw) return 0;
          return fallback ?? 0;
      }

      const formatSiteName = (s: any) => {
          const n = (s.nameOfSite || s.siteName || '').trim();
          const p = (s.purpose || s.arsTypeOfScheme || '').trim();
          if (!n) return '';
          if (p && !n.toLowerCase().includes(`(${p.toLowerCase()})`)) return `${n} (${p})`.toLowerCase();
          return n.toLowerCase();
      };

      const normalizedRef = refFileNo.toLowerCase().trim();
      if (normalizedRef === currentFileNo?.toLowerCase().trim()) {
          const sites = watchedSiteDetails || [];
          const payments = watchedPaymentDetails || [];
          if (targetSiteName) {
              const tNameFull = targetSiteName.trim().toLowerCase();
              const tNameSiteOnly = tNameFull.includes('site: ') ? tNameFull.split('site: ')[1].trim() : tNameFull;
              
              let matchedSite = sites.find(s => {
                  const sName = formatSiteName(s);
                  return sName && (sName === tNameFull || sName === tNameSiteOnly);
              });
              
              if (!matchedSite) {
                  matchedSite = sites.find(s => {
                      const sName = formatSiteName(s);
                      if (!sName || sName.length < 5) return false;
                      return tNameFull.includes(sName) || sName.includes(tNameSiteOnly);
                  });
              }

              if (matchedSite) {
                  const exp = calculateSiteExpenditure(matchedSite, payments);
                  return exp > 0 ? exp : (isGw ? 0 : (Number(matchedSite.totalExpenditure) || 0));
              } else {
                  return 0;
              }
          }
          const totalExp = sites.reduce((sum, s) => {
              const exp = calculateSiteExpenditure(s, payments);
              return sum + (exp > 0 ? exp : (isGw ? 0 : (Number(s.totalExpenditure) || 0)));
          }, 0);
          if (totalExp > 0) return totalExp;
      }

      const targetSites = (targetEntry as any).siteDetails || (targetEntry as any).sites || [];
      const targetPayments = (targetEntry as any).paymentDetails || (targetEntry as any).payments || [];

      if (targetSiteName) {
          const tNameFull = targetSiteName.trim().toLowerCase();
          const tNameSiteOnly = tNameFull.includes('site: ') ? tNameFull.split('site: ')[1].trim() : tNameFull;

          let matchedSite = targetSites.find((s: any) => {
              const sName = formatSiteName(s);
              return sName && (sName === tNameFull || sName === tNameSiteOnly);
          });

          if (!matchedSite) {
              matchedSite = targetSites.find((s: any) => {
                  const sName = formatSiteName(s);
                  if (!sName || sName.length < 5) return false;
                  return tNameFull.includes(sName) || sName.includes(tNameSiteOnly);
              });
          }

          if (matchedSite) {
              const exp = calculateSiteExpenditure(matchedSite, targetPayments);
              return exp > 0 ? exp : (isGw ? 0 : (Number(matchedSite.totalExpenditure) || 0));
          } else {
              return 0;
          }
      }

      const totalExp = targetSites.reduce((sum: number, s: any) => {
          const exp = calculateSiteExpenditure(s, targetPayments);
          return sum + (exp > 0 ? exp : (isGw ? 0 : (Number(s.totalExpenditure) || 0)));
      }, 0);

      if (totalExp > 0) return totalExp;

      if (isGw) return 0;

      return Number((targetEntry as any).totalExpenditure) || 0;
  }, [allFileEntries, allArsEntries, currentFileNo, watchedSiteDetails, watchedPaymentDetails]);

  const getCurrentFileExpenditure = useCallback((targetSiteName?: string | null, fallback?: number | null) => {
      const sites = watchedSiteDetails || [];
      const payments = watchedPaymentDetails || [];
      if (targetSiteName) {
          const formatSiteName = (s: any) => {
              const n = (s.nameOfSite || s.siteName || '').trim();
              const p = (s.purpose || s.arsTypeOfScheme || '').trim();
              if (!n) return '';
              if (p && !n.toLowerCase().includes(`(${p.toLowerCase()})`)) return `${n} (${p})`.toLowerCase();
              return n.toLowerCase();
          };

          const tNameFull = targetSiteName.trim().toLowerCase();
          const tNameSiteOnly = tNameFull.includes('site: ') ? tNameFull.split('site: ')[1].trim() : tNameFull;

          let matchedSite = sites.find(s => {
              const sName = formatSiteName(s);
              return sName && (sName === tNameFull || sName === tNameSiteOnly);
          });
          
          if (!matchedSite) {
              matchedSite = sites.find(s => {
                  const sName = formatSiteName(s);
                  if (!sName || sName.length < 5) return false;
                  return tNameFull.includes(sName) || sName.includes(tNameSiteOnly);
              });
          }

          if (matchedSite) {
              const exp = calculateSiteExpenditure(matchedSite, payments);
              return exp > 0 ? exp : (Number(matchedSite.totalExpenditure) || 0);
          } else {
              return 0;
          }
      }
      const totalExp = sites.reduce((sum, s) => {
          const exp = calculateSiteExpenditure(s, payments);
          return sum + (exp > 0 ? exp : (Number(s.totalExpenditure) || 0));
      }, 0);
      if (totalExp > 0) return totalExp;
      return fallback || 0;
  }, [watchedSiteDetails, watchedPaymentDetails]);

  const autoCredits = useMemo(() => {
    if (!currentFileNo) return [];
    const normalizedFileNo = currentFileNo.toLowerCase().trim();
    const credits: any[] = [];
    allFileEntries.forEach(entry => {
        if (entry.fileNo?.toLowerCase().trim() === normalizedFileNo) return;
        entry.reappropriationDetails?.forEach(reapp => {
            if (reapp.refFileNo?.toLowerCase().trim() === normalizedFileNo) {
                // If pageType is explicitly set, make sure it matches GW Investigation
                if (reapp.pageType && !matchPageTypeWithModuleCategory(reapp.pageType, 'gw_investigation')) {
                    return;
                }
                const hasInvestigation = entry.siteDetails?.some(s => s.purpose === 'GW Investigation');
                const hasLoggingPumping = entry.siteDetails?.some(s => s.purpose && LOGGING_PUMPING_TEST_PURPOSE_OPTIONS.includes(s.purpose as any));
                let sourcePageType = "Deposit Work";
                if (hasInvestigation && !hasLoggingPumping) sourcePageType = "GW Investigation";
                else if (hasLoggingPumping && !hasInvestigation) sourcePageType = "Logging & Pumping Test";
                
                const parentRemittanceAccount = entry.remittanceDetails?.[0]?.remittedAccount || 'N/A';

                credits.push({
                    ...reapp,
                    sourceFileNo: entry.fileNo,
                    sourceApplicantName: entry.applicantName,
                    sourcePageType: sourcePageType,
                    parentRemittanceAccount: parentRemittanceAccount
                });
            }
        });
    });
    return credits;
  }, [currentFileNo, allFileEntries]);
  
  const sortedCombinedReappropriations = useMemo(() => {
    const manual = reappropriationFields.map((field, index) => {
        const targetEntry = findTargetFileEntry(field.refFileNo, field.pageType, allFileEntries, allArsEntries);
        const calculatedExp = getReferencedExpenditure(field.refFileNo, field.siteName, null, field.pageType);
        const isGw = (field.pageType || '').trim().toLowerCase().includes('investigation') || (targetEntry && getModuleCategoryFromData(targetEntry) === 'gw_investigation');
        const effectiveExp = targetEntry ? calculatedExp : (isGw ? 0 : (field.expenditure !== undefined && field.expenditure !== null ? Number(field.expenditure) : calculatedExp));
        const asGivenVal = Number(field.asGiven) || 0;
        const effectiveAmount = (effectiveExp !== null && effectiveExp !== undefined && !isNaN(Number(effectiveExp)) && Number(effectiveExp) > 0)
            ? (asGivenVal > 0 ? Math.min(Number(effectiveExp), asGivenVal) : Number(effectiveExp))
            : (asGivenVal > 0 ? asGivenVal : (Number(field.amount) || 0));

        return {
            ...field,
            expenditure: effectiveExp,
            amount: effectiveAmount,
            _originalIndex: index,
            _source: 'manual' as const,
            dateObj: toDateOrNull(field.date)
        };
    });
    const auto = autoCredits.map((credit) => {
        const targetEntry = findTargetFileEntry(credit.sourceFileNo, credit.sourcePageType || credit.pageType, allFileEntries, allArsEntries);
        const calculatedExp = getReferencedExpenditure(credit.sourceFileNo, credit.siteName, null, credit.sourcePageType || credit.pageType);
        const isGw = (credit.sourcePageType || credit.pageType || '').trim().toLowerCase().includes('investigation') || (targetEntry && getModuleCategoryFromData(targetEntry) === 'gw_investigation');
        const effectiveExp = targetEntry ? calculatedExp : (isGw ? 0 : (credit.expenditure !== undefined && credit.expenditure !== null ? Number(credit.expenditure) : calculatedExp));
        const asGivenVal = Number(credit.asGiven) || 0;
        const effectiveAmount = (effectiveExp !== null && effectiveExp !== undefined && !isNaN(Number(effectiveExp)) && Number(effectiveExp) > 0)
            ? (asGivenVal > 0 ? Math.min(Number(effectiveExp), asGivenVal) : Number(effectiveExp))
            : (asGivenVal > 0 ? asGivenVal : (Number(credit.amount) || 0));

        return {
            ...credit,
            expenditure: effectiveExp,
            amount: effectiveAmount,
            _source: 'auto' as const,
            dateObj: toDateOrNull(credit.date)
        };
    });
    return [...manual, ...auto].sort((a, b) => {
        const timeA = a.dateObj?.getTime() ?? 0;
        const timeB = b.dateObj?.getTime() ?? 0;
        return timeB - timeA;
    });
  }, [reappropriationFields, autoCredits, getReferencedExpenditure, allFileEntries, allArsEntries]);

  const hasReappropriations = useMemo(() => sortedCombinedReappropriations.length > 0, [sortedCombinedReappropriations.length]);

  useEffect(() => {
    if (hasReappropriations) {
      setReappAccordionValue("reappropriation-details");
    } else {
      setReappAccordionValue("");
    }
  }, [hasReappropriations]);

   useEffect(() => {
        const currentRemittances = getValues('remittanceDetails') || [];
        const manualPayments = (getValues('paymentDetails') || []).filter(p => !p.remittanceId);
        
        const autoGeneratedPayments: PaymentDetailFormData[] = [];
        
        currentRemittances.forEach(remittance => {
            if (remittance.remittedAccount === 'Revenue Head' && remittance.id) {
                const amount = Number(remittance.amountRemitted) || 0;
                if (amount > 0) {
                    const newPayment: Partial<PaymentDetailFormData> = {
                        id: `auto-payment-${remittance.id}`,
                        remittanceId: remittance.id,
                        dateOfPayment: remittance.dateOfRemittance,
                        paymentAccount: 'Bank',
                        revenueHead: amount,
                        paymentRemarks: "Auto-entry from remittance to Revenue Head.",
                    };
                    newPayment.totalPaymentPerEntry = calculatePaymentEntryTotalGlobal(newPayment as PaymentDetailFormData);
                    autoGeneratedPayments.push(newPayment as PaymentDetailFormData);
                }
            }
        });
        
        const newPayments = [...manualPayments, ...autoGeneratedPayments];

        if (JSON.stringify((getValues('paymentDetails') || []).map(p => ({...p, id: ''}))) !== JSON.stringify(newPayments.map(p => ({...p, id: ''})))) {
             replacePayments(newPayments);
        }
    }, [watchedRemittanceDetails, getValues, replacePayments]);


  useEffect(() => {
    const totalRemittance = watchedRemittanceDetails?.reduce((sum, item) => {
        return sum + (Number(item.amountRemitted) || 0);
    }, 0) || 0;
    setValue("totalRemittance", totalRemittance, { shouldDirty: false });

    const totalReappDebit = watchedReappropriationDetails?.reduce((sum, item) => {
        const targetEntry = findTargetFileEntry(item.refFileNo, item.pageType, allFileEntries, allArsEntries);
        const calculatedExp = getReferencedExpenditure(item.refFileNo, item.siteName, null, item.pageType);
        const effectiveExp = targetEntry ? calculatedExp : (item.expenditure !== undefined && item.expenditure !== null ? Number(item.expenditure) : calculatedExp);
        const asGivenVal = Number(item.asGiven) || 0;
        const effectiveAmount = (effectiveExp !== null && effectiveExp !== undefined && !isNaN(Number(effectiveExp)) && Number(effectiveExp) > 0)
            ? (asGivenVal > 0 ? Math.min(Number(effectiveExp), asGivenVal) : Number(effectiveExp))
            : (asGivenVal > 0 ? asGivenVal : (Number(item.amount) || 0));
        return sum + effectiveAmount;
    }, 0) || 0;
    setValue("totalReappropriation", totalReappDebit, { shouldDirty: false });

    const totalReappCredit = autoCredits.reduce((sum, item) => {
        return sum + (Number(item.amount) || 0);
    }, 0);
    setValue("totalReappropriationCredit", totalReappCredit, { shouldDirty: false });
    
    const totalPayment = watchedPaymentDetails?.reduce((sum, item) => sum + calculatePaymentEntryTotalGlobal(item), 0) || 0;
    setValue("totalPaymentAllEntries", totalPayment, { shouldDirty: false });

    setValue("overallBalance", totalRemittance + totalReappCredit - totalPayment - totalReappDebit, { shouldDirty: false });
    
  }, [watchedRemittanceDetails, watchedReappropriationDetails, watchedPaymentDetails, autoCredits, setValue, allFileEntries, allArsEntries, getReferencedExpenditure]);

  // AUTO-SAVE EFFECT: Automatically saves calculated updates when no uncommitted manual changes exist
  useEffect(() => {
    if (!fileIdToEdit) return;
    if (isManualDirty) return;
    if (isViewer || isFormDisabled || isSupervisor || isInvestigator) return;
    if (isSubmitting || isAutoSaving) return;

    const currentValues = getValues();
    const currentSnapshot = serializeDataForSnapshot(currentValues);

    if (savedSnapshotRef.current && currentSnapshot !== savedSnapshotRef.current) {
      if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);

      autoSaveTimerRef.current = setTimeout(async () => {
        if (isManualDirty || isSubmitting) return;

        try {
          setIsAutoSaving(true);
          const dataToSave = getValues();
          const sanitizedData = {
            ...dataToSave,
            constituency: dataToSave.constituency === undefined ? null : dataToSave.constituency,
            lastSavedType: 'auto' as const,
          };

          if (sanitizedData.reappropriationDetails) {
            sanitizedData.reappropriationDetails = sanitizedData.reappropriationDetails.map((reapp: any) => {
              const targetEntry = findTargetFileEntry(reapp.refFileNo, reapp.pageType, allFileEntries, allArsEntries);
              const calculatedExp = getReferencedExpenditure(reapp.refFileNo, reapp.siteName, null, reapp.pageType);
              const effectiveExp = targetEntry ? calculatedExp : (reapp.expenditure !== undefined && reapp.expenditure !== null ? Number(reapp.expenditure) : calculatedExp);
              const asGivenVal = Number(reapp.asGiven) || 0;
              const effectiveAmount = (effectiveExp !== null && effectiveExp !== undefined && !isNaN(Number(effectiveExp)) && Number(effectiveExp) > 0)
                ? (asGivenVal > 0 ? Math.min(Number(effectiveExp), asGivenVal) : Number(effectiveExp))
                : (asGivenVal > 0 ? asGivenVal : (Number(reapp.amount) || 0));
              return {
                ...reapp,
                expenditure: effectiveExp,
                amount: effectiveAmount,
              };
            });
          }

          await updateFileEntry(fileIdToEdit, sanitizedData, approveUpdateId || undefined);
          const now = new Date();
          setLastSavedAt(now);
          setLastSavedType('auto');
          lastSavedTypeRef.current = 'auto';
          savedSnapshotRef.current = serializeDataForSnapshot(sanitizedData);
          toast({
            title: "Calculations Auto-Saved",
            description: `Auto-saved calculated updates at ${format(now, "hh:mm:ss a")}.`,
            duration: 3000,
          });
        } catch (err: any) {
          console.error("Auto-save failed:", err);
        } finally {
          setIsAutoSaving(false);
        }
      }, 1200);
    }

    return () => {
      if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    };
  }, [
    fileIdToEdit,
    isManualDirty,
    isSubmitting,
    isAutoSaving,
    isViewer,
    isFormDisabled,
    isSupervisor,
    isInvestigator,
    watchedSiteDetails,
    watchedRemittanceDetails,
    watchedReappropriationDetails,
    watchedPaymentDetails,
    watch('fileStatus'),
    watch('totalRemittance'),
    watch('totalReappropriation'),
    watch('totalReappropriationCredit'),
    watch('totalPaymentAllEntries'),
    watch('overallBalance'),
    getValues,
    updateFileEntry,
    approveUpdateId,
    getReferencedExpenditure,
    serializeDataForSnapshot,
    toast,
  ]);

    const paymentFieldsToDisplay = useMemo(() => {
        const fields: { key: keyof PaymentDetailFormData; label: string }[] = [
          { key: 'revenueHead', label: 'Revenue Head (₹)' },
          { key: 'contractorsPayment', label: "Contractor's (₹)" },
          { key: 'gst', label: 'GST (₹)' },
          { key: 'incomeTax', label: 'Income Tax (₹)' },
          { key: 'kbcwb', label: 'KBCWB (₹)' },
          { key: 'refundToParty', label: 'Refund to Party (₹)' }
        ];
        
        return fields.filter(field => 
            paymentFields.some(payment => {
                const value = payment[field.key];
                return typeof value === 'number' && value > 0;
            })
        );
    }, [paymentFields]);

  const onInvalid = (errors: FieldErrors<DataEntryFormData>) => {
    const messages = getFormattedErrorMessages(errors);
    toast({ title: "Validation Error", description: (<ul className="list-disc pl-5 mt-2 space-y-1">{messages.map((msg, i) => <li key={i} className="text-xs">{msg}</li>)}</ul>), variant: "destructive", duration: 10000 });
  };
  
  const onSubmit = async (data: DataEntryFormData) => {
    setIsSubmitting(true);
    try {
        const sanitizedData = {
          ...data,
          constituency: data.constituency === undefined ? null : data.constituency,
          lastSavedType: 'manual' as const,
        };

        if (sanitizedData.reappropriationDetails) {
            sanitizedData.reappropriationDetails = sanitizedData.reappropriationDetails.map((reapp: any) => {
                const targetEntry = findTargetFileEntry(reapp.refFileNo, reapp.pageType, allFileEntries, allArsEntries);
                const calculatedExp = getReferencedExpenditure(reapp.refFileNo, reapp.siteName, null, reapp.pageType);
                const effectiveExp = targetEntry ? calculatedExp : (reapp.expenditure !== undefined && reapp.expenditure !== null ? Number(reapp.expenditure) : calculatedExp);
                const asGivenVal = Number(reapp.asGiven) || 0;
                const effectiveAmount = (effectiveExp !== null && effectiveExp !== undefined && !isNaN(Number(effectiveExp)) && Number(effectiveExp) > 0)
                  ? (asGivenVal > 0 ? Math.min(Number(effectiveExp), asGivenVal) : Number(effectiveExp))
                  : (asGivenVal > 0 ? asGivenVal : (Number(reapp.amount) || 0));
                return {
                    ...reapp,
                    expenditure: effectiveExp,
                    amount: effectiveAmount,
                };
            });
        }

        if (!user) throw new Error("Authentication error.");

        const fileLevelUpdates = {
            fileStatus: sanitizedData.fileStatus,
            remarks: sanitizedData.remarks
        }
        
        const now = new Date();
        if (isSupervisor || isInvestigator) {
            await createPendingUpdate(sanitizedData.fileNo, sanitizedData.siteDetails!, user, fileLevelUpdates);
            toast({ title: "Update Submitted" });
            reset(sanitizedData);
        } else if (fileIdToEdit) {
            await updateFileEntry(fileIdToEdit, sanitizedData, approveUpdateId || undefined);
            toast({ title: "File Updated" });
            reset(sanitizedData);
        } else {
            const newDocId = await addFileEntry(sanitizedData);
            toast({ title: "File Created" });
            if (newDocId) {
                const newPath = `/dashboard/data-entry?id=${newDocId}&workType=gwInvestigation${pageToReturnTo ? `&page=${pageToReturnTo}` : ''}`;
                router.push(newPath);
            }
        }
        setLastSavedAt(now);
        setLastSavedType('manual');
        lastSavedTypeRef.current = 'manual';
        setIsManualDirty(false);
        savedSnapshotRef.current = serializeDataForSnapshot(sanitizedData);
    } catch (error: any) { 
        toast({ title: "Submission Failed", description: error.message, variant: "destructive" });
    } finally { 
        setIsSubmitting(false);
    }
  };

  const openDialog = (type: 'application' | 'remittance' | 'reappropriation' | 'payment' | 'site' | 'reorderSite' | 'viewSite' | 'moveCopySite', data: any, isView: boolean = false) => setDialogState({ type, data, isView });
  const closeDialog = () => setDialogState({ type: null, data: null, isView: false });

    const handleDialogConfirm = (data: any) => {
        const { type, data: originalData } = dialogState;
        if (!type) return;
        setIsManualDirty(true);

        if (type === 'application') {
            setValue("fileNo", data.fileNo, { shouldDirty: true });
            setValue("applicantName", data.applicantName, { shouldDirty: true });
            setValue("applicantNameMl", data.applicantNameMl || '', { shouldDirty: true });
            setValue("phoneNo", data.phoneNo, { shouldDirty: true });
            setValue("secondaryMobileNo", data.secondaryMobileNo, { shouldDirty: true });
            setValue("emailId", data.emailId, { shouldDirty: true });
            setValue("applicationType", data.applicationType, { shouldDirty: true });
            setValue("category", data.category, { shouldDirty: true });
            setValue("bankName", data.bankName || '', { shouldDirty: true });
            setValue("branch", data.branch || '', { shouldDirty: true });
            setValue("bankAccountNo", data.bankAccountNo || '', { shouldDirty: true });
            setValue("ifsc", data.ifsc || '', { shouldDirty: true });
        } else if (type === 'remittance') {
            const isEditingRemittance = originalData && originalData.index !== undefined;
            if (isEditingRemittance) {
                updateRemittance(originalData.index, { ...originalData, ...data });
            } else {
                appendRemittance({ ...createDefaultRemittanceDetail(), ...data, id: uuidv4() });
            }
        } else if (type === 'reappropriation') {
            if (originalData.index !== undefined) {
                updateReappropriation(originalData.index, data);
            } else {
                appendReappropriation(data);
            }
        } else if (type === 'payment') {
            const paymentData = { ...data, totalPaymentPerEntry: calculatePaymentEntryTotalGlobal(data) };
            if (originalData.index !== undefined) {
                updatePayment(originalData.index, paymentData);
            } else {
                appendPayment(paymentData);
            }
        } else if (type === 'site') {
            if (originalData.index !== undefined) updateSite(originalData.index, data); else appendSite(data);
            setIsManualDirty(true);
            closeDialog();
            setTimeout(() => {
                handleSubmit(onSubmit)();
            }, 300);
            return;
        } else if (type === 'reorderSite') {
            const reorderedSites = data as SiteDetailFormData[];
            replaceSites(reorderedSites);
        }
        closeDialog();
    };

    const replaceSites = useCallback((newSites: SiteDetailFormData[]) => {
        setValue("siteDetails", newSites, { shouldDirty: true });
    }, [setValue]);

    const handleDeleteItem = () => {
        if (!itemToDelete) return;
        setIsManualDirty(true);
        const { type, index } = itemToDelete;

        if (type === 'remittance') {
            removeRemittance(index);
        } else if (type === 'reappropriation') {
            removeReappropriation(index);
        } else if (type === 'payment') {
            const paymentToDelete = paymentFields[index];
            if (paymentToDelete.remittanceId) {
                toast({ title: "Action Blocked", description: "This payment entry is linked to a 'Revenue Head' remittance and cannot be deleted directly. Delete the remittance entry instead.", variant: "destructive" });
                setItemToDelete(null);
                return;
            }
            removePayment(index);
        } else if (type === 'site') {
            removeSite(index);
        }
        toast({ title: "Removed locally" });
        setItemToDelete(null);
    };

    const handleMoveCopySiteConfirm = async (op: 'move' | 'copy', targetFileNo: string) => {
        const { index } = dialogState.data;
        if (!fileIdToEdit) return;
        setIsManualDirty(true);
        try {
            await moveCopySite(fileIdToEdit, index, op, targetFileNo);
            toast({ title: op === 'move' ? "Site Moved" : "Site Copied" });
        } catch (error: any) {
            toast({ title: "Operation Failed", description: error.message, variant: "destructive" });
        }
    };

  const isDeferredFunding = workTypeContext === 'planFund' || workTypeContext === 'collector';
  const remittanceTitle = isDeferredFunding ? "2. Administrative Sanction" : "2. Remittance Details";
  const totalRemittanceWatched = watch('totalRemittance');
  const totalReappropriationCreditWatched = watch('totalReappropriationCredit');
  const totalPaymentWatched = watch('totalPaymentAllEntries');
  const totalReappropriationWatched = watch('totalReappropriation');

  return (
    <FormProvider {...form}>
      <div>
        <form onSubmit={handleSubmit(onSubmit, onInvalid)} className="space-y-6">
          <div className="relative pl-6 sm:pl-8 border-l-2 border-slate-200 dark:border-slate-800 ml-2.5 sm:ml-4 space-y-6 sm:space-y-8">
            {/* 1. Application Details */}
            <div className="relative">
              <div className="absolute -left-[37px] sm:-left-[45px] top-4 bg-background p-1 rounded-full border border-slate-200 dark:border-slate-700 shadow-xs z-10">
                <div className="bg-blue-50 dark:bg-blue-950/60 p-1.5 rounded-full text-blue-600 dark:text-blue-400">
                  <ClipboardList className="w-4 h-4" />
                </div>
              </div>
              <Card className="border-l-4 border-l-blue-600 dark:border-l-blue-500 shadow-xs">
                <CardHeader className="flex flex-row justify-between items-start">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400">
                      <ClipboardList className="h-5 w-5" />
                    </div>
                    <div>
                      <CardTitle className="text-xl font-bold tracking-tight text-foreground">1. Application Details</CardTitle>
                      <p className="text-xs text-muted-foreground mt-0.5">Applicant identification, contact, and banking details</p>
                    </div>
                  </div>
                  {isEditor && !isFormDisabled && <Button type="button" onClick={() => openDialog('application', getValues(), false)} disabled={isSupervisor || isInvestigator || isViewer}><Eye className="h-4 w-4 mr-2" />Edit</Button>}
                </CardHeader>
                <CardContent><div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4"><DetailRow label="File No." value={watch('fileNo')} /><DetailRow label="Applicant Name &amp; Address" value={watch('applicantName')} /><DetailRow label="Applicant Name &amp; Address (Malayalam)" value={watch('applicantNameMl')} /><DetailRow label="Phone No." value={watch('phoneNo')} /><DetailRow label="Secondary Mobile No." value={watch('secondaryMobileNo')} /><DetailRow label="Email ID" value={watch('emailId')} /><DetailRow label="Category" value={watch('category')} /><DetailRow label="Type of Application" value={watch('applicationType') ? applicationTypeDisplayMap[watch('applicationType') as ApplicationType] : ''} /><DetailRow label="Bank Name" value={watch('bankName')} /><DetailRow label="Branch" value={watch('branch')} /><DetailRow label="Bank Account No." value={watch('bankAccountNo')} /><DetailRow label="IFSC" value={watch('ifsc')} /></div></CardContent>
              </Card>
            </div>

            {/* 2. Remittance Details */}
            <div className="relative">
              <div className="absolute -left-[37px] sm:-left-[45px] top-4 bg-background p-1 rounded-full border border-slate-200 dark:border-slate-700 shadow-xs z-10">
                <div className="bg-emerald-50 dark:bg-emerald-950/60 p-1.5 rounded-full text-emerald-600 dark:text-emerald-400">
                  <Receipt className="w-4 h-4" />
                </div>
              </div>
              <Card className="border-l-4 border-l-emerald-600 dark:border-l-emerald-500 shadow-xs">
                <CardHeader className="flex flex-row justify-between items-start">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400">
                      <Receipt className="h-5 w-5" />
                    </div>
                    <div>
                      <CardTitle className="text-xl font-bold tracking-tight text-foreground">{remittanceTitle}</CardTitle>
                      <p className="text-xs text-muted-foreground mt-0.5">Record of deposits and remittance credits</p>
                    </div>
                  </div>
                  {isEditor && !isFormDisabled && <Button type="button" onClick={() => openDialog('remittance', createDefaultRemittanceDetail())} disabled={isSupervisor || isInvestigator || isViewer}><PlusCircle className="h-4 w-4 mr-2" />Add</Button>}
                </CardHeader><CardContent><Table><TableHeader><TableRow><TableHead>Date</TableHead><TableHead>Amount (₹)</TableHead><TableHead>Account</TableHead><TableHead>Remarks</TableHead>{isEditor && !isFormDisabled && <TableHead>Actions</TableHead>}</TableRow></TableHeader><TableBody>{remittanceFields.length > 0 ? remittanceFields.map((item, index) => (
              <TableRow key={item.id}>
                  <TableCell>{item.dateOfRemittance ? format(new Date(item.dateOfRemittance), 'dd/MM/yyyy') : 'N/A'}</TableCell>
                  <TableCell>{(Number(item.amountRemitted) || 0).toLocaleString('en-IN')}</TableCell>
                  <TableCell>{item.remittedAccount}</TableCell>
                  <TableCell>{item.remittanceRemarks}</TableCell>
                  {isEditor && !isFormDisabled && <TableCell><div className="flex gap-1"><Button type="button" variant="ghost" size="icon" onClick={() => openDialog('remittance', { index, ...item }, false)}><Eye className="h-4 w-4"/></Button><Button type="button" variant="ghost" size="icon" className="text-destructive" onClick={() => setItemToDelete({type: 'remittance', index})} disabled={isSupervisor || isInvestigator || isViewer}><Trash2 className="h-4 w-4"/></Button></div></TableCell>}
              </TableRow>)) : <TableRow><TableCell colSpan={5} className="text-center h-24">No details added.</TableCell></TableRow>}</TableBody><TableFooterComponent><TableRow><TableCell colSpan={isEditor && !isFormDisabled ? 4 : 3} className="text-right font-bold">Total Remittance</TableCell><TableCell className="font-bold text-right">₹{totalRemittanceWatched?.toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2}) || '0.00'}</TableCell></TableRow></TableFooterComponent></Table></CardContent>
              </Card>
            </div>

            {/* 3. Re-appropriation Details */}
            <div className="relative">
              <div className="absolute -left-[37px] sm:-left-[45px] top-4 bg-background p-1 rounded-full border border-slate-200 dark:border-slate-700 shadow-xs z-10">
                <div className="bg-amber-50 dark:bg-amber-950/60 p-1.5 rounded-full text-amber-600 dark:text-amber-400">
                  <RefreshCw className="w-4 h-4" />
                </div>
              </div>
              <Accordion type="single" collapsible className="w-full" value={reappAccordionValue} onValueChange={setReappAccordionValue}>
                <AccordionItem value="reappropriation-details" className="border-b-0">
                  <Card className="border-l-4 border-l-amber-600 dark:border-l-amber-500 shadow-xs">
                    <div className="flex items-center justify-between border-b">
                      <div className="flex-1">
                        <AccordionTrigger className="w-full p-6 hover:no-underline [&[data-state=open]]:border-b-0">
                          <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400">
                              <RefreshCw className="h-5 w-5" />
                            </div>
                            <div className="text-left">
                              <CardTitle className="text-xl font-bold tracking-tight text-foreground">3. Re-appropriation Details</CardTitle>
                              <p className="text-xs text-muted-foreground mt-0.5 font-normal">Inter-file fund reappropriation and adjustments</p>
                            </div>
                          </div>
                        </AccordionTrigger>
                      </div>
                      <div className="flex items-center gap-2 pr-6 z-10 shrink-0">
                        <Button type="button" variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); setIsReappInfoOpen(true); }}><Info className="h-4 w-4 mr-2" />Info</Button>
                        {isEditor && !isFormDisabled && (<Button type="button" variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); openDialog('reappropriation', createDefaultReappropriationDetail()); }} disabled={isSupervisor || isInvestigator || isViewer}><PlusCircle className="mr-2 h-4 w-4" />Add</Button>)}
                      </div>
                    </div>
                    <AccordionContent>
                      <CardContent className="pt-6"><div className="w-full overflow-x-hidden"><Table><TableHeader><TableRow><TableHead>Date</TableHead><TableHead>Type of Page</TableHead><TableHead>File No</TableHead><TableHead>File Details</TableHead><TableHead className="text-right">AS Given (₹)</TableHead><TableHead className="text-right">Expenditure (₹)</TableHead><TableHead>Remarks</TableHead>{isEditor && !isFormDisabled && <TableHead className="text-center whitespace-nowrap w-20">Actions</TableHead>}</TableRow></TableHeader><TableBody>{sortedCombinedReappropriations.length > 0 ? sortedCombinedReappropriations.map((item, index) => {
                if (item._source === 'auto') {
                  const asVal = item.asGiven !== undefined && item.asGiven !== null ? Number(item.asGiven) : Number(item.amount) || 0;
                  const expVal = item.expenditure !== undefined && item.expenditure !== null ? Number(item.expenditure) : null;
                  return (
                    <TableRow key={`credit-${index}`} className="bg-green-50/50">
                      <TableCell className="whitespace-nowrap">{item.date ? format(new Date(item.date), 'dd/MM/yyyy') : 'N/A'}</TableCell>
                      <TableCell className="text-xs">{item.sourcePageType || 'N/A'}{item.parentRemittanceAccount && item.parentRemittanceAccount !== 'N/A' ? ` (${item.parentRemittanceAccount})` : ''}</TableCell>
                      <TableCell className="font-mono text-xs">{item.sourceFileNo}</TableCell>
                      <TableCell className="text-xs max-w-[250px] whitespace-normal break-words">{item.fileDetails || (item.siteName ? (item.siteName.startsWith('Site:') ? item.siteName : `Site: ${item.siteName}`) : (item.sourceApplicantName || 'N/A'))}</TableCell>
                      <TableCell className="text-right font-bold text-green-600">{asVal.toLocaleString('en-IN')}</TableCell>
                      <TableCell className="text-right font-bold text-green-600">{expVal !== null && expVal > 0 ? expVal.toLocaleString('en-IN') : '-'}</TableCell>
                      <TableCell className="text-xs italic max-w-[150px] whitespace-normal break-words">{item.remarks}</TableCell>
                      {isEditor && !isFormDisabled && <TableCell className="text-center"><TooltipProvider><Tooltip><TooltipTrigger asChild><Info className="h-4 w-4 text-muted-foreground mx-auto" /></TooltipTrigger><TooltipContent><p>Inward transfer from another file. Non-editable.</p></TooltipContent></Tooltip></TooltipProvider></TableCell>}
                    </TableRow>
                  );
                } else {
                  const asVal = item.asGiven !== undefined && item.asGiven !== null ? Number(item.asGiven) : Number(item.amount) || 0;
                  const expVal = item.expenditure !== undefined && item.expenditure !== null ? Number(item.expenditure) : null;
                  return (
                    <TableRow key={item.id}>
                      <TableCell className="whitespace-nowrap">{item.date ? format(new Date(item.date), 'dd/MM/yyyy') : 'N/A'}</TableCell>
                      <TableCell className="text-xs">{item.pageType || 'N/A'}</TableCell>
                      <TableCell className="font-mono text-xs">{item.refFileNo}</TableCell>
                      <TableCell className="text-xs max-w-[250px] whitespace-normal break-words">{item.fileDetails || (item.siteName ? (item.siteName.startsWith('Site:') ? item.siteName : `Site: ${item.siteName}`) : 'N/A')}</TableCell>
                      <TableCell className="text-right font-bold text-red-600">{asVal.toLocaleString('en-IN')}</TableCell>
                      <TableCell className="text-right font-bold text-red-600">{expVal !== null && expVal > 0 ? expVal.toLocaleString('en-IN') : '-'}</TableCell>
                      <TableCell className="text-xs italic max-w-[150px] whitespace-normal break-words">{item.remarks}</TableCell>
                      {isEditor && !isFormDisabled && <TableCell className="whitespace-nowrap text-center"><div className="flex flex-col items-center justify-center gap-1 min-w-[36px]"><Button type="button" variant="ghost" size="icon" onClick={() => openDialog('reappropriation', { index: item._originalIndex, ...item })} disabled={isSupervisor || isInvestigator || isViewer}><Eye className="h-4 w-4"/></Button><Button type="button" variant="ghost" size="icon" className="text-destructive" onClick={() => setItemToDelete({type: 'reappropriation', index: item._originalIndex})} disabled={isSupervisor || isInvestigator || isViewer}><Trash2 className="h-4 w-4"/></Button></div></TableCell>}
                    </TableRow>
                  );
                }
                }) : <TableRow><TableCell colSpan={9} className="text-center h-24">No details added.</TableCell></TableRow>}</TableBody><TableFooterComponent><TableRow className="bg-muted/50 font-bold"><TableCell colSpan={4} className="text-right font-bold">Total Re-appropriation</TableCell><TableCell className="text-right text-green-600 font-bold">{totalReappropriationCreditWatched > 0 ? `₹${totalReappropriationCreditWatched.toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2})}` : '-'}</TableCell><TableCell className="text-right text-red-600 font-bold">{totalReappropriationWatched > 0 ? `₹${totalReappropriationWatched.toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2})}` : '-'}</TableCell><TableCell className="text-right text-blue-600 font-bold">{(() => { const totalExp = sortedCombinedReappropriations.reduce((sum, item) => sum + (item.expenditure !== undefined && item.expenditure !== null ? Number(item.expenditure) : 0), 0); return totalExp > 0 ? `₹${totalExp.toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2})}` : '-'; })()}</TableCell><TableCell colSpan={isEditor && !isFormDisabled ? 2 : 1}></TableCell></TableRow></TableFooterComponent></Table></div></CardContent></AccordionContent></Card></AccordionItem></Accordion>
            </div>
            
            {/* 4. Site Details */}
            <div className="relative">
              <div className="absolute -left-[37px] sm:-left-[45px] top-4 bg-background p-1 rounded-full border border-slate-200 dark:border-slate-700 shadow-xs z-10">
                <div className="bg-purple-50 dark:bg-purple-950/60 p-1.5 rounded-full text-purple-600 dark:text-purple-400">
                  <MapPin className="w-4 h-4" />
                </div>
              </div>
              <Card className="border-l-4 border-l-purple-600 dark:border-l-purple-500 shadow-xs">
                <CardHeader className="flex flex-row justify-between items-start">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400">
                      <MapPin className="h-5 w-5" />
                    </div>
                    <div>
                      <CardTitle className="text-xl font-bold tracking-tight text-foreground">4. Site Details</CardTitle>
                      <p className="text-xs text-muted-foreground mt-0.5">Investigation sites, location data, and feasibility outcomes</p>
                    </div>
                  </div>
                  {isEditor && !isFormDisabled && <Button type="button" onClick={() => openDialog('site', {})} disabled={isSupervisor || isInvestigator || isViewer}><PlusCircle className="h-4 w-4 mr-2" />Add Site</Button>}
                </CardHeader>
                <CardContent>
                  <Accordion type="single" collapsible className="w-full space-y-2" value={activeAccordionItem} onValueChange={setActiveAccordionItem}>
                    {siteFields.length > 0 ? (
                      siteFields.map((site, index) => (
                        <AccordionItem key={site.id} value={`site-${index}`} className="border bg-background rounded-lg shadow-sm">
                          <div className="flex items-center justify-between pr-4">
                            <div className="flex-1">
                              <AccordionTrigger className="text-base font-semibold px-4 group hover:no-underline focus-visible:outline-none">
                                <div className="flex flex-wrap items-center gap-2 text-left">
                                  <span className="font-semibold text-foreground">
                                    Site #{index + 1}:{" "}
                                    <span className={cn("font-semibold", getSiteNameStatusColorClass(site.workStatus))}>
                                      {site.nameOfSite || "Unnamed Site"}
                                    </span>
                                    {site.purpose ? (
                                      <span className="text-muted-foreground font-normal"> ({site.purpose})</span>
                                    ) : null}
                                  </span>
                                  {renderSiteStatusBadge(site.workStatus)}
                                </div>
                              </AccordionTrigger>
                            </div>
                            <div className="flex items-center space-x-1 ml-2 shrink-0 z-10 relative">
                              <TooltipProvider><Tooltip><TooltipTrigger asChild><Button type="button" variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => { e.preventDefault(); e.stopPropagation(); openDialog('site', { index, ...site }, !!dialogState.isView || !!isFormDisabled || isViewer); }}><Eye className="h-4 w-4"/></Button></TooltipTrigger><TooltipContent><p>View / Edit Site</p></TooltipContent></Tooltip></TooltipProvider>
                              {!isFormDisabled && !isViewer && !isInvestigator && (
                                <>
                                  <TooltipProvider><Tooltip><TooltipTrigger asChild><Button type="button" variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => { e.preventDefault(); e.stopPropagation(); openDialog('moveCopySite', { index, name: site.nameOfSite }); }}><Move className="h-4 w-4"/></Button></TooltipTrigger><TooltipContent><p>Move or Copy Site</p></TooltipContent></Tooltip></TooltipProvider>
                                  <TooltipProvider><Tooltip><TooltipTrigger asChild><Button type="button" variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => { e.preventDefault(); e.stopPropagation(); openDialog('reorderSite', getValues('siteDetails')); }}><ArrowUpDown className="h-4 w-4"/></Button></TooltipTrigger><TooltipContent><p>Reorder Sites</p></TooltipContent></Tooltip></TooltipProvider>
                                  <TooltipProvider><Tooltip><TooltipTrigger asChild><Button type="button" variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={(e) => { e.preventDefault(); e.stopPropagation(); setItemToDelete({type: 'site', index}); }}><Trash2 className="h-4 w-4" /></Button></TooltipTrigger><TooltipContent><p>Delete Site</p></TooltipContent></Tooltip></TooltipProvider>
                                </>
                              )}
                            </div>
                          </div>
                          <AccordionContent className="p-6 pt-0">
                            <div className="border-t pt-6 space-y-4">
                              <dl className="grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-4">
                                <DetailRow label="Purpose" value={site.purpose} />
                                <DetailRow label="Status" value={site.workStatus} />
                                <DetailRow label="Contractor" value={site.contractorName} />
                                <DetailRow label="Supervisor" value={site.supervisorName} />
                              </dl>
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                      ))
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">No sites added.</div>
                    )}
                  </Accordion>
                </CardContent>
              </Card>
            </div>
            {/* 5. Payment Details */}
            <div className="relative">
              <div className="absolute -left-[37px] sm:-left-[45px] top-4 bg-background p-1 rounded-full border border-slate-200 dark:border-slate-700 shadow-xs z-10">
                <div className="bg-rose-50 dark:bg-rose-950/60 p-1.5 rounded-full text-rose-600 dark:text-rose-400">
                  <CreditCard className="w-4 h-4" />
                </div>
              </div>
              <Card className="border-l-4 border-l-rose-600 dark:border-l-rose-500 shadow-xs">
                <CardHeader className="flex flex-row justify-between items-start">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400">
                      <CreditCard className="h-5 w-5" />
                    </div>
                    <div>
                      <CardTitle className="text-xl font-bold tracking-tight text-foreground">5. Payment Details</CardTitle>
                      <p className="text-xs text-muted-foreground mt-0.5">Disbursements, contractor bills, and site allocations</p>
                    </div>
                  </div>
                  {isEditor && !isFormDisabled && <Button type="button" onClick={() => openDialog('payment', createDefaultPaymentDetail())} disabled={isSupervisor || isInvestigator || isViewer}><PlusCircle className="h-4 w-4 mr-2" />Add</Button>}
                </CardHeader><CardContent><div className="w-full overflow-x-hidden"><Table><TableHeader><TableRow><TableHead>Date</TableHead><TableHead>Account</TableHead><TableHead className="text-right w-24 sm:w-28 leading-tight">Total Payment<br /><span className="text-xs font-normal text-muted-foreground">(₹)</span></TableHead><TableHead className="min-w-[180px]">Name of Site</TableHead><TableHead>Remarks</TableHead>{isEditor && !isFormDisabled && <TableHead>Actions</TableHead>}</TableRow></TableHeader><TableBody>{sortedPaymentFields.length > 0 ? sortedPaymentFields.map((item) => (
                <TableRow key={item.id} className={item.remittanceId ? 'bg-muted/50' : ''}>
                    <TableCell className="whitespace-nowrap">{item.dateOfPayment ? format(new Date(item.dateOfPayment), 'dd/MM/yy') : 'N/A'}</TableCell>
                    <TableCell className="whitespace-nowrap">{item.remittanceId ? 'Revenue Head' : item.paymentAccount}</TableCell>
                    <TableCell className="text-right font-medium w-24 sm:w-28 whitespace-nowrap font-mono">{(Number(item.totalPaymentPerEntry) || 0).toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</TableCell>
                    <TableCell className="whitespace-normal break-words min-w-[180px] max-w-[320px]">
                        {item.siteAllocations && item.siteAllocations.length > 0 ? (
                            <div className="text-xs space-y-1.5">
                                {item.siteAllocations.map((alloc: any, aIdx: number) => {
                                    const matchedSite = (watchedSiteDetails || getValues('siteDetails') || []).find((s: any) => 
                                        (alloc.siteId && s.id && alloc.siteId === s.id) || 
                                        (alloc.siteName && s.nameOfSite && alloc.siteName.trim().toLowerCase() === s.nameOfSite.trim().toLowerCase())
                                    );
                                    const rawSiteName = (alloc.siteName || matchedSite?.nameOfSite || `Site #${aIdx + 1}`).trim();
                                    const purpose = (alloc.purpose || matchedSite?.purpose || '').trim();
                                    const displayName = purpose && !rawSiteName.toLowerCase().includes(purpose.toLowerCase())
                                        ? `${rawSiteName} (${purpose})`
                                        : rawSiteName;

                                    return (
                                        <div key={aIdx} className="flex justify-between items-start gap-2 py-0.5 border-b border-border/40 last:border-b-0">
                                            <span className="font-medium text-foreground whitespace-normal break-words">{displayName}</span>
                                            <span className="font-semibold font-mono text-primary whitespace-nowrap shrink-0">₹{(Number(alloc.amount) || 0).toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            (() => {
                                const rawName = (item.nameOfSite || 'General / All Sites').trim();
                                const matchedSite = (watchedSiteDetails || getValues('siteDetails') || []).find((s: any) => 
                                    s.nameOfSite && rawName && s.nameOfSite.trim().toLowerCase() === rawName.trim().toLowerCase()
                                );
                                const purpose = (matchedSite?.purpose || '').trim();
                                const displayName = purpose && !rawName.toLowerCase().includes(purpose.toLowerCase())
                                    ? `${rawName} (${purpose})`
                                    : rawName;

                                return (
                                    <div className="font-medium text-foreground whitespace-normal break-words">
                                        {displayName}
                                    </div>
                                );
                            })()
                        )}
                    </TableCell>
                    <TableCell className="max-w-[200px] whitespace-normal break-words">{item.paymentRemarks || '-'}</TableCell>
                    {isEditor && !isFormDisabled && (
                        <TableCell>
                            <div className="flex gap-1">
                                {item.remittanceId ? (
                                    <TooltipProvider><Tooltip>
                                        <TooltipTrigger asChild>
                                            <div className="flex w-full justify-center">
                                                <Info className="h-4 w-4 text-muted-foreground" />
                                            </div>
                                        </TooltipTrigger>
                                        <TooltipContent><p>Auto-entry. Cannot be edited or deleted directly.</p></TooltipContent>
                                    </Tooltip></TooltipProvider>
                                ) : (
                                    <>
                                        <Button type="button" variant="ghost" size="icon" onClick={() => openDialog('payment', { index: item._originalIndex, ...item }, false)}><Eye className="h-4 w-4"/></Button>
                                        <Button type="button" variant="ghost" size="icon" className="text-destructive" onClick={() => setItemToDelete({type: 'payment', index: item._originalIndex})}><Trash2 className="h-4 w-4"/></Button>
                                    </>
                                )}
                            </div>
                        </TableCell>
                    )}
                </TableRow>)) : <TableRow><TableCell colSpan={5 + (isEditor && !isFormDisabled ? 1 : 0)} className="text-center h-24">No payments added.</TableCell></TableRow>}</TableBody><TableFooterComponent><TableRow><TableCell colSpan={2} className="text-right font-bold">Total Payment</TableCell><TableCell className="font-bold text-right w-24 sm:w-28 whitespace-nowrap font-mono">₹{totalPaymentWatched?.toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2}) || '0.00'}</TableCell><TableCell colSpan={isEditor && !isFormDisabled ? 3 : 2}></TableCell></TableRow></TableFooterComponent></Table></div></CardContent></Card>
            </div>

            {/* 6. Final Details */}
            <div className="relative">
              <div className="absolute -left-[37px] sm:-left-[45px] top-4 bg-background p-1 rounded-full border border-slate-200 dark:border-slate-700 shadow-xs z-10">
                <div className="bg-indigo-50 dark:bg-indigo-950/60 p-1.5 rounded-full text-indigo-600 dark:text-indigo-400">
                  <BarChart3 className="w-4 h-4" />
                </div>
              </div>
              <Card className="border-l-4 border-l-indigo-600 dark:border-l-indigo-500 shadow-xs">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400">
                      <BarChart3 className="h-5 w-5" />
                    </div>
                    <div>
                      <CardTitle className="text-xl font-bold tracking-tight text-foreground">6. Final Details</CardTitle>
                      <p className="text-xs text-muted-foreground mt-0.5">Financial reconciliation and final status</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="p-4 border rounded-lg space-y-4 bg-secondary/30">
                            <h3 className="font-semibold text-lg text-primary">Financial Summary</h3>
                            <dl className="space-y-2">
                                <div className="flex justify-between items-baseline"><dt>Total Remittance</dt><dd className="font-mono">₹{totalRemittanceWatched?.toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2}) || '0.00'}</dd></div>
                                <div className="flex justify-between items-baseline text-green-600 font-semibold"><dt>Total Re-appropriation credit</dt><dd className="font-mono font-bold">₹{(totalReappropriationCreditWatched || 0).toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</dd></div>
                                <div className="flex justify-between items-baseline"><dt>Total Payment</dt><dd className="font-mono">₹{totalPaymentWatched?.toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2}) || '0.00'}</dd></div>
                                <div className="flex justify-between items-baseline text-red-600 font-semibold"><dt>Total Re-appropriation debit</dt><dd className="font-mono font-bold">₹{(totalReappropriationWatched || 0).toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2}) || '0.00'}</dd></div>
                                <Separator /><div className="flex justify-between items-baseline font-bold"><dt>Overall Balance</dt><dd className="font-mono text-xl">₹{(watch('overallBalance') || 0).toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2}) || '0.00'}</dd></div>
                            </dl>
                        </div>
                        <div className="p-4 border rounded-lg space-y-4 bg-secondary/30">
                            <FormField control={control} name="fileStatus" render={({ field }) => <FormItem><FormLabel>File Status <span className="text-destructive">*</span></FormLabel><Select onValueChange={field.onChange} value={field.value} disabled={isViewer || isFormDisabled || isSupervisor || isInvestigator}><FormControl><SelectTrigger><SelectValue placeholder="Select final file status" /></SelectTrigger></FormControl><SelectContent>{INVESTIGATION_FILE_STATUS_OPTIONS.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>} />
                            <FormField control={control} name="remarks" render={({ field }) => <FormItem><FormLabel>Final Remarks</FormLabel><FormControl><Textarea {...field} value={field.value ?? ''} onChange={(e) => { field.onChange(e); setIsManualDirty(true); }} placeholder="Final remarks..." readOnly={isViewer || isFormDisabled || isSupervisor || isInvestigator} /></FormControl><FormMessage /></FormItem>} />
                        </div>
                    </div>
                </CardContent>
            </Card>
            </div>
            
            {/* 7. Print Reports Section */}
            <div className="relative">
              <div className="absolute -left-[37px] sm:-left-[45px] top-4 bg-background p-1 rounded-full border border-slate-200 dark:border-slate-700 shadow-xs z-10">
                <div className="bg-slate-100 dark:bg-slate-800 p-1.5 rounded-full text-slate-700 dark:text-slate-300">
                  <Printer className="w-4 h-4" />
                </div>
              </div>
              <Card className="border-l-4 border-l-slate-600 dark:border-l-slate-400 shadow-xs">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                      <Printer className="h-5 w-5" />
                    </div>
                    <div>
                      <CardTitle className="text-xl font-bold tracking-tight text-foreground">7. Print Reports</CardTitle>
                      <p className="text-xs text-muted-foreground mt-0.5">Generate and print official hydrogeological investigation and feasibility reports</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                        Generate, preview, and print official Hydrogeological Investigation Reports and Feasibility Reports (Malayalam) for this investigation file.
                    </p>
                    <div className="flex flex-wrap gap-3">
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => handleOpenReportInSameWindow('investigation_report')}
                            className="bg-background shadow-xs hover:bg-accent border-primary/25 h-9"
                        >
                            <FileText className="mr-2 h-4 w-4 text-blue-600" />
                            1. Investigation Report (English)
                        </Button>
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => handleOpenReportInSameWindow('feasibility_report')}
                            className="bg-background shadow-xs hover:bg-accent border-primary/25 h-9"
                        >
                            <FileText className="mr-2 h-4 w-4 text-emerald-600" />
                            2. Feasibility Report (മലയാളം)
                        </Button>
                    </div>
                </CardContent>
            </Card>
            </div>
          </div>
            <CardFooter className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border-t bg-muted/20 py-3 px-6">
                <div className="flex flex-wrap items-center gap-2.5">
                    {isAutoSaving && (
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800 animate-pulse">
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            <span>Auto-saving calculations...</span>
                        </div>
                    )}
                    {isSubmitting && (
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800 animate-pulse">
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            <span>Saving file...</span>
                        </div>
                    )}
                    {!isSubmitting && !isAutoSaving && isManualDirty && (
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                            <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
                            <span>Unsaved manual changes</span>
                        </div>
                    )}
                    {!isSubmitting && !isAutoSaving && !isManualDirty && lastSavedAt && (
                        lastSavedType === 'auto' ? (
                            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                                <CheckCircle2 className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                                <span>Auto Saved</span>
                            </div>
                        ) : (
                            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                                <span>Manually Saved</span>
                            </div>
                        )
                    )}
                    {lastSavedAt ? (
                        <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground font-mono">
                            <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                            <span>{lastSavedType === 'auto' ? 'Auto Saved' : 'Manually Saved'} at <strong className="text-foreground font-semibold">{format(lastSavedAt, "dd/MM/yyyy, hh:mm:ss a")}</strong></span>
                        </span>
                    ) : (
                        <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground font-mono">
                            <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                            <span>Not saved yet</span>
                        </span>
                    )}
                </div>

                <div className="flex items-center justify-end gap-2 shrink-0">
                    <Button type="button" variant="outline" onClick={() => router.push(returnPath)} disabled={isSubmitting || isAutoSaving}>
                        <X className="mr-2 h-4 w-4" /> Close
                    </Button>
                    {!(isViewer || isFormDisabled) && (
                        <Button 
                            type="submit" 
                            disabled={isSubmitting || isAutoSaving || !isManualDirty}
                            className={isManualDirty ? "bg-primary text-primary-foreground shadow-sm hover:bg-primary/90 font-semibold" : "opacity-50 cursor-not-allowed"}
                        >
                            <Save className="mr-2 h-4 w-4"/> {isSubmitting ? "Saving..." : 'Save'}
                        </Button>
                    )}
                </div>
            </CardFooter>
        </form>
        <Dialog open={dialogState.type === 'application'} onOpenChange={closeDialog}><DialogContent onPointerDownOutside={(e) => e.preventDefault()} className="max-w-4xl"><ApplicationDialogContent initialData={dialogState.data} onConfirm={handleDialogConfirm} onCancel={closeDialog} workTypeContext={workTypeContext} isEditing={isEditing} fileIdToEdit={fileIdToEdit} /></DialogContent></Dialog>
        <Dialog open={dialogState.type === 'remittance'} onOpenChange={closeDialog}><DialogContent onPointerDownOutside={(e) => e.preventDefault()} className="max-w-3xl"><RemittanceDialogContent initialData={dialogState.data} onConfirm={handleDialogConfirm} onCancel={closeDialog} category={getValues('category')} /></DialogContent></Dialog>
        <Dialog open={dialogState.type === 'reappropriation'} onOpenChange={closeDialog}><DialogContent onPointerDownOutside={(e) => e.preventDefault()} className="max-w-3xl"><ReappropriationDialogContent initialData={dialogState.data} onConfirm={handleDialogConfirm} onCancel={closeDialog} /></DialogContent></Dialog>
        <Dialog open={dialogState.type === 'site'} onOpenChange={closeDialog}><DialogContent onPointerDownOutside={(e) => e.preventDefault()} className="max-w-6xl h-[90vh] flex flex-col p-0"><InvestigationSiteDialog initialData={{ ...dialogState.data, fileNo: dialogState.data?.fileNo || watch('fileNo') || currentFileNo, officeLocation: (dialogState.data as any)?.officeLocation || watch('officeLocation') || getValues('officeLocation') || watch('district') || getValues('district') || (user as any)?.officeLocation || 'kollam', district: (dialogState.data as any)?.district || watch('district') || getValues('district') || watch('officeLocation') || (user as any)?.officeLocation || 'kollam' }} onConfirm={handleDialogConfirm} onCancel={closeDialog} isReadOnly={!!dialogState.isView || !!isFormDisabled} isSupervisor={isSupervisor} isInvestigator={isInvestigator} allLsgConstituencyMaps={allLsgConstituencyMaps} allStaffMembers={allStaffMembers} workTypeContext={workTypeContext} userDesignation={userDesignation} /></DialogContent></Dialog>
        <Dialog open={dialogState.type === 'payment'} onOpenChange={closeDialog}><DialogContent onPointerDownOutside={(e) => e.preventDefault()} className="max-w-4xl h-[90vh] max-h-[90vh] flex flex-col p-0 overflow-hidden"><PaymentDialogContent initialData={dialogState.data} onConfirm={handleDialogConfirm} onCancel={closeDialog} isDeferredFunding={false} siteDetails={watch('siteDetails') || getValues('siteDetails')} /></DialogContent></Dialog>
        <Dialog open={dialogState.type === 'reorderSite'} onOpenChange={closeDialog}><DialogContent onPointerDownOutside={(e) => e.preventDefault()} className="max-w-2xl flex flex-col p-0"><ReorderSitesDialog initialData={dialogState.data || []} onConfirm={handleDialogConfirm} onCancel={closeDialog} /></DialogContent></Dialog>
        <Dialog open={dialogState.type === 'moveCopySite'} onOpenChange={closeDialog}>
            <DialogContent onPointerDownOutside={(e) => e.preventDefault()} className="sm:max-w-md">
                <MoveCopySiteDialog 
                    isOpen={dialogState.type === 'moveCopySite'} 
                    onClose={closeDialog} 
                    onConfirm={handleMoveCopySiteConfirm} 
                    siteName={dialogState.data?.name || ''} 
                    currentModule="gwInvestigation"
                    currentFileNo={currentFileNo}
                />
            </DialogContent>
        </Dialog>
        <AlertDialog open={itemToDelete !== null} onOpenChange={() => setItemToDelete(null)}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                    <AlertDialogDescription>Delete this entry?</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDeleteItem} className="bg-destructive">Delete</AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
        <Dialog open={isReappInfoOpen} onOpenChange={setIsReappInfoOpen}>
          <DialogContent className="sm:max-w-md p-0">
            <DialogHeader className="p-6 pb-4 border-b">
              <DialogTitle>Re-appropriation Credit Planning</DialogTitle>
            </DialogHeader>
            <div className="p-6 text-sm text-muted-foreground space-y-3">
              <p>Entry of re-appropriation credits cannot be added manually.</p>
              <p>If this work depends on funds from another file, please first save this file without adding site details. Then, go to the source file and perform an “Outward” re-appropriation, specifying this file number as the target.</p>
              <p>Once the credit appears here, you may return to add the site details.</p>
            </div>
            <DialogFooter className="p-6 pt-4 border-t shrink-0">
              <DialogClose asChild>
                <Button type="button">Close</Button>
              </DialogClose>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </FormProvider>
  );
}

function ReorderSitesDialog({ initialData, onConfirm, onCancel }: { initialData: SiteDetailFormData[], onConfirm: (data: SiteDetailFormData[]) => void, onCancel: () => void }) {
    const [sites, setSites] = useState(Array.isArray(initialData) ? [...initialData] : []);

    const move = (fromIndex: number, toIndex: number) => {
        const newSites = [...sites];
        const [movedItem] = newSites.splice(fromIndex, 1);
        newSites.splice(toIndex, 0, movedItem);
        setSites(newSites);
    };

    return (
        <div className="flex flex-col h-full overflow-hidden">
            <DialogHeader className="p-6 pb-4 shrink-0 border-b">
                <DialogTitle>Reorder Sites</DialogTitle>
                <DialogDescription>Adjust the sequence of sites using the up and down arrows.</DialogDescription>
            </DialogHeader>
            <div className="flex-1 min-h-0 px-6 py-4">
                <ScrollArea className="h-[50vh]">
                    <div className="space-y-2">
                        {sites.map((site, index) => (
                            <div key={index} className="flex items-center justify-between p-3 border rounded-lg bg-secondary/20">
                                <div className="flex-1">
                                    <p className="text-sm font-bold">Site #{index + 1}: {site.nameOfSite || 'Unnamed Site'}</p>
                                    <p className="text-xs text-muted-foreground">{site.purpose}</p>
                                </div>
                                <div className="flex items-center gap-1">
                                    <Button type="button" variant="ghost" size="icon" disabled={index === 0} onClick={() => move(index, index - 1)}><ChevronLeft className="h-4 w-4 rotate-90"/></Button>
                                    <Button type="button" variant="ghost" size="icon" disabled={index === sites.length - 1} onClick={() => move(index, index + 1)}><ChevronRight className="h-4 w-4 rotate-90"/></Button>
                                </div>
                            </div>
                        ))}
                    </div>
                </ScrollArea>
            </div>
            <DialogFooter className="p-6 pt-4 border-t shrink-0">
                <Button variant="outline" onClick={onCancel}>Cancel</Button>
                <Button onClick={() => onConfirm(sites)}>Save Order</Button>
            </DialogFooter>
        </div>
    );
}
