// src/lib/print-utils.ts

/**
 * Utility to reliably trigger print across both direct browser windows and iframe preview environments.
 */
export const printDocument = (elementId: string, title: string = 'Document') => {
  if (typeof window === 'undefined') return;

  const originalTitle = document.title;
  if (title) {
    document.title = title;
  }

  const restoreTitle = () => {
    setTimeout(() => {
      document.title = originalTitle;
    }, 3000);
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

  // 1. Try opening print preview window via window.open
  try {
    const printWin = window.open('', '_blank', 'width=950,height=800,scrollbars=yes');
    if (printWin && !printWin.closed) {
      const styles = Array.from(document.querySelectorAll('style, link[rel="stylesheet"]'))
        .map((s) => s.outerHTML)
        .join('\n');

      printWin.document.open();
      printWin.document.write(`<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${title}</title>
  ${styles}
  <style>
    @page { size: A4 portrait; margin: 0 !important; }
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
  <script>
    window.onload = function() {
      setTimeout(function() {
        window.focus();
        window.print();
      }, 300);
    };
  </script>
</body>
</html>`);
      printWin.document.close();
      return;
    }
  } catch (e) {
    console.warn("Popup print window blocked or failed:", e);
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

