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
import { Printer, FileText, Globe, CheckCircle2, Building2, User, Landmark, DollarSign, Pencil, Check, X, RotateCcw, ExternalLink, Save, Loader2 } from "lucide-react";
import { printDocument } from "@/lib/print-utils";
import type { DataEntryFormData, SiteDetailFormData } from "@/lib/schemas";
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
  const [casing6kgQty, setCasing6kgQty] = useState<number>(0);
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
  const [fbDescCasing6Ml, setFbDescCasing6Ml] = useState<string>('140 മില്ലീമീറ്റർ വ്യാസമുള്ള 6 കി.ഗ്രാം /ച. സെ. മീ. പിവിസി കെയ്സിംഗ് പൈപ്പിന്റെ വില');
  const [fbDescInnerMl, setFbDescInnerMl] = useState<string>('140 മില്ലീമീറ്റർ വ്യാസമുള്ള പിവിസി കുഴൽകിണർ അടപ്പിന്റെ വില');

  const [fbDescDrillingEn, setFbDescDrillingEn] = useState<string>('Drilling charges for 110 mm dia borewell');
  const [fbDescCasing10En, setFbDescCasing10En] = useState<string>('140 mm dia 10 kg/cm² PVC Casing Pipe');
  const [fbDescCasing6En, setFbDescCasing6En] = useState<string>('140 mm dia 6 kg/cm² PVC Casing Pipe');
  const [fbDescInnerEn, setFbDescInnerEn] = useState<string>('140 mm PVC Cap / Inner Casing');

  // Sanction Proceedings additional paragraph states
  const [procPara4, setProcPara4] = useState<string>('');
  const [procPara5, setProcPara5] = useState<string>('');

  // Utilization Certificate paragraph states
  const [ucMlPara1, setUcMlPara1] = useState<string>('');
  const [ucMlPara2, setUcMlPara2] = useState<string>('');
  const [ucEnPara1, setUcEnPara1] = useState<string>('');
  const [ucEnPara2, setUcEnPara2] = useState<string>('');

  // Dynamic row collections for UC & Abstract tables
  const [ucTableRows, setUcTableRows] = useState<Array<{ siteName: string; deposited: number; expenditure: number; }>>([]);
  const [abstractRows, setAbstractRows] = useState<Array<{ siteName: string; location: string; deposited: number; expenditure: number; }>>([]);

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

    // District Officer Name from Settings page and Designation from Establishment page
    const doName = officeAddress?.districtOfficer || allStaffMembers?.find(s => s.roles?.includes('District Officer') || s.designation === 'District Officer' || s.designation === 'Executive Engineer')?.name || 'Jiji Thampi';
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

      const depth = Number(currentSite.totalDepth) || 0;
      setDepthMeter(depth);
      setDrillingQty(depth);

      setDiameter(currentSite.diameter || 'Ø 110 മില്ലീമീറ്റർ');

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

      const wl = (currentSite.waterLevel !== undefined && currentSite.waterLevel !== null && currentSite.waterLevel !== '') ? currentSite.waterLevel : '';
      setStaticWaterLevel(wl);

      let rigStr = currentSite.typeOfRig || '';
      if (currentSite.drillingRigNo) rigStr += ` (Rig: ${currentSite.drillingRigNo})`;
      if (currentSite.compressorNo) rigStr += ` (Comp: ${currentSite.compressorNo})`;
      setRigUsed(rigStr);

      setContractorName(currentSite.contractorName || '');
      setPeriodFrom(currentSite.dateOfCommencement || '');
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
      setFbDescCasing6Ml(`${casingDia} വ്യാസമുള്ള 6 കി.ഗ്രാം /ച. സെ. മീ. പിവിസി കെയ്സിംഗ് പൈപ്പിന്റെ വില`);
      setFbDescInnerMl(`${casingDia} വ്യാസമുള്ള പിവിസി കുഴൽകിണർ അടപ്പിന്റെ വില`);

      setFbDescDrillingEn(`Drilling charges for ${drillingDiaEn} dia borewell`);
      setFbDescCasing10En(`${casingDiaEn} dia 10 kg/cm² PVC Casing Pipe`);
      setFbDescCasing6En(`${casingDiaEn} dia 6 kg/cm² PVC Casing Pipe`);
      setFbDescInnerEn(`${casingDiaEn} PVC Cap / Inner Casing`);

      // Calculate localized net payable
      const appTypeStr = (applicationType || entry?.applicationType || currentSite?.applicationType || '').toLowerCase();
      const isPrivateIrrigation = appTypeStr.includes('irrigation') || appTypeStr.includes('private_irrigation') || appTypeStr.includes('private irrigation');
      const depthForSubsidy = Math.min(depth || drillingQty || 0, 120);
      const calculatedPrivateSubsidy = (depthForSubsidy * drillingRate) * 0.5;
      const localSubsidy = isPrivateIrrigation 
        ? (Number((currentSite as any)?.subsidyAmount) || Number((entry as any)?.subsidyAmount) || calculatedPrivateSubsidy)
        : (Number((currentSite as any)?.subsidyAmount) || Number((entry as any)?.subsidyAmount) || 0);
      setSubsidyAmount(localSubsidy);

      const localEndCap = currentSite.endCap || 'No';
      const localInnerQty = (localEndCap === 'Yes' && innerQty === 0) ? 1 : innerQty;

      const localDrillingTotal = drillingRate * depth;
      const localCasing10Total = casing10kgRate * c10;
      const localCasing6Total = casing6kgRate * c6;
      const localInnerTotal = innerCasingRate * localInnerQty;
      localTotalExpenditure = localDrillingTotal + localCasing10Total + localCasing6Total + localInnerTotal;
      localNetPayable = localTotalExpenditure - localSubsidy;
    }

    setProceedingsSubject(
      `GWD, ${district} - Construction of borewell at ${entry.applicantName || ''}${entry.applicantAddress ? `, ${entry.applicantAddress}` : ''} - Refund of balance amount and remittance of drilling charges to revenue head - Sanctioned - Orders issued - reg.`
    );
    setProceedingsRef1(formatDatesInText(`1. Application of ${entry.applicantName || ''} and DD details (${ddStr}).`));
    setProceedingsRef2(`2. Final Bill of this office, dated ${todayFormatted}.`);

    setUcFrom(`District Officer, Ground Water Department, ${district}`);
    setUcTo(`Assistant Engineer, ${currentSite?.localSelfGovt || 'Gramapanchayat'}`);
    setUcSubject(
      `ഭൂജല വകുപ്പ്, ${districtMl} - ${currentSite?.localSelfGovt || 'പഞ്ചായത്ത്'} കുടിവെള്ള പദ്ധതി - കുഴൽകിണർ നിർമ്മാണം - ധനവിനിയോഗ സാക്ഷ്യപത്രം നൽകുന്നത് സംബന്ധിച്ച്.`
    );
    setUcRef1(`1. കത്ത് നമ്പർ GWD/${fNo.replace(/\//g, '-')}/2026 തീയതി ${todayFormatted}`);
    setUcRef2(`2. പൂർത്തീകരണ റിപ്പോർട്ട് & ഫൈനൽ ബിൽ`);

    const localNetPayableFinal = localNetPayable || (drillingRate * drillingQty) - subsidyAmount;
    const localTotalExpenditureFinal = localTotalExpenditure || (drillingRate * drillingQty);
    const localBalanceRefund = depositTotal - localNetPayableFinal;

    setProcPara4(
      `Sanction is also hereby accorded to remit an amount of Rs. ${localNetPayableFinal.toLocaleString('en-IN')}/- (${numberToWordsEnglish(localNetPayableFinal)}) to Department Revenue head 0702-02-800-99-other receipts, being the Borewell construction charges.`
    );
    setProcPara5(
      `The expenditure shall be met from the gross amount of Rs. ${depositTotal.toLocaleString('en-IN')}/- deposited by the applicant into STSB Account of the District Officer, Ground Water Department, ${district}.`
    );

    setUcMlPara1(
      `മേൽ സൂചന പ്രകാരം ${currentSite?.localSelfGovt || 'പഞ്ചായത്ത്'} പരിധിയിലെ കുടിവെള്ള പദ്ധതികൾ നടപ്പിലാക്കുന്നതിന്റെ ഭാഗമായി കുഴൽകിണർ നിർമ്മാണം നടത്തുകയും അതിനായി അടവാക്കിയ തുകയ്ക്ക് പൂർത്തീകരണ റിപ്പോർട്ടും ഫൈനൽ ബില്ലും ഇതിനാൽ സാക്ഷ്യപ്പെടുത്തുന്നു.`
    );
    setUcMlPara2(
      `ടി കുഴൽകിണർ നിർമ്മാണ പ്രവൃത്തികൾ ഡിപ്പാർട്ട്മെന്റ് റിഗ് മുഖേന തൃപ്തികരമായി പൂർത്തീകരിച്ചിട്ടുണ്ട്. കുഴൽകിണർ നിർമ്മാണങ്ങൾക്ക് ആകെ ചിലവായ തുക കഴിച്ച് ബാക്കി തുകയായ Rs. ${localBalanceRefund.toLocaleString('en-IN')}/- (${numberToWordsMalayalam(Math.abs(localBalanceRefund))}) പഞ്ചായത്തിന് തിരികെ നൽകുന്നതിന് ബാങ്ക് അക്കൗണ്ട് വിവരങ്ങൾ ലഭ്യമാക്കണമെന്ന് താല്പര്യപ്പെടുന്നു.`
    );

    setUcEnPara1(
      `Certified that out of Rs. ${depositTotal.toLocaleString('en-IN')}/- deposited for borewell construction works under the ${currentSite?.localSelfGovt || 'Panchayat'} scheme, a total sum of Rs. ${localTotalExpenditureFinal.toLocaleString('en-IN')}/- has been utilized towards actual construction costs.`
    );
    setUcEnPara2(
      `The unspent balance amount of Rs. ${localBalanceRefund.toLocaleString('en-IN')}/- (${numberToWordsEnglish(Math.abs(localBalanceRefund))}) is ready for refund.`
    );

    // Initialize dynamic collections
    setUcTableRows(sites.map(s => {
      const sDepth = Number(s.totalDepth) || 0;
      const sDrilling = drillingRate * sDepth;
      const sC10 = casing10kgRate * (Number(s.casing10kgPipe) || 0);
      const sC6 = casing6kgRate * (Number(s.casing6kgPipe) || 0);
      const sInner = innerCasingRate * (Number(s.innerCasingPipe) || Number(s.innerCasing6kgPipe) || Number(s.innerCasing4kgPipe) || 0);
      const sCost = sDrilling + sC10 + sC6 + sInner;
      return {
        siteName: s.nameOfSite || '',
        deposited: depositTotal / (sites.length || 1),
        expenditure: sCost,
      };
    }));

    setAbstractRows(sites.map(s => {
      const sDepth = Number(s.totalDepth) || 0;
      const sDrilling = drillingRate * sDepth;
      const sC10 = casing10kgRate * (Number(s.casing10kgPipe) || 0);
      const sC6 = casing6kgRate * (Number(s.casing6kgPipe) || 0);
      const sInner = innerCasingRate * (Number(s.innerCasingPipe) || Number(s.innerCasing6kgPipe) || Number(s.innerCasing4kgPipe) || 0);
      const sCost = sDrilling + sC10 + sC6 + sInner;
      return {
        siteName: s.nameOfSite || '',
        location: s.localSelfGovt || 'LSGD',
        deposited: depositTotal / (sites.length || 1),
        expenditure: sCost,
      };
    }));

  }, [entry, currentSite, selectedSiteIndex, moduleType, district, districtMl, drillingRate, drillingQty, subsidyAmount, sites, casing10kgRate, casing6kgRate, innerCasingRate, applicationType, officeAddress?.officeCode]);

  // Derived Calculations
  const appTypeStr = (applicationType || entry?.applicationType || currentSite?.applicationType || '').toLowerCase();
  const isPrivateIrrigation = appTypeStr.includes('irrigation') || appTypeStr.includes('private_irrigation') || appTypeStr.includes('private irrigation');
  
  const subsidyEligibleDepth = Math.min(drillingQty || depthMeter || 0, 120);
  const calculatedPrivateSubsidy = isPrivateIrrigation ? (subsidyEligibleDepth * drillingRate * 0.5) : 0;
  const effectiveSubsidyAmount = (isPrivateIrrigation && subsidyAmount === 0) ? calculatedPrivateSubsidy : subsidyAmount;

  const drillingTotal = drillingRate * drillingQty;
  const casing10kgTotal = casing10kgRate * casing10kgQty;
  const casing6kgTotal = casing6kgRate * casing6kgQty;
  const effectiveInnerCasingQty = (endCap === 'Yes' && innerCasingQty === 0) ? 1 : innerCasingQty;
  const innerCasingTotal = innerCasingRate * effectiveInnerCasingQty;

  const totalExpenditure = drillingTotal + casing10kgTotal + casing6kgTotal + innerCasingTotal;
  const netPayableGwd = totalExpenditure - effectiveSubsidyAmount;
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
    printDocument('printable-report-document', docTitle);
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
      if (updatedSiteDetails[selectedSiteIndex]) {
        updatedSiteDetails[selectedSiteIndex] = {
          ...updatedSiteDetails[selectedSiteIndex],
          contractorName: contractorName || updatedSiteDetails[selectedSiteIndex].contractorName,
          latitude: latitude ? Number(latitude) : updatedSiteDetails[selectedSiteIndex].latitude,
          longitude: longitude ? Number(longitude) : updatedSiteDetails[selectedSiteIndex].longitude,
          localSelfGovt: localSelfGovt || updatedSiteDetails[selectedSiteIndex].localSelfGovt,
          constituency: constituency || updatedSiteDetails[selectedSiteIndex].constituency,
          totalDepth: depthMeter || updatedSiteDetails[selectedSiteIndex].totalDepth,
          casing10kgPipe: casing10kgQty || updatedSiteDetails[selectedSiteIndex].casing10kgPipe,
          casing6kgPipe: casing6kgQty || updatedSiteDetails[selectedSiteIndex].casing6kgPipe,
          yieldDischarge: yieldLph || updatedSiteDetails[selectedSiteIndex].yieldDischarge,
          zoneDetails: waterStruckZone || updatedSiteDetails[selectedSiteIndex].zoneDetails,
          waterLevel: staticWaterLevel || updatedSiteDetails[selectedSiteIndex].waterLevel,
          drillingRemarks: remarks || updatedSiteDetails[selectedSiteIndex].drillingRemarks,
          workRemarks: remarks || updatedSiteDetails[selectedSiteIndex].workRemarks,
          dateOfCommencement: periodFrom || updatedSiteDetails[selectedSiteIndex].dateOfCommencement,
          dateOfCompletion: periodTo || updatedSiteDetails[selectedSiteIndex].dateOfCompletion,
        };
      }

      const updatedEntry: DataEntryFormData = {
        ...entry,
        siteDetails: updatedSiteDetails,
      };

      await onSave(updatedEntry);
      toast({ title: "Changes Saved", description: "Edited data saved to Firebase database successfully." });
    } catch (err: any) {
      toast({ variant: "destructive", title: "Save Failed", description: err.message || "Could not save changes." });
    } finally {
      setIsSaving(false);
    }
  };

  const rowResetHandlers: Record<string, () => void> = {
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
      setCasing10kgQty(Number(currentSite?.casing10kgPipe) || 0);
      setCasing6kgQty(Number(currentSite?.casing6kgPipe) || 0);
      setInnerCasingQty(Number(currentSite?.innerCasingPipe) || Number(currentSite?.innerCasing6kgPipe) || Number(currentSite?.innerCasing4kgPipe) || 0);
      setPilotDrillingDepth(currentSite?.pilotDrillingDepth || '');
      setSurveyPlainPipe(currentSite?.surveyPlainPipe || '');
      setSurveySlottedPipe(currentSite?.surveySlottedPipe || '');
      setOuterCasingPipe(currentSite?.outerCasingPipe || '');
    },
    cr_endCap: () => setEndCap(currentSite?.endCap || 'No'),
    cr_yield: () => setYieldLph(Number(currentSite?.yieldDischarge) || 0),
    cr_zone: () => setWaterStruckZone(currentSite?.zoneDetails || ''),
    cr_swl: () => setStaticWaterLevel((currentSite?.waterLevel !== undefined && currentSite?.waterLevel !== null && currentSite?.waterLevel !== '') ? currentSite.waterLevel : ''),
    cr_period: () => { setPeriodFrom(currentSite?.dateOfCommencement || ''); setPeriodTo(currentSite?.dateOfCompletion || ''); },
    cr_remarks: () => setRemarks(currentSite?.drillingRemarks || currentSite?.workRemarks || ''),
    cr_contractor: () => setContractorName(currentSite?.contractorName || ''),

    // Final Bill resets
    fb_desc_drilling: () => {
      const diaVal = currentSite?.diameter || '110';
      const isDia150 = diaVal.includes('150') || diaVal.includes('6');
      setFbDescDrillingMl(`${isDia150 ? '150 മില്ലീമീറ്റർ' : '110 മില്ലീമീറ്റർ'} വ്യാസമുള്ള കുഴൽകിണറിന്റെ ഡ്രില്ലിംഗ് ചാർജ്`);
      setFbDescDrillingEn(`Drilling charges for ${isDia150 ? '150 mm' : '110 mm'} dia borewell`);
    },
    fb_r1: () => setDrillingRate(390),
    fb_q1: () => { const d = Number(currentSite?.totalDepth) || 0; setDrillingQty(d); setDepthMeter(d); },
    fb_desc_casing10: () => {
      const diaVal = currentSite?.diameter || '110';
      const isDia150 = diaVal.includes('150') || diaVal.includes('6');
      const casingDia = isDia150 ? '180 മില്ലീമീറ്റർ' : '140 മില്ലീമീറ്റർ';
      const casingDiaEn = isDia150 ? '180 mm' : '140 mm';
      setFbDescCasing10Ml(`${casingDia} വ്യാസമുള്ള 10 കി.ഗ്രാം /ച. സെ. മീ. പിവിസി കെയ്സിംഗ് പൈപ്പിന്റെ വില`);
      setFbDescCasing10En(`${casingDiaEn} dia 10 kg/cm² PVC Casing Pipe`);
    },
    fb_r2: () => setCasing10kgRate(960),
    fb_q2: () => setCasing10kgQty(Number(currentSite?.casing10kgPipe) || 0),
    fb_desc_casing6: () => {
      const diaVal = currentSite?.diameter || '110';
      const isDia150 = diaVal.includes('150') || diaVal.includes('6');
      const casingDia = isDia150 ? '180 മില്ലീമീറ്റർ' : '140 മില്ലീമീറ്റർ';
      const casingDiaEn = isDia150 ? '180 mm' : '140 mm';
      setFbDescCasing6Ml(`${casingDia} വ്യാസമുള്ള 6 കി.ഗ്രാം /ച. സെ. മീ. പിവിസി കെയ്സിംഗ് പൈപ്പിന്റെ വില`);
      setFbDescCasing6En(`${casingDiaEn} dia 6 kg/cm² PVC Casing Pipe`);
    },
    fb_r3: () => setCasing6kgRate(580),
    fb_q3: () => setCasing6kgQty(Number(currentSite?.casing6kgPipe) || 0),
    fb_desc_inner: () => {
      const diaVal = currentSite?.diameter || '110';
      const isDia150 = diaVal.includes('150') || diaVal.includes('6');
      const casingDia = isDia150 ? '180 മില്ലീമീറ്റർ' : '140 മില്ലീമീറ്റർ';
      const casingDiaEn = isDia150 ? '180 mm' : '140 mm';
      setFbDescInnerMl(`${casingDia} വ്യാസമുള്ള പിവിസി കുഴൽകിണർ അടപ്പിന്റെ വില`);
      setFbDescInnerEn(`${casingDiaEn} PVC Cap / Inner Casing`);
    },
    fb_r4: () => setInnerCasingRate(225),
    fb_q4: () => setInnerCasingQty(Number(currentSite?.innerCasingPipe) || Number(currentSite?.innerCasing6kgPipe) || Number(currentSite?.innerCasing4kgPipe) || 0),
    fb_subsidy: () => setSubsidyAmount(0),
    fb_advance: () => setAdvanceDeposit(entry?.remittanceDetails?.reduce((sum, r) => sum + (Number(r.amountRemitted) || 0), 0) || 0),

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

    uc_contact: () => { setUcPhone('0474 - 2790313'); setUcEmail('gwdklm@gmail.com'); },
    uc_ref: () => setFileNo(entry?.fileNo || 'GWD/1372/2022'),
    uc_date: () => setOrderDate(new Date().toISOString().split('T')[0]),
    uc_from: () => setUcFrom(`District Officer, Ground Water Department, ${district}`),
    uc_to: () => setUcTo(`Assistant Engineer, ${currentSite?.localSelfGovt || 'Gramapanchayat'}`),
    uc_sub: () => setUcSubject(`Utilization Certificate for borewell construction works at ${currentSite?.localSelfGovt || 'Panchayat'}`),
    uc_refs: () => { setUcRef1(''); setUcRef2(''); },
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
          <div className="mt-1 p-1.5 bg-blue-50/90 dark:bg-blue-950/60 rounded border border-blue-200 dark:border-blue-800 print:hidden shadow-xs">
            <div className="text-[10px] font-bold text-blue-700 dark:text-blue-300 mb-1 flex items-center justify-between">
              <span>Change Item / വിവരങ്ങൾ തിരുത്തുക:</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="flex-1 min-w-0">{editControl}</div>
              <div className="flex items-center gap-1 shrink-0">
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-6 w-6 text-green-700 bg-green-100 hover:bg-green-200 dark:text-green-300 dark:bg-green-900/60 shrink-0 border border-green-300"
                  onClick={() => setEditingRow(null)}
                  title="Done editing"
                >
                  <Check className="h-3.5 w-3.5" />
                </Button>
                {resetFn && (
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-6 w-6 text-amber-700 bg-amber-100 hover:bg-amber-200 dark:text-amber-300 dark:bg-amber-900/60 shrink-0 border border-amber-300"
                    onClick={() => {
                      handleReset();
                      setEditingRow(null);
                    }}
                    title="Reset row to original data"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                  </Button>
                )}
              </div>
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
            <div className="flex items-center gap-2">
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
        <div id="printable-report-document" className="bg-white text-black p-6 sm:p-10 border shadow-sm font-sans rounded-none print:border-none print:shadow-none print:p-0 print:m-0 text-[13px] leading-relaxed">
          
          {/* 1. COMPLETION REPORT (MALAYALAM & ENGLISH) */}
          {docType === 'completion_report' && (() => {
            const displayFileNo = fileNo ? (fileNo.toUpperCase().startsWith('GWDKLM') ? fileNo : `GWDKLM/${fileNo}`) : '';
            const displayAppType = applicationType ? (applicationType.toLowerCase().includes('deposit') ? applicationType : `${applicationType} - Deposit Works`) : 'Deposit Works';

            const meterUnit = lang === 'ml' ? 'മീറ്റർ' : 'meter';
            const recTDFormatted = surveyRecommendedTD ? formatMeterValue(surveyRecommendedTD, meterUnit) : '';
            const recOBFormatted = surveyRecommendedOB ? formatMeterValue(surveyRecommendedOB, meterUnit) : '';
            const recDisplay = [recTDFormatted, recOBFormatted].filter(Boolean).join(', ');

            const totalCasingMeters = (Number(casing10kgQty) || 0) + (Number(casing6kgQty) || 0) + (Number(innerCasingQty) || 0);

            const formattedPeriodFrom = formatDateDDMMYYYY(periodFrom);
            const formattedPeriodTo = formatDateDDMMYYYY(periodTo);

            return (
              <div className="completion-report flex flex-col justify-between min-h-[255mm] space-y-2">
                {lang === 'ml' ? (
                  <>
                    <div>
                      <div className="text-center space-y-1 pb-2 mb-3 border-b-2 border-black">
                        <h2 className="text-base sm:text-lg font-extrabold tracking-wide">ഭൂജലവകുപ്പ്, ജില്ലാ ഓഫീസ്, {districtMl}</h2>
                        <h3 className="text-sm sm:text-base font-bold underline">{currentSite?.purpose === 'TWC' ? 'പൂർത്തീകരണറിപ്പോർട്ട് - റ്റ്യൂബ് കിണർ നിർമ്മാണം' : 'പൂർത്തീകരണറിപ്പോർട്ട് - കുഴൽകിണർ നിർമ്മാണം'}</h3>
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
                                  if (casing6kgQty) lines.push(`${casingDiameterLabel} വ്യാസം, 6 kg/cm² : ${casing6kgQty} മീറ്റർ`);
                                  if (innerCasingQty) lines.push(`ഇന്നർ കേസിംഗ് (110 mm, 4 kg/cm²) : ${innerCasingQty} മീറ്റർ`);
                                  if (currentSite?.purpose === 'TWC') {
                                    if (pilotDrillingDepth) lines.push(`പൈലറ്റ് ഡ്രില്ലിംഗ് ആഴം: ${formatMeterValue(pilotDrillingDepth, 'മീറ്റർ')}`);
                                    if (surveyPlainPipe) lines.push(`പ്ലെയിൻ പൈപ്പ് (Plain Pipe): ${formatMeterValue(surveyPlainPipe, 'മീറ്റർ')}`);
                                    if (surveySlottedPipe) lines.push(`സ്ലോട്ടഡ് പൈപ്പ് (Slotted Pipe): ${formatMeterValue(surveySlottedPipe, 'മീറ്റർ')}`);
                                    if (outerCasingPipe) lines.push(`എം.എസ് കേസിംഗ് (MS Casing): ${formatMeterValue(outerCasingPipe, 'മീറ്റർ')}`);
                                  }
                                  return (
                                    <span>
                                      : {totalCasingMeters ? `${totalCasingMeters} മീറ്റർ` : ''}
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
                                  <Input type="number" placeholder="6kg" className="h-6 text-xs" value={casing6kgQty} onChange={e => setCasing6kgQty(Number(e.target.value))} />
                                  <Input type="number" placeholder="Inner" className="h-6 text-xs" value={innerCasingQty} onChange={e => setInnerCasingQty(Number(e.target.value))} />
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
                          <tr className="border-b border-gray-300">
                            <td className="py-2 px-2 font-bold text-black align-top">15. കുഴൽകിണറിന്റെ അടപ്പിന്റെ വിവരം (End Cap)</td>
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
                            <td className="py-2 px-2 font-bold text-black align-top">16. ജലലഭ്യത (മണിക്കൂറിൽ)</td>
                            <td className="py-2 px-2 text-black align-top">
                              {renderEditableCell('cr_yield', `: ${yieldLph ? `${yieldLph} ലിറ്റർ പ്രതി മണിക്കൂർ` : ''}`, <Input type="number" className="h-6 text-xs w-28" value={yieldLph} onChange={e => setYieldLph(Number(e.target.value))} />)}
                            </td>
                          </tr>
                          <tr className="border-b border-gray-300">
                            <td className="py-2 px-2 font-bold text-black align-top">17. ജലം ലഭിച്ച മേഖല</td>
                            <td className="py-2 px-2 text-black align-top">
                              {renderEditableCell('cr_zone', `: ${waterStruckZone ? (waterStruckZone.includes('മീറ്റർ') || waterStruckZone.includes('meter') ? waterStruckZone : `${waterStruckZone} മീറ്റർ`) : ''}`, <Input className="h-6 text-xs" value={waterStruckZone} onChange={e => setWaterStruckZone(e.target.value)} />)}
                            </td>
                          </tr>
                          <tr className="border-b border-gray-300">
                            <td className="py-2 px-2 font-bold text-black align-top">18. ജലനിരപ്പ് (ഭൂനിരപ്പിൽ നിന്ന് താഴേക്ക്)</td>
                            <td className="py-2 px-2 text-black align-top">
                              {renderEditableCell('cr_swl', `: ${staticWaterLevel !== '' && staticWaterLevel !== null && staticWaterLevel !== undefined ? `${staticWaterLevel} മീറ്റർ` : ''}`, <Input className="h-6 text-xs w-28" value={staticWaterLevel} onChange={e => setStaticWaterLevel(e.target.value)} />)}
                            </td>
                          </tr>
                          <tr className="border-b border-gray-300">
                            <td className="py-2 px-2 font-bold text-black align-top">19. പ്രവർത്തന കാലയളവ്</td>
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
                            <td className="py-2 px-2 font-bold text-black align-top">20. കുറിപ്പ്</td>
                            <td className="py-2 px-2 text-black align-top">
                              {renderEditableCell('cr_remarks', `: ${remarks || ''}`, <Textarea className="min-h-[40px] text-xs p-1" value={remarks} onChange={e => setRemarks(e.target.value)} />)}
                            </td>
                          </tr>
                          {!isDeptRigWork && (
                            <tr className="border-b border-gray-300">
                              <td className="py-2 px-2 font-bold text-black align-top">21. കോൺട്രാക്ടറുടെ പേര്</td>
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
                      <div className="text-center space-y-1 pb-2 mb-3 border-b-2 border-black">
                        <h2 className="text-base sm:text-lg font-extrabold tracking-wide uppercase">GROUND WATER DEPARTMENT, DISTRICT OFFICE, {district}</h2>
                        <h3 className="text-sm sm:text-base font-bold underline">{currentSite?.purpose === 'TWC' ? 'TUBE WELL COMPLETION REPORT' : 'BORE WELL COMPLETION REPORT'}</h3>
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
                                  if (casing6kgQty) lines.push(`${casingDiameterLabel}, 6 kg/cm²: ${casing6kgQty} meter`);
                                  if (innerCasingQty) lines.push(`Inner Casing (110 mm, 4 kg/cm²): ${innerCasingQty} meter`);
                                  if (currentSite?.purpose === 'TWC') {
                                    if (pilotDrillingDepth) lines.push(`Pilot Drilling Depth: ${formatMeterValue(pilotDrillingDepth)}`);
                                    if (surveyPlainPipe) lines.push(`Plain Pipe: ${formatMeterValue(surveyPlainPipe)}`);
                                    if (surveySlottedPipe) lines.push(`Slotted Pipe: ${formatMeterValue(surveySlottedPipe)}`);
                                    if (outerCasingPipe) lines.push(`MS Casing: ${formatMeterValue(outerCasingPipe)}`);
                                  }
                                  if (lines.length > 0) {
                                    return (
                                      <span>
                                        : {lines[0]}
                                        {lines.slice(1).map((line, idx) => (
                                          <React.Fragment key={idx}>
                                            <br />&nbsp; {line}
                                          </React.Fragment>
                                        ))}
                                      </span>
                                    );
                                  }
                                  return <span>: {totalCasingMeters ? `${totalCasingMeters} meter` : ''}</span>;
                                })(), 
                                <div className="grid grid-cols-2 gap-2">
                                  <Input type="number" placeholder="10kg" className="h-6 text-xs" value={casing10kgQty} onChange={e => setCasing10kgQty(Number(e.target.value))} />
                                  <Input type="number" placeholder="6kg" className="h-6 text-xs" value={casing6kgQty} onChange={e => setCasing6kgQty(Number(e.target.value))} />
                                  <Input type="number" placeholder="Inner" className="h-6 text-xs" value={innerCasingQty} onChange={e => setInnerCasingQty(Number(e.target.value))} />
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
                          <tr className="border-b border-gray-300">
                            <td className="py-2 px-2 font-bold text-black align-top">15. End Cap Details</td>
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
                            <td className="py-2 px-2 font-bold text-black align-top">16. Average Yield</td>
                            <td className="py-2 px-2 text-black align-top">
                              {renderEditableCell('cr_en_yield', `: ${yieldLph ? `${yieldLph} Litres Per Hour (LPH)` : ''}`, <Input type="number" className="h-6 text-xs w-28" value={yieldLph} onChange={e => setYieldLph(Number(e.target.value))} />)}
                            </td>
                          </tr>
                          <tr className="border-b border-gray-300">
                            <td className="py-2 px-2 font-bold text-black align-top">17. Water Struck Zone</td>
                            <td className="py-2 px-2 text-black align-top">
                              {renderEditableCell('cr_en_zone', `: ${waterStruckZone ? (waterStruckZone.toLowerCase().includes('meter') ? waterStruckZone : `${waterStruckZone} meters`) : ''}`, <Input className="h-6 text-xs" value={waterStruckZone} onChange={e => setWaterStruckZone(e.target.value)} />)}
                            </td>
                          </tr>
                          <tr className="border-b border-gray-300">
                            <td className="py-2 px-2 font-bold text-black align-top">18. Static Water Level</td>
                            <td className="py-2 px-2 text-black align-top">
                              {renderEditableCell('cr_en_swl', `: ${staticWaterLevel !== '' && staticWaterLevel !== null && staticWaterLevel !== undefined ? `${staticWaterLevel} meters below ground level` : ''}`, <Input className="h-6 text-xs w-28" value={staticWaterLevel} onChange={e => setStaticWaterLevel(e.target.value)} />)}
                            </td>
                          </tr>
                          <tr className="border-b border-gray-300">
                            <td className="py-2 px-2 font-bold text-black align-top">19. Period of Work</td>
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
                            <td className="py-2 px-2 font-bold text-black align-top">20. Remarks</td>
                            <td className="py-2 px-2 text-black align-top">
                              {renderEditableCell('cr_en_remarks', `: ${remarks || ''}`, <Textarea className="min-h-[40px] text-xs p-1" value={remarks} onChange={e => setRemarks(e.target.value)} />)}
                            </td>
                          </tr>
                          {!isDeptRigWork && (
                            <tr className="border-b border-gray-300">
                              <td className="py-2 px-2 font-bold text-black align-top">21. Name of Contractor</td>
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
            <div className="flex flex-col justify-between min-h-[255mm] space-y-4">
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
                    {
                      qty: effectiveInnerCasingQty,
                      descId: 'fb_desc_inner_ml',
                      descValue: fbDescInnerMl,
                      descEl: <Input className="h-6 text-xs" value={fbDescInnerMl} onChange={e => setFbDescInnerMl(e.target.value)} />,
                      rateId: 'fb_r4',
                      rateValue: innerCasingRate.toFixed(2),
                      rateEl: <Input type="number" className="h-6 text-xs" value={innerCasingRate} onChange={e => setInnerCasingRate(Number(e.target.value))} />,
                      qtyId: 'fb_q4',
                      qtyText: `${effectiveInnerCasingQty} എണ്ണം`,
                      qtyEl: <Input type="number" className="h-6 text-xs" value={innerCasingQty} onChange={e => setInnerCasingQty(Number(e.target.value))} />,
                      total: innerCasingTotal
                    }
                  ];
                  const activeItemsMl = itemsMl.filter(item => item.qty > 0);

                  return (
                    <div className="flex flex-col justify-between h-full flex-1 space-y-4">
                      <div className="space-y-4">
                        <div className="text-center space-y-1.5 pb-2 border-b-2 border-black">
                          <h2 className="text-2xl font-bold">ഭൂജലവകുപ്പ്, ജില്ലാ ഓഫീസ്, {districtMl}</h2>
                          <h3 className="text-lg font-bold">കുഴൽകിണർ നിർമ്മാണം - പൂർത്തീകരണ റിപ്പോർട്ട്</h3>
                          <p className="text-xl font-bold">ഫൈനൽ ബിൽ</p>
                        </div>

                        <div className="flex flex-col space-y-1 text-base font-semibold py-1">
                          <div>ഫയൽ നമ്പർ: <strong className="text-lg">{fileNo}</strong></div>
                          <div></div>
                          <div>അപേക്ഷകൻ: <strong className="text-lg">{applicantName}</strong></div>
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
                                  <td className="border border-black py-2 px-2.5 text-right font-mono">{totalExpenditure.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                                </tr>
                              );

                              if (effectiveSubsidyAmount > 0 || isPrivateIrrigation) {
                                rows.push(
                                  <tr key="subsidy">
                                    <td className="border border-black py-2 px-2.5 text-center">{rows.length + 1}</td>
                                    <td className="border border-black py-2 px-2.5" colSpan={3}>
                                      {renderEditableCell('fb_subsidy', 
                                        isPrivateIrrigation 
                                          ? 'നാമമാത്ര / ചെറുകിട കർഷകർക്കുള്ള ധനസഹായം - ഡ്രില്ലിംഗ് ചാർജിന്റെ 50%  (ശുപാർശ ചെയ്ത ആഴമായ 120 മീറ്റര് വരെ മാത്രം)' 
                                          : 'നാമമാത്ര / ചെറുകിട കർഷകർക്കുള്ള ധനസഹായം', 
                                        <Input type="number" className="h-6 text-xs" value={effectiveSubsidyAmount} onChange={e => setSubsidyAmount(Number(e.target.value))} />
                                      )}
                                    </td>
                                    <td className="border border-black py-2 px-2.5 text-right font-mono">{effectiveSubsidyAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                                  </tr>
                                );
                              }

                              rows.push(
                                <tr key="net_payable" className="font-bold">
                                  <td className="border border-black py-2 px-2.5 text-center">{rows.length + 1}</td>
                                  <td className="border border-black py-2 px-2.5" colSpan={3}>കുഴൽകിണർ നിർമ്മാണ പ്രവൃത്തിക്ക് ഭൂജലവകുപ്പിന് ലഭിക്കേണ്ട തുക</td>
                                  <td className="border border-black py-2 px-2.5 text-right font-mono">{netPayableGwd.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                                </tr>
                              );

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
                                  <td className="border border-black py-2 px-2.5 text-right font-mono">{advanceDeposit.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                                </tr>
                              );

                              rows.push(
                                <tr key="balance" className="font-bold bg-gray-100">
                                  <td className="border border-black py-2 px-2.5 text-center">{rows.length + 1}</td>
                                  <td className="border border-black py-2 px-2.5" colSpan={3}>
                                    {balanceRefund >= 0 ? 'തിരികെ നൽകാനുള്ള ബാലൻസ് തുക (Refund)' : 'അപേക്ഷകനിൽ നിന്ന് ഈടാക്കേണ്ട ബാക്കി തുക'}
                                  </td>
                                  <td className="border border-black py-2 px-2.5 text-right font-mono">
                                    {Math.abs(balanceRefund).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                  </td>
                                </tr>
                              );

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
                    {
                      qty: effectiveInnerCasingQty,
                      descId: 'fb_desc_inner_en',
                      descValue: fbDescInnerEn,
                      descEl: <Input className="h-6 text-xs" value={fbDescInnerEn} onChange={e => setFbDescInnerEn(e.target.value)} />,
                      rateId: 'fb_en_r4',
                      rateValue: innerCasingRate.toFixed(2),
                      rateEl: <Input type="number" className="h-6 text-xs" value={innerCasingRate} onChange={e => setInnerCasingRate(Number(e.target.value))} />,
                      qtyId: 'fb_en_q4',
                      qtyText: `${effectiveInnerCasingQty} No`,
                      qtyEl: <Input type="number" className="h-6 text-xs" value={innerCasingQty} onChange={e => setInnerCasingQty(Number(e.target.value))} />,
                      total: innerCasingTotal
                    }
                  ];
                  const activeItemsEn = itemsEn.filter(item => item.qty > 0);

                  return (
                    <div className="flex flex-col justify-between h-full flex-1 space-y-4">
                      <div className="space-y-4">
                        <div className="text-center space-y-1.5 pb-2 border-b-2 border-black">
                          <h2 className="text-2xl font-bold uppercase">GROUND WATER DEPARTMENT, DISTRICT OFFICE, {district}</h2>
                          <h3 className="text-xl font-bold underline">FINAL BILL FOR BOREWELL CONSTRUCTION</h3>
                        </div>

                        <div className="flex flex-col space-y-1 text-base font-semibold py-1">
                          <div>File No: <strong className="text-lg">{fileNo}</strong></div>
                          <div></div>
                          <div>Applicant: <strong className="text-lg">{applicantName}</strong></div>
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
                                  <td className="border border-black py-2 px-2.5 text-right font-mono">{totalExpenditure.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                                </tr>
                              );

                              if (effectiveSubsidyAmount > 0 || isPrivateIrrigation) {
                                rowsEn.push(
                                  <tr key="subsidy_en">
                                    <td className="border border-black py-2 px-2.5 text-center">{rowsEn.length + 1}</td>
                                    <td className="border border-black py-2 px-2.5" colSpan={3}>
                                      {renderEditableCell('fb_en_subsidy', 
                                        isPrivateIrrigation 
                                          ? 'Subsidy for Marginal / Small Farmers - 50% of Drilling Charge (up to recommended depth of 120 meters)' 
                                          : 'Subsidy for Marginal / Small Farmers', 
                                        <Input type="number" className="h-6 text-xs" value={effectiveSubsidyAmount} onChange={e => setSubsidyAmount(Number(e.target.value))} />
                                      )}
                                    </td>
                                    <td className="border border-black py-2 px-2.5 text-right font-mono">{effectiveSubsidyAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                                  </tr>
                                );
                              }

                              rowsEn.push(
                                <tr key="net_payable_en" className="font-bold">
                                  <td className="border border-black py-2 px-2.5 text-center">{rowsEn.length + 1}</td>
                                  <td className="border border-black py-2 px-2.5" colSpan={3}>Net Amount Payable to Ground Water Department</td>
                                  <td className="border border-black py-2 px-2.5 text-right font-mono">{netPayableGwd.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                                </tr>
                              );

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
                                  <td className="border border-black py-2 px-2.5 text-right font-mono">{advanceDeposit.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                                </tr>
                              );

                              rowsEn.push(
                                <tr key="balance_en" className="font-bold bg-gray-100">
                                  <td className="border border-black py-2 px-2.5 text-center">{rowsEn.length + 1}</td>
                                  <td className="border border-black py-2 px-2.5" colSpan={3}>
                                    {balanceRefund >= 0 ? 'Balance Refund Amount Due to Applicant' : 'Balance Deficit Amount Payable by Applicant'}
                                  </td>
                                  <td className="border border-black py-2 px-2.5 text-right font-mono">
                                    {Math.abs(balanceRefund).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                  </td>
                                </tr>
                              );

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
                      {abstractRows.map((row, idx) => {
                        const siteBal = row.deposited - row.expenditure;
                        return (
                          <tr key={idx} id={`abs_ml_row_${idx}`}>
                            <td className="border border-black p-1.5 text-center">{idx + 1}</td>
                            <td className="border border-black p-1.5">
                              {renderEditableCell(`abs_ml_name_${idx}`, 
                                <span><strong>{row.siteName}</strong> ({row.location})</span>, 
                                <div className="flex gap-1">
                                  <Input className="h-6 text-xs" value={row.siteName} onChange={e => {
                                    const updated = [...abstractRows];
                                    updated[idx].siteName = e.target.value;
                                    setAbstractRows(updated);
                                  }} />
                                  <Input className="h-6 text-xs" value={row.location} onChange={e => {
                                    const updated = [...abstractRows];
                                    updated[idx].location = e.target.value;
                                    setAbstractRows(updated);
                                  }} />
                                </div>
                              )}
                            </td>
                            <td className="border border-black p-1.5 text-right font-mono">
                              {renderEditableCell(`abs_ml_dep_${idx}`, 
                                row.deposited.toLocaleString('en-IN', { minimumFractionDigits: 2 }), 
                                <Input type="number" className="h-6 text-xs" value={row.deposited} onChange={e => {
                                  const updated = [...abstractRows];
                                  updated[idx].deposited = Number(e.target.value);
                                  setAbstractRows(updated);
                                }} />
                              )}
                            </td>
                            <td className="border border-black p-1.5 text-right font-mono">
                              {renderEditableCell(`abs_ml_exp_${idx}`, 
                                row.expenditure.toLocaleString('en-IN', { minimumFractionDigits: 2 }), 
                                <Input type="number" className="h-6 text-xs" value={row.expenditure} onChange={e => {
                                  const updated = [...abstractRows];
                                  updated[idx].expenditure = Number(e.target.value);
                                  setAbstractRows(updated);
                                }} />
                              )}
                            </td>
                            <td className="border border-black p-1.5 text-right font-mono">{siteBal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                          </tr>
                        );
                      })}
                      <tr className="font-bold bg-gray-100">
                        <td className="border border-black p-1.5 text-center" colSpan={2}>ആകെ തുക (GRAND TOTAL)</td>
                        <td className="border border-black p-1.5 text-right font-mono">{absTotalDeposited.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                        <td className="border border-black p-1.5 text-right font-mono">{absTotalExpenditure.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                        <td className="border border-black p-1.5 text-right font-mono">{absTotalBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                      </tr>
                    </tbody>
                  </table>

                  <p className="text-xs font-semibold pt-2">
                    അടയ്ക്കേണ്ട / തിരികെ നൽകേണ്ട ആകെ ബാലൻസ് തുക അക്ഷരത്തിൽ: <span className="underline">{numberToWordsMalayalam(Math.abs(balanceRefund))}</span>
                  </p>

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
                        <td className="border border-black py-1.5 w-10">Sl No</td>
                        <td className="border border-black py-1.5">Site Name & Location</td>
                        <td className="border border-black py-1.5 w-28 text-right pr-2">Deposit Paid (Rs)</td>
                        <td className="border border-black py-1.5 w-28 text-right pr-2">Expenditure (Rs)</td>
                        <td className="border border-black py-1.5 w-28 text-right pr-2">Balance Refund (Rs)</td>
                      </tr>
                    </thead>
                    <tbody>
                      {abstractRows.map((row, idx) => {
                        const siteBal = row.deposited - row.expenditure;
                        return (
                          <tr key={idx} id={`abs_en_row_${idx}`}>
                            <td className="border border-black p-1.5 text-center">{idx + 1}</td>
                            <td className="border border-black p-1.5">
                              {renderEditableCell(`abs_en_name_${idx}`, 
                                <span><strong>{row.siteName}</strong> ({row.location})</span>, 
                                <div className="flex gap-1">
                                  <Input className="h-6 text-xs" value={row.siteName} onChange={e => {
                                    const updated = [...abstractRows];
                                    updated[idx].siteName = e.target.value;
                                    setAbstractRows(updated);
                                  }} />
                                  <Input className="h-6 text-xs" value={row.location} onChange={e => {
                                    const updated = [...abstractRows];
                                    updated[idx].location = e.target.value;
                                    setAbstractRows(updated);
                                  }} />
                                </div>
                              )}
                            </td>
                            <td className="border border-black p-1.5 text-right font-mono">
                              {renderEditableCell(`abs_en_dep_${idx}`, 
                                row.deposited.toLocaleString('en-IN', { minimumFractionDigits: 2 }), 
                                <Input type="number" className="h-6 text-xs" value={row.deposited} onChange={e => {
                                  const updated = [...abstractRows];
                                  updated[idx].deposited = Number(e.target.value);
                                  setAbstractRows(updated);
                                }} />
                              )}
                            </td>
                            <td className="border border-black p-1.5 text-right font-mono">
                              {renderEditableCell(`abs_en_exp_${idx}`, 
                                row.expenditure.toLocaleString('en-IN', { minimumFractionDigits: 2 }), 
                                <Input type="number" className="h-6 text-xs" value={row.expenditure} onChange={e => {
                                  const updated = [...abstractRows];
                                  updated[idx].expenditure = Number(e.target.value);
                                  setAbstractRows(updated);
                                }} />
                              )}
                            </td>
                            <td className="border border-black p-1.5 text-right font-mono">{siteBal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                          </tr>
                        );
                      })}
                      <tr className="font-bold bg-gray-100">
                        <td className="border border-black p-1.5 text-center" colSpan={2}>GRAND TOTAL</td>
                        <td className="border border-black p-1.5 text-right font-mono">{absTotalDeposited.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                        <td className="border border-black p-1.5 text-right font-mono">{absTotalExpenditure.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                        <td className="border border-black p-1.5 text-right font-mono">{absTotalBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
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
            <div className="flex flex-col justify-between min-h-[255mm] space-y-4 -m-6 sm:-m-10 pt-[1.5cm] pb-[1.5cm] pl-[2.54cm] pr-[2cm] print:m-0 print:pt-[1.5cm] print:pb-[1.5cm] print:pl-[2.54cm] print:pr-[2cm] text-[12pt] leading-[1.5]">
              <style>{`
                @page {
                  size: A4 portrait;
                  margin: 0 !important;
                }
              `}</style>
              <div className="space-y-4">
                <div className="text-center space-y-1 pb-2 border-b-2 border-black">
                  <h2 className="text-[14pt] font-bold uppercase tracking-wider">
                    PROCEEDINGS OF THE DISTRICT OFFICER, GROUND WATER DEPARTMENT, {district.toUpperCase()}
                  </h2>
                  {renderEditableCell('proc_officer', 
                    <p className="text-[12pt] italic font-semibold text-center">Present: {officerName}, {officerDesignation}</p>,
                    <div className="flex gap-1">
                      <Input className="h-6 text-[12pt]" value={officerName} onChange={e => setOfficerName(e.target.value)} />
                      <Input className="h-6 text-[12pt]" value={officerDesignation} onChange={e => setOfficerDesignation(e.target.value)} />
                    </div>
                  )}
                </div>

                <div className="text-[12pt] space-y-3 py-2 leading-[1.5]">
                  <div className="grid grid-cols-[60px_1fr] gap-1 items-start">
                    <span className="font-bold">Sub:</span>
                    {renderEditableCell('proc_sub', <span>{proceedingsSubject}</span>, <Textarea className="min-h-[45px] text-[12pt]" value={proceedingsSubject} onChange={e => setProceedingsSubject(e.target.value)} />)}
                  </div>
                  <div className="grid grid-cols-[60px_1fr] gap-1 items-start">
                    <span className="font-bold">Ref:</span>
                    {renderEditableCell('proc_ref', 
                      <div>
                        {formatDatesInText(proceedingsRef1)}<br />
                        {formatDatesInText(proceedingsRef2)}
                      </div>,
                      <div className="space-y-1">
                        <Input className="h-6 text-[12pt]" value={proceedingsRef1} onChange={e => setProceedingsRef1(e.target.value)} />
                        <Input className="h-6 text-[12pt]" value={proceedingsRef2} onChange={e => setProceedingsRef2(e.target.value)} />
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex justify-between font-bold border-y border-black py-1 text-[12pt]">
                  {renderEditableCell('proc_ordNo', <span>Order No. {orderNo}</span>, <Input className="h-6 text-[12pt] w-48" value={orderNo} onChange={e => setOrderNo(e.target.value)} />)}
                  {renderEditableCell('proc_ordDate', <span>Dated: {orderDate}</span>, <Input className="h-6 text-[12pt] w-36" value={orderDate} onChange={e => setOrderDate(e.target.value)} />)}
                </div>

                <div className="text-[12pt] space-y-4 leading-[1.5] text-justify pt-2">
                  <div className="p-1 rounded hover:bg-slate-50 transition-colors">
                    {renderEditableCell('proc_para1',
                      <span>
                        As per the 1st reference cited above, <strong>{applicantName}</strong> deposited an amount of <strong>Rs. {advanceDeposit.toLocaleString('en-IN')}/-</strong> vide DD ({formatDatesInText(ddDetails)}) for the construction of a borewell at their premises.
                      </span>,
                      <div className="flex gap-1">
                        <Input type="number" className="h-6 text-[12pt]" value={advanceDeposit} onChange={e => setAdvanceDeposit(Number(e.target.value))} />
                        <Input className="h-6 text-[12pt]" value={ddDetails} onChange={e => setDdDetails(e.target.value)} />
                      </div>
                    )}
                  </div>
                  <div className="p-1 rounded hover:bg-slate-50 transition-colors">
                    {renderEditableCell('proc_para2',
                      <span>
                        Vide the 2nd reference cited, it has been reported that the work was completed using the Department&apos;s Rig unit. The total expenditure incurred by the department is <strong>Rs. {netPayableGwd.toLocaleString('en-IN')}/-</strong>, which is to be remitted to the Department&apos;s revenue head <code>0702-02-800-99</code>, &quot;Other Receipts&quot;. The balance amount of <strong>Rs. {balanceRefund.toLocaleString('en-IN')}/-</strong> is to be refunded to the applicant.
                      </span>,
                      <div className="flex gap-1">
                        <Input type="number" placeholder="Net Payable" className="h-6 text-[12pt]" value={drillingTotal + casing10kgTotal + casing6kgTotal + innerCasingTotal} onChange={e => setDrillingRate(Number(e.target.value))} />
                        <Input type="number" placeholder="Refund" className="h-6 text-[12pt]" value={advanceDeposit - netPayableGwd} onChange={e => setAdvanceDeposit(Number(e.target.value))} />
                      </div>
                    )}
                  </div>
                  <div className="p-1 rounded hover:bg-slate-50 transition-colors">
                    {renderEditableCell('proc_para3',
                      <span>
                        In these circumstances, sanction is hereby accorded to refund an amount of <strong>Rs. {balanceRefund.toLocaleString('en-IN')}/- ({numberToWordsEnglish(balanceRefund)})</strong> being the balance amount due to applicant in connection with the borewell construction, to their <strong>Bank Account No. {bankAccountNo || '85829024542'}, IFSC: {bankIfsc || 'SBIN0012880'} of {bankName === 'SBI' ? 'State Bank of India' : (bankName || 'State Bank of India')}{bankBranch ? `, ${bankBranch} branch` : ''}</strong>. Sanction is also hereby accorded to remit an amount of <strong>Rs. {netPayableGwd.toLocaleString('en-IN')}/- ({numberToWordsEnglish(netPayableGwd)})</strong> to Department Revenue head <code>0702-02-800-99-other receipts</code>, being the Borewell construction charges.
                      </span>,
                      <div className="grid grid-cols-4 gap-1">
                        <Input className="h-6 text-[12pt]" placeholder="Account No" value={bankAccountNo} onChange={e => setBankAccountNo(e.target.value)} />
                        <Input className="h-6 text-[12pt]" placeholder="IFSC" value={bankIfsc} onChange={e => setBankIfsc(e.target.value)} />
                        <Input className="h-6 text-[12pt]" placeholder="Bank Name" value={bankName} onChange={e => setBankName(e.target.value)} />
                        <Input className="h-6 text-[12pt]" placeholder="Branch" value={bankBranch} onChange={e => setBankBranch(e.target.value)} />
                      </div>
                    )}
                  </div>
                  <div className="p-1 rounded hover:bg-slate-50 transition-colors">
                    {renderEditableCell('proc_para5',
                      <span>
                        The expenditure shall be met from the gross amount of Rs. {advanceDeposit.toLocaleString('en-IN')}/- deposited by the applicant into STSB Account of the District Officer, Ground Water Department, {district}.
                      </span>,
                      <Input type="number" className="h-6 text-[12pt] w-48" placeholder="STSB Deposit" value={advanceDeposit} onChange={e => setAdvanceDeposit(Number(e.target.value))} />
                    )}
                  </div>
                </div>
              </div>

              <div className="pt-10 flex justify-between items-end text-[12pt] leading-[1.5]">
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
                        {ucRows.map((row, idx) => {
                          const siteBal = row.deposited - row.expenditure;
                          return (
                            <tr key={idx} id={`uc_ml_row_${idx}`}>
                              <td className="border border-black p-1.5 text-center">{idx + 1}</td>
                              <td className="border border-black p-1.5">
                                {renderEditableCell(`uc_ml_desc_${idx}`, 
                                  <span>{row.description}</span>, 
                                  <Input className="h-6 text-xs" value={row.description} onChange={e => {
                                    const updated = [...ucRows];
                                    updated[idx].description = e.target.value;
                                    setUcRows(updated);
                                  }} />
                                )}
                              </td>
                              <td className="border border-black p-1.5 text-right font-mono">
                                {renderEditableCell(`uc_ml_dep_${idx}`, 
                                  row.deposited.toLocaleString('en-IN', { minimumFractionDigits: 2 }), 
                                  <Input type="number" className="h-6 text-xs" value={row.deposited} onChange={e => {
                                    const updated = [...ucRows];
                                    updated[idx].deposited = Number(e.target.value);
                                    setUcRows(updated);
                                  }} />
                                )}
                              </td>
                              <td className="border border-black p-1.5 text-right font-mono">
                                {renderEditableCell(`uc_ml_exp_${idx}`, 
                                  row.expenditure.toLocaleString('en-IN', { minimumFractionDigits: 2 }), 
                                  <Input type="number" className="h-6 text-xs" value={row.expenditure} onChange={e => {
                                    const updated = [...ucRows];
                                    updated[idx].expenditure = Number(e.target.value);
                                    setUcRows(updated);
                                  }} />
                                )}
                              </td>
                              <td className="border border-black p-1.5 text-right font-mono">{siteBal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                            </tr>
                          );
                        })}
                        <tr className="font-bold bg-gray-100">
                          <td className="border border-black p-1.5 text-center" colSpan={2}>ആകെ (TOTAL)</td>
                          <td className="border border-black p-1.5 text-right font-mono">{ucTotalDeposited.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                          <td className="border border-black p-1.5 text-right font-mono">{ucTotalExpenditure.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                          <td className="border border-black p-1.5 text-right font-mono">{ucTotalBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
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
                        {ucRows.map((row, idx) => {
                          const siteBal = row.deposited - row.expenditure;
                          return (
                            <tr key={idx} id={`uc_en_row_${idx}`}>
                              <td className="border border-black p-1.5 text-center">{idx + 1}</td>
                              <td className="border border-black p-1.5">
                                {renderEditableCell(`uc_en_desc_${idx}`, 
                                  <span>{row.description}</span>, 
                                  <Input className="h-6 text-xs" value={row.description} onChange={e => {
                                    const updated = [...ucRows];
                                    updated[idx].description = e.target.value;
                                    setUcRows(updated);
                                  }} />
                                )}
                              </td>
                              <td className="border border-black p-1.5 text-right font-mono">
                                {renderEditableCell(`uc_en_dep_${idx}`, 
                                  row.deposited.toLocaleString('en-IN', { minimumFractionDigits: 2 }), 
                                  <Input type="number" className="h-6 text-xs" value={row.deposited} onChange={e => {
                                    const updated = [...ucRows];
                                    updated[idx].deposited = Number(e.target.value);
                                    setUcRows(updated);
                                  }} />
                                )}
                              </td>
                              <td className="border border-black p-1.5 text-right font-mono">
                                {renderEditableCell(`uc_en_exp_${idx}`, 
                                  row.expenditure.toLocaleString('en-IN', { minimumFractionDigits: 2 }), 
                                  <Input type="number" className="h-6 text-xs" value={row.expenditure} onChange={e => {
                                    const updated = [...ucRows];
                                    updated[idx].expenditure = Number(e.target.value);
                                    setUcRows(updated);
                                  }} />
                                )}
                              </td>
                              <td className="border border-black p-1.5 text-right font-mono">{siteBal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                            </tr>
                          );
                        })}
                        <tr className="font-bold bg-gray-100">
                          <td className="border border-black p-1.5 text-center" colSpan={2}>TOTAL</td>
                          <td className="border border-black p-1.5 text-right font-mono">{ucTotalDeposited.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                          <td className="border border-black p-1.5 text-right font-mono">{ucTotalExpenditure.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                          <td className="border border-black p-1.5 text-right font-mono">{ucTotalBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
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
