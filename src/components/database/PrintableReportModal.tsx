// src/components/database/PrintableReportModal.tsx
"use client";

import React, { useState, useMemo, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
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
import { Printer, FileText, Globe, CheckCircle2, Building2, User, Landmark, DollarSign, Pencil, Check, X, RotateCcw, ExternalLink, Save, Loader2, ClipboardCopy } from "lucide-react";
import { printDocument, copyRichHtml } from "@/lib/print-utils";
import { PrintStyleToolbar, DEFAULT_PRINT_STYLES, getPrintContainerStyle, getPageMarginsCss, type PrintStyleSettings } from "@/components/shared/PrintStyleToolbar";
import { 
  type DataEntryFormData, 
  type SiteDetailFormData, 
  PUBLIC_DEPOSIT_APPLICATION_TYPES, 
  COLLECTOR_APPLICATION_TYPES, 
  PLAN_FUND_APPLICATION_TYPES 
} from "@/lib/schemas";
import { numberToWordsEnglish, numberToWordsMalayalam } from "@/lib/numberToWords";
import { useDataStore } from "@/hooks/use-data-store";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";
import { updateFileEntry } from "@/lib/db";

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

const formatDateDDMMYYYY = (dateStr: string): string => {
  if (!dateStr || dateStr === 'N/A') return '';
  const trimmed = dateStr.trim();
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(trimmed)) return trimmed;
  const match = trimmed.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
  if (match) {
    const [_, y, m, d] = match;
    return `${d.padStart(2, '0')}/${m.padStart(2, '0')}/${y}`;
  }
  return trimmed;
};

const formatDatesInText = (text: string): string => {
  if (!text) return text;
  return text.replace(/\b(\d{4})[-/](\d{1,2})[-/](\d{1,2})\b/g, (_, y, m, d) => {
    return `${d.padStart(2, '0')}/${m.padStart(2, '0')}/${y}`;
  });
};

const formatMeterValue = (val: string | number, unit: string = 'meter'): string => {
  if (!val || val === 'N/A') return '';
  let str = String(val).trim();
  if (!str) return '';
  if (unit === 'മീറ്റർ') {
    str = str.replace(/\bmeter(s)?\b/gi, 'മീറ്റർ').replace(/\bm\b/gi, 'മീറ്റർ');
  } else if (unit === 'meter') {
    str = str.replace(/മീറ്റർ/g, 'meter');
  }
  if (str.toLowerCase().includes('meter') || str.includes('മീറ്റർ') || str.endsWith(' m')) return str;
  return `${str} ${unit}`;
};

const parseNum = (val: any): number => {
  if (val === null || val === undefined) return 0;
  if (typeof val === 'number') return isNaN(val) ? 0 : val;
  const match = String(val).match(/-?\d+(\.\d+)?/);
  return match ? parseFloat(match[0]) : 0;
};

interface PrintableReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  entry: DataEntryFormData | null;
  moduleType?: string; // 'collectors' | 'private' | 'plan-fund' | 'public' | etc.
  initialDocType?: ReportDocType;
  isFullPage?: boolean;
  onSave?: (updatedEntry: DataEntryFormData) => void;
}

export default function PrintableReportModal({
  isOpen,
  onClose,
  entry,
  moduleType = 'collectors',
  initialDocType = 'completion_report',
  isFullPage = false,
  onSave,
}: PrintableReportModalProps) {
  const { officeAddress, selectedOffice, allStaffMembers } = useDataStore();
  const { user } = useAuth();

  const isPrivateWork = moduleType === 'private' || (entry?.applicationType?.toLowerCase().includes('private') ?? false);
  const isDepositWork = ['collectors', 'collector', 'public', 'deposit', 'planFund', 'plan_fund', 'plan-fund'].includes(moduleType) || (entry?.applicationType ? (PUBLIC_DEPOSIT_APPLICATION_TYPES.includes(entry.applicationType as any) || COLLECTOR_APPLICATION_TYPES.includes(entry.applicationType as any) || PLAN_FUND_APPLICATION_TYPES.includes(entry.applicationType as any)) : !isPrivateWork);

  // Language & DocType state
  const [lang, setLang] = useState<LanguageMode>('ml');
  const [docType, setDocType] = useState<ReportDocType>(initialDocType);
  const [isCopying, setIsCopying] = useState<boolean>(false);
  const [printSettings, setPrintSettings] = useState<PrintStyleSettings>(DEFAULT_PRINT_STYLES);

  useEffect(() => {
    if (initialDocType) {
      setDocType(initialDocType);
    }
  }, [initialDocType, isOpen]);

  const rawSites = useMemo(() => entry?.siteDetails || [], [entry]);

  const countOfBwcOrTwc = useMemo(() => {
    return rawSites.filter(s => s.purpose === 'BWC' || s.purpose === 'TWC').length;
  }, [rawSites]);

  const hasBwcOrTwc = useMemo(() => {
    return countOfBwcOrTwc > 0;
  }, [countOfBwcOrTwc]);

  const sites = useMemo(() => {
    if (docType === 'final_bill' || docType === 'abstract_final_bill' || docType === 'proceedings') {
      const filtered = rawSites.filter(s => s.purpose === 'BWC' || s.purpose === 'TWC');
      if (filtered.length > 0) {
        return filtered;
      }
      return rawSites;
    }
    return rawSites;
  }, [rawSites, docType]);
  
  const hasMultipleSites = countOfBwcOrTwc > 1 || rawSites.length > 1;

  // Selected site index
  const [selectedSiteIndex, setSelectedSiteIndex] = useState<number>(0);

  useEffect(() => {
    setSelectedSiteIndex(0);
  }, [docType, isOpen]);

  const currentSite: SiteDetailFormData | undefined = sites[selectedSiteIndex] || sites[0];
  const isDeptRigWork = currentSite?.siteConditions === 'Accessible to Dept. Rig' || (entry as any)?.siteConditions === 'Accessible to Dept. Rig';

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
  const [casing8kgQty, setCasing8kgQty] = useState<number>(0);
  const [casing6kgQty, setCasing6kgQty] = useState<number>(0);
  const [outerCasingQty, setOuterCasingQty] = useState<number>(0);
  const [innerCasing6kgQty, setInnerCasing6kgQty] = useState<number>(0);
  const [innerCasing4kgQty, setInnerCasing4kgQty] = useState<number>(0);
  const [innerCasingQty, setInnerCasingQty] = useState<number>(0);
  const [endCap, setEndCap] = useState<string>('No');
  const [yieldLph, setYieldLph] = useState<number>(0);
  const [waterStruckZone, setWaterStruckZone] = useState<string>('');
  const [staticWaterLevel, setStaticWaterLevel] = useState<number | string>('');
  const [rigUsed, setRigUsed] = useState<string>('Disassembled Rig + Atlas Copco Compressor');
  const [contractorName, setContractorName] = useState<string>('');
  const [periodFrom, setPeriodFrom] = useState<string>('');
  const [periodTo, setPeriodTo] = useState<string>('');
  const [remarks, setRemarks] = useState<string>('');

  // Overburden states
  const [actualOverburden, setActualOverburden] = useState<string>('8.5');

  // Tube Well (TWC) specific actuals states
  const [pilotDrillingDepth, setPilotDrillingDepth] = useState<string>('');
  const [surveyPlainPipe, setSurveyPlainPipe] = useState<string>('');
  const [surveySlottedPipe, setSurveySlottedPipe] = useState<string>('');
  const [outerCasingPipe, setOuterCasingPipe] = useState<string>('');

  // Final Bill row descriptions
  const [fbDescDrillingMl, setFbDescDrillingMl] = useState<string>('110 മില്ലീമീറ്റർ വ്യാസമുള്ള കുഴൽകിണറിന്റെ ഡ്രില്ലിംഗ് ചാർജ്');
  const [fbDescCasing10Ml, setFbDescCasing10Ml] = useState<string>('140 മില്ലീമീറ്റർ വ്യാസമുള്ള 10 കി.ഗ്രാം /ച. സെ. മീ. പിവിസി കെയ്സിംഗ് പൈപ്പിന്റെ വില');
  const [fbDescCasing8Ml, setFbDescCasing8Ml] = useState<string>('140 മില്ലീമീറ്റർ വ്യാസമുള്ള 8 കി.ഗ്രാം /ച. സെ. മീ. പിവിസി കെയ്സിംഗ് പൈപ്പിന്റെ വില');
  const [fbDescCasing6Ml, setFbDescCasing6Ml] = useState<string>('140 മില്ലീമീറ്റർ വ്യാസമുള്ള 6 കി.ഗ്രാം /ച. സെ. മീ. പിവിസി കെയ്സിംഗ് പൈപ്പിന്റെ വില');
  const [fbDescOuterMl, setFbDescOuterMl] = useState<string>('200 മില്ലീമീറ്റർ വ്യാസമുള്ള 6 കി.ഗ്രാം /ച. സെ. മീ. പിവിസി ഔട്ടര് കെയ്സിംഗ് പൈപ്പിന്റെ വില');
  const [fbDescInner6Ml, setFbDescInner6Ml] = useState<string>('110 മില്ലീമീറ്റർ വ്യാസമുള്ള 6 കി.ഗ്രാം /ച. സെ. മീ. പിവിസി ഇന്നർ കെയ്സിംഗ് പൈപ്പിന്റെ വില');
  const [fbDescInner4Ml, setFbDescInner4Ml] = useState<string>('110 മില്ലീമീറ്റർ വ്യാസമുള്ള 4 കി.ഗ്രാം /ച. സെ. മീ. പിവിസി ഇന്നർ കെയ്സിംഗ് പൈപ്പിന്റെ വില');
  const [fbDescInnerMl, setFbDescInnerMl] = useState<string>('140 മില്ലീമീറ്റർ വ്യാസമുള്ള പിവിസി കുഴൽകിണർ അടപ്പിന്റെ വില');
  const [fbDescInnerPipeMl, setFbDescInnerPipeMl] = useState<string>('110 mm വ്യാസമുള്ള ഇന്നർ കെയ്സിംഗ് പൈപ്പിന്റെ വില');

  const [fbDescDrillingEn, setFbDescDrillingEn] = useState<string>('Drilling charges for 110 mm dia borewell');
  const [fbDescCasing10En, setFbDescCasing10En] = useState<string>('140 mm dia 10 kg/cm² PVC Casing Pipe');
  const [fbDescCasing8En, setFbDescCasing8En] = useState<string>('140 mm dia 8 kg/cm² PVC Casing Pipe');
  const [fbDescCasing6En, setFbDescCasing6En] = useState<string>('140 mm dia 6 kg/cm² PVC Casing Pipe');
  const [fbDescOuterEn, setFbDescOuterEn] = useState<string>('200 mm dia 6 kg/cm² PVC Outer Casing Pipe');
  const [fbDescInner6En, setFbDescInner6En] = useState<string>('110 mm dia 6 kg/cm² PVC Inner Casing Pipe');
  const [fbDescInner4En, setFbDescInner4En] = useState<string>('110 mm dia 4 kg/cm² PVC Inner Casing Pipe');
  const [fbDescInnerEn, setFbDescInnerEn] = useState<string>('140 mm PVC Cap / Inner Casing');
  const [fbDescInnerPipeEn, setFbDescInnerPipeEn] = useState<string>('110 mm dia Inner Casing Pipe');

  // Sanction Proceedings additional paragraph states
  const [procPara4, setProcPara4] = useState<string>('');
  const [procPara5, setProcPara5] = useState<string>('');

  // Utilization Certificate paragraph states
  const [ucMlPara1, setUcMlPara1] = useState<string>('');
  const [ucMlPara2, setUcMlPara2] = useState<string>('');
  const [ucEnPara1, setUcEnPara1] = useState<string>('');
  const [ucEnPara2, setUcEnPara2] = useState<string>('');

  // Dynamic row collections for UC & Abstract tables
  const [ucRows, setUcRows] = useState<Array<{ description: string; deposited: number; expenditure: number; }>>([]);
  const [abstractRows, setAbstractRows] = useState<Array<{ siteName: string; location: string; deposited: number; expenditure: number; }>>([]);

  // Selections for Abstract of Final Bill
  const [selectedRemittanceIndices, setSelectedRemittanceIndices] = useState<number[]>([]);
  const [selectedSiteIndices, setSelectedSiteIndices] = useState<number[]>([]);

  const ucTotalDeposited = useMemo(() => ucRows.reduce((acc, r) => acc + (Number(r.deposited) || 0), 0), [ucRows]);
  const ucTotalExpenditure = useMemo(() => ucRows.reduce((acc, r) => acc + (Number(r.expenditure) || 0), 0), [ucRows]);
  const ucTotalBalance = useMemo(() => ucTotalDeposited - ucTotalExpenditure, [ucTotalDeposited, ucTotalExpenditure]);

  // Financial & Rates editable values
  const [drillingRate, setDrillingRate] = useState<number>(390);
  const [casing10kgRate, setCasing10kgRate] = useState<number>(960);
  const [casing8kgRate, setCasing8kgRate] = useState<number>(464.53);
  const [casing6kgRate, setCasing6kgRate] = useState<number>(580);
  const [outerCasingRate, setOuterCasingRate] = useState<number>(960);
  const [innerCasing6kgRate, setInnerCasing6kgRate] = useState<number>(580);
  const [innerCasing4kgRate, setInnerCasing4kgRate] = useState<number>(225);
  const [innerCasingRate, setInnerCasingRate] = useState<number>(225);
  
  const [drillingQty, setDrillingQty] = useState<number>(0);
  const [subsidyAmount, setSubsidyAmount] = useState<number>(0);
  const [advanceDeposit, setAdvanceDeposit] = useState<number>(0);
  const [ddDetails, setDdDetails] = useState<string>('');

  // Bank refund details & Proceedings state
  const [reportDate, setReportDate] = useState<string>('');
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

  useEffect(() => {
    if (officeAddress) {
      if (officeAddress.phoneNo) setUcPhone(officeAddress.phoneNo);
      if (officeAddress.email) setUcEmail(officeAddress.email);
    }
  }, [officeAddress]);

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

    // District Officer Name from Settings page and Designation from Establishment page
    const doName = officeAddress?.districtOfficer || allStaffMembers?.find(s => s.roles?.includes('District Officer') || s.designation === 'District Officer' || s.designation === 'Executive Engineer')?.name || '';
    const doStaff = allStaffMembers?.find(s => 
      (doName && s.name?.toLowerCase() === doName.toLowerCase()) || 
      s.roles?.includes('District Officer')
    );
    const doDesignation = doStaff?.designation || 'Executive Engineer';

    if (doName) setOfficerName(doName);
    if (doDesignation) setOfficerDesignation(doDesignation);
  }, [entry, selectedOffice, user, officeAddress, allStaffMembers]);

  useEffect(() => {
    if (!entry) return;

    const fNo = entry.fileNo || 'GWDKLM/794/2026';
    setFileNo(fNo);
    setApplicantName(entry.applicantName || '');
    setApplicantAddress(entry.applicantAddress || '');
    setApplicationType(entry.applicationType || moduleType.toUpperCase());

    const oCode = officeAddress?.officeCode || 'GWDKLM';
    let cleanFNo = fNo.replace(/^(GWD[A-Z]*|GWD)\//i, '');
    let computedOrderNo = cleanFNo.includes('/') ? `${oCode}/${cleanFNo}` : `${oCode}/${cleanFNo}/2026`;
    if (fNo.startsWith(oCode + '/')) {
      computedOrderNo = fNo;
    }
    setOrderNo(computedOrderNo);

    // Format date as dd/mm/yyyy
    const today = new Date();
    const dd = String(today.getDate()).padStart(2, '0');
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const yyyy = today.getFullYear();
    const todayFormatted = `${dd}/${mm}/${yyyy}`;
    setOrderDate(todayFormatted);
    setReportDate(todayFormatted);

    const refNo = `AE/1/${fNo}`;
    setRefLetterNo(refNo);
    setRefLetterDate(todayFormatted);

    // Financial remittance
    const depositTotal = entry.remittanceDetails?.reduce((sum, r) => sum + (Number(r.amountRemitted) || 0), 0) || 0;
    setAdvanceDeposit(depositTotal);
    const firstRemittance = entry.remittanceDetails?.[0];
    const rawRemittanceDate = firstRemittance?.dateOfRemittance ? formatDateDDMMYYYY(firstRemittance.dateOfRemittance) : '';
    const ddStr = formatDatesInText(
      firstRemittance
        ? `DD No. ${firstRemittance.remittanceRemarks || ''} Dated ${rawRemittanceDate}`
        : ''
    );
    setDdDetails(ddStr);

    let localTotalExpenditure = 0;
    let localNetPayable = 0;

    if (currentSite) {
      setSiteName(currentSite.nameOfSite || entry.applicantName || '');
      setLatitude(currentSite.latitude ? String(currentSite.latitude) : '');
      setLongitude(currentSite.longitude ? String(currentSite.longitude) : '');
      setLocalSelfGovt(currentSite.localSelfGovt || '');
      setConstituency(currentSite.constituency || '');
      setSurveyRecommendedTD(currentSite.surveyRecommendedTD ? String(currentSite.surveyRecommendedTD) : '');
      setSurveyRecommendedOB(currentSite.surveyRecommendedOB ? String(currentSite.surveyRecommendedOB) : (currentSite.surveyOB ? String(currentSite.surveyOB) : ''));
      setSurveyLocation(currentSite.surveyLocation || '');

      const depth = parseNum(currentSite.totalDepth);
      setDepthMeter(depth);
      setDrillingQty(depth);

      setDiameter(currentSite.diameter || 'Ø 110 മില്ലീമീറ്റർ');

      const c10 = parseNum(currentSite.casing10kgPipe);
      const c8 = parseNum((currentSite as any).casing8kgPipe);
      const rawC6 = parseNum(currentSite.casing6kgPipe);
      const rawPipeUsed = parseNum(currentSite.casingPipeUsed);
      const rawSurveyCasing = parseNum(currentSite.surveyRecommendedCasingPipe);

      const is6kgDefined = currentSite.casing6kgPipe !== undefined && currentSite.casing6kgPipe !== null;
      const is10kgDefined = currentSite.casing10kgPipe !== undefined && currentSite.casing10kgPipe !== null;
      const is8kgDefined = (currentSite as any).casing8kgPipe !== undefined && (currentSite as any).casing8kgPipe !== null;

      let c6 = rawC6;
      if (!is6kgDefined && !is8kgDefined && !is10kgDefined && c10 === 0 && c8 === 0 && c6 === 0) {
        c6 = rawPipeUsed || rawSurveyCasing || 0;
      }

      setCasing10kgQty(c10);
      setCasing8kgQty(c8);
      setCasing6kgQty(c6);
      const outerQty = parseNum(currentSite.outerCasingPipe);
      const in6Qty = parseNum(currentSite.innerCasing6kgPipe);
      const rawIn4Qty = parseNum(currentSite.innerCasing4kgPipe);
      const in4Qty = rawIn4Qty > 0 ? rawIn4Qty : (!in6Qty ? parseNum(currentSite.innerCasingPipe) : 0);
      setOuterCasingQty(outerQty);
      setInnerCasing6kgQty(in6Qty);
      setInnerCasing4kgQty(in4Qty);
      setInnerCasingQty((!in6Qty && !rawIn4Qty) ? parseNum(currentSite.innerCasingPipe) : 0);

      setEndCap(currentSite.endCap || 'No');

      const yl = Number(currentSite.yieldDischarge) || 0;
      setYieldLph(yl);

      setWaterStruckZone(currentSite.zoneDetails || '');

      const wl = (currentSite.waterLevel !== undefined && currentSite.waterLevel !== null && currentSite.waterLevel !== '') ? currentSite.waterLevel : '';
      setStaticWaterLevel(wl);

      let rigStr = currentSite.typeOfRig || '';
      if (currentSite.drillingRigNo) rigStr += ` (Rig: ${currentSite.drillingRigNo})`;
      if (currentSite.compressorNo) rigStr += ` (Comp: ${currentSite.compressorNo})`;
      setRigUsed(rigStr);

      setContractorName(currentSite.contractorName || '');
      setPeriodFrom((currentSite as any).startDate || (currentSite as any).dateOfCommencement || '');
      setPeriodTo(currentSite.dateOfCompletion || '');
      setRemarks(currentSite.drillingRemarks || currentSite.workRemarks || '');

      // Load other actual fields
      setActualOverburden(currentSite.surveyOB ? String(currentSite.surveyOB) : (currentSite.surveyRecommendedOB ? String(currentSite.surveyRecommendedOB) : ''));
      setPilotDrillingDepth(currentSite.pilotDrillingDepth || '');
      setSurveyPlainPipe(currentSite.surveyPlainPipe || '');
      setSurveySlottedPipe(currentSite.surveySlottedPipe || '');
      setOuterCasingPipe(currentSite.outerCasingPipe || '');

      // Formulate default dynamic descriptions
      const diaVal = currentSite.diameter || '110';
      const isDia150 = diaVal.includes('150') || diaVal.includes('6');
      const casingDia = isDia150 ? '180 മില്ലീമീറ്റർ' : '140 മില്ലീമീറ്റർ';
      const casingDiaEn = isDia150 ? '180 mm' : '140 mm';
      const drillingDia = isDia150 ? '150 മില്ലീമീറ്റർ' : '110 മില്ലീമീറ്റർ';
      const drillingDiaEn = isDia150 ? '150 mm' : '110 mm';

      setFbDescDrillingMl(`${drillingDia} വ്യാസമുള്ള കുഴൽകിണറിന്റെ ഡ്രില്ലിംഗ് ചാർജ്`);
      setFbDescCasing10Ml(`${casingDia} വ്യാസമുള്ള 10 കി.ഗ്രാം /ച. സെ. മീ. പിവിസി കെയ്സിംഗ് പൈപ്പിന്റെ വില`);
      setFbDescCasing8Ml(`${casingDia} വ്യാസമുള്ള 8 കി.ഗ്രാം /ച. സെ. മീ. പിവിസി കെയ്സിംഗ് പൈപ്പിന്റെ വില`);
      setFbDescCasing6Ml(`${casingDia} വ്യാസമുള്ള 6 കി.ഗ്രാം /ച. സെ. മീ. പിവിസി കെയ്സിംഗ് പൈപ്പിന്റെ വില`);
      setFbDescInnerMl(`${casingDia} വ്യാസമുള്ള പിവിസി കുഴൽകിണർ അടപ്പിന്റെ വില`);

      setFbDescDrillingEn(`Drilling charges for ${drillingDiaEn} dia borewell`);
      setFbDescCasing10En(`${casingDiaEn} dia 10 kg/cm² PVC Casing Pipe`);
      setFbDescCasing8En(`${casingDiaEn} dia 8 kg/cm² PVC Casing Pipe`);
      setFbDescCasing6En(`${casingDiaEn} dia 6 kg/cm² PVC Casing Pipe`);
      setFbDescInnerEn(`${casingDiaEn} PVC Cap / Inner Casing`);

      // Calculate localized net payable
      const appTypeStr = (applicationType || entry?.applicationType || currentSite?.applicationType || '').toLowerCase();
      const isPrivateIrrigation = appTypeStr.includes('irrigation') || appTypeStr.includes('private_irrigation') || appTypeStr.includes('private irrigation');
      const depthForSubsidy = Math.min(depth || drillingQty || 0, 120);

      const isYieldZero = yl === 0 || parseNum(currentSite.yieldDischarge) === 0 || currentSite.yieldDischarge === '0' || currentSite.yieldDischarge === 0;
      const workStatusStr = (currentSite.workStatus || (entry as any)?.workStatus || '').toString().toLowerCase();
      const isWorkFailed = workStatusStr.includes('failed') || workStatusStr.includes('പരാജയ');
      const isFailedOrZeroYield = isYieldZero || isWorkFailed;

      const subsidyRate = isFailedOrZeroYield ? 0.75 : 0.50;
      const calculatedPrivateSubsidy = (depthForSubsidy * drillingRate) * subsidyRate;

      const localSubsidy = (isPrivateIrrigation || isFailedOrZeroYield || isPrivateWork) 
        ? (Number((currentSite as any)?.subsidyAmount) || Number((entry as any)?.subsidyAmount) || calculatedPrivateSubsidy)
        : (Number((currentSite as any)?.subsidyAmount) || Number((entry as any)?.subsidyAmount) || 0);
      setSubsidyAmount(localSubsidy);

      const localEndCap = currentSite.endCap || 'No';
      const localDrillingTotal = drillingRate * depth;
      const localCasing10Total = casing10kgRate * c10;
      const localCasing8Total = casing8kgRate * c8;
      const localCasing6Total = casing6kgRate * c6;
      const localOuterTotal = outerCasingRate * outerQty;
      const localInner6Total = innerCasing6kgRate * in6Qty;
      const localInner4Total = innerCasing4kgRate * (in4Qty || (localEndCap === 'Yes' && in6Qty === 0 ? 1 : 0));
      const localInnerTotal = localOuterTotal + localInner6Total + localInner4Total;
      localTotalExpenditure = localDrillingTotal + localCasing10Total + localCasing8Total + localCasing6Total + localInnerTotal;
      localNetPayable = localTotalExpenditure - localSubsidy;
    }

    setProceedingsSubject(
      `GWD, ${district} - Construction of borewell at ${entry.applicantName || ''}${entry.applicantAddress ? `, ${entry.applicantAddress}` : ''} - Refund of balance amount and remittance of drilling charges to revenue head - Sanctioned - Orders issued - reg.`
    );
    setProceedingsRef1(formatDatesInText(`1. Application of ${entry.applicantName || ''} and DD details (${ddStr}).`));
    setProceedingsRef2(`2. Final Bill of this office, dated ${todayFormatted}.`);

    const doName = officeAddress?.districtOfficer || allStaffMembers?.find(s => s.roles?.includes('District Officer') || s.designation === 'District Officer' || s.designation === 'Executive Engineer')?.name || '';
    setUcFrom('ജില്ലാ ഓഫീസർ');
    setUcTo(`അസിസ്റ്റന്റ് എൻജിനീയർ\n${currentSite?.localSelfGovt || 'ഗ്രാമപഞ്ചായത്ത്'}`);
    setUcSubject(
      `ഭൂജല വകുപ്പ്, ${districtMl} - ${currentSite?.localSelfGovt || 'പഞ്ചായത്ത്'} കുടിവെള്ള പദ്ധതി - കുഴൽകിണർ നിർമ്മാണം - ധനവിനിയോഗ സാക്ഷ്യപത്രം നൽകുന്നത് - സംബന്ധിച്ച്.`
    );
    setUcRef1(`കത്ത് നമ്പർ GWD/${fNo.replace(/\//g, '-')}/2026 തീയതി ${todayFormatted}`);
    setUcRef2(`പൂർത്തീകരണ റിപ്പോർട്ട് & ഫൈനൽ ബിൽ`);

    const localNetPayableFinal = localNetPayable || (drillingRate * drillingQty) - subsidyAmount;
    const localTotalExpenditureFinal = localTotalExpenditure || (drillingRate * drillingQty);
    const localBalanceRefund = depositTotal - localNetPayableFinal;

    setProcPara4(
      `Sanction is also hereby accorded to remit an amount of Rs. ${localNetPayableFinal.toLocaleString('en-IN')}/- (${numberToWordsEnglish(localNetPayableFinal)}) to Department Revenue head 0702-02-800-99-other receipts, being the Borewell construction charges.`
    );

    const stsbAccountText = officeAddress?.stsbAccountNo 
      ? `into STSB Account No. ${officeAddress.stsbAccountNo}` 
      : 'into STSB Account';
    const treasuryText = officeAddress?.nameOfTreasury 
      ? ` of the District Officer, Ground Water Department, ${district} at Treasury ${officeAddress.nameOfTreasury}` 
      : ` of the District Officer, Ground Water Department, ${district}`;

    setProcPara5(
      `The expenditure shall be met from the gross amount of Rs. ${depositTotal.toLocaleString('en-IN')}/- deposited by the applicant ${stsbAccountText}${treasuryText}.`
    );

    setUcMlPara1('');
    setUcMlPara2('');
    setUcEnPara1('');
    setUcEnPara2('');

    // Initialize dynamic collections
    setUcRows(sites.map(s => {
      const sDepth = parseNum(s.totalDepth);
      const sDrilling = drillingRate * sDepth;
      const sC10Val = parseNum(s.casing10kgPipe);
      const sC8Val = parseNum((s as any).casing8kgPipe);
      const sC6Raw = parseNum(s.casing6kgPipe);
      const sPipeUsed = parseNum(s.casingPipeUsed);
      const sSurveyCasing = parseNum(s.surveyRecommendedCasingPipe);
      const sHas6kg = s.casing6kgPipe !== undefined && s.casing6kgPipe !== null;
      const sHas10kg = s.casing10kgPipe !== undefined && s.casing10kgPipe !== null;
      const sHas8kg = (s as any).casing8kgPipe !== undefined && (s as any).casing8kgPipe !== null;
      const sC6Val = sHas6kg ? sC6Raw : (!sHas10kg && !sHas8kg && sC10Val === 0 && sC8Val === 0 ? (sPipeUsed || sSurveyCasing) : 0);

      const sC10 = casing10kgRate * sC10Val;
      const sC8 = casing8kgRate * sC8Val;
      const sC6 = casing6kgRate * sC6Val;
      const sIn6_1 = parseNum(s.innerCasing6kgPipe);
      const sIn4Raw_1 = parseNum(s.innerCasing4kgPipe);
      const sIn4_1 = sIn4Raw_1 > 0 ? sIn4Raw_1 : (!sIn6_1 ? parseNum(s.innerCasingPipe) : 0);
      const sInner = (innerCasing6kgRate * sIn6_1) + (innerCasing4kgRate * sIn4_1) + ((s.endCap === 'Yes' && sIn6_1 === 0 && sIn4_1 === 0) ? innerCasingRate : 0);
      const sCost = sDrilling + sC10 + sC8 + sC6 + sInner;
      return {
        description: s.nameOfSite || entry?.applicantName || 'Borewell Construction',
        deposited: depositTotal / (sites.length || 1),
        expenditure: sCost,
      };
    }));

    setAbstractRows(sites.map(s => {
      const sDepth = parseNum(s.totalDepth);
      const sDrilling = drillingRate * sDepth;
      const sC10Val = parseNum(s.casing10kgPipe);
      const sC8Val = parseNum((s as any).casing8kgPipe);
      const sC6Raw = parseNum(s.casing6kgPipe);
      const sPipeUsed = parseNum(s.casingPipeUsed);
      const sSurveyCasing = parseNum(s.surveyRecommendedCasingPipe);
      const sHas6kg = s.casing6kgPipe !== undefined && s.casing6kgPipe !== null;
      const sHas10kg = s.casing10kgPipe !== undefined && s.casing10kgPipe !== null;
      const sHas8kg = (s as any).casing8kgPipe !== undefined && (s as any).casing8kgPipe !== null;
      const sC6Val = sHas6kg ? sC6Raw : (!sHas10kg && !sHas8kg && sC10Val === 0 && sC8Val === 0 ? (sPipeUsed || sSurveyCasing) : 0);

      const sC10 = casing10kgRate * sC10Val;
      const sC8 = casing8kgRate * sC8Val;
      const sC6 = casing6kgRate * sC6Val;
      const sIn6_2 = parseNum(s.innerCasing6kgPipe);
      const sIn4Raw_2 = parseNum(s.innerCasing4kgPipe);
      const sIn4_2 = sIn4Raw_2 > 0 ? sIn4Raw_2 : (!sIn6_2 ? parseNum(s.innerCasingPipe) : 0);
      const sInner2 = (innerCasing6kgRate * sIn6_2) + (innerCasing4kgRate * sIn4_2) + ((s.endCap === 'Yes' && sIn6_2 === 0 && sIn4_2 === 0) ? innerCasingRate : 0);
      const sCost = sDrilling + sC10 + sC8 + sC6 + sInner2;
      return {
        siteName: s.nameOfSite || '',
        location: s.localSelfGovt || 'LSGD',
        deposited: depositTotal / (sites.length || 1),
        expenditure: sCost,
      };
    }));

    // Apply saved overrides if present on entry
    const savedOverrides: Record<string, any> = (entry as any)?.reportOverrides || (entry as any)?.printOverrides || {};
    if (savedOverrides.fileNo) setFileNo(savedOverrides.fileNo);
    if (savedOverrides.applicantName) setApplicantName(savedOverrides.applicantName);
    if (savedOverrides.applicantAddress) setApplicantAddress(savedOverrides.applicantAddress);
    if (savedOverrides.applicationType) setApplicationType(savedOverrides.applicationType);

    if (savedOverrides.orderNo) setOrderNo(savedOverrides.orderNo);
    if (savedOverrides.orderDate) setOrderDate(savedOverrides.orderDate);
    if (savedOverrides.reportDate) setReportDate(savedOverrides.reportDate);
    if (savedOverrides.refLetterNo) setRefLetterNo(savedOverrides.refLetterNo);
    if (savedOverrides.refLetterDate) setRefLetterDate(savedOverrides.refLetterDate);

    if (savedOverrides.advanceDeposit !== undefined) setAdvanceDeposit(savedOverrides.advanceDeposit);
    if (savedOverrides.ddDetails !== undefined) setDdDetails(savedOverrides.ddDetails);

    if (savedOverrides.drillingRate !== undefined) setDrillingRate(savedOverrides.drillingRate);
    if (savedOverrides.casing10kgRate !== undefined) setCasing10kgRate(savedOverrides.casing10kgRate);
    if (savedOverrides.casing8kgRate !== undefined) setCasing8kgRate(savedOverrides.casing8kgRate);
    if (savedOverrides.casing6kgRate !== undefined) setCasing6kgRate(savedOverrides.casing6kgRate);
    if (savedOverrides.outerCasingRate !== undefined) setOuterCasingRate(savedOverrides.outerCasingRate);
    if (savedOverrides.innerCasing6kgRate !== undefined) setInnerCasing6kgRate(savedOverrides.innerCasing6kgRate);
    if (savedOverrides.innerCasing4kgRate !== undefined) setInnerCasing4kgRate(savedOverrides.innerCasing4kgRate);
    if (savedOverrides.innerCasingRate !== undefined) setInnerCasingRate(savedOverrides.innerCasingRate);

    // Site-specific overrides lookup
    const rawSiteIndex = entry.siteDetails?.findIndex((s: any) => s === currentSite || (s.nameOfSite && currentSite?.nameOfSite && s.nameOfSite === currentSite.nameOfSite)) ?? -1;
    const siteId = (currentSite as any)?.id;
    const siteOv = (siteId && savedOverrides.siteOverrides?.[siteId])
      || (savedOverrides.siteOverrides && savedOverrides.siteOverrides[selectedSiteIndex])
      || (rawSiteIndex >= 0 && savedOverrides.siteOverrides ? savedOverrides.siteOverrides[rawSiteIndex] : undefined)
      || (sites.length <= 1 && selectedSiteIndex === 0 && !savedOverrides.siteOverrides ? savedOverrides : undefined);

    if (siteOv) {
      if (siteOv.drillingQty !== undefined) setDrillingQty(siteOv.drillingQty);
      if (siteOv.casing10kgQty !== undefined) setCasing10kgQty(siteOv.casing10kgQty);
      if (siteOv.casing8kgQty !== undefined) setCasing8kgQty(siteOv.casing8kgQty);
      if (siteOv.casing6kgQty !== undefined) setCasing6kgQty(siteOv.casing6kgQty);
      if (siteOv.outerCasingQty !== undefined) setOuterCasingQty(siteOv.outerCasingQty);
      if (siteOv.innerCasing6kgQty !== undefined) setInnerCasing6kgQty(siteOv.innerCasing6kgQty);
      if (siteOv.innerCasing4kgQty !== undefined) setInnerCasing4kgQty(siteOv.innerCasing4kgQty);
      if (siteOv.innerCasingQty !== undefined) setInnerCasingQty(siteOv.innerCasingQty);
      if (siteOv.depthMeter !== undefined) setDepthMeter(siteOv.depthMeter);
      if (siteOv.actualOverburden !== undefined) setActualOverburden(siteOv.actualOverburden);
      if (siteOv.pilotDrillingDepth !== undefined) setPilotDrillingDepth(siteOv.pilotDrillingDepth);
      if (siteOv.surveyPlainPipe !== undefined) setSurveyPlainPipe(siteOv.surveyPlainPipe);
      if (siteOv.surveySlottedPipe !== undefined) setSurveySlottedPipe(siteOv.surveySlottedPipe);
      if (siteOv.outerCasingPipe !== undefined) setOuterCasingPipe(siteOv.outerCasingPipe);
      if (siteOv.endCap !== undefined) setEndCap(siteOv.endCap);
      if (siteOv.yieldLph !== undefined) setYieldLph(siteOv.yieldLph);
      if (siteOv.staticWaterLevel !== undefined) setStaticWaterLevel(siteOv.staticWaterLevel);
      if (siteOv.waterStruckZone !== undefined) setWaterStruckZone(siteOv.waterStruckZone);
      if (siteOv.diameter !== undefined) setDiameter(siteOv.diameter);
      if (siteOv.siteName !== undefined) setSiteName(siteOv.siteName);
      if (siteOv.localSelfGovt !== undefined) setLocalSelfGovt(siteOv.localSelfGovt);
      if (siteOv.constituency !== undefined) setConstituency(siteOv.constituency);
      if (siteOv.contractorName !== undefined) setContractorName(siteOv.contractorName);
      if (siteOv.periodFrom !== undefined) setPeriodFrom(siteOv.periodFrom);
      if (siteOv.periodTo !== undefined) setPeriodTo(siteOv.periodTo);
      if (siteOv.remarks !== undefined) setRemarks(siteOv.remarks);
      if (siteOv.rigUsed !== undefined) setRigUsed(siteOv.rigUsed);
      if (siteOv.reportDate !== undefined) setReportDate(siteOv.reportDate);

      if (siteOv.fbDescDrillingMl) setFbDescDrillingMl(siteOv.fbDescDrillingMl);
      if (siteOv.fbDescCasing10Ml) setFbDescCasing10Ml(siteOv.fbDescCasing10Ml);
      if (siteOv.fbDescCasing8Ml) setFbDescCasing8Ml(siteOv.fbDescCasing8Ml);
      if (siteOv.fbDescCasing6Ml) setFbDescCasing6Ml(siteOv.fbDescCasing6Ml);
      if (siteOv.fbDescOuterMl) setFbDescOuterMl(siteOv.fbDescOuterMl);
      if (siteOv.fbDescInnerMl) setFbDescInnerMl(siteOv.fbDescInnerMl);
      if (siteOv.fbDescInnerPipeMl) setFbDescInnerPipeMl(siteOv.fbDescInnerPipeMl);

      if (siteOv.fbDescDrillingEn) setFbDescDrillingEn(siteOv.fbDescDrillingEn);
      if (siteOv.fbDescCasing10En) setFbDescCasing10En(siteOv.fbDescCasing10En);
      if (siteOv.fbDescCasing8En) setFbDescCasing8En(siteOv.fbDescCasing8En);
      if (siteOv.fbDescCasing6En) setFbDescCasing6En(siteOv.fbDescCasing6En);
      if (siteOv.fbDescOuterEn) setFbDescOuterEn(siteOv.fbDescOuterEn);
      if (siteOv.fbDescInnerEn) setFbDescInnerEn(siteOv.fbDescInnerEn);
      if (siteOv.fbDescInnerPipeEn) setFbDescInnerPipeEn(siteOv.fbDescInnerPipeEn);
    }

    if (savedOverrides.subsidyAmount !== undefined) setSubsidyAmount(savedOverrides.subsidyAmount);

    if (savedOverrides.bankAccountNo) setBankAccountNo(savedOverrides.bankAccountNo);
    if (savedOverrides.bankIfsc) setBankIfsc(savedOverrides.bankIfsc);
    if (savedOverrides.bankName) setBankName(savedOverrides.bankName);
    if (savedOverrides.bankBranch) setBankBranch(savedOverrides.bankBranch);

    if (savedOverrides.proceedingsSubject) setProceedingsSubject(savedOverrides.proceedingsSubject);
    if (savedOverrides.proceedingsRef1) setProceedingsRef1(savedOverrides.proceedingsRef1);
    if (savedOverrides.proceedingsRef2) setProceedingsRef2(savedOverrides.proceedingsRef2);
    if (savedOverrides.procPara4) setProcPara4(savedOverrides.procPara4);
    if (savedOverrides.procPara5) setProcPara5(savedOverrides.procPara5);

    if (savedOverrides.ucPhone) setUcPhone(savedOverrides.ucPhone);
    if (savedOverrides.ucEmail) setUcEmail(savedOverrides.ucEmail);
    if (savedOverrides.ucFrom) setUcFrom(savedOverrides.ucFrom);
    if (savedOverrides.ucTo) setUcTo(savedOverrides.ucTo);
    if (savedOverrides.ucSubject) setUcSubject(savedOverrides.ucSubject);
    if (savedOverrides.ucRef1) setUcRef1(savedOverrides.ucRef1);
    if (savedOverrides.ucRef2) setUcRef2(savedOverrides.ucRef2);
    if (savedOverrides.ucMlPara1) setUcMlPara1(savedOverrides.ucMlPara1);
    if (savedOverrides.ucMlPara2) setUcMlPara2(savedOverrides.ucMlPara2);
    if (savedOverrides.ucEnPara1) setUcEnPara1(savedOverrides.ucEnPara1);
    if (savedOverrides.ucEnPara2) setUcEnPara2(savedOverrides.ucEnPara2);

    if (savedOverrides.district) setDistrict(savedOverrides.district);
    if (savedOverrides.districtMl) setDistrictMl(savedOverrides.districtMl);
    if (savedOverrides.subOfficeLocation) setSubOfficeLocation(savedOverrides.subOfficeLocation);
    if (savedOverrides.subOfficeLocationMl) setSubOfficeLocationMl(savedOverrides.subOfficeLocationMl);
    if (savedOverrides.officerName) setOfficerName(savedOverrides.officerName);
    if (savedOverrides.officerDesignation) setOfficerDesignation(savedOverrides.officerDesignation);

    if (savedOverrides.selectedRemittanceIndices && Array.isArray(savedOverrides.selectedRemittanceIndices)) {
      setSelectedRemittanceIndices(savedOverrides.selectedRemittanceIndices);
    }
    if (savedOverrides.selectedSiteIndices && Array.isArray(savedOverrides.selectedSiteIndices)) {
      setSelectedSiteIndices(savedOverrides.selectedSiteIndices);
    }

  }, [entry, currentSite, selectedSiteIndex, moduleType, sites, isPrivateWork, officeAddress?.officeCode]);

  // Derived Calculations
  const appTypeStr = (applicationType || entry?.applicationType || currentSite?.applicationType || '').toLowerCase();
  const isPrivateIrrigation = appTypeStr.includes('irrigation') || appTypeStr.includes('private_irrigation') || appTypeStr.includes('private irrigation');
  
  const isYieldZero = yieldLph === 0 || parseNum(currentSite?.yieldDischarge) === 0 || currentSite?.yieldDischarge === '0' || currentSite?.yieldDischarge === 0;
  const workStatusStr = (currentSite?.workStatus || (entry as any)?.workStatus || '').toString().toLowerCase();
  const isWorkFailed = workStatusStr.includes('failed') || workStatusStr.includes('പരാജയ');
  const isFailedOrZeroYield = isYieldZero || isWorkFailed;

  const subsidyEligibleDepth = Math.min(drillingQty || depthMeter || 0, 120);
  const subsidyRate = isFailedOrZeroYield ? 0.75 : 0.50;
  const calculatedPrivateSubsidy = (isPrivateIrrigation || isFailedOrZeroYield || (isPrivateWork && subsidyAmount > 0))
    ? (subsidyEligibleDepth * drillingRate * subsidyRate)
    : 0;
  const effectiveSubsidyAmount = isFailedOrZeroYield
    ? (subsidyAmount === 0 || subsidyAmount === subsidyEligibleDepth * drillingRate * 0.5 ? calculatedPrivateSubsidy : subsidyAmount)
    : ((isPrivateIrrigation && subsidyAmount === 0) ? calculatedPrivateSubsidy : subsidyAmount);

  const drillingTotal = drillingRate * drillingQty;
  const casing10kgTotal = casing10kgRate * casing10kgQty;
  const casing8kgTotal = casing8kgRate * casing8kgQty;
  const casing6kgTotal = casing6kgRate * casing6kgQty;
  const outerCasingTotal = outerCasingRate * outerCasingQty;
  const innerCasing6kgTotal = innerCasing6kgRate * innerCasing6kgQty;

  const effectiveInner4kgQty = innerCasing4kgQty > 0 
    ? innerCasing4kgQty 
    : ((!innerCasing6kgQty && innerCasingQty > 0) ? innerCasingQty : 0);
  const effectiveInnerCasingQty = effectiveInner4kgQty;
  const innerCasing4kgTotal = innerCasing4kgRate * effectiveInner4kgQty;
  const capTotal = endCap === 'Yes' ? innerCasingRate : 0;
  const innerCasingTotal = innerCasing6kgTotal + innerCasing4kgTotal + capTotal;

  const totalExpenditure = drillingTotal + casing10kgTotal + casing8kgTotal + casing6kgTotal + outerCasingTotal + innerCasing6kgTotal + innerCasing4kgTotal + capTotal;
  const netPayableGwd = totalExpenditure - effectiveSubsidyAmount;
  const balanceRefund = advanceDeposit - Math.round(netPayableGwd);

  // Remittances collection for Abstract selection
  const allRemittances = useMemo(() => {
    if (entry?.remittanceDetails && entry.remittanceDetails.length > 0) {
      return entry.remittanceDetails;
    }
    return [{
      amountRemitted: advanceDeposit,
      dateOfRemittance: '',
      remittanceRemarks: ddDetails,
    }];
  }, [entry?.remittanceDetails, advanceDeposit, ddDetails]);

  useEffect(() => {
    if (entry?.remittanceDetails && entry.remittanceDetails.length > 0) {
      setSelectedRemittanceIndices(entry.remittanceDetails.map((_, i) => i));
    } else {
      setSelectedRemittanceIndices([0]);
    }
  }, [entry, isOpen]);

  useEffect(() => {
    if (sites && sites.length > 0) {
      setSelectedSiteIndices(sites.map((_, i) => i));
    } else {
      setSelectedSiteIndices([0]);
    }
  }, [sites, isOpen]);

  const abstractRemittanceRows = useMemo(() => {
    return selectedRemittanceIndices.map((rIdx) => {
      const r = allRemittances[rIdx];
      if (!r) return null;
      const rAmt = Number(r.amountRemitted) || Number((r as any).remittanceAmount) || 0;
      const rawDate = r.dateOfRemittance ? formatDateDDMMYYYY(r.dateOfRemittance) : '';
      const dateStr = formatDatesInText(rawDate);
      const remarks = r.remittanceRemarks || (r as any).ddNo || (r as any).chalanNo || '';
      
      let ddDetailsPart = '';
      if (remarks && dateStr) {
        ddDetailsPart = ` (DD No. ${remarks} Dated ${dateStr})`;
      } else if (remarks) {
        ddDetailsPart = ` (DD No. ${remarks})`;
      } else if (dateStr) {
        ddDetailsPart = ` (Dated ${dateStr})`;
      }

      return {
        rIdx,
        descMl: `അപേക്ഷകൻ മുൻകൂറായി അടച്ചിട്ടുള്ള തുക${ddDetailsPart}`,
        descEn: `Advance Deposited by Applicant${ddDetailsPart}`,
        amount: rAmt,
      };
    }).filter(Boolean) as Array<{ rIdx: number; descMl: string; descEn: string; amount: number }>;
  }, [selectedRemittanceIndices, allRemittances]);

  const totalRemittanceAmount = useMemo(() => {
    const sum = abstractRemittanceRows.reduce((sum, r) => sum + r.amount, 0);
    return sum > 0 ? sum : (advanceDeposit || 0);
  }, [abstractRemittanceRows, advanceDeposit]);

  const siteFinancials = useMemo(() => {
    return sites.map((s, sIdx) => {
      if (!s) return null;

      // If this is the currently active/viewed site in Final Bill, use the live state values
      const isCurrentActive = sIdx === selectedSiteIndex;

      const sDepth = isCurrentActive ? (drillingQty || depthMeter || 0) : parseNum(s.totalDepth);
      const sDrillingR = drillingRate;
      const sDrilling = sDrillingR * sDepth;

      const sC10Val = isCurrentActive ? casing10kgQty : parseNum(s.casing10kgPipe);
      const sC8Val = isCurrentActive ? casing8kgQty : parseNum((s as any).casing8kgPipe);
      const sC6Raw = parseNum(s.casing6kgPipe);
      const sPipeUsed = parseNum(s.casingPipeUsed);
      const sSurveyCasing = parseNum(s.surveyRecommendedCasingPipe);

      const sHas6kg = s.casing6kgPipe !== undefined && s.casing6kgPipe !== null;
      const sHas10kg = s.casing10kgPipe !== undefined && s.casing10kgPipe !== null;
      const sHas8kg = (s as any).casing8kgPipe !== undefined && (s as any).casing8kgPipe !== null;
      const sC6Val = isCurrentActive ? casing6kgQty : (sHas6kg ? sC6Raw : (!sHas10kg && !sHas8kg && sC10Val === 0 && sC8Val === 0 ? (sPipeUsed || sSurveyCasing) : 0));

      const sOuterVal = isCurrentActive ? outerCasingQty : parseNum((s as any).outerCasingPipe);

      const sC10 = casing10kgRate * sC10Val;
      const sC8 = casing8kgRate * sC8Val;
      const sC6 = casing6kgRate * sC6Val;
      const sOuter = outerCasingRate * sOuterVal;

      const sIn6_3 = isCurrentActive ? innerCasing6kgQty : parseNum(s.innerCasing6kgPipe);
      const sIn4Raw_3 = isCurrentActive ? innerCasing4kgQty : parseNum(s.innerCasing4kgPipe);
      const sIn4_3 = sIn4Raw_3 > 0 ? sIn4Raw_3 : ((!sIn6_3 && !isCurrentActive) ? parseNum(s.innerCasingPipe) : (isCurrentActive && !innerCasing6kgQty && innerCasingQty > 0 ? innerCasingQty : 0));
      const sInnerQty = sIn6_3 + sIn4_3;
      const sCapYes = isCurrentActive ? (endCap === 'Yes') : (s.endCap === 'Yes');
      const sInner = (innerCasing6kgRate * sIn6_3) + (innerCasing4kgRate * sIn4_3) + (sCapYes ? innerCasingRate : 0);

      const sTotalExpenditure = sDrilling + sC10 + sC8 + sC6 + sOuter + sInner;

      // Site subsidy
      const sAppTypeStr = (applicationType || entry?.applicationType || s.applicationType || '').toLowerCase();
      const sIsPrivateIrrigation = sAppTypeStr.includes('irrigation') || sAppTypeStr.includes('private_irrigation') || sAppTypeStr.includes('private irrigation');
      
      const sYield = isCurrentActive ? yieldLph : (Number(s.yieldDischarge) || 0);
      const sIsYieldZero = sYield === 0 || parseNum(s.yieldDischarge) === 0 || s.yieldDischarge === '0';
      const sWorkStatusStr = (s.workStatus || (entry as any)?.workStatus || '').toString().toLowerCase();
      const sIsWorkFailed = sWorkStatusStr.includes('failed') || sWorkStatusStr.includes('പരാജയ');
      const sIsFailedOrZeroYield = sIsYieldZero || sIsWorkFailed;

      const sSubsidyDepth = Math.min(sDepth, 120);
      const sSubsidyRate = sIsFailedOrZeroYield ? 0.75 : 0.50;
      const sCalculatedSubsidy = (sIsPrivateIrrigation || sIsFailedOrZeroYield || isPrivateWork) 
        ? (sSubsidyDepth * drillingRate * sSubsidyRate) 
        : 0;

      let sSiteSubsidy = 0;
      if (isCurrentActive) {
        sSiteSubsidy = effectiveSubsidyAmount;
      } else {
        if (sIsFailedOrZeroYield) {
          sSiteSubsidy = sCalculatedSubsidy;
        } else if (sIsPrivateIrrigation) {
          sSiteSubsidy = (s.subsidyAmount !== undefined && s.subsidyAmount !== null && Number(s.subsidyAmount) > 0)
            ? Number(s.subsidyAmount)
            : sCalculatedSubsidy;
        } else if (isPrivateWork) {
          sSiteSubsidy = (s.subsidyAmount !== undefined && s.subsidyAmount !== null && Number(s.subsidyAmount) > 0)
            ? Number(s.subsidyAmount)
            : sCalculatedSubsidy;
        } else {
          sSiteSubsidy = Number(s.subsidyAmount) || 0;
        }
      }

      const sNetPayableRaw = sTotalExpenditure - sSiteSubsidy;
      const sNetPayable = Math.round(sNetPayableRaw);
      const sName = s.nameOfSite || entry?.applicantName || `Site #${sIdx + 1}`;
      const sLoc = s.surveyLocation || s.localSelfGovt || '';

      return {
        sIdx,
        siteName: sName,
        location: sLoc,
        purpose: s.purpose || 'BWC',
        depth: sDepth,
        drillingCost: sDrilling,
        casing10Qty: sC10Val,
        casing10Cost: sC10,
        casing8Qty: sC8Val,
        casing8Cost: sC8,
        casing6Qty: sC6Val,
        casing6Cost: sC6,
        outerQty: sOuterVal,
        outerCost: sOuter,
        innerQty: sInnerQty,
        innerCost: sInner,
        totalExpenditure: sTotalExpenditure,
        isFailedOrZeroYield: sIsFailedOrZeroYield,
        subsidyAmount: sSiteSubsidy,
        netPayable: sNetPayable,
        netPayableRaw: sNetPayableRaw,
      };
    }).filter(Boolean) as Array<{
      sIdx: number;
      siteName: string;
      location: string;
      purpose: string;
      depth: number;
      drillingCost: number;
      casing10Qty: number;
      casing10Cost: number;
      casing8Qty: number;
      casing8Cost: number;
      casing6Qty: number;
      casing6Cost: number;
      outerQty: number;
      outerCost: number;
      innerQty: number;
      innerCost: number;
      totalExpenditure: number;
      isFailedOrZeroYield: boolean;
      subsidyAmount: number;
      netPayable: number;
      netPayableRaw: number;
    }>;
  }, [
    sites,
    selectedSiteIndex,
    drillingRate,
    drillingQty,
    depthMeter,
    casing10kgRate,
    casing10kgQty,
    casing8kgRate,
    casing8kgQty,
    casing6kgRate,
    casing6kgQty,
    outerCasingRate,
    outerCasingQty,
    innerCasing6kgRate,
    innerCasing6kgQty,
    innerCasing4kgRate,
    innerCasing4kgQty,
    innerCasingRate,
    innerCasingQty,
    endCap,
    yieldLph,
    effectiveSubsidyAmount,
    applicationType,
    entry,
    isPrivateWork
  ]);

  const totalNetPayableAllSites = useMemo(() => {
    return siteFinancials.reduce((sum, sf) => sum + sf.netPayable, 0);
  }, [siteFinancials]);

  const totalExpenditureAllSites = useMemo(() => {
    return siteFinancials.reduce((sum, sf) => sum + sf.totalExpenditure, 0);
  }, [siteFinancials]);

  const abstractSiteRows = useMemo(() => {
    return selectedSiteIndices.map((sIdx) => {
      const sf = siteFinancials.find(f => f.sIdx === sIdx) || siteFinancials[sIdx];
      if (!sf) return null;

      return {
        sIdx,
        siteName: sf.siteName,
        location: sf.location,
        descMl: sf.siteName + (sf.location ? ` (${sf.location})` : ''),
        descEn: sf.siteName + (sf.location ? ` (${sf.location})` : ''),
        amount: sf.netPayable,
      };
    }).filter(Boolean) as Array<{ sIdx: number; siteName: string; location: string; descMl: string; descEn: string; amount: number }>;
  }, [selectedSiteIndices, siteFinancials]);

  const totalPaymentAmount = useMemo(() => {
    return abstractSiteRows.reduce((sum, r) => sum + r.amount, 0);
  }, [abstractSiteRows]);

  const abstractBalanceAmount = useMemo(() => {
    return totalRemittanceAmount - totalPaymentAmount;
  }, [totalRemittanceAmount, totalPaymentAmount]);

  const ucSelectedSites = useMemo(() => {
    return selectedSiteIndices.map(sIdx => {
      return siteFinancials.find(sf => sf.sIdx === sIdx) || siteFinancials[sIdx];
    }).filter(Boolean);
  }, [selectedSiteIndices, siteFinancials]);

  const ucTotalSelectedExpenditure = useMemo(() => {
    return ucSelectedSites.reduce((sum, sf) => sum + Math.round(sf.subsidyAmount > 0 ? sf.netPayable : sf.totalExpenditure), 0);
  }, [ucSelectedSites]);

  const ucBalanceRefund = useMemo(() => {
    return Math.round(totalRemittanceAmount) - ucTotalSelectedExpenditure;
  }, [totalRemittanceAmount, ucTotalSelectedExpenditure]);

  const procNetPayable = useMemo(() => {
    if (totalPaymentAmount > 0) {
      return totalPaymentAmount;
    }
    if (totalNetPayableAllSites > 0) {
      return totalNetPayableAllSites;
    }
    return netPayableGwd;
  }, [totalPaymentAmount, totalNetPayableAllSites, netPayableGwd]);

  const procBalanceRefund = useMemo(() => {
    return advanceDeposit - procNetPayable;
  }, [advanceDeposit, procNetPayable]);

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
    if (isDepositWork && !hasBwcOrTwc && (docType === 'completion_report' || docType === 'final_bill' || docType === 'abstract_final_bill')) {
      setDocType('utilization_certificate');
    }
    if (docType === 'proceedings' && !isPrivateWork) {
      setDocType(hasBwcOrTwc ? 'completion_report' : 'utilization_certificate');
    }
    if (docType === 'utilization_certificate' && !isDepositWork) {
      setDocType('completion_report');
    }
  }, [docType, hasMultipleSites, isPrivateWork, isDepositWork, hasBwcOrTwc]);

  const [isSaving, setIsSaving] = useState(false);
  const [isInIframe, setIsInIframe] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setIsInIframe(window.self !== window.top);
    }
  }, []);

  const getReportDocumentTitle = (type: ReportDocType, currentFileNo?: string) => {
    const rawNo = currentFileNo || fileNo || entry?.fileNo || '';
    const sanitizedFileNo = rawNo.replace(/\//g, '-').trim();
    let docPrefix = 'Report';
    switch (type) {
      case 'completion_report':
        docPrefix = 'Completion_Report';
        break;
      case 'final_bill':
        docPrefix = 'Final_Bill';
        break;
      case 'abstract_final_bill':
        docPrefix = 'Abstract_Final_Bill';
        break;
      case 'proceedings':
        docPrefix = 'Proceedings';
        break;
      case 'utilization_certificate':
        docPrefix = 'Utilization_Certificate';
        break;
    }
    return sanitizedFileNo ? `${docPrefix}_${sanitizedFileNo}` : docPrefix;
  };

  const openPrintWindow = (printableElement: HTMLElement) => {
    try {
      const styles = Array.from(document.querySelectorAll('style, link[rel="stylesheet"]'))
        .map(style => style.outerHTML)
        .join('\n');

      const docTitle = getReportDocumentTitle(docType, fileNo || entry?.fileNo);

      const printWin = window.open('', '_blank', 'width=950,height=1100,scrollbars=yes');
      if (printWin) {
        printWin.document.open();
        printWin.document.write(`
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="utf-8">
              <title>${docTitle}</title>
              ${styles}
              <style>
                @page {
                  size: A4 portrait;
                  margin: 0 !important;
                }
                *, ::before, ::after {
                  -webkit-print-color-adjust: exact !important;
                  print-color-adjust: exact !important;
                }
                body {
                  background: #ffffff !important;
                  color: #000000 !important;
                  margin: 0 !important;
                  padding: 0 !important;
                  font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif !important;
                }
                .no-print, .print\\:hidden, button, [class*="DialogFooter"] {
                  display: none !important;
                }
                table {
                  width: 100% !important;
                  border-collapse: collapse !important;
                }
                th, td {
                  border-color: #000000 !important;
                }
              </style>
            </head>
            <body>
              <div class="bg-white text-black p-0 m-0 font-sans text-[13px] leading-relaxed">
                ${printableElement.innerHTML}
              </div>
              <script>
                window.onload = function() {
                  setTimeout(function() {
                    window.focus();
                    window.print();
                  }, 300);
                };
              </script>
            </body>
          </html>
        `);
        printWin.document.close();
        return true;
      }
    } catch (e) {
      console.error("Popup window print error:", e);
    }
    return false;
  };

  const printViaHiddenIframe = (printableElement: HTMLElement) => {
    try {
      const styles = Array.from(document.querySelectorAll('style, link[rel="stylesheet"]'))
        .map(style => style.outerHTML)
        .join('\n');

      const docTitle = getReportDocumentTitle(docType, fileNo || entry?.fileNo);

      let iframe = document.getElementById('gwd-report-print-iframe') as HTMLIFrameElement;
      if (iframe) {
        iframe.remove();
      }
      iframe = document.createElement('iframe');
      iframe.id = 'gwd-report-print-iframe';
      iframe.style.position = 'fixed';
      iframe.style.right = '0';
      iframe.style.bottom = '0';
      iframe.style.width = '0px';
      iframe.style.height = '0px';
      iframe.style.border = '0px';
      iframe.style.visibility = 'hidden';
      document.body.appendChild(iframe);

      const iframeDoc = iframe.contentWindow?.document || iframe.contentDocument;
      if (!iframeDoc) return false;

      iframeDoc.open();
      iframeDoc.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <title>${docTitle}</title>
            ${styles}
            <style>
              @page {
                size: A4 portrait;
                margin: 0 !important;
              }
              *, ::before, ::after {
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
              }
              body {
                background: #ffffff !important;
                color: #000000 !important;
                margin: 0 !important;
                padding: 0 !important;
                font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif !important;
              }
              .no-print, .print\\:hidden, button, [class*="DialogFooter"] {
                display: none !important;
              }
              table {
                width: 100% !important;
                border-collapse: collapse !important;
              }
              th, td {
                border-color: #000000 !important;
              }
            </style>
          </head>
          <body>
            <div class="bg-white text-black p-0 m-0 font-sans text-[13px] leading-relaxed">
              ${printableElement.innerHTML}
            </div>
          </body>
        </html>
      `);
      iframeDoc.close();

      setTimeout(() => {
        if (iframe.contentWindow) {
          iframe.contentWindow.focus();
          iframe.contentWindow.print();
        }
      }, 350);

      return true;
    } catch (err) {
      console.error("Iframe print error:", err);
      return false;
    }
  };

  const handlePrint = () => {
    setEditingRow(null);
    const docTitle = getReportDocumentTitle(docType, fileNo || entry?.fileNo);
    printDocument('printable-report-document', docTitle, {
      pageMargins: getPageMarginsCss(printSettings),
      fontSize: printSettings.fontSize,
      lineHeight: printSettings.lineSpacing,
      englishFont: printSettings.englishFont,
      malayalamFont: printSettings.malayalamFont,
    });
  };

  const handleCopyRichHtml = async () => {
    setEditingRow(null);
    setIsCopying(true);
    try {
      const success = await copyRichHtml('printable-report-document', {
        fontSize: printSettings.fontSize,
        lineHeight: printSettings.lineSpacing,
        englishFont: printSettings.englishFont,
        malayalamFont: printSettings.malayalamFont,
      });
      if (success) {
        toast({
          title: "Copied successfully",
          description: "Report copied to clipboard as Rich HTML.",
        });
      } else {
        toast({
          variant: "destructive",
          title: "Copy failed",
          description: "Could not copy report HTML to clipboard.",
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

  const handleOpenNewWindowPrint = () => {
    setEditingRow(null);
    const docEl = document.getElementById('printable-report-document');
    if (docEl) {
      const opened = openPrintWindow(docEl);
      if (!opened) {
        // Fallback to window.print if popup blocked
        handlePrint();
      }
    } else {
      handlePrint();
    }
  };

  const handleSave = async () => {
    if (!entry || !onSave) return;
    setIsSaving(true);
    setEditingRow(null);
    try {
      const updatedSiteDetails = [...(entry.siteDetails || [])];
      const originalIndex = entry.siteDetails?.findIndex(s => s === currentSite) ?? (selectedSiteIndex >= 0 ? selectedSiteIndex : 0);
      const targetIndex = originalIndex !== -1 ? originalIndex : 0;

      if (updatedSiteDetails[targetIndex]) {
        updatedSiteDetails[targetIndex] = {
          ...updatedSiteDetails[targetIndex],
          nameOfSite: siteName || updatedSiteDetails[targetIndex].nameOfSite,
          contractorName: contractorName || updatedSiteDetails[targetIndex].contractorName,
          latitude: latitude ? Number(latitude) : updatedSiteDetails[targetIndex].latitude,
          longitude: longitude ? Number(longitude) : updatedSiteDetails[targetIndex].longitude,
          localSelfGovt: localSelfGovt || updatedSiteDetails[targetIndex].localSelfGovt,
          constituency: constituency || updatedSiteDetails[targetIndex].constituency,
          totalDepth: depthMeter !== undefined && depthMeter !== null ? String(depthMeter) : updatedSiteDetails[targetIndex].totalDepth,
          casing10kgPipe: casing10kgQty !== undefined && casing10kgQty !== null ? String(casing10kgQty) : (updatedSiteDetails[targetIndex].casing10kgPipe ?? ""),
          casing8kgPipe: casing8kgQty !== undefined && casing8kgQty !== null ? String(casing8kgQty) : ((updatedSiteDetails[targetIndex] as any).casing8kgPipe ?? ""),
          casing6kgPipe: casing6kgQty !== undefined && casing6kgQty !== null ? String(casing6kgQty) : (updatedSiteDetails[targetIndex].casing6kgPipe ?? ""),
          casingPipeUsed: String((Number(casing10kgQty) || 0) + (Number(casing8kgQty) || 0) + (Number(casing6kgQty) || 0)),
          yieldDischarge: yieldLph !== undefined && yieldLph !== null && yieldLph !== '' ? String(yieldLph) : (updatedSiteDetails[targetIndex].yieldDischarge !== undefined && updatedSiteDetails[targetIndex].yieldDischarge !== null ? String(updatedSiteDetails[targetIndex].yieldDischarge) : ""),
          zoneDetails: waterStruckZone || updatedSiteDetails[targetIndex].zoneDetails,
          waterLevel: staticWaterLevel !== undefined && staticWaterLevel !== null && staticWaterLevel !== '' ? String(staticWaterLevel) : (updatedSiteDetails[targetIndex].waterLevel !== undefined && updatedSiteDetails[targetIndex].waterLevel !== null ? String(updatedSiteDetails[targetIndex].waterLevel) : ""),
          drillingRemarks: remarks || updatedSiteDetails[targetIndex].drillingRemarks,
          workRemarks: remarks || updatedSiteDetails[targetIndex].workRemarks,
          startDate: periodFrom || (updatedSiteDetails[targetIndex] as any).startDate || (updatedSiteDetails[targetIndex] as any).dateOfCommencement,
          dateOfCommencement: periodFrom || (updatedSiteDetails[targetIndex] as any).startDate || (updatedSiteDetails[targetIndex] as any).dateOfCommencement,
          dateOfCompletion: periodTo || updatedSiteDetails[targetIndex].dateOfCompletion,
          diameter: diameter || updatedSiteDetails[targetIndex].diameter,
          surveyOB: actualOverburden || updatedSiteDetails[targetIndex].surveyOB,
          surveyRecommendedOB: actualOverburden || updatedSiteDetails[targetIndex].surveyRecommendedOB,
          pilotDrillingDepth: pilotDrillingDepth || updatedSiteDetails[targetIndex].pilotDrillingDepth,
          surveyPlainPipe: surveyPlainPipe || updatedSiteDetails[targetIndex].surveyPlainPipe,
          surveySlottedPipe: surveySlottedPipe || updatedSiteDetails[targetIndex].surveySlottedPipe,
          outerCasingPipe: outerCasingPipe || updatedSiteDetails[targetIndex].outerCasingPipe,
          surveyRecommendedTD: surveyRecommendedTD || updatedSiteDetails[targetIndex].surveyRecommendedTD,
          surveyLocation: surveyLocation || updatedSiteDetails[targetIndex].surveyLocation,
          typeOfRig: rigUsed || updatedSiteDetails[targetIndex].typeOfRig,
        };
      }

      const existingOverrides = (entry as any)?.reportOverrides || (entry as any)?.printOverrides || {};
      const prevSiteOverrides = existingOverrides.siteOverrides || {};

      const currentSiteOverrideData = {
        drillingQty,
        casing10kgQty,
        casing8kgQty,
        casing6kgQty,
        outerCasingQty,
        innerCasing6kgQty,
        innerCasing4kgQty,
        innerCasingQty,
        depthMeter,
        actualOverburden,
        pilotDrillingDepth,
        surveyPlainPipe,
        surveySlottedPipe,
        outerCasingPipe,
        endCap,
        yieldLph,
        staticWaterLevel,
        waterStruckZone,
        diameter,
        siteName,
        contractorName,
        periodFrom,
        periodTo,
        remarks,
        rigUsed,
        reportDate,
        localSelfGovt,
        constituency,
        fbDescDrillingMl,
        fbDescCasing10Ml,
        fbDescCasing8Ml,
        fbDescCasing6Ml,
        fbDescOuterMl,
        fbDescInnerMl,
        fbDescInnerPipeMl,
        fbDescDrillingEn,
        fbDescCasing10En,
        fbDescCasing8En,
        fbDescCasing6En,
        fbDescOuterEn,
        fbDescInnerEn,
        fbDescInnerPipeEn,
      };

      const siteId = (currentSite as any)?.id;
      const updatedSiteOverrides = {
        ...prevSiteOverrides,
        [selectedSiteIndex]: currentSiteOverrideData,
        ...(targetIndex !== -1 ? { [targetIndex]: currentSiteOverrideData } : {}),
        ...(siteId ? { [siteId]: currentSiteOverrideData } : {}),
      };

      const reportOverrides: Record<string, any> = {
        ...existingOverrides,
        siteOverrides: updatedSiteOverrides,
        fileNo,
        applicantName,
        applicantAddress,
        applicationType,

        drillingRate,
        casing10kgRate,
        casing8kgRate,
        casing6kgRate,
        outerCasingRate,
        innerCasing6kgRate,
        innerCasing4kgRate,
        innerCasingRate,

        subsidyAmount,
        advanceDeposit,
        ddDetails,

        orderNo,
        orderDate,
        reportDate,
        refLetterNo,
        refLetterDate,
        bankAccountNo,
        bankIfsc,
        bankName,
        bankBranch,
        proceedingsSubject,
        proceedingsRef1,
        proceedingsRef2,
        procPara4,
        procPara5,

        ucPhone,
        ucEmail,
        ucFrom,
        ucTo,
        ucSubject,
        ucRef1,
        ucRef2,
        ucMlPara1,
        ucMlPara2,
        ucEnPara1,
        ucEnPara2,

        selectedRemittanceIndices,
        selectedSiteIndices,

        district,
        districtMl,
        subOfficeLocation,
        subOfficeLocationMl,
        officerName,
        officerDesignation,
      };

      // Only save top-level drillingQty and descriptions if single-site
      if (sites.length <= 1) {
        reportOverrides.drillingQty = drillingQty;
        reportOverrides.casing10kgQty = casing10kgQty;
        reportOverrides.casing8kgQty = casing8kgQty;
        reportOverrides.casing6kgQty = casing6kgQty;
        reportOverrides.outerCasingQty = outerCasingQty;
        reportOverrides.innerCasing6kgQty = innerCasing6kgQty;
        reportOverrides.innerCasing4kgQty = innerCasing4kgQty;
        reportOverrides.innerCasingQty = innerCasingQty;

        reportOverrides.fbDescDrillingMl = fbDescDrillingMl;
        reportOverrides.fbDescCasing10Ml = fbDescCasing10Ml;
        reportOverrides.fbDescCasing8Ml = fbDescCasing8Ml;
        reportOverrides.fbDescCasing6Ml = fbDescCasing6Ml;
        reportOverrides.fbDescOuterMl = fbDescOuterMl;
        reportOverrides.fbDescInnerMl = fbDescInnerMl;
        reportOverrides.fbDescInnerPipeMl = fbDescInnerPipeMl;

        reportOverrides.fbDescDrillingEn = fbDescDrillingEn;
        reportOverrides.fbDescCasing10En = fbDescCasing10En;
        reportOverrides.fbDescCasing8En = fbDescCasing8En;
        reportOverrides.fbDescCasing6En = fbDescCasing6En;
        reportOverrides.fbDescOuterEn = fbDescOuterEn;
        reportOverrides.fbDescInnerEn = fbDescInnerEn;
        reportOverrides.fbDescInnerPipeEn = fbDescInnerPipeEn;
      }

      const updatedEntry: DataEntryFormData = {
        ...entry,
        fileNo: fileNo || entry.fileNo,
        applicantName: applicantName || entry.applicantName,
        applicantAddress: applicantAddress || entry.applicantAddress,
        applicationType: (applicationType as any) || entry.applicationType,
        siteDetails: updatedSiteDetails,
        reportOverrides,
        printOverrides: reportOverrides,
      };

      await onSave(updatedEntry);
      toast({ title: "Changes Saved", description: "Edited data saved to database successfully." });
    } catch (err: any) {
      toast({ variant: "destructive", title: "Save Failed", description: err.message || "Could not save changes." });
    } finally {
      setIsSaving(false);
    }
  };

  const rowResetHandlers: Record<string, () => void> = {
    cr_reportDate: () => {
      const today = new Date();
      const dd = String(today.getDate()).padStart(2, '0');
      const mm = String(today.getMonth() + 1).padStart(2, '0');
      const yyyy = today.getFullYear();
      setReportDate(`${dd}/${mm}/${yyyy}`);
    },
    fb_reportDate: () => {
      const today = new Date();
      const dd = String(today.getDate()).padStart(2, '0');
      const mm = String(today.getMonth() + 1).padStart(2, '0');
      const yyyy = today.getFullYear();
      setReportDate(`${dd}/${mm}/${yyyy}`);
    },
    cr_fileNo: () => setFileNo(entry?.fileNo || 'GWD/1372/2022'),
    cr_applicant: () => { setApplicantName(entry?.applicantName || ''); setApplicantAddress(entry?.applicantAddress || ''); },
    cr_siteName: () => setSiteName(currentSite?.nameOfSite || entry?.applicantName || ''),
    cr_latLong: () => { setLatitude(currentSite?.latitude ? String(currentSite.latitude) : ''); setLongitude(currentSite?.longitude ? String(currentSite.longitude) : ''); },
    cr_lsgd: () => setLocalSelfGovt(currentSite?.localSelfGovt || ''),
    cr_constituency: () => setConstituency(currentSite?.constituency || ''),
    cr_appType: () => setApplicationType(entry?.applicationType || moduleType.toUpperCase()),
    cr_recommended: () => { setSurveyRecommendedTD(currentSite?.surveyRecommendedTD ? String(currentSite.surveyRecommendedTD) : ''); setSurveyRecommendedOB(currentSite?.surveyRecommendedOB ? String(currentSite.surveyRecommendedOB) : (currentSite?.surveyOB ? String(currentSite.surveyOB) : '')); },
    cr_surveyLoc: () => setSurveyLocation(currentSite?.surveyLocation || ''),
    cr_rigUsed: () => {
      let rigStr = currentSite?.typeOfRig || '';
      if (currentSite?.drillingRigNo) rigStr += ` (Rig: ${currentSite.drillingRigNo})`;
      if (currentSite?.compressorNo) rigStr += ` (Comp: ${currentSite.compressorNo})`;
      setRigUsed(rigStr);
    },
    cr_diameter: () => setDiameter(currentSite?.diameter || 'Ø 110 മില്ലീമീറ്റർ'),
    cr_depth: () => { const d = Number(currentSite?.totalDepth) || 0; setDepthMeter(d); setDrillingQty(d); },
    cr_ob: () => setActualOverburden(currentSite?.surveyOB ? String(currentSite.surveyOB) : (currentSite?.surveyRecommendedOB ? String(currentSite.surveyRecommendedOB) : '')),
    cr_casingDetails: () => {
      const c10 = parseNum(currentSite?.casing10kgPipe);
      const c8 = parseNum((currentSite as any)?.casing8kgPipe);
      const rawC6 = parseNum(currentSite?.casing6kgPipe);
      const rawPipeUsed = parseNum(currentSite?.casingPipeUsed);
      const rawSurveyCasing = parseNum(currentSite?.surveyRecommendedCasingPipe);
      const is6kgDefined = currentSite?.casing6kgPipe !== undefined && currentSite?.casing6kgPipe !== null;
      const is10kgDefined = currentSite?.casing10kgPipe !== undefined && currentSite?.casing10kgPipe !== null;
      const is8kgDefined = (currentSite as any)?.casing8kgPipe !== undefined && (currentSite as any)?.casing8kgPipe !== null;
      const c6 = is6kgDefined ? rawC6 : (!is10kgDefined && !is8kgDefined && c10 === 0 && c8 === 0 ? (rawPipeUsed || rawSurveyCasing) : 0);

      setCasing10kgQty(c10);
      setCasing8kgQty(c8);
      setCasing6kgQty(c6);
      const in6Reset = parseNum(currentSite?.innerCasing6kgPipe);
      const in4Reset = parseNum(currentSite?.innerCasing4kgPipe);
      setInnerCasingQty((!in6Reset && !in4Reset) ? parseNum(currentSite?.innerCasingPipe) : 0);
      setPilotDrillingDepth(currentSite?.pilotDrillingDepth || '');
      setSurveyPlainPipe(currentSite?.surveyPlainPipe || '');
      setSurveySlottedPipe(currentSite?.surveySlottedPipe || '');
      setOuterCasingPipe(currentSite?.outerCasingPipe || '');
    },
    cr_endCap: () => setEndCap(currentSite?.endCap || 'No'),
    cr_yield: () => setYieldLph(Number(currentSite?.yieldDischarge) || 0),
    cr_zone: () => setWaterStruckZone(currentSite?.zoneDetails || ''),
    cr_swl: () => setStaticWaterLevel((currentSite?.waterLevel !== undefined && currentSite?.waterLevel !== null && currentSite?.waterLevel !== '') ? currentSite.waterLevel : ''),
    cr_period: () => { setPeriodFrom((currentSite as any)?.startDate || (currentSite as any)?.dateOfCommencement || ''); setPeriodTo(currentSite?.dateOfCompletion || ''); },
    cr_remarks: () => setRemarks(currentSite?.drillingRemarks || currentSite?.workRemarks || ''),
    cr_contractor: () => setContractorName(currentSite?.contractorName || ''),

    // Final Bill resets
    fb_desc_drilling: () => {
      const diaVal = currentSite?.diameter || '110';
      const isDia150 = diaVal.includes('150') || diaVal.includes('6');
      setFbDescDrillingMl(`${isDia150 ? '150 മില്ലീമീറ്റർ' : '110 മില്ലീമീറ്റർ'} വ്യാസമുള്ള കുഴൽകിണറിന്റെ ഡ്രില്ലിംഗ് ചാർജ്`);
      setFbDescDrillingEn(`Drilling charges for ${isDia150 ? '150 mm' : '110 mm'} dia borewell`);
    },
    fb_desc_drilling_ml: () => {
      const diaVal = currentSite?.diameter || '110';
      const isDia150 = diaVal.includes('150') || diaVal.includes('6');
      setFbDescDrillingMl(`${isDia150 ? '150 മില്ലീമീറ്റർ' : '110 മില്ലീമീറ്റർ'} വ്യാസമുള്ള കുഴൽകിണറിന്റെ ഡ്രില്ലിംഗ് ചാർജ്`);
    },
    fb_desc_drilling_en: () => {
      const diaVal = currentSite?.diameter || '110';
      const isDia150 = diaVal.includes('150') || diaVal.includes('6');
      setFbDescDrillingEn(`Drilling charges for ${isDia150 ? '150 mm' : '110 mm'} dia borewell`);
    },
    fb_r1: () => setDrillingRate(390),
    fb_q1: () => { const d = Number(currentSite?.totalDepth) || 0; setDrillingQty(d); setDepthMeter(d); },
    fb_en_r1: () => setDrillingRate(390),
    fb_en_q1: () => { const d = Number(currentSite?.totalDepth) || 0; setDrillingQty(d); setDepthMeter(d); },

    fb_desc_casing10: () => {
      const diaVal = currentSite?.diameter || '110';
      const isDia150 = diaVal.includes('150') || diaVal.includes('6');
      const casingDia = isDia150 ? '180 മില്ലീമീറ്റർ' : '140 മില്ലീമീറ്റർ';
      const casingDiaEn = isDia150 ? '180 mm' : '140 mm';
      setFbDescCasing10Ml(`${casingDia} വ്യാസമുള്ള 10 കി.ഗ്രാം /ച. സെ. മീ. പിവിസി കെയ്സിംഗ് പൈപ്പിന്റെ വില`);
      setFbDescCasing10En(`${casingDiaEn} dia 10 kg/cm² PVC Casing Pipe`);
    },
    fb_desc_casing10_ml: () => {
      const diaVal = currentSite?.diameter || '110';
      const isDia150 = diaVal.includes('150') || diaVal.includes('6');
      const casingDia = isDia150 ? '180 മില്ലീമീറ്റർ' : '140 മില്ലീമീറ്റർ';
      setFbDescCasing10Ml(`${casingDia} വ്യാസമുള്ള 10 കി.ഗ്രാം /ച. സെ. മീ. പിവിസി കെയ്സിംഗ് പൈപ്പിന്റെ വില`);
    },
    fb_desc_casing10_en: () => {
      const diaVal = currentSite?.diameter || '110';
      const isDia150 = diaVal.includes('150') || diaVal.includes('6');
      const casingDiaEn = isDia150 ? '180 mm' : '140 mm';
      setFbDescCasing10En(`${casingDiaEn} dia 10 kg/cm² PVC Casing Pipe`);
    },
    fb_r2: () => setCasing10kgRate(960),
    fb_q2: () => setCasing10kgQty(parseNum(currentSite?.casing10kgPipe)),
    fb_en_r2: () => setCasing10kgRate(960),
    fb_en_q2: () => setCasing10kgQty(parseNum(currentSite?.casing10kgPipe)),

    fb_desc_casing8: () => {
      const diaVal = currentSite?.diameter || '110';
      const isDia150 = diaVal.includes('150') || diaVal.includes('6');
      const casingDia = isDia150 ? '180 മില്ലീമീറ്റർ' : '140 മില്ലീമീറ്റർ';
      const casingDiaEn = isDia150 ? '180 mm' : '140 mm';
      setFbDescCasing8Ml(`${casingDia} വ്യാസമുള്ള 8 കി.ഗ്രാം /ച. സെ. മീ. പിവിസി കെയ്സിംഗ് പൈപ്പിന്റെ വില`);
      setFbDescCasing8En(`${casingDiaEn} dia 8 kg/cm² PVC Casing Pipe`);
    },
    fb_desc_casing8_ml: () => {
      const diaVal = currentSite?.diameter || '110';
      const isDia150 = diaVal.includes('150') || diaVal.includes('6');
      const casingDia = isDia150 ? '180 മില്ലീമീറ്റർ' : '140 മില്ലീമീറ്റർ';
      setFbDescCasing8Ml(`${casingDia} വ്യാസമുള്ള 8 കി.ഗ്രാം /ച. സെ. മീ. പിവിസി കെയ്സിംഗ് പൈപ്പിന്റെ വില`);
    },
    fb_desc_casing8_en: () => {
      const diaVal = currentSite?.diameter || '110';
      const isDia150 = diaVal.includes('150') || diaVal.includes('6');
      const casingDiaEn = isDia150 ? '180 mm' : '140 mm';
      setFbDescCasing8En(`${casingDiaEn} dia 8 kg/cm² PVC Casing Pipe`);
    },
    fb_r2_8: () => setCasing8kgRate(464.53),
    fb_q2_8: () => setCasing8kgQty(parseNum((currentSite as any)?.casing8kgPipe)),
    fb_en_r2_8: () => setCasing8kgRate(464.53),
    fb_en_q2_8: () => setCasing8kgQty(parseNum((currentSite as any)?.casing8kgPipe)),

    fb_desc_casing6: () => {
      const diaVal = currentSite?.diameter || '110';
      const isDia150 = diaVal.includes('150') || diaVal.includes('6');
      const casingDia = isDia150 ? '180 മില്ലീമീറ്റർ' : '140 മില്ലീമീറ്റർ';
      const casingDiaEn = isDia150 ? '180 mm' : '140 mm';
      setFbDescCasing6Ml(`${casingDia} വ്യാസമുള്ള 6 കി.ഗ്രാം /ച. സെ. മീ. പിവിസി കെയ്സിംഗ് പൈപ്പിന്റെ വില`);
      setFbDescCasing6En(`${casingDiaEn} dia 6 kg/cm² PVC Casing Pipe`);
    },
    fb_desc_casing6_ml: () => {
      const diaVal = currentSite?.diameter || '110';
      const isDia150 = diaVal.includes('150') || diaVal.includes('6');
      const casingDia = isDia150 ? '180 മില്ലീമീറ്റർ' : '140 മില്ലീമീറ്റർ';
      setFbDescCasing6Ml(`${casingDia} വ്യാസമുള്ള 6 കി.ഗ്രാം /ച. സെ. മീ. പിവിസി കെയ്സിംഗ് പൈപ്പിന്റെ വില`);
    },
    fb_desc_casing6_en: () => {
      const diaVal = currentSite?.diameter || '110';
      const isDia150 = diaVal.includes('150') || diaVal.includes('6');
      const casingDiaEn = isDia150 ? '180 mm' : '140 mm';
      setFbDescCasing6En(`${casingDiaEn} dia 6 kg/cm² PVC Casing Pipe`);
    },
    fb_r3: () => setCasing6kgRate(580),
    fb_q3: () => {
      const c10 = parseNum(currentSite?.casing10kgPipe);
      const c8 = parseNum((currentSite as any)?.casing8kgPipe);
      const rawC6 = parseNum(currentSite?.casing6kgPipe);
      const rawPipeUsed = parseNum(currentSite?.casingPipeUsed);
      const rawSurveyCasing = parseNum(currentSite?.surveyRecommendedCasingPipe);
      const is6kgDefined = currentSite?.casing6kgPipe !== undefined && currentSite?.casing6kgPipe !== null;
      const is10kgDefined = currentSite?.casing10kgPipe !== undefined && currentSite?.casing10kgPipe !== null;
      const is8kgDefined = (currentSite as any)?.casing8kgPipe !== undefined && (currentSite as any)?.casing8kgPipe !== null;
      const c6 = is6kgDefined ? rawC6 : (!is10kgDefined && !is8kgDefined && c10 === 0 && c8 === 0 ? (rawPipeUsed || rawSurveyCasing) : 0);
      setCasing6kgQty(c6);
    },
    fb_en_r3: () => setCasing6kgRate(580),
    fb_en_q3: () => {
      const c10 = parseNum(currentSite?.casing10kgPipe);
      const c8 = parseNum((currentSite as any)?.casing8kgPipe);
      const rawC6 = parseNum(currentSite?.casing6kgPipe);
      const rawPipeUsed = parseNum(currentSite?.casingPipeUsed);
      const rawSurveyCasing = parseNum(currentSite?.surveyRecommendedCasingPipe);
      const is6kgDefined = currentSite?.casing6kgPipe !== undefined && currentSite?.casing6kgPipe !== null;
      const is10kgDefined = currentSite?.casing10kgPipe !== undefined && currentSite?.casing10kgPipe !== null;
      const is8kgDefined = (currentSite as any)?.casing8kgPipe !== undefined && (currentSite as any)?.casing8kgPipe !== null;
      const c6 = is6kgDefined ? rawC6 : (!is10kgDefined && !is8kgDefined && c10 === 0 && c8 === 0 ? (rawPipeUsed || rawSurveyCasing) : 0);
      setCasing6kgQty(c6);
    },

    fb_r_outer: () => setOuterCasingRate(960),
    fb_q_outer: () => setOuterCasingQty(parseNum(currentSite?.outerCasingPipe)),
    fb_en_r_outer: () => setOuterCasingRate(960),
    fb_en_q_outer: () => setOuterCasingQty(parseNum(currentSite?.outerCasingPipe)),
    fb_desc_outer: () => {
      setFbDescOuterMl('200 മില്ലീമീറ്റർ വ്യാസമുള്ള 6 കി.ഗ്രാം /ച. സെ. മീ. പിവിസി ഔട്ടര് കെയ്സിംഗ് പൈപ്പിന്റെ വില');
      setFbDescOuterEn('200 mm dia 6 kg/cm² PVC Outer Casing Pipe');
    },
    fb_desc_outer_ml: () => setFbDescOuterMl('200 മില്ലീമീറ്റർ വ്യാസമുള്ള 6 കി.ഗ്രാം /ച. സെ. മീ. പിവിസി ഔട്ടര് കെയ്സിംഗ് പൈപ്പിന്റെ വില'),
    fb_desc_outer_en: () => setFbDescOuterEn('200 mm dia 6 kg/cm² PVC Outer Casing Pipe'),

    // Inner Casing Pipe Resets (110 mm)
    fb_r_inner_pipe: () => {
      setInnerCasing6kgRate(580);
      setInnerCasing4kgRate(464.53);
      setInnerCasingRate(450);
    },
    fb_q_inner_pipe: () => {
      const in6Reset = parseNum(currentSite?.innerCasing6kgPipe);
      const in4Reset = parseNum(currentSite?.innerCasing4kgPipe);
      const inGeneric = parseNum(currentSite?.innerCasingPipe);
      setInnerCasing6kgQty(in6Reset);
      setInnerCasing4kgQty(in4Reset);
      setInnerCasingQty((!in6Reset && !in4Reset) ? inGeneric : 0);
    },
    fb_desc_inner_pipe_ml: () => {
      const in6Reset = parseNum(currentSite?.innerCasing6kgPipe);
      const in4Reset = parseNum(currentSite?.innerCasing4kgPipe);
      const innerWeight = in6Reset > 0 ? '6 കി.ഗ്രാം /ച. സെ. മീ.' : (in4Reset > 0 ? '4 കി.ഗ്രാം /ച. സെ. മീ.' : '6 കി.ഗ്രാം /ച. സെ. മീ.');
      setFbDescInnerPipeMl(`110 മില്ലീമീറ്റർ വ്യാസമുള്ള ${innerWeight} പിവിസി ഇന്നർ കെയ്സിംഗ് പൈപ്പിന്റെ വില`);
    },
    fb_en_r_inner_pipe: () => {
      setInnerCasing6kgRate(580);
      setInnerCasing4kgRate(464.53);
      setInnerCasingRate(450);
    },
    fb_en_q_inner_pipe: () => {
      const in6Reset = parseNum(currentSite?.innerCasing6kgPipe);
      const in4Reset = parseNum(currentSite?.innerCasing4kgPipe);
      const inGeneric = parseNum(currentSite?.innerCasingPipe);
      setInnerCasing6kgQty(in6Reset);
      setInnerCasing4kgQty(in4Reset);
      setInnerCasingQty((!in6Reset && !in4Reset) ? inGeneric : 0);
    },
    fb_desc_inner_pipe_en: () => {
      const in6Reset = parseNum(currentSite?.innerCasing6kgPipe);
      const in4Reset = parseNum(currentSite?.innerCasing4kgPipe);
      const innerWeight = in6Reset > 0 ? '6 kg/cm²' : (in4Reset > 0 ? '4 kg/cm²' : '6 kg/cm²');
      setFbDescInnerPipeEn(`110 mm dia ${innerWeight} PVC Inner Casing Pipe`);
    },

    // End Cap / Cap Resets
    fb_r4: () => setInnerCasingRate(450),
    fb_q4: () => setEndCap(currentSite?.endCap || 'No'),
    fb_en_r4: () => setInnerCasingRate(450),
    fb_en_q4: () => setEndCap(currentSite?.endCap || 'No'),
    fb_desc_inner: () => {
      const diaVal = currentSite?.diameter || '110';
      const isDia150 = diaVal.includes('150') || diaVal.includes('6');
      const casingDia = isDia150 ? '180 മില്ലീമീറ്റർ' : '140 മില്ലീമീറ്റർ';
      const casingDiaEn = isDia150 ? '180 mm' : '140 mm';
      setFbDescInnerMl(`${casingDia} വ്യാസമുള്ള പിവിസി കുഴൽകിണർ അടപ്പിന്റെ വില`);
      setFbDescInnerEn(`${casingDiaEn} PVC Cap / Inner Casing`);
    },
    fb_desc_inner_ml: () => {
      const diaVal = currentSite?.diameter || '110';
      const isDia150 = diaVal.includes('150') || diaVal.includes('6');
      const casingDia = isDia150 ? '180 മില്ലീമീറ്റർ' : '140 മില്ലീമീറ്റർ';
      setFbDescInnerMl(`${casingDia} വ്യാസമുള്ള പിവിസി കുഴൽകിണർ അടപ്പിന്റെ വില`);
    },
    fb_desc_inner_en: () => {
      const diaVal = currentSite?.diameter || '110';
      const isDia150 = diaVal.includes('150') || diaVal.includes('6');
      const casingDiaEn = isDia150 ? '180 mm' : '140 mm';
      setFbDescInnerEn(`${casingDiaEn} PVC Cap / Inner Casing`);
    },

    fb_subsidy: () => setSubsidyAmount(0),
    fb_en_subsidy: () => setSubsidyAmount(0),
    fb_advance: () => setAdvanceDeposit(entry?.remittanceDetails?.reduce((sum, r) => sum + (Number(r.amountRemitted) || 0), 0) || 0),
    fb_en_advance: () => setAdvanceDeposit(entry?.remittanceDetails?.reduce((sum, r) => sum + (Number(r.amountRemitted) || 0), 0) || 0),

    // Proceedings & UC resets
    proc_officer: () => setDistrict(entry?.officeLocation || selectedOffice || 'Pathanamthitta'),
    proc_sub: () => setProceedingsSubject(`GWD, ${district} - Construction of borewell at ${entry?.applicantName || ''}${entry?.applicantAddress ? `, ${entry.applicantAddress}` : ''} - Refund of balance amount and remittance of drilling charges to revenue head - Sanctioned - Orders issued - reg.`),
    proc_ref: () => {
      const fNo = entry?.fileNo || 'GWD/1372/2022';
      const firstRemittance = entry?.remittanceDetails?.[0];
      const rawRemittanceDate = firstRemittance?.dateOfRemittance ? formatDateDDMMYYYY(firstRemittance.dateOfRemittance) : '';
      const ddStr = formatDatesInText(firstRemittance ? `DD No. ${firstRemittance.remittanceRemarks || ''} Dated ${rawRemittanceDate}` : '');
      setProceedingsRef1(formatDatesInText(`1. Application of ${entry?.applicantName || ''} and DD details (${ddStr}).`));
      setProceedingsRef2(`2. Final Bill of this office, dated ${orderDate || formatDateDDMMYYYY(new Date().toISOString().split('T')[0])}.`);
    },
    proc_ordNo: () => setOrderNo(`GWD/${(entry?.fileNo || 'GWD/1372/2022').replace(/\//g, '-')}/2026`),
    proc_ordDate: () => setOrderDate(new Date().toISOString().split('T')[0]),
    proc_para1: () => setProcPara1(''),
    proc_para2: () => setProcPara2(''),
    proc_para3: () => setProcPara3(''),
    proc_para4: () => setProcPara4(''),
    proc_para5: () => setProcPara5(''),

    uc_contact: () => { 
      setUcPhone(officeAddress?.phoneNo || '0474 - 2790313'); 
      setUcEmail(officeAddress?.email || 'gwdklm@gmail.com'); 
    },
    uc_ref: () => setFileNo(entry?.fileNo || 'GWD/1372/2022'),
    uc_date: () => setOrderDate(new Date().toISOString().split('T')[0]),
    uc_from: () => setUcFrom('ജില്ലാ ഓഫീസർ'),
    uc_to: () => setUcTo(`Assistant Engineer, ${currentSite?.localSelfGovt || 'Gramapanchayat'}`),
    uc_sub: () => setUcSubject(`Utilization Certificate for borewell construction works at ${currentSite?.localSelfGovt || 'Panchayat'}`),
    uc_refs: () => { setUcRef1(''); setUcRef2(''); },
    uc_cover_letter: () => setUcMlPara1(''),
    uc_cert_para: () => { setUcMlPara2(''); setUcEnPara1(''); },
    uc_tbl_dep_title: () => setLocalSelfGovt(currentSite?.localSelfGovt || entry?.localSelfGovt || ''),
    uc_tbl_exp_title: () => setLocalSelfGovt(currentSite?.localSelfGovt || entry?.localSelfGovt || ''),
  };

  // Helper function to render inline editable cell / row
  const renderEditableCell = (
    rowKey: string,
    displayContent: React.ReactNode,
    editControl: React.ReactNode
  ) => {
    const isEditing = editingRow === rowKey;
    const normalizedKey = rowKey
      .replace('_en_', '_')
      .replace('_ml_', '_')
      .replace('cr_en_', 'cr_')
      .replace('fb_en_', 'fb_')
      .replace('uc_en_', 'uc_')
      .replace('uc_ml_', 'uc_');

    const resetFn = rowResetHandlers[rowKey] || rowResetHandlers[normalizedKey];

    const handleReset = () => {
      if (resetFn) {
        resetFn();
        toast({ description: "Reset row to original value." });
      } else {
        toast({ description: "No custom reset handler for this row." });
      }
    };

    return (
      <div className="flex flex-col w-full min-w-0">
        <div className="flex items-start justify-between gap-1 w-full">
          <div className="flex-1 min-w-0">{displayContent}</div>
          <div className="flex items-center gap-0.5 print:hidden shrink-0 ml-1">
            <Button
              size="icon"
              variant="ghost"
              className={`h-5 w-5 opacity-60 hover:opacity-100 ${isEditing ? 'text-blue-600 bg-blue-100' : 'text-primary'}`}
              onClick={() => setEditingRow(isEditing ? null : rowKey)}
              title={isEditing ? "Close edit controls" : "Edit item"}
            >
              <Pencil className="h-3 w-3" />
            </Button>
            {resetFn && (
              <Button
                size="icon"
                variant="ghost"
                className="h-5 w-5 opacity-60 hover:opacity-100 text-amber-600 hover:text-amber-800"
                onClick={handleReset}
                title="Reset row to original data"
              >
                <RotateCcw className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        </div>

        {isEditing && (
          <div className="mt-1.5 p-2 bg-blue-50/95 dark:bg-blue-950/70 rounded-md border border-blue-200 dark:border-blue-800 print:hidden shadow-xs space-y-2">
            <div className="flex items-center justify-between text-[11px] font-bold text-blue-800 dark:text-blue-300 border-b border-blue-200 dark:border-blue-800 pb-1">
              <span>Change Item / വിവരങ്ങൾ തിരുത്തുക:</span>
              <div className="flex items-center gap-1 shrink-0">
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-6 px-2 text-[11px] font-medium text-green-700 bg-green-100 hover:bg-green-200 dark:text-green-300 dark:bg-green-900/60 border border-green-300 gap-1"
                  onClick={() => setEditingRow(null)}
                  title="Done editing"
                >
                  <Check className="h-3.5 w-3.5" />
                  <span>Done</span>
                </Button>
                {resetFn && (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-6 px-2 text-[11px] font-medium text-amber-700 bg-amber-100 hover:bg-amber-200 dark:text-amber-300 dark:bg-amber-900/60 border border-amber-300 gap-1"
                    onClick={() => {
                      handleReset();
                      setEditingRow(null);
                    }}
                    title="Reset row to original data"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    <span>Reset</span>
                  </Button>
                )}
              </div>
            </div>

            {/* Display full current data for complete context */}
            <div className="bg-white/90 dark:bg-slate-900/90 p-2 rounded border border-blue-100 dark:border-blue-900/60 text-gray-800 dark:text-gray-200 text-xs leading-relaxed max-h-48 overflow-y-auto">
              <span className="text-[10px] font-bold text-gray-500 dark:text-gray-400 block uppercase tracking-wider mb-1">
                Full Displayed Data / പൂർണ്ണ വിവരങ്ങൾ:
              </span>
              <div className="font-normal">{displayContent}</div>
            </div>

            {/* Edit controls for changing item */}
            <div className="pt-0.5">
              <span className="text-[10px] font-bold text-blue-900 dark:text-blue-200 block uppercase tracking-wider mb-1">
                Edit Fields / വിവരങ്ങൾ മാറ്റുക:
              </span>
              <div className="flex-1 min-w-0">{editControl}</div>
            </div>
          </div>
        )}
      </div>
    );
  };

  if (!entry) return null;

  const contentBody = (
    <div className={isFullPage ? "bg-white rounded-xl border p-4 sm:p-6 shadow-sm space-y-4 print:p-0 print:border-none print:shadow-none" : "space-y-4"}>
      {/* Controls - Hidden during Printing */}
      <div className="print:hidden no-print space-y-4">
        <DialogHeader className="border-b pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="text-xl font-bold flex items-center gap-2 text-foreground">
                <FileText className="h-5 w-5 text-primary" />
                Printable Official Reports & Completion Documents
              </h2>
              <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                Generate official GWD Kerala Completion Reports, Final Bills, Proceedings & Utilization Certificates.
              </p>
            </div>

            {/* Language Selector & Action Buttons */}
            <div className="flex flex-wrap items-center gap-2">
              <PrintStyleToolbar
                settings={printSettings}
                onSettingsChange={setPrintSettings}
                hasMalayalam={lang === 'ml' || true}
                hasEnglish={lang === 'en' || true}
                buttonText="Print Settings & Fonts"
              />

              <Tabs value={lang} onValueChange={(val) => setLang(val as LanguageMode)} className="w-auto">
                <TabsList className="grid grid-cols-2 w-36">
                  <TabsTrigger value="ml" className="text-xs font-semibold">മലയാളം</TabsTrigger>
                  <TabsTrigger value="en" className="text-xs font-semibold">English</TabsTrigger>
                </TabsList>
              </Tabs>

              {onSave && (
                <Button onClick={handleSave} disabled={isSaving} variant="outline" className="gap-1.5 shadow">
                  {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4 text-primary" />}
                  Save
                </Button>
              )}

              {isInIframe ? (
                <Button asChild variant="default" className="gap-1.5 shadow bg-amber-600 hover:bg-amber-700 text-white border-none animate-pulse" title="Print this document (opens in a new tab)">
                  <a href={typeof window !== 'undefined' ? window.location.href : '#'} target="_blank" rel="noopener noreferrer">
                    <Printer className="h-4 w-4" />
                    <span>Print</span>
                  </a>
                </Button>
              ) : (
                <Button onClick={handlePrint} className="bg-primary text-primary-foreground gap-1.5 shadow">
                  <Printer className="h-4 w-4" />
                  Print
                </Button>
              )}

              <Button onClick={handleCopyRichHtml} disabled={isCopying} variant="outline" className="gap-1.5 shadow border-primary/20 hover:bg-primary/5 hover:text-primary">
                <ClipboardCopy className="h-4 w-4 text-primary" />
                {isCopying ? "Copying..." : "Copy Rich HTML"}
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
                  {(!isDepositWork || hasBwcOrTwc) && (
                    <SelectItem value="completion_report">
                      {lang === 'ml' ? 'പൂർത്തീകരണ റിപ്പോർട്ട് (Completion Report)' : 'Completion Report'}
                    </SelectItem>
                  )}
                  {(!isDepositWork || hasBwcOrTwc) && (
                    <SelectItem value="final_bill">
                      {lang === 'ml' ? 'ഫൈനൽ ബിൽ (Final Bill)' : 'Final Bill'}
                    </SelectItem>
                  )}
                  {(!isDepositWork || hasBwcOrTwc) && hasMultipleSites && (
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
            <div className="space-y-3 pt-3 border-t mt-2">
              {/* General & Drilling */}
              <div>
                <span className="font-semibold text-[11px] text-muted-foreground uppercase tracking-wider block mb-1">General & Drilling</span>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  <div>
                    <Label className="text-[11px]">File No.</Label>
                    <Input className="h-8 text-xs" value={fileNo} onChange={(e) => setFileNo(e.target.value)} />
                  </div>
                  <div>
                    <Label className="text-[11px]">Report Date (തീയതി)</Label>
                    <Input className="h-8 text-xs" value={reportDate} onChange={(e) => setReportDate(e.target.value)} placeholder="DD/MM/YYYY" />
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
                    <Label className="text-[11px]">Subsidy Amount (Rs)</Label>
                    <Input className="h-8 text-xs" type="number" value={subsidyAmount} onChange={(e) => setSubsidyAmount(Number(e.target.value))} />
                  </div>
                  <div>
                    <Label className="text-[11px]">Contractor Name (if tender)</Label>
                    <Input className="h-8 text-xs" value={contractorName} onChange={(e) => setContractorName(e.target.value)} />
                  </div>
                </div>
              </div>

              {/* Main & Outer Casing Pipes */}
              <div>
                <span className="font-semibold text-[11px] text-muted-foreground uppercase tracking-wider block mb-1">Outer & PVC Casing Pipes</span>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  <div>
                    <Label className="text-[11px]">Casing 10kg Rate (Rs/m)</Label>
                    <Input className="h-8 text-xs" type="number" value={casing10kgRate} onChange={(e) => setCasing10kgRate(Number(e.target.value))} />
                  </div>
                  <div>
                    <Label className="text-[11px]">Casing 10kg Qty (m)</Label>
                    <Input className="h-8 text-xs" type="number" value={casing10kgQty} onChange={(e) => setCasing10kgQty(Number(e.target.value))} />
                  </div>
                  <div>
                    <Label className="text-[11px]">Casing 8kg Rate (Rs/m)</Label>
                    <Input className="h-8 text-xs" type="number" value={casing8kgRate} onChange={(e) => setCasing8kgRate(Number(e.target.value))} />
                  </div>
                  <div>
                    <Label className="text-[11px]">Casing 8kg Qty (m)</Label>
                    <Input className="h-8 text-xs" type="number" value={casing8kgQty} onChange={(e) => setCasing8kgQty(Number(e.target.value))} />
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
                    <Label className="text-[11px]">Outer Casing Rate (Rs/m)</Label>
                    <Input className="h-8 text-xs" type="number" value={outerCasingRate} onChange={(e) => setOuterCasingRate(Number(e.target.value))} />
                  </div>
                  <div>
                    <Label className="text-[11px]">Outer Casing Qty (m)</Label>
                    <Input className="h-8 text-xs" type="number" value={outerCasingQty} onChange={(e) => setOuterCasingQty(Number(e.target.value))} />
                  </div>
                </div>
              </div>

              {/* Inner Casing Pipes & Cap */}
              <div>
                <span className="font-semibold text-[11px] text-muted-foreground uppercase tracking-wider block mb-1">Inner Casing Pipes & Cap</span>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  <div>
                    <Label className="text-[11px]">Inner Casing 6kg Rate (Rs/m)</Label>
                    <Input className="h-8 text-xs" type="number" value={innerCasing6kgRate} onChange={(e) => setInnerCasing6kgRate(Number(e.target.value))} />
                  </div>
                  <div>
                    <Label className="text-[11px]">Inner Casing 6kg Qty (m)</Label>
                    <Input className="h-8 text-xs" type="number" value={innerCasing6kgQty} onChange={(e) => setInnerCasing6kgQty(Number(e.target.value))} />
                  </div>
                  <div>
                    <Label className="text-[11px]">Inner Casing 4kg Rate (Rs/m)</Label>
                    <Input className="h-8 text-xs" type="number" value={innerCasing4kgRate} onChange={(e) => setInnerCasing4kgRate(Number(e.target.value))} />
                  </div>
                  <div>
                    <Label className="text-[11px]">Inner Casing 4kg Qty (m)</Label>
                    <Input className="h-8 text-xs" type="number" value={innerCasing4kgQty} onChange={(e) => setInnerCasing4kgQty(Number(e.target.value))} />
                  </div>
                  <div>
                    <Label className="text-[11px]">Inner Casing Cap Rate (Rs)</Label>
                    <Input className="h-8 text-xs" type="number" value={innerCasingRate} onChange={(e) => setInnerCasingRate(Number(e.target.value))} />
                  </div>
                  <div>
                    <Label className="text-[11px]">Inner Casing General Qty (m)</Label>
                    <Input className="h-8 text-xs" type="number" value={innerCasingQty} onChange={(e) => setInnerCasingQty(Number(e.target.value))} />
                  </div>
                </div>
              </div>

              {/* Bank & Refund Details */}
              <div>
                <span className="font-semibold text-[11px] text-muted-foreground uppercase tracking-wider block mb-1">Bank & Refund Details</span>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  <div>
                    <Label className="text-[11px]">Bank Account No (Refund)</Label>
                    <Input className="h-8 text-xs" value={bankAccountNo} onChange={(e) => setBankAccountNo(e.target.value)} placeholder="e.g. 85829024542" />
                  </div>
                  <div>
                    <Label className="text-[11px]">IFSC Code</Label>
                    <Input className="h-8 text-xs" value={bankIfsc} onChange={(e) => setBankIfsc(e.target.value)} placeholder="e.g. SBIN0012880" />
                  </div>
                  <div>
                    <Label className="text-[11px]">Bank Name</Label>
                    <Input className="h-8 text-xs" value={bankName} onChange={(e) => setBankName(e.target.value)} placeholder="e.g. SBI" />
                  </div>
                  <div>
                    <Label className="text-[11px]">Bank Branch</Label>
                    <Input className="h-8 text-xs" value={bankBranch} onChange={(e) => setBankBranch(e.target.value)} placeholder="e.g. Pathanamthitta Main" />
                  </div>
                </div>
              </div>
            </div>
          </details>
        </div>

        {/* PRINTABLE DOCUMENT CANVAS */}
        <div id="printable-report-document" className="bg-white text-black border shadow-sm font-sans rounded-none print:border-none print:shadow-none print:p-0 print:m-0" style={getPrintContainerStyle(printSettings)}>
          
          {/* 1. COMPLETION REPORT (MALAYALAM & ENGLISH) */}
          {docType === 'completion_report' && (() => {
            const oCode = officeAddress?.officeCode || 'GWDKLM';
            const displayFileNo = fileNo ? (fileNo.toUpperCase().startsWith(oCode.toUpperCase()) ? fileNo : `${oCode}/${fileNo}`) : '';
            const displayAppType = applicationType ? (applicationType.toLowerCase().includes('deposit') ? applicationType : `${applicationType} - Deposit Works`) : 'Deposit Works';

            const meterUnit = lang === 'ml' ? 'മീറ്റർ' : 'meter';
            const recTDFormatted = surveyRecommendedTD ? formatMeterValue(surveyRecommendedTD, meterUnit) : '';
            const recOBFormatted = surveyRecommendedOB ? formatMeterValue(surveyRecommendedOB, meterUnit) : '';
            const recDisplay = [recTDFormatted, recOBFormatted].filter(Boolean).join(', ');

            const totalCasingMeters = (Number(casing10kgQty) || 0) + (Number(casing8kgQty) || 0) + (Number(casing6kgQty) || 0) + (Number(innerCasingQty) || 0);

            const formattedPeriodFrom = formatDateDDMMYYYY(periodFrom);
            const formattedPeriodTo = formatDateDDMMYYYY(periodTo);

            return (
              <div className="completion-report flex flex-col justify-between min-h-[255mm] space-y-2">
                {lang === 'ml' ? (
                  <>
                    <div>
                      <div className="text-center space-y-1 pb-2 mb-2 border-b-2 border-black">
                        <h2 className="text-base sm:text-lg font-extrabold tracking-wide">ഭൂജലവകുപ്പ്, ജില്ലാ ഓഫീസ്, {districtMl}</h2>
                        <h3 className="text-sm sm:text-base font-bold underline">{currentSite?.purpose === 'TWC' ? 'പൂർത്തീകരണറിപ്പോർട്ട് - റ്റ്യൂബ് കിണർ നിർമ്മാണം' : 'പൂർത്തീകരണറിപ്പോർട്ട് - കുഴൽകിണർ നിർമ്മാണം'}</h3>
                      </div>

                      <div className="flex justify-end text-xs sm:text-[13px] font-semibold mb-2">
                        <div className="min-w-[180px]">
                          {renderEditableCell(
                            'cr_reportDate',
                            <div className="text-right">തീയതി : <strong>{reportDate}</strong></div>,
                            <Input className="h-6 text-xs w-32 ml-auto" placeholder="DD/MM/YYYY" value={reportDate} onChange={e => setReportDate(e.target.value)} />
                          )}
                        </div>
                      </div>

                      <table className="w-full border-collapse text-[12.5px] sm:text-[13px] leading-snug">
                        <tbody>
                          <tr className="border-b border-gray-300">
                            <td className="py-2 px-2 font-bold w-[40%] text-black align-top">1. ഫയൽ നമ്പർ</td>
                            <td className="py-2 px-2 w-[60%] text-black align-top">
                              {renderEditableCell('cr_fileNo', `: ${displayFileNo}`, <Input className="h-6 text-xs" value={fileNo} onChange={e => setFileNo(e.target.value)} />)}
                            </td>
                          </tr>
                          <tr className="border-b border-gray-300">
                            <td className="py-2 px-2 font-bold text-black align-top">2. അപേക്ഷകന്റെ പേരും മേൽവിലാസവും</td>
                            <td className="py-2 px-2 text-black align-top">
                              {renderEditableCell('cr_applicant', `: ${applicantName}${applicantAddress ? `, ${applicantAddress}` : ''}`, 
                                <div className="flex gap-1">
                                  <Input className="h-6 text-xs" placeholder="പേര്" value={applicantName} onChange={e => setApplicantName(e.target.value)} />
                                  <Input className="h-6 text-xs" placeholder="മേൽവിലാസം" value={applicantAddress} onChange={e => setApplicantAddress(e.target.value)} />
                                </div>
                              )}
                            </td>
                          </tr>
                          <tr className="border-b border-gray-300">
                            <td className="py-2 px-2 font-bold text-black align-top">3. സൈറ്റിന്റെ പേര് / സ്ഥലം</td>
                            <td className="py-2 px-2 text-black align-top">
                              {renderEditableCell('cr_siteName', `: ${siteName}`, <Input className="h-6 text-xs" value={siteName} onChange={e => setSiteName(e.target.value)} />)}
                            </td>
                          </tr>
                          <tr className="border-b border-gray-300">
                            <td className="py-2 px-2 font-bold text-black align-top">4. ലാറ്റിറ്റ്യൂഡ് / ലാംഗിറ്റ്യൂഡ്</td>
                            <td className="py-2 px-2 text-black align-top">
                              {renderEditableCell('cr_latLong', `: ${latitude && longitude ? `${latitude}, ${longitude}` : (latitude || longitude || '')}`, 
                                <div className="flex gap-1">
                                  <Input className="h-6 text-xs" placeholder="Lat" value={latitude} onChange={e => setLatitude(e.target.value)} />
                                  <Input className="h-6 text-xs" placeholder="Long" value={longitude} onChange={e => setLongitude(e.target.value)} />
                                </div>
                              )}
                            </td>
                          </tr>
                          <tr className="border-b border-gray-300">
                            <td className="py-2 px-2 font-bold text-black align-top">5. തദ്ദേശസ്വയംഭരണ സ്ഥാപനം, വാർഡ്</td>
                            <td className="py-2 px-2 text-black align-top">
                              {renderEditableCell('cr_lsgd', `: ${localSelfGovt || ''}`, <Input className="h-6 text-xs" value={localSelfGovt} onChange={e => setLocalSelfGovt(e.target.value)} />)}
                            </td>
                          </tr>
                          <tr className="border-b border-gray-300">
                            <td className="py-2 px-2 font-bold text-black align-top">6. നിയമസഭാമണ്ഡലം</td>
                            <td className="py-2 px-2 text-black align-top">
                              {renderEditableCell('cr_constituency', `: ${constituency || ''}`, <Input className="h-6 text-xs" value={constituency} onChange={e => setConstituency(e.target.value)} />)}
                            </td>
                          </tr>
                          <tr className="border-b border-gray-300">
                            <td className="py-2 px-2 font-bold text-black align-top">7. പദ്ധതി / ഉദ്ദേശ്യം</td>
                            <td className="py-2 px-2 text-black align-top">
                              {renderEditableCell('cr_appType', `: ${displayAppType}`, <Input className="h-6 text-xs" value={applicationType} onChange={e => setApplicationType(e.target.value)} />)}
                            </td>
                          </tr>
                          <tr className="border-b border-gray-300">
                            <td className="py-2 px-2 font-bold text-black align-top">8. ശുപാർശ ചെയ്ത ആഴവും മേൽമണ്ണിന്റെ ഘനവും</td>
                            <td className="py-2 px-2 text-black align-top">
                              {renderEditableCell('cr_recommended', `: ${recDisplay}`, 
                                <div className="flex gap-1">
                                  <Input className="h-6 text-xs" placeholder="ആഴം" value={surveyRecommendedTD} onChange={e => setSurveyRecommendedTD(e.target.value)} />
                                  <Input className="h-6 text-xs" placeholder="മേൽമണ്ണ്" value={surveyRecommendedOB} onChange={e => setSurveyRecommendedOB(e.target.value)} />
                                </div>
                              )}
                            </td>
                          </tr>
                          <tr className="border-b border-gray-300">
                            <td className="py-2 px-2 font-bold text-black align-top">9. കുഴൽകിണറിന്റെ സ്ഥാനം</td>
                            <td className="py-2 px-2 text-black align-top">
                              {renderEditableCell('cr_surveyLoc', `: ${surveyLocation || ''}`, <Textarea className="min-h-[40px] text-xs p-1" value={surveyLocation} onChange={e => setSurveyLocation(e.target.value)} />)}
                            </td>
                          </tr>
                          <tr className="border-b border-gray-300">
                            <td className="py-2 px-2 font-bold text-black align-top">10. പ്രവൃത്തിക്ക് ഉപയോഗിച്ച റിഗ്</td>
                            <td className="py-2 px-2 text-black align-top">
                              {renderEditableCell('cr_rigUsed', `: ${rigUsed}`, <Input className="h-6 text-xs" value={rigUsed} onChange={e => setRigUsed(e.target.value)} />)}
                            </td>
                          </tr>
                          <tr className="border-b border-gray-300">
                            <td className="py-2 px-2 font-bold text-black align-top">11. കുഴൽകിണറിന്റെ വ്യാസം</td>
                            <td className="py-2 px-2 text-black align-top">
                              {renderEditableCell('cr_diameter', `: ${diameter}`, <Input className="h-6 text-xs" value={diameter} onChange={e => setDiameter(e.target.value)} />)}
                            </td>
                          </tr>
                          <tr className="border-b border-gray-300">
                            <td className="py-2 px-2 font-bold text-black align-top">12. കുഴൽകിണറിന്റെ ആഴം</td>
                            <td className="py-2 px-2 text-black align-top">
                              {renderEditableCell('cr_depth', `: ${depthMeter ? `${depthMeter} മീറ്റർ` : ''}`, <Input type="number" className="h-6 text-xs w-28" value={depthMeter} onChange={e => { const val = Number(e.target.value); setDepthMeter(val); setDrillingQty(val); }} />)}
                            </td>
                          </tr>
                          <tr className="border-b border-gray-300" id="cr_row_ob">
                            <td className="py-2 px-2 font-bold text-black align-top">13. മേൽമണ്ണിന്റെ ഘനം</td>
                            <td className="py-2 px-2 text-black align-top">
                              {renderEditableCell('cr_ob', `: ${actualOverburden ? `${actualOverburden} മീറ്റർ` : ''}`, <Input className="h-6 text-xs w-28" value={actualOverburden} onChange={e => setActualOverburden(e.target.value)} />)}
                            </td>
                          </tr>
                          <tr className="border-b border-gray-300" id="cr_row_casingDetails">
                            <td className="py-2 px-2 font-bold text-black align-top">14. ഉപയോഗിച്ച കേസിംഗ് പൈപ്പ്</td>
                            <td className="py-2 px-2 text-black align-top">
                              {renderEditableCell('cr_casingDetails', 
                                (() => {
                                  const lines: string[] = [];
                                  if (casing10kgQty) lines.push(`${casingDiameterLabel} വ്യാസം, 10 kg/cm² : ${casing10kgQty} മീറ്റർ`);
                                  if (casing8kgQty) lines.push(`${casingDiameterLabel} വ്യാസം, 8 kg/cm² : ${casing8kgQty} മീറ്റർ`);
                                  if (casing6kgQty) lines.push(`${casingDiameterLabel} വ്യാസം, 6 kg/cm² : ${casing6kgQty} മീറ്റർ`);
                                  if (currentSite?.purpose === 'TWC') {
                                    if (pilotDrillingDepth) lines.push(`പൈലറ്റ് ഡ്രില്ലിംഗ് ആഴം: ${formatMeterValue(pilotDrillingDepth, 'മീറ്റർ')}`);
                                    if (surveyPlainPipe) lines.push(`പ്ലെയിൻ പൈപ്പ് (Plain Pipe): ${formatMeterValue(surveyPlainPipe, 'മീറ്റർ')}`);
                                    if (surveySlottedPipe) lines.push(`സ്ലോട്ടഡ് പൈപ്പ് (Slotted Pipe): ${formatMeterValue(surveySlottedPipe, 'മീറ്റർ')}`);
                                    if (outerCasingPipe) lines.push(`എം.എസ് കേസിംഗ് (MS Casing): ${formatMeterValue(outerCasingPipe, 'മീറ്റർ')}`);
                                  }
                                  const mainCasingTotal = (casing10kgQty || 0) + (casing8kgQty || 0) + (casing6kgQty || 0);
                                  return (
                                    <span>
                                      : {mainCasingTotal ? `${mainCasingTotal} മീറ്റർ` : ''}
                                      {lines.length > 0 && (
                                        <span className="ml-4 inline-block align-top">
                                          {lines.map((line, idx) => (
                                            <React.Fragment key={idx}>
                                              {idx > 0 && <br />}
                                              {line}
                                            </React.Fragment>
                                          ))}
                                        </span>
                                      )}
                                    </span>
                                  );
                                })(), 
                                <div className="grid grid-cols-2 gap-2">
                                  <Input type="number" placeholder="10kg" className="h-6 text-xs" value={casing10kgQty} onChange={e => setCasing10kgQty(Number(e.target.value))} />
                                  <Input type="number" placeholder="8kg" className="h-6 text-xs" value={casing8kgQty} onChange={e => setCasing8kgQty(Number(e.target.value))} />
                                  <Input type="number" placeholder="6kg" className="h-6 text-xs" value={casing6kgQty} onChange={e => setCasing6kgQty(Number(e.target.value))} />
                                  {currentSite?.purpose === 'TWC' && (
                                    <>
                                      <Input placeholder="Pilot Depth" className="h-6 text-xs" value={pilotDrillingDepth} onChange={e => setPilotDrillingDepth(e.target.value)} />
                                      <Input placeholder="Plain Pipe" className="h-6 text-xs" value={surveyPlainPipe} onChange={e => setSurveyPlainPipe(e.target.value)} />
                                      <Input placeholder="Slotted Pipe" className="h-6 text-xs" value={surveySlottedPipe} onChange={e => setSurveySlottedPipe(e.target.value)} />
                                      <Input placeholder="MS Casing" className="h-6 text-xs" value={outerCasingPipe} onChange={e => setOuterCasingPipe(e.target.value)} />
                                    </>
                                  )}
                                </div>
                              )}
                            </td>
                          </tr>
                          <tr className="border-b border-gray-300" id="cr_row_innerCasing">
                            <td className="py-2 px-2 font-bold text-black align-top">15. ഉപയോഗിച്ച ഇന്നര് കേസിംഗ് പൈപ്പ്</td>
                            <td className="py-2 px-2 text-black align-top">
                              {renderEditableCell('cr_innerCasing', 
                                (() => {
                                  const lines: string[] = [];
                                  if (innerCasing6kgQty) lines.push(`110 mm വ്യാസം, 6 kg/cm² : ${innerCasing6kgQty} മീറ്റർ`);
                                  if (innerCasing4kgQty) lines.push(`110 mm വ്യാസം, 4 kg/cm² : ${innerCasing4kgQty} മീറ്റർ`);
                                  else if (!innerCasing6kgQty && innerCasingQty) lines.push(`110 mm വ്യാസം, 4 kg/cm² : ${innerCasingQty} മീറ്റർ`);
                                  const totalInner = (innerCasing6kgQty || 0) + (innerCasing4kgQty || 0) + ((!innerCasing6kgQty && !innerCasing4kgQty) ? (innerCasingQty || 0) : 0);
                                  return (
                                    <span>
                                      : {totalInner ? `${totalInner} മീറ്റർ` : 'ഇല്ല'}
                                      {lines.length > 0 && (
                                        <span className="ml-4 inline-block align-top">
                                          {lines.map((line, idx) => (
                                            <React.Fragment key={idx}>
                                              {idx > 0 && <br />}
                                              {line}
                                            </React.Fragment>
                                          ))}
                                        </span>
                                      )}
                                    </span>
                                  );
                                })(), 
                                <div className="grid grid-cols-2 gap-2">
                                  <Input type="number" placeholder="Inner 6kg" className="h-6 text-xs" value={innerCasing6kgQty} onChange={e => setInnerCasing6kgQty(Number(e.target.value))} />
                                  <Input type="number" placeholder="Inner 4kg" className="h-6 text-xs" value={innerCasing4kgQty} onChange={e => setInnerCasing4kgQty(Number(e.target.value))} />
                                </div>
                              )}
                            </td>
                          </tr>
                          <tr className="border-b border-gray-300" id="cr_row_outerCasing">
                            <td className="py-2 px-2 font-bold text-black align-top">16. ഉപയോഗിച്ച ഔട്ടര്  കേസിംഗ് പൈപ്പ്</td>
                            <td className="py-2 px-2 text-black align-top">
                              {renderEditableCell('cr_outerCasing', 
                                `: ${outerCasingQty ? `${outerCasingQty} മീറ്റർ (200 mm വ്യാസം, 6 kg/cm²)` : 'ഇല്ല'}`, 
                                <Input type="number" placeholder="Outer 200mm" className="h-6 text-xs w-32" value={outerCasingQty} onChange={e => setOuterCasingQty(Number(e.target.value))} />
                              )}
                            </td>
                          </tr>
                          <tr className="border-b border-gray-300">
                            <td className="py-2 px-2 font-bold text-black align-top">17. കുഴൽകിണറിന്റെ അടപ്പിന്റെ വിവരം (End Cap)</td>
                            <td className="py-2 px-2 text-black align-top">
                              {renderEditableCell('cr_endCap', `: ${endCap === 'Yes' ? `1 No., ${casingDiameterLabel} വ്യാസം` : 'ഇല്ല'}`, 
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
                          <tr className="border-b border-gray-300">
                            <td className="py-2 px-2 font-bold text-black align-top">18. ജലലഭ്യത (മണിക്കൂറിൽ)</td>
                            <td className="py-2 px-2 text-black align-top">
                              {renderEditableCell('cr_yield', `: ${yieldLph ? `${yieldLph} ലിറ്റർ പ്രതി മണിക്കൂർ` : ''}`, <Input type="number" className="h-6 text-xs w-28" value={yieldLph} onChange={e => setYieldLph(Number(e.target.value))} />)}
                            </td>
                          </tr>
                          <tr className="border-b border-gray-300">
                            <td className="py-2 px-2 font-bold text-black align-top">19. ജലം ലഭിച്ച മേഖല</td>
                            <td className="py-2 px-2 text-black align-top">
                              {renderEditableCell('cr_zone', `: ${waterStruckZone ? (waterStruckZone.includes('മീറ്റർ') || waterStruckZone.includes('meter') ? waterStruckZone : `${waterStruckZone} മീറ്റർ`) : ''}`, <Input className="h-6 text-xs" value={waterStruckZone} onChange={e => setWaterStruckZone(e.target.value)} />)}
                            </td>
                          </tr>
                          <tr className="border-b border-gray-300">
                            <td className="py-2 px-2 font-bold text-black align-top">20. ജലനിരപ്പ് (ഭൂനിരപ്പിൽ നിന്ന് താഴേക്ക്)</td>
                            <td className="py-2 px-2 text-black align-top">
                              {renderEditableCell('cr_swl', `: ${staticWaterLevel !== '' && staticWaterLevel !== null && staticWaterLevel !== undefined ? `${staticWaterLevel} മീറ്റർ` : ''}`, <Input className="h-6 text-xs w-28" value={staticWaterLevel} onChange={e => setStaticWaterLevel(e.target.value)} />)}
                            </td>
                          </tr>
                          <tr className="border-b border-gray-300">
                            <td className="py-2 px-2 font-bold text-black align-top">21. പ്രവർത്തന കാലയളവ്</td>
                            <td className="py-2 px-2 text-black align-top">
                              {renderEditableCell('cr_period', `: ${formattedPeriodFrom && formattedPeriodTo ? `${formattedPeriodFrom} മുതൽ ${formattedPeriodTo} വരെ` : (formattedPeriodFrom || formattedPeriodTo || '')}`, 
                                <div className="flex gap-1">
                                  <Input className="h-6 text-xs" placeholder="From" value={periodFrom} onChange={e => setPeriodFrom(e.target.value)} />
                                  <Input className="h-6 text-xs" placeholder="To" value={periodTo} onChange={e => setPeriodTo(e.target.value)} />
                                </div>
                              )}
                            </td>
                          </tr>
                          <tr className="border-b border-gray-300">
                            <td className="py-2 px-2 font-bold text-black align-top">22. കുറിപ്പ്</td>
                            <td className="py-2 px-2 text-black align-top">
                              {renderEditableCell('cr_remarks', `: ${remarks || ''}`, <Textarea className="min-h-[40px] text-xs p-1" value={remarks} onChange={e => setRemarks(e.target.value)} />)}
                            </td>
                          </tr>
                          {!isDeptRigWork && (
                            <tr className="border-b border-gray-300">
                              <td className="py-2 px-2 font-bold text-black align-top">23. കോൺട്രാക്ടറുടെ പേര്</td>
                              <td className="py-2 px-2 text-black align-top">
                                {renderEditableCell('cr_contractor', `: ${contractorName || 'Departmental Rig Work'}`, <Input className="h-6 text-xs" value={contractorName} onChange={e => setContractorName(e.target.value)} />)}
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>

                    <div className="pt-10 pb-2 mt-auto grid grid-cols-4 text-center font-bold text-xs sm:text-[12.5px] signature-block gap-2">
                      <div>
                        <div className="h-10"></div>
                        സൈറ്റ് - ഇൻ - ചാർജ്
                      </div>
                      <div>
                        <div className="h-10"></div>
                        അസി. എഞ്ചിനീയർ
                      </div>
                      <div>
                        <div className="h-10"></div>
                        അസി. എക്സി. എഞ്ചിനീയർ
                      </div>
                      <div>
                        <div className="h-10"></div>
                        ജില്ലാ ഓഫീസർ
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <div className="text-center space-y-1 pb-2 mb-2 border-b-2 border-black">
                        <h2 className="text-base sm:text-lg font-extrabold tracking-wide uppercase">GROUND WATER DEPARTMENT, DISTRICT OFFICE, {district}</h2>
                        <h3 className="text-sm sm:text-base font-bold underline">{currentSite?.purpose === 'TWC' ? 'TUBE WELL COMPLETION REPORT' : 'BORE WELL COMPLETION REPORT'}</h3>
                      </div>

                      <div className="flex justify-end text-xs sm:text-[13px] font-semibold mb-2">
                        <div className="min-w-[180px]">
                          {renderEditableCell(
                            'cr_en_reportDate',
                            <div className="text-right">Date : <strong>{reportDate}</strong></div>,
                            <Input className="h-6 text-xs w-32 ml-auto" placeholder="DD/MM/YYYY" value={reportDate} onChange={e => setReportDate(e.target.value)} />
                          )}
                        </div>
                      </div>

                      <table className="w-full border-collapse text-[12.5px] sm:text-[13px] leading-snug">
                        <tbody>
                          <tr className="border-b border-gray-300">
                            <td className="py-2 px-2 font-bold w-[40%] text-black align-top">1. File No.</td>
                            <td className="py-2 px-2 w-[60%] text-black align-top">
                              {renderEditableCell('cr_en_fileNo', `: ${displayFileNo}`, <Input className="h-6 text-xs" value={fileNo} onChange={e => setFileNo(e.target.value)} />)}
                            </td>
                          </tr>
                          <tr className="border-b border-gray-300">
                            <td className="py-2 px-2 font-bold text-black align-top">2. Name & Address of Applicant</td>
                            <td className="py-2 px-2 text-black align-top">
                              {renderEditableCell('cr_en_applicant', `: ${applicantName}${applicantAddress ? `, ${applicantAddress}` : ''}`, 
                                <div className="flex gap-1">
                                  <Input className="h-6 text-xs" placeholder="Name" value={applicantName} onChange={e => setApplicantName(e.target.value)} />
                                  <Input className="h-6 text-xs" placeholder="Address" value={applicantAddress} onChange={e => setApplicantAddress(e.target.value)} />
                                </div>
                              )}
                            </td>
                          </tr>
                          <tr className="border-b border-gray-300">
                            <td className="py-2 px-2 font-bold text-black align-top">3. Name of Site / Location</td>
                            <td className="py-2 px-2 text-black align-top">
                              {renderEditableCell('cr_en_siteName', `: ${siteName}`, <Input className="h-6 text-xs" value={siteName} onChange={e => setSiteName(e.target.value)} />)}
                            </td>
                          </tr>
                          <tr className="border-b border-gray-300">
                            <td className="py-2 px-2 font-bold text-black align-top">4. Latitude / Longitude</td>
                            <td className="py-2 px-2 text-black align-top">
                              {renderEditableCell('cr_en_latLong', `: ${latitude && longitude ? `${latitude}, ${longitude}` : (latitude || longitude || '')}`, 
                                <div className="flex gap-1">
                                  <Input className="h-6 text-xs" placeholder="Lat" value={latitude} onChange={e => setLatitude(e.target.value)} />
                                  <Input className="h-6 text-xs" placeholder="Long" value={longitude} onChange={e => setLongitude(e.target.value)} />
                                </div>
                              )}
                            </td>
                          </tr>
                          <tr className="border-b border-gray-300">
                            <td className="py-2 px-2 font-bold text-black align-top">5. Local Self Govt. / Ward</td>
                            <td className="py-2 px-2 text-black align-top">
                              {renderEditableCell('cr_en_lsgd', `: ${localSelfGovt || ''}`, <Input className="h-6 text-xs" value={localSelfGovt} onChange={e => setLocalSelfGovt(e.target.value)} />)}
                            </td>
                          </tr>
                          <tr className="border-b border-gray-300">
                            <td className="py-2 px-2 font-bold text-black align-top">6. Assembly Constituency</td>
                            <td className="py-2 px-2 text-black align-top">
                              {renderEditableCell('cr_en_constituency', `: ${constituency || ''}`, <Input className="h-6 text-xs" value={constituency} onChange={e => setConstituency(e.target.value)} />)}
                            </td>
                          </tr>
                          <tr className="border-b border-gray-300">
                            <td className="py-2 px-2 font-bold text-black align-top">7. Scheme / Purpose</td>
                            <td className="py-2 px-2 text-black align-top">
                              {renderEditableCell('cr_en_appType', `: ${displayAppType}`, <Input className="h-6 text-xs" value={applicationType} onChange={e => setApplicationType(e.target.value)} />)}
                            </td>
                          </tr>
                          <tr className="border-b border-gray-300">
                            <td className="py-2 px-2 font-bold text-black align-top">8. Recommended Depth & Overburden</td>
                            <td className="py-2 px-2 text-black align-top">
                              {renderEditableCell('cr_en_recommended', `: ${recDisplay}`, 
                                <div className="flex gap-1">
                                  <Input className="h-6 text-xs" placeholder="Depth" value={surveyRecommendedTD} onChange={e => setSurveyRecommendedTD(e.target.value)} />
                                  <Input className="h-6 text-xs" placeholder="Overburden" value={surveyRecommendedOB} onChange={e => setSurveyRecommendedOB(e.target.value)} />
                                </div>
                              )}
                            </td>
                          </tr>
                          <tr className="border-b border-gray-300">
                            <td className="py-2 px-2 font-bold text-black align-top">9. Location of Borewell</td>
                            <td className="py-2 px-2 text-black align-top">
                              {renderEditableCell('cr_en_surveyLoc', `: ${surveyLocation || ''}`, <Textarea className="min-h-[40px] text-xs p-1" value={surveyLocation} onChange={e => setSurveyLocation(e.target.value)} />)}
                            </td>
                          </tr>
                          <tr className="border-b border-gray-300">
                            <td className="py-2 px-2 font-bold text-black align-top">10. Drilling Rig / Machinery Used</td>
                            <td className="py-2 px-2 text-black align-top">
                              {renderEditableCell('cr_en_rig', `: ${rigUsed}`, <Input className="h-6 text-xs" value={rigUsed} onChange={e => setRigUsed(e.target.value)} />)}
                            </td>
                          </tr>
                          <tr className="border-b border-gray-300">
                            <td className="py-2 px-2 font-bold text-black align-top">11. Diameter of Borewell</td>
                            <td className="py-2 px-2 text-black align-top">
                              {renderEditableCell('cr_en_dia', `: ${diameter}`, <Input className="h-6 text-xs" value={diameter} onChange={e => setDiameter(e.target.value)} />)}
                            </td>
                          </tr>
                          <tr className="border-b border-gray-300">
                            <td className="py-2 px-2 font-bold text-black align-top">12. Total Depth Drilled</td>
                            <td className="py-2 px-2 text-black align-top">
                              {renderEditableCell('cr_en_depth', `: ${depthMeter ? `${depthMeter} meters` : ''}`, <Input type="number" className="h-6 text-xs w-28" value={depthMeter} onChange={e => { const v = Number(e.target.value); setDepthMeter(v); setDrillingQty(v); }} />)}
                            </td>
                          </tr>
                          <tr className="border-b border-gray-300" id="cr_en_row_ob">
                            <td className="py-2 px-2 font-bold text-black align-top">13. Overburden Thickness</td>
                            <td className="py-2 px-2 text-black align-top">
                              {renderEditableCell('cr_en_ob', `: ${actualOverburden ? `${actualOverburden} meters` : ''}`, <Input className="h-6 text-xs w-28" value={actualOverburden} onChange={e => setActualOverburden(e.target.value)} />)}
                            </td>
                          </tr>
                          <tr className="border-b border-gray-300" id="cr_en_row_casing">
                            <td className="py-2 px-2 font-bold text-black align-top">14. Casing Pipe Lowered</td>
                            <td className="py-2 px-2 text-black align-top">
                              {renderEditableCell('cr_en_casing', 
                                (() => {
                                  const lines: string[] = [];
                                  if (casing10kgQty) lines.push(`${casingDiameterLabel}, 10 kg/cm²: ${casing10kgQty} meter`);
                                  if (casing8kgQty) lines.push(`${casingDiameterLabel}, 8 kg/cm²: ${casing8kgQty} meter`);
                                  if (casing6kgQty) lines.push(`${casingDiameterLabel}, 6 kg/cm²: ${casing6kgQty} meter`);
                                  if (currentSite?.purpose === 'TWC') {
                                    if (pilotDrillingDepth) lines.push(`Pilot Drilling Depth: ${formatMeterValue(pilotDrillingDepth)}`);
                                    if (surveyPlainPipe) lines.push(`Plain Pipe: ${formatMeterValue(surveyPlainPipe)}`);
                                    if (surveySlottedPipe) lines.push(`Slotted Pipe: ${formatMeterValue(surveySlottedPipe)}`);
                                    if (outerCasingPipe) lines.push(`MS Casing: ${formatMeterValue(outerCasingPipe)}`);
                                  }
                                  const mainCasingTotal = (casing10kgQty || 0) + (casing8kgQty || 0) + (casing6kgQty || 0);
                                  return (
                                    <span>
                                      : {mainCasingTotal ? `${mainCasingTotal} meter` : ''}
                                      {lines.length > 0 && (
                                        <span className="ml-4 inline-block align-top">
                                          {lines.map((line, idx) => (
                                            <React.Fragment key={idx}>
                                              {idx > 0 && <br />}
                                              {line}
                                            </React.Fragment>
                                          ))}
                                        </span>
                                      )}
                                    </span>
                                  );
                                })(), 
                                <div className="grid grid-cols-2 gap-2">
                                  <Input type="number" placeholder="10kg" className="h-6 text-xs" value={casing10kgQty} onChange={e => setCasing10kgQty(Number(e.target.value))} />
                                  <Input type="number" placeholder="8kg" className="h-6 text-xs" value={casing8kgQty} onChange={e => setCasing8kgQty(Number(e.target.value))} />
                                  <Input type="number" placeholder="6kg" className="h-6 text-xs" value={casing6kgQty} onChange={e => setCasing6kgQty(Number(e.target.value))} />
                                  {currentSite?.purpose === 'TWC' && (
                                    <>
                                      <Input placeholder="Pilot Depth" className="h-6 text-xs" value={pilotDrillingDepth} onChange={e => setPilotDrillingDepth(e.target.value)} />
                                      <Input placeholder="Plain Pipe" className="h-6 text-xs" value={surveyPlainPipe} onChange={e => setSurveyPlainPipe(e.target.value)} />
                                      <Input placeholder="Slotted Pipe" className="h-6 text-xs" value={surveySlottedPipe} onChange={e => setSurveySlottedPipe(e.target.value)} />
                                      <Input placeholder="MS Casing" className="h-6 text-xs" value={outerCasingPipe} onChange={e => setOuterCasingPipe(e.target.value)} />
                                    </>
                                  )}
                                </div>
                              )}
                            </td>
                          </tr>
                          <tr className="border-b border-gray-300" id="cr_en_row_innerCasing">
                            <td className="py-2 px-2 font-bold text-black align-top">15. Inner Casing Pipe Lowered</td>
                            <td className="py-2 px-2 text-black align-top">
                              {renderEditableCell('cr_en_innerCasing', 
                                (() => {
                                  const lines: string[] = [];
                                  if (innerCasing6kgQty) lines.push(`110 mm dia, 6 kg/cm²: ${innerCasing6kgQty} meter`);
                                  if (innerCasing4kgQty) lines.push(`110 mm dia, 4 kg/cm²: ${innerCasing4kgQty} meter`);
                                  else if (!innerCasing6kgQty && innerCasingQty) lines.push(`110 mm dia, 4 kg/cm²: ${innerCasingQty} meter`);
                                  const totalInner = (innerCasing6kgQty || 0) + (innerCasing4kgQty || 0) + ((!innerCasing6kgQty && !innerCasing4kgQty) ? (innerCasingQty || 0) : 0);
                                  return (
                                    <span>
                                      : {totalInner ? `${totalInner} meter` : 'Nil'}
                                      {lines.length > 0 && (
                                        <span className="ml-4 inline-block align-top">
                                          {lines.map((line, idx) => (
                                            <React.Fragment key={idx}>
                                              {idx > 0 && <br />}
                                              {line}
                                            </React.Fragment>
                                          ))}
                                        </span>
                                      )}
                                    </span>
                                  );
                                })(), 
                                <div className="grid grid-cols-2 gap-2">
                                  <Input type="number" placeholder="Inner 6kg" className="h-6 text-xs" value={innerCasing6kgQty} onChange={e => setInnerCasing6kgQty(Number(e.target.value))} />
                                  <Input type="number" placeholder="Inner 4kg" className="h-6 text-xs" value={innerCasing4kgQty} onChange={e => setInnerCasing4kgQty(Number(e.target.value))} />
                                </div>
                              )}
                            </td>
                          </tr>
                          <tr className="border-b border-gray-300" id="cr_en_row_outerCasing">
                            <td className="py-2 px-2 font-bold text-black align-top">16. Outer Casing Pipe Lowered</td>
                            <td className="py-2 px-2 text-black align-top">
                              {renderEditableCell('cr_en_outerCasing', 
                                `: ${outerCasingQty ? `${outerCasingQty} meter (200 mm dia, 6 kg/cm²)` : 'Nil'}`, 
                                <Input type="number" placeholder="Outer 200mm" className="h-6 text-xs w-32" value={outerCasingQty} onChange={e => setOuterCasingQty(Number(e.target.value))} />
                              )}
                            </td>
                          </tr>
                          <tr className="border-b border-gray-300">
                            <td className="py-2 px-2 font-bold text-black align-top">17. End Cap Details</td>
                            <td className="py-2 px-2 text-black align-top">
                              {renderEditableCell('cr_en_endCap', `: ${endCap === 'Yes' ? `1 No., ${casingDiameterLabel} diameter` : 'Nil'}`, 
                                <Select value={endCap} onValueChange={setEndCap}>
                                  <SelectTrigger className="h-6 text-xs"><SelectValue /></SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="Yes">Yes (1 No. Cap)</SelectItem>
                                    <SelectItem value="No">No (Nil)</SelectItem>
                                  </SelectContent>
                                </Select>
                              )}
                            </td>
                          </tr>
                          <tr className="border-b border-gray-300">
                            <td className="py-2 px-2 font-bold text-black align-top">18. Average Yield</td>
                            <td className="py-2 px-2 text-black align-top">
                              {renderEditableCell('cr_en_yield', `: ${yieldLph ? `${yieldLph} Litres Per Hour (LPH)` : ''}`, <Input type="number" className="h-6 text-xs w-28" value={yieldLph} onChange={e => setYieldLph(Number(e.target.value))} />)}
                            </td>
                          </tr>
                          <tr className="border-b border-gray-300">
                            <td className="py-2 px-2 font-bold text-black align-top">19. Water Struck Zone</td>
                            <td className="py-2 px-2 text-black align-top">
                              {renderEditableCell('cr_en_zone', `: ${waterStruckZone ? (waterStruckZone.toLowerCase().includes('meter') ? waterStruckZone : `${waterStruckZone} meters`) : ''}`, <Input className="h-6 text-xs" value={waterStruckZone} onChange={e => setWaterStruckZone(e.target.value)} />)}
                            </td>
                          </tr>
                          <tr className="border-b border-gray-300">
                            <td className="py-2 px-2 font-bold text-black align-top">20. Static Water Level</td>
                            <td className="py-2 px-2 text-black align-top">
                              {renderEditableCell('cr_en_swl', `: ${staticWaterLevel !== '' && staticWaterLevel !== null && staticWaterLevel !== undefined ? `${staticWaterLevel} meters below ground level` : ''}`, <Input className="h-6 text-xs w-28" value={staticWaterLevel} onChange={e => setStaticWaterLevel(e.target.value)} />)}
                            </td>
                          </tr>
                          <tr className="border-b border-gray-300">
                            <td className="py-2 px-2 font-bold text-black align-top">21. Period of Work</td>
                            <td className="py-2 px-2 text-black align-top">
                              {renderEditableCell('cr_en_period', `: ${formattedPeriodFrom && formattedPeriodTo ? `${formattedPeriodFrom} to ${formattedPeriodTo}` : (formattedPeriodFrom || formattedPeriodTo || '')}`, 
                                <div className="flex gap-1">
                                  <Input className="h-6 text-xs" placeholder="From" value={periodFrom} onChange={e => setPeriodFrom(e.target.value)} />
                                  <Input className="h-6 text-xs" placeholder="To" value={periodTo} onChange={e => setPeriodTo(e.target.value)} />
                                </div>
                              )}
                            </td>
                          </tr>
                          <tr className="border-b border-gray-300">
                            <td className="py-2 px-2 font-bold text-black align-top">22. Remarks</td>
                            <td className="py-2 px-2 text-black align-top">
                              {renderEditableCell('cr_en_remarks', `: ${remarks || ''}`, <Textarea className="min-h-[40px] text-xs p-1" value={remarks} onChange={e => setRemarks(e.target.value)} />)}
                            </td>
                          </tr>
                          {!isDeptRigWork && (
                            <tr className="border-b border-gray-300">
                              <td className="py-2 px-2 font-bold text-black align-top">23. Name of Contractor</td>
                              <td className="py-2 px-2 text-black align-top">
                                {renderEditableCell('cr_en_contractor', `: ${contractorName || 'Departmental Rig Work'}`, <Input className="h-6 text-xs" value={contractorName} onChange={e => setContractorName(e.target.value)} />)}
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>

                    <div className="pt-10 pb-2 mt-auto grid grid-cols-4 text-center font-bold text-xs sm:text-[12.5px] signature-block gap-2">
                      <div>
                        <div className="h-10"></div>
                        Site-in-Charge
                      </div>
                      <div>
                        <div className="h-10"></div>
                        Assistant Engineer
                      </div>
                      <div>
                        <div className="h-10"></div>
                        Assistant Exec. Engineer
                      </div>
                      <div>
                        <div className="h-10"></div>
                        District Officer
                      </div>
                    </div>
                  </>
                )}
              </div>
            );
          })()}

          {/* 2. FINAL BILL (MALAYALAM & ENGLISH) */}
          {docType === 'final_bill' && (
            <div className="final-bill flex flex-col justify-between min-h-[255mm] space-y-4">
              {lang === 'ml' ? (
                (() => {
                  const itemsMl = [
                    {
                      qty: drillingQty,
                      descId: 'fb_desc_drilling_ml',
                      descValue: fbDescDrillingMl,
                      descEl: <Input className="h-6 text-xs" value={fbDescDrillingMl} onChange={e => setFbDescDrillingMl(e.target.value)} />,
                      rateId: 'fb_r1',
                      rateValue: drillingRate.toFixed(2),
                      rateEl: <Input type="number" className="h-6 text-xs" value={drillingRate} onChange={e => setDrillingRate(Number(e.target.value))} />,
                      qtyId: 'fb_q1',
                      qtyText: `${drillingQty} മീറ്റർ`,
                      qtyEl: <Input type="number" className="h-6 text-xs" value={drillingQty} onChange={e => { const v = Number(e.target.value); setDrillingQty(v); setDepthMeter(v); }} />,
                      total: drillingTotal
                    },
                    {
                      qty: casing10kgQty,
                      descId: 'fb_desc_casing10_ml',
                      descValue: fbDescCasing10Ml,
                      descEl: <Input className="h-6 text-xs" value={fbDescCasing10Ml} onChange={e => setFbDescCasing10Ml(e.target.value)} />,
                      rateId: 'fb_r2',
                      rateValue: casing10kgRate.toFixed(2),
                      rateEl: <Input type="number" className="h-6 text-xs" value={casing10kgRate} onChange={e => setCasing10kgRate(Number(e.target.value))} />,
                      qtyId: 'fb_q2',
                      qtyText: `${casing10kgQty} മീറ്റർ`,
                      qtyEl: <Input type="number" className="h-6 text-xs" value={casing10kgQty} onChange={e => setCasing10kgQty(Number(e.target.value))} />,
                      total: casing10kgTotal
                    },
                    {
                      qty: casing8kgQty,
                      descId: 'fb_desc_casing8_ml',
                      descValue: fbDescCasing8Ml,
                      descEl: <Input className="h-6 text-xs" value={fbDescCasing8Ml} onChange={e => setFbDescCasing8Ml(e.target.value)} />,
                      rateId: 'fb_r2_8',
                      rateValue: casing8kgRate.toFixed(2),
                      rateEl: <Input type="number" className="h-6 text-xs" value={casing8kgRate} onChange={e => setCasing8kgRate(Number(e.target.value))} />,
                      qtyId: 'fb_q2_8',
                      qtyText: `${casing8kgQty} മീറ്റർ`,
                      qtyEl: <Input type="number" className="h-6 text-xs" value={casing8kgQty} onChange={e => setCasing8kgQty(Number(e.target.value))} />,
                      total: casing8kgTotal
                    },
                    {
                      qty: casing6kgQty,
                      descId: 'fb_desc_casing6_ml',
                      descValue: fbDescCasing6Ml,
                      descEl: <Input className="h-6 text-xs" value={fbDescCasing6Ml} onChange={e => setFbDescCasing6Ml(e.target.value)} />,
                      rateId: 'fb_r3',
                      rateValue: casing6kgRate.toFixed(2),
                      rateEl: <Input type="number" className="h-6 text-xs" value={casing6kgRate} onChange={e => setCasing6kgRate(Number(e.target.value))} />,
                      qtyId: 'fb_q3',
                      qtyText: `${casing6kgQty} മീറ്റർ`,
                      qtyEl: <Input type="number" className="h-6 text-xs" value={casing6kgQty} onChange={e => setCasing6kgQty(Number(e.target.value))} />,
                      total: casing6kgTotal
                    },
                    ...(outerCasingQty > 0 ? [{
                      qty: outerCasingQty,
                      descId: 'fb_desc_outer_ml',
                      descValue: fbDescOuterMl,
                      descEl: <Input className="h-6 text-xs" value={fbDescOuterMl} onChange={e => setFbDescOuterMl(e.target.value)} />,
                      rateId: 'fb_r_outer',
                      rateValue: outerCasingRate.toFixed(2),
                      rateEl: <Input type="number" className="h-6 text-xs" value={outerCasingRate} onChange={e => setOuterCasingRate(Number(e.target.value))} />,
                      qtyId: 'fb_q_outer',
                      qtyText: `${outerCasingQty} മീറ്റർ`,
                      qtyEl: <Input type="number" className="h-6 text-xs" value={outerCasingQty} onChange={e => setOuterCasingQty(Number(e.target.value))} />,
                      total: outerCasingTotal
                    }] : []),
                    ...((() => {
                      const totalInnerMeters = (innerCasing6kgQty || 0) + (innerCasing4kgQty || 0) + ((!innerCasing6kgQty && !innerCasing4kgQty) ? (innerCasingQty || 0) : 0);
                      const activeRate = innerCasing6kgQty > 0 ? innerCasing6kgRate : (innerCasing4kgQty > 0 ? innerCasing4kgRate : innerCasingRate);
                      return totalInnerMeters > 0 ? [{
                        qty: totalInnerMeters,
                        descId: 'fb_desc_inner_pipe_ml',
                        descValue: fbDescInnerPipeMl,
                        descEl: <Input className="h-6 text-xs" value={fbDescInnerPipeMl} onChange={e => setFbDescInnerPipeMl(e.target.value)} />,
                        rateId: 'fb_r_inner_pipe',
                        rateValue: activeRate.toFixed(2),
                        rateEl: <Input type="number" className="h-6 text-xs" value={activeRate} onChange={e => {
                          const val = Number(e.target.value);
                          if (innerCasing6kgQty > 0) setInnerCasing6kgRate(val);
                          else if (innerCasing4kgQty > 0) setInnerCasing4kgRate(val);
                          else setInnerCasingRate(val);
                        }} />,
                        qtyId: 'fb_q_inner_pipe',
                        qtyText: `${totalInnerMeters} മീറ്റർ`,
                        qtyEl: <Input type="number" className="h-6 text-xs" value={totalInnerMeters} onChange={e => {
                          const val = Number(e.target.value);
                          if (innerCasing6kgQty > 0) setInnerCasing6kgQty(val);
                          else if (innerCasing4kgQty > 0) setInnerCasing4kgQty(val);
                          else setInnerCasingQty(val);
                        }} />,
                        total: innerCasing6kgTotal + innerCasing4kgTotal
                      }] : [];
                    })()),
                    {
                      qty: endCap === 'Yes' ? 1 : 0,
                      descId: 'fb_desc_inner_ml',
                      descValue: fbDescInnerMl,
                      descEl: <Input className="h-6 text-xs" value={fbDescInnerMl} onChange={e => setFbDescInnerMl(e.target.value)} />,
                      rateId: 'fb_r4',
                      rateValue: innerCasingRate.toFixed(2),
                      rateEl: <Input type="number" className="h-6 text-xs" value={innerCasingRate} onChange={e => setInnerCasingRate(Number(e.target.value))} />,
                      qtyId: 'fb_q4',
                      qtyText: `${endCap === 'Yes' ? 1 : 0} എണ്ണം`,
                      qtyEl: <Input type="number" className="h-6 text-xs" value={endCap === 'Yes' ? 1 : 0} onChange={e => {}} />,
                      total: endCap === 'Yes' ? innerCasingRate : 0
                    }
                  ];
                  const activeItemsMl = itemsMl.filter(item => item.qty > 0);
                  const siteDisplayMl = currentSite?.nameOfSite || siteName || '';

                  return (
                    <div className="flex flex-col justify-between h-full flex-1 space-y-4">
                      <div className="space-y-4">
                        <div className="text-center space-y-1.5 pb-2 border-b-2 border-black">
                          <h2 className="text-2xl font-bold">ഭൂജലവകുപ്പ്, ജില്ലാ ഓഫീസ്, {districtMl}</h2>
                          <h3 className="text-xl font-bold">കുഴൽകിണർ നിർമ്മാണം - ഫൈനൽ ബിൽ</h3>
                        </div>

                        <div className="flex justify-between items-start text-base font-semibold py-1">
                          <div className="flex flex-col space-y-1">
                            <div>ഫയൽ നമ്പർ: <strong className="text-lg">{fileNo.toUpperCase().startsWith('GWD') ? fileNo : `${officeAddress?.officeCode || 'GWDKLM'}${fileNo}`}</strong></div>
                            <div>അപേക്ഷകൻ: <strong className="text-lg">{applicantName}</strong></div>
                            {siteDisplayMl && (
                              <div>സൈറ്റിന്റെ പേര്: <strong className="text-lg">{siteDisplayMl}</strong></div>
                            )}
                          </div>
                          <div className="min-w-[180px] shrink-0">
                            {renderEditableCell(
                              'fb_reportDate',
                              <div className="text-right">തീയതി : <strong className="text-lg">{reportDate}</strong></div>,
                              <Input className="h-6 text-xs w-32 ml-auto" placeholder="DD/MM/YYYY" value={reportDate} onChange={e => setReportDate(e.target.value)} />
                            )}
                          </div>
                        </div>

                        <table className="w-full border-collapse border border-black text-xs">
                          <thead>
                            <tr className="bg-gray-100 border-b border-black text-center font-bold">
                              <td className="border border-black py-2.5 w-12">ക്രമ നമ്പർ</td>
                              <td className="border border-black py-2.5">വിവരണങ്ങൾ</td>
                              <td className="border border-black py-2.5 w-24">നിരക്ക് (രൂപ)</td>
                              <td className="border border-black py-2.5 w-24">അളവ്</td>
                              <td className="border border-black py-2.5 w-32 text-right pr-2">തുക (രൂപ)</td>
                            </tr>
                          </thead>
                          <tbody>
                            {(() => {
                              const rows = [];
                              activeItemsMl.forEach((item, idx) => {
                                rows.push(
                                  <tr key={item.descId}>
                                    <td className="border border-black py-2 px-2.5 text-center">{idx + 1}</td>
                                    <td className="border border-black py-2 px-2.5">
                                      {renderEditableCell(item.descId, item.descValue, item.descEl)}
                                    </td>
                                    <td className="border border-black py-2 px-2.5 text-right font-mono">
                                      {renderEditableCell(item.rateId, item.rateValue, item.rateEl)}
                                    </td>
                                    <td className="border border-black py-2 px-2.5 text-center">
                                      {renderEditableCell(item.qtyId, item.qtyText, item.qtyEl)}
                                    </td>
                                    <td className="border border-black py-2 px-2.5 text-right font-mono">{item.total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                                  </tr>
                                );
                              });

                              rows.push(
                                <tr key="total_exp" className="font-bold bg-gray-50">
                                  <td className="border border-black py-2 px-2.5 text-center">{rows.length + 1}</td>
                                  <td className="border border-black py-2 px-2.5" colSpan={3}>കുഴൽകിണർ നിർമ്മാണ പ്രവൃത്തിയുടെ ആകെ ചിലവ്</td>
                                  <td className="border border-black py-2 px-2.5 text-right font-mono">{totalExpenditure.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                </tr>
                              );

                              if (isPrivateWork && (effectiveSubsidyAmount > 0 || isPrivateIrrigation || isFailedOrZeroYield)) {
                                rows.push(
                                  <tr key="subsidy">
                                    <td className="border border-black py-2 px-2.5 text-center">{rows.length + 1}</td>
                                    <td className="border border-black py-2 px-2.5" colSpan={3}>
                                      {renderEditableCell('fb_subsidy', 
                                        isFailedOrZeroYield
                                          ? 'പരാജയപ്പെട്ട കുഴൽകിണറിനുള്ള നഷ്ടപരിഹാരം (സബ്സിഡി ഉൾപ്പെടെ)'
                                          : (isPrivateIrrigation 
                                              ? 'നാമമാത്ര / ചെറുകിട കർഷകർക്കുള്ള സബ്സിഡി - ഡ്രില്ലിംഗ് ചാർജിന്റെ 50%' 
                                              : 'നാമമാത്ര / ചെറുകിട കർഷകർക്കുള്ള ധനസഹായം'), 
                                        <Input type="number" className="h-6 text-xs" value={effectiveSubsidyAmount} onChange={e => setSubsidyAmount(Number(e.target.value))} />
                                      )}
                                    </td>
                                    <td className="border border-black py-2 px-2.5 text-right font-mono">{effectiveSubsidyAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                  </tr>
                                );
                              }

                              const roundedPayable = Math.round(netPayableGwd);
                              const roundOffDiff = roundedPayable - netPayableGwd;

                              if (Math.abs(roundOffDiff) >= 0.005) {
                                rows.push(
                                  <tr key="round_off">
                                    <td className="border border-black py-2 px-2.5 text-center">{rows.length + 1}</td>
                                    <td className="border border-black py-2 px-2.5" colSpan={3}>Round off</td>
                                    <td className="border border-black py-2 px-2.5 text-right font-mono">
                                      {roundOffDiff >= 0 ? `+${roundOffDiff.toFixed(2)}` : roundOffDiff.toFixed(2)}
                                    </td>
                                  </tr>
                                );
                              }

                              rows.push(
                                <tr key="net_payable" className="font-bold bg-gray-50">
                                  <td className="border border-black py-2 px-2.5 text-center">{rows.length + 1}</td>
                                  <td className="border border-black py-2 px-2.5" colSpan={3}>കുഴൽകിണർ നിർമ്മാണ പ്രവൃത്തിക്ക് ഭൂജലവകുപ്പിന് ലഭിക്കേണ്ട തുക</td>
                                  <td className="border border-black py-2 px-2.5 text-right font-mono">{roundedPayable.toLocaleString('en-IN')}</td>
                                </tr>
                              );

                              if (!isDepositWork && !hasMultipleSites) {
                                rows.push(
                                  <tr key="advance">
                                    <td className="border border-black py-2 px-2.5 text-center">{rows.length + 1}</td>
                                    <td className="border border-black py-2 px-2.5" colSpan={3}>
                                      {renderEditableCell('fb_advance', `അപേക്ഷകൻ മുൻകൂറായി അടച്ചിട്ടുള്ള തുക (${ddDetails})`, 
                                        <div className="flex gap-1">
                                          <Input type="number" className="h-6 text-xs" value={advanceDeposit} onChange={e => setAdvanceDeposit(Number(e.target.value))} />
                                          <Input className="h-6 text-xs" placeholder="DD Details" value={ddDetails} onChange={e => setDdDetails(e.target.value)} />
                                        </div>
                                      )}
                                    </td>
                                    <td className="border border-black py-2 px-2.5 text-right font-mono">{advanceDeposit.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                  </tr>
                                );

                                rows.push(
                                  <tr key="balance" className="font-bold bg-gray-100">
                                    <td className="border border-black py-2 px-2.5 text-center">{rows.length + 1}</td>
                                    <td className="border border-black py-2 px-2.5" colSpan={3}>
                                      {balanceRefund >= 0 ? 'അപേക്ഷകന് തിരികെ നൽകാനുള്ള ബാലൻസ് തുക (Refund)' : 'വകുപ്പിന് ലഭിക്കേണ്ട ബാലൻസ് തുക'}
                                    </td>
                                    <td className="border border-black py-2 px-2.5 text-right font-mono">
                                      {Math.abs(balanceRefund).toLocaleString('en-IN')}
                                    </td>
                                  </tr>
                                );
                              }

                              return rows;
                            })()}
                          </tbody>
                        </table>

                        {/* Signature Block after table (4 rows distance) */}
                        <div className="pt-16 pb-2 grid grid-cols-3 text-center font-bold text-xs sm:text-sm gap-4 signature-block">
                          <div>
                            <div className="h-10"></div>
                            അസിസ്റ്റന്റ് എഞ്ചിനീയർ
                          </div>
                          <div>
                            <div className="h-10"></div>
                            അസിസ്റ്റന്റ് എക്സിക്യൂട്ടീവ് എഞ്ചിനീയർ
                          </div>
                          <div>
                            <div className="h-10"></div>
                            ജില്ലാ ഓഫീസർ
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })()
              ) : (
                (() => {
                  const itemsEn = [
                    {
                      qty: drillingQty,
                      descId: 'fb_desc_drilling_en',
                      descValue: fbDescDrillingEn,
                      descEl: <Input className="h-6 text-xs" value={fbDescDrillingEn} onChange={e => setFbDescDrillingEn(e.target.value)} />,
                      rateId: 'fb_en_r1',
                      rateValue: drillingRate.toFixed(2),
                      rateEl: <Input type="number" className="h-6 text-xs" value={drillingRate} onChange={e => setDrillingRate(Number(e.target.value))} />,
                      qtyId: 'fb_en_q1',
                      qtyText: `${drillingQty} m`,
                      qtyEl: <Input type="number" className="h-6 text-xs" value={drillingQty} onChange={e => { const v = Number(e.target.value); setDrillingQty(v); setDepthMeter(v); }} />,
                      total: drillingTotal
                    },
                    {
                      qty: casing10kgQty,
                      descId: 'fb_desc_casing10_en',
                      descValue: fbDescCasing10En,
                      descEl: <Input className="h-6 text-xs" value={fbDescCasing10En} onChange={e => setFbDescCasing10En(e.target.value)} />,
                      rateId: 'fb_en_r2',
                      rateValue: casing10kgRate.toFixed(2),
                      rateEl: <Input type="number" className="h-6 text-xs" value={casing10kgRate} onChange={e => setCasing10kgRate(Number(e.target.value))} />,
                      qtyId: 'fb_en_q2',
                      qtyText: `${casing10kgQty} m`,
                      qtyEl: <Input type="number" className="h-6 text-xs" value={casing10kgQty} onChange={e => setCasing10kgQty(Number(e.target.value))} />,
                      total: casing10kgTotal
                    },
                    {
                      qty: casing8kgQty,
                      descId: 'fb_desc_casing8_en',
                      descValue: fbDescCasing8En,
                      descEl: <Input className="h-6 text-xs" value={fbDescCasing8En} onChange={e => setFbDescCasing8En(e.target.value)} />,
                      rateId: 'fb_en_r2_8',
                      rateValue: casing8kgRate.toFixed(2),
                      rateEl: <Input type="number" className="h-6 text-xs" value={casing8kgRate} onChange={e => setCasing8kgRate(Number(e.target.value))} />,
                      qtyId: 'fb_en_q2_8',
                      qtyText: `${casing8kgQty} m`,
                      qtyEl: <Input type="number" className="h-6 text-xs" value={casing8kgQty} onChange={e => setCasing8kgQty(Number(e.target.value))} />,
                      total: casing8kgTotal
                    },
                    {
                      qty: casing6kgQty,
                      descId: 'fb_desc_casing6_en',
                      descValue: fbDescCasing6En,
                      descEl: <Input className="h-6 text-xs" value={fbDescCasing6En} onChange={e => setFbDescCasing6En(e.target.value)} />,
                      rateId: 'fb_en_r3',
                      rateValue: casing6kgRate.toFixed(2),
                      rateEl: <Input type="number" className="h-6 text-xs" value={casing6kgRate} onChange={e => setCasing6kgRate(Number(e.target.value))} />,
                      qtyId: 'fb_en_q3',
                      qtyText: `${casing6kgQty} m`,
                      qtyEl: <Input type="number" className="h-6 text-xs" value={casing6kgQty} onChange={e => setCasing6kgQty(Number(e.target.value))} />,
                      total: casing6kgTotal
                    },
                    ...(outerCasingQty > 0 ? [{
                      qty: outerCasingQty,
                      descId: 'fb_desc_outer_en',
                      descValue: fbDescOuterEn,
                      descEl: <Input className="h-6 text-xs" value={fbDescOuterEn} onChange={e => setFbDescOuterEn(e.target.value)} />,
                      rateId: 'fb_en_r_outer',
                      rateValue: outerCasingRate.toFixed(2),
                      rateEl: <Input type="number" className="h-6 text-xs" value={outerCasingRate} onChange={e => setOuterCasingRate(Number(e.target.value))} />,
                      qtyId: 'fb_en_q_outer',
                      qtyText: `${outerCasingQty} m`,
                      qtyEl: <Input type="number" className="h-6 text-xs" value={outerCasingQty} onChange={e => setOuterCasingQty(Number(e.target.value))} />,
                      total: outerCasingTotal
                    }] : []),
                    ...((() => {
                      const totalInnerMeters = (innerCasing6kgQty || 0) + (innerCasing4kgQty || 0) + ((!innerCasing6kgQty && !innerCasing4kgQty) ? (innerCasingQty || 0) : 0);
                      const activeRate = innerCasing6kgQty > 0 ? innerCasing6kgRate : (innerCasing4kgQty > 0 ? innerCasing4kgRate : innerCasingRate);
                      return totalInnerMeters > 0 ? [{
                        qty: totalInnerMeters,
                        descId: 'fb_desc_inner_pipe_en',
                        descValue: fbDescInnerPipeEn,
                        descEl: <Input className="h-6 text-xs" value={fbDescInnerPipeEn} onChange={e => setFbDescInnerPipeEn(e.target.value)} />,
                        rateId: 'fb_en_r_inner_pipe',
                        rateValue: activeRate.toFixed(2),
                        rateEl: <Input type="number" className="h-6 text-xs" value={activeRate} onChange={e => {
                          const val = Number(e.target.value);
                          if (innerCasing6kgQty > 0) setInnerCasing6kgRate(val);
                          else if (innerCasing4kgQty > 0) setInnerCasing4kgRate(val);
                          else setInnerCasingRate(val);
                        }} />,
                        qtyId: 'fb_en_q_inner_pipe',
                        qtyText: `${totalInnerMeters} m`,
                        qtyEl: <Input type="number" className="h-6 text-xs" value={totalInnerMeters} onChange={e => {
                          const val = Number(e.target.value);
                          if (innerCasing6kgQty > 0) setInnerCasing6kgQty(val);
                          else if (innerCasing4kgQty > 0) setInnerCasing4kgQty(val);
                          else setInnerCasingQty(val);
                        }} />,
                        total: innerCasing6kgTotal + innerCasing4kgTotal
                      }] : [];
                    })()),
                    {
                      qty: endCap === 'Yes' ? 1 : 0,
                      descId: 'fb_desc_inner_en',
                      descValue: fbDescInnerEn,
                      descEl: <Input className="h-6 text-xs" value={fbDescInnerEn} onChange={e => setFbDescInnerEn(e.target.value)} />,
                      rateId: 'fb_en_r4',
                      rateValue: innerCasingRate.toFixed(2),
                      rateEl: <Input type="number" className="h-6 text-xs" value={innerCasingRate} onChange={e => setInnerCasingRate(Number(e.target.value))} />,
                      qtyId: 'fb_en_q4',
                      qtyText: `${endCap === 'Yes' ? 1 : 0} No`,
                      qtyEl: <Input type="number" className="h-6 text-xs" value={endCap === 'Yes' ? 1 : 0} onChange={e => {}} />,
                      total: endCap === 'Yes' ? innerCasingRate : 0
                    }
                  ];
                  const activeItemsEn = itemsEn.filter(item => item.qty > 0);
                  const siteDisplayEn = currentSite?.nameOfSite || siteName || '';

                  return (
                    <div className="flex flex-col justify-between h-full flex-1 space-y-4">
                      <div className="space-y-4">
                        <div className="text-center space-y-1.5 pb-2 border-b-2 border-black">
                          <h2 className="text-2xl font-bold uppercase">GROUND WATER DEPARTMENT, DISTRICT OFFICE, {district}</h2>
                          <h3 className="text-xl font-bold underline">FINAL BILL FOR BOREWELL CONSTRUCTION</h3>
                        </div>

                        <div className="flex justify-between items-start text-base font-semibold py-1">
                          <div className="flex flex-col space-y-1">
                            <div>File No: <strong className="text-lg">{fileNo}</strong></div>
                            <div>Applicant: <strong className="text-lg">{applicantName}</strong></div>
                            {siteDisplayEn && (
                              <div>Name of Site: <strong className="text-lg">{siteDisplayEn}</strong></div>
                            )}
                          </div>
                          <div className="min-w-[180px] shrink-0">
                            {renderEditableCell(
                              'fb_en_reportDate',
                              <div className="text-right">Date : <strong className="text-lg">{reportDate}</strong></div>,
                              <Input className="h-6 text-xs w-32 ml-auto" placeholder="DD/MM/YYYY" value={reportDate} onChange={e => setReportDate(e.target.value)} />
                            )}
                          </div>
                        </div>

                        <table className="w-full border-collapse border border-black text-xs">
                          <thead>
                            <tr className="bg-gray-100 border-b border-black text-center font-bold">
                              <td className="border border-black py-2 w-12">Sl No</td>
                              <td className="border border-black py-2">Description of Item</td>
                              <td className="border border-black py-2 w-24">Rate (Rs)</td>
                              <td className="border border-black py-2 w-24">Qty / Unit</td>
                              <td className="border border-black py-2 w-32 text-right pr-2">Amount (Rs)</td>
                            </tr>
                          </thead>
                          <tbody>
                            {(() => {
                              const rowsEn = [];
                              activeItemsEn.forEach((item, idx) => {
                                rowsEn.push(
                                  <tr key={item.descId}>
                                    <td className="border border-black py-2 px-2.5 text-center">{idx + 1}</td>
                                    <td className="border border-black py-2 px-2.5">
                                      {renderEditableCell(item.descId, item.descValue, item.descEl)}
                                    </td>
                                    <td className="border border-black py-2 px-2.5 text-right font-mono">
                                      {renderEditableCell(item.rateId, item.rateValue, item.rateEl)}
                                    </td>
                                    <td className="border border-black py-2 px-2.5 text-center">
                                      {renderEditableCell(item.qtyId, item.qtyText, item.qtyEl)}
                                    </td>
                                    <td className="border border-black py-2 px-2.5 text-right font-mono">{item.total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                                  </tr>
                                );
                              });

                              rowsEn.push(
                                <tr key="total_exp_en" className="font-bold bg-gray-50">
                                  <td className="border border-black py-2 px-2.5 text-center">{rowsEn.length + 1}</td>
                                  <td className="border border-black py-2 px-2.5" colSpan={3}>Total Expenditure Incurred</td>
                                  <td className="border border-black py-2 px-2.5 text-right font-mono">{totalExpenditure.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                </tr>
                              );

                              if (isPrivateWork && (effectiveSubsidyAmount > 0 || isPrivateIrrigation || isFailedOrZeroYield)) {
                                rowsEn.push(
                                  <tr key="subsidy_en">
                                    <td className="border border-black py-2 px-2.5 text-center">{rowsEn.length + 1}</td>
                                    <td className="border border-black py-2 px-2.5" colSpan={3}>
                                      {renderEditableCell('fb_en_subsidy', 
                                        isFailedOrZeroYield
                                          ? 'Compensation for Failed Borewell (including subsidy)'
                                          : (isPrivateIrrigation 
                                              ? 'Subsidy for Marginal / Small Farmers - 50% of Drilling Charge (up to recommended depth of 120 meters)' 
                                              : 'Subsidy for Marginal / Small Farmers'), 
                                        <Input type="number" className="h-6 text-xs" value={effectiveSubsidyAmount} onChange={e => setSubsidyAmount(Number(e.target.value))} />
                                      )}
                                    </td>
                                    <td className="border border-black py-2 px-2.5 text-right font-mono">{effectiveSubsidyAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                  </tr>
                                );
                              }

                              const roundedPayableEn = Math.round(netPayableGwd);
                              const roundOffDiffEn = roundedPayableEn - netPayableGwd;

                              if (Math.abs(roundOffDiffEn) >= 0.005) {
                                rowsEn.push(
                                  <tr key="round_off_en">
                                    <td className="border border-black py-2 px-2.5 text-center">{rowsEn.length + 1}</td>
                                    <td className="border border-black py-2 px-2.5" colSpan={3}>Round off</td>
                                    <td className="border border-black py-2 px-2.5 text-right font-mono">
                                      {roundOffDiffEn >= 0 ? `+${roundOffDiffEn.toFixed(2)}` : roundOffDiffEn.toFixed(2)}
                                    </td>
                                  </tr>
                                );
                              }

                              rowsEn.push(
                                <tr key="net_payable_en" className="font-bold bg-gray-50">
                                  <td className="border border-black py-2 px-2.5 text-center">{rowsEn.length + 1}</td>
                                  <td className="border border-black py-2 px-2.5" colSpan={3}>Net Amount Payable to Ground Water Department</td>
                                  <td className="border border-black py-2 px-2.5 text-right font-mono">{roundedPayableEn.toLocaleString('en-IN')}</td>
                                </tr>
                              );

                              if (!isDepositWork && !hasMultipleSites) {
                                rowsEn.push(
                                  <tr key="advance_en">
                                    <td className="border border-black py-2 px-2.5 text-center">{rowsEn.length + 1}</td>
                                    <td className="border border-black py-2 px-2.5" colSpan={3}>
                                      {renderEditableCell('fb_en_advance', `Advance Deposit Paid by Applicant (${ddDetails})`, 
                                        <div className="flex gap-1">
                                          <Input type="number" className="h-6 text-xs" value={advanceDeposit} onChange={e => setAdvanceDeposit(Number(e.target.value))} />
                                          <Input className="h-6 text-xs" value={ddDetails} onChange={e => setDdDetails(e.target.value)} />
                                        </div>
                                      )}
                                    </td>
                                    <td className="border border-black py-2 px-2.5 text-right font-mono">{advanceDeposit.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                  </tr>
                                );

                                rowsEn.push(
                                  <tr key="balance_en" className="font-bold bg-gray-100">
                                    <td className="border border-black py-2 px-2.5 text-center">{rowsEn.length + 1}</td>
                                    <td className="border border-black py-2 px-2.5" colSpan={3}>
                                      {balanceRefund >= 0 ? 'Balance Refund Amount Due to Applicant' : 'Balance Deficit Amount Payable by Applicant'}
                                    </td>
                                    <td className="border border-black py-2 px-2.5 text-right font-mono">
                                      {Math.abs(balanceRefund).toLocaleString('en-IN')}
                                    </td>
                                  </tr>
                                );
                              }

                              return rowsEn;
                            })()}
                          </tbody>
                        </table>

                        {/* Signature Block after table (4 rows distance) */}
                        <div className="pt-16 pb-2 grid grid-cols-3 text-center font-bold text-xs sm:text-sm gap-4 signature-block">
                          <div>
                            <div className="h-10"></div>
                            Assistant Engineer
                          </div>
                          <div>
                            <div className="h-10"></div>
                            Assistant Executive Engineer
                          </div>
                          <div>
                            <div className="h-10"></div>
                            District Officer
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })()
              )}
            </div>
          )}

          {/* 3. ABSTRACT OF FINAL BILL (FOR MULTIPLE SITES) */}
          {docType === 'abstract_final_bill' && (
            <div className="space-y-4">
              {/* Selection provision for Remittance and Site details */}
              <div className="bg-amber-50/60 dark:bg-amber-950/20 border border-amber-300 dark:border-amber-800 rounded-lg p-3 space-y-2 text-xs mb-4 no-print">
                <div className="font-bold text-amber-900 dark:text-amber-200 flex items-center justify-between">
                  <span>📋 Select Entries for Abstract of Final Bill</span>
                  <span className="text-[11px] font-normal text-muted-foreground">Check/uncheck entries to include or exclude from table</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {/* 2. Remittance Details Selection */}
                  <div className="space-y-1.5 bg-background p-2.5 rounded border">
                    <div className="font-semibold text-xs border-b pb-1 flex items-center justify-between text-primary">
                      <span>2. Remittance Details</span>
                      <span className="text-[10px] text-muted-foreground font-normal">({selectedRemittanceIndices.length}/{allRemittances.length} included)</span>
                    </div>
                    <div className="space-y-1 max-h-36 overflow-y-auto pt-1">
                      {allRemittances.map((rem, rIdx) => {
                        const isChecked = selectedRemittanceIndices.includes(rIdx);
                        const rAmt = Number(rem.amountRemitted) || Number((rem as any).remittanceAmount) || 0;
                        const rDate = rem.dateOfRemittance ? formatDateDDMMYYYY(rem.dateOfRemittance) : '';
                        const rRemarks = rem.remittanceRemarks || (rem as any).ddNo || '';
                        const label = `Remittance #${rIdx + 1}: ₹${rAmt.toLocaleString('en-IN')} ${rRemarks ? '(DD: ' + rRemarks + ')' : ''} ${rDate ? 'Dated ' + rDate : ''}`;
                        return (
                          <label key={rIdx} className="flex items-center gap-2 text-[11px] hover:bg-muted/60 p-1 rounded cursor-pointer select-none">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedRemittanceIndices(prev => [...prev, rIdx].sort((a,b) => a - b));
                                } else {
                                  setSelectedRemittanceIndices(prev => prev.filter(i => i !== rIdx));
                                }
                              }}
                              className="rounded border-gray-300 text-primary focus:ring-primary h-3.5 w-3.5"
                            />
                            <span className="truncate">{label}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>

                  {/* 3. Site Details Selection */}
                  <div className="space-y-1.5 bg-background p-2.5 rounded border">
                    <div className="font-semibold text-xs border-b pb-1 flex items-center justify-between text-primary">
                      <span>3. Site Details</span>
                      <span className="text-[10px] text-muted-foreground font-normal">({selectedSiteIndices.length}/{sites.length} included)</span>
                    </div>
                    <div className="space-y-1 max-h-36 overflow-y-auto pt-1">
                      {sites.map((st, sIdx) => {
                        const isChecked = selectedSiteIndices.includes(sIdx);
                        const stName = st.nameOfSite || `Site #${sIdx + 1}`;
                        const stLoc = st.surveyLocation || st.localSelfGovt || '';
                        const label = `Site #${sIdx + 1}: ${stName} ${stLoc ? '(' + stLoc + ')' : ''}`;
                        return (
                          <label key={sIdx} className="flex items-center gap-2 text-[11px] hover:bg-muted/60 p-1 rounded cursor-pointer select-none">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedSiteIndices(prev => [...prev, sIdx].sort((a,b) => a - b));
                                } else {
                                  setSelectedSiteIndices(prev => prev.filter(i => i !== sIdx));
                                }
                              }}
                              className="rounded border-gray-300 text-primary focus:ring-primary h-3.5 w-3.5"
                            />
                            <span className="truncate">{label}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>

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
                        <td className="border border-black py-1.5 w-12">ക്രമ നമ്പർ</td>
                        <td className="border border-black py-1.5">വിവരങ്ങൾ</td>
                        <td className="border border-black py-1.5 w-36 text-right pr-2">തുക (രൂപ)</td>
                      </tr>
                    </thead>
                    <tbody>
                      {/* Site Rows Only */}
                      {abstractSiteRows.map((row, idx) => {
                        return (
                          <tr key={`site_ml_${idx}`} id={`abs_ml_site_row_${idx}`}>
                            <td className="border border-black p-1.5 text-center">{idx + 1}</td>
                            <td className="border border-black p-1.5">
                              {renderEditableCell(`abs_ml_site_desc_${idx}`,
                                <strong>{row.descMl}</strong>,
                                <Input className="h-6 text-xs" value={row.descMl} onChange={e => {
                                  row.descMl = e.target.value;
                                }} />
                              )}
                            </td>
                            <td className="border border-black p-1.5 text-right font-mono">
                              {renderEditableCell(`abs_ml_site_amt_${idx}`,
                                row.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 }),
                                <Input type="number" className="h-6 text-xs" value={row.amount} onChange={e => {
                                  row.amount = Number(e.target.value);
                                }} />
                              )}
                            </td>
                          </tr>
                        );
                      })}

                      {/* Grand Total Row */}
                      <tr className="font-bold bg-gray-100" id="abs_ml_bal_row">
                        <td className="border border-black p-1.5 text-center">
                          {abstractSiteRows.length + 1}
                        </td>
                        <td className="border border-black p-1.5 font-bold">
                          Grand Total
                        </td>
                        <td className="border border-black p-1.5 text-right font-mono font-bold">
                          {totalPaymentAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </td>
                      </tr>
                    </tbody>
                  </table>

                  {!isDepositWork && (
                    <p className="text-xs font-semibold pt-2">
                      അടയ്ക്കേണ്ട / തിരികെ നൽകേണ്ട ആകെ ബാലൻസ് തുക അക്ഷരത്തിൽ: <span className="underline">{numberToWordsMalayalam(Math.abs(abstractBalanceAmount))}</span>
                    </p>
                  )}

                  <div className="pt-8 text-right">
                    <p className="font-bold">ജില്ലാ ഓഫീസർ</p>
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
                        <td className="border border-black py-1.5 w-12">Sl No</td>
                        <td className="border border-black py-1.5">Description</td>
                        <td className="border border-black py-1.5 w-36 text-right pr-2">Amount (Rs)</td>
                      </tr>
                    </thead>
                    <tbody>
                      {/* Site Rows Only */}
                      {abstractSiteRows.map((row, idx) => {
                        return (
                          <tr key={`site_en_${idx}`} id={`abs_en_site_row_${idx}`}>
                            <td className="border border-black p-1.5 text-center">{idx + 1}</td>
                            <td className="border border-black p-1.5">
                              {renderEditableCell(`abs_en_site_desc_${idx}`,
                                <strong>{row.descEn}</strong>,
                                <Input className="h-6 text-xs" value={row.descEn} onChange={e => {
                                  row.descEn = e.target.value;
                                }} />
                              )}
                            </td>
                            <td className="border border-black p-1.5 text-right font-mono">
                              {renderEditableCell(`abs_en_site_amt_${idx}`,
                                row.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 }),
                                <Input type="number" className="h-6 text-xs" value={row.amount} onChange={e => {
                                  row.amount = Number(e.target.value);
                                }} />
                              )}
                            </td>
                          </tr>
                        );
                      })}

                      {/* Grand Total Row */}
                      <tr className="font-bold bg-gray-100" id="abs_en_bal_row">
                        <td className="border border-black p-1.5 text-center">
                          {abstractSiteRows.length + 1}
                        </td>
                        <td className="border border-black p-1.5 font-bold">
                          Grand Total
                        </td>
                        <td className="border border-black p-1.5 text-right font-mono font-bold">
                          {totalPaymentAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </td>
                      </tr>
                    </tbody>
                  </table>

                  {!isDepositWork && (
                    <p className="text-xs font-semibold pt-2">
                      Net Balance Amount in Words: <span className="underline">{numberToWordsEnglish(Math.abs(abstractBalanceAmount))}</span>
                    </p>
                  )}

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
            <div className="flex flex-col justify-between min-h-[255mm] space-y-4 text-[11pt] leading-[1.5]">
              <style>{`
                @page {
                  size: A4 portrait;
                  margin: ${getPageMarginsCss(printSettings)} !important;
                }
              `}</style>
              <div className="space-y-4">
                <div className="text-center space-y-1 pb-2 border-b-2 border-black">
                  <h2 className="text-[12pt] font-bold uppercase tracking-wider">
                    PROCEEDINGS OF THE DISTRICT OFFICER, GROUND WATER DEPARTMENT, {district.toUpperCase()}
                  </h2>
                  {renderEditableCell('proc_officer', 
                    <p className="text-[11pt] italic font-semibold text-center">Present: {officerName}, {officerDesignation}</p>,
                    <div className="flex gap-1">
                      <Input className="h-6 text-[11pt]" value={officerName} onChange={e => setOfficerName(e.target.value)} />
                      <Input className="h-6 text-[11pt]" value={officerDesignation} onChange={e => setOfficerDesignation(e.target.value)} />
                    </div>
                  )}
                </div>

                <div className="text-[11pt] space-y-3 py-2 leading-[1.5]">
                  <div className="grid grid-cols-[60px_1fr] gap-1 items-start">
                    <span className="font-bold">Sub:</span>
                    {renderEditableCell('proc_sub', <span>{proceedingsSubject}</span>, <Textarea className="min-h-[45px] text-[11pt]" value={proceedingsSubject} onChange={e => setProceedingsSubject(e.target.value)} />)}
                  </div>
                  <div className="grid grid-cols-[60px_1fr] gap-1 items-start">
                    <span className="font-bold">Ref:</span>
                    {renderEditableCell('proc_ref', 
                      <div>
                        {formatDatesInText(proceedingsRef1)}<br />
                        {formatDatesInText(proceedingsRef2)}
                      </div>,
                      <div className="space-y-1">
                        <Input className="h-6 text-[11pt]" value={proceedingsRef1} onChange={e => setProceedingsRef1(e.target.value)} />
                        <Input className="h-6 text-[11pt]" value={proceedingsRef2} onChange={e => setProceedingsRef2(e.target.value)} />
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex justify-between font-bold border-y border-black py-1 text-[11pt]">
                  {renderEditableCell('proc_ordNo', <span>Order No. {orderNo}</span>, <Input className="h-6 text-[11pt] w-48" value={orderNo} onChange={e => setOrderNo(e.target.value)} />)}
                  {renderEditableCell('proc_ordDate', <div className="text-right w-full">Date: {orderDate}</div>, <Input className="h-6 text-[11pt] w-36 ml-auto text-right" value={orderDate} onChange={e => setOrderDate(e.target.value)} />)}
                </div>

                <div className="text-[11pt] space-y-4 leading-[1.5] text-justify pt-2">
                  <div className="p-1 rounded hover:bg-slate-50 transition-colors">
                    {renderEditableCell('proc_para1',
                      <span>
                        As per the 1st reference cited above, <strong>{applicantName}</strong> deposited an amount of <strong>Rs. {advanceDeposit.toLocaleString('en-IN')}/-</strong> vide DD ({formatDatesInText(ddDetails)}) for the construction of a borewell at their premises.
                      </span>,
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <div>
                          <label className="text-[10px] font-semibold text-gray-600 dark:text-gray-300 block mb-0.5">Advance Deposit Amount (₹):</label>
                          <Input type="number" className="h-7 text-xs" value={advanceDeposit} onChange={e => setAdvanceDeposit(Number(e.target.value))} />
                        </div>
                        <div>
                          <label className="text-[10px] font-semibold text-gray-600 dark:text-gray-300 block mb-0.5">DD / Remittance Details:</label>
                          <Input className="h-7 text-xs" value={ddDetails} onChange={e => setDdDetails(e.target.value)} />
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="p-1 rounded hover:bg-slate-50 transition-colors">
                    {renderEditableCell('proc_para2',
                      <span>
                        Vide the 2nd reference cited, it has been reported that the work was completed using the Department&apos;s Rig unit. The total expenditure incurred by the department is <strong>Rs. {procNetPayable.toLocaleString('en-IN')}/-</strong>, which is to be remitted to the Department&apos;s revenue head <code>0702-02-800-99</code>, &quot;Other Receipts&quot;. The balance amount of <strong>Rs. {procBalanceRefund.toLocaleString('en-IN')}/-</strong> is to be refunded to the applicant.
                      </span>,
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <div>
                          <label className="text-[10px] font-semibold text-gray-600 dark:text-gray-300 block mb-0.5">Net Department Expenditure (₹):</label>
                          <Input type="number" placeholder="Net Expenditure" className="h-7 text-xs" value={procNetPayable} onChange={e => setDrillingRate(Number(e.target.value))} />
                        </div>
                        <div>
                          <label className="text-[10px] font-semibold text-gray-600 dark:text-gray-300 block mb-0.5">Balance Refund Amount (₹):</label>
                          <Input type="number" placeholder="Refund Amount" className="h-7 text-xs" value={procBalanceRefund} onChange={e => setAdvanceDeposit(Number(e.target.value))} />
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="p-1 rounded hover:bg-slate-50 transition-colors">
                    {renderEditableCell('proc_para3',
                      <span>
                        In these circumstances, sanction is hereby accorded to refund an amount of <strong>Rs. {procBalanceRefund.toLocaleString('en-IN')}/- ({numberToWordsEnglish(procBalanceRefund)})</strong> being the balance amount due to applicant in connection with the borewell construction, to their <strong>Bank Account No. {bankAccountNo || '85829024542'}, IFSC: {bankIfsc || 'SBIN0012880'} of {bankName === 'SBI' ? 'State Bank of India' : (bankName || 'State Bank of India')}{bankBranch ? `, ${bankBranch} branch` : ''}</strong>. Sanction is also hereby accorded to remit an amount of <strong>Rs. {procNetPayable.toLocaleString('en-IN')}/- ({numberToWordsEnglish(procNetPayable)})</strong> to Department Revenue head <code>0702-02-800-99-other receipts</code>, being the Borewell construction charges.
                      </span>,
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        <div>
                          <label className="text-[10px] font-semibold text-gray-600 dark:text-gray-300 block mb-0.5">Bank Account No:</label>
                          <Input className="h-7 text-xs" placeholder="Account No" value={bankAccountNo} onChange={e => setBankAccountNo(e.target.value)} />
                        </div>
                        <div>
                          <label className="text-[10px] font-semibold text-gray-600 dark:text-gray-300 block mb-0.5">IFSC Code:</label>
                          <Input className="h-7 text-xs" placeholder="IFSC" value={bankIfsc} onChange={e => setBankIfsc(e.target.value)} />
                        </div>
                        <div>
                          <label className="text-[10px] font-semibold text-gray-600 dark:text-gray-300 block mb-0.5">Bank Name:</label>
                          <Input className="h-7 text-xs" placeholder="Bank Name" value={bankName} onChange={e => setBankName(e.target.value)} />
                        </div>
                        <div>
                          <label className="text-[10px] font-semibold text-gray-600 dark:text-gray-300 block mb-0.5">Branch:</label>
                          <Input className="h-7 text-xs" placeholder="Branch" value={bankBranch} onChange={e => setBankBranch(e.target.value)} />
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="p-1 rounded hover:bg-slate-50 transition-colors">
                    {renderEditableCell('proc_para5',
                      <span>
                        The expenditure shall be met from the gross amount of Rs. {advanceDeposit.toLocaleString('en-IN')}/- deposited by the applicant {officeAddress?.stsbAccountNo ? `into STSB Account No. ${officeAddress.stsbAccountNo}` : 'into STSB Account'} of the District Officer, Ground Water Department, {district}{officeAddress?.nameOfTreasury ? ` at Treasury ${officeAddress.nameOfTreasury}` : ''}.
                      </span>,
                      <Input type="number" className="h-6 text-[11pt] w-48" placeholder="STSB Deposit" value={advanceDeposit} onChange={e => setAdvanceDeposit(Number(e.target.value))} />
                    )}
                  </div>
                </div>
              </div>

              <div className="pt-10 flex justify-between items-end text-[11pt] leading-[1.5]">
                <div>
                  <p className="font-bold">Copy to:</p>
                  <p>1. File</p>
                  <p>2. Stock File / Office Copy</p>
                </div>
                <div className="text-right">
                  <p className="font-bold">District Officer</p>
                </div>
              </div>
            </div>
          )}

          {/* 5. UTILIZATION CERTIFICATE (FOR DEPOSIT WORKS) */}
          {docType === 'utilization_certificate' && (
            <div className="space-y-4">
              {/* Selection provision for Remittance and Site details */}
              <div className="bg-amber-50/60 dark:bg-amber-950/20 border border-amber-300 dark:border-amber-800 rounded-lg p-3 space-y-2 text-xs mb-4 no-print">
                <div className="font-bold text-amber-900 dark:text-amber-200 flex items-center justify-between">
                  <span>📋 Select Entries for Utilization Certificate</span>
                  <span className="text-[11px] font-normal text-muted-foreground">Check/uncheck entries to include or exclude from table</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {/* 2. Remittance Details Selection */}
                  <div className="space-y-1.5 bg-background p-2.5 rounded border">
                    <div className="font-semibold text-xs border-b pb-1 flex items-center justify-between text-primary">
                      <span>2. Remittance Details</span>
                      <span className="text-[10px] text-muted-foreground font-normal">({selectedRemittanceIndices.length}/{allRemittances.length} included)</span>
                    </div>
                    <div className="space-y-1 max-h-36 overflow-y-auto pt-1">
                      {allRemittances.map((rem, rIdx) => {
                        const isChecked = selectedRemittanceIndices.includes(rIdx);
                        const rAmt = Number(rem.amountRemitted) || Number((rem as any).remittanceAmount) || 0;
                        const rDate = rem.dateOfRemittance ? formatDateDDMMYYYY(rem.dateOfRemittance) : '';
                        const rRemarks = rem.remittanceRemarks || (rem as any).ddNo || '';
                        const label = `Remittance #${rIdx + 1}: ₹${rAmt.toLocaleString('en-IN')} ${rRemarks ? '(DD: ' + rRemarks + ')' : ''} ${rDate ? 'Dated ' + rDate : ''}`;
                        return (
                          <label key={rIdx} className="flex items-center gap-2 text-[11px] hover:bg-muted/60 p-1 rounded cursor-pointer select-none">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedRemittanceIndices(prev => [...prev, rIdx].sort((a,b) => a - b));
                                } else {
                                  setSelectedRemittanceIndices(prev => prev.filter(i => i !== rIdx));
                                }
                              }}
                              className="rounded border-gray-300 text-primary focus:ring-primary h-3.5 w-3.5"
                            />
                            <span className="truncate">{label}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>

                  {/* 3. Site Details Selection */}
                  <div className="space-y-1.5 bg-background p-2.5 rounded border">
                    <div className="font-semibold text-xs border-b pb-1 flex items-center justify-between text-primary">
                      <span>3. Site Details</span>
                      <span className="text-[10px] text-muted-foreground font-normal">({selectedSiteIndices.length}/{sites.length} included)</span>
                    </div>
                    <div className="space-y-1 max-h-36 overflow-y-auto pt-1">
                      {sites.map((st, sIdx) => {
                        const isChecked = selectedSiteIndices.includes(sIdx);
                        const stName = st.nameOfSite || `Site #${sIdx + 1}`;
                        const stLoc = st.surveyLocation || st.localSelfGovt || '';
                        const label = `Site #${sIdx + 1}: ${stName} ${stLoc ? '(' + stLoc + ')' : ''}`;
                        return (
                          <label key={sIdx} className="flex items-center gap-2 text-[11px] hover:bg-muted/60 p-1 rounded cursor-pointer select-none">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedSiteIndices(prev => [...prev, sIdx].sort((a,b) => a - b));
                                } else {
                                  setSelectedSiteIndices(prev => prev.filter(i => i !== sIdx));
                                }
                              }}
                              className="rounded border-gray-300 text-primary focus:ring-primary h-3.5 w-3.5"
                            />
                            <span className="truncate">{label}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>

              {lang === 'ml' ? (
                <div className="flex flex-col space-y-4 text-[10pt] leading-[0.75cm]" style={{ lineHeight: '0.75cm' }}>
                  <style>{`
                    @page {
                      size: A4 portrait;
                      margin: ${getPageMarginsCss(printSettings)} !important;
                    }
                  `}</style>
                  <div className="flex justify-between items-start text-[10pt] pt-1 pb-3">
                    <div>
                      {renderEditableCell('uc_ml_refNo', 
                        <span>ഫയൽ നമ്പർ: <span>{fileNo.includes('/') && !fileNo.toUpperCase().startsWith('GWD') ? `${officeAddress?.officeCode || 'GWDKLM'}/${fileNo}` : fileNo}</span></span>, 
                        <Input className="h-6 text-xs w-48" value={fileNo} onChange={e => setFileNo(e.target.value)} />
                      )}
                    </div>

                    <div className="text-right text-[10pt] space-y-0.5">
                      {officeAddress?.addressMalayalam ? (
                        <div className="whitespace-pre-line text-right">
                          {(() => {
                            let addr = officeAddress.addressMalayalam;
                            // Clean split lines for Department and Office Name
                            addr = addr.replace(/ഭൂജലവകുപ്പ്\s*[\r\n]+\s*ജില്ലា\s*ഓഫീസ്/g, 'ഭൂജലവകുപ്പ് ജില്ലാ ഓഫീസ്');
                            addr = addr.replace(/ഭൂജലവകുപ്പ്\s*\n\s*ജില്ലា\s*ഓഫീസ്/g, 'ഭൂജലവകുപ്പ് ജില്ലാ ഓഫീസ്');
                            
                            // Check if office is Kollam to intelligently format the exact required address line
                            if (districtMl === 'കൊല്ലം' || districtMl?.includes('കൊല്ലം') || officeAddress?.officeLocation?.toLowerCase() === 'kollam') {
                              if (!addr.includes('ഹൈസ്കൂൾ') && !addr.includes('High School')) {
                                if (addr.includes('ഭൂജലവകുപ്പ് ജില്ലാ ഓഫീസ്')) {
                                  addr = addr.replace('ഭൂജലവകുപ്പ് ജില്ലാ ഓഫീസ്', "ഭൂജലവകുപ്പ് ജില്ലാ ഓഫീസ്\nഹൈസ്കൂൾ ജംഗ്ഷൻ തേവള്ളി പി. ഓ.");
                                } else {
                                  addr = addr + "\nഭൂജലവകുപ്പ് ജില്ലാ ഓഫീസ്\nഹൈസ്കൂൾ ജംഗ്ഷൻ തേവള്ളി പി. ഓ.";
                                }
                              } else {
                                addr = addr.replace(/ഭൂജലവകുപ്പ്\s*ജില്ലാ\s*ഓഫീസ്\s*[\r\n]+\s*ഹൈസ്കൂൾ\s*ജംഗ്ഷൻ\s*തേവള്ളി\s*പി\.\s*ഓ\./g, "ഭൂജലവകുപ്പ് ജില്ലാ ഓഫീസ്\nഹൈസ്കൂൾ ജംഗ്ഷൻ തേവള്ളി പി. ഓ.");
                                addr = addr.replace(/ഭൂജലവകുപ്പ്\s*ജില്ലാ\s*ഓഫീസ്\s*\n\s*ഹൈസ്കൂൾ\s*ജംഗ്ഷൻ\s*തേവള്ളി\s*പി\.\s*ഓ\./g, "ഭൂജലവകുപ്പ് ജില്ലാ ഓഫീസ്\nഹൈസ്കൂൾ ജംഗ്ഷൻ തേവള്ളി പി. ഓ.");
                                addr = addr.replace(/ഹൈസ്കൂൾ\s*ജംഗ്ഷൻ\s*[\r\n]+\s*തേവള്ളി\s*പി\.\s*ഓ\./g, "ഹൈസ്കൂൾ ജംഗ്ഷൻ തേവള്ളി പി. ഓ.");
                                addr = addr.replace(/ഹൈസ്കൂൾ\s*ജംഗ്ഷൻ\s*\n\s*തേവള്ളി\s*പി\.\s*ഓ\./g, "ഹൈസ്കൂൾ ജംഗ്ഷൻ തേവള്ളി പി. ഓ.");
                                // If they are on separate lines, join them with a newline
                                addr = addr.replace(/ഭൂജലവകുപ്പ്\s*ജില്ലാ\s*ഓഫീസ്\s*[\r\n]+\s*/g, "ഭൂജലവകുപ്പ് ജില്ലാ ഓഫീസ്\n");
                                addr = addr.replace(/ഭൂജലവകുപ്പ്\s*ജില്ലാ\s*ഓഫീസ്\s*\n\s*/g, "ഭൂജലവകുപ്പ് ജില്ലാ ഓഫീസ്\n");
                              }
                              
                              if (!addr.includes('691009')) {
                                addr = addr + '\nകൊല്ലം - 691009';
                              }
                            }
                            return addr;
                          })()}
                        </div>
                      ) : (
                        <>
                          <p>ജില്ലാ ഓഫീസറുടെ കാര്യാലയം</p>
                          <p>ഭൂജലവകുപ്പ് ജില്ലാ ഓഫീസ്</p>
                          <p>ഹൈസ്കൂൾ ജംഗ്ഷൻ തേവള്ളി പി. ഓ.</p>
                          <p>കൊല്ലം - 691009</p>
                        </>
                      )}
                      {renderEditableCell('uc_ml_contact', 
                        <div className="text-right">
                          <p>ഫോൺ: {ucPhone}</p>
                          <p>ഇ-മെയിൽ: {ucEmail}</p>
                        </div>,
                        <div className="flex flex-col gap-1 items-end">
                          <Input className="h-6 text-xs w-36 text-right" value={ucPhone} onChange={e => setUcPhone(e.target.value)} />
                          <Input className="h-6 text-xs w-48 text-right" value={ucEmail} onChange={e => setUcEmail(e.target.value)} />
                        </div>
                      )}
                      {renderEditableCell('uc_ml_date', <p className="pt-0.5">തീയതി: <span>{orderDate}</span></p>, <Input className="h-6 text-xs w-36 text-right" value={orderDate} onChange={e => setOrderDate(e.target.value)} />)}
                    </div>
                  </div>

                  <div className="text-[10pt] space-y-3 py-1">
                    <div>
                      <p className="">പ്രേഷിതൻ</p>
                      {renderEditableCell('uc_ml_from', 
                        <div className="pl-8 whitespace-pre-line">{ucFrom || 'ജില്ലാ ഓഫീസർ'}</div>, 
                        <Textarea className="min-h-[40px] text-xs p-1" value={ucFrom} onChange={e => setUcFrom(e.target.value)} />
                      )}
                    </div>

                    <div>
                      <p className="">സ്വീകർത്താവ്</p>
                      {renderEditableCell('uc_ml_to', 
                        <div className="pl-8 whitespace-pre-line">
                          {ucTo || `അസിസ്റ്റന്റ് എൻജിനീയർ\n${localSelfGovt || 'ഗ്രാമപഞ്ചായത്ത്'}`}
                        </div>, 
                        <Textarea className="min-h-[50px] text-xs p-1" value={ucTo} onChange={e => setUcTo(e.target.value)} />
                      )}
                    </div>
                  </div>

                  <div className="text-[10pt] space-y-2 py-1">
                    {renderEditableCell('uc_ml_sub', 
                      <div className="flex items-start">
                        <span className="shrink-0 font-bold w-[2cm]">വിഷയം:</span>
                        <span className="flex-grow">{ucSubject}</span>
                      </div>, 
                      <Textarea className="min-h-[40px] text-xs p-1" value={ucSubject} onChange={e => setUcSubject(e.target.value)} />
                    )}
                    {renderEditableCell('uc_ml_refs', 
                      <div className="flex items-start">
                        <span className="shrink-0 font-bold w-[2cm]">സൂചന:</span>
                        <div className="flex-grow space-y-0.5">
                          <p>1. {(ucRef1 || '').replace(/^[0-9]+\.\s*/, '')}</p>
                          <p>2. {(ucRef2 || '').replace(/^[0-9]+\.\s*/, '')}</p>
                        </div>
                      </div>,
                      <div className="space-y-1">
                        <Input className="h-6 text-xs" value={ucRef1} onChange={e => setUcRef1(e.target.value)} />
                        <Input className="h-6 text-xs" value={ucRef2} onChange={e => setUcRef2(e.target.value)} />
                      </div>
                    )}
                  </div>

                  {/* Covering Letter Paragraph */}
                  <div className="text-[10pt] space-y-2 text-justify leading-[0.75cm] py-2" style={{ lineHeight: '0.75cm' }}>
                    {(() => {
                      const lsg = localSelfGovt || currentSite?.localSelfGovt || 'പഞ്ചായത്ത്';
                      const lsgFull = lsg.includes('പഞ്ചായത്ത്') || lsg.toLowerCase().includes('panchayat') 
                        ? (lsg.endsWith('ലെ') ? lsg : `${lsg}യിലെ`)
                        : `${lsg} ഗ്രാമപഞ്ചായത്തിലെ`;

                      const activeSites = ucSelectedSites.length > 0 ? ucSelectedSites : sites.map(s => ({ siteName: s.nameOfSite || 'സൈറ്റ്', depth: parseNum(s.totalDepth) || 0, yield: parseNum(s.yieldDischarge) || 0, totalExpenditure: 0 }));
                      const siteNamesStr = activeSites.length > 1
                        ? `${activeSites.map(s => s.siteName).join(', ')} എന്നീ സ്ഥലങ്ങളിൽ`
                        : (activeSites[0]?.siteName ? `${activeSites[0].siteName} എന്ന സ്ഥലത്ത്` : 'നിശ്ചിത സ്ഥലത്ത്');

                      const siteCount = activeSites.length || 1;

                      const remittancePart = siteCount > 1
                        ? `യഥാക്രമം ${activeSites.map((_, sIdx) => {
                            const amt = abstractRemittanceRows[sIdx]?.amount ?? (totalRemittanceAmount / siteCount);
                            return `${Math.round(amt).toLocaleString('en-IN')}/- രൂപ`;
                          }).join(', ')} അടക്കം ആകെ ${Math.round(totalRemittanceAmount).toLocaleString('en-IN')}/- രൂപ`
                        : `ആകെ ${Math.round(totalRemittanceAmount).toLocaleString('en-IN')}/- രൂപ`;

                      const siteYieldsPart = activeSites.map(s => 
                        `${s.siteName} കുഴൽകിണറിന് ${s.depth} മീറ്റർ ആഴവും ${s.yield ? `മണിക്കൂറിൽ ${s.yield} ലിറ്റർ ജലലഭ്യതയും` : ''} ഉണ്ട്.`
                      ).join(' ');

                      const expenditurePart = siteCount > 1
                        ? `യഥാക്രമം ${activeSites.map(s => `${Math.round(s.totalExpenditure).toLocaleString('en-IN')}/- രൂപ`).join(', ')} അടക്കം ആകെ ${Math.round(ucTotalSelectedExpenditure).toLocaleString('en-IN')}/- രൂപ`
                        : `ആകെ ${Math.round(ucTotalSelectedExpenditure).toLocaleString('en-IN')}/- രൂപ`;

                      const refundWords = numberToWordsMalayalam(Math.abs(ucBalanceRefund));

                      const defaultCoverText = `മേൽ സൂചന (1) പ്രകാരം, ${lsgFull} ${siteNamesStr} കുടിവെള്ള പദ്ധതികൾ നടപ്പിലാക്കുന്നതിന്റെ ഭാഗമായി കുഴൽകിണർ നിർമ്മാണവുമായി ബന്ധപ്പെട്ട് 2024 - 25 സാമ്പത്തിക വർഷത്തിൽ ${remittancePart} അടവാക്കിയിട്ടുണ്ട്. സൂചന (2) പ്രകാരം, ടി കുഴൽകിണർ നിർമ്മാണ പ്രവൃത്തികൾ ഡിപ്പാർട്ട്മെന്റ് റിഗ്ഗ് മുഖേന തൃപ്തികരമായി പൂർത്തീകരിച്ചിട്ടുണ്ട്. ${siteYieldsPart} ടി കുഴൽകിണർ നിർമ്മാണങ്ങൾക്ക് ${expenditurePart} ചിലവായിട്ടുണ്ട്. ബാലൻസ് തുകയായ ${Math.round(Math.abs(ucBalanceRefund)).toLocaleString('en-IN')}/- രൂപ (${refundWords}) പഞ്ചായത്തിന് തിരികെ നൽകുന്നതിന് വേണ്ടി ബാങ്ക് അക്കൗണ്ട് വിവരങ്ങൾ ഈ ഓഫീസിൽ ലഭ്യമാക്കണമെന്ന് താത്പര്യപ്പെടുന്നു.`;

                      return renderEditableCell('uc_ml_cover_letter',
                        <p className="whitespace-pre-line">{ucMlPara1 || defaultCoverText}</p>,
                        <Textarea className="min-h-[100px] text-xs p-1" value={ucMlPara1 || defaultCoverText} onChange={e => setUcMlPara1(e.target.value)} />
                      );
                    })()}
                  </div>

                  <div className="pt-2">
                    <h4 className="text-center font-bold text-[10pt] underline mb-2">ധനവിനിയോഗ സാക്ഷ്യപത്രം (UTILIZATION CERTIFICATE)</h4>
                    
                    {/* Paragraph after UTILIZATION CERTIFICATE heading */}
                    <div className="text-[10pt] space-y-2 text-justify leading-[0.75cm] pb-2" style={{ lineHeight: '0.75cm' }}>
                      {(() => {
                        const lsg = localSelfGovt || currentSite?.localSelfGovt || 'പഞ്ചായത്ത്';
                        const lsgFull = lsg.includes('പഞ്ചായത്ത്') || lsg.toLowerCase().includes('panchayat') 
                          ? (lsg.endsWith('ലെ') ? lsg : `${lsg}യിലെ`)
                          : `${lsg} ഗ്രാമപഞ്ചായത്തിലെ`;

                        const activeSites = ucSelectedSites.length > 0 ? ucSelectedSites : sites.map(s => ({ siteName: s.nameOfSite || 'സൈറ്റ്' }));
                        const siteNamesStr = activeSites.length > 1
                          ? `${activeSites.map(s => s.siteName).join(', ')} എന്നീ സ്ഥലങ്ങളിൽ`
                          : (activeSites[0]?.siteName ? `${activeSites[0].siteName} എന്ന സ്ഥലത്ത്` : 'നിശ്ചിത സ്ഥലത്ത്');

                        const defaultCertText = `${lsgFull} ${siteNamesStr} കുടിവെള്ള പദ്ധതികൾ നടപ്പിലാക്കുന്നതിന്റെ ഭാഗമായി കുഴൽകിണർ നിർമ്മാണവുമായി ബന്ധപ്പെട്ട് 2024 - 25 സാമ്പത്തിക വർഷത്തിൽ ആകെ ${Math.round(totalRemittanceAmount).toLocaleString('en-IN')}/- അടവാക്കിയിട്ടുണ്ടെന്നും ടി പ്രവൃത്തികൾ തൃപ്തികരമായി പൂർത്തീകരിച്ച് ആകെ ${Math.round(ucTotalSelectedExpenditure).toLocaleString('en-IN')}/- രൂപ ചിലവായിട്ടുണ്ടെന്നും ഇതിനാൽ സാക്ഷ്യപ്പെടുത്തുന്നു.`;

                        return renderEditableCell('uc_ml_cert_para',
                          <p className="whitespace-pre-line">{ucMlPara2 || defaultCertText}</p>,
                          <Textarea className="min-h-[90px] text-xs p-1.5" value={ucMlPara2 || defaultCertText} onChange={e => setUcMlPara2(e.target.value)} />
                        );
                      })()}
                    </div>

                    <table className="w-full border-collapse border border-black text-[10pt]">
                      <thead>
                        <tr className="bg-gray-100 border-b border-black text-center font-bold">
                          <td className="border border-black p-1.5 w-12">ക്രമ നമ്പർ</td>
                          <td className="border border-black p-1.5">വിവരണങ്ങൾ</td>
                          <td className="border border-black p-1.5 w-32 text-right pr-2">തുക (രൂപ)</td>
                          <td className="border border-black p-1.5 w-36 text-right pr-2">ആകെ തുക (രൂപ)</td>
                        </tr>
                      </thead>
                      <tbody>
                        {/* Row 1: Deposit */}
                        <tr>
                          <td className="border border-black p-1.5 text-center">1</td>
                          <td className="border border-black p-1.5 font-bold" colSpan={3}>
                            {renderEditableCell('uc_ml_tbl_dep_title',
                              <span>കുഴൽകിണർ നിർമ്മാണ പ്രവൃത്തികൾക്ക് വേണ്ടി പഞ്ചായത്ത് അടവാക്കിയ തുക</span>,
                              <Input className="h-7 text-xs font-semibold" value={localSelfGovt} onChange={e => setLocalSelfGovt(e.target.value)} />
                            )}
                          </td>
                        </tr>
                        {ucSelectedSites.map((sf, sIdx) => {
                          const subLetter = String.fromCharCode(97 + sIdx);
                          const siteDeposit = abstractRemittanceRows[sIdx]?.amount ?? (totalRemittanceAmount / (ucSelectedSites.length || 1));
                          const remIdx = selectedRemittanceIndices[sIdx] ?? selectedRemittanceIndices[0] ?? 0;
                          const matchingRem = allRemittances[remIdx];
                          const remDate = matchingRem?.dateOfRemittance ? formatDateDDMMYYYY(matchingRem.dateOfRemittance) : '12/11/2024';
                          const displayDesc = `പ്രവൃത്തിയിനത്തിൽ ${remDate}-ന് അടച്ച തുക`;
                          return (
                            <tr key={`dep_${sIdx}`}>
                              <td className="border border-black p-1.5 text-center">{subLetter}.</td>
                              <td className="border border-black p-1.5 pl-6">
                                {renderEditableCell(`uc_ml_dep_row_${sIdx}`,
                                  <span>{displayDesc}</span>,
                                  <Input className="h-7 text-xs" value={displayDesc} readOnly />
                                )}
                              </td>
                              <td className="border border-black p-1.5 text-right font-mono">
                                {renderEditableCell(`uc_ml_dep_amt_${sIdx}`,
                                  Math.round(siteDeposit).toLocaleString('en-IN'),
                                  <Input type="number" className="h-7 text-xs w-28 ml-auto" value={siteDeposit} onChange={e => {
                                    const newRows = [...abstractRemittanceRows];
                                    if (!newRows[sIdx]) newRows[sIdx] = { desc: displayDesc, amount: siteDeposit };
                                    newRows[sIdx].amount = Number(e.target.value);
                                    setAbstractRemittanceRows(newRows);
                                  }} />
                                )}
                              </td>
                              <td className="border border-black p-1.5"></td>
                            </tr>
                          );
                        })}
                        {/* Row 2: Total Deposit */}
                        <tr className="font-bold bg-gray-50">
                          <td className="border border-black p-1.5 text-center font-bold">2</td>
                          <td className="border border-black p-1.5 font-bold" colSpan={2}>ആകെ</td>
                          <td className="border border-black p-1.5 text-right font-mono font-bold">
                            {renderEditableCell('uc_ml_tot_dep',
                              <span>{totalRemittanceAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>,
                              <Input type="number" className="h-7 text-xs w-36 ml-auto" value={totalRemittanceAmount} onChange={e => setAdvanceDeposit(Number(e.target.value))} />
                            )}
                          </td>
                        </tr>
                        {/* Row 3: Expenditure */}
                        <tr>
                          <td className="border border-black p-1.5 text-center">3</td>
                          <td className="border border-black p-1.5 font-bold" colSpan={3}>
                            {renderEditableCell('uc_ml_tbl_exp_title',
                              <span>കുഴൽകിണർ നിർമ്മാണ പ്രവൃത്തിയുടെ ആകെ ചിലവ്</span>,
                              <Input className="h-7 text-xs font-semibold" value={localSelfGovt} onChange={e => setLocalSelfGovt(e.target.value)} />
                            )}
                          </td>
                        </tr>
                        {ucSelectedSites.map((sf, sIdx) => {
                          const subLetter = String.fromCharCode(97 + sIdx);
                          const siteExpDesc = `${sf.siteName} ${sf.location ? `(${sf.location})` : ''} കുടിവെള്ള പദ്ധതി കുഴൽകിണർ നിർമ്മാണം`;
                          const siteExpAmt = sf.subsidyAmount > 0 ? sf.netPayable : sf.totalExpenditure;
                          return (
                            <tr key={`exp_${sIdx}`}>
                              <td className="border border-black p-1.5 text-center">{subLetter}.</td>
                              <td className="border border-black p-1.5 pl-6">
                                {renderEditableCell(`uc_ml_exp_row_${sIdx}`,
                                  <span>{siteExpDesc}</span>,
                                  <Input className="h-7 text-xs" value={siteExpDesc} readOnly />
                                )}
                              </td>
                              <td className="border border-black p-1.5 text-right font-mono">
                                {siteExpAmt.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                              </td>
                              <td className="border border-black p-1.5"></td>
                            </tr>
                          );
                        })}
                        {/* Row 4: Total Expenditure */}
                        <tr className="font-bold bg-gray-50">
                          <td className="border border-black p-1.5 text-center font-bold">4</td>
                          <td className="border border-black p-1.5 font-bold" colSpan={2}>ആകെ</td>
                          <td className="border border-black p-1.5 text-right font-mono font-bold">{ucTotalSelectedExpenditure.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                        </tr>
                        {/* Row 5: Balance Amount */}
                        <tr className="font-bold bg-gray-100">
                          <td className="border border-black p-1.5 text-center font-bold">5</td>
                          <td className="border border-black p-1.5 font-bold" colSpan={2}>ബാലൻസ് തുക (പഞ്ചായത്തിന് തിരികെ നൽകാനുള്ളത്)</td>
                          <td className="border border-black p-1.5 text-right font-mono font-bold">{Math.abs(ucBalanceRefund).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                        </tr>
                        {/* Merged Row for Amount in Words inside table */}
                        <tr className="font-bold bg-gray-50 text-center">
                          <td className="border border-black p-1.5" colSpan={4}>
                            {numberToWordsMalayalam(Math.abs(ucBalanceRefund))}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  <div className="pt-10 text-right text-[10pt] font-bold">
                    <p>വിശ്വസ്തതയോടെ,</p>
                    <br /><br />
                    <p>ജില്ലാ ഓഫീസർ</p>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col space-y-4 text-[10pt] leading-[0.75cm]" style={{ lineHeight: '0.75cm' }}>
                  <style>{`
                    @page {
                      size: A4 portrait;
                      margin: ${getPageMarginsCss(printSettings)} !important;
                    }
                  `}</style>
                  <div className="flex justify-between items-start text-[10pt] pt-1 pb-3">
                    <div>
                      {renderEditableCell('uc_en_ref', 
                        <span>Ref No: <strong>{fileNo.includes('/') && !fileNo.toUpperCase().startsWith('GWD') ? `${officeAddress?.officeCode || 'GWDKLM'}/${fileNo}` : fileNo}</strong></span>, 
                        <Input className="h-6 text-xs w-48" value={fileNo} onChange={e => setFileNo(e.target.value)} />
                      )}
                    </div>

                    <div className="text-right text-[10pt] space-y-0.5">
                      {officeAddress?.address ? (
                        <div className="whitespace-pre-line text-right">
                          {officeAddress.address}
                        </div>
                      ) : (
                        <>
                          <p className="font-bold">Office of the District Officer</p>
                          <p className="font-semibold">Ground Water Department, {district}</p>
                        </>
                      )}
                      {renderEditableCell('uc_en_contact', 
                        <div className="text-right">
                          <p>Phone: {ucPhone}</p>
                          <p>Email: {ucEmail}</p>
                        </div>,
                        <div className="flex flex-col gap-1 items-end">
                          <Input className="h-6 text-xs w-36 text-right" value={ucPhone} onChange={e => setUcPhone(e.target.value)} />
                          <Input className="h-6 text-xs w-48 text-right" value={ucEmail} onChange={e => setUcEmail(e.target.value)} />
                        </div>
                      )}
                      {renderEditableCell('uc_en_date', <p className="pt-0.5">Date: <strong>{orderDate}</strong></p>, <Input className="h-6 text-xs w-36 text-right" value={orderDate} onChange={e => setOrderDate(e.target.value)} />)}
                    </div>
                  </div>

                  <div className="text-[10pt] space-y-3 py-1">
                    <div>
                      <p className="font-bold">From</p>
                      {renderEditableCell('uc_en_from', 
                        <div className="pl-8 font-semibold whitespace-pre-line">{ucFrom || 'District Officer'}</div>, 
                        <Textarea className="min-h-[40px] text-xs p-1" value={ucFrom} onChange={e => setUcFrom(e.target.value)} />
                      )}
                    </div>

                    <div>
                      <p className="font-bold">To</p>
                      {renderEditableCell('uc_en_to', 
                        <div className="pl-8 font-semibold whitespace-pre-line">
                          {ucTo || `Assistant Engineer\n${localSelfGovt || 'Gramapanchayat'}`}
                        </div>, 
                        <Textarea className="min-h-[50px] text-xs p-1" value={ucTo} onChange={e => setUcTo(e.target.value)} />
                      )}
                    </div>
                  </div>

                  <div className="text-[10pt] space-y-2 text-justify leading-[0.75cm] pt-2" style={{ lineHeight: '0.75cm' }}>
                    {(() => {
                      const defaultEnCertText = `Certified that out of Rs. ${totalRemittanceAmount.toLocaleString('en-IN')}/- deposited for borewell construction works under the ${localSelfGovt || 'Panchayat'} scheme during 2024 - 25 financial year, a total sum of Rs. ${ucTotalSelectedExpenditure.toLocaleString('en-IN')}/- has been utilized towards actual construction costs. The balance amount of Rs. ${Math.abs(ucBalanceRefund).toLocaleString('en-IN')}/- (Rupees ${numberToWordsEnglish(Math.abs(ucBalanceRefund))} only) is due for refund to the Panchayat.`;

                      return renderEditableCell('uc_en_cert_para',
                        <p className="whitespace-pre-line">{ucEnPara1 || defaultEnCertText}</p>,
                        <Textarea className="min-h-[80px] text-xs p-1.5" value={ucEnPara1 || defaultEnCertText} onChange={e => setUcEnPara1(e.target.value)} />
                      );
                    })()}
                  </div>

                  <div className="pt-2">
                    <table className="w-full border-collapse border border-black text-[10pt]">
                      <thead>
                        <tr className="bg-gray-100 border-b border-black text-center font-bold">
                          <td className="border border-black p-1.5 w-12">Sl No</td>
                          <td className="border border-black p-1.5">Description</td>
                          <td className="border border-black p-1.5 w-32 text-right pr-2">Amount (Rs)</td>
                          <td className="border border-black p-1.5 w-36 text-right pr-2">Total Amount (Rs)</td>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td className="border border-black p-1.5 text-center">1</td>
                          <td className="border border-black p-1.5 font-bold" colSpan={3}>
                            {renderEditableCell('uc_en_tbl_dep_title',
                              <span>Amount deposited by Panchayat for borewell construction works</span>,
                              <Input className="h-7 text-xs font-semibold" value={localSelfGovt} onChange={e => setLocalSelfGovt(e.target.value)} />
                            )}
                          </td>
                        </tr>
                        {ucSelectedSites.map((sf, sIdx) => {
                          const subLetter = String.fromCharCode(97 + sIdx);
                          const siteDeposit = abstractRemittanceRows[sIdx]?.amount ?? (totalRemittanceAmount / (ucSelectedSites.length || 1));
                          const depDesc = `${sf.siteName} ${sf.location ? `(${sf.location})` : ''} Borewell Construction Deposit`;
                          return (
                            <tr key={`dep_en_${sIdx}`}>
                              <td className="border border-black p-1.5 text-center">{subLetter}.</td>
                              <td className="border border-black p-1.5 pl-6">
                                {renderEditableCell(`uc_en_dep_row_${sIdx}`,
                                  <span>{depDesc}</span>,
                                  <Input className="h-7 text-xs" value={depDesc} readOnly />
                                )}
                              </td>
                              <td className="border border-black p-1.5 text-right font-mono">
                                {renderEditableCell(`uc_en_dep_amt_${sIdx}`,
                                  Math.round(siteDeposit).toLocaleString('en-IN'),
                                  <Input type="number" className="h-7 text-xs w-28 ml-auto" value={siteDeposit} onChange={e => {
                                    const newRows = [...abstractRemittanceRows];
                                    if (!newRows[sIdx]) newRows[sIdx] = { desc: sf.siteName, amount: siteDeposit };
                                    newRows[sIdx].amount = Number(e.target.value);
                                    setAbstractRemittanceRows(newRows);
                                  }} />
                                )}
                              </td>
                              <td className="border border-black p-1.5"></td>
                            </tr>
                          );
                        })}
                        <tr className="font-bold bg-gray-50">
                          <td className="border border-black p-1.5 text-center font-bold">2</td>
                          <td className="border border-black p-1.5 font-bold" colSpan={2}>Total</td>
                          <td className="border border-black p-1.5 text-right font-mono font-bold">{totalRemittanceAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                        </tr>
                        <tr>
                          <td className="border border-black p-1.5 text-center">3</td>
                          <td className="border border-black p-1.5 font-bold" colSpan={3}>
                            {renderEditableCell('uc_en_tbl_exp_title',
                              <span>Total expenditure incurred for borewell construction works</span>,
                              <Input className="h-7 text-xs font-semibold" value={localSelfGovt} onChange={e => setLocalSelfGovt(e.target.value)} />
                            )}
                          </td>
                        </tr>
                        {ucSelectedSites.map((sf, sIdx) => {
                          const subLetter = String.fromCharCode(97 + sIdx);
                          const expDesc = `${sf.siteName} ${sf.location ? `(${sf.location})` : ''} Borewell Construction`;
                          const siteExpAmt = sf.subsidyAmount > 0 ? sf.netPayable : sf.totalExpenditure;
                          return (
                            <tr key={`exp_en_${sIdx}`}>
                              <td className="border border-black p-1.5 text-center">{subLetter}.</td>
                              <td className="border border-black p-1.5 pl-6">
                                {renderEditableCell(`uc_en_exp_row_${sIdx}`,
                                  <span>{expDesc}</span>,
                                  <Input className="h-7 text-xs" value={expDesc} readOnly />
                                )}
                              </td>
                              <td className="border border-black p-1.5 text-right font-mono">{siteExpAmt.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                              <td className="border border-black p-1.5"></td>
                            </tr>
                          );
                        })}
                        <tr className="font-bold bg-gray-50">
                          <td className="border border-black p-1.5 text-center font-bold">4</td>
                          <td className="border border-black p-1.5 font-bold" colSpan={2}>Total</td>
                          <td className="border border-black p-1.5 text-right font-mono font-bold">{ucTotalSelectedExpenditure.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                        </tr>
                        <tr className="font-bold bg-gray-100">
                          <td className="border border-black p-1.5 text-center font-bold">5</td>
                          <td className="border border-black p-1.5 font-bold" colSpan={2}>Balance amount (to be returned to Panchayat)</td>
                          <td className="border border-black p-1.5 text-right font-mono font-bold">{Math.abs(ucBalanceRefund).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                        </tr>
                        {/* Merged row for words */}
                        <tr className="font-bold bg-gray-50 text-center">
                          <td className="border border-black p-1.5" colSpan={4}>
                            (Rupees {numberToWordsEnglish(Math.abs(ucBalanceRefund))} only)
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  <div className="pt-10 text-right text-[10pt] font-bold">
                    <p>Yours faithfully,</p>
                    <br /><br />
                    <p>District Officer</p>
                  </div>
                </div>
              )}
            </div>
          )}

        </div>

        {/* Modal Footer - Hidden during Printing */}
        <DialogFooter className="print:hidden border-t pt-3 flex justify-between items-center">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          <div className="flex items-center gap-2">
            {onSave && (
              <Button onClick={handleSave} disabled={isSaving} variant="outline" className="gap-1.5">
                {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4 text-primary" />}
                Save
              </Button>
            )}
            {isInIframe ? (
              <Button asChild variant="default" className="gap-1.5 bg-amber-600 hover:bg-amber-700 text-white border-none animate-pulse" title="Print this document (opens in a new tab)">
                <a href={typeof window !== 'undefined' ? window.location.href : '#'} target="_blank" rel="noopener noreferrer">
                  <Printer className="h-4 w-4" />
                  Print
                </a>
              </Button>
            ) : (
              <Button onClick={handlePrint} className="bg-primary gap-1.5">
                <Printer className="h-4 w-4" />
                Print
              </Button>
            )}
            <Button onClick={handleCopyRichHtml} disabled={isCopying} variant="outline" className="gap-1.5 border-primary/20 hover:bg-primary/5 hover:text-primary">
              <ClipboardCopy className="h-4 w-4 text-primary" />
              {isCopying ? "Copying..." : "Copy Rich HTML"}
            </Button>
          </div>
        </DialogFooter>

    </div>
  );

  if (isFullPage) {
    return contentBody;
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[92vh] overflow-y-auto p-4 sm:p-6 print:p-0 print:max-w-none print:shadow-none print:border-none print:m-0">
        {contentBody}
      </DialogContent>
    </Dialog>
  );
}
