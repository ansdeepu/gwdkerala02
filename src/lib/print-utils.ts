// src/lib/print-utils.ts

/**
 * Utility to reliably trigger print across both direct browser windows and iframe preview environments.
 */
export const printDocument = (elementId: string, title: string = 'Document') => {
  if (typeof window === 'undefined') return;

  const element = document.getElementById(elementId);
  const contentHtml = element ? element.innerHTML : document.body.innerHTML;
  const isInIframe = window.self !== window.top;

  const buildPrintHtml = (bodyContent: string) => {
    const styles = Array.from(document.querySelectorAll('style, link[rel="stylesheet"]'))
      .map(s => s.outerHTML)
      .join('\n');

    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${title}</title>
  ${styles}
  <style>
    @page {
      size: A4 portrait;
      margin: 5mm 10mm;
    }
    *, ::before, ::after {
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    body {
      background: #ffffff !important;
      color: #000000 !important;
      margin: 0 !important;
      padding: 0 !important;
      font-family: 'Times New Roman', 'Suruma', 'Kartika', serif, system-ui, sans-serif !important;
    }
    .no-print, .print\\:hidden, button, [class*="DialogFooter"] {
      display: none !important;
    }
    table {
      width: 100% !important;
      border-collapse: collapse !important;
    }
    th, td {
      border-color: #000000 !important;
    }
    @media print {
      html, body {
        height: 100%;
      }
      .completion-report {
        font-size: 12.5px !important;
        line-height: 1.45 !important;
      }
      .completion-report td {
        padding-top: 3.5px !important;
        padding-bottom: 3.5px !important;
        padding-left: 6px !important;
        padding-right: 6px !important;
      }
      .completion-report .signature-block {
        margin-top: 28px !important;
        padding-top: 12px !important;
        page-break-inside: avoid !important;
      }
    }
  </style>
</head>
<body>
  <div>${bodyContent}</div>
  <script>
    window.onload = function() {
      setTimeout(function() {
        window.focus();
        window.print();
      }, 350);
    };
  </script>
</body>
</html>`;
  };

  // 1. In preview iframe or when popups are supported, opening a clean print window is most reliable
  try {
    const printWin = window.open('', '_blank', 'width=950,height=1000');
    if (printWin) {
      printWin.document.open();
      printWin.document.write(buildPrintHtml(contentHtml));
      printWin.document.close();
      return;
    }
  } catch (err) {
    console.warn("Popup print window open failed:", err);
  }

  // 2. Blob URL popup window fallback
  try {
    const htmlString = buildPrintHtml(contentHtml);
    const blob = new Blob([htmlString], { type: 'text/html;charset=utf-8' });
    const blobUrl = URL.createObjectURL(blob);
    const printWin = window.open(blobUrl, '_blank');
    if (printWin) {
      return;
    }
  } catch (err) {
    console.warn("Blob print window open failed:", err);
  }

  // 3. Try hidden iframe print injection
  if (element) {
    try {
      let iframe = document.getElementById('gwd-document-print-iframe') as HTMLIFrameElement;
      if (iframe) {
        iframe.remove();
      }
      iframe = document.createElement('iframe');
      iframe.id = 'gwd-document-print-iframe';
      iframe.style.position = 'fixed';
      iframe.style.right = '0';
      iframe.style.bottom = '0';
      iframe.style.width = '0px';
      iframe.style.height = '0px';
      iframe.style.border = '0px';
      iframe.style.visibility = 'hidden';
      document.body.appendChild(iframe);

      const iframeDoc = iframe.contentWindow?.document || iframe.contentDocument;
      if (iframeDoc) {
        iframeDoc.open();
        iframeDoc.write(buildPrintHtml(contentHtml));
        iframeDoc.close();

        setTimeout(() => {
          if (iframe.contentWindow) {
            iframe.contentWindow.focus();
            iframe.contentWindow.print();
          }
        }, 350);
        return;
      }
    } catch (e) {
      console.warn("Hidden iframe print failed:", e);
    }
  }

  // 4. Native window.print() fallback
  try {
    window.focus();
    window.print();
  } catch (e) {
    console.error("Native window.print() failed:", e);
  }
};
