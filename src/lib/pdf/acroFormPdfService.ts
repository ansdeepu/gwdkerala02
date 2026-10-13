import { PDFDocument, StandardFonts, rgb, PDFTextField, PDFCheckBox } from "pdf-lib";
import download from "downloadjs";
import { type MasterPdfTemplate } from "@/hooks/useMasterPdfTemplates";
import { generateRigRegistrationPdfOverlay, generateRigRenewalPdfOverlay } from "./rigFormPdfOverlay";

// Helper to convert base64 data URL to ArrayBuffer
export function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const base64Clean = base64.includes(",") ? base64.split(",")[1] : base64;
  const binaryString = window.atob(base64Clean);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}

// Malayalam character to Latin transliteration dictionary
const ML_CHAR_MAP: Record<string, string> = {
  'അ': 'A', 'ആ': 'Aa', 'ഇ': 'I', 'ഈ': 'Ee', 'ഉ': 'U', 'ഊ': 'Oo', 'ഋ': 'Ri', 'എ': 'E', 'ഏ': 'E', 'ഐ': 'Ai', 'ഒ': 'O', 'ഓ': 'O', 'ഔ': 'Au',
  'ക': 'k', 'ഖ': 'kh', 'ഗ': 'g', 'ഘ': 'gh', 'ങ': 'ng',
  'ച': 'ch', 'ഛ': 'chh', 'ജ': 'j', 'ഝ': 'jh', 'ഞ': 'nj',
  'ട': 't', 'ഠ': 'th', 'ഡ': 'd', 'ഢ': 'dh', 'ണ': 'n',
  'ത': 'th', 'ഥ': 'th', 'ദ': 'd', 'ധ': 'dh', 'ന': 'n',
  'പ': 'p', 'ഫ': 'ph', 'ബ': 'b', 'ഭ': 'bh', 'മ': 'm',
  'യ': 'y', 'ര': 'r', 'ല': 'l', 'വ': 'v', 'ശ': 'sh', 'ഷ': 'sh', 'സ': 's', 'ഹ': 'h', 'ള': 'l', 'ഴ': 'zh', 'റ': 'r',
  'ാ': 'a', 'ി': 'i', 'ീ': 'ee', 'ു': 'u', 'ൂ': 'oo', 'ൃ': 'ri', 'െ': 'e', 'േ': 'e', 'ൈ': 'ai', 'ൊ': 'o', 'ോ': 'o', 'ൌ': 'au',
  '്': '', 'ം': 'm', 'ഃ': 'h', 'ൺ': 'n', 'ൻ': 'n', 'ർ': 'r', 'ൽ': 'l', 'ൾ': 'l', 'ൿ': 'k',
  '൦': '0', '൧': '1', '൨': '2', '൩': '3', '൪': '4', '൫': '5', '൬': '6', '൭': '7', '൮': '8', '൯': '9',
};

const PHRASE_MAPPINGS: [RegExp, string][] = [
  [/റോട്ടറി കം\.ഡി\.റ്റി\.എച്ച് റിഗ്/gi, 'Rotary Cum DTH Rig'],
  [/റോട്ടറി റിഗ്ഗ്/gi, 'Rotary Rig'],
  [/കാലിക്സ് റിഗ്ഗ്/gi, 'Calyx Rig'],
  [/ഫിൽറ്റർ പോയിന്റ് യൂണിറ്റ്/gi, 'Filter Point Unit'],
  [/ഭൂജല അതോറിറ്റി/gi, 'Ground Water Authority'],
  [/കേരള സർക്കാർ/gi, 'Government of Kerala'],
  [/തിരുവനന്തപുരം/gi, 'Thiruvananthapuram'],
  [/കൊല്ലം/gi, 'Kollam'],
  [/പത്തനംതിട്ട/gi, 'Pathanamthitta'],
  [/ആലപ്പുഴ/gi, 'Alappuzha'],
  [/കോട്ടയം/gi, 'Kottayam'],
  [/ഇടുക്കി/gi, 'Idukki'],
  [/എറണാകുളം/gi, 'Ernakulam'],
  [/തൃശ്ശൂർ/gi, 'Thrissur'],
  [/പാലക്കാട്/gi, 'Palakkad'],
  [/മലപ്പുറം/gi, 'Malappuram'],
  [/കോഴിക്കോട്/gi, 'Kozhikode'],
  [/വയനാട്/gi, 'Wayanad'],
  [/കണ്ണൂർ/gi, 'Kannur'],
  [/കാസർഗോഡ്/gi, 'Kasaragod'],
];

// Helper to safely format strings without non-latin / WinAnsi encoding crashes
export function safeString(val: any): string {
  if (val === undefined || val === null) return "";
  let str = String(val).trim();
  if (!str) return "";

  // 1. Replace common Malayalam phrases with clean English equivalents
  for (const [pattern, replacement] of PHRASE_MAPPINGS) {
    str = str.replace(pattern, replacement);
  }

  // 2. Transliterate Malayalam characters to Latin
  let transliterated = "";
  for (let i = 0; i < str.length; i++) {
    const char = str[i];
    const code = char.charCodeAt(0);
    if (code >= 0x0d00 && code <= 0x0d7f) {
      transliterated += ML_CHAR_MAP[char] ?? "";
    } else {
      transliterated += char;
    }
  }

  // 3. Filter out any remaining characters outside WinAnsi range (code point > 255)
  let winAnsiClean = "";
  for (let i = 0; i < transliterated.length; i++) {
    const code = transliterated.charCodeAt(i);
    if ((code >= 32 && code <= 126) || code === 10 || code === 13 || code === 9 || (code >= 160 && code <= 255)) {
      winAnsiClean += transliterated[i];
    }
  }

  return winAnsiClean.trim();
}

/**
 * Creates and populates interactive AcroForm fields in a PDF.
 */
function addOrSetTextField(
  form: any,
  page: any,
  fieldName: string,
  value: string,
  options: {
    x: number;
    y: number;
    width: number;
    height: number;
    font?: any;
    fontSize?: number;
    multiline?: boolean;
    borderWidth?: number;
  }
) {
  try {
    let textField: PDFTextField;
    try {
      textField = form.getTextField(fieldName);
    } catch {
      textField = form.createTextField(fieldName);
      textField.addToPage(page, {
        x: options.x,
        y: options.y,
        width: options.width,
        height: options.height,
        borderWidth: options.borderWidth ?? 0,
        backgroundColor: undefined,
      });
      textField.setBorderColor(undefined);
      textField.setBackgroundColor(undefined);
      if (options.multiline) {
        textField.enableMultiline();
      }
      if (options.fontSize) {
        textField.setFontSize(options.fontSize);
      }
    }

    if (value) {
      const textVal = safeString(value);
      if (textVal) {
        try {
          textField.setText(textVal);
        } catch (setTextErr) {
          console.warn(`Could not set text on field ${fieldName}:`, setTextErr);
        }
      }
    }
  } catch (err) {
    console.warn(`Could not set AcroForm field ${fieldName}:`, err);
  }
}

/**
 * Intelligently maps database data directly into the uploaded official PDF AcroForm interactive fields.
 */
export async function populatePdfAcroFormFields(
  pdfDoc: PDFDocument,
  data: Record<string, any>
): Promise<number> {
  let filledCount = 0;
  try {
    const form = pdfDoc.getForm();
    const fields = form.getFields();
    if (!fields || fields.length === 0) return 0;

    // Build lookup maps for fast matching
    const normalizedData: Record<string, any> = {};
    for (const [k, v] of Object.entries(data)) {
      if (v !== undefined && v !== null && v !== "") {
        normalizedData[k.toLowerCase().replace(/[^a-z0-9]/g, "")] = v;
      }
    }

    // Comprehensive alias dictionary
    const resolveValue = (fieldName: string): any => {
      // 1. Direct key
      if (data[fieldName] !== undefined && data[fieldName] !== null && data[fieldName] !== "") {
        return data[fieldName];
      }

      // 2. Normalized key
      const norm = fieldName.toLowerCase().replace(/[^a-z0-9]/g, "");
      if (normalizedData[norm] !== undefined && normalizedData[norm] !== null && normalizedData[norm] !== "") {
        return normalizedData[norm];
      }

      // 3. Domain Aliases
      const aliasMap: Record<string, any> = {
        agencyname: data.agencyName || data.nameOfAgency || data.firmName,
        nameofagency: data.agencyName || data.nameOfAgency,
        firmname: data.agencyName || data.nameOfAgency,
        agency: data.agencyName,
        establishment: data.agencyName,

        address: data.address || data.agencyAddress || data.officeAddress,
        agencyaddress: data.address,
        addressline1: data.address,
        address1: data.address,
        addressline2: data.address_line2 || data.addressLine2,
        address2: data.address_line2,

        village: data.village || data.agencyVillage,
        taluk: data.taluk || data.agencyTaluk,
        panchayath: data.panchayath || data.agencyPanchayath || data.panchayat,
        panchayat: data.panchayath,
        district: data.district || data.agencyDistrict || data.officeLocation,
        pincode: data.pincode || data.agencyPincode || data.pin,
        pin: data.pincode,

        gstin: data.gstin || data.gstNo || data.gst,
        gst: data.gstin || data.gstNo,
        lsgdregno: data.lsgdRegNo || data.lsgdNo,
        lsgdno: data.lsgdRegNo,

        ownername: data.ownerA_name || data.ownerName || data.name,
        ownera: data.ownerA_name || data.ownerName,
        owneraname: data.ownerA_name || data.ownerName,
        proprietorname: data.ownerA_name || data.ownerName,
        ownercurraddress: data.ownerA_curr_address || data.ownerAddress || data.address,
        ownerpresentaddress: data.ownerA_curr_address || data.ownerAddress,
        ownercurrvillage: data.ownerA_curr_village || data.village,
        ownercurrtaluk: data.ownerA_curr_taluk || data.taluk,
        ownercurrpanchayath: data.ownerA_curr_panchayath || data.panchayath,
        ownercurrdistrict: data.ownerA_curr_district || data.district,
        ownercurrpincode: data.ownerA_curr_pincode || data.pincode,

        ownerpermaddress: data.ownerA_perm_address || data.ownerA_curr_address || data.address,
        ownerpermanentaddress: data.ownerA_perm_address || data.ownerA_curr_address,
        ownerpermvillage: data.ownerA_perm_village || data.ownerA_curr_village,
        ownerpermtaluk: data.ownerA_perm_taluk || data.ownerA_curr_taluk,
        ownerpermpanchayath: data.ownerA_perm_panchayath || data.ownerA_curr_panchayath,
        ownerpermdistrict: data.ownerA_perm_district || data.ownerA_curr_district,
        ownerpermpincode: data.ownerA_perm_pincode || data.ownerA_curr_pincode,

        owneridtype: data.ownerA_id_type || "Aadhaar",
        owneridno: data.ownerA_id_no || data.idNo,
        ownerpan: data.ownerA_pan || data.panNo || data.pan,
        pan: data.ownerA_pan || data.panNo || data.pan,
        panno: data.ownerA_pan || data.panNo || data.pan,
        ownerexp: data.ownerA_exp || data.experience,
        ownernominee: data.ownerA_nominee || data.nominee,

        partnerbname: data.partnerB_name,
        partnerbcurraddress: data.partnerB_curr_address,
        partnerbcurrvillage: data.partnerB_curr_village,
        partnerbcurrtaluk: data.partnerB_curr_taluk,
        partnerbcurrpanchayath: data.partnerB_curr_panchayath,
        partnerbcurrdistrict: data.partnerB_curr_district,
        partnerbcurrpincode: data.partnerB_curr_pincode,
        partnerbidno: data.partnerB_id_no,
        partnerbpan: data.partnerB_pan,
        partnerbnominee: data.partnerB_nominee,

        partnercname: data.partnerC_name,
        partnerccurraddress: data.partnerC_curr_address,
        partnerccurrvillage: data.partnerC_curr_village,
        partnerccurrtaluk: data.partnerC_curr_taluk,
        partnerccurrpanchayath: data.partnerC_curr_panchayath,
        partnerccurrdistrict: data.partnerC_curr_district,
        partnerccurrpincode: data.partnerC_curr_pincode,
        partnercidno: data.partnerC_id_no,
        partnercpan: data.partnerC_pan,
        partnercnominee: data.partnerC_nominee,

        rigatype: data.rigA_type || data.rig1_type,
        rig1type: data.rigA_type || data.rig1_type,
        typeofrig: data.rigA_type || data.rig1_type,
        rigaownername: data.rigA_owner_name || data.rig1_owner_name || data.ownerA_name,
        rig1ownername: data.rigA_owner_name || data.rig1_owner_name || data.ownerA_name,
        rigavehtype: data.rigA_veh_type || data.rig1_veh_type,
        rig1vehtype: data.rigA_veh_type || data.rig1_veh_type,
        rigavehreg: data.rigA_veh_reg || data.rig1_veh_reg || data.vehRegNo,
        rig1vehreg: data.rigA_veh_reg || data.rig1_veh_reg || data.vehRegNo,
        vehicleregno: data.rigA_veh_reg || data.rig1_veh_reg,
        regno: data.rigA_veh_reg || data.rig1_veh_reg,
        truckno: data.rigA_veh_reg || data.rig1_veh_reg,
        rigachassis: data.rigA_veh_chassis || data.rig1_veh_chassis,
        rig1chassis: data.rigA_veh_chassis || data.rig1_veh_chassis,
        chassisno: data.rigA_veh_chassis || data.rig1_veh_chassis,
        rigaengine: data.rigA_veh_engine || data.rig1_veh_engine,
        rig1engine: data.rigA_veh_engine || data.rig1_veh_engine,
        engineno: data.rigA_veh_engine || data.rig1_veh_engine,
        rigacompmodel: data.rigA_comp_model || data.rig1_comp_model,
        rig1compmodel: data.rigA_comp_model || data.rig1_comp_model,
        rigacompcap: data.rigA_comp_cap || data.rig1_comp_cap,
        rig1compcap: data.rigA_comp_cap || data.rig1_comp_cap,
        rigagentype: data.rigA_gen_type || data.rig1_gen_type,
        rig1gentype: data.rigA_gen_type || data.rig1_gen_type,
        rigagenmodel: data.rigA_gen_model || data.rig1_gen_model,
        rig1genmodel: data.rigA_gen_model || data.rig1_gen_model,
        rigagencap: data.rigA_gen_cap || data.rig1_gen_cap,
        rig1gencap: data.rigA_gen_cap || data.rig1_gen_cap,
        rigawelldepth: data.rigA_well_depth || data.rig1_well_depth,
        rig1welldepth: data.rigA_well_depth || data.rig1_well_depth,
        maxdepth: data.rigA_well_depth || data.rig1_well_depth,
        rigawelldia: data.rigA_well_dia || data.rig1_well_dia,
        rig1welldia: data.rigA_well_dia || data.rig1_well_dia,
        maxdia: data.rigA_well_dia || data.rig1_well_dia,
        rigaopname: data.rigA_op_name || data.rig1_op_name,
        rig1opname: data.rigA_op_name || data.rig1_op_name,
        operatorname: data.rigA_op_name || data.rig1_op_name,
        rigaopage: data.rigA_op_age || data.rig1_op_age,
        rig1opage: data.rigA_op_age || data.rig1_op_age,
        rigaopexp: data.rigA_op_exp || data.rig1_op_exp,
        rig1opexp: data.rigA_op_exp || data.rig1_op_exp,
        rigaopidno: data.rigA_op_id_no || data.rig1_op_id_no,
        rig1opidno: data.rigA_op_id_no || data.rig1_op_id_no,

        appno: data.receipt_app_no || data.fileNo || data.applicationNo,
        fileno: data.receipt_app_no || data.fileNo,
        applicationno: data.receipt_app_no || data.fileNo,
        receiptappno: data.receipt_app_no || data.fileNo,
        receiptapplicantname: data.receipt_applicant_name || data.ownerA_name,
        receiptdaterecd: data.receipt_date_recd || data.receivedDate,
        receiptfeeamount: data.receipt_paid_amount || data.office_paid_amount || data.feeAmount,
        receiptpaidamount: data.receipt_paid_amount || data.office_paid_amount,
        feeamount: data.receipt_paid_amount || data.office_paid_amount,
        paidamount: data.receipt_paid_amount || data.office_paid_amount,
        receiptchallanno: data.receipt_challan_no || data.office_feeChallan,
        challanno: data.receipt_challan_no || data.office_feeChallan,
        receiptpaiddate: data.receipt_paid_date || data.paymentDate,
        feedate: data.receipt_paid_date || data.paymentDate,
        paiddate: data.receipt_paid_date || data.paymentDate,
        officerecommendation: data.office_recommendation || data.recommendation,
        officeriginspecteddate: data.office_rig_inspected_date || data.inspectedDate,
      };

      for (const [k, v] of Object.entries(aliasMap)) {
        if (norm === k || norm.includes(k) || k.includes(norm)) {
          if (v !== undefined && v !== null && v !== "") {
            return v;
          }
        }
      }

      // 4. Substring / Keyword Fallback across normalized data entries
      for (const [k, v] of Object.entries(normalizedData)) {
        if (v !== undefined && v !== null && v !== "") {
          if (norm.includes(k) || k.includes(norm)) {
            return v;
          }
        }
      }

      return undefined;
    };

    for (const field of fields) {
      const name = field.getName();
      const val = resolveValue(name);
      if (val !== undefined && val !== null && val !== "") {
        try {
          if (field instanceof PDFTextField) {
            field.setText(safeString(val));
            filledCount++;
          } else if (field instanceof PDFCheckBox) {
            if (val === true || val === "true" || val === "yes" || val === "1") {
              field.check();
            } else {
              field.uncheck();
            }
            filledCount++;
          }
        } catch (setErr) {
          console.warn(`Could not set value on PDF field "${name}":`, setErr);
        }
      }
    }
  } catch (err) {
    console.warn("AcroForm populating error:", err);
  }
  return filledCount;
}

/**
 * Builds the official 5-Page New Rig Registration native vector AcroForm PDF.
 */
export async function createOfficialRigRegistrationAcroFormPdf(
  data: Record<string, any>,
  activeTemplate?: MasterPdfTemplate | null
): Promise<Uint8Array> {
  // 1. If an active master template was uploaded by Super Admin, use it!
  if (activeTemplate && activeTemplate.base64Pdf) {
    try {
      const customTemplateBytes = base64ToArrayBuffer(activeTemplate.base64Pdf);
      const pdfDoc = await PDFDocument.load(customTemplateBytes);
      const form = pdfDoc.getForm();
      const fields = form.getFields();

      // If the template contains interactive AcroForm fields, populate them directly
      if (fields && fields.length > 0) {
        const filled = await populatePdfAcroFormFields(pdfDoc, data);
        if (filled > 0) {
          return await pdfDoc.save();
        }
      }

      // If it's a flat scanned master PDF with 0 fields or 0 filled, overlay vector data
      return await generateRigRegistrationPdfOverlay(data, customTemplateBytes);
    } catch (tplErr) {
      console.warn("Could not load custom template, falling back to built-in generator:", tplErr);
    }
  }

  // 2. Try default template file in /templates/rig-registration-template.pdf if available
  try {
    const pdfBytes = await generateRigRegistrationPdfOverlay(data);
    return pdfBytes;
  } catch (err) {
    console.warn("Could not load default template overlay, using vector generator:", err);
  }

  // Built-in 5-Page High-Fidelity Vector AcroForm Generator
  let pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const form = pdfDoc.getForm();

  const PAGE_WIDTH = 595.28; // A4
  const PAGE_HEIGHT = 841.89;
  const MARGIN_LEFT = 40;
  const CONTENT_WIDTH = PAGE_WIDTH - MARGIN_LEFT * 2; // 515.28

  // Helper for drawing section headers
  const drawHeader = (page: any, title: string, subtitle: string, pageNum: number) => {
    page.drawText("KERALA GROUND WATER AUTHORITY", {
      x: MARGIN_LEFT,
      y: PAGE_HEIGHT - 35,
      size: 13,
      font: fontBold,
      color: rgb(0.1, 0.15, 0.3),
    });
    page.drawText(title, {
      x: MARGIN_LEFT,
      y: PAGE_HEIGHT - 50,
      size: 10,
      font: fontBold,
      color: rgb(0.2, 0.2, 0.2),
    });
    if (subtitle) {
      page.drawText(subtitle, {
        x: MARGIN_LEFT,
        y: PAGE_HEIGHT - 62,
        size: 8,
        font: font,
        color: rgb(0.4, 0.4, 0.4),
      });
    }
    // Page Number Tag
    page.drawText(`Page ${pageNum} of 5`, {
      x: PAGE_WIDTH - MARGIN_LEFT - 60,
      y: PAGE_HEIGHT - 35,
      size: 9,
      font: fontBold,
      color: rgb(0.4, 0.4, 0.4),
    });
    // Header divider line
    page.drawLine({
      start: { x: MARGIN_LEFT, y: PAGE_HEIGHT - 68 },
      end: { x: PAGE_WIDTH - MARGIN_LEFT, y: PAGE_HEIGHT - 68 },
      thickness: 1,
      color: rgb(0.75, 0.8, 0.85),
    });
  };

  // =========================================================================
  // PAGE 1: Section 1 (Agency) & Section 2 (Proprietor / Partner A)
  // =========================================================================
  const page1 = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  drawHeader(
    page1,
    "APPLICATION FOR REGISTRATION OF DRILLING AGENCY & RIG",
    "Section 1: Agency Profile | Section 2: Proprietor / Partner A",
    1
  );

  let curY = PAGE_HEIGHT - 85;

  // Section 1 Header
  page1.drawText("1. PARTICULARS OF DRILLING AGENCY / FIRM", {
    x: MARGIN_LEFT,
    y: curY,
    size: 9.5,
    font: fontBold,
    color: rgb(0.1, 0.3, 0.6),
  });
  curY -= 18;

  // Agency Fields Grid
  const addFieldRow = (p: any, label: string, key: string, y: number, w: number = 360, xOff: number = 150) => {
    p.drawText(label, {
      x: MARGIN_LEFT + 5,
      y: y + 3,
      size: 8.5,
      font: fontBold,
      color: rgb(0.2, 0.2, 0.2),
    });
    addOrSetTextField(form, p, key, data[key] || "", {
      x: MARGIN_LEFT + xOff,
      y: y - 2,
      width: w,
      height: 16,
      fontSize: 8.5,
    });
  };

  addFieldRow(page1, "1.1 Agency Name", "agencyName", curY, 350);
  curY -= 22;
  addFieldRow(page1, "1.2 Office Address", "address", curY, 350);
  curY -= 22;

  // Split row: Village & Taluk
  page1.drawText("1.3 Village", { x: MARGIN_LEFT + 5, y: curY + 3, size: 8.5, font: fontBold });
  addOrSetTextField(form, page1, "village", data.village || "", { x: MARGIN_LEFT + 75, y: curY - 2, width: 160, height: 16, fontSize: 8.5 });
  page1.drawText("Taluk", { x: MARGIN_LEFT + 250, y: curY + 3, size: 8.5, font: fontBold });
  addOrSetTextField(form, page1, "taluk", data.taluk || "", { x: MARGIN_LEFT + 300, y: curY - 2, width: 210, height: 16, fontSize: 8.5 });
  curY -= 22;

  // Split row: Panchayath & District
  page1.drawText("1.4 Panchayath", { x: MARGIN_LEFT + 5, y: curY + 3, size: 8.5, font: fontBold });
  addOrSetTextField(form, page1, "panchayath", data.panchayath || "", { x: MARGIN_LEFT + 85, y: curY - 2, width: 150, height: 16, fontSize: 8.5 });
  page1.drawText("District", { x: MARGIN_LEFT + 250, y: curY + 3, size: 8.5, font: fontBold });
  addOrSetTextField(form, page1, "district", data.district || "", { x: MARGIN_LEFT + 300, y: curY - 2, width: 210, height: 16, fontSize: 8.5 });
  curY -= 22;

  // Split row: Pin Code, GSTIN & LSGD Reg
  page1.drawText("1.5 PIN Code", { x: MARGIN_LEFT + 5, y: curY + 3, size: 8.5, font: fontBold });
  addOrSetTextField(form, page1, "pincode", data.pincode || "", { x: MARGIN_LEFT + 75, y: curY - 2, width: 75, height: 16, fontSize: 8.5 });
  page1.drawText("GSTIN", { x: MARGIN_LEFT + 160, y: curY + 3, size: 8.5, font: fontBold });
  addOrSetTextField(form, page1, "gstin", data.gstin || "", { x: MARGIN_LEFT + 200, y: curY - 2, width: 130, height: 16, fontSize: 8.5 });
  page1.drawText("LSGD Reg", { x: MARGIN_LEFT + 340, y: curY + 3, size: 8.5, font: fontBold });
  addOrSetTextField(form, page1, "lsgdRegNo", data.lsgdRegNo || "", { x: MARGIN_LEFT + 400, y: curY - 2, width: 110, height: 16, fontSize: 8.5 });
  curY -= 28;

  // Section 2 Header: Owner A
  page1.drawText("2. PROPRIETOR / MANAGING PARTNER (OWNER A)", {
    x: MARGIN_LEFT,
    y: curY,
    size: 9.5,
    font: fontBold,
    color: rgb(0.1, 0.3, 0.6),
  });
  curY -= 18;

  addFieldRow(page1, "2.1 Full Name", "ownerA_name", curY, 350);
  curY -= 22;
  addFieldRow(page1, "2.2 Current Address", "ownerA_curr_address", curY, 350);
  curY -= 22;

  // Owner A Current Village / Taluk
  page1.drawText("Village", { x: MARGIN_LEFT + 5, y: curY + 3, size: 8.5, font: fontBold });
  addOrSetTextField(form, page1, "ownerA_curr_village", data.ownerA_curr_village || "", { x: MARGIN_LEFT + 65, y: curY - 2, width: 170, height: 16, fontSize: 8.5 });
  page1.drawText("Taluk", { x: MARGIN_LEFT + 250, y: curY + 3, size: 8.5, font: fontBold });
  addOrSetTextField(form, page1, "ownerA_curr_taluk", data.ownerA_curr_taluk || "", { x: MARGIN_LEFT + 300, y: curY - 2, width: 210, height: 16, fontSize: 8.5 });
  curY -= 22;

  // Owner A Panchayath / District / Pin
  page1.drawText("Panchayath", { x: MARGIN_LEFT + 5, y: curY + 3, size: 8.5, font: fontBold });
  addOrSetTextField(form, page1, "ownerA_curr_panchayath", data.ownerA_curr_panchayath || "", { x: MARGIN_LEFT + 75, y: curY - 2, width: 130, height: 16, fontSize: 8.5 });
  page1.drawText("District", { x: MARGIN_LEFT + 215, y: curY + 3, size: 8.5, font: fontBold });
  addOrSetTextField(form, page1, "ownerA_curr_district", data.ownerA_curr_district || "", { x: MARGIN_LEFT + 260, y: curY - 2, width: 120, height: 16, fontSize: 8.5 });
  page1.drawText("PIN", { x: MARGIN_LEFT + 390, y: curY + 3, size: 8.5, font: fontBold });
  addOrSetTextField(form, page1, "ownerA_curr_pincode", data.ownerA_curr_pincode || "", { x: MARGIN_LEFT + 420, y: curY - 2, width: 90, height: 16, fontSize: 8.5 });
  curY -= 22;

  addFieldRow(page1, "2.3 Permanent Address", "ownerA_perm_address", curY, 350);
  curY -= 22;

  // Owner A ID type, ID No, PAN, Nominee
  page1.drawText("2.4 ID Type", { x: MARGIN_LEFT + 5, y: curY + 3, size: 8.5, font: fontBold });
  addOrSetTextField(form, page1, "ownerA_id_type", data.ownerA_id_type || "Aadhaar", { x: MARGIN_LEFT + 75, y: curY - 2, width: 100, height: 16, fontSize: 8.5 });
  page1.drawText("ID Number", { x: MARGIN_LEFT + 185, y: curY + 3, size: 8.5, font: fontBold });
  addOrSetTextField(form, page1, "ownerA_id_no", data.ownerA_id_no || "", { x: MARGIN_LEFT + 245, y: curY - 2, width: 120, height: 16, fontSize: 8.5 });
  page1.drawText("PAN", { x: MARGIN_LEFT + 375, y: curY + 3, size: 8.5, font: fontBold });
  addOrSetTextField(form, page1, "ownerA_pan", data.ownerA_pan || "", { x: MARGIN_LEFT + 410, y: curY - 2, width: 100, height: 16, fontSize: 8.5 });
  curY -= 22;

  addFieldRow(page1, "2.5 Nominee Name", "ownerA_nominee", curY, 350);
  curY -= 22;
  addFieldRow(page1, "2.6 Drilling Exp (Yrs)", "ownerA_exp", curY, 150);

  // =========================================================================
  // PAGE 2: Partner B & Partner C
  // =========================================================================
  const page2 = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  drawHeader(
    page2,
    "APPLICATION FOR REGISTRATION OF DRILLING AGENCY & RIG",
    "Section 2 (Contd.): Additional Partners (Partner B & Partner C)",
    2
  );

  curY = PAGE_HEIGHT - 85;

  // Partner B
  page2.drawText("PARTNER B DETAILS", { x: MARGIN_LEFT, y: curY, size: 9.5, font: fontBold, color: rgb(0.1, 0.3, 0.6) });
  curY -= 18;
  addFieldRow(page2, "Full Name", "ownerB_name", curY, 350);
  curY -= 22;
  addFieldRow(page2, "Current Address", "ownerB_curr_address", curY, 350);
  curY -= 22;
  addFieldRow(page2, "Permanent Address", "ownerB_perm_address", curY, 350);
  curY -= 22;

  page2.drawText("ID Type", { x: MARGIN_LEFT + 5, y: curY + 3, size: 8.5, font: fontBold });
  addOrSetTextField(form, page2, "ownerB_id_type", data.ownerB_id_type || "Aadhaar", { x: MARGIN_LEFT + 75, y: curY - 2, width: 100, height: 16, fontSize: 8.5 });
  page2.drawText("ID Number", { x: MARGIN_LEFT + 185, y: curY + 3, size: 8.5, font: fontBold });
  addOrSetTextField(form, page2, "ownerB_id_no", data.ownerB_id_no || "", { x: MARGIN_LEFT + 245, y: curY - 2, width: 120, height: 16, fontSize: 8.5 });
  page2.drawText("PAN", { x: MARGIN_LEFT + 375, y: curY + 3, size: 8.5, font: fontBold });
  addOrSetTextField(form, page2, "ownerB_pan", data.ownerB_pan || "", { x: MARGIN_LEFT + 410, y: curY - 2, width: 100, height: 16, fontSize: 8.5 });
  curY -= 22;
  addFieldRow(page2, "Nominee Name", "ownerB_nominee", curY, 350);
  curY -= 35;

  // Partner C
  page2.drawText("PARTNER C DETAILS", { x: MARGIN_LEFT, y: curY, size: 9.5, font: fontBold, color: rgb(0.1, 0.3, 0.6) });
  curY -= 18;
  addFieldRow(page2, "Full Name", "ownerC_name", curY, 350);
  curY -= 22;
  addFieldRow(page2, "Current Address", "ownerC_curr_address", curY, 350);
  curY -= 22;
  addFieldRow(page2, "Permanent Address", "ownerC_perm_address", curY, 350);
  curY -= 22;

  page2.drawText("ID Type", { x: MARGIN_LEFT + 5, y: curY + 3, size: 8.5, font: fontBold });
  addOrSetTextField(form, page2, "ownerC_id_type", data.ownerC_id_type || "Aadhaar", { x: MARGIN_LEFT + 75, y: curY - 2, width: 100, height: 16, fontSize: 8.5 });
  page2.drawText("ID Number", { x: MARGIN_LEFT + 185, y: curY + 3, size: 8.5, font: fontBold });
  addOrSetTextField(form, page2, "ownerC_id_no", data.ownerC_id_no || "", { x: MARGIN_LEFT + 245, y: curY - 2, width: 120, height: 16, fontSize: 8.5 });
  page2.drawText("PAN", { x: MARGIN_LEFT + 375, y: curY + 3, size: 8.5, font: fontBold });
  addOrSetTextField(form, page2, "ownerC_pan", data.ownerC_pan || "", { x: MARGIN_LEFT + 410, y: curY - 2, width: 100, height: 16, fontSize: 8.5 });
  curY -= 22;
  addFieldRow(page2, "Nominee Name", "ownerC_nominee", curY, 350);

  // =========================================================================
  // PAGE 3: Section 3 - Rig Specifications (Rig A, Rig B, Rig C)
  // =========================================================================
  const page3 = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  drawHeader(
    page3,
    "APPLICATION FOR REGISTRATION OF DRILLING AGENCY & RIG",
    "Section 3: Mechanical Specifications of Drilling Rigs (Max 3)",
    3
  );

  curY = PAGE_HEIGHT - 85;

  ["A", "B", "C"].forEach((rigLetter) => {
    page3.drawText(`RIG ${rigLetter} SPECIFICATIONS`, {
      x: MARGIN_LEFT,
      y: curY,
      size: 9.5,
      font: fontBold,
      color: rgb(0.1, 0.3, 0.6),
    });
    curY -= 16;

    page3.drawText("Rig Type", { x: MARGIN_LEFT + 5, y: curY + 3, size: 8, font: fontBold });
    addOrSetTextField(form, page3, `rig${rigLetter}_type`, data[`rig${rigLetter}_type`] || "", { x: MARGIN_LEFT + 75, y: curY - 2, width: 170, height: 15, fontSize: 8 });
    page3.drawText("Veh. Reg No", { x: MARGIN_LEFT + 255, y: curY + 3, size: 8, font: fontBold });
    addOrSetTextField(form, page3, `rig${rigLetter}_veh_reg`, data[`rig${rigLetter}_veh_reg`] || "", { x: MARGIN_LEFT + 330, y: curY - 2, width: 180, height: 15, fontSize: 8 });
    curY -= 19;

    page3.drawText("Chassis No", { x: MARGIN_LEFT + 5, y: curY + 3, size: 8, font: fontBold });
    addOrSetTextField(form, page3, `rig${rigLetter}_veh_chassis`, data[`rig${rigLetter}_veh_chassis`] || "", { x: MARGIN_LEFT + 75, y: curY - 2, width: 170, height: 15, fontSize: 8 });
    page3.drawText("Engine No", { x: MARGIN_LEFT + 255, y: curY + 3, size: 8, font: fontBold });
    addOrSetTextField(form, page3, `rig${rigLetter}_veh_engine`, data[`rig${rigLetter}_veh_engine`] || "", { x: MARGIN_LEFT + 330, y: curY - 2, width: 180, height: 15, fontSize: 8 });
    curY -= 19;

    page3.drawText("Compressor", { x: MARGIN_LEFT + 5, y: curY + 3, size: 8, font: fontBold });
    addOrSetTextField(form, page3, `rig${rigLetter}_comp_model`, data[`rig${rigLetter}_comp_model`] || "", { x: MARGIN_LEFT + 75, y: curY - 2, width: 170, height: 15, fontSize: 8 });
    page3.drawText("Capacity", { x: MARGIN_LEFT + 255, y: curY + 3, size: 8, font: fontBold });
    addOrSetTextField(form, page3, `rig${rigLetter}_comp_cap`, data[`rig${rigLetter}_comp_cap`] || "", { x: MARGIN_LEFT + 330, y: curY - 2, width: 180, height: 15, fontSize: 8 });
    curY -= 19;

    page3.drawText("Generator", { x: MARGIN_LEFT + 5, y: curY + 3, size: 8, font: fontBold });
    addOrSetTextField(form, page3, `rig${rigLetter}_gen_model`, data[`rig${rigLetter}_gen_model`] || "", { x: MARGIN_LEFT + 75, y: curY - 2, width: 170, height: 15, fontSize: 8 });
    page3.drawText("Gen Cap/Eng", { x: MARGIN_LEFT + 255, y: curY + 3, size: 8, font: fontBold });
    addOrSetTextField(form, page3, `rig${rigLetter}_gen_cap`, data[`rig${rigLetter}_gen_cap`] || "", { x: MARGIN_LEFT + 330, y: curY - 2, width: 180, height: 15, fontSize: 8 });
    curY -= 26;
  });

  // =========================================================================
  // PAGE 4: Declarations, Signatures & Section 4 (Office Inspection)
  // =========================================================================
  const page4 = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  drawHeader(
    page4,
    "APPLICATION FOR REGISTRATION OF DRILLING AGENCY & RIG",
    "Section 4: Applicant Declaration & Official Office Inspection Report",
    4
  );

  curY = PAGE_HEIGHT - 85;

  page4.drawText("APPLICANT DECLARATION", { x: MARGIN_LEFT, y: curY, size: 9.5, font: fontBold, color: rgb(0.1, 0.3, 0.6) });
  curY -= 14;
  page4.drawText(
    "I / We hereby solemnly declare that all particulars furnished above are true, accurate and complete to the best of my knowledge.",
    { x: MARGIN_LEFT, y: curY, size: 8, font, color: rgb(0.3, 0.3, 0.3) }
  );
  curY -= 24;

  page4.drawText("Place", { x: MARGIN_LEFT + 5, y: curY + 3, size: 8.5, font: fontBold });
  addOrSetTextField(form, page4, "place", data.place || "", { x: MARGIN_LEFT + 50, y: curY - 2, width: 150, height: 16, fontSize: 8.5 });
  page4.drawText("Date", { x: MARGIN_LEFT + 240, y: curY + 3, size: 8.5, font: fontBold });
  addOrSetTextField(form, page4, "date", data.date || "", { x: MARGIN_LEFT + 280, y: curY - 2, width: 120, height: 16, fontSize: 8.5 });
  curY -= 40;

  // Office Section
  page4.drawText("FOR OFFICE USE ONLY (OFFICIAL INSPECTION & RECOMMENDATION)", {
    x: MARGIN_LEFT,
    y: curY,
    size: 9.5,
    font: fontBold,
    color: rgb(0.1, 0.3, 0.6),
  });
  curY -= 18;

  addFieldRow(page4, "Date of Receipt", "office_date_recd", curY, 180, 160);
  curY -= 22;
  addFieldRow(page4, "Application Fee Details", "office_fee_details", curY, 340, 160);
  curY -= 22;
  addFieldRow(page4, "Fee Paid Amount (Rs.)", "office_paid_amount", curY, 180, 160);
  curY -= 22;
  addFieldRow(page4, "Rig Inspection Date", "office_rig_inspected_date", curY, 180, 160);
  curY -= 22;
  addFieldRow(page4, "Inspection Recommendation", "office_recommendation", curY, 340, 160);
  curY -= 22;
  addFieldRow(page4, "Inspecting Officer / Desig", "office_inspector_signature", curY, 340, 160);

  // =========================================================================
  // PAGE 5: Official Counterfoil Receipt
  // =========================================================================
  const page5 = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  drawHeader(
    page5,
    "KERALA GROUND WATER AUTHORITY - OFFICIAL COUNTERFOIL RECEIPT",
    "Acknowledgment of Application & Inspection Fee Receipt",
    5
  );

  curY = PAGE_HEIGHT - 90;

  page5.drawRectangle({
    x: MARGIN_LEFT,
    y: curY - 300,
    width: CONTENT_WIDTH,
    height: 310,
    borderColor: rgb(0.2, 0.4, 0.7),
    borderWidth: 1.5,
    color: rgb(0.99, 0.99, 1.0),
  });

  page5.drawText("OFFICIAL ACKNOWLEDGMENT RECEIPT", {
    x: MARGIN_LEFT + 20,
    y: curY - 20,
    size: 11,
    font: fontBold,
    color: rgb(0.1, 0.2, 0.5),
  });

  let recY = curY - 50;
  addFieldRow(page5, "Application No.", "receipt_app_no", recY, 200, 140);
  recY -= 24;
  addFieldRow(page5, "Applicant / Agency Name", "receipt_applicant_name", recY, 320, 140);
  recY -= 24;
  addFieldRow(page5, "Date of Receipt", "receipt_date_recd", recY, 200, 140);
  recY -= 24;
  addFieldRow(page5, "Amount Received (Rs.)", "receipt_paid_amount", recY, 200, 140);
  recY -= 24;
  addFieldRow(page5, "Payment / Challan Date", "receipt_paid_date", recY, 200, 140);
  recY -= 30;

  page5.drawText("Office Seal & Authorized Signatory", {
    x: PAGE_WIDTH - MARGIN_LEFT - 220,
    y: recY - 40,
    size: 9,
    font: fontBold,
    color: rgb(0.3, 0.3, 0.3),
  });

  return await pdfDoc.save();
}

/**
 * Builds the official 5-Page Rig Renewal native vector AcroForm PDF.
 */
export async function createOfficialRigRenewalAcroFormPdf(
  data: Record<string, any>,
  activeTemplate?: MasterPdfTemplate | null
): Promise<Uint8Array> {
  // 1. If an active master template was uploaded by Super Admin, use it!
  if (activeTemplate && activeTemplate.base64Pdf) {
    try {
      const customTemplateBytes = base64ToArrayBuffer(activeTemplate.base64Pdf);
      const pdfDoc = await PDFDocument.load(customTemplateBytes);
      const form = pdfDoc.getForm();
      const fields = form.getFields();

      // If the template contains interactive AcroForm fields, populate them directly
      if (fields && fields.length > 0) {
        const filled = await populatePdfAcroFormFields(pdfDoc, data);
        if (filled > 0) {
          return await pdfDoc.save();
        }
      }

      // If it's a flat scanned master PDF with 0 fields or 0 filled, overlay vector data
      return await generateRigRenewalPdfOverlay(data, customTemplateBytes);
    } catch (tplErr) {
      console.warn("Could not load custom renewal template, falling back to built-in generator:", tplErr);
    }
  }

  // 2. Try default template file in /templates/rig-renewal-template.pdf if available
  try {
    const pdfBytes = await generateRigRenewalPdfOverlay(data);
    return pdfBytes;
  } catch (err) {
    console.warn("Could not load default renewal template overlay, using default vector generator:", err);
  }

  // Built-in 5-Page Rig Renewal Vector AcroForm Generator
  let pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const form = pdfDoc.getForm();

  const PAGE_WIDTH = 595.28;
  const PAGE_HEIGHT = 841.89;
  const MARGIN_LEFT = 40;
  const CONTENT_WIDTH = PAGE_WIDTH - MARGIN_LEFT * 2;

  const drawHeader = (page: any, title: string, subtitle: string, pageNum: number) => {
    page.drawText("KERALA GROUND WATER AUTHORITY", {
      x: MARGIN_LEFT,
      y: PAGE_HEIGHT - 35,
      size: 13,
      font: fontBold,
      color: rgb(0.1, 0.3, 0.2),
    });
    page.drawText(title, {
      x: MARGIN_LEFT,
      y: PAGE_HEIGHT - 50,
      size: 10,
      font: fontBold,
      color: rgb(0.2, 0.2, 0.2),
    });
    if (subtitle) {
      page.drawText(subtitle, {
        x: MARGIN_LEFT,
        y: PAGE_HEIGHT - 62,
        size: 8,
        font: font,
        color: rgb(0.4, 0.4, 0.4),
      });
    }
    page.drawText(`Page ${pageNum} of 5`, {
      x: PAGE_WIDTH - MARGIN_LEFT - 60,
      y: PAGE_HEIGHT - 35,
      size: 9,
      font: fontBold,
      color: rgb(0.4, 0.4, 0.4),
    });
    page.drawLine({
      start: { x: MARGIN_LEFT, y: PAGE_HEIGHT - 68 },
      end: { x: PAGE_WIDTH - MARGIN_LEFT, y: PAGE_HEIGHT - 68 },
      thickness: 1,
      color: rgb(0.75, 0.85, 0.8),
    });
  };

  const addFieldRow = (p: any, label: string, key: string, y: number, w: number = 360, xOff: number = 150) => {
    p.drawText(label, {
      x: MARGIN_LEFT + 5,
      y: y + 3,
      size: 8.5,
      font: fontBold,
      color: rgb(0.2, 0.2, 0.2),
    });
    addOrSetTextField(form, p, key, data[key] || "", {
      x: MARGIN_LEFT + xOff,
      y: y - 2,
      width: w,
      height: 16,
      fontSize: 8.5,
    });
  };

  // =========================================================================
  // PAGE 1: Section 1 (Agency Details) & Section 2 (Proprietor)
  // =========================================================================
  const page1 = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  drawHeader(
    page1,
    "APPLICATION FOR RENEWAL OF RIG REGISTRATION",
    "Section 1: Agency Particulars | Section 2: Proprietor Details",
    1
  );

  let curY = PAGE_HEIGHT - 85;

  page1.drawText("1. AGENCY PARTICULARS & REGISTRATION VALIDITY", {
    x: MARGIN_LEFT,
    y: curY,
    size: 9.5,
    font: fontBold,
    color: rgb(0.1, 0.4, 0.2),
  });
  curY -= 18;

  addFieldRow(page1, "1.1 Agency Name", "agencyName", curY, 350);
  curY -= 22;

  page1.drawText("1.2 Reg No.", { x: MARGIN_LEFT + 5, y: curY + 3, size: 8.5, font: fontBold });
  addOrSetTextField(form, page1, "agency_reg_no", data.agency_reg_no || "", { x: MARGIN_LEFT + 80, y: curY - 2, width: 160, height: 16, fontSize: 8.5 });
  page1.drawText("Expiry Date", { x: MARGIN_LEFT + 260, y: curY + 3, size: 8.5, font: fontBold });
  addOrSetTextField(form, page1, "agency_reg_expiry", data.agency_reg_expiry || "", { x: MARGIN_LEFT + 330, y: curY - 2, width: 180, height: 16, fontSize: 8.5 });
  curY -= 22;

  addFieldRow(page1, "1.3 Office Address", "address", curY, 350);
  curY -= 22;

  page1.drawText("1.4 Phone", { x: MARGIN_LEFT + 5, y: curY + 3, size: 8.5, font: fontBold });
  addOrSetTextField(form, page1, "phone", data.phone || "", { x: MARGIN_LEFT + 80, y: curY - 2, width: 160, height: 16, fontSize: 8.5 });
  page1.drawText("Email", { x: MARGIN_LEFT + 260, y: curY + 3, size: 8.5, font: fontBold });
  addOrSetTextField(form, page1, "email", data.email || "", { x: MARGIN_LEFT + 310, y: curY - 2, width: 200, height: 16, fontSize: 8.5 });
  curY -= 28;

  // Section 2: Owner
  page1.drawText("2. PROPRIETOR / APPLICANT PROFILE", {
    x: MARGIN_LEFT,
    y: curY,
    size: 9.5,
    font: fontBold,
    color: rgb(0.1, 0.4, 0.2),
  });
  curY -= 18;

  addFieldRow(page1, "2.1 Full Name", "owner_name", curY, 350);
  curY -= 22;
  addFieldRow(page1, "2.2 Current Address", "owner_curr_address", curY, 350);
  curY -= 22;
  addFieldRow(page1, "2.3 Permanent Address", "owner_perm_address", curY, 350);
  curY -= 22;

  page1.drawText("2.4 ID Type", { x: MARGIN_LEFT + 5, y: curY + 3, size: 8.5, font: fontBold });
  addOrSetTextField(form, page1, "owner_id_type", data.owner_id_type || "Aadhaar", { x: MARGIN_LEFT + 75, y: curY - 2, width: 100, height: 16, fontSize: 8.5 });
  page1.drawText("ID Number", { x: MARGIN_LEFT + 185, y: curY + 3, size: 8.5, font: fontBold });
  addOrSetTextField(form, page1, "owner_id_no", data.owner_id_no || "", { x: MARGIN_LEFT + 245, y: curY - 2, width: 120, height: 16, fontSize: 8.5 });
  page1.drawText("PAN", { x: MARGIN_LEFT + 375, y: curY + 3, size: 8.5, font: fontBold });
  addOrSetTextField(form, page1, "owner_pan", data.owner_pan || "", { x: MARGIN_LEFT + 410, y: curY - 2, width: 100, height: 16, fontSize: 8.5 });
  curY -= 22;

  addFieldRow(page1, "2.5 Nominee Name", "owner_nominee", curY, 350);

  // =========================================================================
  // PAGE 2: Rig 1 Details & Operator Details
  // =========================================================================
  const page2 = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  drawHeader(
    page2,
    "APPLICATION FOR RENEWAL OF RIG REGISTRATION",
    "Section 3: Rig 1 Specification, Vehicle & Designated Operator",
    2
  );

  curY = PAGE_HEIGHT - 85;

  page2.drawText("RIG 1 RENEWAL DETAILS", { x: MARGIN_LEFT, y: curY, size: 9.5, font: fontBold, color: rgb(0.1, 0.4, 0.2) });
  curY -= 18;

  page2.drawText("Rig Reg No.", { x: MARGIN_LEFT + 5, y: curY + 3, size: 8.5, font: fontBold });
  addOrSetTextField(form, page2, "rig1_regNo", data.rig1_regNo || "", { x: MARGIN_LEFT + 80, y: curY - 2, width: 160, height: 16, fontSize: 8.5 });
  page2.drawText("Expiry Date", { x: MARGIN_LEFT + 260, y: curY + 3, size: 8.5, font: fontBold });
  addOrSetTextField(form, page2, "rig1_expiryDate", data.rig1_expiryDate || "", { x: MARGIN_LEFT + 330, y: curY - 2, width: 180, height: 16, fontSize: 8.5 });
  curY -= 22;

  addFieldRow(page2, "Rig Type", "rig1_type", curY, 350);
  curY -= 22;

  page2.drawText("Veh Reg No.", { x: MARGIN_LEFT + 5, y: curY + 3, size: 8.5, font: fontBold });
  addOrSetTextField(form, page2, "rig1_veh_reg", data.rig1_veh_reg || "", { x: MARGIN_LEFT + 80, y: curY - 2, width: 160, height: 16, fontSize: 8.5 });
  page2.drawText("Chassis No.", { x: MARGIN_LEFT + 260, y: curY + 3, size: 8.5, font: fontBold });
  addOrSetTextField(form, page2, "rig1_veh_chassis", data.rig1_veh_chassis || "", { x: MARGIN_LEFT + 330, y: curY - 2, width: 180, height: 16, fontSize: 8.5 });
  curY -= 22;

  page2.drawText("Compressor", { x: MARGIN_LEFT + 5, y: curY + 3, size: 8.5, font: fontBold });
  addOrSetTextField(form, page2, "rig1_comp_model", data.rig1_comp_model || "", { x: MARGIN_LEFT + 80, y: curY - 2, width: 160, height: 16, fontSize: 8.5 });
  page2.drawText("Capacity", { x: MARGIN_LEFT + 260, y: curY + 3, size: 8.5, font: fontBold });
  addOrSetTextField(form, page2, "rig1_comp_cap", data.rig1_comp_cap || "", { x: MARGIN_LEFT + 330, y: curY - 2, width: 180, height: 16, fontSize: 8.5 });
  curY -= 28;

  // Rig 1 Operator
  page2.drawText("RIG 1 DESIGNATED OPERATOR", { x: MARGIN_LEFT, y: curY, size: 9.5, font: fontBold, color: rgb(0.1, 0.4, 0.2) });
  curY -= 18;

  addFieldRow(page2, "Operator Name", "rig1_op_name", curY, 350);
  curY -= 22;
  addFieldRow(page2, "Operator Address", "rig1_op_address", curY, 350);
  curY -= 22;

  page2.drawText("Operator Phone", { x: MARGIN_LEFT + 5, y: curY + 3, size: 8.5, font: fontBold });
  addOrSetTextField(form, page2, "rig1_op_phone", data.rig1_op_phone || "", { x: MARGIN_LEFT + 95, y: curY - 2, width: 150, height: 16, fontSize: 8.5 });
  page2.drawText("Drilling Exp (Yrs)", { x: MARGIN_LEFT + 260, y: curY + 3, size: 8.5, font: fontBold });
  addOrSetTextField(form, page2, "rig1_op_exp", data.rig1_op_exp || "", { x: MARGIN_LEFT + 360, y: curY - 2, width: 150, height: 16, fontSize: 8.5 });

  // =========================================================================
  // PAGE 3: Rig 2 & Rig 3 Details
  // =========================================================================
  const page3 = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  drawHeader(
    page3,
    "APPLICATION FOR RENEWAL OF RIG REGISTRATION",
    "Section 3 (Contd.): Additional Rigs (Rig 2 & Rig 3)",
    3
  );

  curY = PAGE_HEIGHT - 85;

  // Rig 2
  page3.drawText("RIG 2 RENEWAL DETAILS", { x: MARGIN_LEFT, y: curY, size: 9.5, font: fontBold, color: rgb(0.1, 0.4, 0.2) });
  curY -= 16;
  page3.drawText("Reg No.", { x: MARGIN_LEFT + 5, y: curY + 3, size: 8, font: fontBold });
  addOrSetTextField(form, page3, "rig2_regNo", data.rig2_regNo || "", { x: MARGIN_LEFT + 60, y: curY - 2, width: 180, height: 15, fontSize: 8 });
  page3.drawText("Expiry", { x: MARGIN_LEFT + 260, y: curY + 3, size: 8, font: fontBold });
  addOrSetTextField(form, page3, "rig2_expiryDate", data.rig2_expiryDate || "", { x: MARGIN_LEFT + 310, y: curY - 2, width: 200, height: 15, fontSize: 8 });
  curY -= 19;
  addFieldRow(page3, "Rig Type", "rig2_type", curY, 350);
  curY -= 19;
  addFieldRow(page3, "Operator Name", "rig2_op_name", curY, 350);
  curY -= 32;

  // Rig 3
  page3.drawText("RIG 3 RENEWAL DETAILS", { x: MARGIN_LEFT, y: curY, size: 9.5, font: fontBold, color: rgb(0.1, 0.4, 0.2) });
  curY -= 16;
  page3.drawText("Reg No.", { x: MARGIN_LEFT + 5, y: curY + 3, size: 8, font: fontBold });
  addOrSetTextField(form, page3, "rig3_regNo", data.rig3_regNo || "", { x: MARGIN_LEFT + 60, y: curY - 2, width: 180, height: 15, fontSize: 8 });
  page3.drawText("Expiry", { x: MARGIN_LEFT + 260, y: curY + 3, size: 8, font: fontBold });
  addOrSetTextField(form, page3, "rig3_expiryDate", data.rig3_expiryDate || "", { x: MARGIN_LEFT + 310, y: curY - 2, width: 200, height: 15, fontSize: 8 });
  curY -= 19;
  addFieldRow(page3, "Rig Type", "rig3_type", curY, 350);
  curY -= 19;
  addFieldRow(page3, "Operator Name", "rig3_op_name", curY, 350);

  // =========================================================================
  // PAGE 4: Declaration & Office Inspection
  // =========================================================================
  const page4 = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  drawHeader(
    page4,
    "APPLICATION FOR RENEWAL OF RIG REGISTRATION",
    "Section 4: Renewal Declaration & Office Inspection Report",
    4
  );

  curY = PAGE_HEIGHT - 85;

  page4.drawText("APPLICANT RENEWAL DECLARATION", { x: MARGIN_LEFT, y: curY, size: 9.5, font: fontBold, color: rgb(0.1, 0.4, 0.2) });
  curY -= 14;
  page4.drawText(
    "I / We solemnly declare that all rigs operated by our agency comply with environmental and safety standards.",
    { x: MARGIN_LEFT, y: curY, size: 8, font, color: rgb(0.3, 0.3, 0.3) }
  );
  curY -= 24;

  page4.drawText("Place", { x: MARGIN_LEFT + 5, y: curY + 3, size: 8.5, font: fontBold });
  addOrSetTextField(form, page4, "place", data.place || "", { x: MARGIN_LEFT + 50, y: curY - 2, width: 150, height: 16, fontSize: 8.5 });
  page4.drawText("Date", { x: MARGIN_LEFT + 240, y: curY + 3, size: 8.5, font: fontBold });
  addOrSetTextField(form, page4, "date", data.date || "", { x: MARGIN_LEFT + 280, y: curY - 2, width: 120, height: 16, fontSize: 8.5 });
  curY -= 40;

  // Office Section
  page4.drawText("FOR OFFICE USE ONLY (OFFICIAL RENEWAL VERIFICATION)", {
    x: MARGIN_LEFT,
    y: curY,
    size: 9.5,
    font: fontBold,
    color: rgb(0.1, 0.4, 0.2),
  });
  curY -= 18;

  addFieldRow(page4, "Date of Receipt", "office_date_recd", curY, 180, 160);
  curY -= 22;
  addFieldRow(page4, "Fee Paid Amount (Rs.)", "office_fee_amount", curY, 180, 160);
  curY -= 22;
  addFieldRow(page4, "Payment / Challan Date", "office_fee_date", curY, 180, 160);
  curY -= 22;
  addFieldRow(page4, "Inspection Date", "office_rig_inspected_date", curY, 180, 160);
  curY -= 22;
  addFieldRow(page4, "Recommendation / Order", "office_recommendation", curY, 340, 160);

  // =========================================================================
  // PAGE 5: Official Counterfoil Receipt
  // =========================================================================
  const page5 = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  drawHeader(
    page5,
    "KERALA GROUND WATER AUTHORITY - RENEWAL COUNTERFOIL RECEIPT",
    "Acknowledgment of Renewal Application & Fee Receipt",
    5
  );

  curY = PAGE_HEIGHT - 90;

  page5.drawRectangle({
    x: MARGIN_LEFT,
    y: curY - 300,
    width: CONTENT_WIDTH,
    height: 310,
    borderColor: rgb(0.2, 0.5, 0.3),
    borderWidth: 1.5,
    color: rgb(0.99, 1.0, 0.99),
  });

  page5.drawText("OFFICIAL RENEWAL ACKNOWLEDGMENT RECEIPT", {
    x: MARGIN_LEFT + 20,
    y: curY - 20,
    size: 11,
    font: fontBold,
    color: rgb(0.1, 0.4, 0.2),
  });

  let recY = curY - 50;
  addFieldRow(page5, "Application No.", "receipt_app_no", recY, 200, 150);
  recY -= 24;
  addFieldRow(page5, "Agency Name", "receipt_agency_name", recY, 320, 150);
  recY -= 24;
  addFieldRow(page5, "Agency Reg No.", "receipt_agency_reg_no", recY, 200, 150);
  recY -= 24;
  addFieldRow(page5, "Renewal Rig Count", "receipt_renewal_count", recY, 100, 150);
  recY -= 24;
  addFieldRow(page5, "Fee Paid Amount (Rs.)", "receipt_fee_paid_amount", recY, 200, 150);
  recY -= 24;
  addFieldRow(page5, "Fee Paid Date", "receipt_fee_paid_date", recY, 200, 150);

  return await pdfDoc.save();
}

/**
 * Convenience helper to download generated PDF.
 */
export function downloadPdfBytes(pdfBytes: Uint8Array, fileName: string) {
  download(pdfBytes, fileName, "application/pdf");
}

/**
 * Triggers direct browser printing of pure PDF stream without HTML web page distortion.
 */
export function printPdfBytesDirectly(pdfBytes: Uint8Array): void {
  if (typeof window === "undefined") return;
  const blob = new Blob([pdfBytes], { type: "application/pdf" });
  const blobUrl = URL.createObjectURL(blob);

  const iframe = document.createElement("iframe");
  iframe.style.position = "fixed";
  iframe.style.right = "0";
  iframe.style.bottom = "0";
  iframe.style.width = "0";
  iframe.style.height = "0";
  iframe.style.border = "none";
  iframe.src = blobUrl;
  document.body.appendChild(iframe);

  iframe.onload = () => {
    setTimeout(() => {
      try {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
      } catch (err) {
        console.warn("Direct iframe print failed, falling back to window.open:", err);
        window.open(blobUrl, "_blank");
      } finally {
        setTimeout(() => {
          try {
            document.body.removeChild(iframe);
          } catch {}
          URL.revokeObjectURL(blobUrl);
        }, 60000);
      }
    }, 400);
  };
}
