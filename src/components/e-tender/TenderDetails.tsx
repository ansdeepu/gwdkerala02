
// src/components/e-tender/TenderDetails.tsx
"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { useTenderData } from './TenderDataContext';
import { useE_tenders } from '@/hooks/useE_tenders';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm, FormProvider, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { E_tenderSchema, type E_tenderFormData, type Bidder, type Corrigendum, eTenderStatusOptions, type RetenderDetails } from '@/lib/schemas/eTenderSchema';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Loader2, Save, Edit, PlusCircle, Trash2, FileText, Building, GitBranch, FolderOpen, ScrollText, Download, Users, Bell, ArrowLeft, Link as LinkIcon, X } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { toDateOrNull, formatDateSafe, getStatusBadgeClass, calculateSelectionNoticeValues } from './utils';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { v4 as uuidv4 } from 'uuid';
import { isValid, parseISO } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';

import BasicDetailsForm from './BasicDetailsForm';
import TenderOpeningDetailsForm from './TenderOpeningDetailsForm';
import BidderForm from './BidderForm';
import WorkOrderDetailsForm from './WorkOrderDetailsForm';
import SelectionNoticeForm from './SelectionNoticeForm';
import CorrigendumForm from './CorrigendumForm';
import RetenderDetailsForm from './RetenderDetailsForm';
import { useDataStore } from '@/hooks/use-data-store';
import PdfReportDialogs from './pdf/PdfReportDialogs'; 
import { Textarea } from '../ui/textarea';
import { Tooltip, TooltipProvider, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { evaluateLabourSociety } from '@/lib/labourSocietyUtils';
import LabourSocietyNegotiationCard from './LabourSocietyNegotiationCard';
import LabourSocietyNegotiationDialog from './LabourSocietyNegotiationDialog';


type ModalType = 'basic' | 'opening' | 'bidders' | 'addBidder' | 'editBidder' | 'workOrder' | 'selectionNotice' | 'addCorrigendum' | 'editCorrigendum' | 'addRetender' | 'editRetender' | null;

const SELECTION_NOTICE_CLEAR_DATA: Partial<E_tenderFormData> = {
  selectionNoticeDate: null,
  performanceGuaranteeAmount: null,
  additionalPerformanceGuaranteeAmount: null,
  stampPaperAmount: null,
  amountType: null,
  performanceGuaranteeDescription: null,
  additionalPerformanceGuaranteeDescription: null,
  stampPaperDescription: null,
};

const OPENING_DETAILS_CLEAR_DATA: Partial<E_tenderFormData> = {
  dateOfOpeningBid: null,
  dateOfTechnicalAndFinancialBidOpening: null,
  technicalCommitteeMember1: null,
  technicalCommitteeMember2: null,
  technicalCommitteeMember3: null,
};

const WORK_ORDER_CLEAR_DATA: Partial<E_tenderFormData> = {
    agreementDate: null,
    dateWorkOrder: null,
    nameOfAssistantEngineer: null,
    supervisor1Id: null,
    supervisor1Name: null,
    supervisor1Phone: null,
    supervisor2Id: null,
    supervisor2Name: null,
    supervisor2Phone: null,
    supervisor3Id: null,
    supervisor3Name: null,
    supervisor3Phone: null,
    stampPaperAmountSubmitted: null,
    performanceGuaranteeAmountSubmitted: null,
    additionalPerformanceGuaranteeAmountSubmitted: null,
    securityDepositRemarks: null,
};


const DetailRow = ({ label, value, subValue, isCurrency = false, noComma = false, align = 'left', isLink = false, isReceiptFormat = false, isOpeningFormat = false }: { label: string; value: any; subValue?: string; isCurrency?: boolean, noComma?: boolean, align?: 'left' | 'center' | 'right', isLink?: boolean, isReceiptFormat?: boolean, isOpeningFormat?: boolean }) => {
    if (value === null || value === undefined || value === '' || (typeof value === 'number' && isNaN(value))) {
        return null;
    }

    let displayValue = String(value);

    // Custom formatting for specific labels
    if (label.toLowerCase().includes('date') || isReceiptFormat || isOpeningFormat) {
        const isTimeIncluded = label.toLowerCase().includes('time') || isReceiptFormat || isOpeningFormat;
        
        // This combines all logic into one call
        const formatted = formatDateSafe(value, isTimeIncluded, isReceiptFormat, isOpeningFormat);

        if (formatted === 'N/A' && value) {
            displayValue = String(value);
        } else if (formatted !== 'N/A') {
            displayValue = formatted;
        } else {
            return null;
        }
    } else if (typeof value === 'number') {
        if (isCurrency) {
            displayValue = noComma
                ? `Rs. ${value.toFixed(2)}`
                : `Rs. ${value.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        } else {
            displayValue = noComma ? `${value}` : value.toLocaleString('en-IN');
        }
    }

    return (
        <div className={cn(align === 'center' && 'text-center')}>
            <dt className="text-sm font-medium text-muted-foreground">{label}</dt>
            <dd className={cn(
                "text-sm font-semibold",
                label.toLowerCase().includes('malayalam') && "text-xs",
            )}>
              {isLink ? (
                <a href={displayValue} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className="flex items-center gap-1 text-blue-600 hover:underline">
                    <LinkIcon className="h-3 w-3"/>
                    <span>Open Link</span>
                </a>
              ) : (
                <>
                    {displayValue}
                    {subValue && <span className="text-xs text-muted-foreground ml-1">({subValue})</span>}
                </>
              )}
            </dd>
        </div>
    );
};


export default function TenderDetails() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { user, isLoading: isAuthLoading } = useAuth();
    const { tender, initialTender, updateTender } = useTenderData();
    const { addTender, updateTender: saveTenderToDb } = useE_tenders();
    const { allStaffMembers, officeAddress, allBidders } = useDataStore();
    const [activeModal, setActiveModal] = useState<ModalType>(null);
    const [modalData, setModalData] = useState<any>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isClearOpeningDetailsConfirmOpen, setIsClearOpeningDetailsConfirmOpen] = useState(false);
    const [isClearSelectionNoticeConfirmOpen, setIsClearSelectionNoticeConfirmOpen] = useState(false);
    const [isClearWorkOrderConfirmOpen, setIsClearWorkOrderConfirmOpen] = useState(false);
    const [retenderToDelete, setRetenderToDelete] = useState<{ id: string; index: number } | null>(null);
    const [isNegotiationOpen, setIsNegotiationOpen] = useState(false);

    const isReadOnly = isAuthLoading || !user || user.role === 'viewer' || user.role === 'supervisor';

    const form = useForm<E_tenderFormData>({
        resolver: zodResolver(E_tenderSchema),
        defaultValues: tender,
    });

    const { control, getValues, setValue, handleSubmit: handleFormSubmit, watch, formState: { isDirty }, reset } = form;
    const { fields: bidderFields, append: appendBidder, update: updateBidder, remove: removeBidder } = useFieldArray({ control, name: "bidders" });
    const { fields: corrigendumFields, append: appendCorrigendum, update: updateCorrigendum, remove: removeCorrigendum } = useFieldArray({ control, name: "corrigendums" });
    const { fields: retenderFields, append: appendRetender, update: updateRetender, remove: removeRetender } = useFieldArray({ control, name: "retenders" });

    const watchedPresentStatus = watch('presentStatus');
    const watchedRemarks = watch('remarks');

    const isFormDirty = useMemo(() => {
        if (watchedPresentStatus !== initialTender.presentStatus) return true;
        if ((watchedRemarks || '') !== (initialTender.remarks || '')) return true;
        return JSON.stringify(tender) !== JSON.stringify(initialTender);
    }, [watchedPresentStatus, watchedRemarks, tender, initialTender]);


    const handleFinalSave = async () => {
        setIsSubmitting(true);
        try {
            await handleSave(getValues(), true);
            toast({ title: "Tender Saved", description: "All changes have been successfully persisted." });
        } catch (error: any) {
            toast({ title: "Error", description: error.message, variant: "destructive" });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleSave = async (data: Partial<E_tenderFormData>, isFinalSave = false) => {
        if (!isFinalSave) {
            // Update local state ONLY
            Object.entries(data).forEach(([key, value]) => {
                setValue(key as keyof E_tenderFormData, value, { shouldDirty: true, shouldValidate: true });
            });
            // Update context so child components (like reports) see the new data immediately
            updateTender(data);
            setActiveModal(null);
            return;
        }

        setIsSubmitting(true);
        try {
            const currentData = getValues();
            const updatedData = { ...currentData, ...data };
            
            const dataForSave = {
              ...updatedData,
              tenderDate: toDateOrNull(updatedData.tenderDate),
              dateTimeOfReceipt: toDateOrNull(updatedData.dateTimeOfReceipt),
              dateTimeOfOpening: toDateOrNull(updatedData.dateTimeOfOpening),
              dateOfOpeningBid: toDateOrNull(updatedData.dateOfOpeningBid),
              dateOfTechnicalAndFinancialBidOpening: toDateOrNull(updatedData.dateOfTechnicalAndFinancialBidOpening),
              selectionNoticeDate: toDateOrNull(updatedData.selectionNoticeDate),
              agreementDate: toDateOrNull(updatedData.agreementDate),
              dateWorkOrder: toDateOrNull(updatedData.dateWorkOrder),
              corrigendums: (updatedData.corrigendums || []).map(c => ({
                  ...c,
                  corrigendumDate: toDateOrNull(c.corrigendumDate),
                  lastDateOfReceipt: toDateOrNull(c.lastDateOfReceipt),
                  dateOfOpeningTender: toDateOrNull(c.dateOfOpeningTender),
              })),
              retenders: (updatedData.retenders || []).map(r => ({
                ...r,
                retenderDate: toDateOrNull(r.retenderDate),
                lastDateOfReceipt: toDateOrNull(r.lastDateOfReceipt),
                dateOfOpeningTender: toDateOrNull(r.dateOfOpeningTender),
              })),
              labourSocietyNegotiation: updatedData.labourSocietyNegotiation ? {
                ...updatedData.labourSocietyNegotiation,
                negotiationDate: toDateOrNull(updatedData.labourSocietyNegotiation.negotiationDate),
              } : null,
            };

            if (tender.id === 'new') {
                const newTenderId = await addTender(dataForSave);
                toast({ title: "Tender Created", description: "Initial creation successful." });
                router.replace(`/dashboard/e-tender/${newTenderId}`);
            } else {
                await saveTenderToDb(tender.id, dataForSave);
                updateTender(dataForSave);
                reset(updatedData); // Reset to clear isDirty flag
            }
        } catch (error: any) {
            console.error("Save Error:", error);
            toast({ title: "Error Saving", description: error.message || "An unknown error occurred.", variant: "destructive" });
            throw error;
        } finally {
            setIsSubmitting(false);
            setActiveModal(null);
        }
    };


    useEffect(() => {
        reset(tender);
    }, [tender, reset]);

    const syncSelectionNoticeWithBidders = (updatedBidders: Bidder[]) => {
        const currentFormValues = getValues();
        const evalResult = evaluateLabourSociety({
            bidders: updatedBidders,
            estimateAmount: currentFormValues.estimateAmount ?? tender.estimateAmount,
            savedNegotiation: currentFormValues.labourSocietyNegotiation ?? tender.labourSocietyNegotiation,
        });

        const effectiveAmount = (evalResult.isNegotiationAgreed && typeof evalResult.negotiatedAmount === 'number')
            ? evalResult.negotiatedAmount
            : undefined;

        const snValues = calculateSelectionNoticeValues({
            tender: {
                ...tender,
                ...currentFormValues,
                contractAmount: effectiveAmount ?? currentFormValues.contractAmount,
            },
            bidders: updatedBidders,
            l1Amount: effectiveAmount,
        });

        setValue('performanceGuaranteeAmount', snValues.performanceGuaranteeAmount, { shouldDirty: true, shouldValidate: true });
        setValue('additionalPerformanceGuaranteeAmount', snValues.additionalPerformanceGuaranteeAmount, { shouldDirty: true, shouldValidate: true });
        setValue('stampPaperAmount', snValues.stampPaperAmount, { shouldDirty: true, shouldValidate: true });

        return snValues;
    };

    const handleBidderSave = (bidderData: Bidder) => {
        const current = getValues('bidders') || [];
        let updated: Bidder[];
        if (activeModal === 'addBidder') {
            appendBidder(bidderData);
            updated = [...current, bidderData];
        } else if (activeModal === 'editBidder' && modalData?.index !== undefined) {
            updateBidder(modalData.index, bidderData);
            updated = [...current];
            updated[modalData.index] = bidderData;
        } else {
            updated = current;
        }

        const snValues = syncSelectionNoticeWithBidders(updated);

        updateTender({
            bidders: updated,
            performanceGuaranteeAmount: snValues.performanceGuaranteeAmount,
            additionalPerformanceGuaranteeAmount: snValues.additionalPerformanceGuaranteeAmount,
            stampPaperAmount: snValues.stampPaperAmount,
        });
        setActiveModal(null);
        setModalData(null);
    };
    
    const handleRemoveBidder = (index: number) => {
        removeBidder(index);
        const current = getValues('bidders') || [];
        const updated = current.filter((_, i) => i !== index);

        const snValues = syncSelectionNoticeWithBidders(updated);

        updateTender({
            bidders: updated,
            performanceGuaranteeAmount: snValues.performanceGuaranteeAmount,
            additionalPerformanceGuaranteeAmount: snValues.additionalPerformanceGuaranteeAmount,
            stampPaperAmount: snValues.stampPaperAmount,
        });
    };

    const handleCorrigendumSave = (corrigendumData: Corrigendum) => {
        const current = getValues('corrigendums') || [];
        let updated: Corrigendum[];
        if (activeModal === 'addCorrigendum') {
            appendCorrigendum(corrigendumData);
            updated = [...current, corrigendumData];
        } else if (activeModal === 'editCorrigendum' && modalData?.index !== undefined) {
            updateCorrigendum(modalData.index, corrigendumData);
            updated = [...current];
            updated[modalData.index] = corrigendumData;
        } else {
            updated = current;
        }
        updateTender({ corrigendums: updated });
        setActiveModal(null);
        setModalData(null);
    };

    const handleRemoveCorrigendum = (index: number) => {
        removeCorrigendum(index);
        const current = getValues('corrigendums') || [];
        const updated = current.filter((_, i) => i !== index);
        updateTender({ corrigendums: updated });
    };

    const handleRetenderSave = (retenderData: RetenderDetails) => {
        const current = getValues('retenders') || [];
        let updated: RetenderDetails[];
        if (activeModal === 'addRetender') {
            appendRetender(retenderData);
            updated = [...current, retenderData];
        } else if (activeModal === 'editRetender' && modalData?.index !== undefined) {
            updateRetender(modalData.index, retenderData);
            updated = [...current];
            updated[modalData.index] = retenderData;
        } else {
            updated = current;
        }
        updateTender({ retenders: updated });
        setActiveModal(null);
        setModalData(null);
    };

    const handleRemoveRetender = (index: number) => {
        removeRetender(index);
        const current = getValues('retenders') || [];
        const updated = current.filter((_, i) => i !== index);
        updateTender({ retenders: updated });
    };
    
    const confirmDeleteRetender = () => {
        if (!retenderToDelete) return;
        handleRemoveRetender(retenderToDelete.index);
        setRetenderToDelete(null);
        toast({ title: "Removed locally" });
    };

    const handleEditCorrigendumClick = (corrigendum: Corrigendum, index: number) => {
        setModalData({ ...corrigendum, index });
        setActiveModal('editCorrigendum');
    };

    const handleEditRetenderClick = (retender: RetenderDetails, index: number) => {
        setModalData({ ...retender, index });
        setActiveModal('editRetender');
    };
    
    const handleClearOpeningDetails = () => {
        Object.entries(OPENING_DETAILS_CLEAR_DATA).forEach(([key, value]) => {
            setValue(key as keyof E_tenderFormData, value, { shouldDirty: true });
        });
        toast({ title: "Opening Details Cleared Locally" });
        setIsClearOpeningDetailsConfirmOpen(false);
    };

    const handleClearSelectionNotice = () => {
        Object.entries(SELECTION_NOTICE_CLEAR_DATA).forEach(([key, value]) => {
            setValue(key as keyof E_tenderFormData, value, { shouldDirty: true });
        });
        toast({ title: "Selection Notice Details Cleared Locally" });
        setIsClearSelectionNoticeConfirmOpen(false);
    };
    
    const handleClearWorkOrderDetails = () => {
        Object.entries(WORK_ORDER_CLEAR_DATA).forEach(([key, value]) => {
            setValue(key as keyof E_tenderFormData, value, { shouldDirty: true });
        });
        toast({ title: "Work Order Details Cleared Locally" });
        setIsClearWorkOrderConfirmOpen(false);
    };

    const handleClose = () => {
        const page = searchParams?.get('page');
        const tab = searchParams?.get('tab');
        
        const params = new URLSearchParams();
        if (page) params.set('page', page);
        if (tab) params.set('tab', tab);
        if (tender.id && tender.id !== 'new') params.set('lastId', tender.id);
        
        const qs = params.toString();
        router.push(`/dashboard/e-tender${qs ? `?${qs}` : ''}`);
    };

    const watchedBasicFields = watch([
        'eTenderNo', 'tenderDate', 'fileNo', 'fileNo2', 'fileNo3', 'fileNo4', 'nameOfWork', 'nameOfWorkMalayalam',
        'location', 'estimateAmount', 'tenderFormFee', 'emd', 'periodOfCompletion',
        'dateTimeOfReceipt', 'dateTimeOfOpening', 'tenderType'
    ]);

    const hasAnyBasicData = useMemo(() => {
        return watchedBasicFields.some(v => v);
    }, [watchedBasicFields]);

    const hasAnyCorrigendumData = corrigendumFields.length > 0;
    const hasAnyRetenderData = retenderFields.length > 0;
    const hasRetenderCorrigendum = useMemo(() => {
        return corrigendumFields.some(c => c.corrigendumType === 'Retender');
    }, [corrigendumFields]);
    
    const committeeMemberNames = [
        watch('technicalCommitteeMember1'),
        watch('technicalCommitteeMember2'),
        watch('technicalCommitteeMember3')
    ].filter(Boolean);

    const committeeMemberDetails = useMemo(() => {
        return committeeMemberNames.map(name => {
            const staff = allStaffMembers.find(s => s.name === name);
            return {
                name,
                designation: staff?.designation || 'N/A'
            };
        });
    }, [committeeMemberNames, allStaffMembers]);

    const hasAnyOpeningData = useMemo(() => {
        return watch('dateOfOpeningBid') || watch('dateOfTechnicalAndFinancialBidOpening') || committeeMemberDetails.length > 0;
    }, [watch, committeeMemberDetails]);
    
    const sortedBidderFields = React.useMemo(() => {
        return [...bidderFields].sort((a, b) => {
            const statusA = a.status === 'Accepted' ? 1 : 2;
            const statusB = b.status === 'Accepted' ? 1 : 2;

            if (statusA !== statusB) {
                return statusA - statusB;
            }

            const amountA = a.quotedAmount ?? Infinity;
            const amountB = b.quotedAmount ?? Infinity;
            return amountA - amountB;
        });
    }, [bidderFields]);

    const hasAnyBidderData = useMemo(() => {
        return bidderFields.length > 0;
    }, [bidderFields]);

    const hasRejectedBids = useMemo(() => {
        return bidderFields.some(b => b.status === 'Rejected');
    }, [bidderFields]);

    const watchedSelectionNoticeFields = watch(['selectionNoticeDate', 'performanceGuaranteeAmount', 'additionalPerformanceGuaranteeAmount', 'stampPaperAmount', 'amountType']);
    const hasAnySelectionNoticeData = useMemo(() => {
        return watchedSelectionNoticeFields.some(v => v);
    }, [watchedSelectionNoticeFields]);
    
    const assistantEngineerName = watch('nameOfAssistantEngineer');

    const assistantEngineerDesignation = useMemo(() => allStaffMembers.find(s => s.name === assistantEngineerName)?.designation, [assistantEngineerName, allStaffMembers]);
    
    const supervisor1Name = watch('supervisor1Name');
    const supervisor2Name = watch('supervisor2Name');
    const supervisor3Name = watch('supervisor3Name');
    const supervisor1Designation = useMemo(() => allStaffMembers.find(s => s.name === supervisor1Name)?.designation, [supervisor1Name, allStaffMembers]);
    const supervisor2Designation = useMemo(() => allStaffMembers.find(s => s.name === supervisor2Name)?.designation, [supervisor2Name, allStaffMembers]);
    const supervisor3Designation = useMemo(() => allStaffMembers.find(s => s.name === supervisor3Name)?.designation, [supervisor3Name, allStaffMembers]);

    const watchedWorkOrderFields = watch(['agreementDate', 'dateWorkOrder', 'nameOfAssistantEngineer', 'supervisor1Name', 'supervisor2Name', 'supervisor3Name', 'stampPaperAmountSubmitted', 'performanceGuaranteeAmountSubmitted', 'additionalPerformanceGuaranteeAmountSubmitted', 'securityDepositRemarks']);
    const hasAnyWorkOrderData = useMemo(() => {
        return watchedWorkOrderFields.some(v => v);
    }, [watchedWorkOrderFields]);


    const tenderType = watch('tenderType');
    const workOrderTitle = tenderType === 'Purchase' ? 'Supply Order Details' : 'Work Order Details';
    
    const tenderFormFeeValue = watch('tenderFormFee');
    const displayTenderFormFee = useMemo(() => {
        if (tenderFormFeeValue === undefined || tenderFormFeeValue === null) return null;
        const fee = Number(tenderFormFeeValue);
        if (isNaN(fee) || fee <= 0) return 'Rs. 0.00';
        const gst = fee * 0.18;
        return `Rs. ${fee.toFixed(2)} & Rs. ${gst.toFixed(2)} (GST 18%)`;
    }, [tenderFormFeeValue]);

    const l1Bidder = useMemo(() => {
        const acceptedBidders = bidderFields.filter(b => b.status === 'Accepted' && typeof b.quotedAmount === 'number' && b.quotedAmount > 0);
        if (acceptedBidders.length === 0) return null;
        return acceptedBidders.reduce((lowest, current) => 
            (current.quotedAmount! < lowest.quotedAmount!) ? current : lowest
        );
    }, [bidderFields]);

    const labourSocietyEval = useMemo(() => {
        return evaluateLabourSociety({
            bidders: bidderFields as Bidder[],
            estimateAmount: watch('estimateAmount') ?? tender.estimateAmount,
            savedNegotiation: watch('labourSocietyNegotiation') ?? tender.labourSocietyNegotiation,
        });
    }, [bidderFields, watch, tender.estimateAmount, tender.labourSocietyNegotiation]);

    const effectiveAwardAmount = useMemo(() => {
        if (labourSocietyEval.isNegotiationAgreed && typeof labourSocietyEval.negotiatedAmount === 'number') {
            return labourSocietyEval.negotiatedAmount;
        }
        return (hasRejectedBids && watch('agreedAmount')) ? watch('agreedAmount') : l1Bidder?.quotedAmount;
    }, [labourSocietyEval, hasRejectedBids, watch, l1Bidder]);

    const handleSaveLabourNegotiation = async (data: {
        negotiationStatus: 'Agreed' | 'Not Agreed';
        negotiatedAmount?: number | null;
        negotiationDate?: string | null;
        negotiationMinutesOrLetterRef?: string;
        remarks?: string;
        isTenderAwardedToSociety: boolean;
    }) => {
        setIsSubmitting(true);
        try {
            const currentData = getValues();
            let updatedData: Partial<E_tenderFormData>;

            if (data.negotiationStatus === 'Agreed') {
                const primarySociety = labourSocietyEval.primarySociety;
                const negPayload = {
                    societyBidderId: primarySociety?.id,
                    societyName: primarySociety?.name,
                    govtOrderAndDate: primarySociety?.govtOrderAndDate,
                    l1BidderId: labourSocietyEval.l1Bidder?.id,
                    l1BidderName: labourSocietyEval.l1Bidder?.name,
                    l1Amount: labourSocietyEval.l1Amount,
                    societyQuotedAmount: primarySociety?.quotedAmount,
                    percentageAboveL1: labourSocietyEval.percentageAboveL1,
                    estimateAmount: currentData.estimateAmount ?? tender.estimateAmount,
                    isEligible: true,
                    eligibilityReason: labourSocietyEval.eligibilityReason,
                    negotiationStatus: 'Agreed' as const,
                    negotiatedAmount: data.negotiatedAmount,
                    negotiationDate: toDateOrNull(data.negotiationDate),
                    negotiationMinutesOrLetterRef: data.negotiationMinutesOrLetterRef,
                    remarks: data.remarks,
                    isTenderAwardedToSociety: true,
                };

                const snValues = calculateSelectionNoticeValues({
                    tender: {
                        ...tender,
                        ...currentData,
                        labourSocietyNegotiation: negPayload,
                        contractAmount: data.negotiatedAmount,
                    },
                    bidders: bidderFields as Bidder[],
                    l1Amount: data.negotiatedAmount,
                });

                updatedData = {
                    labourSocietyNegotiation: negPayload,
                    awardedBidderId: primarySociety?.id,
                    awardedBidderName: primarySociety?.name,
                    agreedAmount: data.negotiatedAmount,
                    contractAmount: data.negotiatedAmount,
                    performanceGuaranteeAmount: snValues.performanceGuaranteeAmount,
                    additionalPerformanceGuaranteeAmount: snValues.additionalPerformanceGuaranteeAmount,
                    stampPaperAmount: snValues.stampPaperAmount,
                };

                setValue('labourSocietyNegotiation', negPayload, { shouldDirty: true, shouldValidate: true });
                setValue('awardedBidderId', primarySociety?.id, { shouldDirty: true });
                setValue('awardedBidderName', primarySociety?.name, { shouldDirty: true });
                setValue('agreedAmount', data.negotiatedAmount, { shouldDirty: true });
                setValue('contractAmount', data.negotiatedAmount, { shouldDirty: true });
                setValue('performanceGuaranteeAmount', snValues.performanceGuaranteeAmount, { shouldDirty: true });
                setValue('additionalPerformanceGuaranteeAmount', snValues.additionalPerformanceGuaranteeAmount, { shouldDirty: true });
                setValue('stampPaperAmount', snValues.stampPaperAmount, { shouldDirty: true });

                toast({
                    title: "Negotiation Agreed",
                    description: `Tender awarded to ${primarySociety?.name} at negotiated amount ₹${(data.negotiatedAmount ?? 0).toLocaleString('en-IN')}.`,
                });
            } else {
                const negPayload = {
                    societyBidderId: labourSocietyEval.primarySociety?.id,
                    societyName: labourSocietyEval.primarySociety?.name,
                    govtOrderAndDate: labourSocietyEval.primarySociety?.govtOrderAndDate,
                    l1BidderId: labourSocietyEval.l1Bidder?.id,
                    l1BidderName: labourSocietyEval.l1Bidder?.name,
                    l1Amount: labourSocietyEval.l1Amount,
                    societyQuotedAmount: labourSocietyEval.primarySociety?.quotedAmount,
                    percentageAboveL1: labourSocietyEval.percentageAboveL1,
                    estimateAmount: currentData.estimateAmount ?? tender.estimateAmount,
                    isEligible: true,
                    eligibilityReason: labourSocietyEval.eligibilityReason,
                    negotiationStatus: 'Not Agreed' as const,
                    negotiatedAmount: null,
                    negotiationDate: toDateOrNull(data.negotiationDate),
                    negotiationMinutesOrLetterRef: data.negotiationMinutesOrLetterRef,
                    remarks: data.remarks,
                    isTenderAwardedToSociety: false,
                };

                const cancellationRemark = `[Tender Cancelled]: Unsuccessful negotiation with Labour Contract Society (${labourSocietyEval.primarySociety?.name || 'Society'}).`;
                const combinedRemarks = currentData.remarks 
                    ? `${currentData.remarks}\n${cancellationRemark}`
                    : cancellationRemark;

                updatedData = {
                    labourSocietyNegotiation: negPayload,
                    presentStatus: 'Tender Cancelled',
                    awardedBidderId: null,
                    awardedBidderName: null,
                    remarks: combinedRemarks,
                };

                setValue('labourSocietyNegotiation', negPayload, { shouldDirty: true, shouldValidate: true });
                setValue('presentStatus', 'Tender Cancelled', { shouldDirty: true, shouldValidate: true });
                setValue('awardedBidderId', null, { shouldDirty: true });
                setValue('awardedBidderName', null, { shouldDirty: true });
                setValue('remarks', combinedRemarks, { shouldDirty: true });

                toast({
                    title: "Tender Cancelled",
                    description: "Negotiation was unsuccessful. Tender has been marked as Cancelled and no award issued.",
                    variant: "destructive",
                });
            }

            if (tender.id !== 'new') {
                await saveTenderToDb(tender.id, updatedData);
                updateTender(updatedData);
            }
            setIsNegotiationOpen(false);
        } catch (err: any) {
            console.error("Negotiation save error:", err);
            toast({
                title: "Error Saving Negotiation",
                description: err?.message || "Failed to update negotiation status.",
                variant: "destructive",
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleResetLabourNegotiation = async () => {
        setIsSubmitting(true);
        try {
            const clearedPayload = {
                labourSocietyNegotiation: null,
                awardedBidderId: null,
                awardedBidderName: null,
            };
            setValue('labourSocietyNegotiation', null, { shouldDirty: true });
            setValue('awardedBidderId', null, { shouldDirty: true });
            setValue('awardedBidderName', null, { shouldDirty: true });

            if (tender.id !== 'new') {
                await saveTenderToDb(tender.id, clearedPayload);
                updateTender(clearedPayload);
            }
            toast({ title: "Negotiation Reset", description: "Negotiation record has been reset." });
        } catch (err: any) {
            toast({ title: "Reset Error", description: err.message, variant: "destructive" });
        } finally {
            setIsSubmitting(false);
        }
    };

    const dynamicStatusOptions = useMemo(() => {
        if (tender.id === 'new') return eTenderStatusOptions;
      if (tenderType === 'Work') {
        return eTenderStatusOptions.filter(opt => opt !== 'Supply Order Issued');
      }
      if (tenderType === 'Purchase') {
        return eTenderStatusOptions.filter(opt => opt !== 'Work Order Issued');
      }
      return eTenderStatusOptions;
    }, [tenderType, tender.id]);


    return (
        <FormProvider {...form}>
            <div className="space-y-6">
                <Card>
                    <CardContent className="pt-6">
                        <div className="space-y-4">
                            <Card className="border rounded-lg bg-blue-500/5 border-blue-500/20">
                                <CardHeader className="flex flex-row justify-between items-center p-4">
                                    <div className="flex items-center gap-3">
                                        <Building className="h-5 w-5 text-primary"/>
                                        <CardTitle className="text-lg font-semibold text-primary">Basic Details</CardTitle>
                                    </div>
                                    {!isReadOnly && <Button type="button" size="sm" variant="outline" className="bg-white" onClick={() => setActiveModal('basic')}><Edit className="h-4 w-4 mr-2"/>Edit</Button>}
                                </CardHeader>
                                {hasAnyBasicData ? (
                                    <CardContent className="p-6 pt-0">
                                        <div className="space-y-6 pt-4">
                                            <div className="space-y-2">
                                                <h4 className="text-sm font-medium text-muted-foreground">Tender Identification</h4>
                                                <div className="p-4 border rounded-md bg-slate-50 grid grid-cols-1 md:grid-cols-4 gap-x-8 gap-y-4">
                                                    <DetailRow label="eTender No." value={watch('eTenderNo')} />
                                                    <DetailRow label="Tender Date" value={watch('tenderDate')} />
                                                    <DetailRow label="File No." value={watch('fileNo') ? `${officeAddress?.officeCode || 'GKT'}/${watch('fileNo')}` : null} />
                                                    <DetailRow label="File No. 2" value={watch('fileNo2') ? `${officeAddress?.officeCode || 'GKT'}/${watch('fileNo2')}` : null} />
                                                    <DetailRow label="File No. 3" value={watch('fileNo3') ? `${officeAddress?.officeCode || 'GKT'}/${watch('fileNo3')}` : null} />
                                                    <DetailRow label="File No. 4" value={watch('fileNo4') ? `${officeAddress?.officeCode || 'GKT'}/${watch('fileNo4')}` : null} />
                                                </div>
                                            </div>
                                             <div className="space-y-2">
                                                <h4 className="text-sm font-medium text-muted-foreground">Work & Location</h4>
                                                <div className="p-4 border rounded-md bg-slate-50 space-y-4">
                                                    <DetailRow label="Name of Work" value={watch('nameOfWork')} />
                                                    <DetailRow label="Name of Work (in Malayalam)" value={watch('nameOfWorkMalayalam')} />
                                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-x-8 gap-y-4 pt-2">
                                                        <DetailRow label="Location" value={watch('location')} />
                                                        <DetailRow label="Period of Completion (Days)" value={watch('periodOfCompletion')} />
                                                        <DetailRow label="Type of Tender" value={watch('tenderType')} />
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <h4 className="text-sm font-medium text-muted-foreground">Financial Details</h4>
                                                <div className="p-4 border rounded-md bg-slate-50 grid grid-cols-1 md:grid-cols-3 gap-x-8 gap-y-4">
                                                    <DetailRow label="Tender Amount (Rs.)" value={watch('estimateAmount')} isCurrency noComma />
                                                    <DetailRow label="Tender Fee (Rs.)" value={displayTenderFormFee} />
                                                    <DetailRow label="EMD (Rs.)" value={watch('emd')} isCurrency noComma />
                                                </div>
                                            </div>
                                             <div className="space-y-2">
                                                <h4 className="text-sm font-medium text-muted-foreground">Key Dates</h4>
                                                <div className="p-4 border rounded-md bg-slate-50 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                                                    <DetailRow label="Last Date & Time of Receipt" value={watch('dateTimeOfReceipt')} isReceiptFormat={true} />
                                                    <DetailRow label="Date & Time of Opening" value={watch('dateTimeOfOpening')} isOpeningFormat={true}/>
                                                </div>
                                            </div>
                                        </div>
                                    </CardContent>
                                ) : (
                                    <CardContent>
                                        <p className="text-sm text-muted-foreground text-center py-4">No basic details have been added.</p>
                                    </CardContent>
                                )}
                            </Card>

                            <Card className="border rounded-lg">
                                <CardHeader className="flex flex-row justify-between items-center p-4">
                                    <div className="flex items-center gap-3">
                                        <GitBranch className="h-5 w-5 text-primary"/>
                                        <CardTitle className="text-lg font-semibold text-primary">Corrigendum Details ({corrigendumFields.length})</CardTitle>
                                    </div>
                                    {!isReadOnly && <Button type="button" size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); setActiveModal('addCorrigendum'); }}><PlusCircle className="h-4 w-4 mr-2"/>Add Corrigendum</Button>}
                                </CardHeader>
                                {hasAnyCorrigendumData ? (
                                    <CardContent className="p-6 pt-0">
                                        <div className="mt-4 pt-4 border-t space-y-2">
                                            {corrigendumFields.map((corrigendum, index) => (
                                                <div key={corrigendum.id} className="p-4 border rounded-md bg-secondary/30 relative group">
                                                    <div className="absolute top-2 right-2 flex items-center gap-1">
                                                        {!isReadOnly && <Button type="button" variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleEditCorrigendumClick(corrigendum, index)}><Edit className="h-4 w-4"/></Button>}
                                                        {!isReadOnly && <Button type="button" variant="ghost" size="icon" className="text-destructive h-7 w-7" onClick={() => handleRemoveCorrigendum(index)}><Trash2 className="h-4 w-4"/></Button>}
                                                    </div>
                                                    <h4 className="text-sm font-semibold text-primary mb-2">Corrigendum No. {index + 1}</h4>
                                                    <dl className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-3 mt-1">
                                                        <DetailRow label="Type" value={corrigendum.corrigendumType} />
                                                        <DetailRow label="Date" value={corrigendum.corrigendumDate} />
                                                        <DetailRow label="Reason" value={corrigendum.reason} />
                                                        <DetailRow label="New Last Date &amp; Time" value={corrigendum.lastDateOfReceipt} isReceiptFormat={true} />
                                                        <DetailRow label="New Opening Date &amp; Time" value={corrigendum.dateOfOpeningTender} isOpeningFormat={true} />
                                                    </dl>
                                                </div>
                                            ))}
                                        </div>
                                    </CardContent>
                                ) : (
                                    <CardContent>
                                        <p className="text-sm text-muted-foreground text-center py-4">No corrigendums have been added.</p>
                                    </CardContent>
                                )}
                            </Card>
                            
                            {hasRetenderCorrigendum && (
                                <Card className="border rounded-lg">
                                    <CardHeader className="flex flex-row justify-between items-center p-4">
                                        <div className="flex items-center gap-3">
                                            <GitBranch className="h-5 w-5 text-primary"/>
                                            <CardTitle className="text-lg font-semibold text-primary">Retender Details ({retenderFields.length})</CardTitle>
                                        </div>
                                        {!isReadOnly && <Button type="button" size="sm" variant="outline" onClick={() => setActiveModal('addRetender')}><PlusCircle className="h-4 w-4 mr-2"/>Add Retender</Button>}
                                    </CardHeader>
                                    {hasAnyRetenderData ? (
                                        <CardContent className="p-6 pt-0">
                                            <div className="mt-4 pt-4 border-t space-y-2">
                                                {retenderFields.map((retender, index) => (
                                                    <div key={retender.id} className="p-4 border rounded-md bg-secondary/30 relative group">
                                                        <div className="absolute top-2 right-2 flex items-center gap-1">
                                                            {!isReadOnly && <Button type="button" variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleEditRetenderClick(retender, index)}><Edit className="h-4 w-4"/></Button>}
                                                            {!isReadOnly && <Button type="button" variant="ghost" size="icon" className="text-destructive h-7 w-7" onClick={() => setRetenderToDelete({ id: retender.id, index })}><Trash2 className="h-4 w-4"/></Button>}
                                                        </div>
                                                        <h4 className="text-sm font-semibold text-primary mb-2">Retender No. {index + 1}</h4>
                                                        <dl className="grid grid-cols-1 md:grid-cols-3 gap-x-4 gap-y-3 mt-1">
                                                            <DetailRow label="Retender Date" value={retender.retenderDate} />
                                                            <DetailRow label="New Last Date & Time" value={retender.lastDateOfReceipt} isReceiptFormat={true} />
                                                            <DetailRow label="New Opening Date & Time" value={retender.dateOfOpeningTender} isOpeningFormat={true}/>
                                                        </dl>
                                                    </div>
                                                ))}
                                            </div>
                                        </CardContent>
                                    ) : (
                                        <CardContent>
                                            <p className="text-sm text-muted-foreground text-center py-4">No retender details have been added.</p>
                                        </CardContent>
                                    )}
                                </Card>
                            )}

                            <Card className="border rounded-lg">
                                <CardHeader className="flex flex-row justify-between items-center p-4">
                                    <div className="flex items-center gap-3">
                                        <FolderOpen className="h-5 w-5 text-primary"/>
                                        <CardTitle className="text-lg font-semibold text-primary">Tender Opening Details</CardTitle>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {!isReadOnly && <Button type="button" size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); setActiveModal('opening'); }}><Edit className="h-4 w-4 mr-2"/>Edit</Button>}
                                        {!isReadOnly && <Button type="button" size="icon" variant="destructive" onClick={(e) => { e.stopPropagation(); setIsClearOpeningDetailsConfirmOpen(true); }}><Trash2 className="h-4 w-4"/></Button>}
                                    </div>
                                </CardHeader>
                                {hasAnyOpeningData ? (
                                    <CardContent className="p-6 pt-0">
                                        <div className="space-y-4 pt-4 border-t">
                                            <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                                                <DetailRow label="Date of Opening Bid" value={watch('dateOfOpeningBid')} />
                                                <DetailRow label="Date of Tech/Fin Bid Opening" value={watch('dateOfTechnicalAndFinancialBidOpening')} />
                                            </dl>
                                            <div className="space-y-2">
                                                <h4 className="font-semibold">Committee Members:</h4>
                                                {committeeMemberDetails.length > 0 ? (
                                                    <ol className="list-decimal list-inside text-sm space-y-1">
                                                        {committeeMemberDetails.map((member, i) => (
                                                        <li key={i}>
                                                            <span className="font-semibold">{member.name}</span>
                                                            <span className="text-muted-foreground"> ({member.designation})</span>
                                                        </li>
                                                        ))}
                                                    </ol>
                                                ) : (
                                                    <p className="text-sm text-muted-foreground">No committee members assigned.</p>
                                                )}
                                            </div>
                                        </div>
                                    </CardContent>
                                ) : (
                                    <CardContent>
                                        <p className="text-sm text-muted-foreground text-center py-4">No tender opening details have been added.</p>
                                    </CardContent>
                                )}
                            </Card>

                            <Card className="border rounded-lg">
                                <CardHeader className="flex flex-row justify-between items-center p-4">
                                    <div className="flex items-center gap-3">
                                        <Users className="h-5 w-5 text-primary"/>
                                        <CardTitle className="text-lg font-semibold text-primary">Bidders ({bidderFields.length})</CardTitle>
                                    </div>
                                    {!isReadOnly && <Button type="button" size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); setModalData(null); setActiveModal('addBidder'); }}><PlusCircle className="h-4 w-4 mr-2"/>Add Bidder</Button>}
                                </CardHeader>
                                {hasAnyBidderData ? (
                                    <CardContent className="p-6 pt-0">
                                        <div className="mt-4 pt-4 border-t space-y-2">
                                            {sortedBidderFields.map((bidder, index) => {
                                                const originalIndex = bidderFields.findIndex(field => field.id === bidder.id);
                                                const isL1 = bidder.status === 'Accepted' && bidder.id === l1Bidder?.id;
                                                const masterBidder = allBidders?.find(b => b.name === bidder.name);
                                                const bidderEmail = bidder.email || masterBidder?.email;
                                                return (
                                                    <div key={bidder.id} className="p-3 border rounded-md bg-secondary/30 relative">
                                                        <div className="flex items-start justify-between mb-2">
                                                            <div className="flex items-center gap-2 flex-wrap">
                                                                <h5 className="font-bold text-sm">Bidder #{index + 1}: {bidder.name}</h5>
                                                                {isL1 && <Badge className="bg-green-600 text-white">L1</Badge>}
                                                                {(bidder.bidderType === 'Labour Society' || bidder.bidderType === 'Labour Contract Society') && (
                                                                    <Badge variant="outline" className="bg-blue-50 text-blue-800 border-blue-300 font-medium">Labour Contract Society</Badge>
                                                                )}
                                                                {labourSocietyEval.isNegotiationAgreed && bidder.id === labourSocietyEval.primarySociety?.id && (
                                                                    <Badge className="bg-blue-600 text-white">Awarded (Negotiated)</Badge>
                                                                )}
                                                                {bidder.status && <Badge variant={bidder.status === 'Accepted' ? 'default' : 'destructive'} className="mt-1">{bidder.status}</Badge>}
                                                            </div>
                                                            <div className="flex items-center gap-1">
                                                                {!isReadOnly && <Button type="button" variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setModalData({ ...bidder, index: originalIndex }); setActiveModal('editBidder'); }}><Edit className="h-4 w-4"/></Button>}
                                                                {!isReadOnly && <Button type="button" variant="ghost" size="icon" className="text-destructive h-7 w-7" onClick={() => handleRemoveBidder(originalIndex)}><Trash2 className="h-4 w-4"/></Button>}
                                                            </div>
                                                        </div>
                                                        <p className="text-xs text-muted-foreground">{bidder.address}</p>
                                                        <dl className="grid grid-cols-1 md:grid-cols-3 gap-x-4 gap-y-1 mt-2 text-xs">
                                                            <DetailRow label="Quoted Amount" value={bidder.quotedAmount} isCurrency noComma />
                                                            <DetailRow label="Quoted Percentage" value={bidder.quotedPercentage ? `${bidder.quotedPercentage}% ${bidder.aboveBelow || ''}`: ''} />
                                                            {isL1 && bidderEmail && (
                                                                <DetailRow label="L1 Bidder Email-ID" value={bidderEmail} />
                                                            )}
                                                        </dl>
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    </CardContent>
                                ) : (
                                    <CardContent>
                                        <p className="text-sm text-muted-foreground text-center py-4">No bidders have been added.</p>
                                    </CardContent>
                                )}
                            </Card>

                            {labourSocietyEval.hasLabourSociety && (
                                <LabourSocietyNegotiationCard
                                    evaluation={labourSocietyEval}
                                    negotiationData={watch('labourSocietyNegotiation')}
                                    isReadOnly={isReadOnly}
                                    onOpenNegotiate={() => setIsNegotiationOpen(true)}
                                    onResetNegotiate={handleResetLabourNegotiation}
                                />
                            )}

                            <Card className="border rounded-lg">
                                <CardHeader className="flex flex-row justify-between items-center p-4">
                                    <div className="flex items-center gap-3">
                                        <Bell className="h-5 w-5 text-primary"/>
                                        <CardTitle className="text-lg font-semibold text-primary">Selection Notice Details</CardTitle>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {!isReadOnly && <Button type="button" size="sm" variant="outline" onClick={() => setActiveModal('selectionNotice')}><Edit className="h-4 w-4 mr-2" />{hasAnySelectionNoticeData ? 'Edit' : 'Add'}</Button>}
                                        {!isReadOnly && <Button type="button" size="icon" variant="destructive" onClick={(e) => { e.stopPropagation(); setIsClearSelectionNoticeConfirmOpen(true); }}><Trash2 className="h-4 w-4"/></Button>}
                                    </div>
                                </CardHeader>
                                {hasAnySelectionNoticeData ? (
                                    <CardContent className="p-6 pt-0">
                                        {labourSocietyEval.isNegotiationAgreed && (
                                            <div className="mt-3 mb-2 p-2.5 rounded bg-blue-50 border border-blue-200 text-xs text-blue-900 flex flex-wrap items-center justify-between gap-2">
                                                <span>Awarded to Labour Contract Society: <strong className="font-semibold">{labourSocietyEval.primarySociety?.name}</strong></span>
                                                <span>Negotiated Contract Rate: <strong className="font-semibold">₹{(labourSocietyEval.negotiatedAmount ?? 0).toLocaleString('en-IN')}</strong></span>
                                            </div>
                                        )}
                                        <dl className="grid grid-cols-1 md:grid-cols-3 gap-x-4 gap-y-3 pt-4 border-t">
                                            <DetailRow label="Selection Notice Date" value={watch('selectionNoticeDate')} />
                                            <DetailRow label="Basis for Calculation" value={watch('amountType')} />
                                            <DetailRow label="Performance Guarantee" value={watch('performanceGuaranteeAmount')} isCurrency noComma />
                                            <DetailRow label="Additional PG" value={watch('additionalPerformanceGuaranteeAmount')} isCurrency noComma />
                                            <DetailRow label="Stamp Paper" value={watch('stampPaperAmount')} isCurrency noComma />
                                        </dl>
                                    </CardContent>
                                ) : (
                                    <CardContent>
                                        <p className="text-sm text-muted-foreground text-center py-4">No selection notice details have been added.</p>
                                    </CardContent>
                                )}
                            </Card>

                            <Card className="border rounded-lg">
                                <CardHeader className="flex flex-row justify-between items-center p-4">
                                    <div className="flex items-center gap-3">
                                        <ScrollText className="h-5 w-5 text-primary"/>
                                        <CardTitle className="text-lg font-semibold text-primary">{workOrderTitle}</CardTitle>
                                    </div>
                                     <div className="flex items-center gap-2">
                                        {!isReadOnly && <Button type="button" size="sm" variant="outline" onClick={() => setActiveModal('workOrder')}><Edit className="h-4 w-4 mr-2"/>{hasAnyWorkOrderData ? 'Edit' : 'Add'}</Button>}
                                        {!isReadOnly && <Button type="button" size="icon" variant="destructive" onClick={(e) => { e.stopPropagation(); setIsClearWorkOrderConfirmOpen(true); }}><Trash2 className="h-4 w-4"/></Button>}
                                    </div>
                                </CardHeader>
                                {hasAnyWorkOrderData ? (
                                    <CardContent className="p-6 pt-0">
                                        <dl className="grid grid-cols-1 md:grid-cols-3 gap-x-4 gap-y-3 pt-4 border-t">
                                            <DetailRow label="Agreement Date" value={watch('agreementDate')} />
                                            <DetailRow label="Date - Work / Supply Order" value={watch('dateWorkOrder')} />
                                            <DetailRow label="Measurer" value={watch('nameOfAssistantEngineer')} subValue={assistantEngineerDesignation} />
                                            <DetailRow label="Stamp Paper Submitted" value={watch('stampPaperAmountSubmitted')} isCurrency noComma />
                                            <DetailRow 
                                                label="Performance Guarantee Submitted" 
                                                value={watch('performanceGuaranteeAmountSubmitted')} 
                                                isCurrency 
                                                noComma
                                                subValue={watch('performanceGuaranteeReleaseStatus') === 'Released' ? 'Released to Bidder' : 'Withheld'}
                                            />
                                            <DetailRow 
                                                label="Additional PG Submitted" 
                                                value={watch('additionalPerformanceGuaranteeAmountSubmitted')} 
                                                isCurrency 
                                                noComma
                                                subValue={watch('additionalPerformanceGuaranteeReleaseStatus') === 'Released' ? 'Released to Bidder' : 'Withheld'}
                                            />
                                            <DetailRow label="Supervisor 1" value={watch('supervisor1Name')} subValue={supervisor1Designation} />
                                            <DetailRow label="Supervisor 2" value={watch('supervisor2Name')} subValue={supervisor2Designation} />
                                            <DetailRow label="Supervisor 3" value={watch('supervisor3Name')} subValue={supervisor3Designation} />
                                            <div className="col-span-full">
                                                <DetailRow label="Deposit Remarks" value={watch('securityDepositRemarks')} />
                                            </div>
                                        </dl>
                                    </CardContent>
                                ) : (
                                    <CardContent>
                                        <p className="text-sm text-muted-foreground text-center py-4">No work order details have been added.</p>
                                    </CardContent>
                                )}
                            </Card>
                        </div>
                        
                         <Card className="mt-4">
                            <CardContent className="p-4 space-y-4">
                                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                                    <h3 className="text-lg font-semibold flex items-center gap-3 text-primary"><FileText className="h-5 w-5"/>Present Status</h3>
                                    <div className="flex items-center gap-2">
                                        {tender.presentStatus && <Badge className={cn(getStatusBadgeClass(tender.presentStatus), "h-6")}>{tender.presentStatus}</Badge>}
                                        <div className="w-full sm:w-[250px]">
                                            <FormField
                                                name="presentStatus"
                                                control={control}
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <Select onValueChange={(value) => { field.onChange(value); }} value={field.value || undefined} disabled={isReadOnly}>
                                                            <FormControl><SelectTrigger><SelectValue placeholder="Select current status" /></SelectTrigger></FormControl>
                                                            <SelectContent>{dynamicStatusOptions.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
                                                        </Select>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                        </div>
                                    </div>
                                </div>
                                <FormField
                                    name="remarks"
                                    control={control}
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Remarks</FormLabel>
                                            <FormControl>
                                                <Textarea
                                                    {...field}
                                                    value={field.value ?? ""}
                                                    onChange={(e) => {
                                                        field.onChange(e);
                                                    }}
                                                    placeholder="Add any remarks about the current status..."
                                                    readOnly={isReadOnly}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </CardContent>
                        </Card>
                        
                        <div className="mt-6 flex items-center justify-center gap-4">
                            <Button type="button" variant="outline" size="lg" onClick={handleClose}>
                                <X className="mr-2 h-4 w-4" />
                                Close
                            </Button>
                            {!isReadOnly && 
                              <Button 
                                  type="button" 
                                  size="lg" 
                                  onClick={handleFinalSave} 
                                  disabled={
                                      isSubmitting || 
                                      (tender.id === 'new' 
                                          ? (!watch('eTenderNo') || !watch('tenderDate')) 
                                          : !isFormDirty)
                                  }
                              >
                                  {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                                  Save
                              </Button>
                            }
                        </div>

                        <div className="mt-6 flex flex-col items-center">
                             <PdfReportDialogs />
                        </div>
                    </CardContent>
                </Card>

                <Dialog open={activeModal === 'basic'} onOpenChange={(isOpen) => !isOpen && setActiveModal(null)}>
                    <DialogContent onPointerDownOutside={(e) => e.preventDefault()} className="max-w-4xl h-[90vh] flex flex-col p-0">
                        {activeModal === 'basic' && <BasicDetailsForm onSubmit={handleSave} onCancel={() => setActiveModal(null)} isSubmitting={isSubmitting} />}
                    </DialogContent>
                </Dialog>
                <Dialog open={activeModal === 'opening'} onOpenChange={(isOpen) => !isOpen && setActiveModal(null)}>
                    <DialogContent onPointerDownOutside={(e) => e.preventDefault()} className="max-w-2xl flex flex-col p-0">
                        {activeModal === 'opening' && <TenderOpeningDetailsForm initialData={getValues()} onSubmit={handleSave} onCancel={() => setActiveModal(null)} isSubmitting={isSubmitting}/>}
                    </DialogContent>
                </Dialog>
                <Dialog open={activeModal === 'addBidder' || activeModal === 'editBidder'} onOpenChange={() => { setActiveModal(null); setModalData(null); }}>
                    <DialogContent onPointerDownOutside={(e) => e.preventDefault()} className="max-w-3xl h-[90vh] flex flex-col p-0">
                        {(activeModal === 'addBidder' || activeModal === 'editBidder') && <BidderForm
                           onSubmit={handleBidderSave}
                           onCancel={() => { setActiveModal(null); setModalData(null); }}
                           isSubmitting={isSubmitting}
                           initialData={modalData}
                           tenderAmount={getValues('estimateAmount') ?? undefined}
                        />}
                    </DialogContent>
                </Dialog>
                <Dialog open={activeModal === 'addCorrigendum' || activeModal === 'editCorrigendum'} onOpenChange={(isOpen) => !isOpen && setActiveModal(null)}>
                    <DialogContent onPointerDownOutside={(e) => e.preventDefault()} className="max-w-3xl flex flex-col p-0">
                        {(activeModal === 'addCorrigendum' || activeModal === 'editCorrigendum') && <CorrigendumForm onSubmit={handleCorrigendumSave} onCancel={() => { setActiveModal(null); setModalData(null); }} isSubmitting={isSubmitting} initialData={modalData} />}
                    </DialogContent>
                </Dialog>
                <Dialog open={activeModal === 'addRetender' || activeModal === 'editRetender'} onOpenChange={(isOpen) => !isOpen && setActiveModal(null)}>
                    <DialogContent onPointerDownOutside={(e) => e.preventDefault()} className="max-w-3xl flex flex-col p-0">
                        {(activeModal === 'addRetender' || activeModal === 'editRetender') && <RetenderDetailsForm onSubmit={handleRetenderSave} onCancel={() => { setActiveModal(null); setModalData(null); }} isSubmitting={isSubmitting} initialData={modalData} />}
                    </DialogContent>
                </Dialog>
                <Dialog open={activeModal === 'selectionNotice'} onOpenChange={(isOpen) => !isOpen && setActiveModal(null)}>
                    <DialogContent onPointerDownOutside={(e) => e.preventDefault()} className="max-w-2xl flex flex-col p-0">
                        {activeModal === 'selectionNotice' && <SelectionNoticeForm
                           onSubmit={handleSave}
                           onCancel={() => setActiveModal(null)}
                           isSubmitting={isSubmitting}
                           l1Amount={effectiveAwardAmount}
                           hasRejectedBids={hasRejectedBids}
                        />}
                    </DialogContent>
                </Dialog>
                <Dialog open={activeModal === 'workOrder'} onOpenChange={(isOpen) => !isOpen && setActiveModal(null)}>
                    <DialogContent onPointerDownOutside={(e) => e.preventDefault()} className="max-w-5xl h-auto max-h-[95vh] overflow-y-auto flex flex-col p-0">
                        {activeModal === 'workOrder' && <WorkOrderDetailsForm initialData={getValues()} onSubmit={handleSave} onCancel={() => setActiveModal(null)} isSubmitting={isSubmitting} tenderType={tenderType ?? undefined}/>}
                    </DialogContent>
                </Dialog>

                {labourSocietyEval.primarySociety && (
                    <LabourSocietyNegotiationDialog
                        isOpen={isNegotiationOpen}
                        onClose={() => setIsNegotiationOpen(false)}
                        primarySociety={labourSocietyEval.primarySociety}
                        l1Bidder={labourSocietyEval.l1Bidder}
                        estimateAmount={watch('estimateAmount') ?? tender.estimateAmount}
                        percentageAboveL1={labourSocietyEval.percentageAboveL1}
                        existingNegotiation={watch('labourSocietyNegotiation')}
                        onSaveNegotiation={handleSaveLabourNegotiation}
                        isSubmitting={isSubmitting}
                    />
                )}
                
                <AlertDialog open={isClearOpeningDetailsConfirmOpen} onOpenChange={setIsClearOpeningDetailsConfirmOpen}>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                            <AlertDialogDescription>This will clear all tender opening details locally. You must save at the bottom to commit this change.</AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={handleClearOpeningDetails}>Yes, Clear</AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
                
                <AlertDialog open={isClearSelectionNoticeConfirmOpen} onOpenChange={setIsClearSelectionNoticeConfirmOpen}>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                            <AlertDialogDescription>This will clear all selection notice details locally. You must save at the bottom to commit this change.</AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={handleClearSelectionNotice}>Yes, Clear</AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
                
                <AlertDialog open={isClearWorkOrderConfirmOpen} onOpenChange={setIsClearWorkOrderConfirmOpen}>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                            <AlertDialogDescription>This will clear all work order details locally. You must save at the bottom to commit this change.</AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={handleClearWorkOrderDetails}>Yes, Clear</AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>

                <AlertDialog open={!!retenderToDelete} onOpenChange={() => setRetenderToDelete(null)}>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Confirm Removal</AlertDialogTitle>
                            <AlertDialogDescription>Remove this retender entry locally? You must hit Save at the bottom to update the database.</AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={confirmDeleteRetender} className="bg-destructive hover:bg-destructive/90">Remove</AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>

            </div>
        </FormProvider>
    );
}
