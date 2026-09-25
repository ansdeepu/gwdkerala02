// src/components/investigation/InvestigationReportViewer.tsx
"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Printer, 
  Copy, 
  Check, 
  Save, 
  Edit3, 
  Eye, 
  FileText, 
  ArrowLeft,
  Loader2
} from "lucide-react";
import { PrintStyleToolbar, DEFAULT_PRINT_STYLES, type PrintStyleSettings } from "@/components/shared/PrintStyleToolbar";
import { MalayalamInput } from "@/components/ui/malayalam-input-helper";
import { printDocument, copyOfficialTable } from "@/lib/print-utils";
import { useDataStore } from "@/hooks/use-data-store";
import { useAuth } from "@/hooks/useAuth";
import { useFileEntries } from "@/hooks/useFileEntries";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import type { DataEntryFormData, SiteDetailFormData } from "@/lib/schemas";

const DISTRICT_ML_MAP: Record<string, string> = {
  thiruvananthapuram: 'തിരുവനന്തപുരം',
  kollam: 'കൊല്ലം',
  pathanamthitta: 'പത്തനംതിട്ട',
  alappuzha: 'ആലപ്പുഴ',
  kottayam: 'കോട്ടയം',
  idukki: 'ഇടുക്കി',
  ernakulam: 'എറണാകുളം',
  thrissur: 'തൃശ്ശൂർ',
  palakkad: 'പാലക്കാട്',
  malappuram: 'മലപ്പുറം',
  kozhikode: 'കോഴിക്കോട്',
  wayanad: 'വയനാട്',
  kannur: 'കണ്ണൂർ',
  kasaragod: 'കാസർഗോഡ്',
};

const getDistrictMalayalam = (dist: string | undefined | null): string => {
  if (!dist) return 'കൊല്ലം';
  const clean = dist.toLowerCase().trim();
  return DISTRICT_ML_MAP[clean] || dist;
};

export type InvestigationReportDocType = "investigation_report" | "feasibility_report";

export interface InvestigationReportViewerProps {
  entry: DataEntryFormData;
  initialDocType?: InvestigationReportDocType;
  initialSiteIndex?: number;
  returnPath?: string;
  onSaveOverrides?: (updatedEntry: DataEntryFormData) => Promise<void> | void;
}

const formatDateDDMMYYYY = (dateVal: any): string => {
  if (!dateVal) return "";
  try {
    if (typeof dateVal === "string") {
      const match = dateVal.match(/^(\d{4})-(\d{2})-(\d{2})/);
      if (match) {
        return `${match[3]}/${match[2]}/${match[1]}`;
      }
    }
    const d = new Date(dateVal);
    if (!isNaN(d.getTime())) {
      const day = String(d.getDate()).padStart(2, "0");
      const month = String(d.getMonth() + 1).padStart(2, "0");
      const year = d.getFullYear();
      return `${day}/${month}/${year}`;
    }
  } catch (e) {
    // fallback
  }
  return String(dateVal || "");
};

const WELL_TYPE_OPTIONS = ["Dug well", "Filter Point well", "Tube well", "Bore well"];
const PURPOSE_OPTIONS = ["Domestic", "Irrigation", "Industry", "Institution"];

export default function InvestigationReportViewer({
  entry,
  initialDocType = "investigation_report",
  initialSiteIndex = 0,
  returnPath = "/dashboard/gw-investigation",
  onSaveOverrides,
}: InvestigationReportViewerProps) {
  const router = useRouter();
  const { officeAddress, selectedOffice, allStaffMembers } = useDataStore();
  const { user } = useAuth() as any;
  const { updateFileEntry } = useFileEntries();
  const { toast } = useToast();

  const [activeDocType, setActiveDocType] = useState<InvestigationReportDocType>(initialDocType);
  const [selectedSiteIndex, setSelectedSiteIndex] = useState<number>(initialSiteIndex);
  const [isEditMode, setIsEditMode] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [styleSettings, setStyleSettings] = useState<PrintStyleSettings>(DEFAULT_PRINT_STYLES);

  // Sync initial doc type and site index when props change
  useEffect(() => {
    if (initialDocType) setActiveDocType(initialDocType);
  }, [initialDocType]);

  useEffect(() => {
    if (typeof initialSiteIndex === "number") setSelectedSiteIndex(initialSiteIndex);
  }, [initialSiteIndex]);

  const sites = useMemo(() => {
    if (!entry || !entry.siteDetails || entry.siteDetails.length === 0) {
      return [
        {
          nameOfSite: entry?.applicantName || "Site 1",
          localSelfGovt: "",
          constituency: "",
          typeOfWell: "Tube Well",
          purpose: "Domestic",
          feasibility: "Yes",
          dateOfInvestigation: "",
        } as SiteDetailFormData,
      ];
    }
    return entry.siteDetails;
  }, [entry]);

  const currentSite = sites[selectedSiteIndex] || sites[0] || ({} as SiteDetailFormData);

  // Office Location & Details
  const district = entry?.officeLocation || selectedOffice || user?.officeLocation || officeAddress?.officeLocation || "Kollam";
  const districtMl = getDistrictMalayalam(district);
  const officeCode = officeAddress?.officeCode || "GWDKLM";
  const officePhone = officeAddress?.phoneNo || "0474-2790313";
  const officeEmail = officeAddress?.email || "gwdklm@gmail.com";

  // Form State for Report 1: Hydrogeological Investigation Report
  const [invReportState, setInvReportState] = useState({
    districtName: district.toUpperCase(),
    categoryText: entry?.category ? `${entry.category} Category` : "Government / Local body / Private",
    applicantName: entry?.applicantName || "",
    applicantAddress: (entry as any)?.applicantAddress || (entry as any)?.address || "",
    fileNo: entry?.fileNo || "",
    dateOfInvestigation: formatDateDDMMYYYY(currentSite?.dateOfInvestigation || (entry as any)?.dateOfApplication),
    typeOfWell: currentSite?.typeOfWell || "Tube Well",
    purpose: currentSite?.purpose || "Domestic",
    talukOrBlock: (currentSite as any)?.taluk || (currentSite as any)?.block || (currentSite as any)?.arsBlock || "",
    localSelfGovt: currentSite?.localSelfGovt || "",
    villageAndWard: (currentSite as any)?.village || (currentSite as any)?.wardNo ? `${(currentSite as any)?.village || ''}${(currentSite as any)?.wardNo ? ` Ward: ${(currentSite as any).wardNo}` : ''}` : "",
    constituency: currentSite?.constituency || "",
    latitude: currentSite?.latitude ? String(currentSite.latitude) : "",
    longitude: currentSite?.longitude ? String(currentSite.longitude) : "",
    surveyNoAndArea: (currentSite as any)?.surveyNo || (currentSite as any)?.plotArea ? `${(currentSite as any)?.surveyNo ? `Sy No. ${(currentSite as any).surveyNo}` : ''}${(currentSite as any)?.plotArea ? `, Area: ${(currentSite as any).plotArea}` : ''}` : "",
    geomorphology: "The land has almost leveled topography.",
    geologyHydrogeology: currentSite?.hydrogeologicalRemarks || "The land covers with top soil / sand followed by weathered formation and potential aquifer zone.",
    nearbyWells: "Nearby openwells and tubewells/borewells are yielding satisfactorily.",
    vesConducted: currentSite?.vesRequired === "Yes" ? `Yes - Conducted on ${formatDateDDMMYYYY(currentSite?.vesDate)} by ${currentSite?.vesInvestigator || 'Geophysicist'}. ${currentSite?.geophysicalRemarks || ''}` : "No",
    recommendation: currentSite?.feasibility === "No" 
      ? "From hydrogeological investigation, the proposed site is found not feasible for groundwater extraction."
      : `From hydrogeology this site is good for ${currentSite?.typeOfWell || 'well construction'}.`,
    surveyLocation: currentSite?.surveyLocation || "The point pegmarked at the recommended location in the plot.",
    surveyRecommendedDiameter: currentSite?.surveyRecommendedDiameter || '6" (150 mm)',
    surveyRecommendedTD: currentSite?.surveyRecommendedTD ? `${currentSite.surveyRecommendedTD} m` : "150 m",
    surveyRecommendedSlottedPipe: currentSite?.surveyRecommendedSlottedPipe 
      ? `${currentSite.surveyRecommendedSlottedPipe} m` 
      : (currentSite?.surveyRecommendedCasingPipe ? `${currentSite.surveyRecommendedCasingPipe} m` : "21 m"),
    accessibilityNotes: currentSite?.surveyRemarks || "Check for rotary rig / drilling rig accessibility at site.",
    juniorHydrogeologistName: currentSite?.nameOfInvestigator || "",
    hydrogeologistName: allStaffMembers?.find(s => s.designation === "Hydrogeologist")?.name || "Hydrogeologist",
  });

  // Form State for Report 2: Feasibility Report (Malayalam Letter)
  const [feasibilityState, setFeasibilityState] = useState({
    fileNoMl: entry?.fileNo ? (entry.fileNo.toUpperCase().startsWith("GWD") ? entry.fileNo : `${officeCode}/${entry.fileNo}`) : `നം. ${officeCode}/310/26-T`,
    letterDate: formatDateDDMMYYYY(new Date()),
    officeHeaderDistrict: districtMl,
    phoneNo: officePhone,
    emailId: officeEmail,
    fromOfficer: "ജില്ലാ ഓഫീസർ",
    fromOfficeName: `ഭൂജല വകുപ്പ്, ${districtMl}`,
    toApplicantName: (entry as any)?.applicantNameMl || entry?.applicantName || "",
    toApplicantAddress: (entry as any)?.applicantAddressMl || (entry as any)?.applicantAddress || (entry as any)?.address || "",
    subjectText: `ഭൂജലവകുപ്പ് - ${districtMl} - ${currentSite?.typeOfWell ? `${currentSite.typeOfWell} (കുഴൽക്കിണർ)` : 'കുഴൽകിണർ'} നിർമ്മാണം - ഫീസിബിലിറ്റി റിപ്പോർട്ട് അയക്കുന്നത് - സംബന്ധിച്ച്.`,
    referenceText: `താങ്കളുടെ ${formatDateDDMMYYYY((entry as any)?.dateOfApplication || (entry as any)?.dateOfLetter || currentSite?.dateOfInvestigation || new Date())} തീയതിയിലെ അപേക്ഷ / കത്ത്.`,
    mainBodyText: `മേൽ സൂചന പ്രകാരം അപേക്ഷയിൽ സൂചിപ്പിച്ചിട്ടുള്ള ${currentSite?.localSelfGovt ? `${currentSite.localSelfGovt} പഞ്ചായത്ത് / പരിധിയിൽപ്പെട്ട ` : ''}${currentSite?.nameOfSite || 'സ്ഥലത്ത്'} കുഴൽ കിണർ നിർമ്മിക്കുന്നതിനുവേണ്ടി വിശദമായ ഭൂജലപര്യവേഷണം നടത്തിയതിൽ നിന്നും പ്രസ്തുത സ്ഥലത്ത് ${currentSite?.typeOfWell || 'കുഴൽക്കിണർ'} നിർമ്മിക്കുന്നതിന് ${currentSite?.feasibility === 'No' ? 'അനുയോജ്യമല്ല എന്ന് കണ്ടെത്തിയിരിക്കുന്നു.' : 'അനുയോജ്യമാണെന്ന് കണ്ടെത്തിയിരിക്കുന്നു.'}`,
    locPoint1: currentSite?.surveyLocation || "സ്ഥലത്തിന്റെ അനുയോജ്യമായ ഭാഗത്ത് അടയാളപ്പെടുത്തിയിരിക്കുന്നു.",
    locPoint2Dia: currentSite?.surveyRecommendedDiameter || '6" (150 mm)',
    locPoint3TD: currentSite?.surveyRecommendedTD ? `${currentSite.surveyRecommendedTD} മീറ്റർ` : "150 മീറ്റർ",
    locPoint4Pipe: currentSite?.surveyRecommendedSlottedPipe 
      ? `${currentSite.surveyRecommendedSlottedPipe} മീറ്റർ (സ്ലോട്ടഡ് പൈപ്പ്)` 
      : (currentSite?.surveyRecommendedCasingPipe ? `${currentSite.surveyRecommendedCasingPipe} മീറ്റർ (കെയ്സിംഗ് പൈപ്പ്)` : "21 മീറ്റർ"),
    nbText: "NB:- മേൽ പറഞ്ഞ ഗവേഷണഫലം വിശദമായ ഭൂജലപര്യവേഷണത്തിന്റെ അടിസ്ഥാനത്തിലാണെങ്കിലും ചില സാങ്കേതികകാരണങ്ങളാൽ ചുരുക്കം ചിലത് പരാജയപ്പെടുന്നതായി കണ്ടുവരുന്നുണ്ട്. അപ്രകാരം പരാജയപ്പെടുകയാണെങ്കിൽ യാതൊരു വിധ നഷ്ടപരിഹാരവും അനുവദിക്കുന്നതല്ല. ബഹു. സുപ്രീം കോടതി വിധിന്യായം WP(C)36/09 പ്രകാരം പരാജയപ്പെടുന്ന കിണറുകളിലെ അപകട സാധ്യത കണക്കിലെടുത്ത്, അവ മൂടേണ്ടതാകുന്നു. ഗ്രാമപഞ്ചായത്ത് കെട്ടിട നിർമ്മാണ ചട്ടങ്ങൾക്കും നിയമങ്ങൾക്കും വിധേയമായി മാത്രമേ കുഴൽക്കിണർ നിർമ്മാണം നടത്താൻ പാടുള്ളൂ.",
    signatoryTitle: "ജില്ലാ ഓഫീസർ.",
  });

  // Load / Compute default state whenever entry or selectedSiteIndex changes
  const resetToComputedDefaults = useCallback(() => {
    if (!entry) return;

    const site = sites[selectedSiteIndex] || sites[0] || ({} as SiteDetailFormData);
    const saved = (entry as any)?.printOverrides?.investigation?.[selectedSiteIndex] || {};

    const computedInv = {
      districtName: saved.districtName || district.toUpperCase(),
      categoryText: saved.categoryText || (entry?.category ? `${entry.category} Category` : "Government / Local body / Private"),
      applicantName: saved.applicantName || entry?.applicantName || "",
      applicantAddress: saved.applicantAddress || (entry as any)?.applicantAddress || (entry as any)?.address || "",
      fileNo: saved.fileNo || entry?.fileNo || "",
      dateOfInvestigation: saved.dateOfInvestigation || formatDateDDMMYYYY(site?.dateOfInvestigation || (entry as any)?.dateOfApplication),
      typeOfWell: saved.typeOfWell || site?.typeOfWell || "Tube Well",
      purpose: saved.purpose || site?.purpose || "Domestic",
      talukOrBlock: saved.talukOrBlock || (site as any)?.taluk || (site as any)?.block || (site as any)?.arsBlock || "",
      localSelfGovt: saved.localSelfGovt || site?.localSelfGovt || "",
      villageAndWard: saved.villageAndWard || ((site as any)?.village || (site as any)?.wardNo ? `${(site as any)?.village || ''}${(site as any)?.wardNo ? ` Ward: ${(site as any).wardNo}` : ''}` : ""),
      constituency: saved.constituency || site?.constituency || "",
      latitude: saved.latitude || (site?.latitude ? String(site.latitude) : ""),
      longitude: saved.longitude || (site?.longitude ? String(site.longitude) : ""),
      surveyNoAndArea: saved.surveyNoAndArea || ((site as any)?.surveyNo || (site as any)?.plotArea ? `${(site as any)?.surveyNo ? `Sy No. ${(site as any).surveyNo}` : ''}${(site as any)?.plotArea ? `, Area: ${(site as any).plotArea}` : ''}` : ""),
      geomorphology: saved.geomorphology || "The land has almost leveled topography.",
      geologyHydrogeology: saved.geologyHydrogeology || site?.hydrogeologicalRemarks || "The land covers with top soil / sand followed by weathered layer and potential aquifer zone.",
      nearbyWells: saved.nearbyWells || "Nearby openwells and tubewells/borewells are yielding satisfactorily.",
      vesConducted: saved.vesConducted || (site?.vesRequired === "Yes" ? `Yes - Conducted on ${formatDateDDMMYYYY(site?.vesDate)} by ${site?.vesInvestigator || 'Geophysicist'}. ${site?.geophysicalRemarks || ''}` : "No"),
      recommendation: saved.recommendation || (site?.feasibility === "No" 
        ? "From hydrogeological investigation, the proposed site is found not feasible for groundwater extraction."
        : `From hydrogeology this site is good for ${site?.typeOfWell || 'well construction'}.`),
      surveyLocation: saved.surveyLocation || site?.surveyLocation || "The point pegmarked at the recommended location in the plot.",
      surveyRecommendedDiameter: saved.surveyRecommendedDiameter || site?.surveyRecommendedDiameter || '6" (150 mm)',
      surveyRecommendedTD: saved.surveyRecommendedTD || (site?.surveyRecommendedTD ? `${site.surveyRecommendedTD} m` : "150 m"),
      surveyRecommendedSlottedPipe: saved.surveyRecommendedSlottedPipe || (site?.surveyRecommendedSlottedPipe 
        ? `${site.surveyRecommendedSlottedPipe} m` 
        : (site?.surveyRecommendedCasingPipe ? `${site.surveyRecommendedCasingPipe} m` : "21 m")),
      accessibilityNotes: saved.accessibilityNotes || site?.surveyRemarks || "Check for rotary rig / drilling rig accessibility at site.",
      juniorHydrogeologistName: saved.juniorHydrogeologistName || site?.nameOfInvestigator || "",
      hydrogeologistName: saved.hydrogeologistName || allStaffMembers?.find(s => s.designation === "Hydrogeologist")?.name || "Hydrogeologist",
    };

    const savedFeas = (entry as any)?.printOverrides?.feasibility?.[selectedSiteIndex] || {};

    const computedFeas = {
      fileNoMl: savedFeas.fileNoMl || (entry?.fileNo ? (entry.fileNo.toUpperCase().startsWith("GWD") ? entry.fileNo : `${officeCode}/${entry.fileNo}`) : `നം. ${officeCode}/310/26-T`),
      letterDate: savedFeas.letterDate || formatDateDDMMYYYY(new Date()),
      officeHeaderDistrict: savedFeas.officeHeaderDistrict || districtMl,
      phoneNo: savedFeas.phoneNo || officePhone,
      emailId: savedFeas.emailId || officeEmail,
      fromOfficer: savedFeas.fromOfficer || "ജില്ലാ ഓഫീസർ",
      fromOfficeName: savedFeas.fromOfficeName || `ഭൂജല വകുപ്പ്, ${districtMl}`,
      toApplicantName: savedFeas.toApplicantName || (entry as any)?.applicantNameMl || entry?.applicantName || "",
      toApplicantAddress: savedFeas.toApplicantAddress || (entry as any)?.applicantAddressMl || (entry as any)?.applicantAddress || (entry as any)?.address || "",
      subjectText: savedFeas.subjectText || `ഭൂജലവകുപ്പ് - ${districtMl} - ${site?.typeOfWell ? `${site.typeOfWell} (കുഴൽക്കിണർ)` : 'കുഴൽകിണർ'} നിർമ്മാണം - ഫീസിബിലിറ്റി റിപ്പോർട്ട് അയക്കുന്നത് - സംബന്ധിച്ച്.`,
      referenceText: savedFeas.referenceText || `താങ്കളുടെ ${formatDateDDMMYYYY((entry as any)?.dateOfApplication || (entry as any)?.dateOfLetter || site?.dateOfInvestigation || new Date())} തീയതിയിലെ അപേക്ഷ / കത്ത്.`,
      mainBodyText: savedFeas.mainBodyText || `മേൽ സൂചന പ്രകാരം അപേക്ഷയിൽ സൂചിപ്പിച്ചിട്ടുള്ള ${site?.localSelfGovt ? `${site.localSelfGovt} പഞ്ചായത്ത് / പരിധിയിൽപ്പെട്ട ` : ''}${site?.nameOfSite || 'സ്ഥലത്ത്'} കുഴൽ കിണർ നിർമ്മിക്കുന്നതിനുവേണ്ടി വിശദമായ ഭൂജലപര്യവേഷണം നടത്തിയതിൽ നിന്നും പ്രസ്തുത സ്ഥലത്ത് ${site?.typeOfWell || 'കുഴൽക്കിണർ'} നിർമ്മിക്കുന്നതിന് ${site?.feasibility === 'No' ? 'അനുയോജ്യമല്ല എന്ന് കണ്ടെത്തിയിരിക്കുന്നു.' : 'അനുയോജ്യമാണെന്ന് കണ്ടെത്തിയിരിക്കുന്നു.'}`,
      locPoint1: savedFeas.locPoint1 || site?.surveyLocation || "സ്ഥലത്തിന്റെ അനുയോജ്യമായ ഭാഗത്ത് അടയാളപ്പെടുത്തിയിരിക്കുന്നു.",
      locPoint2Dia: savedFeas.locPoint2Dia || site?.surveyRecommendedDiameter || '6" (150 mm)',
      locPoint3TD: savedFeas.locPoint3TD || (site?.surveyRecommendedTD ? `${site.surveyRecommendedTD} മീറ്റർ` : "150 മീറ്റർ"),
      locPoint4Pipe: savedFeas.locPoint4Pipe || (site?.surveyRecommendedSlottedPipe 
        ? `${site.surveyRecommendedSlottedPipe} മീറ്റർ (സ്ലോട്ടഡ് പൈപ്പ്)` 
        : (site?.surveyRecommendedCasingPipe ? `${site.surveyRecommendedCasingPipe} മീറ്റർ (കെയ്സിംഗ് പൈപ്പ്)` : "21 മീറ്റർ")),
      nbText: savedFeas.nbText || "NB:- മേൽ പറഞ്ഞ ഗവേഷണഫലം വിശദമായ ഭൂജലപര്യവേഷണത്തിന്റെ അടിസ്ഥാനത്തിലാണെങ്കിലും ചില സാങ്കേതികകാരണങ്ങളാൽ ചുരുക്കം ചിലത് പരാജയപ്പെടുന്നതായി കണ്ടുവരുന്നുണ്ട്. അപ്രകാരം പരാജയപ്പെടുകയാണെങ്കിൽ യാതൊരു വിധ നഷ്ടപരിഹാരവും അനുവദിക്കുന്നതല്ല. ബഹു. സുപ്രീം കോടതി വിധിന്യായം WP(C)36/09 പ്രകാരം പരാജയപ്പെടുന്ന കിണറുകളിലെ അപകട സാധ്യത കണക്കിലെടുത്ത്, അവ മൂടേണ്ടതാകുന്നു. ഗ്രാമപഞ്ചായത്ത് കെട്ടിട നിർമ്മാണ ചട്ടങ്ങൾക്കും നിയമങ്ങൾക്കും വിധേയമായി മാത്രമേ കുഴൽക്കിണർ നിർമ്മാണം നടത്താൻ പാടുള്ളൂ.",
      signatoryTitle: savedFeas.signatoryTitle || "ജില്ലാ ഓഫീസർ.",
    };

    setInvReportState(computedInv);
    setFeasibilityState(computedFeas);
  }, [entry, selectedSiteIndex, sites, district, districtMl, officeCode, officePhone, officeEmail, allStaffMembers]);

  useEffect(() => {
    resetToComputedDefaults();
  }, [resetToComputedDefaults]);

  // Handle Save Overrides
  const handleSave = async () => {
    if (!entry) return;
    setIsSaving(true);
    try {
      const currentOverrides = (entry as any)?.printOverrides || {};
      const updatedOverrides = {
        ...currentOverrides,
        investigation: {
          ...(currentOverrides.investigation || {}),
          [selectedSiteIndex]: invReportState,
        },
        feasibility: {
          ...(currentOverrides.feasibility || {}),
          [selectedSiteIndex]: feasibilityState,
        },
      };

      const updatedEntry: DataEntryFormData = {
        ...entry,
        printOverrides: updatedOverrides,
      };

      if (onSaveOverrides) {
        await onSaveOverrides(updatedEntry);
      } else if (entry.id) {
        await updateFileEntry(entry.id, updatedEntry);
      }

      toast({
        title: "Report Saved",
        description: "Report customizations have been saved successfully for this site.",
      });
      setIsEditMode(false);
    } catch (err: any) {
      console.error("Error saving report overrides:", err);
      toast({
        title: "Error Saving",
        description: err.message || "Failed to save report customizations.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Handle Print
  const handlePrint = () => {
    const targetId = activeDocType === "investigation_report" ? "investigation-report-print-target" : "feasibility-report-print-target";
    const reportTitle = activeDocType === "investigation_report" 
      ? `Investigation_Report_${entry?.fileNo || 'File'}_Site_${selectedSiteIndex + 1}`
      : `Feasibility_Report_${entry?.fileNo || 'File'}_Site_${selectedSiteIndex + 1}`;

    const margins = `${styleSettings.topMargin}cm ${styleSettings.rightMargin}cm ${styleSettings.bottomMargin}cm ${styleSettings.leftMargin}cm`;

    printDocument(targetId, reportTitle, {
      pageMargins: margins,
      bodyFontSize: styleSettings.bodyFontSize || styleSettings.fontSize || "11pt",
      headingFontSize: styleSettings.headingFontSize || "15pt",
      subheadingFontSize: styleSettings.subheadingFontSize || "13pt",
      lineHeight: styleSettings.lineSpacing || "1.4",
      englishFont: styleSettings.englishFont || "Times New Roman",
      malayalamFont: styleSettings.malayalamFont || "Mandaram",
    });
  };

  // Handle Copy as Official Table
  const handleCopy = async () => {
    const targetId = activeDocType === "investigation_report" ? "investigation-report-print-target" : "feasibility-report-print-target";
    const success = await copyOfficialTable(targetId);
    if (success) {
      setCopied(true);
      toast({
        title: "Copied to Clipboard",
        description: "Official table copied. You can paste it directly into e-Office Draft Editor, Word, or Excel.",
      });
      setTimeout(() => setCopied(false), 2500);
    } else {
      toast({
        title: "Copy Failed",
        description: "Could not copy document to clipboard.",
        variant: "destructive",
      });
    }
  };

  const handleBack = () => {
    if (returnPath) {
      router.push(returnPath);
    } else {
      router.back();
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-100 dark:bg-slate-950">
      {/* Top Header & Action Controls Bar */}
      <div className="sticky top-0 z-20 bg-background/95 backdrop-blur-xs border-b px-4 sm:px-6 py-3 shadow-xs">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
          {/* Back Button & File Info */}
          <div className="flex items-center gap-3">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleBack}
              className="h-9 gap-1.5 font-medium hover:bg-muted"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back</span>
            </Button>
            
            <div className="border-l pl-3">
              <div className="flex items-center gap-2">
                <h1 className="text-base font-bold text-foreground">GW Investigation Reports</h1>
                <Badge variant="outline" className="font-mono text-xs bg-primary/5 text-primary border-primary/20">
                  {entry.fileNo || "No File No."}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground truncate max-w-[280px] sm:max-w-md">
                {entry.applicantName || "Ground Water Investigation"}
              </p>
            </div>
          </div>

          {/* Action Toolbar */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Site Switcher Pill (if multiple sites) */}
            {sites.length > 1 && (
              <div className="flex items-center gap-1 bg-muted/60 p-1 rounded-lg border border-border/60">
                <span className="text-[11px] font-semibold text-muted-foreground px-2">Site:</span>
                {sites.map((s, idx) => (
                  <Button
                    key={idx}
                    type="button"
                    variant={selectedSiteIndex === idx ? "default" : "ghost"}
                    size="sm"
                    className="h-7 text-xs px-2.5 rounded-md"
                    onClick={() => {
                      setSelectedSiteIndex(idx);
                      setIsEditMode(false);
                    }}
                  >
                    #{idx + 1} {s.nameOfSite ? `(${s.nameOfSite.slice(0, 10)}...)` : ''}
                  </Button>
                ))}
              </div>
            )}

            {/* Print Style Configurator Toolbar */}
            <PrintStyleToolbar
              settings={styleSettings}
              onUpdate={setStyleSettings}
              onReset={() => setStyleSettings(DEFAULT_PRINT_STYLES)}
              hasMalayalam={activeDocType === "feasibility_report"}
            />

            {/* Edit / Preview Toggle */}
            <Button
              type="button"
              variant={isEditMode ? "secondary" : "outline"}
              size="sm"
              className={cn(
                "h-8 gap-1.5 text-xs font-semibold", 
                isEditMode && "bg-amber-100 text-amber-900 border-amber-300 hover:bg-amber-200 dark:bg-amber-950 dark:text-amber-200"
              )}
              onClick={() => setIsEditMode(!isEditMode)}
            >
              {isEditMode ? <Eye className="h-3.5 w-3.5 text-amber-700 dark:text-amber-300" /> : <Edit3 className="h-3.5 w-3.5" />}
              {isEditMode ? "Preview Mode" : "Edit Fields"}
            </Button>

            {/* Save Overrides Button */}
            {isEditMode && (
              <Button
                type="button"
                variant="default"
                size="sm"
                className="h-8 gap-1.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white"
                disabled={isSaving}
                onClick={handleSave}
              >
                {isSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                Save Changes
              </Button>
            )}

            {/* Copy Official Table */}
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-8 gap-1.5 text-xs font-medium"
              onClick={handleCopy}
            >
              {copied ? <Check className="h-3.5 w-3.5 text-green-600" /> : <Copy className="h-3.5 w-3.5" />}
              {copied ? "Copied" : "Copy Official Table"}
            </Button>

            {/* Print Report Button */}
            <Button
              type="button"
              variant="default"
              size="sm"
              className="h-8 gap-1.5 text-xs font-semibold shadow-xs"
              onClick={handlePrint}
            >
              <Printer className="h-3.5 w-3.5" />
              Print Report
            </Button>
          </div>
        </div>

        {/* Document Navigation Tabs Bar */}
        <div className="max-w-7xl mx-auto mt-2 pt-2 border-t flex flex-wrap items-center justify-between gap-3">
          <Tabs value={activeDocType} onValueChange={(val) => setActiveDocType(val as InvestigationReportDocType)} className="w-full sm:w-auto">
            <TabsList className="grid grid-cols-2 w-full sm:w-[480px]">
              <TabsTrigger value="investigation_report" className="text-xs font-bold gap-2 py-1.5">
                <FileText className="h-3.5 w-3.5 text-blue-600" />
                1. Investigation Report (English)
              </TabsTrigger>
              <TabsTrigger value="feasibility_report" className="text-xs font-bold gap-2 py-1.5">
                <FileText className="h-3.5 w-3.5 text-emerald-600" />
                2. Feasibility Report (മലയാളം)
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="hidden sm:flex items-center gap-2 text-xs text-muted-foreground font-medium">
            <span>Site {selectedSiteIndex + 1} of {sites.length}:</span>
            <span className="font-semibold text-foreground">{currentSite?.nameOfSite || "Site Details"}</span>
            {currentSite?.feasibility && (
              <Badge variant={currentSite.feasibility === "Yes" ? "default" : "destructive"} className="text-[10px] h-5">
                Feasibility: {currentSite.feasibility}
              </Badge>
            )}
          </div>
        </div>
      </div>

      {/* Main Document Canvas View */}
      <div className="flex-1 py-8 px-4 flex justify-center items-start overflow-x-auto">
        <div 
          className="w-full max-w-[210mm] bg-white text-black shadow-xl rounded-sm border border-neutral-300 print:border-none print:shadow-none transition-all my-2"
          style={{
            paddingTop: `${styleSettings.topMargin}cm`,
            paddingBottom: `${styleSettings.bottomMargin}cm`,
            paddingLeft: `${styleSettings.leftMargin}cm`,
            paddingRight: `${styleSettings.rightMargin}cm`,
            fontFamily: activeDocType === 'feasibility_report'
              ? `'${styleSettings.malayalamFont}', '${styleSettings.englishFont}', 'Mandaram', 'Manjari', sans-serif`
              : `'${styleSettings.englishFont}', 'Times New Roman', serif`,
            fontSize: styleSettings.bodyFontSize || styleSettings.fontSize || "11pt",
            lineHeight: styleSettings.lineSpacing || "1.4",
          }}
        >
          {/* ========================================================================= */}
          {/* REPORT 1: HYDROGEOLOGICAL INVESTIGATION REPORT (ENGLISH - PDF 1 FORMAT) */}
          {/* ========================================================================= */}
          {activeDocType === "investigation_report" && (
            <div id="investigation-report-print-target" className="space-y-4 print:space-y-3 text-black">
              {/* Header */}
              <div className="text-center space-y-0.5 border-b pb-3 mb-3 border-black">
                <h1 
                  className="font-bold tracking-wider uppercase text-black"
                  style={{ fontSize: styleSettings.headingFontSize || "15pt" }}
                >
                  GROUND WATER DEPARTMENT
                </h1>
                <h2 
                  className="font-bold tracking-wide uppercase text-black"
                  style={{ fontSize: styleSettings.subheadingFontSize || "13pt" }}
                >
                  {isEditMode ? (
                    <div className="flex items-center justify-center gap-1 max-w-sm mx-auto">
                      <span>DISTRICT OFFICE,</span>
                      <Input
                        value={invReportState.districtName}
                        onChange={(e) => setInvReportState({ ...invReportState, districtName: e.target.value })}
                        className="h-6 text-xs text-center font-bold uppercase w-40"
                      />
                    </div>
                  ) : (
                    `DISTRICT OFFICE, ${invReportState.districtName}`
                  )}
                </h2>
                <div 
                  className="font-bold underline tracking-wide text-black pt-1"
                  style={{ fontSize: styleSettings.subheadingFontSize || "13pt" }}
                >
                  HYDROGEOLOGICAL INVESTIGATION REPORT
                </div>
                <div className="text-xs italic text-neutral-800 pt-0.5">
                  {isEditMode ? (
                    <Input
                      value={invReportState.categoryText}
                      onChange={(e) => setInvReportState({ ...invReportState, categoryText: e.target.value })}
                      className="h-6 text-xs text-center italic max-w-xs mx-auto"
                    />
                  ) : (
                    `(${invReportState.categoryText})`
                  )}
                </div>
              </div>

              {/* Main Tabular Key-Value Form Details */}
              <table className="w-full border-collapse border-none text-black">
                <tbody>
                  {/* 1. Name and Address of Applicant */}
                  <tr className="align-top">
                    <td className="w-[36%] py-1.5 pr-2 font-bold text-black border-none">
                      Name and Address of the Applicant
                    </td>
                    <td className="w-[3%] py-1.5 text-center font-bold border-none">:</td>
                    <td className="w-[61%] py-1.5 pl-2 border-none">
                      {isEditMode ? (
                        <div className="space-y-1">
                          <Input
                            value={invReportState.applicantName}
                            onChange={(e) => setInvReportState({ ...invReportState, applicantName: e.target.value })}
                            placeholder="Applicant Name"
                            className="h-7 text-xs font-semibold"
                          />
                          <Textarea
                            value={invReportState.applicantAddress}
                            onChange={(e) => setInvReportState({ ...invReportState, applicantAddress: e.target.value })}
                            placeholder="Applicant Address"
                            className="min-h-[44px] text-xs"
                          />
                        </div>
                      ) : (
                        <div>
                          <span className="font-semibold">{invReportState.applicantName}</span>
                          {invReportState.applicantAddress && (
                            <span className="text-neutral-900 block whitespace-pre-line text-[10.5pt]">
                              {invReportState.applicantAddress}
                            </span>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>

                  {/* 2. File No. */}
                  <tr className="align-top">
                    <td className="py-1.5 pr-2 font-bold text-black border-none">File No.</td>
                    <td className="py-1.5 text-center font-bold border-none">:</td>
                    <td className="py-1.5 pl-2 border-none font-mono font-bold">
                      {isEditMode ? (
                        <Input
                          value={invReportState.fileNo}
                          onChange={(e) => setInvReportState({ ...invReportState, fileNo: e.target.value })}
                          className="h-7 text-xs font-mono font-bold max-w-xs"
                        />
                      ) : (
                        invReportState.fileNo || "-"
                      )}
                    </td>
                  </tr>

                  {/* 3. Date of Investigation */}
                  <tr className="align-top">
                    <td className="py-1.5 pr-2 font-bold text-black border-none">Date of Investigation</td>
                    <td className="py-1.5 text-center font-bold border-none">:</td>
                    <td className="py-1.5 pl-2 border-none font-semibold">
                      {isEditMode ? (
                        <Input
                          value={invReportState.dateOfInvestigation}
                          onChange={(e) => setInvReportState({ ...invReportState, dateOfInvestigation: e.target.value })}
                          placeholder="DD/MM/YYYY"
                          className="h-7 text-xs max-w-xs"
                        />
                      ) : (
                        invReportState.dateOfInvestigation || "-"
                      )}
                    </td>
                  </tr>

                  {/* 4. Type of well */}
                  <tr className="align-top">
                    <td className="py-1.5 pr-2 font-bold text-black border-none">Type of well</td>
                    <td className="py-1.5 text-center font-bold border-none">:</td>
                    <td className="py-1.5 pl-2 border-none">
                      {isEditMode ? (
                        <div className="flex flex-wrap gap-2">
                          {WELL_TYPE_OPTIONS.map((type) => (
                            <Button
                              key={type}
                              type="button"
                              variant={invReportState.typeOfWell?.toLowerCase() === type.toLowerCase() ? "default" : "outline"}
                              size="sm"
                              className="h-7 text-xs"
                              onClick={() => setInvReportState({ ...invReportState, typeOfWell: type as any })}
                            >
                              {type}
                            </Button>
                          ))}
                        </div>
                      ) : (
                        <div className="space-x-1.5">
                          {WELL_TYPE_OPTIONS.map((type, idx) => {
                            const isSelected = invReportState.typeOfWell?.toLowerCase() === type.toLowerCase() || 
                              (type === "Tube well" && invReportState.typeOfWell?.toLowerCase().includes("tube")) ||
                              (type === "Bore well" && invReportState.typeOfWell?.toLowerCase().includes("bore")) ||
                              (type === "Filter Point well" && invReportState.typeOfWell?.toLowerCase().includes("filter")) ||
                              (type === "Dug well" && (invReportState.typeOfWell?.toLowerCase().includes("open") || invReportState.typeOfWell?.toLowerCase().includes("dug")));

                            return (
                              <span key={type}>
                                {isSelected ? (
                                  <span className="font-bold underline text-black uppercase tracking-wide">
                                    {type}
                                  </span>
                                ) : (
                                  <span className="text-neutral-500">{type}</span>
                                )}
                                {idx < WELL_TYPE_OPTIONS.length - 1 && <span className="text-neutral-400"> / </span>}
                              </span>
                            );
                          })}
                        </div>
                      )}
                    </td>
                  </tr>

                  {/* 5. Purpose */}
                  <tr className="align-top">
                    <td className="py-1.5 pr-2 font-bold text-black border-none">Purpose</td>
                    <td className="py-1.5 text-center font-bold border-none">:</td>
                    <td className="py-1.5 pl-2 border-none">
                      {isEditMode ? (
                        <div className="flex flex-wrap gap-2">
                          {PURPOSE_OPTIONS.map((p) => (
                            <Button
                              key={p}
                              type="button"
                              variant={invReportState.purpose?.toLowerCase() === p.toLowerCase() ? "default" : "outline"}
                              size="sm"
                              className="h-7 text-xs"
                              onClick={() => setInvReportState({ ...invReportState, purpose: p })}
                            >
                              {p}
                            </Button>
                          ))}
                        </div>
                      ) : (
                        <div className="space-x-1.5">
                          {PURPOSE_OPTIONS.map((p, idx) => {
                            const isSelected = invReportState.purpose?.toLowerCase() === p.toLowerCase() ||
                              (p === "Domestic" && (invReportState.purpose?.toLowerCase().includes("domestic") || invReportState.purpose?.toLowerCase().includes("drinking"))) ||
                              (p === "Irrigation" && invReportState.purpose?.toLowerCase().includes("irrig")) ||
                              (p === "Industry" && invReportState.purpose?.toLowerCase().includes("industr")) ||
                              (p === "Institution" && (invReportState.purpose?.toLowerCase().includes("instit") || invReportState.purpose?.toLowerCase().includes("school") || invReportState.purpose?.toLowerCase().includes("hospital")));

                            return (
                              <span key={p}>
                                {isSelected ? (
                                  <span className="font-bold underline text-black uppercase tracking-wide">
                                    {p}
                                  </span>
                                ) : (
                                  <span className="text-neutral-500">{p}</span>
                                )}
                                {idx < PURPOSE_OPTIONS.length - 1 && <span className="text-neutral-400"> / </span>}
                              </span>
                            );
                          })}
                        </div>
                      )}
                    </td>
                  </tr>

                  {/* 6. Taluk / Block */}
                  <tr className="align-top">
                    <td className="py-1.5 pr-2 font-bold text-black border-none">Taluk/Block</td>
                    <td className="py-1.5 text-center font-bold border-none">:</td>
                    <td className="py-1.5 pl-2 border-none">
                      {isEditMode ? (
                        <Input
                          value={invReportState.talukOrBlock}
                          onChange={(e) => setInvReportState({ ...invReportState, talukOrBlock: e.target.value })}
                          placeholder="Taluk / Block name"
                          className="h-7 text-xs max-w-xs"
                        />
                      ) : (
                        invReportState.talukOrBlock || "-"
                      )}
                    </td>
                  </tr>

                  {/* 7. Panchayath / Municipality / Corporation */}
                  <tr className="align-top">
                    <td className="py-1.5 pr-2 font-bold text-black border-none">
                      Panchayath/Municipality/Corporation
                    </td>
                    <td className="py-1.5 text-center font-bold border-none">:</td>
                    <td className="py-1.5 pl-2 border-none font-semibold">
                      {isEditMode ? (
                        <Input
                          value={invReportState.localSelfGovt}
                          onChange={(e) => setInvReportState({ ...invReportState, localSelfGovt: e.target.value })}
                          placeholder="Local Self Govt"
                          className="h-7 text-xs max-w-xs"
                        />
                      ) : (
                        invReportState.localSelfGovt || "-"
                      )}
                    </td>
                  </tr>

                  {/* 8. Village and ward No. */}
                  <tr className="align-top">
                    <td className="py-1.5 pr-2 font-bold text-black border-none">Village and ward No.</td>
                    <td className="py-1.5 text-center font-bold border-none">:</td>
                    <td className="py-1.5 pl-2 border-none">
                      {isEditMode ? (
                        <Input
                          value={invReportState.villageAndWard}
                          onChange={(e) => setInvReportState({ ...invReportState, villageAndWard: e.target.value })}
                          placeholder="Village and Ward No"
                          className="h-7 text-xs max-w-xs"
                        />
                      ) : (
                        invReportState.villageAndWard || "-"
                      )}
                    </td>
                  </tr>

                  {/* 9. Assembly Constituency */}
                  <tr className="align-top">
                    <td className="py-1.5 pr-2 font-bold text-black border-none">Assembly Constituency</td>
                    <td className="py-1.5 text-center font-bold border-none">:</td>
                    <td className="py-1.5 pl-2 border-none">
                      {isEditMode ? (
                        <Input
                          value={invReportState.constituency}
                          onChange={(e) => setInvReportState({ ...invReportState, constituency: e.target.value })}
                          placeholder="Constituency (LAC)"
                          className="h-7 text-xs max-w-xs"
                        />
                      ) : (
                        invReportState.constituency || "-"
                      )}
                    </td>
                  </tr>

                  {/* 10. Latitude / Longitude */}
                  <tr className="align-top">
                    <td className="py-1.5 pr-2 font-bold text-black border-none">Latitude / Longitude</td>
                    <td className="py-1.5 text-center font-bold border-none">:</td>
                    <td className="py-1.5 pl-2 border-none font-mono">
                      {isEditMode ? (
                        <div className="flex items-center gap-2 max-w-xs">
                          <Input
                            value={invReportState.latitude}
                            onChange={(e) => setInvReportState({ ...invReportState, latitude: e.target.value })}
                            placeholder="Lat, e.g. 8.5241"
                            className="h-7 text-xs"
                          />
                          <span>/</span>
                          <Input
                            value={invReportState.longitude}
                            onChange={(e) => setInvReportState({ ...invReportState, longitude: e.target.value })}
                            placeholder="Long, e.g. 76.9366"
                            className="h-7 text-xs"
                          />
                        </div>
                      ) : (
                        invReportState.latitude && invReportState.longitude
                          ? `${invReportState.latitude} N / ${invReportState.longitude} E`
                          : (invReportState.latitude || invReportState.longitude || "-")
                      )}
                    </td>
                  </tr>

                  {/* 11. Survey No. and Area extend */}
                  <tr className="align-top">
                    <td className="py-1.5 pr-2 font-bold text-black border-none">Survey No. and Area extend</td>
                    <td className="py-1.5 text-center font-bold border-none">:</td>
                    <td className="py-1.5 pl-2 border-none">
                      {isEditMode ? (
                        <Input
                          value={invReportState.surveyNoAndArea}
                          onChange={(e) => setInvReportState({ ...invReportState, surveyNoAndArea: e.target.value })}
                          placeholder="Survey No and Area extent"
                          className="h-7 text-xs max-w-md"
                        />
                      ) : (
                        invReportState.surveyNoAndArea || "-"
                      )}
                    </td>
                  </tr>

                  {/* 12. Geomorphology of the area */}
                  <tr className="align-top">
                    <td className="py-1.5 pr-2 font-bold text-black border-none">Geomorphology of the area</td>
                    <td className="py-1.5 text-center font-bold border-none">:</td>
                    <td className="py-1.5 pl-2 border-none">
                      {isEditMode ? (
                        <Textarea
                          value={invReportState.geomorphology}
                          onChange={(e) => setInvReportState({ ...invReportState, geomorphology: e.target.value })}
                          className="min-h-[44px] text-xs"
                        />
                      ) : (
                        invReportState.geomorphology || "-"
                      )}
                    </td>
                  </tr>

                  {/* 13. Geology and Hydrogeology of the area */}
                  <tr className="align-top">
                    <td className="py-1.5 pr-2 font-bold text-black border-none">
                      Geology and Hydrogeology of the area
                    </td>
                    <td className="py-1.5 text-center font-bold border-none">:</td>
                    <td className="py-1.5 pl-2 border-none">
                      {isEditMode ? (
                        <Textarea
                          value={invReportState.geologyHydrogeology}
                          onChange={(e) => setInvReportState({ ...invReportState, geologyHydrogeology: e.target.value })}
                          className="min-h-[50px] text-xs"
                        />
                      ) : (
                        invReportState.geologyHydrogeology || "-"
                      )}
                    </td>
                  </tr>

                  {/* 14. Details of nearby wells */}
                  <tr className="align-top">
                    <td className="py-1.5 pr-2 font-bold text-black border-none">Details of nearby wells</td>
                    <td className="py-1.5 text-center font-bold border-none">:</td>
                    <td className="py-1.5 pl-2 border-none">
                      {isEditMode ? (
                        <Textarea
                          value={invReportState.nearbyWells}
                          onChange={(e) => setInvReportState({ ...invReportState, nearbyWells: e.target.value })}
                          className="min-h-[44px] text-xs"
                        />
                      ) : (
                        invReportState.nearbyWells || "-"
                      )}
                    </td>
                  </tr>

                  {/* 15. Whether VES conducted or Not */}
                  <tr className="align-top">
                    <td className="py-1.5 pr-2 font-bold text-black border-none">Whether VES conducted or Not</td>
                    <td className="py-1.5 text-center font-bold border-none">:</td>
                    <td className="py-1.5 pl-2 border-none">
                      {isEditMode ? (
                        <Input
                          value={invReportState.vesConducted}
                          onChange={(e) => setInvReportState({ ...invReportState, vesConducted: e.target.value })}
                          placeholder="Yes / No"
                          className="h-7 text-xs"
                        />
                      ) : (
                        invReportState.vesConducted || "No"
                      )}
                    </td>
                  </tr>

                  {/* 16. Recommendation */}
                  <tr className="align-top">
                    <td className="py-1.5 pr-2 font-bold text-black border-none">Recommendation</td>
                    <td className="py-1.5 text-center font-bold border-none">:</td>
                    <td className="py-1.5 pl-2 border-none font-semibold">
                      {isEditMode ? (
                        <Textarea
                          value={invReportState.recommendation}
                          onChange={(e) => setInvReportState({ ...invReportState, recommendation: e.target.value })}
                          className="min-h-[50px] text-xs font-semibold"
                        />
                      ) : (
                        invReportState.recommendation || "-"
                      )}
                    </td>
                  </tr>
                </tbody>
              </table>

              {/* Highlighted Technical Recommendation Specification Block */}
              <div className="mt-4 p-3.5 border-2 border-black rounded-xs space-y-2 bg-neutral-50/50 print:bg-transparent">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-1.5 text-[10.5pt]">
                  <div className="col-span-full">
                    <span className="font-bold">Location: </span>
                    {isEditMode ? (
                      <Input
                        value={invReportState.surveyLocation}
                        onChange={(e) => setInvReportState({ ...invReportState, surveyLocation: e.target.value })}
                        className="h-7 text-xs mt-1"
                      />
                    ) : (
                      <span>{invReportState.surveyLocation}</span>
                    )}
                  </div>

                  <div>
                    <span className="font-bold">Dia: </span>
                    {isEditMode ? (
                      <Input
                        value={invReportState.surveyRecommendedDiameter}
                        onChange={(e) => setInvReportState({ ...invReportState, surveyRecommendedDiameter: e.target.value })}
                        className="h-7 text-xs inline-block w-36"
                      />
                    ) : (
                      <span className="font-semibold">{invReportState.surveyRecommendedDiameter}</span>
                    )}
                  </div>

                  <div>
                    <span className="font-bold">T.D: </span>
                    {isEditMode ? (
                      <Input
                        value={invReportState.surveyRecommendedTD}
                        onChange={(e) => setInvReportState({ ...invReportState, surveyRecommendedTD: e.target.value })}
                        className="h-7 text-xs inline-block w-36"
                      />
                    ) : (
                      <span className="font-semibold">{invReportState.surveyRecommendedTD}</span>
                    )}
                  </div>

                  <div>
                    <span className="font-bold">S.P / Casing: </span>
                    {isEditMode ? (
                      <Input
                        value={invReportState.surveyRecommendedSlottedPipe}
                        onChange={(e) => setInvReportState({ ...invReportState, surveyRecommendedSlottedPipe: e.target.value })}
                        className="h-7 text-xs inline-block w-36"
                      />
                    ) : (
                      <span className="font-semibold">{invReportState.surveyRecommendedSlottedPipe}</span>
                    )}
                  </div>

                  <div className="col-span-full pt-1">
                    <span className="font-bold">Accessibility / Remarks: </span>
                    {isEditMode ? (
                      <Input
                        value={invReportState.accessibilityNotes}
                        onChange={(e) => setInvReportState({ ...invReportState, accessibilityNotes: e.target.value })}
                        className="h-7 text-xs mt-1"
                      />
                    ) : (
                      <span>{invReportState.accessibilityNotes}</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Signatures Section */}
              <div className="pt-10 print:pt-8 text-black signature-block" style={{ width: '100%', marginTop: '35px', clear: 'both' }}>
                <table style={{ width: '100%', border: 'none', borderCollapse: 'collapse' }}>
                  <tbody>
                    <tr style={{ border: 'none' }}>
                      <td style={{ width: '50%', textAlign: 'center', verticalAlign: 'bottom', border: 'none', padding: '0 10px' }}>
                        <div className="w-60 mx-auto space-y-1">
                          <div className="h-10"></div>
                          <div className="font-bold border-t border-black pt-1">Junior Hydrogeologist</div>
                          {isEditMode ? (
                            <Input
                              value={invReportState.juniorHydrogeologistName}
                              onChange={(e) => setInvReportState({ ...invReportState, juniorHydrogeologistName: e.target.value })}
                              placeholder="Investigator Name"
                              className="h-6 text-xs text-center"
                            />
                          ) : (
                            invReportState.juniorHydrogeologistName && (
                              <div className="text-xs text-neutral-800">({invReportState.juniorHydrogeologistName})</div>
                            )
                          )}
                        </div>
                      </td>
                      <td style={{ width: '50%', textAlign: 'center', verticalAlign: 'bottom', border: 'none', padding: '0 10px' }}>
                        <div className="w-60 mx-auto space-y-1">
                          <div className="h-10"></div>
                          <div className="font-bold border-t border-black pt-1">Hydrogeologist</div>
                          {isEditMode ? (
                            <Input
                              value={invReportState.hydrogeologistName}
                              onChange={(e) => setInvReportState({ ...invReportState, hydrogeologistName: e.target.value })}
                              placeholder="Officer Name"
                              className="h-6 text-xs text-center"
                            />
                          ) : (
                            <div className="text-xs text-neutral-800">District Office, GWD, {invReportState.districtName}</div>
                          )}
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* REPORT 2: FEASIBILITY REPORT (MALAYALAM LETTER - PDF 2 FORMAT) */}
          {/* ========================================================================= */}
          {activeDocType === "feasibility_report" && (
            <div 
              id="feasibility-report-print-target" 
              className="space-y-4 print:space-y-3 text-black"
              style={{
                fontFamily: `'${styleSettings.malayalamFont}', 'Mandaram', 'Manjari', 'Noto Sans Malayalam', sans-serif`,
              }}
            >
              {/* Header Row: File No (Left) and District Officer Office Details (Right) */}
              <div className="flex justify-between items-start gap-4 pb-2 text-[10.5pt]">
                <div className="w-1/2">
                  {isEditMode ? (
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase text-muted-foreground">ഫയൽ നമ്പർ</label>
                      <MalayalamInput
                        value={feasibilityState.fileNoMl}
                        onChange={(val) => setFeasibilityState({ ...feasibilityState, fileNoMl: val })}
                        className="h-7 text-xs font-mono font-bold"
                        showAutoTranslateButton={false}
                      />
                    </div>
                  ) : (
                    <div className="font-semibold">
                      {feasibilityState.fileNoMl.startsWith("നം") ? feasibilityState.fileNoMl : `നം. ${feasibilityState.fileNoMl}`}
                    </div>
                  )}
                </div>

                <div className="w-1/2 text-right space-y-0.5">
                  <div className="font-bold">ജില്ലാഓഫീസറുടെ കാര്യാലയം</div>
                  <div>
                    {isEditMode ? (
                      <div className="flex items-center justify-end gap-1">
                        <span>ഭൂജല വകുപ്പ്,</span>
                        <MalayalamInput
                          value={feasibilityState.officeHeaderDistrict}
                          onChange={(val) => setFeasibilityState({ ...feasibilityState, officeHeaderDistrict: val })}
                          className="h-6 text-xs w-28 text-right font-medium"
                          showAutoTranslateButton={false}
                        />
                      </div>
                    ) : (
                      `ഭൂജല വകുപ്പ്, ${feasibilityState.officeHeaderDistrict}-9`
                    )}
                  </div>
                  <div>
                    {isEditMode ? (
                      <div className="flex items-center justify-end gap-1">
                        <span>തീയതി:</span>
                        <Input
                          value={feasibilityState.letterDate}
                          onChange={(e) => setFeasibilityState({ ...feasibilityState, letterDate: e.target.value })}
                          className="h-6 text-xs w-28 text-right"
                        />
                      </div>
                    ) : (
                      `തീയതി. ${feasibilityState.letterDate}`
                    )}
                  </div>
                  <div>
                    {isEditMode ? (
                      <div className="flex items-center justify-end gap-1">
                        <span>ഫോൺ നം:</span>
                        <Input
                          value={feasibilityState.phoneNo}
                          onChange={(e) => setFeasibilityState({ ...feasibilityState, phoneNo: e.target.value })}
                          className="h-6 text-xs w-36 text-right"
                        />
                      </div>
                    ) : (
                      `ഫോൺ നം. ${feasibilityState.phoneNo}`
                    )}
                  </div>
                  <div>
                    {isEditMode ? (
                      <div className="flex items-center justify-end gap-1">
                        <span>ഇമെയിൽ:</span>
                        <Input
                          value={feasibilityState.emailId}
                          onChange={(e) => setFeasibilityState({ ...feasibilityState, emailId: e.target.value })}
                          className="h-6 text-xs w-44 text-right"
                        />
                      </div>
                    ) : (
                      `ഇമെയിൽ:- ${feasibilityState.emailId}`
                    )}
                  </div>
                </div>
              </div>

              <Separator className="bg-black/40 my-1" />

              {/* From and To Sections */}
              <div className="space-y-3 pt-1 text-[11pt]">
                <div>
                  <div className="font-bold underline">പ്രേഷിതൻ</div>
                  <div className="pl-6 pt-0.5">
                    {isEditMode ? (
                      <MalayalamInput
                        value={feasibilityState.fromOfficer}
                        onChange={(val) => setFeasibilityState({ ...feasibilityState, fromOfficer: val })}
                        className="h-7 text-xs max-w-xs font-medium"
                        showAutoTranslateButton={false}
                      />
                    ) : (
                      feasibilityState.fromOfficer
                    )}
                  </div>
                </div>

                <div>
                  <div className="font-bold underline">സ്വീകർത്താവ്</div>
                  <div className="pl-6 pt-0.5 space-y-1">
                    {isEditMode ? (
                      <div className="space-y-1 max-w-md">
                        <MalayalamInput
                          value={feasibilityState.toApplicantName}
                          onChange={(val) => setFeasibilityState({ ...feasibilityState, toApplicantName: val })}
                          placeholder="Applicant / Officer Name & Designation"
                          className="h-7 text-xs font-semibold"
                          showAutoTranslateButton={false}
                        />
                        <MalayalamInput
                          multiline
                          rows={2}
                          value={feasibilityState.toApplicantAddress}
                          onChange={(val) => setFeasibilityState({ ...feasibilityState, toApplicantAddress: val })}
                          placeholder="Address"
                          className="min-h-[44px] text-xs"
                          showAutoTranslateButton={false}
                        />
                      </div>
                    ) : (
                      <div>
                        <div className="font-semibold">{feasibilityState.toApplicantName}</div>
                        {feasibilityState.toApplicantAddress && (
                          <div className="whitespace-pre-line text-neutral-900">{feasibilityState.toApplicantAddress}</div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Salutation */}
              <div className="pt-2 font-bold text-[11pt]">
                സർ,
              </div>

              {/* Subject & Reference */}
              <div className="pl-6 space-y-1.5 text-[10.5pt]">
                <div className="flex items-start gap-2">
                  <span className="font-bold whitespace-nowrap">വിഷയം:-</span>
                  <div className="flex-1 font-semibold">
                    {isEditMode ? (
                      <MalayalamInput
                        multiline
                        rows={2}
                        value={feasibilityState.subjectText}
                        onChange={(val) => setFeasibilityState({ ...feasibilityState, subjectText: val })}
                        className="min-h-[44px] text-xs"
                        showAutoTranslateButton={false}
                      />
                    ) : (
                      feasibilityState.subjectText
                    )}
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <span className="font-bold whitespace-nowrap">സൂചന:-</span>
                  <div className="flex-1">
                    {isEditMode ? (
                      <MalayalamInput
                        value={feasibilityState.referenceText}
                        onChange={(val) => setFeasibilityState({ ...feasibilityState, referenceText: val })}
                        className="h-7 text-xs"
                        showAutoTranslateButton={false}
                      />
                    ) : (
                      feasibilityState.referenceText
                    )}
                  </div>
                </div>
              </div>

              {/* Main Body Content Paragraph */}
              <div className="pt-2 text-justify indent-8 text-[11pt] leading-relaxed">
                {isEditMode ? (
                  <MalayalamInput
                    multiline
                    rows={4}
                    value={feasibilityState.mainBodyText}
                    onChange={(val) => setFeasibilityState({ ...feasibilityState, mainBodyText: val })}
                    className="min-h-[80px] text-xs leading-relaxed"
                    showAutoTranslateButton={false}
                  />
                ) : (
                  <span>{feasibilityState.mainBodyText}</span>
                )}
              </div>

              {/* Numbered Specifications */}
              <div className="pl-6 pt-2 space-y-1.5 text-[11pt]">
                <div className="flex items-start gap-2">
                  <span className="font-bold min-w-[150px]">1. നിർദ്ദിഷ്ട സ്ഥലം</span>
                  <span className="font-bold">:</span>
                  <div className="flex-1">
                    {isEditMode ? (
                      <MalayalamInput
                        value={feasibilityState.locPoint1}
                        onChange={(val) => setFeasibilityState({ ...feasibilityState, locPoint1: val })}
                        className="h-7 text-xs"
                        showAutoTranslateButton={false}
                      />
                    ) : (
                      <span>{feasibilityState.locPoint1}</span>
                    )}
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <span className="font-bold min-w-[150px]">2. വ്യാസം</span>
                  <span className="font-bold">:</span>
                  <div className="flex-1 font-semibold">
                    {isEditMode ? (
                      <MalayalamInput
                        value={feasibilityState.locPoint2Dia}
                        onChange={(val) => setFeasibilityState({ ...feasibilityState, locPoint2Dia: val })}
                        className="h-7 text-xs max-w-xs"
                        showAutoTranslateButton={false}
                      />
                    ) : (
                      <span>{feasibilityState.locPoint2Dia}</span>
                    )}
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <span className="font-bold min-w-[150px]">3. കുഴിക്കേണ്ട ആഴം</span>
                  <span className="font-bold">:</span>
                  <div className="flex-1 font-semibold">
                    {isEditMode ? (
                      <MalayalamInput
                        value={feasibilityState.locPoint3TD}
                        onChange={(val) => setFeasibilityState({ ...feasibilityState, locPoint3TD: val })}
                        className="h-7 text-xs max-w-xs"
                        showAutoTranslateButton={false}
                      />
                    ) : (
                      <span>{feasibilityState.locPoint3TD}</span>
                    )}
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <span className="font-bold min-w-[150px]">4. സ്ലോട്ടഡ് പൈപ്പ്</span>
                  <span className="font-bold">:</span>
                  <div className="flex-1 font-semibold">
                    {isEditMode ? (
                      <MalayalamInput
                        value={feasibilityState.locPoint4Pipe}
                        onChange={(val) => setFeasibilityState({ ...feasibilityState, locPoint4Pipe: val })}
                        className="h-7 text-xs max-w-xs"
                        showAutoTranslateButton={false}
                      />
                    ) : (
                      <span>{feasibilityState.locPoint4Pipe}</span>
                    )}
                  </div>
                </div>
              </div>

              {/* NB Notice Block */}
              <div className="pt-4 text-justify text-[9.5pt] leading-relaxed italic text-neutral-900">
                {isEditMode ? (
                  <MalayalamInput
                    multiline
                    rows={4}
                    value={feasibilityState.nbText}
                    onChange={(val) => setFeasibilityState({ ...feasibilityState, nbText: val })}
                    className="min-h-[90px] text-xs leading-relaxed italic"
                    showAutoTranslateButton={false}
                  />
                ) : (
                  <span>{feasibilityState.nbText}</span>
                )}
              </div>

              {/* Signatory */}
              <div className="pt-10 flex justify-end text-right pr-6 print:pt-8">
                <div className="space-y-1 min-w-[180px]">
                  <div className="h-10"></div>
                  <div className="font-bold text-[11pt]">{feasibilityState.signatoryTitle}</div>
                  <div className="text-xs text-neutral-800">ഭൂജല വകുപ്പ്, {feasibilityState.officeHeaderDistrict}</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
