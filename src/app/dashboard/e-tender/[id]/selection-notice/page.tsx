// src/app/dashboard/e-tender/[id]/selection-notice/page.tsx
"use client";

import React, { useEffect, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTenderData } from '@/components/e-tender/TenderDataContext';
import { formatDateSafe, formatTenderNoForFilename, toDateOrNull } from '@/components/e-tender/utils';
import { useDataStore, defaultRateDescriptions } from '@/hooks/use-data-store';
import { Button } from '@/components/ui/button';
import { usePageHeader } from '@/hooks/usePageHeader';
import { isValid } from 'date-fns';
import { Copy, Printer } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { printDocument, copyOfficialTable } from '@/lib/print-utils';

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
    if (upToMatch) return { threshold: parseFloat(upToMatch[1]) / 100 };
    if (moreThanMatch) return { threshold: parseFloat(moreThanMatch[1]) / 100 };
    
    return { threshold: 0.10 }; 
};

export default function SelectionNoticePrintPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { tender } = useTenderData();
    const { officeAddress, allRateDescriptions } = useDataStore();
    const { setHeader } = usePageHeader();

    useEffect(() => {
        if (tender) {
            const formattedTenderNo = formatTenderNoForFilename(tender.eTenderNo);
            document.title = `dSelectionNotice${formattedTenderNo}`;
            setHeader("Selection Notice", `Print preview for Tender No: ${tender.eTenderNo}`);
        }
    }, [tender, setHeader]);
    
    const l1Bidder = useMemo(() => {
        if (!tender.bidders || tender.bidders.length === 0) return null;
        const validBidders = tender.bidders.filter(b => b.status === 'Accepted' && typeof b.quotedAmount === 'number' && b.quotedAmount > 0);
        if (validBidders.length === 0) return null;
        return validBidders.reduce((lowest, current) => 
            (current.quotedAmount! < lowest.quotedAmount!) ? current : lowest
        );
    }, [tender.bidders]);
    
    const isAwardedToLabourSociety = useMemo(() => {
        return Boolean(
            tender.labourSocietyNegotiation?.isTenderAwardedToSociety && 
            tender.labourSocietyNegotiation.negotiationStatus === 'Agreed'
        );
    }, [tender.labourSocietyNegotiation]);

    const awardedBidder = useMemo(() => {
        if (isAwardedToLabourSociety) {
            const found = tender.bidders?.find(b => b.id === tender.labourSocietyNegotiation?.societyBidderId || b.name === tender.labourSocietyNegotiation?.societyName);
            if (found) return found;
            return {
                name: tender.labourSocietyNegotiation?.societyName || 'Labour Contract Co-operative Society',
                address: '',
                quotedAmount: tender.labourSocietyNegotiation?.negotiatedAmount,
                performanceGuaranteeExemption: 'Yes',
                additionalPgExemption: 'Yes',
            } as any;
        }
        return l1Bidder;
    }, [isAwardedToLabourSociety, tender.labourSocietyNegotiation, tender.bidders, l1Bidder]);

    const hasRejectedBids = useMemo(() => tender.bidders?.some(b => b.status === 'Rejected'), [tender.bidders]);
    
    const actualQuotedAmount = useMemo(() => {
        if (isAwardedToLabourSociety && typeof tender.labourSocietyNegotiation?.negotiatedAmount === 'number') {
            return tender.labourSocietyNegotiation.negotiatedAmount;
        }
        return (hasRejectedBids && tender.agreedAmount) ? tender.agreedAmount : (l1Bidder?.quotedAmount ?? tender.contractAmount);
    }, [isAwardedToLabourSociety, tender.labourSocietyNegotiation, hasRejectedBids, tender.agreedAmount, l1Bidder?.quotedAmount, tender.contractAmount]);

    const contractAmount = useMemo(() => {
        if (tender.amountType === 'Tender Amount') return tender.estimateAmount;
        return actualQuotedAmount;
    }, [tender.amountType, tender.estimateAmount, actualQuotedAmount]);

    const references = useMemo(() => {
        const refs: string[] = [
            `ഈ ഓഫീസിലെ ${formatDateSafe(tender.dateOfTechnicalAndFinancialBidOpening) || '__________'} തീയതിയിലെ ടെണ്ടർ നമ്പർ ${tender.eTenderNo || '__________'}`
        ];
        if (isAwardedToLabourSociety) {
            if (tender.labourSocietyNegotiation?.govtOrderAndDate) {
                refs.push(`ലേബർ കോൺട്രാക്ട് സൊസൈറ്റി സംബന്ധിച്ച ഗവ. ഉത്തരവ്: ${tender.labourSocietyNegotiation.govtOrderAndDate}`);
            }
            if (tender.labourSocietyNegotiation?.negotiationMinutesOrLetterRef || tender.labourSocietyNegotiation?.negotiationDate) {
                const dateStr = tender.labourSocietyNegotiation?.negotiationDate ? formatDateSafe(tender.labourSocietyNegotiation.negotiationDate) : '';
                refs.push(`ചർച്ചാ തീരുമാന പ്രകാരമുള്ള സമ്മതപത്രം / മിനിറ്റ്സ്: ${tender.labourSocietyNegotiation?.negotiationMinutesOrLetterRef || ''} ${dateStr ? `(തീയതി: ${dateStr})` : ''}`.trim());
            }
        }
        return refs;
    }, [tender, isAwardedToLabourSociety]);

    // --- Dynamic Calculation Logic ---
    
    const stampPaperDescription = useMemo(() => {
        return tender?.stampPaperDescription || allRateDescriptions.stampPaper || defaultRateDescriptions.stampPaper;
    }, [tender?.stampPaperDescription, allRateDescriptions.stampPaper]);

    const performanceGuaranteeDescription = useMemo(() => {
        return tender?.performanceGuaranteeDescription || allRateDescriptions.performanceGuarantee || defaultRateDescriptions.performanceGuarantee;
    }, [tender?.performanceGuaranteeDescription, allRateDescriptions.performanceGuarantee]);

    const additionalPerformanceGuaranteeDescription = useMemo(() => {
        return tender?.additionalPerformanceGuaranteeDescription || allRateDescriptions.additionalPerformanceGuarantee || defaultRateDescriptions.additionalPerformanceGuarantee;
    }, [tender?.additionalPerformanceGuaranteeDescription, allRateDescriptions.additionalPerformanceGuarantee]);

    const calculatedStampPaperValue = useMemo(() => {
        const logic = parseStampPaperLogic(stampPaperDescription);
        const { rate, basis, min, max } = logic;
        if (!contractAmount || contractAmount <= 0) return min ?? 0;
        
        const duty = Math.ceil(contractAmount / (basis || 100000)) * (rate || 100); 
        const roundedDuty = Math.ceil(duty / 100) * 100;
        return Math.max(min ?? 0, Math.min(roundedDuty, max ?? Infinity));
    }, [stampPaperDescription, contractAmount]);

    const apgThreshold = useMemo(() => {
        const logic = parseAdditionalPerformanceGuaranteeLogic(additionalPerformanceGuaranteeDescription);
        return logic.threshold;
    }, [additionalPerformanceGuaranteeDescription]);
    
    const hasExplicitApg = tender.additionalPerformanceGuaranteeAmount !== undefined && 
                           tender.additionalPerformanceGuaranteeAmount !== null && 
                           tender.additionalPerformanceGuaranteeAmount > 0;

    const isLabourSociety = useMemo(() => {
        return Boolean(
            isAwardedToLabourSociety || 
            awardedBidder?.bidderType === 'Labour Contract Society' ||
            awardedBidder?.name?.toLowerCase().includes('labour contract') ||
            awardedBidder?.name?.toLowerCase().includes('co-operative') ||
            awardedBidder?.name?.toLowerCase().includes('cooperative') ||
            tender.labourSocietyNegotiation?.societyName
        );
    }, [isAwardedToLabourSociety, awardedBidder, tender.labourSocietyNegotiation]);

    const isPgExempt = useMemo(() => {
        if (isLabourSociety) return true;
        if (awardedBidder?.performanceGuaranteeExemption === 'Yes') return true;
        if (tender.performanceGuaranteeAmount === 0) return true;
        return false;
    }, [isLabourSociety, awardedBidder?.performanceGuaranteeExemption, tender.performanceGuaranteeAmount]);

    const isApgExempt = useMemo(() => {
        if (isAwardedToLabourSociety) return true;
        if (awardedBidder?.additionalPgExemption === 'Yes') return true;
        if (tender.additionalPerformanceGuaranteeAmount === 0) return true;
        return false;
    }, [isAwardedToLabourSociety, awardedBidder?.additionalPgExemption, tender.additionalPerformanceGuaranteeAmount]);

    const isApgRequired = useMemo(() => {
        if (hasExplicitApg) return true;
        if (!tender.estimateAmount || !actualQuotedAmount) return false;
        if (actualQuotedAmount >= tender.estimateAmount) return false;
        const percentageDifference = (tender.estimateAmount - actualQuotedAmount) / tender.estimateAmount;
        return percentageDifference > apgThreshold;
    }, [hasExplicitApg, tender.estimateAmount, actualQuotedAmount, apgThreshold]);

    const performanceGuarantee = useMemo(() => {
        if (isPgExempt) return 0;
        if (tender.performanceGuaranteeAmount !== undefined && tender.performanceGuaranteeAmount !== null && tender.performanceGuaranteeAmount > 0) {
            return tender.performanceGuaranteeAmount;
        }
        if (!contractAmount) return 0;
        return Math.ceil((contractAmount * 0.05) / 100) * 100;
    }, [isPgExempt, tender.performanceGuaranteeAmount, contractAmount]);

    const additionalPerformanceGuarantee = useMemo(() => {
        if (isApgExempt) return 0;
        if (hasExplicitApg) {
            return tender.additionalPerformanceGuaranteeAmount!;
        }
        if (!isApgRequired || !tender.estimateAmount || !actualQuotedAmount) return 0;
        const percentageDifference = (tender.estimateAmount - actualQuotedAmount) / tender.estimateAmount;
        const excessPercentage = percentageDifference - apgThreshold;
        const apg = excessPercentage * tender.estimateAmount;
        return Math.ceil(apg / 100) * 100;
    }, [isApgExempt, hasExplicitApg, isApgRequired, tender.estimateAmount, actualQuotedAmount, apgThreshold, tender.additionalPerformanceGuaranteeAmount]);

    const stampPaperValue = useMemo(() => {
        // Prefer calculated value to ensure correctness even if stale in DB
        return calculatedStampPaperValue;
    }, [calculatedStampPaperValue]);
    
    const excessPercentageText = useMemo(() => {
        if (!tender.estimateAmount || tender.estimateAmount <= 0) return '0';
        if (actualQuotedAmount && actualQuotedAmount < tender.estimateAmount) {
            const percentageDifference = (tender.estimateAmount - actualQuotedAmount) / tender.estimateAmount;
            if (percentageDifference > apgThreshold) {
                const excessPercentage = (percentageDifference - apgThreshold) * 100;
                return excessPercentage.toFixed(2);
            }
        }
        if (hasExplicitApg) {
            const calculatedPercentage = (tender.additionalPerformanceGuaranteeAmount! / tender.estimateAmount) * 100;
            return calculatedPercentage.toFixed(2);
        }
        return '0';
    }, [tender.estimateAmount, actualQuotedAmount, apgThreshold, hasExplicitApg, tender.additionalPerformanceGuaranteeAmount]);


        const MainContent = () => {
            const workName = tender.nameOfWorkMalayalam || tender.nameOfWork;
            const amountLabel = tender.amountType === 'Tender Amount' ? 'ടെണ്ടർ തുകയായ' : 'ടെണ്ടറിൽ ക്വോട്ട് ചെയ്തിരിക്കുന്ന';
            
            if (!l1Bidder && !tender.agreedAmount && !isAwardedToLabourSociety) {
                return <p className="leading-relaxed text-justify indent-8">ടെണ്ടർ അംഗീകരിച്ചു. ദയവായി മറ്റ് വിവരങ്ങൾ ചേർക്കുക.</p>;
            }
    
            const quotedAmountStr = (contractAmount ?? 0).toLocaleString('en-IN');
            const performanceGuaranteeStr = performanceGuarantee.toLocaleString('en-IN');
            const stampPaperValueStr = stampPaperValue.toLocaleString('en-IN');
            const effectiveApgRequired = isApgRequired && !isApgExempt && additionalPerformanceGuarantee > 0;

            if (isPgExempt) {
                if (effectiveApgRequired) {
                    const additionalPerformanceGuaranteeStr = additionalPerformanceGuarantee.toLocaleString('en-IN');
                    return (
                        <p align="justify" style={{ textAlign: 'justify', textIndent: '35px', lineHeight: '1.6', fontSize: '12pt', marginTop: '12px', marginBottom: '12px' }}>
                            മേൽ സൂചന പ്രകാരം {workName} നടപ്പിലാക്കുന്നതിന് വേണ്ടി താങ്കൾ സമർപ്പിച്ചിട്ടുള്ള ടെണ്ടർ അംഗീകരിച്ചു. {isLabourSociety ? 'പ്രസ്തുത സൊസൈറ്റിയെ' : 'താങ്കളെ'} പെർഫോമൻസ് ഗ്യാരന്റി തുക കെട്ടിവെയ്ക്കുന്നതിൽ നിന്നും ഒഴിവാക്കിയിട്ടുള്ളതും, എന്നാൽ അഡിഷണൽ പെർഫോമൻസ് ഗ്യാരന്റിയായി എസ്റ്റിമേറ്റ് തുകയുടെ <span style={{ fontWeight: 'bold' }}>{excessPercentageText}%</span> തുകയായ <span style={{ fontWeight: 'bold' }}>{additionalPerformanceGuaranteeStr}/-</span> രൂപയിൽ കുറയാത്ത തുക ട്രഷറി ഫിക്സഡ് ഡെപ്പോസിറ്റായും ഈ ഓഫീസിൽ കെട്ടിവയ്ക്കുന്നതിനും <span style={{ fontWeight: 'bold' }}>{stampPaperValueStr}/-</span> രൂപയുടെ മുദ്രപത്രത്തിൽ ഇതോടൊപ്പം ഉള്ളടക്കം ചെയ്തിട്ടുള്ള ഫോർമാറ്റിൽ വർക്ക് എഗ്രിമെന്റ് വയ്ക്കുന്നതിനും നിർദ്ദേശിക്കുന്നു.
                        </p>
                    );
                }

                return (
                    <p align="justify" style={{ textAlign: 'justify', textIndent: '35px', lineHeight: '1.6', fontSize: '12pt', marginTop: '12px', marginBottom: '12px' }}>
                        മേൽ സൂചന പ്രകാരം {workName} നടപ്പിലാക്കുന്നതിന് വേണ്ടി താങ്കൾ സമർപ്പിച്ചിട്ടുള്ള ടെണ്ടർ അംഗീകരിച്ചു. ടെണ്ടർ പ്രകാരമുള്ള പ്രവൃത്തികൾ ഏറ്റെടുക്കുന്നതിന് മുന്നോടിയായി ഈ നോട്ടീസ് തീയതി മുതൽ പതിന്നാല് ദിവസത്തിനകം ({isLabourSociety ? 'പ്രസ്തുത സൊസൈറ്റിയെ' : 'താങ്കളെ'} പെർഫോമൻസ് ഗ്യാരന്റി തുക കെട്ടിവെയ്ക്കുന്നതിൽ നിന്നും ഒഴിവാക്കിയിട്ടുള്ളതിനാൽ) <span style={{ fontWeight: 'bold' }}>{stampPaperValueStr}/-</span> രൂപയുടെ മുദ്രപത്രത്തിൽ ഇതോടൊപ്പം ഉള്ളടക്കം ചെയ്തിട്ടുള്ള ഫോർമാറ്റിൽ വർക്ക് എഗ്രിമെൻ്റ് വയ്ക്കുന്നതിനും നിർദ്ദേശിക്കുന്നു.
                    </p>
                );
            }
    
            if (effectiveApgRequired) {
                const additionalPerformanceGuaranteeStr = additionalPerformanceGuarantee.toLocaleString('en-IN');
    
                return (
                     <p align="justify" style={{ textAlign: 'justify', textIndent: '35px', lineHeight: '1.6', fontSize: '12pt', marginTop: '12px', marginBottom: '12px' }}>
                        മേൽ സൂചന പ്രകാരം {workName} നടപ്പിലാക്കുന്നതിന് വേണ്ടി താങ്കൾ സമർപ്പിച്ചിട്ടുള്ള ടെണ്ടർ അംഗീകരിച്ചു. ടെണ്ടർ പ്രകാരമുള്ള പ്രവൃത്തികൾ ഏറ്റെടുക്കുന്നതിന് മുന്നോടിയായി ഈ നോട്ടീസ് തീയതി മുതൽ പതിന്നാല് ദിവസത്തിനകം പെർഫോമൻസ് ഗ്യാരന്റിയായി {amountLabel} <span style={{ fontWeight: 'bold' }}>{quotedAmountStr}/-</span> രൂപയുടെ <span style={{ fontWeight: 'bold' }}>5%</span> തുകയായ <span style={{ fontWeight: 'bold' }}>{performanceGuaranteeStr}/-</span> രൂപയിൽ കുറയാത്ത തുക ട്രഷറി ഫിക്സഡ് ഡെപ്പോസിറ്റായും, അഡിഷണൽ പെർഫോമൻസ് ഗ്യാരന്റിയായി എസ്റ്റിമേറ്റ് തുകയുടെ <span style={{ fontWeight: 'bold' }}>{excessPercentageText}%</span> തുകയായ <span style={{ fontWeight: 'bold' }}>{additionalPerformanceGuaranteeStr}/-</span> രൂപയിൽ കുറയാത്ത തുക ട്രഷറി ഫിക്സഡ് ഡെപ്പോസിറ്റായും ഈ ഓഫീസിൽ കെട്ടിവയ്ക്കുന്നതിനും <span style={{ fontWeight: 'bold' }}>{stampPaperValueStr}/-</span> രൂപയുടെ മുദ്രപത്രത്തിൽ ഇതോടൊപ്പം ഉള്ളടക്കം ചെയ്തിട്ടുള്ള ഫോർമാറ്റിൽ വർക്ക് എഗ്രിമെന്റ് വയ്ക്കുന്നതിനും നിർദ്ദേശിക്കുന്നു.
                    </p>
                );
            }
    
            return (
                <p align="justify" style={{ textAlign: 'justify', textIndent: '35px', lineHeight: '1.6', fontSize: '12pt', marginTop: '12px', marginBottom: '12px' }}>
                    മേൽ സൂചന പ്രകാരം {workName} നടപ്പിലാക്കുന്നതിന് വേണ്ടി താങ്കൾ സമർപ്പിച്ചിട്ടുള്ള ടെണ്ടർ അംഗീകരിച്ചു. ടെണ്ടർ പ്രകാരമുള്ള പ്രവൃത്തികൾ ഏറ്റെടുക്കുന്നതിന് മുന്നോടിയായി ഈ നോട്ടീസ് തീയതി മുതൽ പതിന്നാല് ദിവസത്തിനകം പെർഫോമൻസ് ഗ്യാരന്റിയായി {amountLabel} <span style={{ fontWeight: 'bold' }}>{quotedAmountStr}/-</span> രൂപയുടെ <span style={{ fontWeight: 'bold' }}>5%</span> തുകയായ <span style={{ fontWeight: 'bold' }}>{performanceGuaranteeStr}/-</span> രൂപയിൽ കുറയാത്ത തുക ട്രഷറി ഫിക്സഡ് ഡെപ്പോസിറ്റായി ഈ ഓഫീസിൽ കെട്ടിവയ്ക്കുന്നതിനും <span style={{ fontWeight: 'bold' }}>{stampPaperValueStr}/-</span> രൂപയുടെ മുദ്രപത്രത്തിൽ ഇതോടൊപ്പം ഉള്ളടക്കം ചെയ്തിട്ടുള്ള ഫോർമാറ്റിൽ വർക്ക് എഗ്രിമെൻ്റ് വയ്ക്കുന്നതിനും നിർദ്ദേശിക്കുന്നു.
                </p>
            );
        };

    const handleCopyOfficialTable = async () => {
        try {
            const success = await copyOfficialTable('selection-notice-content');
            if (success) {
                toast({
                    title: "Copied Official Table!",
                    description: "Selection Notice copied in Official Table format for e-Office Draft Editor.",
                });
            } else {
                toast({
                    title: "Copy Failed",
                    description: "Could not copy automatically. Please select text manually to copy.",
                    variant: "destructive",
                });
            }
        } catch (err) {
            console.error("Official Table copy error:", err);
            toast({
                title: "Copy Failed",
                description: "An error occurred while copying.",
                variant: "destructive",
            });
        }
    };

    return (
        <div className="-m-6 bg-white min-h-screen print:min-h-0 print:bg-transparent print:m-0">
            <style dangerouslySetInnerHTML={{ __html: `
                @media print {
                    @page {
                        size: A4;
                        margin: 1cm 1.5cm 1cm 2.3cm;
                    }
                    body {
                        background: white !important;
                        color: black !important;
                        -webkit-print-color-adjust: exact;
                    }
                    .no-print {
                        display: none !important;
                    }
                }
            `}} />
            <div id="selection-notice-content" className="max-w-4xl print:max-w-none mx-auto bg-white shadow-sm print:shadow-none print:p-0 space-y-4 print:space-y-2 font-serif text-base print:text-[13px] print:leading-relaxed" style={{ fontFamily: "'Times New Roman', 'Suruma', 'Kartika', serif", fontSize: '12pt', color: '#000000', paddingTop: '1cm', paddingBottom: '1cm', paddingLeft: '2.3cm', paddingRight: '1.5cm' }}>
              <div align="center" style={{ textAlign: 'center', fontWeight: 'bold', textDecoration: 'underline', fontSize: '13pt', marginBottom: '12px' }}>
                  &quot;ഭരണഭാഷ-മാതൃഭാഷ&quot;
              </div>
              
              <table style={{ width: '100%', borderCollapse: 'collapse', border: 'none', marginTop: '8px', marginBottom: '16px' }}>
                  <tbody>
                      <tr>
                          <td align="left" valign="top" style={{ width: '50%', verticalAlign: 'top', textAlign: 'left', fontSize: '12pt', lineHeight: '1.5', border: 'none', padding: '8px 8px 8px 0' }}>
                              <p style={{ margin: 0, padding: 0 }}>നമ്പർ: {officeAddress?.officeCode || 'GKT'} / {tender.fileNo || '__________'}</p>
                              <p style={{ margin: 0, padding: 0 }}>ടെണ്ടർ നമ്പർ : {tender.eTenderNo || '__________'}</p>
                          </td>
                          <td align="right" valign="top" style={{ width: '50%', verticalAlign: 'top', textAlign: 'right', fontSize: '12pt', lineHeight: '1.5', border: 'none', padding: '8px 0 8px 8px' }}>
                              {(() => {
                                  const addrMalayalam = officeAddress?.addressMalayalam || "ജില്ലാ ഓഫീസറുടെ കാര്യാലയം\nഭൂജലവകുപ്പ് ജില്ലാ ഓഫീസ്\nഹൈസ്കൂൾ ജംഗ്ഷൻ, തേവള്ളി പി. ഓ.\nകൊല്ലം - 691009";
                                  const lines = addrMalayalam.split('\n').map(l => l.trim()).filter(Boolean);
                                  return lines.map((line, idx) => (
                                      <p key={idx} style={{ margin: 0, padding: 0 }}>{line}</p>
                                  ));
                              })()}
                              <p style={{ margin: 0, padding: 0 }}>ഫോൺനമ്പർ: {officeAddress?.phoneNo || ''}</p>
                              <p style={{ margin: 0, padding: 0 }}>ഇമെയിൽ: {officeAddress?.email || ''}</p>
                              <p style={{ margin: 0, padding: 0 }}>തീയതി: {formatDateSafe(tender.selectionNoticeDate) || '__________'}</p>
                          </td>
                      </tr>
                  </tbody>
              </table>

              <div style={{ marginTop: '16px', fontSize: '12pt' }}>
                  <p style={{ margin: 0, padding: 0 }}>പ്രേഷകൻ</p>
                  <p style={{ margin: '0 0 0 32px', padding: 0 }}>ജില്ലാ ആഫീസർ</p>
              </div>

              <div style={{ marginTop: '12px', fontSize: '12pt' }}>
                  <p style={{ margin: 0, padding: 0 }}>സ്വീകർത്താവ്</p>
                  <div style={{ margin: '0 0 0 32px', padding: 0, minHeight: '60px' }}>
                      <p style={{ margin: 0, padding: 0, fontSize: '13pt', fontWeight: 'bold' }}>{awardedBidder?.name || '____________________'}</p>
                      <p style={{ margin: 0, padding: 0, fontSize: '12pt' }}>{awardedBidder?.address || '____________________'}</p>
                  </div>
              </div>
              
              <div style={{ marginTop: '12px', fontSize: '12pt' }}>
                  <p style={{ margin: 0, padding: 0 }}>സർ,</p>
              </div>

              <table style={{ width: '100%', borderCollapse: 'collapse', border: 'none', marginTop: '12px', marginBottom: '12px', fontSize: '12pt' }}>
                  <tbody>
                      <tr>
                          <td valign="top" style={{ width: '70px', whiteSpace: 'nowrap', padding: '8px 8px 8px 0', fontWeight: 'bold', verticalAlign: 'top', border: 'none' }}>
                              വിഷയം:
                          </td>
                          <td valign="top" align="justify" style={{ verticalAlign: 'top', textAlign: 'justify', lineHeight: '1.5', padding: '8px 0', border: 'none' }}>
                              {tender.nameOfWorkMalayalam || tender.nameOfWork} - ടെണ്ടർ അംഗീകരിച്ച് സെലക്ഷൻ നോട്ടീസ് നൽകുന്നത് - സംബന്ധിച്ച്.
                          </td>
                      </tr>
                      <tr>
                          <td valign="top" style={{ width: '70px', whiteSpace: 'nowrap', padding: '8px 8px 8px 0', fontWeight: 'bold', verticalAlign: 'top', border: 'none' }}>
                              സൂചന:
                          </td>
                          <td valign="top" align="left" style={{ verticalAlign: 'top', textAlign: 'left', lineHeight: '1.5', padding: '8px 0', border: 'none' }}>
                              {references.length <= 1 ? (
                                  references[0]
                              ) : (
                                  <ol style={{ margin: 0, paddingLeft: '20px' }}>
                                      {references.map((refText, idx) => (
                                          <li key={idx} style={{ marginBottom: '4px' }}>{refText}</li>
                                      ))}
                                  </ol>
                              )}
                          </td>
                      </tr>
                  </tbody>
              </table>
              
              <div style={{ marginTop: '12px' }}>
                  <MainContent />
              </div>
              
              <table style={{ width: '100%', borderCollapse: 'collapse', border: 'none', marginTop: '40px', fontSize: '12pt' }}>
                  <tbody>
                      <tr>
                          <td style={{ width: '50%' }}></td>
                          <td align="right" valign="top" style={{ width: '50%', textAlign: 'right', verticalAlign: 'top' }}>
                              <p style={{ margin: 0, padding: 0 }}>വിശ്വസ്തതയോടെ</p>
                              <div style={{ height: '50px' }}></div>
                              <p style={{ margin: 0, padding: 0, fontWeight: 'bold' }}>ജില്ലാ ഓഫീസർ</p>
                          </td>
                      </tr>
                  </tbody>
              </table>
          </div>
            <div className="fixed bottom-4 right-4 no-print flex gap-2 bg-white/95 p-2 rounded-lg border shadow-lg backdrop-blur z-50">
                <Button 
                    variant="outline" 
                    onClick={() => {
                        if (window.opener) {
                            window.close();
                        } else if (tender.id) {
                            const query = searchParams?.toString();
                            router.push(`/dashboard/e-tender/${tender.id}${query ? `?${query}` : ''}#pdf-reports-section`);
                        } else {
                            const query = searchParams?.toString();
                            router.push(`/dashboard/e-tender${query ? `?${query}` : ''}`);
                        }
                    }}
                >
                    Close
                </Button>
                <Button variant="outline" onClick={handleCopyOfficialTable} className="gap-1.5 border-primary/30 text-primary hover:bg-primary/5">
                    <Copy className="h-4 w-4" />
                    Copy Official Table
                </Button>
                <Button onClick={() => printDocument('selection-notice-content', document.title || 'Selection Notice', '1cm 1.5cm 1cm 2.3cm')} className="gap-1.5">
                    <Printer className="h-4 w-4" />
                    Print
                </Button>
            </div>
        </div>
    );
}
