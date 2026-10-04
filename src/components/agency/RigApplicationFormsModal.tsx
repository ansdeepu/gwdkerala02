"use client";

import React, { useState, useEffect } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Printer,
  ArrowLeft,
  RefreshCw,
  FileText,
  Save,
  RotateCcw,
  Trash2,
  FileDown,
  Layers,
  Sparkles,
} from "lucide-react";
import { useAgencyApplications, type AgencyApplication, type OwnerInfo, type SavedApplicationFormRecord } from "@/hooks/useAgencyApplications";
import { useMasterPdfTemplates } from "@/hooks/useMasterPdfTemplates";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { v4 as uuidv4 } from "uuid";
import { printDocument } from "@/lib/print-utils";
import {
  createOfficialRigRegistrationAcroFormPdf,
  createOfficialRigRenewalAcroFormPdf,
  downloadPdfBytes,
} from "@/lib/pdf/acroFormPdfService";
import Link from "next/link";
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
  initialSavedForm,
  onClose,
}: {
  application: AgencyApplication;
  initialSavedForm?: SavedApplicationFormRecord | null;
  onClose?: () => void;
}) {
  const { applications, updateApplication } = useAgencyApplications();
  const { getActiveTemplateForModule } = useMasterPdfTemplates();
  const { user } = useAuth();
  const [data, setData] = useState<Record<string, any>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [isGeneratingAcroForm, setIsGeneratingAcroForm] = useState(false);
  const loadedAppIdRef = React.useRef<string | null>(null);
  const currentFormIdRef = React.useRef<string>(initialSavedForm?.id || uuidv4());

  useEffect(() => {
    currentFormIdRef.current = initialSavedForm?.id || uuidv4();
  }, [initialSavedForm?.id]);

  const activeMasterTemplate = getActiveTemplateForModule("rig_registration");
  const isSuperAdmin = user?.role === "superAdmin" || user?.email === "keralagwd@gmail.com";

  const initFormData = (app: AgencyApplication, forceReset: boolean = false): Record<string, any> => {
    const activeRigs = (app.rigs || []).filter((r) => r.status === "Active");
    const owner = app.owner || ({} as OwnerInfo);
    const partners = app.partners || [];
    const savedFormData = forceReset
      ? {}
      : initialSavedForm?.formData || (app as any)?.officialFormData || (app as any)?.registrationFormData || {};

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

      date: formatToDDMMYYYY(getVal("date", getVal("declarationDate", format(new Date(), "dd/MM/yyyy")))),
      place: getVal("place", getVal("declarationPlace", app.officeLocation || "")),
      declarationDate: formatToDDMMYYYY(getVal("declarationDate", getVal("date", format(new Date(), "dd/MM/yyyy")))),
      declarationPlace: getVal("declarationPlace", getVal("place", app.officeLocation || "")),

      // Office use
      office_date_recd: formatToDDMMYYYY(getVal("office_date_recd", getVal("office_appReceivedDate", ""))),
      office_appReceivedDate: formatToDDMMYYYY(getVal("office_appReceivedDate", getVal("office_date_recd", ""))),
      office_fee_details: getVal("office_fee_details", getVal("office_feeDetails", (() => {
        const firstRig = activeRigs[0];
        if (firstRig?.applicationFee || firstRig?.applicationChallanNo) {
          const parts: string[] = [];
          if (firstRig.applicationChallanNo) parts.push(`Challan: ${firstRig.applicationChallanNo}`);
          if (firstRig.applicationPaymentDate) parts.push(`Date: ${formatToDDMMYYYY(firstRig.applicationPaymentDate)}`);
          return parts.join(', ');
        }
        return "";
      })())),
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
      office_paid_amount: getVal("office_paid_amount", getVal("office_feeAmount", (() => {
        const firstRig = activeRigs[0];
        if (firstRig?.applicationFee) return String(firstRig.applicationFee);
        return "";
      })())),
      office_feeAmount: getVal("office_feeAmount", getVal("office_paid_amount", (() => {
        const firstRig = activeRigs[0];
        if (firstRig?.applicationFee) return String(firstRig.applicationFee);
        return "";
      })())),
      office_rig_inspected_date: formatToDDMMYYYY(getVal("office_rig_inspected_date", getVal("office_rigInspectionDate", ""))),
      office_appReceived_date: formatToDDMMYYYY(getVal("office_rigInspectionDate", getVal("office_rig_inspected_date", ""))),
      office_rigInspectionDate: formatToDDMMYYYY(getVal("office_rigInspectionDate", getVal("office_rig_inspected_date", ""))),
      office_recommendation: getVal("office_recommendation", getVal("office_recommendation1", "")),
      office_recommendation1: getVal("office_recommendation1", getVal("office_recommendation", "")),
      office_inspector_signature: getVal("office_inspector_signature", ""),

      // Receipt
      receipt_app_no: getVal("receipt_app_no", getVal("receipt_appNo", (app as any).applicationNo || app.id || "APP/2026/001")),
      receipt_appNo: getVal("receipt_appNo", getVal("receipt_app_no", (app as any).applicationNo || app.id || "APP/2026/001")),
      receipt_applicant_name: getVal("receipt_applicant_name", getVal("receipt_applicantName", owner.name || "")),
      receipt_applicantName: getVal("receipt_applicantName", getVal("receipt_applicant_name", owner.name || "")),
      receipt_date_recd: formatToDDMMYYYY(getVal("receipt_date_recd", getVal("receipt_receivedDate", format(new Date(), "dd/MM/yyyy")))),
      receipt_receivedDate: formatToDDMMYYYY(getVal("receipt_receivedDate", getVal("receipt_date_recd", format(new Date(), "dd/MM/yyyy")))),
      receipt_paid_amount: getVal("receipt_paid_amount", getVal("receipt_feeAmount", "10000")),
      receipt_feeAmount: getVal("receipt_feeAmount", getVal("receipt_paid_amount", "10000")),
      receipt_paid_date: formatToDDMMYYYY(getVal("receipt_paid_date", getVal("receipt_feeDate", format(new Date(), "dd/MM/yyyy")))),
      receipt_feeDate: formatToDDMMYYYY(getVal("receipt_feeDate", getVal("receipt_paid_date", format(new Date(), "dd/MM/yyyy")))),
      receipt_agency_reg_check: getVal("receipt_agency_reg_check", getVal("receipt_hasAgencyReg", true)),
      receipt_hasAgencyReg: getVal("receipt_hasAgencyReg", getVal("receipt_agency_reg_check", true)),
      receipt_rigCount: getVal("receipt_rigCount", activeRigs.length || 1),
      receipt_rig1_check: getVal("receipt_rig1_check", true),
      receipt_rig2_check: getVal("receipt_rig2_check", false),
      receipt_rig3_check: getVal("receipt_rig3_check", false),
    };

    // Populate Rigs (Max 3: A, B, C)
    ["A", "B", "C"].forEach((letter, idx) => {
      const rig = activeRigs[idx];
      initial[`rig${letter}_type`] = getVal(`rig${letter}_type`, rig?.typeOfRigMalayalam || rig?.typeOfRig || "റോട്ടറി കം.ഡി.റ്റി.എച്ച് റിഗ്");
      initial[`rig${letter}_owner_name`] = getVal(`rig${letter}_owner_name`, getVal(`rig${letter}_ownerName`, rig ? owner.name : ""));
      initial[`rig${letter}_ownerName`] = getVal(`rig${letter}_ownerName`, getVal(`rig${letter}_owner_name`, rig ? owner.name : ""));
      initial[`rig${letter}_owner_address`] = getVal(`rig${letter}_owner_address`, getVal(`rig${letter}_ownerAddress`, rig ? owner.address : ""));
      initial[`rig${letter}_ownerAddress`] = getVal(`rig${letter}_ownerAddress`, getVal(`rig${letter}_owner_address`, rig ? owner.address : ""));
      initial[`rig${letter}_district`] = getVal(`rig${letter}_district`, getVal(`rig${letter}_ownerDistrict`, app.officeLocation || ""));
      initial[`rig${letter}_ownerDistrict`] = getVal(`rig${letter}_ownerDistrict`, getVal(`rig${letter}_district`, app.officeLocation || ""));
      initial[`rig${letter}_state`] = getVal(`rig${letter}_state`, getVal(`rig${letter}_ownerState`, "Kerala"));
      initial[`rig${letter}_ownerState`] = getVal(`rig${letter}_ownerState`, getVal(`rig${letter}_state`, "Kerala"));
      initial[`rig${letter}_pincode`] = getVal(`rig${letter}_pincode`, getVal(`rig${letter}_ownerPincode`, ""));
      initial[`rig${letter}_ownerPincode`] = getVal(`rig${letter}_ownerPincode`, getVal(`rig${letter}_pincode`, ""));

      initial[`rig${letter}_veh_type`] = getVal(`rig${letter}_veh_type`, getVal(`rig${letter}_vehType`, rig?.rigVehicle?.type || ""));
      initial[`rig${letter}_vehType`] = getVal(`rig${letter}_vehType`, getVal(`rig${letter}_veh_type`, rig?.rigVehicle?.type || ""));
      initial[`rig${letter}_veh_reg`] = getVal(`rig${letter}_veh_reg`, getVal(`rig${letter}_vehRegNo`, rig?.rigVehicle?.regNo || ""));
      initial[`rig${letter}_vehRegNo`] = getVal(`rig${letter}_vehRegNo`, getVal(`rig${letter}_veh_reg`, rig?.rigVehicle?.regNo || ""));
      initial[`rig${letter}_veh_chassis`] = getVal(`rig${letter}_veh_chassis`, getVal(`rig${letter}_chassisNo`, rig?.rigVehicle?.chassisNo || ""));
      initial[`rig${letter}_chassisNo`] = getVal(`rig${letter}_chassisNo`, getVal(`rig${letter}_veh_chassis`, rig?.rigVehicle?.chassisNo || ""));
      initial[`rig${letter}_veh_engine`] = getVal(`rig${letter}_veh_engine`, getVal(`rig${letter}_engineNo`, rig?.rigVehicle?.engineNo || ""));
      initial[`rig${letter}_engineNo`] = getVal(`rig${letter}_engineNo`, getVal(`rig${letter}_veh_engine`, rig?.rigVehicle?.engineNo || ""));

      initial[`rig${letter}_comp_model`] = getVal(`rig${letter}_comp_model`, getVal(`rig${letter}_compModel`, rig?.compressorDetails?.model || ""));
      initial[`rig${letter}_compModel`] = getVal(`rig${letter}_compModel`, getVal(`rig${letter}_comp_model`, rig?.compressorDetails?.model || ""));
      initial[`rig${letter}_comp_cap`] = getVal(`rig${letter}_comp_cap`, getVal(`rig${letter}_compCapacity`, rig?.compressorDetails?.capacity || ""));
      initial[`rig${letter}_compCapacity`] = getVal(`rig${letter}_compCapacity`, getVal(`rig${letter}_comp_cap`, rig?.compressorDetails?.capacity || ""));

      initial[`rig${letter}_gen_type`] = getVal(`rig${letter}_gen_type`, getVal(`rig${letter}_genType`, rig?.generatorDetails?.type || ""));
      initial[`rig${letter}_genType`] = getVal(`rig${letter}_genType`, getVal(`rig${letter}_gen_type`, rig?.generatorDetails?.type || ""));
      initial[`rig${letter}_gen_model`] = getVal(`rig${letter}_gen_model`, getVal(`rig${letter}_genModel`, rig?.generatorDetails?.model || ""));
      initial[`rig${letter}_genModel`] = getVal(`rig${letter}_genModel`, getVal(`rig${letter}_gen_model`, rig?.generatorDetails?.model || ""));
      initial[`rig${letter}_gen_cap`] = getVal(`rig${letter}_gen_cap`, getVal(`rig${letter}_genCapacity`, rig?.generatorDetails?.capacity || ""));
      initial[`rig${letter}_genCapacity`] = getVal(`rig${letter}_genCapacity`, getVal(`rig${letter}_gen_cap`, rig?.generatorDetails?.capacity || ""));
      initial[`rig${letter}_gen_engine`] = getVal(`rig${letter}_gen_engine`, getVal(`rig${letter}_genEngineNo`, rig?.generatorDetails?.engineNo || ""));
      initial[`rig${letter}_genEngineNo`] = getVal(`rig${letter}_genEngineNo`, getVal(`rig${letter}_gen_engine`, rig?.generatorDetails?.engineNo || ""));

      initial[`rig${letter}_well_depth`] = getVal(`rig${letter}_well_depth`, getVal(`rig${letter}_maxDepth`, ""));
      initial[`rig${letter}_maxDepth`] = getVal(`rig${letter}_maxDepth`, getVal(`rig${letter}_well_depth`, ""));
      initial[`rig${letter}_well_dia`] = getVal(`rig${letter}_well_dia`, getVal(`rig${letter}_maxDia`, ""));
      initial[`rig${letter}_maxDia`] = getVal(`rig${letter}_maxDia`, getVal(`rig${letter}_well_dia`, ""));

      initial[`rig${letter}_op_name`] = getVal(`rig${letter}_op_name`, getVal(`rig${letter}_opName`, ""));
      initial[`rig${letter}_opName`] = getVal(`rig${letter}_opName`, getVal(`rig${letter}_op_name`, ""));
      initial[`rig${letter}_op_age`] = getVal(`rig${letter}_op_age`, getVal(`rig${letter}_opAge`, ""));
      initial[`rig${letter}_opAge`] = getVal(`rig${letter}_opAge`, getVal(`rig${letter}_op_age`, ""));
      initial[`rig${letter}_op_exp`] = getVal(`rig${letter}_op_exp`, getVal(`rig${letter}_opExp`, ""));
      initial[`rig${letter}_opExp`] = getVal(`rig${letter}_opExp`, getVal(`rig${letter}_op_exp`, ""));
      initial[`rig${letter}_op_id_type`] = getVal(`rig${letter}_op_id_type`, getVal(`rig${letter}_opIdType`, "Aadhaar"));
      initial[`rig${letter}_opIdType`] = getVal(`rig${letter}_opIdType`, getVal(`rig${letter}_op_id_type`, "Aadhaar"));
      initial[`rig${letter}_op_id_no`] = getVal(`rig${letter}_op_id_no`, getVal(`rig${letter}_opIdNo`, ""));
      initial[`rig${letter}_opIdNo`] = getVal(`rig${letter}_opIdNo`, getVal(`rig${letter}_op_id_no`, ""));
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

    // Self-healing data check to correct any field mix-ups, legacy bad entries, or key shifts
    ["A", "B", "C"].forEach((letter, idx) => {
      let type = initial[`rig${letter}_type`] || "";
      let name = initial[`rig${letter}_ownerName`] || "";
      let addr = initial[`rig${letter}_ownerAddress`] || "";
      let dist = initial[`rig${letter}_ownerDistrict`] || "";
      let state = initial[`rig${letter}_ownerState`] || "";
      let pincode = initial[`rig${letter}_ownerPincode`] || "";

      // 1. Detect and repair legacy 1-field shift (where type got owner's name, owner's name got address, etc.)
      const isTypeOwnerName = type && (type.includes("Anupriya") || type.includes("Borewell") || type.trim() === owner.name);
      if (isTypeOwnerName) {
        pincode = state.match(/\d{6}/) ? state : pincode;
        state = dist === "Kerala" || dist === "kerala" ? dist : "Kerala";
        dist = addr && addr.length < 25 ? addr : (app.officeLocation || "Kollam");
        addr = name;
        name = type;
        
        const rig = activeRigs[idx];
        type = rig?.typeOfRigMalayalam || rig?.typeOfRig || "റോട്ടറി കം.ഡി.റ്റി.എച്ച് റിഗ്";
      }

      // 2. If district contains a full address (indicated by length > 30 or commas), and address is blank/incomplete
      if ((dist.length > 30 || dist.includes(",")) && (!addr || addr.length < 10)) {
        addr = dist;
        dist = app.officeLocation || "";
      }

      // 3. If name contains address and address is blank/incomplete
      if ((name.includes(",") || name.includes("\n")) && (!addr || addr.length < 10)) {
        const parts = name.split(/,|\n/);
        name = parts[0].trim();
        addr = parts.slice(1).join(", ").trim();
      }

      // 4. Ensure address is cleaned up if it contains duplicate name at the start
      if (addr.startsWith(name + ",")) {
        addr = addr.substring(name.length + 1).trim();
      } else if (addr.startsWith(name + "\n")) {
        addr = addr.substring(name.length + 1).trim();
      }

      // 5. Extract pincode from address if pincode is empty
      if (!pincode && addr) {
        const pinMatch = addr.match(/\b\d{6}\b/);
        if (pinMatch) {
          pincode = pinMatch[0];
        }
      }

      // Capitalize district nicely
      if (dist && dist.length < 30) {
        dist = dist.charAt(0).toUpperCase() + dist.slice(1).toLowerCase();
      }

      initial[`rig${letter}_type`] = type;
      initial[`rig${letter}_ownerName`] = name;
      initial[`rig${letter}_owner_name`] = name;
      initial[`rig${letter}_ownerAddress`] = addr;
      initial[`rig${letter}_owner_address`] = addr;
      initial[`rig${letter}_ownerDistrict`] = dist;
      initial[`rig${letter}_district`] = dist;
      initial[`rig${letter}_ownerState`] = state;
      initial[`rig${letter}_state`] = state;
      initial[`rig${letter}_ownerPincode`] = pincode;
      initial[`rig${letter}_pincode`] = pincode;
    });

    return initial;
  };

  useEffect(() => {
    if (application) {
      loadedAppIdRef.current = application.id;
      setData(initFormData(application, false));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [application?.id, initialSavedForm?.id]);

  const update = (key: string, val: any) =>
    setData((prev) => ({
      ...prev,
      [key]: val,
    }));

  const handleClearAll = () => {
    if (window.confirm("Are you sure you want to clear all fields and reset to a blank form?")) {
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
        title: "Form Cleared",
        description: "All fields have been reset to blank.",
      });
    }
  };

  const handleResetToProfile = () => {
    if (window.confirm("Are you sure you want to reset form fields to the agency profile defaults?")) {
      setData(initFormData(application, true));
      toast({
        title: "Data Restored",
        description: "Form repopulated with agency profile details.",
      });
    }
  };

  const handleDownloadAcroForm = async () => {
    setIsGeneratingAcroForm(true);
    try {
      const pdfBytes = await createOfficialRigRegistrationAcroFormPdf(data, activeMasterTemplate);
      const safeAgency = (data.agencyName || application.agencyName || "Agency").replace(/[\/\\?%*:|"<>]/g, "_");
      const fileName = `${safeAgency}_Rig_Registration_Fillable_AcroForm.pdf`;
      downloadPdfBytes(pdfBytes, fileName);
      toast({
        title: "Fillable AcroForm PDF Downloaded",
        description: "Form ready for direct editing in Adobe Acrobat, Chrome, or Edge.",
      });
    } catch (err: any) {
      console.error("AcroForm generation error:", err);
      toast({
        title: "Could not generate AcroForm PDF",
        description: err.message || "An error occurred while generating PDF.",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingAcroForm(false);
    }
  };

  const handlePrint = () => {
    printDocument("rig-reg-official-form", "Application Form for Registration of Drilling Agency and Rig", "1.2cm 1.5cm 1.2cm 1.5cm");
  };

  const handleSave = async () => {
    if (!application?.id) {
      toast({
        title: "Application ID Missing",
        description: "A valid application ID is required to save data.",
        variant: "destructive",
      });
      return;
    }
    setIsSaving(true);
    try {
      const now = new Date().toISOString();
      const currentDoc = applications.find(a => a.id === application.id);
      const existingForms: SavedApplicationFormRecord[] = [...(currentDoc?.savedForms || application.savedForms || [])];
      const formId = currentFormIdRef.current;
      const formTitle = initialSavedForm?.title || `Rig Registration Form - ${application.fileNo || application.agencyRegistrationNo || format(new Date(), 'dd/MM/yyyy')}`;

      const record: SavedApplicationFormRecord = {
        id: formId,
        type: 'registration',
        title: formTitle,
        savedAt: now,
        savedBy: user?.name || user?.email || "Sub-Office Officer",
        formData: data,
        summary: {
          fileNo: application.fileNo || undefined,
          rigCount: (application.rigs || []).filter((r) => r.status === 'Active').length,
          challanNo: data.receipt_challan_no || undefined,
          paymentDate: data.receipt_paid_date || undefined,
        },
      };

      const existingIndex = existingForms.findIndex((f) => f.id === formId);
      if (existingIndex >= 0) {
        existingForms[existingIndex] = record;
      } else {
        existingForms.unshift(record);
      }

      await updateApplication(application.id, {
        officialFormData: data,
        savedForms: existingForms,
      } as any);

      toast({
        title: "Saved Successfully",
        description: "Form saved into Saved Forms Repository.",
      });
    } catch (err: any) {
      console.error("Firebase save error:", err);
      toast({
        title: "Save Error",
        description: err.message || "Failed to save data.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="w-full bg-slate-100 dark:bg-gray-950 text-black min-h-screen p-2 sm:p-4 space-y-4 font-sans">
      {/* Sub-Office Action Toolbar */}
      <div className="max-w-4xl mx-auto p-3 bg-white dark:bg-gray-900 border rounded-xl shadow-sm space-y-2.5 print:hidden">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b pb-2">
          <div className="flex items-center gap-2">
            {onClose && (
              <Button size="sm" variant="outline" onClick={onClose} className="gap-1 text-xs">
                <ArrowLeft className="w-3.5 h-3.5" /> Back
              </Button>
            )}
            <div>
              <h1 className="text-sm sm:text-base font-bold flex items-center gap-1.5 text-gray-900 dark:text-gray-100 flex-wrap">
                <FileText className="w-4 h-4 text-blue-600" />
                Rig Registration Application Form (5 Pages)
                {initialSavedForm && (
                  <Badge variant="secondary" className="text-[10px] bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300">
                    Editing: {initialSavedForm.title}
                  </Badge>
                )}
              </h1>
              <p className="text-[11px] text-gray-500">Official Format of Kerala Ground Water Authority</p>
            </div>
          </div>
          {activeMasterTemplate && (
            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-300 text-[11px] gap-1">
              <Sparkles className="w-3 h-3 text-blue-600" /> Master Template Active: {activeMasterTemplate.name}
            </Badge>
          )}
        </div>

        {/* Action Button Row */}
        <div className="flex items-center justify-between gap-2 flex-wrap pt-1">
          <div className="flex items-center gap-2 flex-wrap">
            {/* 1. Fillable AcroForm PDF Button */}
            <Button
              size="sm"
              onClick={handleDownloadAcroForm}
              disabled={isGeneratingAcroForm}
              className="bg-indigo-600 hover:bg-indigo-700 text-white gap-1.5 shadow-sm text-xs font-semibold"
              title="Download fillable AcroForm PDF editable directly in Acrobat Reader or web browsers"
            >
              {isGeneratingAcroForm ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <FileDown className="w-3.5 h-3.5" />}
              {isGeneratingAcroForm ? "Generating..." : "Fillable AcroForm PDF"}
            </Button>

            {/* 2. Official PDF Preview (5 Pages) & Instant Print */}
            <Button
              size="sm"
              onClick={handlePrint}
              className="bg-blue-600 hover:bg-blue-700 text-white gap-1.5 shadow-sm text-xs font-semibold"
            >
              <Printer className="w-3.5 h-3.5" /> Print / Preview (5 Pages)
            </Button>

            {/* 3. Save Data */}
            <Button
              size="sm"
              onClick={handleSave}
              disabled={isSaving}
              className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5 shadow-sm text-xs font-semibold"
            >
              {isSaving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              {isSaving ? "Saving..." : "Save Form Data"}
            </Button>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* 4. Super Admin Master PDF Template Manager Link */}
            {isSuperAdmin && (
              <Button
                asChild
                size="sm"
                variant="outline"
                className="border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs gap-1.5"
              >
                <Link href="/dashboard/super-admin/templates">
                  <Layers className="w-3.5 h-3.5 text-blue-600" /> Master PDF Template Manager
                </Link>
              </Button>
            )}

            {/* Reset Actions */}
            <Button
              size="sm"
              variant="outline"
              onClick={handleResetToProfile}
              className="border-gray-200 text-gray-700 hover:bg-gray-100 gap-1 shadow-sm text-xs"
              title="Reset form fields to agency profile details"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Reset to Profile
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={handleClearAll}
              className="border-red-200 text-red-600 hover:bg-red-50 gap-1 shadow-sm text-xs"
              title="Clear all fields"
            >
              <Trash2 className="w-3.5 h-3.5" /> Clear Form
            </Button>
          </div>
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
  initialSavedForm,
  onClose,
}: {
  application: AgencyApplication;
  initialSavedForm?: SavedApplicationFormRecord | null;
  onClose?: () => void;
}) {
  const { applications, updateApplication } = useAgencyApplications();
  const { getActiveTemplateForModule } = useMasterPdfTemplates();
  const { user } = useAuth();
  const [data, setData] = useState<Record<string, any>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [isGeneratingAcroForm, setIsGeneratingAcroForm] = useState(false);
  const loadedAppIdRef = React.useRef<string | null>(null);
  const currentFormIdRef = React.useRef<string>(initialSavedForm?.id || uuidv4());

  useEffect(() => {
    currentFormIdRef.current = initialSavedForm?.id || uuidv4();
  }, [initialSavedForm?.id]);

  const activeMasterTemplate = getActiveTemplateForModule("rig_renewal");
  const isSuperAdmin = user?.role === "superAdmin" || user?.email === "keralagwd@gmail.com";

  const initRenewalFormData = (app: AgencyApplication, forceReset: boolean = false): Record<string, any> => {
    const activeRigs = (app.rigs || []).filter((r) => r.status === "Active");
    const owner = app.owner || ({} as OwnerInfo);
    const savedFormData = forceReset
      ? {}
      : initialSavedForm?.formData || (app as any)?.renewalFormData || (app as any)?.officialFormData || {};

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
      agency_reg_no: getVal("agency_reg_no", getVal("existingAgencyRegNo", getVal("agencyRegNo", app.agencyRegistrationNo || ""))),
      existingAgencyRegNo: getVal("existingAgencyRegNo", getVal("agency_reg_no", getVal("agencyRegNo", app.agencyRegistrationNo || ""))),
      agency_reg_expiry: formatToDDMMYYYY(getVal("agency_reg_expiry", "")),
      agencyRegDistrict: getVal("agencyRegDistrict", getVal("registeredDistrict", app.officeLocation || "")),
      registeredDistrict: getVal("registeredDistrict", getVal("agencyRegDistrict", app.officeLocation || "")),
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

      // Page 1 Summary Rigs
      summaryRig1_type: getVal("summaryRig1_type", activeRigs[0]?.typeOfRigMalayalam || activeRigs[0]?.typeOfRig || ""),
      summaryRig1_regNo: getVal("summaryRig1_regNo", activeRigs[0]?.rigRegistrationNo || ""),
      summaryRig1_paidAmount: getVal("summaryRig1_paidAmount", activeRigs[0]?.applicationFee ? String(activeRigs[0].applicationFee) : "10000"),
      summaryRig1_challanDetails: getVal("summaryRig1_challanDetails", activeRigs[0]?.applicationChallanNo || ""),
      summaryRig1_expiryDate: formatToDDMMYYYY(getVal("summaryRig1_expiryDate", "")),

      summaryRig2_type: getVal("summaryRig2_type", activeRigs[1]?.typeOfRigMalayalam || activeRigs[1]?.typeOfRig || ""),
      summaryRig2_regNo: getVal("summaryRig2_regNo", activeRigs[1]?.rigRegistrationNo || ""),
      summaryRig2_paidAmount: getVal("summaryRig2_paidAmount", activeRigs[1]?.applicationFee ? String(activeRigs[1].applicationFee) : "10000"),
      summaryRig2_challanDetails: getVal("summaryRig2_challanDetails", activeRigs[1]?.applicationChallanNo || ""),
      summaryRig2_expiryDate: formatToDDMMYYYY(getVal("summaryRig2_expiryDate", "")),

      summaryRig3_type: getVal("summaryRig3_type", activeRigs[2]?.typeOfRigMalayalam || activeRigs[2]?.typeOfRig || ""),
      summaryRig3_regNo: getVal("summaryRig3_regNo", activeRigs[2]?.rigRegistrationNo || ""),
      summaryRig3_paidAmount: getVal("summaryRig3_paidAmount", activeRigs[2]?.applicationFee ? String(activeRigs[2].applicationFee) : "10000"),
      summaryRig3_challanDetails: getVal("summaryRig3_challanDetails", activeRigs[2]?.applicationChallanNo || ""),
      summaryRig3_expiryDate: formatToDDMMYYYY(getVal("summaryRig3_expiryDate", "")),

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

      date: formatToDDMMYYYY(getVal("date", getVal("declarationDate", format(new Date(), "dd/MM/yyyy")))),
      place: getVal("place", getVal("declarationPlace", app.officeLocation || "")),
      declarationDate: formatToDDMMYYYY(getVal("declarationDate", getVal("date", format(new Date(), "dd/MM/yyyy")))),
      declarationPlace: getVal("declarationPlace", getVal("place", app.officeLocation || "")),

      // Office use
      office_date_recd: formatToDDMMYYYY(getVal("office_date_recd", getVal("office_appReceivedDate", ""))),
      office_appReceivedDate: formatToDDMMYYYY(getVal("office_appReceivedDate", getVal("office_date_recd", ""))),
      office_fee_amount: getVal("office_fee_amount", getVal("office_feeAmount", "")),
      office_feeAmount: getVal("office_feeAmount", getVal("office_fee_amount", "")),
      office_fee_date: formatToDDMMYYYY(getVal("office_fee_date", getVal("office_feeDate", ""))),
      office_feeDate: formatToDDMMYYYY(getVal("office_feeDate", getVal("office_fee_date", ""))),
      office_rig_inspected_date: formatToDDMMYYYY(getVal("office_rig_inspected_date", getVal("office_rigInspectionDate", ""))),
      office_rigInspectionDate: formatToDDMMYYYY(getVal("office_rigInspectionDate", getVal("office_rig_inspected_date", ""))),
      office_recommendation: getVal("office_recommendation", getVal("office_recommendation1", "")),
      office_recommendation1: getVal("office_recommendation1", getVal("office_recommendation", "")),

      // Receipt
      receipt_app_no: getVal("receipt_app_no", getVal("receipt_appNo", (app as any).applicationNo || app.id || "APP/2026/001")),
      receipt_appNo: getVal("receipt_appNo", getVal("receipt_app_no", (app as any).applicationNo || app.id || "APP/2026/001")),
      receipt_agency_name: getVal("receipt_agency_name", app.agencyName || ""),
      receipt_agency_reg_no: getVal("receipt_agency_reg_no", getVal("existingAgencyRegNo", app.agencyRegistrationNo || "")),
      receipt_date_recd: formatToDDMMYYYY(getVal("receipt_date_recd", getVal("receipt_receivedDate", format(new Date(), "dd/MM/yyyy")))),
      receipt_receivedDate: formatToDDMMYYYY(getVal("receipt_receivedDate", getVal("receipt_date_recd", format(new Date(), "dd/MM/yyyy")))),
      receipt_fee_paid_amount: getVal("receipt_fee_paid_amount", getVal("receipt_feeAmount", "10000")),
      receipt_feeAmount: getVal("receipt_feeAmount", getVal("receipt_fee_paid_amount", "10000")),
      receipt_fee_paid_date: formatToDDMMYYYY(getVal("receipt_fee_paid_date", getVal("receipt_feeDate", format(new Date(), "dd/MM/yyyy")))),
      receipt_feeDate: formatToDDMMYYYY(getVal("receipt_feeDate", getVal("receipt_fee_paid_date", format(new Date(), "dd/MM/yyyy")))),
      receipt_renewal_count: getVal("receipt_renewal_count", getVal("receipt_renewalCount", activeRigs.length > 0 ? String(activeRigs.length) : "1")),
      receipt_renewalCount: getVal("receipt_renewalCount", getVal("receipt_renewal_count", activeRigs.length > 0 ? String(activeRigs.length) : "1")),
      receipt_new_rig_count: getVal("receipt_new_rig_count", getVal("receipt_newRigCount", "0")),
      receipt_newRigCount: getVal("receipt_newRigCount", getVal("receipt_new_rig_count", "0")),
      receipt_signDate: formatToDDMMYYYY(getVal("receipt_signDate", format(new Date(), "dd/MM/yyyy"))),
      receipt_renewal_check: getVal("receipt_renewal_check", true),
      receipt_new_rig_check: getVal("receipt_new_rig_check", false),
    };

    // Rig renewal details for rig1, rig2, rig3
    ["rig1", "rig2", "rig3"].forEach((rigKey, idx) => {
      const upperRigKey = `RIG${idx + 1}`;
      const rig = activeRigs[idx];
      initial[`${rigKey}_regNo`] = getVal(`${rigKey}_regNo`, getVal(`${upperRigKey}_regNo`, rig?.rigRegistrationNo || ""));
      initial[`${rigKey}_expiryDate`] = formatToDDMMYYYY(getVal(`${rigKey}_expiryDate`, getVal(`${upperRigKey}_expiryDate`, "")));
      initial[`${rigKey}_type`] = getVal(`${rigKey}_type`, getVal(`${upperRigKey}_type`, rig?.typeOfRigMalayalam || rig?.typeOfRig || "റോട്ടറി കം.ഡി.റ്റി.എച്ച് റിഗ്"));
      initial[`${rigKey}_last_paid_amount`] = getVal(`${rigKey}_last_paid_amount`, rig?.applicationFee ? String(rig.applicationFee) : "10000");
      initial[`${rigKey}_challan_info`] = getVal(`${rigKey}_challan_info`, rig?.applicationChallanNo || "");
      
      initial[`${rigKey}_ownerName`] = getVal(`${rigKey}_ownerName`, getVal(`${rigKey}_owner_name`, getVal(`${upperRigKey}_ownerName`, rig ? owner.name : "")));
      initial[`${rigKey}_owner_name`] = getVal(`${rigKey}_owner_name`, getVal(`${rigKey}_ownerName`, getVal(`${upperRigKey}_ownerName`, rig ? owner.name : "")));
      initial[`${rigKey}_ownerAddress`] = getVal(`${rigKey}_ownerAddress`, getVal(`${rigKey}_address`, getVal(`${upperRigKey}_ownerAddress`, rig ? owner.address : "")));
      initial[`${rigKey}_address`] = getVal(`${rigKey}_address`, getVal(`${rigKey}_ownerAddress`, getVal(`${upperRigKey}_address`, rig ? owner.address : "")));
      initial[`${rigKey}_ownerPhone`] = getVal(`${rigKey}_ownerPhone`, getVal(`${rigKey}_phone`, getVal(`${rigKey}_owner_phone`, (owner as any).phone || owner.mobile || "")));
      initial[`${rigKey}_phone`] = getVal(`${rigKey}_phone`, getVal(`${rigKey}_ownerPhone`, (owner as any).phone || owner.mobile || ""));
      initial[`${rigKey}_ownerMobile`] = getVal(`${rigKey}_ownerMobile`, getVal(`${rigKey}_mobile`, getVal(`${rigKey}_owner_mobile`, owner.mobile || "")));
      initial[`${rigKey}_mobile`] = getVal(`${rigKey}_mobile`, getVal(`${rigKey}_ownerMobile`, owner.mobile || ""));
      initial[`${rigKey}_ownerEmail`] = getVal(`${rigKey}_ownerEmail`, getVal(`${rigKey}_email`, getVal(`${rigKey}_owner_email`, owner.email || "")));
      initial[`${rigKey}_email`] = getVal(`${rigKey}_email`, getVal(`${rigKey}_ownerEmail`, owner.email || ""));
      initial[`${rigKey}_ownerDistrict`] = getVal(`${rigKey}_ownerDistrict`, getVal(`${rigKey}_district`, app.officeLocation || ""));
      initial[`${rigKey}_district`] = getVal(`${rigKey}_district`, getVal(`${rigKey}_ownerDistrict`, app.officeLocation || ""));
      initial[`${rigKey}_ownerState`] = getVal(`${rigKey}_ownerState`, getVal(`${rigKey}_state`, "Kerala"));
      initial[`${rigKey}_state`] = getVal(`${rigKey}_state`, getVal(`${rigKey}_ownerState`, "Kerala"));
      initial[`${rigKey}_ownerPincode`] = getVal(`${rigKey}_ownerPincode`, getVal(`${rigKey}_pincode`, ""));
      initial[`${rigKey}_pincode`] = getVal(`${rigKey}_pincode`, getVal(`${rigKey}_ownerPincode`, ""));

      initial[`${rigKey}_vehRegNo`] = getVal(`${rigKey}_vehRegNo`, getVal(`${rigKey}_veh_reg`, rig?.rigVehicle?.regNo || ""));
      initial[`${rigKey}_veh_reg`] = getVal(`${rigKey}_veh_reg`, getVal(`${rigKey}_vehRegNo`, rig?.rigVehicle?.regNo || ""));
      initial[`${rigKey}_chassisNo`] = getVal(`${rigKey}_chassisNo`, getVal(`${rigKey}_veh_chassis`, rig?.rigVehicle?.chassisNo || ""));
      initial[`${rigKey}_veh_chassis`] = getVal(`${rigKey}_veh_chassis`, getVal(`${rigKey}_chassisNo`, rig?.rigVehicle?.chassisNo || ""));
      initial[`${rigKey}_engineNo`] = getVal(`${rigKey}_engineNo`, getVal(`${rigKey}_veh_engine`, rig?.rigVehicle?.engineNo || ""));
      initial[`${rigKey}_veh_engine`] = getVal(`${rigKey}_veh_engine`, getVal(`${rigKey}_engineNo`, rig?.rigVehicle?.engineNo || ""));

      initial[`${rigKey}_hasSupportVeh`] = getVal(`${rigKey}_hasSupportVeh`, getVal(`${rigKey}_has_support_veh`, "No"));
      initial[`${rigKey}_has_support_veh`] = getVal(`${rigKey}_has_support_veh`, getVal(`${rigKey}_hasSupportVeh`, "No"));
      initial[`${rigKey}_supportVehRegNo`] = getVal(`${rigKey}_supportVehRegNo`, getVal(`${rigKey}_sup_veh_reg`, ""));
      initial[`${rigKey}_sup_veh_reg`] = getVal(`${rigKey}_sup_veh_reg`, getVal(`${rigKey}_supportVehRegNo`, ""));
      initial[`${rigKey}_supportChassisNo`] = getVal(`${rigKey}_supportChassisNo`, getVal(`${rigKey}_sup_veh_chassis`, ""));
      initial[`${rigKey}_sup_veh_chassis`] = getVal(`${rigKey}_sup_veh_chassis`, getVal(`${rigKey}_supportChassisNo`, ""));
      initial[`${rigKey}_supportEngineNo`] = getVal(`${rigKey}_supportEngineNo`, getVal(`${rigKey}_sup_veh_engine`, ""));
      initial[`${rigKey}_sup_veh_engine`] = getVal(`${rigKey}_sup_veh_engine`, getVal(`${rigKey}_supportEngineNo`, ""));

      initial[`${rigKey}_compModel`] = getVal(`${rigKey}_compModel`, getVal(`${rigKey}_comp_model`, rig?.compressorDetails?.model || ""));
      initial[`${rigKey}_comp_model`] = getVal(`${rigKey}_comp_model`, getVal(`${rigKey}_compModel`, rig?.compressorDetails?.model || ""));
      initial[`${rigKey}_compCapacity`] = getVal(`${rigKey}_compCapacity`, getVal(`${rigKey}_comp_cap`, rig?.compressorDetails?.capacity || ""));
      initial[`${rigKey}_comp_cap`] = getVal(`${rigKey}_comp_cap`, getVal(`${rigKey}_compCapacity`, rig?.compressorDetails?.capacity || ""));

      initial[`${rigKey}_genType`] = getVal(`${rigKey}_genType`, getVal(`${rigKey}_gen_type`, rig?.generatorDetails?.type || ""));
      initial[`${rigKey}_gen_type`] = getVal(`${rigKey}_gen_type`, getVal(`${rigKey}_genType`, rig?.generatorDetails?.type || ""));
      initial[`${rigKey}_genModel`] = getVal(`${rigKey}_genModel`, getVal(`${rigKey}_gen_model`, rig?.generatorDetails?.model || ""));
      initial[`${rigKey}_gen_model`] = getVal(`${rigKey}_gen_model`, getVal(`${rigKey}_genModel`, rig?.generatorDetails?.model || ""));
      initial[`${rigKey}_genCapacity`] = getVal(`${rigKey}_genCapacity`, getVal(`${rigKey}_gen_cap`, rig?.generatorDetails?.capacity || ""));
      initial[`${rigKey}_gen_cap`] = getVal(`${rigKey}_gen_cap`, getVal(`${rigKey}_genCapacity`, rig?.generatorDetails?.capacity || ""));
      initial[`${rigKey}_genEngineNo`] = getVal(`${rigKey}_genEngineNo`, getVal(`${rigKey}_gen_engine`, rig?.generatorDetails?.engineNo || ""));
      initial[`${rigKey}_gen_engine`] = getVal(`${rigKey}_gen_engine`, getVal(`${rigKey}_genEngineNo`, rig?.generatorDetails?.engineNo || ""));

      initial[`${rigKey}_maxDepth`] = getVal(`${rigKey}_maxDepth`, getVal(`${rigKey}_well_depth`, ""));
      initial[`${rigKey}_well_depth`] = getVal(`${rigKey}_well_depth`, getVal(`${rigKey}_maxDepth`, ""));
      initial[`${rigKey}_maxDia`] = getVal(`${rigKey}_maxDia`, getVal(`${rigKey}_well_dia`, ""));
      initial[`${rigKey}_well_dia`] = getVal(`${rigKey}_well_dia`, getVal(`${rigKey}_maxDia`, ""));

      initial[`${rigKey}_opName`] = getVal(`${rigKey}_opName`, getVal(`${rigKey}_op_name`, ""));
      initial[`${rigKey}_op_name`] = getVal(`${rigKey}_op_name`, getVal(`${rigKey}_opName`, ""));
      initial[`${rigKey}_opAge`] = getVal(`${rigKey}_opAge`, getVal(`${rigKey}_op_age`, ""));
      initial[`${rigKey}_op_age`] = getVal(`${rigKey}_op_age`, getVal(`${rigKey}_opAge`, ""));
      initial[`${rigKey}_opExp`] = getVal(`${rigKey}_opExp`, getVal(`${rigKey}_op_exp`, ""));
      initial[`${rigKey}_op_exp`] = getVal(`${rigKey}_op_exp`, getVal(`${rigKey}_opExp`, ""));
      initial[`${rigKey}_opIdType`] = getVal(`${rigKey}_opIdType`, getVal(`${rigKey}_op_id_type`, "Aadhaar"));
      initial[`${rigKey}_op_id_type`] = getVal(`${rigKey}_op_id_type`, getVal(`${rigKey}_opIdType`, "Aadhaar"));
      initial[`${rigKey}_opIdNo`] = getVal(`${rigKey}_opIdNo`, getVal(`${rigKey}_op_id_no`, ""));
      initial[`${rigKey}_op_id_no`] = getVal(`${rigKey}_op_id_no`, getVal(`${rigKey}_opIdNo`, ""));
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

    // Self-healing data check to correct any field mix-ups, legacy bad entries, or key shifts for renewal
    ["rig1", "rig2", "rig3"].forEach((rigKey, idx) => {
      let type = initial[`${rigKey}_type`] || "";
      let name = initial[`${rigKey}_ownerName`] || "";
      let addr = initial[`${rigKey}_ownerAddress`] || "";
      let dist = initial[`${rigKey}_ownerDistrict`] || "";
      let state = initial[`${rigKey}_ownerState`] || "";
      let pincode = initial[`${rigKey}_ownerPincode`] || "";

      // 1. Detect and repair legacy 1-field shift
      const isTypeOwnerName = type && (type.includes("Anupriya") || type.includes("Borewell") || type.trim() === owner.name);
      if (isTypeOwnerName) {
        pincode = state.match(/\d{6}/) ? state : pincode;
        state = dist === "Kerala" || dist === "kerala" ? dist : "Kerala";
        dist = addr && addr.length < 25 ? addr : (app.officeLocation || "Kollam");
        addr = name;
        name = type;
        
        const rig = activeRigs[idx];
        type = rig?.typeOfRigMalayalam || rig?.typeOfRig || "റോട്ടറി കം.ഡി.റ്റി.എച്ച് റിഗ്";
      }

      // 2. If district contains a full address (indicated by length > 30 or commas), and address is blank/incomplete
      if ((dist.length > 30 || dist.includes(",")) && (!addr || addr.length < 10)) {
        addr = dist;
        dist = app.officeLocation || "";
      }

      // 3. If name contains address and address is blank/incomplete
      if ((name.includes(",") || name.includes("\n")) && (!addr || addr.length < 10)) {
        const parts = name.split(/,|\n/);
        name = parts[0].trim();
        addr = parts.slice(1).join(", ").trim();
      }

      // 4. Ensure address is cleaned up if it contains duplicate name at the start
      if (addr.startsWith(name + ",")) {
        addr = addr.substring(name.length + 1).trim();
      } else if (addr.startsWith(name + "\n")) {
        addr = addr.substring(name.length + 1).trim();
      }

      // 5. Extract pincode from address if pincode is empty
      if (!pincode && addr) {
        const pinMatch = addr.match(/\b\d{6}\b/);
        if (pinMatch) {
          pincode = pinMatch[0];
        }
      }

      // Capitalize district nicely
      if (dist && dist.length < 30) {
        dist = dist.charAt(0).toUpperCase() + dist.slice(1).toLowerCase();
      }

      initial[`${rigKey}_type`] = type;
      initial[`${rigKey}_ownerName`] = name;
      initial[`${rigKey}_owner_name`] = name;
      initial[`${rigKey}_ownerAddress`] = addr;
      initial[`${rigKey}_address`] = addr;
      initial[`${rigKey}_ownerDistrict`] = dist;
      initial[`${rigKey}_district`] = dist;
      initial[`${rigKey}_ownerState`] = state;
      initial[`${rigKey}_state`] = state;
      initial[`${rigKey}_ownerPincode`] = pincode;
      initial[`${rigKey}_pincode`] = pincode;
    });

    return initial;
  };

  useEffect(() => {
    if (application) {
      loadedAppIdRef.current = application.id;
      setData(initRenewalFormData(application, false));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [application?.id, initialSavedForm?.id]);

  const update = (key: string, val: any) =>
    setData((prev) => ({
      ...prev,
      [key]: val,
    }));

  const handleClearAll = () => {
    if (window.confirm("Are you sure you want to clear all fields and reset to a blank renewal form?")) {
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
        title: "Form Cleared",
        description: "All fields have been reset to blank.",
      });
    }
  };

  const handleResetToProfile = () => {
    if (window.confirm("Are you sure you want to reset form fields to the agency profile defaults?")) {
      setData(initRenewalFormData(application, true));
      toast({
        title: "Data Restored",
        description: "Form repopulated with agency profile details.",
      });
    }
  };

  const handleDownloadAcroForm = async () => {
    setIsGeneratingAcroForm(true);
    try {
      const pdfBytes = await createOfficialRigRenewalAcroFormPdf(data, activeMasterTemplate);
      const safeAgency = (data.agencyName || application.agencyName || "Agency").replace(/[\/\\?%*:|"<>]/g, "_");
      const fileName = `${safeAgency}_Rig_Renewal_Fillable_AcroForm.pdf`;
      downloadPdfBytes(pdfBytes, fileName);
      toast({
        title: "Fillable AcroForm PDF Downloaded",
        description: "Renewal form ready for direct editing in Adobe Acrobat, Chrome, or Edge.",
      });
    } catch (err: any) {
      console.error("Renewal AcroForm generation error:", err);
      toast({
        title: "Could not generate AcroForm PDF",
        description: err.message || "An error occurred while generating PDF.",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingAcroForm(false);
    }
  };

  const handlePrint = () => {
    printDocument("rig-renewal-official-form", "Application Form for Renewal of Rig Registration", "1.2cm 1.5cm 1.2cm 1.5cm");
  };

  const handleSave = async () => {
    if (!application?.id) {
      toast({
        title: "Application ID Missing",
        description: "A valid application ID is required to save data.",
        variant: "destructive",
      });
      return;
    }
    setIsSaving(true);
    try {
      const now = new Date().toISOString();
      const currentDoc = applications.find(a => a.id === application.id);
      const existingForms: SavedApplicationFormRecord[] = [...(currentDoc?.savedForms || application.savedForms || [])];
      const formId = currentFormIdRef.current;
      const formTitle = initialSavedForm?.title || `Rig Renewal Form - ${application.fileNo || application.agencyRegistrationNo || format(new Date(), 'dd/MM/yyyy')}`;

      const record: SavedApplicationFormRecord = {
        id: formId,
        type: 'renewal',
        title: formTitle,
        savedAt: now,
        savedBy: user?.name || user?.email || "Sub-Office Officer",
        formData: data,
        summary: {
          fileNo: application.fileNo || undefined,
          rigCount: (application.rigs || []).filter((r) => r.status === 'Active').length,
          challanNo: data.renewal_challan_no || undefined,
          paymentDate: data.renewal_payment_date || undefined,
        },
      };

      const existingIndex = existingForms.findIndex((f) => f.id === formId);
      if (existingIndex >= 0) {
        existingForms[existingIndex] = record;
      } else {
        existingForms.unshift(record);
      }

      await updateApplication(application.id, {
        renewalFormData: data,
        savedForms: existingForms,
      } as any);

      toast({
        title: "Saved Successfully",
        description: "Renewal form saved into Saved Forms Repository.",
      });
    } catch (err: any) {
      console.error("Firebase save error:", err);
      toast({
        title: "Save Error",
        description: err.message || "Failed to save data.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="w-full bg-slate-100 dark:bg-gray-950 text-black min-h-screen p-2 sm:p-4 space-y-4 font-sans">
      {/* Sub-Office Action Toolbar */}
      <div className="max-w-4xl mx-auto p-3 bg-white dark:bg-gray-900 border rounded-xl shadow-sm space-y-2.5 print:hidden">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b pb-2">
          <div className="flex items-center gap-2">
            {onClose && (
              <Button size="sm" variant="outline" onClick={onClose} className="gap-1 text-xs">
                <ArrowLeft className="w-3.5 h-3.5" /> Back
              </Button>
            )}
            <div>
              <h1 className="text-sm sm:text-base font-bold flex items-center gap-1.5 text-gray-900 dark:text-gray-100 flex-wrap">
                <FileText className="w-4 h-4 text-emerald-600" />
                Rig Renewal Application Form (5 Pages)
                {initialSavedForm && (
                  <Badge variant="secondary" className="text-[10px] bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300">
                    Editing: {initialSavedForm.title}
                  </Badge>
                )}
              </h1>
              <p className="text-[11px] text-gray-500">Official Format of Kerala Ground Water Authority</p>
            </div>
          </div>
          {activeMasterTemplate && (
            <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 text-[11px] gap-1">
              <Sparkles className="w-3 h-3 text-emerald-600" /> Master Template Active: {activeMasterTemplate.name}
            </Badge>
          )}
        </div>

        {/* Action Button Row */}
        <div className="flex items-center justify-between gap-2 flex-wrap pt-1">
          <div className="flex items-center gap-2 flex-wrap">
            {/* 1. Fillable AcroForm PDF Button */}
            <Button
              size="sm"
              onClick={handleDownloadAcroForm}
              disabled={isGeneratingAcroForm}
              className="bg-indigo-600 hover:bg-indigo-700 text-white gap-1.5 shadow-sm text-xs font-semibold"
              title="Download fillable AcroForm PDF editable directly in Acrobat Reader or web browsers"
            >
              {isGeneratingAcroForm ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <FileDown className="w-3.5 h-3.5" />}
              {isGeneratingAcroForm ? "Generating..." : "Fillable AcroForm PDF"}
            </Button>

            {/* 2. Official PDF Preview (5 Pages) & Instant Print */}
            <Button
              size="sm"
              onClick={handlePrint}
              className="bg-emerald-700 hover:bg-emerald-800 text-white gap-1.5 shadow-sm text-xs font-semibold"
            >
              <Printer className="w-3.5 h-3.5" /> Print / Preview (5 Pages)
            </Button>

            {/* 3. Save Data */}
            <Button
              size="sm"
              onClick={handleSave}
              disabled={isSaving}
              className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5 shadow-sm text-xs font-semibold"
            >
              {isSaving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              {isSaving ? "Saving..." : "Save Form Data"}
            </Button>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* 4. Super Admin Master PDF Template Manager Link */}
            {isSuperAdmin && (
              <Button
                asChild
                size="sm"
                variant="outline"
                className="border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs gap-1.5"
              >
                <Link href="/dashboard/super-admin/templates">
                  <Layers className="w-3.5 h-3.5 text-blue-600" /> Master PDF Template Manager
                </Link>
              </Button>
            )}

            {/* Reset Actions */}
            <Button
              size="sm"
              variant="outline"
              onClick={handleResetToProfile}
              className="border-gray-200 text-gray-700 hover:bg-gray-100 gap-1 shadow-sm text-xs"
              title="Reset form fields to agency profile details"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Reset to Profile
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={handleClearAll}
              className="border-red-200 text-red-600 hover:bg-red-50 gap-1 shadow-sm text-xs"
              title="Clear all fields"
            >
              <Trash2 className="w-3.5 h-3.5" /> Clear Form
            </Button>
          </div>
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
