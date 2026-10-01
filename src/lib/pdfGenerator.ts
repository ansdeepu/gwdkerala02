import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

export async function fillPdfForm(templateBuffer: ArrayBuffer, data: Record<string, string>): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.load(templateBuffer);
  const form = pdfDoc.getForm();
  
  // Fill the fields
  for (const [key, value] of Object.entries(data)) {
    try {
      const field = form.getTextField(key);
      if (field) {
        field.setText(value);
      }
    } catch (e) {
      console.warn(`Field not found: ${key}`);
    }
  }

  // Flatten form if needed
  form.flatten();
  
  return await pdfDoc.save();
}

export async function generateFilledPdf(data: any): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const timesRomanFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const page = pdfDoc.addPage([595.28, 841.89]); // A4
  const { width, height } = page.getSize();
  const fontSize = 10;

  page.drawText('GROUND WATER DEPARTMENT', {
    x: 50,
    y: height - 50,
    size: 14,
    font: boldFont,
    color: rgb(0.1, 0.2, 0.4),
  });

  page.drawText('Rig Registration / Renewal Application Summary', {
    x: 50,
    y: height - 70,
    size: 11,
    font: boldFont,
    color: rgb(0.2, 0.2, 0.2),
  });

  let currentY = height - 105;
  const agency = data?.agency || {};

  const entries: [string, any][] = [
    ['Agency Name', agency.name || 'N/A'],
    ['Registration Number', agency.registrationNumber || 'N/A'],
    ['District', agency.district || 'N/A'],
    ['Taluk', agency.taluk || 'N/A'],
    ['Panchayat / Local Body', agency.panchayat || 'N/A'],
    ['Phone', agency.phone || 'N/A'],
    ['Email', agency.email || 'N/A'],
    ['Address', agency.address || 'N/A'],
    ['GST Number', agency.gstNumber || 'N/A'],
    ['Local Body Reg No', agency.localBodyRegistrationNumber || 'N/A'],
  ];

  for (const [label, val] of entries) {
    if (currentY < 60) break;
    page.drawText(`${label}:`, {
      x: 50,
      y: currentY,
      size: fontSize,
      font: boldFont,
      color: rgb(0.1, 0.1, 0.1),
    });
    page.drawText(String(val), {
      x: 220,
      y: currentY,
      size: fontSize,
      font: timesRomanFont,
      color: rgb(0.2, 0.2, 0.2),
    });
    currentY -= 20;
  }

  return await pdfDoc.save();
}
