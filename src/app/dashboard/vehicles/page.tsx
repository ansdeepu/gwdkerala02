
// src/app/dashboard/vehicles/page.tsx
"use client";

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { usePageHeader } from '@/hooks/usePageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import type { DepartmentVehicle, HiredVehicle, RigCompressor } from '@/lib/schemas';
import { DepartmentVehicleForm, HiredVehicleForm, RigCompressorForm } from '@/components/vehicles/VehicleForms';
import { useAuth } from '@/hooks/useAuth';
import ExcelJS from 'exceljs';
import { format, isValid, addDays, isBefore, isAfter } from 'date-fns';
import { toast } from '@/hooks/use-toast';
import { DepartmentVehicleTable, HiredVehicleTable, RigCompressorTable, EngagedRigTable, VehicleViewDialog } from '@/components/vehicles/VehicleTables';
import { useDataStore } from '@/hooks/use-data-store';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Loader2, 
  PlusCircle, 
  Truck, 
  FileDown, 
  AlertTriangle, 
  Building, 
  Car, 
  Wrench, 
  ShieldCheck, 
  History as HistoryIcon 
} from 'lucide-react';

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
    if (!d) return '-';
    const date = safeParseDate(d);
    return date ? format(date, 'dd/MM/yyyy') : '-';
};

interface ExpiryInfo {
    vehicleRegNo: string;
    vehicleType: 'Department' | 'Hired';
    certificates: {
        type: string;
        expiryDate: Date;
        status: 'Expired' | 'Expiring Soon';
    }[];
}

function ExpiryAlertDialog({ 
    isOpen, 
    onClose, 
    vehiclesWithAlerts,
    alertType
}: { 
    isOpen: boolean; 
    onClose: () => void; 
    vehiclesWithAlerts: ExpiryInfo[];
    alertType: 'Department' | 'Hired' | null;
}) {
    const filteredAlerts = useMemo(() => {
        if (!alertType) return [];
        return vehiclesWithAlerts.filter(v => v.vehicleType === alertType);
    }, [vehiclesWithAlerts, alertType]);

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent onPointerDownOutside={(e) => e.preventDefault()} className="max-w-4xl h-[80vh] flex flex-col p-0">
                <DialogHeader className="p-6 pb-4 shrink-0">
                    <DialogTitle className="flex items-center gap-2"><AlertTriangle className="h-6 w-6 text-destructive"/>Vehicle Expiry Alerts</DialogTitle>
                    <DialogDescription>Review certificates that have expired or are expiring within the next 30 days for {alertType} Vehicles.</DialogDescription>
                </DialogHeader>
                <div className="flex-1 min-h-0 px-6 py-4">
                    <ScrollArea className="h-full pr-4">
                       <div className="space-y-4">
                           {filteredAlerts.length > 0 ? (
                               filteredAlerts.map((vehicle) => (
                                   <Card key={vehicle.vehicleRegNo} className="bg-secondary/30">
                                       <CardHeader className="p-3">
                                           <CardTitle className="text-base">{vehicle.vehicleRegNo}</CardTitle>
                                       </CardHeader>
                                       <CardContent className="p-3 pt-0">
                                           <Table>
                                               <TableHeader>
                                                   <TableRow>
                                                       <TableHead className="w-[40%]">Certificate</TableHead>
                                                       <TableHead>Expiry Date</TableHead>
                                                       <TableHead>Status</TableHead>
                                                   </TableRow>
                                               </TableHeader>
                                               <TableBody>
                                                   {vehicle.certificates.map((cert, index) => (
                                                       <TableRow key={index} className={cert.status === 'Expired' ? 'bg-destructive/10' : 'bg-orange-500/10'}>
                                                           <TableCell className="font-medium">{cert.type}</TableCell>
                                                           <TableCell>{formatDateSafe(cert.expiryDate)}</TableCell>
                                                           <TableCell>
                                                               <span className={`font-semibold ${cert.status === 'Expired' ? 'text-destructive' : 'text-orange-600'}`}>{cert.status}</span>
                                                           </TableCell>
                                                       </TableRow>
                                                   ))}
                                               </TableBody>
                                           </Table>
                                       </CardContent>
                                   </Card>
                               ))
                           ) : (
                               <div className="text-center py-10">
                                   <p className="text-muted-foreground">No expired or expiring certificates found for this section.</p>
                               </div>
                           )}
                       </div>
                    </ScrollArea>
                </div>
                <DialogFooter className="p-6 pt-4 border-t shrink-0">
                    <Button onClick={onClose}>Close</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

export default function VehiclesPage() {
    const { setHeader } = usePageHeader();
    const { user } = useAuth();
    const canEdit = user?.role === 'admin';

    const {
        allDepartmentVehicles, addDepartmentVehicle, updateDepartmentVehicle, deleteDepartmentVehicle,
        allHiredVehicles, addHiredVehicle, updateHiredVehicle, deleteHiredVehicle,
        allRigCompressors, addRigCompressor, updateRigCompressor, deleteRigCompressor,
        isLoading,
    } = useDataStore();

    const [isDepartmentDialogOpen, setIsDepartmentDialogOpen] = useState(false);
    const [isHiredDialogOpen, setIsHiredDialogOpen] = useState(false);
    const [isRigDialogOpen, setIsRigDialogOpen] = useState(false);
    const [expiryAlertType, setExpiryAlertType] = useState<'Department' | 'Hired' | null>(null);

    const [editingDepartmentVehicle, setEditingDepartmentVehicle] = useState<DepartmentVehicle | null>(null);
    const [editingHiredVehicle, setEditingHiredVehicle] = useState<HiredVehicle | null>(null);
    const [editingRigCompressor, setEditingRigCompressor] = useState<RigCompressor | null>(null);
    
    const [viewingVehicle, setViewingVehicle] = useState<DepartmentVehicle | HiredVehicle | RigCompressor | null>(null);
    const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);

    useEffect(() => {
        setHeader("Vehicle & Rig Management", "Manage department, hired, and rig/compressor vehicles and units.");
    }, [setHeader]);
    
    const vehiclesWithAlerts = useMemo(() => {
        const today = new Date();
        const thirtyDaysFromNow = addDays(today, 30);
        const alertsMap = new Map<string, ExpiryInfo>();

        const departmentDateFields: Array<{ key: keyof DepartmentVehicle; label: string }> = [
            { key: 'fitnessExpiry', label: 'Fitness' },
            { key: 'taxExpiry', label: 'Tax' },
            { key: 'insuranceExpiry', label: 'Insurance' },
            { key: 'pollutionExpiry', label: 'Pollution' },
            { key: 'fuelTestExpiry', label: 'Fuel Test' },
        ];

        const hiredDateFields: Array<{ key: keyof HiredVehicle; label: string }> = [
            { key: 'fitnessExpiry', label: 'Fitness' },
            { key: 'taxExpiry', label: 'Tax' },
            { key: 'insuranceExpiry', label: 'Insurance' },
            { key: 'pollutionExpiry', label: 'Pollution' },
            { key: 'agreementValidity', label: 'Agreement' },
            { key: 'permitExpiry', label: 'Permit' },
        ];

        const processVehicle = (vehicle: DepartmentVehicle | HiredVehicle, type: 'Department' | 'Hired') => {
            const dateFields = type === 'Department' ? departmentDateFields : hiredDateFields;

            for (const { key, label } of dateFields) {
                const expiryDate = safeParseDate((vehicle as any)[key]);
                if (expiryDate && isValid(expiryDate)) {
                    let status: 'Expired' | 'Expiring Soon' | null = null;
                    if (isBefore(expiryDate, today)) {
                        status = 'Expired';
                    } else if (isAfter(expiryDate, today) && isBefore(expiryDate, thirtyDaysFromNow)) {
                        status = 'Expiring Soon';
                    }

                    if (status) {
                        if (!alertsMap.has(vehicle.registrationNumber)) {
                            alertsMap.set(vehicle.registrationNumber, {
                                vehicleRegNo: vehicle.registrationNumber,
                                vehicleType: type,
                                certificates: []
                            });
                        }
                        alertsMap.get(vehicle.registrationNumber)!.certificates.push({ type: label, expiryDate, status });
                    }
                }
            }
        };

        allDepartmentVehicles.forEach(v => processVehicle(v, 'Department'));
        allHiredVehicles.forEach(v => processVehicle(v, 'Hired'));
        
        return Array.from(alertsMap.values());
    }, [allDepartmentVehicles, allHiredVehicles]);

    const handleAddOrEdit = (type: 'department' | 'hired' | 'rig', data: any) => {
        if(type === 'department') {
            setEditingDepartmentVehicle(data);
            setIsDepartmentDialogOpen(true);
        } else if (type === 'hired') {
            setEditingHiredVehicle(data);
            setIsHiredDialogOpen(true);
        } else if (type === 'rig') {
            setEditingRigCompressor(data);
            setIsRigDialogOpen(true);
        }
    };
    
    const handleView = (vehicle: DepartmentVehicle | HiredVehicle | RigCompressor) => {
        setViewingVehicle(vehicle);
        setIsViewDialogOpen(true);
    };

    const handleDepartmentFormSubmit = async (data: DepartmentVehicle) => {
        if (editingDepartmentVehicle?.id) {
            await updateDepartmentVehicle({ ...data, id: editingDepartmentVehicle.id });
        } else {
            await addDepartmentVehicle(data);
        }
        setIsDepartmentDialogOpen(false);
        setEditingDepartmentVehicle(null);
    };

    const handleHiredFormSubmit = async (data: HiredVehicle) => {
        if (editingHiredVehicle?.id) {
            await updateHiredVehicle({ ...data, id: editingHiredVehicle.id });
        } else {
            await addHiredVehicle(data);
        }
        setIsHiredDialogOpen(false);
        setEditingHiredVehicle(null);
    };

    const handleRigCompressorFormSubmit = async (data: RigCompressor) => {
        if (editingRigCompressor?.id) {
            await updateRigCompressor({ ...data, id: editingRigCompressor.id });
        } else {
            await addRigCompressor(data);
        }
        setIsRigDialogOpen(false);
        setEditingRigCompressor(null);
    };

    const handleExportExcel = useCallback(async (dataType: 'department' | 'hired' | 'rig') => {
        const workbook = new ExcelJS.Workbook();
        let data, headers, sheetName, fileNamePrefix;

        switch (dataType) {
            case 'department':
                data = allDepartmentVehicles;
                headers = ["Registration Number", "Model", "Type of Vehicle", "Vehicle Class", "Registration Date", "RC Status", "Fuel Consumption Rate", "Fitness Expiry", "Tax Expiry", "Insurance Expiry", "Pollution Expiry", "Fuel Test Expiry"];
                sheetName = 'Department Vehicles';
                fileNamePrefix = 'GWD_Department_Vehicles';
                break;
            case 'hired':
                data = allHiredVehicles;
                headers = ["Registration Number", "Model", "Owner Name", "Owner Address", "Agreement Validity", "Vehicle Class", "Registration Date", "RC Status", "Hire Charges", "Fitness Expiry", "Tax Expiry", "Insurance Expiry", "Pollution Expiry", "Permit Expiry"];
                sheetName = 'Hired Vehicles';
                fileNamePrefix = 'GWD_Hired_Vehicles';
                break;
            case 'rig':
                data = allRigCompressors;
                headers = ["Type of Rig Unit", "Status", "Registration Number", "Compressor Details", "Fuel Consumption", "Remarks"];
                sheetName = 'Rig and Compressor';
                fileNamePrefix = 'GWD_Rig_Compressor';
                break;
        }

        const sheet = workbook.addWorksheet(sheetName);
        sheet.addRow(headers).font = { bold: true };

        data.forEach(item => {
            const row = headers.map(header => {
                const key = header.toLowerCase().replace(/ & /g, 'And').replace(/\./g, '').replace(/ /g, '');
                let value = (item as any)[Object.keys(item).find(k => k.toLowerCase().replace(/\./g, '').replace(/ /g, '') === key) || ''];
                if (header.toLowerCase().includes('date') || header.toLowerCase().includes('validity') || header.toLowerCase().includes('expiry')) {
                    value = formatDateSafe(value);
                }
                return value;
            });
            sheet.addRow(row);
        });

        sheet.columns.forEach(column => {
            let maxLength = 0;
            if(column.eachCell){
                column.eachCell({ includeEmpty: true }, cell => {
                    const columnLength = cell.value ? cell.value.toString().length : 10;
                    if (columnLength > maxLength) {
                        maxLength = columnLength;
                    }
                });
            }
            column.width = maxLength < 15 ? 15 : maxLength + 2;
        });

        const buffer = await workbook.xlsx.writeBuffer();
        const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${fileNamePrefix}_${format(new Date(), 'yyyyMMdd_HHmmss')}.xlsx`;
        a.click();
        URL.revokeObjectURL(url);

        toast({ title: "Excel Exported", description: `${sheetName} data has been downloaded.` });
    }, [allDepartmentVehicles, allHiredVehicles, allRigCompressors]);
    
    const { presentDepartmentVehicles, historyDepartmentVehicles } = useMemo(() => ({
        presentDepartmentVehicles: allDepartmentVehicles.filter(v => v.rcStatus !== 'Garaged'),
        historyDepartmentVehicles: allDepartmentVehicles.filter(v => v.rcStatus === 'Garaged'),
    }), [allDepartmentVehicles]);

    const { presentHiredVehicles, historyHiredVehicles } = useMemo(() => ({
        presentHiredVehicles: allHiredVehicles.filter(v => v.rcStatus !== 'Garaged'),
        historyHiredVehicles: allHiredVehicles.filter(v => v.rcStatus === 'Garaged'),
    }), [allHiredVehicles]);

    const { ownRigs, engagedRigs, historyRigCompressors } = useMemo(() => {
        const active = allRigCompressors.filter(v => v.status !== 'Garaged');
        return {
            ownRigs: active.filter(v => !v.isExternal),
            engagedRigs: active.filter(v => v.isExternal),
            historyRigCompressors: allRigCompressors.filter(v => v.status === 'Garaged'),
        };
    }, [allRigCompressors]);

    return (
        <div className="space-y-6">
            <ExpiryAlertDialog isOpen={expiryAlertType !== null} onClose={() => setExpiryAlertType(null)} vehiclesWithAlerts={vehiclesWithAlerts} alertType={expiryAlertType}/>
            
            <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
                <VehicleViewDialog vehicle={viewingVehicle} onClose={() => setIsViewDialogOpen(false)} />
            </Dialog>

            {isLoading ? (
                 <div className="flex justify-center items-center h-64">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                 </div>
            ) : (
                <Tabs defaultValue="present">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="present">Present Data</TabsTrigger>
                        <TabsTrigger value="history">History</TabsTrigger>
                    </TabsList>
                    <TabsContent value="present" className="mt-4 space-y-6">
                        <div className="relative pl-6 sm:pl-8 border-l-2 border-slate-200 dark:border-slate-800 ml-2.5 sm:ml-4 space-y-6 sm:space-y-8">
                            
                            {/* 1. Department Vehicles */}
                            <div className="relative">
                                <div className="absolute -left-[37px] sm:-left-[45px] top-4 bg-background p-1 rounded-full border border-slate-200 dark:border-slate-700 shadow-xs z-10">
                                    <div className="bg-blue-50 dark:bg-blue-950/60 p-1.5 rounded-full text-blue-600 dark:text-blue-400">
                                        <Car className="w-4 h-4" />
                                    </div>
                                </div>
                                <Card className="border-l-4 border-l-blue-600 dark:border-l-blue-500 shadow-xs">
                                    <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400">
                                                <Car className="h-5 w-5" />
                                            </div>
                                            <div>
                                                <CardTitle className="text-lg font-bold tracking-tight">1. Department Vehicles ({presentDepartmentVehicles.length})</CardTitle>
                                                <p className="text-xs text-muted-foreground mt-0.5">Active departmental transport and official service fleet</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                                            <Button variant="outline" size="sm" onClick={() => setExpiryAlertType('Department')}><AlertTriangle className="h-4 w-4 mr-2 text-amber-500"/>Expiry Alerts</Button>
                                            {canEdit && <Button size="sm" onClick={() => handleAddOrEdit('department', null)}><PlusCircle className="h-4 w-4 mr-2"/> Add</Button>}
                                            <Button variant="outline" size="sm" onClick={() => handleExportExcel('department')}><FileDown className="mr-2 h-4 w-4" /> Export</Button>
                                        </div>
                                    </CardHeader>
                                    <CardContent>
                                        <DepartmentVehicleTable 
                                            data={presentDepartmentVehicles} 
                                            onEdit={(v: DepartmentVehicle) => handleAddOrEdit('department', v)} 
                                            onDelete={deleteDepartmentVehicle} 
                                            canEdit={canEdit}
                                            onView={handleView}
                                        />
                                    </CardContent>
                                </Card>
                            </div>

                            {/* 2. Hired Vehicles */}
                            <div className="relative">
                                <div className="absolute -left-[37px] sm:-left-[45px] top-4 bg-background p-1 rounded-full border border-slate-200 dark:border-slate-700 shadow-xs z-10">
                                    <div className="bg-emerald-50 dark:bg-emerald-950/60 p-1.5 rounded-full text-emerald-600 dark:text-emerald-400">
                                        <Truck className="w-4 h-4" />
                                    </div>
                                </div>
                                <Card className="border-l-4 border-l-emerald-600 dark:border-l-emerald-500 shadow-xs">
                                    <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400">
                                                <Truck className="h-5 w-5" />
                                            </div>
                                            <div>
                                                <CardTitle className="text-lg font-bold tracking-tight">2. Hired Vehicles ({presentHiredVehicles.length})</CardTitle>
                                                <p className="text-xs text-muted-foreground mt-0.5">Contractual and rented vehicles currently on active duty</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                                            <Button variant="outline" size="sm" onClick={() => setExpiryAlertType('Hired')}><AlertTriangle className="h-4 w-4 mr-2 text-amber-500"/>Expiry Alerts</Button>
                                            {canEdit && <Button size="sm" onClick={() => handleAddOrEdit('hired', null)}><PlusCircle className="h-4 w-4 mr-2"/> Add</Button>}
                                            <Button variant="outline" size="sm" onClick={() => handleExportExcel('hired')}><FileDown className="mr-2 h-4 w-4" /> Export</Button>
                                        </div>
                                    </CardHeader>
                                    <CardContent>
                                        <HiredVehicleTable 
                                            data={presentHiredVehicles} 
                                            onEdit={(v: HiredVehicle) => handleAddOrEdit('hired', v)} 
                                            onDelete={deleteHiredVehicle}
                                            canEdit={canEdit}
                                            onView={handleView}
                                        />
                                    </CardContent>
                                </Card>
                            </div>

                            {/* 3. Rig & Compressor Units */}
                            <div className="relative">
                                <div className="absolute -left-[37px] sm:-left-[45px] top-4 bg-background p-1 rounded-full border border-slate-200 dark:border-slate-700 shadow-xs z-10">
                                    <div className="bg-amber-50 dark:bg-amber-950/60 p-1.5 rounded-full text-amber-600 dark:text-amber-400">
                                        <Wrench className="w-4 h-4" />
                                    </div>
                                </div>
                                <Card className="border-l-4 border-l-amber-600 dark:border-l-amber-500 shadow-xs">
                                    <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400">
                                                <Wrench className="h-5 w-5" />
                                            </div>
                                            <div>
                                                <CardTitle className="text-lg font-bold tracking-tight">3. Rig & Compressor Units ({ownRigs.length})</CardTitle>
                                                <p className="text-xs text-muted-foreground mt-0.5">Departmental drilling rigs, compressor equipment, and support units</p>
                                            </div>
                                        </div>
                                        {canEdit && (
                                            <Button size="sm" variant="outline" onClick={() => handleAddOrEdit('rig', null)}>
                                                <PlusCircle className="h-4 w-4 mr-2"/>Add Rig
                                            </Button>
                                        )}
                                    </CardHeader>
                                    <CardContent>
                                        <RigCompressorTable 
                                            data={ownRigs} 
                                            onEdit={(v: RigCompressor) => handleAddOrEdit('rig', v)} 
                                            onDelete={deleteRigCompressor} 
                                            canEdit={canEdit}
                                            onView={handleView}
                                        />
                                    </CardContent>
                                </Card>
                            </div>

                            {/* 4. Other Office Rigs Engaged */}
                            <div className="relative">
                                <div className="absolute -left-[37px] sm:-left-[45px] top-4 bg-background p-1 rounded-full border border-slate-200 dark:border-slate-700 shadow-xs z-10">
                                    <div className="bg-purple-50 dark:bg-purple-950/60 p-1.5 rounded-full text-purple-600 dark:text-purple-400">
                                        <Building className="w-4 h-4" />
                                    </div>
                                </div>
                                <Card className="border-l-4 border-l-purple-600 dark:border-l-purple-500 shadow-xs">
                                    <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 rounded-lg bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400">
                                                <Building className="h-5 w-5" />
                                            </div>
                                            <div>
                                                <CardTitle className="text-lg font-bold tracking-tight">4. Other Office Rigs Engaged ({engagedRigs.length})</CardTitle>
                                                <p className="text-xs text-muted-foreground mt-0.5">Cross-office deployed rigs and inter-district machinery engaged for operations</p>
                                            </div>
                                        </div>
                                        {canEdit && (
                                            <Button size="sm" variant="outline" onClick={() => handleAddOrEdit('rig', { isExternal: true })}>
                                                <PlusCircle className="h-4 w-4 mr-2"/>Add External
                                            </Button>
                                        )}
                                    </CardHeader>
                                    <CardContent>
                                        <EngagedRigTable 
                                            data={engagedRigs}
                                            onEdit={(v: RigCompressor) => handleAddOrEdit('rig', v)}
                                            onDelete={deleteRigCompressor}
                                            canEdit={canEdit}
                                            onView={handleView}
                                        />
                                    </CardContent>
                                </Card>
                            </div>

                        </div>
                    </TabsContent>
                    <TabsContent value="history" className="mt-4 space-y-6">
                        <div className="relative pl-6 sm:pl-8 border-l-2 border-slate-200 dark:border-slate-800 ml-2.5 sm:ml-4 space-y-6 sm:space-y-8">
                            
                            {/* 1. Department Vehicles (Garaged) */}
                            <div className="relative">
                                <div className="absolute -left-[37px] sm:-left-[45px] top-4 bg-background p-1 rounded-full border border-slate-200 dark:border-slate-700 shadow-xs z-10">
                                    <div className="bg-blue-50 dark:bg-blue-950/60 p-1.5 rounded-full text-blue-600 dark:text-blue-400">
                                        <Car className="w-4 h-4" />
                                    </div>
                                </div>
                                <Card className="border-l-4 border-l-blue-600 dark:border-l-blue-500 shadow-xs">
                                    <CardHeader className="flex items-center gap-3 pb-4">
                                        <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400">
                                            <Car className="h-5 w-5" />
                                        </div>
                                        <div>
                                            <CardTitle className="text-lg font-bold tracking-tight">1. Department Vehicles (Garaged) ({historyDepartmentVehicles.length})</CardTitle>
                                            <p className="text-xs text-muted-foreground mt-0.5">Archived and off-road departmental fleet records</p>
                                        </div>
                                    </CardHeader>
                                    <CardContent>
                                        <DepartmentVehicleTable 
                                            data={historyDepartmentVehicles} 
                                            onEdit={(v: DepartmentVehicle) => handleAddOrEdit('department', v)} 
                                            onDelete={deleteDepartmentVehicle} 
                                            canEdit={canEdit}
                                            onView={handleView}
                                        />
                                    </CardContent>
                                </Card>
                            </div>

                            {/* 2. Hired Vehicles (Garaged) */}
                            <div className="relative">
                                <div className="absolute -left-[37px] sm:-left-[45px] top-4 bg-background p-1 rounded-full border border-slate-200 dark:border-slate-700 shadow-xs z-10">
                                    <div className="bg-emerald-50 dark:bg-emerald-950/60 p-1.5 rounded-full text-emerald-600 dark:text-emerald-400">
                                        <Truck className="w-4 h-4" />
                                    </div>
                                </div>
                                <Card className="border-l-4 border-l-emerald-600 dark:border-l-emerald-500 shadow-xs">
                                    <CardHeader className="flex items-center gap-3 pb-4">
                                        <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400">
                                            <Truck className="h-5 w-5" />
                                        </div>
                                        <div>
                                            <CardTitle className="text-lg font-bold tracking-tight">2. Hired Vehicles (Garaged) ({historyHiredVehicles.length})</CardTitle>
                                            <p className="text-xs text-muted-foreground mt-0.5">Expired or terminated vehicle rental agreements</p>
                                        </div>
                                    </CardHeader>
                                    <CardContent>
                                        <HiredVehicleTable 
                                            data={historyHiredVehicles} 
                                            onEdit={(v: HiredVehicle) => handleAddOrEdit('hired', v)} 
                                            onDelete={deleteHiredVehicle}
                                            canEdit={canEdit}
                                            onView={handleView}
                                        />
                                    </CardContent>
                                </Card>
                            </div>

                            {/* 3. Rig & Compressor Units (Garaged) */}
                            <div className="relative">
                                <div className="absolute -left-[37px] sm:-left-[45px] top-4 bg-background p-1 rounded-full border border-slate-200 dark:border-slate-700 shadow-xs z-10">
                                    <div className="bg-amber-50 dark:bg-amber-950/60 p-1.5 rounded-full text-amber-600 dark:text-amber-400">
                                        <Wrench className="w-4 h-4" />
                                    </div>
                                </div>
                                <Card className="border-l-4 border-l-amber-600 dark:border-l-amber-500 shadow-xs">
                                    <CardHeader className="flex items-center gap-3 pb-4">
                                        <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400">
                                            <Wrench className="h-5 w-5" />
                                        </div>
                                        <div>
                                            <CardTitle className="text-lg font-bold tracking-tight">3. Rig & Compressor Units (Garaged) ({historyRigCompressors.length})</CardTitle>
                                            <p className="text-xs text-muted-foreground mt-0.5">Decommissioned or garaged drilling machinery</p>
                                        </div>
                                    </CardHeader>
                                    <CardContent>
                                        <RigCompressorTable 
                                            data={historyRigCompressors} 
                                            onEdit={(v: RigCompressor) => handleAddOrEdit('rig', v)} 
                                            onDelete={deleteRigCompressor} 
                                            canEdit={canEdit}
                                            onView={handleView}
                                        />
                                    </CardContent>
                                </Card>
                            </div>

                        </div>
                    </TabsContent>
                </Tabs>
            )}

            <Dialog open={isDepartmentDialogOpen} onOpenChange={(isOpen) => { if (!isOpen) setEditingDepartmentVehicle(null); setIsDepartmentDialogOpen(isOpen); }}>
                <DialogContent onPointerDownOutside={(e) => e.preventDefault()} className="max-w-4xl flex flex-col p-0">
                    <DepartmentVehicleForm 
                        initialData={editingDepartmentVehicle}
                        onFormSubmit={handleDepartmentFormSubmit}
                        onClose={() => setIsDepartmentDialogOpen(false)}
                    />
                </DialogContent>
            </Dialog>
            <Dialog open={isHiredDialogOpen} onOpenChange={(isOpen) => { if (!isOpen) setEditingHiredVehicle(null); setIsHiredDialogOpen(isOpen); }}>
                 <DialogContent onPointerDownOutside={(e) => e.preventDefault()} className="max-w-4xl h-[90vh] flex flex-col p-0">
                     <HiredVehicleForm 
                        initialData={editingHiredVehicle}
                        onFormSubmit={handleHiredFormSubmit}
                        onClose={() => setIsHiredDialogOpen(false)}
                    />
                </DialogContent>
            </Dialog>
            <Dialog open={isRigDialogOpen} onOpenChange={(isOpen) => { if (!isOpen) setEditingRigCompressor(null); setIsRigDialogOpen(isOpen); }}>
                <DialogContent onPointerDownOutside={(e) => e.preventDefault()} className="max-w-2xl flex flex-col p-0">
                    <RigCompressorForm
                        initialData={editingRigCompressor}
                        onFormSubmit={handleRigCompressorFormSubmit}
                        onClose={() => setIsRigDialogOpen(false)}
                    />
                </DialogContent>
            </Dialog>
        </div>
    );
}
