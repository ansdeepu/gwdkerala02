
// src/app/dashboard/agency-registration/print/page.tsx
"use client";

import React, { useMemo, useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useDataStore } from '@/hooks/use-data-store';
import { format, addYears, isValid, parseISO, isBefore } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Printer, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { printDocument } from '@/lib/print-utils';
import { getFirestore, collectionGroup, query, getDocs } from 'firebase/firestore';
import { app } from '@/lib/firebase';
import type { AgencyApplication } from '@/hooks/useAgencyApplications';

const toDateOrNull = (value: any): Date | null => {
    if (!value) return null;
    if (value instanceof Date) return isValid(value) ? value : null;
    if (typeof value === 'object' && typeof value.seconds === 'number') return new Date(value.seconds * 1000);
    if (typeof value === 'number') {
        const d = new Date(value);
        return isValid(d) ? d : null;
    }
    if (typeof value === 'string') {
        const d = parseISO(value);
        if (isValid(d)) return d;
        const parsed = new Date(value);
        if (isValid(parsed)) return parsed;
    }
    return null;
};

export default function AgencyExpiryPrintPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const id = searchParams.get('id');
    const lang = searchParams.get('lang') || 'en';

    const { allAgencyApplications, officeAddress, isLoading } = useDataStore();
    const [fetchedApp, setFetchedApp] = useState<AgencyApplication | null>(null);
    const [isFetchingDoc, setIsFetchingDoc] = useState<boolean>(true);

    useEffect(() => {
        if (!id || id === 'new') {
            setIsFetchingDoc(false);
            return;
        }

        const existing = allAgencyApplications.find(a => a.id === id);
        if (existing) {
            setFetchedApp(existing);
            setIsFetchingDoc(false);
            return;
        }

        let isMounted = true;
        const fetchDirectly = async () => {
            try {
                const db = getFirestore(app);
                const q = query(collectionGroup(db, 'agencyApplications'));
                const querySnapshot = await getDocs(q);
                const foundDoc = querySnapshot.docs.find(d => d.id === id);
                if (foundDoc && isMounted) {
                    setFetchedApp({ ...foundDoc.data(), id: foundDoc.id } as AgencyApplication);
                }
            } catch (err) {
                console.error('Error fetching agency application directly:', err);
            } finally {
                if (isMounted) setIsFetchingDoc(false);
            }
        };

        fetchDirectly();

        return () => { isMounted = false; };
    }, [id, allAgencyApplications]);

    const data = useMemo(() => {
        const application = allAgencyApplications.find(a => a.id === id) || fetchedApp;
        if (!application) return null;

        const today = new Date();
        
        // Find all active rigs that have expired
        const expiredRigs = (application.rigs || []).filter(rig => {
            if (rig.status !== 'Active') return false;

            const lastEffectiveDate = rig.renewals && rig.renewals.length > 0
                ? [...rig.renewals].sort((a, b) => (toDateOrNull(b.renewalDate)?.getTime() ?? 0) - (toDateOrNull(a.renewalDate)?.getTime() ?? 0))[0].renewalDate
                : rig.registrationDate;

            if (!lastEffectiveDate) return false;
            
            const expiryDate = new Date(addYears(new Date(lastEffectiveDate), 1).getTime() - 86400000);
            return isValid(expiryDate) && isBefore(expiryDate, today);
        }).map(rig => {
             const lastEffectiveDate = rig.renewals && rig.renewals.length > 0
                ? [...rig.renewals].sort((a, b) => (toDateOrNull(b.renewalDate)?.getTime() ?? 0) - (toDateOrNull(a.renewalDate)?.getTime() ?? 0))[0].renewalDate
                : rig.registrationDate;
             const expiryDate = lastEffectiveDate ? new Date(addYears(new Date(lastEffectiveDate), 1).getTime() - 86400000) : null;
             return {
                 ...rig,
                 expiryDate: expiryDate ? format(expiryDate, 'dd/MM/yyyy') : 'N/A'
             };
        });

        if (expiredRigs.length === 0) return null;

        return {
            application,
            expiredRigs,
            ownerName: application.owner?.name || '',
            ownerNameMalayalam: application.owner?.nameMalayalam || '',
            ownerAddress: application.owner?.address || '',
            agencyName: application.agencyName || '',
            agencyNameMalayalam: application.agencyNameMalayalam || '',
        };
    }, [allAgencyApplications, fetchedApp, id]);

    if ((isLoading || isFetchingDoc) && !data) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] p-10 space-y-4">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                <p className="text-sm font-medium text-slate-600">Loading letter details...</p>
            </div>
        );
    }

    if (!data) return (
        <div className="p-10 text-center space-y-4">
            <p className="text-muted-foreground">No expired rigs found for this application to generate a letter.</p>
            <Button variant="outline" onClick={() => window.close()}>Close</Button>
        </div>
    );

    const isEnglish = lang === 'en';

    return (
        <div className="bg-white p-0 sm:p-8 print:h-auto print:p-0 print:m-0">
            <div id="print-letter-content" className="max-w-4xl mx-auto border bg-white shadow-sm p-12 text-black font-serif print:border-0 print:shadow-none print:p-0 print:m-0 print:max-w-full">
                
                {/* Header */}
                <div className="flex justify-between items-start border-b-2 border-black pb-4 mb-8">
                    <div className="space-y-1">
                         <p className="text-sm font-medium">{officeAddress?.officeName || 'District Office'}</p>
                         <p className="text-xs whitespace-pre-wrap">{officeAddress?.address || ''}</p>
                    </div>
                    <div className="text-right space-y-1">
                        <p className="text-xs">Phone: {officeAddress?.phoneNo || ''}</p>
                        <p className="text-xs">Email: {officeAddress?.email || ''}</p>
                        <p className="text-sm font-bold mt-2">Date: {format(new Date(), 'dd/MM/yyyy')}</p>
                    </div>
                </div>

                {/* From / To */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                    <div className="space-y-1 text-left">
                        <p className="font-bold text-xs uppercase text-black mb-1">From:</p>
                        <p className="font-bold text-sm">The District Officer</p>
                        <p className="text-sm">Ground Water Department</p>
                        <p className="text-sm capitalize">{officeAddress?.officeLocation || ''}</p>
                    </div>
                    <div className="space-y-1 text-left">
                        <p className="font-bold text-xs uppercase text-black mb-1">To:</p>
                        <div className="space-y-4">
                            <div>
                                {data.ownerNameMalayalam && <p className="font-bold whitespace-pre-wrap text-sm text-black">{data.ownerNameMalayalam}</p>}
                                <p className={data.ownerNameMalayalam ? "text-xs whitespace-pre-wrap text-black" : "font-bold whitespace-pre-wrap text-sm text-black"}>{data.ownerName}</p>
                                {data.ownerAddress && <p className="text-sm whitespace-pre-wrap text-black">{data.ownerAddress}</p>}
                            </div>
                            <div>
                                {data.agencyNameMalayalam && <p className="font-bold whitespace-pre-wrap text-sm text-black">{data.agencyNameMalayalam}</p>}
                                <p className={data.agencyNameMalayalam ? "text-xs whitespace-pre-wrap text-black" : "font-bold whitespace-pre-wrap text-sm text-black"}>{data.agencyName}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Subject */}
                <div className="mb-6">
                    <p className="font-bold flex gap-2">
                        <span>{isEnglish ? 'Sub:' : 'വിഷയം:'}</span>
                        <span className="underline">
                            {isEnglish 
                                ? `Renewal of Rig Registration - ${data.expiredRigs.length > 1 ? 'Multiple Units' : data.expiredRigs[0].typeOfRig}`
                                : `റിഗ്ഗ് രജിസ്ട്രേഷൻ പുതുക്കുന്നത് സംബന്ധിച്ച് - ${data.expiredRigs.length > 1 ? 'വിവിധ യൂണിറ്റുകൾ' : data.expiredRigs[0].typeOfRig}`
                            }
                        </span>
                    </p>
                </div>

                {/* Body */}
                <div className="space-y-6 text-justify leading-relaxed">
                    {isEnglish ? (
                        <>
                            <p>Sir/Madam,</p>
                            <p className="indent-12">
                                It is observed from the departmental records that the registration for your following rig unit(s) has expired:
                            </p>
                            
                            <table className="w-full border-collapse border border-black my-4 text-sm">
                                <thead>
                                    <tr className="bg-gray-50">
                                        <th className="border border-black p-2 text-left">Type of Rig</th>
                                        <th className="border border-black p-2 text-left">Registration No.</th>
                                        <th className="border border-black p-2 text-left">Expired On</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {data.expiredRigs.map((rig, idx) => (
                                        <tr key={idx}>
                                            <td className="border border-black p-2">{rig.typeOfRig}</td>
                                            <td className="border border-black p-2 font-mono">{rig.rigRegistrationNo || 'N/A'}</td>
                                            <td className="border border-black p-2 font-semibold text-red-700">{rig.expiryDate}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>

                            <p className="indent-12">
                                As per the current regulations, all drilling units operating within the state must maintain 
                                a valid registration with the Ground Water Department. You are therefore directed to renew 
                                the registration immediately by paying the prescribed renewal fee and submitting the necessary 
                                documents at this office.
                            </p>
                            <p className="indent-12">
                                Please note that operating a drilling rig without a valid registration is a violation of departmental 
                                rules and may lead to legal action or penalties as per the prevailing government orders.
                            </p>
                        </>
                    ) : (
                        <>
                            <p>സർ,</p>
                            <p className="indent-12">
                                വകുപ്പിലെ രേഖകൾ പ്രകാരം താങ്കളുടെ ഉടമസ്ഥതയിലുള്ള താഴെ പറയുന്ന റിഗ്ഗ് യൂണിറ്റുകളുടെ കാലാവധി അവസാനിച്ചിരിക്കുകയാണ്:
                            </p>

                            <table className="w-full border-collapse border border-black my-4 text-sm">
                                <thead>
                                    <tr className="bg-gray-50">
                                        <th className="border border-black p-2 text-left">റിഗ്ഗിന്റെ ഇനം</th>
                                        <th className="border border-black p-2 text-left">രജിസ്ട്രേഷൻ നമ്പർ</th>
                                        <th className="border border-black p-2 text-left">കാലാവധി അവസാനിച്ചത്</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {data.expiredRigs.map((rig, idx) => (
                                        <tr key={idx}>
                                            <td className="border border-black p-2">{rig.typeOfRig}</td>
                                            <td className="border border-black p-2 font-mono">{rig.rigRegistrationNo || 'N/A'}</td>
                                            <td className="border border-black p-2 font-semibold text-red-700">{rig.expiryDate}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>

                            <p className="indent-12">
                                നിലവിലുള്ള നിയമപ്രകാരം ഭൂജല വകുപ്പിൽ കൃത്യമായ രജിസ്ട്രേഷൻ ഇല്ലാതെ റിഗ്ഗ് പ്രവർത്തിപ്പിക്കുന്നത് കുറ്റകരമാണ്. 
                                ആയതിനാൽ പ്രസ്തുത റിഗ്ഗിന്റെ രജിസ്ട്രേഷൻ പുതുക്കുന്നതിനായി നിശ്ചിത ഫീസ് അടച്ച് ബന്ധപ്പെട്ട രേഖകൾ സഹിതം 
                                അടിയന്തിരമായി ഈ ഓഫീസിൽ ഹാജരാകാൻ നിർദ്ദേശിക്കുന്നു.
                            </p>
                            <p className="indent-12">
                                രജിസ്ട്രേഷൻ പുതുക്കാതെ റിഗ്ഗ് പ്രവർത്തിപ്പിക്കുന്നത് ശ്രദ്ധയിൽപ്പെട്ടാൽ നിയമപരമായ കർശന നടപടികൾ സ്വീകരിക്കുന്നതാണ്.
                            </p>
                        </>
                    )}
                </div>

                {/* Footer */}
                <div className="mt-24 text-right">
                    <div className="space-y-1">
                        <p className="font-bold">{isEnglish ? 'District Officer' : 'ജില്ലാ ഓഫീസർ'}</p>
                        <p className="text-sm">Ground Water Department</p>
                        <p className="text-sm capitalize">{officeAddress?.officeLocation || ''}</p>
                    </div>
                </div>

                {/* Print Controls */}
                <div className="fixed bottom-6 right-6 no-print flex gap-2">
                    <Button onClick={() => printDocument('print-letter-content', 'Agency Registration Renewal Letter')} className="shadow-lg">
                        <Printer className="mr-2 h-4 w-4" /> Print Letter
                    </Button>
                    <Button variant="outline" onClick={() => router.back()} className="shadow-lg">
                        Back
                    </Button>
                </div>
            </div>
        </div>
    );
}
