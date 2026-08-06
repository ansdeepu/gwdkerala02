"use client";

import React, { useState, useEffect } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Printer, Upload, X, ArrowLeft, RefreshCw, FileText } from "lucide-react";
import type { AgencyApplication, OwnerInfo } from "@/hooks/useAgencyApplications";
import { format } from "date-fns";
import { printDocument } from "@/lib/print-utils";

// ----------------------------------------------------------------------
// Helper components for Govt Form styling
// ----------------------------------------------------------------------

// Pin Code Box Grid (6 digits)
function PinCodeGrid({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const digits = (value || "").padEnd(6, "").slice(0, 6).split("");

  const handleCharChange = (idx: number, char: string) => {
    const arr = (value || "").padEnd(6, " ").split("");
    arr[idx] = char || " ";
    onChange(arr.join("").trimEnd());
  };

  return (
    <div className="inline-flex items-center gap-0.5 border border-black bg-white">
      {Array.from({ length: 6 }).map((_, i) => (
        <input
          key={i}
          type="text"
          maxLength={1}
          value={digits[i] === " " ? "" : digits[i] || ""}
          onChange={(e) => handleCharChange(i, e.target.value)}
          className="w-5 h-6 text-center text-xs font-mono font-bold border-r border-black last:border-r-0 focus:outline-none focus:bg-yellow-50 print:border-black"
        />
      ))}
    </div>
  );
}

// PAN Number Grid (10 digits)
function PanGrid({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const digits = (value || "").toUpperCase().padEnd(10, "").slice(0, 10).split("");

  const handleCharChange = (idx: number, char: string) => {
    const arr = (value || "").padEnd(10, " ").split("");
    arr[idx] = char.toUpperCase() || " ";
    onChange(arr.join("").trimEnd());
  };

  return (
    <div className="inline-flex items-center gap-0.5 border border-black bg-white">
      {Array.from({ length: 10 }).map((_, i) => (
        <input
          key={i}
          type="text"
          maxLength={1}
          value={digits[i] === " " ? "" : digits[i] || ""}
          onChange={(e) => handleCharChange(i, e.target.value)}
          className="w-5 h-6 text-center text-xs font-mono font-bold border-r border-black last:border-r-0 focus:outline-none focus:bg-yellow-50 uppercase print:border-black"
        />
      ))}
    </div>
  );
}

// Photo Box Component with upload option
function PhotoBox({ photoUrl, onPhotoChange }: { photoUrl?: string; onPhotoChange?: (url: string) => void }) {
  return (
    <div className="w-28 h-36 border border-black flex flex-col items-center justify-center relative bg-gray-50 text-center p-1 group shrink-0">
      {photoUrl ? (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={photoUrl} alt="Photo" className="w-full h-full object-cover" />
          {onPhotoChange && (
            <button
              type="button"
              onClick={() => onPhotoChange("")}
              className="absolute top-1 right-1 bg-red-600 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity print:hidden"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </>
      ) : (
        <>
          <span className="text-xs font-bold text-gray-700">ഫോട്ടോ</span>
          <span className="text-[9px] text-gray-500 mt-0.5">(Photo)</span>
          {onPhotoChange && (
            <label className="mt-2 text-[10px] text-blue-600 cursor-pointer underline flex items-center gap-0.5 print:hidden">
              <Upload className="w-2.5 h-2.5" /> അപ്‌ലോഡ്
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    const reader = new FileReader();
                    reader.onload = (ev) => onPhotoChange(ev.target?.result as string);
                    reader.readAsDataURL(file);
                  }
                }}
              />
            </label>
          )}
        </>
      )}
    </div>
  );
}

// Inline Form Underline Text Input
function FormLineInput({
  value,
  onChange,
  className = "",
  placeholder = "",
  width = "flex-1",
}: {
  value: string;
  onChange: (v: string) => void;
  className?: string;
  placeholder?: string;
  width?: string;
}) {
  return (
    <input
      type="text"
      value={value || ""}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={`${width} bg-transparent border-b border-dotted border-black px-1 text-xs sm:text-sm font-semibold focus:outline-none focus:border-solid focus:border-blue-600 focus:bg-blue-50/50 print:border-black print:border-b ${className}`}
    />
  );
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
  const [data, setData] = useState<Record<string, any>>({});

  useEffect(() => {
    if (application) {
      const activeRigs = (application.rigs || []).filter((r) => r.status === "Active");
      const owner = application.owner || ({} as OwnerInfo);
      const partners = application.partners || [];

      const initial: Record<string, any> = {
        // Section 1
        agencyName: application.agencyName || "",
        address: owner.address || "",
        village: "",
        taluk: "",
        panchayath: "",
        district: application.officeLocation || "",
        pincode: "",
        gstin: "",
        lsgdRegNo: "",

        // Section 2 Owner A
        ownerA_name: owner.name || "",
        ownerA_curr_address: owner.address || "",
        ownerA_curr_village: "",
        ownerA_curr_taluk: "",
        ownerA_curr_panchayath: "",
        ownerA_curr_district: application.officeLocation || "",
        ownerA_curr_pincode: "",
        ownerA_curr_photo: owner.photoUrl || "",

        ownerA_perm_address: owner.address || "",
        ownerA_perm_village: "",
        ownerA_perm_taluk: "",
        ownerA_perm_panchayath: "",
        ownerA_perm_district: application.officeLocation || "",
        ownerA_perm_pincode: "",

        ownerA_id_type: "Aadhaar", // Election Card or Aadhaar Card
        ownerA_id_no: "",
        ownerA_pan: "",
        ownerA_exp: "",
        ownerA_nominee: "",

        // Section 2 Partner B
        ownerB_name: partners[0]?.name || "",
        ownerB_curr_address: partners[0]?.address || "",
        ownerB_curr_village: "",
        ownerB_curr_taluk: "",
        ownerB_curr_panchayath: "",
        ownerB_curr_district: application.officeLocation || "",
        ownerB_curr_pincode: "",
        ownerB_curr_photo: "",

        ownerB_perm_address: partners[0]?.address || "",
        ownerB_perm_village: "",
        ownerB_perm_taluk: "",
        ownerB_perm_panchayath: "",
        ownerB_perm_district: application.officeLocation || "",
        ownerB_perm_pincode: "",

        ownerB_id_type: "Aadhaar",
        ownerB_id_no: "",
        ownerB_pan: "",
        ownerB_nominee: "",

        // Section 2 Partner C
        ownerC_name: partners[1]?.name || "",
        ownerC_curr_address: partners[1]?.address || "",
        ownerC_curr_village: "",
        ownerC_curr_taluk: "",
        ownerC_curr_panchayath: "",
        ownerC_curr_district: application.officeLocation || "",
        ownerC_curr_pincode: "",
        ownerC_curr_photo: "",

        ownerC_perm_address: partners[1]?.address || "",
        ownerC_perm_village: "",
        ownerC_perm_taluk: "",
        ownerC_perm_panchayath: "",
        ownerC_perm_district: application.officeLocation || "",
        ownerC_perm_pincode: "",

        ownerC_id_type: "Aadhaar",
        ownerC_id_no: "",
        ownerC_pan: "",
        ownerC_nominee: "",

        date: format(new Date(), "dd/MM/yyyy"),
        place: application.officeLocation || "",

        // Office use
        office_date_recd: "",
        office_fee_details: "",
        office_paid_amount: "",
        office_rig_inspected_date: "",
        office_recommendation: "",
        office_inspector_signature: "",

        // Receipt
        receipt_app_no: application.applicationNo || "APP/2026/001",
        receipt_applicant_name: owner.name || "",
        receipt_date_recd: format(new Date(), "dd/MM/yyyy"),
        receipt_paid_amount: "10000",
        receipt_paid_date: format(new Date(), "dd/MM/yyyy"),
        receipt_agency_reg_check: true,
        receipt_rig1_check: true,
        receipt_rig2_check: false,
        receipt_rig3_check: false,
      };

      // Populate Rigs (Max 3: A, B, C)
      ["A", "B", "C"].forEach((letter, idx) => {
        const rig = activeRigs[idx];
        initial[`rig${letter}_type`] = rig?.typeOfRigMalayalam || rig?.typeOfRig || "റോട്ടറി കം.ഡി.റ്റി.എച്ച് റിഗ്";
        initial[`rig${letter}_owner_name`] = rig ? owner.name : "";
        initial[`rig${letter}_owner_address`] = rig ? owner.address : "";
        initial[`rig${letter}_district`] = application.officeLocation || "";
        initial[`rig${letter}_state`] = "Kerala";
        initial[`rig${letter}_pincode`] = "";

        initial[`rig${letter}_veh_type`] = rig?.rigVehicle?.type || "";
        initial[`rig${letter}_veh_reg`] = rig?.rigVehicle?.regNo || "";
        initial[`rig${letter}_veh_chassis`] = rig?.rigVehicle?.chassisNo || "";
        initial[`rig${letter}_veh_engine`] = rig?.rigVehicle?.engineNo || "";

        initial[`rig${letter}_comp_model`] = rig?.compressorDetails?.model || "";
        initial[`rig${letter}_comp_cap`] = rig?.compressorDetails?.capacity || "";

        initial[`rig${letter}_gen_type`] = rig?.generatorDetails?.type || "";
        initial[`rig${letter}_gen_model`] = rig?.generatorDetails?.model || "";
        initial[`rig${letter}_gen_cap`] = rig?.generatorDetails?.capacity || "";
        initial[`rig${letter}_gen_engine`] = rig?.generatorDetails?.engineNo || "";

        initial[`rig${letter}_well_depth`] = "";
        initial[`rig${letter}_well_dia`] = "";

        initial[`rig${letter}_op_name`] = "";
        initial[`rig${letter}_op_age`] = "";
        initial[`rig${letter}_op_exp`] = "";
        initial[`rig${letter}_op_id_type`] = "Aadhaar";
        initial[`rig${letter}_op_id_no`] = "";
      });

      setData(initial);
    }
  }, [application]);

  const update = (key: string, val: any) => setData((prev) => ({ ...prev, [key]: val }));

  const handlePrint = () => {
    printDocument("rig-reg-official-form", "ഡ്രില്ലിംഗ് ഏജൻസി/സ്ഥാപനവും ഡ്രില്ലിംഗ് റിഗ്ഗും രജിസ്റ്റർ ചെയ്യുന്നതിനുള്ള അപേക്ഷാ ഫോറം", "1.2cm 1.5cm 1.2cm 1.5cm");
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
        <Button size="sm" onClick={handlePrint} className="bg-blue-600 hover:bg-blue-700 text-white gap-1.5 shadow-sm">
          <Printer className="w-4 h-4" /> അച്ചടിക്കുക / Print Form
        </Button>
      </div>

      {/* Printable Sheet Container */}
      <div className="overflow-y-auto pb-10 print:p-0 print:overflow-visible">
        <div
          id="rig-reg-official-form"
          className="max-w-3xl mx-auto bg-white p-6 sm:p-10 border border-gray-300 shadow-md text-black space-y-5 text-xs sm:text-sm font-serif print:border-none print:shadow-none print:p-0 print:max-w-none"
        >
          {/* Header */}
          <div className="text-center space-y-1 border-b-2 border-black pb-3">
            <h1 className="text-lg sm:text-xl font-bold tracking-wide">കേരള സർക്കാർ ഭൂജല അതോറിറ്റി</h1>
            <p className="text-xs font-medium">(കേരള സർക്കാരിന്റെ 2002 ലെ ആക്ട് 19 പ്രകാരം നിലവിൽ വന്നത്)</p>
            <p className="text-[10px] font-mono text-gray-800">
              (Order No.G.O.(MS)No.04/2023/WRD Dated 24.01.2023 & Order No.DGWD/306/2022/T4 Dated 21.03.2023)
            </p>
            <div className="pt-2">
              <div className="inline-block border-2 border-black px-4 py-1.5 font-bold text-sm sm:text-base bg-gray-50">
                ഡ്രില്ലിംഗ് ഏജൻസി/സ്ഥാപനവും ഡ്രില്ലിംഗ് റിഗ്ഗും രജിസ്റ്റർ ചെയ്യുന്നതിനുള്ള അപേക്ഷാ ഫോറം
              </div>
            </div>
          </div>

          {/* Section 1 */}
          <div className="space-y-3">
            <h2 className="font-bold text-sm sm:text-base underline">1. സ്ഥാപനം / ഏജൻസിയുടെ വിവരം</h2>

            <div className="space-y-2 pl-2">
              <div className="flex items-baseline gap-2">
                <span className="font-bold whitespace-nowrap">എ. ഏജൻസിയുടെ പേര് :</span>
                <FormLineInput value={data.agencyName} onChange={(v) => update("agencyName", v)} />
              </div>

              <div className="flex items-baseline gap-2">
                <span className="font-bold whitespace-nowrap">ബി. മേൽവിലാസം :</span>
                <FormLineInput value={data.address} onChange={(v) => update("address", v)} />
              </div>

              <div className="grid grid-cols-2 gap-4 items-baseline pl-4">
                <div className="flex items-baseline gap-2">
                  <span className="font-bold whitespace-nowrap">വില്ലേജ് :</span>
                  <FormLineInput value={data.village} onChange={(v) => update("village", v)} />
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="font-bold whitespace-nowrap">താലൂക്ക് :</span>
                  <FormLineInput value={data.taluk} onChange={(v) => update("taluk", v)} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 items-baseline pl-4">
                <div className="flex items-baseline gap-2">
                  <span className="font-bold whitespace-nowrap">കോർപ്പറേഷൻ/മുനിസിപ്പാലിറ്റി/പഞ്ചായത്ത് :</span>
                  <FormLineInput value={data.panchayath} onChange={(v) => update("panchayath", v)} />
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="font-bold whitespace-nowrap">ജില്ല :</span>
                  <FormLineInput value={data.district} onChange={(v) => update("district", v)} />
                </div>
              </div>

              <div className="flex items-center gap-3 pl-4">
                <span className="font-bold">പിൻ കോഡ് :</span>
                <PinCodeGrid value={data.pincode} onChange={(v) => update("pincode", v)} />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <span className="font-bold whitespace-nowrap">സി. ജി.എസ്.റ്റി. നമ്പർ :</span>
                <div className="flex-1 border border-black p-1 bg-white">
                  <input
                    type="text"
                    value={data.gstin || ""}
                    onChange={(e) => update("gstin", e.target.value)}
                    className="w-full text-xs font-mono uppercase focus:outline-none bg-transparent"
                    placeholder="21AAAAA0000A1Z5"
                  />
                </div>
              </div>

              <div className="flex items-baseline gap-2">
                <span className="font-bold whitespace-nowrap">ഡി. തദ്ദേശ സ്വയംഭരണ സ്ഥാപനം നൽകിയ രജിസ്ട്രേഷൻ നമ്പർ :</span>
                <FormLineInput value={data.lsgdRegNo} onChange={(v) => update("lsgdRegNo", v)} />
              </div>
            </div>
          </div>

          <hr className="border-black my-2" />

          {/* Section 2 */}
          <div className="space-y-4">
            <h2 className="font-bold text-sm sm:text-base underline">2. സ്ഥാപനം / ഏജൻസി നടത്തിപ്പുകാരുടെ വിവരം</h2>

            {/* Owner A */}
            <div className="border border-black p-3 space-y-3 relative">
              <span className="absolute -top-3 left-3 bg-white px-2 font-bold border border-black text-xs">എ.</span>

              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1 space-y-2">
                  <div className="flex items-baseline gap-2 pt-1">
                    <span className="font-bold whitespace-nowrap">1. പേര് :</span>
                    <FormLineInput value={data.ownerA_name} onChange={(v) => update("ownerA_name", v)} />
                  </div>

                  <div className="flex items-baseline gap-2">
                    <span className="font-bold whitespace-nowrap">2. നിലവിലെ മേൽവിലാസം :</span>
                    <FormLineInput value={data.ownerA_curr_address} onChange={(v) => update("ownerA_curr_address", v)} />
                  </div>

                  <div className="grid grid-cols-2 gap-2 items-baseline pl-2">
                    <div className="flex items-baseline gap-1">
                      <span className="font-semibold text-xs whitespace-nowrap">വില്ലേജ് :</span>
                      <FormLineInput value={data.ownerA_curr_village} onChange={(v) => update("ownerA_curr_village", v)} />
                    </div>
                    <div className="flex items-baseline gap-1">
                      <span className="font-semibold text-xs whitespace-nowrap">താലൂക്ക് :</span>
                      <FormLineInput value={data.ownerA_curr_taluk} onChange={(v) => update("ownerA_curr_taluk", v)} />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 items-baseline pl-2">
                    <div className="flex items-baseline gap-1">
                      <span className="font-semibold text-xs whitespace-nowrap">കോർപ്പറേഷൻ/മുനിസിപ്പാലിറ്റി/പഞ്ചായത്ത് :</span>
                      <FormLineInput value={data.ownerA_curr_panchayath} onChange={(v) => update("ownerA_curr_panchayath", v)} />
                    </div>
                    <div className="flex items-baseline gap-1">
                      <span className="font-semibold text-xs whitespace-nowrap">ജില്ല :</span>
                      <FormLineInput value={data.ownerA_curr_district} onChange={(v) => update("ownerA_curr_district", v)} />
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pl-2">
                    <span className="font-semibold text-xs">പിൻ കോഡ് :</span>
                    <PinCodeGrid value={data.ownerA_curr_pincode} onChange={(v) => update("ownerA_curr_pincode", v)} />
                  </div>
                </div>

                {/* Photo frame */}
                <PhotoBox photoUrl={data.ownerA_curr_photo} onPhotoChange={(url) => update("ownerA_curr_photo", url)} />
              </div>

              {/* Permanent Address */}
              <div className="space-y-2 pt-2 border-t border-dashed border-gray-400">
                <div className="flex items-baseline gap-2">
                  <span className="font-bold whitespace-nowrap">3. സ്ഥിരം മേൽവിലാസം :</span>
                  <FormLineInput value={data.ownerA_perm_address} onChange={(v) => update("ownerA_perm_address", v)} />
                </div>

                <div className="grid grid-cols-2 gap-2 items-baseline pl-2">
                  <div className="flex items-baseline gap-1">
                    <span className="font-semibold text-xs whitespace-nowrap">വില്ലേജ് :</span>
                    <FormLineInput value={data.ownerA_perm_village} onChange={(v) => update("ownerA_perm_village", v)} />
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="font-semibold text-xs whitespace-nowrap">താലൂക്ക് :</span>
                    <FormLineInput value={data.ownerA_perm_taluk} onChange={(v) => update("ownerA_perm_taluk", v)} />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 items-baseline pl-2">
                  <div className="flex items-baseline gap-1">
                    <span className="font-semibold text-xs whitespace-nowrap">കോർപ്പറേഷൻ/മുനിസിപ്പാലിറ്റി/പഞ്ചായത്ത് :</span>
                    <FormLineInput value={data.ownerA_perm_panchayath} onChange={(v) => update("ownerA_perm_panchayath", v)} />
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="font-semibold text-xs whitespace-nowrap">ജില്ല :</span>
                    <FormLineInput value={data.ownerA_perm_district} onChange={(v) => update("ownerA_perm_district", v)} />
                  </div>
                </div>

                <div className="flex items-center gap-2 pl-2">
                  <span className="font-semibold text-xs">പിൻ കോഡ് :</span>
                  <PinCodeGrid value={data.ownerA_perm_pincode} onChange={(v) => update("ownerA_perm_pincode", v)} />
                </div>
              </div>

              {/* ID and PAN */}
              <div className="space-y-2 pt-2 border-t border-dashed border-gray-400">
                <div className="flex flex-wrap items-center gap-4">
                  <span className="font-bold whitespace-nowrap">4. തിരിച്ചറിയൽരേഖ :</span>
                  <label className="flex items-center gap-1 cursor-pointer">
                    <input
                      type="radio"
                      name="ownerA_id_type"
                      checked={data.ownerA_id_type === "Election"}
                      onChange={() => update("ownerA_id_type", "Election")}
                      className="border-black"
                    />
                    <span className="border border-black px-2 py-0.5 font-semibold text-xs">ഇലക്ഷൻ കാർഡ്</span>
                  </label>
                  <label className="flex items-center gap-1 cursor-pointer">
                    <input
                      type="radio"
                      name="ownerA_id_type"
                      checked={data.ownerA_id_type === "Aadhaar"}
                      onChange={() => update("ownerA_id_type", "Aadhaar")}
                      className="border-black"
                    />
                    <span className="border border-black px-2 py-0.5 font-semibold text-xs">ആധാർ കാർഡ്</span>
                  </label>
                </div>

                <div className="flex items-baseline gap-2">
                  <span className="font-bold whitespace-nowrap">5. തിരിച്ചറിയൽ രേഖയുടെ നമ്പർ :</span>
                  <FormLineInput value={data.ownerA_id_no} onChange={(v) => update("ownerA_id_no", v)} />
                </div>

                <div className="flex items-center gap-3">
                  <span className="font-bold whitespace-nowrap">6. പാൻ നമ്പർ :</span>
                  <PanGrid value={data.ownerA_pan} onChange={(v) => update("ownerA_pan", v)} />
                </div>

                <div className="flex items-baseline gap-2">
                  <span className="font-bold whitespace-nowrap">
                    7. കേരളത്തിലെ കുഴൽ കിണർ നിർമ്മാണ മേഖലയിലെ പ്രവർത്തിപരിചയം :
                  </span>
                  <FormLineInput value={data.ownerA_exp} onChange={(v) => update("ownerA_exp", v)} width="w-20" />
                  <span className="font-bold">വർഷം</span>
                </div>

                <div className="flex items-baseline gap-2">
                  <span className="font-bold whitespace-nowrap">8. നോമിനി :</span>
                  <FormLineInput value={data.ownerA_nominee} onChange={(v) => update("ownerA_nominee", v)} />
                </div>
              </div>
            </div>

            {/* Partner B */}
            <div className="text-center font-bold text-xs text-gray-700 italic">
              (പാർട്ട്ണർഷിപ്പ് ഉണ്ടെങ്കിൽ രണ്ടാമത്തെ വ്യക്തിയുടെ വിവരം)
            </div>
            <div className="border border-black p-3 space-y-3 relative">
              <span className="absolute -top-3 left-3 bg-white px-2 font-bold border border-black text-xs">ബി.</span>

              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1 space-y-2">
                  <div className="flex items-baseline gap-2 pt-1">
                    <span className="font-bold whitespace-nowrap">1. പേര് :</span>
                    <FormLineInput value={data.ownerB_name} onChange={(v) => update("ownerB_name", v)} />
                  </div>

                  <div className="flex items-baseline gap-2">
                    <span className="font-bold whitespace-nowrap">2. നിലവിലെ മേൽവിലാസം :</span>
                    <FormLineInput value={data.ownerB_curr_address} onChange={(v) => update("ownerB_curr_address", v)} />
                  </div>

                  <div className="grid grid-cols-2 gap-2 items-baseline pl-2">
                    <div className="flex items-baseline gap-1">
                      <span className="font-semibold text-xs whitespace-nowrap">വില്ലേജ് :</span>
                      <FormLineInput value={data.ownerB_curr_village} onChange={(v) => update("ownerB_curr_village", v)} />
                    </div>
                    <div className="flex items-baseline gap-1">
                      <span className="font-semibold text-xs whitespace-nowrap">താലൂക്ക് :</span>
                      <FormLineInput value={data.ownerB_curr_taluk} onChange={(v) => update("ownerB_curr_taluk", v)} />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 items-baseline pl-2">
                    <div className="flex items-baseline gap-1">
                      <span className="font-semibold text-xs whitespace-nowrap">പഞ്ചായത്ത് :</span>
                      <FormLineInput value={data.ownerB_curr_panchayath} onChange={(v) => update("ownerB_curr_panchayath", v)} />
                    </div>
                    <div className="flex items-baseline gap-1">
                      <span className="font-semibold text-xs whitespace-nowrap">ജില്ല :</span>
                      <FormLineInput value={data.ownerB_curr_district} onChange={(v) => update("ownerB_curr_district", v)} />
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pl-2">
                    <span className="font-semibold text-xs">പിൻ കോഡ് :</span>
                    <PinCodeGrid value={data.ownerB_curr_pincode} onChange={(v) => update("ownerB_curr_pincode", v)} />
                  </div>
                </div>

                <PhotoBox photoUrl={data.ownerB_curr_photo} onPhotoChange={(url) => update("ownerB_curr_photo", url)} />
              </div>

              {/* Permanent B */}
              <div className="space-y-2 pt-2 border-t border-dashed border-gray-400">
                <div className="flex items-baseline gap-2">
                  <span className="font-bold whitespace-nowrap">3. സ്ഥിരം മേൽവിലാസം :</span>
                  <FormLineInput value={data.ownerB_perm_address} onChange={(v) => update("ownerB_perm_address", v)} />
                </div>

                <div className="grid grid-cols-2 gap-2 items-baseline pl-2">
                  <div className="flex items-baseline gap-1">
                    <span className="font-semibold text-xs whitespace-nowrap">വില്ലേജ് :</span>
                    <FormLineInput value={data.ownerB_perm_village} onChange={(v) => update("ownerB_perm_village", v)} />
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="font-semibold text-xs whitespace-nowrap">താലൂക്ക് :</span>
                    <FormLineInput value={data.ownerB_perm_taluk} onChange={(v) => update("ownerB_perm_taluk", v)} />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 items-baseline pl-2">
                  <div className="flex items-baseline gap-1">
                    <span className="font-semibold text-xs whitespace-nowrap">പഞ്ചായത്ത് :</span>
                    <FormLineInput value={data.ownerB_perm_panchayath} onChange={(v) => update("ownerB_perm_panchayath", v)} />
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="font-semibold text-xs whitespace-nowrap">ജില്ല :</span>
                    <FormLineInput value={data.ownerB_perm_district} onChange={(v) => update("ownerB_perm_district", v)} />
                  </div>
                </div>

                <div className="flex items-center gap-2 pl-2">
                  <span className="font-semibold text-xs">പിൻ കോഡ് :</span>
                  <PinCodeGrid value={data.ownerB_perm_pincode} onChange={(v) => update("ownerB_perm_pincode", v)} />
                </div>
              </div>

              {/* ID/PAN B */}
              <div className="space-y-2 pt-2 border-t border-dashed border-gray-400">
                <div className="flex flex-wrap items-center gap-4">
                  <span className="font-bold whitespace-nowrap">4. തിരിച്ചറിയൽരേഖ :</span>
                  <label className="flex items-center gap-1 cursor-pointer">
                    <input
                      type="radio"
                      name="ownerB_id_type"
                      checked={data.ownerB_id_type === "Election"}
                      onChange={() => update("ownerB_id_type", "Election")}
                      className="border-black"
                    />
                    <span className="border border-black px-2 py-0.5 font-semibold text-xs">ഇലക്ഷൻ കാർഡ്</span>
                  </label>
                  <label className="flex items-center gap-1 cursor-pointer">
                    <input
                      type="radio"
                      name="ownerB_id_type"
                      checked={data.ownerB_id_type === "Aadhaar"}
                      onChange={() => update("ownerB_id_type", "Aadhaar")}
                      className="border-black"
                    />
                    <span className="border border-black px-2 py-0.5 font-semibold text-xs">ആധാർ കാർഡ്</span>
                  </label>
                </div>

                <div className="flex items-baseline gap-2">
                  <span className="font-bold whitespace-nowrap">5. തിരിച്ചറിയൽ രേഖയുടെ നമ്പർ :</span>
                  <FormLineInput value={data.ownerB_id_no} onChange={(v) => update("ownerB_id_no", v)} />
                </div>

                <div className="flex items-center gap-3">
                  <span className="font-bold whitespace-nowrap">6. പാൻ നമ്പർ :</span>
                  <PanGrid value={data.ownerB_pan} onChange={(v) => update("ownerB_pan", v)} />
                </div>

                <div className="flex items-baseline gap-2">
                  <span className="font-bold whitespace-nowrap">7. നോമിനി :</span>
                  <FormLineInput value={data.ownerB_nominee} onChange={(v) => update("ownerB_nominee", v)} />
                </div>
              </div>
            </div>

            {/* Partner C */}
            <div className="text-center font-bold text-xs text-gray-700 italic">
              (പാർട്ട്ണർഷിപ്പ് ഉണ്ടെങ്കിൽ മൂന്നാമത്തെ വ്യക്തിയുടെ വിവരം)
            </div>
            <div className="border border-black p-3 space-y-3 relative">
              <span className="absolute -top-3 left-3 bg-white px-2 font-bold border border-black text-xs">സി.</span>

              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1 space-y-2">
                  <div className="flex items-baseline gap-2 pt-1">
                    <span className="font-bold whitespace-nowrap">1. പേര് :</span>
                    <FormLineInput value={data.ownerC_name} onChange={(v) => update("ownerC_name", v)} />
                  </div>

                  <div className="flex items-baseline gap-2">
                    <span className="font-bold whitespace-nowrap">2. നിലവിലെ മേൽവിലാസം :</span>
                    <FormLineInput value={data.ownerC_curr_address} onChange={(v) => update("ownerC_curr_address", v)} />
                  </div>

                  <div className="grid grid-cols-2 gap-2 items-baseline pl-2">
                    <div className="flex items-baseline gap-1">
                      <span className="font-semibold text-xs whitespace-nowrap">വില്ലേജ് :</span>
                      <FormLineInput value={data.ownerC_curr_village} onChange={(v) => update("ownerC_curr_village", v)} />
                    </div>
                    <div className="flex items-baseline gap-1">
                      <span className="font-semibold text-xs whitespace-nowrap">താലൂക്ക് :</span>
                      <FormLineInput value={data.ownerC_curr_taluk} onChange={(v) => update("ownerC_curr_taluk", v)} />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 items-baseline pl-2">
                    <div className="flex items-baseline gap-1">
                      <span className="font-semibold text-xs whitespace-nowrap">പഞ്ചായത്ത് :</span>
                      <FormLineInput value={data.ownerC_curr_panchayath} onChange={(v) => update("ownerC_curr_panchayath", v)} />
                    </div>
                    <div className="flex items-baseline gap-1">
                      <span className="font-semibold text-xs whitespace-nowrap">ജില്ല :</span>
                      <FormLineInput value={data.ownerC_curr_district} onChange={(v) => update("ownerC_curr_district", v)} />
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pl-2">
                    <span className="font-semibold text-xs">പിൻ കോഡ് :</span>
                    <PinCodeGrid value={data.ownerC_curr_pincode} onChange={(v) => update("ownerC_curr_pincode", v)} />
                  </div>
                </div>

                <PhotoBox photoUrl={data.ownerC_curr_photo} onPhotoChange={(url) => update("ownerC_curr_photo", url)} />
              </div>

              {/* Permanent C */}
              <div className="space-y-2 pt-2 border-t border-dashed border-gray-400">
                <div className="flex items-baseline gap-2">
                  <span className="font-bold whitespace-nowrap">3. സ്ഥിരം മേൽവിലാസം :</span>
                  <FormLineInput value={data.ownerC_perm_address} onChange={(v) => update("ownerC_perm_address", v)} />
                </div>

                <div className="grid grid-cols-2 gap-2 items-baseline pl-2">
                  <div className="flex items-baseline gap-1">
                    <span className="font-semibold text-xs whitespace-nowrap">വില്ലേജ് :</span>
                    <FormLineInput value={data.ownerC_perm_village} onChange={(v) => update("ownerC_perm_village", v)} />
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="font-semibold text-xs whitespace-nowrap">താലൂക്ക് :</span>
                    <FormLineInput value={data.ownerC_perm_taluk} onChange={(v) => update("ownerC_perm_taluk", v)} />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 items-baseline pl-2">
                  <div className="flex items-baseline gap-1">
                    <span className="font-semibold text-xs whitespace-nowrap">പഞ്ചായത്ത് :</span>
                    <FormLineInput value={data.ownerC_perm_panchayath} onChange={(v) => update("ownerC_perm_panchayath", v)} />
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="font-semibold text-xs whitespace-nowrap">ജില്ല :</span>
                    <FormLineInput value={data.ownerC_perm_district} onChange={(v) => update("ownerC_perm_district", v)} />
                  </div>
                </div>

                <div className="flex items-center gap-2 pl-2">
                  <span className="font-semibold text-xs">പിൻ കോഡ് :</span>
                  <PinCodeGrid value={data.ownerC_perm_pincode} onChange={(v) => update("ownerC_perm_pincode", v)} />
                </div>
              </div>

              {/* ID/PAN C */}
              <div className="space-y-2 pt-2 border-t border-dashed border-gray-400">
                <div className="flex flex-wrap items-center gap-4">
                  <span className="font-bold whitespace-nowrap">4. തിരിച്ചറിയൽരേഖ :</span>
                  <label className="flex items-center gap-1 cursor-pointer">
                    <input
                      type="radio"
                      name="ownerC_id_type"
                      checked={data.ownerC_id_type === "Election"}
                      onChange={() => update("ownerC_id_type", "Election")}
                      className="border-black"
                    />
                    <span className="border border-black px-2 py-0.5 font-semibold text-xs">ഇലക്ഷൻ കാർഡ്</span>
                  </label>
                  <label className="flex items-center gap-1 cursor-pointer">
                    <input
                      type="radio"
                      name="ownerC_id_type"
                      checked={data.ownerC_id_type === "Aadhaar"}
                      onChange={() => update("ownerC_id_type", "Aadhaar")}
                      className="border-black"
                    />
                    <span className="border border-black px-2 py-0.5 font-semibold text-xs">ആധാർ കാർഡ്</span>
                  </label>
                </div>

                <div className="flex items-baseline gap-2">
                  <span className="font-bold whitespace-nowrap">5. തിരിച്ചറിയൽ രേഖയുടെ നമ്പർ :</span>
                  <FormLineInput value={data.ownerC_id_no} onChange={(v) => update("ownerC_id_no", v)} />
                </div>

                <div className="flex items-center gap-3">
                  <span className="font-bold whitespace-nowrap">6. പാൻ നമ്പർ :</span>
                  <PanGrid value={data.ownerC_pan} onChange={(v) => update("ownerC_pan", v)} />
                </div>

                <div className="flex items-baseline gap-2">
                  <span className="font-bold whitespace-nowrap">7. നോമിനി :</span>
                  <FormLineInput value={data.ownerC_nominee} onChange={(v) => update("ownerC_nominee", v)} />
                </div>
              </div>
            </div>
          </div>

          <hr className="border-black my-2" />

          {/* Section 3: Rigs */}
          <div className="space-y-4">
            <h2 className="font-bold text-sm sm:text-base underline">
              3. ഡ്രില്ലിംഗ് റിഗ്ഗുകളുടെ വിവരം (പരമാവധി മൂന്ന് എണ്ണം)
            </h2>

            {["A", "B", "C"].map((letter) => (
              <div key={letter} className="border border-black p-3 space-y-3 relative">
                <span className="absolute -top-3 left-3 bg-white px-2 font-bold border border-black text-xs">
                  {letter}
                </span>

                <div className="space-y-2 pt-1">
                  <div className="flex flex-wrap items-baseline gap-2">
                    <span className="font-bold whitespace-nowrap">1. റിഗ്ഗിന്റെ തരം :</span>
                    <FormLineInput value={data[`rig${letter}_type`]} onChange={(v) => update(`rig${letter}_type`, v)} />
                  </div>
                  <p className="text-[10px] text-gray-600 italic pl-4">
                    (റോട്ടറി റിഗ്, റോട്ടറി കം.ഡി.റ്റി.എച്ച് റിഗ്, ക്യാലിക്സ് റിഗ്, ഫിൽട്ടർ പോയിന്റ് യൂണിറ്റ്)
                  </p>

                  <div className="flex items-baseline gap-2">
                    <span className="font-bold whitespace-nowrap">2. റിഗ് ഉടമസ്ഥന്റെ പേര് :</span>
                    <FormLineInput value={data[`rig${letter}_owner_name`]} onChange={(v) => update(`rig${letter}_owner_name`, v)} />
                  </div>

                  <div className="flex items-baseline gap-2">
                    <span className="font-bold whitespace-nowrap">മേൽവിലാസം :</span>
                    <FormLineInput value={data[`rig${letter}_owner_address`]} onChange={(v) => update(`rig${letter}_owner_address`, v)} />
                  </div>

                  <div className="grid grid-cols-2 gap-2 items-baseline pl-4">
                    <div className="flex items-baseline gap-1">
                      <span className="font-bold whitespace-nowrap">ജില്ല :</span>
                      <FormLineInput value={data[`rig${letter}_district`]} onChange={(v) => update(`rig${letter}_district`, v)} />
                    </div>
                    <div className="flex items-baseline gap-1">
                      <span className="font-bold whitespace-nowrap">സംസ്ഥാനം :</span>
                      <FormLineInput value={data[`rig${letter}_state`]} onChange={(v) => update(`rig${letter}_state`, v)} />
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pl-4">
                    <span className="font-bold">പിൻ കോഡ് :</span>
                    <PinCodeGrid value={data[`rig${letter}_pincode`]} onChange={(v) => update(`rig${letter}_pincode`, v)} />
                  </div>

                  <div className="space-y-1 pt-1">
                    <span className="font-bold block">3. ഉപയോഗിക്കുന്ന വാഹനത്തിന്റെ വിവരം</span>
                    <div className="grid grid-cols-2 gap-2 pl-4">
                      <div className="flex items-baseline gap-1">
                        <span className="font-semibold whitespace-nowrap">എ. തരം :</span>
                        <FormLineInput value={data[`rig${letter}_veh_type`]} onChange={(v) => update(`rig${letter}_veh_type`, v)} />
                      </div>
                      <div className="flex items-baseline gap-1">
                        <span className="font-semibold whitespace-nowrap">ബി. രജി. നമ്പർ :</span>
                        <FormLineInput value={data[`rig${letter}_veh_reg`]} onChange={(v) => update(`rig${letter}_veh_reg`, v)} />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 pl-4">
                      <div className="flex items-baseline gap-1">
                        <span className="font-semibold whitespace-nowrap">സി. ചേസിസ് നമ്പർ :</span>
                        <FormLineInput value={data[`rig${letter}_veh_chassis`]} onChange={(v) => update(`rig${letter}_veh_chassis`, v)} />
                      </div>
                      <div className="flex items-baseline gap-1">
                        <span className="font-semibold whitespace-nowrap">ഡി. എൻജിൻ നമ്പർ :</span>
                        <FormLineInput value={data[`rig${letter}_veh_engine`]} onChange={(v) => update(`rig${letter}_veh_engine`, v)} />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1 pt-1">
                    <span className="font-bold block">
                      4. കംപ്രസറിന്റെ വിവരം <span className="font-normal text-xs">(ഡിറ്റിഎച്ച് / റോട്ടറി കം.ഡിറ്റിഎച്ച് / ഫിൽട്ടർ പോയിന്റ് )</span>
                    </span>
                    <div className="grid grid-cols-2 gap-2 pl-4">
                      <div className="flex items-baseline gap-1">
                        <span className="font-semibold whitespace-nowrap">എ. മോഡൽ :</span>
                        <FormLineInput value={data[`rig${letter}_comp_model`]} onChange={(v) => update(`rig${letter}_comp_model`, v)} />
                      </div>
                      <div className="flex items-baseline gap-1">
                        <span className="font-semibold whitespace-nowrap">ബി. കപ്പാസിറ്റി :</span>
                        <FormLineInput value={data[`rig${letter}_comp_cap`]} onChange={(v) => update(`rig${letter}_comp_cap`, v)} />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1 pt-1">
                    <span className="font-bold block">
                      5. ജനറേറ്ററിന്റെ വിവരം <span className="font-normal text-xs">(ക്യാലിക്സ് റിഗ്)</span>
                    </span>
                    <div className="grid grid-cols-2 gap-2 pl-4">
                      <div className="flex items-baseline gap-1">
                        <span className="font-semibold whitespace-nowrap">എ. തരം :</span>
                        <FormLineInput value={data[`rig${letter}_gen_type`]} onChange={(v) => update(`rig${letter}_gen_type`, v)} />
                      </div>
                      <div className="flex items-baseline gap-1">
                        <span className="font-semibold whitespace-nowrap">ബി. മോഡൽ :</span>
                        <FormLineInput value={data[`rig${letter}_gen_model`]} onChange={(v) => update(`rig${letter}_gen_model`, v)} />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 pl-4">
                      <div className="flex items-baseline gap-1">
                        <span className="font-semibold whitespace-nowrap">സി. കപ്പാസിറ്റി :</span>
                        <FormLineInput value={data[`rig${letter}_gen_cap`]} onChange={(v) => update(`rig${letter}_gen_cap`, v)} />
                      </div>
                      <div className="flex items-baseline gap-1">
                        <span className="font-semibold whitespace-nowrap">ഡി. എൻജിൻ നമ്പർ :</span>
                        <FormLineInput value={data[`rig${letter}_gen_engine`]} onChange={(v) => update(`rig${letter}_gen_engine`, v)} />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1 pt-1">
                    <span className="font-bold block">
                      6. കുഴിക്കാൻ സാധിക്കുന്ന കിണറിന്റെ സ്പെസിഫിക്കേഷൻ{" "}
                      <span className="font-normal text-xs">(കംപ്രസ്സർ കപ്പാസിറ്റിയുടെ അടിസ്ഥാനത്തിൽ)</span>
                    </span>
                    <div className="grid grid-cols-2 gap-2 pl-4">
                      <div className="flex items-baseline gap-1">
                        <span className="font-semibold whitespace-nowrap">എ. പരമാവധി ആഴം :</span>
                        <FormLineInput value={data[`rig${letter}_well_depth`]} onChange={(v) => update(`rig${letter}_well_depth`, v)} />
                      </div>
                      <div className="flex items-baseline gap-1">
                        <span className="font-semibold whitespace-nowrap">ബി. പരമാവധി വ്യാസം :</span>
                        <FormLineInput value={data[`rig${letter}_well_dia`]} onChange={(v) => update(`rig${letter}_well_dia`, v)} />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1 pt-1">
                    <span className="font-bold block">7. ഡ്രില്ലിംഗ് യന്ത്ര ഓപ്പറേറ്ററുടെ വിവരങ്ങൾ</span>
                    <div className="grid grid-cols-2 gap-2 pl-4">
                      <div className="flex items-baseline gap-1">
                        <span className="font-semibold whitespace-nowrap">പേര് :</span>
                        <FormLineInput value={data[`rig${letter}_op_name`]} onChange={(v) => update(`rig${letter}_op_name`, v)} />
                      </div>
                      <div className="flex items-baseline gap-1">
                        <span className="font-semibold whitespace-nowrap">വയസ്സ് :</span>
                        <FormLineInput value={data[`rig${letter}_op_age`]} onChange={(v) => update(`rig${letter}_op_age`, v)} width="w-20" />
                      </div>
                    </div>
                    <div className="flex items-baseline gap-2 pl-4">
                      <span className="font-semibold whitespace-nowrap">പ്രവർത്തി പരിചയം :</span>
                      <FormLineInput value={data[`rig${letter}_op_exp`]} onChange={(v) => update(`rig${letter}_op_exp`, v)} />
                    </div>
                    <div className="flex flex-wrap items-center gap-4 pl-4">
                      <span className="font-semibold whitespace-nowrap">തിരിച്ചറിയൽ രേഖ :</span>
                      <label className="flex items-center gap-1 cursor-pointer">
                        <input
                          type="radio"
                          name={`rig${letter}_op_id_type`}
                          checked={data[`rig${letter}_op_id_type`] === "Election"}
                          onChange={() => update(`rig${letter}_op_id_type`, "Election")}
                          className="border-black"
                        />
                        <span className="border border-black px-2 py-0.5 text-xs font-semibold">ഇലക്ഷൻ കാർഡ്</span>
                      </label>
                      <label className="flex items-center gap-1 cursor-pointer">
                        <input
                          type="radio"
                          name={`rig${letter}_op_id_type`}
                          checked={data[`rig${letter}_op_id_type`] === "Aadhaar"}
                          onChange={() => update(`rig${letter}_op_id_type`, "Aadhaar")}
                          className="border-black"
                        />
                        <span className="border border-black px-2 py-0.5 text-xs font-semibold">ആധാർ കാർഡ്</span>
                      </label>
                    </div>
                    <div className="flex items-baseline gap-2 pl-4">
                      <span className="font-semibold whitespace-nowrap">തിരിച്ചറിയൽ രേഖയുടെ നമ്പർ :</span>
                      <FormLineInput value={data[`rig${letter}_op_id_no`]} onChange={(v) => update(`rig${letter}_op_id_no`, v)} />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Declaration Section */}
          <div className="pt-4 border-t-2 border-black space-y-4">
            <h2 className="font-bold text-center text-sm underline">സത്യപ്രസ്താവന</h2>
            <p className="text-justify leading-relaxed text-xs">
              മേൽ നൽകിയിട്ടുള്ള വിവരങ്ങൾ എന്റെ അറിവിലും വിശ്വാസത്തിലും കൃത്യവും സത്യസന്ധവുമാണെന്ന് സാക്ഷ്യപ്പെടുത്തുന്നു.
            </p>
            <div className="flex justify-between items-end pt-4">
              <div className="space-y-2">
                <div className="flex items-baseline gap-2">
                  <span className="font-bold">തീയതി :</span>
                  <FormLineInput value={data.date} onChange={(v) => update("date", v)} width="w-28" />
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="font-bold">സ്ഥലം :</span>
                  <FormLineInput value={data.place} onChange={(v) => update("place", v)} width="w-32" />
                </div>
              </div>
              <div className="text-right">
                <p className="font-bold pt-6 border-t border-dotted border-black w-36 text-center">ഒപ്പ്</p>
              </div>
            </div>
          </div>

          {/* Office Use Section */}
          <div className="pt-4 border-t-2 border-black space-y-2">
            <div className="text-center font-bold text-xs border border-black py-0.5 bg-gray-50">
              ആഫീസ് ഉപയോഗത്തിന്
            </div>
            <div className="space-y-1.5 pl-2 text-xs">
              <div className="flex items-baseline gap-2">
                <span className="whitespace-nowrap">അപേക്ഷ ലഭിച്ച തീയതി :</span>
                <FormLineInput value={data.office_date_recd} onChange={(v) => update("office_date_recd", v)} />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="whitespace-nowrap">അപേക്ഷാ ഫീസ് അടച്ച വിവരങ്ങൾ :</span>
                <FormLineInput value={data.office_fee_details} onChange={(v) => update("office_fee_details", v)} />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="whitespace-nowrap">അടച്ച തുക :</span>
                <FormLineInput value={data.office_paid_amount} onChange={(v) => update("office_paid_amount", v)} width="w-36" />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="whitespace-nowrap">റിഗ് പരിശോധിച്ച തീയതി :</span>
                <FormLineInput value={data.office_rig_inspected_date} onChange={(v) => update("office_rig_inspected_date", v)} />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="whitespace-nowrap">പരിശോധകന്റെ ശുപാർശ :</span>
                <FormLineInput value={data.office_recommendation} onChange={(v) => update("office_recommendation", v)} />
              </div>
            </div>

            <div className="flex justify-between items-end pt-8 text-xs">
              <div className="text-center w-48">
                <p className="font-semibold border-t border-dotted border-black pt-1">പരിശോധകന്റെ ഒപ്പ്</p>
                <p className="text-[10px] text-gray-600">(പേര് തസ്തിക ഉൾപ്പെടെ)</p>
              </div>
              <div className="text-center w-36">
                <p className="font-semibold border-t border-dotted border-black pt-1">ജില്ലാ ഓഫീസർ</p>
              </div>
            </div>
          </div>

          {/* Receipt Section */}
          <div className="pt-6 border-t-2 border-dashed border-black space-y-3">
            <div className="text-center">
              <h3 className="font-bold text-sm underline">രസീത്</h3>
            </div>

            <div className="space-y-2 pl-2 text-xs">
              <div className="flex items-baseline gap-2">
                <span className="font-bold whitespace-nowrap">അപേക്ഷാ നമ്പർ :</span>
                <FormLineInput value={data.receipt_app_no} onChange={(v) => update("receipt_app_no", v)} />
              </div>

              <div className="flex items-baseline gap-2">
                <span className="font-bold whitespace-nowrap">അപേക്ഷകന്റെ പേര് :</span>
                <FormLineInput value={data.receipt_applicant_name} onChange={(v) => update("receipt_applicant_name", v)} />
              </div>

              <div className="flex items-baseline gap-2">
                <span className="font-bold whitespace-nowrap">അപേക്ഷ ലഭിച്ച തീയതി :</span>
                <FormLineInput value={data.receipt_date_recd} onChange={(v) => update("receipt_date_recd", v)} />
              </div>

              <div className="space-y-1">
                <span className="font-bold block">അപേക്ഷാ ഫീസ് ഒടുക്കിയ വിവരങ്ങൾ</span>
                <div className="grid grid-cols-2 gap-4 pl-4 items-baseline">
                  <div className="flex items-baseline gap-2">
                    <span className="font-semibold whitespace-nowrap">ഒടുക്കിയ തുക :</span>
                    <FormLineInput value={data.receipt_paid_amount} onChange={(v) => update("receipt_paid_amount", v)} />
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="font-semibold whitespace-nowrap">തീയതി :</span>
                    <FormLineInput value={data.receipt_paid_date} onChange={(v) => update("receipt_paid_date", v)} />
                  </div>
                </div>
              </div>

              <div className="space-y-1.5 pt-1">
                <span className="font-bold block">അപേക്ഷാ വിവരങ്ങൾ</span>
                <div className="flex items-center gap-2 pl-4">
                  <span className="font-semibold w-36">ഏജൻസി രജിസ്ട്രേഷൻ</span>
                  <input
                    type="checkbox"
                    checked={!!data.receipt_agency_reg_check}
                    onChange={(e) => update("receipt_agency_reg_check", e.target.checked)}
                    className="w-5 h-5 border border-black"
                  />
                </div>
                <div className="flex items-center gap-2 pl-4">
                  <span className="font-semibold w-36">റിഗ് രജിസ്ട്രേഷൻ</span>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="checkbox"
                      checked={!!data.receipt_rig1_check}
                      onChange={(e) => update("receipt_rig1_check", e.target.checked)}
                      className="w-5 h-5 border border-black"
                    />
                    <input
                      type="checkbox"
                      checked={!!data.receipt_rig2_check}
                      onChange={(e) => update("receipt_rig2_check", e.target.checked)}
                      className="w-5 h-5 border border-black"
                    />
                    <input
                      type="checkbox"
                      checked={!!data.receipt_rig3_check}
                      onChange={(e) => update("receipt_rig3_check", e.target.checked)}
                      className="w-5 h-5 border border-black"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-between items-end pt-6 text-xs">
              <div className="flex items-baseline gap-2">
                <span className="font-bold">തീയതി :</span>
                <FormLineInput value={data.date} onChange={(v) => update("date", v)} width="w-28" />
              </div>
              <div className="text-center w-36">
                <p className="font-bold border-t border-dotted border-black pt-1">ജില്ലാ ഓഫീസർ</p>
              </div>
            </div>
          </div>
        </div>
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
  const [data, setData] = useState<Record<string, any>>({});

  useEffect(() => {
    if (application) {
      const activeRigs = (application.rigs || []).filter((r) => r.status === "Active");
      const owner = application.owner || ({} as OwnerInfo);

      const initial: Record<string, any> = {
        // Section A
        agencyName: application.agencyName || "",
        agencyRegNo: application.agencyRegistrationNo || "",
        registeredDistrict: application.officeLocation || "",
        address: owner.address || "",
        phone: owner.mobile || "",
        email: owner.email || "",
        village: "",
        taluk: "",
        panchayath: "",
        district: application.officeLocation || "",
        pincode: "",
        gstin: "",
        lsgdRegNo: "",

        // Registered Rigs Section (Rig-1, Rig-2, Rig-3)
        regRig1_type: activeRigs[0]?.typeOfRigMalayalam || activeRigs[0]?.typeOfRig || "",
        regRig1_regNo: activeRigs[0]?.rigRegistrationNo || "",
        regRig1_lastPaidAmount: activeRigs[0]?.challanAmount ? `₹${activeRigs[0].challanAmount}` : "",
        regRig1_challanNoDate: activeRigs[0]?.challanNo ? `Challan #${activeRigs[0].challanNo}` : "",
        regRig1_expiryDate: "",

        regRig2_type: activeRigs[1]?.typeOfRigMalayalam || activeRigs[1]?.typeOfRig || "",
        regRig2_regNo: activeRigs[1]?.rigRegistrationNo || "",
        regRig2_lastPaidAmount: activeRigs[1]?.challanAmount ? `₹${activeRigs[1].challanAmount}` : "",
        regRig2_challanNoDate: activeRigs[1]?.challanNo ? `Challan #${activeRigs[1].challanNo}` : "",
        regRig2_expiryDate: "",

        regRig3_type: activeRigs[2]?.typeOfRigMalayalam || activeRigs[2]?.typeOfRig || "",
        regRig3_regNo: activeRigs[2]?.rigRegistrationNo || "",
        regRig3_lastPaidAmount: activeRigs[2]?.challanAmount ? `₹${activeRigs[2].challanAmount}` : "",
        regRig3_challanNoDate: activeRigs[2]?.challanNo ? `Challan #${activeRigs[2].challanNo}` : "",
        regRig3_expiryDate: "",

        date: format(new Date(), "dd/MM/yyyy"),
        place: application.officeLocation || "",

        // Office use
        office_date_recd: "",
        office_fee_amount: "",
        office_fee_date: "",
        office_rig_inspected_date: "",
        office_recommendation: "",

        // Receipt
        receipt_app_no: application.applicationNo || "APP/2026/001",
        receipt_agency_name: application.agencyName || "",
        receipt_agency_reg_no: application.agencyRegistrationNo || "",
        receipt_date_recd: format(new Date(), "dd/MM/yyyy"),
        receipt_fee_paid_amount: "10000",
        receipt_fee_paid_date: format(new Date(), "dd/MM/yyyy"),
        receipt_renewal_count: "1",
        receipt_new_rig_count: "0",
      };

      // Rig renewal details (RIG-1, RIG-2, RIG-3)
      ["RIG1", "RIG2", "RIG3"].forEach((rigKey, idx) => {
        const rig = activeRigs[idx];
        initial[`${rigKey}_regNo`] = rig?.rigRegistrationNo || "";
        initial[`${rigKey}_expiryDate`] = "";
        initial[`${rigKey}_type`] = rig?.typeOfRigMalayalam || rig?.typeOfRig || "റോട്ടറി കം.ഡി.റ്റി.എച്ച് റിഗ്";
        initial[`${rigKey}_ownerName`] = rig ? owner.name : "";
        initial[`${rigKey}_address`] = rig ? owner.address : "";
        initial[`${rigKey}_phone`] = owner.phone || "";
        initial[`${rigKey}_mobile`] = owner.mobile || "";
        initial[`${rigKey}_email`] = owner.email || "";
        initial[`${rigKey}_district`] = application.officeLocation || "";
        initial[`${rigKey}_state`] = "Kerala";
        initial[`${rigKey}_pincode`] = "";

        initial[`${rigKey}_veh_reg`] = rig?.rigVehicle?.regNo || "";
        initial[`${rigKey}_veh_chassis`] = rig?.rigVehicle?.chassisNo || "";
        initial[`${rigKey}_veh_engine`] = rig?.rigVehicle?.engineNo || "";

        initial[`${rigKey}_supp_veh_has`] = "No"; // Yes / No
        initial[`${rigKey}_supp_veh_reg`] = "";
        initial[`${rigKey}_supp_veh_chassis`] = "";
        initial[`${rigKey}_supp_veh_engine`] = "";

        initial[`${rigKey}_comp_model`] = rig?.compressorDetails?.model || "";
        initial[`${rigKey}_comp_cap`] = rig?.compressorDetails?.capacity || "";

        initial[`${rigKey}_gen_type`] = rig?.generatorDetails?.type || "";
        initial[`${rigKey}_gen_model`] = rig?.generatorDetails?.model || "";
        initial[`${rigKey}_gen_cap`] = rig?.generatorDetails?.capacity || "";
        initial[`${rigKey}_gen_engine`] = rig?.generatorDetails?.engineNo || "";

        initial[`${rigKey}_well_depth`] = "";
        initial[`${rigKey}_well_dia`] = "";

        initial[`${rigKey}_op_name`] = "";
        initial[`${rigKey}_op_age`] = "";
        initial[`${rigKey}_op_exp`] = "";
        initial[`${rigKey}_op_id_type`] = "Aadhaar";
        initial[`${rigKey}_op_id_no`] = "";
      });

      setData(initial);
    }
  }, [application]);

  const update = (key: string, val: any) => setData((prev) => ({ ...prev, [key]: val }));

  const handlePrint = () => {
    printDocument("rig-renewal-official-form", "റിഗ് രജിസ്ട്രേഷൻ പുതുക്കൽ/പുതിയ റിഗ് രജിസ്ട്രേഷൻ അപേക്ഷാ ഫോറം", "1.2cm 1.5cm 1.2cm 1.5cm");
  };

  return (
    <div className="w-full bg-slate-100 dark:bg-gray-950 text-black min-h-screen p-2 sm:p-4 space-y-4 font-sans">
      {/* Top Header */}
      <div className="max-w-4xl mx-auto p-3 bg-white dark:bg-gray-900 border rounded-lg shadow-sm flex flex-wrap items-center justify-between gap-3 print:hidden">
        <div className="flex items-center gap-2">
          {onClose && (
            <Button size="sm" variant="outline" onClick={onClose} className="gap-1 text-xs">
              <ArrowLeft className="w-3.5 h-3.5" /> തിരികെ
            </Button>
          )}
          <div>
            <h1 className="text-sm sm:text-base font-bold flex items-center gap-1.5 text-gray-900 dark:text-gray-100">
              <RefreshCw className="w-4 h-4 text-blue-600" />
              പുതുക്കൽ അപേക്ഷാ ഫോറം (Rig Renewal Official Form)
            </h1>
            <p className="text-[11px] text-gray-500">100% Exact Copy of Kerala Ground Water Authority Renewal Format</p>
          </div>
        </div>
        <Button size="sm" onClick={handlePrint} className="bg-blue-600 hover:bg-blue-700 text-white gap-1.5 shadow-sm">
          <Printer className="w-4 h-4" /> അച്ചടിക്കുക / Print Form
        </Button>
      </div>

      {/* Printable Sheet */}
      <div className="overflow-y-auto pb-10 print:p-0 print:overflow-visible">
        <div
          id="rig-renewal-official-form"
          className="max-w-3xl mx-auto bg-white p-6 sm:p-10 border border-gray-300 shadow-md text-black space-y-5 text-xs sm:text-sm font-serif print:border-none print:shadow-none print:p-0 print:max-w-none"
        >
          {/* Header */}
          <div className="text-center space-y-1 border-b-2 border-black pb-3">
            <h1 className="text-lg sm:text-xl font-bold tracking-wide">കേരള സർക്കാർ ഭൂജല അതോറിറ്റി</h1>
            <p className="text-xs font-medium">(കേരള സർക്കാരിന്റെ 2002 ലെ ആക്ട് 19 പ്രകാരം നിലവിൽ വന്നത്)</p>
            <p className="text-[10px] font-mono text-gray-800">
              (Order No.G.O.(MS)No.04/2023/WRD Dated 24/01/2023 & Order No. DGWD/306/2022/T4 Dated 21/03/2023)
            </p>
            <div className="pt-2">
              <div className="inline-block border-2 border-black px-4 py-1.5 font-bold text-sm sm:text-base bg-gray-50">
                റിഗ് രജിസ്ട്രേഷൻ പുതുക്കൽ/പുതിയ റിഗ് രജിസ്ട്രേഷൻ അപേക്ഷാ ഫോറം
              </div>
              <p className="text-xs font-bold pt-1 underline">(നിലവിൽ ഏജൻസി രജിസ്ട്രേഷൻ ഉള്ളവർക്ക്)</p>
            </div>
          </div>

          {/* Section A */}
          <div className="space-y-3">
            <h2 className="font-bold text-sm sm:text-base underline">A. സ്ഥാപനം / ഏജൻസിയുടെ വിവരം</h2>

            <div className="space-y-2 pl-2">
              <div className="flex items-baseline gap-2">
                <span className="font-bold whitespace-nowrap">1. ഏജൻസിയുടെ പേര് :</span>
                <FormLineInput value={data.agencyName} onChange={(v) => update("agencyName", v)} />
              </div>

              <div className="flex items-baseline gap-2">
                <span className="font-bold whitespace-nowrap">2. നിലവിലെ രജിസ്ട്രേഷൻ നമ്പർ :</span>
                <FormLineInput value={data.agencyRegNo} onChange={(v) => update("agencyRegNo", v)} />
              </div>

              <div className="flex items-baseline gap-2">
                <span className="font-bold whitespace-nowrap">3. ഏജൻസി രജിസ്റ്റർ ചെയ്തിട്ടുള്ള ജില്ല :</span>
                <FormLineInput value={data.registeredDistrict} onChange={(v) => update("registeredDistrict", v)} />
              </div>

              <div className="flex items-baseline gap-2">
                <span className="font-bold whitespace-nowrap">4. മേൽവിലാസം :</span>
                <FormLineInput value={data.address} onChange={(v) => update("address", v)} />
              </div>

              <div className="flex items-baseline gap-2">
                <span className="font-bold whitespace-nowrap">5. ഫോൺ നമ്പർ :</span>
                <FormLineInput value={data.phone} onChange={(v) => update("phone", v)} />
              </div>

              <div className="flex items-baseline gap-2">
                <span className="font-bold whitespace-nowrap">6. ഇ മെയിൽ വിലാസം :</span>
                <FormLineInput value={data.email} onChange={(v) => update("email", v)} />
              </div>

              <div className="grid grid-cols-2 gap-4 items-baseline pl-4">
                <div className="flex items-baseline gap-2">
                  <span className="font-bold whitespace-nowrap">വില്ലേജ് :</span>
                  <FormLineInput value={data.village} onChange={(v) => update("village", v)} />
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="font-bold whitespace-nowrap">താലൂക്ക് :</span>
                  <FormLineInput value={data.taluk} onChange={(v) => update("taluk", v)} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 items-baseline pl-4">
                <div className="flex items-baseline gap-2">
                  <span className="font-bold whitespace-nowrap">പഞ്ചായത്ത് :</span>
                  <FormLineInput value={data.panchayath} onChange={(v) => update("panchayath", v)} />
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="font-bold whitespace-nowrap">ജില്ല :</span>
                  <FormLineInput value={data.district} onChange={(v) => update("district", v)} />
                </div>
              </div>

              <div className="flex items-center gap-3 pl-4">
                <span className="font-bold">പിൻ കോഡ് :</span>
                <PinCodeGrid value={data.pincode} onChange={(v) => update("pincode", v)} />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <span className="font-bold whitespace-nowrap">7. ജി.എസ്.റ്റി. നമ്പർ :</span>
                <div className="flex-1 border border-black p-1 bg-white">
                  <input
                    type="text"
                    value={data.gstin || ""}
                    onChange={(e) => update("gstin", e.target.value)}
                    className="w-full text-xs font-mono uppercase focus:outline-none bg-transparent"
                    placeholder="21AAAAA0000A1Z5"
                  />
                </div>
              </div>

              <div className="flex items-baseline gap-2">
                <span className="font-bold whitespace-nowrap">8. തദ്ദേശ സ്വയംഭരണ സ്ഥാപനം നൽകിയ രജിസ്ട്രേഷൻ നമ്പർ :</span>
                <FormLineInput value={data.lsgdRegNo} onChange={(v) => update("lsgdRegNo", v)} />
              </div>
            </div>
          </div>

          <hr className="border-black my-2" />

          {/* Registered Rigs Details List */}
          <div className="space-y-3">
            <h2 className="font-bold text-sm sm:text-base underline text-center">
              ഏജൻസിയിൽ നിലവിൽ രജിസ്റ്റർ ചെയ്തിട്ടുള്ള റിഗ്ഗുകളുടെ വിവരങ്ങൾ
            </h2>

            {[1, 2, 3].map((num) => (
              <div key={num} className="border border-black p-2.5 space-y-1.5 relative">
                <span className="font-bold text-xs underline block">Rig-{num}</span>

                <div className="flex items-baseline gap-2 pl-2">
                  <span className="font-bold whitespace-nowrap">1. റിഗ്ഗിന്റെ തരം :</span>
                  <FormLineInput value={data[`regRig${num}_type`]} onChange={(v) => update(`regRig${num}_type`, v)} />
                </div>
                <p className="text-[10px] text-gray-600 italic pl-6">
                  (റോട്ടറി റിഗ്, റോട്ടറി കം.ഡി.റ്റി.എച്ച് റിഗ്, ക്യാലിക്സ് റിഗ്, ഫിൽട്ടർ പോയിന്റ് യൂണിറ്റ്)
                </p>

                <div className="flex items-baseline gap-2 pl-2">
                  <span className="font-bold whitespace-nowrap">2. നിലവിലെ രജിസ്ട്രേഷൻ നമ്പർ :</span>
                  <FormLineInput value={data[`regRig${num}_regNo`]} onChange={(v) => update(`regRig${num}_regNo`, v)} />
                </div>

                <div className="flex items-baseline gap-2 pl-2">
                  <span className="font-bold whitespace-nowrap">
                    3. അവസാനമായി ഒടുക്കിയ തുക <span className="font-normal text-xs">(ചലാന്റെ പകർപ്പ് ഉള്ളടക്കം ചെയ്യുക)</span> :
                  </span>
                  <FormLineInput
                    value={data[`regRig${num}_lastPaidAmount`]}
                    onChange={(v) => update(`regRig${num}_lastPaidAmount`, v)}
                  />
                </div>

                <div className="flex items-baseline gap-2 pl-2">
                  <span className="font-bold whitespace-nowrap">4. ചലാൻ നം. തീയതി :</span>
                  <FormLineInput value={data[`regRig${num}_challanNoDate`]} onChange={(v) => update(`regRig${num}_challanNoDate`, v)} />
                </div>

                <div className="flex items-baseline gap-2 pl-2">
                  <span className="font-bold whitespace-nowrap">5. രജിസ്ട്രേഷൻ അവസാനിക്കുന്ന തീയതി :</span>
                  <FormLineInput value={data[`regRig${num}_expiryDate`]} onChange={(v) => update(`regRig${num}_expiryDate`, v)} />
                </div>
              </div>
            ))}
          </div>

          <hr className="border-black my-2" />

          {/* Rigs Renewal Details */}
          <div className="space-y-4">
            <h2 className="font-bold text-sm sm:text-base underline text-center">
              രജിസ്ട്രേഷൻ പുതുക്കേണ്ട റിഗ്ഗുകളുടെ വിവരങ്ങൾ
            </h2>

            {["RIG1", "RIG2", "RIG3"].map((rigKey, idx) => {
              const letter = String.fromCharCode(65 + idx); // A, B, C
              const labelNum = idx + 1;

              return (
                <div key={rigKey} className="border border-black p-3 space-y-3 relative">
                  <span className="absolute -top-3 left-3 bg-white px-2 font-bold border border-black text-xs">
                    {letter}
                  </span>
                  <span className="font-bold text-xs underline block pt-1">RIG-{labelNum}</span>

                  <div className="space-y-2">
                    <div className="flex items-baseline gap-2 pl-2">
                      <span className="font-bold whitespace-nowrap">
                        1. നിലവിലെ രജിസ്ട്രേഷൻ നമ്പർ <span className="font-normal text-[11px]">(രജിസ്ട്രേഷൻ പുതുക്കുന്നതിന് മാത്രം)</span> :
                      </span>
                      <FormLineInput value={data[`${rigKey}_regNo`]} onChange={(v) => update(`${rigKey}_regNo`, v)} />
                    </div>

                    <div className="flex items-baseline gap-2 pl-2">
                      <span className="font-bold whitespace-nowrap">
                        2. രജിസ്ട്രേഷൻ അവസാനിക്കുന്ന തീയതി <span className="font-normal text-[11px]">(രജിസ്ട്രേഷൻ പുതുക്കുന്നതിന് മാത്രം)</span> :
                      </span>
                      <FormLineInput value={data[`${rigKey}_expiryDate`]} onChange={(v) => update(`${rigKey}_expiryDate`, v)} />
                    </div>

                    <div className="flex items-baseline gap-2 pl-2">
                      <span className="font-bold whitespace-nowrap">3. റിഗ്ഗിന്റെ തരം :</span>
                      <FormLineInput value={data[`${rigKey}_type`]} onChange={(v) => update(`${rigKey}_type`, v)} />
                    </div>
                    <p className="text-[10px] text-gray-600 italic pl-6">
                      (റോട്ടറി റിഗ്, റോട്ടറി കം.ഡി.റ്റി.എച്ച് റിഗ്, ക്യാലിക്സ് റിഗ്, ഫിൽട്ടർ പോയിന്റ് യൂണിറ്റ്)
                    </p>

                    <div className="flex items-baseline gap-2 pl-2">
                      <span className="font-bold whitespace-nowrap">4. റിഗ് ഉടമസ്ഥന്റെ പേര് :</span>
                      <FormLineInput value={data[`${rigKey}_ownerName`]} onChange={(v) => update(`${rigKey}_ownerName`, v)} />
                    </div>

                    <div className="flex items-baseline gap-2 pl-2">
                      <span className="font-bold whitespace-nowrap">മേൽവിലാസം :</span>
                      <FormLineInput value={data[`${rigKey}_address`]} onChange={(v) => update(`${rigKey}_address`, v)} />
                    </div>

                    <div className="grid grid-cols-2 gap-4 items-baseline pl-4">
                      <div className="flex items-baseline gap-2">
                        <span className="font-bold whitespace-nowrap">ഫോൺ :</span>
                        <FormLineInput value={data[`${rigKey}_phone`]} onChange={(v) => update(`${rigKey}_phone`, v)} />
                      </div>
                      <div className="flex items-baseline gap-2">
                        <span className="font-bold whitespace-nowrap">മൊബൈൽ :</span>
                        <FormLineInput value={data[`${rigKey}_mobile`]} onChange={(v) => update(`${rigKey}_mobile`, v)} />
                      </div>
                    </div>

                    <div className="flex items-baseline gap-2 pl-4">
                      <span className="font-bold whitespace-nowrap">ഇ മെയിൽ :</span>
                      <FormLineInput value={data[`${rigKey}_email`]} onChange={(v) => update(`${rigKey}_email`, v)} />
                    </div>

                    <div className="grid grid-cols-2 gap-4 items-baseline pl-4">
                      <div className="flex items-baseline gap-2">
                        <span className="font-bold whitespace-nowrap">ജില്ല :</span>
                        <FormLineInput value={data[`${rigKey}_district`]} onChange={(v) => update(`${rigKey}_district`, v)} />
                      </div>
                      <div className="flex items-baseline gap-2">
                        <span className="font-bold whitespace-nowrap">സംസ്ഥാനം:</span>
                        <FormLineInput value={data[`${rigKey}_state`]} onChange={(v) => update(`${rigKey}_state`, v)} />
                      </div>
                    </div>

                    <div className="flex items-center gap-3 pl-4">
                      <span className="font-bold">പിൻ കോഡ് :</span>
                      <PinCodeGrid value={data[`${rigKey}_pincode`]} onChange={(v) => update(`${rigKey}_pincode`, v)} />
                    </div>

                    {/* Vehicles */}
                    <div className="space-y-2 pt-1 border-t border-dashed border-gray-300 pl-2">
                      <span className="font-bold block">5. ഉപയോഗിക്കുന്ന വാഹനങ്ങളുടെ വിവരങ്ങൾ</span>

                      <div className="space-y-1 pl-2">
                        <div className="flex items-baseline gap-2">
                          <span className="font-semibold whitespace-nowrap">എ. കംപ്രസ്സർ / റിഗ് ഘടിപ്പിച്ച വാഹനം</span>
                          <span className="font-bold whitespace-nowrap">രജി. നമ്പർ :</span>
                          <FormLineInput value={data[`${rigKey}_veh_reg`]} onChange={(v) => update(`${rigKey}_veh_reg`, v)} />
                        </div>
                        <div className="grid grid-cols-2 gap-4 items-baseline pl-4">
                          <div className="flex items-baseline gap-2">
                            <span className="font-semibold whitespace-nowrap">ചേസിസ് നമ്പർ :</span>
                            <FormLineInput value={data[`${rigKey}_veh_chassis`]} onChange={(v) => update(`${rigKey}_veh_chassis`, v)} />
                          </div>
                          <div className="flex items-baseline gap-2">
                            <span className="font-semibold whitespace-nowrap">എൻജിൻ നമ്പർ :</span>
                            <FormLineInput value={data[`${rigKey}_veh_engine`]} onChange={(v) => update(`${rigKey}_veh_engine`, v)} />
                          </div>
                        </div>
                      </div>

                      <div className="space-y-1 pl-2 pt-1">
                        <div className="flex items-center gap-3">
                          <span className="font-semibold whitespace-nowrap">ബി. സപ്പോർട്ടിങ് വാഹനം</span>
                          <div className="border border-black px-2 py-0.5 flex items-center gap-2 text-xs font-bold">
                            <span>Yes / No</span>
                            <input
                              type="checkbox"
                              checked={data[`${rigKey}_supp_veh_has`] === "Yes"}
                              onChange={(e) => update(`${rigKey}_supp_veh_has`, e.target.checked ? "Yes" : "No")}
                              className="w-4 h-4 border-black"
                            />
                          </div>
                          <span className="font-bold whitespace-nowrap">If Yes രജി. നമ്പർ :</span>
                          <FormLineInput value={data[`${rigKey}_supp_veh_reg`]} onChange={(v) => update(`${rigKey}_supp_veh_reg`, v)} />
                        </div>
                        <div className="grid grid-cols-2 gap-4 items-baseline pl-4">
                          <div className="flex items-baseline gap-2">
                            <span className="font-semibold whitespace-nowrap">ചേസിസ് നമ്പർ :</span>
                            <FormLineInput value={data[`${rigKey}_supp_veh_chassis`]} onChange={(v) => update(`${rigKey}_supp_veh_chassis`, v)} />
                          </div>
                          <div className="flex items-baseline gap-2">
                            <span className="font-semibold whitespace-nowrap">എൻജിൻ നമ്പർ :</span>
                            <FormLineInput value={data[`${rigKey}_supp_veh_engine`]} onChange={(v) => update(`${rigKey}_supp_veh_engine`, v)} />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Compressor */}
                    <div className="space-y-1 pt-1 border-t border-dashed border-gray-300 pl-2">
                      <span className="font-bold block">
                        6. കംപ്രസറിന്റെ വിവരം <span className="font-normal text-xs">(ഡിറ്റിഎച്ച് / റോട്ടറി കം.ഡിറ്റിഎച്ച് / ഫിൽട്ടർ പോയിന്റ് )</span>
                      </span>
                      <div className="flex items-baseline gap-2 pl-4">
                        <span className="font-semibold whitespace-nowrap">എ. മോഡൽ :</span>
                        <FormLineInput value={data[`${rigKey}_comp_model`]} onChange={(v) => update(`${rigKey}_comp_model`, v)} />
                      </div>
                      <div className="flex items-baseline gap-2 pl-4">
                        <span className="font-semibold whitespace-nowrap">ബി. കപ്പാസിറ്റി :</span>
                        <FormLineInput value={data[`${rigKey}_comp_cap`]} onChange={(v) => update(`${rigKey}_comp_cap`, v)} />
                      </div>
                    </div>

                    {/* Generator */}
                    <div className="space-y-1 pt-1 border-t border-dashed border-gray-300 pl-2">
                      <span className="font-bold block">
                        7. ജനറേറ്ററിന്റെ വിവരം <span className="font-normal text-xs">(ക്യാലിക്സ് റിഗ്)</span>
                      </span>
                      <div className="grid grid-cols-2 gap-4 items-baseline pl-4">
                        <div className="flex items-baseline gap-2">
                          <span className="font-semibold whitespace-nowrap">എ. തരം :</span>
                          <FormLineInput value={data[`${rigKey}_gen_type`]} onChange={(v) => update(`${rigKey}_gen_type`, v)} />
                        </div>
                        <div className="flex items-baseline gap-2">
                          <span className="font-semibold whitespace-nowrap">ബി. മോഡൽ :</span>
                          <FormLineInput value={data[`${rigKey}_gen_model`]} onChange={(v) => update(`${rigKey}_gen_model`, v)} />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4 items-baseline pl-4">
                        <div className="flex items-baseline gap-2">
                          <span className="font-semibold whitespace-nowrap">സി. കപ്പാസിറ്റി :</span>
                          <FormLineInput value={data[`${rigKey}_gen_cap`]} onChange={(v) => update(`${rigKey}_gen_cap`, v)} />
                        </div>
                        <div className="flex items-baseline gap-2">
                          <span className="font-semibold whitespace-nowrap">ഡി. എൻജിൻ നമ്പർ :</span>
                          <FormLineInput value={data[`${rigKey}_gen_engine`]} onChange={(v) => update(`${rigKey}_gen_engine`, v)} />
                        </div>
                      </div>
                    </div>

                    {/* Well Specs */}
                    <div className="space-y-1 pt-1 border-t border-dashed border-gray-300 pl-2">
                      <span className="font-bold block">
                        8. കുഴിക്കാൻ സാധിക്കുന്ന കുഴൽക്കിണറുകളുടെ വിവരം{" "}
                        <span className="font-normal text-xs">(കംപ്രസ്സർ കപ്പാസിറ്റിയുടെ അടിസ്ഥാനത്തിൽ )</span>
                      </span>
                      <div className="grid grid-cols-2 gap-4 items-baseline pl-4">
                        <div className="flex items-baseline gap-2">
                          <span className="font-semibold whitespace-nowrap">എ. പരമാവധി ആഴം :</span>
                          <FormLineInput value={data[`${rigKey}_well_depth`]} onChange={(v) => update(`${rigKey}_well_depth`, v)} />
                        </div>
                        <div className="flex items-baseline gap-2">
                          <span className="font-semibold whitespace-nowrap">ബി. പരമാവധി വ്യാസം :</span>
                          <FormLineInput value={data[`${rigKey}_well_dia`]} onChange={(v) => update(`${rigKey}_well_dia`, v)} />
                        </div>
                      </div>
                    </div>

                    {/* Operator */}
                    <div className="space-y-1 pt-1 border-t border-dashed border-gray-300 pl-2">
                      <span className="font-bold block">9. ഡ്രിളിംഗ് യന്ത്ര ഓപ്പറേറ്ററുടെ വിവരങ്ങൾ</span>
                      <div className="grid grid-cols-2 gap-4 items-baseline pl-4">
                        <div className="flex items-baseline gap-2">
                          <span className="font-semibold whitespace-nowrap">പേര് :</span>
                          <FormLineInput value={data[`${rigKey}_op_name`]} onChange={(v) => update(`${rigKey}_op_name`, v)} />
                        </div>
                        <div className="flex items-baseline gap-2">
                          <span className="font-semibold whitespace-nowrap">വയസ്സ് :</span>
                          <FormLineInput value={data[`${rigKey}_op_age`]} onChange={(v) => update(`${rigKey}_op_age`, v)} width="w-20" />
                        </div>
                      </div>
                      <div className="flex items-baseline gap-2 pl-4">
                        <span className="font-semibold whitespace-nowrap">പ്രവർത്തി പരിചയം :</span>
                        <FormLineInput value={data[`${rigKey}_op_exp`]} onChange={(v) => update(`${rigKey}_op_exp`, v)} />
                      </div>
                      <div className="flex flex-wrap items-center gap-3 pl-4 pt-1">
                        <span className="font-semibold whitespace-nowrap">തിരിചറിയൽരേഖ :</span>
                        <label className="flex items-center gap-1 cursor-pointer">
                          <input
                            type="radio"
                            name={`${rigKey}_op_id_type`}
                            checked={data[`${rigKey}_op_id_type`] === "Election"}
                            onChange={() => update(`${rigKey}_op_id_type`, "Election")}
                          />
                          <span className="border border-black px-1.5 py-0.5 text-xs font-semibold">ഇലക്ഷൻ കാർഡ്</span>
                        </label>
                        <label className="flex items-center gap-1 cursor-pointer">
                          <input
                            type="radio"
                            name={`${rigKey}_op_id_type`}
                            checked={data[`${rigKey}_op_id_type`] === "Aadhaar"}
                            onChange={() => update(`${rigKey}_op_id_type`, "Aadhaar")}
                          />
                          <span className="border border-black px-1.5 py-0.5 text-xs font-semibold">ആധാർ കാർഡ്</span>
                        </label>
                        <label className="flex items-center gap-1 cursor-pointer">
                          <input
                            type="radio"
                            name={`${rigKey}_op_id_type`}
                            checked={data[`${rigKey}_op_id_type`] === "Other"}
                            onChange={() => update(`${rigKey}_op_id_type`, "Other")}
                          />
                          <span className="border border-black px-1.5 py-0.5 text-xs font-semibold">മറ്റുള്ളവ</span>
                        </label>
                      </div>
                      <div className="flex items-baseline gap-2 pl-4">
                        <span className="font-semibold whitespace-nowrap">തിരിച്ചറിയൽ രേഖയുടെ നമ്പർ :</span>
                        <FormLineInput value={data[`${rigKey}_op_id_no`]} onChange={(v) => update(`${rigKey}_op_id_no`, v)} />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Declaration Section */}
          <div className="pt-4 border-t-2 border-black space-y-4">
            <h2 className="font-bold text-center text-sm underline">സത്യപ്രസ്താവന</h2>
            <p className="text-justify leading-relaxed text-xs">
              മേൽ നൽകിയിട്ടുള്ള വിവരങ്ങൾ എന്റെ അറിവിലും വിശ്വാസത്തിലും കൃത്യവും സത്യസന്ധവുമാണെന്ന് സാക്ഷ്യപ്പെടുത്തുന്നു.
            </p>
            <div className="flex justify-between items-end pt-4">
              <div className="space-y-2">
                <div className="flex items-baseline gap-2">
                  <span className="font-bold">തീയതി :</span>
                  <FormLineInput value={data.date} onChange={(v) => update("date", v)} width="w-28" />
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="font-bold">സ്ഥലം :</span>
                  <FormLineInput value={data.place} onChange={(v) => update("place", v)} width="w-32" />
                </div>
              </div>
              <div className="text-right">
                <p className="font-bold pt-6 border-t border-dotted border-black w-44 text-center">അപേക്ഷകന്റെ ഒപ്പും പേരും</p>
              </div>
            </div>
          </div>

          {/* Office Use Section */}
          <div className="pt-4 border-t-2 border-black space-y-2">
            <div className="text-center font-bold text-xs border border-black py-0.5 bg-gray-50">
              ഓഫീസ് ഉപയോഗത്തിന് മാത്രം
            </div>
            <div className="space-y-1.5 pl-2 text-xs">
              <div className="flex items-baseline gap-2">
                <span className="whitespace-nowrap">1. അപേക്ഷ ലഭിച്ച തീയതി :</span>
                <FormLineInput value={data.office_date_recd} onChange={(v) => update("office_date_recd", v)} />
              </div>

              <div className="space-y-1">
                <span className="block font-semibold">2. അപേക്ഷാ ഫീസ് അടച്ച വിവരങ്ങൾ</span>
                <div className="grid grid-cols-2 gap-4 pl-4 items-baseline">
                  <div className="flex items-baseline gap-2">
                    <span className="whitespace-nowrap">അടച്ച തുക :</span>
                    <FormLineInput value={data.office_fee_amount} onChange={(v) => update("office_fee_amount", v)} />
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="whitespace-nowrap">തിയതി :</span>
                    <FormLineInput value={data.office_fee_date} onChange={(v) => update("office_fee_date", v)} />
                  </div>
                </div>
              </div>

              <div className="flex items-baseline gap-2">
                <span className="whitespace-nowrap">3. റിഗ് പരിശോധിച്ച തീയതി :</span>
                <FormLineInput value={data.office_rig_inspected_date} onChange={(v) => update("office_rig_inspected_date", v)} />
              </div>

              <div className="flex items-baseline gap-2">
                <span className="whitespace-nowrap">4. പരിശോധകന്റെ പാർശ :</span>
                <FormLineInput value={data.office_recommendation} onChange={(v) => update("office_recommendation", v)} />
              </div>
            </div>

            <div className="flex justify-between items-end pt-8 text-xs">
              <div className="text-center w-36">
                <p className="font-semibold border-t border-dotted border-black pt-1">പരിശോധകൻെറ ഒപ്പ്</p>
              </div>
              <div className="text-center w-36">
                <p className="font-semibold border-t border-dotted border-black pt-1">ജിാ ഓഫീസറുെട ഒപ്പ്</p>
              </div>
            </div>
          </div>

          {/* Receipt Section */}
          <div className="pt-6 border-t-2 border-dashed border-black space-y-3">
            <div className="text-center">
              <h3 className="font-bold text-sm underline">രസീത്</h3>
            </div>

            <div className="space-y-2 pl-2 text-xs">
              <div className="flex items-baseline gap-2">
                <span className="font-bold whitespace-nowrap">1. അപേക്ഷാ നമ്പർ :</span>
                <FormLineInput value={data.receipt_app_no} onChange={(v) => update("receipt_app_no", v)} />
              </div>

              <div className="flex items-baseline gap-2">
                <span className="font-bold whitespace-nowrap">2. ഏജൻസിയുടെ പേര് :</span>
                <FormLineInput value={data.receipt_agency_name} onChange={(v) => update("receipt_agency_name", v)} />
              </div>

              <div className="flex items-baseline gap-2">
                <span className="font-bold whitespace-nowrap">3. ഏജൻസി റെജിസ്ട്രേഷൻ നമ്പർ :</span>
                <FormLineInput value={data.receipt_agency_reg_no} onChange={(v) => update("receipt_agency_reg_no", v)} />
              </div>

              <div className="flex items-baseline gap-2">
                <span className="font-bold whitespace-nowrap">4. അപേക്ഷ ലഭിച്ച തീയതി :</span>
                <FormLineInput value={data.receipt_date_recd} onChange={(v) => update("receipt_date_recd", v)} />
              </div>

              <div className="space-y-1">
                <span className="font-bold block">5. അപേക്ഷാ ഫീസ് അടച്ച വിവരങ്ങൾ :</span>
                <div className="grid grid-cols-2 gap-4 pl-4 items-baseline">
                  <div className="flex items-baseline gap-2">
                    <span className="font-semibold whitespace-nowrap">അടച്ച തുക :</span>
                    <FormLineInput value={data.receipt_fee_paid_amount} onChange={(v) => update("receipt_fee_paid_amount", v)} />
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="font-semibold whitespace-nowrap">തിയതി :</span>
                    <FormLineInput value={data.receipt_fee_paid_date} onChange={(v) => update("receipt_fee_paid_date", v)} />
                  </div>
                </div>
              </div>

              <div className="space-y-1.5 pt-1">
                <span className="font-bold block">6. അപേക്ഷാ വിവരങ്ങൾ</span>

                <div className="flex items-center justify-between pl-4 max-w-lg">
                  <span className="font-semibold">
                    1. റിഗ് രജിസ്ട്രേഷൻ പുതുക്കൽ <span className="font-normal text-[11px]">( നിലവിൽ റെജിസ്ട്രേഷൻ സാധുതയുള്ളതിന്)</span>
                  </span>
                  <div className="flex items-center gap-1 border border-black px-2 py-0.5 bg-white">
                    <input
                      type="text"
                      value={data.receipt_renewal_count || "1"}
                      onChange={(e) => update("receipt_renewal_count", e.target.value)}
                      className="w-8 text-center font-bold focus:outline-none bg-transparent"
                    />
                    <span className="font-bold">എണ്ണം</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pl-4 max-w-lg">
                  <span className="font-semibold">
                    2. പുതിയ റിഗ് രജിസ്ട്രേഷൻ/രജിസ്റ്റർ ചെയ്ത റിഗ് മാറ്റുന്നതിന്
                  </span>
                  <div className="flex items-center gap-1 border border-black px-2 py-0.5 bg-white">
                    <input
                      type="text"
                      value={data.receipt_new_rig_count || "0"}
                      onChange={(e) => update("receipt_new_rig_count", e.target.value)}
                      className="w-8 text-center font-bold focus:outline-none bg-transparent"
                    />
                    <span className="font-bold">എണ്ണം</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-between items-end pt-6 text-xs">
              <div className="flex items-baseline gap-2">
                <span className="font-bold">തിയതി :</span>
                <FormLineInput value={data.date} onChange={(v) => update("date", v)} width="w-28" />
              </div>
              <div className="text-center w-36">
                <p className="font-bold border-t border-dotted border-black pt-1">ജിാ ഓഫീസർ</p>
              </div>
            </div>
          </div>
        </div>
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
