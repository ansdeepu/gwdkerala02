
// src/components/dashboard/RigFinancialSummary.tsx
"use client";

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { AgencyApplication, RigType } from '@/lib/schemas';
import { useAuth } from '@/hooks/useAuth';
import { format, startOfDay, endOfDay, isWithinInterval, isValid, parse } from 'date-fns';

const DollarSign = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><line x1="12" x2="12" y1="2" y2="22"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
);
const XCircle = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><circle cx="12" cy="12" r="10"/><path d="m15 9-6 6"/><path d="m9 9 6 6"/></svg>
);


interface RigFinancialSummaryProps {
    applications: AgencyApplication[];
    onCellClick: (data: any[], title: string, columns: any[]) => void;
}

type RigSummaryColumn = RigType | "Unspecified Type";

const rigTypeColumns: RigSummaryColumn[] = [
    "Hand Bore", 
    "Filter Point Rig", 
    "Calyx Rig", 
    "Rotary Rig", 
    "DTH Rig", 
    "Rotary cum DTH Rig",
    "Unspecified Type"
];

// Define the type for the summary data object
interface SummaryData {
    agencyRegCount: Record<string, number>;
    rigRegCount: Record<string, number>;
    renewalCount: Record<string, number>;
    agencyRegAppFee: Record<string, number>;
    rigRegAppFee: Record<string, number>;
    agencyRegFee: Record<string, number>;
    rigRegFee: Record<string, any>;
    renewalFee: Record<string, any>;
    totals: Record<string, any>;
    grandTotalOfFees: number;

    // Detailed data for dialogs
    agencyRegData: any[];
    rigRegData: Record<string, any[]>;
    renewalData: Record<string, any[]>;
    agencyRegAppFeeData: any[];
    rigRegAppFeeData: Record<string, any[]>;
    agencyRegFeeData: any[];
    rigRegFeeData: Record<string, any[]>;
    renewalFeeData: Record<string, any[]>;
}

const safeParseDate = (dateValue: any): Date | null => {
  if (!dateValue) return null;
  if (dateValue instanceof Date) return dateValue;
  if (typeof dateValue === 'object' && dateValue !== null && typeof (dateValue as any).seconds === 'number') {
    return new Date((dateValue as any).seconds * 1000);
  }
  if (typeof dateValue === 'string') {
    const parsed = new Date(dateValue);
    if (!isNaN(parsed.getTime())) return parsed;
  }
  return null;
};

const formatDateSafe = (d: any): string => {
    if (!d) return 'N/A';
    const date = safeParseDate(d);
    return date ? format(date, 'dd/MM/yyyy') : 'N/A';
};

const FinancialRow = ({ label, data, total, onCellClick, onTotalClick }: { label: string; data: Record<string, number>; total: number; onCellClick: (rigType: RigSummaryColumn | "Agency") => void; onTotalClick: () => void; }) => (
    <TableRow>
      <TableHead>{label}</TableHead>
      {label === "No. of Agency Registrations" ? (
         <TableCell colSpan={rigTypeColumns.length} className="text-center"></TableCell>
      ) : (
        rigTypeColumns.map(rigType => (
            <TableCell key={rigType} className="text-center font-bold">
                <Button variant="link" disabled={!data[rigType]} onClick={() => onCellClick(rigType)} className="p-0 h-auto font-bold">{data[rigType] || 0}</Button>
            </TableCell>
        ))
      )}
       <TableCell className="text-center font-bold">
            <Button variant="link" disabled={!total} onClick={onTotalClick} className="p-0 h-auto font-bold">{total}</Button>
       </TableCell>
    </TableRow>
);

const FinancialAmountRow = ({ label, data, total, onCellClick, onTotalClick }: { label: string; data: Record<string, any>; total: number; onCellClick: (rigType: RigSummaryColumn | "Agency") => void; onTotalClick: () => void; }) => {
    const isAgencyRow = label.toLowerCase().includes('agency');
    
    return (
    <TableRow>
      <TableHead>{label}</TableHead>
      {isAgencyRow ? (
         <TableCell colSpan={rigTypeColumns.length} className="text-center"></TableCell>
      ) : (
        rigTypeColumns.map(rigType => (
            <TableCell key={rigType} className="text-right font-mono font-bold">
                <Button variant="link" disabled={!data[rigType]} onClick={() => onCellClick(rigType)} className="p-0 h-auto font-mono text-right w-full block font-bold">{(data[rigType] || 0).toLocaleString('en-IN')}</Button>
            </TableCell>
        ))
      )}
       <TableCell className="text-right font-bold font-mono">
            <Button variant="link" disabled={!total} onClick={onTotalClick} className="p-0 h-auto font-mono font-bold text-right w-full block">{total.toLocaleString('en-IN')}</Button>
       </TableCell>
    </TableRow>
);};


export default function RigFinancialSummary({ applications, onCellClick }: RigFinancialSummaryProps) {
    const { user } = useAuth();
    const [startDate, setStartDate] = useState<Date | undefined>();
    const [endDate, setEndDate] = useState<Date | undefined>();

    const summaryData: SummaryData = useMemo(() => {
        const sDate = startDate ? startOfDay(startDate) : null;
        const eDate = endDate ? endOfDay(endDate) : null;

        const checkDate = (date: Date | string | null | undefined): boolean => {
            if (!sDate && !eDate) return true;
            if (!date) return false;
            const d = safeParseDate(date);
            if (!d || !isValid(d)) return false;
            if (sDate && eDate) return isWithinInterval(d, { start: sDate, end: eDate });
            if (sDate) return d >= sDate;
            if (eDate) return d <= eDate;
            return true;
        };
        
        const checkRegDate = (date: Date | string | null | undefined): boolean => {
            if (!sDate && !eDate) return true;
            if (!date) return false;
            const d = safeParseDate(date);
            if (!d || !isValid(d)) return false;
            if (sDate && eDate) return isWithinInterval(d, { start: sDate, end: eDate });
            if (sDate) return d >= sDate;
            if (eDate) return d <= eDate;
            return true;
        };
        
        const initialCounts: Record<string, number> = rigTypeColumns.reduce((acc, r) => ({...acc, [r]: 0}), {});

        let data: SummaryData = {
            agencyRegCount: { Agency: 0 }, 
            rigRegCount: {...initialCounts}, 
            renewalCount: {...initialCounts},
            agencyRegAppFee: { Agency: 0 }, 
            rigRegAppFee: {...initialCounts}, 
            agencyRegFee: { Agency: 0 }, 
            rigRegFee: {...initialCounts}, 
            renewalFee: {...initialCounts},
            totals: {},
            grandTotalOfFees: 0,
            
            agencyRegData: [], 
            rigRegData: rigTypeColumns.reduce((acc, rt) => ({...acc, [rt]: []}), {} as Record<string, any[]>), 
            renewalData: rigTypeColumns.reduce((acc, rt) => ({...acc, [rt]: []}), {} as Record<string, any[]>),
            agencyRegAppFeeData: [], 
            rigRegAppFeeData: rigTypeColumns.reduce((acc, rt) => ({...acc, [rt]: []}), {} as Record<string, any[]>), 
            agencyRegFeeData: [],
            rigRegFeeData: rigTypeColumns.reduce((acc, rt) => ({...acc, [rt]: []}), {} as Record<string, any[]>), 
            renewalFeeData: rigTypeColumns.reduce((acc, rt) => ({...acc, [rt]: []}), {} as Record<string, any[]>),
        };

        const completedApps = applications.filter(app => app.status === 'Active');

        // Application fees from ALL applications (Registration Completed and Pending Applications tabs)
        applications.forEach(app => {
            const appOffice = (app as any).officeLocation || (app as any).office || user?.officeLocation || '';
            const appFileNo = app.fileNo || (app as any).fileNumber || '';
            const agencyFallbackDate = app.agencyApplicationPaymentDate || app.agencyPaymentDate || app.agencyRegistrationDate || (app as any).createdAt || (app as any).updatedAt || (app as any).applicationDate || (app as any).date;

            // 1. Direct Agency-level Application Fee (from Agency Registration section)
            const agencyDirectFee = Number(
                app.agencyApplicationFee ??
                app.agencyApplicationChallanAmount ??
                (app as any).applicationFee ??
                (app as any).applicationChallanAmount ??
                (app as any).agencyAppFee ??
                (app as any).appFee ??
                0
            ) || 0;

            if (agencyDirectFee > 0 && checkDate(agencyFallbackDate)) {
                data.agencyRegAppFee["Agency"] += agencyDirectFee;
                data.agencyRegAppFeeData.push({
                    appId: app.id,
                    sourceType: 'agencyDirectFee',
                    officeLocation: appOffice,
                    agencyName: app.agencyName,
                    fileNo: appFileNo || 'N/A',
                    regNo: app.agencyRegistrationNo || 'N/A',
                    applicationStatus: app.status === 'Active' ? 'Registration Completed' : 'Pending Application',
                    paymentDate: app.agencyApplicationPaymentDate || agencyFallbackDate,
                    rawPaymentDate: app.agencyApplicationPaymentDate || agencyFallbackDate,
                    amount: agencyDirectFee,
                    rawAmount: agencyDirectFee,
                    originalFeeAmount: agencyDirectFee,
                    feeType: "Agency Registration"
                });
            }

            // 2. Application fees array
            const processedRigIdsWithAppFee = new Set<string>();

            app.applicationFees?.forEach((fee: any) => {
                const feeDate = fee.applicationFeePaymentDate || fee.paymentDate || fee.date || agencyFallbackDate;
                if (checkDate(feeDate)) {
                    const amount = Number(fee.applicationFeeAmount ?? fee.amount ?? fee.fee ?? fee.challanAmount ?? 0) || 0;
                    if (amount > 0) {
                        const feeTypeRaw = (fee.applicationFeeType || fee.feeType || fee.type || '').trim().toLowerCase();
                        const isAgencyFeeType = feeTypeRaw.includes('agency') || feeTypeRaw === '' || (!feeTypeRaw && (!app.rigs || app.rigs.length === 0));
                        const isRigFeeType = feeTypeRaw.includes('rig');

                        if (isAgencyFeeType || (!isRigFeeType && (!app.rigs || app.rigs.length === 0))) {
                            const exists = data.agencyRegAppFeeData.some(item =>
                                (fee.id && item.feeId === fee.id) ||
                                (item.appId === app.id && item.amount === amount && formatDateSafe(item.paymentDate) === formatDateSafe(feeDate))
                            );
                            if (!exists) {
                                data.agencyRegAppFee["Agency"] += amount;
                                data.agencyRegAppFeeData.push({
                                    appId: app.id,
                                    feeId: fee.id,
                                    sourceType: 'applicationFeesArray',
                                    officeLocation: appOffice,
                                    agencyName: app.agencyName,
                                    fileNo: appFileNo || 'N/A',
                                    regNo: app.agencyRegistrationNo || 'N/A',
                                    applicationStatus: app.status === 'Active' ? 'Registration Completed' : 'Pending Application',
                                    paymentDate: feeDate,
                                    rawPaymentDate: feeDate,
                                    amount,
                                    rawAmount: amount,
                                    originalFeeAmount: amount,
                                    feeType: fee.applicationFeeType || "Agency Registration"
                                });
                            }
                        } else if (isRigFeeType) {
                            const matchingRigs = app.rigs?.filter(r => r.typeOfRig && rigTypeColumns.includes(r.typeOfRig as any)) || [];
                            if (matchingRigs.length > 0) {
                                const perRigAmount = Math.round(amount / matchingRigs.length);
                                matchingRigs.forEach(rig => {
                                    const rawRigType = rig.typeOfRig;
                                    const rigType: RigSummaryColumn = (rawRigType && rigTypeColumns.includes(rawRigType as any))
                                        ? (rawRigType as RigSummaryColumn)
                                        : "Unspecified Type";
                                    const exists = data.rigRegAppFeeData[rigType]?.some(item =>
                                        (fee.id && item.feeId === fee.id && item.rigId === rig.id) ||
                                        (item.appId === app.id && item.rigId === rig.id && formatDateSafe(item.paymentDate) === formatDateSafe(feeDate))
                                    );
                                    if (!exists) {
                                        processedRigIdsWithAppFee.add(`${app.id}_${rig.id}`);
                                        data.rigRegAppFee[rigType] += perRigAmount;
                                        data.rigRegAppFeeData[rigType].push({
                                            appId: app.id,
                                            feeId: fee.id,
                                            rigId: rig.id,
                                            sourceType: 'applicationFeesArray',
                                            officeLocation: appOffice,
                                            agencyName: app.agencyName,
                                            fileNo: appFileNo || 'N/A',
                                            agencyStatus: app.status === 'Active' ? 'Registration Completed' : 'Pending Application',
                                            rigType,
                                            regNo: rig.rigRegistrationNo || 'N/A',
                                            status: rig.status || 'Active',
                                            paymentDate: feeDate,
                                            rawPaymentDate: feeDate,
                                            amount: perRigAmount,
                                            rawAmount: perRigAmount,
                                            originalFeeAmount: amount
                                        });
                                    }
                                });
                            } else {
                                const fallbackType: RigSummaryColumn = "Unspecified Type";
                                const exists = data.rigRegAppFeeData[fallbackType]?.some(item =>
                                    (fee.id && item.feeId === fee.id) ||
                                    (item.appId === app.id && item.amount === amount && formatDateSafe(item.paymentDate) === formatDateSafe(feeDate))
                                );
                                if (!exists) {
                                    data.rigRegAppFee[fallbackType] += amount;
                                    data.rigRegAppFeeData[fallbackType].push({
                                        appId: app.id,
                                        feeId: fee.id,
                                        sourceType: 'applicationFeesArray',
                                        officeLocation: appOffice,
                                        agencyName: app.agencyName,
                                        fileNo: appFileNo || 'N/A',
                                        agencyStatus: app.status === 'Active' ? 'Registration Completed' : 'Pending Application',
                                        rigType: fallbackType,
                                        regNo: app.agencyRegistrationNo || 'N/A',
                                        status: 'Pending',
                                        paymentDate: feeDate,
                                        rawPaymentDate: feeDate,
                                        amount,
                                        rawAmount: amount,
                                        originalFeeAmount: amount
                                    });
                                }
                            }
                        }
                    }
                }
            });

            // 3. Individual Rig Application Fees directly on rigs:
            // Covers Rig Registrations (Active), Pending Rigs, and Cancelled Rigs
            app.rigs?.forEach(rig => {
                // If this rig's fee was already captured from applicationFees array, skip to prevent repetition
                if (processedRigIdsWithAppFee.has(`${app.id}_${rig.id}`)) {
                    return;
                }

                const rawRigType = rig.typeOfRig;
                const rigType: RigSummaryColumn = (rawRigType && rigTypeColumns.includes(rawRigType as any))
                    ? (rawRigType as RigSummaryColumn)
                    : "Unspecified Type";

                const isTypeUnspecified = !rawRigType || rawRigType.trim() === '' || rawRigType.trim() === 'Unspecified Type';
                const isRegPaymentMissing = !rig.paymentDate;
                const rigStatus = rig.status === 'Cancelled'
                    ? 'Cancelled'
                    : (isTypeUnspecified || isRegPaymentMissing ? 'Pending' : 'Active');

                const rigAppDate = rig.applicationPaymentDate || rig.paymentDate || rig.registrationDate || agencyFallbackDate;
                const rigAppAmount = Number(rig.applicationFee || rig.applicationChallanAmount) || 0;
                if (rigAppAmount > 0 && checkDate(rigAppDate)) {
                    // Check if already exists in any rigType bucket for this app and rig
                    const alreadyRecorded = Object.values(data.rigRegAppFeeData).some(list =>
                        list.some(item => item.appId === app.id && item.rigId === rig.id)
                    );
                    if (!alreadyRecorded) {
                        data.rigRegAppFee[rigType] += rigAppAmount;
                        data.rigRegAppFeeData[rigType].push({
                            appId: app.id,
                            rigId: rig.id,
                            sourceType: 'rigDirectFee',
                            officeLocation: appOffice,
                            agencyName: app.agencyName,
                            fileNo: appFileNo || 'N/A',
                            agencyStatus: app.status === 'Active' ? 'Registration Completed' : 'Pending Application',
                            rigType: rawRigType || 'Unspecified Type',
                            regNo: rig.rigRegistrationNo || 'N/A',
                            status: rigStatus,
                            paymentDate: rig.applicationPaymentDate || rigAppDate,
                            rawPaymentDate: rig.applicationPaymentDate || rigAppDate,
                            amount: rigAppAmount,
                            rawAmount: rigAppAmount,
                            originalFeeAmount: rigAppAmount
                        });
                    }
                }
            });
        });

        // 4. Agency Registration and Rig Registration Fees & Renewals across all applications
        applications.forEach(app => {
            const appOffice = (app as any).officeLocation || (app as any).office || user?.officeLocation || '';
            const appFileNo = app.fileNo || (app as any).fileNumber || '';
            const agencyFallbackDate = app.agencyApplicationPaymentDate || app.agencyPaymentDate || app.agencyRegistrationDate || (app as any).createdAt;

            if (app.status === 'Active') {
                const hasRegDateInRange = checkRegDate(app.agencyRegistrationDate);
                if (hasRegDateInRange) {
                  data.agencyRegCount["Agency"]++;
                  data.agencyRegData.push({ 
                    agencyName: app.agencyName, 
                    fileNo: appFileNo || 'N/A',
                    regNo: app.agencyRegistrationNo || 'N/A', 
                    regDate: app.agencyRegistrationDate 
                  });
                }
            }

            const mainPaymentDate = app.agencyPaymentDate || agencyFallbackDate;
            const mainFee = Number(app.agencyRegistrationFee || (app as any).agencyChallanAmount) || 0;
            if (mainFee > 0 && checkDate(mainPaymentDate)) {
                data.agencyRegFee["Agency"] += mainFee;
                data.agencyRegFeeData.push({ 
                    appId: app.id,
                    agencyName: app.agencyName, 
                    fileNo: appFileNo || 'N/A',
                    regNo: app.agencyRegistrationNo || 'N/A', 
                    applicationStatus: app.status === 'Active' ? 'Registration Completed' : 'Pending Application',
                    paymentDate: mainPaymentDate, 
                    fee: mainFee 
                });
            }

            const addlPaymentDate = app.agencyAdditionalPaymentDate || agencyFallbackDate;
            const addlFee = Number(app.agencyAdditionalRegFee || (app as any).agencyAdditionalChallanAmount) || 0;
            if (addlFee > 0 && checkDate(addlPaymentDate)) {
                data.agencyRegFee["Agency"] += addlFee;
                data.agencyRegFeeData.push({ 
                    appId: app.id,
                    agencyName: app.agencyName, 
                    fileNo: appFileNo || 'N/A',
                    regNo: app.agencyRegistrationNo || 'N/A', 
                    applicationStatus: app.status === 'Active' ? 'Registration Completed' : 'Pending Application',
                    paymentDate: addlPaymentDate, 
                    fee: addlFee 
                });
            }

            app.rigs?.forEach(rig => {
                const rawRigType = rig.typeOfRig;
                const rigType: RigSummaryColumn = (rawRigType && rigTypeColumns.includes(rawRigType as any))
                    ? (rawRigType as RigSummaryColumn)
                    : "Unspecified Type";
                
                let rigHasFeePaymentInDate = false;
                const rigRegPaymentDate = rig.paymentDate || agencyFallbackDate;
                const rigFeeAmount = Number(rig.registrationFee || rig.challanAmount) || 0;
                if (rigFeeAmount > 0 && checkDate(rigRegPaymentDate)) {
                    data.rigRegFee[rigType] += rigFeeAmount;
                    data.rigRegFeeData[rigType].push({ 
                        agencyName: app.agencyName, 
                        fileNo: appFileNo || 'N/A',
                        rigType: rigType, 
                        regNo: rig.rigRegistrationNo || 'N/A', 
                        paymentDate: rigRegPaymentDate, 
                        fee: rigFeeAmount 
                    });
                    rigHasFeePaymentInDate = true;
                }

                const rigAddlPaymentDate = rig.additionalPaymentDate || agencyFallbackDate;
                const rigAddlFeeAmount = Number(rig.additionalRegistrationFee || rig.additionalChallanAmount) || 0;
                if (rigAddlFeeAmount > 0 && checkDate(rigAddlPaymentDate)) {
                    data.rigRegFee[rigType] += rigAddlFeeAmount;
                    data.rigRegFeeData[rigType].push({ 
                        agencyName: app.agencyName, 
                        fileNo: appFileNo || 'N/A',
                        rigType: rigType, 
                        regNo: rig.rigRegistrationNo || 'N/A', 
                        paymentDate: rigAddlPaymentDate, 
                        fee: rigAddlFeeAmount 
                    });
                    rigHasFeePaymentInDate = true;
                }
                
                if (app.status === 'Active' && (rigHasFeePaymentInDate || checkRegDate(rig.registrationDate))) {
                  data.rigRegCount[rigType]++;
                  data.rigRegData[rigType].push({ 
                    agencyName: app.agencyName, 
                    fileNo: appFileNo || 'N/A',
                    rigType: rigType, 
                    regNo: rig.rigRegistrationNo || 'N/A', 
                    regDate: rig.registrationDate 
                  });
                }

                rig.renewals?.forEach(renewal => {
                    if (checkDate(renewal.renewalDate)) {
                        data.renewalCount[rigType]++;
                        data.renewalData[rigType].push({ 
                            agencyName: app.agencyName, 
                            fileNo: appFileNo || 'N/A',
                            rigType: rigType, 
                            regNo: rig.rigRegistrationNo || 'N/A', 
                            renewalDate: renewal.renewalDate 
                        });
                    }
                    const renPaymentDate = renewal.paymentDate || renewal.renewalDate || agencyFallbackDate;
                    const renFeeAmount = Number(renewal.renewalFee || (renewal as any).fee) || 0;
                    if (renFeeAmount > 0 && checkDate(renPaymentDate)) {
                        data.renewalFee[rigType] += renFeeAmount;
                        data.renewalFeeData[rigType].push({ 
                            agencyName: app.agencyName, 
                            fileNo: appFileNo || 'N/A',
                            rigType: rigType, 
                            regNo: rig.rigRegistrationNo || 'N/A', 
                            paymentDate: renPaymentDate, 
                            renewalFee: renFeeAmount 
                        });
                    }
                });
            });
        });
        
        const totals: Record<string, any> = {};
        (Object.keys(data) as Array<keyof Omit<SummaryData, 'totals' | 'grandTotalOfFees'>>).forEach(key => {
            if (typeof data[key] === 'object' && !Array.isArray(data[key])) {
                totals[key] = Object.values(data[key]).reduce((sum: number, val: any) => sum + (typeof val === 'number' ? val : 0), 0);
            }
        });

        const grandTotalOfFees =
            (totals.agencyRegAppFee || 0) +
            (totals.rigRegAppFee || 0) +
            (totals.agencyRegFee || 0) +
            (totals.rigRegFee || 0) +
            (totals.renewalFee || 0);

        return { ...data, totals, grandTotalOfFees };

    }, [applications, startDate, endDate, user?.officeLocation]);

    const handleCellClick = (dataType: keyof SummaryData, rigType: RigSummaryColumn | 'Agency', title: string) => {
        const dataSet = summaryData[dataType];
        if (!dataSet) return;
    
        let records: any[] = [];
        if (rigType === 'Agency') {
            if (dataType === 'agencyRegData' || dataType === 'agencyRegAppFeeData' || dataType === 'agencyRegFeeData') {
                records = (dataSet as any[]) || [];
            }
        } else if (dataSet && typeof dataSet === 'object' && !Array.isArray(dataSet)) {
            records = (dataSet as Record<string, any[]>)[rigType] || [];
        }
    
        if (!records || records.length === 0) return;

        // Ensure distinct items in the records list
        const seenKeys = new Set<string>();
        records = records.filter(r => {
            const key = `${r.appId || ''}_${r.rigId || ''}_${r.feeId || ''}_${r.amount || r.fee || ''}_${formatDateSafe(r.paymentDate || r.regDate || r.renewalDate)}`;
            if (seenKeys.has(key)) return false;
            seenKeys.add(key);
            return true;
        });
    
        const getSortDateKey = (type: keyof SummaryData): string => {
            if (type.includes('renewal')) return type.includes('Fee') ? 'paymentDate' : 'renewalDate';
            if (type.includes('FeeData')) return 'paymentDate';
            if (type.includes('AppFeeData')) return 'paymentDate';
            return 'regDate';
        };
        const sortKey = getSortDateKey(dataType);
    
        records.sort((a, b) => {
            const dateA = safeParseDate(a[sortKey]);
            const dateB = safeParseDate(b[sortKey]);
            if (!dateA) return 1;
            if (!dateB) return -1;
            return dateA.getTime() - dateB.getTime();
        });
    
        let columns: any[] = [];
        if (dataType === 'agencyRegData') columns = [{ key: 'slNo', label: 'Sl.No.'}, {key: 'agencyName', label: 'Agency Name'}, {key: 'fileNo', label: 'File No.'}, {key: 'regNo', label: 'Reg No.'}, {key: 'regDate', label: 'Reg Date'}];
        else if (dataType === 'rigRegData') columns = [ { key: 'slNo', label: 'Sl.No.'}, {key: 'agencyName', label: 'Agency Name'}, {key: 'fileNo', label: 'File No.'}, {key: 'rigType', label: 'Rig Type'}, {key: 'regNo', label: 'Rig Reg No.'}, {key: 'regDate', label: 'Reg Date'}];
        else if (dataType === 'renewalData') columns = [ { key: 'slNo', label: 'Sl.No.'}, {key: 'agencyName', label: 'Agency Name'}, {key: 'fileNo', label: 'File No.'}, {key: 'rigType', label: 'Rig Type'}, {key: 'regNo', label: 'Rig No.'}, {key: 'renewalDate', label: 'Renewal Date'}];
        else if (dataType === 'agencyRegAppFeeData') columns = [ { key: 'slNo', label: 'Sl.No.'}, {key: 'agencyName', label: 'Agency Name'}, {key: 'fileNo', label: 'File No.'}, {key: 'regNo', label: 'Agency Reg No.'}, {key: 'applicationStatus', label: 'Application Tab'}, {key: 'paymentDate', label: 'Payment Date'}, {key: 'amount', label: 'Amount', isNumeric: true}, {key: 'action', label: 'Action'}];
        else if (dataType === 'rigRegAppFeeData') columns = [ { key: 'slNo', label: 'Sl.No.'}, {key: 'agencyName', label: 'Agency Name'}, {key: 'fileNo', label: 'File No.'}, {key: 'agencyStatus', label: 'Application Tab'}, {key: 'rigType', label: 'Rig Type'}, {key: 'regNo', label: 'Rig Reg No.'}, {key: 'status', label: 'Rig Status'}, {key: 'paymentDate', label: 'Payment Date'}, {key: 'amount', label: 'Amount', isNumeric: true}];
        else if (dataType.includes('AppFeeData')) columns = [ { key: 'slNo', label: 'Sl.No.'}, {key: 'agencyName', label: 'Agency Name'}, {key: 'fileNo', label: 'File No.'}, {key: 'paymentDate', label: 'Payment Date'}, {key: 'amount', label: 'Amount', isNumeric: true}];
        else if (dataType === 'agencyRegFeeData') columns = [ { key: 'slNo', label: 'Sl.No.'}, {key: 'agencyName', label: 'Agency Name'}, {key: 'fileNo', label: 'File No.'}, {key: 'regNo', label: 'Reg No.'}, {key: 'paymentDate', label: 'Payment Date'}, {key: 'fee', label: 'Fee', isNumeric: true}];
        else if (dataType === 'rigRegFeeData') columns = [ { key: 'slNo', label: 'Sl.No.'}, {key: 'agencyName', label: 'Agency Name'}, {key: 'fileNo', label: 'File No.'}, {key: 'rigType', label: 'Rig Type'}, {key: 'regNo', label: 'Rig No.'}, {key: 'paymentDate', label: 'Payment Date'}, {key: 'fee', label: 'Fee', isNumeric: true}];
        else if (dataType === 'renewalFeeData') columns = [{ key: 'slNo', label: 'Sl.No.'}, {key: 'agencyName', label: 'Agency Name'}, {key: 'fileNo', label: 'File No.'}, {key: 'rigType', label: 'Rig Type'}, {key: 'regNo', label: 'Rig No.'}, {key: 'paymentDate', label: 'Payment Date'}, {key: 'renewalFee', label: 'Fee', isNumeric: true}];
    
        const processedData = records.map((row, index) => {
            const newRow: any = {
                slNo: index + 1,
                appId: row.appId,
                rigId: row.rigId,
                feeId: row.feeId,
                sourceType: row.sourceType,
                rawAmount: row.rawAmount ?? row.amount,
                rawPaymentDate: row.rawPaymentDate ?? row.paymentDate,
                officeLocation: row.officeLocation,
                originalFeeAmount: row.originalFeeAmount,
            };
            columns.slice(1).forEach(col => {
                if (col.key === 'action') {
                    newRow['action'] = row.sourceType ? 'delete' : '';
                    return;
                }
                if (col.key === 'feeSource') {
                    newRow['feeSource'] = row.sourceType === 'applicationFeesArray' ? 'Application Fee' : 'Rig Card';
                    return;
                }
                const value = row[col.key];
                if (col.key.toLowerCase().includes('date')) {
                    newRow[col.key] = formatDateSafe(value);
                } else if (col.isNumeric) {
                    newRow[col.key] = (Number(value) || 0).toLocaleString('en-IN');
                } else {
                    newRow[col.key] = value || 'N/A';
                }
            });
            return newRow;
        });
    
        onCellClick(processedData, title, columns);
    };

    const handleTotalClick = (dataType: keyof Omit<SummaryData, 'totals' | 'grandTotalOfFees'>, title: string) => {
        let allRecords: any[] = [];
    
        const gatherFeeData = (sourceData: any) => {
            if (Array.isArray(sourceData)) {
                allRecords.push(...sourceData);
            } else if (typeof sourceData === 'object' && sourceData !== null) {
                Object.values(sourceData).forEach(value => {
                    if (Array.isArray(value)) {
                        allRecords.push(...value);
                    }
                });
            }
        };

        if (dataType === 'agencyRegAppFeeData') {
            gatherFeeData(summaryData.agencyRegAppFeeData);
        } else if (dataType === 'agencyRegFeeData') {
            gatherFeeData(summaryData.agencyRegFeeData);
        } else if (dataType === 'rigRegFeeData') {
            gatherFeeData(summaryData.rigRegFeeData);
        } else if (dataType === 'rigRegAppFeeData') {
            gatherFeeData(summaryData.rigRegAppFeeData);
        } else if (dataType === 'renewalFeeData') {
            gatherFeeData(summaryData.renewalFeeData);
        } else {
            // Existing logic for non-fee data
            if (dataType === 'agencyRegData') {
                allRecords = summaryData.agencyRegData || [];
            } else {
                const dataSet = summaryData[dataType];
                if (dataSet && typeof dataSet === 'object' && !Array.isArray(dataSet)) {
                    allRecords = Object.values(dataSet).flat();
                }
            }
        }
        
        if (allRecords.length === 0) return;

        // Ensure distinct items in total drill-down
        const seenTotalKeys = new Set<string>();
        allRecords = allRecords.filter(r => {
            const key = `${r.appId || ''}_${r.rigId || ''}_${r.feeId || ''}_${r.amount || r.fee || ''}_${formatDateSafe(r.paymentDate || r.regDate || r.renewalDate)}`;
            if (seenTotalKeys.has(key)) return false;
            seenTotalKeys.add(key);
            return true;
        });

        if (allRecords.length === 0) return;
    
        let columns: any[] = [];
        if (dataType === 'agencyRegData') columns = [{ key: 'slNo', label: 'Sl.No.'}, {key: 'agencyName', label: 'Agency Name'}, {key: 'fileNo', label: 'File No.'}, {key: 'regNo', label: 'Reg No.'}, {key: 'regDate', label: 'Reg Date'}];
        else if (dataType === 'rigRegData') columns = [ { key: 'slNo', label: 'Sl.No.'}, {key: 'agencyName', label: 'Agency Name'}, {key: 'fileNo', label: 'File No.'}, {key: 'rigType', label: 'Rig Type'}, {key: 'regNo', label: 'Rig Reg No.'}, {key: 'regDate', label: 'Reg Date'}];
        else if (dataType === 'renewalData') columns = [ { key: 'slNo', label: 'Sl.No.'}, {key: 'agencyName', label: 'Agency Name'}, {key: 'fileNo', label: 'File No.'}, {key: 'rigType', label: 'Rig Type'}, {key: 'regNo', label: 'Rig No.'}, {key: 'renewalDate', label: 'Renewal Date'}];
        else if (dataType === 'agencyRegAppFeeData') columns = [ { key: 'slNo', label: 'Sl.No.'}, {key: 'agencyName', label: 'Agency Name'}, {key: 'fileNo', label: 'File No.'}, {key: 'regNo', label: 'Agency Reg No.'}, {key: 'applicationStatus', label: 'Application Tab'}, {key: 'paymentDate', label: 'Payment Date'}, {key: 'amount', label: 'Amount', isNumeric: true}, {key: 'action', label: 'Action'}];
        else if (dataType === 'rigRegAppFeeData') columns = [ { key: 'slNo', label: 'Sl.No.'}, {key: 'agencyName', label: 'Agency Name'}, {key: 'fileNo', label: 'File No.'}, {key: 'agencyStatus', label: 'Application Tab'}, {key: 'rigType', label: 'Rig Type'}, {key: 'regNo', label: 'Rig Reg No.'}, {key: 'status', label: 'Rig Status'}, {key: 'paymentDate', label: 'Payment Date'}, {key: 'amount', label: 'Amount', isNumeric: true}];
        else if (dataType.includes('AppFeeData')) columns = [ { key: 'slNo', label: 'Sl.No.'}, {key: 'agencyName', label: 'Agency Name'}, {key: 'fileNo', label: 'File No.'}, {key: 'paymentDate', label: 'Payment Date'}, {key: 'amount', label: 'Amount', isNumeric: true}, {key: 'action', label: 'Action'}];
        else if (dataType === 'agencyRegFeeData') columns = [ { key: 'slNo', label: 'Sl.No.'}, {key: 'agencyName', label: 'Agency Name'}, {key: 'fileNo', label: 'File No.'}, {key: 'regNo', label: 'Reg No.'}, {key: 'paymentDate', label: 'Payment Date'}, {key: 'fee', label: 'Fee', isNumeric: true}];
        else if (dataType === 'rigRegFeeData') columns = [ { key: 'slNo', label: 'Sl.No.'}, {key: 'agencyName', label: 'Agency Name'}, {key: 'fileNo', label: 'File No.'}, {key: 'rigType', label: 'Rig Type'}, {key: 'regNo', label: 'Rig No.'}, {key: 'paymentDate', label: 'Payment Date'}, {key: 'fee', label: 'Fee', isNumeric: true}];
        else if (dataType === 'renewalFeeData') columns = [{ key: 'slNo', label: 'Sl.No.'}, {key: 'agencyName', label: 'Agency Name'}, {key: 'fileNo', label: 'File No.'}, {key: 'rigType', label: 'Rig Type'}, {key: 'regNo', label: 'Rig No.'}, {key: 'paymentDate', label: 'Payment Date'}, {key: 'renewalFee', label: 'Fee', isNumeric: true}];
    
        const sortKey = (dataType.includes('renewal') && !dataType.includes('Fee')) ? 'renewalDate' : (dataType.includes('Fee') || dataType.includes('AppFee')) ? 'paymentDate' : 'regDate';
        allRecords.sort((a, b) => {
            const dateA = safeParseDate(a[sortKey]);
            const dateB = safeParseDate(b[sortKey]);
            if (!dateA) return 1; if (!dateB) return -1;
            return dateA.getTime() - dateB.getTime();
        });
        
        const processedData = allRecords.map((row, index) => {
            const newRow: any = {
                slNo: index + 1,
                appId: row.appId,
                rigId: row.rigId,
                feeId: row.feeId,
                sourceType: row.sourceType,
                rawAmount: row.rawAmount ?? row.amount,
                rawPaymentDate: row.rawPaymentDate ?? row.paymentDate,
                officeLocation: row.officeLocation,
                originalFeeAmount: row.originalFeeAmount,
            };
            columns.slice(1).forEach(col => {
                if (col.key === 'action') {
                    newRow['action'] = row.sourceType ? 'delete' : '';
                    return;
                }
                if (col.key === 'feeSource') {
                    newRow['feeSource'] = row.sourceType === 'applicationFeesArray' ? 'Application Fee' : 'Rig Card';
                    return;
                }
                const value = row[col.key];
                if (col.key.toLowerCase().includes('date')) { newRow[col.key] = formatDateSafe(value); } 
                else if (col.isNumeric) { newRow[col.key] = (Number(value) || 0).toLocaleString('en-IN'); }
                else { newRow[col.key] = value || 'N/A'; }
            });
            return newRow;
        });

        onCellClick(processedData, title, columns);
    };


    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><DollarSign className="h-5 w-5 text-primary" />Rig Registration Financials</CardTitle>
                <CardDescription>Financial summary for rig and agency registrations, filterable by date.</CardDescription>
                <div className="flex flex-wrap items-center gap-2 pt-4 border-t mt-4">
                    <Input type="date" className="w-[240px]" value={startDate && isValid(startDate) ? format(startDate, 'yyyy-MM-dd') : ''} onChange={(e) => setStartDate(e.target.value ? parse(e.target.value, 'yyyy-MM-dd', new Date()) : undefined)}/>
                    <Input type="date" className="w-[240px]" value={endDate && isValid(endDate) ? format(endDate, 'yyyy-MM-dd') : ''} onChange={(e) => setEndDate(e.target.value ? parse(e.target.value, 'yyyy-MM-dd', new Date()) : undefined)}/>
                    <Button onClick={() => { setStartDate(undefined); setEndDate(undefined); }} variant="ghost" className="h-9 px-3"><XCircle className="mr-2 h-4 w-4"/>Clear</Button>
                </div>
            </CardHeader>
            <CardContent className="p-0">
                <div className="overflow-x-auto w-full">
                    <Table className="min-w-[950px] w-full">
                        <TableHeader>
                            <TableRow>
                                <TableHead className="min-w-[200px]">Service</TableHead>
                                {rigTypeColumns.map(rigType => <TableHead key={rigType} className="text-center">{rigType}</TableHead>)}
                                <TableHead className="text-center font-bold">Total</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            <FinancialRow label="No. of Agency Registrations" data={summaryData.agencyRegCount} total={summaryData.totals.agencyRegCount} onCellClick={(rt) => handleCellClick('agencyRegData', rt, 'Agency Registrations')} onTotalClick={() => handleTotalClick('agencyRegData', 'Total Agency Registrations')} />
                            <FinancialRow label="No. of Rig Registrations" data={summaryData.rigRegCount} total={summaryData.totals.rigRegCount} onCellClick={(rt) => handleCellClick('rigRegData', rt, `${rt} Registrations`)} onTotalClick={() => handleTotalClick('rigRegData', 'Total Rig Registrations')}/>
                            <FinancialRow label="No. of Renewals" data={summaryData.renewalCount} total={summaryData.totals.renewalCount} onCellClick={(rt) => handleCellClick('renewalData', rt, `${rt} Renewals`)} onTotalClick={() => handleTotalClick('renewalData', 'Total Rig Renewals')}/>
                            
                            <TableRow className="bg-secondary/50 font-semibold"><TableCell colSpan={rigTypeColumns.length + 2} className="p-2">fees details (₹)</TableCell></TableRow>
                            
                            <FinancialAmountRow label="Agency Registration Application Fee" data={summaryData.agencyRegAppFee} total={summaryData.totals.agencyRegAppFee} onCellClick={(rt) => handleCellClick('agencyRegAppFeeData', rt, 'Agency Application Fees')} onTotalClick={() => handleTotalClick('agencyRegAppFeeData', 'Total Agency Application Fees')} />
                            <FinancialAmountRow label="Rig Registration Application Fee" data={summaryData.rigRegAppFee} total={summaryData.totals.rigRegAppFee} onCellClick={(rt) => handleCellClick('rigRegAppFeeData', rt, 'Rig Application Fees')} onTotalClick={() => handleTotalClick('rigRegAppFeeData', 'Total Rig Application Fees')} />
                            <FinancialAmountRow label="Agency Registration Fee" data={summaryData.agencyRegFee} total={summaryData.totals.agencyRegFee} onCellClick={(rt) => handleCellClick('agencyRegFeeData', rt, 'Agency Registration Fees')} onTotalClick={() => handleTotalClick('agencyRegFeeData', 'Total Agency Registration Fees')} />
                            <FinancialAmountRow label="Rig Registration Fee" data={summaryData.rigRegFee} total={summaryData.totals.rigRegFee} onCellClick={(rt) => handleCellClick('rigRegFeeData', rt, `${rt} Registration Fees`)} onTotalClick={() => handleTotalClick('rigRegFeeData', 'Total Rig Registration Fees')} />
                            <FinancialAmountRow label="Rig Registration Renewal Fee" data={summaryData.renewalFee} total={summaryData.totals.renewalFee} onCellClick={(rt) => handleCellClick('renewalFeeData', rt, `${rt} Renewal Fees`)} onTotalClick={() => handleTotalClick('renewalFeeData', 'Total Rig Renewal Fees')} />
                        </TableBody>
                        <TableFooter>
                            <TableRow>
                                <TableHead colSpan={rigTypeColumns.length + 1} className="text-right font-bold">Grand Total (₹)</TableHead>
                                <TableCell className="text-right font-bold text-lg text-primary font-mono">{summaryData.grandTotalOfFees.toLocaleString('en-IN')}</TableCell>
                            </TableRow>
                        </TableFooter>
                    </Table>
                </div>
            </CardContent>
        </Card>
    )
}
