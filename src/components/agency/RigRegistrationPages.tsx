"use client";

import React from "react";
import {
  PinCodeGrid,
  PanGrid,
  PhotoBox,
  FormLineInput,
  FormDateInput,
  OptionBox,
} from "./FormInputComponents";

interface FormProps {
  data: Record<string, any>;
  update: (k: string, v: any) => void;
}

export function RigRegistrationPages({ data, update }: FormProps) {
  return (
    <div className="space-y-6 print:space-y-0 text-black font-serif text-[10.5pt] leading-snug selection:bg-yellow-200">
      <style jsx global>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 1.0cm 1.2cm 1.0cm 1.2cm;
          }
          body {
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
          }
          .official-form-page {
            page-break-after: always !important;
            break-after: page !important;
            min-height: 275mm !important;
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
      {/* PAGE 1: HEADER, SECTION 1 (AGENCY), SECTION 2 (PROPRIETOR / OPERATOR A)    */}
      {/* ========================================================================= */}
      <div className="official-form-page bg-white p-6 sm:p-9 border border-gray-300 shadow-md relative box-border min-h-[275mm] flex flex-col justify-between">
        <div className="print-page-badge absolute top-3 right-4 text-[10px] text-gray-500 font-sans bg-gray-100 px-2 py-0.5 rounded border print:hidden">
          പേജ് 1 / 5
        </div>

        <div className="space-y-2.5">
          {/* Header */}
          <div className="text-center space-y-0.5">
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
            <div className="pt-1 flex justify-center">
              <div className="border border-black px-12 py-0.5 font-bold text-sm sm:text-base w-full max-w-xl text-center bg-white">
                അപേക്ഷാ ഫോറം
              </div>
            </div>
          </div>

          {/* Section 1: സ്ഥാപനം / ഏജൻസിയുടെ വിവരം */}
          <div className="space-y-1 pt-1">
            <h2 className="font-bold text-sm">1. സ്ഥാപനം / ഏജൻസിയുടെ വിവരം</h2>

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
                    <span className="font-semibold whitespace-nowrap shrink-0">താലൂക്ക് :</span>
                    <FormLineInput value={data.taluk} onChange={(v) => update("taluk", v)} />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 items-baseline pl-4">
                  <div className="flex items-baseline gap-1">
                    <span className="font-semibold whitespace-nowrap shrink-0 text-xs">കോർപ്പറേഷൻ/മുനിസിപ്പാലിറ്റി/പഞ്ചായത്ത് :</span>
                    <FormLineInput value={data.panchayath} onChange={(v) => update("panchayath", v)} />
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="font-semibold whitespace-nowrap shrink-0">ജില്ല :</span>
                    <FormLineInput value={data.district} onChange={(v) => update("district", v)} />
                  </div>
                </div>

                <div className="flex items-center gap-3 pl-4 pt-0.5">
                  <span className="font-semibold whitespace-nowrap shrink-0">പിൻ കോഡ് :</span>
                  <PinCodeGrid value={data.pincode} onChange={(v) => update("pincode", v)} />
                </div>
              </div>

              <div className="flex items-baseline gap-2 pt-0.5">
                <span className="font-semibold whitespace-nowrap shrink-0">സി. ജി.എസ്സ്.ടി. നമ്പർ :</span>
                <FormLineInput value={data.gstin} onChange={(v) => update("gstin", v)} />
              </div>

              <div className="flex items-baseline gap-2">
                <span className="font-semibold whitespace-nowrap shrink-0">ഡി. തദ്ദേശ സ്വയംഭരണ സ്ഥാപനം നൽകിയ രജിസ്ട്രേഷൻ നമ്പർ :</span>
                <FormLineInput value={data.lsgdRegNo} onChange={(v) => update("lsgdRegNo", v)} />
              </div>
            </div>
          </div>

          {/* Section 2: സ്ഥാപനം / ഏജൻസി നടത്തിപ്പുകാരുടെ വിവരം */}
          <div className="space-y-1 pt-1">
            <h2 className="font-bold text-sm">2. സ്ഥാപനം / ഏജൻസി നടത്തിപ്പുകാരുടെ വിവരം</h2>

            <div className="space-y-1 pl-1">
              <div className="flex items-center gap-2">
                <span className="border border-black px-2 py-0.5 font-bold text-xs bg-white">എ.</span>
                <div className="flex items-baseline gap-2 flex-1 min-w-0">
                  <span className="font-semibold whitespace-nowrap shrink-0">1. പേര് :</span>
                  <FormLineInput value={data.ownerA_name} onChange={(v) => update("ownerA_name", v)} />
                </div>
              </div>

              {/* Present Address with Photo Box at right */}
              <div className="flex gap-3 items-start pl-2 pt-0.5">
                <div className="flex-1 space-y-1">
                  <div className="flex items-baseline gap-2">
                    <span className="font-semibold whitespace-nowrap shrink-0">2. നിലവിലെ മേൽവിലാസം :</span>
                    <FormLineInput value={data.ownerA_curr_address} onChange={(v) => update("ownerA_curr_address", v)} />
                  </div>
                  <div className="pl-4">
                    <FormLineInput value={data.ownerA_curr_address2 || ""} onChange={(v) => update("ownerA_curr_address2", v)} />
                  </div>

                  <div className="grid grid-cols-2 gap-2 items-baseline pl-4">
                    <div className="flex items-baseline gap-1">
                      <span className="font-semibold whitespace-nowrap shrink-0">വില്ലേജ് :</span>
                      <FormLineInput value={data.ownerA_curr_village} onChange={(v) => update("ownerA_curr_village", v)} />
                    </div>
                    <div className="flex items-baseline gap-1">
                      <span className="font-semibold whitespace-nowrap shrink-0">താലൂക്ക് :</span>
                      <FormLineInput value={data.ownerA_curr_taluk} onChange={(v) => update("ownerA_curr_taluk", v)} />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 items-baseline pl-4">
                    <div className="flex items-baseline gap-1">
                      <span className="font-semibold whitespace-nowrap shrink-0 text-xs">കോർപ്പറേഷൻ/മുനിസിപ്പാലിറ്റി/പഞ്ചായത്ത് :</span>
                      <FormLineInput value={data.ownerA_curr_panchayath} onChange={(v) => update("ownerA_curr_panchayath", v)} />
                    </div>
                    <div className="flex items-baseline gap-1">
                      <span className="font-semibold whitespace-nowrap shrink-0">ജില്ല :</span>
                      <FormLineInput value={data.ownerA_curr_district} onChange={(v) => update("ownerA_curr_district", v)} />
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pl-4 pt-0.5">
                    <span className="font-semibold whitespace-nowrap shrink-0">പിൻ കോഡ് :</span>
                    <PinCodeGrid value={data.ownerA_curr_pincode} onChange={(v) => update("ownerA_curr_pincode", v)} />
                  </div>
                </div>

                <PhotoBox
                  photoUrl={data.ownerA_curr_photo}
                  onPhotoChange={(url) => update("ownerA_curr_photo", url)}
                />
              </div>

              {/* Permanent Address */}
              <div className="space-y-1 pl-2 pt-0.5">
                <div className="flex items-baseline gap-2">
                  <span className="font-semibold whitespace-nowrap shrink-0">3. സ്ഥിരം മേൽവിലാസം :</span>
                  <FormLineInput value={data.ownerA_perm_address} onChange={(v) => update("ownerA_perm_address", v)} />
                </div>
                <div className="pl-4">
                  <FormLineInput value={data.ownerA_perm_address2 || ""} onChange={(v) => update("ownerA_perm_address2", v)} />
                </div>

                <div className="grid grid-cols-2 gap-4 items-baseline pl-4">
                  <div className="flex items-baseline gap-1">
                    <span className="font-semibold whitespace-nowrap shrink-0">വില്ലേജ് :</span>
                    <FormLineInput value={data.ownerA_perm_village} onChange={(v) => update("ownerA_perm_village", v)} />
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="font-semibold whitespace-nowrap shrink-0">താലൂക്ക് :</span>
                    <FormLineInput value={data.ownerA_perm_taluk} onChange={(v) => update("ownerA_perm_taluk", v)} />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 items-baseline pl-4">
                  <div className="flex items-baseline gap-1">
                    <span className="font-semibold whitespace-nowrap shrink-0 text-xs">കോർപ്പറേഷൻ/മുനിസിപ്പാലിറ്റി/പഞ്ചായത്ത് :</span>
                    <FormLineInput value={data.ownerA_perm_panchayath} onChange={(v) => update("ownerA_perm_panchayath", v)} />
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="font-semibold whitespace-nowrap shrink-0">ജില്ല :</span>
                    <FormLineInput value={data.ownerA_perm_district} onChange={(v) => update("ownerA_perm_district", v)} />
                  </div>
                </div>

                <div className="flex items-center gap-3 pl-4 pt-0.5">
                  <span className="font-semibold whitespace-nowrap shrink-0">പിൻ കോഡ് :</span>
                  <PinCodeGrid value={data.ownerA_perm_pincode} onChange={(v) => update("ownerA_perm_pincode", v)} />
                </div>
              </div>

              {/* ID Proof, PAN, Experience, Nominee */}
              <div className="space-y-1 pl-2 pt-0.5">
                <div className="flex items-center gap-3">
                  <span className="font-semibold whitespace-nowrap shrink-0">4. തിരിച്ചറിയൽരേഖ :</span>
                  <OptionBox
                    label="ഇലക്ഷൻ കാർഡ്"
                    selected={data.ownerA_id_type === "Election" || data.ownerA_id_type === "Voter ID"}
                    onToggle={() => update("ownerA_id_type", "Election")}
                  />
                  <OptionBox
                    label="ആധാർ കാർഡ്"
                    selected={data.ownerA_id_type === "Aadhaar" || !data.ownerA_id_type}
                    onToggle={() => update("ownerA_id_type", "Aadhaar")}
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
                  <FormLineInput width="w-20" value={data.ownerA_exp} onChange={(v) => update("ownerA_exp", v)} />
                  <span className="font-semibold">വർഷം</span>
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
      <div className="official-form-page bg-white p-6 sm:p-9 border border-gray-300 shadow-md relative box-border min-h-[275mm] flex flex-col justify-between">
        <div className="print-page-badge absolute top-3 right-4 text-[10px] text-gray-500 font-sans bg-gray-100 px-2 py-0.5 rounded border print:hidden">
          പേജ് 2 / 5
        </div>

        <div className="space-y-4">
          {/* Partner B */}
          <div className="space-y-1">
            <p className="text-xs font-semibold text-gray-800 text-center">
              (പാർട്ണർഷിപ്പ് ഉണ്ടെങ്കിൽ രണ്ടാമത്തെ വ്യക്തിയുടെ വിവരം)
            </p>

            <div className="space-y-1 pl-1">
              <div className="flex items-center gap-2">
                <span className="border border-black px-2 py-0.5 font-bold text-xs bg-white">ബി.</span>
                <div className="flex items-baseline gap-2 flex-1 min-w-0">
                  <span className="font-semibold whitespace-nowrap shrink-0">1. പേര് :</span>
                  <FormLineInput value={data.partnerB_name} onChange={(v) => update("partnerB_name", v)} />
                </div>
              </div>

              {/* Present Address with Photo Box */}
              <div className="flex gap-3 items-start pl-2 pt-0.5">
                <div className="flex-1 space-y-1">
                  <div className="flex items-baseline gap-2">
                    <span className="font-semibold whitespace-nowrap shrink-0">2. നിലവിലെ മേൽവിലാസം :</span>
                    <FormLineInput value={data.partnerB_curr_address} onChange={(v) => update("partnerB_curr_address", v)} />
                  </div>

                  <div className="grid grid-cols-2 gap-2 items-baseline pl-4">
                    <div className="flex items-baseline gap-1">
                      <span className="font-semibold whitespace-nowrap shrink-0">വില്ലേജ് :</span>
                      <FormLineInput value={data.partnerB_curr_village} onChange={(v) => update("partnerB_curr_village", v)} />
                    </div>
                    <div className="flex items-baseline gap-1">
                      <span className="font-semibold whitespace-nowrap shrink-0">താലൂക്ക് :</span>
                      <FormLineInput value={data.partnerB_curr_taluk} onChange={(v) => update("partnerB_curr_taluk", v)} />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 items-baseline pl-4">
                    <div className="flex items-baseline gap-1">
                      <span className="font-semibold whitespace-nowrap shrink-0">പഞ്ചായത്ത് :</span>
                      <FormLineInput value={data.partnerB_curr_panchayath} onChange={(v) => update("partnerB_curr_panchayath", v)} />
                    </div>
                    <div className="flex items-baseline gap-1">
                      <span className="font-semibold whitespace-nowrap shrink-0">ജില്ല :</span>
                      <FormLineInput value={data.partnerB_curr_district} onChange={(v) => update("partnerB_curr_district", v)} />
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pl-4 pt-0.5">
                    <span className="font-semibold whitespace-nowrap shrink-0">പിൻ കോഡ് :</span>
                    <PinCodeGrid value={data.partnerB_curr_pincode} onChange={(v) => update("partnerB_curr_pincode", v)} />
                  </div>
                </div>

                <PhotoBox
                  photoUrl={data.partnerB_photo}
                  onPhotoChange={(url) => update("partnerB_photo", url)}
                />
              </div>

              {/* Permanent Address */}
              <div className="space-y-1 pl-2 pt-0.5">
                <div className="flex items-baseline gap-2">
                  <span className="font-semibold whitespace-nowrap shrink-0">3. സ്ഥിരം മേൽവിലാസം :</span>
                  <FormLineInput value={data.partnerB_perm_address} onChange={(v) => update("partnerB_perm_address", v)} />
                </div>

                <div className="grid grid-cols-2 gap-4 items-baseline pl-4">
                  <div className="flex items-baseline gap-1">
                    <span className="font-semibold whitespace-nowrap shrink-0">വില്ലേജ് :</span>
                    <FormLineInput value={data.partnerB_perm_village} onChange={(v) => update("partnerB_perm_village", v)} />
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="font-semibold whitespace-nowrap shrink-0">താലൂക്ക് :</span>
                    <FormLineInput value={data.partnerB_perm_taluk} onChange={(v) => update("partnerB_perm_taluk", v)} />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 items-baseline pl-4">
                  <div className="flex items-baseline gap-1">
                    <span className="font-semibold whitespace-nowrap shrink-0">പഞ്ചായത്ത് :</span>
                    <FormLineInput value={data.partnerB_perm_panchayath} onChange={(v) => update("partnerB_perm_panchayath", v)} />
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="font-semibold whitespace-nowrap shrink-0">ജില്ല :</span>
                    <FormLineInput value={data.partnerB_perm_district} onChange={(v) => update("partnerB_perm_district", v)} />
                  </div>
                </div>

                <div className="flex items-center gap-3 pl-4 pt-0.5">
                  <span className="font-semibold whitespace-nowrap shrink-0">പിൻ കോഡ് :</span>
                  <PinCodeGrid value={data.partnerB_perm_pincode} onChange={(v) => update("partnerB_perm_pincode", v)} />
                </div>
              </div>

              <div className="space-y-1 pl-2 pt-0.5">
                <div className="flex items-center gap-3">
                  <span className="font-semibold whitespace-nowrap shrink-0">4. തിരിച്ചറിയൽരേഖ :</span>
                  <OptionBox
                    label="ഇലക്ഷൻ കാർഡ്"
                    selected={data.partnerB_id_type === "Election" || data.partnerB_id_type === "Voter ID"}
                    onToggle={() => update("partnerB_id_type", "Election")}
                  />
                  <OptionBox
                    label="ആധാർ കാർഡ്"
                    selected={data.partnerB_id_type === "Aadhaar" || !data.partnerB_id_type}
                    onToggle={() => update("partnerB_id_type", "Aadhaar")}
                  />
                </div>

                <div className="flex items-baseline gap-2">
                  <span className="font-semibold whitespace-nowrap shrink-0">5. തിരിച്ചറിയൽ രേഖയുടെ നമ്പർ :</span>
                  <FormLineInput value={data.partnerB_id_no} onChange={(v) => update("partnerB_id_no", v)} />
                </div>

                <div className="flex items-center gap-3">
                  <span className="font-semibold whitespace-nowrap shrink-0">6. പാൻ നമ്പർ :</span>
                  <PanGrid value={data.partnerB_pan} onChange={(v) => update("partnerB_pan", v)} />
                </div>

                <div className="flex items-baseline gap-2">
                  <span className="font-semibold whitespace-nowrap shrink-0">7. നോമിനി :</span>
                  <FormLineInput value={data.partnerB_nominee} onChange={(v) => update("partnerB_nominee", v)} />
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-300" />

          {/* Partner C */}
          <div className="space-y-1">
            <p className="text-xs font-semibold text-gray-800 text-center">
              (പാർട്ണർഷിപ്പ് ഉണ്ടെങ്കിൽ മൂന്നാമത്തെ വ്യക്തിയുടെ വിവരം)
            </p>

            <div className="space-y-1 pl-1">
              <div className="flex items-center gap-2">
                <span className="border border-black px-2 py-0.5 font-bold text-xs bg-white">സി.</span>
                <div className="flex items-baseline gap-2 flex-1 min-w-0">
                  <span className="font-semibold whitespace-nowrap shrink-0">1. പേര് :</span>
                  <FormLineInput value={data.partnerC_name} onChange={(v) => update("partnerC_name", v)} />
                </div>
              </div>

              {/* Present Address with Photo Box */}
              <div className="flex gap-3 items-start pl-2 pt-0.5">
                <div className="flex-1 space-y-1">
                  <div className="flex items-baseline gap-2">
                    <span className="font-semibold whitespace-nowrap shrink-0">2. നിലവിലെ മേൽവിലാസം :</span>
                    <FormLineInput value={data.partnerC_curr_address} onChange={(v) => update("partnerC_curr_address", v)} />
                  </div>

                  <div className="grid grid-cols-2 gap-2 items-baseline pl-4">
                    <div className="flex items-baseline gap-1">
                      <span className="font-semibold whitespace-nowrap shrink-0">വില്ലേജ് :</span>
                      <FormLineInput value={data.partnerC_curr_village} onChange={(v) => update("partnerC_curr_village", v)} />
                    </div>
                    <div className="flex items-baseline gap-1">
                      <span className="font-semibold whitespace-nowrap shrink-0">താലൂക്ക് :</span>
                      <FormLineInput value={data.partnerC_curr_taluk} onChange={(v) => update("partnerC_curr_taluk", v)} />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 items-baseline pl-4">
                    <div className="flex items-baseline gap-1">
                      <span className="font-semibold whitespace-nowrap shrink-0">പഞ്ചായത്ത് :</span>
                      <FormLineInput value={data.partnerC_curr_panchayath} onChange={(v) => update("partnerC_curr_panchayath", v)} />
                    </div>
                    <div className="flex items-baseline gap-1">
                      <span className="font-semibold whitespace-nowrap shrink-0">ജില്ല :</span>
                      <FormLineInput value={data.partnerC_curr_district} onChange={(v) => update("partnerC_curr_district", v)} />
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pl-4 pt-0.5">
                    <span className="font-semibold whitespace-nowrap shrink-0">പിൻ കോഡ് :</span>
                    <PinCodeGrid value={data.partnerC_curr_pincode} onChange={(v) => update("partnerC_curr_pincode", v)} />
                  </div>
                </div>

                <PhotoBox
                  photoUrl={data.partnerC_photo}
                  onPhotoChange={(url) => update("partnerC_photo", url)}
                />
              </div>

              {/* Permanent Address */}
              <div className="space-y-1 pl-2 pt-0.5">
                <div className="flex items-baseline gap-2">
                  <span className="font-semibold whitespace-nowrap shrink-0">3. സ്ഥിരം മേൽവിലാസം :</span>
                  <FormLineInput value={data.partnerC_perm_address} onChange={(v) => update("partnerC_perm_address", v)} />
                </div>

                <div className="grid grid-cols-2 gap-4 items-baseline pl-4">
                  <div className="flex items-baseline gap-1">
                    <span className="font-semibold whitespace-nowrap shrink-0">വില്ലേജ് :</span>
                    <FormLineInput value={data.partnerC_perm_village} onChange={(v) => update("partnerC_perm_village", v)} />
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="font-semibold whitespace-nowrap shrink-0">താലൂക്ക് :</span>
                    <FormLineInput value={data.partnerC_perm_taluk} onChange={(v) => update("partnerC_perm_taluk", v)} />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 items-baseline pl-4">
                  <div className="flex items-baseline gap-1">
                    <span className="font-semibold whitespace-nowrap shrink-0">പഞ്ചായത്ത് :</span>
                    <FormLineInput value={data.partnerC_perm_panchayath} onChange={(v) => update("partnerC_perm_panchayath", v)} />
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="font-semibold whitespace-nowrap shrink-0">ജില്ല :</span>
                    <FormLineInput value={data.partnerC_perm_district} onChange={(v) => update("partnerC_perm_district", v)} />
                  </div>
                </div>

                <div className="flex items-center gap-3 pl-4 pt-0.5">
                  <span className="font-semibold whitespace-nowrap shrink-0">പിൻ കോഡ് :</span>
                  <PinCodeGrid value={data.partnerC_perm_pincode} onChange={(v) => update("partnerC_perm_pincode", v)} />
                </div>
              </div>

              <div className="space-y-1 pl-2 pt-0.5">
                <div className="flex items-center gap-3">
                  <span className="font-semibold whitespace-nowrap shrink-0">4. തിരിച്ചറിയൽരേഖ :</span>
                  <OptionBox
                    label="ഇലക്ഷൻ കാർഡ്"
                    selected={data.partnerC_id_type === "Election" || data.partnerC_id_type === "Voter ID"}
                    onToggle={() => update("partnerC_id_type", "Election")}
                  />
                  <OptionBox
                    label="ആധാർ കാർഡ്"
                    selected={data.partnerC_id_type === "Aadhaar" || !data.partnerC_id_type}
                    onToggle={() => update("partnerC_id_type", "Aadhaar")}
                  />
                </div>

                <div className="flex items-baseline gap-2">
                  <span className="font-semibold whitespace-nowrap shrink-0">5. തിരിച്ചറിയൽ രേഖയുടെ നമ്പർ :</span>
                  <FormLineInput value={data.partnerC_id_no} onChange={(v) => update("partnerC_id_no", v)} />
                </div>

                <div className="flex items-center gap-3">
                  <span className="font-semibold whitespace-nowrap shrink-0">6. പാൻ നമ്പർ :</span>
                  <PanGrid value={data.partnerC_pan} onChange={(v) => update("partnerC_pan", v)} />
                </div>

                <div className="flex items-baseline gap-2">
                  <span className="font-semibold whitespace-nowrap shrink-0">7. നോമിനി :</span>
                  <FormLineInput value={data.partnerC_nominee} onChange={(v) => update("partnerC_nominee", v)} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* PAGE 3: SECTION 3 (RIG DETAILS - A & B (Part 1))                          */}
      {/* ========================================================================= */}
      <div className="official-form-page bg-white p-6 sm:p-9 border border-gray-300 shadow-md relative box-border min-h-[275mm] flex flex-col justify-between">
        <div className="print-page-badge absolute top-3 right-4 text-[10px] text-gray-500 font-sans bg-gray-100 px-2 py-0.5 rounded border print:hidden">
          പേജ് 3 / 5
        </div>

        <div className="space-y-3">
          <h2 className="font-bold text-sm text-center">
            3. ഡ്രില്ലിംഗ് റിഗ്ഗുകളുടെ വിവരം (പരമാവധി മൂന്ന് എണ്ണം)
          </h2>

          {/* RIG A */}
          <div className="space-y-1 pl-1">
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm shrink-0">A</span>
              <div className="flex-1 min-w-0">
                <span className="font-semibold">1. റിഗ്ഗിന്റെ തരം</span>
                <span className="text-[10px] text-gray-700 ml-1">
                  (റോട്ടറി റിഗ്ഗ്, റോട്ടറി കം.ഡിറ്റിഎച്ച് റിഗ്ഗ്, കാലിക്സ് റിഗ്ഗ്, ഫിൽറ്റർ പോയിന്റ് യൂണിറ്റ്)
                </span>
                <div className="pt-0.5">
                  <FormLineInput value={data.rigA_type} onChange={(v) => update("rigA_type", v)} />
                </div>
              </div>
            </div>

            <div className="space-y-1 pl-4">
              <div className="flex items-baseline gap-2">
                <span className="font-semibold whitespace-nowrap shrink-0">2. റിഗ്ഗ് ഉടമസ്ഥന്റെ പേര് :</span>
                <FormLineInput value={data.rigA_ownerName} onChange={(v) => update("rigA_ownerName", v)} />
              </div>

              <div className="flex items-baseline gap-2">
                <span className="font-semibold whitespace-nowrap shrink-0">മേൽവിലാസം :</span>
                <FormLineInput value={data.rigA_ownerAddress} onChange={(v) => update("rigA_ownerAddress", v)} />
              </div>
              <div>
                <FormLineInput value={data.rigA_ownerAddress2 || ""} onChange={(v) => update("rigA_ownerAddress2", v)} />
              </div>

              <div className="grid grid-cols-2 gap-4 items-baseline">
                <div className="flex items-baseline gap-1">
                  <span className="font-semibold whitespace-nowrap shrink-0">ജില്ല :</span>
                  <FormLineInput value={data.rigA_ownerDistrict} onChange={(v) => update("rigA_ownerDistrict", v)} />
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="font-semibold whitespace-nowrap shrink-0">സംസ്ഥാനം:</span>
                  <FormLineInput value={data.rigA_ownerState} onChange={(v) => update("rigA_ownerState", v)} />
                </div>
              </div>

              <div className="flex items-center gap-3 pt-0.5">
                <span className="font-semibold whitespace-nowrap shrink-0">പിൻ കോഡ് :</span>
                <PinCodeGrid value={data.rigA_ownerPincode} onChange={(v) => update("rigA_ownerPincode", v)} />
              </div>

              <div className="space-y-0.5 pt-1">
                <span className="font-semibold">3. ഉപയോഗിക്കുന്ന വാഹനത്തിന്റെ വിവരം</span>
                <div className="grid grid-cols-2 gap-3 pl-3 items-baseline">
                  <div className="flex items-baseline gap-1">
                    <span className="font-semibold whitespace-nowrap shrink-0">എ. തരം</span>
                    <FormLineInput value={data.rigA_vehType} onChange={(v) => update("rigA_vehType", v)} />
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="font-semibold whitespace-nowrap shrink-0">ബി. രജി. നമ്പർ</span>
                    <FormLineInput value={data.rigA_vehRegNo} onChange={(v) => update("rigA_vehRegNo", v)} />
                  </div>
                </div>
                <div className="flex items-baseline gap-2 pl-3">
                  <span className="font-semibold whitespace-nowrap shrink-0">സി. ചേസിസ് നമ്പർ</span>
                  <FormLineInput value={data.rigA_chassisNo} onChange={(v) => update("rigA_chassisNo", v)} />
                </div>
                <div className="flex items-baseline gap-2 pl-3">
                  <span className="font-semibold whitespace-nowrap shrink-0">ഡി. എഞ്ചിൻ നമ്പർ</span>
                  <FormLineInput value={data.rigA_engineNo} onChange={(v) => update("rigA_engineNo", v)} />
                </div>
              </div>

              <div className="space-y-0.5 pt-0.5">
                <span className="font-semibold text-xs">4. കമ്പ്രസറിന്റെ വിവരം (ഡിറ്റിഎച്ച / റോട്ടറി കം.ഡിറ്റിഎച്ച് / ഫിൽറ്റർ പോയിന്റ് )</span>
                <div className="grid grid-cols-2 gap-3 pl-3 items-baseline">
                  <div className="flex items-baseline gap-1">
                    <span className="font-semibold whitespace-nowrap shrink-0">എ. മോഡൽ</span>
                    <FormLineInput value={data.rigA_compModel} onChange={(v) => update("rigA_compModel", v)} />
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="font-semibold whitespace-nowrap shrink-0">ബി. കപ്പാസിറ്റി</span>
                    <FormLineInput value={data.rigA_compCapacity} onChange={(v) => update("rigA_compCapacity", v)} />
                  </div>
                </div>
              </div>

              <div className="space-y-0.5 pt-0.5">
                <span className="font-semibold text-xs">5. ജനറേറ്ററിന്റെ വിവരം (ക്യാലിക്സ് റിഗ്ഗ്)</span>
                <div className="grid grid-cols-2 gap-3 pl-3 items-baseline">
                  <div className="flex items-baseline gap-1">
                    <span className="font-semibold whitespace-nowrap shrink-0">എ. തരം</span>
                    <FormLineInput value={data.rigA_genType} onChange={(v) => update("rigA_genType", v)} />
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="font-semibold whitespace-nowrap shrink-0">ബി. മോഡൽ</span>
                    <FormLineInput value={data.rigA_genModel} onChange={(v) => update("rigA_genModel", v)} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 pl-3 items-baseline">
                  <div className="flex items-baseline gap-1">
                    <span className="font-semibold whitespace-nowrap shrink-0">സി. കപ്പാസിറ്റി</span>
                    <FormLineInput value={data.rigA_genCapacity} onChange={(v) => update("rigA_genCapacity", v)} />
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="font-semibold whitespace-nowrap shrink-0">ഡി. എഞ്ചിൻ നമ്പർ</span>
                    <FormLineInput value={data.rigA_genEngineNo} onChange={(v) => update("rigA_genEngineNo", v)} />
                  </div>
                </div>
              </div>

              <div className="space-y-0.5 pt-0.5">
                <span className="font-semibold text-xs">6. കുഴിക്കാൻ സാധിക്കുന്ന കിണറിന്റെ സ്പെസിഫിക്കേഷൻ (കംപ്രസ്സർ കപ്പാസിറ്റിയുടെ അടിസ്ഥാനത്തിൽ)</span>
                <div className="grid grid-cols-2 gap-3 pl-3 items-baseline">
                  <div className="flex items-baseline gap-1">
                    <span className="font-semibold whitespace-nowrap shrink-0">എ. പരമാവധി ആഴം</span>
                    <FormLineInput value={data.rigA_maxDepth} onChange={(v) => update("rigA_maxDepth", v)} />
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="font-semibold whitespace-nowrap shrink-0">ബി. പരമാവധി വ്യാസം</span>
                    <FormLineInput value={data.rigA_maxDia} onChange={(v) => update("rigA_maxDia", v)} />
                  </div>
                </div>
              </div>

              <div className="space-y-0.5 pt-0.5">
                <span className="font-semibold text-xs">7. ഡ്രില്ലിംഗ് യന്ത്ര ഓപ്പറേറ്ററുടെ വിവരങ്ങൾ</span>
                <div className="grid grid-cols-3 gap-2 pl-3 items-baseline">
                  <div className="col-span-2 flex items-baseline gap-1">
                    <span className="font-semibold whitespace-nowrap shrink-0">പേര് :</span>
                    <FormLineInput value={data.rigA_opName} onChange={(v) => update("rigA_opName", v)} />
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="font-semibold whitespace-nowrap shrink-0">വയസ് :</span>
                    <FormLineInput width="w-16" value={data.rigA_opAge} onChange={(v) => update("rigA_opAge", v)} />
                  </div>
                </div>
                <div className="flex items-baseline gap-2 pl-3">
                  <span className="font-semibold whitespace-nowrap shrink-0">പ്രവർത്തി പരിചയം :</span>
                  <FormLineInput value={data.rigA_opExp} onChange={(v) => update("rigA_opExp", v)} />
                </div>
                <div className="flex items-center gap-3 pl-3">
                  <span className="font-semibold whitespace-nowrap shrink-0">തിരിച്ചറിയൽ രേഖ :</span>
                  <OptionBox
                    label="ഇലക്ഷൻ കാർഡ്"
                    selected={data.rigA_opIdType === "Election"}
                    onToggle={() => update("rigA_opIdType", "Election")}
                  />
                  <OptionBox
                    label="ആധാർ കാർഡ്"
                    selected={data.rigA_opIdType === "Aadhaar" || !data.rigA_opIdType}
                    onToggle={() => update("rigA_opIdType", "Aadhaar")}
                  />
                </div>
                <div className="flex items-baseline gap-2 pl-3">
                  <span className="font-semibold whitespace-nowrap shrink-0">തിരിച്ചറിയൽ രേഖയുടെ നമ്പർ :</span>
                  <FormLineInput value={data.rigA_opIdNo} onChange={(v) => update("rigA_opIdNo", v)} />
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-300" />

          {/* RIG B (Part 1 on Page 3) */}
          <div className="space-y-1 pl-1">
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm shrink-0">B</span>
              <div className="flex-1 min-w-0">
                <span className="font-semibold">1. റിഗ്ഗിന്റെ തരം</span>
                <span className="text-[10px] text-gray-700 ml-1">
                  (റോട്ടറി റിഗ്ഗ്, റോട്ടറി കം.ഡിറ്റിഎച്ച് റിഗ്ഗ്, കാലിക്സ് റിഗ്ഗ്, ഫിൽറ്റർ പോയിന്റ് യൂണിറ്റ്)
                </span>
                <div className="pt-0.5">
                  <FormLineInput value={data.rigB_type} onChange={(v) => update("rigB_type", v)} />
                </div>
              </div>
            </div>

            <div className="space-y-1 pl-4">
              <div className="flex items-baseline gap-2">
                <span className="font-semibold whitespace-nowrap shrink-0">2. റിഗ്ഗ് ഉടമസ്ഥന്റെ പേര് :</span>
                <FormLineInput value={data.rigB_ownerName} onChange={(v) => update("rigB_ownerName", v)} />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="font-semibold whitespace-nowrap shrink-0">മേൽവിലാസം :</span>
                <FormLineInput value={data.rigB_ownerAddress} onChange={(v) => update("rigB_ownerAddress", v)} />
              </div>

              <div className="grid grid-cols-2 gap-4 items-baseline">
                <div className="flex items-baseline gap-1">
                  <span className="font-semibold whitespace-nowrap shrink-0">ജില്ല :</span>
                  <FormLineInput value={data.rigB_ownerDistrict} onChange={(v) => update("rigB_ownerDistrict", v)} />
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="font-semibold whitespace-nowrap shrink-0">സംസ്ഥാനം :</span>
                  <FormLineInput value={data.rigB_ownerState} onChange={(v) => update("rigB_ownerState", v)} />
                </div>
              </div>

              <div className="flex items-center gap-3 pt-0.5">
                <span className="font-semibold whitespace-nowrap shrink-0">പിൻ കോഡ് :</span>
                <PinCodeGrid value={data.rigB_ownerPincode} onChange={(v) => update("rigB_ownerPincode", v)} />
              </div>

              <div className="space-y-0.5 pt-0.5">
                <span className="font-semibold text-xs">3. ഉപയോഗിക്കുന്ന വാഹനത്തിന്റെ വിവരം</span>
                <div className="grid grid-cols-2 gap-3 pl-3 items-baseline">
                  <div className="flex items-baseline gap-1">
                    <span className="font-semibold whitespace-nowrap shrink-0">എ. തരം</span>
                    <FormLineInput value={data.rigB_vehType} onChange={(v) => update("rigB_vehType", v)} />
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="font-semibold whitespace-nowrap shrink-0">ബി. രജി. നമ്പർ</span>
                    <FormLineInput value={data.rigB_vehRegNo} onChange={(v) => update("rigB_vehRegNo", v)} />
                  </div>
                </div>
                <div className="flex items-baseline gap-2 pl-3">
                  <span className="font-semibold whitespace-nowrap shrink-0">സി. ചേസിസ് നമ്പർ</span>
                  <FormLineInput value={data.rigB_chassisNo} onChange={(v) => update("rigB_chassisNo", v)} />
                </div>
                <div className="flex items-baseline gap-2 pl-3">
                  <span className="font-semibold whitespace-nowrap shrink-0">ഡി. എഞ്ചിൻ നമ്പർ</span>
                  <FormLineInput value={data.rigB_engineNo} onChange={(v) => update("rigB_engineNo", v)} />
                </div>
              </div>

              <div className="space-y-0.5 pt-0.5">
                <span className="font-semibold text-xs">4. കമ്പ്രസറിന്റെ വിവരം (ഡിറ്റിഎച്ച / റോട്ടറി കം.ഡിറ്റിഎച്ച് / ഫിൽറ്റർ പോയിന്റ് )</span>
                <div className="grid grid-cols-2 gap-3 pl-3 items-baseline">
                  <div className="flex items-baseline gap-1">
                    <span className="font-semibold whitespace-nowrap shrink-0">എ. മോഡൽ</span>
                    <FormLineInput value={data.rigB_compModel} onChange={(v) => update("rigB_compModel", v)} />
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="font-semibold whitespace-nowrap shrink-0">ബി. കപ്പാസിറ്റി</span>
                    <FormLineInput value={data.rigB_compCapacity} onChange={(v) => update("rigB_compCapacity", v)} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* PAGE 4: RIG B (Part 2), RIG C, & DECLARATION (സത്യപ്രസ്താവന)            */}
      {/* ========================================================================= */}
      <div className="official-form-page bg-white p-6 sm:p-9 border border-gray-300 shadow-md relative box-border min-h-[275mm] flex flex-col justify-between">
        <div className="print-page-badge absolute top-3 right-4 text-[10px] text-gray-500 font-sans bg-gray-100 px-2 py-0.5 rounded border print:hidden">
          പേജ് 4 / 5
        </div>

        <div className="space-y-2.5">
          {/* RIG B (Continuation on Page 4) */}
          <div className="space-y-1 pl-4">
            <div className="space-y-0.5">
              <span className="font-semibold text-xs">5. ജനറേറ്ററിന്റെ വിവരം (ക്യാലിക്സ് റിഗ്ഗ്)</span>
              <div className="grid grid-cols-2 gap-3 pl-3 items-baseline">
                <div className="flex items-baseline gap-1">
                  <span className="font-semibold whitespace-nowrap shrink-0">എ. തരം</span>
                  <FormLineInput value={data.rigB_genType} onChange={(v) => update("rigB_genType", v)} />
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="font-semibold whitespace-nowrap shrink-0">ബി. മോഡൽ</span>
                  <FormLineInput value={data.rigB_genModel} onChange={(v) => update("rigB_genModel", v)} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 pl-3 items-baseline">
                <div className="flex items-baseline gap-1">
                  <span className="font-semibold whitespace-nowrap shrink-0">സി. കപ്പാസിറ്റി</span>
                  <FormLineInput value={data.rigB_genCapacity} onChange={(v) => update("rigB_genCapacity", v)} />
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="font-semibold whitespace-nowrap shrink-0">ഡി. എഞ്ചിൻ നമ്പർ</span>
                  <FormLineInput value={data.rigB_genEngineNo} onChange={(v) => update("rigB_genEngineNo", v)} />
                </div>
              </div>
            </div>

            <div className="space-y-0.5 pt-0.5">
              <span className="font-semibold text-xs">6. കുഴിക്കാൻ സാധിക്കുന്ന കിണറിന്റെ സ്പെസിഫിക്കേഷൻ (കംപ്രസ്സർ കപ്പാസിറ്റിയുടെ അടിസ്ഥാനത്തിൽ)</span>
              <div className="grid grid-cols-2 gap-3 pl-3 items-baseline">
                <div className="flex items-baseline gap-1">
                  <span className="font-semibold whitespace-nowrap shrink-0">എ. പരമാവധി ആഴം</span>
                  <FormLineInput value={data.rigB_maxDepth} onChange={(v) => update("rigB_maxDepth", v)} />
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="font-semibold whitespace-nowrap shrink-0">ബി. പരമാവധി വ്യാസം</span>
                  <FormLineInput value={data.rigB_maxDia} onChange={(v) => update("rigB_maxDia", v)} />
                </div>
              </div>
            </div>

            <div className="space-y-0.5 pt-0.5">
              <span className="font-semibold text-xs">7. ഡ്രില്ലിംഗ് യന്ത്ര ഓപ്പറേറ്ററുടെ വിവരങ്ങൾ</span>
              <div className="grid grid-cols-3 gap-2 pl-3 items-baseline">
                <div className="col-span-2 flex items-baseline gap-1">
                  <span className="font-semibold whitespace-nowrap shrink-0">പേര് :</span>
                  <FormLineInput value={data.rigB_opName} onChange={(v) => update("rigB_opName", v)} />
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="font-semibold whitespace-nowrap shrink-0">വയസ് :</span>
                  <FormLineInput width="w-16" value={data.rigB_opAge} onChange={(v) => update("rigB_opAge", v)} />
                </div>
              </div>
              <div className="flex items-baseline gap-2 pl-3">
                <span className="font-semibold whitespace-nowrap shrink-0">പ്രവർത്തി പരിചയം :</span>
                <FormLineInput value={data.rigB_opExp} onChange={(v) => update("rigB_opExp", v)} />
              </div>
              <div className="flex items-center gap-3 pl-3">
                <span className="font-semibold whitespace-nowrap shrink-0">തിരിച്ചറിയൽ രേഖ :</span>
                <OptionBox
                  label="ഇലക്ഷൻ കാർഡ്"
                  selected={data.rigB_opIdType === "Election"}
                  onToggle={() => update("rigB_opIdType", "Election")}
                />
                <OptionBox
                  label="ആധാർ കാർഡ്"
                  selected={data.rigB_opIdType === "Aadhaar" || !data.rigB_opIdType}
                  onToggle={() => update("rigB_opIdType", "Aadhaar")}
                />
              </div>
              <div className="flex items-baseline gap-2 pl-3">
                <span className="font-semibold whitespace-nowrap shrink-0">തിരിച്ചറിയൽ രേഖയുടെ നമ്പർ :</span>
                <FormLineInput value={data.rigB_opIdNo} onChange={(v) => update("rigB_opIdNo", v)} />
              </div>
            </div>
          </div>

          <div className="border-t border-gray-300" />

          {/* RIG C */}
          <div className="space-y-1 pl-1">
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm shrink-0">C</span>
              <div className="flex-1 min-w-0">
                <span className="font-semibold">1. റിഗ്ഗിന്റെ തരം</span>
                <span className="text-[10px] text-gray-700 ml-1">
                  (റോട്ടറി റിഗ്ഗ്, റോട്ടറി കം.ഡിറ്റിഎച്ച് റിഗ്ഗ്, കാലിക്സ് റിഗ്ഗ്, ഫിൽറ്റർ പോയിന്റ് യൂണിറ്റ്)
                </span>
                <div className="pt-0.5">
                  <FormLineInput value={data.rigC_type} onChange={(v) => update("rigC_type", v)} />
                </div>
              </div>
            </div>

            <div className="space-y-1 pl-4">
              <div className="flex items-baseline gap-2">
                <span className="font-semibold whitespace-nowrap shrink-0">2. റിഗ്ഗ് ഉടമസ്ഥന്റെ പേര് :</span>
                <FormLineInput value={data.rigC_ownerName} onChange={(v) => update("rigC_ownerName", v)} />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="font-semibold whitespace-nowrap shrink-0">മേൽവിലാസം :</span>
                <FormLineInput value={data.rigC_ownerAddress} onChange={(v) => update("rigC_ownerAddress", v)} />
              </div>

              <div className="grid grid-cols-2 gap-4 items-baseline">
                <div className="flex items-baseline gap-1">
                  <span className="font-semibold whitespace-nowrap shrink-0">ജില്ല :</span>
                  <FormLineInput value={data.rigC_ownerDistrict} onChange={(v) => update("rigC_ownerDistrict", v)} />
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="font-semibold whitespace-nowrap shrink-0">സംസ്ഥാനം :</span>
                  <FormLineInput value={data.rigC_ownerState} onChange={(v) => update("rigC_ownerState", v)} />
                </div>
              </div>

              <div className="flex items-center gap-3 pt-0.5">
                <span className="font-semibold whitespace-nowrap shrink-0">പിൻ കോഡ് :</span>
                <PinCodeGrid value={data.rigC_ownerPincode} onChange={(v) => update("rigC_ownerPincode", v)} />
              </div>

              <div className="space-y-0.5 pt-0.5">
                <span className="font-semibold text-xs">3. ഉപയോഗിക്കുന്ന വാഹനത്തിന്റെ വിവരം</span>
                <div className="grid grid-cols-2 gap-3 pl-3 items-baseline">
                  <div className="flex items-baseline gap-1">
                    <span className="font-semibold whitespace-nowrap shrink-0">എ. തരം</span>
                    <FormLineInput value={data.rigC_vehType} onChange={(v) => update("rigC_vehType", v)} />
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="font-semibold whitespace-nowrap shrink-0">ബി. രജി. നമ്പർ</span>
                    <FormLineInput value={data.rigC_vehRegNo} onChange={(v) => update("rigC_vehRegNo", v)} />
                  </div>
                </div>
                <div className="flex items-baseline gap-2 pl-3">
                  <span className="font-semibold whitespace-nowrap shrink-0">സി. ചേസിസ് നമ്പർ</span>
                  <FormLineInput value={data.rigC_chassisNo} onChange={(v) => update("rigC_chassisNo", v)} />
                </div>
                <div className="flex items-baseline gap-2 pl-3">
                  <span className="font-semibold whitespace-nowrap shrink-0">ഡി. എഞ്ചിൻ നമ്പർ</span>
                  <FormLineInput value={data.rigC_engineNo} onChange={(v) => update("rigC_engineNo", v)} />
                </div>
              </div>

              <div className="space-y-0.5 pt-0.5">
                <span className="font-semibold text-xs">4. കമ്പ്രസറിന്റെ വിവരം (ഡിറ്റിഎച്ച / റോട്ടറി കം.ഡിറ്റിഎച്ച് / ഫിൽറ്റർ പോയിന്റ് )</span>
                <div className="grid grid-cols-2 gap-3 pl-3 items-baseline">
                  <div className="flex items-baseline gap-1">
                    <span className="font-semibold whitespace-nowrap shrink-0">എ. മോഡൽ</span>
                    <FormLineInput value={data.rigC_compModel} onChange={(v) => update("rigC_compModel", v)} />
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="font-semibold whitespace-nowrap shrink-0">ബി. കപ്പാസിറ്റി</span>
                    <FormLineInput value={data.rigC_compCapacity} onChange={(v) => update("rigC_compCapacity", v)} />
                  </div>
                </div>
              </div>

              <div className="space-y-0.5 pt-0.5">
                <span className="font-semibold text-xs">5. ജനറേറ്ററിന്റെ വിവരം (ക്യാലിക്സ് റിഗ്ഗ്)</span>
                <div className="grid grid-cols-2 gap-3 pl-3 items-baseline">
                  <div className="flex items-baseline gap-1">
                    <span className="font-semibold whitespace-nowrap shrink-0">എ. തരം</span>
                    <FormLineInput value={data.rigC_genType} onChange={(v) => update("rigC_genType", v)} />
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="font-semibold whitespace-nowrap shrink-0">ബി. മോഡൽ</span>
                    <FormLineInput value={data.rigC_genModel} onChange={(v) => update("rigC_genModel", v)} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 pl-3 items-baseline">
                  <div className="flex items-baseline gap-1">
                    <span className="font-semibold whitespace-nowrap shrink-0">സി. കപ്പാസിറ്റി</span>
                    <FormLineInput value={data.rigC_genCapacity} onChange={(v) => update("rigC_genCapacity", v)} />
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="font-semibold whitespace-nowrap shrink-0">ഡി. എഞ്ചിൻ നമ്പർ</span>
                    <FormLineInput value={data.rigC_genEngineNo} onChange={(v) => update("rigC_genEngineNo", v)} />
                  </div>
                </div>
              </div>

              <div className="space-y-0.5 pt-0.5">
                <span className="font-semibold text-xs">6. കുഴിക്കാൻ സാധിക്കുന്ന കിണറിന്റെ സ്പെസിഫിക്കേഷൻ (കംപ്രസ്സർ കപ്പാസിറ്റിയുടെ അടിസ്ഥാനത്തിൽ)</span>
                <div className="grid grid-cols-2 gap-3 pl-3 items-baseline">
                  <div className="flex items-baseline gap-1">
                    <span className="font-semibold whitespace-nowrap shrink-0">എ. പരമാവധി ആഴം</span>
                    <FormLineInput value={data.rigC_maxDepth} onChange={(v) => update("rigC_maxDepth", v)} />
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="font-semibold whitespace-nowrap shrink-0">ബി. പരമാവധി വ്യാസം</span>
                    <FormLineInput value={data.rigC_maxDia} onChange={(v) => update("rigC_maxDia", v)} />
                  </div>
                </div>
              </div>

              <div className="space-y-0.5 pt-0.5">
                <span className="font-semibold text-xs">7. ഡ്രില്ലിംഗ് യന്ത്ര ഓപ്പറേറ്ററുടെ വിവരങ്ങൾ</span>
                <div className="grid grid-cols-3 gap-2 pl-3 items-baseline">
                  <div className="col-span-2 flex items-baseline gap-1">
                    <span className="font-semibold whitespace-nowrap shrink-0">പേര് :</span>
                    <FormLineInput value={data.rigC_opName} onChange={(v) => update("rigC_opName", v)} />
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="font-semibold whitespace-nowrap shrink-0">വയസ് :</span>
                    <FormLineInput width="w-16" value={data.rigC_opAge} onChange={(v) => update("rigC_opAge", v)} />
                  </div>
                </div>
                <div className="flex items-baseline gap-2 pl-3">
                  <span className="font-semibold whitespace-nowrap shrink-0">പ്രവർത്തി പരിചയം :</span>
                  <FormLineInput value={data.rigC_opExp} onChange={(v) => update("rigC_opExp", v)} />
                </div>
                <div className="flex items-center gap-3 pl-3">
                  <span className="font-semibold whitespace-nowrap shrink-0">തിരിച്ചറിയൽ രേഖ :</span>
                  <OptionBox
                    label="ഇലക്ഷൻ കാർഡ്"
                    selected={data.rigC_opIdType === "Election"}
                    onToggle={() => update("rigC_opIdType", "Election")}
                  />
                  <OptionBox
                    label="ആധാർ കാർഡ്"
                    selected={data.rigC_opIdType === "Aadhaar" || !data.rigC_opIdType}
                    onToggle={() => update("rigC_opIdType", "Aadhaar")}
                  />
                </div>
                <div className="flex items-baseline gap-2 pl-3">
                  <span className="font-semibold whitespace-nowrap shrink-0">തിരിച്ചറിയൽ രേഖയുടെ നമ്പർ :</span>
                  <FormLineInput value={data.rigC_opIdNo} onChange={(v) => update("rigC_opIdNo", v)} />
                </div>
              </div>
            </div>
          </div>

          {/* Declaration Section */}
          <div className="pt-2">
            <div className="border-t-2 border-b border-black py-0.5 my-1" />
            <div className="space-y-2 pt-1 text-center">
              <h3 className="font-bold text-sm">സത്യപ്രസ്താവന</h3>
              <p className="text-xs leading-relaxed text-center px-4">
                മേൽ നൽകിയിട്ടുള്ള വിവരങ്ങൾ എന്റെ അറിവിലും വിശ്വാസത്തിലും കൃത്യവും സത്യസന്ധവുമാണെന്ന് സാക്ഷ്യപ്പെടുത്തുന്നു.
              </p>
              <div className="flex justify-between items-end pt-4 px-2">
                <div className="space-y-1 text-left">
                  <div className="flex items-baseline gap-1">
                    <span className="font-semibold text-xs">തീയതി :</span>
                    <FormDateInput value={data.declarationDate} onChange={(v) => update("declarationDate", v)} />
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="font-semibold text-xs">സ്ഥലം :</span>
                    <FormLineInput width="w-28" value={data.declarationPlace} onChange={(v) => update("declarationPlace", v)} />
                  </div>
                </div>
                <div className="text-right space-y-1">
                  <p className="font-bold text-xs">ഒപ്പ്</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* PAGE 5: OFFICE USE ONLY (ഓഫീസ് ഉപയോഗത്തിന്) & RECEIPT (രസീത്)               */}
      {/* ========================================================================= */}
      <div className="official-form-page bg-white p-6 sm:p-9 border border-gray-300 shadow-md relative box-border min-h-[275mm] flex flex-col justify-between">
        <div className="print-page-badge absolute top-3 right-4 text-[10px] text-gray-500 font-sans bg-gray-100 px-2 py-0.5 rounded border print:hidden">
          പേജ് 5 / 5
        </div>

        <div className="space-y-6 flex-1 flex flex-col justify-between">
          {/* Top Section: ഓഫീസ് ഉപയോഗത്തിന് */}
          <div className="border border-black p-4 space-y-3">
            <div className="border-b border-black pb-1 text-center">
              <h3 className="font-bold text-sm">ഓഫീസ് ഉപയോഗത്തിന്</h3>
            </div>

            <div className="space-y-2.5 pt-1">
              <div className="flex items-baseline gap-2">
                <span className="font-semibold whitespace-nowrap shrink-0">അപേക്ഷ ലഭിച്ച തീയതി :</span>
                <FormDateInput value={data.office_appReceivedDate} onChange={(v) => update("office_appReceivedDate", v)} />
              </div>

              <div className="flex items-baseline gap-2">
                <span className="font-semibold whitespace-nowrap shrink-0">അപേക്ഷാ ഫീസ് അടച്ച വിവരങ്ങൾ :</span>
                <FormLineInput value={data.office_feeDetails} onChange={(v) => update("office_feeDetails", v)} />
              </div>

              <div className="flex items-baseline gap-2">
                <span className="font-semibold whitespace-nowrap shrink-0">അടച്ച തുക :</span>
                <FormLineInput width="w-36" value={data.office_feeAmount} onChange={(v) => update("office_feeAmount", v)} />
              </div>

              <div className="flex items-baseline gap-2">
                <span className="font-semibold whitespace-nowrap shrink-0">റിഗ്ഗ് പരിശോധിച്ച തീയതി :</span>
                <FormDateInput value={data.office_rigInspectionDate} onChange={(v) => update("office_rigInspectionDate", v)} />
              </div>

              <div className="space-y-1">
                <span className="font-semibold whitespace-nowrap shrink-0">പരിശോധകന്റെ ശുപാർശ :</span>
                <div className="space-y-1 pt-1">
                  <FormLineInput value={data.office_recommendation1 || ""} onChange={(v) => update("office_recommendation1", v)} />
                  <FormLineInput value={data.office_recommendation2 || ""} onChange={(v) => update("office_recommendation2", v)} />
                  <FormLineInput value={data.office_recommendation3 || ""} onChange={(v) => update("office_recommendation3", v)} />
                </div>
              </div>

              <div className="flex justify-between items-end pt-8 px-2">
                <div className="text-left space-y-0.5">
                  <p className="font-bold text-xs">പരിശോധകന്റെ ഒപ്പ്</p>
                  <p className="text-[10px] text-gray-700">(പേര് തസ്തിക ഉൾപ്പടെ)</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-xs">ജില്ലാ ആഫീസർ</p>
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-dashed border-black my-2" />

          {/* Bottom Section: രസീത് */}
          <div className="space-y-3 pt-1">
            <div className="flex justify-center">
              <div className="border border-black rounded-full px-8 py-0.5 font-bold text-sm bg-white text-center">
                രസീത്
              </div>
            </div>

            <div className="space-y-2 pl-2">
              <div className="flex items-baseline gap-2">
                <span className="font-semibold whitespace-nowrap shrink-0">അപേക്ഷാ നമ്പർ :</span>
                <FormLineInput value={data.receipt_appNo} onChange={(v) => update("receipt_appNo", v)} />
              </div>

              <div className="flex items-baseline gap-2">
                <span className="font-semibold whitespace-nowrap shrink-0">അപേക്ഷകന്റെ പേര് :</span>
                <FormLineInput value={data.receipt_applicantName} onChange={(v) => update("receipt_applicantName", v)} />
              </div>

              <div className="flex items-baseline gap-2">
                <span className="font-semibold whitespace-nowrap shrink-0">അപേക്ഷ ലഭിച്ച തീയതി :</span>
                <FormDateInput value={data.receipt_receivedDate} onChange={(v) => update("receipt_receivedDate", v)} />
              </div>

              <div className="space-y-1">
                <span className="font-semibold">അപേക്ഷാ ഫീസ് ഒടുക്കിയ വിവരങ്ങൾ :</span>
                <div className="grid grid-cols-2 gap-4 items-baseline pl-4">
                  <div className="flex items-baseline gap-1">
                    <span className="font-semibold whitespace-nowrap shrink-0">ഒടുക്കിയ തുക :</span>
                    <FormLineInput value={data.receipt_feeAmount} onChange={(v) => update("receipt_feeAmount", v)} />
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="font-semibold whitespace-nowrap shrink-0">തീയതി :</span>
                    <FormDateInput value={data.receipt_feeDate} onChange={(v) => update("receipt_feeDate", v)} />
                  </div>
                </div>
              </div>

              <div className="space-y-2 pt-1">
                <span className="font-semibold">അപേക്ഷാ വിവരങ്ങൾ :</span>
                <div className="space-y-2 pl-4">
                  <div className="flex items-center gap-4">
                    <span className="font-semibold text-xs whitespace-nowrap shrink-0 w-36">ഏജൻസി രജിസ്ട്രേഷൻ :</span>
                    <div className="w-16 h-7 border border-black flex items-center justify-center font-bold text-xs bg-white">
                      {data.receipt_hasAgencyReg ? "✓" : ""}
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="font-semibold text-xs whitespace-nowrap shrink-0 w-36">റിഗ്ഗ് രജിസ്ട്രേഷൻ :</span>
                    <div className="flex gap-2">
                      <div className="w-16 h-7 border border-black flex items-center justify-center font-bold text-xs bg-white">
                        {data.receipt_rigCount >= 1 || data.rigA_vehRegNo ? "Rig 1" : ""}
                      </div>
                      <div className="w-16 h-7 border border-black flex items-center justify-center font-bold text-xs bg-white">
                        {data.receipt_rigCount >= 2 || data.rigB_vehRegNo ? "Rig 2" : ""}
                      </div>
                      <div className="w-16 h-7 border border-black flex items-center justify-center font-bold text-xs bg-white">
                        {data.receipt_rigCount >= 3 || data.rigC_vehRegNo ? "Rig 3" : ""}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-between items-end pt-8 px-2">
                <div className="flex items-baseline gap-1">
                  <span className="font-semibold text-xs">തീയതി :</span>
                  <FormDateInput value={data.receipt_signDate} onChange={(v) => update("receipt_signDate", v)} />
                </div>
                <div className="text-right">
                  <p className="font-bold text-xs">ജില്ലാ ആഫീസർ</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
