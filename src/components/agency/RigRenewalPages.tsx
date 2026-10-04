"use client";

import React from "react";
import {
  PinCodeGrid,
  FormLineInput,
  FormDateInput,
  OptionBox,
  YesNoBox,
} from "./FormInputComponents";

interface FormProps {
  data: Record<string, any>;
  update: (k: string, v: any) => void;
}

// Single Rig Details Sheet component for Rig Renewal (Rig 1 on Page 2, Rig 2 on Page 3, Rig 3 on Page 4)
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
    <div className="official-form-page bg-white p-6 sm:p-9 border border-gray-300 shadow-md relative box-border min-h-0 print:min-h-[265mm] flex flex-col justify-start space-y-3">
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
              2. റെജിസ്ട്രേഷൻ അവസാനിക്കുന്ന തീയതി <span className="font-normal text-[10px]">(റെജിസ്ട്രേഷൻ പുതുക്കുന്നതിന് മാത്രം)</span>
            </span>
            <FormDateInput value={data[`${rigKey}_expiryDate`]} onChange={(v) => update(`${rigKey}_expiryDate`, v)} />
          </div>

          <div className="space-y-0.5">
            <span className="font-semibold">3. റിഗ്ഗിന്റെ തരം</span>
            <span className="text-[10px] text-gray-700 ml-1">
              (റോട്ടറി റിഗ്ഗ്, റോട്ടറി കം.ഡിറ്റിഎച്ച് റിഗ്ഗ്, കാലിക്സ് റിഗ്ഗ്, ഫിൽറ്റർ പോയിന്റ് യൂണിറ്റ്)
            </span>
            <div className="pt-0.5">
              <FormLineInput value={data[`${rigKey}_type`]} onChange={(v) => update(`${rigKey}_type`, v)} />
            </div>
          </div>

          <div className="space-y-1 pl-1">
            <div className="flex items-baseline gap-2">
              <span className="font-semibold whitespace-nowrap shrink-0">4. റിഗ്ഗ് ഉടമസ്ഥന്റെ പേര് :</span>
              <FormLineInput value={data[`${rigKey}_ownerName`]} onChange={(v) => update(`${rigKey}_ownerName`, v)} />
            </div>

            <div className="flex items-baseline gap-2">
              <span className="font-semibold whitespace-nowrap shrink-0">മേൽവിലാസം :</span>
              <FormLineInput value={data[`${rigKey}_ownerAddress`]} onChange={(v) => update(`${rigKey}_ownerAddress`, v)} />
            </div>
            <div>
              <FormLineInput value={data[`${rigKey}_ownerAddress2`] || ""} onChange={(v) => update(`${rigKey}_ownerAddress2`, v)} />
            </div>

            <div className="grid grid-cols-2 gap-4 items-baseline">
              <div className="flex items-baseline gap-1">
                <span className="font-semibold whitespace-nowrap shrink-0">ഫോൺ :</span>
                <FormLineInput value={data[`${rigKey}_ownerPhone`]} onChange={(v) => update(`${rigKey}_ownerPhone`, v)} />
              </div>
              <div className="flex items-baseline gap-1">
                <span className="font-semibold whitespace-nowrap shrink-0">മൊബൈൽ :</span>
                <FormLineInput value={data[`${rigKey}_ownerMobile`]} onChange={(v) => update(`${rigKey}_ownerMobile`, v)} />
              </div>
            </div>

            <div className="flex items-baseline gap-2">
              <span className="font-semibold whitespace-nowrap shrink-0">ഇ മെയിൽ :</span>
              <FormLineInput value={data[`${rigKey}_ownerEmail`]} onChange={(v) => update(`${rigKey}_ownerEmail`, v)} />
            </div>

            <div className="grid grid-cols-2 gap-4 items-baseline">
              <div className="flex items-baseline gap-1">
                <span className="font-semibold whitespace-nowrap shrink-0">ജില്ല :</span>
                <FormLineInput value={data[`${rigKey}_ownerDistrict`]} onChange={(v) => update(`${rigKey}_ownerDistrict`, v)} />
              </div>
              <div className="flex items-baseline gap-1">
                <span className="font-semibold whitespace-nowrap shrink-0">സംസ്ഥാനം:</span>
                <FormLineInput value={data[`${rigKey}_ownerState`]} onChange={(v) => update(`${rigKey}_ownerState`, v)} />
              </div>
            </div>

            <div className="flex items-center gap-3 pt-0.5">
              <span className="font-semibold whitespace-nowrap shrink-0">പിൻ കോഡ് :</span>
              <PinCodeGrid value={data[`${rigKey}_ownerPincode`]} onChange={(v) => update(`${rigKey}_ownerPincode`, v)} />
            </div>
          </div>

          {/* 5. ഉപയോഗിക്കുന്ന വാഹനങ്ങളുടെ വിവരങ്ങൾ */}
          <div className="space-y-1 pt-1">
            <span className="font-semibold">5. ഉപയോഗിക്കുന്ന വാഹനങ്ങളുടെ വിവരങ്ങൾ</span>
            
            <div className="pl-3 space-y-1">
              <div className="flex items-baseline gap-2">
                <span className="font-semibold text-xs whitespace-nowrap shrink-0">എ. കംപ്രസ്സർ / റിഗ്ഗ് ഘടിപ്പിച്ച വാഹനം</span>
                <span className="font-semibold text-xs whitespace-nowrap shrink-0">രജി. നമ്പർ :</span>
                <FormLineInput value={data[`${rigKey}_vehRegNo`]} onChange={(v) => update(`${rigKey}_vehRegNo`, v)} />
              </div>
              <div className="flex items-baseline gap-2 pl-4">
                <span className="font-semibold text-xs whitespace-nowrap shrink-0">ചേസിസ് നമ്പർ :</span>
                <FormLineInput value={data[`${rigKey}_chassisNo`]} onChange={(v) => update(`${rigKey}_chassisNo`, v)} />
              </div>
              <div className="flex items-baseline gap-2 pl-4">
                <span className="font-semibold text-xs whitespace-nowrap shrink-0">എഞ്ചിൻ നമ്പർ :</span>
                <FormLineInput value={data[`${rigKey}_engineNo`]} onChange={(v) => update(`${rigKey}_engineNo`, v)} />
              </div>

              <div className="flex items-center gap-3 pt-0.5 flex-wrap">
                <span className="font-semibold text-xs whitespace-nowrap shrink-0">ബി. സപ്പോർട്ടിങ് വാഹനം</span>
                <YesNoBox
                  value={data[`${rigKey}_hasSupportVeh`]}
                  onChange={(v) => update(`${rigKey}_hasSupportVeh`, v)}
                />
                <span className="font-semibold text-xs whitespace-nowrap shrink-0 ml-2">If Yes രജി. നമ്പർ :</span>
                <FormLineInput value={data[`${rigKey}_supportVehRegNo`]} onChange={(v) => update(`${rigKey}_supportVehRegNo`, v)} />
              </div>
              <div className="flex items-baseline gap-2 pl-4">
                <span className="font-semibold text-xs whitespace-nowrap shrink-0">ചേസിസ് നമ്പർ :</span>
                <FormLineInput value={data[`${rigKey}_supportChassisNo`]} onChange={(v) => update(`${rigKey}_supportChassisNo`, v)} />
              </div>
              <div className="flex items-baseline gap-2 pl-4">
                <span className="font-semibold text-xs whitespace-nowrap shrink-0">എഞ്ചിൻ നമ്പർ :</span>
                <FormLineInput value={data[`${rigKey}_supportEngineNo`]} onChange={(v) => update(`${rigKey}_supportEngineNo`, v)} />
              </div>
            </div>
          </div>

          {/* 6. കമ്പ്രസറിന്റെ വിവരം */}
          <div className="space-y-0.5 pt-0.5">
            <span className="font-semibold text-xs">6. കമ്പ്രസറിന്റെ വിവരം (ഡിറ്റിഎച്ച / റോട്ടറി കം.ഡിറ്റിഎച്ച് / ഫിൽറ്റർ പോയിന്റ് )</span>
            <div className="grid grid-cols-2 gap-4 pl-3 items-baseline">
              <div className="flex items-baseline gap-1">
                <span className="font-semibold whitespace-nowrap shrink-0">എ. മോഡൽ</span>
                <FormLineInput value={data[`${rigKey}_compModel`]} onChange={(v) => update(`${rigKey}_compModel`, v)} />
              </div>
              <div className="flex items-baseline gap-1">
                <span className="font-semibold whitespace-nowrap shrink-0">ബി. കപ്പാസിറ്റി</span>
                <FormLineInput value={data[`${rigKey}_compCapacity`]} onChange={(v) => update(`${rigKey}_compCapacity`, v)} />
              </div>
            </div>
          </div>

          {/* 7. ജനറേറ്ററിന്റെ വിവരം */}
          <div className="space-y-0.5 pt-0.5">
            <span className="font-semibold text-xs">7. ജനറേറ്ററിന്റെ വിവരം (ക്യാലിക്സ് റിഗ്ഗ്)</span>
            <div className="grid grid-cols-2 gap-4 pl-3 items-baseline">
              <div className="flex items-baseline gap-1">
                <span className="font-semibold whitespace-nowrap shrink-0">എ. തരം</span>
                <FormLineInput value={data[`${rigKey}_genType`]} onChange={(v) => update(`${rigKey}_genType`, v)} />
              </div>
              <div className="flex items-baseline gap-1">
                <span className="font-semibold whitespace-nowrap shrink-0">ബി. മോഡൽ</span>
                <FormLineInput value={data[`${rigKey}_genModel`]} onChange={(v) => update(`${rigKey}_genModel`, v)} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 pl-3 items-baseline">
              <div className="flex items-baseline gap-1">
                <span className="font-semibold whitespace-nowrap shrink-0">സി. കപ്പാസിറ്റി</span>
                <FormLineInput value={data[`${rigKey}_genCapacity`]} onChange={(v) => update(`${rigKey}_genCapacity`, v)} />
              </div>
              <div className="flex items-baseline gap-1">
                <span className="font-semibold whitespace-nowrap shrink-0">ഡി. എഞ്ചിൻ നമ്പർ</span>
                <FormLineInput value={data[`${rigKey}_genEngineNo`]} onChange={(v) => update(`${rigKey}_genEngineNo`, v)} />
              </div>
            </div>
          </div>

          {/* 8. കുഴികാവുന്ന കുഴൽകിണറുകളുടെ വിവരം */}
          <div className="space-y-0.5 pt-0.5">
            <span className="font-semibold text-xs">8. കുഴികാവുന്ന കുഴൽകിണറുകളുടെ വിവരം (കംപ്രസ്സർ കപ്പാസിറ്റിയുടെ അടിസ്ഥാനത്തിൽ)</span>
            <div className="grid grid-cols-2 gap-4 pl-3 items-baseline">
              <div className="flex items-baseline gap-1">
                <span className="font-semibold whitespace-nowrap shrink-0">എ. പരമാവധി ആഴം</span>
                <FormLineInput value={data[`${rigKey}_maxDepth`]} onChange={(v) => update(`${rigKey}_maxDepth`, v)} />
              </div>
              <div className="flex items-baseline gap-1">
                <span className="font-semibold whitespace-nowrap shrink-0">ബി. പരമാവധി വ്യാസം</span>
                <FormLineInput value={data[`${rigKey}_maxDia`]} onChange={(v) => update(`${rigKey}_maxDia`, v)} />
              </div>
            </div>
          </div>

          {/* 9. ഡ്രില്ലിംഗ് യന്ത്ര ഓപ്പറേറ്ററുടെ വിവരങ്ങൾ */}
          <div className="space-y-0.5 pt-0.5">
            <span className="font-semibold text-xs">9. ഡ്രില്ലിംഗ് യന്ത്ര ഓപ്പറേറ്ററുടെ വിവരങ്ങൾ</span>
            <div className="grid grid-cols-3 gap-2 pl-3 items-baseline">
              <div className="col-span-2 flex items-baseline gap-1">
                <span className="font-semibold whitespace-nowrap shrink-0">പേര് :</span>
                <FormLineInput value={data[`${rigKey}_opName`]} onChange={(v) => update(`${rigKey}_opName`, v)} />
              </div>
              <div className="flex items-baseline gap-1">
                <span className="font-semibold whitespace-nowrap shrink-0">വയസ് :</span>
                <FormLineInput width="w-16" value={data[`${rigKey}_opAge`]} onChange={(v) => update(`${rigKey}_opAge`, v)} />
              </div>
            </div>
            <div className="flex items-baseline gap-2 pl-3">
              <span className="font-semibold whitespace-nowrap shrink-0">പ്രവൃത്തി പരിചയം :</span>
              <FormLineInput value={data[`${rigKey}_opExp`]} onChange={(v) => update(`${rigKey}_opExp`, v)} />
            </div>
            <div className="flex items-center gap-3 pl-3 flex-wrap">
              <span className="font-semibold whitespace-nowrap shrink-0">തിരിച്ചറിയൽരേഖ :</span>
              <OptionBox
                label="ഇലക്ഷൻ കാർഡ്"
                selected={data[`${rigKey}_opIdType`] === "Election"}
                onToggle={() => update(`${rigKey}_opIdType`, "Election")}
              />
              <OptionBox
                label="ആധാർ കാർഡ്"
                selected={data[`${rigKey}_opIdType`] === "Aadhaar" || !data[`${rigKey}_opIdType`]}
                onToggle={() => update(`${rigKey}_opIdType`, "Aadhaar")}
              />
              <OptionBox
                label="മറ്റുള്ളവ"
                selected={data[`${rigKey}_opIdType`] === "Other"}
                onToggle={() => update(`${rigKey}_opIdType`, "Other")}
              />
            </div>
            <div className="flex items-baseline gap-2 pl-3">
              <span className="font-semibold whitespace-nowrap shrink-0">തിരിച്ചറിയൽ രേഖയുടെ നമ്പർ :</span>
              <FormLineInput value={data[`${rigKey}_opIdNo`]} onChange={(v) => update(`${rigKey}_opIdNo`, v)} />
            </div>
          </div>
          
          <div className="pt-3 mt-auto border-t border-gray-200 flex justify-between items-center text-[10px] text-gray-500 font-sans print:pt-2">
            <span>കേരള സർക്കാർ ഭൂജല അതോറിറ്റി</span>
            <span>പേജ് {pageNumber} / 5</span>
            <span className="font-serif text-gray-700">അപേക്ഷകന്റെ ഒപ്പ് / സീൽ</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export function RigRenewalPages({ data, update }: FormProps) {
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
      {/* PAGE 1: HEADER, AGENCY DETAILS, EXISTING RIG SUMMARY (RIG 1, 2, 3)         */}
      {/* ========================================================================= */}
      <div className="official-form-page bg-white p-6 sm:p-9 border border-gray-300 shadow-md relative box-border min-h-0 print:min-h-[265mm] flex flex-col justify-start space-y-3">
        <div className="print-page-badge absolute top-3 right-4 text-[10px] text-gray-500 font-sans bg-gray-100 px-2 py-0.5 rounded border print:hidden">
          പേജ് 1 / 5
        </div>

        <div className="space-y-2.5">
          {/* Header */}
          <div className="text-center space-y-0.5">
            <h1 className="text-base sm:text-lg font-bold">കേരള സർക്കാർ ഭൂജല അതോറിറ്റി</h1>
            <p className="text-xs font-normal">(കേരള സർക്കാരിന്റെ 2002 ലെ ആക്ട് 19 പ്രകാരം നിലവിൽവന്നത്)</p>
            <p className="text-[10px] font-sans text-gray-800">
              (Order No.G.O.(MS)No.04/2023/WRD Dated 24/01/2023 & Order No. DGWD/306/2022/T4 Dated 21/03/2023)
            </p>
            <div className="pt-1">
              <p className="font-bold underline text-sm sm:text-base leading-snug">
                റിഗ്ഗ് രജിസ്ട്രേഷൻ പുതുക്കൽ/പുതിയ റിഗ്ഗ് രജിസ്ട്രേഷൻ അപേക്ഷാ ഫോറം
              </p>
              <p className="font-bold text-xs sm:text-sm pt-0.5">
                (നിലവിൽ ഏജൻസി രജിസ്ട്രേഷൻ ഉള്ളവർക്ക്)
              </p>
            </div>
          </div>

          {/* Section A: സ്ഥാപനം / ഏജൻസിയുടെ വിവരം */}
          <div className="space-y-1 pt-1">
            <h2 className="font-bold text-sm">A. സ്ഥാപനം / ഏജൻസിയുടെ വിവരം</h2>

            <div className="space-y-1 pl-1">
              <div className="flex items-baseline gap-2">
                <span className="font-semibold whitespace-nowrap shrink-0">1. ഏജൻസിയുടെ പേര്</span>
                <FormLineInput value={data.agencyName} onChange={(v) => update("agencyName", v)} />
              </div>

              <div className="flex items-baseline gap-2">
                <span className="font-semibold whitespace-nowrap shrink-0">2. നിലവിലെ റെജിസ്ട്രേഷൻ നമ്പർ</span>
                <FormLineInput value={data.existingAgencyRegNo} onChange={(v) => update("existingAgencyRegNo", v)} />
              </div>

              <div className="flex items-baseline gap-2">
                <span className="font-semibold whitespace-nowrap shrink-0">3. ഏജൻസി രജിസ്റ്റർ ചെയ്തിട്ടുള്ള ജില്ല</span>
                <FormLineInput value={data.agencyRegDistrict} onChange={(v) => update("agencyRegDistrict", v)} />
              </div>

              <div className="space-y-1">
                <div className="flex items-baseline gap-2">
                  <span className="font-semibold whitespace-nowrap shrink-0">4. മേൽവിലാസം</span>
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
                    <span className="font-semibold whitespace-nowrap shrink-0">പഞ്ചായത്ത് :</span>
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

              <div className="flex items-baseline gap-2">
                <span className="font-semibold whitespace-nowrap shrink-0">5. ഫോൺ നമ്പർ</span>
                <FormLineInput value={data.phone} onChange={(v) => update("phone", v)} />
              </div>

              <div className="flex items-baseline gap-2">
                <span className="font-semibold whitespace-nowrap shrink-0">6. ഇ മെയിൽ വിലാസം</span>
                <FormLineInput value={data.email} onChange={(v) => update("email", v)} />
              </div>

              <div className="flex items-baseline gap-2">
                <span className="font-semibold whitespace-nowrap shrink-0">7. ജി.എസ്സ്.ടി. നമ്പർ :</span>
                <FormLineInput value={data.gstin} onChange={(v) => update("gstin", v)} />
              </div>

              <div className="flex items-baseline gap-2">
                <span className="font-semibold whitespace-nowrap shrink-0">8. തദ്ദേശ സ്വയംഭരണ സ്ഥാപനം നൽകിയ രജിസ്ട്രേഷൻ നമ്പർ :</span>
                <FormLineInput value={data.lsgdRegNo} onChange={(v) => update("lsgdRegNo", v)} />
              </div>
            </div>
          </div>

          {/* Section: ഏജൻസിയിൽ നിലവിൽ രജിസ്റ്റർ ചെയ്തിട്ടുള്ള റിഗ്ഗുകളുടെ വിവരങ്ങൾ */}
          <div className="space-y-1.5 pt-1">
            <h3 className="font-bold text-xs sm:text-sm text-center">
              ഏജൻസിയിൽ നിലവിൽ രജിസ്റ്റർ ചെയ്തിട്ടുള്ള റിഗ്ഗുകളുടെ വിവരങ്ങൾ
            </h3>

            {/* Rig-1 Summary */}
            <div className="space-y-1 pl-1">
              <div className="flex items-center gap-2">
                <span className="font-bold text-xs shrink-0">Rig-1</span>
                <div className="flex-1 min-w-0">
                  <span className="font-semibold text-xs">1. റിഗ്ഗിന്റെ തരം</span>
                  <span className="text-[10px] text-gray-700 ml-1">
                    (റോട്ടറി റിഗ്ഗ്, റോട്ടറി കം.ഡിറ്റിഎച്ച് റിഗ്ഗ്, കാലിക്സ് റിഗ്ഗ്, ഫിൽറ്റർ പോയിന്റ് യൂണിറ്റ്)
                  </span>
                  <div className="pt-0.5">
                    <FormLineInput value={data.summaryRig1_type} onChange={(v) => update("summaryRig1_type", v)} />
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 pl-8 items-baseline">
                <div className="flex items-baseline gap-1">
                  <span className="font-semibold text-xs whitespace-nowrap shrink-0">2. നിലവിലെ റെജിസ്ട്രേഷൻ നമ്പർ :</span>
                  <FormLineInput value={data.summaryRig1_regNo} onChange={(v) => update("summaryRig1_regNo", v)} />
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="font-semibold text-xs whitespace-nowrap shrink-0">3. അവസാനമായി ഒടുക്കിയ തുക :</span>
                  <FormLineInput value={data.summaryRig1_paidAmount} onChange={(v) => update("summaryRig1_paidAmount", v)} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 pl-8 items-baseline">
                <div className="flex items-baseline gap-1">
                  <span className="font-semibold text-xs whitespace-nowrap shrink-0">4. ചലാൻ നം. തീയതി :</span>
                  <FormLineInput value={data.summaryRig1_challanDetails} onChange={(v) => update("summaryRig1_challanDetails", v)} />
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="font-semibold text-xs whitespace-nowrap shrink-0">5. റെജിസ്ട്രേഷൻ അവസാനിക്കുന്ന തീയതി :</span>
                  <FormDateInput value={data.summaryRig1_expiryDate} onChange={(v) => update("summaryRig1_expiryDate", v)} />
                </div>
              </div>
            </div>

            <div className="border-t border-gray-200" />

            {/* Rig-2 Summary */}
            <div className="space-y-1 pl-1">
              <div className="flex items-center gap-2">
                <span className="font-bold text-xs shrink-0">Rig-2</span>
                <div className="flex-1 min-w-0">
                  <span className="font-semibold text-xs">1. റിഗ്ഗിന്റെ തരം</span>
                  <span className="text-[10px] text-gray-700 ml-1">
                    (റോട്ടറി റിഗ്ഗ്, റോട്ടറി കം.ഡിറ്റിഎച്ച് റിഗ്ഗ്, കാലിക്സ് റിഗ്ഗ്, ഫിൽറ്റർ പോയിന്റ് യൂണിറ്റ്)
                  </span>
                  <div className="pt-0.5">
                    <FormLineInput value={data.summaryRig2_type} onChange={(v) => update("summaryRig2_type", v)} />
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 pl-8 items-baseline">
                <div className="flex items-baseline gap-1">
                  <span className="font-semibold text-xs whitespace-nowrap shrink-0">2. നിലവിലെ റെജിസ്ട്രേഷൻ നമ്പർ :</span>
                  <FormLineInput value={data.summaryRig2_regNo} onChange={(v) => update("summaryRig2_regNo", v)} />
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="font-semibold text-xs whitespace-nowrap shrink-0">3. അവസാനമായി ഒടുക്കിയ തുക :</span>
                  <FormLineInput value={data.summaryRig2_paidAmount} onChange={(v) => update("summaryRig2_paidAmount", v)} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 pl-8 items-baseline">
                <div className="flex items-baseline gap-1">
                  <span className="font-semibold text-xs whitespace-nowrap shrink-0">4. ചലാൻ നം. തീയതി :</span>
                  <FormLineInput value={data.summaryRig2_challanDetails} onChange={(v) => update("summaryRig2_challanDetails", v)} />
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="font-semibold text-xs whitespace-nowrap shrink-0">5. റെജിസ്ട്രേഷൻ അവസാനിക്കുന്ന തീയതി :</span>
                  <FormDateInput value={data.summaryRig2_expiryDate} onChange={(v) => update("summaryRig2_expiryDate", v)} />
                </div>
              </div>
            </div>

            <div className="border-t border-gray-200" />

            {/* Rig-3 Summary */}
            <div className="space-y-1 pl-1">
              <div className="flex items-center gap-2">
                <span className="font-bold text-xs shrink-0">Rig-3</span>
                <div className="flex-1 min-w-0">
                  <span className="font-semibold text-xs">1. റിഗ്ഗിന്റെ തരം</span>
                  <span className="text-[10px] text-gray-700 ml-1">
                    (റോട്ടറി റിഗ്ഗ്, റോട്ടറി കം.ഡിറ്റിഎച്ച് റിഗ്ഗ്, കാലിക്സ് റിഗ്ഗ്, ഫിൽറ്റർ പോയിന്റ് യൂണിറ്റ്)
                  </span>
                  <div className="pt-0.5">
                    <FormLineInput value={data.summaryRig3_type} onChange={(v) => update("summaryRig3_type", v)} />
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 pl-8 items-baseline">
                <div className="flex items-baseline gap-1">
                  <span className="font-semibold text-xs whitespace-nowrap shrink-0">2. നിലവിലെ റെജിസ്ട്രേഷൻ നമ്പർ :</span>
                  <FormLineInput value={data.summaryRig3_regNo} onChange={(v) => update("summaryRig3_regNo", v)} />
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="font-semibold text-xs whitespace-nowrap shrink-0">3. അവസാനമായി ഒടുക്കിയ തുക :</span>
                  <FormLineInput value={data.summaryRig3_paidAmount} onChange={(v) => update("summaryRig3_paidAmount", v)} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 pl-8 items-baseline">
                <div className="flex items-baseline gap-1">
                  <span className="font-semibold text-xs whitespace-nowrap shrink-0">4. ചലാൻ നം. തീയതി :</span>
                  <FormLineInput value={data.summaryRig3_challanDetails} onChange={(v) => update("summaryRig3_challanDetails", v)} />
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="font-semibold text-xs whitespace-nowrap shrink-0">5. റെജിസ്ട്രേഷൻ അവസാനിക്കുന്ന തീയതി :</span>
                  <FormDateInput value={data.summaryRig3_expiryDate} onChange={(v) => update("summaryRig3_expiryDate", v)} />
                </div>
              </div>
            </div>
          </div>
          
          <div className="pt-3 mt-auto border-t border-gray-200 flex justify-between items-center text-[10px] text-gray-500 font-sans print:pt-2">
            <span>കേരള സർക്കാർ ഭൂജല അതോറിറ്റി</span>
            <span>പേജ് 1 / 5</span>
            <span className="font-serif text-gray-700">അപേക്ഷകന്റെ ഒപ്പ് / സീൽ</span>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* PAGE 2: RIG 1 RENEWAL DETAILS                                             */}
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
      {/* PAGE 3: RIG 2 RENEWAL DETAILS                                             */}
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
      {/* PAGE 4: RIG 3 RENEWAL DETAILS                                             */}
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
      {/* PAGE 5: DECLARATION, OFFICE USE ONLY & RENEWAL RECEIPT (രസീത്)            */}
      {/* ========================================================================= */}
      <div className="official-form-page bg-white p-6 sm:p-9 border border-gray-300 shadow-md relative box-border min-h-0 print:min-h-[265mm] flex flex-col justify-start space-y-3">
        <div className="print-page-badge absolute top-3 right-4 text-[10px] text-gray-500 font-sans bg-gray-100 px-2 py-0.5 rounded border print:hidden">
          പേജ് 5 / 5
        </div>

        <div className="space-y-4 flex-1 flex flex-col justify-start">
          {/* Top: സത്യപ്രസ്താവന */}
          <div className="space-y-2 text-center pt-1">
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
              <div className="text-right">
                <p className="font-bold text-xs">അപേക്ഷകന്റെ ഒപ്പും പേരും</p>
              </div>
            </div>
          </div>

          <div className="border-t border-black my-1" />

          {/* Middle: ഓഫീസ് ഉപയോഗത്തിന് മാത്രം */}
          <div className="space-y-2 pt-1">
            <div className="text-center">
              <h3 className="font-bold text-sm underline">ഓഫീസ് ഉപയോഗത്തിന് മാത്രം</h3>
            </div>

            <div className="space-y-2 pl-2">
              <div className="flex items-baseline gap-2">
                <span className="font-semibold whitespace-nowrap shrink-0">1. അപേക്ഷ ലഭിച്ച തീയതി :</span>
                <FormDateInput value={data.office_appReceivedDate} onChange={(v) => update("office_appReceivedDate", v)} />
              </div>

              <div className="space-y-1">
                <span className="font-semibold">2. അപേക്ഷാ ഫീസ് അടച്ച വിവരങ്ങൾ :</span>
                <div className="grid grid-cols-2 gap-4 items-baseline pl-4">
                  <div className="flex items-baseline gap-1">
                    <span className="font-semibold whitespace-nowrap shrink-0">അടച്ച തുക :</span>
                    <FormLineInput value={data.office_feeAmount} onChange={(v) => update("office_feeAmount", v)} />
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="font-semibold whitespace-nowrap shrink-0">തീയതി :</span>
                    <FormDateInput value={data.office_feeDate} onChange={(v) => update("office_feeDate", v)} />
                  </div>
                </div>
              </div>

              <div className="flex items-baseline gap-2">
                <span className="font-semibold whitespace-nowrap shrink-0">3. റിഗ്ഗ് പരിശോധിച്ച തീയതി :</span>
                <FormDateInput value={data.office_rigInspectionDate} onChange={(v) => update("office_rigInspectionDate", v)} />
              </div>

              <div className="space-y-1">
                <span className="font-semibold whitespace-nowrap shrink-0">4. പരിശോധകന്റെ ശുപാർശ :</span>
                <div className="space-y-1 pt-1">
                  <FormLineInput value={data.office_recommendation1 || ""} onChange={(v) => update("office_recommendation1", v)} />
                  <FormLineInput value={data.office_recommendation2 || ""} onChange={(v) => update("office_recommendation2", v)} />
                </div>
              </div>

              <div className="flex justify-between items-end pt-6 px-2">
                <div className="text-left">
                  <p className="font-bold text-xs">പരിശോധകന്റെ ഒപ്പ്</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-xs">ജില്ലാ ഓഫീസറുടെ ഒപ്പ്</p>
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-dashed border-black my-1" />

          {/* Bottom: രസീത് */}
          <div className="space-y-2 pt-1">
            <div className="flex justify-center">
              <div className="border border-black rounded-full px-8 py-0.5 font-bold text-sm bg-white text-center">
                രസീത്
              </div>
            </div>

            <div className="space-y-1.5 pl-2">
              <div className="flex items-baseline gap-2">
                <span className="font-semibold whitespace-nowrap shrink-0">1. അപേക്ഷാ നമ്പർ :</span>
                <FormLineInput value={data.receipt_appNo} onChange={(v) => update("receipt_appNo", v)} />
              </div>

              <div className="flex items-baseline gap-2">
                <span className="font-semibold whitespace-nowrap shrink-0">2. ഏജൻസിയുടെ പേര് :</span>
                <FormLineInput value={data.agencyName} onChange={(v) => update("agencyName", v)} />
              </div>

              <div className="flex items-baseline gap-2">
                <span className="font-semibold whitespace-nowrap shrink-0">3. ഏജൻസി റെജിസ്ട്രേഷൻ നമ്പർ :</span>
                <FormLineInput value={data.existingAgencyRegNo} onChange={(v) => update("existingAgencyRegNo", v)} />
              </div>

              <div className="flex items-baseline gap-2">
                <span className="font-semibold whitespace-nowrap shrink-0">4. അപേക്ഷ ലഭിച്ച തീയതി :</span>
                <FormDateInput value={data.receipt_receivedDate} onChange={(v) => update("receipt_receivedDate", v)} />
              </div>

              <div className="space-y-1">
                <span className="font-semibold">5. അപേക്ഷാ ഫീസ് അടച്ച വിവരങ്ങൾ :</span>
                <div className="grid grid-cols-2 gap-4 items-baseline pl-4">
                  <div className="flex items-baseline gap-1">
                    <span className="font-semibold whitespace-nowrap shrink-0">അടച്ച തുക :</span>
                    <FormLineInput value={data.receipt_feeAmount} onChange={(v) => update("receipt_feeAmount", v)} />
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="font-semibold whitespace-nowrap shrink-0">തീയതി :</span>
                    <FormDateInput value={data.receipt_feeDate} onChange={(v) => update("receipt_feeDate", v)} />
                  </div>
                </div>
              </div>

              <div className="space-y-1.5 pt-0.5">
                <span className="font-semibold">6. അപേക്ഷാ വിവരങ്ങൾ :</span>
                <div className="space-y-1.5 pl-4">
                  <div className="flex items-center gap-3">
                    <span className="text-xs">1. റിഗ്ഗ് രജിസ്ട്രേഷൻ പുതുക്കൽ (നിലവിൽ രജിസ്ട്രേഷൻ സാധുവായിട്ടുള്ളത്)</span>
                    <div className="w-12 h-6 border border-black flex items-center justify-center font-bold text-xs bg-white">
                      <input
                        type="text"
                        value={data.receipt_renewalCount ?? ""}
                        onChange={(e) => update("receipt_renewalCount", e.target.value)}
                        className="w-full h-full text-center font-bold text-xs bg-transparent focus:outline-none"
                      />
                    </div>
                    <span className="text-xs">എണ്ണം</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs">2. പുതിയ റിഗ്ഗ് രജിസ്ട്രേഷൻ/രജിസ്റ്റർ ചെയ്ത റിഗ്ഗ് മാറ്റുന്നതിന്</span>
                    <div className="w-12 h-6 border border-black flex items-center justify-center font-bold text-xs bg-white">
                      <input
                        type="text"
                        value={data.receipt_newRigCount ?? ""}
                        onChange={(e) => update("receipt_newRigCount", e.target.value)}
                        className="w-full h-full text-center font-bold text-xs bg-transparent focus:outline-none"
                      />
                    </div>
                    <span className="text-xs">എണ്ണം</span>
                  </div>
                </div>
              </div>

              <div className="flex justify-between items-end pt-6 px-2">
                <div className="flex items-baseline gap-1">
                  <span className="font-semibold text-xs">തീയതി :</span>
                  <FormDateInput value={data.receipt_signDate} onChange={(v) => update("receipt_signDate", v)} />
                </div>
                <div className="text-right">
                  <p className="font-bold text-xs">ജില്ലാ ഓഫീസർ</p>
                </div>
              </div>
              
              <div className="pt-3 mt-auto border-t border-gray-200 flex justify-between items-center text-[10px] text-gray-500 font-sans print:pt-2">
                <span>കേരള സർക്കാർ ഭൂജല അതോറിറ്റി</span>
                <span>പേജ് 5 / 5</span>
                <span className="font-serif text-gray-700">ജില്ലാ ഓഫീസർ / സീൽ</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
