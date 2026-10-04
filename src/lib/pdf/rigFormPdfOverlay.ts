import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import { safeString } from "./acroFormPdfService";

export interface RigRegistrationFormData {
  agencyName?: string;
  address?: string;
  village?: string;
  taluk?: string;
  panchayath?: string;
  district?: string;
  pincode?: string;
  gstin?: string;
  lsgdRegNo?: string;

  // Owner A
  ownerA_name?: string;
  ownerA_curr_address?: string;
  ownerA_curr_village?: string;
  ownerA_curr_taluk?: string;
  ownerA_curr_panchayath?: string;
  ownerA_curr_district?: string;
  ownerA_curr_pincode?: string;
  ownerA_curr_photo?: string;

  ownerA_perm_address?: string;
  ownerA_perm_village?: string;
  ownerA_perm_taluk?: string;
  ownerA_perm_panchayath?: string;
  ownerA_perm_district?: string;
  ownerA_perm_pincode?: string;

  ownerA_id_type?: string;
  ownerA_id_no?: string;
  ownerA_pan?: string;
  ownerA_exp?: string;
  ownerA_nominee?: string;

  // Partner B
  partnerB_name?: string;
  partnerB_curr_address?: string;
  partnerB_curr_village?: string;
  partnerB_curr_taluk?: string;
  partnerB_curr_panchayath?: string;
  partnerB_curr_district?: string;
  partnerB_curr_pincode?: string;
  partnerB_photo?: string;

  partnerB_perm_address?: string;
  partnerB_perm_village?: string;
  partnerB_perm_taluk?: string;
  partnerB_perm_panchayath?: string;
  partnerB_perm_district?: string;
  partnerB_perm_pincode?: string;

  partnerB_id_type?: string;
  partnerB_id_no?: string;
  partnerB_pan?: string;
  partnerB_nominee?: string;

  // Partner C
  partnerC_name?: string;
  partnerC_curr_address?: string;
  partnerC_curr_village?: string;
  partnerC_curr_taluk?: string;
  partnerC_curr_panchayath?: string;
  partnerC_curr_district?: string;
  partnerC_curr_pincode?: string;
  partnerC_photo?: string;

  partnerC_perm_address?: string;
  partnerC_perm_village?: string;
  partnerC_perm_taluk?: string;
  partnerC_perm_panchayath?: string;
  partnerC_perm_district?: string;
  partnerC_perm_pincode?: string;

  partnerC_id_type?: string;
  partnerC_id_no?: string;
  partnerC_pan?: string;
  partnerC_nominee?: string;

  // Rigs A, B, C
  [key: string]: any;
}

// Pure Black Color for crisp official print output
const black = rgb(0, 0, 0);

// Helper to draw text or add interactive text field to prevent double-rendering overlap
function drawOrAddField(
  form: any,
  page: any,
  font: any,
  name: string,
  value: any,
  x: number,
  y: number,
  width: number,
  height: number,
  size = 9,
  isFillable = false,
  multiline = false
) {
  if (value === undefined || value === null) return;
  const str = safeString(value);
  if (!str && !isFillable) return;

  if (isFillable && form) {
    try {
      let textField;
      try {
        textField = form.getTextField(name);
      } catch {
        textField = form.createTextField(name);
        textField.addToPage(page, {
          x,
          y: y - 2, // slightly adjust vertical alignment for neat rendering on the lines
          width,
          height,
          borderWidth: 0,
          backgroundColor: undefined, // completely transparent to avoid covering up template lines
        });
        if (multiline) {
          textField.enableMultiline();
        }
        textField.setFontSize(size);
      }
      textField.setBorderColor(undefined);
      textField.setBackgroundColor(undefined);
      if (str) {
        textField.setText(str);
      }
    } catch (err) {
      console.warn(`Field error ${name}:`, err);
    }
  } else {
    // Static flat text
    if (!str) return;
    try {
      page.drawText(str, {
        x,
        y,
        size,
        font,
        color: black,
      });
    } catch (err) {
      // Ignore encoding issues
    }
  }
}

// Helper to draw grid characters or add interactive single text field over the grid boxes
function drawOrAddBoxGridField(
  form: any,
  page: any,
  font: any,
  name: string,
  value: any,
  startX: number,
  y: number,
  boxWidth = 18,
  boxCount = 6,
  size = 10,
  isFillable = false
) {
  if (isFillable && form) {
    try {
      let textField;
      try {
        textField = form.getTextField(name);
      } catch {
        textField = form.createTextField(name);
        textField.addToPage(page, {
          x: startX,
          y: y - 2,
          width: boxWidth * boxCount,
          height: 16,
          borderWidth: 0,
          backgroundColor: undefined, // transparent
        });
        textField.setFontSize(size);
      }
      textField.setBorderColor(undefined);
      textField.setBackgroundColor(undefined);
      if (value) {
        textField.setText(String(value).toUpperCase().replace(/[^A-Z0-9]/g, ""));
      }
    } catch (err) {
      console.warn(`Grid field error ${name}:`, err);
    }
  } else {
    if (!value) return;
    const str = String(value).toUpperCase().replace(/[^A-Z0-9]/g, "");
    for (let i = 0; i < str.length; i++) {
      try {
        page.drawText(str[i], {
          x: startX + i * boxWidth + 3,
          y,
          size,
          font,
          color: black,
        });
      } catch (err) {
        // Ignore
      }
    }
  }
}

// Helper to draw checkmark or add actual interactive checkbox field
function drawOrAddCheckboxField(
  form: any,
  page: any,
  name: string,
  checked: boolean,
  x: number,
  y: number,
  size = 12,
  isFillable = false
) {
  if (isFillable && form) {
    try {
      let checkBox;
      try {
        checkBox = form.getCheckBox(name);
      } catch {
        checkBox = form.createCheckBox(name);
        checkBox.addToPage(page, {
          x,
          y,
          width: size,
          height: size,
          borderWidth: 0,
          backgroundColor: undefined,
        });
      }
      if (checked) {
        checkBox.check();
      }
    } catch (err) {
      console.warn(`Checkbox error ${name}:`, err);
    }
  } else {
    if (checked) {
      try {
        page.drawText("✓", {
          x,
          y,
          size,
          color: black,
        });
      } catch (err) {
        // Ignore
      }
    }
  }
}

// Helper to embed image
async function embedPhoto(doc: PDFDocument, page: any, dataUrl: string, x: number, y: number, width = 80, height = 95) {
  if (!dataUrl || !dataUrl.startsWith("data:image/")) return;
  try {
    let img;
    if (dataUrl.includes("image/png")) {
      const base64Data = dataUrl.split(",")[1];
      const imgBytes = Uint8Array.from(atob(base64Data), (c) => c.charCodeAt(0));
      img = await doc.embedPng(imgBytes);
    } else if (dataUrl.includes("image/jpeg") || dataUrl.includes("image/jpg")) {
      const base64Data = dataUrl.split(",")[1];
      const imgBytes = Uint8Array.from(atob(base64Data), (c) => c.charCodeAt(0));
      img = await doc.embedJpg(imgBytes);
    }
    if (img) {
      page.drawImage(img, {
        x,
        y,
        width,
        height,
      });
    }
  } catch (e) {
    console.warn("Failed to embed photo:", e);
  }
}

// ====================================================================
// 1. GENERATE RIG REGISTRATION FORM PDF OVERLAY
// ====================================================================
export async function generateRigRegistrationPdfOverlay(
  data: RigRegistrationFormData,
  customTemplateBytes?: Uint8Array | ArrayBuffer,
  isFillable = true
): Promise<Uint8Array> {
  let templateBuffer: ArrayBuffer;
  if (customTemplateBytes) {
    templateBuffer = customTemplateBytes;
  } else {
    const res = await fetch("/templates/rig-registration-template.pdf");
    templateBuffer = await res.arrayBuffer();
  }

  const pdfDoc = await PDFDocument.load(templateBuffer);
  const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const pages = pdfDoc.getPages();
  const page1 = pages[0];
  const page2 = pages[1];
  const page3 = pages[2];
  const page4 = pages[3];
  const page5 = pages[4];

  const form = isFillable ? pdfDoc.getForm() : undefined;

  // ------------------------------------------------------------------
  // PAGE 1: Agency Info & Owner A
  // ------------------------------------------------------------------
  if (page1) {
    // 1. Agency Details
    drawOrAddField(form, page1, font, "agencyName", data.agencyName, 280, 626, 260, 16, 10, isFillable);
    drawOrAddField(form, page1, font, "address", data.address, 230, 604, 310, 16, 9, isFillable);
    drawOrAddField(form, page1, font, "address_line2", data.address_line2, 140, 582, 400, 16, 9, isFillable);

    drawOrAddField(form, page1, font, "village", data.village, 210, 560, 130, 16, 9, isFillable);
    drawOrAddField(form, page1, font, "taluk", data.taluk, 430, 560, 110, 16, 9, isFillable);
    drawOrAddField(form, page1, font, "panchayath", data.panchayath, 280, 538, 120, 16, 9, isFillable);
    drawOrAddField(form, page1, font, "district", data.district, 440, 538, 100, 16, 9, isFillable);

    drawOrAddBoxGridField(form, page1, font, "pincode", data.pincode, 235, 512, 18, 6, 10, isFillable);

    drawOrAddField(form, page1, font, "gstin", data.gstin, 240, 486, 300, 16, 9, isFillable);
    drawOrAddField(form, page1, font, "lsgdRegNo", data.lsgdRegNo, 350, 460, 190, 16, 9, isFillable);

    // 2. Owner A Details
    drawOrAddField(form, page1, font, "ownerA_name", data.ownerA_name, 240, 410, 300, 16, 10, isFillable);

    // Present Address
    drawOrAddField(form, page1, font, "ownerA_curr_address", data.ownerA_curr_address, 280, 388, 260, 16, 9, isFillable);
    drawOrAddField(form, page1, font, "ownerA_curr_address2", data.ownerA_curr_address2, 140, 370, 400, 16, 9, isFillable);

    drawOrAddField(form, page1, font, "ownerA_curr_village", data.ownerA_curr_village, 210, 348, 130, 16, 9, isFillable);
    drawOrAddField(form, page1, font, "ownerA_curr_taluk", data.ownerA_curr_taluk, 420, 348, 120, 16, 9, isFillable);
    drawOrAddField(form, page1, font, "ownerA_curr_panchayath", data.ownerA_curr_panchayath, 280, 326, 120, 16, 9, isFillable);
    drawOrAddField(form, page1, font, "ownerA_curr_district", data.ownerA_curr_district, 440, 326, 100, 16, 9, isFillable);

    drawOrAddBoxGridField(form, page1, font, "ownerA_curr_pincode", data.ownerA_curr_pincode, 235, 300, 18, 6, 10, isFillable);

    // Photo A
    if (data.ownerA_curr_photo) {
      await embedPhoto(pdfDoc, page1, data.ownerA_curr_photo, 455, 300, 80, 95);
    }

    // Permanent Address
    drawOrAddField(form, page1, font, "ownerA_perm_address", data.ownerA_perm_address, 280, 264, 260, 16, 9, isFillable);
    drawOrAddField(form, page1, font, "ownerA_perm_address2", data.ownerA_perm_address2, 140, 246, 400, 16, 9, isFillable);

    drawOrAddField(form, page1, font, "ownerA_perm_village", data.ownerA_perm_village, 210, 224, 130, 16, 9, isFillable);
    drawOrAddField(form, page1, font, "ownerA_perm_taluk", data.ownerA_perm_taluk, 430, 224, 110, 16, 9, isFillable);
    drawOrAddField(form, page1, font, "ownerA_perm_panchayath", data.ownerA_perm_panchayath, 280, 202, 120, 16, 9, isFillable);
    drawOrAddField(form, page1, font, "ownerA_perm_district", data.ownerA_perm_district, 440, 202, 100, 16, 9, isFillable);

    drawOrAddBoxGridField(form, page1, font, "ownerA_perm_pincode", data.ownerA_perm_pincode, 235, 176, 18, 6, 10, isFillable);

    // ID Proof & PAN
    drawOrAddField(form, page1, font, "ownerA_id_no", data.ownerA_id_no, 270, 148, 270, 16, 9, isFillable);
    drawOrAddBoxGridField(form, page1, font, "ownerA_pan", data.ownerA_pan, 280, 124, 18, 10, 10, isFillable);
    drawOrAddField(form, page1, font, "ownerA_exp", data.ownerA_exp, 460, 98, 80, 16, 10, isFillable);
    drawOrAddField(form, page1, font, "ownerA_nominee", data.ownerA_nominee, 280, 72, 260, 16, 9, isFillable);
  }

  // ------------------------------------------------------------------
  // PAGE 2: Partner B & Partner C
  // ------------------------------------------------------------------
  if (page2) {
    // Partner B
    drawOrAddField(form, page2, font, "partnerB_name", data.partnerB_name, 240, 696, 300, 16, 10, isFillable);
    drawOrAddField(form, page2, font, "partnerB_curr_address", data.partnerB_curr_address, 280, 674, 260, 16, 9, isFillable);

    drawOrAddField(form, page2, font, "partnerB_curr_village", data.partnerB_curr_village, 210, 654, 130, 16, 9, isFillable);
    drawOrAddField(form, page2, font, "partnerB_curr_taluk", data.partnerB_curr_taluk, 420, 654, 120, 16, 9, isFillable);
    drawOrAddField(form, page2, font, "partnerB_curr_panchayath", data.partnerB_curr_panchayath, 280, 632, 120, 16, 9, isFillable);
    drawOrAddField(form, page2, font, "partnerB_curr_district", data.partnerB_curr_district, 440, 632, 100, 16, 9, isFillable);

    drawOrAddBoxGridField(form, page2, font, "partnerB_curr_pincode", data.partnerB_curr_pincode, 235, 608, 18, 6, 10, isFillable);

    if (data.partnerB_photo) {
      await embedPhoto(pdfDoc, page2, data.partnerB_photo, 455, 608, 80, 95);
    }

    drawOrAddField(form, page2, font, "partnerB_perm_address", data.partnerB_perm_address, 280, 580, 260, 16, 9, isFillable);
    drawOrAddField(form, page2, font, "partnerB_perm_village", data.partnerB_perm_village, 210, 560, 130, 16, 9, isFillable);
    drawOrAddField(form, page2, font, "partnerB_perm_taluk", data.partnerB_perm_taluk, 430, 560, 110, 16, 9, isFillable);
    drawOrAddField(form, page2, font, "partnerB_perm_panchayath", data.partnerB_perm_panchayath, 280, 538, 120, 16, 9, isFillable);
    drawOrAddField(form, page2, font, "partnerB_perm_district", data.partnerB_perm_district, 440, 538, 100, 16, 9, isFillable);

    drawOrAddBoxGridField(form, page2, font, "partnerB_perm_pincode", data.partnerB_perm_pincode, 235, 512, 18, 6, 10, isFillable);

    drawOrAddField(form, page2, font, "partnerB_id_no", data.partnerB_id_no, 270, 486, 270, 16, 9, isFillable);
    drawOrAddBoxGridField(form, page2, font, "partnerB_pan", data.partnerB_pan, 280, 460, 18, 10, 10, isFillable);
    drawOrAddField(form, page2, font, "partnerB_nominee", data.partnerB_nominee, 280, 434, 260, 16, 9, isFillable);

    // Partner C
    drawOrAddField(form, page2, font, "partnerC_name", data.partnerC_name, 240, 376, 300, 16, 10, isFillable);
    drawOrAddField(form, page2, font, "partnerC_curr_address", data.partnerC_curr_address, 280, 354, 260, 16, 9, isFillable);

    drawOrAddField(form, page2, font, "partnerC_curr_village", data.partnerC_curr_village, 210, 334, 130, 16, 9, isFillable);
    drawOrAddField(form, page2, font, "partnerC_curr_taluk", data.partnerC_curr_taluk, 420, 334, 120, 16, 9, isFillable);
    drawOrAddField(form, page2, font, "partnerC_curr_panchayath", data.partnerC_curr_panchayath, 280, 312, 120, 16, 9, isFillable);
    drawOrAddField(form, page2, font, "partnerC_curr_district", data.partnerC_curr_district, 440, 312, 100, 16, 9, isFillable);

    drawOrAddBoxGridField(form, page2, font, "partnerC_curr_pincode", data.partnerC_curr_pincode, 235, 288, 18, 6, 10, isFillable);

    if (data.partnerC_photo) {
      await embedPhoto(pdfDoc, page2, data.partnerC_photo, 455, 288, 80, 95);
    }

    drawOrAddField(form, page2, font, "partnerC_perm_address", data.partnerC_perm_address, 280, 260, 260, 16, 9, isFillable);
    drawOrAddField(form, page2, font, "partnerC_perm_village", data.partnerC_perm_village, 210, 240, 130, 16, 9, isFillable);
    drawOrAddField(form, page2, font, "partnerC_perm_taluk", data.partnerC_perm_taluk, 430, 240, 110, 16, 9, isFillable);
    drawOrAddField(form, page2, font, "partnerC_perm_panchayath", data.partnerC_perm_panchayath, 280, 218, 120, 16, 9, isFillable);
    drawOrAddField(form, page2, font, "partnerC_perm_district", data.partnerC_perm_district, 440, 218, 100, 16, 9, isFillable);

    drawOrAddBoxGridField(form, page2, font, "partnerC_perm_pincode", data.partnerC_perm_pincode, 235, 192, 18, 6, 10, isFillable);

    drawOrAddField(form, page2, font, "partnerC_id_no", data.partnerC_id_no, 270, 166, 270, 16, 9, isFillable);
    drawOrAddBoxGridField(form, page2, font, "partnerC_pan", data.partnerC_pan, 280, 140, 18, 10, 10, isFillable);
    drawOrAddField(form, page2, font, "partnerC_nominee", data.partnerC_nominee, 280, 114, 260, 16, 9, isFillable);
  }

  // ------------------------------------------------------------------
  // PAGE 3: Rig Details A & Rig Details B (Part 1)
  // ------------------------------------------------------------------
  if (page3) {
    // RIG A (Shifted UP by 95 points)
    drawOrAddField(form, page3, font, "rigA_type", data.rigA_type, 180, 755, 360, 16, 9, isFillable);
    drawOrAddField(form, page3, font, "rigA_ownerName", data.rigA_ownerName, 230, 735, 310, 16, 9, isFillable);
    drawOrAddField(form, page3, font, "rigA_ownerAddress", data.rigA_ownerAddress, 230, 717, 310, 16, 9, isFillable);
    drawOrAddField(form, page3, font, "rigA_ownerDistrict", data.rigA_ownerDistrict, 160, 679, 160, 16, 9, isFillable);
    drawOrAddField(form, page3, font, "rigA_ownerState", data.rigA_ownerState, 360, 679, 180, 16, 9, isFillable);
    drawOrAddBoxGridField(form, page3, font, "rigA_ownerPincode", data.rigA_ownerPincode, 235, 659, 18, 6, 10, isFillable);

    drawOrAddField(form, page3, font, "rigA_vehType", data.rigA_vehType, 140, 621, 160, 16, 9, isFillable);
    drawOrAddField(form, page3, font, "rigA_vehRegNo", data.rigA_vehRegNo, 350, 621, 190, 16, 9, isFillable);
    drawOrAddField(form, page3, font, "rigA_chassisNo", data.rigA_chassisNo, 230, 603, 310, 16, 9, isFillable);
    drawOrAddField(form, page3, font, "rigA_engineNo", data.rigA_engineNo, 230, 585, 310, 16, 9, isFillable);

    drawOrAddField(form, page3, font, "rigA_compModel", data.rigA_compModel, 160, 549, 380, 16, 9, isFillable);
    drawOrAddField(form, page3, font, "rigA_compCapacity", data.rigA_compCapacity, 160, 531, 380, 16, 9, isFillable);

    drawOrAddField(form, page3, font, "rigA_genType", data.rigA_genType, 140, 495, 160, 16, 9, isFillable);
    drawOrAddField(form, page3, font, "rigA_genModel", data.rigA_genModel, 350, 495, 190, 16, 9, isFillable);
    drawOrAddField(form, page3, font, "rigA_genCapacity", data.rigA_genCapacity, 160, 477, 160, 16, 9, isFillable);
    drawOrAddField(form, page3, font, "rigA_genEngineNo", data.rigA_genEngineNo, 360, 477, 180, 16, 9, isFillable);

    drawOrAddField(form, page3, font, "rigA_maxDepth", data.rigA_maxDepth, 200, 441, 160, 16, 9, isFillable);
    drawOrAddField(form, page3, font, "rigA_maxDia", data.rigA_maxDia, 400, 441, 140, 16, 9, isFillable);

    drawOrAddField(form, page3, font, "rigA_opName", data.rigA_opName, 210, 405, 220, 16, 9, isFillable);
    drawOrAddField(form, page3, font, "rigA_opAge", data.rigA_opAge, 470, 405, 70, 16, 9, isFillable);
    drawOrAddField(form, page3, font, "rigA_opExp", data.rigA_opExp, 230, 387, 310, 16, 9, isFillable);
    drawOrAddField(form, page3, font, "rigA_opIdNo", data.rigA_opIdNo, 280, 351, 260, 16, 9, isFillable);

    // RIG B (Part 1 - General Profile) (Shifted UP by 70 points)
    drawOrAddField(form, page3, font, "rigB_type", data.rigB_type, 180, 280, 360, 16, 9, isFillable);
    drawOrAddField(form, page3, font, "rigB_ownerName", data.rigB_ownerName, 230, 260, 310, 16, 9, isFillable);
    drawOrAddField(form, page3, font, "rigB_ownerAddress", data.rigB_ownerAddress, 230, 242, 310, 16, 9, isFillable);
    drawOrAddField(form, page3, font, "rigB_ownerDistrict", data.rigB_ownerDistrict, 160, 204, 160, 16, 9, isFillable);
    drawOrAddField(form, page3, font, "rigB_ownerState", data.rigB_ownerState, 360, 204, 180, 16, 9, isFillable);
    drawOrAddBoxGridField(form, page3, font, "rigB_ownerPincode", data.rigB_ownerPincode, 235, 184, 18, 6, 10, isFillable);

    // Rig B Vehicle & Compressor Info (printed at bottom of Page 3 in template)
    drawOrAddField(form, page3, font, "rigB_vehType", data.rigB_vehType, 140, 148, 160, 16, 9, isFillable);
    drawOrAddField(form, page3, font, "rigB_vehRegNo", data.rigB_vehRegNo, 350, 148, 190, 16, 9, isFillable);
    drawOrAddField(form, page3, font, "rigB_chassisNo", data.rigB_chassisNo, 230, 130, 310, 16, 9, isFillable);
    drawOrAddField(form, page3, font, "rigB_engineNo", data.rigB_engineNo, 230, 112, 310, 16, 9, isFillable);

    drawOrAddField(form, page3, font, "rigB_compModel", data.rigB_compModel, 160, 76, 380, 16, 9, isFillable);
    drawOrAddField(form, page3, font, "rigB_compCapacity", data.rigB_compCapacity, 160, 58, 380, 16, 9, isFillable);
  }

  // ------------------------------------------------------------------
  // PAGE 4: Rig B (Part 2), Rig C & Declaration
  // ------------------------------------------------------------------
  if (page4) {
    // RIG B Part 2 (Generator, Borewell, Operator on Page 4 - Shifted UP by 59 points)
    drawOrAddField(form, page4, font, "rigB_genType", data.rigB_genType, 140, 755, 160, 16, 9, isFillable);
    drawOrAddField(form, page4, font, "rigB_genModel", data.rigB_genModel, 350, 755, 190, 16, 9, isFillable);
    drawOrAddField(form, page4, font, "rigB_genCapacity", data.rigB_genCapacity, 160, 737, 160, 16, 9, isFillable);
    drawOrAddField(form, page4, font, "rigB_genEngineNo", data.rigB_genEngineNo, 360, 737, 180, 16, 9, isFillable);

    drawOrAddField(form, page4, font, "rigB_maxDepth", data.rigB_maxDepth, 200, 701, 160, 16, 9, isFillable);
    drawOrAddField(form, page4, font, "rigB_maxDia", data.rigB_maxDia, 400, 701, 140, 16, 9, isFillable);

    drawOrAddField(form, page4, font, "rigB_opName", data.rigB_opName, 210, 665, 220, 16, 9, isFillable);
    drawOrAddField(form, page4, font, "rigB_opAge", data.rigB_opAge, 470, 665, 70, 16, 9, isFillable);
    drawOrAddField(form, page4, font, "rigB_opExp", data.rigB_opExp, 230, 647, 310, 16, 9, isFillable);
    drawOrAddField(form, page4, font, "rigB_opIdNo", data.rigB_opIdNo, 280, 611, 260, 16, 9, isFillable);

    // RIG C (Shifted UP by 40 points)
    drawOrAddField(form, page4, font, "rigC_type", data.rigC_type, 180, 546, 360, 16, 9, isFillable);
    drawOrAddField(form, page4, font, "rigC_ownerName", data.rigC_ownerName, 230, 526, 310, 16, 9, isFillable);
    drawOrAddField(form, page4, font, "rigC_ownerAddress", data.rigC_ownerAddress, 230, 508, 310, 16, 9, isFillable);
    drawOrAddField(form, page4, font, "rigC_ownerDistrict", data.rigC_ownerDistrict, 160, 470, 160, 16, 9, isFillable);
    drawOrAddField(form, page4, font, "rigC_ownerState", data.rigC_ownerState, 360, 470, 180, 16, 9, isFillable);
    drawOrAddBoxGridField(form, page4, font, "rigC_ownerPincode", data.rigC_ownerPincode, 235, 450, 18, 6, 10, isFillable);

    drawOrAddField(form, page4, font, "rigC_vehType", data.rigC_vehType, 140, 412, 160, 16, 9, isFillable);
    drawOrAddField(form, page4, font, "rigC_vehRegNo", data.rigC_vehRegNo, 350, 412, 190, 16, 9, isFillable);
    drawOrAddField(form, page4, font, "rigC_chassisNo", data.rigC_chassisNo, 230, 394, 310, 16, 9, isFillable);
    drawOrAddField(form, page4, font, "rigC_engineNo", data.rigC_engineNo, 230, 376, 310, 16, 9, isFillable);

    drawOrAddField(form, page4, font, "rigC_compModel", data.rigC_compModel, 160, 340, 380, 16, 9, isFillable);
    drawOrAddField(form, page4, font, "rigC_compCapacity", data.rigC_compCapacity, 160, 322, 380, 16, 9, isFillable);

    drawOrAddField(form, page4, font, "rigC_genType", data.rigC_genType, 140, 286, 160, 16, 9, isFillable);
    drawOrAddField(form, page4, font, "rigC_genModel", data.rigC_genModel, 350, 286, 190, 16, 9, isFillable);
    drawOrAddField(form, page4, font, "rigC_genCapacity", data.rigC_genCapacity, 160, 268, 160, 16, 9, isFillable);
    drawOrAddField(form, page4, font, "rigC_genEngineNo", data.rigC_genEngineNo, 360, 268, 180, 16, 9, isFillable);

    drawOrAddField(form, page4, font, "rigC_maxDepth", data.rigC_maxDepth, 200, 232, 160, 16, 9, isFillable);
    drawOrAddField(form, page4, font, "rigC_maxDia", data.rigC_maxDia, 400, 232, 140, 16, 9, isFillable);

    drawOrAddField(form, page4, font, "rigC_opName", data.rigC_opName, 210, 196, 220, 16, 9, isFillable);
    drawOrAddField(form, page4, font, "rigC_opAge", data.rigC_opAge, 470, 196, 70, 16, 9, isFillable);

    // Declaration Date & Place
    drawOrAddField(form, page4, font, "declarationDate", data.declarationDate, 130, 52, 120, 16, 9, isFillable);
    drawOrAddField(form, page4, font, "declarationPlace", data.declarationPlace, 130, 36, 150, 16, 9, isFillable);
  }

  // ------------------------------------------------------------------
  // PAGE 5: Office Use & Receipt
  // ------------------------------------------------------------------
  if (page5) {
    // Office Use (Shifted UP by 91 points)
    drawOrAddField(form, page5, font, "office_appReceivedDate", data.office_appReceivedDate, 260, 755, 180, 16, 9, isFillable);
    drawOrAddField(form, page5, font, "office_feeDetails", data.office_feeDetails, 260, 731, 280, 16, 9, isFillable);
    drawOrAddField(form, page5, font, "office_feeAmount", data.office_feeAmount, 180, 707, 180, 16, 9, isFillable);
    drawOrAddField(form, page5, font, "office_rigInspectionDate", data.office_rigInspectionDate, 260, 683, 180, 16, 9, isFillable);

    drawOrAddField(form, page5, font, "office_recommendation1", data.office_recommendation1, 260, 659, 280, 16, 9, isFillable);
    drawOrAddField(form, page5, font, "office_recommendation2", data.office_recommendation2, 260, 641, 280, 16, 9, isFillable);
    drawOrAddField(form, page5, font, "office_recommendation3", data.office_recommendation3, 260, 623, 280, 16, 9, isFillable);

    // Receipt (Shifted UP by 156 points)
    drawOrAddField(form, page5, font, "receipt_appNo", data.receipt_appNo, 200, 512, 160, 16, 10, isFillable);
    drawOrAddField(form, page5, font, "receipt_applicantName", data.receipt_applicantName, 200, 488, 300, 16, 10, isFillable);
    drawOrAddField(form, page5, font, "receipt_receivedDate", data.receipt_receivedDate, 230, 462, 160, 16, 9, isFillable);

    drawOrAddField(form, page5, font, "receipt_feeAmount", data.receipt_feeAmount, 190, 412, 160, 16, 9, isFillable);
    drawOrAddField(form, page5, font, "receipt_feeDate", data.receipt_feeDate, 400, 412, 140, 16, 9, isFillable);

    drawOrAddCheckboxField(form, page5, "receipt_hasAgencyReg", !!data.receipt_hasAgencyReg, 280, 356, 12, isFillable);

    if (Number(data.receipt_rigCount) >= 1) {
      drawOrAddField(form, page5, font, "receipt_rig1", "Rig 1", 280, 330, 50, 16, 9, isFillable);
    }
    if (Number(data.receipt_rigCount) >= 2) {
      drawOrAddField(form, page5, font, "receipt_rig2", "Rig 2", 340, 330, 50, 16, 9, isFillable);
    }
    if (Number(data.receipt_rigCount) >= 3) {
      drawOrAddField(form, page5, font, "receipt_rig3", "Rig 3", 400, 330, 50, 16, 9, isFillable);
    }

    drawOrAddField(form, page5, font, "receipt_signDate", data.receipt_signDate, 100, 278, 150, 16, 9, isFillable);
  }

  const pdfBytes = await pdfDoc.save();
  return pdfBytes;
}

// ====================================================================
// 2. GENERATE RIG RENEWAL FORM PDF OVERLAY
// ====================================================================
export async function generateRigRenewalPdfOverlay(
  data: Record<string, any>,
  customTemplateBytes?: Uint8Array | ArrayBuffer,
  isFillable = true
): Promise<Uint8Array> {
  let templateBuffer: ArrayBuffer;
  if (customTemplateBytes) {
    templateBuffer = customTemplateBytes;
  } else {
    const res = await fetch("/templates/rig-renewal-template.pdf");
    templateBuffer = await res.arrayBuffer();
  }

  const pdfDoc = await PDFDocument.load(templateBuffer);
  const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const pages = pdfDoc.getPages();
  const page1 = pages[0];
  const page2 = pages[1];
  const page3 = pages[2];
  const page4 = pages[3];
  const page5 = pages[4];

  const form = isFillable ? pdfDoc.getForm() : undefined;

  // ------------------------------------------------------------------
  // PAGE 1: Agency & Existing Rig Summaries
  // ------------------------------------------------------------------
  if (page1) {
    drawOrAddField(form, page1, font, "agencyName", data.agencyName, 210, 614, 330, 16, 10, isFillable);
    drawOrAddField(form, page1, font, "existingAgencyRegNo", data.existingAgencyRegNo, 210, 592, 330, 16, 9, isFillable);
    drawOrAddField(form, page1, font, "agencyRegDistrict", data.agencyRegDistrict, 230, 570, 310, 16, 9, isFillable);
    drawOrAddField(form, page1, font, "address", data.address, 210, 548, 330, 16, 9, isFillable);

    drawOrAddField(form, page1, font, "village", data.village, 180, 514, 160, 16, 9, isFillable);
    drawOrAddField(form, page1, font, "taluk", data.taluk, 400, 514, 140, 16, 9, isFillable);
    drawOrAddField(form, page1, font, "panchayath", data.panchayath, 260, 492, 140, 16, 9, isFillable);
    drawOrAddField(form, page1, font, "district", data.district, 420, 492, 120, 16, 9, isFillable);

    drawOrAddBoxGridField(form, page1, font, "pincode", data.pincode, 235, 466, 18, 6, 10, isFillable);

    drawOrAddField(form, page1, font, "phone", data.phone, 210, 442, 330, 16, 9, isFillable);
    drawOrAddField(form, page1, font, "email", data.email, 210, 420, 330, 16, 9, isFillable);
    drawOrAddField(form, page1, font, "gstin", data.gstin, 210, 398, 330, 16, 9, isFillable);
    drawOrAddField(form, page1, font, "lsgdRegNo", data.lsgdRegNo, 330, 372, 210, 16, 9, isFillable);

    // Rig 1 Summary
    drawOrAddField(form, page1, font, "summaryRig1_type", data.summaryRig1_type, 180, 296, 360, 16, 9, isFillable);
    drawOrAddField(form, page1, font, "summaryRig1_regNo", data.summaryRig1_regNo, 210, 276, 210, 16, 9, isFillable);
    drawOrAddField(form, page1, font, "summaryRig1_paidAmount", data.summaryRig1_paidAmount, 480, 276, 70, 16, 9, isFillable);
    drawOrAddField(form, page1, font, "summaryRig1_challanDetails", data.summaryRig1_challanDetails, 210, 256, 210, 16, 9, isFillable);
    drawOrAddField(form, page1, font, "summaryRig1_expiryDate", data.summaryRig1_expiryDate, 480, 256, 70, 16, 9, isFillable);

    // Rig 2 Summary
    drawOrAddField(form, page1, font, "summaryRig2_type", data.summaryRig2_type, 180, 182, 360, 16, 9, isFillable);
    drawOrAddField(form, page1, font, "summaryRig2_regNo", data.summaryRig2_regNo, 210, 162, 210, 16, 9, isFillable);
    drawOrAddField(form, page1, font, "summaryRig2_paidAmount", data.summaryRig2_paidAmount, 480, 162, 70, 16, 9, isFillable);
    drawOrAddField(form, page1, font, "summaryRig2_challanDetails", data.summaryRig2_challanDetails, 210, 142, 210, 16, 9, isFillable);
    drawOrAddField(form, page1, font, "summaryRig2_expiryDate", data.summaryRig2_expiryDate, 480, 142, 70, 16, 9, isFillable);

    // Rig 3 Summary
    drawOrAddField(form, page1, font, "summaryRig3_type", data.summaryRig3_type, 180, 102, 360, 16, 9, isFillable);
    drawOrAddField(form, page1, font, "summaryRig3_regNo", data.summaryRig3_regNo, 210, 82, 210, 16, 9, isFillable);
    drawOrAddField(form, page1, font, "summaryRig3_paidAmount", data.summaryRig3_paidAmount, 480, 82, 70, 16, 9, isFillable);
    drawOrAddField(form, page1, font, "summaryRig3_challanDetails", data.summaryRig3_challanDetails, 210, 62, 210, 16, 9, isFillable);
    drawOrAddField(form, page1, font, "summaryRig3_expiryDate", data.summaryRig3_expiryDate, 480, 62, 70, 16, 9, isFillable);
  }

  // Helper for Rigs 1, 2, 3 sheets on pages 2, 3, 4
  const populateRigSheet = (page: any, key: string) => {
    if (!page) return;
    drawOrAddField(form, page, font, `${key}_regNo`, data[`${key}_regNo`], 230, 656, 310, 16, 9, isFillable);
    drawOrAddField(form, page, font, `${key}_expiryDate`, data[`${key}_expiryDate`], 280, 632, 260, 16, 9, isFillable);
    drawOrAddField(form, page, font, `${key}_type`, data[`${key}_type`], 200, 594, 340, 16, 9, isFillable);

    drawOrAddField(form, page, font, `${key}_ownerName`, data[`${key}_ownerName`], 230, 572, 310, 16, 9, isFillable);
    drawOrAddField(form, page, font, `${key}_ownerAddress`, data[`${key}_ownerAddress`], 230, 552, 310, 16, 9, isFillable);

    drawOrAddField(form, page, font, `${key}_ownerPhone`, data[`${key}_ownerPhone`], 140, 514, 160, 16, 9, isFillable);
    drawOrAddField(form, page, font, `${key}_ownerMobile`, data[`${key}_ownerMobile`], 340, 514, 200, 16, 9, isFillable);
    drawOrAddField(form, page, font, `${key}_ownerEmail`, data[`${key}_ownerEmail`], 140, 494, 400, 16, 9, isFillable);

    drawOrAddField(form, page, font, `${key}_ownerDistrict`, data[`${key}_ownerDistrict`], 140, 472, 160, 16, 9, isFillable);
    drawOrAddField(form, page, font, `${key}_ownerState`, data[`${key}_ownerState`], 340, 472, 200, 16, 9, isFillable);
    drawOrAddBoxGridField(form, page, font, `${key}_ownerPincode`, data[`${key}_ownerPincode`], 235, 448, 18, 6, 10, isFillable);

    drawOrAddField(form, page, font, `${key}_vehRegNo`, data[`${key}_vehRegNo`], 340, 394, 200, 16, 9, isFillable);
    drawOrAddField(form, page, font, `${key}_chassisNo`, data[`${key}_chassisNo`], 230, 376, 310, 16, 9, isFillable);
    drawOrAddField(form, page, font, `${key}_engineNo`, data[`${key}_engineNo`], 230, 358, 310, 16, 9, isFillable);

    drawOrAddField(form, page, font, `${key}_supportVehRegNo`, data[`${key}_supportVehRegNo`], 380, 330, 160, 16, 9, isFillable);
    drawOrAddField(form, page, font, `${key}_supportChassisNo`, data[`${key}_supportChassisNo`], 230, 312, 310, 16, 9, isFillable);
    drawOrAddField(form, page, font, `${key}_supportEngineNo`, data[`${key}_supportEngineNo`], 230, 294, 310, 16, 9, isFillable);

    drawOrAddField(form, page, font, `${key}_compModel`, data[`${key}_compModel`], 160, 258, 370, 16, 9, isFillable);
    drawOrAddField(form, page, font, `${key}_compCapacity`, data[`${key}_compCapacity`], 160, 240, 370, 16, 9, isFillable);

    drawOrAddField(form, page, font, `${key}_genType`, data[`${key}_genType`], 140, 204, 160, 16, 9, isFillable);
    drawOrAddField(form, page, font, `${key}_genModel`, data[`${key}_genModel`], 340, 204, 200, 16, 9, isFillable);
    drawOrAddField(form, page, font, `${key}_genCapacity`, data[`${key}_genCapacity`], 160, 186, 160, 16, 9, isFillable);
    drawOrAddField(form, page, font, `${key}_genEngineNo`, data[`${key}_genEngineNo`], 360, 186, 180, 16, 9, isFillable);

    drawOrAddField(form, page, font, `${key}_maxDepth`, data[`${key}_maxDepth`], 200, 150, 160, 16, 9, isFillable);
    drawOrAddField(form, page, font, `${key}_maxDia`, data[`${key}_maxDia`], 400, 150, 140, 16, 9, isFillable);
  };

  populateRigSheet(page2, "rig1");
  populateRigSheet(page3, "rig2");
  populateRigSheet(page4, "rig3");

  // ------------------------------------------------------------------
  // PAGE 5: Declaration, Office Use & Receipt
  // ------------------------------------------------------------------
  if (page5) {
    drawOrAddField(form, page5, font, "declarationDate", data.declarationDate, 100, 656, 120, 16, 9, isFillable);
    drawOrAddField(form, page5, font, "declarationPlace", data.declarationPlace, 100, 640, 150, 16, 9, isFillable);

    // Office Use
    drawOrAddField(form, page5, font, "office_appReceivedDate", data.office_appReceivedDate, 230, 552, 180, 16, 9, isFillable);
    drawOrAddField(form, page5, font, "office_feeAmount", data.office_feeAmount, 170, 514, 180, 16, 9, isFillable);
    drawOrAddField(form, page5, font, "office_feeDate", data.office_feeDate, 380, 514, 160, 16, 9, isFillable);
    drawOrAddField(form, page5, font, "office_rigInspectionDate", data.office_rigInspectionDate, 230, 492, 180, 16, 9, isFillable);

    drawOrAddField(form, page5, font, "office_recommendation1", data.office_recommendation1, 230, 470, 310, 16, 9, isFillable);
    drawOrAddField(form, page5, font, "office_recommendation2", data.office_recommendation2, 230, 452, 310, 16, 9, isFillable);

    // Receipt
    drawOrAddField(form, page5, font, "receipt_appNo", data.receipt_appNo, 180, 330, 180, 16, 10, isFillable);
    drawOrAddField(form, page5, font, "agencyName", data.agencyName, 180, 310, 320, 16, 10, isFillable);
    drawOrAddField(form, page5, font, "existingAgencyRegNo", data.existingAgencyRegNo, 210, 290, 330, 16, 9, isFillable);
    drawOrAddField(form, page5, font, "receipt_receivedDate", data.receipt_receivedDate, 210, 270, 180, 16, 9, isFillable);

    drawOrAddField(form, page5, font, "receipt_feeAmount", data.receipt_feeAmount, 170, 226, 180, 16, 9, isFillable);
    drawOrAddField(form, page5, font, "receipt_feeDate", data.receipt_feeDate, 380, 226, 160, 16, 9, isFillable);

    drawOrAddField(form, page5, font, "receipt_renewalCount", data.receipt_renewalCount ?? "1", 425, 186, 60, 16, 10, isFillable);
    drawOrAddField(form, page5, font, "receipt_newRigCount", data.receipt_newRigCount ?? "0", 380, 164, 60, 16, 10, isFillable);

    drawOrAddField(form, page5, font, "receipt_signDate", data.receipt_signDate, 100, 120, 150, 16, 9, isFillable);
  }

  const pdfBytes = await pdfDoc.save();
  return pdfBytes;
}
