// src/components/e-tender/LabourSocietyNegotiationCard.tsx
"use client";

import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Scale, CheckCircle2, XCircle, AlertCircle, Edit, RotateCcw, ArrowRight, FileText } from 'lucide-react';
import type { LabourSocietyEvaluation } from '@/lib/labourSocietyUtils';
import type { LabourSocietyNegotiation } from '@/lib/schemas/eTenderSchema';
import { formatDateSafe } from './utils';

interface LabourSocietyNegotiationCardProps {
  evaluation: LabourSocietyEvaluation;
  negotiationData?: LabourSocietyNegotiation | null;
  isReadOnly?: boolean;
  onOpenNegotiate: () => void;
  onResetNegotiate?: () => void;
}

export default function LabourSocietyNegotiationCard({
  evaluation,
  negotiationData,
  isReadOnly = false,
  onOpenNegotiate,
  onResetNegotiate,
}: LabourSocietyNegotiationCardProps) {
  const {
    hasLabourSociety,
    primarySociety,
    l1Bidder,
    l1Amount,
    societyAmount,
    percentageAboveL1,
    maxAllowedPercentage,
    isEligible,
    eligibilityReason,
    isNegotiationAgreed,
    isNegotiationNotAgreed,
    negotiatedAmount,
    isSocietyL1,
  } = evaluation;

  if (!hasLabourSociety || !primarySociety) {
    return null;
  }

  // Determine negotiation badge
  let statusBadge = (
    <Badge variant="outline" className="bg-amber-50 text-amber-800 border-amber-300">
      Not Eligible (&gt;{maxAllowedPercentage}% above L1)
    </Badge>
  );

  if (isNegotiationAgreed) {
    statusBadge = (
      <Badge className="bg-green-600 hover:bg-green-700 text-white flex items-center gap-1 font-semibold">
        <CheckCircle2 className="h-3.5 w-3.5" />
        Negotiation Agreed — Tender Awarded
      </Badge>
    );
  } else if (isNegotiationNotAgreed) {
    statusBadge = (
      <Badge variant="destructive" className="flex items-center gap-1 font-semibold">
        <XCircle className="h-3.5 w-3.5" />
        Negotiation Unsuccessful — Tender Cancelled
      </Badge>
    );
  } else if (isEligible) {
    statusBadge = (
      <Badge className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-1 font-semibold">
        <Scale className="h-3.5 w-3.5" />
        Eligible for Negotiation (Within {maxAllowedPercentage}%)
      </Badge>
    );
  }

  // Final tender award status label
  let finalAwardStatus = 'Pending Negotiation';
  if (isNegotiationAgreed) {
    finalAwardStatus = `Awarded to Labour Contract Society: ${primarySociety.name} at ₹${(negotiatedAmount ?? 0).toLocaleString('en-IN')}`;
  } else if (isNegotiationNotAgreed) {
    finalAwardStatus = 'Tender Cancelled (No award issued)';
  } else if (isSocietyL1 && (!evaluation.estimateAmount || (societyAmount ?? 0) <= evaluation.estimateAmount)) {
    finalAwardStatus = `Awarded directly to L1 Labour Society: ${primarySociety.name}`;
  } else if (!isEligible) {
    finalAwardStatus = `Standard Award to L1 Bidder: ${l1Bidder?.name ?? 'N/A'}`;
  }

  return (
    <Card className="border rounded-lg bg-blue-50/20 border-blue-200">
      <CardHeader className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 gap-3 bg-blue-100/30 border-b border-blue-200/60">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-blue-600 text-white rounded-md shadow-sm">
            <Scale className="h-4 w-4" />
          </div>
          <div>
            <CardTitle className="text-base font-bold text-blue-950 flex items-center gap-2 flex-wrap">
              Special Workflow: Labour Contract Society
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5">
              Comparison with L1 bidder and preferential rate negotiation under PWD / Government Orders
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {statusBadge}
          {!isReadOnly && isEligible && (
            <Button
              type="button"
              size="sm"
              className={
                isNegotiationAgreed
                  ? 'bg-blue-700 hover:bg-blue-800 text-white text-xs h-8'
                  : 'bg-primary hover:bg-primary/90 text-xs h-8 font-semibold'
              }
              onClick={onOpenNegotiate}
            >
              <Edit className="h-3.5 w-3.5 mr-1.5" />
              {negotiationData?.negotiationStatus ? 'Update Negotiation' : 'Bargain / Negotiate'}
            </Button>
          )}
          {!isReadOnly && negotiationData?.negotiationStatus && onResetNegotiate && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="text-xs h-8 text-muted-foreground hover:text-foreground"
              onClick={onResetNegotiate}
              title="Reset negotiation decision"
            >
              <RotateCcw className="h-3.5 w-3.5 mr-1" />
              Reset
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="p-4 space-y-4">
        {/* 7 Required Workflow Data Points */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-x-6 gap-y-3 bg-white p-3.5 rounded-md border text-xs">
          {/* 1. L1 Amount */}
          <div className="space-y-0.5">
            <span className="text-muted-foreground text-[11px] font-medium block">1. L1 Bidder & Amount</span>
            <span className="font-bold text-sm text-foreground block font-mono">
              ₹{(l1Amount ?? 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </span>
            <span className="text-[11px] text-muted-foreground block truncate">
              {l1Bidder?.name ?? 'N/A'} {isSocietyL1 && '(Society is L1)'}
            </span>
          </div>

          {/* 2. Society Original Quoted Amount */}
          <div className="space-y-0.5">
            <span className="text-muted-foreground text-[11px] font-medium block">2. Society Quoted Amount</span>
            <span className="font-bold text-sm text-blue-900 block font-mono">
              ₹{(societyAmount ?? 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </span>
            <span className="text-[11px] text-muted-foreground block truncate">
              {primarySociety.name}
            </span>
          </div>

          {/* 3. Percentage Difference from L1 */}
          <div className="space-y-0.5">
            <span className="text-muted-foreground text-[11px] font-medium block">3. % Difference from L1</span>
            <div className="flex items-center gap-1.5 pt-0.5">
              <span className={`font-bold text-sm font-mono ${percentageAboveL1 <= maxAllowedPercentage ? 'text-green-700' : 'text-amber-700'}`}>
                {percentageAboveL1 >= 0 ? `+${percentageAboveL1.toFixed(2)}%` : `${percentageAboveL1.toFixed(2)}%`}
              </span>
              <Badge variant="outline" className="text-[10px] py-0 px-1 font-normal text-muted-foreground">
                Limit: {maxAllowedPercentage}%
              </Badge>
            </div>
            <span className="text-[10px] text-muted-foreground block">
              {percentageAboveL1 <= maxAllowedPercentage ? 'Within eligible limit' : 'Exceeds limit'}
            </span>
          </div>

          {/* 4. Estimated Amount / Tender Amount */}
          <div className="space-y-0.5">
            <span className="text-muted-foreground text-[11px] font-medium block">4. Tender Amount (Rs.)</span>
            <span className="font-bold text-sm text-foreground block font-mono">
              {evaluation.estimateAmount ? `₹${evaluation.estimateAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}` : 'N/A'}
            </span>
            <span className="text-[10px] text-muted-foreground block">
              Negotiated rate ceiling (Sanctioned Estimate)
            </span>
          </div>
        </div>

        {/* Second Row: Negotiated Amount, Negotiation Status, and Final Award Status */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
          {/* 5. Negotiated Amount */}
          <div className="p-3 bg-white rounded-md border text-xs space-y-1">
            <span className="text-muted-foreground text-[11px] font-medium block">5. Agreed Negotiated Amount</span>
            {negotiatedAmount ? (
              <div>
                <span className="font-bold text-base text-green-800 font-mono block">
                  ₹{negotiatedAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </span>
                {evaluation.estimateAmount && (
                  <span className="text-[11px] text-green-700 block">
                    {evaluation.estimateAmount === negotiatedAmount
                      ? '(Equal to Tender Amount)'
                      : `(₹${(evaluation.estimateAmount - negotiatedAmount).toLocaleString('en-IN')} below Tender Amount)`}
                  </span>
                )}
              </div>
            ) : isNegotiationNotAgreed ? (
              <span className="text-destructive font-semibold">Declined / None</span>
            ) : (
              <span className="text-muted-foreground italic">Awaiting negotiation</span>
            )}
          </div>

          {/* 6. Negotiation Status */}
          <div className="p-3 bg-white rounded-md border text-xs space-y-1">
            <span className="text-muted-foreground text-[11px] font-medium block">6. Negotiation Status</span>
            {isNegotiationAgreed ? (
              <span className="font-bold text-green-700 text-sm flex items-center gap-1">
                <CheckCircle2 className="h-4 w-4" /> Agreed / Successful
              </span>
            ) : isNegotiationNotAgreed ? (
              <span className="font-bold text-destructive text-sm flex items-center gap-1">
                <XCircle className="h-4 w-4" /> Unsuccessful / Declined
              </span>
            ) : isEligible ? (
              <span className="font-semibold text-blue-700 text-sm flex items-center gap-1">
                <AlertCircle className="h-4 w-4" /> Eligible (Pending Bargain)
              </span>
            ) : (
              <span className="text-muted-foreground text-sm">Not Eligible</span>
            )}
            <p className="text-[11px] text-muted-foreground line-clamp-1">{eligibilityReason}</p>
          </div>

          {/* 7. Final Tender Award Status */}
          <div className="p-3 bg-white rounded-md border text-xs space-y-1">
            <span className="text-muted-foreground text-[11px] font-medium block">7. Final Tender Award Status</span>
            <span className={`font-bold text-sm block ${isNegotiationAgreed ? 'text-green-800' : isNegotiationNotAgreed ? 'text-destructive' : 'text-foreground'}`}>
              {finalAwardStatus}
            </span>
            {isNegotiationAgreed && (
              <span className="text-[11px] text-green-700 block font-medium">
                Selection Notice &amp; Agreement configured for Society
              </span>
            )}
            {isNegotiationNotAgreed && (
              <span className="text-[11px] text-destructive block font-medium">
                Tender is Cancelled — No work order issued
              </span>
            )}
          </div>
        </div>

        {/* Detailed negotiation audit info if recorded */}
        {negotiationData?.negotiationStatus && (
          <div className="p-3 bg-muted/40 rounded-md border text-xs flex flex-wrap gap-x-6 gap-y-2 text-muted-foreground">
            {negotiationData.negotiationDate && (
              <div>
                <span>Negotiation Date: </span>
                <strong className="text-foreground">{formatDateSafe(negotiationData.negotiationDate)}</strong>
              </div>
            )}
            {negotiationData.negotiationMinutesOrLetterRef && (
              <div>
                <span>Reference: </span>
                <strong className="text-foreground">{negotiationData.negotiationMinutesOrLetterRef}</strong>
              </div>
            )}
            {primarySociety.govtOrderAndDate && (
              <div>
                <span>Govt Order: </span>
                <strong className="text-foreground">{primarySociety.govtOrderAndDate}</strong>
              </div>
            )}
            {negotiationData.remarks && (
              <div className="w-full pt-1 border-t border-muted">
                <span>Remarks: </span>
                <span className="text-foreground italic">{negotiationData.remarks}</span>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
