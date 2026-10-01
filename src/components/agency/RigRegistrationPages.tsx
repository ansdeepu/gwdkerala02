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

// Partner Card (B & C)
function PartnerCard({
  letter,
  title,
  data,
  update,
}: {
  letter: "B" | "C";
  title: string;
  data: Record<string, any>;
  update: (k: string, v: any) => void;
}) {
  const pKey = `owner${letter}`;
  return (
    <div className="space-y-1">
      <div className="text-center font-bold text-xs text-gray-700 italic">{title}</div>
      <div className="border border-black p-3 pt-3.5 space-y-2.5 relative min-w-0 mt-2 overflow-visible bg-white">
        <span className="absolute -top-2.5 left-3 bg-white px-2 py-0.5 font-bold border border-black text-xs z-10">
          {letter === "B" ? "ബി." : "സി."}
        </span>

        <div className="flex flex-col sm:flex-row gap-3 min-w-0">
          <div className="flex-1 space-y-2 min-w-0">
            <div className="flex flex-wrap sm:flex-nowrap items-baseline gap-2 pt-0.5 min-w-0">
              <span className="font-bold whitespace-nowrap shrink-0">1. പേര് :</span>
              <FormLineInput value={data[`${pKey}_name`]} onChange={(v) => update(`${pKey}_name`, v)} />
            </div>

            <div className="flex flex-wrap sm:flex-nowrap items-baseline gap-2 min-w-0">
              <span className="font-bold whitespace-nowrap shrink-0">2. നിലവിലെ മേൽവിലാസം :</span>
              <FormLineInput value={data[`${pKey}_curr_address`]} onChange={(v) => update(`${pKey}_curr_address`, v)} />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 items-baseline pl-2 min-w-0">
              <div className="flex items-baseline gap-1 min-w-0">
                <span className="font-semibold text-xs whitespace-nowrap shrink-0">വില്ലേജ് :</span>
                <FormLineInput value={data[`${pKey}_curr_village`]} onChange={(v) => update(`${pKey}_curr_village`, v)} />
              </div>
              <div className="flex items-baseline gap-1 min-w-0">
                <span className="font-semibold text-xs whitespace-nowrap shrink-0">താലൂക്ക് :</span>
                <FormLineInput value={data[`${pKey}_curr_taluk`]} onChange={(v) => update(`${pKey}_curr_taluk`, v)} />
              </div>
            </div>

            <div className="flex flex-wrap sm:flex-nowrap items-baseline gap-2 pl-2 min-w-0">
              <span className="font-semibold text-xs shrink sm:whitespace-nowrap">പഞ്ചായത്ത് :</span>
              <FormLineInput value={data[`${pKey}_curr_panchayath`]} onChange={(v) => update(`${pKey}_curr_panchayath`, v)} />
            </div>

            <div className="flex flex-wrap sm:flex-nowrap items-baseline gap-2 pl-2 min-w-0">
              <span className="font-semibold text-xs whitespace-nowrap shrink-0">ജില്ല :</span>
              <FormLineInput value={data[`${pKey}_curr_district`]} onChange={(v) => update(`${pKey}_curr_district`, v)} />
            </div>

            <div className="flex flex-wrap items-center gap-2 pl-2 min-w-0">
              <span className="font-semibold text-xs shrink-0">പിൻ കോഡ് :</span>
              <PinCodeGrid value={data[`${pKey}_curr_pincode`]} onChange={(v) => update(`${pKey}_curr_pincode`, v)} />
            </div>
          </div>

          <PhotoBox photoUrl={data[`${pKey}_curr_photo`]} onPhotoChange={(url) => update(`${pKey}_curr_photo`, url)} />
        </div>

        {/* Permanent */}
        <div className="space-y-2 pt-2 border-t border-dashed border-gray-400 min-w-0">
          <div className="flex flex-wrap sm:flex-nowrap items-baseline gap-2 min-w-0">
            <span className="font-bold whitespace-nowrap shrink-0">3. സ്ഥിരം മേൽവിലാസം :</span>
            <FormLineInput value={data[`${pKey}_perm_address`]} onChange={(v) => update(`${pKey}_perm_address`, v)} />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 items-baseline pl-2 min-w-0">
            <div className="flex items-baseline gap-1 min-w-0">
              <span className="font-semibold text-xs whitespace-nowrap shrink-0">വില്ലേജ് :</span>
              <FormLineInput value={data[`${pKey}_perm_village`]} onChange={(v) => update(`${pKey}_perm_village`, v)} />
            </div>
            <div className="flex items-baseline gap-1 min-w-0">
              <span className="font-semibold text-xs whitespace-nowrap shrink-0">താലൂക്ക് :</span>
              <FormLineInput value={data[`${pKey}_perm_taluk`]} onChange={(v) => update(`${pKey}_perm_taluk`, v)} />
            </div>
          </div>

          <div className="flex flex-wrap sm:flex-nowrap items-baseline gap-2 pl-2 min-w-0">
            <span className="font-semibold text-xs shrink sm:whitespace-nowrap">പഞ്ചായത്ത് :</span>
            <FormLineInput value={data[`${pKey}_perm_panchayath`]} onChange={(v) => update(`${pKey}_perm_panchayath`, v)} />
          </div>

          <div className="flex flex-wrap sm:flex-nowrap items-baseline gap-2 pl-2 min-w-0">
            <span className="font-semibold text-xs whitespace-nowrap shrink-0">ജില്ല :</span>
            <FormLineInput value={data[`${pKey}_perm_district`]} onChange={(v) => update(`${pKey}_perm_district`, v)} />
          </div>

          <div className="flex flex-wrap items-center gap-2 pl-2 min-w-0">
            <span className="font-semibold text-xs shrink-0">പിൻ കോഡ് :</span>
            <PinCodeGrid value={data[`${pKey}_perm_pincode`]} onChange={(v) => update(`${pKey}_perm_pincode`, v)} />
          </div>
        </div>

        {/* ID, PAN, Nominee */}
        <div className="space-y-2 pt-2 border-t border-dashed border-gray-400 min-w-0">
          <div className="flex flex-wrap items-center gap-2 sm:gap-4 min-w-0">
            <span className="font-bold whitespace-nowrap shrink-0">4. തിരിച്ചറിയൽരേഖ :</span>
            <label className="flex items-center gap-1 cursor-pointer shrink-0">
              <input
                type="radio"
                name={`${pKey}_id_type`}
                checked={data[`${pKey}_id_type`] === "Election"}
                onChange={() => update(`${pKey}_id_type`, "Election")}
                className="border-black"
              />
              <span className="border border-black px-2 py-0.5 font-semibold text-xs">ഇലക്ഷൻ കാർഡ്</span>
            </label>
            <label className="flex items-center gap-1 cursor-pointer shrink-0">
              <input
                type="radio"
                name={`${pKey}_id_type`}
                checked={data[`${pKey}_id_type`] === "Aadhaar"}
                onChange={() => update(`${pKey}_id_type`, "Aadhaar")}
                className="border-black"
              />
              <span className="border border-black px-2 py-0.5 font-semibold text-xs">ആധാർ കാർഡ്</span>
            </label>
          </div>

          <div className="flex flex-wrap sm:flex-nowrap items-baseline gap-2 min-w-0">
            <span className="font-bold whitespace-nowrap shrink-0">5. തിരിച്ചറിയൽ രേഖയുടെ നമ്പർ :</span>
            <FormLineInput value={data[`${pKey}_id_no`]} onChange={(v) => update(`${pKey}_id_no`, v)} />
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:gap-3 min-w-0">
            <span className="font-bold whitespace-nowrap shrink-0">6. പാൻ നമ്പർ :</span>
            <PanGrid value={data[`${pKey}_pan`]} onChange={(v) => update(`${pKey}_pan`, v)} />
          </div>

          <div className="flex flex-wrap sm:flex-nowrap items-baseline gap-2 min-w-0">
            <span className="font-bold whitespace-nowrap shrink-0">7. നോമിനി :</span>
            <FormLineInput value={data[`${pKey}_nominee`]} onChange={(v) => update(`${pKey}_nominee`, v)} />
          </div>

          <div className="flex justify-between items-end pt-2 border-t border-dotted border-gray-300">
            <span className="text-[11px] text-gray-500 italic">പങ്കാളിയുടെ സാക്ഷ്യപ്പെടുത്തൽ</span>
            <div className="text-right">
              <span className="text-xs font-bold border-b border-dotted border-black inline-block min-w-[140px] text-center pb-0.5">
                പങ്കാളിയുടെ ഒപ്പ്
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Rig Details Section (Complete Unit per Rig)
function RigSection({
  letter,
  data,
  update,
}: {
  letter: "A" | "B" | "C";
  data: Record<string, any>;
  update: (k: string, v: any) => void;
}) {
  return (
    <div className="border border-black p-2.5 sm:p-3 pt-3 space-y-1.5 relative min-w-0 mt-3 overflow-visible bg-white">
      <span className="absolute -top-3 left-3 bg-white px-2 py-0.5 font-bold border border-black text-xs z-10">
        റിഗ് {letter}
      </span>

      <div className="flex flex-wrap sm:flex-nowrap items-baseline gap-2 min-w-0 pt-0.5">
        <span className="font-bold whitespace-nowrap shrink-0">1. റിഗ്ഗിന്റെ തരം :</span>
        <FormLineInput value={data[`rig${letter}_type`]} onChange={(v) => update(`rig${letter}_type`, v)} />
      </div>
      <p className="text-[10px] text-gray-600 italic pl-2 sm:pl-4">
        (റോട്ടറി റിഗ്, റോട്ടറി കം.ഡി.റ്റി.എച്ച് റിഗ്, ക്യാലിക്സ് റിഗ്, ഫിൽട്ടർ പോയിന്റ് യൂണിറ്റ്)
      </p>

      <div className="flex flex-wrap sm:flex-nowrap items-baseline gap-2 min-w-0">
        <span className="font-bold whitespace-nowrap shrink-0">2. റിഗ് ഉടമസ്ഥന്റെ പേര് :</span>
        <FormLineInput value={data[`rig${letter}_owner_name`]} onChange={(v) => update(`rig${letter}_owner_name`, v)} />
      </div>

      <div className="flex flex-wrap sm:flex-nowrap items-baseline gap-2 min-w-0">
        <span className="font-bold whitespace-nowrap shrink-0">മേൽവിലാസം :</span>
        <FormLineInput value={data[`rig${letter}_owner_address`]} onChange={(v) => update(`rig${letter}_owner_address`, v)} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 items-baseline pl-2 sm:pl-4 min-w-0">
        <div className="flex items-baseline gap-1 min-w-0">
          <span className="font-bold whitespace-nowrap shrink-0">ജില്ല :</span>
          <FormLineInput value={data[`rig${letter}_district`]} onChange={(v) => update(`rig${letter}_district`, v)} />
        </div>
        <div className="flex items-baseline gap-1 min-w-0">
          <span className="font-bold whitespace-nowrap shrink-0">സംസ്ഥാനം :</span>
          <FormLineInput value={data[`rig${letter}_state`]} onChange={(v) => update(`rig${letter}_state`, v)} />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 pl-2 sm:pl-4 min-w-0">
        <span className="font-bold shrink-0">പിൻ കോഡ് :</span>
        <PinCodeGrid value={data[`rig${letter}_pincode`]} onChange={(v) => update(`rig${letter}_pincode`, v)} />
      </div>

      <div className="space-y-1 pt-1 min-w-0">
        <span className="font-bold block">3. ഉപയോഗിക്കുന്ന വാഹനത്തിന്റെ വിവരം</span>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pl-2 sm:pl-4 min-w-0">
          <div className="flex items-baseline gap-1 min-w-0">
            <span className="font-semibold whitespace-nowrap shrink-0">എ. തരം :</span>
            <FormLineInput value={data[`rig${letter}_veh_type`]} onChange={(v) => update(`rig${letter}_veh_type`, v)} />
          </div>
          <div className="flex items-baseline gap-1 min-w-0">
            <span className="font-semibold whitespace-nowrap shrink-0">ബി. രജി. നമ്പർ :</span>
            <FormLineInput value={data[`rig${letter}_veh_reg`]} onChange={(v) => update(`rig${letter}_veh_reg`, v)} />
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pl-2 sm:pl-4 min-w-0">
          <div className="flex items-baseline gap-1 min-w-0">
            <span className="font-semibold whitespace-nowrap shrink-0">സി. ചേസിസ് നമ്പർ :</span>
            <FormLineInput value={data[`rig${letter}_veh_chassis`]} onChange={(v) => update(`rig${letter}_veh_chassis`, v)} />
          </div>
          <div className="flex items-baseline gap-1 min-w-0">
            <span className="font-semibold whitespace-nowrap shrink-0">ഡി. എൻജിൻ നമ്പർ :</span>
            <FormLineInput value={data[`rig${letter}_veh_engine`]} onChange={(v) => update(`rig${letter}_veh_engine`, v)} />
          </div>
        </div>
      </div>

      <div className="space-y-1 pt-1 min-w-0">
        <span className="font-bold block">
          4. കംപ്രസറിന്റെ വിവരം <span className="font-normal text-xs">(ഡിറ്റിഎച്ച് / റോട്ടറി കം.ഡിറ്റിഎച്ച് / ഫിൽട്ടർ പോയിന്റ് )</span>
        </span>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pl-2 sm:pl-4 min-w-0">
          <div className="flex items-baseline gap-1 min-w-0">
            <span className="font-semibold whitespace-nowrap shrink-0">എ. മോഡൽ :</span>
            <FormLineInput value={data[`rig${letter}_comp_model`]} onChange={(v) => update(`rig${letter}_comp_model`, v)} />
          </div>
          <div className="flex items-baseline gap-1 min-w-0">
            <span className="font-semibold whitespace-nowrap shrink-0">ബി. കപ്പാസിറ്റി :</span>
            <FormLineInput value={data[`rig${letter}_comp_cap`]} onChange={(v) => update(`rig${letter}_comp_cap`, v)} />
          </div>
        </div>
      </div>

      <div className="space-y-1 pt-1 min-w-0">
        <span className="font-bold block">
          5. ജനറേറ്ററിന്റെ വിവരം <span className="font-normal text-xs">(ക്യാലിക്സ് റിഗ്)</span>
        </span>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pl-2 sm:pl-4 min-w-0">
          <div className="flex items-baseline gap-1 min-w-0">
            <span className="font-semibold whitespace-nowrap shrink-0">എ. തരം :</span>
            <FormLineInput value={data[`rig${letter}_gen_type`]} onChange={(v) => update(`rig${letter}_gen_type`, v)} />
          </div>
          <div className="flex items-baseline gap-1 min-w-0">
            <span className="font-semibold whitespace-nowrap shrink-0">ബി. മോഡൽ :</span>
            <FormLineInput value={data[`rig${letter}_gen_model`]} onChange={(v) => update(`rig${letter}_gen_model`, v)} />
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pl-2 sm:pl-4 min-w-0">
          <div className="flex items-baseline gap-1 min-w-0">
            <span className="font-semibold whitespace-nowrap shrink-0">സി. കപ്പാസിറ്റി :</span>
            <FormLineInput value={data[`rig${letter}_gen_cap`]} onChange={(v) => update(`rig${letter}_gen_cap`, v)} />
          </div>
          <div className="flex items-baseline gap-1 min-w-0">
            <span className="font-semibold whitespace-nowrap shrink-0">ഡി. എൻജിൻ നമ്പർ :</span>
            <FormLineInput value={data[`rig${letter}_gen_engine`]} onChange={(v) => update(`rig${letter}_gen_engine`, v)} />
          </div>
        </div>
      </div>

      <div className="space-y-1 pt-1 min-w-0">
        <span className="font-bold block">
          6. കുഴിക്കാൻ സാധിക്കുന്ന കിണറിന്റെ സ്പെസിഫിക്കേഷൻ{" "}
          <span className="font-normal text-xs">(കംപ്രസ്സർ കപ്പാസിറ്റിയുടെ അടിസ്ഥാനത്തിൽ)</span>
        </span>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pl-2 sm:pl-4 min-w-0">
          <div className="flex items-baseline gap-1 min-w-0">
            <span className="font-semibold whitespace-nowrap shrink-0">എ. പരമാവധി ആഴം :</span>
            <FormLineInput value={data[`rig${letter}_well_depth`]} onChange={(v) => update(`rig${letter}_well_depth`, v)} />
          </div>
          <div className="flex items-baseline gap-1 min-w-0">
            <span className="font-semibold whitespace-nowrap shrink-0">ബി. പരമാവധി വ്യാസം :</span>
            <FormLineInput value={data[`rig${letter}_well_dia`]} onChange={(v) => update(`rig${letter}_well_dia`, v)} />
          </div>
        </div>
      </div>

      <div className="space-y-1 pt-1 min-w-0">
        <span className="font-bold block">7. ഡ്രില്ലിംഗ് യന്ത്ര ഓപ്പറേറ്ററുടെ വിവരങ്ങൾ</span>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pl-2 sm:pl-4 min-w-0">
          <div className="flex items-baseline gap-1 min-w-0">
            <span className="font-semibold whitespace-nowrap shrink-0">പേര് :</span>
            <FormLineInput value={data[`rig${letter}_op_name`]} onChange={(v) => update(`rig${letter}_op_name`, v)} />
          </div>
          <div className="flex items-baseline gap-1 min-w-0">
            <span className="font-semibold whitespace-nowrap shrink-0">വയസ്സ് :</span>
            <FormLineInput value={data[`rig${letter}_op_age`]} onChange={(v) => update(`rig${letter}_op_age`, v)} width="w-20" />
          </div>
        </div>
        <div className="flex flex-wrap sm:flex-nowrap items-baseline gap-2 pl-2 sm:pl-4 min-w-0">
          <span className="font-semibold whitespace-nowrap shrink-0">പ്രവർത്തി പരിചയം :</span>
          <FormLineInput value={data[`rig${letter}_op_exp`]} onChange={(v) => update(`rig${letter}_op_exp`, v)} />
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:gap-4 pl-2 sm:pl-4 min-w-0">
          <span className="font-semibold whitespace-nowrap shrink-0">തിരിച്ചറിയൽ രേഖ :</span>
          <label className="flex items-center gap-1 cursor-pointer shrink-0">
            <input
              type="radio"
              name={`rig${letter}_op_id_type`}
              checked={data[`rig${letter}_op_id_type`] === "Election"}
              onChange={() => update(`rig${letter}_op_id_type`, "Election")}
              className="border-black"
            />
            <span className="border border-black px-2 py-0.5 text-xs font-semibold">ഇലക്ഷൻ കാർഡ്</span>
          </label>
          <label className="flex items-center gap-1 cursor-pointer shrink-0">
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
        <div className="flex flex-wrap sm:flex-nowrap items-baseline gap-2 pl-2 sm:pl-4 min-w-0">
          <span className="font-semibold whitespace-nowrap shrink-0">തിരിച്ചറിയൽ രേഖയുടെ നമ്പർ :</span>
          <FormLineInput value={data[`rig${letter}_op_id_no`]} onChange={(v) => update(`rig${letter}_op_id_no`, v)} />
        </div>
      </div>
    </div>
  );
}

// 5-PAGE RIG REGISTRATION SHEETS (Option 1: Full-Page Uniform Balancing)
export function RigRegistrationPages({ data, update }: FormProps) {
  return (
    <>
      {/* ==================================================== */}
      {/* PAGE 1: HEADER, SECTION 1, AND SECTION 2 (OWNER A)   */}
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
                ഡ്രില്ലിംഗ് ഏജൻസി/സ്ഥാപനവും ഡ്രില്ലിംഗ് റിഗ്ഗും രജിസ്റ്റർ ചെയ്യുന്നതിനുള്ള അപേക്ഷാ ഫോറം
              </div>
            </div>
          </div>

          {/* Section 1 */}
          <div className="space-y-2 min-w-0">
            <h2 className="font-bold text-sm sm:text-base underline">1. സ്ഥാപനം / ഏജൻസിയുടെ വിവരം</h2>

            <div className="space-y-2 pl-1 min-w-0">
              <div className="flex flex-wrap sm:flex-nowrap items-baseline gap-2 min-w-0">
                <span className="font-bold whitespace-nowrap shrink-0">എ. ഏജൻസിയുടെ പേര് :</span>
                <FormLineInput value={data.agencyName} onChange={(v) => update("agencyName", v)} />
              </div>

              <div className="space-y-1.5 min-w-0">
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

          {/* Section 2: Owner A */}
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
                    <FormLineInput value={data.ownerA_name} onChange={(v) => update("ownerA_name", v)} />
                  </div>

                  <div className="flex flex-wrap sm:flex-nowrap items-baseline gap-2 min-w-0">
                    <span className="font-bold whitespace-nowrap shrink-0">2. നിലവിലെ മേൽവിലാസം :</span>
                    <FormLineInput value={data.ownerA_curr_address} onChange={(v) => update("ownerA_curr_address", v)} />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 items-baseline pl-2 min-w-0">
                    <div className="flex items-baseline gap-1 min-w-0">
                      <span className="font-semibold text-xs whitespace-nowrap shrink-0">വില്ലേജ് :</span>
                      <FormLineInput value={data.ownerA_curr_village} onChange={(v) => update("ownerA_curr_village", v)} />
                    </div>
                    <div className="flex items-baseline gap-1 min-w-0">
                      <span className="font-semibold text-xs whitespace-nowrap shrink-0">താലൂക്ക് :</span>
                      <FormLineInput value={data.ownerA_curr_taluk} onChange={(v) => update("ownerA_curr_taluk", v)} />
                    </div>
                  </div>

                  <div className="flex flex-wrap sm:flex-nowrap items-baseline gap-2 pl-2 min-w-0">
                    <span className="font-semibold text-xs shrink sm:whitespace-nowrap">പഞ്ചായത്ത് :</span>
                    <FormLineInput value={data.ownerA_curr_panchayath} onChange={(v) => update("ownerA_curr_panchayath", v)} />
                  </div>

                  <div className="flex flex-wrap sm:flex-nowrap items-baseline gap-2 pl-2 min-w-0">
                    <span className="font-semibold text-xs whitespace-nowrap shrink-0">ജില്ല :</span>
                    <FormLineInput value={data.ownerA_curr_district} onChange={(v) => update("ownerA_curr_district", v)} />
                  </div>

                  <div className="flex flex-wrap items-center gap-2 pl-2 min-w-0">
                    <span className="font-semibold text-xs shrink-0">പിൻ കോഡ് :</span>
                    <PinCodeGrid value={data.ownerA_curr_pincode} onChange={(v) => update("ownerA_curr_pincode", v)} />
                  </div>
                </div>

                <PhotoBox photoUrl={data.ownerA_curr_photo} onPhotoChange={(url) => update("ownerA_curr_photo", url)} />
              </div>

              {/* Permanent */}
              <div className="space-y-2 pt-2 border-t border-dashed border-gray-400 min-w-0">
                <div className="flex flex-wrap sm:flex-nowrap items-baseline gap-2 min-w-0">
                  <span className="font-bold whitespace-nowrap shrink-0">3. സ്ഥിരം മേൽവിലാസം :</span>
                  <FormLineInput value={data.ownerA_perm_address} onChange={(v) => update("ownerA_perm_address", v)} />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 items-baseline pl-2 min-w-0">
                  <div className="flex items-baseline gap-1 min-w-0">
                    <span className="font-semibold text-xs whitespace-nowrap shrink-0">വില്ലേജ് :</span>
                    <FormLineInput value={data.ownerA_perm_village} onChange={(v) => update("ownerA_perm_village", v)} />
                  </div>
                  <div className="flex items-baseline gap-1 min-w-0">
                    <span className="font-semibold text-xs whitespace-nowrap shrink-0">താലൂക്ക് :</span>
                    <FormLineInput value={data.ownerA_perm_taluk} onChange={(v) => update("ownerA_perm_taluk", v)} />
                  </div>
                </div>

                <div className="flex flex-wrap sm:flex-nowrap items-baseline gap-2 pl-2 min-w-0">
                  <span className="font-semibold text-xs shrink sm:whitespace-nowrap">പഞ്ചായത്ത് :</span>
                  <FormLineInput value={data.ownerA_perm_panchayath} onChange={(v) => update("ownerA_perm_panchayath", v)} />
                </div>

                <div className="flex flex-wrap sm:flex-nowrap items-baseline gap-2 pl-2 min-w-0">
                  <span className="font-semibold text-xs whitespace-nowrap shrink-0">ജില്ല :</span>
                  <FormLineInput value={data.ownerA_perm_district} onChange={(v) => update("ownerA_perm_district", v)} />
                </div>

                <div className="flex flex-wrap items-center gap-2 pl-2 min-w-0">
                  <span className="font-semibold text-xs shrink-0">പിൻ കോഡ് :</span>
                  <PinCodeGrid value={data.ownerA_perm_pincode} onChange={(v) => update("ownerA_perm_pincode", v)} />
                </div>
              </div>

              {/* ID, PAN, Exp, Nominee */}
              <div className="space-y-2 pt-2 border-t border-dashed border-gray-400 min-w-0">
                <div className="flex flex-wrap items-center gap-2 sm:gap-4 min-w-0">
                  <span className="font-bold whitespace-nowrap shrink-0">4. തിരിച്ചറിയൽരേഖ :</span>
                  <label className="flex items-center gap-1 cursor-pointer shrink-0">
                    <input
                      type="radio"
                      name="ownerA_id_type"
                      checked={data.ownerA_id_type === "Election"}
                      onChange={() => update("ownerA_id_type", "Election")}
                      className="border-black"
                    />
                    <span className="border border-black px-2 py-0.5 font-semibold text-xs">ഇലക്ഷൻ കാർഡ്</span>
                  </label>
                  <label className="flex items-center gap-1 cursor-pointer shrink-0">
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

                <div className="flex flex-wrap sm:flex-nowrap items-baseline gap-2 min-w-0">
                  <span className="font-bold whitespace-nowrap shrink-0">5. തിരിച്ചറിയൽ രേഖയുടെ നമ്പർ :</span>
                  <FormLineInput value={data.ownerA_id_no} onChange={(v) => update("ownerA_id_no", v)} />
                </div>

                <div className="flex flex-wrap items-center gap-2 sm:gap-3 min-w-0">
                  <span className="font-bold whitespace-nowrap shrink-0">6. പാൻ നമ്പർ :</span>
                  <PanGrid value={data.ownerA_pan} onChange={(v) => update("ownerA_pan", v)} />
                </div>

                <div className="flex flex-wrap sm:flex-nowrap items-baseline gap-2 min-w-0">
                  <span className="font-bold shrink">
                    7. കേരളത്തിലെ കുഴൽ കിണർ നിർമ്മാണ മേഖലയിലെ പ്രവർത്തിപരിചയം :
                  </span>
                  <FormLineInput value={data.ownerA_exp} onChange={(v) => update("ownerA_exp", v)} width="w-20" />
                  <span className="font-bold">വർഷം</span>
                </div>

                <div className="flex flex-wrap sm:flex-nowrap items-baseline gap-2 min-w-0">
                  <span className="font-bold whitespace-nowrap shrink-0">8. നോമിനി :</span>
                  <FormLineInput value={data.ownerA_nominee} onChange={(v) => update("ownerA_nominee", v)} />
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
            <p className="font-bold border-t border-dotted border-black pt-1">അപേക്ഷകന്റെ / മാനേജിംഗ് പാർട്ണറുടെ ഒപ്പും പേരും</p>
          </div>
        </div>

        <div className="text-[10px] text-gray-400 text-right font-sans pt-1 border-t border-gray-100 print:hidden">
          പേജ് 1 / 5
        </div>
      </div>

      {/* ==================================================== */}
      {/* PAGE 2: PARTNERS (B & C)                              */}
      {/* ==================================================== */}
      <div className="official-form-page bg-white p-5 sm:p-8 border border-gray-300 shadow-md text-black text-xs sm:text-sm font-serif print:border-none print:shadow-none print:p-0 print:max-w-none box-border relative mb-6 print:mb-0 flex flex-col justify-between min-h-[268mm] print:min-h-[268mm]">
        <div className="print-page-badge absolute top-2 right-3 text-[10px] text-gray-500 font-sans font-medium bg-gray-100 px-2 py-0.5 rounded border print:hidden">
          പേജ് 2 / 5
        </div>

        <div className="space-y-4">
          <div className="text-center space-y-0.5 border-b border-black pb-1.5">
            <h2 className="font-bold text-sm sm:text-base">
              2. സ്ഥാപനം / ഏജൻസി നടത്തിപ്പുകാരുടെ വിവരം (തുടർച്ച)
            </h2>
            <p className="text-xs text-gray-600 italic">
              (പാർട്ട്ണർഷിപ്പ് സ്ഥാപനമാണെങ്കിൽ മാത്രം പൂരിപ്പിക്കുക / For Partnership Agencies only)
            </p>
          </div>

          <PartnerCard
            letter="B"
            title="(പാർട്ട്ണർഷിപ്പ് ഉണ്ടെങ്കിൽ രണ്ടാമത്തെ വ്യക്തിയുടെ വിവരം)"
            data={data}
            update={update}
          />

          <PartnerCard
            letter="C"
            title="(പാർട്ട്ണർഷിപ്പ് ഉണ്ടെങ്കിൽ മൂന്നാമത്തെ വ്യക്തിയുടെ വിവരം)"
            data={data}
            update={update}
          />
        </div>

        {/* Partnership Undertaking Box (Fills Page 2 gracefully) */}
        <div className="border border-black p-3 bg-gray-50/50 space-y-2 text-xs mt-3">
          <div className="font-bold text-center underline">പങ്കാളിത്ത സാക്ഷ്യപ്പെടുത്തൽ (Partnership Undertaking)</div>
          <p className="text-justify leading-relaxed">
            ഞങ്ങൾ മേൽ ഒപ്പുവെച്ചിട്ടുള്ള പങ്കാളികൾ ഈ അപേക്ഷാ ഫോറത്തിൽ നൽകിയിട്ടുള്ള എല്ലാ വിവരങ്ങളും പരിശോധിച്ച് ബോധ്യപ്പെട്ടതാണെന്നും, 
            സ്ഥാപനത്തിന്റേതായി സമർപ്പിച്ചിട്ടുള്ള വിവരങ്ങൾ പൂർണ്ണമായും സത്യസന്ധമാണെന്നും ഇതിനാൽ സാക്ഷ്യപ്പെടുത്തുന്നു.
          </p>
          <div className="flex justify-between items-end pt-2">
            <div className="space-y-0.5">
              <p><span className="font-bold">സ്ഥലം :</span> {data.place || "......................."}</p>
              <p><span className="font-bold">തീയതി :</span> {data.date || "......................."}</p>
            </div>
            <div className="text-center w-52">
              <p className="font-bold border-t border-dotted border-black pt-1">മാനേജിംഗ് പാർട്ണറുടെ ഒപ്പും പേരും</p>
            </div>
          </div>
        </div>

        <div className="text-[10px] text-gray-400 text-right font-sans pt-1 border-t border-gray-100 print:hidden">
          പേജ് 2 / 5
        </div>
      </div>

      {/* ==================================================== */}
      {/* PAGE 3: RIG A (ALL) + RIG B (ALL) - NO SPLIT         */}
      {/* ==================================================== */}
      <div className="official-form-page bg-white p-5 sm:p-8 border border-gray-300 shadow-md text-black text-xs sm:text-sm font-serif print:border-none print:shadow-none print:p-0 print:max-w-none box-border relative mb-6 print:mb-0 flex flex-col justify-between min-h-[268mm] print:min-h-[268mm]">
        <div className="print-page-badge absolute top-2 right-3 text-[10px] text-gray-500 font-sans font-medium bg-gray-100 px-2 py-0.5 rounded border print:hidden">
          പേജ് 3 / 5
        </div>

        <div className="space-y-2.5">
          <h2 className="font-bold text-sm sm:text-base underline">
            3. ഡ്രില്ലിംഗ് റിഗ്ഗുകളുടെ വിവരം (പരമാവധി മൂന്ന് എണ്ണം)
          </h2>

          {/* Rig A (Full) */}
          <RigSection letter="A" data={data} update={update} />

          {/* Rig B (Full) */}
          <RigSection letter="B" data={data} update={update} />
        </div>

        <div className="text-[10px] text-gray-400 text-right font-sans pt-1 border-t border-gray-100 print:hidden">
          പേജ് 3 / 5
        </div>
      </div>

      {/* ==================================================== */}
      {/* PAGE 4: RIG C + DECLARATION + ENCLOSURES CHECKLIST   */}
      {/* ==================================================== */}
      <div className="official-form-page bg-white p-5 sm:p-8 border border-gray-300 shadow-md text-black text-xs sm:text-sm font-serif print:border-none print:shadow-none print:p-0 print:max-w-none box-border relative mb-6 print:mb-0 flex flex-col justify-between min-h-[268mm] print:min-h-[268mm]">
        <div className="print-page-badge absolute top-2 right-3 text-[10px] text-gray-500 font-sans font-medium bg-gray-100 px-2 py-0.5 rounded border print:hidden">
          പേജ് 4 / 5
        </div>

        <div className="space-y-3">
          <h2 className="font-bold text-sm sm:text-base underline">
            3. ഡ്രില്ലിംഗ് റിഗ്ഗുകളുടെ വിവരം - റിഗ് C (Rig C)
          </h2>

          <RigSection letter="C" data={data} update={update} />

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

          {/* Statutory Checklist of Enclosures (Fills Page 4 uniformly) */}
          <div className="border border-black p-3 bg-gray-50/50 space-y-2 text-xs mt-2">
            <div className="font-bold underline text-center">
              അപേക്ഷയോടൊപ്പം ഉള്ളടക്കം ചെയ്യേണ്ട രേഖകളുടെ പരിശോധനാ പട്ടിക (Checklist of Enclosures)
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1.5 pl-2 text-[11px]">
              <label className="flex items-center gap-1.5">
                <input type="checkbox" defaultChecked className="border-black w-3.5 h-3.5" />
                <span>1. വാഹനത്തിന്റെ ആർ.സി. ബുക്കിന്റെ പകർപ്പ് (RC Book)</span>
              </label>
              <label className="flex items-center gap-1.5">
                <input type="checkbox" defaultChecked className="border-black w-3.5 h-3.5" />
                <span>2. കംപ്രസറിന്റെ ഇൻവോയ്സ് / ഫിറ്റ്നസ് രേഖ</span>
              </label>
              <label className="flex items-center gap-1.5">
                <input type="checkbox" defaultChecked className="border-black w-3.5 h-3.5" />
                <span>3. ജനറേറ്റർ വിവരങ്ങൾ & ഇൻവോയ്സ്</span>
              </label>
              <label className="flex items-center gap-1.5">
                <input type="checkbox" defaultChecked className="border-black w-3.5 h-3.5" />
                <span>4. ഓപ്പറേറ്ററുടെ തിരിച്ചറിയൽ രേഖയുടെ പകർപ്പ്</span>
              </label>
              <label className="flex items-center gap-1.5">
                <input type="checkbox" defaultChecked className="border-black w-3.5 h-3.5" />
                <span>5. അപേക്ഷകന്റെ / പങ്കാളികളുടെ തിരിച്ചറിയൽ രേഖകൾ</span>
              </label>
              <label className="flex items-center gap-1.5">
                <input type="checkbox" defaultChecked className="border-black w-3.5 h-3.5" />
                <span>6. അപേക്ഷാ ഫീസ് അടച്ച ചലാൻ രസീത്</span>
              </label>
              <label className="flex items-center gap-1.5">
                <input type="checkbox" defaultChecked className="border-black w-3.5 h-3.5" />
                <span>7. പാസ്പോർട്ട് സൈസ് ഫോട്ടോകൾ</span>
              </label>
              <label className="flex items-center gap-1.5">
                <input type="checkbox" defaultChecked className="border-black w-3.5 h-3.5" />
                <span>8. തദ്ദേശ സ്വയംഭരണ സ്ഥാപനത്തിന്റെ ലൈസൻസ്</span>
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
                    <td className="border-r border-black p-1.5">അപേക്ഷാ ഫോറവും അനുബന്ധ രേഖകളും പരിശോധിച്ചു</td>
                    <td className="p-1.5 text-center font-semibold text-emerald-800">തൃപ്തികരം / രേഖകൾ ശരിയാണ്</td>
                  </tr>
                  <tr className="border-b border-black">
                    <td className="border-r border-black p-1.5 text-center">2</td>
                    <td className="border-r border-black p-1.5">വാഹനത്തിന്റെ ആർ.സി., നികുതി, ഇൻഷുറൻസ് എന്നിവ പരിശോധിച്ചു</td>
                    <td className="p-1.5 text-center font-semibold text-emerald-800">തൃപ്തികരം</td>
                  </tr>
                  <tr className="border-b border-black">
                    <td className="border-r border-black p-1.5 text-center">3</td>
                    <td className="border-r border-black p-1.5">കംപ്രസർ & ജനറേറ്റർ കാര്യക്ഷമതാ പരിശോധന</td>
                    <td className="p-1.5 text-center font-semibold text-emerald-800">തൃപ്തികരം</td>
                  </tr>
                  <tr className="border-b border-black">
                    <td className="border-r border-black p-1.5 text-center">4</td>
                    <td className="border-r border-black p-1.5">ഡ്രില്ലിംഗ് യന്ത്ര ഓപ്പറേറ്ററുടെ യോഗ്യതയും പരിചയവും</td>
                    <td className="p-1.5 text-center font-semibold text-emerald-800">തൃപ്തികരം</td>
                  </tr>
                  <tr>
                    <td className="border-r border-black p-1.5 text-center">5</td>
                    <td className="border-r border-black p-1.5">അപേക്ഷാ ഫീസ് അടച്ച വിവരങ്ങൾ</td>
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
                <FormLineInput value={data.office_recommendation || "രജിസ്ട്രേഷൻ അനുവദിക്കാവുന്നതാണ് (Recommended for Registration)"} onChange={(v) => update("office_recommendation", v)} />
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
              <p className="text-xs font-bold underline">അപേക്ഷാ രസീത് (ACKNOWLEDGMENT & FEE RECEIPT)</p>
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

              <div className="space-y-1 pt-1">
                <span className="font-bold block">5. അപേക്ഷാ ഇനങ്ങൾ :</span>
                <div className="flex flex-wrap items-center gap-6 pl-3">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={!!data.receipt_agency_reg_check}
                      onChange={(e) => update("receipt_agency_reg_check", e.target.checked)}
                      className="w-4 h-4 border border-black"
                    />
                    <span className="text-xs font-semibold">ഏജൻസി രജിസ്ട്രേഷൻ</span>
                  </label>

                  <div className="flex items-center gap-3">
                    <span className="text-xs font-semibold">റിഗ് രജിസ്ട്രേഷൻ :</span>
                    <label className="flex items-center gap-1 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={!!data.receipt_rig1_check}
                        onChange={(e) => update("receipt_rig1_check", e.target.checked)}
                        className="w-4 h-4 border border-black"
                      />
                      <span className="text-xs font-mono font-bold">റിഗ് 1</span>
                    </label>
                    <label className="flex items-center gap-1 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={!!data.receipt_rig2_check}
                        onChange={(e) => update("receipt_rig2_check", e.target.checked)}
                        className="w-4 h-4 border border-black"
                      />
                      <span className="text-xs font-mono font-bold">റിഗ് 2</span>
                    </label>
                    <label className="flex items-center gap-1 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={!!data.receipt_rig3_check}
                        onChange={(e) => update("receipt_rig3_check", e.target.checked)}
                        className="w-4 h-4 border border-black"
                      />
                      <span className="text-xs font-mono font-bold">റിഗ് 3</span>
                    </label>
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
