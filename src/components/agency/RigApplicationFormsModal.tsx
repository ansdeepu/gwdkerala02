"use client";

import React, { useState, useEffect } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Printer, ArrowLeft, RefreshCw, FileText, Save, RotateCcw, Trash2 } from "lucide-react";
import { useAgencyApplications, type AgencyApplication, type OwnerInfo } from "@/hooks/useAgencyApplications";
import { toast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { printDocument } from "@/lib/print-utils";
import { RigRegistrationPages } from "./RigRegistrationPages";
import { RigRenewalPages } from "./RigRenewalPages";

// Helper to format ISO or YYYY-MM-DD dates to dd/MM/yyyy (e.g., 2026-09-02 -> 02/09/2026)
function formatToDDMMYYYY(val: any): string {
  if (typeof val !== "string" || !val) return val || "";
  const trimmed = val.trim();
  const isoMatch = trimmed.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
  if (isoMatch) {
    const [_, yyyy, mm, dd] = isoMatch;
    const padDD = dd.padStart(2, "0");
    const padMM = mm.padStart(2, "0");
    return `${padDD}/${padMM}/${yyyy}`;
  }
  const dashMatch = trimmed.match(/^(\d{1,2})-(\d{1,2})-(\d{4})/);
  if (dashMatch) {
    const [_, dd, mm, yyyy] = dashMatch;
    const padDD = dd.padStart(2, "0");
    const padMM = mm.padStart(2, "0");
    return `${padDD}/${padMM}/${yyyy}`;
  }
  return val;
}

// ====================================================================
// FORM 1: RIG REGISTRATION APPLICATION FORM VIEW ( exact attached copy )
// ====================================================================
export function RigRegistrationApplicationFormView({
  application,
  onClose,
}: {
  application: AgencyApplication;
  onClose?: () => void;
}) {
  const { updateApplication } = useAgencyApplications();
  const [data, setData] = useState<Record<string, any>>({});
  const [isSaving, setIsSaving] = useState(false);
  const loadedAppIdRef = React.useRef<string | null>(null);

  const initFormData = (app: AgencyApplication, forceReset: boolean = false): Record<string, any> => {
    const activeRigs = (app.rigs || []).filter((r) => r.status === "Active");
    const owner = app.owner || ({} as OwnerInfo);
    const partners = app.partners || [];
    const savedFormData = forceReset
      ? {}
      : (app as any)?.officialFormData || (app as any)?.registrationFormData || {};

    const hasSaved = !forceReset && Object.keys(savedFormData).length > 0;

    // Helper: If user has saved a value (even an empty string ""), respect it!
    const getVal = (key: string, fallback: any) => {
      if (hasSaved && savedFormData[key] !== undefined && savedFormData[key] !== null) {
        return savedFormData[key];
      }
      return fallback;
    };

    const initial: Record<string, any> = {
      // Section 1
      agencyName: getVal("agencyName", app.agencyName || ""),
      address: getVal("address", owner.address || ""),
      address_line2: getVal("address_line2", ""),
      village: getVal("village", ""),
      taluk: getVal("taluk", ""),
      panchayath: getVal("panchayath", ""),
      district: getVal("district", app.officeLocation || ""),
      pincode: getVal("pincode", ""),
      gstin: getVal("gstin", ""),
      lsgdRegNo: getVal("lsgdRegNo", ""),

      // Section 2 Owner A
      ownerA_name: getVal("ownerA_name", owner.name || ""),
      ownerA_curr_address: getVal("ownerA_curr_address", owner.address || ""),
      ownerA_curr_address2: getVal("ownerA_curr_address2", ""),
      ownerA_curr_village: getVal("ownerA_curr_village", ""),
      ownerA_curr_taluk: getVal("ownerA_curr_taluk", ""),
      ownerA_curr_panchayath: getVal("ownerA_curr_panchayath", ""),
      ownerA_curr_district: getVal("ownerA_curr_district", app.officeLocation || ""),
      ownerA_curr_pincode: getVal("ownerA_curr_pincode", ""),
      ownerA_curr_photo: getVal("ownerA_curr_photo", owner.photoUrl || ""),

      ownerA_perm_address: getVal("ownerA_perm_address", owner.address || ""),
      ownerA_perm_address2: getVal("ownerA_perm_address2", ""),
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

      // Section 2 Partner B
      partnerB_name: getVal("partnerB_name", getVal("ownerB_name", partners[0]?.name || "")),
      partnerB_curr_address: getVal("partnerB_curr_address", getVal("ownerB_curr_address", partners[0]?.address || "")),
      partnerB_curr_village: getVal("partnerB_curr_village", ""),
      partnerB_curr_taluk: getVal("partnerB_curr_taluk", ""),
      partnerB_curr_panchayath: getVal("partnerB_curr_panchayath", ""),
      partnerB_curr_district: getVal("partnerB_curr_district", app.officeLocation || ""),
      partnerB_curr_pincode: getVal("partnerB_curr_pincode", ""),
      partnerB_photo: getVal("partnerB_photo", getVal("ownerB_curr_photo", "")),

      partnerB_perm_address: getVal("partnerB_perm_address", getVal("ownerB_perm_address", partners[0]?.address || "")),
      partnerB_perm_village: getVal("partnerB_perm_village", ""),
      partnerB_perm_taluk: getVal("partnerB_perm_taluk", ""),
      partnerB_perm_panchayath: getVal("partnerB_perm_panchayath", ""),
      partnerB_perm_district: getVal("partnerB_perm_district", app.officeLocation || ""),
      partnerB_perm_pincode: getVal("partnerB_perm_pincode", ""),

      partnerB_id_type: getVal("partnerB_id_type", "Aadhaar"),
      partnerB_id_no: getVal("partnerB_id_no", ""),
      partnerB_pan: getVal("partnerB_pan", ""),
      partnerB_nominee: getVal("partnerB_nominee", ""),

      // Section 2 Partner C
      partnerC_name: getVal("partnerC_name", getVal("ownerC_name", partners[1]?.name || "")),
      partnerC_curr_address: getVal("partnerC_curr_address", getVal("ownerC_curr_address", partners[1]?.address || "")),
      partnerC_curr_village: getVal("partnerC_curr_village", ""),
      partnerC_curr_taluk: getVal("partnerC_curr_taluk", ""),
      partnerC_curr_panchayath: getVal("partnerC_curr_panchayath", ""),
      partnerC_curr_district: getVal("partnerC_curr_district", app.officeLocation || ""),
      partnerC_curr_pincode: getVal("partnerC_curr_pincode", ""),
      partnerC_photo: getVal("partnerC_photo", getVal("ownerC_curr_photo", "")),

      partnerC_perm_address: getVal("partnerC_perm_address", getVal("ownerC_perm_address", partners[1]?.address || "")),
      partnerC_perm_village: getVal("partnerC_perm_village", ""),
      partnerC_perm_taluk: getVal("partnerC_perm_taluk", ""),
      partnerC_perm_panchayath: getVal("partnerC_perm_panchayath", ""),
      partnerC_perm_district: getVal("partnerC_perm_district", app.officeLocation || ""),
      partnerC_perm_pincode: getVal("partnerC_perm_pincode", ""),

      partnerC_id_type: getVal("partnerC_id_type", "Aadhaar"),
      partnerC_id_no: getVal("partnerC_id_no", ""),
      partnerC_pan: getVal("partnerC_pan", ""),
      partnerC_nominee: getVal("partnerC_nominee", ""),

      // Declaration
      declarationDate: formatToDDMMYYYY(getVal("declarationDate", getVal("date", format(new Date(), "dd/MM/yyyy")))),
      declarationPlace: getVal("declarationPlace", getVal("place", app.officeLocation || "")),

      // Office use
      office_appReceivedDate: formatToDDMMYYYY(getVal("office_appReceivedDate", getVal("office_date_recd", ""))),
      office_feeDetails: getVal("office_feeDetails", getVal("office_fee_details", (() => {
        const firstRig = activeRigs[0];
        if (firstRig?.applicationFee || firstRig?.applicationChallanNo) {
          const parts: string[] = [];
          if (firstRig.applicationChallanNo) parts.push(`Challan: ${firstRig.applicationChallanNo}`);
          if (firstRig.applicationPaymentDate) parts.push(`Date: ${formatToDDMMYYYY(firstRig.applicationPaymentDate)}`);
          return parts.join(', ');
        }
        return "";
      })())),
      office_feeAmount: getVal("office_feeAmount", getVal("office_paid_amount", (() => {
        const firstRig = activeRigs[0];
        if (firstRig?.applicationFee) return String(firstRig.applicationFee);
        return "";
      })())),
      office_rigInspectionDate: formatToDDMMYYYY(getVal("office_rigInspectionDate", getVal("office_rig_inspected_date", ""))),
      office_recommendation1: getVal("office_recommendation1", getVal("office_recommendation", "")),
      office_recommendation2: getVal("office_recommendation2", ""),
      office_recommendation3: getVal("office_recommendation3", ""),

      // Receipt
      receipt_appNo: getVal("receipt_appNo", getVal("receipt_app_no", (app as any).applicationNo || app.id || "APP/2026/001")),
      receipt_applicantName: getVal("receipt_applicantName", getVal("receipt_applicant_name", owner.name || "")),
      receipt_receivedDate: formatToDDMMYYYY(getVal("receipt_receivedDate", getVal("receipt_date_recd", format(new Date(), "dd/MM/yyyy")))),
      receipt_feeAmount: getVal("receipt_feeAmount", getVal("receipt_paid_amount", "10000")),
      receipt_feeDate: formatToDDMMYYYY(getVal("receipt_feeDate", getVal("receipt_paid_date", format(new Date(), "dd/MM/yyyy")))),
      receipt_hasAgencyReg: getVal("receipt_hasAgencyReg", getVal("receipt_agency_reg_check", true)),
      receipt_rigCount: getVal("receipt_rigCount", activeRigs.length || 1),
      receipt_signDate: formatToDDMMYYYY(getVal("receipt_signDate", format(new Date(), "dd/MM/yyyy"))),
    };

    // Populate Rigs (Max 3: A, B, C)
    ["A", "B", "C"].forEach((letter, idx) => {
      const rig = activeRigs[idx];
      initial[`rig${letter}_type`] = getVal(`rig${letter}_type`, rig?.typeOfRigMalayalam || rig?.typeOfRig || "റോട്ടറി കം.ഡി.റ്റി.എച്ച് റിഗ്");
      initial[`rig${letter}_ownerName`] = getVal(`rig${letter}_ownerName`, getVal(`rig${letter}_owner_name`, rig ? owner.name : ""));
      initial[`rig${letter}_ownerAddress`] = getVal(`rig${letter}_ownerAddress`, getVal(`rig${letter}_owner_address`, rig ? owner.address : ""));
      initial[`rig${letter}_ownerAddress2`] = getVal(`rig${letter}_ownerAddress2`, "");
      initial[`rig${letter}_ownerDistrict`] = getVal(`rig${letter}_ownerDistrict`, getVal(`rig${letter}_district`, app.officeLocation || ""));
      initial[`rig${letter}_ownerState`] = getVal(`rig${letter}_ownerState`, getVal(`rig${letter}_state`, "Kerala"));
      initial[`rig${letter}_ownerPincode`] = getVal(`rig${letter}_ownerPincode`, getVal(`rig${letter}_pincode`, ""));

      initial[`rig${letter}_vehType`] = getVal(`rig${letter}_vehType`, getVal(`rig${letter}_veh_type`, rig?.rigVehicle?.type || ""));
      initial[`rig${letter}_vehRegNo`] = getVal(`rig${letter}_vehRegNo`, getVal(`rig${letter}_veh_reg`, rig?.rigVehicle?.regNo || ""));
      initial[`rig${letter}_chassisNo`] = getVal(`rig${letter}_chassisNo`, getVal(`rig${letter}_veh_chassis`, rig?.rigVehicle?.chassisNo || ""));
      initial[`rig${letter}_engineNo`] = getVal(`rig${letter}_engineNo`, getVal(`rig${letter}_veh_engine`, rig?.rigVehicle?.engineNo || ""));

      initial[`rig${letter}_compModel`] = getVal(`rig${letter}_compModel`, getVal(`rig${letter}_comp_model`, rig?.compressorDetails?.model || ""));
      initial[`rig${letter}_compCapacity`] = getVal(`rig${letter}_compCapacity`, getVal(`rig${letter}_comp_cap`, rig?.compressorDetails?.capacity || ""));

      initial[`rig${letter}_genType`] = getVal(`rig${letter}_genType`, getVal(`rig${letter}_gen_type`, rig?.generatorDetails?.type || ""));
      initial[`rig${letter}_genModel`] = getVal(`rig${letter}_genModel`, getVal(`rig${letter}_gen_model`, rig?.generatorDetails?.model || ""));
      initial[`rig${letter}_genCapacity`] = getVal(`rig${letter}_genCapacity`, getVal(`rig${letter}_gen_cap`, rig?.generatorDetails?.capacity || ""));
      initial[`rig${letter}_genEngineNo`] = getVal(`rig${letter}_genEngineNo`, getVal(`rig${letter}_gen_engine`, rig?.generatorDetails?.engineNo || ""));

      initial[`rig${letter}_maxDepth`] = getVal(`rig${letter}_maxDepth`, getVal(`rig${letter}_well_depth`, ""));
      initial[`rig${letter}_maxDia`] = getVal(`rig${letter}_maxDia`, getVal(`rig${letter}_well_dia`, ""));

      initial[`rig${letter}_opName`] = getVal(`rig${letter}_opName`, getVal(`rig${letter}_op_name`, ""));
      initial[`rig${letter}_opAge`] = getVal(`rig${letter}_opAge`, getVal(`rig${letter}_op_age`, ""));
      initial[`rig${letter}_opExp`] = getVal(`rig${letter}_opExp`, getVal(`rig${letter}_op_exp`, ""));
      initial[`rig${letter}_opIdType`] = getVal(`rig${letter}_opIdType`, getVal(`rig${letter}_op_id_type`, "Aadhaar"));
      initial[`rig${letter}_opIdNo`] = getVal(`rig${letter}_opIdNo`, getVal(`rig${letter}_op_id_no`, ""));
    });

    if (hasSaved) {
      const dateKeys = [
        "declarationDate",
        "date",
        "office_appReceivedDate",
        "office_date_recd",
        "office_rigInspectionDate",
        "office_rig_inspected_date",
        "receipt_receivedDate",
        "receipt_date_recd",
        "receipt_feeDate",
        "receipt_paid_date",
        "receipt_signDate",
      ];
      Object.keys(savedFormData).forEach((k) => {
        if (savedFormData[k] !== undefined) {
          initial[k] = dateKeys.includes(k)
            ? formatToDDMMYYYY(savedFormData[k])
            : savedFormData[k];
        }
      });
    }

    return initial;
  };

  useEffect(() => {
    if (application && application.id !== loadedAppIdRef.current) {
      loadedAppIdRef.current = application.id;
      setData(initFormData(application, false));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [application?.id]);

  const update = (key: string, val: any) =>
    setData((prev) => ({
      ...prev,
      [key]: val,
    }));

  const handleClearAll = () => {
    if (window.confirm("എല്ലാ ഫീൽഡുകളിലെയും വിവരങ്ങൾ മായ്ച്ച് ശൂന്യമായ ഫോറം ആക്കണമെന്നുറപ്പാണോ? (Clear all fields in this form?)")) {
      const blankData: Record<string, any> = {};
      Object.keys(data).forEach((key) => {
        if (typeof data[key] === "boolean") {
          blankData[key] = false;
        } else {
          blankData[key] = "";
        }
      });
      setData(blankData);
      toast({
        title: "ഫോറം ക്ലിയർ ചെയ്തു",
        description: "എല്ലാ ഫീൽഡുകളും ശൂന്യമാക്കി.",
      });
    }
  };

  const handleResetToProfile = () => {
    if (window.confirm("അപേക്ഷാ പ്രൊഫൈലിലെ വിവരങ്ങൾ വീണ്ടും ഫോറത്തിലേക്ക് പുനഃസ്ഥാപിക്കണമെന്നുറപ്പാണോ? (Reset form data to application profile defaults?)")) {
      setData(initFormData(application, true));
      toast({
        title: "വിവരങ്ങൾ പുനഃസ്ഥാപിച്ചു",
        description: "അപേക്ഷാ പ്രൊഫൈലിലെ വിവരങ്ങൾ ഫോറത്തിൽ നിറച്ചു.",
      });
    }
  };

  const handlePrint = () => {
    printDocument("rig-reg-official-form", "ഡ്രില്ലിംഗ് ഏജൻസി/സ്ഥാപനവും ഡ്രില്ലിംഗ് റിഗ്ഗും രജിസ്റ്റർ ചെയ്യുന്നതിനുള്ള അപേക്ഷാ ഫോറം", "1.2cm 1.5cm 1.2cm 1.5cm");
  };

  const handleSave = async () => {
    if (!application?.id) {
      toast({
        title: "അപേക്ഷാ ഐഡി ലഭ്യമല്ല",
        description: "സേവ് ചെയ്യുന്നതിനായി സാധുവായ അപേക്ഷാ ഐഡി ആവശ്യമാണ്.",
        variant: "destructive",
      });
      return;
    }
    setIsSaving(true);
    try {
      await updateApplication(application.id, {
        officialFormData: data,
      } as any);
      toast({
        title: "വിജയകരമായി സംരക്ഷിച്ചു",
        description: "അപേക്ഷാ ഫോറത്തിലെ വിവരങ്ങൾ ഫയർബേസ് ഡാറ്റാബേസിൽ വിജയിച്ച് സംരക്ഷിച്ചു.",
      });
    } catch (err: any) {
      console.error("Firebase save error:", err);
      toast({
        title: "സേവ് ചെയ്യുന്നതിൽ പിശക്",
        description: err.message || "ഫയർബേസ് ഡാറ്റാബേസിലേക്ക് വിവരങ്ങൾ സംരക്ഷിക്കാൻ സാധിച്ചില്ല.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="w-full bg-slate-100 dark:bg-gray-950 text-black min-h-screen p-2 sm:p-4 space-y-4 font-sans">
      {/* Action Header */}
      <div className="max-w-4xl mx-auto p-3 bg-white dark:bg-gray-900 border rounded-lg shadow-sm flex flex-wrap items-center justify-between gap-3 print:hidden">
        <div className="flex items-center gap-2">
          {onClose && (
            <Button size="sm" variant="outline" onClick={onClose} className="gap-1 text-xs">
              <ArrowLeft className="w-3.5 h-3.5" /> തിരികെ
            </Button>
          )}
          <div>
            <h1 className="text-sm sm:text-base font-bold flex items-center gap-1.5 text-gray-900 dark:text-gray-100">
              <FileText className="w-4 h-4 text-blue-600" />
              അപേക്ഷാ ഫോറം (Rig Registration Official Form)
            </h1>
            <p className="text-[11px] text-gray-500">100% Exact Copy of Kerala Ground Water Authority Official Format</p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            size="sm"
            variant="outline"
            onClick={handleClearAll}
            className="border-red-200 text-red-600 hover:bg-red-50 gap-1.5 shadow-sm text-xs"
            title="എല്ലാ ഫീൽഡുകളും ശൂന്യമാക്കുക"
          >
            <Trash2 className="w-3.5 h-3.5" /> ശൂന്യമായ ഫോറം
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={handleResetToProfile}
            className="border-gray-200 text-gray-700 hover:bg-gray-100 gap-1.5 shadow-sm text-xs"
            title="പ്രൊഫൈൽ വിവരങ്ങൾ വീണ്ടും നിറയ്ക്കുക"
          >
            <RotateCcw className="w-3.5 h-3.5" /> പ്രൊഫൈൽ റീസെറ്റ്
          </Button>
          <Button
            size="sm"
            onClick={handleSave}
            disabled={isSaving}
            className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5 shadow-sm"
          >
            {isSaving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {isSaving ? "സംരക്ഷിക്കുന്നു..." : "സേവ് ചെയ്യുക / Save Data"}
          </Button>
          <Button size="sm" onClick={handlePrint} className="bg-blue-600 hover:bg-blue-700 text-white gap-1.5 shadow-sm">
            <Printer className="w-4 h-4" /> പ്രിന്റ് / PDF (5 പേജ്)
          </Button>
        </div>
      </div>

      {/* Printable Form Pages (5 Pages) */}
      <div id="rig-reg-official-form" className="max-w-4xl mx-auto space-y-6 print:space-y-0 print:m-0 print:p-0 print:max-w-none">
        <RigRegistrationPages data={data} update={update} />
      </div>
    </div>
  );
}

export function RigRegistrationApplicationFormModal({
  open,
  onOpenChange,
  application,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  application: AgencyApplication;
}) {
  if (!open) return null;
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl h-[95vh] flex flex-col p-0 gap-0 overflow-hidden bg-white text-black">
        <RigRegistrationApplicationFormView application={application} onClose={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  );
}

// ====================================================================
// FORM 2: RIG RENEWAL APPLICATION FORM VIEW ( exact attached copy )
// ====================================================================
export function RigRenewalApplicationFormView({
  application,
  onClose,
}: {
  application: AgencyApplication;
  onClose?: () => void;
}) {
  const { updateApplication } = useAgencyApplications();
  const [data, setData] = useState<Record<string, any>>({});
  const [isSaving, setIsSaving] = useState(false);
  const loadedAppIdRef = React.useRef<string | null>(null);

  const initRenewalFormData = (app: AgencyApplication, forceReset: boolean = false): Record<string, any> => {
    const activeRigs = (app.rigs || []).filter((r) => r.status === "Active");
    const owner = app.owner || ({} as OwnerInfo);
    const savedFormData = forceReset
      ? {}
      : (app as any)?.renewalFormData || (app as any)?.officialFormData || {};

    const hasSaved = !forceReset && Object.keys(savedFormData).length > 0;

    const getVal = (key: string, fallback: any) => {
      if (hasSaved && savedFormData[key] !== undefined && savedFormData[key] !== null) {
        return savedFormData[key];
      }
      return fallback;
    };

    const initial: Record<string, any> = {
      // Section A
      agencyName: getVal("agencyName", app.agencyName || ""),
      existingAgencyRegNo: getVal("existingAgencyRegNo", getVal("agency_reg_no", getVal("agencyRegNo", app.agencyRegistrationNo || ""))),
      agencyRegDistrict: getVal("agencyRegDistrict", getVal("registeredDistrict", app.officeLocation || "")),
      address: getVal("address", owner.address || ""),
      address_line2: getVal("address_line2", ""),
      phone: getVal("phone", (owner as any).phone || owner.mobile || ""),
      email: getVal("email", owner.email || ""),
      village: getVal("village", ""),
      taluk: getVal("taluk", ""),
      panchayath: getVal("panchayath", ""),
      district: getVal("district", app.officeLocation || ""),
      pincode: getVal("pincode", ""),
      gstin: getVal("gstin", ""),
      lsgdRegNo: getVal("lsgdRegNo", ""),

      // Summary table for Rig 1, 2, 3 on Page 1
      summaryRig1_type: getVal("summaryRig1_type", activeRigs[0]?.typeOfRigMalayalam || activeRigs[0]?.typeOfRig || "റോട്ടറി കം.ഡി.റ്റി.എച്ച് റിഗ്"),
      summaryRig1_regNo: getVal("summaryRig1_regNo", activeRigs[0]?.rigRegistrationNo || ""),
      summaryRig1_paidAmount: getVal("summaryRig1_paidAmount", activeRigs[0]?.applicationFee ? String(activeRigs[0].applicationFee) : "10000"),
      summaryRig1_challanDetails: getVal("summaryRig1_challanDetails", activeRigs[0]?.applicationChallanNo ? `Challan: ${activeRigs[0].applicationChallanNo}` : ""),
      summaryRig1_expiryDate: formatToDDMMYYYY(getVal("summaryRig1_expiryDate", "")),

      summaryRig2_type: getVal("summaryRig2_type", activeRigs[1]?.typeOfRigMalayalam || activeRigs[1]?.typeOfRig || ""),
      summaryRig2_regNo: getVal("summaryRig2_regNo", activeRigs[1]?.rigRegistrationNo || ""),
      summaryRig2_paidAmount: getVal("summaryRig2_paidAmount", activeRigs[1]?.applicationFee ? String(activeRigs[1].applicationFee) : ""),
      summaryRig2_challanDetails: getVal("summaryRig2_challanDetails", activeRigs[1]?.applicationChallanNo ? `Challan: ${activeRigs[1].applicationChallanNo}` : ""),
      summaryRig2_expiryDate: formatToDDMMYYYY(getVal("summaryRig2_expiryDate", "")),

      summaryRig3_type: getVal("summaryRig3_type", activeRigs[2]?.typeOfRigMalayalam || activeRigs[2]?.typeOfRig || ""),
      summaryRig3_regNo: getVal("summaryRig3_regNo", activeRigs[2]?.rigRegistrationNo || ""),
      summaryRig3_paidAmount: getVal("summaryRig3_paidAmount", activeRigs[2]?.applicationFee ? String(activeRigs[2].applicationFee) : ""),
      summaryRig3_challanDetails: getVal("summaryRig3_challanDetails", activeRigs[2]?.applicationChallanNo ? `Challan: ${activeRigs[2].applicationChallanNo}` : ""),
      summaryRig3_expiryDate: formatToDDMMYYYY(getVal("summaryRig3_expiryDate", "")),

      // Declaration
      declarationDate: formatToDDMMYYYY(getVal("declarationDate", getVal("date", format(new Date(), "dd/MM/yyyy")))),
      declarationPlace: getVal("declarationPlace", getVal("place", app.officeLocation || "")),

      // Office use
      office_appReceivedDate: formatToDDMMYYYY(getVal("office_appReceivedDate", getVal("office_date_recd", ""))),
      office_feeAmount: getVal("office_feeAmount", getVal("office_fee_amount", "10000")),
      office_feeDate: formatToDDMMYYYY(getVal("office_feeDate", getVal("office_fee_date", ""))),
      office_rigInspectionDate: formatToDDMMYYYY(getVal("office_rigInspectionDate", getVal("office_rig_inspected_date", ""))),
      office_recommendation1: getVal("office_recommendation1", getVal("office_recommendation", "")),
      office_recommendation2: getVal("office_recommendation2", ""),

      // Receipt
      receipt_appNo: getVal("receipt_appNo", getVal("receipt_app_no", (app as any).applicationNo || app.id || "APP/2026/001")),
      receipt_receivedDate: formatToDDMMYYYY(getVal("receipt_receivedDate", getVal("receipt_date_recd", format(new Date(), "dd/MM/yyyy")))),
      receipt_feeAmount: getVal("receipt_feeAmount", getVal("receipt_fee_paid_amount", "10000")),
      receipt_feeDate: formatToDDMMYYYY(getVal("receipt_feeDate", getVal("receipt_fee_paid_date", format(new Date(), "dd/MM/yyyy")))),
      receipt_renewalCount: getVal("receipt_renewalCount", getVal("receipt_renewal_count", activeRigs.length > 0 ? String(activeRigs.length) : "1")),
      receipt_newRigCount: getVal("receipt_newRigCount", getVal("receipt_new_rig_count", "0")),
      receipt_signDate: formatToDDMMYYYY(getVal("receipt_signDate", format(new Date(), "dd/MM/yyyy"))),
    };

    // Rig renewal details for rig1, rig2, rig3
    ["rig1", "rig2", "rig3"].forEach((rigKey, idx) => {
      const upperRigKey = `RIG${idx + 1}`;
      const rig = activeRigs[idx];
      initial[`${rigKey}_regNo`] = getVal(`${rigKey}_regNo`, getVal(`${upperRigKey}_regNo`, rig?.rigRegistrationNo || ""));
      initial[`${rigKey}_expiryDate`] = formatToDDMMYYYY(getVal(`${rigKey}_expiryDate`, getVal(`${upperRigKey}_expiryDate`, "")));
      initial[`${rigKey}_type`] = getVal(`${rigKey}_type`, getVal(`${upperRigKey}_type`, rig?.typeOfRigMalayalam || rig?.typeOfRig || "റോട്ടറി കം.ഡി.റ്റി.എച്ച് റിഗ്"));
      initial[`${rigKey}_ownerName`] = getVal(`${rigKey}_ownerName`, getVal(`${upperRigKey}_ownerName`, rig ? owner.name : ""));
      initial[`${rigKey}_ownerAddress`] = getVal(`${rigKey}_ownerAddress`, getVal(`${upperRigKey}_address`, rig ? owner.address : ""));
      initial[`${rigKey}_ownerAddress2`] = getVal(`${rigKey}_ownerAddress2`, "");
      initial[`${rigKey}_ownerPhone`] = getVal(`${rigKey}_ownerPhone`, getVal(`${upperRigKey}_phone`, (owner as any).phone || owner.mobile || ""));
      initial[`${rigKey}_ownerMobile`] = getVal(`${rigKey}_ownerMobile`, getVal(`${upperRigKey}_mobile`, owner.mobile || ""));
      initial[`${rigKey}_ownerEmail`] = getVal(`${rigKey}_ownerEmail`, getVal(`${upperRigKey}_email`, owner.email || ""));
      initial[`${rigKey}_ownerDistrict`] = getVal(`${rigKey}_ownerDistrict`, getVal(`${upperRigKey}_district`, app.officeLocation || ""));
      initial[`${rigKey}_ownerState`] = getVal(`${rigKey}_ownerState`, getVal(`${upperRigKey}_state`, "Kerala"));
      initial[`${rigKey}_ownerPincode`] = getVal(`${rigKey}_ownerPincode`, getVal(`${upperRigKey}_pincode`, ""));

      initial[`${rigKey}_vehRegNo`] = getVal(`${rigKey}_vehRegNo`, getVal(`${upperRigKey}_veh_reg`, rig?.rigVehicle?.regNo || ""));
      initial[`${rigKey}_chassisNo`] = getVal(`${rigKey}_chassisNo`, getVal(`${upperRigKey}_veh_chassis`, rig?.rigVehicle?.chassisNo || ""));
      initial[`${rigKey}_engineNo`] = getVal(`${rigKey}_engineNo`, getVal(`${upperRigKey}_veh_engine`, rig?.rigVehicle?.engineNo || ""));

      initial[`${rigKey}_hasSupportVeh`] = getVal(`${rigKey}_hasSupportVeh`, getVal(`${upperRigKey}_has_support_veh`, "No"));
      initial[`${rigKey}_supportVehRegNo`] = getVal(`${rigKey}_supportVehRegNo`, getVal(`${upperRigKey}_sup_veh_reg`, ""));
      initial[`${rigKey}_supportChassisNo`] = getVal(`${rigKey}_supportChassisNo`, getVal(`${upperRigKey}_sup_veh_chassis`, ""));
      initial[`${rigKey}_supportEngineNo`] = getVal(`${rigKey}_supportEngineNo`, getVal(`${upperRigKey}_sup_veh_engine`, ""));

      initial[`${rigKey}_compModel`] = getVal(`${rigKey}_compModel`, getVal(`${upperRigKey}_comp_model`, rig?.compressorDetails?.model || ""));
      initial[`${rigKey}_compCapacity`] = getVal(`${rigKey}_compCapacity`, getVal(`${upperRigKey}_comp_cap`, rig?.compressorDetails?.capacity || ""));

      initial[`${rigKey}_genType`] = getVal(`${rigKey}_genType`, getVal(`${upperRigKey}_gen_type`, rig?.generatorDetails?.type || ""));
      initial[`${rigKey}_genModel`] = getVal(`${rigKey}_genModel`, getVal(`${upperRigKey}_gen_model`, rig?.generatorDetails?.model || ""));
      initial[`${rigKey}_genCapacity`] = getVal(`${rigKey}_genCapacity`, getVal(`${upperRigKey}_gen_cap`, rig?.generatorDetails?.capacity || ""));
      initial[`${rigKey}_genEngineNo`] = getVal(`${rigKey}_genEngineNo`, getVal(`${upperRigKey}_gen_engine`, rig?.generatorDetails?.engineNo || ""));

      initial[`${rigKey}_maxDepth`] = getVal(`${rigKey}_maxDepth`, getVal(`${upperRigKey}_well_depth`, ""));
      initial[`${rigKey}_maxDia`] = getVal(`${rigKey}_maxDia`, getVal(`${upperRigKey}_well_dia`, ""));

      initial[`${rigKey}_opName`] = getVal(`${rigKey}_opName`, getVal(`${upperRigKey}_op_name`, ""));
      initial[`${rigKey}_opAge`] = getVal(`${rigKey}_opAge`, "");
      initial[`${rigKey}_opExp`] = getVal(`${rigKey}_opExp`, getVal(`${upperRigKey}_op_exp`, ""));
      initial[`${rigKey}_opIdType`] = getVal(`${rigKey}_opIdType`, getVal(`${upperRigKey}_op_id_type`, "Aadhaar"));
      initial[`${rigKey}_opIdNo`] = getVal(`${rigKey}_opIdNo`, getVal(`${upperRigKey}_op_id_no`, ""));
    });

    if (hasSaved) {
      const dateKeys = [
        "declarationDate",
        "date",
        "office_appReceivedDate",
        "office_date_recd",
        "office_feeDate",
        "office_fee_date",
        "office_rigInspectionDate",
        "office_rig_inspected_date",
        "receipt_receivedDate",
        "receipt_date_recd",
        "receipt_feeDate",
        "receipt_fee_paid_date",
        "summaryRig1_expiryDate",
        "summaryRig2_expiryDate",
        "summaryRig3_expiryDate",
        "rig1_expiryDate",
        "rig2_expiryDate",
        "rig3_expiryDate",
        "receipt_signDate",
      ];
      Object.keys(savedFormData).forEach((k) => {
        if (savedFormData[k] !== undefined) {
          initial[k] = dateKeys.includes(k)
            ? formatToDDMMYYYY(savedFormData[k])
            : savedFormData[k];
        }
      });
    }

    return initial;
  };

  useEffect(() => {
    if (application && application.id !== loadedAppIdRef.current) {
      loadedAppIdRef.current = application.id;
      setData(initRenewalFormData(application, false));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [application?.id]);

  const update = (key: string, val: any) =>
    setData((prev) => ({
      ...prev,
      [key]: val,
    }));

  const handleClearAll = () => {
    if (window.confirm("എല്ലാ ഫീൽഡുകളിലെയും വിവരങ്ങൾ മായ്ച്ച് ശൂന്യമായ ഫോറം ആക്കണമെന്നുറപ്പാണോ? (Clear all fields in this renewal form?)")) {
      const blankData: Record<string, any> = {};
      Object.keys(data).forEach((key) => {
        if (typeof data[key] === "boolean") {
          blankData[key] = false;
        } else {
          blankData[key] = "";
        }
      });
      setData(blankData);
      toast({
        title: "ഫോറം ക്ലിയർ ചെയ്തു",
        description: "എല്ലാ ഫീൽഡുകളും ശൂന്യമാക്കി.",
      });
    }
  };

  const handleResetToProfile = () => {
    if (window.confirm("അപേക്ഷാ പ്രൊഫൈലിലെ വിവരങ്ങൾ വീണ്ടും ഫോറത്തിലേക്ക് പുനഃസ്ഥാപിക്കണമെന്നുറപ്പാണോ? (Reset form data to application profile defaults?)")) {
      setData(initRenewalFormData(application, true));
      toast({
        title: "വിവരങ്ങൾ പുനഃസ്ഥാപിച്ചു",
        description: "അപേക്ഷാ പ്രൊഫൈലിലെ വിവരങ്ങൾ ഫോറത്തിൽ നിറച്ചു.",
      });
    }
  };

  const handlePrint = () => {
    printDocument("rig-renewal-official-form", "റിഗ് രജിസ്ട്രേഷൻ പുതുക്കൽ/പുതിയ റിഗ് രജിസ്ട്രേഷൻ അപേക്ഷാ ഫോറം", "1.2cm 1.5cm 1.2cm 1.5cm");
  };

  const handleSave = async () => {
    if (!application?.id) {
      toast({
        title: "അപേക്ഷാ ഐഡി ലഭ്യമല്ല",
        description: "സേവ് ചെയ്യുന്നതിനായി സാധുവായ അപേക്ഷാ ഐഡി ആവശ്യമാണ്.",
        variant: "destructive",
      });
      return;
    }
    setIsSaving(true);
    try {
      await updateApplication(application.id, {
        renewalFormData: data,
      } as any);
      toast({
        title: "വിജയകരമായി സംരക്ഷിച്ചു",
        description: "പുതുക്കൽ അപേക്ഷാ ഫോറത്തിലെ വിവരങ്ങൾ ഫയർബേസ് ഡാറ്റാബേസിൽ വിജയിച്ച് സംരക്ഷിച്ചു.",
      });
    } catch (err: any) {
      console.error("Firebase save error:", err);
      toast({
        title: "സേവ് ചെയ്യുന്നതിൽ പിശക്",
        description: err.message || "ഫയർബേസ് ഡാറ്റാബേസിലേക്ക് വിവരങ്ങൾ സംരക്ഷിക്കാൻ സാധിച്ചില്ല.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="w-full bg-slate-100 dark:bg-gray-950 text-black min-h-screen p-2 sm:p-4 space-y-4 font-sans">
      {/* Action Header */}
      <div className="max-w-4xl mx-auto p-3 bg-white dark:bg-gray-900 border rounded-lg shadow-sm flex flex-wrap items-center justify-between gap-3 print:hidden">
        <div className="flex items-center gap-2">
          {onClose && (
            <Button size="sm" variant="outline" onClick={onClose} className="gap-1 text-xs">
              <ArrowLeft className="w-3.5 h-3.5" /> തിരികെ
            </Button>
          )}
          <div>
            <h1 className="text-sm sm:text-base font-bold flex items-center gap-1.5 text-gray-900 dark:text-gray-100">
              <FileText className="w-4 h-4 text-emerald-600" />
              പുതുക്കൽ അപേക്ഷാ ഫോറം (Rig Renewal Official Form)
            </h1>
            <p className="text-[11px] text-gray-500">100% Exact Copy of Kerala Ground Water Authority Official Format</p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            size="sm"
            variant="outline"
            onClick={handleClearAll}
            className="border-red-200 text-red-600 hover:bg-red-50 gap-1.5 shadow-sm text-xs"
            title="എല്ലാ ഫീൽഡുകളും ശൂന്യമാക്കുക"
          >
            <Trash2 className="w-3.5 h-3.5" /> ശൂന്യമായ ഫോറം
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={handleResetToProfile}
            className="border-gray-200 text-gray-700 hover:bg-gray-100 gap-1.5 shadow-sm text-xs"
            title="പ്രൊഫൈൽ വിവരങ്ങൾ വീണ്ടും നിറയ്ക്കുക"
          >
            <RotateCcw className="w-3.5 h-3.5" /> പ്രൊഫൈൽ റീസെറ്റ്
          </Button>
          <Button
            size="sm"
            onClick={handleSave}
            disabled={isSaving}
            className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5 shadow-sm"
          >
            {isSaving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {isSaving ? "സംരക്ഷിക്കുന്നു..." : "സേവ് ചെയ്യുക / Save Data"}
          </Button>
          <Button size="sm" onClick={handlePrint} className="bg-emerald-700 hover:bg-emerald-800 text-white gap-1.5 shadow-sm">
            <Printer className="w-4 h-4" /> പ്രിന്റ് / PDF (5 പേജ്)
          </Button>
        </div>
      </div>

      {/* Printable Form Pages (5 Pages) */}
      <div id="rig-renewal-official-form" className="max-w-4xl mx-auto space-y-6 print:space-y-0 print:m-0 print:p-0 print:max-w-none">
        <RigRenewalPages data={data} update={update} />
      </div>
    </div>
  );
}

export function RigRenewalApplicationFormModal({
  open,
  onOpenChange,
  application,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  application: AgencyApplication;
}) {
  if (!open) return null;
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl h-[95vh] flex flex-col p-0 gap-0 overflow-hidden bg-white text-black">
        <RigRenewalApplicationFormView application={application} onClose={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  );
}
