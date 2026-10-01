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

// Single Rig Section Component (Used for Rig 1 on Page 2, Rig 2 on Page 3, Rig 3 on Page 4)
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
    <div className="border border-black p-3 pt-3.5 space-y-2 relative min-w-0 mt-3 overflow-visible bg-white">
      <span className="absolute -top-3 left-3 bg-white px-2 py-0.5 font-bold border border-black text-xs z-10">
        റിഗ് {rigNumber}
      </span>

      <div className="space-y-1.5 pt-1 min-w-0">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 items-baseline pl-1 min-w-0">
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

        <div className="flex flex-wrap sm:flex-nowrap items-baseline gap-2 pl-1 min-w-0">
          <span className="font-bold whitespace-nowrap shrink-0">3. റിഗ്ഗിന്റെ തരം :</span>
          <FormLineInput value={data[`${rigKey}_type`]} onChange={(v) => update(`${rigKey}_type`, v)} />
        </div>
        <p className="text-[10px] text-gray-600 italic pl-3 sm:pl-5">
          (റോട്ടറി റിഗ്, റോട്ടറി കം.ഡി.റ്റി.എച്ച് റിഗ്, ക്യാലിക്സ് റിഗ്, ഫിൽട്ടർ പോയിന്റ് യൂണിറ്റ്)
        </p>

        <div className="flex flex-wrap sm:flex-nowrap items-baseline gap-2 pl-1 min-w-0">
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

// Rig Technical Assessment & Operational Record (Fills bottom of Rig Renewal Pages 2, 3, 4)
function RenewalRigTechnicalStatusBox({
  rigNumber,
  data,
  update,
}: {
  rigNumber: number;
  data: Record<string, any>;
  update: (k: string, v: any) => void;
}) {
  const prefix = `rig${rigNumber}`;
  return (
    <div className="border border-black p-3 bg-gray-50/40 space-y-2 text-xs mt-3">
      <div className="font-bold underline text-center">
        റിഗ് {rigNumber} - സാങ്കേതിക യോഗ്യതാ വിവരങ്ങളും മുൻ പ്രവർത്തന ചരിത്രവും (Technical Status & Operation History)
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
        <div className="flex items-baseline gap-1.5">
          <span className="font-semibold whitespace-nowrap shrink-0">പൂർത്തിയാക്കിയ കുഴൽക്കിണറുകൾ :</span>
          <FormLineInput
            value={data[`${prefix}_wells_completed`]}
            onChange={(v) => update(`${prefix}_wells_completed`, v)}
            width="w-20"
          />
          <span className="font-bold">എണ്ണം</span>
        </div>
        <div className="flex items-baseline gap-1.5">
          <span className="font-semibold whitespace-nowrap shrink-0">വാഹന നികുതി സാധുത (Tax Validity) :</span>
          <FormLineInput
            value={data[`${prefix}_tax_validity`]}
            onChange={(v) => update(`${prefix}_tax_validity`, v)}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
        <div className="flex items-baseline gap-1.5">
          <span className="font-semibold whitespace-nowrap shrink-0">ഇൻഷുറൻസ് സാധുത (Insurance) :</span>
          <FormLineInput
            value={data[`${prefix}_insurance_validity`]}
            onChange={(v) => update(`${prefix}_insurance_validity`, v)}
          />
        </div>
        <div className="flex items-baseline gap-1.5">
          <span className="font-semibold whitespace-nowrap shrink-0">കംപ്രസർ പ്രഷർ സർട്ടിഫിക്കറ്റ് :</span>
          <FormDateInput
            value={data[`${prefix}_comp_cert_date`]}
            onChange={(v) => update(`${prefix}_comp_cert_date`, v)}
          />
        </div>
      </div>

      <div className="flex items-center gap-3 pt-0.5">
        <span className="font-semibold whitespace-nowrap">നിലവിലെ പ്രവർത്തന ക്ഷമത :</span>
        <label className="flex items-center gap-1">
          <input type="checkbox" defaultChecked className="border-black w-3.5 h-3.5" />
          <span className="font-bold text-emerald-800">പൂർണ്ണ പ്രവർത്തനക്ഷമം (Fully Operational & Fit)</span>
        </label>
      </div>

      <div className="flex justify-between items-end pt-2 border-t border-dotted border-gray-400">
        <span className="text-[11px] text-gray-500 italic">റിഗ് {rigNumber} ഉടമസ്ഥന്റെ / ഓപ്പറേറ്ററുടെ സാക്ഷ്യപ്പെടുത്തൽ</span>
        <div className="text-right">
          <span className="text-xs font-bold border-b border-dotted border-black inline-block min-w-[150px] text-center pb-0.5">
            ഒപ്പ്
          </span>
        </div>
      </div>
    </div>
  );
}

// 5-PAGE RIG RENEWAL SHEETS (Option 1: Full-Page Uniform Balancing)
export function RigRenewalPages({ data, update }: FormProps) {
  return (
    <>
      {/* ==================================================== */}
      {/* PAGE 1: HEADER, SECTION 1, AND SECTION 2 (OWNER)     */}
      {/* ==================================================== */}
      <div className="official-form-page bg-white p-5 sm:p-8 border border-gray-300 shadow-md text-black text-xs sm:text-sm font-serif print:border-none print:shadow-none print:p-0 print:max-w-none box-border relative mb-6 print:mb-0 flex flex-col justify-between min-h-[268mm] print:min-h-[268mm]">
        <div className="print-page-badge absolute top-2 right-3 text-[10px] text-gray-500 font-sans font-medium bg-gray-100 px-2 py-0.5 rounded border print:hidden">
          പേജ് 1 / 5
        </div>

        <div className="space-y-3.5">
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

            <div className="border border-black p-3 pt-3.5 space-y-2 relative min-w-0 overflow-visible bg-white">
              <span className="absolute -top-2.5 left-3 bg-white px-2 py-0.5 font-bold border border-black text-xs z-10">
                എ.
              </span>

              <div className="flex flex-col sm:flex-row gap-3 min-w-0">
                <div className="flex-1 space-y-2 min-w-0">
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
              <div className="space-y-2 pt-2 border-t border-dashed border-gray-400 min-w-0">
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
              <div className="space-y-2 pt-2 border-t border-dashed border-gray-400 min-w-0">
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
        </div>

        {/* Page 1 Bottom Signature & Verification */}
        <div className="pt-4 mt-2 border-t-2 border-black flex justify-between items-end text-xs">
          <div className="space-y-1">
            <div className="flex items-baseline gap-2">
              <span className="font-bold">സ്ഥലം :</span>
              <FormLineInput value={data.place} onChange={(v) => update("place", v)} width="w-32" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="font-bold">തീയതി :</span>
              <FormDateInput value={data.date} onChange={(v) => update("date", v)} width="w-28" />
            </div>
          </div>
          <div className="text-center w-56">
            <p className="font-bold border-t border-dotted border-black pt-1">അപേക്ഷകന്റെ / നടത്തിപ്പുകാരന്റെ ഒപ്പും പേരും</p>
          </div>
        </div>

        <div className="text-[10px] text-gray-400 text-right font-sans pt-1 border-t border-gray-100 print:hidden">
          പേജ് 1 / 5
        </div>
      </div>

      {/* ==================================================== */}
      {/* PAGE 2: RIG 1 DETAILS + TECHNICAL STATUS              */}
      {/* ==================================================== */}
      <div className="official-form-page bg-white p-5 sm:p-8 border border-gray-300 shadow-md text-black text-xs sm:text-sm font-serif print:border-none print:shadow-none print:p-0 print:max-w-none box-border relative mb-6 print:mb-0 flex flex-col justify-between min-h-[268mm] print:min-h-[268mm]">
        <div className="print-page-badge absolute top-2 right-3 text-[10px] text-gray-500 font-sans font-medium bg-gray-100 px-2 py-0.5 rounded border print:hidden">
          പേജ് 2 / 5
        </div>

        <div className="space-y-3">
          <h2 className="font-bold text-sm sm:text-base underline">
            3. ഡ്രില്ലിംഗ് റിഗ്ഗുകളുടെ വിവരങ്ങൾ - റിഗ് 1 (Rig 1)
          </h2>

          <RenewalRigSection rigKey="rig1" rigNumber={1} data={data} update={update} />

          {/* Technical Assessment & Operation Record (Fills Page 2 uniformly) */}
          <RenewalRigTechnicalStatusBox rigNumber={1} data={data} update={update} />
        </div>

        <div className="text-[10px] text-gray-400 text-right font-sans pt-1 border-t border-gray-100 print:hidden">
          പേജ് 2 / 5
        </div>
      </div>

      {/* ==================================================== */}
      {/* PAGE 3: RIG 2 DETAILS + TECHNICAL STATUS              */}
      {/* ==================================================== */}
      <div className="official-form-page bg-white p-5 sm:p-8 border border-gray-300 shadow-md text-black text-xs sm:text-sm font-serif print:border-none print:shadow-none print:p-0 print:max-w-none box-border relative mb-6 print:mb-0 flex flex-col justify-between min-h-[268mm] print:min-h-[268mm]">
        <div className="print-page-badge absolute top-2 right-3 text-[10px] text-gray-500 font-sans font-medium bg-gray-100 px-2 py-0.5 rounded border print:hidden">
          പേജ് 3 / 5
        </div>

        <div className="space-y-3">
          <h2 className="font-bold text-sm sm:text-base underline">
            3. ഡ്രില്ലിംഗ് റിഗ്ഗുകളുടെ വിവരങ്ങൾ - റിഗ് 2 (Rig 2)
          </h2>

          <RenewalRigSection rigKey="rig2" rigNumber={2} data={data} update={update} />

          {/* Technical Assessment & Operation Record (Fills Page 3 uniformly) */}
          <RenewalRigTechnicalStatusBox rigNumber={2} data={data} update={update} />
        </div>

        <div className="text-[10px] text-gray-400 text-right font-sans pt-1 border-t border-gray-100 print:hidden">
          പേജ് 3 / 5
        </div>
      </div>

      {/* ==================================================== */}
      {/* PAGE 4: RIG 3 DETAILS + DECLARATION + CHECKLIST       */}
      {/* ==================================================== */}
      <div className="official-form-page bg-white p-5 sm:p-8 border border-gray-300 shadow-md text-black text-xs sm:text-sm font-serif print:border-none print:shadow-none print:p-0 print:max-w-none box-border relative mb-6 print:mb-0 flex flex-col justify-between min-h-[268mm] print:min-h-[268mm]">
        <div className="print-page-badge absolute top-2 right-3 text-[10px] text-gray-500 font-sans font-medium bg-gray-100 px-2 py-0.5 rounded border print:hidden">
          പേജ് 4 / 5
        </div>

        <div className="space-y-3">
          <h2 className="font-bold text-sm sm:text-base underline">
            3. ഡ്രില്ലിംഗ് റിഗ്ഗുകളുടെ വിവരങ്ങൾ - റിഗ് 3 (Rig 3)
          </h2>

          <RenewalRigSection rigKey="rig3" rigNumber={3} data={data} update={update} />

          {/* Declaration Section */}
          <div className="pt-2 border-t-2 border-black space-y-2">
            <h2 className="font-bold text-center text-sm underline">സത്യപ്രസ്താവന</h2>
            <p className="text-justify leading-relaxed text-xs">
              മേൽ നൽകിയിട്ടുള്ള വിവരങ്ങൾ എന്റെ അറിവിലും വിശ്വാസത്തിലും കൃത്യവും സത്യസന്ധവുമാണെന്ന് സാക്ഷ്യപ്പെടുത്തുന്നു.
            </p>
            <div className="flex justify-between items-end pt-2">
              <div className="space-y-1">
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
                <p className="font-bold pt-4 border-t border-dotted border-black w-44 text-center">ഒപ്പും പേരും</p>
              </div>
            </div>
          </div>

          {/* Renewal Document Checklist (Fills Page 4 uniformly) */}
          <div className="border border-black p-3 bg-gray-50/50 space-y-2 text-xs mt-2">
            <div className="font-bold underline text-center">
              പുതുക്കലിനായി ഹാജരാക്കേണ്ട രേഖകളുടെ പരിശോധനാ പട്ടിക (Renewal Document Checklist)
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1.5 pl-2 text-[11px]">
              <label className="flex items-center gap-1.5">
                <input type="checkbox" defaultChecked className="border-black w-3.5 h-3.5" />
                <span>1. മുൻ രജിസ്ട്രേഷൻ സർട്ടിഫിക്കറ്റിന്റെ പകർപ്പ് (Previous Reg Copy)</span>
              </label>
              <label className="flex items-center gap-1.5">
                <input type="checkbox" defaultChecked className="border-black w-3.5 h-3.5" />
                <span>2. മോട്ടോർ വാഹന നികുതി & ഇൻഷുറൻസ് രേഖകൾ</span>
              </label>
              <label className="flex items-center gap-1.5">
                <input type="checkbox" defaultChecked className="border-black w-3.5 h-3.5" />
                <span>3. കംപ്രസർ പ്രഷർ പരിശോധനാ സർട്ടിഫിക്കറ്റ്</span>
              </label>
              <label className="flex items-center gap-1.5">
                <input type="checkbox" defaultChecked className="border-black w-3.5 h-3.5" />
                <span>4. ഓപ്പറേറ്ററുടെ തിരിച്ചറിയൽ രേഖ & പ്രവർത്തിപരിചയം</span>
              </label>
              <label className="flex items-center gap-1.5">
                <input type="checkbox" defaultChecked className="border-black w-3.5 h-3.5" />
                <span>5. രജിസ്ട്രേഷൻ പുതുക്കൽ ഫീസ് അടച്ച ചലാൻ രസീത്</span>
              </label>
              <label className="flex items-center gap-1.5">
                <input type="checkbox" defaultChecked className="border-black w-3.5 h-3.5" />
                <span>6. തദ്ദേശ സ്വയംഭരണ സ്ഥാപനത്തിന്റെ ലൈസൻസ് പുതുക്കൽ</span>
              </label>
            </div>
          </div>
        </div>

        <div className="text-[10px] text-gray-400 text-right font-sans pt-1 border-t border-gray-100 print:hidden">
          പേജ് 4 / 5
        </div>
      </div>

      {/* ==================================================== */}
      {/* PAGE 5: OFFICE USE ONLY + OFFICIAL COUNTERFOIL       */}
      {/* ==================================================== */}
      <div className="official-form-page bg-white p-5 sm:p-8 border border-gray-300 shadow-md text-black text-xs sm:text-sm font-serif print:border-none print:shadow-none print:p-0 print:max-w-none box-border relative mb-6 print:mb-0 flex flex-col justify-between min-h-[268mm] print:min-h-[268mm]">
        <div className="print-page-badge absolute top-2 right-3 text-[10px] text-gray-500 font-sans font-medium bg-gray-100 px-2 py-0.5 rounded border print:hidden">
          പേജ് 5 / 5
        </div>

        <div className="space-y-5">
          {/* Office Use Section with Verification Checklist Table */}
          <div className="space-y-3">
            <div className="text-center font-bold text-xs sm:text-sm border-2 border-black py-1 bg-gray-100 uppercase tracking-wide">
              ആഫീസ് ഉപയോഗത്തിന് (For Office Use Only)
            </div>

            {/* Verification Table */}
            <div className="border border-black overflow-hidden">
              <table className="w-full text-[11px] border-collapse">
                <thead>
                  <tr className="bg-gray-100 border-b border-black">
                    <th className="border-r border-black p-1.5 text-center w-10">ക്രമം</th>
                    <th className="border-r border-black p-1.5 text-left">പരിശോധനാ വിഷയം (Verification Item)</th>
                    <th className="p-1.5 text-center w-36">പരിശോധനാ ഫലം</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-black">
                    <td className="border-r border-black p-1.5 text-center">1</td>
                    <td className="border-r border-black p-1.5">മുൻ രജിസ്ട്രേഷൻ രേഖകളും കാലഹരണ തീയതിയും പരിശോധിച്ചു</td>
                    <td className="p-1.5 text-center font-semibold text-emerald-800">തൃപ്തികരം / രേഖകൾ ശരിയാണ്</td>
                  </tr>
                  <tr className="border-b border-black">
                    <td className="border-r border-black p-1.5 text-center">2</td>
                    <td className="border-r border-black p-1.5">വാഹന പരിശോധന & മോട്ടോർ വാഹന നികുതി, ഇൻഷുറൻസ് രേഖകൾ</td>
                    <td className="p-1.5 text-center font-semibold text-emerald-800">തൃപ്തികരം</td>
                  </tr>
                  <tr className="border-b border-black">
                    <td className="border-r border-black p-1.5 text-center">3</td>
                    <td className="border-r border-black p-1.5">റിഗ് മെക്കാനിക്കൽ ഫിറ്റ്നസ് & കംപ്രസർ സുരക്ഷാ പരിശോധന</td>
                    <td className="p-1.5 text-center font-semibold text-emerald-800">തൃപ്തികരം</td>
                  </tr>
                  <tr className="border-b border-black">
                    <td className="border-r border-black p-1.5 text-center">4</td>
                    <td className="border-r border-black p-1.5">ഡ്രില്ലിംഗ് യന്ത്ര ഓപ്പറേറ്ററുടെ ലൈസൻസും പരിചയവും</td>
                    <td className="p-1.5 text-center font-semibold text-emerald-800">തൃപ്തികരം</td>
                  </tr>
                  <tr>
                    <td className="border-r border-black p-1.5 text-center">5</td>
                    <td className="border-r border-black p-1.5">പുതുക്കൽ ഫീസ് അടച്ച ചലാൻ വിവരങ്ങൾ</td>
                    <td className="p-1.5 text-center font-mono font-semibold">
                      {data.office_paid_amount ? `Rs. ${data.office_paid_amount}` : "ഫീസ് ഒടുക്കി"}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="space-y-2 pl-1 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div className="flex items-baseline gap-2">
                  <span className="font-bold whitespace-nowrap shrink-0">1. അപേക്ഷ ലഭിച്ച തീയതി :</span>
                  <FormDateInput value={data.office_date_recd} onChange={(v) => update("office_date_recd", v)} />
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="font-bold whitespace-nowrap shrink-0">3. റിഗ് പരിശോധിച്ച തീയതി :</span>
                  <FormDateInput value={data.office_rig_inspected_date} onChange={(v) => update("office_rig_inspected_date", v)} />
                </div>
              </div>

              <div className="flex flex-wrap sm:flex-nowrap items-baseline gap-2">
                <span className="font-bold whitespace-nowrap shrink-0">2. അപേക്ഷാ ഫീസ് ചലാൻ വിവരങ്ങൾ :</span>
                <FormLineInput value={data.office_fee_details} onChange={(v) => update("office_fee_details", v)} />
              </div>

              <div className="flex flex-wrap sm:flex-nowrap items-baseline gap-2">
                <span className="font-bold whitespace-nowrap shrink-0">4. പരിശോധകന്റെ ശുപാർശ :</span>
                <FormLineInput value={data.office_recommendation || "രജിസ്ട്രേഷൻ പുതുക്കി നൽകാവുന്നതാണ് (Recommended for Renewal)"} onChange={(v) => update("office_recommendation", v)} />
              </div>
            </div>

            <div className="flex justify-between items-end pt-6 text-xs">
              <div className="text-center w-48">
                <p className="font-semibold border-t border-dotted border-black pt-1">പരിശോധകന്റെ ഒപ്പ്<br />(പേര് തസ്തിക ഉൾപ്പെടെ)</p>
              </div>
              <div className="text-center w-36">
                <div className="w-20 h-10 border border-dashed border-gray-400 mx-auto mb-1 flex items-center justify-center text-[9px] text-gray-400">ഓഫീസ് സീൽ</div>
                <p className="font-semibold border-t border-dotted border-black pt-0.5">ജില്ലാ ഓഫീസർ</p>
              </div>
            </div>
          </div>

          {/* Perforated Divider */}
          <div className="relative py-2">
            <div className="border-t-2 border-dashed border-black w-full" />
            <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white px-3 text-[11px] font-mono font-bold tracking-wider text-gray-700">
              ✂ കൗണ്ടർഫോയിൽ / രസീത് (COUNTERFOIL / RECEIPT) ✂
            </span>
          </div>

          {/* Official Counterfoil Receipt Box */}
          <div className="border-2 border-black p-4 space-y-3 bg-gray-50/30">
            <div className="text-center space-y-0.5 border-b border-black pb-1.5">
              <h3 className="font-bold text-sm tracking-wide">കേരള സർക്കാർ ഭൂജല വകുപ്പ്, ജില്ലാ ഓഫീസ്</h3>
              <p className="text-xs font-bold underline">രജിസ്ട്രേഷൻ പുതുക്കൽ അപേക്ഷാ രസീത് (RENEWAL ACKNOWLEDGMENT & FEE RECEIPT)</p>
            </div>

            <div className="space-y-2 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div className="flex items-baseline gap-2">
                  <span className="font-bold whitespace-nowrap shrink-0">1. അപേക്ഷാ നമ്പർ :</span>
                  <FormLineInput value={data.receipt_app_no} onChange={(v) => update("receipt_app_no", v)} />
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="font-bold whitespace-nowrap shrink-0">3. അപേക്ഷ ലഭിച്ച തീയതി :</span>
                  <FormDateInput value={data.receipt_date_recd} onChange={(v) => update("receipt_date_recd", v)} />
                </div>
              </div>

              <div className="flex flex-wrap sm:flex-nowrap items-baseline gap-2">
                <span className="font-bold whitespace-nowrap shrink-0">2. അപേക്ഷകന്റെ / സ്ഥാപനത്തിന്റെ പേര് :</span>
                <FormLineInput value={data.receipt_applicant_name || data.agencyName} onChange={(v) => update("receipt_applicant_name", v)} />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4 items-baseline">
                <div className="flex items-baseline gap-2">
                  <span className="font-bold whitespace-nowrap shrink-0">4. ഒടുക്കിയ തുക :</span>
                  <FormLineInput value={data.receipt_paid_amount} onChange={(v) => update("receipt_paid_amount", v)} />
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="font-bold whitespace-nowrap shrink-0">ഫീസ് ഒടുക്കിയ തീയതി :</span>
                  <FormDateInput value={data.receipt_paid_date} onChange={(v) => update("receipt_paid_date", v)} />
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

            <div className="flex justify-between items-end pt-5 text-xs">
              <div className="space-y-1">
                <div className="flex items-baseline gap-2">
                  <span className="font-bold">തീയതി :</span>
                  <FormDateInput value={data.date} onChange={(v) => update("date", v)} width="w-28" />
                </div>
                <div className="w-24 h-10 border border-dashed border-gray-400 flex items-center justify-center text-[9px] text-gray-400">
                  ഓഫീസ് മുദ്ര (Seal)
                </div>
              </div>

              <div className="flex gap-8">
                <div className="text-center w-36">
                  <p className="font-bold border-t border-dotted border-black pt-1">ക്ലാർക്ക് / ക്യാഷ്യറുടെ ഒപ്പ്</p>
                </div>
                <div className="text-center w-36">
                  <p className="font-bold border-t border-dotted border-black pt-1">ജില്ലാ ഓഫീസർ</p>
                </div>
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
