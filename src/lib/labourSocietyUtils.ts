// src/lib/labourSocietyUtils.ts
import type { Bidder, LabourSocietyNegotiation } from './schemas/eTenderSchema';

export interface LabourSocietyEvaluation {
  hasLabourSociety: boolean;
  societyBidders: Bidder[];
  primarySociety: Bidder | null;
  l1Bidder: Bidder | null;
  isSocietyL1: boolean;
  l1Amount: number | null;
  societyAmount: number | null;
  estimateAmount: number | null;
  percentageAboveL1: number;
  maxAllowedPercentage: number;
  isEligible: boolean;
  eligibilityReason: string;
  isNegotiationAgreed: boolean;
  isNegotiationNotAgreed: boolean;
  negotiatedAmount: number | null;
  awardStatusText: string;
  isTenderAwardedToSociety: boolean;
}

export function evaluateLabourSociety(params: {
  bidders?: Bidder[] | null;
  estimateAmount?: number | null;
  savedNegotiation?: LabourSocietyNegotiation | null;
}): LabourSocietyEvaluation {
  const { bidders = [], estimateAmount, savedNegotiation } = params;
  
  const estAmountNum = typeof estimateAmount === 'number' && estimateAmount > 0 ? estimateAmount : null;

  const defaultResult: LabourSocietyEvaluation = {
    hasLabourSociety: false,
    societyBidders: [],
    primarySociety: null,
    l1Bidder: null,
    isSocietyL1: false,
    l1Amount: null,
    societyAmount: null,
    estimateAmount: estAmountNum,
    percentageAboveL1: 0,
    maxAllowedPercentage: 10,
    isEligible: false,
    eligibilityReason: 'No Labour Contract Society bidders participating in this tender.',
    isNegotiationAgreed: false,
    isNegotiationNotAgreed: false,
    negotiatedAmount: null,
    awardStatusText: 'N/A',
    isTenderAwardedToSociety: false,
  };

  if (!bidders || bidders.length === 0) {
    return defaultResult;
  }

  const acceptedBidders = bidders.filter(
    b => b.status === 'Accepted' && typeof b.quotedAmount === 'number' && b.quotedAmount > 0
  );

  if (acceptedBidders.length === 0) {
    return defaultResult;
  }

  // Sort accepted bidders ascending by quotedAmount to determine L1
  const sortedBidders = [...acceptedBidders].sort((a, b) => (a.quotedAmount || 0) - (b.quotedAmount || 0));
  const l1Bidder = sortedBidders[0];
  const l1Amount = l1Bidder?.quotedAmount ?? 0;

  // Filter for Labour Society bidders among accepted bids
  const societyBidders = sortedBidders.filter(
    b => b.bidderType === 'Labour Society' || b.bidderType === 'Labour Contract Society'
  );

  if (societyBidders.length === 0) {
    return {
      ...defaultResult,
      l1Bidder,
      l1Amount,
      awardStatusText: l1Bidder ? `L1 Contractor: ${l1Bidder.name}` : 'N/A',
    };
  }

  // Prioritize the lowest quoting society among all Labour Societies
  const primarySociety = societyBidders[0];
  const societyAmount = primarySociety.quotedAmount ?? 0;
  const isSocietyL1 = primarySociety.id === l1Bidder.id;
  const maxAllowedPercentage = typeof primarySociety.maxQuotedPercentageAboveL1 === 'number' && primarySociety.maxQuotedPercentageAboveL1 > 0
    ? primarySociety.maxQuotedPercentageAboveL1
    : 10;

  // Calculate percentage difference relative to Tender Amount (Sanctioned Estimate PAC) if available, else relative to l1Amount
  let percentageAboveL1 = 0;
  if (!isSocietyL1) {
    if (estAmountNum && estAmountNum > 0) {
      percentageAboveL1 = Number((((societyAmount - l1Amount) / estAmountNum) * 100).toFixed(2));
    } else if (l1Amount > 0) {
      percentageAboveL1 = Number((((societyAmount - l1Amount) / l1Amount) * 100).toFixed(2));
    }
  }
  if (isNaN(percentageAboveL1)) {
    percentageAboveL1 = 0;
  }

  let isEligible = false;
  let eligibilityReason = '';

  if (isSocietyL1) {
    if (estAmountNum && societyAmount > estAmountNum) {
      isEligible = true;
      eligibilityReason = `Labour Society is L1, but their quoted amount (₹${societyAmount.toLocaleString('en-IN')}) exceeds the Tender Amount / Estimate (₹${estAmountNum.toLocaleString('en-IN')}). Negotiation is required to bring the rate equal to or below Tender Amount.`;
    } else {
      isEligible = false;
      eligibilityReason = `Labour Society is the L1 bidder and their quote is within the Tender Amount. Direct award can proceed without special negotiation.`;
    }
  } else {
    if (percentageAboveL1 <= maxAllowedPercentage) {
      isEligible = true;
      eligibilityReason = `Quoted amount is within ${maxAllowedPercentage}% above L1 (actual: +${percentageAboveL1.toFixed(2)}% of Tender Amount). Eligible for preferential negotiation.`;
    } else {
      isEligible = false;
      eligibilityReason = `Quoted amount exceeds the ${maxAllowedPercentage}% ceiling above L1 (actual: +${percentageAboveL1.toFixed(2)}% of Tender Amount). Not eligible for negotiation.`;
    }
  }

  const isNegotiationAgreed = savedNegotiation?.negotiationStatus === 'Agreed' && !!savedNegotiation.isTenderAwardedToSociety;
  const isNegotiationNotAgreed = savedNegotiation?.negotiationStatus === 'Not Agreed';
  const negotiatedAmount = savedNegotiation?.negotiatedAmount ?? null;

  let awardStatusText = 'Pending';
  if (isNegotiationAgreed) {
    awardStatusText = `Awarded to Labour Contract Society (${primarySociety.name}) at ₹${(negotiatedAmount ?? 0).toLocaleString('en-IN')}`;
  } else if (isNegotiationNotAgreed) {
    awardStatusText = 'Tender Cancelled (Negotiation Unsuccessful)';
  } else if (isEligible) {
    awardStatusText = 'Eligible for Negotiation (Action Required)';
  } else if (isSocietyL1 && (!estAmountNum || societyAmount <= estAmountNum)) {
    awardStatusText = `Awarded to Labour Contract Society directly as L1 (₹${societyAmount.toLocaleString('en-IN')})`;
  } else {
    awardStatusText = `Standard Award to L1 Bidder (${l1Bidder.name})`;
  }

  return {
    hasLabourSociety: true,
    societyBidders,
    primarySociety,
    l1Bidder,
    isSocietyL1,
    l1Amount,
    societyAmount,
    estimateAmount: estAmountNum,
    percentageAboveL1,
    maxAllowedPercentage,
    isEligible,
    eligibilityReason,
    isNegotiationAgreed,
    isNegotiationNotAgreed,
    negotiatedAmount,
    awardStatusText,
    isTenderAwardedToSociety: isNegotiationAgreed,
  };
}
