// src/components/e-tender/LabourSocietyNegotiationDialog.tsx
"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { CheckCircle2, XCircle, AlertTriangle, Scale, ArrowRight, Loader2 } from 'lucide-react';
import type { Bidder, LabourSocietyNegotiation } from '@/lib/schemas/eTenderSchema';
import { formatDateForInput } from './utils';
import { format } from 'date-fns';

interface LabourSocietyNegotiationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  primarySociety: Bidder;
  l1Bidder: Bidder | null;
  estimateAmount?: number | null;
  percentageAboveL1: number;
  existingNegotiation?: LabourSocietyNegotiation | null;
  onSaveNegotiation: (data: {
    negotiationStatus: 'Agreed' | 'Not Agreed';
    negotiatedAmount?: number | null;
    negotiationDate?: string | null;
    negotiationMinutesOrLetterRef?: string;
    remarks?: string;
    isTenderAwardedToSociety: boolean;
  }) => Promise<void> | void;
  isSubmitting?: boolean;
}

export default function LabourSocietyNegotiationDialog({
  isOpen,
  onClose,
  primarySociety,
  l1Bidder,
  estimateAmount,
  percentageAboveL1,
  existingNegotiation,
  onSaveNegotiation,
  isSubmitting = false,
}: LabourSocietyNegotiationDialogProps) {
  const [decision, setDecision] = useState<'Agreed' | 'Not Agreed'>('Agreed');
  const [negotiatedAmountStr, setNegotiatedAmountStr] = useState<string>('');
  const [negotiationDate, setNegotiationDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
  const [refDoc, setRefDoc] = useState<string>('');
  const [remarks, setRemarks] = useState<string>('');

  const estAmountNum = typeof estimateAmount === 'number' && estimateAmount > 0 ? estimateAmount : null;
  const l1AmountNum = l1Bidder?.quotedAmount ?? null;
  const societyAmountNum = primarySociety.quotedAmount ?? null;

  useEffect(() => {
    if (isOpen) {
      if (existingNegotiation) {
        setDecision(existingNegotiation.negotiationStatus === 'Not Agreed' ? 'Not Agreed' : 'Agreed');
        setNegotiatedAmountStr(existingNegotiation.negotiatedAmount ? String(existingNegotiation.negotiatedAmount) : '');
        setNegotiationDate(
          existingNegotiation.negotiationDate
            ? formatDateForInput(existingNegotiation.negotiationDate)
            : format(new Date(), 'yyyy-MM-dd')
        );
        setRefDoc(existingNegotiation.negotiationMinutesOrLetterRef || '');
        setRemarks(existingNegotiation.remarks || '');
      } else {
        setDecision('Agreed');
        // Default negotiated amount to L1 amount if <= Tender Amount, else 1% below estimate
        if (l1AmountNum && estAmountNum && l1AmountNum <= estAmountNum) {
          setNegotiatedAmountStr(String(l1AmountNum));
        } else if (estAmountNum) {
          setNegotiatedAmountStr(String(Math.floor(estAmountNum * 0.99)));
        } else {
          setNegotiatedAmountStr('');
        }
        setNegotiationDate(format(new Date(), 'yyyy-MM-dd'));
        setRefDoc('');
        setRemarks('');
      }
    }
  }, [isOpen, existingNegotiation, l1AmountNum, estAmountNum]);

  const negotiatedAmountNum = parseFloat(negotiatedAmountStr.replace(/,/g, ''));
  const isValidNumber = !isNaN(negotiatedAmountNum) && negotiatedAmountNum > 0;

  // Validation: Must be equal to or less than Tender Amount (Sanctioned Estimate)
  const isWithinTenderAmount = estAmountNum ? isValidNumber && negotiatedAmountNum <= estAmountNum : isValidNumber;
  const amountErrorMessage = useMemo(() => {
    if (decision !== 'Agreed') return null;
    if (!negotiatedAmountStr.trim()) return 'Negotiated amount is required.';
    if (!isValidNumber) return 'Please enter a valid positive amount.';
    if (estAmountNum && negotiatedAmountNum > estAmountNum) {
      return `Negotiated amount (₹${negotiatedAmountNum.toLocaleString('en-IN')}) must be equal to or less than Tender Amount (Rs. ${estAmountNum.toLocaleString('en-IN')}).`;
    }
    return null;
  }, [decision, negotiatedAmountStr, isValidNumber, negotiatedAmountNum, estAmountNum]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (decision === 'Agreed') {
      if (amountErrorMessage || !isValidNumber) return;
      await onSaveNegotiation({
        negotiationStatus: 'Agreed',
        negotiatedAmount: negotiatedAmountNum,
        negotiationDate: negotiationDate || null,
        negotiationMinutesOrLetterRef: refDoc.trim(),
        remarks: remarks.trim(),
        isTenderAwardedToSociety: true,
      });
    } else {
      await onSaveNegotiation({
        negotiationStatus: 'Not Agreed',
        negotiatedAmount: null,
        negotiationDate: negotiationDate || null,
        negotiationMinutesOrLetterRef: refDoc.trim(),
        remarks: remarks.trim() || 'Society declined negotiation or unable to execute work below estimated rate.',
        isTenderAwardedToSociety: false,
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-0">
        <form onSubmit={handleSubmit}>
          <DialogHeader className="p-6 pb-2 border-b bg-muted/20">
            <div className="flex items-center gap-2">
              <Scale className="h-5 w-5 text-blue-600" />
              <DialogTitle className="text-xl font-bold">
                Labour Contract Society Negotiation (Bargain)
              </DialogTitle>
            </div>
            <DialogDescription className="text-xs text-muted-foreground mt-1">
              Special preferential selection workflow for Labour Contract Societies under Government Orders.
            </DialogDescription>
          </DialogHeader>

          <div className="p-6 space-y-5">
            {/* Comparative Summary Card */}
            <Card className="border border-blue-200 bg-blue-50/50">
              <CardContent className="p-4 space-y-3 text-xs">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div>
                    <span className="text-muted-foreground block text-[11px] font-medium">Labour Society</span>
                    <span className="font-semibold text-sm text-blue-900 block truncate">{primarySociety.name}</span>
                    <span className="text-[11px] text-blue-700 font-mono">
                      ₹{societyAmountNum?.toLocaleString('en-IN') ?? 'N/A'}
                    </span>
                  </div>

                  <div>
                    <span className="text-muted-foreground block text-[11px] font-medium">L1 Bidder</span>
                    <span className="font-semibold text-sm block truncate">{l1Bidder?.name ?? 'N/A'}</span>
                    <span className="text-[11px] text-green-700 font-mono">
                      ₹{l1AmountNum?.toLocaleString('en-IN') ?? 'N/A'}
                    </span>
                  </div>

                  <div>
                    <span className="text-muted-foreground block text-[11px] font-medium">Difference from L1</span>
                    <Badge variant="outline" className="bg-amber-100 text-amber-900 border-amber-300 font-semibold mt-0.5">
                      {percentageAboveL1 >= 0 ? `+${percentageAboveL1.toFixed(2)}%` : `${percentageAboveL1.toFixed(2)}%`}
                    </Badge>
                  </div>

                  <div>
                    <span className="text-muted-foreground block text-[11px] font-medium">Tender Amount (Rs.)</span>
                    <span className="font-semibold text-sm text-foreground block font-mono">
                      ₹{estAmountNum?.toLocaleString('en-IN') ?? 'N/A'}
                    </span>
                  </div>
                </div>

                {primarySociety.govtOrderAndDate && (
                  <div className="pt-2 border-t border-blue-200/60 flex items-center justify-between text-[11px] text-muted-foreground">
                    <span>Govt Order & Date: <strong className="text-foreground">{primarySociety.govtOrderAndDate}</strong></span>
                    <span>Max Allowed: <strong>{primarySociety.maxQuotedPercentageAboveL1 ?? 10}% above L1</strong></span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Decision Radio Group */}
            <div className="space-y-2">
              <Label className="text-sm font-semibold">Negotiation Outcome</Label>
              <RadioGroup
                value={decision}
                onValueChange={(val) => setDecision(val as 'Agreed' | 'Not Agreed')}
                className="grid grid-cols-1 sm:grid-cols-2 gap-3"
              >
                <label
                  htmlFor="decision-agreed"
                  className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                    decision === 'Agreed'
                      ? 'border-green-500 bg-green-50/50 shadow-sm'
                      : 'border-muted hover:border-gray-300'
                  }`}
                >
                  <RadioGroupItem value="Agreed" id="decision-agreed" className="mt-1" />
                  <div className="space-y-0.5 select-none">
                    <span className="font-semibold text-sm flex items-center gap-1.5 text-green-900">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      Society Agreed
                    </span>
                    <p className="text-xs text-muted-foreground">
                      Society accepts rate equal to or less than Tender Amount (Rs.). Tender will be awarded to Society.
                    </p>
                  </div>
                </label>

                <label
                  htmlFor="decision-not-agreed"
                  className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                    decision === 'Not Agreed'
                      ? 'border-destructive bg-red-50/50 shadow-sm'
                      : 'border-muted hover:border-gray-300'
                  }`}
                >
                  <RadioGroupItem value="Not Agreed" id="decision-not-agreed" className="mt-1" />
                  <div className="space-y-0.5 select-none">
                    <span className="font-semibold text-sm flex items-center gap-1.5 text-destructive">
                      <XCircle className="h-4 w-4 text-destructive" />
                      Society Not Agreed / Declined
                    </span>
                    <p className="text-xs text-muted-foreground">
                      Negotiation unsuccessful. Tender will be cancelled; no award will be issued.
                    </p>
                  </div>
                </label>
              </RadioGroup>
            </div>

            {/* Conditional Form Fields */}
            {decision === 'Agreed' ? (
              <div className="space-y-4 p-4 border rounded-lg bg-card">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="negotiated-amount" className="text-sm font-semibold flex items-center gap-1">
                      Agreed Negotiated Amount (₹) <span className="text-destructive">*</span>
                    </Label>
                    {estAmountNum && (
                      <span className="text-[11px] text-muted-foreground">
                        Ceiling: Equal to or less than Tender Amount (Rs. {estAmountNum.toLocaleString('en-IN')})
                      </span>
                    )}
                  </div>

                  <Input
                    id="negotiated-amount"
                    type="number"
                    step="0.01"
                    placeholder="Enter agreed amount (<= Tender Amount)"
                    value={negotiatedAmountStr}
                    onChange={(e) => setNegotiatedAmountStr(e.target.value)}
                    className={amountErrorMessage ? 'border-destructive focus-visible:ring-destructive' : ''}
                  />

                  {/* Quick helper shortcuts */}
                  {estAmountNum && (
                    <div className="flex flex-wrap gap-2 pt-1">
                      {l1AmountNum && l1AmountNum <= estAmountNum && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-6 text-[11px] px-2"
                          onClick={() => setNegotiatedAmountStr(String(l1AmountNum))}
                        >
                          Match L1: ₹{l1AmountNum.toLocaleString('en-IN')}
                        </Button>
                      )}
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-6 text-[11px] px-2"
                        onClick={() => setNegotiatedAmountStr(String(estAmountNum))}
                      >
                        At Tender Amount: ₹{estAmountNum.toLocaleString('en-IN')}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-6 text-[11px] px-2"
                        onClick={() => setNegotiatedAmountStr(String(Math.floor(estAmountNum * 0.99)))}
                      >
                        1% Below Tender Amount: ₹{Math.floor(estAmountNum * 0.99).toLocaleString('en-IN')}
                      </Button>
                    </div>
                  )}

                  {amountErrorMessage ? (
                    <p className="text-xs text-destructive flex items-center gap-1 mt-1 font-medium">
                      <AlertTriangle className="h-3.5 w-3.5" />
                      {amountErrorMessage}
                    </p>
                  ) : isValidNumber && estAmountNum && negotiatedAmountNum <= estAmountNum ? (
                    <p className="text-xs text-green-700 flex items-center gap-1 mt-1">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      {negotiatedAmountNum === estAmountNum
                        ? `Valid rate: Equal to Tender Amount (Rs. ${estAmountNum.toLocaleString('en-IN')})`
                        : `Valid rate: ₹${(estAmountNum - negotiatedAmountNum).toLocaleString('en-IN')} below Tender Amount`}
                    </p>
                  ) : null}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="negotiation-date" className="text-xs font-medium">
                      Negotiation / Agreement Date
                    </Label>
                    <Input
                      id="negotiation-date"
                      type="date"
                      value={negotiationDate}
                      onChange={(e) => setNegotiationDate(e.target.value)}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="ref-doc" className="text-xs font-medium">
                      Consent Letter / Minutes Reference
                    </Label>
                    <Input
                      id="ref-doc"
                      type="text"
                      placeholder="e.g. Minutes No. 12 or Letter Date..."
                      value={refDoc}
                      onChange={(e) => setRefDoc(e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="remarks" className="text-xs font-medium">
                    Remarks / Conditions
                  </Label>
                  <Textarea
                    id="remarks"
                    rows={2}
                    placeholder="e.g. Labour Society agreed to execute the work at negotiated rate as per GO reference."
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-4 p-4 border border-destructive/30 rounded-lg bg-destructive/5">
                <Alert variant="destructive" className="bg-destructive/10 border-destructive/30">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle className="text-xs font-bold">Important Tender Action</AlertTitle>
                  <AlertDescription className="text-xs">
                    Marking this negotiation as <strong>Unsuccessful / Declined</strong> will immediately set the tender status to <strong>&quot;Tender Cancelled&quot;</strong> and cancel the award. No tender will be issued.
                  </AlertDescription>
                </Alert>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="rej-date" className="text-xs font-medium">
                      Discussion / Rejection Date
                    </Label>
                    <Input
                      id="rej-date"
                      type="date"
                      value={negotiationDate}
                      onChange={(e) => setNegotiationDate(e.target.value)}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="rej-ref" className="text-xs font-medium">
                      Meeting / Minutes / Letter Reference
                    </Label>
                    <Input
                      id="rej-ref"
                      type="text"
                      placeholder="e.g. Negotiation Minutes dated..."
                      value={refDoc}
                      onChange={(e) => setRefDoc(e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="rej-remarks" className="text-xs font-medium">
                    Reason for Rejection / Failure
                  </Label>
                  <Textarea
                    id="rej-remarks"
                    rows={2}
                    placeholder="e.g. Society expressed inability to execute below estimated rate."
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                  />
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="p-4 border-t bg-muted/10 gap-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            {decision === 'Agreed' ? (
              <Button
                type="submit"
                className="bg-green-700 hover:bg-green-800 text-white gap-1.5"
                disabled={isSubmitting || !!amountErrorMessage || !isValidNumber}
              >
                {isSubmitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="h-4 w-4" />
                )}
                Save Agreement & Issue Tender to Society
              </Button>
            ) : (
              <Button
                type="submit"
                variant="destructive"
                className="gap-1.5"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <XCircle className="h-4 w-4" />
                )}
                Confirm Unsuccessful & Cancel Tender
              </Button>
            )}
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
