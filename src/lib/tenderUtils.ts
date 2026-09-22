// src/lib/tenderUtils.ts
import type { E_tender } from '@/hooks/useE_tenders';

export const normalizeFileNo = (fn?: string | null): string => {
    if (!fn) return '';
    return fn.trim().toUpperCase()
        .replace(/^[A-Z]{2,}[A-Z0-9_\-\s]*\//, '')
        .replace(/\s+/g, '');
};

export const matchFileNo = (fn1?: string | null, fn2?: string | null): boolean => {
    if (!fn1 || !fn2) return false;
    const n1 = normalizeFileNo(fn1);
    const n2 = normalizeFileNo(fn2);
    if (!n1 || !n2) return false;
    if (n1 === n2) return true;
    
    const parts1 = n1.split('/');
    const parts2 = n2.split('/');
    if (parts1[0] === parts2[0] && parts1[0].length > 0) {
        if (parts1.length === 1 || parts2.length === 1) return true;
        const y1 = parts1[1];
        const y2 = parts2[1];
        if (y1 === y2 || y1.slice(-2) === y2.slice(-2)) return true;
    }
    return false;
};

export const isTenderCancelledOrRetender = (status?: string | null): boolean => {
    if (!status) return false;
    const s = status.trim().toLowerCase();
    return s === 'tender cancelled' || 
           s === 'cancelled' || 
           s === 'retender' || 
           s === 're-tender' ||
           s.includes('cancelled') ||
           s.includes('retender');
};

export const isFinalSiteStatus = (status?: string | null): boolean => {
    if (!status) return false;
    return [
        "Work Completed",
        "Work Failed",
        "Work Cancelled",
        "Refund Pending",
        "Bill Prepared",
        "Payment Completed",
        "Utilization Certificate Issued",
        "Completed"
    ].includes(status);
};

export const getResolvedWorkStatus = (
    site: any,
    fileNo: string | undefined,
    idx: number,
    tenders: E_tender[],
    workTypeContext?: string
): string | null => {
    if (!site) return null;

    // 1. Terminal / Final Outcomes (Highest Priority)
    if (site.dateOfCompletion && String(site.dateOfCompletion).trim() !== '') {
        return "Work Completed";
    }
    const activeCondition = site.drillingConditions || site.developingConditions || site.schemeConditions;
    if (activeCondition === 'Failed' || activeCondition === 'Collapsed') {
        return "Work Failed";
    }
    if (activeCondition === 'Cancelled') {
        return "Work Cancelled";
    }
    if (activeCondition === 'Refund') {
        return "Refund Pending";
    }
    if (isFinalSiteStatus(site.workStatus)) {
        return null;
    }

    // 2. Physical Execution Stage
    const hasStarted = site.startDate && String(site.startDate).trim() !== '';
    const hasActualDrilling = (Number(site.totalDepth) > 0) || (site.dateOfDrilling && String(site.dateOfDrilling).trim() !== '');
    if (hasStarted || hasActualDrilling) {
        return "Work in Progress";
    }
    if (site.workStatus === "Work in Progress" || site.workStatus === "Work Initiated") {
        return null;
    }

    // 3. e-Tender / Rig Allotment Stage
    const matchingTenders = (tenders || []).filter(tender => isSiteTargetedByTender(site, fileNo, idx, tender));

    if (matchingTenders.length > 0) {
        matchingTenders.sort((a, b) => {
            const timeA = a.tenderDate instanceof Date ? a.tenderDate.getTime() : (a.tenderDate ? new Date(a.tenderDate as any).getTime() : 0);
            const timeB = b.tenderDate instanceof Date ? b.tenderDate.getTime() : (b.tenderDate ? new Date(b.tenderDate as any).getTime() : 0);
            return timeB - timeA;
        });

        const latestTender = matchingTenders[0];
        const ts = latestTender.presentStatus;

        if (ts === "Work Order Issued" || ts === "Supply Order Issued") {
            if (site.startDate && String(site.startDate).trim() !== '') {
                return "Work in Progress";
            }
            return "Work Order Issued";
        }
        if (ts === "Selection Notice Issued") {
            return "Selection Notice Issued";
        }
        if (!isTenderCancelledOrRetender(ts)) {
            return "Tendered";
        }
    }

    // 4. Department Rig Allotted
    if (site.siteConditions === 'Accessible to Dept. Rig') {
        return "Department Rig Allotted";
    }

    // 5. TS Pending - Only when site is explicitly marked as awaiting TS
    const tsAmt = Number(site.tsAmount) || 0;
    if (site.isAwaitingTS && (!tsAmt || tsAmt === 0)) {
        return "TS Pending";
    }

    // 6. Additional Fund Awaited - Estimate Amount (₹) is greater than Remitted Amount (₹)
    const context = workTypeContext || site.workTypeContext;
    const isDeferredFunding = context === 'planFund' || context === 'collector';
    const est = Number(site.estimateAmount) || 0;
    const rem = Number(site.remittedAmount) || 0;
    if (!isDeferredFunding && est > 0 && est > rem) {
        return "Additional Fund Awaited";
    }

    // 7. Baseline State - Under Process
    return "Under Process";
};

/**
 * Checks if a specific site is targeted by a given tender.
 * If the tender explicitly specifies selectedSiteIds or linkedSites, ONLY matching sites return true.
 * If the tender is a legacy tender with no explicit site selection, it checks if fileNo matches.
 */
export const isSiteTargetedByTender = (
    site: any,
    fileNo: string | undefined,
    idx: number,
    tender: Partial<E_tender> | null | undefined
): boolean => {
    if (!tender) return false;
    
    // Check if tender is cancelled
    if (isTenderCancelledOrRetender(tender.presentStatus)) {
        return false;
    }

    const targetFileNos = [
        tender.fileNo,
        tender.fileNo2,
        tender.fileNo3,
        tender.fileNo4
    ].filter((f): f is string => typeof f === 'string' && f.trim().length > 0);

    const isFileMatch = fileNo ? targetFileNos.some(tf => matchFileNo(tf, fileNo)) : false;

    const selectedSiteIds = Array.isArray(tender.selectedSiteIds) ? tender.selectedSiteIds : [];
    const linkedSites = Array.isArray(tender.linkedSites) ? tender.linkedSites : [];
    const hasExplicitSelection = selectedSiteIds.length > 0 || linkedSites.length > 0;

    const siteId = site?.id || (fileNo ? `${fileNo}_${idx}` : undefined);
    const siteName = (site?.nameOfSite || '').trim().toLowerCase();
    const sitePurpose = (site?.purpose || '').trim().toLowerCase();

    if (hasExplicitSelection) {
        // 1. Exact siteId match in selectedSiteIds
        if (siteId && selectedSiteIds.includes(siteId)) return true;
        if (site?.id && selectedSiteIds.includes(site.id)) return true;

        // 2. Exact match in linkedSites by siteId
        if (linkedSites.some((ls: any) => 
            (siteId && ls.siteId === siteId) || 
            (site?.id && (ls.siteId === site.id || ls.id === site.id))
        )) {
            return true;
        }

        // 3. Normalized index match across file prefixes: e.g. "1320/2026_0" matching "KLM/1320/2026" index 0
        const matchesIndexPattern = (idStr?: string) => {
            if (!idStr || typeof idStr !== 'string') return false;
            const suffix = `_${idx}`;
            if (!idStr.endsWith(suffix)) return false;
            const idFilePart = idStr.slice(0, -suffix.length);
            return fileNo ? matchFileNo(idFilePart, fileNo) : false;
        };

        if (selectedSiteIds.some(matchesIndexPattern)) return true;
        if (linkedSites.some((ls: any) => matchesIndexPattern(ls.siteId) || matchesIndexPattern(ls.id))) return true;

        // 4. File No + Site Name + Purpose match in linkedSites
        if (fileNo && siteName && linkedSites.some((ls: any) => {
            const lsFile = ls.fileNo;
            const lsName = (ls.nameOfSite || '').trim().toLowerCase();
            const lsPurpose = (ls.purpose || '').trim().toLowerCase();

            const fileMatches = !lsFile || matchFileNo(lsFile, fileNo);
            const nameMatches = lsName === siteName;
            const purposeMatches = !lsPurpose || !sitePurpose || lsPurpose === sitePurpose;

            return fileMatches && nameMatches && purposeMatches;
        })) {
            return true;
        }

        // If explicit selection exists on tender and this site didn't match, this site is NOT targeted
        return false;
    }

    // Fallback for legacy tenders without explicit site selections:
    if (isFileMatch) return true;

    // Or if the tender number matches and is valid
    const normTenderNo = site?.tenderNo?.trim().toUpperCase();
    if (normTenderNo && normTenderNo !== '_CLEAR_' && normTenderNo !== 'QUOTATION' && tender.eTenderNo && tender.eTenderNo.trim().toUpperCase() === normTenderNo) {
        return true;
    }

    return false;
};

export const isDatePopulated = (val: any): boolean => {
    if (!val) return false;
    if (val instanceof Date) {
        return !isNaN(val.getTime());
    }
    if (typeof val === 'object' && typeof val.toDate === 'function') {
        const d = val.toDate();
        return d instanceof Date && !isNaN(d.getTime());
    }
    const str = String(val).trim();
    if (str === '' || str.toLowerCase() === 'null') return false;
    const d = new Date(str);
    return !isNaN(d.getTime());
};

export const getAutoResolvedTenderStatus = (tender: any): string => {
    if (!tender) return 'Tender Preparation';

    const corrigendums = Array.isArray(tender.corrigendums) ? tender.corrigendums : [];
    const retenders = Array.isArray(tender.retenders) ? tender.retenders : [];

    // 1. Tender Cancelled (Highest Priority)
    const hasCancelCorrigendum = corrigendums.some((c: any) => c?.corrigendumType === 'Cancel');
    if (hasCancelCorrigendum || tender.presentStatus === 'Tender Cancelled') {
        return 'Tender Cancelled';
    }

    // 2. Retender
    const hasRetenderCorrigendum = corrigendums.some((c: any) => c?.corrigendumType === 'Retender');
    if (hasRetenderCorrigendum || retenders.length > 0 || tender.presentStatus === 'Retender') {
        return 'Retender';
    }

    // 3. Work Order Issued or Supply Order Issued
    const hasWorkOrderDate = isDatePopulated(tender.dateWorkOrder);
    const hasAgreementDate = isDatePopulated(tender.agreementDate);
    if (hasWorkOrderDate || hasAgreementDate) {
        if (tender.tenderType === 'Purchase') {
            return 'Supply Order Issued';
        }
        return 'Work Order Issued';
    }

    // 4. Selection Notice Issued
    const hasSelectionNoticeDate = isDatePopulated(tender.selectionNoticeDate);
    if (hasSelectionNoticeDate) {
        return 'Selection Notice Issued';
    }

    // 5. Bid Opened
    const hasOpeningDate = isDatePopulated(tender.dateOfOpeningBid);
    const bidders = Array.isArray(tender.bidders) ? tender.bidders : [];
    const hasBidders = bidders.length > 0;
    if (hasOpeningDate || hasBidders) {
        return 'Bid Opened';
    }

    // 6. Tender Process (Publishing date is in the past)
    if (isDatePopulated(tender.dateTimeOfPublishing)) {
        let pubDate: Date | null = null;
        if (tender.dateTimeOfPublishing instanceof Date) {
            pubDate = tender.dateTimeOfPublishing;
        } else if (typeof tender.dateTimeOfPublishing === 'object' && typeof tender.dateTimeOfPublishing.toDate === 'function') {
            pubDate = tender.dateTimeOfPublishing.toDate();
        } else {
            pubDate = new Date(String(tender.dateTimeOfPublishing));
        }
        if (pubDate && !isNaN(pubDate.getTime()) && pubDate.getTime() <= Date.now()) {
            return 'Tender Process';
        }
    }

    // Default or fallback to presentStatus or 'Tender Preparation'
    return tender.presentStatus || 'Tender Preparation';
};
