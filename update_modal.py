import re

content = '''// src/components/database/PrintableReportModal.tsx
"use client";

import React, { useState, useMemo, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Printer, FileText, Globe, CheckCircle2, Building2, User, Landmark, DollarSign, Pencil, Check, X } from "lucide-react";
import type { DataEntryFormData, SiteDetailFormData } from "@/lib/schemas";
import { numberToWordsEnglish, numberToWordsMalayalam } from "@/lib/numberToWords";
import { useDataStore } from "@/hooks/use-data-store";
import { useAuth } from "@/hooks/useAuth";

export type ReportDocType =
  | 'completion_report'
  | 'final_bill'
  | 'abstract_final_bill'
  | 'proceedings'
  | 'utilization_certificate';

export type LanguageMode = 'ml' | 'en';

const DISTRICT_ML_MAP: Record<string, string> = {
  'thiruvananthapuram': 'തിരുവനന്തപുരം',
  'kollam': 'കൊല്ലം',
  'pathanamthitta': 'പത്തനംതിട്ട',
  'alappuzha': 'ആലപ്പുഴ',
  'kottayam': 'കോട്ടയം',
  'idukki': 'ഇടുക്കി',
  'ernakulam': 'എറണാകുളം',
  'thrissur': 'തൃശ്ശൂർ',
  'palakkad': 'പാലക്കാട്',
  'malappuram': 'മലപ്പുറം',
  'kozhikode': 'കോഴിക്കോട്',
  'wayanad': 'വയനാട്',
  'kannur': 'കണ്ണൂർ',
  'kasaragod': 'കാസർഗോഡ്',
  'directorate tvm': 'ഡയറക്ടറേറ്റ് തിരുവനന്തപുരം',
  'lab tvm': 'ലാബ് തിരുവനന്തപുരം',
  'lab ekm': 'ലാബ് എറണാകുളം',
  'lab kkd': 'ലാബ് കോഴിക്കോട്',
};

const getDistrictMl = (dist: string): string => {
  if (!dist) return 'പത്തനംതിട്ട';
  const key = dist.trim().toLowerCase();
  if (DISTRICT_ML_MAP[key]) return DISTRICT_ML_MAP[key];
  return dist;
};

interface PrintableReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  entry: DataEntryFormData | null;
  moduleType?: string; // 'collectors' | 'private' | 'plan-fund' | 'public' | etc.
  initialDocType?: ReportDocType;
}

export default function PrintableReportModal({
  isOpen,
  onClose,
  entry,
  moduleType = 'collectors',
  initialDocType = 'completion_report',
}: PrintableReportModalProps) {
  const { officeAddress, selectedOffice } = useDataStore();
  const { user } = useAuth();

  const isPrivateWork = moduleType === 'private' || (entry?.applicationType?.toLowerCase().includes('private') ?? false);
  const isDepositWork = moduleType === 'collectors' || moduleType === 'public' || moduleType === 'deposit' || !isPrivateWork;

  // Language & DocType state
  const [lang, setLang] = useState<LanguageMode>('ml');
  const [docType, setDocType] = useState<ReportDocType>(initialDocType);

  useEffect(() => {
    if (initialDocType) {
      setDocType(initialDocType);
    }
  }, [initialDocType, isOpen]);

  const rawSites = useMemo(() => entry?.siteDetails || [], [entry]);

  const sites = useMemo(() => {
    if (docType === 'final_bill' || docType === 'abstract_final_bill') {
      return rawSites.filter(s => s.purpose === 'BWC' || s.purpose === 'TWC');
    }
    return rawSites;
  }, [rawSites, docType]);
  
  const hasMultipleSites = sites.length > 1;

  // Selected site index
  const [selectedSiteIndex, setSelectedSiteIndex] = useState<number>(0);

  useEffect(() => {
    setSelectedSiteIndex(0);
  }, [docType, isOpen]);

  const currentSite: SiteDetailFormData | undefined = sites[selectedSiteIndex] || sites[0];

  // Currently editing row key (null if none)
  const [editingRow, setEditingRow] = useState<string | null>(null);

  // Editable Form Fields for fine-tuning & document generation
  const [district, setDistrict] = useState<string>('Pathanamthitta');
  const [districtMl, setDistrictMl] = useState<string>('പത്തനംതിട്ട');
  const [subOfficeLocation, setSubOfficeLocation] = useState<string>('');
  const [subOfficeLocationMl, setSubOfficeLocationMl] = useState<string>('');
  const [officerName, setOfficerName] = useState<string>('District Officer');
  const [officerDesignation, setOfficerDesignation] = useState<string>('Executive Engineer');
  
  // Ref Nos, Dates, Applicant & Site Details
  const [fileNo, setFileNo] = useState<string>('');
  const [applicantName, setApplicantName] = useState<string>('');
  const [applicantAddress, setApplicantAddress] = useState<string>('');
  const [siteName, setSiteName] = useState<string>('');
  const [latitude, setLatitude] = useState<string>('');
  const [longitude, setLongitude] = useState<string>('');
  const [localSelfGovt, setLocalSelfGovt] = useState<string>('');
  const [constituency, setConstituency] = useState<string>('');
  const [applicationType, setApplicationType] = useState<string>('');
  const [surveyRecommendedTD, setSurveyRecommendedTD] = useState<string>('');
  const [surveyRecommendedOB, setSurveyRecommendedOB] = useState<string>('');
  const [surveyLocation, setSurveyLocation] = useState<string>('');

  // Drilling Details (Actuals) - fetched from Add new site popup / Site details
  const [diameter, setDiameter] = useState<string>('Ø 110 മില്ലീമീറ്റർ (Ø 4.5")');
  const [depthMeter, setDepthMeter] = useState<number>(0);
  const [casing10kgQty, setCasing10kgQty] = useState<number>(0);
  const [casing6kgQty, setCasing6kgQty] = useState<number>(0);
  const [innerCasingQty, setInnerCasingQty] = useState<number>(0);
  const [endCap, setEndCap] = useState<string>('No');
  const [yieldLph, setYieldLph] = useState<number>(0);
  const [waterStruckZone, setWaterStruckZone] = useState<string>('');
  const [staticWaterLevel, setStaticWaterLevel] = useState<number>(0);
  const [rigUsed, setRigUsed] = useState<string>('Disassembled Rig + Atlas Copco Compressor');
  const [contractorName, setContractorName] = useState<string>('');
  const [periodFrom, setPeriodFrom] = useState<string>('');
  const [periodTo, setPeriodTo] = useState<string>('');
  const [remarks, setRemarks] = useState<string>('');

  // Financial & Rates editable values
  const [drillingRate, setDrillingRate] = useState<number>(390);
  const [casing10kgRate, setCasing10kgRate] = useState<number>(960);
  const [casing6kgRate, setCasing6kgRate] = useState<number>(580);
  const [innerCasingRate, setInnerCasingRate] = useState<number>(225);
  
  const [drillingQty, setDrillingQty] = useState<number>(0);
  const [subsidyAmount, setSubsidyAmount] = useState<number>(0);
  const [advanceDeposit, setAdvanceDeposit] = useState<number>(0);
  const [ddDetails, setDdDetails] = useState<string>('');

  // Bank refund details & Proceedings state
  const [orderNo, setOrderNo] = useState<string>('');
  const [orderDate, setOrderDate] = useState<string>('');
  const [refLetterNo, setRefLetterNo] = useState<string>('');
  const [refLetterDate, setRefLetterDate] = useState<string>('');
  const [bankAccountNo, setBankAccountNo] = useState<string>('85829024542');
  const [bankIfsc, setBankIfsc] = useState<string>('SBIN0012880');
  const [bankName, setBankName] = useState<string>('SBI');
  const [bankBranch, setBankBranch] = useState<string>('');
  const [proceedingsSubject, setProceedingsSubject] = useState<string>('');
  const [proceedingsRef1, setProceedingsRef1] = useState<string>('');
  const [proceedingsRef2, setProceedingsRef2] = useState<string>('');

  // Utilization Certificate state
  const [ucPhone, setUcPhone] = useState<string>('0474 - 2790313');
  const [ucEmail, setUcEmail] = useState<string>('gwdklm@gmail.com');
  const [ucFrom, setUcFrom] = useState<string>('');
  const [ucTo, setUcTo] = useState<string>('');
  const [ucSubject, setUcSubject] = useState<string>('');
  const [ucRef1, setUcRef1] = useState<string>('');
  const [ucRef2, setUcRef2] = useState<string>('');

  // Populate default state from logged-in user, office store, entry, and site
  useEffect(() => {
    const effectiveOffice = entry?.officeLocation || selectedOffice || user?.officeLocation || officeAddress?.officeLocation || 'Pathanamthitta';
    const formattedDistrict = effectiveOffice.charAt(0).toUpperCase() + effectiveOffice.slice(1);
    setDistrict(formattedDistrict);
    setDistrictMl(getDistrictMl(formattedDistrict));

    const rawSubOffice = (entry as any)?.subOfficeLocation || (entry as any)?.subOffice || officeAddress?.officeName || '';
    if (rawSubOffice) {
      setSubOfficeLocation(rawSubOffice);
      setSubOfficeLocationMl(officeAddress?.officeNameMalayalam || rawSubOffice);
    }
  }, [entry, selectedOffice, user, officeAddress]);

  useEffect(() => {
    if (!entry) return;

    const fNo = entry.fileNo || 'GWD/1372/2022';
    setFileNo(fNo);
    setApplicantName(entry.applicantName || '');
    setApplicantAddress(entry.applicantAddress || '');
    setApplicationType(entry.applicationType || moduleType.toUpperCase());

    const ordNo = `GWD/${fNo.replace(/\//g, '-')}/2026`;
    setOrderNo(ordNo);
    const todayStr = new Date().toISOString().split('T')[0];
    setOrderDate(todayStr);
    const refNo = `AE/1/${fNo}`;
    setRefLetterNo(refNo);
    setRefLetterDate(todayStr);

    // Financial remittance
    const depositTotal = entry.remittanceDetails?.reduce((sum, r) => sum + (Number(r.amountRemitted) || 0), 0) || 33210;
    setAdvanceDeposit(depositTotal);
    const firstRemittance = entry.remittanceDetails?.[0];
    const ddStr = firstRemittance
      ? `DD No. ${firstRemittance.remittanceRemarks || '930140'} Dated ${firstRemittance.dateOfRemittance || ''}`
      : 'DD No. 930140 dated 10/05/2023';
    setDdDetails(ddStr);

    if (currentSite) {
      setSiteName(currentSite.nameOfSite || entry.applicantName || '');
      setLatitude(currentSite.latitude || '');
      setLongitude(currentSite.longitude || '');
      setLocalSelfGovt(currentSite.localSelfGovt || '');
      setConstituency(currentSite.constituency || '');
      setSurveyRecommendedTD(currentSite.surveyRecommendedTD || '90 മീറ്റർ');
      setSurveyRecommendedOB(currentSite.surveyRecommendedOB || currentSite.surveyOB || '8 മീറ്റർ');
      setSurveyLocation(currentSite.surveyLocation || '');

      const depth = Number(currentSite.totalDepth) || 0;
      setDepthMeter(depth);
      setDrillingQty(depth);

      setDiameter(currentSite.diameter || 'Ø 110 മില്ലീമീറ്റർ (Ø 4.5")');

      const c10 = Number(currentSite.casing10kgPipe) || 0;
      setCasing10kgQty(c10);
      const c6 = Number(currentSite.casing6kgPipe) || 0;
      setCasing6kgQty(c6);
      const innerQty = Number(currentSite.innerCasingPipe) || Number(currentSite.innerCasing6kgPipe) || Number(currentSite.innerCasing4kgPipe) || 0;
      setInnerCasingQty(innerQty);

      setEndCap(currentSite.endCap || 'No');

      const yl = Number(currentSite.yieldDischarge) || 0;
      setYieldLph(yl);

      setWaterStruckZone(currentSite.zoneDetails || '');

      const wl = Number(currentSite.waterLevel) || 0;
      setStaticWaterLevel(wl);

      let rigStr = currentSite.typeOfRig || '';
      if (currentSite.drillingRigNo) rigStr += ` (Rig: ${currentSite.drillingRigNo})`;
      if (currentSite.compressorNo) rigStr += ` (Comp: ${currentSite.compressorNo})`;
      setRigUsed(rigStr || 'Disassembled Rig + Atlas Copco Compressor');

      setContractorName(currentSite.contractorName || '');
      setPeriodFrom(currentSite.dateOfCommencement || '30/05/2024');
      setPeriodTo(currentSite.dateOfCompletion || '31/05/2024');
      setRemarks(currentSite.drillingRemarks || currentSite.workRemarks || '');
    }

    setProceedingsSubject(
      `GWD, ${district} - Construction of borewell at ${entry.applicantName || ''}${entry.applicantAddress ? `, ${entry.applicantAddress}` : ''} - Refund of balance amount and remittance of drilling charges to revenue head - Sanctioned - Orders issued - reg.`
    );
    setProceedingsRef1(`1. Application of ${entry.applicantName || ''} and DD details (${ddStr}).`);
    setProceedingsRef2(`2. Final Bill of this office, dated ${todayStr}.`);

    setUcFrom(`District Officer, Ground Water Department, ${district}`);
    setUcTo(`Assistant Engineer, ${currentSite?.localSelfGovt || 'Gramapanchayat'}`);
    setUcSubject(
      `ഭൂജല വകുപ്പ്, ${districtMl} - ${currentSite?.localSelfGovt || 'പഞ്ചായത്ത്'} കുടിവെള്ള പദ്ധതി - കുഴൽകിണർ നിർമ്മാണം - ധനവിനിയോഗ സാക്ഷ്യപത്രം നൽകുന്നത് സംബന്ധിച്ച്.`
    );
    setUcRef1(`1. കത്ത് നമ്പർ ${refNo} തീയതി ${todayStr}`);
    setUcRef2(`2. പൂർത്തീകരണ റിപ്പോർട്ട് & ഫൈനൽ ബിൽ`);
  }, [entry, currentSite, selectedSiteIndex, moduleType, district, districtMl]);

  // Derived Calculations
  const drillingTotal = drillingRate * drillingQty;
  const casing10kgTotal = casing10kgRate * casing10kgQty;
  const casing6kgTotal = casing6kgRate * casing6kgQty;
  const innerCasingTotal = innerCasingRate * innerCasingQty;

  const totalExpenditure = drillingTotal + casing10kgTotal + casing6kgTotal + innerCasingTotal;
  const netPayableGwd = totalExpenditure - subsidyAmount;
  const balanceRefund = advanceDeposit - netPayableGwd;

  // Casing pipe label based on diameter
  const casingDiameterLabel = useMemo(() => {
    if (diameter.includes('150') || diameter.includes('6')) {
      return '180 mm';
    }
    return '140 mm';
  }, [diameter]);

  // Handle document switching rules
  useEffect(() => {
    if (docType === 'abstract_final_bill' && !hasMultipleSites) {
      setDocType('final_bill');
    }
    if (docType === 'proceedings' && !isPrivateWork) {
      setDocType('completion_report');
    }
    if (docType === 'utilization_certificate' && !isDepositWork) {
      setDocType('completion_report');
    }
  }, [docType, hasMultipleSites, isPrivateWork, isDepositWork]);

  const handlePrint = () => {
    setTimeout(() => {
      window.print();
    }, 50);
  };

  // Helper function to render inline editable cell / row
  const renderEditableCell = (
    rowKey: string,
    displayContent: React.ReactNode,
    editControl: React.ReactNode
  ) => {
    const isEditing = editingRow === rowKey;
    return (
      <div className="flex items-center justify-between gap-2 w-full">
        {isEditing ? (
          <div className="flex items-center gap-1.5 w-full print:hidden">
            <div className="flex-1">{editControl}</div>
            <Button
              size="icon"
              variant="ghost"
              className="h-6 w-6 text-green-700 hover:bg-green-100 shrink-0"
              onClick={() => setEditingRow(null)}
              title="Save row"
            >
              <Check className="h-3.5 w-3.5" />
            </Button>
          </div>
        ) : (
          <>
            <div className="flex-1">{displayContent}</div>
            <Button
              size="icon"
              variant="ghost"
              className="h-5 w-5 opacity-40 hover:opacity-100 print:hidden text-primary shrink-0 ml-1"
              onClick={() => setEditingRow(rowKey)}
              title="Edit row"
            >
              <Pencil className="h-3 w-3" />
            </Button>
          </>
        )}
      </div>
    );
  };

  if (!entry) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[92vh] overflow-y-auto p-4 sm:p-6 print:p-0 print:max-w-none print:shadow-none print:border-none print:m-0">
        
        {/* Controls - Hidden during Printing */}
        <div className="print:hidden no-print space-y-4">
          <DialogHeader className="border-b pb-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <DialogTitle className="text-xl font-bold flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary" />
                  Printable Official Reports & Completion Documents
                </DialogTitle>
                <DialogDescription className="text-xs sm:text-sm">
                  Generate official GWD Kerala Completion Reports, Final Bills, Proceedings & Utilization Certificates.
                </DialogDescription>
              </div>

              {/* Language Selector & Print Button */}
              <div className="flex items-center gap-2">
                <Tabs value={lang} onValueChange={(val) => setLang(val as LanguageMode)} className="w-auto">
                  <TabsList className="grid grid-cols-2 w-36">
                    <TabsTrigger value="ml" className="text-xs font-semibold">മലയാളം</TabsTrigger>
                    <TabsTrigger value="en" className="text-xs font-semibold">English</TabsTrigger>
                  </TabsList>
                </Tabs>

                <Button onClick={handlePrint} className="bg-primary text-primary-foreground gap-1.5 shadow">
                  <Printer className="h-4 w-4" />
                  Print / Save PDF
                </Button>
              </div>
            </div>
          </DialogHeader>

          {/* Document Type Selector & Site / Office Controls */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 bg-muted/40 p-3 rounded-lg border">
            <div>
              <Label className="text-xs font-semibold">Select Document Type</Label>
              <Select value={docType} onValueChange={(val) => setDocType(val as ReportDocType)}>
                <SelectTrigger className="h-9 bg-background mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="completion_report">
                    {lang === 'ml' ? 'പൂർത്തീകരണ റിപ്പോർട്ട് (Completion Report)' : 'Completion Report'}
                  </SelectItem>
                  <SelectItem value="final_bill">
                    {lang === 'ml' ? 'ഫൈനൽ ബിൽ (Final Bill)' : 'Final Bill'}
                  </SelectItem>
                  {hasMultipleSites && (
                    <SelectItem value="abstract_final_bill">
                      {lang === 'ml' ? 'അബ്‌സ്ട്രാക്ട് ഫൈനൽ ബിൽ (Abstract Final Bill)' : 'Abstract of Final Bill'}
                    </SelectItem>
                  )}
                  {isPrivateWork && (
                    <SelectItem value="proceedings">
                      {lang === 'ml' ? 'നടപടിക്രമങ്ങൾ (District Officer Proceedings)' : 'District Officer Proceedings'}
                    </SelectItem>
                  )}
                  {isDepositWork && (
                    <SelectItem value="utilization_certificate">
                      {lang === 'ml' ? 'ധനവിനിയോഗ സാക്ഷ്യപത്രം (Utilization Certificate)' : 'Utilization Certificate'}
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* Site selector if site-specific doc */}
            {(docType === 'completion_report' || docType === 'final_bill') ? (
              <div>
                <Label className="text-xs font-semibold">Select Work Site</Label>
                <Select value={String(selectedSiteIndex)} onValueChange={(val) => setSelectedSiteIndex(Number(val))}>
                  <SelectTrigger className="h-9 bg-background mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {sites.map((s, idx) => (
                      <SelectItem key={idx} value={String(idx)}>
                        Site #{idx + 1}: {s.nameOfSite} ({s.purpose || 'BWC'})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : (
              <div>
                <Label className="text-xs font-semibold">Work Application Type</Label>
                <Input
                  className="h-9 bg-background text-xs mt-1"
                  disabled
                  value={entry.applicationType || moduleType.toUpperCase()}
                />
              </div>
            )}

            <div>
              <Label className="text-xs font-semibold">District / Office Location</Label>
              <div className="flex gap-1 mt-1">
                <Input
                  className="h-9 bg-background text-xs"
                  placeholder="English District"
                  value={district}
                  onChange={(e) => setDistrict(e.target.value)}
                />
                <Input
                  className="h-9 bg-background text-xs"
                  placeholder="മലയാളം ജില്ല"
                  value={districtMl}
                  onChange={(e) => setDistrictMl(e.target.value)}
                />
              </div>
            </div>

            <div>
              <Label className="text-xs font-semibold">Sub Office Location (സബ് ഓഫീസ്)</Label>
              <div className="flex gap-1 mt-1">
                <Input
                  className="h-9 bg-background text-xs"
                  placeholder="Sub Office (English)"
                  value={subOfficeLocation}
                  onChange={(e) => setSubOfficeLocation(e.target.value)}
                />
                <Input
                  className="h-9 bg-background text-xs"
                  placeholder="സബ് ഓഫീസ് (മലയാളം)"
                  value={subOfficeLocationMl}
                  onChange={(e) => setSubOfficeLocationMl(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Quick Edit Drawer */}
          <details className="bg-background border rounded-md p-2 text-xs">
            <summary className="font-bold cursor-pointer text-primary flex items-center justify-between">
              <span>🛠️ Fine-tune Report Numbers, Rates & Bank Details</span>
              <span className="text-muted-foreground font-normal">Click to edit global details</span>
            </summary>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 pt-3 border-t mt-2">
              <div>
                <Label className="text-[11px]">File No.</Label>
                <Input className="h-8 text-xs" value={fileNo} onChange={(e) => setFileNo(e.target.value)} />
              </div>
              <div>
                <Label className="text-[11px]">Drilling Rate (Rs/m)</Label>
                <Input className="h-8 text-xs" type="number" value={drillingRate} onChange={(e) => setDrillingRate(Number(e.target.value))} />
              </div>
              <div>
                <Label className="text-[11px]">Drilling Depth (m)</Label>
                <Input className="h-8 text-xs" type="number" value={drillingQty} onChange={(e) => { const v = Number(e.target.value); setDrillingQty(v); setDepthMeter(v); }} />
              </div>
              <div>
                <Label className="text-[11px]">Advance Deposit (Rs)</Label>
                <Input className="h-8 text-xs" type="number" value={advanceDeposit} onChange={(e) => setAdvanceDeposit(Number(e.target.value))} />
              </div>

              <div>
                <Label className="text-[11px]">Casing 10kg Rate (Rs/m)</Label>
                <Input className="h-8 text-xs" type="number" value={casing10kgRate} onChange={(e) => setCasing10kgRate(Number(e.target.value))} />
              </div>
              <div>
                <Label className="text-[11px]">Casing 10kg Qty (m)</Label>
                <Input className="h-8 text-xs" type="number" value={casing10kgQty} onChange={(e) => setCasing10kgQty(Number(e.target.value))} />
              </div>
              <div>
                <Label className="text-[11px]">Casing 6kg Rate (Rs/m)</Label>
                <Input className="h-8 text-xs" type="number" value={casing6kgRate} onChange={(e) => setCasing6kgRate(Number(e.target.value))} />
              </div>
              <div>
                <Label className="text-[11px]">Casing 6kg Qty (m)</Label>
                <Input className="h-8 text-xs" type="number" value={casing6kgQty} onChange={(e) => setCasing6kgQty(Number(e.target.value))} />
              </div>

              <div>
                <Label className="text-[11px]">Subsidy Amount (Rs)</Label>
                <Input className="h-8 text-xs" type="number" value={subsidyAmount} onChange={(e) => setSubsidyAmount(Number(e.target.value))} />
              </div>
              <div>
                <Label className="text-[11px]">Contractor Name (if tender)</Label>
                <Input className="h-8 text-xs" value={contractorName} onChange={(e) => setContractorName(e.target.value)} />
              </div>
              <div>
                <Label className="text-[11px]">Bank Account No (Refund)</Label>
                <Input className="h-8 text-xs" value={bankAccountNo} onChange={(e) => setBankAccountNo(e.target.value)} placeholder="e.g. 85829024542" />
              </div>
              <div>
                <Label className="text-[11px]">IFSC & Bank Branch</Label>
                <Input className="h-8 text-xs" value={bankIfsc} onChange={(e) => setBankIfsc(e.target.value)} placeholder="e.g. SBIN0012880, SBI" />
              </div>
            </div>
          </details>
        </div>

        {/* PRINTABLE DOCUMENT CANVAS */}
        <div className="bg-white text-black p-6 sm:p-10 border shadow-sm font-sans rounded-none print:border-none print:shadow-none print:p-0 print:m-0 text-[13px] leading-relaxed">
          
          {/* 1. COMPLETION REPORT (MALAYALAM & ENGLISH) */}
          {docType === 'completion_report' && (
            <div className="space-y-4">
              {lang === 'ml' ? (
                <>
                  <div className="text-center space-y-1 pb-2 border-b-2 border-black">
                    <h2 className="text-lg font-bold">ഭൂജലവകുപ്പ്, ജില്ലാ ഓഫീസ്, {districtMl}</h2>
                    <h3 className="text-base font-bold underline">പൂർത്തീകരണറിപ്പോർട്ട് - {currentSite?.purpose === 'TWC' ? 'റ്റ്യൂബ് കിണർ നിർമ്മാണം' : 'കുഴൽകിണർ നിർമ്മാണം'}</h3>
                  </div>

                  <table className="w-full border-collapse text-xs">
                    <tbody>
                      <tr className="border-b">
                        <td className="py-1.5 font-bold w-2/5">1. ഫയൽ നമ്പർ</td>
                        <td className="py-1.5 w-3/5">
                          {renderEditableCell('cr_fileNo', `: ${fileNo}`, <Input className="h-6 text-xs" value={fileNo} onChange={e => setFileNo(e.target.value)} />)}
                        </td>
                      </tr>
                      <tr className="border-b">
                        <td className="py-1.5 font-bold">2. അപേക്ഷകന്റെ പേരും മേൽവിലാസവും</td>
                        <td className="py-1.5">
                          {renderEditableCell('cr_applicant', `: ${applicantName}${applicantAddress ? `, ${applicantAddress}` : ''}`, 
                            <div className="flex gap-1">
                              <Input className="h-6 text-xs" placeholder="പേര്" value={applicantName} onChange={e => setApplicantName(e.target.value)} />
                              <Input className="h-6 text-xs" placeholder="മേൽവിലാസം" value={applicantAddress} onChange={e => setApplicantAddress(e.target.value)} />
                            </div>
                          )}
                        </td>
                      </tr>
                      <tr className="border-b">
                        <td className="py-1.5 font-bold">3. സൈറ്റിന്റെ പേര് / സ്ഥലം</td>
                        <td className="py-1.5">
                          {renderEditableCell('cr_siteName', `: ${siteName}`, <Input className="h-6 text-xs" value={siteName} onChange={e => setSiteName(e.target.value)} />)}
                        </td>
                      </tr>
                      <tr className="border-b">
                        <td className="py-1.5 font-bold">4. ലാറ്റിറ്റ്യൂഡ് / ലാംഗിറ്റ്യൂഡ്</td>
                        <td className="py-1.5">
                          {renderEditableCell('cr_latLong', `: ${latitude && longitude ? `${latitude}, ${longitude}` : (latitude || longitude || 'N/A')}`, 
                            <div className="flex gap-1">
                              <Input className="h-6 text-xs" placeholder="Lat" value={latitude} onChange={e => setLatitude(e.target.value)} />
                              <Input className="h-6 text-xs" placeholder="Long" value={longitude} onChange={e => setLongitude(e.target.value)} />
                            </div>
                          )}
                        </td>
                      </tr>
                      <tr className="border-b">
                        <td className="py-1.5 font-bold">5. തദ്ദേശസ്വയംഭരണ സ്ഥാപനം, വാർഡ്</td>
                        <td className="py-1.5">
                          {renderEditableCell('cr_lsgd', `: ${localSelfGovt || 'N/A'}`, <Input className="h-6 text-xs" value={localSelfGovt} onChange={e => setLocalSelfGovt(e.target.value)} />)}
                        </td>
                      </tr>
                      <tr className="border-b">
                        <td className="py-1.5 font-bold">6. നിയമസഭാമണ്ഡലം</td>
                        <td className="py-1.5">
                          {renderEditableCell('cr_constituency', `: ${constituency || 'N/A'}`, <Input className="h-6 text-xs" value={constituency} onChange={e => setConstituency(e.target.value)} />)}
                        </td>
                      </tr>
                      <tr className="border-b">
                        <td className="py-1.5 font-bold">7. പദ്ധതി / ഉദ്ദേശ്യം</td>
                        <td className="py-1.5">
                          {renderEditableCell('cr_appType', `: ${applicationType}`, <Input className="h-6 text-xs" value={applicationType} onChange={e => setApplicationType(e.target.value)} />)}
                        </td>
                      </tr>
                      <tr className="border-b">
                        <td className="py-1.5 font-bold">8. ശുപാർശ ചെയ്ത ആഴവും മേൽമണ്ണിന്റെ ഘനവും</td>
                        <td className="py-1.5">
                          {renderEditableCell('cr_recommended', `: ${surveyRecommendedTD}, ${surveyRecommendedOB}`, 
                            <div className="flex gap-1">
                              <Input className="h-6 text-xs" placeholder="ആഴം" value={surveyRecommendedTD} onChange={e => setSurveyRecommendedTD(e.target.value)} />
                              <Input className="h-6 text-xs" placeholder="മേൽമണ്ണ്" value={surveyRecommendedOB} onChange={e => setSurveyRecommendedOB(e.target.value)} />
                            </div>
                          )}
                        </td>
                      </tr>
                      <tr className="border-b">
                        <td className="py-1.5 font-bold">9. കുഴൽകിണറിന്റെ സ്ഥാനം</td>
                        <td className="py-1.5">
                          {renderEditableCell('cr_surveyLoc', `: ${surveyLocation || 'പ്രസ്തുത സ്ഥലത്ത് അപേക്ഷകന്റെ പുരയിടത്തിലെ വടക്ക് കിഴക്കേ മൂലയ്ക്കായി സ്ഥാനം നിർണ്ണയിച്ചിരിക്കുന്നു.'}`, <Textarea className="min-h-[40px] text-xs p-1" value={surveyLocation} onChange={e => setSurveyLocation(e.target.value)} />)}
                        </td>
                      </tr>
                      <tr className="border-b">
                        <td className="py-1.5 font-bold">10. പ്രവൃത്തിക്ക് ഉപയോഗിച്ച റിഗ്</td>
                        <td className="py-1.5">
                          {renderEditableCell('cr_rigUsed', `: ${rigUsed}`, <Input className="h-6 text-xs" value={rigUsed} onChange={e => setRigUsed(e.target.value)} />)}
                        </td>
                      </tr>
                      <tr className="border-b">
                        <td className="py-1.5 font-bold">11. കുഴൽകിണറിന്റെ വ്യാസം</td>
                        <td className="py-1.5">
                          {renderEditableCell('cr_diameter', `: ${diameter}`, <Input className="h-6 text-xs" value={diameter} onChange={e => setDiameter(e.target.value)} />)}
                        </td>
                      </tr>
                      <tr className="border-b">
                        <td className="py-1.5 font-bold">12. കുഴൽകിണറിന്റെ ആഴം</td>
                        <td className="py-1.5">
                          {renderEditableCell('cr_depth', `: ${depthMeter} മീറ്റർ`, <Input type="number" className="h-6 text-xs w-28" value={depthMeter} onChange={e => { const val = Number(e.target.value); setDepthMeter(val); setDrillingQty(val); }} />)}
                        </td>
                      </tr>
                      <tr className="border-b">
                        <td className="py-1.5 font-bold">13. മേൽമണ്ണിന്റെ ഘനം</td>
                        <td className="py-1.5">
                          {renderEditableCell('cr_ob', `: ${casing10kgQty + casing6kgQty || 8.5} മീറ്റർ`, <Input type="number" className="h-6 text-xs w-28" value={casing10kgQty + casing6kgQty} onChange={e => setCasing10kgQty(Number(e.target.value))} />)}
                        </td>
                      </tr>
                      <tr className="border-b">
                        <td className="py-1.5 font-bold">14. ഉപയോഗിച്ച കേസിംഗ് പൈപ്പ്</td>
                        <td className="py-1.5">
                          {renderEditableCell('cr_casingDetails', 
                            <span>
                              : {casingDiameterLabel} വ്യാസം, 10 kg/cm² : {casing10kgQty ? `${casing10kgQty} മീറ്റർ` : 'ഇല്ല'} <br />
                              &nbsp; {casingDiameterLabel} വ്യാസം, 6 kg/cm² : {casing6kgQty ? `${casing6kgQty} മീറ്റർ` : 'ഇല്ല'} <br />
                              &nbsp; ഇന്നർ കേസിംഗ് (110 mm, 4 kg/cm²) : {innerCasingQty ? `${innerCasingQty} മീറ്റർ` : 'ഇല്ല'}
                            </span>, 
                            <div className="grid grid-cols-3 gap-1">
                              <Input type="number" placeholder="10kg" className="h-6 text-xs" value={casing10kgQty} onChange={e => setCasing10kgQty(Number(e.target.value))} />
                              <Input type="number" placeholder="6kg" className="h-6 text-xs" value={casing6kgQty} onChange={e => setCasing6kgQty(Number(e.target.value))} />
                              <Input type="number" placeholder="Inner" className="h-6 text-xs" value={innerCasingQty} onChange={e => setInnerCasingQty(Number(e.target.value))} />
                            </div>
                          )}
                        </td>
                      </tr>
                      <tr className="border-b">
                        <td className="py-1.5 font-bold">15. കുഴൽകിണറിന്റെ അടിപ്പിന്റെ വിവരം (End Cap)</td>
                        <td className="py-1.5">
                          {renderEditableCell('cr_endCap', `: ${endCap === 'Yes' ? `1 എണ്ണം (${casingDiameterLabel} വ്യാസം)` : 'ഇല്ല'}`, 
                            <Select value={endCap} onValueChange={setEndCap}>
                              <SelectTrigger className="h-6 text-xs"><SelectValue /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Yes">Yes (ഉണ്ട് - 1 എണ്ണം)</SelectItem>
                                <SelectItem value="No">No (ഇല്ല)</SelectItem>
                              </SelectContent>
                            </Select>
                          )}
                        </td>
                      </tr>
                      <tr className="border-b">
                        <td className="py-1.5 font-bold">16. ജലലഭ്യത (മണിക്കൂറിൽ)</td>
                        <td className="py-1.5">
                          {renderEditableCell('cr_yield', `: ${yieldLph} ലിറ്റർ പ്രതി മണിക്കൂർ`, <Input type="number" className="h-6 text-xs w-28" value={yieldLph} onChange={e => setYieldLph(Number(e.target.value))} />)}
                        </td>
                      </tr>
                      <tr className="border-b">
                        <td className="py-1.5 font-bold">17. ജലം ലഭിച്ച മേഖല</td>
                        <td className="py-1.5">
                          {renderEditableCell('cr_zone', `: ${waterStruckZone || 'N/A'}`, <Input className="h-6 text-xs" value={waterStruckZone} onChange={e => setWaterStruckZone(e.target.value)} />)}
                        </td>
                      </tr>
                      <tr className="border-b">
                        <td className="py-1.5 font-bold">18. ജലനിരപ്പ് (ഭൂനിരപ്പിൽ നിന്ന് താഴേക്ക്)</td>
                        <td className="py-1.5">
                          {renderEditableCell('cr_swl', `: ${staticWaterLevel} മീറ്റർ`, <Input type="number" className="h-6 text-xs w-28" value={staticWaterLevel} onChange={e => setStaticWaterLevel(Number(e.target.value))} />)}
                        </td>
                      </tr>
                      <tr className="border-b">
                        <td className="py-1.5 font-bold">19. പ്രവർത്തന കാലയളവ്</td>
                        <td className="py-1.5">
                          {renderEditableCell('cr_period', `: ${periodFrom || 'N/A'} മുതൽ ${periodTo || 'N/A'} വരെ`, 
                            <div className="flex gap-1">
                              <Input className="h-6 text-xs" placeholder="From" value={periodFrom} onChange={e => setPeriodFrom(e.target.value)} />
                              <Input className="h-6 text-xs" placeholder="To" value={periodTo} onChange={e => setPeriodTo(e.target.value)} />
                            </div>
                          )}
                        </td>
                      </tr>
                      <tr className="border-b">
                        <td className="py-1.5 font-bold">20. കുറിപ്പ്</td>
                        <td className="py-1.5">
                          {renderEditableCell('cr_remarks', `: ${remarks || 'പാറകഷ്ണങ്ങൾ വരുന്നത് മൂലം ഹാമർ റൊട്ടേഷൻ തടസ്സപ്പെട്ടതിനാൽ നിർദ്ദിഷ്ട ആഴത്തിൽ വർക്ക് പൂർത്തിയാക്കി.'}`, <Textarea className="min-h-[40px] text-xs p-1" value={remarks} onChange={e => setRemarks(e.target.value)} />)}
                        </td>
                      </tr>
                      <tr className="border-b">
                        <td className="py-1.5 font-bold">21. കോൺട്രാക്ടറുടെ പേര്</td>
                        <td className="py-1.5">
                          {renderEditableCell('cr_contractor', `: ${contractorName || 'Departmental Rig Work'}`, <Input className="h-6 text-xs" value={contractorName} onChange={e => setContractorName(e.target.value)} />)}
                        </td>
                      </tr>
                    </tbody>
                  </table>

                  <div className="pt-12 grid grid-cols-4 text-center font-bold text-xs">
                    <div>സൈറ്റ് - ഇൻ - ചാർജ്</div>
                    <div>അസി. എഞ്ചിനീയർ</div>
                    <div>അസി. എക്സി. എഞ്ചിനീയർ</div>
                    <div>ജില്ലാ ഓഫീസർ</div>
                  </div>
                </>
              ) : (
                <>
                  <div className="text-center space-y-1 pb-2 border-b-2 border-black">
                    <h2 className="text-lg font-bold uppercase">GROUND WATER DEPARTMENT, DISTRICT OFFICE, {district}</h2>
                    <h3 className="text-base font-bold underline">{currentSite?.purpose === 'TWC' ? 'TUBE WELL COMPLETION REPORT' : 'BORE WELL COMPLETION REPORT'}</h3>
                  </div>

                  <div className="flex justify-between font-mono font-bold py-1">
                    <span>File No: {fileNo}</span>
                    <span>Date: {orderDate}</span>
                  </div>

                  <table className="w-full border-collapse text-xs">
                    <tbody>
                      <tr className="border-b">
                        <td className="py-1.5 font-bold w-2/5">1. Name of Site / Applicant</td>
                        <td className="py-1.5 w-3/5">
                          {renderEditableCell('cr_en_applicant', `: ${applicantName}, ${siteName}`, 
                            <div className="flex gap-1">
                              <Input className="h-6 text-xs" value={applicantName} onChange={e => setApplicantName(e.target.value)} />
                              <Input className="h-6 text-xs" value={siteName} onChange={e => setSiteName(e.target.value)} />
                            </div>
                          )}
                        </td>
                      </tr>
                      <tr className="border-b">
                        <td className="py-1.5 font-bold">2. Local Self Govt. / Ward</td>
                        <td className="py-1.5">
                          {renderEditableCell('cr_en_lsgd', `: ${localSelfGovt}`, <Input className="h-6 text-xs" value={localSelfGovt} onChange={e => setLocalSelfGovt(e.target.value)} />)}
                        </td>
                      </tr>
                      <tr className="border-b">
                        <td className="py-1.5 font-bold">3. Period of Work</td>
                        <td className="py-1.5">
                          {renderEditableCell('cr_en_period', `: ${periodFrom} to ${periodTo}`, 
                            <div className="flex gap-1">
                              <Input className="h-6 text-xs" value={periodFrom} onChange={e => setPeriodFrom(e.target.value)} />
                              <Input className="h-6 text-xs" value={periodTo} onChange={e => setPeriodTo(e.target.value)} />
                            </div>
                          )}
                        </td>
                      </tr>
                      <tr className="border-b">
                        <td className="py-1.5 font-bold">4. Drilling Rig / Machinery Used</td>
                        <td className="py-1.5">
                          {renderEditableCell('cr_en_rig', `: ${rigUsed}`, <Input className="h-6 text-xs" value={rigUsed} onChange={e => setRigUsed(e.target.value)} />)}
                        </td>
                      </tr>
                      <tr className="border-b">
                        <td className="py-1.5 font-bold">5. Diameter of Borewell</td>
                        <td className="py-1.5">
                          {renderEditableCell('cr_en_dia', `: ${diameter}`, <Input className="h-6 text-xs" value={diameter} onChange={e => setDiameter(e.target.value)} />)}
                        </td>
                      </tr>
                      <tr className="border-b">
                        <td className="py-1.5 font-bold">6. Total Depth Drilled</td>
                        <td className="py-1.5">
                          {renderEditableCell('cr_en_depth', `: ${depthMeter} meters`, <Input type="number" className="h-6 text-xs w-28" value={depthMeter} onChange={e => { const v = Number(e.target.value); setDepthMeter(v); setDrillingQty(v); }} />)}
                        </td>
                      </tr>
                      <tr className="border-b">
                        <td className="py-1.5 font-bold">7. Overburden Thickness</td>
                        <td className="py-1.5">
                          {renderEditableCell('cr_en_ob', `: ${casing10kgQty + casing6kgQty} meters`, <Input type="number" className="h-6 text-xs w-28" value={casing10kgQty + casing6kgQty} onChange={e => setCasing10kgQty(Number(e.target.value))} />)}
                        </td>
                      </tr>
                      <tr className="border-b">
                        <td className="py-1.5 font-bold">8. Casing Pipe Lowered</td>
                        <td className="py-1.5">
                          {renderEditableCell('cr_en_casing', `: ${casingDiameterLabel} PVC (${casing10kgQty}m 10kg + ${casing6kgQty}m 6kg)`, 
                            <div className="flex gap-1">
                              <Input type="number" placeholder="10kg" className="h-6 text-xs" value={casing10kgQty} onChange={e => setCasing10kgQty(Number(e.target.value))} />
                              <Input type="number" placeholder="6kg" className="h-6 text-xs" value={casing6kgQty} onChange={e => setCasing6kgQty(Number(e.target.value))} />
                            </div>
                          )}
                        </td>
                      </tr>
                      <tr className="border-b">
                        <td className="py-1.5 font-bold">9. Inner Casing / Cap (End Cap)</td>
                        <td className="py-1.5">
                          {renderEditableCell('cr_en_endCap', `: ${endCap === 'Yes' ? `1 No, ${casingDiameterLabel} PVC Cap` : 'N/A'}`, 
                            <Select value={endCap} onValueChange={setEndCap}>
                              <SelectTrigger className="h-6 text-xs"><SelectValue /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Yes">Yes (1 No. Cap)</SelectItem>
                                <SelectItem value="No">No (N/A)</SelectItem>
                              </SelectContent>
                            </Select>
                          )}
                        </td>
                      </tr>
                      <tr className="border-b">
                        <td className="py-1.5 font-bold">10. Average Yield</td>
                        <td className="py-1.5">
                          {renderEditableCell('cr_en_yield', `: ${yieldLph} Litres Per Hour (LPH)`, <Input type="number" className="h-6 text-xs w-28" value={yieldLph} onChange={e => setYieldLph(Number(e.target.value))} />)}
                        </td>
                      </tr>
                      <tr className="border-b">
                        <td className="py-1.5 font-bold">11. Water Struck Zone</td>
                        <td className="py-1.5">
                          {renderEditableCell('cr_en_zone', `: ${waterStruckZone}`, <Input className="h-6 text-xs" value={waterStruckZone} onChange={e => setWaterStruckZone(e.target.value)} />)}
                        </td>
                      </tr>
                      <tr className="border-b">
                        <td className="py-1.5 font-bold">12. Static Water Level</td>
                        <td className="py-1.5">
                          {renderEditableCell('cr_en_swl', `: ${staticWaterLevel} meters below ground level`, <Input type="number" className="h-6 text-xs w-28" value={staticWaterLevel} onChange={e => setStaticWaterLevel(Number(e.target.value))} />)}
                        </td>
                      </tr>
                      <tr className="border-b">
                        <td className="py-1.5 font-bold">13. Name of Contractor (if any)</td>
                        <td className="py-1.5">
                          {renderEditableCell('cr_en_contractor', `: ${contractorName || 'Departmental Rig Work'}`, <Input className="h-6 text-xs" value={contractorName} onChange={e => setContractorName(e.target.value)} />)}
                        </td>
                      </tr>
                      <tr className="border-b">
                        <td className="py-1.5 font-bold">14. Remarks</td>
                        <td className="py-1.5">
                          {renderEditableCell('cr_en_remarks', `: ${remarks || 'Work completed satisfactorily as per departmental specifications.'}`, <Textarea className="min-h-[40px] text-xs p-1" value={remarks} onChange={e => setRemarks(e.target.value)} />)}
                        </td>
                      </tr>
                    </tbody>
                  </table>

                  <div className="pt-12 grid grid-cols-4 text-center font-bold text-xs">
                    <div>Site-in-Charge</div>
                    <div>Assistant Engineer</div>
                    <div>Assistant Exec. Engineer</div>
                    <div>District Officer</div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* 2. FINAL BILL (MALAYALAM & ENGLISH) */}
          {docType === 'final_bill' && (
            <div className="space-y-4">
              {lang === 'ml' ? (
                <>
                  <div className="text-center space-y-1 pb-2 border-b-2 border-black">
                    <h2 className="text-lg font-bold">ഭൂജലവകുപ്പ്, ജില്ലാ ഓഫീസ്, {districtMl}</h2>
                    <h3 className="text-base font-bold">കുഴൽകിണർ നിർമ്മാണം - പൂർത്തീകരണ റിപ്പോർട്ട്, ഫൈനൽ ബിൽ</h3>
                    <p className="text-xs font-semibold">ഫൈനൽ ബിൽ</p>
                  </div>

                  <div className="flex justify-between text-xs py-1">
                    <span>ഫയൽ നമ്പർ: <strong>{fileNo}</strong></span>
                    <span>അപേക്ഷകൻ: <strong>{applicantName}</strong></span>
                  </div>

                  <table className="w-full border-collapse border border-black text-xs">
                    <thead>
                      <tr className="bg-gray-100 border-b border-black text-center font-bold">
                        <td className="border border-black py-1.5 w-12">ക്രമ നമ്പർ</td>
                        <td className="border border-black py-1.5">വിവരണങ്ങൾ</td>
                        <td className="border border-black py-1.5 w-24">നിരക്ക് (രൂപ)</td>
                        <td className="border border-black py-1.5 w-24">അളവ്</td>
                        <td className="border border-black py-1.5 w-32 text-right pr-2">തുക (രൂപ)</td>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="border border-black p-1.5 text-center">1</td>
                        <td className="border border-black p-1.5">110 മില്ലീമീറ്റർ വ്യാസമുള്ള കുഴൽകിണറിന്റെ ഡ്രിilling ചാർജ്</td>
                        <td className="border border-black p-1.5 text-right font-mono">
                          {renderEditableCell('fb_r1', drillingRate.toFixed(2), <Input type="number" className="h-6 text-xs" value={drillingRate} onChange={e => setDrillingRate(Number(e.target.value))} />)}
                        </td>
                        <td className="border border-black p-1.5 text-center">
                          {renderEditableCell('fb_q1', `${drillingQty} മീറ്റർ`, <Input type="number" className="h-6 text-xs" value={drillingQty} onChange={e => { const v = Number(e.target.value); setDrillingQty(v); setDepthMeter(v); }} />)}
                        </td>
                        <td className="border border-black p-1.5 text-right font-mono">{drillingTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                      </tr>
                      <tr>
                        <td className="border border-black p-1.5 text-center">2</td>
                        <td className="border border-black p-1.5">140 മില്ലീമീറ്റർ വ്യാസമുള്ള 10 കി.ഗ്രാം /ച. സെ. മീ. പിവിസി കെയ്സിംഗ് പൈപ്പിന്റെ വില</td>
                        <td className="border border-black p-1.5 text-right font-mono">
                          {renderEditableCell('fb_r2', casing10kgRate.toFixed(2), <Input type="number" className="h-6 text-xs" value={casing10kgRate} onChange={e => setCasing10kgRate(Number(e.target.value))} />)}
                        </td>
                        <td className="border border-black p-1.5 text-center">
                          {renderEditableCell('fb_q2', `${casing10kgQty} മീറ്റർ`, <Input type="number" className="h-6 text-xs" value={casing10kgQty} onChange={e => setCasing10kgQty(Number(e.target.value))} />)}
                        </td>
                        <td className="border border-black p-1.5 text-right font-mono">{casing10kgTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                      </tr>
                      <tr>
                        <td className="border border-black p-1.5 text-center">3</td>
                        <td className="border border-black p-1.5">140 മില്ലീമീറ്റർ വ്യാസമുള്ള 6 കി.ഗ്രാം /ച. സെ. മീ. പിവിസി കെയ്സിംഗ് പൈപ്പിന്റെ വില</td>
                        <td className="border border-black p-1.5 text-right font-mono">
                          {renderEditableCell('fb_r3', casing6kgRate.toFixed(2), <Input type="number" className="h-6 text-xs" value={casing6kgRate} onChange={e => setCasing6kgRate(Number(e.target.value))} />)}
                        </td>
                        <td className="border border-black p-1.5 text-center">
                          {renderEditableCell('fb_q3', `${casing6kgQty} മീറ്റർ`, <Input type="number" className="h-6 text-xs" value={casing6kgQty} onChange={e => setCasing6kgQty(Number(e.target.value))} />)}
                        </td>
                        <td className="border border-black p-1.5 text-right font-mono">{casing6kgTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                      </tr>
                      <tr>
                        <td className="border border-black p-1.5 text-center">4</td>
                        <td className="border border-black p-1.5">140 മില്ലീമീറ്റർ വ്യാസമുള്ള പിവിസി കുഴൽകിണർ അടിയപ്പിന്റെ / ഇന്നർ കേസിംഗ് വില</td>
                        <td className="border border-black p-1.5 text-right font-mono">
                          {renderEditableCell('fb_r4', innerCasingRate.toFixed(2), <Input type="number" className="h-6 text-xs" value={innerCasingRate} onChange={e => setInnerCasingRate(Number(e.target.value))} />)}
                        </td>
                        <td className="border border-black p-1.5 text-center">
                          {renderEditableCell('fb_q4', `${innerCasingQty} എണ്ണം`, <Input type="number" className="h-6 text-xs" value={innerCasingQty} onChange={e => setInnerCasingQty(Number(e.target.value))} />)}
                        </td>
                        <td className="border border-black p-1.5 text-right font-mono">{innerCasingTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                      </tr>
                      <tr className="font-bold bg-gray-50">
                        <td className="border border-black p-1.5 text-center">5</td>
                        <td className="border border-black p-1.5" colSpan={3}>കുഴൽകിണർ നിർമ്മാണ പ്രവൃത്തിയുടെ ആകെ ചിലവ്</td>
                        <td className="border border-black p-1.5 text-right font-mono">{totalExpenditure.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                      </tr>
                      {subsidyAmount > 0 && (
                        <tr>
                          <td className="border border-black p-1.5 text-center">6</td>
                          <td className="border border-black p-1.5" colSpan={3}>
                            {renderEditableCell('fb_subsidy', 'നാമമാത്ര / ചെറുകിട കർഷകർക്കുള്ള ധനസഹായം', <Input type="number" className="h-6 text-xs" value={subsidyAmount} onChange={e => setSubsidyAmount(Number(e.target.value))} />)}
                          </td>
                          <td className="border border-black p-1.5 text-right font-mono">{subsidyAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                        </tr>
                      )}
                      <tr className="font-bold">
                        <td className="border border-black p-1.5 text-center">{subsidyAmount > 0 ? 7 : 6}</td>
                        <td className="border border-black p-1.5" colSpan={3}>കുഴൽകിണർ നിർമ്മാണ പ്രവൃത്തിക്ക് ഭൂജലവകുപ്പിന് ലഭിക്കേണ്ട തുക</td>
                        <td className="border border-black p-1.5 text-right font-mono">{netPayableGwd.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                      </tr>
                      <tr>
                        <td className="border border-black p-1.5 text-center">{subsidyAmount > 0 ? 8 : 7}</td>
                        <td className="border border-black p-1.5" colSpan={3}>
                          {renderEditableCell('fb_advance', `അപേക്ഷകൻ മുൻകൂറായി അടച്ചിട്ടുള്ള തുക (${ddDetails})`, 
                            <div className="flex gap-1">
                              <Input type="number" className="h-6 text-xs" value={advanceDeposit} onChange={e => setAdvanceDeposit(Number(e.target.value))} />
                              <Input className="h-6 text-xs" placeholder="DD Details" value={ddDetails} onChange={e => setDdDetails(e.target.value)} />
                            </div>
                          )}
                        </td>
                        <td className="border border-black p-1.5 text-right font-mono">{advanceDeposit.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                      </tr>
                      <tr className="font-bold bg-gray-100">
                        <td className="border border-black p-1.5 text-center">{subsidyAmount > 0 ? 9 : 8}</td>
                        <td className="border border-black p-1.5" colSpan={3}>
                          {balanceRefund >= 0 ? 'തിരികെ നൽകാനുള്ള ബാലൻസ് തുക (Refund)' : 'അപേക്ഷകനിൽ നിന്ന് ഈടാക്കേണ്ട ബാക്കി തുക'}
                        </td>
                        <td className="border border-black p-1.5 text-right font-mono">
                          {Math.abs(balanceRefund).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </td>
                      </tr>
                    </tbody>
                  </table>

                  <div className="pt-8 text-right">
                    <p className="font-bold">ജില്ലാ ഓഫീസർ</p>
                    <p className="text-xs">ഭൂജലവകുപ്പ്, ജില്ലാ ഓഫീസ്, {districtMl}</p>
                  </div>
                </>
              ) : (
                <>
                  <div className="text-center space-y-1 pb-2 border-b-2 border-black">
                    <h2 className="text-lg font-bold uppercase">GROUND WATER DEPARTMENT, DISTRICT OFFICE, {district}</h2>
                    <h3 className="text-base font-bold underline">FINAL BILL FOR BOREWELL CONSTRUCTION</h3>
                  </div>

                  <div className="flex justify-between text-xs py-1">
                    <span>File No: <strong>{fileNo}</strong></span>
                    <span>Applicant: <strong>{applicantName}</strong></span>
                  </div>

                  <table className="w-full border-collapse border border-black text-xs">
                    <thead>
                      <tr className="bg-gray-100 border-b border-black text-center font-bold">
                        <td className="border border-black py-1.5 w-12">Sl No</td>
                        <td className="border border-black py-1.5">Description of Item</td>
                        <td className="border border-black py-1.5 w-24">Rate (Rs)</td>
                        <td className="border border-black py-1.5 w-24">Qty / Unit</td>
                        <td className="border border-black py-1.5 w-32 text-right pr-2">Amount (Rs)</td>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="border border-black p-1.5 text-center">1</td>
                        <td className="border border-black p-1.5">Drilling charges for 110 mm dia borewell</td>
                        <td className="border border-black p-1.5 text-right font-mono">
                          {renderEditableCell('fb_en_r1', drillingRate.toFixed(2), <Input type="number" className="h-6 text-xs" value={drillingRate} onChange={e => setDrillingRate(Number(e.target.value))} />)}
                        </td>
                        <td className="border border-black p-1.5 text-center">
                          {renderEditableCell('fb_en_q1', `${drillingQty} m`, <Input type="number" className="h-6 text-xs" value={drillingQty} onChange={e => { const v = Number(e.target.value); setDrillingQty(v); setDepthMeter(v); }} />)}
                        </td>
                        <td className="border border-black p-1.5 text-right font-mono">{drillingTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                      </tr>
                      <tr>
                        <td className="border border-black p-1.5 text-center">2</td>
                        <td className="border border-black p-1.5">140 mm dia 10 kg/cm² PVC Casing Pipe</td>
                        <td className="border border-black p-1.5 text-right font-mono">
                          {renderEditableCell('fb_en_r2', casing10kgRate.toFixed(2), <Input type="number" className="h-6 text-xs" value={casing10kgRate} onChange={e => setCasing10kgRate(Number(e.target.value))} />)}
                        </td>
                        <td className="border border-black p-1.5 text-center">
                          {renderEditableCell('fb_en_q2', `${casing10kgQty} m`, <Input type="number" className="h-6 text-xs" value={casing10kgQty} onChange={e => setCasing10kgQty(Number(e.target.value))} />)}
                        </td>
                        <td className="border border-black p-1.5 text-right font-mono">{casing10kgTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                      </tr>
                      <tr>
                        <td className="border border-black p-1.5 text-center">3</td>
                        <td className="border border-black p-1.5">140 mm dia 6 kg/cm² PVC Casing Pipe</td>
                        <td className="border border-black p-1.5 text-right font-mono">
                          {renderEditableCell('fb_en_r3', casing6kgRate.toFixed(2), <Input type="number" className="h-6 text-xs" value={casing6kgRate} onChange={e => setCasing6kgRate(Number(e.target.value))} />)}
                        </td>
                        <td className="border border-black p-1.5 text-center">
                          {renderEditableCell('fb_en_q3', `${casing6kgQty} m`, <Input type="number" className="h-6 text-xs" value={casing6kgQty} onChange={e => setCasing6kgQty(Number(e.target.value))} />)}
                        </td>
                        <td className="border border-black p-1.5 text-right font-mono">{casing6kgTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                      </tr>
                      <tr>
                        <td className="border border-black p-1.5 text-center">4</td>
                        <td className="border border-black p-1.5">140 mm PVC Cap / Inner Casing</td>
                        <td className="border border-black p-1.5 text-right font-mono">
                          {renderEditableCell('fb_en_r4', innerCasingRate.toFixed(2), <Input type="number" className="h-6 text-xs" value={innerCasingRate} onChange={e => setInnerCasingRate(Number(e.target.value))} />)}
                        </td>
                        <td className="border border-black p-1.5 text-center">
                          {renderEditableCell('fb_en_q4', `${innerCasingQty} No`, <Input type="number" className="h-6 text-xs" value={innerCasingQty} onChange={e => setInnerCasingQty(Number(e.target.value))} />)}
                        </td>
                        <td className="border border-black p-1.5 text-right font-mono">{innerCasingTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                      </tr>
                      <tr className="font-bold bg-gray-50">
                        <td className="border border-black p-1.5 text-center">5</td>
                        <td className="border border-black p-1.5" colSpan={3}>Total Expenditure Incurred</td>
                        <td className="border border-black p-1.5 text-right font-mono">{totalExpenditure.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                      </tr>
                      <tr className="font-bold">
                        <td className="border border-black p-1.5 text-center">6</td>
                        <td className="border border-black p-1.5" colSpan={3}>Net Amount Payable to Ground Water Department</td>
                        <td className="border border-black p-1.5 text-right font-mono">{netPayableGwd.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                      </tr>
                      <tr>
                        <td className="border border-black p-1.5 text-center">7</td>
                        <td className="border border-black p-1.5" colSpan={3}>
                          {renderEditableCell('fb_en_advance', `Advance Deposit Paid by Applicant (${ddDetails})`, 
                            <div className="flex gap-1">
                              <Input type="number" className="h-6 text-xs" value={advanceDeposit} onChange={e => setAdvanceDeposit(Number(e.target.value))} />
                              <Input className="h-6 text-xs" value={ddDetails} onChange={e => setDdDetails(e.target.value)} />
                            </div>
                          )}
                        </td>
                        <td className="border border-black p-1.5 text-right font-mono">{advanceDeposit.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                      </tr>
                      <tr className="font-bold bg-gray-100">
                        <td className="border border-black p-1.5 text-center">8</td>
                        <td className="border border-black p-1.5" colSpan={3}>
                          {balanceRefund >= 0 ? 'Balance Refund Amount Due to Applicant' : 'Balance Deficit Amount Payable by Applicant'}
                        </td>
                        <td className="border border-black p-1.5 text-right font-mono">
                          {Math.abs(balanceRefund).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </td>
                      </tr>
                    </tbody>
                  </table>

                  <div className="pt-8 text-right">
                    <p className="font-bold">District Officer</p>
                    <p className="text-xs">Ground Water Department, {district}</p>
                  </div>
                </>
              )}
            </div>
          )}

          {/* 3. ABSTRACT OF FINAL BILL (FOR MULTIPLE SITES) */}
          {docType === 'abstract_final_bill' && (
            <div className="space-y-4">
              {lang === 'ml' ? (
                <>
                  <div className="text-center space-y-1 pb-2 border-b-2 border-black">
                    <h2 className="text-lg font-bold">ഭൂജലവകുപ്പ്, ജില്ലാ ഓഫീസ്, {districtMl}</h2>
                    <h3 className="text-base font-bold underline">അബ്‌സ്ട്രാക്ട് ഫൈനൽ ബിൽ (ABSTRACT OF FINAL BILL)</h3>
                  </div>

                  <div className="flex justify-between text-xs py-1">
                    <span>ഫയൽ നമ്പർ: <strong>{fileNo}</strong></span>
                    <span>അപേക്ഷകൻ / ഏജൻസി: <strong>{applicantName}</strong></span>
                  </div>

                  <table className="w-full border-collapse border border-black text-xs">
                    <thead>
                      <tr className="bg-gray-100 border-b border-black text-center font-bold">
                        <td className="border border-black py-1.5 w-10">ക്രമ നമ്പർ</td>
                        <td className="border border-black py-1.5">സൈറ്റുകളുടെ വിവരങ്ങൾ / സ്ഥലം</td>
                        <td className="border border-black py-1.5 w-28 text-right pr-2">മുൻകൂർ അടച്ച തുക (രൂപ)</td>
                        <td className="border border-black py-1.5 w-28 text-right pr-2">ആകെ ചിലവ് (രൂപ)</td>
                        <td className="border border-black py-1.5 w-28 text-right pr-2">ബാലൻസ് / റിഫണ്ട് (രൂപ)</td>
                      </tr>
                    </thead>
                    <tbody>
                      {sites.map((s, idx) => {
                        const siteCost = (drillingRate * (Number(s.totalDepth) || 90)) + 15000;
                        const siteDep = advanceDeposit / (sites.length || 1);
                        const siteBal = siteDep - siteCost;
                        return (
                          <tr key={idx}>
                            <td className="border border-black p-1.5 text-center">{idx + 1}</td>
                            <td className="border border-black p-1.5">
                              <strong>{s.nameOfSite}</strong> ({s.localSelfGovt || 'LSGD'}) - {s.purpose || 'BWC'}
                            </td>
                            <td className="border border-black p-1.5 text-right font-mono">{siteDep.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                            <td className="border border-black p-1.5 text-right font-mono">{siteCost.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                            <td className="border border-black p-1.5 text-right font-mono">{siteBal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                          </tr>
                        );
                      })}
                      <tr className="font-bold bg-gray-100">
                        <td className="border border-black p-1.5 text-center" colSpan={2}>ആകെ തുക (GRAND TOTAL)</td>
                        <td className="border border-black p-1.5 text-right font-mono">{advanceDeposit.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                        <td className="border border-black p-1.5 text-right font-mono">{totalExpenditure.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                        <td className="border border-black p-1.5 text-right font-mono">{balanceRefund.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                      </tr>
                    </tbody>
                  </table>

                  <p className="text-xs font-semibold pt-2">
                    അടയ്ക്കേണ്ട / തിരികെ നൽകേണ്ട ആകെ ബാലൻസ് തുക അക്ഷരത്തിൽ: <span className="underline">{numberToWordsMalayalam(Math.abs(balanceRefund))}</span>
                  </p>

                  <div className="pt-8 text-right">
                    <p className="font-bold">ജില്ലാ ഓഫീസർ</p>
                    <p className="text-xs">ഭൂജലവകുപ്പ്, ജില്ലാ ഓഫീസ്, {districtMl}</p>
                  </div>
                </>
              ) : (
                <>
                  <div className="text-center space-y-1 pb-2 border-b-2 border-black">
                    <h2 className="text-lg font-bold uppercase">GROUND WATER DEPARTMENT, DISTRICT OFFICE, {district}</h2>
                    <h3 className="text-base font-bold underline">ABSTRACT OF FINAL BILL</h3>
                  </div>

                  <div className="flex justify-between text-xs py-1">
                    <span>File No: <strong>{fileNo}</strong></span>
                    <span>Applicant / Scheme: <strong>{applicantName}</strong></span>
                  </div>

                  <table className="w-full border-collapse border border-black text-xs">
                    <thead>
                      <tr className="bg-gray-100 border-b border-black text-center font-bold">
                        <td className="border border-black py-1.5 w-10">Sl No</td>
                        <td className="border border-black py-1.5">Site Name & Location</td>
                        <td className="border border-black py-1.5 w-28 text-right pr-2">Deposit Paid (Rs)</td>
                        <td className="border border-black py-1.5 w-28 text-right pr-2">Expenditure (Rs)</td>
                        <td className="border border-black py-1.5 w-28 text-right pr-2">Balance Refund (Rs)</td>
                      </tr>
                    </thead>
                    <tbody>
                      {sites.map((s, idx) => {
                        const siteCost = (drillingRate * (Number(s.totalDepth) || 90)) + 15000;
                        const siteDep = advanceDeposit / (sites.length || 1);
                        const siteBal = siteDep - siteCost;
                        return (
                          <tr key={idx}>
                            <td className="border border-black p-1.5 text-center">{idx + 1}</td>
                            <td className="border border-black p-1.5">
                              <strong>{s.nameOfSite}</strong> ({s.localSelfGovt}) - {s.purpose}
                            </td>
                            <td className="border border-black p-1.5 text-right font-mono">{siteDep.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                            <td className="border border-black p-1.5 text-right font-mono">{siteCost.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                            <td className="border border-black p-1.5 text-right font-mono">{siteBal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                          </tr>
                        );
                      })}
                      <tr className="font-bold bg-gray-100">
                        <td className="border border-black p-1.5 text-center" colSpan={2}>GRAND TOTAL</td>
                        <td className="border border-black p-1.5 text-right font-mono">{advanceDeposit.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                        <td className="border border-black p-1.5 text-right font-mono">{totalExpenditure.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                        <td className="border border-black p-1.5 text-right font-mono">{balanceRefund.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                      </tr>
                    </tbody>
                  </table>

                  <p className="text-xs font-semibold pt-2">
                    Net Balance Amount in Words: <span className="underline">{numberToWordsEnglish(Math.abs(balanceRefund))}</span>
                  </p>

                  <div className="pt-8 text-right">
                    <p className="font-bold">District Officer</p>
                    <p className="text-xs">Ground Water Department, {district}</p>
                  </div>
                </>
              )}
            </div>
          )}

          {/* 4. PROCEEDINGS (FOR PRIVATE DEPOSIT WORKS) */}
          {docType === 'proceedings' && (
            <div className="space-y-4">
              <div className="text-center space-y-1 pb-2 border-b-2 border-black">
                <h2 className="text-sm font-bold uppercase tracking-wider">
                  PROCEEDINGS OF THE DISTRICT OFFICER, GROUND WATER DEPARTMENT, {district.toUpperCase()}
                </h2>
                {renderEditableCell('proc_officer', 
                  <p className="text-xs italic font-semibold text-center">Present: {officerName}, {officerDesignation}</p>,
                  <div className="flex gap-1">
                    <Input className="h-6 text-xs" value={officerName} onChange={e => setOfficerName(e.target.value)} />
                    <Input className="h-6 text-xs" value={officerDesignation} onChange={e => setOfficerDesignation(e.target.value)} />
                  </div>
                )}
              </div>

              <div className="text-xs space-y-2 py-2">
                <div className="grid grid-cols-[60px_1fr] gap-1 items-start">
                  <span className="font-bold">Sub:</span>
                  {renderEditableCell('proc_sub', <span>{proceedingsSubject}</span>, <Textarea className="min-h-[45px] text-xs" value={proceedingsSubject} onChange={e => setProceedingsSubject(e.target.value)} />)}
                </div>
                <div className="grid grid-cols-[60px_1fr] gap-1 items-start">
                  <span className="font-bold">Ref:</span>
                  {renderEditableCell('proc_ref', 
                    <div>
                      {proceedingsRef1}<br />
                      {proceedingsRef2}
                    </div>,
                    <div className="space-y-1">
                      <Input className="h-6 text-xs" value={proceedingsRef1} onChange={e => setProceedingsRef1(e.target.value)} />
                      <Input className="h-6 text-xs" value={proceedingsRef2} onChange={e => setProceedingsRef2(e.target.value)} />
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-between font-bold border-y border-black py-1 text-xs">
                {renderEditableCell('proc_ordNo', <span>Order No. {orderNo}</span>, <Input className="h-6 text-xs w-48" value={orderNo} onChange={e => setOrderNo(e.target.value)} />)}
                {renderEditableCell('proc_ordDate', <span>Dated: {orderDate}</span>, <Input className="h-6 text-xs w-36" value={orderDate} onChange={e => setOrderDate(e.target.value)} />)}
              </div>

              <div className="text-xs space-y-3 leading-relaxed text-justify pt-2">
                <p className="p-1 rounded hover:bg-slate-50 transition-colors">
                  {renderEditableCell('proc_para1',
                    <span>
                      As per the 1st reference cited above, <strong>{applicantName}</strong> deposited an amount of <strong>Rs. {advanceDeposit.toLocaleString('en-IN')}/-</strong> vide DD ({ddDetails}) for the construction of a borewell at their premises.
                    </span>,
                    <div className="flex gap-1">
                      <Input type="number" className="h-6 text-xs" value={advanceDeposit} onChange={e => setAdvanceDeposit(Number(e.target.value))} />
                      <Input className="h-6 text-xs" value={ddDetails} onChange={e => setDdDetails(e.target.value)} />
                    </div>
                  )}
                </p>
                <p className="p-1 rounded hover:bg-slate-50 transition-colors">
                  {renderEditableCell('proc_para2',
                    <span>
                      Vide the 2nd reference cited, it has been reported that the work was completed using the Department&apos;s Rig unit. The total expenditure incurred by the department is <strong>Rs. {netPayableGwd.toLocaleString('en-IN')}/-</strong>, which is to be remitted to the Department&apos;s revenue head <code>0702-02-800-99</code>, &quot;Other Receipts&quot;. The balance amount of <strong>Rs. {balanceRefund.toLocaleString('en-IN')}/-</strong> is to be refunded to the applicant.
                    </span>,
                    <div className="flex gap-1">
                      <Input type="number" placeholder="Net Payable" className="h-6 text-xs" value={drillingTotal + casing10kgTotal + casing6kgTotal + innerCasingTotal} onChange={e => setDrillingRate(Number(e.target.value))} />
                      <Input type="number" placeholder="Refund" className="h-6 text-xs" value={advanceDeposit - netPayableGwd} onChange={e => setAdvanceDeposit(Number(e.target.value))} />
                    </div>
                  )}
                </p>
                <p className="p-1 rounded hover:bg-slate-50 transition-colors">
                  {renderEditableCell('proc_para3',
                    <span>
                      In these circumstances, sanction is hereby accorded to refund an amount of <strong>Rs. {balanceRefund.toLocaleString('en-IN')}/- ({numberToWordsEnglish(balanceRefund)})</strong> being the balance amount due to the applicant in connection with the borewell construction, to their <strong>Bank Account No. {bankAccountNo || '85829024542'}, IFSC: {bankIfsc || 'SBIN0012880'} ({bankName})</strong>.
                    </span>,
                    <div className="grid grid-cols-3 gap-1">
                      <Input className="h-6 text-xs" placeholder="Account No" value={bankAccountNo} onChange={e => setBankAccountNo(e.target.value)} />
                      <Input className="h-6 text-xs" placeholder="IFSC" value={bankIfsc} onChange={e => setBankIfsc(e.target.value)} />
                      <Input className="h-6 text-xs" placeholder="Bank Name" value={bankName} onChange={e => setBankName(e.target.value)} />
                    </div>
                  )}
                </p>
                <p>
                  Sanction is also hereby accorded to remit an amount of <strong>Rs. {netPayableGwd.toLocaleString('en-IN')}/- ({numberToWordsEnglish(netPayableGwd)})</strong> to Department Revenue head <code>0702-02-800-99-other receipts</code>, being the Borewell construction charges.
                </p>
                <p>
                  The expenditure shall be met from the gross amount of Rs. {advanceDeposit.toLocaleString('en-IN')}/- deposited by the applicant into STSB Account of the District Officer, Ground Water Department, {district}.
                </p>
              </div>

              <div className="pt-10 flex justify-between items-end text-xs">
                <div>
                  <p className="font-bold">Copy to:</p>
                  <p>1. File</p>
                  <p>2. Stock File / Office Copy</p>
                </div>
                <div className="text-right">
                  <p className="font-bold">District Officer</p>
                  <p className="text-[11px]">Ground Water Department, {district}</p>
                </div>
              </div>
            </div>
          )}

          {/* 5. UTILIZATION CERTIFICATE (FOR DEPOSIT WORKS) */}
          {docType === 'utilization_certificate' && (
            <div className="space-y-4">
              {lang === 'ml' ? (
                <>
                  <div className="text-center space-y-1 pb-2 border-b-2 border-black">
                    <h2 className="text-lg font-bold">ഭൂജലവകുപ്പ്, ജില്ലാ ഓഫീസറുടെ കാര്യാലയം, {districtMl}</h2>
                    {renderEditableCell('uc_ml_contact', 
                      <p className="text-xs">ഫോൺ: {ucPhone} | ഇ-മെയിൽ: {ucEmail}</p>,
                      <div className="flex gap-1 justify-center">
                        <Input className="h-6 text-xs w-36" value={ucPhone} onChange={e => setUcPhone(e.target.value)} />
                        <Input className="h-6 text-xs w-48" value={ucEmail} onChange={e => setUcEmail(e.target.value)} />
                      </div>
                    )}
                  </div>

                  <div className="flex justify-between text-xs py-1">
                    {renderEditableCell('uc_ml_refNo', <span>നമ്പർ: <strong>{fileNo}</strong></span>, <Input className="h-6 text-xs w-36" value={fileNo} onChange={e => setFileNo(e.target.value)} />)}
                    {renderEditableCell('uc_ml_date', <span>തീയതി: <strong>{orderDate}</strong></span>, <Input className="h-6 text-xs w-36" value={orderDate} onChange={e => setOrderDate(e.target.value)} />)}
                  </div>

                  <div className="text-xs space-y-1">
                    {renderEditableCell('uc_ml_from', <p><strong>പ്രേഷിതൻ:</strong> {ucFrom || `ജില്ലാ ഓഫീസർ, ഭൂജലവകുപ്പ്, ${districtMl}`}</p>, <Input className="h-6 text-xs" value={ucFrom} onChange={e => setUcFrom(e.target.value)} />)}
                    {renderEditableCell('uc_ml_to', <p><strong>സ്വീകർത്താവ്:</strong> {ucTo || `അസിസ്റ്റന്റ് എൻജിനീയർ, ${localSelfGovt || 'ഗ്രാമപഞ്ചായത്ത്'}`}</p>, <Input className="h-6 text-xs" value={ucTo} onChange={e => setUcTo(e.target.value)} />)}
                  </div>

                  <div className="text-xs space-y-1 py-1">
                    {renderEditableCell('uc_ml_sub', <p><strong>വിഷയം:</strong> {ucSubject}</p>, <Textarea className="min-h-[40px] text-xs p-1" value={ucSubject} onChange={e => setUcSubject(e.target.value)} />)}
                    {renderEditableCell('uc_ml_refs', 
                      <p><strong>സൂചന:</strong> 1. {ucRef1}<br />2. {ucRef2}</p>,
                      <div className="space-y-1">
                        <Input className="h-6 text-xs" value={ucRef1} onChange={e => setUcRef1(e.target.value)} />
                        <Input className="h-6 text-xs" value={ucRef2} onChange={e => setUcRef2(e.target.value)} />
                      </div>
                    )}
                  </div>

                  <div className="text-xs space-y-2 text-justify leading-relaxed">
                    <p>
                      മേൽ സൂചന പ്രകാരം {localSelfGovt || 'പഞ്ചായത്ത്'} പരിധിയിലെ കുടിവെള്ള പദ്ധതികൾ നടപ്പിലാക്കുന്നതിന്റെ ഭാഗമായി കുഴൽകിണർ നിർമ്മാണവുമായി ബന്ധപ്പെട്ട് അടവാക്കിയ തുകയ്ക്ക് പൂർത്തീകരണ റിപ്പോർട്ടും ഫൈനൽ ബില്ലും ഇതിനാൽ സാക്ഷ്യപ്പെടുത്തുന്നു.
                    </p>
                    <p>
                      ടി കുഴൽകിണർ നിർമ്മാണ പ്രവൃത്തികൾ ഡിപ്പാർട്ട്മെന്റ് റിഗ് മുഖേന തൃപ്തികരമായി പൂർത്തീകരിച്ചിട്ടുണ്ട്. കുഴൽകിണർ നിർമ്മാണങ്ങൾക്ക് ആകെ ചിലവായ തുക കഴിച്ച് ബാക്കി തുകയായ <strong>Rs. {balanceRefund.toLocaleString('en-IN')}/- ({numberToWordsMalayalam(balanceRefund)})</strong> പഞ്ചായത്തിന് തിരികെ നൽകുന്നതിന് ബാങ്ക് അക്കൗണ്ട് വിവരങ്ങൾ ലഭ്യമാക്കണമെന്ന് താല്പര്യപ്പെടുന്നു.
                    </p>
                  </div>

                  <div className="pt-2">
                    <h4 className="text-center font-bold text-xs underline mb-2">ധനവിനിയോഗ സാക്ഷ്യപത്രം (UTILIZATION CERTIFICATE)</h4>
                    <table className="w-full border-collapse border border-black text-xs">
                      <thead>
                        <tr className="bg-gray-100 border-b border-black text-center font-bold">
                          <td className="border border-black p-1.5 w-10">ക്രമ നമ്പർ</td>
                          <td className="border border-black p-1.5">വിവരണങ്ങൾ / പൂർത്തീകരിച്ച സൈറ്റുകൾ</td>
                          <td className="border border-black p-1.5 w-28 text-right pr-2">അടവാക്കിയ തുക (രൂപ)</td>
                          <td className="border border-black p-1.5 w-28 text-right pr-2">ആകെ ചിലവ് (രൂപ)</td>
                          <td className="border border-black p-1.5 w-28 text-right pr-2">ബാലൻസ് തുക (രൂപ)</td>
                        </tr>
                      </thead>
                      <tbody>
                        {sites.map((s, idx) => (
                          <tr key={idx}>
                            <td className="border border-black p-1.5 text-center">{idx + 1}</td>
                            <td className="border border-black p-1.5">{s.nameOfSite} കുടിവെള്ള പദ്ധതി കുഴൽകിണർ നിർമ്മാണം</td>
                            <td className="border border-black p-1.5 text-right font-mono">{(advanceDeposit / sites.length).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                            <td className="border border-black p-1.5 text-right font-mono">{(totalExpenditure / sites.length).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                            <td className="border border-black p-1.5 text-right font-mono">{(balanceRefund / sites.length).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                          </tr>
                        ))}
                        <tr className="font-bold bg-gray-100">
                          <td className="border border-black p-1.5 text-center" colSpan={2}>ആകെ (TOTAL)</td>
                          <td className="border border-black p-1.5 text-right font-mono">{advanceDeposit.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                          <td className="border border-black p-1.5 text-right font-mono">{totalExpenditure.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                          <td className="border border-black p-1.5 text-right font-mono">{balanceRefund.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  <p className="text-xs font-semibold pt-2">
                    ആകെ ബാക്കി ബാലൻസ് തുക: <span className="underline">{numberToWordsMalayalam(Math.abs(balanceRefund))}</span>
                  </p>

                  <div className="pt-10 text-right text-xs font-bold">
                    <p>വിശ്വസ്തതയോടെ,</p>
                    <br /><br />
                    <p>ജില്ലാ ഓഫീസർ</p>
                    <p className="font-normal text-[11px]">ഭൂജലവകുപ്പ്, ജില്ലാ ഓഫീസ്, {districtMl}</p>
                  </div>
                </>
              ) : (
                <>
                  <div className="text-center space-y-1 pb-2 border-b-2 border-black">
                    <h2 className="text-lg font-bold uppercase">GROUND WATER DEPARTMENT, DISTRICT OFFICE, {district}</h2>
                    <h3 className="text-base font-bold underline">UTILIZATION CERTIFICATE</h3>
                  </div>

                  <div className="flex justify-between text-xs py-1">
                    {renderEditableCell('uc_en_ref', <span>Ref No: <strong>{fileNo}</strong></span>, <Input className="h-6 text-xs w-36" value={fileNo} onChange={e => setFileNo(e.target.value)} />)}
                    {renderEditableCell('uc_en_date', <span>Date: <strong>{orderDate}</strong></span>, <Input className="h-6 text-xs w-36" value={orderDate} onChange={e => setOrderDate(e.target.value)} />)}
                  </div>

                  <div className="text-xs space-y-1">
                    {renderEditableCell('uc_en_from', <p><strong>From:</strong> {ucFrom}</p>, <Input className="h-6 text-xs" value={ucFrom} onChange={e => setUcFrom(e.target.value)} />)}
                    {renderEditableCell('uc_en_to', <p><strong>To:</strong> {ucTo}</p>, <Input className="h-6 text-xs" value={ucTo} onChange={e => setUcTo(e.target.value)} />)}
                  </div>

                  <div className="text-xs space-y-2 text-justify leading-relaxed pt-2">
                    <p>
                      Certified that out of <strong>Rs. {advanceDeposit.toLocaleString('en-IN')}/-</strong> deposited for borewell construction works under the {localSelfGovt || 'Panchayat'} scheme, a total sum of <strong>Rs. {totalExpenditure.toLocaleString('en-IN')}/-</strong> has been utilized towards actual construction costs.
                    </p>
                    <p>
                      The unspent balance amount of <strong>Rs. {balanceRefund.toLocaleString('en-IN')}/- ({numberToWordsEnglish(balanceRefund)})</strong> is ready for refund.
                    </p>
                  </div>

                  <div className="pt-2">
                    <table className="w-full border-collapse border border-black text-xs">
                      <thead>
                        <tr className="bg-gray-100 border-b border-black text-center font-bold">
                          <td className="border border-black p-1.5 w-10">Sl No</td>
                          <td className="border border-black p-1.5">Description / Completed Sites</td>
                          <td className="border border-black p-1.5 w-28 text-right pr-2">Deposited (Rs)</td>
                          <td className="border border-black p-1.5 w-28 text-right pr-2">Expenditure (Rs)</td>
                          <td className="border border-black p-1.5 w-28 text-right pr-2">Balance (Rs)</td>
                        </tr>
                      </thead>
                      <tbody>
                        {sites.map((s, idx) => (
                          <tr key={idx}>
                            <td className="border border-black p-1.5 text-center">{idx + 1}</td>
                            <td className="border border-black p-1.5">{s.nameOfSite} Borewell Construction Work</td>
                            <td className="border border-black p-1.5 text-right font-mono">{(advanceDeposit / sites.length).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                            <td className="border border-black p-1.5 text-right font-mono">{(totalExpenditure / sites.length).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                            <td className="border border-black p-1.5 text-right font-mono">{(balanceRefund / sites.length).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                          </tr>
                        ))}
                        <tr className="font-bold bg-gray-100">
                          <td className="border border-black p-1.5 text-center" colSpan={2}>TOTAL</td>
                          <td className="border border-black p-1.5 text-right font-mono">{advanceDeposit.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                          <td className="border border-black p-1.5 text-right font-mono">{totalExpenditure.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                          <td className="border border-black p-1.5 text-right font-mono">{balanceRefund.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  <p className="text-xs font-semibold pt-2">
                    Net Refund Amount in Words: <span className="underline">{numberToWordsEnglish(Math.abs(balanceRefund))}</span>
                  </p>

                  <div className="pt-10 text-right text-xs font-bold">
                    <p>Yours faithfully,</p>
                    <br /><br />
                    <p>District Officer</p>
                    <p className="font-normal text-[11px]">Ground Water Department, {district}</p>
                  </div>
                </>
              )}
            </div>
          )}

        </div>

        {/* Modal Footer - Hidden during Printing */}
        <DialogFooter className="print:hidden border-t pt-3 flex justify-between items-center">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          <Button onClick={handlePrint} className="bg-primary gap-1.5">
            <Printer className="h-4 w-4" />
            Print Document
          </Button>
        </DialogFooter>

      </DialogContent>
    </Dialog>
  );
}
'''

with open('src/components/database/PrintableReportModal.tsx', 'w') as f:
    f.write(content)

print("Updated PrintableReportModal.tsx successfully!")
