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
  printPdfBytesDirectly,
} from "@/lib/pdf/acroFormPdfService";
import Link from "next/link";
import { RigRegistrationPages } from "./RigRegistrationPages";

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
  formType = "registration",
  initialSavedForm,
  onClose,
}: {
  application: AgencyApplication;
  formType?: "registration" | "renewal";
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

  const effectiveType = initialSavedForm?.type || formType;
  const activeMasterTemplate = getActiveTemplateForModule(
    effectiveType === "renewal" ? "rig_renewal" : "rig_registration"
  );
  const isSuperAdmin = user?.role === "superAdmin" || user?.email === "keralagwd@gmail.com";

  const initFormData = (app: AgencyApplication, forceReset: boolean = false): Record<string, any> => {
    const activeRigs = (app.rigs || []).filter((r) => r.status === "Active");
    const owner = app.owner || ({} as OwnerInfo);
    const partners = app.partners || [];
    const savedFormData = forceReset
      ? {}
      : initialSavedForm?.formData ||
        (effectiveType === "renewal" ? (app as any)?.renewalFormData : (app as any)?.officialFormData) ||
        (app as any)?.officialFormData ||
        (app as any)?.registrationFormData ||
        (app as any)?.renewalFormData ||
        {};

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
      const pdfBytes = effectiveType === "renewal"
        ? await createOfficialRigRenewalAcroFormPdf(data, activeMasterTemplate)
        : await createOfficialRigRegistrationAcroFormPdf(data, activeMasterTemplate);
      const safeAgency = (data.agencyName || application.agencyName || "Agency").replace(/[\/\\?%*:|"<>]/g, "_");
      const fileName = `${safeAgency}_${effectiveType === "renewal" ? "Rig_Renewal" : "Rig_Registration"}_Fillable_AcroForm.pdf`;
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

  const handlePrint = async () => {
    try {
      const pdfBytes = effectiveType === "renewal"
        ? await createOfficialRigRenewalAcroFormPdf(data, activeMasterTemplate)
        : await createOfficialRigRegistrationAcroFormPdf(data, activeMasterTemplate);
      printPdfBytesDirectly(pdfBytes);
      toast({
        title: "Printing Official Form",
        description: "Pure vector PDF stream sent directly to printer.",
      });
    } catch (e) {
      printDocument("rig-reg-official-form", effectiveType === "renewal" ? "Application Form for Renewal of Drilling Rig Registration" : "Application Form for Registration of Drilling Agency and Rig", "1.2cm 1.5cm 1.2cm 1.5cm");
    }
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
      const targetType: "registration" | "renewal" = effectiveType === "renewal" ? "renewal" : "registration";
      const defaultTitle = targetType === "renewal"
        ? `Rig Renewal Form - ${application.fileNo || application.agencyRegistrationNo || format(new Date(), 'dd/MM/yyyy')}`
        : `Rig Registration Form - ${application.fileNo || application.agencyRegistrationNo || format(new Date(), 'dd/MM/yyyy')}`;
      const formTitle = initialSavedForm?.title || defaultTitle;

      const record: SavedApplicationFormRecord = {
        id: formId,
        type: targetType,
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
        [targetType === "renewal" ? "renewalFormData" : "officialFormData"]: data,
        savedForms: existingForms,
      } as any);

      toast({
        title: "Saved Successfully",
        description: `Form saved into Saved Forms Repository (${targetType === 'renewal' ? 'Renewal' : 'Registration'}).`,
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
                {effectiveType === "renewal" ? (
                  <RefreshCw className="w-4 h-4 text-emerald-600" />
                ) : (
                  <FileText className="w-4 h-4 text-blue-600" />
                )}
                {effectiveType === "renewal"
                  ? "Rig Registration Renewal Form (5 Pages)"
                  : "Rig Registration Application Form (5 Pages)"}
                {initialSavedForm && (
                  <Badge
                    variant="secondary"
                    className={`text-[10px] ${
                      effectiveType === "renewal"
                        ? "bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300"
                        : "bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300"
                    }`}
                  >
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

export function RigRenewalApplicationFormView({
  application,
  initialSavedForm,
  onClose,
}: {
  application: AgencyApplication;
  initialSavedForm?: SavedApplicationFormRecord | null;
  onClose?: () => void;
}) {
  return (
    <RigRegistrationApplicationFormView
      application={application}
      initialSavedForm={initialSavedForm}
      onClose={onClose}
    />
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


