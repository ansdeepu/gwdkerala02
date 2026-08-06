// src/lib/print-utils.ts

/**
 * Utility to reliably trigger print across both direct browser windows and iframe preview environments.
 */
export const printDocument = (elementId: string, title: string = '', pageMargins: string = '0') => {
  if (typeof window === 'undefined') return;

  const originalTitle = document.title;
  document.title = title;

  const restoreTitle = () => {
    setTimeout(() => {
      document.title = originalTitle;
    }, 2000);
  };

  const element = document.getElementById(elementId);
  if (!element) {
    window.print();
    restoreTitle();
    return;
  }

  // Preserve form input values in DOM before capturing HTML
  const inputs = element.querySelectorAll('input, textarea, select');
  inputs.forEach((input: any) => {
    if (input.tagName === 'TEXTAREA') {
      input.textContent = input.value;
    } else if (input.type === 'checkbox' || input.type === 'radio') {
      if (input.checked) {
        input.setAttribute('checked', 'checked');
      } else {
        input.removeAttribute('checked');
      }
    } else {
      input.setAttribute('value', input.value);
    }
  });

  const contentHtml = element.innerHTML;
  const styles = Array.from(document.querySelectorAll('style, link[rel="stylesheet"]'))
    .map((s) => s.outerHTML)
    .join('\n');

  // 1. Prefer hidden iframe printing (removes about:blank footer and unwanted window headers)
  try {
    const existingIframe = document.getElementById('global-print-iframe');
    if (existingIframe) existingIframe.remove();

    const iframe = document.createElement('iframe');
    iframe.id = 'global-print-iframe';
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0px';
    iframe.style.height = '0px';
    iframe.style.border = 'none';
    iframe.style.zIndex = '-9999';
    document.body.appendChild(iframe);

    const iframeDoc = iframe.contentWindow?.document;
    if (iframeDoc) {
      iframeDoc.open();
      iframeDoc.write(`<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${title}</title>
  ${styles}
  <style>
    @page { size: A4 portrait; margin: ${pageMargins} !important; }
    *, ::before, ::after { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
    body { background: #ffffff !important; color: #000000 !important; margin: 0 !important; padding: 0 !important; font-family: 'Times New Roman', 'Suruma', 'Kartika', serif, system-ui, sans-serif !important; }
    .no-print, .print\\:hidden, button { display: none !important; }
    table { width: 100% !important; border-collapse: collapse !important; }
    th, td { border-color: #000000 !important; }
    input, textarea { border: none !important; background: transparent !important; }
  </style>
</head>
<body>
  <div style="background: white; color: black;">${contentHtml}</div>
</body>
</html>`);
      iframeDoc.close();

      setTimeout(() => {
        try {
          iframe.contentWindow?.focus();
          iframe.contentWindow?.print();
        } catch (e) {
          console.warn("Iframe print error, falling back to window.print():", e);
          window.print();
        }
        setTimeout(() => {
          iframe.remove();
          restoreTitle();
        }, 2000);
      }, 300);
      return;
    }
  } catch (e) {
    console.warn("Iframe creation failed:", e);
  }

  // 2. Direct Body Print Portal Fallback (Inject clean element directly into document.body with print CSS)
  try {
    // Remove previous print portal if present
    const existingPortal = document.getElementById('global-print-portal');
    if (existingPortal) existingPortal.remove();

    const existingStyle = document.getElementById('global-print-portal-style');
    if (existingStyle) existingStyle.remove();

    // Create portal
    const portal = document.createElement('div');
    portal.id = 'global-print-portal';
    portal.className = 'global-print-portal';
    portal.innerHTML = contentHtml;
    document.body.appendChild(portal);

    // Inject CSS for printing that isolates the portal and hides everything else
    const styleEl = document.createElement('style');
    styleEl.id = 'global-print-portal-style';
    styleEl.innerHTML = `
      @media screen {
        #global-print-portal {
          display: none !important;
        }
      }
      @media print {
        @page { margin: ${pageMargins} !important; }
        html, body {
          background: #ffffff !important;
          color: #000000 !important;
          height: auto !important;
          overflow: visible !important;
          margin: 0 !important;
          padding: 0 !important;
        }
        body > *:not(#global-print-portal) {
          display: none !important;
        }
        #global-print-portal {
          display: block !important;
          position: absolute !important;
          top: 0 !important;
          left: 0 !important;
          width: 100% !important;
          background: white !important;
          color: black !important;
          padding: 10px !important;
          margin: 0 !important;
          font-family: 'Times New Roman', 'Suruma', 'Kartika', serif, system-ui, sans-serif !important;
        }
        .no-print, .print\\:hidden, button, [class*="DialogHeader"], [class*="DialogFooter"] {
          display: none !important;
        }
        input, textarea {
          border: none !important;
          background: transparent !important;
          resize: none !important;
        }
        table {
          width: 100% !important;
          border-collapse: collapse !important;
        }
      }
    `;
    document.head.appendChild(styleEl);

    // Trigger print
    window.focus();
    window.print();

    // Clean up portal after printing
    setTimeout(() => {
      if (portal) portal.remove();
      if (styleEl) styleEl.remove();
      restoreTitle();
    }, 3000);
  } catch (e) {
    console.error("Direct portal print failed:", e);
    window.print();
    restoreTitle();
  }
};

/**
 * Utility to copy the inner content of a report with its formatting as Rich HTML.
 * This can be pasted directly into editors like e-Office, Word, or Gmail while preserving styles, headings, and tables.
 */
export const copyRichHtml = async (elementId: string): Promise<boolean> => {
  if (typeof window === 'undefined') return false;

  const element = document.getElementById(elementId);
  if (!element) {
    console.error(`Element with id ${elementId} not found`);
    return false;
  }

  // Preserve form input values in DOM before capturing HTML
  const inputs = element.querySelectorAll('input, textarea, select');
  inputs.forEach((input: any) => {
    if (input.tagName === 'TEXTAREA') {
      input.textContent = input.value;
    } else if (input.type === 'checkbox' || input.type === 'radio') {
      if (input.checked) {
        input.setAttribute('checked', 'checked');
      } else {
        input.removeAttribute('checked');
      }
    } else {
      input.setAttribute('value', input.value);
    }
  });

  // Create a deep clone to manipulate (e.g. remove print/copy buttons or non-print areas)
  const clone = element.cloneNode(true) as HTMLElement;
  
  // Find and remove elements that shouldn't be printed/copied (buttons, actions, elements with no-copy/no-print class)
  const noPrintElements = clone.querySelectorAll('.no-print, .print\\:hidden, button, [class*="DialogFooter"]');
  noPrintElements.forEach((el) => el.remove());

  const contentHtml = clone.innerHTML;
  const contentText = clone.innerText || clone.textContent || '';

  // Standard CSS styles to wrap the HTML with so alignment, tables, borders, and margins are preserved when pasted
  const styles = `
    <style>
      table { width: 100% !important; border-collapse: collapse !important; border: 1px solid #000000 !important; margin: 12px 0 !important; }
      th, td { border: 1px solid #000000 !important; padding: 6px 10px !important; text-align: left; vertical-align: top; }
      th { background-color: #f2f2f2 !important; font-weight: bold !important; }
      p, div { margin: 0 0 10px 0; }
      body { font-family: 'Times New Roman', serif, system-ui, sans-serif !important; font-size: 11pt !important; line-height: 1.5 !important; color: #000000 !important; }
      .text-right { text-align: right !important; }
      .text-center { text-align: center !important; }
      .text-justify { text-align: justify !important; }
      .font-bold { font-weight: bold !important; }
      .italic { font-style: italic !important; }
      .underline { text-decoration: underline !important; }
      .flex { display: flex !important; }
      .justify-between { justify-content: space-between !important; }
      .w-full { width: 100% !important; }
    </style>
  `;

  // Wrap inside standard HTML template for clipboard pasting
  const fullHtml = `<!DOCTYPE html><html><head><meta charset="utf-8">${styles}</head><body><div style="background: white; color: black; font-family: 'Times New Roman', serif; font-size: 11pt; line-height: 1.5;">${contentHtml}</div></body></html>`;

  try {
    const htmlBlob = new Blob([fullHtml], { type: 'text/html' });
    const textBlob = new Blob([contentText], { type: 'text/plain' });

    const clipboardItem = new ClipboardItem({
      'text/html': htmlBlob,
      'text/plain': textBlob,
    });

    await navigator.clipboard.write([clipboardItem]);
    return true;
  } catch (err) {
    console.error('Failed to copy rich HTML:', err);
    try {
      // Fallback: copy as plain text
      await navigator.clipboard.writeText(contentText);
      return true;
    } catch {
      return false;
    }
  }
};


