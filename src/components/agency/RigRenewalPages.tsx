"use client";

import React from "react";
import {
  PinCodeGrid,
  FormLineInput,
  FormDateInput,
  OptionBox,
  YesNoBox,
  SquareCheckbox,
} from "./FormInputComponents";

interface FormProps {
  data: Record<string, any>;
  update: (k: string, v: any) => void;
}

// Single Rig Details Sheet component for Rig Renewal (used for Rig 1 on Page 2, Rig 2 on Page 3, Rig 3 on Page 4)
function RigRenewalDetailSheet({
  letter,
  rigKey,
  rigTitle,
  pageNumber,
  data,
  update,
}: {
  letter: "A" | "B" | "C";
  rigKey: "rig1" | "rig2" | "rig3";
  rigTitle: "RIG-1" | "RIG-2" | "RIG-3";
  pageNumber: number;
  data: Record<string, any>;
  update: (k: string, v: any) => void;
}) {
  return (
    <div className="official-form-page bg-white p-6 sm:p-10 border border-gray-300 shadow-md relative box-border min-h-[270mm] flex flex-col justify-between">
      <div className="print-page-badge absolute top-3 right-4 text-[10px] text-gray-500 font-sans bg-gray-100 px-2 py-0.5 rounded border print:hidden">
        പേജ് {pageNumber} / 5
      </div>

      <div className="space-y-2.5">
        <h2 className="font-bold text-center text-sm sm:text-base">
          രജിസ്ട്രേഷൻ പുതുക്കേണ്ട റിഗ്ഗുകളുടെ വിവരങ്ങൾ
        </h2>

        <div className="flex items-center gap-2 pt-0.5">
          <span className="border border-black px-2 py-0.5 font-bold text-xs bg-white">
            {letter}
          </span>
          <span className="border border-black px-3 py-0.5 font-bold text-xs bg-white">
            {rigTitle}
          </span>
        </div>

        <div className="space-y-1.5 pl-1">
          <div className="flex items-baseline gap-2">
            <span className="font-semibold whitespace-nowrap shrink-0">
              1. നിലവിലെ റെജിസ്ട്രേഷൻ നമ്പർ <span className="font-normal text-[10px]">(റെജിസ്ട്രേഷൻ പുതുക്കുന്നതിന് മാത്രം)</span>
            </span>
            <FormLineInput value={data[`${rigKey}_regNo`]} onChange={(v) => update(`${rigKey}_regNo`, v)} />
          </div>

          <div className="flex items-baseline gap-2">
            <span className="font-semibold whitespace-nowrap shrink-0">
              2. റെജിസ്ട്രേഷൻ അവസാനിക്കുന്ന തിയതി <span className="font-normal text-[10px]">(റെജിസ്ട്രേഷൻ പുതുക്കുന്നതിന് മാത്രം)</span>
            </span>
            <FormDateInput value={data[`${rigKey}_expiryDate`]} onChange={(v) => update(`${rigKey}_expiryDate`, v)} />
          </div>

          <div className="space-y-0.5">
            <div className="flex items-baseline gap-2">
              <span className="font-semibold whitespace-nowrap shrink-0">3. റിഗ്ഗിന്റെ തരം</span>
              <FormLineInput value={data[`${rigKey}_type`]} onChange={(v) => update(`${rigKey}_type`, v)} />
            </div>
            <p className="text-[10px] text-gray-700 italic pl-4">
              (റോട്ടറി റിഗ്ഗ്, റോട്ടറി കം.ഡിറ്റിഎച്ച് റിഗ്ഗ്, കാലിക്സ് റിഗ്ഗ്, ഫിൽട്ടർ പോയിന്റ് യൂണിറ്റ്)
            </p>
          </div>

          <div className="space-y-1 pt-1">
            <div className="flex items-baseline gap-2">
              <span className="font-semibold whitespace-nowrap shrink-0">4. റിഗ്ഗ് ഉടമസ്ഥന്റെ പേര് :</span>
              <FormLineInput value={data[`${rigKey}_ownerName`] ?? data[`${rigKey}_owner_name`]} onChange={(v) => update(`${rigKey}_ownerName`, v)} />
            </div>

            <div className="flex items-baseline gap-2">
              <span className="font-semibold whitespace-nowrap shrink-0">മേൽവിലാസം :</span>
              <FormLineInput value={data[`${rigKey}_address`] ?? data[`${rigKey}_owner_address`]} onChange={(v) => update(`${rigKey}_address`, v)} />
            </div>
            <div className="pl-4">
              <FormLineInput value={data[`${rigKey}_address_line2`] || ""} onChange={(v) => update(`${rigKey}_address_line2`, v)} />
            </div>

            <div className="grid grid-cols-2 gap-4 items-baseline pl-4">
              <div className="flex items-baseline gap-1">
                <span className="font-semibold text-xs whitespace-nowrap shrink-0">ഫോൺ</span>
                <FormLineInput value={data[`${rigKey}_phone`] ?? data[`${rigKey}_owner_phone`]} onChange={(v) => update(`${rigKey}_phone`, v)} />
              </div>
              <div className="flex items-baseline gap-1">
                <span className="font-semibold text-xs whitespace-nowrap shrink-0">മൊബൈൽ</span>
                <FormLineInput value={data[`${rigKey}_mobile`] ?? data[`${rigKey}_owner_mobile`]} onChange={(v) => update(`${rigKey}_mobile`, v)} />
              </div>
            </div>

            <div className="flex items-baseline gap-2 pl-4">
              <span className="font-semibold text-xs whitespace-nowrap shrink-0">ഇ മെയിൽ</span>
              <FormLineInput value={data[`${rigKey}_email`] ?? data[`${rigKey}_owner_email`]} onChange={(v) => update(`${rigKey}_email`, v)} />
            </div>

            <div className="grid grid-cols-2 gap-4 items-baseline pl-4">
              <div className="flex items-baseline gap-1">
                <span className="font-semibold text-xs whitespace-nowrap shrink-0">ജില്ല :</span>
                <FormLineInput value={data[`${rigKey}_district`]} onChange={(v) => update(`${rigKey}_district`, v)} />
              </div>
              <div className="flex items-baseline gap-1">
                <span className="font-semibold text-xs whitespace-nowrap shrink-0">സംസ്ഥാനം:</span>
                <FormLineInput value={data[`${rigKey}_state`]} onChange={(v) => update(`${rigKey}_state`, v)} />
              </div>
            </div>

            <div className="flex items-center gap-2 pl-4">
              <span className="font-semibold text-xs whitespace-nowrap shrink-0">പിൻ കോഡ് :</span>
              <PinCodeGrid value={data[`${rigKey}_pincode`]} onChange={(v) => update(`${rigKey}_pincode`, v)} />
            </div>
          </div>

          <div className="space-y-1 pt-1">
            <span className="font-semibold block">5. ഉപയോഗിക്കുന്ന വാഹനങ്ങളുടെ വിവരങ്ങൾ</span>
            
            {/* A: Compressor / Rig Vehicle */}
            <div className="space-y-1 pl-4">
              <div className="flex items-baseline gap-2">
                <span className="font-semibold text-xs shrink-0">എ. കംപ്രസ്സർ / റിഗ്ഗ് ഘടിപ്പിച്ച വാഹനം</span>
                <span className="font-semibold text-xs whitespace-nowrap shrink-0">രജി. നമ്പർ</span>
                <FormLineInput value={data[`${rigKey}_veh_reg`]} onChange={(v) => update(`${rigKey}_veh_reg`, v)} />
              </div>
              <div className="flex items-baseline gap-2 pl-4">
                <span className="font-semibold text-xs shrink-0">ചേസിസ് നമ്പർ</span>
                <FormLineInput value={data[`${rigKey}_veh_chassis`]} onChange={(v) => update(`${rigKey}_veh_chassis`, v)} />
              </div>
              <div className="flex items-baseline gap-2 pl-4">
                <span className="font-semibold text-xs shrink-0">എഞ്ചിൻ നമ്പർ</span>
                <FormLineInput value={data[`${rigKey}_veh_engine`]} onChange={(v) => update(`${rigKey}_veh_engine`, v)} />
              </div>
            </div>

            {/* B: Supporting Vehicle */}
            <div className="space-y-1 pl-4 pt-1">
              <div className="flex flex-wrap items-center gap-3">
                <span className="font-semibold text-xs shrink-0">ബി. സപ്പോർട്ടിങ് വാഹനം</span>
                <YesNoBox
                  value={data[`${rigKey}_has_support_veh`] ?? data[`${rigKey}_support_veh_has`]}
                  onChange={(v) => {
                    update(`${rigKey}_has_support_veh`, v);
                    update(`${rigKey}_support_veh_has`, v);
                  }}
                />
                <span className="font-semibold text-xs whitespace-nowrap shrink-0">If Yes രജി. നമ്പർ</span>
                <FormLineInput value={data[`${rigKey}_sup_veh_reg`] ?? data[`${rigKey}_support_veh_reg`]} onChange={(v) => update(`${rigKey}_sup_veh_reg`, v)} />
              </div>
              <div className="flex items-baseline gap-2 pl-4">
                <span className="font-semibold text-xs shrink-0">ചേസിസ് നമ്പർ</span>
                <FormLineInput value={data[`${rigKey}_sup_veh_chassis`] ?? data[`${rigKey}_support_veh_chassis`]} onChange={(v) => update(`${rigKey}_sup_veh_chassis`, v)} />
              </div>
              <div className="flex items-baseline gap-2 pl-4">
                <span className="font-semibold text-xs shrink-0">എഞ്ചിൻ നമ്പർ</span>
                <FormLineInput value={data[`${rigKey}_sup_veh_engine`] ?? data[`${rigKey}_support_veh_engine`]} onChange={(v) => update(`${rigKey}_sup_veh_engine`, v)} />
              </div>
            </div>
          </div>

          <div className="space-y-1 pt-1">
            <span className="font-semibold block">
              6. കമ്പ്രസറിന്റെ വിവരം (ഡിറ്റിഎച്ച / റോട്ടറി കം.ഡിറ്റിഎച്ച് / ഫിൽട്ടർ പോയിന്റ് )
            </span>
            <div className="flex items-baseline gap-2 pl-4">
              <span className="font-semibold text-xs shrink-0">എ. മോഡൽ</span>
              <FormLineInput value={data[`${rigKey}_comp_model`]} onChange={(v) => update(`${rigKey}_comp_model`, v)} />
            </div>
            <div className="flex items-baseline gap-2 pl-4">
              <span className="font-semibold text-xs shrink-0">ബി. കപ്പാസിറ്റി</span>
              <FormLineInput value={data[`${rigKey}_comp_cap`]} onChange={(v) => update(`${rigKey}_comp_cap`, v)} />
            </div>
          </div>

          <div className="space-y-1 pt-1">
            <span className="font-semibold block">7. ജനറേറ്ററിന്റെ വിവരം (കാലിക്സ് റിഗ്ഗ്)</span>
            <div className="grid grid-cols-2 gap-4 items-baseline pl-4">
              <div className="flex items-baseline gap-1">
                <span className="font-semibold text-xs shrink-0">എ. തരം</span>
                <FormLineInput value={data[`${rigKey}_gen_type`]} onChange={(v) => update(`${rigKey}_gen_type`, v)} />
              </div>
              <div className="flex items-baseline gap-1">
                <span className="font-semibold text-xs shrink-0">ബി. മോഡൽ</span>
                <FormLineInput value={data[`${rigKey}_gen_model`]} onChange={(v) => update(`${rigKey}_gen_model`, v)} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 items-baseline pl-4">
              <div className="flex items-baseline gap-1">
                <span className="font-semibold text-xs shrink-0">സി. കപ്പാസിറ്റി</span>
                <FormLineInput value={data[`${rigKey}_gen_cap`]} onChange={(v) => update(`${rigKey}_gen_cap`, v)} />
              </div>
              <div className="flex items-baseline gap-1">
                <span className="font-semibold text-xs shrink-0">ഡി. എഞ്ചിൻ നമ്പർ</span>
                <FormLineInput value={data[`${rigKey}_gen_engine`]} onChange={(v) => update(`${rigKey}_gen_engine`, v)} />
              </div>
            </div>
          </div>

          <div className="space-y-1 pt-1">
            <span className="font-semibold block text-xs">
              8. കുഴിക്കാൻ സാധിക്കുന്ന കുഴൽക്കിണറുകളുടെ വിവരം (കംപ്രസ്സർ കപ്പാസിറ്റിയുടെ അടിസ്ഥാനത്തിൽ )
            </span>
            <div className="grid grid-cols-2 gap-4 items-baseline pl-4">
              <div className="flex items-baseline gap-1">
                <span className="font-semibold text-xs shrink-0">എ. പരമാവധി ആഴം</span>
                <FormLineInput value={data[`${rigKey}_drill_depth`] ?? data[`${rigKey}_well_depth`]} onChange={(v) => update(`${rigKey}_drill_depth`, v)} />
              </div>
              <div className="flex items-baseline gap-1">
                <span className="font-semibold text-xs shrink-0">ബി. പരമാവധി വ്യാസം</span>
                <FormLineInput value={data[`${rigKey}_drill_dia`] ?? data[`${rigKey}_well_dia`]} onChange={(v) => update(`${rigKey}_drill_dia`, v)} />
              </div>
            </div>
          </div>

          <div className="space-y-1 pt-1">
            <span className="font-semibold block">9. ഡ്രില്ലിംഗ് യന്ത്ര ഓപ്പറേറ്ററുടെ വിവരങ്ങൾ</span>
            <div className="grid grid-cols-2 gap-4 items-baseline pl-4">
              <div className="flex items-baseline gap-1">
                <span className="font-semibold text-xs shrink-0">പേര് :</span>
                <FormLineInput value={data[`${rigKey}_op_name`]} onChange={(v) => update(`${rigKey}_op_name`, v)} />
              </div>
              <div className="flex items-baseline gap-1">
                <span className="font-semibold text-xs shrink-0">വയസ് :</span>
                <FormLineInput value={data[`${rigKey}_op_age`]} onChange={(v) => update(`${rigKey}_op_age`, v)} width="w-20 text-center" />
              </div>
            </div>
            <div className="flex items-baseline gap-2 pl-4">
              <span className="font-semibold text-xs shrink-0">പ്രവൃത്തി പരിചയം :</span>
              <FormLineInput value={data[`${rigKey}_op_exp`]} onChange={(v) => update(`${rigKey}_op_exp`, v)} />
            </div>
            <div className="flex flex-wrap items-center gap-3 pl-4">
              <span className="font-semibold text-xs shrink-0">തിരിച്ചറിയൽരേഖ :</span>
              <OptionBox
                label="ഇലക്ഷൻ കാർഡ്"
                selected={data[`${rigKey}_op_id_type`] === "Election"}
                onToggle={() => update(`${rigKey}_op_id_type`, data[`${rigKey}_op_id_type`] === "Election" ? "" : "Election")}
              />
              <OptionBox
                label="ആധാർ കാർഡ്"
                selected={data[`${rigKey}_op_id_type`] === "Aadhaar"}
                onToggle={() => update(`${rigKey}_op_id_type`, data[`${rigKey}_op_id_type`] === "Aadhaar" ? "" : "Aadhaar")}
              />
              <OptionBox
                label="മറ്റുള്ളവ"
                selected={data[`${rigKey}_op_id_type`] === "Other"}
                onToggle={() => update(`${rigKey}_op_id_type`, data[`${rigKey}_op_id_type`] === "Other" ? "" : "Other")}
              />
            </div>
            <div className="flex items-baseline gap-2 pl-4">
              <span className="font-semibold text-xs shrink-0">തിരിച്ചറിയൽ രേഖയുടെ നമ്പർ :</span>
              <FormLineInput value={data[`${rigKey}_op_id_no`]} onChange={(v) => update(`${rigKey}_op_id_no`, v)} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function RigRenewalPages({ data, update }: FormProps) {
  return (
    <div className="space-y-6 print:space-y-0 text-black font-serif text-[11pt] leading-relaxed selection:bg-yellow-200">
      <style jsx global>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 1.2cm 1.5cm 1.2cm 1.5cm;
          }
          body {
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
          }
          .official-form-page {
            page-break-after: always !important;
            break-after: page !important;
            min-height: 270mm !important;
            height: auto !important;
            padding: 0 !important;
            margin: 0 !important;
            border: none !important;
            box-shadow: none !important;
          }
          .print-hidden {
            display: none !important;
          }
        }
      `}</style>

      {/* ========================================================================= */}
      {/* PAGE 1: HEADER, AGENCY DETAILS (A), EXISTING REGISTERED RIGS SUMMARY       */}
      {/* ========================================================================= */}
      <div className="official-form-page bg-white p-6 sm:p-10 border border-gray-300 shadow-md relative box-border min-h-[270mm] flex flex-col justify-between">
        <div className="print-page-badge absolute top-3 right-4 text-[10px] text-gray-500 font-sans bg-gray-100 px-2 py-0.5 rounded border print:hidden">
          പേജ് 1 / 5
        </div>

        <div className="space-y-3">
          {/* Header */}
          <div className="text-center space-y-1">
            <h1 className="text-base sm:text-lg font-bold">കേരള സർക്കാർ ഭൂജല അതോറിറ്റി</h1>
            <p className="text-xs font-normal">(കേരള സർക്കാരിന്റെ 2002 ലെ ആക്ട് 19 പ്രകാരം നിലവിൽവന്നത്)</p>
            <p className="text-[10px] font-sans text-gray-800">
              (Order No.G.O.(MS)No.04/2023/WRD Dated 24/01/2023 & Order No. DGWD/306/2022/T4 Dated 21/03/2023)
            </p>
            <div className="pt-1">
              <h2 className="font-bold text-sm sm:text-base leading-snug">
                റിഗ്ഗ് രജിസ്ട്രേഷൻ പുതുക്കൽ/പുതിയ റിഗ്ഗ് രജിസ്ട്രേഷൻ അപേക്ഷാ ഫോറം
              </h2>
              <p className="text-xs font-semibold">(നിലവിൽ ഏജൻസി രജിസ്ട്രേഷൻ ഉള്ളവർക്ക്)</p>
            </div>
          </div>

          {/* Section A: Agency Details */}
          <div className="space-y-1.5 pt-1">
            <h3 className="font-bold text-sm sm:text-base">A. സ്ഥാപനം / ഏജൻസിയുടെ വിവരം</h3>

            <div className="space-y-1 pl-1">
              <div className="flex items-baseline gap-2">
                <span className="font-semibold whitespace-nowrap shrink-0">1. ഏജൻസിയുടെ പേര്</span>
                <FormLineInput value={data.agencyName} onChange={(v) => update("agencyName", v)} />
              </div>

              <div className="flex items-baseline gap-2">
                <span className="font-semibold whitespace-nowrap shrink-0">2. നിലവിലെ റെജിസ്ട്രേഷൻ നമ്പർ</span>
                <FormLineInput value={data.agency_reg_no} onChange={(v) => update("agency_reg_no", v)} />
              </div>

              <div className="flex items-baseline gap-2">
                <span className="font-semibold whitespace-nowrap shrink-0">3. ഏജൻസി രജിസ്റ്റർ ചെയ്തിട്ടുള്ള ജില്ല</span>
                <FormLineInput value={data.registeredDistrict || data.district} onChange={(v) => update("registeredDistrict", v)} />
              </div>

              <div className="space-y-1">
                <div className="flex items-baseline gap-2">
                  <span className="font-semibold whitespace-nowrap shrink-0">4. മേൽവിലാസം</span>
                  <FormLineInput value={data.address} onChange={(v) => update("address", v)} />
                </div>
                <div className="pl-4">
                  <FormLineInput value={data.address_line2 || ""} onChange={(v) => update("address_line2", v)} />
                </div>
              </div>

              <div className="flex items-baseline gap-2">
                <span className="font-semibold whitespace-nowrap shrink-0">5. ഫോൺ നമ്പർ</span>
                <FormLineInput value={data.phone} onChange={(v) => update("phone", v)} />
              </div>

              <div className="space-y-1">
                <div className="flex items-baseline gap-2">
                  <span className="font-semibold whitespace-nowrap shrink-0">6. ഇ മെയിൽ വിലാസം</span>
                  <FormLineInput value={data.email} onChange={(v) => update("email", v)} />
                </div>

                <div className="grid grid-cols-2 gap-4 items-baseline pl-4">
                  <div className="flex items-baseline gap-1">
                    <span className="font-semibold whitespace-nowrap shrink-0">വില്ലേജ് :</span>
                    <FormLineInput value={data.village} onChange={(v) => update("village", v)} />
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="font-semibold whitespace-nowrap shrink-0">താലൂക്ക്</span>
                    <FormLineInput value={data.taluk} onChange={(v) => update("taluk", v)} />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 items-baseline pl-4">
                  <div className="flex items-baseline gap-1">
                    <span className="font-semibold whitespace-nowrap shrink-0">പഞ്ചായത്ത് :</span>
                    <FormLineInput value={data.panchayath} onChange={(v) => update("panchayath", v)} />
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="font-semibold whitespace-nowrap shrink-0">ജില്ല</span>
                    <FormLineInput value={data.district} onChange={(v) => update("district", v)} />
                  </div>
                </div>

                <div className="flex items-center gap-2 pl-4">
                  <span className="font-semibold whitespace-nowrap shrink-0">പിൻ കോഡ് :</span>
                  <PinCodeGrid value={data.pincode} onChange={(v) => update("pincode", v)} />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-0.5">
                <span className="font-semibold whitespace-nowrap shrink-0">7. ജി.എസ്സ്.ടി. നമ്പർ :</span>
                <div className="border border-black px-2 py-0.5 inline-block bg-white flex-1 max-w-md">
                  <input
                    type="text"
                    value={data.gstin || ""}
                    onChange={(e) => update("gstin", e.target.value.toUpperCase())}
                    className="w-full font-mono text-xs sm:text-sm font-semibold tracking-wider bg-transparent focus:outline-none uppercase"
                  />
                </div>
              </div>

              <div className="flex items-baseline gap-2">
                <span className="font-semibold shrink-0">8. തദ്ദേശ സ്വയംഭരണ സ്ഥാപനം നൽകിയ രജിസ്ട്രേഷൻ നമ്പർ</span>
                <FormLineInput value={data.lsgdRegNo} onChange={(v) => update("lsgdRegNo", v)} />
              </div>
            </div>
          </div>

          <hr className="border-black my-2" />

          {/* Existing Rigs Summary Section */}
          <div className="space-y-2">
            <h3 className="font-bold underline text-center text-sm sm:text-base">
              ഏജൻസിയിൽ നിലവിൽ രജിസ്റ്റർ ചെയ്തിട്ടുള്ള റിഗ്ഗുകളുടെ വിവരങ്ങൾ
            </h3>

            {/* Rig-1 */}
            <div className="space-y-1">
              <div className="flex items-baseline gap-2">
                <span className="font-bold whitespace-nowrap shrink-0">Rig-1</span>
                <span className="font-semibold whitespace-nowrap shrink-0">1. റിഗ്ഗിന്റെ തരം</span>
                <FormLineInput value={data.rig1_type} onChange={(v) => update("rig1_type", v)} />
              </div>
              <p className="text-[10px] text-gray-700 italic pl-12">
                (റോട്ടറി റിഗ്ഗ്, റോട്ടറി കം.ഡിറ്റിഎച്ച് റിഗ്ഗ്, കാലിക്സ് റിഗ്ഗ്, ഫിൽട്ടർ പോയിന്റ് യൂണിറ്റ്)
              </p>

              <div className="flex items-baseline gap-2 pl-12">
                <span className="font-semibold whitespace-nowrap shrink-0">2. നിലവിലെ റെജിസ്ട്രേഷൻ നമ്പർ</span>
                <FormLineInput value={data.rig1_regNo} onChange={(v) => update("rig1_regNo", v)} />
              </div>

              <div className="flex items-baseline gap-2 pl-12">
                <span className="font-semibold whitespace-nowrap shrink-0">3. അവസാനമായി ഒടുക്കിയ തുക (ചലാന്റെ പകർപ്പ് ഉള്ളടക്കം ചെയ്യുക)</span>
                <FormLineInput value={data.rig1_last_paid_amount || data.rig1_paid_amount || ""} onChange={(v) => update("rig1_last_paid_amount", v)} width="w-32" />
              </div>

              <div className="flex items-baseline gap-2 pl-12">
                <span className="font-semibold whitespace-nowrap shrink-0">4. ചലാൻ നം. തീയതി</span>
                <FormLineInput value={data.rig1_challan_info || data.rig1_challan_no || ""} onChange={(v) => update("rig1_challan_info", v)} />
              </div>

              <div className="flex items-baseline gap-2 pl-12">
                <span className="font-semibold whitespace-nowrap shrink-0">5. റെജിസ്ട്രേഷൻ അവസാനിക്കുന്ന തിയതി</span>
                <FormDateInput value={data.rig1_expiryDate} onChange={(v) => update("rig1_expiryDate", v)} width="w-36" />
              </div>
            </div>

            {/* Rig-2 */}
            <div className="space-y-1 pt-1">
              <div className="flex items-baseline gap-2">
                <span className="font-bold whitespace-nowrap shrink-0">Rig-2</span>
                <span className="font-semibold whitespace-nowrap shrink-0">1. റിഗ്ഗിന്റെ തരം</span>
                <FormLineInput value={data.rig2_type} onChange={(v) => update("rig2_type", v)} />
              </div>
              <p className="text-[10px] text-gray-700 italic pl-12">
                (റോട്ടറി റിഗ്ഗ്, റോട്ടറി കം.ഡിറ്റിഎച്ച് റിഗ്ഗ്, കാലിക്സ് റിഗ്ഗ്, ഫിൽട്ടർ പോയിന്റ് യൂണിറ്റ്)
              </p>

              <div className="flex items-baseline gap-2 pl-12">
                <span className="font-semibold whitespace-nowrap shrink-0">2. നിലവിലെ റെജിസ്ട്രേഷൻ നമ്പർ</span>
                <FormLineInput value={data.rig2_regNo} onChange={(v) => update("rig2_regNo", v)} />
              </div>

              <div className="flex items-baseline gap-2 pl-12">
                <span className="font-semibold whitespace-nowrap shrink-0">3. അവസാനമായി ഒടുക്കിയ തുക (ചലാന്റെ പകർപ്പ് ഉള്ളടക്കം ചെയ്യുക)</span>
                <FormLineInput value={data.rig2_last_paid_amount || data.rig2_paid_amount || ""} onChange={(v) => update("rig2_last_paid_amount", v)} width="w-32" />
              </div>

              <div className="flex items-baseline gap-2 pl-12">
                <span className="font-semibold whitespace-nowrap shrink-0">4. ചലാൻ നം. തീയതി</span>
                <FormLineInput value={data.rig2_challan_info || data.rig2_challan_no || ""} onChange={(v) => update("rig2_challan_info", v)} />
              </div>

              <div className="flex items-baseline gap-2 pl-12">
                <span className="font-semibold whitespace-nowrap shrink-0">5. റെജിസ്ട്രേഷൻ അവസാനിക്കുന്ന തിയതി</span>
                <FormDateInput value={data.rig2_expiryDate} onChange={(v) => update("rig2_expiryDate", v)} width="w-36" />
              </div>
            </div>

            {/* Rig-3 */}
            <div className="space-y-1 pt-1">
              <div className="flex items-baseline gap-2">
                <span className="font-bold whitespace-nowrap shrink-0">Rig-3</span>
                <span className="font-semibold whitespace-nowrap shrink-0">1. റിഗ്ഗിന്റെ തരം</span>
                <FormLineInput value={data.rig3_type} onChange={(v) => update("rig3_type", v)} />
              </div>
              <p className="text-[10px] text-gray-700 italic pl-12">
                (റോട്ടറി റിഗ്ഗ്, റോട്ടറി കം.ഡിറ്റിഎച്ച് റിഗ്ഗ്, കാലിക്സ് റിഗ്ഗ്, ഫിൽട്ടർ പോയിന്റ് യൂണിറ്റ്)
              </p>

              <div className="flex items-baseline gap-2 pl-12">
                <span className="font-semibold whitespace-nowrap shrink-0">2. നിലവിലെ റെജിസ്ട്രേഷൻ നമ്പർ</span>
                <FormLineInput value={data.rig3_regNo} onChange={(v) => update("rig3_regNo", v)} />
              </div>

              <div className="flex items-baseline gap-2 pl-12">
                <span className="font-semibold whitespace-nowrap shrink-0">3. അവസാനമായി ഒടുക്കിയ തുക (ചലാന്റെ പകർപ്പ് ഉള്ളടക്കം ചെയ്യുക)</span>
                <FormLineInput value={data.rig3_last_paid_amount || data.rig3_paid_amount || ""} onChange={(v) => update("rig3_last_paid_amount", v)} width="w-32" />
              </div>

              <div className="flex items-baseline gap-2 pl-12">
                <span className="font-semibold whitespace-nowrap shrink-0">4. ചലാൻ നം. തീയതി</span>
                <FormLineInput value={data.rig3_challan_info || data.rig3_challan_no || ""} onChange={(v) => update("rig3_challan_info", v)} />
              </div>

              <div className="flex items-baseline gap-2 pl-12">
                <span className="font-semibold whitespace-nowrap shrink-0">5. റെജിസ്ട്രേഷൻ അവസാനിക്കുന്ന തിയതി</span>
                <FormDateInput value={data.rig3_expiryDate} onChange={(v) => update("rig3_expiryDate", v)} width="w-36" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* PAGE 2: RIG-1 DETAIL SHEET (A RIG-1)                                      */}
      {/* ========================================================================= */}
      <RigRenewalDetailSheet
        letter="A"
        rigKey="rig1"
        rigTitle="RIG-1"
        pageNumber={2}
        data={data}
        update={update}
      />

      {/* ========================================================================= */}
      {/* PAGE 3: RIG-2 DETAIL SHEET (B RIG-2)                                      */}
      {/* ========================================================================= */}
      <RigRenewalDetailSheet
        letter="B"
        rigKey="rig2"
        rigTitle="RIG-2"
        pageNumber={3}
        data={data}
        update={update}
      />

      {/* ========================================================================= */}
      {/* PAGE 4: RIG-3 DETAIL SHEET (C RIG-3)                                      */}
      {/* ========================================================================= */}
      <RigRenewalDetailSheet
        letter="C"
        rigKey="rig3"
        rigTitle="RIG-3"
        pageNumber={4}
        data={data}
        update={update}
      />

      {/* ========================================================================= */}
      {/* PAGE 5: DECLARATION, OFFICE USE ONLY & OFFICIAL RECEIPT (രസീത്)           */}
      {/* ========================================================================= */}
      <div className="official-form-page bg-white p-6 sm:p-10 border border-gray-300 shadow-md relative box-border min-h-[270mm] flex flex-col justify-between">
        <div className="print-page-badge absolute top-3 right-4 text-[10px] text-gray-500 font-sans bg-gray-100 px-2 py-0.5 rounded border print:hidden">
          പേജ് 5 / 5
        </div>

        <div className="space-y-6">
          {/* Satyaprashthavana (Declaration) */}
          <div className="space-y-3 text-center">
            <h3 className="font-bold underline text-sm sm:text-base">സത്യപ്രസ്താവന</h3>
            <p className="text-justify indent-8 text-xs sm:text-sm font-normal">
              മേൽ നൽകിയിട്ടുള്ള വിവരങ്ങൾ എന്റെ അറിവിലും വിശ്വാസത്തിലും കൃത്യവും സത്യസന്ധവുമാണെന്ന് സാക്ഷ്യപ്പെടുത്തുന്നു.
            </p>

            <div className="flex justify-between items-end pt-4 px-4">
              <div className="space-y-2 text-left">
                <div className="flex items-baseline gap-2">
                  <span className="font-semibold whitespace-nowrap">തീയതി :</span>
                  <FormDateInput value={data.date} onChange={(v) => update("date", v)} />
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="font-semibold whitespace-nowrap">സ്ഥലം :</span>
                  <FormLineInput value={data.place} onChange={(v) => update("place", v)} width="w-36" />
                </div>
              </div>
              <div className="text-center font-bold pb-1 pr-4">
                <span>അപേക്ഷകന്റെ ഒപ്പും പേരും</span>
              </div>
            </div>
          </div>

          <hr className="border-black my-4" />

          {/* Office Use Only */}
          <div className="space-y-3">
            <h3 className="font-bold underline text-center text-sm sm:text-base">
              ഓഫീസ് ഉപയോഗത്തിന് മാത്രം
            </h3>

            <div className="space-y-2.5 pt-1 pl-2">
              <div className="flex items-baseline gap-2">
                <span className="font-semibold whitespace-nowrap shrink-0">1. അപേക്ഷ ലഭിച്ച തീയതി :</span>
                <FormDateInput value={data.office_date_recd} onChange={(v) => update("office_date_recd", v)} width="w-36" />
              </div>

              <div className="space-y-1">
                <span className="font-semibold block">2. അപേക്ഷാ ഫീസ് അടച്ച വിവരങ്ങൾ</span>
                <div className="grid grid-cols-2 gap-6 items-baseline pl-4">
                  <div className="flex items-baseline gap-1">
                    <span className="font-semibold whitespace-nowrap shrink-0">അടച്ച തുക :</span>
                    <FormLineInput value={data.office_fee_amount || data.office_paid_amount || ""} onChange={(v) => update("office_fee_amount", v)} width="w-32 text-center" />
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="font-semibold whitespace-nowrap shrink-0">തിയതി :</span>
                    <FormDateInput value={data.office_fee_date} onChange={(v) => update("office_fee_date", v)} width="w-32" />
                  </div>
                </div>
              </div>

              <div className="flex items-baseline gap-2">
                <span className="font-semibold whitespace-nowrap shrink-0">3. റിഗ്ഗ് പരിശോധിച്ച തീയതി :</span>
                <FormDateInput value={data.office_rig_inspected_date} onChange={(v) => update("office_rig_inspected_date", v)} width="w-36" />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-baseline gap-2">
                  <span className="font-semibold whitespace-nowrap shrink-0">4. പരിശോധകന്റെ ശുപാർശ :</span>
                  <FormLineInput value={data.office_recommendation} onChange={(v) => update("office_recommendation", v)} />
                </div>
                <FormLineInput value={data.office_recommendation_line2 || ""} onChange={(v) => update("office_recommendation_line2", v)} />
                <FormLineInput value={data.office_recommendation_line3 || ""} onChange={(v) => update("office_recommendation_line3", v)} />
              </div>

              <div className="flex justify-between items-end pt-10 px-4">
                <div className="text-center font-bold">
                  <p>പരിശോധകന്റെ ഒപ്പ്</p>
                </div>
                <div className="text-center font-bold">
                  <p>ജില്ലാ ഓഫീസറുടെ ഒപ്പ്</p>
                </div>
              </div>
            </div>
          </div>

          {/* Dotted Perforation Line */}
          <div className="border-t-2 border-dashed border-black my-6"></div>

          {/* Official Receipt (രസീത്) */}
          <div className="space-y-3">
            <div className="flex justify-center">
              <div className="border border-black rounded-full px-6 py-0.5 font-bold text-sm bg-white">
                രസീത്
              </div>
            </div>

            <div className="space-y-2 pl-2">
              <div className="flex items-baseline gap-2">
                <span className="font-semibold whitespace-nowrap shrink-0">1. അപേക്ഷാ നമ്പർ :</span>
                <FormLineInput value={data.receipt_app_no} onChange={(v) => update("receipt_app_no", v)} width="w-64" />
              </div>

              <div className="flex items-baseline gap-2">
                <span className="font-semibold whitespace-nowrap shrink-0">2. ഏജൻസിയുടെ പേര്</span>
                <FormLineInput value={data.receipt_agency_name || data.agencyName} onChange={(v) => update("receipt_agency_name", v)} />
              </div>

              <div className="flex items-baseline gap-2">
                <span className="font-semibold whitespace-nowrap shrink-0">3. ഏജൻസി റെജിസ്ട്രേഷൻ നമ്പർ :</span>
                <FormLineInput value={data.receipt_agency_reg_no || data.agency_reg_no} onChange={(v) => update("receipt_agency_reg_no", v)} width="w-64" />
              </div>

              <div className="flex items-baseline gap-2">
                <span className="font-semibold whitespace-nowrap shrink-0">4. അപേക്ഷ ലഭിച്ച തീയതി :</span>
                <FormDateInput value={data.receipt_date_recd} onChange={(v) => update("receipt_date_recd", v)} width="w-36" />
              </div>

              <div className="space-y-1">
                <div className="flex items-baseline gap-2">
                  <span className="font-semibold whitespace-nowrap shrink-0">5. അപേക്ഷാ ഫീസ് അടച്ച വിവരങ്ങൾ :</span>
                </div>
                <div className="grid grid-cols-2 gap-6 items-baseline pl-4">
                  <div className="flex items-baseline gap-1">
                    <span className="font-semibold whitespace-nowrap shrink-0">അടച്ച തുക :</span>
                    <FormLineInput value={data.receipt_fee_paid_amount} onChange={(v) => update("receipt_fee_paid_amount", v)} width="w-32 text-center" />
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="font-semibold whitespace-nowrap shrink-0">തിയതി :</span>
                    <FormDateInput value={data.receipt_fee_paid_date} onChange={(v) => update("receipt_fee_paid_date", v)} width="w-32" />
                  </div>
                </div>
              </div>

              <div className="space-y-2 pt-2">
                <span className="font-semibold block">6. അപേക്ഷാ വിവരങ്ങൾ</span>
                <div className="space-y-2 pl-4">
                  <div className="flex items-center gap-3">
                    <span className="font-medium text-xs sm:text-sm">
                      1. റിഗ്ഗ് രജിസ്ട്രേഷൻ പുതുക്കൽ ( നിലവിൽ റെജിസ്ട്രേഷൻ സാധുവായിട്ടുള്ളത്)
                    </span>
                    <SquareCheckbox
                      checked={!!data.receipt_renewal_check}
                      onChange={(c) => update("receipt_renewal_check", c)}
                    />
                    <span className="font-medium text-xs sm:text-sm">എണ്ണം</span>
                    <FormLineInput value={data.receipt_renewal_count} onChange={(v) => update("receipt_renewal_count", v)} width="w-12 text-center" />
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-medium text-xs sm:text-sm">
                      2. പുതിയ റിഗ്ഗ് രജിസ്ട്രേഷൻ/രജിസ്റ്റർ ചെയ്ത റിഗ്ഗ് മാറ്റുന്നതിന്
                    </span>
                    <SquareCheckbox
                      checked={!!data.receipt_new_rig_check}
                      onChange={(c) => update("receipt_new_rig_check", c)}
                    />
                    <span className="font-medium text-xs sm:text-sm">എണ്ണം</span>
                    <FormLineInput value={data.receipt_new_rig_count} onChange={(v) => update("receipt_new_rig_count", v)} width="w-12 text-center" />
                  </div>
                </div>
              </div>

              <div className="flex justify-between items-end pt-10 px-4">
                <div className="flex items-baseline gap-2">
                  <span className="font-semibold whitespace-nowrap">തിയതി :</span>
                  <FormDateInput value={data.receipt_date || data.date} onChange={(v) => update("receipt_date", v)} width="w-32" />
                </div>
                <div className="text-center font-bold">
                  <p>ജില്ലാ ഓഫീസർ</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
