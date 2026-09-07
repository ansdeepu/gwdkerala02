"use client";

import React from "react";
import {
  PinCodeGrid,
  PanGrid,
  PhotoBox,
  FormLineInput,
  FormDateInput,
} from "./FormInputComponents";

interface FormProps {
  data: Record<string, any>;
  update: (k: string, v: any) => void;
}

// Single Rig Page Component (Used for Rig 1 on Page 2, Rig 2 on Page 3, Rig 3 on Page 4)
function RenewalRigSection({
  rigKey,
  rigNumber,
  data,
  update,
}: {
  rigKey: "rig1" | "rig2" | "rig3";
  rigNumber: number;
  data: Record<string, any>;
  update: (k: string, v: any) => void;
}) {
  return (
    <div className="border border-black p-2.5 sm:p-3 pt-3 space-y-2 relative min-w-0 mt-3 overflow-visible">
      <span className="absolute -top-3 left-3 bg-white px-2 py-0.5 font-bold border border-black text-xs z-10">
        റിഗ് {rigNumber}
      </span>

      <div className="space-y-1.5 pt-1 min-w-0">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 items-baseline pl-2 min-w-0">
          <div className="flex flex-wrap sm:flex-nowrap items-baseline gap-1 min-w-0">
            <span className="font-bold shrink">
              1. നിലവിലെ രജിസ്ട്രേഷൻ നമ്പർ <span className="font-normal text-[10px]">(പുതുക്കുന്നതിന്)</span> :
            </span>
            <FormLineInput value={data[`${rigKey}_regNo`]} onChange={(v) => update(`${rigKey}_regNo`, v)} />
          </div>

          <div className="flex flex-wrap sm:flex-nowrap items-baseline gap-1 min-w-0">
            <span className="font-bold shrink">
              2. അവസാനിക്കുന്ന തീയതി <span className="font-normal text-[10px]">(പുതുക്കുന്നതിന്)</span> :
            </span>
            <FormDateInput value={data[`${rigKey}_expiryDate`]} onChange={(v) => update(`${rigKey}_expiryDate`, v)} />
          </div>
        </div>

        <div className="flex flex-wrap sm:flex-nowrap items-baseline gap-2 pl-2 min-w-0">
          <span className="font-bold whitespace-nowrap shrink-0">3. റിഗ്ഗിന്റെ തരം :</span>
          <FormLineInput value={data[`${rigKey}_type`]} onChange={(v) => update(`${rigKey}_type`, v)} />
        </div>
        <p className="text-[10px] text-gray-600 italic pl-4 sm:pl-6">
          (റോട്ടറി റിഗ്, റോട്ടറി കം.ഡി.റ്റി.എച്ച് റിഗ്, ക്യാലിക്സ് റിഗ്, ഫിൽട്ടർ പോയിന്റ് യൂണിറ്റ്)
        </p>

        <div className="flex flex-wrap sm:flex-nowrap items-baseline gap-2 pl-2 min-w-0">
          <span className="font-bold whitespace-nowrap shrink-0">4. റിഗ് ഉടമസ്ഥന്റെ പേര് :</span>
          <FormLineInput value={data[`${rigKey}_ownerName`]} onChange={(v) => update(`${rigKey}_ownerName`, v)} />
        </div>

        <div className="flex flex-wrap sm:flex-nowrap items-baseline gap-2 min-w-0">
          <span className="font-bold whitespace-nowrap shrink-0">മേൽവിലാസം :</span>
          <FormLineInput value={data[`${rigKey}_address`]} onChange={(v) => update(`${rigKey}_address`, v)} />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 items-baseline pl-2 sm:pl-4 min-w-0">
          <div className="flex items-baseline gap-1 min-w-0">
            <span className="font-semibold text-xs whitespace-nowrap shrink-0">വില്ലേജ് :</span>
            <FormLineInput value={data[`${rigKey}_village`]} onChange={(v) => update(`${rigKey}_village`, v)} />
          </div>
          <div className="flex items-baseline gap-1 min-w-0">
            <span className="font-semibold text-xs whitespace-nowrap shrink-0">താലൂക്ക് :</span>
            <FormLineInput value={data[`${rigKey}_taluk`]} onChange={(v) => update(`${rigKey}_taluk`, v)} />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 items-baseline pl-2 sm:pl-4 min-w-0">
          <div className="flex items-baseline gap-1 min-w-0">
            <span className="font-bold whitespace-nowrap shrink-0">ജില്ല :</span>
            <FormLineInput value={data[`${rigKey}_district`]} onChange={(v) => update(`${rigKey}_district`, v)} />
          </div>
          <div className="flex items-baseline gap-1 min-w-0">
            <span className="font-bold whitespace-nowrap shrink-0">സംസ്ഥാനം :</span>
            <FormLineInput value={data[`${rigKey}_state`]} onChange={(v) => update(`${rigKey}_state`, v)} />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 pl-2 sm:pl-4 min-w-0">
          <span className="font-bold shrink-0">പിൻ കോഡ് :</span>
          <PinCodeGrid value={data[`${rigKey}_pincode`]} onChange={(v) => update(`${rigKey}_pincode`, v)} />
        </div>

        <div className="space-y-1 pt-1 min-w-0">
          <span className="font-bold block">5. ഉപയോഗിക്കുന്ന വാഹനത്തിന്റെ വിവരം</span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pl-2 sm:pl-4 min-w-0">
            <div className="flex items-baseline gap-1 min-w-0">
              <span className="font-semibold whitespace-nowrap shrink-0">എ. തരം :</span>
              <FormLineInput value={data[`${rigKey}_veh_type`]} onChange={(v) => update(`${rigKey}_veh_type`, v)} />
            </div>
            <div className="flex items-baseline gap-1 min-w-0">
              <span className="font-semibold whitespace-nowrap shrink-0">ബി. രജി. നമ്പർ :</span>
              <FormLineInput value={data[`${rigKey}_veh_reg`]} onChange={(v) => update(`${rigKey}_veh_reg`, v)} />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pl-2 sm:pl-4 min-w-0">
            <div className="flex items-baseline gap-1 min-w-0">
              <span className="font-semibold whitespace-nowrap shrink-0">സി. ചേസിസ് നമ്പർ :</span>
              <FormLineInput value={data[`${rigKey}_veh_chassis`]} onChange={(v) => update(`${rigKey}_veh_chassis`, v)} />
            </div>
            <div className="flex items-baseline gap-1 min-w-0">
              <span className="font-semibold whitespace-nowrap shrink-0">ഡി. എൻജിൻ നമ്പർ :</span>
              <FormLineInput value={data[`${rigKey}_veh_engine`]} onChange={(v) => update(`${rigKey}_veh_engine`, v)} />
            </div>
          </div>
        </div>

        <div className="space-y-1 pt-1 min-w-0">
          <span className="font-bold block">
            6. കംപ്രസറിന്റെ വിവരം <span className="font-normal text-xs">(ഡിറ്റിഎച്ച് / റോട്ടറി കം.ഡിറ്റിഎച്ച് / ഫിൽട്ടർ പോയിന്റ് )</span>
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pl-2 sm:pl-4 min-w-0">
            <div className="flex items-baseline gap-1 min-w-0">
              <span className="font-semibold whitespace-nowrap shrink-0">എ. മോഡൽ :</span>
              <FormLineInput value={data[`${rigKey}_comp_model`]} onChange={(v) => update(`${rigKey}_comp_model`, v)} />
            </div>
            <div className="flex items-baseline gap-1 min-w-0">
              <span className="font-semibold whitespace-nowrap shrink-0">ബി. കപ്പാസിറ്റി :</span>
              <FormLineInput value={data[`${rigKey}_comp_cap`]} onChange={(v) => update(`${rigKey}_comp_cap`, v)} />
            </div>
          </div>
        </div>

        <div className="space-y-1 pt-1 min-w-0">
          <span className="font-bold block">
            7. ജനറേറ്ററിന്റെ വിവരം <span className="font-normal text-xs">(ക്യാലിക്സ് റിഗ്)</span>
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pl-2 sm:pl-4 min-w-0">
            <div className="flex items-baseline gap-1 min-w-0">
              <span className="font-semibold whitespace-nowrap shrink-0">എ. തരം :</span>
              <FormLineInput value={data[`${rigKey}_gen_type`]} onChange={(v) => update(`${rigKey}_gen_type`, v)} />
            </div>
            <div className="flex items-baseline gap-1 min-w-0">
              <span className="font-semibold whitespace-nowrap shrink-0">ബി. മോഡൽ :</span>
              <FormLineInput value={data[`${rigKey}_gen_model`]} onChange={(v) => update(`${rigKey}_gen_model`, v)} />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pl-2 sm:pl-4 min-w-0">
            <div className="flex items-baseline gap-1 min-w-0">
              <span className="font-semibold whitespace-nowrap shrink-0">സി. കപ്പാസിറ്റി :</span>
              <FormLineInput value={data[`${rigKey}_gen_cap`]} onChange={(v) => update(`${rigKey}_gen_cap`, v)} />
            </div>
            <div className="flex items-baseline gap-1 min-w-0">
              <span className="font-semibold whitespace-nowrap shrink-0">ഡി. എൻജിൻ നമ്പർ :</span>
              <FormLineInput value={data[`${rigKey}_gen_engine`]} onChange={(v) => update(`${rigKey}_gen_engine`, v)} />
            </div>
          </div>
        </div>

        <div className="space-y-1 pt-1 min-w-0">
          <span className="font-bold block">
            8. കുഴിക്കാൻ സാധിക്കുന്ന കിണറിന്റെ സ്പെസിഫിക്കേഷൻ{" "}
            <span className="font-normal text-xs">(കംപ്രസ്സർ കപ്പാസിറ്റിയുടെ അടിസ്ഥാനത്തിൽ)</span>
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pl-2 sm:pl-4 min-w-0">
            <div className="flex items-baseline gap-1 min-w-0">
              <span className="font-semibold whitespace-nowrap shrink-0">എ. പരമാവധി ആഴം :</span>
              <FormLineInput value={data[`${rigKey}_well_depth`]} onChange={(v) => update(`${rigKey}_well_depth`, v)} />
            </div>
            <div className="flex items-baseline gap-1 min-w-0">
              <span className="font-semibold whitespace-nowrap shrink-0">ബി. പരമാവധി വ്യാസം :</span>
              <FormLineInput value={data[`${rigKey}_well_dia`]} onChange={(v) => update(`${rigKey}_well_dia`, v)} />
            </div>
          </div>
        </div>

        <div className="space-y-1 pt-1 min-w-0">
          <span className="font-bold block">9. ഡ്രില്ലിംഗ് യന്ത്ര ഓപ്പറേറ്ററുടെ വിവരങ്ങൾ</span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pl-2 sm:pl-4 min-w-0">
            <div className="flex items-baseline gap-1 min-w-0">
              <span className="font-semibold whitespace-nowrap shrink-0">പേര് :</span>
              <FormLineInput value={data[`${rigKey}_op_name`]} onChange={(v) => update(`${rigKey}_op_name`, v)} />
            </div>
            <div className="flex items-baseline gap-1 min-w-0">
              <span className="font-semibold whitespace-nowrap shrink-0">വയസ്സ് :</span>
              <FormLineInput value={data[`${rigKey}_op_age`]} onChange={(v) => update(`${rigKey}_op_age`, v)} width="w-20" />
            </div>
          </div>
          <div className="flex flex-wrap sm:flex-nowrap items-baseline gap-2 pl-2 sm:pl-4 min-w-0">
            <span className="font-semibold whitespace-nowrap shrink-0">പ്രവർത്തി പരിചയം :</span>
            <FormLineInput value={data[`${rigKey}_op_exp`]} onChange={(v) => update(`${rigKey}_op_exp`, v)} />
          </div>
          <div className="flex flex-wrap items-center gap-2 sm:gap-4 pl-2 sm:pl-4 min-w-0">
            <span className="font-semibold whitespace-nowrap shrink-0">തിരിച്ചറിയൽ രേഖ :</span>
            <label className="flex items-center gap-1 cursor-pointer shrink-0">
              <input
                type="radio"
                name={`${rigKey}_op_id_type`}
                checked={data[`${rigKey}_op_id_type`] === "Election"}
                onChange={() => update(`${rigKey}_op_id_type`, "Election")}
                className="border-black"
              />
              <span className="border border-black px-2 py-0.5 text-xs font-semibold">ഇലക്ഷൻ കാർഡ്</span>
            </label>
            <label className="flex items-center gap-1 cursor-pointer shrink-0">
              <input
                type="radio"
                name={`${rigKey}_op_id_type`}
                checked={data[`${rigKey}_op_id_type`] === "Aadhaar"}
                onChange={() => update(`${rigKey}_op_id_type`, "Aadhaar")}
                className="border-black"
              />
              <span className="border border-black px-2 py-0.5 text-xs font-semibold">ആധാർ കാർഡ്</span>
            </label>
          </div>
          <div className="flex flex-wrap sm:flex-nowrap items-baseline gap-2 pl-2 sm:pl-4 min-w-0">
            <span className="font-semibold whitespace-nowrap shrink-0">തിരിച്ചറിയൽ രേഖയുടെ നമ്പർ :</span>
            <FormLineInput value={data[`${rigKey}_op_id_no`]} onChange={(v) => update(`${rigKey}_op_id_no`, v)} />
          </div>
        </div>
      </div>
    </div>
  );
}

// 5-PAGE RIG RENEWAL SHEETS
export function RigRenewalPages({ data, update }: FormProps) {
  return (
    <>
      {/* ==================================================== */}
      {/* PAGE 1: HEADER, SECTION 1, AND SECTION 2 (OWNER)     */}
      {/* ==================================================== */}
      <div className="official-form-page bg-white p-5 sm:p-8 border border-gray-300 shadow-md text-black space-y-3 text-xs sm:text-sm font-serif print:border-none print:shadow-none print:p-0 print:max-w-none box-border relative mb-6 print:mb-0">
        <div className="print-page-badge absolute top-2 right-3 text-[10px] text-gray-500 font-sans font-medium bg-gray-100 px-2 py-0.5 rounded border print:hidden">
          പേജ് 1 / 5
        </div>

        {/* Header */}
        <div className="text-center space-y-1 border-b-2 border-black pb-2.5">
          <h1 className="text-lg sm:text-xl font-bold tracking-wide">കേരള സർക്കാർ ഭൂജല അതോറിറ്റി</h1>
          <p className="text-xs font-medium">(കേരള സർക്കാരിന്റെ 2002 ലെ ആക്ട് 19 പ്രകാരം നിലവിൽ വന്നത്)</p>
          <p className="text-[10px] font-mono text-gray-800">
            (Order No.G.O.(MS)No.04/2023/WRD Dated 24.01.2023 & Order No.DGWD/306/2022/T4 Dated 21.03.2023)
          </p>
          <div className="pt-1.5">
            <div className="inline-block border-2 border-black px-4 py-1 font-bold text-sm sm:text-base bg-gray-50">
              ഡ്രില്ലിംഗ് ഏജൻസി/സ്ഥാപനവും ഡ്രില്ലിംഗ് റിഗ്ഗും രജിസ്ട്രേഷൻ പുതുക്കുന്നതിനുള്ള അപേക്ഷാ ഫോറം
            </div>
          </div>
        </div>

        {/* Section 1 */}
        <div className="space-y-2 min-w-0">
          <h2 className="font-bold text-sm sm:text-base underline">1. സ്ഥാപനം / ഏജൻസിയുടെ വിവരങ്ങൾ</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 items-baseline pl-1 min-w-0">
            <div className="flex flex-wrap sm:flex-nowrap items-baseline gap-1 min-w-0">
              <span className="font-bold shrink">
                1. നിലവിലെ രജിസ്ട്രേഷൻ നമ്പർ <span className="font-normal text-[10px]">(പുതുക്കുന്നതിന്)</span> :
              </span>
              <FormLineInput value={data.agency_reg_no} onChange={(v) => update("agency_reg_no", v)} />
            </div>
            <div className="flex flex-wrap sm:flex-nowrap items-baseline gap-1 min-w-0">
              <span className="font-bold shrink">
                2. അവസാനിക്കുന്ന തീയതി <span className="font-normal text-[10px]">(പുതുക്കുന്നതിന്)</span> :
              </span>
              <FormLineInput value={data.agency_reg_expiry} onChange={(v) => update("agency_reg_expiry", v)} />
            </div>
          </div>

          <div className="space-y-1.5 pl-1 min-w-0">
            <div className="flex flex-wrap sm:flex-nowrap items-baseline gap-2 min-w-0">
              <span className="font-bold whitespace-nowrap shrink-0">എ. ഏജൻസിയുടെ പേര് :</span>
              <FormLineInput value={data.agencyName} onChange={(v) => update("agencyName", v)} />
            </div>

            <div className="space-y-1 min-w-0">
              <div className="flex flex-wrap sm:flex-nowrap items-baseline gap-2 min-w-0">
                <span className="font-bold whitespace-nowrap shrink-0">ബി. മേൽവിലാസം :</span>
                <FormLineInput value={data.address} onChange={(v) => update("address", v)} />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 items-baseline pl-2 sm:pl-4 min-w-0">
                <div className="flex items-baseline gap-1 min-w-0">
                  <span className="font-semibold whitespace-nowrap shrink-0">വില്ലേജ് :</span>
                  <FormLineInput value={data.village} onChange={(v) => update("village", v)} />
                </div>
                <div className="flex items-baseline gap-1 min-w-0">
                  <span className="font-semibold whitespace-nowrap shrink-0">താലൂക്ക് :</span>
                  <FormLineInput value={data.taluk} onChange={(v) => update("taluk", v)} />
                </div>
              </div>

              <div className="flex flex-wrap sm:flex-nowrap items-baseline gap-2 pl-2 sm:pl-4 min-w-0">
                <span className="font-semibold shrink sm:whitespace-nowrap">കോർപ്പറേഷൻ / മുനിസിപ്പാലിറ്റി / പഞ്ചായത്ത് :</span>
                <FormLineInput value={data.panchayath} onChange={(v) => update("panchayath", v)} />
              </div>

              <div className="flex flex-wrap sm:flex-nowrap items-baseline gap-2 pl-2 sm:pl-4 min-w-0">
                <span className="font-semibold whitespace-nowrap shrink-0">ജില്ല :</span>
                <FormLineInput value={data.district} onChange={(v) => update("district", v)} />
              </div>

              <div className="flex flex-wrap items-center gap-2 pl-2 sm:pl-4 min-w-0">
                <span className="font-bold shrink-0">പിൻ കോഡ് :</span>
                <PinCodeGrid value={data.pincode} onChange={(v) => update("pincode", v)} />
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 min-w-0">
              <span className="font-bold whitespace-nowrap shrink-0">സി. ജി.എസ്.റ്റി. നമ്പർ :</span>
              <div className="border border-black bg-white inline-block">
                <input
                  type="text"
                  value={data.gstin || ""}
                  onChange={(e) => update("gstin", e.target.value.toUpperCase())}
                  className="px-2 py-0.5 font-mono text-xs sm:text-sm font-semibold tracking-wider w-44 sm:w-56 focus:outline-none bg-transparent"
                />
              </div>
            </div>

            <div className="flex flex-wrap sm:flex-nowrap items-baseline gap-2 min-w-0">
              <span className="font-bold shrink">
                ഡി. തദ്ദേശ സ്വയംഭരണ സ്ഥാപനം നൽകിയ രജിസ്ട്രേഷൻ നമ്പർ :
              </span>
              <div className="border border-black bg-white inline-block">
                <input
                  type="text"
                  value={data.lsgdRegNo || ""}
                  onChange={(e) => update("lsgdRegNo", e.target.value)}
                  className="px-2 py-0.5 font-mono text-xs sm:text-sm font-semibold w-36 sm:w-48 focus:outline-none bg-transparent"
                />
              </div>
            </div>
          </div>
        </div>

        <hr className="border-black my-2" />

        {/* Section 2: Owner */}
        <div className="space-y-2 min-w-0">
          <h2 className="font-bold text-sm sm:text-base underline">
            2. സ്ഥാപനം / ഏജൻസി നടത്തിപ്പുകാരുടെ വിവരം
          </h2>

          <div className="border border-black p-2.5 sm:p-3 pt-3 space-y-2 relative min-w-0 overflow-visible">
            <span className="absolute -top-2.5 left-3 bg-white px-2 py-0.5 font-bold border border-black text-xs z-10">
              എ.
            </span>

            <div className="flex flex-col sm:flex-row gap-2 min-w-0">
              <div className="flex-1 space-y-1.5 min-w-0">
                <div className="flex flex-wrap sm:flex-nowrap items-baseline gap-2 pt-0.5 min-w-0">
                  <span className="font-bold whitespace-nowrap shrink-0">1. പേര് :</span>
                  <FormLineInput value={data.owner_name} onChange={(v) => update("owner_name", v)} />
                </div>

                <div className="flex flex-wrap sm:flex-nowrap items-baseline gap-2 min-w-0">
                  <span className="font-bold whitespace-nowrap shrink-0">2. നിലവിലെ മേൽവിലാസം :</span>
                  <FormLineInput value={data.owner_curr_address} onChange={(v) => update("owner_curr_address", v)} />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 items-baseline pl-2 min-w-0">
                  <div className="flex items-baseline gap-1 min-w-0">
                    <span className="font-semibold text-xs whitespace-nowrap shrink-0">വില്ലേജ് :</span>
                    <FormLineInput value={data.owner_curr_village} onChange={(v) => update("owner_curr_village", v)} />
                  </div>
                  <div className="flex items-baseline gap-1 min-w-0">
                    <span className="font-semibold text-xs whitespace-nowrap shrink-0">താലൂക്ക് :</span>
                    <FormLineInput value={data.owner_curr_taluk} onChange={(v) => update("owner_curr_taluk", v)} />
                  </div>
                </div>

                <div className="flex flex-wrap sm:flex-nowrap items-baseline gap-2 pl-2 min-w-0">
                  <span className="font-semibold text-xs shrink sm:whitespace-nowrap">പഞ്ചായത്ത് :</span>
                  <FormLineInput value={data.owner_curr_panchayath} onChange={(v) => update("owner_curr_panchayath", v)} />
                </div>

                <div className="flex flex-wrap sm:flex-nowrap items-baseline gap-2 pl-2 min-w-0">
                  <span className="font-semibold text-xs whitespace-nowrap shrink-0">ജില്ല :</span>
                  <FormLineInput value={data.owner_curr_district} onChange={(v) => update("owner_curr_district", v)} />
                </div>

                <div className="flex flex-wrap items-center gap-2 pl-2 min-w-0">
                  <span className="font-semibold text-xs shrink-0">പിൻ കോഡ് :</span>
                  <PinCodeGrid value={data.owner_curr_pincode} onChange={(v) => update("owner_curr_pincode", v)} />
                </div>
              </div>

              <PhotoBox photoUrl={data.owner_curr_photo} onPhotoChange={(url) => update("owner_curr_photo", url)} />
            </div>

            {/* Permanent */}
            <div className="space-y-1.5 pt-1.5 border-t border-dashed border-gray-400 min-w-0">
              <div className="flex flex-wrap sm:flex-nowrap items-baseline gap-2 min-w-0">
                <span className="font-bold whitespace-nowrap shrink-0">3. സ്ഥിരം മേൽവിലാസം :</span>
                <FormLineInput value={data.owner_perm_address} onChange={(v) => update("owner_perm_address", v)} />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 items-baseline pl-2 min-w-0">
                <div className="flex items-baseline gap-1 min-w-0">
                  <span className="font-semibold text-xs whitespace-nowrap shrink-0">വില്ലേജ് :</span>
                  <FormLineInput value={data.owner_perm_village} onChange={(v) => update("owner_perm_village", v)} />
                </div>
                <div className="flex items-baseline gap-1 min-w-0">
                  <span className="font-semibold text-xs whitespace-nowrap shrink-0">താലൂക്ക് :</span>
                  <FormLineInput value={data.owner_perm_taluk} onChange={(v) => update("owner_perm_taluk", v)} />
                </div>
              </div>

              <div className="flex flex-wrap sm:flex-nowrap items-baseline gap-2 pl-2 min-w-0">
                <span className="font-semibold text-xs shrink sm:whitespace-nowrap">പഞ്ചായത്ത് :</span>
                <FormLineInput value={data.owner_perm_panchayath} onChange={(v) => update("owner_perm_panchayath", v)} />
              </div>

              <div className="flex flex-wrap sm:flex-nowrap items-baseline gap-2 pl-2 min-w-0">
                <span className="font-semibold text-xs whitespace-nowrap shrink-0">ജില്ല :</span>
                <FormLineInput value={data.owner_perm_district} onChange={(v) => update("owner_perm_district", v)} />
              </div>

              <div className="flex flex-wrap items-center gap-2 pl-2 min-w-0">
                <span className="font-semibold text-xs shrink-0">പിൻ കോഡ് :</span>
                <PinCodeGrid value={data.owner_perm_pincode} onChange={(v) => update("owner_perm_pincode", v)} />
              </div>
            </div>

            {/* ID, PAN, Exp, Nominee */}
            <div className="space-y-1.5 pt-1.5 border-t border-dashed border-gray-400 min-w-0">
              <div className="flex flex-wrap items-center gap-2 sm:gap-4 min-w-0">
                <span className="font-bold whitespace-nowrap shrink-0">4. തിരിച്ചറിയൽരേഖ :</span>
                <label className="flex items-center gap-1 cursor-pointer shrink-0">
                  <input
                    type="radio"
                    name="owner_id_type"
                    checked={data.owner_id_type === "Election"}
                    onChange={() => update("owner_id_type", "Election")}
                    className="border-black"
                  />
                  <span className="border border-black px-2 py-0.5 font-semibold text-xs">ഇലക്ഷൻ കാർഡ്</span>
                </label>
                <label className="flex items-center gap-1 cursor-pointer shrink-0">
                  <input
                    type="radio"
                    name="owner_id_type"
                    checked={data.owner_id_type === "Aadhaar"}
                    onChange={() => update("owner_id_type", "Aadhaar")}
                    className="border-black"
                  />
                  <span className="border border-black px-2 py-0.5 font-semibold text-xs">ആധാർ കാർഡ്</span>
                </label>
              </div>

              <div className="flex flex-wrap sm:flex-nowrap items-baseline gap-2 min-w-0">
                <span className="font-bold whitespace-nowrap shrink-0">5. തിരിച്ചറിയൽ രേഖയുടെ നമ്പർ :</span>
                <FormLineInput value={data.owner_id_no} onChange={(v) => update("owner_id_no", v)} />
              </div>

              <div className="flex flex-wrap items-center gap-2 sm:gap-3 min-w-0">
                <span className="font-bold whitespace-nowrap shrink-0">6. പാൻ നമ്പർ :</span>
                <PanGrid value={data.owner_pan} onChange={(v) => update("owner_pan", v)} />
              </div>

              <div className="flex flex-wrap sm:flex-nowrap items-baseline gap-2 min-w-0">
                <span className="font-bold shrink">
                  7. കേരളത്തിലെ കുഴൽ കിണർ നിർമ്മാണ മേഖലയിലെ പ്രവർത്തിപരിചയം :
                </span>
                <FormLineInput value={data.owner_exp} onChange={(v) => update("owner_exp", v)} width="w-20" />
                <span className="font-bold">വർഷം</span>
              </div>

              <div className="flex flex-wrap sm:flex-nowrap items-baseline gap-2 min-w-0">
                <span className="font-bold whitespace-nowrap shrink-0">8. നോമിനി :</span>
                <FormLineInput value={data.owner_nominee} onChange={(v) => update("owner_nominee", v)} />
              </div>
            </div>
          </div>
        </div>

        <div className="text-[10px] text-gray-400 text-right font-sans pt-1 border-t border-gray-100 print:hidden">
          പേജ് 1 / 5
        </div>
      </div>

      {/* ==================================================== */}
      {/* PAGE 2: RIG 1 DETAILS                                 */}
      {/* ==================================================== */}
      <div className="official-form-page bg-white p-5 sm:p-8 border border-gray-300 shadow-md text-black space-y-3.5 text-xs sm:text-sm font-serif print:border-none print:shadow-none print:p-0 print:max-w-none box-border relative mb-6 print:mb-0">
        <div className="print-page-badge absolute top-2 right-3 text-[10px] text-gray-500 font-sans font-medium bg-gray-100 px-2 py-0.5 rounded border print:hidden">
          പേജ് 2 / 5
        </div>

        <div className="space-y-2">
          <h2 className="font-bold text-sm sm:text-base underline">
            3. ഡ്രില്ലിംഗ് റിഗ്ഗുകളുടെ വിവരങ്ങൾ (പരമാവധി മൂന്ന് എണ്ണം)
          </h2>

          <RenewalRigSection rigKey="rig1" rigNumber={1} data={data} update={update} />
        </div>

        <div className="text-[10px] text-gray-400 text-right font-sans pt-1 border-t border-gray-100 print:hidden">
          പേജ് 2 / 5
        </div>
      </div>

      {/* ==================================================== */}
      {/* PAGE 3: RIG 2 DETAILS                                 */}
      {/* ==================================================== */}
      <div className="official-form-page bg-white p-5 sm:p-8 border border-gray-300 shadow-md text-black space-y-3.5 text-xs sm:text-sm font-serif print:border-none print:shadow-none print:p-0 print:max-w-none box-border relative mb-6 print:mb-0">
        <div className="print-page-badge absolute top-2 right-3 text-[10px] text-gray-500 font-sans font-medium bg-gray-100 px-2 py-0.5 rounded border print:hidden">
          പേജ് 3 / 5
        </div>

        <div className="space-y-2">
          <h2 className="font-bold text-sm sm:text-base underline">
            3. ഡ്രില്ലിംഗ് റിഗ്ഗുകളുടെ വിവരങ്ങൾ - റിഗ് 2
          </h2>

          <RenewalRigSection rigKey="rig2" rigNumber={2} data={data} update={update} />
        </div>

        <div className="text-[10px] text-gray-400 text-right font-sans pt-1 border-t border-gray-100 print:hidden">
          പേജ് 3 / 5
        </div>
      </div>

      {/* ==================================================== */}
      {/* PAGE 4: RIG 3 DETAILS + DECLARATION                   */}
      {/* ==================================================== */}
      <div className="official-form-page bg-white p-5 sm:p-8 border border-gray-300 shadow-md text-black space-y-3.5 text-xs sm:text-sm font-serif print:border-none print:shadow-none print:p-0 print:max-w-none box-border relative mb-6 print:mb-0">
        <div className="print-page-badge absolute top-2 right-3 text-[10px] text-gray-500 font-sans font-medium bg-gray-100 px-2 py-0.5 rounded border print:hidden">
          പേജ് 4 / 5
        </div>

        <div className="space-y-3">
          <h2 className="font-bold text-sm sm:text-base underline">
            3. ഡ്രില്ലിംഗ് റിഗ്ഗുകളുടെ വിവരങ്ങൾ - റിഗ് 3
          </h2>

          <RenewalRigSection rigKey="rig3" rigNumber={3} data={data} update={update} />

          {/* Declaration Section */}
          <div className="pt-3 border-t-2 border-black space-y-3">
            <h2 className="font-bold text-center text-sm underline">സത്യപ്രസ്താവന</h2>
            <p className="text-justify leading-relaxed text-xs">
              മേൽ നൽകിയിട്ടുള്ള വിവരങ്ങൾ എന്റെ അറിവിലും വിശ്വാസത്തിലും കൃത്യവും സത്യസന്ധവുമാണെന്ന് സാക്ഷ്യപ്പെടുത്തുന്നു.
            </p>
            <div className="flex justify-between items-end pt-3">
              <div className="space-y-1.5">
                <div className="flex items-baseline gap-2">
                  <span className="font-bold">തീയതി :</span>
                  <FormDateInput value={data.date} onChange={(v) => update("date", v)} width="w-28" />
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="font-bold">സ്ഥലം :</span>
                  <FormLineInput value={data.place} onChange={(v) => update("place", v)} width="w-32" />
                </div>
              </div>
              <div className="text-right">
                <p className="font-bold pt-6 border-t border-dotted border-black w-44 text-center">ഒപ്പും പേരും</p>
              </div>
            </div>
          </div>
        </div>

        <div className="text-[10px] text-gray-400 text-right font-sans pt-1 border-t border-gray-100 print:hidden">
          പേജ് 4 / 5
        </div>
      </div>

      {/* ==================================================== */}
      {/* PAGE 5: OFFICE USE ONLY + RECEIPT                     */}
      {/* ==================================================== */}
      <div className="official-form-page bg-white p-5 sm:p-8 border border-gray-300 shadow-md text-black space-y-4 text-xs sm:text-sm font-serif print:border-none print:shadow-none print:p-0 print:max-w-none box-border relative mb-6 print:mb-0">
        <div className="print-page-badge absolute top-2 right-3 text-[10px] text-gray-500 font-sans font-medium bg-gray-100 px-2 py-0.5 rounded border print:hidden">
          പേജ് 5 / 5
        </div>

        <div className="space-y-6">
          {/* Office Use Section */}
          <div className="space-y-2.5">
            <div className="text-center font-bold text-xs border border-black py-0.5 bg-gray-50">
              ആഫീസ് ഉപയോഗത്തിന്
            </div>
            <div className="space-y-1.5 pl-2 text-xs">
              <div className="flex flex-wrap sm:flex-nowrap items-baseline gap-2">
                <span className="whitespace-nowrap shrink-0">1. അപേക്ഷ ലഭിച്ച തീയതി :</span>
                <FormDateInput value={data.office_date_recd} onChange={(v) => update("office_date_recd", v)} />
              </div>

              <div className="flex flex-wrap sm:flex-nowrap items-baseline gap-2">
                <span className="whitespace-nowrap shrink-0">2. അപേക്ഷാ ഫീസ് അടച്ച വിവരങ്ങൾ :</span>
                <FormLineInput value={data.office_fee_details} onChange={(v) => update("office_fee_details", v)} />
              </div>

              <div className="flex flex-wrap sm:flex-nowrap items-baseline gap-2 pl-4">
                <span className="whitespace-nowrap shrink-0">അടച്ച തുക :</span>
                <FormLineInput value={data.office_paid_amount} onChange={(v) => update("office_paid_amount", v)} />
              </div>

              <div className="flex flex-wrap sm:flex-nowrap items-baseline gap-2">
                <span className="whitespace-nowrap shrink-0">3. റിഗ് പരിശോധിച്ച തീയതി :</span>
                <FormDateInput value={data.office_rig_inspected_date} onChange={(v) => update("office_rig_inspected_date", v)} />
              </div>

              <div className="flex flex-wrap sm:flex-nowrap items-baseline gap-2">
                <span className="whitespace-nowrap shrink-0">4. പരിശോധകന്റെ ശുപാർശ :</span>
                <FormLineInput value={data.office_recommendation} onChange={(v) => update("office_recommendation", v)} />
              </div>
            </div>

            <div className="flex justify-between items-end pt-8 text-xs">
              <div className="text-center w-48">
                <p className="font-semibold border-t border-dotted border-black pt-1">പരിശോധകന്റെ ഒപ്പ്<br />(പേര് തസ്തിക ഉൾപ്പെടെ)</p>
              </div>
              <div className="text-center w-36">
                <p className="font-semibold border-t border-dotted border-black pt-1">ജില്ലാ ഓഫീസർ</p>
              </div>
            </div>
          </div>

          {/* Receipt Section */}
          <div className="pt-4 border-t-2 border-dashed border-black space-y-3">
            <div className="text-center">
              <h3 className="font-bold text-sm underline">രസീത്</h3>
            </div>

            <div className="space-y-2 pl-2 text-xs">
              <div className="flex flex-wrap sm:flex-nowrap items-baseline gap-2">
                <span className="font-bold whitespace-nowrap shrink-0">1. അപേക്ഷാ നമ്പർ :</span>
                <FormLineInput value={data.receipt_app_no} onChange={(v) => update("receipt_app_no", v)} />
              </div>

              <div className="flex flex-wrap sm:flex-nowrap items-baseline gap-2">
                <span className="font-bold whitespace-nowrap shrink-0">2. അപേക്ഷകന്റെ പേര് :</span>
                <FormLineInput value={data.receipt_applicant_name} onChange={(v) => update("receipt_applicant_name", v)} />
              </div>

              <div className="flex flex-wrap sm:flex-nowrap items-baseline gap-2">
                <span className="font-bold whitespace-nowrap shrink-0">3. അപേക്ഷ ലഭിച്ച തീയതി :</span>
                <FormDateInput value={data.receipt_date_recd} onChange={(v) => update("receipt_date_recd", v)} />
              </div>

              <div className="space-y-1">
                <span className="font-bold block">4. അപേക്ഷാ ഫീസ് ഒടുക്കിയ വിവരങ്ങൾ :</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4 pl-2 sm:pl-4 items-baseline">
                  <div className="flex items-baseline gap-2">
                    <span className="font-semibold whitespace-nowrap shrink-0">ഒടുക്കിയ തുക :</span>
                    <FormLineInput value={data.receipt_paid_amount} onChange={(v) => update("receipt_paid_amount", v)} />
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="font-semibold whitespace-nowrap shrink-0">തീയതി :</span>
                    <FormDateInput value={data.receipt_paid_date} onChange={(v) => update("receipt_paid_date", v)} />
                  </div>
                </div>
              </div>

              <div className="space-y-2 pt-1">
                <span className="font-bold block">5. അപേക്ഷാ വിവരങ്ങൾ :</span>

                <div className="flex items-center gap-2 pl-2 sm:pl-4">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={!!data.receipt_agency_renewal_check}
                      onChange={(e) => update("receipt_agency_renewal_check", e.target.checked)}
                      className="w-4 h-4 border border-black"
                    />
                    <span className="text-xs font-semibold">1. ഏജൻസി രജിസ്ട്രേഷൻ പുതുക്കുന്നതിന്</span>
                  </label>
                </div>

                <div className="flex flex-wrap sm:flex-nowrap items-center justify-between gap-2 pl-2 sm:pl-4 max-w-lg min-w-0">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={!!data.receipt_rig_renewal_check}
                      onChange={(e) => update("receipt_rig_renewal_check", e.target.checked)}
                      className="w-4 h-4 border border-black"
                    />
                    <span className="text-xs font-semibold">2. രജിസ്റ്റർ ചെയ്ത റിഗ്ഗുകൾ പുതുക്കുന്നതിന്</span>
                  </label>
                  <div className="flex items-center gap-1 border border-black px-2 py-0.5 bg-white shrink-0">
                    <input
                      type="text"
                      value={data.receipt_rig_renewal_count || "0"}
                      onChange={(e) => update("receipt_rig_renewal_count", e.target.value)}
                      className="w-8 text-center font-bold focus:outline-none bg-transparent"
                    />
                    <span className="font-bold text-xs">എണ്ണം</span>
                  </div>
                </div>

                <div className="flex flex-wrap sm:flex-nowrap items-center justify-between gap-2 pl-2 sm:pl-4 max-w-lg min-w-0">
                  <span className="font-semibold text-xs shrink">
                    3. പുതിയ റിഗ് രജിസ്ട്രേഷൻ / രജിസ്റ്റർ ചെയ്ത റിഗ് മാറ്റുന്നതിന്
                  </span>
                  <div className="flex items-center gap-1 border border-black px-2 py-0.5 bg-white shrink-0">
                    <input
                      type="text"
                      value={data.receipt_new_rig_count || "0"}
                      onChange={(e) => update("receipt_new_rig_count", e.target.value)}
                      className="w-8 text-center font-bold focus:outline-none bg-transparent"
                    />
                    <span className="font-bold text-xs">എണ്ണം</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-between items-end pt-6 text-xs">
              <div className="flex items-baseline gap-2">
                <span className="font-bold">തീയതി :</span>
                <FormDateInput value={data.date} onChange={(v) => update("date", v)} width="w-28" />
              </div>
              <div className="text-center w-36">
                <p className="font-bold border-t border-dotted border-black pt-1">ജില്ലാ ഓഫീസർ</p>
              </div>
            </div>
          </div>
        </div>

        <div className="text-[10px] text-gray-400 text-right font-sans pt-1 border-t border-gray-100 print:hidden">
          പേജ് 5 / 5
        </div>
      </div>
    </>
  );
}
