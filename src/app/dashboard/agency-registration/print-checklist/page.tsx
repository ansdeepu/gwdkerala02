// src/app/dashboard/agency-registration/print-checklist/page.tsx
"use client";

import React, { useMemo, useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useDataStore } from '@/hooks/use-data-store';
import { format, isValid, parseISO } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Printer, ArrowLeft, Edit2, Check, Loader2, X, RotateCcw, Save, Settings2, CloudCheck, Copy, FileSpreadsheet, ClipboardCopy } from 'lucide-react';
import { cn, getDistrictMalayalam } from '@/lib/utils';
import { printDocument, copyRichHtml } from '@/lib/print-utils';
import { getFirestore, collectionGroup, query, getDocs, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { toast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { app } from '@/lib/firebase';
import type { AgencyApplication } from '@/hooks/useAgencyApplications';
import ExcelJS from 'exceljs';

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

const formatDateSafe = (dateVal: any, formatStr: string = 'dd/MM/yyyy'): string => {
    if (!dateVal) return '';
    if (typeof dateVal === 'string' && dateVal.includes('/') && dateVal.length <= 10) {
        return dateVal;
    }
    const d = toDateOrNull(dateVal);
    if (d && isValid(d)) return format(d, formatStr);
    if (typeof dateVal === 'string') return dateVal;
    return '';
};

const safeString = (val: any, fallback: string = ''): string => {
    if (val === null || val === undefined) return fallback;
    if (typeof val === 'string') return val;
    if (typeof val === 'number') return String(val);
    if (val instanceof Date) return formatDateSafe(val);
    if (typeof val === 'object' && typeof val.seconds === 'number') return formatDateSafe(val);
    return fallback;
};

function getRigMalayalam(typeOfRig?: string | null, typeOfRigMalayalam?: string | null): string {
    if (typeOfRigMalayalam && typeOfRigMalayalam.trim()) {
        return typeOfRigMalayalam.trim();
    }
    if (!typeOfRig) return 'കാലിക്സ് റിഗ്';
    const map: Record<string, string> = {
        "Hand Bore": "ഹാൻഡ് ബോർ",
        "Filter Point Rig": "ഫിൽട്ടർ പോയിന്റ് റിഗ്",
        "Calyx Rig": "കാലിക്സ് റിഗ്",
        "Rotary Rig": "റോട്ടറി റിഗ്",
        "DTH Rig": "ഡി.ടി.എച്ച് റിഗ്",
        "Rotary cum DTH Rig": "റോട്ടറി കം ഡി.ടി.എച്ച് റിഗ്"
    };
    return map[typeOfRig] || typeOfRig;
}

const extractTextFromNode = (node: any): string => {
    if (node === null || node === undefined) return '';
    if (typeof node === 'string') return node;
    if (typeof node === 'number') return String(node);
    if (typeof node === 'boolean') return '';
    if (Array.isArray(node)) {
        return node.map(extractTextFromNode).filter(Boolean).join('\n');
    }
    if (node.props) {
        const children = node.props.children;
        if (children !== undefined && children !== null) {
            if (Array.isArray(children)) {
                return children.map(extractTextFromNode).filter(Boolean).join('\n');
            }
            return extractTextFromNode(children);
        }
    }
    return '';
};

export default function RigChecklistPrintPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const id = searchParams.get('id');
    const rigId = searchParams.get('rigId');
    const type = searchParams.get('type') || 'registration'; // 'registration' or 'renewal'
    const renewalId = searchParams.get('renewalId');

    const { allAgencyApplications, officeAddress, isLoading } = useDataStore();

    const [fetchedApp, setFetchedApp] = useState<AgencyApplication | null>(null);
    const [isFetchingDoc, setIsFetchingDoc] = useState<boolean>(true);

    // Editable text states to allow users to customize fields for print in real-time
    const [inspectingOfficer, setInspectingOfficer] = useState('');
    const [inspectingOfficerDesig, setInspectingOfficerDesig] = useState('');
    const [customFileNo, setCustomFileNo] = useState('');
    const [customDate, setCustomDate] = useState(format(new Date(), 'dd/MM/yyyy'));

    // Row-level manual edit states
    const [rowOverrides, setRowOverrides] = useState<Record<string | number, string>>({});
    const [editingRowIndex, setEditingRowIndex] = useState<number | string | null>(null);
    const [tempRowValue, setTempRowValue] = useState<string>('');
    const [isSaving, setIsSaving] = useState(false);
    const [showSettings, setShowSettings] = useState(false);
    const [isCopying, setIsCopying] = useState(false);

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

    // Find the specific application and rig
    const data = useMemo(() => {
        const application = allAgencyApplications.find(a => a.id === id) || fetchedApp;
        if (!application) return null;

        let rig = (application.rigs || []).find(r => r.id === rigId || String(r.id) === String(rigId));
        if (!rig && rigId) {
            const index = Number(rigId);
            if (!isNaN(index) && application.rigs?.[index]) {
                rig = application.rigs[index];
            }
        }
        if (!rig) {
            rig = application.rigs?.[0] || null;
        }
        if (!rig) return null;

        return {
            application,
            rig,
            ownerName: application.owner?.name || '',
            agencyName: application.agencyName || '',
            fileNo: application.fileNo || 'N/A'
        };
    }, [allAgencyApplications, fetchedApp, id, rigId]);

    // Initial default inspector values and saved checklist overrides based on saved data
    React.useEffect(() => {
        if (data) {
            const selectedRenewal = renewalId 
                ? data.rig.renewals?.find(r => r.id === renewalId || String(r.id) === String(renewalId)) 
                : data.rig.renewals?.[data.rig.renewals.length - 1];
            
            const savedChecklist = type === 'renewal' 
                ? selectedRenewal?.checklistOverrides 
                : data.rig.checklistOverrides;

            const savedOfficer = type === 'renewal' 
                ? (selectedRenewal?.inspectingOfficerName || selectedRenewal?.inspectingOfficer)
                : (data.rig.inspectingOfficerName || data.rig.inspectingOfficer);
            const savedDesig = type === 'renewal' 
                ? selectedRenewal?.inspectingOfficerDesig 
                : data.rig.inspectingOfficerDesig;

            const officerVal = safeString(savedChecklist?.inspectingOfficer ?? savedOfficer ?? '');
            setInspectingOfficer(officerVal);
            setInspectingOfficerDesig(safeString(savedChecklist?.inspectingOfficerDesig ?? savedDesig ?? ''));
            setCustomFileNo(safeString(savedChecklist?.customFileNo ?? data.fileNo ?? ''));
            setCustomDate(
                savedChecklist?.customDate
                    ? formatDateSafe(savedChecklist.customDate)
                    : format(new Date(), 'dd/MM/yyyy')
            );
            setRowOverrides(savedChecklist?.rowOverrides ?? {});

            if (!officerVal) {
                setShowSettings(true);
            }
        }
    }, [data, type, renewalId]);

    // Auto print when 'print=true' query parameter is present (used for reliable printing out of iframe sandbox)
    useEffect(() => {
        if (!isLoading && !isFetchingDoc && data && searchParams.get('print') === 'true') {
            const timer = setTimeout(() => {
                printDocument(
                    'print-checklist-content',
                    type === 'renewal' ? 'Rig Renewal Checklist' : 'Rig Registration Checklist',
                    '1.2cm 1.5cm 1.2cm 1.5cm'
                );
            }, 1000);
            return () => clearTimeout(timer);
        }
    }, [isLoading, isFetchingDoc, data, searchParams, type]);

    // Save checklist overrides to Firestore Cloud Persistence
    const handleSaveChecklist = async (overridesToSave?: Record<number, string>) => {
        if (!data || !data.application || !data.rig) return;
        setIsSaving(true);
        
        try {
            const targetOverrides = overridesToSave !== undefined ? overridesToSave : rowOverrides;
            
            const checklistPayload = {
                inspectingOfficer,
                inspectingOfficerDesig,
                customFileNo,
                customDate,
                rowOverrides: targetOverrides,
                updatedAt: new Date().toISOString()
            };

            const db = getFirestore(app);
            const officeLoc = (data.application.officeLocation || 'kollam').toLowerCase();
            const docRef = doc(db, `offices/${officeLoc}/agencyApplications`, data.application.id);

            const currentRigs = data.application.rigs || [];
            
            const updatedRigs = currentRigs.map((r, rIdx) => {
                const isMatch = r.id === data.rig.id || String(r.id) === String(data.rig.id) || rIdx === Number(rigId);
                if (!isMatch) return r;

                if (type === 'renewal' && renewalId) {
                    const currentRenewals = r.renewals || [];
                    const updatedRenewals = currentRenewals.map(ren => {
                        if (ren.id === renewalId || String(ren.id) === String(renewalId)) {
                            return {
                                ...ren,
                                checklistOverrides: checklistPayload,
                                inspectingOfficerName: inspectingOfficer,
                                inspectingOfficerDesig: inspectingOfficerDesig
                            };
                        }
                        return ren;
                    });
                    return {
                        ...r,
                        renewals: updatedRenewals
                    };
                } else {
                    return {
                        ...r,
                        checklistOverrides: checklistPayload,
                        inspectingOfficerName: inspectingOfficer,
                        inspectingOfficerDesig: inspectingOfficerDesig
                    };
                }
            });

            // Sanitize payload for Firestore
            const sanitize = (obj: any): any => {
                if (obj === undefined) return null;
                if (Array.isArray(obj)) return obj.map(sanitize);
                if (obj && typeof obj === 'object' && !(obj instanceof Date)) {
                    const res: any = {};
                    for (const k in obj) {
                        if (Object.prototype.hasOwnProperty.call(obj, k)) {
                            res[k] = sanitize(obj[k]);
                        }
                    }
                    return res;
                }
                return obj;
            };

            await updateDoc(docRef, {
                rigs: sanitize(updatedRigs),
                updatedAt: serverTimestamp()
            });

            // Update local fetchedApp state so user sees immediate consistency
            setFetchedApp(prev => {
                if (!prev) return { ...data.application, rigs: updatedRigs };
                return { ...prev, rigs: updatedRigs };
            });

            toast({
                title: "സേവ് ചെയ്തു! (Saved!)",
                description: "ചെക്ക് ലിസ്റ്റിലെ വിവരങ്ങൾ ക്ലൗഡിൽ വിജയികരമായി സേവ് ചെയ്തു.",
            });
        } catch (err) {
            console.error("Error saving checklist overrides:", err);
            toast({
                title: "സേവിംഗ് പരാജയപ്പെട്ടു (Save Failed)",
                description: "വിവരങ്ങൾ സേവ് ചെയ്യാൻ സാധിച്ചില്ല. വീണ്ടും ശ്രമിക്കുക.",
                variant: "destructive"
            });
        } finally {
            setIsSaving(false);
        }
    };

    // Format inspecting officer for declaration statement
    const formattedOfficerDisplay = useMemo(() => {
        const officerName = (inspectingOfficer || data?.rig?.inspectingOfficerName || data?.rig?.inspectingOfficer || '').trim();
        const officerDesig = (inspectingOfficerDesig || data?.rig?.inspectingOfficerDesig || '').trim();

        if (!officerName) {
            return <span className="font-bold text-black">[പരിശോധന നടത്തിയ ഉദ്യോഗസ്ഥൻ / Officer Assigned]</span>;
        }

        let label = officerName;
        if (!officerName.includes('(') && officerDesig) {
            label = `${officerName} (${officerDesig})`;
        }

        return <span className="font-bold">{label}</span>;
    }, [inspectingOfficer, inspectingOfficerDesig, data]);

    if ((isLoading || isFetchingDoc) && !data) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] p-10 space-y-4">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                <p className="text-sm font-medium text-slate-600">വിവരങ്ങൾ ശേഖരിക്കുന്നു... (Loading application details...)</p>
            </div>
        );
    }

    if (!data) return (
        <div className="p-10 text-center space-y-4">
            <p className="text-muted-foreground">
                {id === 'new' 
                    ? "ദയവായി അപേക്ഷ സേവ് ചെയ്ത ശേഷം പ്രിന്റ് ചെയ്യുക."
                    : "താങ്കൾ തിരഞ്ഞെടുത്ത ഏജൻസിയോ റിഗ് വിവരങ്ങളോ കണ്ടെത്താൻ സാധിച്ചില്ല."
                }
            </p>
            <Button variant="outline" onClick={() => window.close()}>മടങ്ങുക</Button>
        </div>
    );

    const { application, rig } = data;
    const isRenewal = type === 'renewal';

    // Calculate dates
    const regDate = toDateOrNull(rig.registrationDate);
    const validityDate = regDate && isValid(regDate)
        ? new Date(regDate.getFullYear() + 1, regDate.getMonth(), regDate.getDate() - 1)
        : null;

    const selectedRenewal = rig.renewals && rig.renewals.length > 0
        ? (renewalId 
            ? rig.renewals.find(r => r.id === renewalId || String(r.id) === String(renewalId)) || [...rig.renewals].sort((a, b) => (toDateOrNull(b.renewalDate)?.getTime() ?? 0) - (toDateOrNull(a.renewalDate)?.getTime() ?? 0))[0]
            : [...rig.renewals].sort((a, b) => (toDateOrNull(b.renewalDate)?.getTime() ?? 0) - (toDateOrNull(a.renewalDate)?.getTime() ?? 0))[0])
        : null;

    const renewalValidityDate = selectedRenewal?.validTill
        ? toDateOrNull(selectedRenewal.validTill)
        : (selectedRenewal?.renewalDate && isValid(toDateOrNull(selectedRenewal.renewalDate))
            ? new Date(toDateOrNull(selectedRenewal.renewalDate)!.getFullYear() + 1, toDateOrNull(selectedRenewal.renewalDate)!.getMonth(), toDateOrNull(selectedRenewal.renewalDate)!.getDate() - 1)
            : null);

    const effectiveValidityDate = isRenewal ? (renewalValidityDate || validityDate) : validityDate;

    // Helper functions to populate values dynamically
    const getChassisNo = (v: any) => v?.chassisNo || "ബാധകമല്ല";
    const getEngineNo = (v: any) => v?.engineNo || "ബാധകമല്ല";
    const getRegNo = (v: any) => v?.regNo || "ബാധകമല്ല";
    const getVehicleType = (v: any) => v?.type || "ബാധകമല്ല";

    // Prepare checklist rows
    const checklistItems = [
        {
            num: "1",
            label: "അപേക്ഷകന്റെ പേര്, മേൽവിലാസം :",
            value: (
                <div>
                    {application.owner?.nameMalayalam && (
                        <p className="whitespace-pre-wrap font-medium">{application.owner.nameMalayalam}</p>
                    )}
                    <p className={`whitespace-pre-wrap ${application.owner?.nameMalayalam ? 'text-sm text-black font-normal' : 'font-medium'}`}>
                        {application.owner?.name || (!application.owner?.nameMalayalam ? "രേഖപ്പെടുത്തിയിട്ടില്ല" : "")}
                    </p>
                </div>
            )
        },
        {
            num: "",
            label: "സ്ഥാപനത്തിന്റെ പേര്, മേൽവിലാസം :",
            value: (
                <div>
                    {application.agencyNameMalayalam && (
                        <p className="whitespace-pre-wrap font-medium">{application.agencyNameMalayalam}</p>
                    )}
                    <p className={`whitespace-pre-wrap ${application.agencyNameMalayalam ? 'text-sm text-black font-normal' : 'font-medium'}`}>
                        {application.agencyName || (!application.agencyNameMalayalam ? "രേഖപ്പെടുത്തിയിട്ടില്ല" : "")}
                    </p>
                </div>
            )
        },
        {
            num: "",
            label: "ഏജൻസി രജിസ്ട്രേഷൻ നമ്പർ :",
            value: (
                <p className="font-medium">
                    {application.agencyRegistrationNo 
                        ? `${application.agencyRegistrationNo} dtd. ${formatDateSafe(application.agencyRegistrationDate)}`
                        : "ബാധകമല്ല"
                    }
                </p>
            )
        },
        ...(isRenewal && rig.rigRegistrationNo ? [{
            num: "",
            label: "നിലവിലെ റിഗ് രജിസ്ട്രേഷൻ നമ്പർ :",
            value: <p className="font-mono font-medium">{rig.rigRegistrationNo}</p>
        }] : []),
        {
            num: "",
            label: "രജിസ്റ്റർ ചെയ്യേണ്ട റിഗിന്റെ തരം :",
            value: (
                <div>
                    {getRigMalayalam(rig.typeOfRig, rig.typeOfRigMalayalam) && (
                        <p className="whitespace-pre-wrap font-medium">{getRigMalayalam(rig.typeOfRig, rig.typeOfRigMalayalam)}</p>
                    )}
                    {rig.typeOfRig && rig.typeOfRig !== getRigMalayalam(rig.typeOfRig, rig.typeOfRigMalayalam) && (
                        <p className="text-sm text-black font-normal whitespace-pre-wrap">{rig.typeOfRig}</p>
                    )}
                    {!rig.typeOfRig && !rig.typeOfRigMalayalam && (
                        <p className="font-medium">രേഖപ്പെടുത്തിയിട്ടില്ല</p>
                    )}
                </div>
            )
        },
        {
            num: "",
            label: "കംപ്രസ്സർ / ജനറേറ്ററിന്റെ വിവരം :",
            value: (
                <p className="whitespace-pre-wrap font-medium">
                    {[
                        rig.compressorDetails?.model ? `Compressor Model: ${rig.compressorDetails.model}` : '',
                        rig.compressorDetails?.capacity ? `Capacity: ${rig.compressorDetails.capacity}` : '',
                        rig.generatorDetails?.model ? `Generator Model: ${rig.generatorDetails.model}` : '',
                        rig.generatorDetails?.capacity ? `Capacity: ${rig.generatorDetails.capacity}` : '',
                        rig.generatorDetails?.engineNo ? `Engine No: ${rig.generatorDetails.engineNo}` : ''
                    ].filter(Boolean).join(',\n') || "ബാധകമല്ല"}
                </p>
            )
        },
        ...(isRenewal && effectiveValidityDate ? [{
            num: "",
            label: "രജിസ്ട്രേഷൻ അവസാനിക്കുന്ന തീയതി :",
            value: <p className="font-medium text-red-600">{format(effectiveValidityDate, 'dd/MM/yyyy')}</p>
        }] : []),
        {
            num: "2",
            label: "ഫോൺ നമ്പർ",
            value: [application.owner?.mobile, application.owner?.secondaryMobile].filter(Boolean).join(', ') || "രേഖപ്പെടുത്തിയിട്ടില്ല"
        },
        {
            num: "3",
            label: "ഇ മെയിൽ വിലാസം",
            value: application.owner?.email || application.owner?.emailId || application.email || (application as any).emailId || (application as any).email || "രേഖപ്പെടുത്തിയിട്ടില്ല"
        },
        {
            num: "4",
            label: (
                <div className="space-y-1">
                    <p className="font-semibold">രജിസ്ട്രേഷൻ നമ്പർ :</p>
                    <p className="pl-3">a. റിഗ് (ട്രക്ക്)</p>
                    <p className="pl-3">b. സപ്പോർട്ടിങ് വാഹനം</p>
                </div>
            ),
            value: (
                <div className="space-y-1">
                    <p className="h-4"></p>
                    <p>{getRegNo(rig.rigVehicle)}</p>
                    <p>{getRegNo(rig.supportingVehicle)}</p>
                </div>
            )
        },
        {
            num: "5",
            label: (
                <div className="space-y-1">
                    <p className="font-semibold">വാഹനത്തിന്റെ തരം & മോഡൽ :</p>
                    <p className="pl-3">a. റിഗ് (ട്രക്ക്)</p>
                    <p className="pl-3">b. സപ്പോർട്ടിങ് വാഹനം</p>
                </div>
            ),
            value: (
                <div className="space-y-1">
                    <p className="h-4"></p>
                    <p>{getVehicleType(rig.rigVehicle)}</p>
                    <p>{getVehicleType(rig.supportingVehicle)}</p>
                </div>
            )
        },
        {
            num: "6",
            label: (
                <div className="space-y-1">
                    <p className="font-semibold">Chassis നമ്പർ :</p>
                    <p className="pl-3">a. റിഗ് (ട്രക്ക്)</p>
                    <p className="pl-3">b. സപ്പോർട്ടിങ് വാഹനം</p>
                </div>
            ),
            value: (
                <div className="space-y-1 font-mono text-xs">
                    <p className="h-4 font-sans"></p>
                    <p>{getChassisNo(rig.rigVehicle)}</p>
                    <p>{getChassisNo(rig.supportingVehicle)}</p>
                </div>
            )
        },
        {
            num: "7",
            label: (
                <div className="space-y-1">
                    <p className="font-semibold">എഞ്ചിൻ നമ്പർ :</p>
                    <p className="pl-3">a. റിഗ് (ട്രക്ക്)</p>
                    <p className="pl-3">b. സപ്പോർട്ടിങ് വാഹനം</p>
                </div>
            ),
            value: (
                <div className="space-y-1 font-mono text-xs">
                    <p className="h-4 font-sans"></p>
                    <p>{getEngineNo(rig.rigVehicle)}</p>
                    <p>{getEngineNo(rig.supportingVehicle)}</p>
                </div>
            )
        },
        {
            num: "8",
            label: "അപേക്ഷ ഫോം പൂർണ്ണമായും പൂരിപ്പിച്ചിട്ടുണ്ടോ",
            value: "ഉണ്ട്"
        },
        {
            num: "9",
            label: "അംഗീകൃത കുഴൽ കിണർ നിർമ്മാണ ഏജൻസിയോടൊപ്പമുള്ള 3 വർഷത്തെ പ്രവർത്തി പരിചയം (പുതിയ ഏജൻസി അപേക്ഷകർക്ക് മാത്രം)",
            value: "ബാധകമല്ല"
        },
        {
            num: "10",
            label: "അപേക്ഷകൻ കേരളത്തിൽ സ്ഥിരതാമസക്കാരനാണോ",
            value: "അതെ"
        },
        {
            num: "11",
            label: "തിരിച്ചറിയൽ രേഖ ഹാജരാക്കിയിട്ടുണ്ടോ",
            value: "ഉണ്ട്"
        },
        {
            num: "12",
            label: "തിരിച്ചറിയൽ രേഖ",
            value: "ആധാർ കാർഡ്"
        },
        {
            num: "13",
            label: "GST രജിസ്ട്രേഷൻ സാക്ഷ്യപത്രം",
            value: "ഉണ്ട്"
        },
        {
            num: "14",
            label: "PAN കാർഡിന്റെ പകർപ്പ്",
            value: "ഉണ്ട്"
        },
        {
            num: "15",
            label: "പഞ്ചായത്ത് ലൈസൻസ്",
            value: "ഉണ്ട്"
        },
        {
            num: "16",
            label: "രജിസ്ട്രേഷനായി അപേക്ഷിച്ചിട്ടുള്ള റിഗുകളുടെ എണ്ണം",
            value: isRenewal ? "ബാധകമല്ല" : `${(application.rigs || []).length}`
        },
        {
            num: "17",
            label: "റിഗ് ഓപ്പറേറ്ററുടെ 03 വർഷത്തെ പ്രവർത്തി പരിചയ സാക്ഷ്യപത്രം",
            value: "ഉണ്ട്"
        },
        {
            num: "18",
            label: "റിഗ് ഓപ്പറേറ്ററുടെ പ്രായം തെളിയിക്കുന്നതിനുള്ള രേഖ",
            value: "ഉണ്ട്"
        },
        {
            num: "19",
            label: "റിഗ് ഓപ്പറേറ്ററുടെ തിരിച്ചറിയൽ രേഖ",
            value: "ആധാർ കാർഡ്"
        },
        {
            num: "20",
            label: (
                <div className="space-y-1">
                    <p className="font-semibold">RC :</p>
                    <p className="pl-3">a. റിഗ് (ട്രക്ക്)</p>
                    <p className="pl-3">b. സപ്പോർട്ടിങ് വാഹനം</p>
                </div>
            ),
            value: (
                <div className="space-y-1">
                    <p className="h-4"></p>
                    <p>{rig.rigVehicle ? "ഉണ്ട്" : "ബാധകമല്ല"}</p>
                    <p>{rig.supportingVehicle ? "ഉണ്ട്" : "ബാധകമല്ല"}</p>
                </div>
            )
        },
        {
            num: "21",
            label: (
                <div className="space-y-1">
                    <p className="font-semibold">ഇൻഷുറൻസ് സാക്ഷ്യപത്രം :</p>
                    <p className="pl-3">a. റിഗ് (ട്രക്ക്)</p>
                    <p className="pl-3">b. സപ്പോർട്ടിങ് വാഹനം</p>
                </div>
            ),
            value: (
                <div className="space-y-1">
                    <p className="h-4"></p>
                    <p>{rig.rigVehicle ? "ഉണ്ട്" : "ബാധകമല്ല"}</p>
                    <p>{rig.supportingVehicle ? "ഉണ്ട്" : "ബാധകമല്ല"}</p>
                </div>
            )
        },
        {
            num: "22",
            label: (
                <div className="space-y-1">
                    <p className="font-semibold">റോഡ് നികുതി രസീത് :</p>
                    <p className="pl-3">a. റിഗ് (ട്രക്ക്)</p>
                    <p className="pl-3">b. സപ്പോർട്ടിങ് വാഹനം</p>
                </div>
            ),
            value: (
                <div className="space-y-1">
                    <p className="h-4"></p>
                    <p>{rig.rigVehicle ? "ഉണ്ട്" : "ബാധകമല്ല"}</p>
                    <p>{rig.supportingVehicle ? "ഉണ്ട്" : "ബാധകമല്ല"}</p>
                </div>
            )
        },
        {
            num: "23",
            label: (
                <div className="space-y-1">
                    <p className="font-semibold">കേരളത്തിന് പുറത്ത് രജിസ്റ്റർ ചെയ്ത വാഹനമാണോ :</p>
                    <p className="pl-3">a. ട്രാൻസ്പോർട്ട്</p>
                    <p className="pl-3">b. നോൺ ട്രാൻസ്പോർട്ട്</p>
                </div>
            ),
            value: (
                <div className="space-y-1">
                    <p className="h-4"></p>
                    <p>അല്ല</p>
                    <p>അതെ {rig.rigVehicle ? "(റിഗ് (ട്രക്ക്))" : ""}</p>
                </div>
            )
        },
        {
            num: "24",
            label: (
                <div className="space-y-1">
                    <p className="font-semibold">ട്രാൻസ്പോർട്ട് ആണെങ്കിൽ കേരള റോഡ് പെർമിറ്റ് പകർപ്പ് :</p>
                    <p className="pl-3">a. റിഗ് (ട്രക്ക്)</p>
                    <p className="pl-3">b. സപ്പോർട്ടിങ് വാഹനം</p>
                </div>
            ),
            value: (
                <div className="space-y-1">
                    <p className="h-4"></p>
                    <p>ബാധകമല്ല</p>
                    <p>ബാധകമല്ല</p>
                </div>
            )
        },
        {
            num: "25",
            label: (
                <div className="space-y-1">
                    <p className="font-semibold">നോൺ ട്രാൻസ്പോർട്ട് ആണെങ്കിൽ കേരള റോഡ് നികുതി പകർപ്പ് :</p>
                    <p className="pl-3">a. റിഗ് (ട്രക്ക്)</p>
                    <p className="pl-3">b. സപ്പോർട്ടിങ് വാഹനം</p>
                </div>
            ),
            value: (
                <div className="space-y-1">
                    <p className="h-4"></p>
                    <p>{rig.rigVehicle ? "ഉണ്ട്" : "ബാധകമല്ല"}</p>
                    <p>ബാധകമല്ല</p>
                </div>
            )
        },
        {
            num: "26",
            label: (
                <div className="space-y-1">
                    <p className="font-semibold">റിഗ് & സപ്പോർട്ടിങ് വാഹനം വാടകയ്ക്ക് എടുത്തിട്ടുള്ളതാണോ :</p>
                    <p className="pl-3">a. റിഗ് (ട്രക്ക്)</p>
                    <p className="pl-3">b. സപ്പോർട്ടിങ് വാഹനം</p>
                    <p className="pl-3">c. ഉടമസ്ഥനുമായി ഉണ്ടാക്കിയ കരാറിന്റെ പകർപ്പ്</p>
                </div>
            ),
            value: (
                <div className="space-y-1">
                    <p className="h-4"></p>
                    <p>അല്ല</p>
                    <p>അല്ല</p>
                    <p>ബാധകമല്ല</p>
                </div>
            )
        },
        {
            num: "27",
            label: "ബഹു. സുപ്രീം കോടതി 2009 ലെ WP(C) No.36 കേസിൽ 11.02.2010-ൽ ഉണ്ടായിട്ടുള്ള ഉത്തരവും കാലാകാലങ്ങളിൽ സർക്കാരും ഭൂജല അതോറിറ്റിയും പുറപ്പെടുവിക്കുന്ന ഉത്തരവുകളും പരിപത്രങ്ങളും പാലിച്ചുകൊള്ളാമെന്നുള്ള 200 രൂപയുടെ കേരള മുദ്രപത്രത്തിലുള്ള സത്യവാങ്മൂലം",
            value: "ഉണ്ട്"
        },
        {
            num: "28",
            label: "റിഗിൽ GPS ഘടിപ്പിച്ചിട്ടുണ്ടോ",
            value: "ബാധകമല്ല"
        },
        {
            num: "29",
            label: "റിഗ് പരിശോധിച്ച തീയതി",
            value: isRenewal && selectedRenewal ? formatDateSafe(selectedRenewal.renewalDate) : formatDateSafe(rig.registrationDate)
        },
        {
            num: "30",
            label: (
                <div className="space-y-1">
                    <p className="font-semibold h-6 leading-6">ഫീസ് തുക, ഒടുക്കിയ തീയതി (ചലാൻ പകർപ്പ്) :</p>
                    {!isRenewal ? (
                        <div className="space-y-1">
                            <p className="pl-3 text-xs">a. അപേക്ഷ ഫീസ് - ഏജൻസി രജിസ്ട്രേഷൻ</p>
                            <p className="pl-3 text-xs">b. അപേക്ഷ ഫീസ് - റിഗ് രജിസ്ട്രേഷൻ</p>
                            <p className="pl-3 text-xs">c. ഏജൻസി രജിസ്ട്രേഷൻ</p>
                            <p className="pl-3 text-xs">d. റിഗ് രജിസ്ട്രേഷൻ</p>
                        </div>
                    ) : (
                        <div className="space-y-1">
                            <p className="pl-3 text-xs">a. അപേക്ഷ ഫീസ്</p>
                            <p className="pl-3 text-xs">b. രജിസ്ട്രേഷൻ പുതുക്കൽ</p>
                        </div>
                    )}
                </div>
            ),
            value: (
                <div className="space-y-1 text-xs">
                    <p className="font-semibold h-6 leading-6 opacity-0">ഫീസ് തുക, ഒടുക്കിയ തീയതി (ചലാൻ പകർപ്പ്) :</p>
                    {!isRenewal ? (
                        (() => {
                            const agencyTotalRegFee = (application.agencyRegistrationFee || 0) + (application.agencyAdditionalRegFee || 0);
                            const agencyRegFee = (application.applicationFees || []).find(f => f.applicationFeeType === "Agency Registration");
                            const agencyRegFeeText = agencyRegFee 
                                ? `Rs. ${agencyRegFee.applicationFeeAmount || 0}/- dtd. ${formatDateSafe(agencyRegFee.applicationFeePaymentDate)}, Challan No. ${agencyRegFee.applicationFeeChallanNo || ''}`
                                : (application.agencyRegistrationFee 
                                    ? `Rs. ${application.agencyRegistrationFee}/- dtd. ${formatDateSafe(application.agencyPaymentDate)}, Challan No. ${application.agencyChallanNo || ''}`
                                    : '-');

                            const activeRigsList = (application.rigs || []).filter(r => r.status !== 'Cancelled');
                            const currentRigActiveIndex = activeRigsList.findIndex(r => r.id === rig.id);
                            const currentRigLabel = currentRigActiveIndex !== -1 ? `Rig #${currentRigActiveIndex + 1}` : '';

                            const rigRegFee = (application.applicationFees || []).find(
                                f => f.applicationFeeType === "Rig Registration" && f.rigNumber === currentRigLabel
                            ) || (application.applicationFees || []).find(
                                f => f.applicationFeeType === "Rig Registration" && (!f.rigNumber || f.rigNumber === 'none')
                            );
                            const rigRegFeeText = rigRegFee
                                ? `Rs. ${rigRegFee.applicationFeeAmount || 0}/- dtd. ${formatDateSafe(rigRegFee.applicationFeePaymentDate)}, Challan: ${rigRegFee.applicationFeeChallanNo || ''}`
                                : (rig.registrationFee 
                                    ? `Rs. ${rig.registrationFee}/- dtd. ${formatDateSafe(rig.paymentDate)}, Challan: ${rig.challanNo || ''}`
                                    : '-');

                            let agencyRegValueText = '-';
                            if (application.agencyRegistrationFee || application.agencyAdditionalRegFee) {
                                const primaryPart = application.agencyRegistrationFee 
                                    ? `Challan No. ${application.agencyChallanNo || ''} dtd. ${formatDateSafe(application.agencyPaymentDate)} (Rs. ${application.agencyRegistrationFee}/-)`
                                    : '';
                                    
                                const additionalPart = application.agencyAdditionalRegFee 
                                    ? `Additional Challan No. ${application.agencyAdditionalChallanNo || ''} dtd. ${formatDateSafe(application.agencyAdditionalPaymentDate)} (Rs. ${application.agencyAdditionalRegFee}/-)`
                                    : '';
                                    
                                agencyRegValueText = `Rs. ${agencyTotalRegFee}/- [${[primaryPart, additionalPart].filter(Boolean).join(', ')}]`;
                            }

                            const rigTotalRegFee = (rig.registrationFee || 0) + (rig.additionalRegistrationFee || 0);
                            let rigRegValueText = '-';
                            if (rig.registrationFee || rig.additionalRegistrationFee) {
                                const primaryPart = rig.registrationFee
                                    ? `Challan: ${rig.challanNo || ''} dtd. ${formatDateSafe(rig.paymentDate)} (Rs. ${rig.registrationFee}/-)`
                                    : '';
                                    
                                const additionalPart = rig.additionalRegistrationFee
                                    ? `Additional Challan: ${rig.additionalChallanNo || ''} dtd. ${formatDateSafe(rig.additionalPaymentDate)} (Rs. ${rig.additionalRegistrationFee}/-)`
                                    : '';
                                    
                                rigRegValueText = `Rs. ${rigTotalRegFee}/- [${[primaryPart, additionalPart].filter(Boolean).join(', ')}]`;
                            }

                            return (
                                <div className="space-y-1">
                                    <p className="pl-1">{agencyRegFeeText}</p>
                                    <p className="pl-1">{rigRegFeeText}</p>
                                    <p className="pl-1">{agencyRegValueText}</p>
                                    <p className="pl-1 font-semibold text-green-700">{rigRegValueText}</p>
                                </div>
                            );
                        })()
                    ) : (
                        <div className="space-y-1">
                            <p className="pl-1">ബാധകമല്ല</p>
                            <p className="pl-1 font-semibold text-green-700">
                                {(selectedRenewal?.totalRenewalFee ?? selectedRenewal?.renewalFee) 
                                    ? `Rs. ${(selectedRenewal?.totalRenewalFee ?? selectedRenewal?.renewalFee)}/- dtd. ${formatDateSafe(selectedRenewal?.paymentDate)}, e-Chalan: ${selectedRenewal?.challanNo || ''}${selectedRenewal?.challanAmount ? `, Rs. ${selectedRenewal.challanAmount}/-` : ''}`
                                    : '-'
                                }
                            </p>
                        </div>
                    )}
                </div>
            )
        }
    ];

    const getSubRowsData = () => {
        return !isRenewal ? [
            { 
                key: "30_a", 
                label: "a. അപേക്ഷ ഫീസ് - ഏജൻസി രജിസ്ട്രേഷൻ", 
                defaultValue: (() => {
                    const agencyRegFee = (application.applicationFees || []).find(f => f.applicationFeeType === "Agency Registration");
                    if (agencyRegFee) {
                        return `Rs. ${agencyRegFee.applicationFeeAmount || 0}/- dtd. ${formatDateSafe(agencyRegFee.applicationFeePaymentDate)}, Challan No. ${agencyRegFee.applicationFeeChallanNo || ''}`;
                    }
                    return application.agencyRegistrationFee 
                        ? `Rs. ${application.agencyRegistrationFee}/- dtd. ${formatDateSafe(application.agencyPaymentDate)}, Challan No. ${application.agencyChallanNo || ''}`
                        : '-';
                })()
            },
            { 
                key: "30_b", 
                label: "b. അപേക്ഷ ഫീസ് - റിഗ് രജിസ്ട്രേഷൻ", 
                defaultValue: (() => {
                    const activeRigsList = (application.rigs || []).filter(r => r.status !== 'Cancelled');
                    const currentRigActiveIndex = activeRigsList.findIndex(r => r.id === rig.id);
                    const currentRigLabel = currentRigActiveIndex !== -1 ? `Rig #${currentRigActiveIndex + 1}` : '';

                    const rigRegFee = (application.applicationFees || []).find(
                        f => f.applicationFeeType === "Rig Registration" && f.rigNumber === currentRigLabel
                    ) || (application.applicationFees || []).find(
                        f => f.applicationFeeType === "Rig Registration" && (!f.rigNumber || f.rigNumber === 'none')
                    );
                    
                    if (rigRegFee) {
                        return `Rs. ${rigRegFee.applicationFeeAmount || 0}/- dtd. ${formatDateSafe(rigRegFee.applicationFeePaymentDate)}, Challan: ${rigRegFee.applicationFeeChallanNo || ''}`;
                    }
                    
                    return rig.registrationFee 
                        ? `Rs. ${rig.registrationFee}/- dtd. ${formatDateSafe(rig.paymentDate)}, Challan: ${rig.challanNo || ''}${rig.challanAmount ? `, Rs. ${rig.challanAmount}/-` : ''}`
                        : '-';
                })()
            },
            { 
                key: "30_c", 
                label: "c. ഏജൻസി രജിസ്ട്രേഷൻ", 
                defaultValue: (() => {
                    const total = (application.agencyRegistrationFee || 0) + (application.agencyAdditionalRegFee || 0);
                    if (!total) return '-';
                    const primaryPart = application.agencyRegistrationFee 
                        ? `Challan No. ${application.agencyChallanNo || ''} dtd. ${formatDateSafe(application.agencyPaymentDate)} (Rs. ${application.agencyRegistrationFee}/-)`
                        : '';
                    const additionalPart = application.agencyAdditionalRegFee 
                        ? `Additional Challan No. ${application.agencyAdditionalChallanNo || ''} dtd. ${formatDateSafe(application.agencyAdditionalPaymentDate)} (Rs. ${application.agencyAdditionalRegFee}/-)`
                        : '';
                    return `Rs. ${total}/- [${[primaryPart, additionalPart].filter(Boolean).join(', ')}]`;
                })()
            },
            { 
                key: "30_d", 
                label: "d. റിഗ് രജിസ്ട്രേഷൻ", 
                defaultValue: (() => {
                    const total = (rig.registrationFee || 0) + (rig.additionalRegistrationFee || 0);
                    if (!total) return '-';
                    const primaryPart = rig.registrationFee 
                        ? `Challan No. ${rig.challanNo || ''} dtd. ${formatDateSafe(rig.paymentDate)} (Rs. ${rig.registrationFee}/-)`
                        : '';
                    const additionalPart = rig.additionalRegistrationFee 
                        ? `Additional Challan No. ${rig.additionalChallanNo || ''} dtd. ${formatDateSafe(rig.additionalPaymentDate)} (Rs. ${rig.additionalRegistrationFee}/-)`
                        : '';
                    return `Rs. ${total}/- [${[primaryPart, additionalPart].filter(Boolean).join(', ')}]`;
                })()
            }
        ] : [
            { key: "30_a", label: "a. അപേക്ഷ ഫീസ്", defaultValue: "ബാധകമല്ല" },
            { key: "30_b", label: "b. രജിസ്ട്രേഷൻ പുതുക്കൽ", defaultValue: (selectedRenewal?.totalRenewalFee ?? selectedRenewal?.renewalFee) ? `Rs. ${(selectedRenewal?.totalRenewalFee ?? selectedRenewal?.renewalFee)}/- dtd. ${formatDateSafe(selectedRenewal?.paymentDate)}, e-Chalan: ${selectedRenewal?.challanNo || ''}${selectedRenewal?.challanAmount ? `, Rs. ${selectedRenewal.challanAmount}/-` : ''}` : '-' }
        ];
    };

    const handleCopyRichHtml = async () => {
        setIsCopying(true);
        try {
            const success = await copyRichHtml('print-checklist-content');
            if (success) {
                toast({
                    title: "Copied successfully",
                    description: "Checklist copied to clipboard as Rich HTML.",
                });
            } else {
                toast({
                    variant: "destructive",
                    title: "Copy failed",
                    description: "Could not copy checklist HTML to clipboard.",
                });
            }
        } catch (err) {
            console.error(err);
            toast({
                variant: "destructive",
                title: "Copy failed",
                description: "An unexpected error occurred while copying.",
            });
        } finally {
            setIsCopying(false);
        }
    };

    const handleCopyText = async () => {
        const title = isRenewal 
            ? "കുഴൽ കിണർ നിർമ്മാണ റിഗ് രജിസ്ട്രേഷൻ പുതുക്കൽ ചെക്ക് ലിസ്റ്റ്"
            : "കുഴൽ കിണർ നിർമ്മാണ റിഗ് രജിസ്ട്രേഷൻ ചെക്ക് ലിസ്റ്റ്";
        const officeName = (officeAddress?.officeNameMalayalam && officeAddress.officeNameMalayalam !== 'ഭൂജലവകുപ്പ്')
            ? (officeAddress.officeNameMalayalam.startsWith('ജില്ലാ ഓഫീസ്')
                ? officeAddress.officeNameMalayalam
                : `ജില്ലാ ഓഫീസ്: ${officeAddress.officeNameMalayalam.replace(/^ജില്ലാ ഓഫീസ്\s*[:,-]?\s*/, '')}`)
            : `ജില്ലാ ഓഫീസ്: ${getDistrictMalayalam(officeAddress?.officeLocation)}`;
        
        const fileNoStr = safeString(customFileNo || application.fileNo || 'GWDKLM/363/2026-MD2');
        const dateStr = safeString(customDate, format(new Date(), 'dd/MM/yyyy'));
        const subTitle = isRenewal 
            ? `രജിസ്ട്രേഷൻ പുതുക്കൽ - ${getRigMalayalam(rig.typeOfRig, rig.typeOfRigMalayalam)}`
            : `പുതിയ റിഗ് രജിസ്ട്രേഷൻ - ${getRigMalayalam(rig.typeOfRig, rig.typeOfRigMalayalam)}`;

        const exportRows: { slNo: string; label: string; value: string }[] = [];

        checklistItems.forEach((item, idx) => {
            if (item.num === "30") {
                exportRows.push({
                    slNo: "30",
                    label: "ഫീസ് തുക, ഒടുക്കിയ തീയതി (ചലാൻ പകർപ്പ്) :",
                    value: ""
                });
                const subRows = getSubRowsData();
                subRows.forEach(sub => {
                    const hasSubOverride = (rowOverrides as any)[sub.key] !== undefined;
                    const subVal = hasSubOverride ? (rowOverrides as any)[sub.key] : sub.defaultValue;
                    exportRows.push({
                        slNo: "",
                        label: sub.label,
                        value: extractTextFromNode(subVal).trim()
                    });
                });
            } else {
                const currentVal = rowOverrides[idx] !== undefined 
                    ? rowOverrides[idx] 
                    : ((rowOverrides as any)[String(idx)] !== undefined ? (rowOverrides as any)[String(idx)] : item.value);
                exportRows.push({
                    slNo: item.num || "",
                    label: extractTextFromNode(item.label).trim(),
                    value: extractTextFromNode(currentVal).trim()
                });
            }
        });

        // Rich HTML table representation with inline CSS for Word/Docs/Excel clipboard pasting
        const htmlTableRows = exportRows.map(row => {
            if (row.slNo === "30" && !row.value) {
                return `<tr>
                    <td style="border: 1px solid #000000; padding: 6px 8px; text-align: center; font-weight: bold; vertical-align: top; width: 8%;">30</td>
                    <td colspan="2" style="border: 1px solid #000000; padding: 6px 8px; font-weight: bold; vertical-align: top;">${row.label}</td>
                </tr>`;
            }
            return `<tr>
                <td style="border: 1px solid #000000; padding: 6px 8px; text-align: center; font-weight: bold; vertical-align: top; width: 8%;">${row.slNo}</td>
                <td style="border: 1px solid #000000; padding: 6px 8px; font-weight: 600; vertical-align: top; width: 42%;">${row.label}</td>
                <td style="border: 1px solid #000000; padding: 6px 8px; white-space: pre-wrap; vertical-align: top; width: 50%;">${row.value}</td>
            </tr>`;
        }).join("");

        const htmlContent = `
            <div style="font-family: Arial, Helvetica, sans-serif; color: #000000; max-width: 800px; margin: 0 auto; padding: 10px; line-height: 1.5;">
                <div style="text-align: center; border-bottom: 2px solid #000000; padding-bottom: 10px; margin-bottom: 15px;">
                    <h1 style="font-size: 20px; font-weight: bold; margin: 0 0 4px 0;">ഭൂജലവകുപ്പ്</h1>
                    <p style="font-size: 14px; font-weight: bold; margin: 0 0 6px 0;">${officeName}</p>
                    <h2 style="font-size: 16px; font-weight: bold; text-decoration: underline; margin: 8px 0 0 0;">${title}</h2>
                </div>
                <table style="width: 100%; margin-bottom: 12px; font-size: 13px; font-weight: bold; border: none;">
                    <tr>
                        <td style="text-align: left;">ഫയൽ നമ്പർ: <span style="font-family: monospace;">${fileNoStr}</span></td>
                        <td style="text-align: right;">തീയതി : <span style="font-family: monospace;">${dateStr}</span></td>
                    </tr>
                </table>
                <div style="text-align: center; font-weight: bold; font-size: 14px; margin-bottom: 15px; background-color: #f1f5f9; padding: 8px; border-radius: 4px; text-decoration: underline;">
                    ${subTitle}
                </div>
                <table style="width: 100%; border-collapse: collapse; border: 1px solid #000000; font-size: 12px; margin-bottom: 20px;">
                    <thead>
                        <tr style="background-color: #f8fafc;">
                            <th style="border: 1px solid #000000; padding: 8px; width: 8%; text-align: center; font-weight: bold;">ക്രമ നമ്പർ</th>
                            <th style="border: 1px solid #000000; padding: 8px; width: 42%; text-align: left; font-weight: bold;">വിവരണം</th>
                            <th style="border: 1px solid #000000; padding: 8px; width: 50%; text-align: left; font-weight: bold;">വിവരങ്ങൾ</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${htmlTableRows}
                    </tbody>
                </table>
                <div style="border: 1px solid #94a3b8; padding: 12px; font-size: 12px; margin-top: 15px; border-radius: 4px;">
                    <h3 style="font-size: 13px; font-weight: bold; margin: 0 0 6px 0;">സത്യപ്രസ്താവന (Declaration)</h3>
                    <p style="margin: 0; text-align: justify; text-indent: 20px; line-height: 1.6;">
                        ഈ ഓഫീസിലെ <b>${formattedOfficerDisplay}</b>, ജില്ലാ ഓഫീസ്, <b>${getDistrictMalayalam(officeAddress?.officeLocation)}</b>, മേൽ റിഗ് പരിശോധിക്കുകയും മുകളിൽ രേഖപ്പെടുത്തിയിട്ടുള്ള എല്ലാ വിവരങ്ങളും നേരിട്ടും ഒറിജിനൽ രേഖകളുമായും ഒത്തു നോക്കുകയും, ബോധ്യപ്പെടുകയും ചെയ്തിട്ടുണ്ട്. ആയതിനാൽ <b>${safeString(application.owner?.nameMalayalam || application.owner?.name)}</b> എന്നവരുടെ <b>${safeString(application.agencyNameMalayalam || application.agencyName)}</b> എന്ന ഏജൻസിയുടെ <b>${getRigMalayalam(rig.typeOfRig, rig.typeOfRigMalayalam)}</b> ${rig.rigVehicle?.regNo && rig.rigVehicle.regNo !== 'ബാധകമല്ല' ? `(രജി. നമ്പർ: ${rig.rigVehicle.regNo})` : ''} ന് ${isRenewal ? 'പുതുക്കിയ' : ''} രജിസ്ട്രേഷൻ സർട്ടിഫിക്കറ്റ് നൽകുന്നതിനായി ശുപാർശ ചെയ്യുന്നു.
                    </p>
                </div>
                <table style="width: 100%; margin-top: 40px; font-size: 12px; font-weight: bold; text-align: center; border: none;">
                    <tr>
                        <td style="width: 50%; padding-bottom: 35px;">പരിശോധന നടത്തിയ ഉദ്യോഗസ്ഥൻ</td>
                        <td style="width: 50%; padding-bottom: 35px;">അസി. എഞ്ചിനീയർ</td>
                    </tr>
                    <tr>
                        <td style="width: 50%;">അസി. എക്സി. എഞ്ചിനീയർ</td>
                        <td style="width: 50%;">ജില്ലാ ഓഫീസർ</td>
                    </tr>
                </table>
            </div>
        `;

        // Plain text fallback
        let plainText = `ഭൂജലവകുപ്പ്\n${officeName}\n${title}\n\n`;
        plainText += `ഫയൽ നമ്പർ: ${fileNoStr}\tതീയതി : ${dateStr}\n`;
        plainText += `${subTitle}\n\n`;
        exportRows.forEach(row => {
            const sl = row.slNo ? `[${row.slNo}] ` : "    - ";
            plainText += `${sl}${row.label}\n    👉 ${row.value.split('\n').join('\n       ')}\n\n`;
        });

        // 1. First, attempt copy using document.execCommand('copy') with intercept listener (highly iframe-compatible)
        try {
            const listener = (e: ClipboardEvent) => {
                e.clipboardData?.setData('text/html', htmlContent);
                e.clipboardData?.setData('text/plain', plainText);
                e.preventDefault();
            };
            document.addEventListener('copy', listener);
            const success = document.execCommand('copy');
            document.removeEventListener('copy', listener);

            if (success) {
                toast({
                    title: "Copied Rich Format",
                    description: "Checklist copied with rich official table formatting to clipboard.",
                });
                return;
            }
        } catch (err) {
            console.warn("execCommand copy intercept failed, attempting Clipboard API fallback", err);
        }

        // 2. Second, attempt Clipboard API with ClipboardItem
        try {
            if (navigator.clipboard && typeof ClipboardItem !== 'undefined') {
                const htmlBlob = new Blob([htmlContent], { type: 'text/html' });
                const textBlob = new Blob([plainText], { type: 'text/plain' });
                await navigator.clipboard.write([
                    new ClipboardItem({
                        'text/html': htmlBlob,
                        'text/plain': textBlob
                    })
                ]);
                toast({
                    title: "Copied Rich Format",
                    description: "Checklist copied with rich official table formatting to clipboard.",
                });
                return;
            }
        } catch (apiErr) {
            console.error("Clipboard API write failed, trying text-only writeText", apiErr);
        }

        // 3. Third, plain text writeText fallback
        try {
            await navigator.clipboard.writeText(plainText);
            toast({
                title: "Copied Plain Text",
                description: "Copied plain text only (rich formatting not supported by your browser).",
            });
        } catch (lastErr) {
            console.error("All copy methods failed:", lastErr);
            toast({
                title: "Copy Failed",
                description: "Could not copy data to clipboard. Please select and copy manually.",
                variant: "destructive"
            });
        }
    };

    const handleExportExcel = async () => {
        const title = isRenewal 
            ? "കുഴൽ കിണർ നിർമ്മാണ റിഗ് രജിസ്ട്രേഷൻ പുതുക്കൽ ചെക്ക് ലിസ്റ്റ്"
            : "കുഴൽ കിണർ നിർമ്മാണ റിഗ് രജിസ്ട്രേഷൻ ചെക്ക് ലിസ്റ്റ്";
        const officeName = (officeAddress?.officeNameMalayalam && officeAddress.officeNameMalayalam !== 'ഭൂജലവകുപ്പ്')
            ? (officeAddress.officeNameMalayalam.startsWith('ജില്ലാ ഓഫീസ്')
                ? officeAddress.officeNameMalayalam
                : `ജില്ലാ ഓഫീസ്: ${officeAddress.officeNameMalayalam.replace(/^ജില്ലാ ഓഫീസ്\s*[:,-]?\s*/, '')}`)
            : `ജില്ലാ ഓഫീസ്: ${getDistrictMalayalam(officeAddress?.officeLocation)}`;
        
        const fileNoStr = safeString(customFileNo || application.fileNo || 'GWDKLM/363/2026-MD2');
        const dateStr = safeString(customDate, format(new Date(), 'dd/MM/yyyy'));
        const subTitle = isRenewal 
            ? `രജിസ്ട്രേഷൻ പുതുക്കൽ - ${getRigMalayalam(rig.typeOfRig, rig.typeOfRigMalayalam)}`
            : `പുതിയ റിഗ് രജിസ്ട്രേഷൻ - ${getRigMalayalam(rig.typeOfRig, rig.typeOfRigMalayalam)}`;

        const exportRows: { slNo: string; label: string; value: string }[] = [];

        checklistItems.forEach((item, idx) => {
            if (item.num === "30") {
                exportRows.push({
                    slNo: "30",
                    label: "ഫീസ് തുക, ഒടുക്കിയ തീയതി (ചലാൻ പകർപ്പ്) :",
                    value: ""
                });
                const subRows = getSubRowsData();
                subRows.forEach(sub => {
                    const hasSubOverride = (rowOverrides as any)[sub.key] !== undefined;
                    const subVal = hasSubOverride ? (rowOverrides as any)[sub.key] : sub.defaultValue;
                    exportRows.push({
                        slNo: "",
                        label: sub.label,
                        value: extractTextFromNode(subVal).trim()
                    });
                });
            } else {
                const currentVal = rowOverrides[idx] !== undefined 
                    ? rowOverrides[idx] 
                    : ((rowOverrides as any)[String(idx)] !== undefined ? (rowOverrides as any)[String(idx)] : item.value);
                exportRows.push({
                    slNo: item.num || "",
                    label: extractTextFromNode(item.label).trim(),
                    value: extractTextFromNode(currentVal).trim()
                });
            }
        });

        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet("Checklist");

        // Add Government Header
        worksheet.addRow(["ഭൂജലവകുപ്പ്"]).font = { bold: true, size: 16 };
        worksheet.addRow([officeName]).font = { bold: true, size: 12 };
        worksheet.addRow([title]).font = { bold: true, size: 12, underline: true };
        worksheet.addRow([]).commit();

        // Add reference details
        worksheet.addRow([`ഫയൽ നമ്പർ: ${fileNoStr}`, `തീയതി : ${dateStr}`]).font = { bold: true };
        worksheet.addRow([subTitle]).font = { bold: true, italic: true };
        worksheet.addRow([]).commit();

        // Headers
        const headers = ["ക്രമ നമ്പർ (Sl. No.)", "വിവരണം (Description)", "വിവരങ്ങൾ (Details)"];
        const headerRow = worksheet.addRow(headers);
        headerRow.font = { bold: true };
        headerRow.eachCell(cell => {
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'F0F0F0' } };
            cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
            cell.alignment = { wrapText: true, vertical: 'middle', horizontal: 'center' };
        });

        // Checklist rows
        exportRows.forEach(row => {
            const newRow = worksheet.addRow([row.slNo, row.label, row.value]);
            newRow.eachCell((cell, colIndex) => {
                cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
                if (colIndex === 1) {
                    cell.alignment = { horizontal: 'center', vertical: 'middle' };
                } else {
                    cell.alignment = { wrapText: true, vertical: 'top', horizontal: 'left' };
                }
            });
        });

        // Column widths
        worksheet.getColumn(1).width = 18;
        worksheet.getColumn(2).width = 45;
        worksheet.getColumn(3).width = 50;

        const buffer = await workbook.xlsx.writeBuffer();
        const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        const filePrefix = isRenewal ? "Rig_Renewal_Checklist" : "Rig_Registration_Checklist";
        a.download = `${filePrefix}_${fileNoStr.replace(/[^a-zA-Z0-9]/g, '_')}.xlsx`;
        a.click();
        URL.revokeObjectURL(url);

        toast({
            title: "Excel Exported",
            description: "Checklist exported to Excel successfully.",
        });
    };

    return (
        <div className="bg-slate-50 min-h-screen p-4 sm:p-8 print:bg-white print:p-0">
            {/* Top Toolbar (Hidden on print) */}
            <div className="max-w-4xl mx-auto mb-4 bg-white rounded-lg shadow-sm p-3 border space-y-3 no-print print:hidden">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                        <Button variant="ghost" size="sm" onClick={() => router.back()} className="h-8 px-2 text-xs">
                            <ArrowLeft className="mr-1.5 h-3.5 w-3.5" /> Back
                        </Button>
                        <span className="text-gray-300">|</span>
                        <span className="text-xs font-semibold text-slate-700">
                            {isRenewal ? 'Renewal Checklist' : 'Registration Checklist'} Print Preview
                        </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5">
                        <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => setShowSettings(!showSettings)}
                            className={cn("h-8 text-xs px-2.5", showSettings && "bg-slate-100 border-slate-300")}
                        >
                            <Settings2 className="mr-1.5 h-3.5 w-3.5 text-slate-600" />
                            {showSettings ? 'Hide Header' : 'Edit Header'}
                        </Button>

                        {Object.keys(rowOverrides).length > 0 && (
                            <Button 
                                variant="outline" 
                                size="sm" 
                                className="h-8 text-xs px-2.5 text-amber-700 border-amber-200 hover:bg-amber-50"
                                onClick={() => {
                                    setRowOverrides({});
                                    handleSaveChecklist({});
                                }}
                            >
                                <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
                                Reset All
                            </Button>
                        )}

                        <Button 
                            size="sm"
                            onClick={() => handleSaveChecklist()} 
                            disabled={isSaving}
                            className="h-8 text-xs px-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-medium"
                        >
                            {isSaving ? (
                                <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                            ) : (
                                <Save className="mr-1.5 h-3.5 w-3.5" />
                            )}
                            Save
                        </Button>

                        <Button size="sm" onClick={() => printDocument('print-checklist-content', isRenewal ? 'Rig Renewal Checklist' : 'Rig Registration Checklist', '1.2cm 1.5cm 1.2cm 1.5cm')} className="h-8 text-xs px-2.5 bg-blue-600 hover:bg-blue-700 text-white">
                            <Printer className="mr-1.5 h-3.5 w-3.5" /> Print
                        </Button>

                        <Button size="sm" onClick={handleCopyText} variant="outline" className="h-8 text-xs px-2.5 border-slate-300 hover:bg-slate-50 text-slate-700">
                            <Copy className="mr-1.5 h-3.5 w-3.5 text-slate-500" /> Copy Official Table
                        </Button>

                        <Button 
                            size="sm" 
                            onClick={handleCopyRichHtml} 
                            disabled={isCopying}
                            variant="outline" 
                            className="h-8 text-xs px-2.5 border-blue-300 hover:bg-blue-50 text-blue-700 gap-1"
                        >
                            <ClipboardCopy className="h-3.5 w-3.5 text-blue-500" /> 
                            {isCopying ? "Copying..." : "Copy Rich HTML"}
                        </Button>

                        <Button size="sm" onClick={handleExportExcel} className="h-8 text-xs px-2.5 bg-green-700 hover:bg-green-800 text-white">
                            <FileSpreadsheet className="mr-1.5 h-3.5 w-3.5" /> Export Excel
                        </Button>
                    </div>
                </div>

                {/* Collapsible Header/Inspector Edit Panel */}
                {showSettings && (
                    <div className="pt-2 border-t grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2 bg-slate-50/80 p-2.5 rounded-md text-xs">
                        <div className="space-y-1">
                            <Label className="text-[11px] text-slate-600 font-medium">File No</Label>
                            <Input 
                                className="h-7 text-xs bg-white" 
                                value={customFileNo} 
                                onChange={(e) => setCustomFileNo(e.target.value)} 
                                placeholder="e.g. GWDKLM/363/2026-MD2"
                            />
                        </div>
                        <div className="space-y-1">
                            <Label className="text-[11px] text-slate-600 font-medium">Date</Label>
                            <Input 
                                className="h-7 text-xs bg-white" 
                                value={customDate} 
                                onChange={(e) => setCustomDate(e.target.value)} 
                                placeholder="dd/mm/yyyy"
                            />
                        </div>
                        <div className="space-y-1">
                            <Label className="text-[11px] text-slate-600 font-medium">Officer</Label>
                            <Input 
                                className="h-7 text-xs bg-white" 
                                value={inspectingOfficer} 
                                onChange={(e) => setInspectingOfficer(e.target.value)} 
                                placeholder="e.g. R. Suresh"
                            />
                        </div>
                        <div className="space-y-1">
                            <Label className="text-[11px] text-slate-600 font-medium">Designation</Label>
                            <Input 
                                className="h-7 text-xs bg-white" 
                                value={inspectingOfficerDesig} 
                                onChange={(e) => setInspectingOfficerDesig(e.target.value)} 
                                placeholder="e.g. Hydrogeologist / AE"
                            />
                        </div>
                    </div>
                )}
            </div>

            {/* Printable Document Sheet */}
            <style jsx global>{`
                @media print {
                    @page {
                        size: A4 portrait;
                        margin: 1.2cm 1.5cm 1.2cm 1.5cm !important;
                    }
                    body {
                        background: #ffffff !important;
                        color: #000000 !important;
                    }
                }
            `}</style>
            <div id="print-checklist-content" className="max-w-4xl mx-auto bg-white border shadow-md p-10 md:p-14 text-black font-sans leading-relaxed print:border-0 print:shadow-none print:p-6 print:m-0 print:max-w-full">
                
                {/* Government Header */}
                <div className="text-center space-y-2 pb-6 border-b-2 border-black mb-8">
                    <h1 className="text-2xl font-bold tracking-wide">ഭൂജലവകുപ്പ്</h1>
                    <p className="text-base font-semibold">
                        {(officeAddress?.officeNameMalayalam && officeAddress.officeNameMalayalam !== 'ഭൂജലവകുപ്പ്')
                            ? (officeAddress.officeNameMalayalam.startsWith('ജില്ലാ ഓഫീസ്')
                                ? officeAddress.officeNameMalayalam
                                : `ജില്ലാ ഓഫീസ്: ${officeAddress.officeNameMalayalam.replace(/^ജില്ലാ ഓഫീസ്\s*[:,-]?\s*/, '')}`)
                            : `ജില്ലാ ഓഫീസ്: ${getDistrictMalayalam(officeAddress?.officeLocation)}`}
                    </p>
                    <h2 className="text-lg font-bold underline mt-4">
                        {isRenewal 
                            ? "കുഴൽ കിണർ നിർമ്മാണ റിഗ് രജിസ്ട്രേഷൻ പുതുക്കൽ ചെക്ക് ലിസ്റ്റ്"
                            : "കുഴൽ കിണർ നിർമ്മാണ റിഗ് രജിസ്ട്രേഷൻ ചെക്ക് ലിസ്റ്റ്"
                        }
                    </h2>
                </div>

                {/* Reference Row */}
                <div className="flex justify-between items-center text-sm font-bold mb-6">
                    <div>
                        <span>ഫയൽ നമ്പർ: </span>
                        <span className="font-mono">{safeString(customFileNo || application.fileNo || 'GWDKLM/363/2026-MD2')}</span>
                    </div>
                    <div>
                        <span>തീയതി : </span>
                        <span className="font-mono">{safeString(customDate, format(new Date(), 'dd/MM/yyyy'))}</span>
                    </div>
                </div>

                {/* Sub-heading */}
                <div className="mb-6 text-center">
                    <p className="font-bold text-base bg-slate-100 p-2 rounded print:bg-transparent print:p-0 print:underline">
                        {isRenewal 
                            ? `രജിസ്ട്രേഷൻ പുതുക്കൽ - ${getRigMalayalam(rig.typeOfRig, rig.typeOfRigMalayalam)}`
                            : `പുതിയ റിഗ് രജിസ്ട്രേഷൻ - ${getRigMalayalam(rig.typeOfRig, rig.typeOfRigMalayalam)}`
                        }
                    </p>
                </div>

                {/* Table Checklist */}
                <table className="w-full border-collapse border border-black text-xs leading-normal">
                    <tbody>
                        {checklistItems.map((item, index) => {
                            if (item.num === "30") {
                                const subRows = !isRenewal ? [
                                    { 
                                        key: "30_a", 
                                        label: "a. അപേക്ഷ ഫീസ് - ഏജൻസി രജിസ്ട്രേഷൻ", 
                                        defaultValue: (() => {
                                            const agencyRegFee = (application.applicationFees || []).find(f => f.applicationFeeType === "Agency Registration");
                                            if (agencyRegFee) {
                                                return `Rs. ${agencyRegFee.applicationFeeAmount || 0}/- dtd. ${formatDateSafe(agencyRegFee.applicationFeePaymentDate)}, Challan No. ${agencyRegFee.applicationFeeChallanNo || ''}`;
                                            }
                                            return application.agencyRegistrationFee 
                                                ? `Rs. ${application.agencyRegistrationFee}/- dtd. ${formatDateSafe(application.agencyPaymentDate)}, Challan No. ${application.agencyChallanNo || ''}`
                                                : '-';
                                        })()
                                    },
                                    { 
                                        key: "30_b", 
                                        label: "b. അപേക്ഷ ഫീസ് - റിഗ് രജിസ്ട്രേഷൻ", 
                                        defaultValue: (() => {
                                            const activeRigsList = (application.rigs || []).filter(r => r.status !== 'Cancelled');
                                            const currentRigActiveIndex = activeRigsList.findIndex(r => r.id === rig.id);
                                            const currentRigLabel = currentRigActiveIndex !== -1 ? `Rig #${currentRigActiveIndex + 1}` : '';

                                            const rigRegFee = (application.applicationFees || []).find(
                                                f => f.applicationFeeType === "Rig Registration" && f.rigNumber === currentRigLabel
                                            ) || (application.applicationFees || []).find(
                                                f => f.applicationFeeType === "Rig Registration" && (!f.rigNumber || f.rigNumber === 'none')
                                            );
                                            
                                            if (rigRegFee) {
                                                return `Rs. ${rigRegFee.applicationFeeAmount || 0}/- dtd. ${formatDateSafe(rigRegFee.applicationFeePaymentDate)}, Challan: ${rigRegFee.applicationFeeChallanNo || ''}`;
                                            }
                                            
                                            return rig.registrationFee 
                                                ? `Rs. ${rig.registrationFee}/- dtd. ${formatDateSafe(rig.paymentDate)}, Challan: ${rig.challanNo || ''}${rig.challanAmount ? `, Rs. ${rig.challanAmount}/-` : ''}`
                                                : '-';
                                        })()
                                    },
                                    { 
                                        key: "30_c", 
                                        label: "c. ഏജൻസി രജിസ്ട്രേഷൻ", 
                                        defaultValue: (() => {
                                            const total = (application.agencyRegistrationFee || 0) + (application.agencyAdditionalRegFee || 0);
                                            if (!total) return '-';
                                            const primaryPart = application.agencyRegistrationFee 
                                                ? `Challan No. ${application.agencyChallanNo || ''} dtd. ${formatDateSafe(application.agencyPaymentDate)} (Rs. ${application.agencyRegistrationFee}/-)`
                                                : '';
                                            const additionalPart = application.agencyAdditionalRegFee 
                                                ? `Additional Challan No. ${application.agencyAdditionalChallanNo || ''} dtd. ${formatDateSafe(application.agencyAdditionalPaymentDate)} (Rs. ${application.agencyAdditionalRegFee}/-)`
                                                : '';
                                            return `Rs. ${total}/- [${[primaryPart, additionalPart].filter(Boolean).join(', ')}]`;
                                        })()
                                    },
                                    { 
                                        key: "30_d", 
                                        label: "d. റിഗ് രജിസ്ട്രേഷൻ", 
                                        defaultValue: (() => {
                                            const total = (rig.registrationFee || 0) + (rig.additionalRegistrationFee || 0);
                                            if (!total) return '-';
                                            const primaryPart = rig.registrationFee 
                                                ? `Challan No. ${rig.challanNo || ''} dtd. ${formatDateSafe(rig.paymentDate)} (Rs. ${rig.registrationFee}/-)`
                                                : '';
                                            const additionalPart = rig.additionalRegistrationFee 
                                                ? `Additional Challan No. ${rig.additionalChallanNo || ''} dtd. ${formatDateSafe(rig.additionalPaymentDate)} (Rs. ${rig.additionalRegistrationFee}/-)`
                                                : '';
                                            return `Rs. ${total}/- [${[primaryPart, additionalPart].filter(Boolean).join(', ')}]`;
                                        })()
                                    }
                                ] : [
                                    { key: "30_a", label: "a. അപേക്ഷ ഫീസ്", defaultValue: "ബാധകമല്ല" },
                                    { key: "30_b", label: "b. രജിസ്ട്രേഷൻ പുതുക്കൽ", defaultValue: (selectedRenewal?.totalRenewalFee ?? selectedRenewal?.renewalFee) ? `Rs. ${(selectedRenewal?.totalRenewalFee ?? selectedRenewal?.renewalFee)}/- dtd. ${formatDateSafe(selectedRenewal?.paymentDate)}, e-Chalan: ${selectedRenewal?.challanNo || ''}${selectedRenewal?.challanAmount ? `, Rs. ${selectedRenewal.challanAmount}/-` : ''}` : '-' }
                                ];

                                return (
                                    <React.Fragment key={index}>
                                        <tr className="hover:bg-slate-50/50 print:hover:bg-transparent">
                                            <td rowSpan={subRows.length + 1} className="border border-black p-3 text-center font-bold font-mono align-top">30</td>
                                            <td className="border border-black p-3 font-semibold align-top whitespace-pre-wrap" colSpan={2}>
                                                ഫീസ് തുക, ഒടുക്കിയ തീയതി (ചലാൻ പകർപ്പ്) :
                                            </td>
                                        </tr>
                                        {subRows.map((sub) => {
                                            const isSubEditing = editingRowIndex === sub.key;
                                            const hasSubOverride = (rowOverrides as any)[sub.key] !== undefined;
                                            const subVal = hasSubOverride ? (rowOverrides as any)[sub.key] : sub.defaultValue;

                                            return (
                                                <tr key={sub.key} className="hover:bg-slate-50/50 print:hover:bg-transparent group">
                                                    <td className="border border-black p-3 font-semibold align-top pl-6 text-xs">{sub.label}</td>
                                                    <td className="border border-black p-3 align-top whitespace-pre-wrap relative text-xs">
                                                        {isSubEditing ? (
                                                            <div className="space-y-2 no-print">
                                                                <textarea
                                                                    className="w-full text-xs p-2 border rounded bg-white font-sans"
                                                                    rows={3}
                                                                    value={tempRowValue}
                                                                    onChange={(e) => setTempRowValue(e.target.value)}
                                                                    placeholder="Enter manual data..."
                                                                />
                                                                <div className="flex gap-2">
                                                                    <Button 
                                                                        size="sm" 
                                                                        disabled={isSaving}
                                                                        className="h-7 text-xs bg-green-600 hover:bg-green-700 text-white" 
                                                                        onClick={() => {
                                                                            const newOverrides = { ...rowOverrides, [sub.key]: tempRowValue };
                                                                            setRowOverrides(newOverrides);
                                                                            setEditingRowIndex(null);
                                                                            handleSaveChecklist(newOverrides);
                                                                        }}
                                                                    >
                                                                        {isSaving ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Check className="h-3 w-3 mr-1" />} Save
                                                                    </Button>
                                                                    <Button 
                                                                        size="sm" 
                                                                        variant="outline" 
                                                                        className="h-7 text-xs" 
                                                                        onClick={() => setEditingRowIndex(null)}
                                                                    >
                                                                        <X className="h-3 w-3 mr-1" /> Cancel
                                                                    </Button>
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <div className="flex justify-between items-start gap-3">
                                                                <div className="flex-1">
                                                                    <p className="whitespace-pre-wrap">{subVal}</p>
                                                                    {hasSubOverride && (
                                                                        <span className="text-[10px] text-blue-600 italic no-print block mt-1">(Manually edited & saved)</span>
                                                                    )}
                                                                </div>
                                                                <div className="no-print opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 shrink-0">
                                                                    <Button
                                                                        size="sm"
                                                                        variant="ghost"
                                                                        className="h-6 w-6 p-0 text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                                                                        title="Edit data manually"
                                                                        onClick={() => {
                                                                            setEditingRowIndex(sub.key);
                                                                            setTempRowValue(String(subVal));
                                                                        }}
                                                                    >
                                                                        <Edit2 className="h-3.5 w-3.5" />
                                                                    </Button>
                                                                    {hasSubOverride && (
                                                                        <Button
                                                                            size="sm"
                                                                            variant="ghost"
                                                                            className="h-6 w-6 p-0 text-red-600 hover:text-red-800 hover:bg-red-50"
                                                                            title="Reset to default"
                                                                            onClick={() => {
                                                                                const newOverrides = { ...rowOverrides };
                                                                                delete (newOverrides as any)[sub.key];
                                                                                setRowOverrides(newOverrides);
                                                                                handleSaveChecklist(newOverrides);
                                                                            }}
                                                                        >
                                                                            <RotateCcw className="h-3.5 w-3.5" />
                                                                        </Button>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        )}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </React.Fragment>
                                );
                            }

                            const isEditing = editingRowIndex === index;
                            const hasOverride = rowOverrides[index] !== undefined || (rowOverrides as any)[String(index)] !== undefined;
                            const currentVal = rowOverrides[index] !== undefined 
                                ? rowOverrides[index] 
                                : ((rowOverrides as any)[String(index)] !== undefined ? (rowOverrides as any)[String(index)] : item.value);

                            return (
                                <tr key={index} className="hover:bg-slate-50/50 print:hover:bg-transparent group">
                                    <td className="border border-black p-3 text-center font-bold font-mono align-top">{item.num || ""}</td>
                                    <td className="border border-black p-3 font-semibold align-top whitespace-pre-wrap">{item.label}</td>
                                    <td className="border border-black p-3 align-top whitespace-pre-wrap relative">
                                        {isEditing ? (
                                            <div className="space-y-2 no-print">
                                                <textarea
                                                    className="w-full text-xs p-2 border rounded bg-white font-sans"
                                                    rows={3}
                                                    value={tempRowValue}
                                                    onChange={(e) => setTempRowValue(e.target.value)}
                                                    placeholder="Enter manual data for this row..."
                                                />
                                                <div className="flex gap-2">
                                                    <Button 
                                                        size="sm" 
                                                        disabled={isSaving}
                                                        className="h-7 text-xs bg-green-600 hover:bg-green-700 text-white" 
                                                        onClick={() => {
                                                            const newOverrides = { ...rowOverrides, [index]: tempRowValue };
                                                            setRowOverrides(newOverrides);
                                                            setEditingRowIndex(null);
                                                            handleSaveChecklist(newOverrides);
                                                        }}
                                                    >
                                                        {isSaving ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Check className="h-3 w-3 mr-1" />} Save
                                                    </Button>
                                                    <Button 
                                                        size="sm" 
                                                        variant="outline" 
                                                        className="h-7 text-xs" 
                                                        onClick={() => setEditingRowIndex(null)}
                                                    >
                                                        <X className="h-3 w-3 mr-1" /> Cancel
                                                    </Button>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="flex justify-between items-start gap-3">
                                                <div className="flex-1">
                                                    {hasOverride ? (
                                                        <p className="whitespace-pre-wrap font-medium">{safeString(currentVal)}</p>
                                                    ) : (
                                                        typeof currentVal === 'string' ? (
                                                            <p className="whitespace-pre-wrap">{currentVal}</p>
                                                        ) : typeof currentVal === 'number' ? (
                                                            <p className="whitespace-pre-wrap">{currentVal}</p>
                                                        ) : React.isValidElement(currentVal) ? (
                                                            currentVal
                                                        ) : (
                                                            <p className="whitespace-pre-wrap">{safeString(currentVal)}</p>
                                                        )
                                                    )}
                                                    {hasOverride && (
                                                        <span className="text-[10px] text-blue-600 italic no-print block mt-1">(Manually edited & saved)</span>
                                                    )}
                                                </div>
                                                <div className="no-print opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 shrink-0">
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        className="h-6 w-6 p-0 text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                                                        title="Edit data manually"
                                                        onClick={() => {
                                                            setEditingRowIndex(index);
                                                            const initialStr = extractTextFromNode(currentVal);
                                                            setTempRowValue(initialStr);
                                                        }}
                                                    >
                                                        <Edit2 className="h-3.5 w-3.5" />
                                                    </Button>
                                                    {hasOverride && (
                                                        <Button
                                                            size="sm"
                                                            variant="ghost"
                                                            className="h-6 w-6 p-0 text-red-600 hover:text-red-800 hover:bg-red-50"
                                                            title="Reset to default"
                                                            onClick={() => {
                                                                const newOverrides = { ...rowOverrides };
                                                                delete newOverrides[index];
                                                                delete (newOverrides as any)[String(index)];
                                                                setRowOverrides(newOverrides);
                                                                handleSaveChecklist(newOverrides);
                                                            }}
                                                        >
                                                            <RotateCcw className="h-3.5 w-3.5" />
                                                        </Button>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>

                {/* Declaration Statement (സത്യപ്രസ്താവന) */}
                <div className="mt-10 border border-slate-300 p-4 rounded bg-slate-50/30 text-xs leading-relaxed print:bg-transparent print:border-black print:p-4">
                    <h3 className="font-bold text-sm mb-2">സത്യപ്രസ്താവന (Declaration)</h3>
                    <p className="indent-8 text-justify">
                        ഈ ഓഫീസിലെ <span className="font-bold">{formattedOfficerDisplay}</span>, 
                        ജില്ലാ ഓഫീസ്, <span className="font-bold">{getDistrictMalayalam(officeAddress?.officeLocation)},</span> മേൽ റിഗ് പരിശോധിക്കുകയും മുകളിൽ രേഖപ്പെടുത്തിയിട്ടുള്ള എല്ലാ വിവരങ്ങളും നേരിട്ടും ഒറിജിനൽ രേഖകളുമായും ഒത്തു നോക്കുകയും, ബോധ്യപ്പെടുകയും ചെയ്തിട്ടുണ്ട്. ആയതിനാൽ <span className="font-bold">{safeString(application.owner?.nameMalayalam || application.owner?.name)}</span> എന്നവരുടെ <span className="font-bold">{safeString(application.agencyNameMalayalam || application.agencyName)}</span> എന്ന ഏജൻസിയുടെ <span className="font-bold">{getRigMalayalam(rig.typeOfRig, rig.typeOfRigMalayalam)}</span> {rig.rigVehicle?.regNo && rig.rigVehicle.regNo !== 'ബാധകമല്ല' ? `(രജി. നമ്പർ: ${rig.rigVehicle.regNo})` : ''} ന് {isRenewal ? 'പുതുക്കിയ' : ''} രജിസ്ട്രേഷൻ സർട്ടിഫിക്കറ്റ് നൽകുന്നതിനായി ശുപാർശ ചെയ്യുന്നു.
                    </p>
                </div>

                {/* Signatures Footer */}
                <div className="mt-16 grid grid-cols-2 gap-x-8 gap-y-16 text-center text-xs font-bold pt-8">
                    <div className="space-y-12">
                        <div className="h-1 bg-transparent"></div>
                        <p>പരിശോധന നടത്തിയ ഉദ്യോഗസ്ഥൻ</p>
                    </div>
                    <div className="space-y-12">
                        <div className="h-1 bg-transparent"></div>
                        <p>അസി. എഞ്ചിനീയർ</p>
                    </div>
                    <div className="space-y-12">
                        <div className="h-1 bg-transparent"></div>
                        <p>അസി. എക്സി. എഞ്ചിനീയർ</p>
                    </div>
                    <div className="space-y-12">
                        <div className="h-1 bg-transparent"></div>
                        <p>ജില്ലാ ഓഫീസർ</p>
                    </div>
                </div>

            </div>
        </div>
    );
}
