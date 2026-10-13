"use client";

import React, { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Printer,
  Download,
  ExternalLink,
  Edit,
  Save,
  RotateCcw,
  Loader2,
  CheckCircle2,
  FileText,
  RefreshCw,
  Sparkles,
} from "lucide-react";
import {
  createOfficialRigRegistrationAcroFormPdf,
  createOfficialRigRenewalAcroFormPdf,
  downloadPdfBytes,
  printPdfBytesDirectly,
} from "@/lib/pdf/acroFormPdfService";
import { useMasterPdfTemplates } from "@/hooks/useMasterPdfTemplates";
import { useAgencyApplications, type AgencyApplication, type SavedApplicationFormRecord } from "@/hooks/useAgencyApplications";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { v4 as uuidv4 } from "uuid";

interface OfficialAcroFormPdfViewerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type: "registration" | "renewal";
  application: AgencyApplication;
  initialSavedForm?: SavedApplicationFormRecord | null;
  onSwitchToWebForm?: () => void;
}

// Helper to format ISO dates to dd/MM/yyyy
function formatToDDMMYYYY(val: any): string {
  if (typeof val !== "string" || !val) return val || "";
  const trimmed = val.trim();
  const isoMatch = trimmed.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
  if (isoMatch) {
    const [_, yyyy, mm, dd] = isoMatch;
    return `${dd.padStart(2, "0")}/${mm.padStart(2, "0")}/${yyyy}`;
  }
  return val;
}

export function OfficialAcroFormPdfViewerModal({
  open,
  onOpenChange,
  type,
  application,
  initialSavedForm,
  onSwitchToWebForm,
}: OfficialAcroFormPdfViewerModalProps) {
  const { getActiveTemplateForModule } = useMasterPdfTemplates();
  const { applications, updateApplication } = useAgencyApplications();
  const { user } = useAuth();
  const { toast } = useToast();

  const [pdfBlobUrl, setPdfBlobUrl] = useState<string | null>(null);
  const [pdfBytes, setPdfBytes] = useState<Uint8Array | null>(null);
  const [isGenerating, setIsGenerating] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [generationKey, setGenerationKey] = useState(0);

  const activeTemplate = getActiveTemplateForModule(
    type === "registration" ? "rig_registration" : "rig_renewal"
  );

  // Compile database data dictionary for auto-population
  const compileFormData = (): Record<string, any> => {
    const app = application;
    const activeRigs = (app?.rigs || []).filter((r) => r.status === "Active");
    const owner = app?.owner || ({} as any);
    const partners = app?.partners || [];
    const savedFormData = initialSavedForm?.formData || (app as any)?.officialFormData || (app as any)?.registrationFormData || (app as any)?.renewalFormData || {};

    const getVal = (key: string, fallback: any) => {
      if (savedFormData[key] !== undefined && savedFormData[key] !== null) {
        return savedFormData[key];
      }
      return fallback;
    };

    if (type === "registration") {
      const data: Record<string, any> = {
        // Section 1: Agency
        agencyName: getVal("agencyName", app.agencyName || ""),
        address: getVal("address", owner.address || ""),
        village: getVal("village", ""),
        taluk: getVal("taluk", ""),
        panchayath: getVal("panchayath", ""),
        district: getVal("district", app.officeLocation || ""),
        pincode: getVal("pincode", ""),
        gstin: getVal("gstin", ""),
        lsgdRegNo: getVal("lsgdRegNo", ""),

        // Section 2: Owner A
        ownerA_name: getVal("ownerA_name", owner.name || ""),
        ownerA_curr_address: getVal("ownerA_curr_address", owner.address || ""),
        ownerA_curr_village: getVal("ownerA_curr_village", ""),
        ownerA_curr_taluk: getVal("ownerA_curr_taluk", ""),
        ownerA_curr_panchayath: getVal("ownerA_curr_panchayath", ""),
        ownerA_curr_district: getVal("ownerA_curr_district", app.officeLocation || ""),
        ownerA_curr_pincode: getVal("ownerA_curr_pincode", ""),
        ownerA_curr_photo: getVal("ownerA_curr_photo", owner.photoUrl || ""),

        ownerA_perm_address: getVal("ownerA_perm_address", owner.address || ""),
        ownerA_perm_village: getVal("ownerA_perm_village", ""),
        ownerA_perm_taluk: getVal("ownerA_perm_taluk", ""),
        ownerA_perm_panchayath: getVal("ownerA_perm_panchayath", ""),
        ownerA_perm_district: getVal("ownerA_perm_district", app.officeLocation || ""),
        ownerA_perm_pincode: getVal("ownerA_perm_pincode", ""),

        ownerA_id_type: getVal("ownerA_id_type", "Aadhaar"),
        ownerA_id_no: getVal("ownerA_id_no", ""),
        ownerA_pan: getVal("ownerA_pan", ""),
        ownerA_exp: getVal("ownerA_exp", ""),
        ownerA_nominee: getVal("ownerA_nominee", ""),

        // Partners B & C
        partnerB_name: getVal("partnerB_name", partners[0]?.name || ""),
        partnerB_curr_address: getVal("partnerB_curr_address", partners[0]?.address || ""),
        partnerB_id_no: getVal("partnerB_id_no", ""),
        partnerB_pan: getVal("partnerB_pan", ""),
        partnerC_name: getVal("partnerC_name", partners[1]?.name || ""),
        partnerC_curr_address: getVal("partnerC_curr_address", partners[1]?.address || ""),
        partnerC_id_no: getVal("partnerC_id_no", ""),
        partnerC_pan: getVal("partnerC_pan", ""),

        // Receipt & Office Inspection
        receipt_app_no: getVal("receipt_app_no", app.fileNo || (app as any).applicationNo || app.id || ""),
        receipt_applicant_name: getVal("receipt_applicant_name", owner.name || app.agencyName || ""),
        receipt_date_recd: formatToDDMMYYYY(getVal("receipt_date_recd", format(new Date(), "dd/MM/yyyy"))),
        receipt_paid_amount: getVal("receipt_paid_amount", "10000"),
        receipt_paid_date: formatToDDMMYYYY(getVal("receipt_paid_date", format(new Date(), "dd/MM/yyyy"))),
        receipt_challan_no: getVal("receipt_challan_no", ""),
        office_feeChallan: getVal("office_feeChallan", ""),
        office_paid_amount: getVal("office_paid_amount", "10000"),
        office_rig_inspected_date: formatToDDMMYYYY(getVal("office_rig_inspected_date", "")),
        office_recommendation: getVal("office_recommendation", ""),
      };

      // Populate Rigs A, B, C
      ["A", "B", "C"].forEach((letter, idx) => {
        const rig = activeRigs[idx];
        data[`rig${letter}_type`] = getVal(`rig${letter}_type`, rig?.typeOfRigMalayalam || rig?.typeOfRig || "");
        data[`rig${letter}_owner_name`] = getVal(`rig${letter}_owner_name`, rig ? owner.name : "");
        data[`rig${letter}_veh_reg`] = getVal(`rig${letter}_veh_reg`, rig?.rigVehicle?.regNo || "");
        data[`rig${letter}_veh_chassis`] = getVal(`rig${letter}_veh_chassis`, rig?.rigVehicle?.chassisNo || "");
        data[`rig${letter}_veh_engine`] = getVal(`rig${letter}_veh_engine`, rig?.rigVehicle?.engineNo || "");
        data[`rig${letter}_comp_model`] = getVal(`rig${letter}_comp_model`, rig?.compressorDetails?.model || "");
        data[`rig${letter}_comp_cap`] = getVal(`rig${letter}_comp_cap`, rig?.compressorDetails?.capacity || "");
        data[`rig${letter}_gen_type`] = getVal(`rig${letter}_gen_type`, rig?.generatorDetails?.type || "");
        data[`rig${letter}_well_depth`] = getVal(`rig${letter}_well_depth`, "");
        data[`rig${letter}_well_dia`] = getVal(`rig${letter}_well_dia`, "");
        data[`rig${letter}_op_name`] = getVal(`rig${letter}_op_name`, "");
        data[`rig${letter}_op_age`] = getVal(`rig${letter}_op_age`, "");
        data[`rig${letter}_op_exp`] = getVal(`rig${letter}_op_exp`, "");
        data[`rig${letter}_op_id_no`] = getVal(`rig${letter}_op_id_no`, "");
      });

      return data;
    } else {
      // Renewal Data
      const data: Record<string, any> = {
        agencyName: getVal("agencyName", app.agencyName || ""),
        agency_reg_no: getVal("agency_reg_no", app.agencyRegistrationNo || ""),
        existingAgencyRegNo: getVal("existingAgencyRegNo", app.agencyRegistrationNo || ""),
        address: getVal("address", owner.address || ""),
        phone: getVal("phone", owner.mobile || ""),
        email: getVal("email", owner.email || ""),
        village: getVal("village", ""),
        taluk: getVal("taluk", ""),
        panchayath: getVal("panchayath", ""),
        district: getVal("district", app.officeLocation || ""),
        pincode: getVal("pincode", ""),
        gstin: getVal("gstin", ""),
        lsgdRegNo: getVal("lsgdRegNo", ""),
        owner_name: getVal("owner_name", owner.name || ""),
        receipt_app_no: getVal("receipt_app_no", app.fileNo || app.id || ""),
        receipt_agency_name: getVal("receipt_agency_name", app.agencyName || ""),
        receipt_agency_reg_no: getVal("receipt_agency_reg_no", app.agencyRegistrationNo || ""),
        receipt_fee_paid_amount: getVal("receipt_fee_paid_amount", "10000"),
        receipt_fee_paid_date: formatToDDMMYYYY(getVal("receipt_fee_paid_date", format(new Date(), "dd/MM/yyyy"))),
      };

      // Summary rigs
      activeRigs.forEach((rig, idx) => {
        if (idx < 3) {
          data[`summaryRig${idx + 1}_type`] = rig.typeOfRigMalayalam || rig.typeOfRig || "";
          data[`summaryRig${idx + 1}_regNo`] = rig.rigRegistrationNo || "";
          data[`summaryRig${idx + 1}_paidAmount`] = rig.applicationFee ? String(rig.applicationFee) : "10000";
          data[`summaryRig${idx + 1}_challanDetails`] = rig.applicationChallanNo || "";
        }
      });

      return data;
    }
  };

  useEffect(() => {
    if (!open) {
      if (pdfBlobUrl) {
        URL.revokeObjectURL(pdfBlobUrl);
        setPdfBlobUrl(null);
      }
      setPdfBytes(null);
      return;
    }

    let isMounted = true;
    setIsGenerating(true);

    const generatePdf = async () => {
      try {
        const formData = compileFormData();
        let bytes: Uint8Array;
        if (type === "registration") {
          bytes = await createOfficialRigRegistrationAcroFormPdf(formData, activeTemplate);
        } else {
          bytes = await createOfficialRigRenewalAcroFormPdf(formData, activeTemplate);
        }

        if (!isMounted) return;
        setPdfBytes(bytes);

        const blob = new Blob([bytes], { type: "application/pdf" });
        const url = URL.createObjectURL(blob);
        setPdfBlobUrl(url);
      } catch (err: any) {
        console.error("PDF generation failed:", err);
        toast({
          title: "PDF Auto-Population Error",
          description: err.message || "Failed to load and fill official PDF.",
          variant: "destructive",
        });
      } finally {
        if (isMounted) setIsGenerating(false);
      }
    };

    generatePdf();

    return () => {
      isMounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, type, application?.id, activeTemplate?.id, generationKey]);

  const handlePrint = () => {
    if (pdfBytes) {
      printPdfBytesDirectly(pdfBytes);
      toast({
        title: "Preparing Official Print Output",
        description: "Sending 100% vector PDF stream directly to your printer.",
      });
    }
  };

  const handleDownload = () => {
    if (pdfBytes) {
      const safeAgency = (application?.agencyName || "Agency").replace(/[\/\\?%*:|"<>]/g, "_");
      const safeFile = (application?.fileNo || application?.id || "File").replace(/[\/\\?%*:|"<>]/g, "_");
      const fileName = `${safeAgency}_${safeFile}_${type === "registration" ? "Rig_Registration_Form" : "Rig_Renewal_Form"}.pdf`;
      downloadPdfBytes(pdfBytes, fileName);
      toast({
        title: "Official Fillable PDF Downloaded",
        description: "Interactive form saved with all database records.",
      });
    }
  };

  const handleOpenNewTab = () => {
    if (pdfBlobUrl) {
      window.open(pdfBlobUrl, "_blank");
    }
  };

  const handleSaveSnapshot = async () => {
    if (!application?.id) return;
    setIsSaving(true);
    try {
      const formData = compileFormData();
      const now = new Date().toISOString();
      const currentDoc = applications.find((a) => a.id === application.id);
      const existingForms: SavedApplicationFormRecord[] = [...(currentDoc?.savedForms || application.savedForms || [])];
      const formId = uuidv4();
      const formTitle = `${type === "registration" ? "Rig Registration Form" : "Rig Renewal Form"} - ${application.fileNo || application.agencyRegistrationNo || format(new Date(), "dd/MM/yyyy")}`;

      const record: SavedApplicationFormRecord = {
        id: formId,
        type,
        title: formTitle,
        savedAt: now,
        savedBy: user?.name || user?.email || "Officer",
        formData,
        summary: {
          fileNo: application.fileNo || undefined,
          rigCount: (application.rigs || []).filter((r) => r.status === "Active").length,
          challanNo: formData.receipt_challan_no || undefined,
          paymentDate: formData.receipt_paid_date || undefined,
        },
      };

      existingForms.unshift(record);

      await updateApplication(application.id, {
        savedForms: existingForms,
      } as any);

      toast({
        title: "Saved to Repository",
        description: "Official form record stored in Saved Forms Repository.",
      });
    } catch (err: any) {
      toast({
        title: "Save Failed",
        description: err.message || "Could not save form.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const titleText =
    type === "registration"
      ? "Official Rig Registration Application Form (Fillable PDF)"
      : "Official Rig Renewal Application Form (Fillable PDF)";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-7xl h-[95vh] flex flex-col p-0 gap-0 overflow-hidden bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-800">
        {/* Top Control Bar */}
        <div className="p-3 sm:p-4 bg-slate-900 text-white flex flex-wrap items-center justify-between gap-3 border-b border-slate-800">
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2 rounded-lg bg-blue-600/30 text-blue-400 border border-blue-500/30">
              <FileText className="w-5 h-5" />
            </div>
            <div className="truncate">
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-base font-bold text-white truncate">{titleText}</h3>
                <Badge className="bg-emerald-600 text-white text-[10px] uppercase tracking-wider font-semibold">
                  5 Pages
                </Badge>
              </div>
              <p className="text-xs text-slate-300 truncate">
                File: <span className="font-semibold text-white">{application.fileNo || application.id}</span> |{" "}
                Agency: <span className="font-semibold text-white">{application.agencyName || "N/A"}</span>
                {activeTemplate && (
                  <span className="ml-2 text-blue-300 font-medium">
                    (Master Template: {activeTemplate.name})
                  </span>
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <Button
              size="sm"
              variant="outline"
              onClick={handlePrint}
              disabled={isGenerating || !pdfBytes}
              className="bg-white/10 hover:bg-white/20 text-white border-white/20 text-xs gap-1.5 font-semibold"
            >
              <Printer className="w-3.5 h-3.5 text-blue-300" />
              Print Official PDF
            </Button>

            <Button
              size="sm"
              variant="outline"
              onClick={handleDownload}
              disabled={isGenerating || !pdfBytes}
              className="bg-white/10 hover:bg-white/20 text-white border-white/20 text-xs gap-1.5 font-semibold"
            >
              <Download className="w-3.5 h-3.5 text-emerald-300" />
              Download PDF
            </Button>

            <Button
              size="sm"
              variant="outline"
              onClick={handleOpenNewTab}
              disabled={!pdfBlobUrl}
              className="bg-white/10 hover:bg-white/20 text-white border-white/20 text-xs gap-1.5"
              title="Open full-screen in new browser tab"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              Full Window
            </Button>

            <Button
              size="sm"
              variant="outline"
              onClick={handleSaveSnapshot}
              disabled={isSaving || !pdfBytes}
              className="bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-500 text-xs gap-1.5 font-semibold"
            >
              {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              Save Form Data
            </Button>

            {onSwitchToWebForm && (
              <Button
                size="sm"
                variant="outline"
                onClick={onSwitchToWebForm}
                className="bg-blue-600 hover:bg-blue-700 text-white border-blue-500 text-xs gap-1.5"
              >
                <Edit className="w-3.5 h-3.5" />
                Web Form View
              </Button>
            )}

            <Button
              size="sm"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              className="text-white hover:bg-white/10 text-xs"
            >
              Close
            </Button>
          </div>
        </div>

        {/* PDF Embedded Viewport */}
        <div className="flex-1 w-full bg-slate-100 dark:bg-slate-950 relative overflow-hidden">
          {isGenerating ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center space-y-3 bg-white/90 dark:bg-slate-900/90 z-20">
              <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
              <div className="text-center space-y-1">
                <p className="text-sm font-bold text-foreground">Auto-Populating Official Fillable PDF...</p>
                <p className="text-xs text-muted-foreground">
                  Injecting agency credentials, owner profiles, vehicle specs, and fee records into AcroForm fields.
                </p>
              </div>
            </div>
          ) : pdfBlobUrl ? (
            <div className="w-full h-full flex flex-col items-center justify-center p-6 bg-slate-100 dark:bg-slate-950 space-y-4">
              <div className="p-8 bg-white dark:bg-slate-900 border rounded-2xl shadow-md text-center max-w-md space-y-4">
                <div className="w-14 h-14 bg-blue-50 dark:bg-blue-950 text-blue-600 rounded-full flex items-center justify-center mx-auto border border-blue-200">
                  <FileText className="w-7 h-7" />
                </div>
                <div className="space-y-1">
                  <h4 className="font-bold text-base text-foreground">Official Fillable PDF Generated Successfully</h4>
                  <p className="text-xs text-muted-foreground">
                    Chrome security sandbox restricts inline blob previews. Click below to open your official 5-page PDF in a new tab or download it directly.
                  </p>
                </div>
                <div className="flex flex-col gap-2.5 pt-2">
                  <Button
                    onClick={handleSaveSnapshot}
                    disabled={isSaving}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white gap-2 text-xs font-semibold py-2.5"
                  >
                    {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save Form Data to Repository
                  </Button>
                  <Button
                    onClick={handleOpenNewTab}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white gap-2 text-xs font-semibold py-2.5"
                  >
                    <ExternalLink className="w-4 h-4" /> Open PDF in New Tab / Window
                  </Button>
                  <Button
                    onClick={handleDownload}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white gap-2 text-xs font-semibold py-2.5"
                  >
                    <Download className="w-4 h-4" /> Download Fillable PDF
                  </Button>
                  <Button
                    onClick={handlePrint}
                    variant="outline"
                    className="w-full gap-2 text-xs font-semibold py-2.5"
                  >
                    <Printer className="w-4 h-4 text-blue-600" /> Print Official PDF
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full space-y-3 text-muted-foreground p-6">
              <FileText className="w-12 h-12 text-slate-400" />
              <p className="text-sm font-semibold">Could not load PDF document preview.</p>
              <Button size="sm" variant="outline" onClick={() => setGenerationKey((k) => k + 1)}>
                <RefreshCw className="w-3.5 h-3.5 mr-1.5" /> Try Again
              </Button>
            </div>
          )}
        </div>

        {/* Footer info bar */}
        <div className="p-2.5 px-4 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>Interactive AcroForm: You can click and adjust any field values directly inside the PDF before printing.</span>
          </div>
          <span className="font-mono text-[11px]">Kerala Ground Water Authority</span>
        </div>
      </DialogContent>
    </Dialog>
  );
}
