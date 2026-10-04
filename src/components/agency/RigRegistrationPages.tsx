"use client";

import React from "react";
import {
  PinCodeGrid,
  PanGrid,
  PhotoBox,
  FormLineInput,
  FormDateInput,
  OptionBox,
  SquareCheckbox,
} from "./FormInputComponents";

interface FormProps {
  data: Record<string, any>;
  update: (k: string, v: any) => void;
}

export function RigRegistrationPages({ data, update }: FormProps) {
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
      {/* PAGE 1: HEADER, SECTION 1 (AGENCY), SECTION 2 (OPERATOR / PROPRIETOR A)   */}
      {/* ========================================================================= */}
      <div className="official-form-page bg-white p-6 sm:p-10 border border-gray-300 shadow-md relative box-border min-h-[270mm] flex flex-col justify-between">
        <div className="print-page-badge absolute top-3 right-4 text-[10px] text-gray-500 font-sans bg-gray-100 px-2 py-0.5 rounded border print:hidden">
          പേജ് 1 / 5
        </div>

        <div className="space-y-3">
          {/* Header */}
          <div className="text-center space-y-1">
            <h1 className="text-base sm:text-lg font-bold">കേരള സർക്കാർ ഭൂജല അതോറിറ്റി</h1>
            <p className="text-xs font-normal">(കേരള സർക്കാരിന്റെ 2002 ലെ ആക്ട് 19 പ്രകാരം നിലവിൽ വന്നത്)</p>
            <p className="text-[10px] font-sans text-gray-800">
              (Order No.G.O.(MS)No.04/2023/WRD Dated 24.01.2023 & Order No.DGWD/306/2022/T4 Dated 21.03.2023)
            </p>
            <div className="pt-1">
              <p className="font-bold underline text-sm sm:text-base leading-snug">
                ഡ്രില്ലിംഗ് ഏജൻസി/സ്ഥാപനവും ഡ്രില്ലിംഗ് റിഗ്ഗും രജിസ്റ്റർ<br />
                ചെയ്യുന്നതിനുള്ള
              </p>
            </div>
            <div className="pt-1.5 flex justify-center">
              <div className="border border-black px-8 py-1 font-bold text-sm sm:text-base w-full max-w-xl text-center bg-white">
                അപേക്ഷാ ഫോറം
              </div>
            </div>
          </div>

          {/* Section 1 */}
          <div className="space-y-1.5 pt-1">
            <h2 className="font-bold text-sm sm:text-base">1. സ്ഥാപനം / ഏജൻസിയുടെ വിവരം</h2>

            <div className="space-y-1 pl-1">
              <div className="flex items-baseline gap-2">
                <span className="font-semibold whitespace-nowrap shrink-0">എ. ഏജൻസിയുടെ പേര്</span>
                <FormLineInput value={data.agencyName} onChange={(v) => update("agencyName", v)} />
              </div>

              <div className="space-y-1">
                <div className="flex items-baseline gap-2">
                  <span className="font-semibold whitespace-nowrap shrink-0">ബി. മേൽവിലാസം</span>
                  <FormLineInput value={data.address} onChange={(v) => update("address", v)} />
                </div>
                <div className="pl-4">
                  <FormLineInput value={data.address_line2 || ""} onChange={(v) => update("address_line2", v)} />
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
                    <span className="font-semibold text-xs shrink-0 leading-tight">കോർപ്പറേഷൻ/മുനിസിപ്പാലിറ്റി/<br className="hidden sm:inline"/>പഞ്ചായത്ത് :</span>
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
                <span className="font-semibold whitespace-nowrap shrink-0">സി. ജി.എസ്സ്.ടി. നമ്പർ :</span>
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
                <span className="font-semibold shrink-0">ഡി. തദ്ദേശ സ്വയംഭരണ സ്ഥാപനം നൽകിയ രജിസ്ട്രേഷൻ നമ്പർ</span>
                <FormLineInput value={data.lsgdRegNo} onChange={(v) => update("lsgdRegNo", v)} />
              </div>
            </div>
          </div>

          <hr className="border-black my-2" />

          {/* Section 2: Proprietor / Operator A */}
          <div className="space-y-1.5">
            <h2 className="font-bold text-sm sm:text-base">2. സ്ഥാപനം / ഏജൻസി നടത്തിപ്പുകാരുടെ വിവരം</h2>

            <div className="flex items-start gap-3">
              <span className="border border-black px-2 py-0.5 font-bold text-xs inline-block shrink-0 mt-1 bg-white">
                എ.
              </span>
              <div className="flex-1 space-y-1 min-w-0">
                <div className="flex items-baseline gap-2">
                  <span className="font-semibold whitespace-nowrap shrink-0">1. പേര് :</span>
                  <FormLineInput value={data.ownerA_name} onChange={(v) => update("ownerA_name", v)} />
                </div>

                <div className="flex items-baseline gap-2">
                  <span className="font-semibold whitespace-nowrap shrink-0">2. നിലവിലെ മേൽവിലാസം :</span>
                  <FormLineInput value={data.ownerA_curr_address} onChange={(v) => update("ownerA_curr_address", v)} />
                </div>

                {/* Table Layout: Address Details on Left, Photo Box on Right */}
                <div className="border border-black flex flex-row min-w-0 mt-1 bg-white">
                  <div className="flex-1 p-2 space-y-1 border-r border-black">
                    <div className="flex items-baseline gap-1">
                      <span className="font-semibold text-xs whitespace-nowrap shrink-0">വില്ലേജ് :</span>
                      <FormLineInput value={data.ownerA_curr_village} onChange={(v) => update("ownerA_curr_village", v)} />
                    </div>
                    <div className="flex items-baseline gap-1">
                      <span className="font-semibold text-xs whitespace-nowrap shrink-0">താലൂക്ക് :</span>
                      <FormLineInput value={data.ownerA_curr_taluk} onChange={(v) => update("ownerA_curr_taluk", v)} />
                    </div>
                    <div className="flex items-baseline gap-1">
                      <span className="font-semibold text-xs shrink-0 leading-tight">കോർപ്പറേഷൻ/മുനിസിപ്പാലിറ്റി/പഞ്ചായത്ത് :</span>
                      <FormLineInput value={data.ownerA_curr_panchayath} onChange={(v) => update("ownerA_curr_panchayath", v)} />
                    </div>
                    <div className="flex items-baseline gap-1">
                      <span className="font-semibold text-xs whitespace-nowrap shrink-0">ജില്ല :</span>
                      <FormLineInput value={data.ownerA_curr_district} onChange={(v) => update("ownerA_curr_district", v)} />
                    </div>
                    <div className="flex items-center gap-1 pt-0.5">
                      <span className="font-semibold text-xs whitespace-nowrap shrink-0">പിൻ കോഡ് :</span>
                      <PinCodeGrid value={data.ownerA_curr_pincode} onChange={(v) => update("ownerA_curr_pincode", v)} />
                    </div>
                  </div>

                  <div className="w-28 sm:w-32 flex items-center justify-center p-1 bg-gray-50/50 shrink-0">
                    <PhotoBox photoUrl={data.ownerA_curr_photo} onPhotoChange={(url) => update("ownerA_curr_photo", url)} />
                  </div>
                </div>

                <div className="space-y-1 pt-1">
                  <div className="flex items-baseline gap-2">
                    <span className="font-semibold whitespace-nowrap shrink-0">3. സ്ഥിരം മേൽവിലാസം :</span>
                    <FormLineInput value={data.ownerA_perm_address} onChange={(v) => update("ownerA_perm_address", v)} />
                  </div>

                  <div className="grid grid-cols-2 gap-4 items-baseline pl-4">
                    <div className="flex items-baseline gap-1">
                      <span className="font-semibold whitespace-nowrap shrink-0">വില്ലേജ് :</span>
                      <FormLineInput value={data.ownerA_perm_village} onChange={(v) => update("ownerA_perm_village", v)} />
                    </div>
                    <div className="flex items-baseline gap-1">
                      <span className="font-semibold whitespace-nowrap shrink-0">താലൂക്ക്</span>
                      <FormLineInput value={data.ownerA_perm_taluk} onChange={(v) => update("ownerA_perm_taluk", v)} />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 items-baseline pl-4">
                    <div className="flex items-baseline gap-1">
                      <span className="font-semibold text-xs shrink-0 leading-tight">കോർപ്പറേഷൻ/മുനിസിപ്പാലിറ്റി/പഞ്ചായത്ത് :</span>
                      <FormLineInput value={data.ownerA_perm_panchayath} onChange={(v) => update("ownerA_perm_panchayath", v)} />
                    </div>
                    <div className="flex items-baseline gap-1">
                      <span className="font-semibold whitespace-nowrap shrink-0">ജില്ല</span>
                      <FormLineInput value={data.ownerA_perm_district} onChange={(v) => update("ownerA_perm_district", v)} />
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pl-4">
                    <span className="font-semibold whitespace-nowrap shrink-0">പിൻ കോഡ് :</span>
                    <PinCodeGrid value={data.ownerA_perm_pincode} onChange={(v) => update("ownerA_perm_pincode", v)} />
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3 pt-1">
                  <span className="font-semibold whitespace-nowrap shrink-0">4. തിരിച്ചറിയൽരേഖ</span>
                  <OptionBox
                    label="ഇലക്ഷൻ കാർഡ്"
                    selected={data.ownerA_id_type === "Election"}
                    onToggle={() => update("ownerA_id_type", data.ownerA_id_type === "Election" ? "" : "Election")}
                  />
                  <OptionBox
                    label="ആധാർ കാർഡ്"
                    selected={data.ownerA_id_type === "Aadhaar"}
                    onToggle={() => update("ownerA_id_type", data.ownerA_id_type === "Aadhaar" ? "" : "Aadhaar")}
                  />
                </div>

                <div className="flex items-baseline gap-2">
                  <span className="font-semibold whitespace-nowrap shrink-0">5. തിരിച്ചറിയൽ രേഖയുടെ നമ്പർ :</span>
                  <FormLineInput value={data.ownerA_id_no} onChange={(v) => update("ownerA_id_no", v)} />
                </div>

                <div className="flex items-center gap-3">
                  <span className="font-semibold whitespace-nowrap shrink-0">6. പാൻ നമ്പർ :</span>
                  <PanGrid value={data.ownerA_pan} onChange={(v) => update("ownerA_pan", v)} />
                </div>

                <div className="flex items-baseline gap-2">
                  <span className="font-semibold whitespace-nowrap shrink-0">7. കേരളത്തിലെ കുഴൽ കിണർ നിർമ്മാണ മേഖലയിലെ പ്രവർത്തിപരിചയം :</span>
                  <FormLineInput value={data.ownerA_exp} onChange={(v) => update("ownerA_exp", v)} width="w-20 text-center" />
                  <span className="font-semibold shrink-0">വർഷം</span>
                </div>

                <div className="flex items-baseline gap-2">
                  <span className="font-semibold whitespace-nowrap shrink-0">8. നോമിനി :</span>
                  <FormLineInput value={data.ownerA_nominee} onChange={(v) => update("ownerA_nominee", v)} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* PAGE 2: PARTNER B & PARTNER C (PARTNERSHIP DETAILS)                       */}
      {/* ========================================================================= */}
      <div className="official-form-page bg-white p-6 sm:p-10 border border-gray-300 shadow-md relative box-border min-h-[270mm] flex flex-col justify-between">
        <div className="print-page-badge absolute top-3 right-4 text-[10px] text-gray-500 font-sans bg-gray-100 px-2 py-0.5 rounded border print:hidden">
          പേജ് 2 / 5
        </div>

        <div className="space-y-4">
          {/* Partner B */}
          <div className="space-y-1.5">
            <div className="text-center font-normal text-xs text-gray-800 italic">
              (പാർട്ണർഷിപ്പ് ഉണ്ടെങ്കിൽ രണ്ടാമത്തെ വ്യക്തിയുടെ വിവരം)
            </div>

            <div className="flex items-start gap-3">
              <span className="border border-black px-2 py-0.5 font-bold text-xs inline-block shrink-0 mt-1 bg-white">
                ബി.
              </span>
              <div className="flex-1 space-y-1 min-w-0">
                <div className="flex items-baseline gap-2">
                  <span className="font-semibold whitespace-nowrap shrink-0">1. പേര് :</span>
                  <FormLineInput value={data.ownerB_name} onChange={(v) => update("ownerB_name", v)} />
                </div>

                <div className="flex items-baseline gap-2">
                  <span className="font-semibold whitespace-nowrap shrink-0">2. നിലവിലെ മേൽവിലാസം :</span>
                  <FormLineInput value={data.ownerB_curr_address} onChange={(v) => update("ownerB_curr_address", v)} />
                </div>

                {/* Table Layout: Address Details on Left, Photo Box on Right */}
                <div className="border border-black flex flex-row min-w-0 mt-1 bg-white">
                  <div className="flex-1 p-2 space-y-1 border-r border-black">
                    <div className="flex items-baseline gap-1">
                      <span className="font-semibold text-xs whitespace-nowrap shrink-0">വില്ലേജ് :</span>
                      <FormLineInput value={data.ownerB_curr_village} onChange={(v) => update("ownerB_curr_village", v)} />
                    </div>
                    <div className="flex items-baseline gap-1">
                      <span className="font-semibold text-xs whitespace-nowrap shrink-0">താലൂക്ക് :</span>
                      <FormLineInput value={data.ownerB_curr_taluk} onChange={(v) => update("ownerB_curr_taluk", v)} />
                    </div>
                    <div className="flex items-baseline gap-1">
                      <span className="font-semibold text-xs shrink-0 leading-tight">പഞ്ചായത്ത് :</span>
                      <FormLineInput value={data.ownerB_curr_panchayath} onChange={(v) => update("ownerB_curr_panchayath", v)} />
                    </div>
                    <div className="flex items-baseline gap-1">
                      <span className="font-semibold text-xs whitespace-nowrap shrink-0">ജില്ല :</span>
                      <FormLineInput value={data.ownerB_curr_district} onChange={(v) => update("ownerB_curr_district", v)} />
                    </div>
                    <div className="flex items-center gap-1 pt-0.5">
                      <span className="font-semibold text-xs whitespace-nowrap shrink-0">പിൻ കോഡ് :</span>
                      <PinCodeGrid value={data.ownerB_curr_pincode} onChange={(v) => update("ownerB_curr_pincode", v)} />
                    </div>
                  </div>

                  <div className="w-28 sm:w-32 flex items-center justify-center p-1 bg-gray-50/50 shrink-0">
                    <PhotoBox photoUrl={data.ownerB_curr_photo} onPhotoChange={(url) => update("ownerB_curr_photo", url)} />
                  </div>
                </div>

                <div className="space-y-1 pt-1">
                  <div className="flex items-baseline gap-2">
                    <span className="font-semibold whitespace-nowrap shrink-0">3. സ്ഥിരം മേൽവിലാസം :</span>
                    <FormLineInput value={data.ownerB_perm_address} onChange={(v) => update("ownerB_perm_address", v)} />
                  </div>

                  <div className="grid grid-cols-2 gap-4 items-baseline pl-4">
                    <div className="flex items-baseline gap-1">
                      <span className="font-semibold whitespace-nowrap shrink-0">വില്ലേജ് :</span>
                      <FormLineInput value={data.ownerB_perm_village} onChange={(v) => update("ownerB_perm_village", v)} />
                    </div>
                    <div className="flex items-baseline gap-1">
                      <span className="font-semibold whitespace-nowrap shrink-0">താലൂക്ക്</span>
                      <FormLineInput value={data.ownerB_perm_taluk} onChange={(v) => update("ownerB_perm_taluk", v)} />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 items-baseline pl-4">
                    <div className="flex items-baseline gap-1">
                      <span className="font-semibold text-xs shrink-0 leading-tight">പഞ്ചായത്ത് :</span>
                      <FormLineInput value={data.ownerB_perm_panchayath} onChange={(v) => update("ownerB_perm_panchayath", v)} />
                    </div>
                    <div className="flex items-baseline gap-1">
                      <span className="font-semibold whitespace-nowrap shrink-0">ജില്ല</span>
                      <FormLineInput value={data.ownerB_perm_district} onChange={(v) => update("ownerB_perm_district", v)} />
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pl-4">
                    <span className="font-semibold whitespace-nowrap shrink-0">പിൻ കോഡ് :</span>
                    <PinCodeGrid value={data.ownerB_perm_pincode} onChange={(v) => update("ownerB_perm_pincode", v)} />
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3 pt-1">
                  <span className="font-semibold whitespace-nowrap shrink-0">4. തിരിച്ചറിയൽരേഖ</span>
                  <OptionBox
                    label="ഇലക്ഷൻ കാർഡ്"
                    selected={data.ownerB_id_type === "Election"}
                    onToggle={() => update("ownerB_id_type", data.ownerB_id_type === "Election" ? "" : "Election")}
                  />
                  <OptionBox
                    label="ആധാർ കാർഡ്"
                    selected={data.ownerB_id_type === "Aadhaar"}
                    onToggle={() => update("ownerB_id_type", data.ownerB_id_type === "Aadhaar" ? "" : "Aadhaar")}
                  />
                </div>

                <div className="flex items-baseline gap-2">
                  <span className="font-semibold whitespace-nowrap shrink-0">5. തിരിച്ചറിയൽ രേഖയുടെ നമ്പർ :</span>
                  <FormLineInput value={data.ownerB_id_no} onChange={(v) => update("ownerB_id_no", v)} />
                </div>

                <div className="flex items-center gap-3">
                  <span className="font-semibold whitespace-nowrap shrink-0">6. പാൻ നമ്പർ :</span>
                  <PanGrid value={data.ownerB_pan} onChange={(v) => update("ownerB_pan", v)} />
                </div>

                <div className="flex items-baseline gap-2">
                  <span className="font-semibold whitespace-nowrap shrink-0">7. നോമിനി :</span>
                  <FormLineInput value={data.ownerB_nominee} onChange={(v) => update("ownerB_nominee", v)} />
                </div>
              </div>
            </div>
          </div>

          <hr className="border-black my-2" />

          {/* Partner C */}
          <div className="space-y-1.5">
            <div className="text-center font-normal text-xs text-gray-800 italic">
              (പാർട്ണർഷിപ്പ് ഉണ്ടെങ്കിൽ മൂന്നാമത്തെ വ്യക്തിയുടെ വിവരം)
            </div>

            <div className="flex items-start gap-3">
              <span className="border border-black px-2 py-0.5 font-bold text-xs inline-block shrink-0 mt-1 bg-white">
                സി.
              </span>
              <div className="flex-1 space-y-1 min-w-0">
                <div className="flex items-baseline gap-2">
                  <span className="font-semibold whitespace-nowrap shrink-0">1. പേര് :</span>
                  <FormLineInput value={data.ownerC_name} onChange={(v) => update("ownerC_name", v)} />
                </div>

                <div className="flex items-baseline gap-2">
                  <span className="font-semibold whitespace-nowrap shrink-0">2. നിലവിലെ മേൽവിലാസം :</span>
                  <FormLineInput value={data.ownerC_curr_address} onChange={(v) => update("ownerC_curr_address", v)} />
                </div>

                {/* Table Layout: Address Details on Left, Photo Box on Right */}
                <div className="border border-black flex flex-row min-w-0 mt-1 bg-white">
                  <div className="flex-1 p-2 space-y-1 border-r border-black">
                    <div className="flex items-baseline gap-1">
                      <span className="font-semibold text-xs whitespace-nowrap shrink-0">വില്ലേജ് :</span>
                      <FormLineInput value={data.ownerC_curr_village} onChange={(v) => update("ownerC_curr_village", v)} />
                    </div>
                    <div className="flex items-baseline gap-1">
                      <span className="font-semibold text-xs whitespace-nowrap shrink-0">താലൂക്ക് :</span>
                      <FormLineInput value={data.ownerC_curr_taluk} onChange={(v) => update("ownerC_curr_taluk", v)} />
                    </div>
                    <div className="flex items-baseline gap-1">
                      <span className="font-semibold text-xs shrink-0 leading-tight">പഞ്ചായത്ത് :</span>
                      <FormLineInput value={data.ownerC_curr_panchayath} onChange={(v) => update("ownerC_curr_panchayath", v)} />
                    </div>
                    <div className="flex items-baseline gap-1">
                      <span className="font-semibold text-xs whitespace-nowrap shrink-0">ജില്ല :</span>
                      <FormLineInput value={data.ownerC_curr_district} onChange={(v) => update("ownerC_curr_district", v)} />
                    </div>
                    <div className="flex items-center gap-1 pt-0.5">
                      <span className="font-semibold text-xs whitespace-nowrap shrink-0">പിൻ കോഡ് :</span>
                      <PinCodeGrid value={data.ownerC_curr_pincode} onChange={(v) => update("ownerC_curr_pincode", v)} />
                    </div>
                  </div>

                  <div className="w-28 sm:w-32 flex items-center justify-center p-1 bg-gray-50/50 shrink-0">
                    <PhotoBox photoUrl={data.ownerC_curr_photo} onPhotoChange={(url) => update("ownerC_curr_photo", url)} />
                  </div>
                </div>

                <div className="space-y-1 pt-1">
                  <div className="flex items-baseline gap-2">
                    <span className="font-semibold whitespace-nowrap shrink-0">3. സ്ഥിരം മേൽവിലാസം :</span>
                    <FormLineInput value={data.ownerC_perm_address} onChange={(v) => update("ownerC_perm_address", v)} />
                  </div>

                  <div className="grid grid-cols-2 gap-4 items-baseline pl-4">
                    <div className="flex items-baseline gap-1">
                      <span className="font-semibold whitespace-nowrap shrink-0">വില്ലേജ് :</span>
                      <FormLineInput value={data.ownerC_perm_village} onChange={(v) => update("ownerC_perm_village", v)} />
                    </div>
                    <div className="flex items-baseline gap-1">
                      <span className="font-semibold whitespace-nowrap shrink-0">താലൂക്ക്</span>
                      <FormLineInput value={data.ownerC_perm_taluk} onChange={(v) => update("ownerC_perm_taluk", v)} />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 items-baseline pl-4">
                    <div className="flex items-baseline gap-1">
                      <span className="font-semibold text-xs shrink-0 leading-tight">പഞ്ചായത്ത് :</span>
                      <FormLineInput value={data.ownerC_perm_panchayath} onChange={(v) => update("ownerC_perm_panchayath", v)} />
                    </div>
                    <div className="flex items-baseline gap-1">
                      <span className="font-semibold whitespace-nowrap shrink-0">ജില്ല</span>
                      <FormLineInput value={data.ownerC_perm_district} onChange={(v) => update("ownerC_perm_district", v)} />
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pl-4">
                    <span className="font-semibold whitespace-nowrap shrink-0">പിൻ കോഡ് :</span>
                    <PinCodeGrid value={data.ownerC_perm_pincode} onChange={(v) => update("ownerC_perm_pincode", v)} />
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3 pt-1">
                  <span className="font-semibold whitespace-nowrap shrink-0">4. തിരിച്ചറിയൽരേഖ</span>
                  <OptionBox
                    label="ഇലക്ഷൻ കാർഡ്"
                    selected={data.ownerC_id_type === "Election"}
                    onToggle={() => update("ownerC_id_type", data.ownerC_id_type === "Election" ? "" : "Election")}
                  />
                  <OptionBox
                    label="ആധാർ കാർഡ്"
                    selected={data.ownerC_id_type === "Aadhaar"}
                    onToggle={() => update("ownerC_id_type", data.ownerC_id_type === "Aadhaar" ? "" : "Aadhaar")}
                  />
                </div>

                <div className="flex items-baseline gap-2">
                  <span className="font-semibold whitespace-nowrap shrink-0">5. തിരിച്ചറിയൽ രേഖയുടെ നമ്പർ :</span>
                  <FormLineInput value={data.ownerC_id_no} onChange={(v) => update("ownerC_id_no", v)} />
                </div>

                <div className="flex items-center gap-3">
                  <span className="font-semibold whitespace-nowrap shrink-0">6. പാൻ നമ്പർ :</span>
                  <PanGrid value={data.ownerC_pan} onChange={(v) => update("ownerC_pan", v)} />
                </div>

                <div className="flex items-baseline gap-2">
                  <span className="font-semibold whitespace-nowrap shrink-0">7. നോമിനി :</span>
                  <FormLineInput value={data.ownerC_nominee} onChange={(v) => update("ownerC_nominee", v)} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* PAGE 3: 3. DRILLING RIGS INFO (MAX 3) - RIG A & RIG B (PART 1)            */}
      {/* ========================================================================= */}
      <div className="official-form-page bg-white p-6 sm:p-10 border border-gray-300 shadow-md relative box-border min-h-[270mm] flex flex-col justify-between">
        <div className="print-page-badge absolute top-3 right-4 text-[10px] text-gray-500 font-sans bg-gray-100 px-2 py-0.5 rounded border print:hidden">
          പേജ് 3 / 5
        </div>

        <div className="space-y-3">
          <h2 className="font-bold text-center text-sm sm:text-base">
            3. ഡ്രില്ലിംഗ് റിഗ്ഗുകളുടെ വിവരം (പരമാവധി മൂന്ന് എണ്ണം)
          </h2>

          {/* RIG A */}
          <div className="space-y-1.5">
            <div className="flex items-start gap-2">
              <span className="font-bold text-sm sm:text-base shrink-0 mt-0.5">A</span>
              <div className="flex-1 space-y-1 min-w-0">
                <div className="flex items-baseline gap-2">
                  <span className="font-semibold whitespace-nowrap shrink-0">1. റിഗ്ഗിന്റെ തരം</span>
                  <FormLineInput value={data.rigA_type} onChange={(v) => update("rigA_type", v)} />
                </div>
                <p className="text-[10px] text-gray-700 italic pl-4">
                  (റോട്ടറി റിഗ്ഗ്, റോട്ടറി കം.ഡിറ്റിഎച്ച് റിഗ്ഗ്, കാലിക്സ് റിഗ്ഗ്, ഫിൽട്ടർ പോയിന്റ് യൂണിറ്റ്)
                </p>

                <div className="flex items-baseline gap-2">
                  <span className="font-semibold whitespace-nowrap shrink-0">2. റിഗ്ഗ് ഉടമസ്ഥന്റെ പേര് :</span>
                  <FormLineInput value={data.rigA_owner_name} onChange={(v) => update("rigA_owner_name", v)} />
                </div>

                <div className="flex items-baseline gap-2">
                  <span className="font-semibold whitespace-nowrap shrink-0">മേൽവിലാസം :</span>
                  <FormLineInput value={data.rigA_owner_address} onChange={(v) => update("rigA_owner_address", v)} />
                </div>
                <div className="pl-4">
                  <FormLineInput value={data.rigA_owner_address_line2 || ""} onChange={(v) => update("rigA_owner_address_line2", v)} />
                </div>

                <div className="grid grid-cols-2 gap-4 items-baseline pl-4">
                  <div className="flex items-baseline gap-1">
                    <span className="font-semibold whitespace-nowrap shrink-0">ജില്ല :</span>
                    <FormLineInput value={data.rigA_district} onChange={(v) => update("rigA_district", v)} />
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="font-semibold whitespace-nowrap shrink-0">സംസ്ഥാനം:</span>
                    <FormLineInput value={data.rigA_state} onChange={(v) => update("rigA_state", v)} />
                  </div>
                </div>

                <div className="flex items-center gap-2 pl-4">
                  <span className="font-semibold whitespace-nowrap shrink-0">പിൻ കോഡ് :</span>
                  <PinCodeGrid value={data.rigA_pincode} onChange={(v) => update("rigA_pincode", v)} />
                </div>

                <div className="space-y-1 pt-1">
                  <span className="font-semibold block">3. ഉപയോഗിക്കുന്ന വാഹനത്തിന്റെ വിവരം</span>
                  <div className="grid grid-cols-2 gap-4 items-baseline pl-4">
                    <div className="flex items-baseline gap-1">
                      <span className="font-semibold text-xs shrink-0">എ. തരം</span>
                      <FormLineInput value={data.rigA_veh_type} onChange={(v) => update("rigA_veh_type", v)} />
                    </div>
                    <div className="flex items-baseline gap-1">
                      <span className="font-semibold text-xs shrink-0">ബി. രജി. നമ്പർ</span>
                      <FormLineInput value={data.rigA_veh_reg} onChange={(v) => update("rigA_veh_reg", v)} />
                    </div>
                  </div>
                  <div className="flex items-baseline gap-2 pl-4">
                    <span className="font-semibold text-xs shrink-0">സി. ചേസിസ് നമ്പർ</span>
                    <FormLineInput value={data.rigA_veh_chassis} onChange={(v) => update("rigA_veh_chassis", v)} />
                  </div>
                  <div className="flex items-baseline gap-2 pl-4">
                    <span className="font-semibold text-xs shrink-0">ഡി. എഞ്ചിൻ നമ്പർ</span>
                    <FormLineInput value={data.rigA_veh_engine} onChange={(v) => update("rigA_veh_engine", v)} />
                  </div>
                </div>

                <div className="space-y-1 pt-1">
                  <span className="font-semibold block">
                    4. കമ്പ്രസറിന്റെ വിവരം (ഡിറ്റിഎച്ച / റോട്ടറി കം.ഡിറ്റിഎച്ച് / ഫിൽട്ടർ പോയിന്റ് )
                  </span>
                  <div className="flex items-baseline gap-2 pl-4">
                    <span className="font-semibold text-xs shrink-0">എ. മോഡൽ</span>
                    <FormLineInput value={data.rigA_comp_model} onChange={(v) => update("rigA_comp_model", v)} />
                  </div>
                  <div className="flex items-baseline gap-2 pl-4">
                    <span className="font-semibold text-xs shrink-0">ബി. കപ്പാസിറ്റി</span>
                    <FormLineInput value={data.rigA_comp_cap} onChange={(v) => update("rigA_comp_cap", v)} />
                  </div>
                </div>

                <div className="space-y-1 pt-1">
                  <span className="font-semibold block">5. ജനറേറ്ററിന്റെ വിവരം (കാലിക്സ് റിഗ്ഗ്)</span>
                  <div className="grid grid-cols-2 gap-4 items-baseline pl-4">
                    <div className="flex items-baseline gap-1">
                      <span className="font-semibold text-xs shrink-0">എ. തരം</span>
                      <FormLineInput value={data.rigA_gen_type} onChange={(v) => update("rigA_gen_type", v)} />
                    </div>
                    <div className="flex items-baseline gap-1">
                      <span className="font-semibold text-xs shrink-0">ബി. മോഡൽ</span>
                      <FormLineInput value={data.rigA_gen_model} onChange={(v) => update("rigA_gen_model", v)} />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 items-baseline pl-4">
                    <div className="flex items-baseline gap-1">
                      <span className="font-semibold text-xs shrink-0">സി. കപ്പാസിറ്റി</span>
                      <FormLineInput value={data.rigA_gen_cap} onChange={(v) => update("rigA_gen_cap", v)} />
                    </div>
                    <div className="flex items-baseline gap-1">
                      <span className="font-semibold text-xs shrink-0">ഡി. എഞ്ചിൻ നമ്പർ</span>
                      <FormLineInput value={data.rigA_gen_engine} onChange={(v) => update("rigA_gen_engine", v)} />
                    </div>
                  </div>
                </div>

                <div className="space-y-1 pt-1">
                  <span className="font-semibold block text-xs">
                    6. കുഴിക്കാൻ സാധിക്കുന്ന കിണറിന്റെ സ്പെസിഫിക്കേഷൻ (കംപ്രസ്സർ കപ്പാസിറ്റിയുടെ അടിസ്ഥാനത്തിൽ)
                  </span>
                  <div className="grid grid-cols-2 gap-4 items-baseline pl-4">
                    <div className="flex items-baseline gap-1">
                      <span className="font-semibold text-xs shrink-0">എ. പരമാവധി ആഴം</span>
                      <FormLineInput value={data.rigA_drill_depth} onChange={(v) => update("rigA_drill_depth", v)} />
                    </div>
                    <div className="flex items-baseline gap-1">
                      <span className="font-semibold text-xs shrink-0">ബി. പരമാവധി വ്യാസം</span>
                      <FormLineInput value={data.rigA_drill_dia} onChange={(v) => update("rigA_drill_dia", v)} />
                    </div>
                  </div>
                </div>

                <div className="space-y-1 pt-1">
                  <span className="font-semibold block">7. ഡ്രില്ലിംഗ് യന്ത്ര ഓപ്പറേറ്ററുടെ വിവരങ്ങൾ</span>
                  <div className="grid grid-cols-2 gap-4 items-baseline pl-4">
                    <div className="flex items-baseline gap-1">
                      <span className="font-semibold text-xs shrink-0">പേര് :</span>
                      <FormLineInput value={data.rigA_op_name} onChange={(v) => update("rigA_op_name", v)} />
                    </div>
                    <div className="flex items-baseline gap-1">
                      <span className="font-semibold text-xs shrink-0">വയസ് :</span>
                      <FormLineInput value={data.rigA_op_age} onChange={(v) => update("rigA_op_age", v)} width="w-20 text-center" />
                    </div>
                  </div>
                  <div className="flex items-baseline gap-2 pl-4">
                    <span className="font-semibold text-xs shrink-0">പ്രവർത്തി പരിചയം :</span>
                    <FormLineInput value={data.rigA_op_exp} onChange={(v) => update("rigA_op_exp", v)} />
                  </div>
                  <div className="flex flex-wrap items-center gap-3 pl-4">
                    <span className="font-semibold text-xs shrink-0">തിരിച്ചറിയൽ രേഖ :</span>
                    <OptionBox
                      label="ഇലക്ഷൻ കാർഡ്"
                      selected={data.rigA_op_id_type === "Election"}
                      onToggle={() => update("rigA_op_id_type", data.rigA_op_id_type === "Election" ? "" : "Election")}
                    />
                    <OptionBox
                      label="ആധാർ കാർഡ്"
                      selected={data.rigA_op_id_type === "Aadhaar"}
                      onToggle={() => update("rigA_op_id_type", data.rigA_op_id_type === "Aadhaar" ? "" : "Aadhaar")}
                    />
                  </div>
                  <div className="flex items-baseline gap-2 pl-4">
                    <span className="font-semibold text-xs shrink-0">തിരിച്ചറിയൽ രേഖയുടെ നമ്പർ :</span>
                    <FormLineInput value={data.rigA_op_id_no} onChange={(v) => update("rigA_op_id_no", v)} />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <hr className="border-black my-2" />

          {/* RIG B (Part 1 on Page 3) */}
          <div className="space-y-1.5">
            <div className="flex items-start gap-2">
              <span className="font-bold text-sm sm:text-base shrink-0 mt-0.5">B</span>
              <div className="flex-1 space-y-1 min-w-0">
                <div className="flex items-baseline gap-2">
                  <span className="font-semibold whitespace-nowrap shrink-0">1. റിഗ്ഗിന്റെ തരം</span>
                  <FormLineInput value={data.rigB_type} onChange={(v) => update("rigB_type", v)} />
                </div>
                <p className="text-[10px] text-gray-700 italic pl-4">
                  (റോട്ടറി റിഗ്ഗ്, റോട്ടറി കം.ഡിറ്റിഎച്ച് റിഗ്ഗ്, കാലിക്സ് റിഗ്ഗ്, ഫിൽട്ടർ പോയിന്റ് യൂണിറ്റ്)
                </p>

                <div className="flex items-baseline gap-2">
                  <span className="font-semibold whitespace-nowrap shrink-0">2. റിഗ്ഗ് ഉടമസ്ഥന്റെ പേര് :</span>
                  <FormLineInput value={data.rigB_owner_name} onChange={(v) => update("rigB_owner_name", v)} />
                </div>

                <div className="flex items-baseline gap-2">
                  <span className="font-semibold whitespace-nowrap shrink-0">മേൽവിലാസം :</span>
                  <FormLineInput value={data.rigB_owner_address} onChange={(v) => update("rigB_owner_address", v)} />
                </div>
                <div className="pl-4">
                  <FormLineInput value={data.rigB_owner_address_line2 || ""} onChange={(v) => update("rigB_owner_address_line2", v)} />
                </div>

                <div className="grid grid-cols-2 gap-4 items-baseline pl-4">
                  <div className="flex items-baseline gap-1">
                    <span className="font-semibold whitespace-nowrap shrink-0">ജില്ല :</span>
                    <FormLineInput value={data.rigB_district} onChange={(v) => update("rigB_district", v)} />
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="font-semibold whitespace-nowrap shrink-0">സംസ്ഥാനം :</span>
                    <FormLineInput value={data.rigB_state} onChange={(v) => update("rigB_state", v)} />
                  </div>
                </div>

                <div className="flex items-center gap-2 pl-4">
                  <span className="font-semibold whitespace-nowrap shrink-0">പിൻ കോഡ് :</span>
                  <PinCodeGrid value={data.rigB_pincode} onChange={(v) => update("rigB_pincode", v)} />
                </div>

                <div className="space-y-1 pt-1">
                  <span className="font-semibold block">3. ഉപയോഗിക്കുന്ന വാഹനത്തിന്റെ വിവരം</span>
                  <div className="grid grid-cols-2 gap-4 items-baseline pl-4">
                    <div className="flex items-baseline gap-1">
                      <span className="font-semibold text-xs shrink-0">എ. തരം</span>
                      <FormLineInput value={data.rigB_veh_type} onChange={(v) => update("rigB_veh_type", v)} />
                    </div>
                    <div className="flex items-baseline gap-1">
                      <span className="font-semibold text-xs shrink-0">ബി. രജി. നമ്പർ</span>
                      <FormLineInput value={data.rigB_veh_reg} onChange={(v) => update("rigB_veh_reg", v)} />
                    </div>
                  </div>
                  <div className="flex items-baseline gap-2 pl-4">
                    <span className="font-semibold text-xs shrink-0">സി. ചേസിസ് നമ്പർ</span>
                    <FormLineInput value={data.rigB_veh_chassis} onChange={(v) => update("rigB_veh_chassis", v)} />
                  </div>
                  <div className="flex items-baseline gap-2 pl-4">
                    <span className="font-semibold text-xs shrink-0">ഡി. എഞ്ചിൻ നമ്പർ</span>
                    <FormLineInput value={data.rigB_veh_engine} onChange={(v) => update("rigB_veh_engine", v)} />
                  </div>
                </div>

                <div className="space-y-1 pt-1">
                  <span className="font-semibold block">
                    4. കമ്പ്രസറിന്റെ വിവരം (ഡിറ്റിഎച്ച / റോട്ടറി കം.ഡിറ്റിഎച്ച് / ഫിൽട്ടർ പോയിന്റ് )
                  </span>
                  <div className="flex items-baseline gap-2 pl-4">
                    <span className="font-semibold text-xs shrink-0">എ. മോഡൽ</span>
                    <FormLineInput value={data.rigB_comp_model} onChange={(v) => update("rigB_comp_model", v)} />
                  </div>
                  <div className="flex items-baseline gap-2 pl-4">
                    <span className="font-semibold text-xs shrink-0">ബി. കപ്പാസിറ്റി</span>
                    <FormLineInput value={data.rigB_comp_cap} onChange={(v) => update("rigB_comp_cap", v)} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* PAGE 4: RIG B (CONTD.), RIG C, DECLARATION (സത്യപ്രസ്താവന)                 */}
      {/* ========================================================================= */}
      <div className="official-form-page bg-white p-6 sm:p-10 border border-gray-300 shadow-md relative box-border min-h-[270mm] flex flex-col justify-between">
        <div className="print-page-badge absolute top-3 right-4 text-[10px] text-gray-500 font-sans bg-gray-100 px-2 py-0.5 rounded border print:hidden">
          പേജ് 4 / 5
        </div>

        <div className="space-y-3">
          {/* Rig B Continuation */}
          <div className="space-y-1 pl-4 border-l-2 border-black/40">
            <span className="text-xs font-bold text-gray-700 italic block mb-1">
              (B. റിഗ്ഗ് വിവരങ്ങൾ തുടർച്ച)
            </span>
            <div className="space-y-1">
              <span className="font-semibold block">5. ജനറേറ്ററിന്റെ വിവരം (കാലിക്സ് റിഗ്ഗ്)</span>
              <div className="grid grid-cols-2 gap-4 items-baseline pl-4">
                <div className="flex items-baseline gap-1">
                  <span className="font-semibold text-xs shrink-0">എ. തരം</span>
                  <FormLineInput value={data.rigB_gen_type} onChange={(v) => update("rigB_gen_type", v)} />
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="font-semibold text-xs shrink-0">ബി. മോഡൽ</span>
                  <FormLineInput value={data.rigB_gen_model} onChange={(v) => update("rigB_gen_model", v)} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 items-baseline pl-4">
                <div className="flex items-baseline gap-1">
                  <span className="font-semibold text-xs shrink-0">സി. കപ്പാസിറ്റി</span>
                  <FormLineInput value={data.rigB_gen_cap} onChange={(v) => update("rigB_gen_cap", v)} />
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="font-semibold text-xs shrink-0">ഡി. എഞ്ചിൻ നമ്പർ</span>
                  <FormLineInput value={data.rigB_gen_engine} onChange={(v) => update("rigB_gen_engine", v)} />
                </div>
              </div>
            </div>

            <div className="space-y-1 pt-1">
              <span className="font-semibold block text-xs">
                6. കുഴിക്കാൻ സാധിക്കുന്ന കിണറിന്റെ സ്പെസിഫിക്കേഷൻ (കംപ്രസ്സർ കപ്പാസിറ്റിയുടെ അടിസ്ഥാനത്തിൽ)
              </span>
              <div className="grid grid-cols-2 gap-4 items-baseline pl-4">
                <div className="flex items-baseline gap-1">
                  <span className="font-semibold text-xs shrink-0">എ. പരമാവധി ആഴം</span>
                  <FormLineInput value={data.rigB_drill_depth} onChange={(v) => update("rigB_drill_depth", v)} />
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="font-semibold text-xs shrink-0">ബി. പരമാവധി വ്യാസം</span>
                  <FormLineInput value={data.rigB_drill_dia} onChange={(v) => update("rigB_drill_dia", v)} />
                </div>
              </div>
            </div>

            <div className="space-y-1 pt-1">
              <span className="font-semibold block">7. ഡ്രില്ലിംഗ് യന്ത്ര ഓപ്പറേറ്ററുടെ വിവരങ്ങൾ</span>
              <div className="grid grid-cols-2 gap-4 items-baseline pl-4">
                <div className="flex items-baseline gap-1">
                  <span className="font-semibold text-xs shrink-0">പേര് :</span>
                  <FormLineInput value={data.rigB_op_name} onChange={(v) => update("rigB_op_name", v)} />
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="font-semibold text-xs shrink-0">വയസ് :</span>
                  <FormLineInput value={data.rigB_op_age} onChange={(v) => update("rigB_op_age", v)} width="w-20 text-center" />
                </div>
              </div>
              <div className="flex items-baseline gap-2 pl-4">
                <span className="font-semibold text-xs shrink-0">പ്രവർത്തി പരിചയം :</span>
                <FormLineInput value={data.rigB_op_exp} onChange={(v) => update("rigB_op_exp", v)} />
              </div>
              <div className="flex flex-wrap items-center gap-3 pl-4">
                <span className="font-semibold text-xs shrink-0">തിരിച്ചറിയൽ രേഖ :</span>
                <OptionBox
                  label="ഇലക്ഷൻ കാർഡ്"
                  selected={data.rigB_op_id_type === "Election"}
                  onToggle={() => update("rigB_op_id_type", data.rigB_op_id_type === "Election" ? "" : "Election")}
                />
                <OptionBox
                  label="ആധാർ കാർഡ്"
                  selected={data.rigB_op_id_type === "Aadhaar"}
                  onToggle={() => update("rigB_op_id_type", data.rigB_op_id_type === "Aadhaar" ? "" : "Aadhaar")}
                />
              </div>
              <div className="flex items-baseline gap-2 pl-4">
                <span className="font-semibold text-xs shrink-0">തിരിച്ചറിയൽ രേഖയുടെ നമ്പർ :</span>
                <FormLineInput value={data.rigB_op_id_no} onChange={(v) => update("rigB_op_id_no", v)} />
              </div>
            </div>
          </div>

          <hr className="border-black my-2" />

          {/* RIG C */}
          <div className="space-y-1.5">
            <div className="flex items-start gap-2">
              <span className="font-bold text-sm sm:text-base shrink-0 mt-0.5">C</span>
              <div className="flex-1 space-y-1 min-w-0">
                <div className="flex items-baseline gap-2">
                  <span className="font-semibold whitespace-nowrap shrink-0">1. റിഗ്ഗിന്റെ തരം</span>
                  <FormLineInput value={data.rigC_type} onChange={(v) => update("rigC_type", v)} />
                </div>
                <p className="text-[10px] text-gray-700 italic pl-4">
                  (റോട്ടറി റിഗ്ഗ്, റോട്ടറി കം.ഡിറ്റിഎച്ച് റിഗ്ഗ്, കാലിക്സ് റിഗ്ഗ്, ഫിൽട്ടർ പോയിന്റ് യൂണിറ്റ്)
                </p>

                <div className="flex items-baseline gap-2">
                  <span className="font-semibold whitespace-nowrap shrink-0">2. റിഗ്ഗ് ഉടമസ്ഥന്റെ പേര് :</span>
                  <FormLineInput value={data.rigC_owner_name} onChange={(v) => update("rigC_owner_name", v)} />
                </div>

                <div className="flex items-baseline gap-2">
                  <span className="font-semibold whitespace-nowrap shrink-0">മേൽവിലാസം :</span>
                  <FormLineInput value={data.rigC_owner_address} onChange={(v) => update("rigC_owner_address", v)} />
                </div>
                <div className="pl-4">
                  <FormLineInput value={data.rigC_owner_address_line2 || ""} onChange={(v) => update("rigC_owner_address_line2", v)} />
                </div>

                <div className="grid grid-cols-2 gap-4 items-baseline pl-4">
                  <div className="flex items-baseline gap-1">
                    <span className="font-semibold whitespace-nowrap shrink-0">ജില്ല :</span>
                    <FormLineInput value={data.rigC_district} onChange={(v) => update("rigC_district", v)} />
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="font-semibold whitespace-nowrap shrink-0">സംസ്ഥാനം :</span>
                    <FormLineInput value={data.rigC_state} onChange={(v) => update("rigC_state", v)} />
                  </div>
                </div>

                <div className="flex items-center gap-2 pl-4">
                  <span className="font-semibold whitespace-nowrap shrink-0">പിൻ കോഡ് :</span>
                  <PinCodeGrid value={data.rigC_pincode} onChange={(v) => update("rigC_pincode", v)} />
                </div>

                <div className="space-y-1 pt-1">
                  <span className="font-semibold block">3. ഉപയോഗിക്കുന്ന വാഹനത്തിന്റെ വിവരം</span>
                  <div className="grid grid-cols-2 gap-4 items-baseline pl-4">
                    <div className="flex items-baseline gap-1">
                      <span className="font-semibold text-xs shrink-0">എ. തരം</span>
                      <FormLineInput value={data.rigC_veh_type} onChange={(v) => update("rigC_veh_type", v)} />
                    </div>
                    <div className="flex items-baseline gap-1">
                      <span className="font-semibold text-xs shrink-0">ബി. രജി. നമ്പർ</span>
                      <FormLineInput value={data.rigC_veh_reg} onChange={(v) => update("rigC_veh_reg", v)} />
                    </div>
                  </div>
                  <div className="flex items-baseline gap-2 pl-4">
                    <span className="font-semibold text-xs shrink-0">സി. ചേസിസ് നമ്പർ</span>
                    <FormLineInput value={data.rigC_veh_chassis} onChange={(v) => update("rigC_veh_chassis", v)} />
                  </div>
                  <div className="flex items-baseline gap-2 pl-4">
                    <span className="font-semibold text-xs shrink-0">ഡി. എഞ്ചിൻ നമ്പർ</span>
                    <FormLineInput value={data.rigC_veh_engine} onChange={(v) => update("rigC_veh_engine", v)} />
                  </div>
                </div>

                <div className="space-y-1 pt-1">
                  <span className="font-semibold block">
                    4. കമ്പ്രസറിന്റെ വിവരം (ഡിറ്റിഎച്ച / റോട്ടറി കം.ഡിറ്റിഎച്ച് / ഫിൽട്ടർ പോയിന്റ് )
                  </span>
                  <div className="flex items-baseline gap-2 pl-4">
                    <span className="font-semibold text-xs shrink-0">എ. മോഡൽ</span>
                    <FormLineInput value={data.rigC_comp_model} onChange={(v) => update("rigC_comp_model", v)} />
                  </div>
                  <div className="flex items-baseline gap-2 pl-4">
                    <span className="font-semibold text-xs shrink-0">ബി. കപ്പാസിറ്റി</span>
                    <FormLineInput value={data.rigC_comp_cap} onChange={(v) => update("rigC_comp_cap", v)} />
                  </div>
                </div>

                <div className="space-y-1 pt-1">
                  <span className="font-semibold block">5. ജനറേറ്ററിന്റെ വിവരം (കാലിക്സ് റിഗ്ഗ്)</span>
                  <div className="grid grid-cols-2 gap-4 items-baseline pl-4">
                    <div className="flex items-baseline gap-1">
                      <span className="font-semibold text-xs shrink-0">എ. തരം</span>
                      <FormLineInput value={data.rigC_gen_type} onChange={(v) => update("rigC_gen_type", v)} />
                    </div>
                    <div className="flex items-baseline gap-1">
                      <span className="font-semibold text-xs shrink-0">ബി. മോഡൽ</span>
                      <FormLineInput value={data.rigC_gen_model} onChange={(v) => update("rigC_gen_model", v)} />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 items-baseline pl-4">
                    <div className="flex items-baseline gap-1">
                      <span className="font-semibold text-xs shrink-0">സി. കപ്പാസിറ്റി</span>
                      <FormLineInput value={data.rigC_gen_cap} onChange={(v) => update("rigC_gen_cap", v)} />
                    </div>
                    <div className="flex items-baseline gap-1">
                      <span className="font-semibold text-xs shrink-0">ഡി. എഞ്ചിൻ നമ്പർ</span>
                      <FormLineInput value={data.rigC_gen_engine} onChange={(v) => update("rigC_gen_engine", v)} />
                    </div>
                  </div>
                </div>

                <div className="space-y-1 pt-1">
                  <span className="font-semibold block text-xs">
                    6. കുഴിക്കാൻ സാധിക്കുന്ന കിണറിന്റെ സ്പെസിഫിക്കേഷൻ (കംപ്രസ്സർ കപ്പാസിറ്റിയുടെ അടിസ്ഥാനത്തിൽ)
                  </span>
                  <div className="grid grid-cols-2 gap-4 items-baseline pl-4">
                    <div className="flex items-baseline gap-1">
                      <span className="font-semibold text-xs shrink-0">എ. പരമാവധി ആഴം</span>
                      <FormLineInput value={data.rigC_drill_depth} onChange={(v) => update("rigC_drill_depth", v)} />
                    </div>
                    <div className="flex items-baseline gap-1">
                      <span className="font-semibold text-xs shrink-0">ബി. പരമാവധി വ്യാസം</span>
                      <FormLineInput value={data.rigC_drill_dia} onChange={(v) => update("rigC_drill_dia", v)} />
                    </div>
                  </div>
                </div>

                <div className="space-y-1 pt-1">
                  <span className="font-semibold block">7. ഡ്രില്ലിംഗ് യന്ത്ര ഓപ്പറേറ്ററുടെ വിവരങ്ങൾ</span>
                  <div className="grid grid-cols-2 gap-4 items-baseline pl-4">
                    <div className="flex items-baseline gap-1">
                      <span className="font-semibold text-xs shrink-0">പേര് :</span>
                      <FormLineInput value={data.rigC_op_name} onChange={(v) => update("rigC_op_name", v)} />
                    </div>
                    <div className="flex items-baseline gap-1">
                      <span className="font-semibold text-xs shrink-0">വയസ് :</span>
                      <FormLineInput value={data.rigC_op_age} onChange={(v) => update("rigC_op_age", v)} width="w-20 text-center" />
                    </div>
                  </div>
                  <div className="flex items-baseline gap-2 pl-4">
                    <span className="font-semibold text-xs shrink-0">പ്രവർത്തി പരിചയം :</span>
                    <FormLineInput value={data.rigC_op_exp} onChange={(v) => update("rigC_op_exp", v)} />
                  </div>
                  <div className="flex flex-wrap items-center gap-3 pl-4">
                    <span className="font-semibold text-xs shrink-0">തിരിച്ചറിയൽ രേഖ :</span>
                    <OptionBox
                      label="ഇലക്ഷൻ കാർഡ്"
                      selected={data.rigC_op_id_type === "Election"}
                      onToggle={() => update("rigC_op_id_type", data.rigC_op_id_type === "Election" ? "" : "Election")}
                    />
                    <OptionBox
                      label="ആധാർ കാർഡ്"
                      selected={data.rigC_op_id_type === "Aadhaar"}
                      onToggle={() => update("rigC_op_id_type", data.rigC_op_id_type === "Aadhaar" ? "" : "Aadhaar")}
                    />
                  </div>
                  <div className="flex items-baseline gap-2 pl-4">
                    <span className="font-semibold text-xs shrink-0">തിരിച്ചറിയൽ രേഖയുടെ നമ്പർ :</span>
                    <FormLineInput value={data.rigC_op_id_no} onChange={(v) => update("rigC_op_id_no", v)} />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Double horizontal line before Declaration */}
          <div className="border-t-2 border-b border-black my-3 py-0.5"></div>

          {/* Satyaprashthavana (Declaration) */}
          <div className="space-y-2 pt-1 text-center">
            <h3 className="font-bold underline text-sm sm:text-base">സത്യപ്രസ്താവന</h3>
            <p className="text-justify indent-8 text-xs sm:text-sm font-normal">
              മേൽ നൽകിയിട്ടുള്ള വിവരങ്ങൾ എന്റെ അറിവിലും വിശ്വാസത്തിലും കൃത്യവും സത്യസന്ധവുമാണെന്ന് സാക്ഷ്യപ്പെടുത്തുന്നു.
            </p>

            <div className="flex justify-between items-end pt-6 px-4">
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
              <div className="text-center font-bold pb-1 pr-6">
                <span>ഒപ്പ്</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* PAGE 5: FOR OFFICE USE ONLY & OFFICIAL RECEIPT (രസീത്)                     */}
      {/* ========================================================================= */}
      <div className="official-form-page bg-white p-6 sm:p-10 border border-gray-300 shadow-md relative box-border min-h-[270mm] flex flex-col justify-between">
        <div className="print-page-badge absolute top-3 right-4 text-[10px] text-gray-500 font-sans bg-gray-100 px-2 py-0.5 rounded border print:hidden">
          പേജ് 5 / 5
        </div>

        <div className="space-y-6">
          {/* For Office Use */}
          <div className="space-y-4">
            <div className="flex justify-center">
              <div className="border border-black px-8 py-1 font-bold text-sm sm:text-base w-full max-w-xl text-center bg-white">
                ഓഫീസ് ഉപയോഗത്തിന്
              </div>
            </div>

            <div className="space-y-2.5 pt-2 pl-2">
              <div className="flex items-baseline gap-2">
                <span className="font-semibold whitespace-nowrap shrink-0">അപേക്ഷ ലഭിച്ച തീയതി</span>
                <span className="font-bold">:</span>
                <FormDateInput value={data.office_date_recd} onChange={(v) => update("office_date_recd", v)} width="w-36" />
              </div>

              <div className="flex items-baseline gap-2">
                <span className="font-semibold whitespace-nowrap shrink-0">അപേക്ഷാ ഫീസ് അടച്ച വിവരങ്ങൾ</span>
                <span className="font-bold">:</span>
                <FormLineInput value={data.office_fee_details} onChange={(v) => update("office_fee_details", v)} />
              </div>

              <div className="flex items-baseline gap-2">
                <span className="font-semibold whitespace-nowrap shrink-0">അടച്ച തുക</span>
                <span className="font-bold">:</span>
                <FormLineInput value={data.office_paid_amount} onChange={(v) => update("office_paid_amount", v)} width="w-48" />
              </div>

              <div className="flex items-baseline gap-2">
                <span className="font-semibold whitespace-nowrap shrink-0">റിഗ്ഗ് പരിശോധിച്ച തീയതി</span>
                <span className="font-bold">:</span>
                <FormDateInput value={data.office_rig_inspected_date} onChange={(v) => update("office_rig_inspected_date", v)} width="w-36" />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-baseline gap-2">
                  <span className="font-semibold whitespace-nowrap shrink-0">പരിശോധകന്റെ ശുപാർശ</span>
                  <span className="font-bold">:</span>
                  <FormLineInput value={data.office_recommendation} onChange={(v) => update("office_recommendation", v)} />
                </div>
                <FormLineInput value={data.office_recommendation_line2 || ""} onChange={(v) => update("office_recommendation_line2", v)} />
                <FormLineInput value={data.office_recommendation_line3 || ""} onChange={(v) => update("office_recommendation_line3", v)} />
              </div>

              <div className="flex justify-between items-end pt-12 px-4">
                <div className="text-center font-bold">
                  <p>പരിശോധകന്റെ ഒപ്പ്</p>
                  <p className="text-xs font-normal">(പേര് തസ്തിക ഉൾപ്പടെ)</p>
                </div>
                <div className="text-center font-bold">
                  <p>ജില്ലാ ആഫീസർ</p>
                </div>
              </div>
            </div>
          </div>

          {/* Dotted Perforation Line */}
          <div className="border-t-2 border-dashed border-black my-6"></div>

          {/* Receipt Section */}
          <div className="space-y-3">
            <div className="flex justify-center">
              <div className="border border-black rounded-full px-6 py-0.5 font-bold text-sm bg-white">
                രസീത്
              </div>
            </div>

            <div className="space-y-2 pl-2">
              <div className="flex items-baseline gap-2">
                <span className="font-semibold whitespace-nowrap shrink-0">അപേക്ഷാ നമ്പർ</span>
                <span className="font-bold">:</span>
                <FormLineInput value={data.receipt_app_no} onChange={(v) => update("receipt_app_no", v)} width="w-64" />
              </div>

              <div className="flex items-baseline gap-2">
                <span className="font-semibold whitespace-nowrap shrink-0">അപേക്ഷകന്റെ പേര്</span>
                <span className="font-bold">:</span>
                <FormLineInput value={data.receipt_applicant_name} onChange={(v) => update("receipt_applicant_name", v)} />
              </div>

              <div className="flex items-baseline gap-2">
                <span className="font-semibold whitespace-nowrap shrink-0">അപേക്ഷ ലഭിച്ച തീയതി</span>
                <span className="font-bold">:</span>
                <FormDateInput value={data.receipt_date_recd} onChange={(v) => update("receipt_date_recd", v)} width="w-36" />
              </div>

              <div className="space-y-1">
                <div className="flex items-baseline gap-2">
                  <span className="font-semibold whitespace-nowrap shrink-0">അപേക്ഷ ഫീസ് ഒടുക്കിയ വിവരങ്ങൾ</span>
                </div>
                <div className="grid grid-cols-2 gap-6 items-baseline pl-4">
                  <div className="flex items-baseline gap-1">
                    <span className="font-semibold whitespace-nowrap shrink-0">ഒടുക്കിയ തുക :</span>
                    <FormLineInput value={data.receipt_paid_amount} onChange={(v) => update("receipt_paid_amount", v)} width="w-32 text-center" />
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="font-semibold whitespace-nowrap shrink-0">തീയതി :</span>
                    <FormDateInput value={data.receipt_paid_date} onChange={(v) => update("receipt_paid_date", v)} width="w-32" />
                  </div>
                </div>
              </div>

              <div className="space-y-2 pt-2">
                <span className="font-semibold block">അപേക്ഷാ വിവരങ്ങൾ</span>
                <div className="space-y-2 pl-4">
                  <div className="flex items-center gap-3">
                    <span className="font-medium text-xs sm:text-sm w-44">ഏജൻസി രജിസ്ട്രേഷൻ</span>
                    <SquareCheckbox
                      checked={!!data.receipt_agency_reg_check}
                      onChange={(c) => update("receipt_agency_reg_check", c)}
                    />
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-medium text-xs sm:text-sm w-44">റിഗ്ഗ് രജിസ്ട്രേഷൻ</span>
                    <div className="flex items-center gap-3">
                      <SquareCheckbox
                        checked={!!data.receipt_rig1_check}
                        onChange={(c) => update("receipt_rig1_check", c)}
                      />
                      <SquareCheckbox
                        checked={!!data.receipt_rig2_check}
                        onChange={(c) => update("receipt_rig2_check", c)}
                      />
                      <SquareCheckbox
                        checked={!!data.receipt_rig3_check}
                        onChange={(c) => update("receipt_rig3_check", c)}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-between items-end pt-10 px-4">
                <div className="flex items-baseline gap-2">
                  <span className="font-semibold whitespace-nowrap">തീയതി :</span>
                  <FormDateInput value={data.receipt_date || data.date} onChange={(v) => update("receipt_date", v)} width="w-32" />
                </div>
                <div className="text-center font-bold">
                  <p>ജില്ലാ ആഫീസർ</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
