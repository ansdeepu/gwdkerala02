// src/app/dashboard/e-tender/[id]/supply-order/page.tsx
"use client";

import React, { useEffect, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTenderData } from '@/components/e-tender/TenderDataContext';
import { formatDateSafe, formatTenderNoForFilename } from '@/components/e-tender/utils';
import { useDataStore } from '@/hooks/use-data-store';
import type { StaffMember } from '@/lib/schemas';
import { numberToWords } from '@/components/e-tender/pdf/generators/utils';
import { Button } from '@/components/ui/button';
import { Copy, Printer } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { printDocument, copyOfficialTable } from '@/lib/print-utils';

export default function SupplyOrderPrintPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { tender } = useTenderData();
    const { officeAddress, allStaffMembers } = useDataStore();

    useEffect(() => {
        if (tender) {
            const formattedTenderNo = formatTenderNoForFilename(tender.eTenderNo);
            document.title = `eSupplyOrder${formattedTenderNo}`;
        }
    }, [tender]);

    const l1Bidder = useMemo(() => {
        if (!tender.bidders || tender.bidders.length === 0) return null;
        const validBidders = tender.bidders.filter(b => b.status === 'Accepted' && typeof b.quotedAmount === 'number' && b.quotedAmount > 0);
        if (validBidders.length === 0) return null;
        return validBidders.reduce((lowest, current) =>
            (current.quotedAmount! < lowest.quotedAmount!) ? current : lowest
        );
    }, [tender.bidders]);

    const hasRejectedBids = useMemo(() => tender.bidders?.some(b => b.status === 'Rejected'), [tender.bidders]);
    const contractAmount = (hasRejectedBids && tender.agreedAmount) ? tender.agreedAmount : l1Bidder?.quotedAmount;
    
    const measurer = allStaffMembers.find(s => s.name === tender.nameOfAssistantEngineer);
    const supervisor1 = allStaffMembers.find(s => s.id === tender.supervisor1Id);
    const supervisor2 = allStaffMembers.find(s => s.id === tender.supervisor2Id);
    const supervisor3 = allStaffMembers.find(s => s.id === tender.supervisor3Id);

    const quotedAmountInWords = contractAmount ? numberToWords(Math.floor(contractAmount)) : '';
    const supplySupervisors = [
        measurer?.name,
        supervisor1?.name,
        supervisor2?.name,
        supervisor3?.name,
    ].filter(Boolean).join(', ');
    const supplySupervisorPhone = measurer?.phoneNo || supervisor1?.phoneNo || supervisor2?.phoneNo || supervisor3?.phoneNo;
    const supervisorDetailsText = `${supplySupervisors}${supplySupervisorPhone ? ` (Phone: ${supplySupervisorPhone})` : ''}`;


    const cleanAddress = (addr: string) => {
        let clean = addr.replace("Office of the District Officer Ground Water Department District Office", "").trim();
        return clean;
    };

    const handleCopyOfficialTable = async () => {
        try {
            const success = await copyOfficialTable('supply-order-content');
            if (success) {
                toast({
                    title: "Copied Official Table!",
                    description: "Supply Order copied in Official Table format for e-Office Draft Editor.",
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
        <div className="-m-6 bg-white min-h-screen">
          <div id="supply-order-content" className="max-w-5xl mx-auto p-12 text-black" style={{ fontFamily: "'Times New Roman', Times, serif", fontSize: '12pt', lineHeight: '1.4' }}>
            {/* Page 1 & 2 combined */}
            <div className="space-y-4">
                <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #000000', marginTop: '8px', marginBottom: '16px' }}>
                    <tbody>
                        <tr>
                            <td align="left" valign="top" style={{ width: '50%', verticalAlign: 'top', textAlign: 'left', fontSize: '12pt', lineHeight: '1.5', border: '1px solid #000000', padding: '8px' }}>
                                <p style={{ margin: 0, padding: 0 }}>File No. {officeAddress?.officeCode || 'GKT'}/{tender.fileNo || '__________'}</p>
                                <p style={{ margin: 0, padding: 0 }}>Tender No. {tender.eTenderNo || '__________'}</p>
                            </td>
                            <td align="right" valign="top" style={{ width: '50%', verticalAlign: 'top', textAlign: 'right', fontSize: '12pt', lineHeight: '1.5', border: '1px solid #000000', padding: '8px' }}>
                                <p style={{ margin: 0, padding: 0 }}>Office of the District Officer</p>
                                <p style={{ margin: 0, padding: 0 }}>Ground Water Department</p>
                                {(() => {
                                    const raw = officeAddress?.address || '';
                                    const clean = cleanAddress(raw);
                                    if (clean.includes("High School Junction")) {
                                        return (
                                            <>
                                                <p style={{ margin: 0, padding: 0 }}>High School Junction</p>
                                                <p style={{ margin: 0, padding: 0 }}>Thevally P. O, Kollam - 691009</p>
                                            </>
                                        );
                                    }
                                    return <p style={{ margin: 0, padding: 0 }}>{clean}</p>;
                                })()}
                                <p style={{ margin: 0, padding: 0 }}>Phone: {officeAddress?.phoneNo || ''}</p>
                                <p style={{ margin: 0, padding: 0 }}>Email: {officeAddress?.email || ''}</p>
                                <p style={{ margin: 0, padding: 0 }}>Date: {formatDateSafe(tender.dateWorkOrder) || '__________'}</p>
                            </td>
                        </tr>
                    </tbody>
                </table>
                
                 <div style={{ marginTop: '16px', fontSize: '12pt' }}>
                    <p style={{ margin: 0, padding: 0 }}>From</p>
                    <p style={{ margin: '0 0 0 32px', padding: 0 }}>District Officer</p>
                </div>
                 <div style={{ marginTop: '12px', fontSize: '12pt' }}>
                    <p style={{ margin: 0, padding: 0 }}>To</p>
                    <div style={{ margin: '0 0 0 32px', padding: 0 }}>
                        <p style={{ margin: 0, padding: 0, fontWeight: 'bold' }}>{l1Bidder?.name || '____________________'}</p>
                        <p style={{ margin: 0, padding: 0 }}>{l1Bidder?.address || '____________________'}</p>
                    </div>
                </div>
                <div style={{ marginTop: '12px', fontSize: '12pt' }}>
                    <p style={{ margin: 0, padding: 0 }}>Sir,</p>
                </div>

                <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #000000', marginTop: '12px', marginBottom: '12px', fontSize: '12pt' }}>
                    <tbody>
                        <tr>
                            <td valign="top" style={{ width: '50px', whiteSpace: 'nowrap', padding: '8px', fontWeight: 'bold', verticalAlign: 'top', border: '1px solid #000000' }}>
                                Sub:
                            </td>
                            <td valign="top" align="justify" style={{ verticalAlign: 'top', textAlign: 'justify', lineHeight: '1.5', padding: '8px', border: '1px solid #000000' }}>
                                GWD, {officeAddress?.officeLocation || ''} - {tender.nameOfWork} - Supply Order issued – reg.
                            </td>
                        </tr>
                        <tr>
                            <td valign="top" style={{ width: '50px', whiteSpace: 'nowrap', padding: '8px', fontWeight: 'bold', verticalAlign: 'top', border: '1px solid #000000' }}>
                                Ref:
                            </td>
                            <td valign="top" align="left" style={{ verticalAlign: 'top', textAlign: 'left', lineHeight: '1.5', padding: '8px', border: '1px solid #000000' }}>
                                <p style={{ margin: 0, padding: 0 }}>1. e-Tender Notice of this office, {tender.eTenderNo || '__________'}, dated {formatDateSafe(tender.tenderDate) || '__________'}.</p>
                                <p style={{ margin: 0, padding: 0 }}>2. Supply Agreement No. {tender.eTenderNo || '__________'}, dated {formatDateSafe(tender.agreementDate) || '__________'}.</p>
                            </td>
                        </tr>
                    </tbody>
                </table>

                <p align="justify" style={{ textAlign: 'justify', textIndent: '35px', marginTop: '12px', marginBottom: '12px', lineHeight: '1.6', fontSize: '12pt' }}>As per the 1st reference cited above, e-tender was invited for the purchase of {tender.nameOfWork}.</p>
                <p align="justify" style={{ textAlign: 'justify', textIndent: '35px', marginTop: '12px', marginBottom: '12px', lineHeight: '1.6', fontSize: '12pt' }}>Vide the 2nd reference cited, {l1Bidder?.name || 'N/A'}, {l1Bidder?.address || 'N/A'}, submitted the lowest bid of Rs. {contractAmount?.toLocaleString('en-IN') || '0.00'}/- (Rupees {quotedAmountInWords} only) for the aforesaid purchase. Your bid was accepted accordingly.</p>
                <p align="justify" style={{ textAlign: 'justify', textIndent: '35px', marginTop: '12px', marginBottom: '12px', lineHeight: '1.6', fontSize: '12pt' }}>You are therefore directed to supply the items as per the schedule and specifications mentioned in the e-tender, and complete the supply within the stipulated period of {tender.periodOfCompletion || '___'} days under the supervision of {supervisorDetailsText}. Thereafter, you shall submit the bill in triplicate to this office for processing of payment.</p>
                
                <table style={{ width: '100%', borderCollapse: 'collapse', border: 'none', marginTop: '30px', fontSize: '12pt' }}>
                    <tbody>
                        <tr>
                            <td style={{ width: '50%' }}></td>
                            <td align="right" valign="top" style={{ width: '50%', textAlign: 'right', verticalAlign: 'top' }}>
                                <div style={{ height: '30px' }}></div>
                                <p style={{ margin: 0, padding: 0, fontWeight: 'bold' }}>District Officer</p>
                            </td>
                        </tr>
                    </tbody>
                </table>
                
                <div style={{ marginTop: '16px', fontSize: '12pt' }}>
                  <p style={{ margin: 0, padding: 0 }}>Copy to:</p>
                  <p style={{ margin: 0, padding: 0 }}>1. File, 2. OC</p>
                </div>

                <div align="center" style={{ textAlign: 'center', marginTop: '20px', fontSize: '12pt' }}>
                    <h2 style={{ fontWeight: 'bold', textDecoration: 'underline', fontSize: '13pt', margin: '0 0 8px 0' }}>Special Conditions</h2>
                    <ol style={{ textAlign: 'left', marginTop: '4px', marginLeft: '32px', paddingLeft: 0, lineHeight: '1.5' }}>
                        <li>The entire supply shall be completed within 15 days from the date of receipt of this order.</li>
                        <li>No advance payment will be made for the entire supply of items.</li>
                    </ol>
                </div>
                 <div align="center" style={{ textAlign: 'center', marginTop: '20px', fontSize: '12pt' }}>
                    <h2 style={{ fontWeight: 'bold', textDecoration: 'underline', fontSize: '13pt', margin: '0 0 8px 0' }}>Notes</h2>
                    <ol style={{ textAlign: 'justify', marginTop: '4px', marginLeft: '32px', paddingLeft: 0, lineHeight: '1.5' }}>
                        <li>INVOICES IN TRIPLICATE SHOULD BE DRAWN ON AND FORWARDED FOR PAYMENT TO The District Officer, District Office, Groundwater Department, {cleanAddress(officeAddress?.address || '')}.</li>
                        <li>Acknowledgment and all other communications regarding this purchase may be sent to the District Officer.</li>
                        <li>In all future correspondence and bills relating to this order the number and date at the top should INVARIABLY be quoted.</li>
                        <li>The payment will be paid for only after getting the satisfactory report from supervisory staff of this office.</li>
                    </ol>
                </div>
                <div className="text-center pt-2">
                    <h2 className="font-bold underline">List of items to be supplied</h2>
                     <table className="w-full mt-1 border-collapse border border-black text-sm">
                        <thead>
                            <tr className="border border-black">
                                <th className="border border-black p-1">Item No</th>
                                <th className="border border-black p-1">Description of item</th>
                                <th className="border border-black p-1">Quantity</th>
                                <th className="border border-black p-1">Unit</th>
                                <th colSpan={2} className="border border-black p-1">Rates</th>
                                <th colSpan={2} className="border border-black p-1">Total</th>
                            </tr>
                            <tr className="border border-black">
                              <th className="border border-black p-1"></th><th className="border border-black p-1"></th><th className="border border-black p-1"></th><th className="border border-black p-1"></th>
                              <th className="border border-black p-1">Rs.</th><th className="border border-black p-1">Ps.</th>
                              <th className="border border-black p-1">Rs.</th><th className="border border-black p-1">Ps.</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr className="border border-black">
                                <td className="border border-black p-1 text-center">1</td>
                                <td className="border border-black p-1 text-left">{tender.nameOfWork}</td>
                                <td className="border border-black p-1 text-center"></td>
                                <td className="border border-black p-1 text-center"></td>
                                <td colSpan={2} className="border border-black p-1 text-center">-</td>
                                <td colSpan={2} className="border border-black p-1 text-center">Rs. {contractAmount?.toLocaleString('en-IN') || ''}/-</td>
                            </tr>
                            <tr className="border-t border-black">
                                <td colSpan={6} className="text-right p-1 font-bold">Total (Rounded to)</td>
                                <td colSpan={2} className="p-1 text-center font-bold">Rs. {contractAmount?.toLocaleString('en-IN') || ''}/-</td>
                            </tr>
                            <tr>
                                <td colSpan={8} className="p-1 text-center font-bold">(Rupees {quotedAmountInWords} only)</td>
                            </tr>
                        </tbody>
                    </table>
                    <p className="text-[9pt] text-left mt-1 italic">N.B: The specifications, quantities, price, etc., are subject to correction. Errors or omissions, if any, will be intimated to or by the contractor within ten days from this date.</p>
                </div>
                <div className="pt-4 text-right">
                    <span className="font-semibold">District officer</span>
                </div>
            </div>
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
                <Button onClick={() => printDocument('supply-order-content', document.title || 'Supply Order')} className="gap-1.5">
                    <Printer className="h-4 w-4" />
                    Print
                </Button>
            </div>
        </div>
    );
}
