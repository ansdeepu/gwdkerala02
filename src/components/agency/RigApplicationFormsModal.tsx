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

      // Section 2 Partner B
      ownerB_name: getVal("ownerB_name", partners[0]?.name || ""),
      ownerB_curr_address: getVal("ownerB_curr_address", partners[0]?.address || ""),
      ownerB_curr_village: getVal("ownerB_curr_village", ""),
      ownerB_curr_taluk: getVal("ownerB_curr_taluk", ""),
      ownerB_curr_panchayath: getVal("ownerB_curr_panchayath", ""),
      ownerB_curr_district: getVal("ownerB_curr_district", app.officeLocation || ""),
      ownerB_curr_pincode: getVal("ownerB_curr_pincode", ""),
      ownerB_curr_photo: getVal("ownerB_curr_photo", ""),

      ownerB_perm_address: getVal("ownerB_perm_address", partners[0]?.address || ""),
      ownerB_perm_village: getVal("ownerB_perm_village", ""),
      ownerB_perm_taluk: getVal("ownerB_perm_taluk", ""),
      ownerB_perm_panchayath: getVal("ownerB_perm_panchayath", ""),
      ownerB_perm_district: getVal("ownerB_perm_district", app.officeLocation || ""),
      ownerB_perm_pincode: getVal("ownerB_perm_pincode", ""),

      ownerB_id_type: getVal("ownerB_id_type", "Aadhaar"),
      ownerB_id_no: getVal("ownerB_id_no", ""),
      ownerB_pan: getVal("ownerB_pan", ""),
      ownerB_nominee: getVal("ownerB_nominee", ""),

      // Section 2 Partner C
      ownerC_name: getVal("ownerC_name", partners[1]?.name || ""),
      ownerC_curr_address: getVal("ownerC_curr_address", partners[1]?.address || ""),
      ownerC_curr_village: getVal("ownerC_curr_village", ""),
      ownerC_curr_taluk: getVal("ownerC_curr_taluk", ""),
      ownerC_curr_panchayath: getVal("ownerC_curr_panchayath", ""),
      ownerC_curr_district: getVal("ownerC_curr_district", app.officeLocation || ""),
      ownerC_curr_pincode: getVal("ownerC_curr_pincode", ""),
      ownerC_curr_photo: getVal("ownerC_curr_photo", ""),

      ownerC_perm_address: getVal("ownerC_perm_address", partners[1]?.address || ""),
      ownerC_perm_village: getVal("ownerC_perm_village", ""),
      ownerC_perm_taluk: getVal("ownerC_perm_taluk", ""),
      ownerC_perm_panchayath: getVal("ownerC_perm_panchayath", ""),
      ownerC_perm_district: getVal("ownerC_perm_district", app.officeLocation || ""),
      ownerC_perm_pincode: getVal("ownerC_perm_pincode", ""),

      ownerC_id_type: getVal("ownerC_id_type", "Aadhaar"),
      ownerC_id_no: getVal("ownerC_id_no", ""),
      ownerC_pan: getVal("ownerC_pan", ""),
      ownerC_nominee: getVal("ownerC_nominee", ""),

      date: formatToDDMMYYYY(getVal("date", format(new Date(), "dd/MM/yyyy"))),
      place: getVal("place", app.officeLocation || ""),

      // Office use
      office_date_recd: formatToDDMMYYYY(getVal("office_date_recd", "")),
      office_fee_details: getVal("office_fee_details", ""),
      office_paid_amount: getVal("office_paid_amount", ""),
      office_rig_inspected_date: formatToDDMMYYYY(getVal("office_rig_inspected_date", "")),
      office_recommendation: getVal("office_recommendation", ""),
      office_inspector_signature: getVal("office_inspector_signature", ""),

      // Receipt
      receipt_app_no: getVal("receipt_app_no", app.applicationNo || "APP/2026/001"),
      receipt_applicant_name: getVal("receipt_applicant_name", owner.name || ""),
      receipt_date_recd: formatToDDMMYYYY(getVal("receipt_date_recd", format(new Date(), "dd/MM/yyyy"))),
      receipt_paid_amount: getVal("receipt_paid_amount", "10000"),
      receipt_paid_date: formatToDDMMYYYY(getVal("receipt_paid_date", format(new Date(), "dd/MM/yyyy"))),
      receipt_agency_reg_check: getVal("receipt_agency_reg_check", true),
      receipt_rig1_check: getVal("receipt_rig1_check", true),
      receipt_rig2_check: getVal("receipt_rig2_check", false),
      receipt_rig3_check: getVal("receipt_rig3_check", false),
    };

    // Populate Rigs (Max 3: A, B, C)
    ["A", "B", "C"].forEach((letter, idx) => {
      const rig = activeRigs[idx];
      initial[`rig${letter}_type`] = getVal(`rig${letter}_type`, rig?.typeOfRigMalayalam || rig?.typeOfRig || "റോട്ടറി കം.ഡി.റ്റി.എച്ച് റിഗ്");
      initial[`rig${letter}_owner_name`] = getVal(`rig${letter}_owner_name`, rig ? owner.name : "");
      initial[`rig${letter}_owner_address`] = getVal(`rig${letter}_owner_address`, rig ? owner.address : "");
      initial[`rig${letter}_district`] = getVal(`rig${letter}_district`, app.officeLocation || "");
      initial[`rig${letter}_state`] = getVal(`rig${letter}_state`, "Kerala");
      initial[`rig${letter}_veh_type`] = getVal(`rig${letter}_veh_type`, rig?.rigVehicle?.type || "");
      initial[`rig${letter}_veh_reg`] = getVal(`rig${letter}_veh_reg`, rig?.rigVehicle?.regNo || "");
      initial[`rig${letter}_veh_chassis`] = getVal(`rig${letter}_veh_chassis`, rig?.rigVehicle?.chassisNo || "");
      initial[`rig${letter}_veh_engine`] = getVal(`rig${letter}_veh_engine`, rig?.rigVehicle?.engineNo || "");
      initial[`rig${letter}_comp_model`] = getVal(`rig${letter}_comp_model`, rig?.compressorDetails?.model || "");
      initial[`rig${letter}_comp_cap`] = getVal(`rig${letter}_comp_cap`, rig?.compressorDetails?.capacity || "");
      initial[`rig${letter}_gen_type`] = getVal(`rig${letter}_gen_type`, rig?.generatorDetails?.type || "");
      initial[`rig${letter}_gen_model`] = getVal(`rig${letter}_gen_model`, rig?.generatorDetails?.model || "");
      initial[`rig${letter}_gen_cap`] = getVal(`rig${letter}_gen_cap`, rig?.generatorDetails?.capacity || "");
      initial[`rig${letter}_gen_engine`] = getVal(`rig${letter}_gen_engine`, rig?.generatorDetails?.engineNo || "");
    });

    if (hasSaved) {
      const dateKeys = [
        "date",
        "office_date_recd",
        "office_rig_inspected_date",
        "receipt_date_recd",
        "receipt_paid_date",
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
      agency_reg_no: getVal("agency_reg_no", getVal("agencyRegNo", app.agencyRegistrationNo || "")),
      agency_reg_expiry: formatToDDMMYYYY(getVal("agency_reg_expiry", "")),
      registeredDistrict: getVal("registeredDistrict", app.officeLocation || ""),
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

      // Section 2 Owner
      owner_name: getVal("owner_name", owner.name || ""),
      owner_curr_address: getVal("owner_curr_address", owner.address || ""),
      owner_curr_village: getVal("owner_curr_village", ""),
      owner_curr_taluk: getVal("owner_curr_taluk", ""),
      owner_curr_panchayath: getVal("owner_curr_panchayath", ""),
      owner_curr_district: getVal("owner_curr_district", app.officeLocation || ""),
      owner_curr_pincode: getVal("owner_curr_pincode", ""),
      owner_curr_photo: getVal("owner_curr_photo", owner.photoUrl || ""),

      owner_perm_address: getVal("owner_perm_address", owner.address || ""),
      owner_perm_village: getVal("owner_perm_village", ""),
      owner_perm_taluk: getVal("owner_perm_taluk", ""),
      owner_perm_panchayath: getVal("owner_perm_panchayath", ""),
      owner_perm_district: getVal("owner_perm_district", app.officeLocation || ""),
      owner_perm_pincode: getVal("owner_perm_pincode", ""),

      owner_id_type: getVal("owner_id_type", "Aadhaar"),
      owner_id_no: getVal("owner_id_no", ""),
      owner_pan: getVal("owner_pan", ""),
      owner_exp: getVal("owner_exp", ""),
      owner_nominee: getVal("owner_nominee", ""),

      date: formatToDDMMYYYY(getVal("date", format(new Date(), "dd/MM/yyyy"))),
      place: getVal("place", app.officeLocation || ""),

      // Office use
      office_date_recd: formatToDDMMYYYY(getVal("office_date_recd", "")),
      office_fee_amount: getVal("office_fee_amount", ""),
      office_fee_date: formatToDDMMYYYY(getVal("office_fee_date", "")),
      office_rig_inspected_date: formatToDDMMYYYY(getVal("office_rig_inspected_date", "")),
      office_recommendation: getVal("office_recommendation", ""),

      // Receipt
      receipt_app_no: getVal("receipt_app_no", app.applicationNo || "APP/2026/001"),
      receipt_agency_name: getVal("receipt_agency_name", app.agencyName || ""),
      receipt_agency_reg_no: getVal("receipt_agency_reg_no", app.agencyRegistrationNo || ""),
      receipt_date_recd: formatToDDMMYYYY(getVal("receipt_date_recd", format(new Date(), "dd/MM/yyyy"))),
      receipt_fee_paid_amount: getVal("receipt_fee_paid_amount", "10000"),
      receipt_fee_paid_date: formatToDDMMYYYY(getVal("receipt_fee_paid_date", format(new Date(), "dd/MM/yyyy"))),
      receipt_renewal_count: getVal("receipt_renewal_count", "1"),
      receipt_new_rig_count: getVal("receipt_new_rig_count", "0"),
    };

    // Rig renewal details for rig1, rig2, rig3
    ["rig1", "rig2", "rig3"].forEach((rigKey, idx) => {
      const upperRigKey = `RIG${idx + 1}`;
      const rig = activeRigs[idx];
      initial[`${rigKey}_regNo`] = getVal(`${rigKey}_regNo`, getVal(`${upperRigKey}_regNo`, rig?.rigRegistrationNo || ""));
      initial[`${rigKey}_expiryDate`] = formatToDDMMYYYY(getVal(`${rigKey}_expiryDate`, getVal(`${upperRigKey}_expiryDate`, "")));
      initial[`${rigKey}_type`] = getVal(`${rigKey}_type`, getVal(`${upperRigKey}_type`, rig?.typeOfRigMalayalam || rig?.typeOfRig || "റോട്ടറി കം.ഡി.റ്റി.എച്ച് റിഗ്"));
      initial[`${rigKey}_ownerName`] = getVal(`${rigKey}_ownerName`, getVal(`${upperRigKey}_ownerName`, rig ? owner.name : ""));
      initial[`${rigKey}_address`] = getVal(`${rigKey}_address`, getVal(`${upperRigKey}_address`, rig ? owner.address : ""));
      initial[`${rigKey}_phone`] = getVal(`${rigKey}_phone`, getVal(`${upperRigKey}_phone`, owner.phone || ""));
      initial[`${rigKey}_mobile`] = getVal(`${rigKey}_mobile`, getVal(`${upperRigKey}_mobile`, owner.mobile || ""));
      initial[`${rigKey}_email`] = getVal(`${rigKey}_email`, getVal(`${upperRigKey}_email`, owner.email || ""));
      initial[`${rigKey}_district`] = getVal(`${rigKey}_district`, getVal(`${upperRigKey}_district`, app.officeLocation || ""));
      initial[`${rigKey}_state`] = getVal(`${rigKey}_state`, getVal(`${upperRigKey}_state`, "Kerala"));
      initial[`${rigKey}_pincode`] = getVal(`${rigKey}_pincode`, getVal(`${upperRigKey}_pincode`, ""));

      initial[`${rigKey}_veh_reg`] = getVal(`${rigKey}_veh_reg`, getVal(`${upperRigKey}_veh_reg`, rig?.rigVehicle?.regNo || ""));
      initial[`${rigKey}_veh_chassis`] = getVal(`${rigKey}_veh_chassis`, getVal(`${upperRigKey}_veh_chassis`, rig?.rigVehicle?.chassisNo || ""));
      initial[`${rigKey}_veh_engine`] = getVal(`${rigKey}_veh_engine`, getVal(`${upperRigKey}_veh_engine`, rig?.rigVehicle?.engineNo || ""));

      initial[`${rigKey}_has_support_veh`] = getVal(`${rigKey}_has_support_veh`, getVal(`${upperRigKey}_has_support_veh`, "No"));
      initial[`${rigKey}_sup_veh_reg`] = getVal(`${rigKey}_sup_veh_reg`, getVal(`${upperRigKey}_sup_veh_reg`, ""));
      initial[`${rigKey}_sup_veh_chassis`] = getVal(`${rigKey}_sup_veh_chassis`, getVal(`${upperRigKey}_sup_veh_chassis`, ""));
      initial[`${rigKey}_sup_veh_engine`] = getVal(`${rigKey}_sup_veh_engine`, getVal(`${upperRigKey}_sup_veh_engine`, ""));

      initial[`${rigKey}_comp_model`] = getVal(`${rigKey}_comp_model`, getVal(`${upperRigKey}_comp_model`, rig?.compressorDetails?.model || ""));
      initial[`${rigKey}_comp_cap`] = getVal(`${rigKey}_comp_cap`, getVal(`${upperRigKey}_comp_cap`, rig?.compressorDetails?.capacity || ""));

      initial[`${rigKey}_gen_type`] = getVal(`${rigKey}_gen_type`, getVal(`${upperRigKey}_gen_type`, rig?.generatorDetails?.type || ""));
      initial[`${rigKey}_gen_model`] = getVal(`${rigKey}_gen_model`, getVal(`${upperRigKey}_gen_model`, rig?.generatorDetails?.model || ""));
      initial[`${rigKey}_gen_cap`] = getVal(`${rigKey}_gen_cap`, getVal(`${upperRigKey}_gen_cap`, rig?.generatorDetails?.capacity || ""));
      initial[`${rigKey}_gen_engine`] = getVal(`${rigKey}_gen_engine`, getVal(`${upperRigKey}_gen_engine`, rig?.generatorDetails?.engineNo || ""));

      initial[`${rigKey}_well_depth`] = getVal(`${rigKey}_well_depth`, getVal(`${upperRigKey}_well_depth`, ""));
      initial[`${rigKey}_well_dia`] = getVal(`${rigKey}_well_dia`, getVal(`${upperRigKey}_well_dia`, ""));

      initial[`${rigKey}_op_name`] = getVal(`${rigKey}_op_name`, getVal(`${upperRigKey}_op_name`, ""));
      initial[`${rigKey}_op_address`] = getVal(`${rigKey}_op_address`, getVal(`${upperRigKey}_op_address`, ""));
      initial[`${rigKey}_op_phone`] = getVal(`${rigKey}_op_phone`, getVal(`${upperRigKey}_op_phone`, ""));
      initial[`${rigKey}_op_exp`] = getVal(`${rigKey}_op_exp`, getVal(`${upperRigKey}_op_exp`, ""));
      initial[`${rigKey}_op_id_type`] = getVal(`${rigKey}_op_id_type`, getVal(`${upperRigKey}_op_id_type`, "Aadhaar"));
      initial[`${rigKey}_op_id_no`] = getVal(`${rigKey}_op_id_no`, getVal(`${upperRigKey}_op_id_no`, ""));
    });

    if (hasSaved) {
      const dateKeys = [
        "date",
        "office_date_recd",
        "office_fee_date",
        "office_rig_inspected_date",
        "receipt_date_recd",
        "receipt_fee_paid_date",
        "agency_reg_expiry",
        "rig1_expiryDate",
        "rig2_expiryDate",
        "rig3_expiryDate",
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
