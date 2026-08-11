// src/lib/print-utils.ts

export interface ExtendedPrintOptions {
  pageMargins?: string;
  fontSize?: string;
  bodyFontSize?: string;
  headingFontSize?: string;
  subheadingFontSize?: string;
  lineHeight?: string;
  englishFont?: string;
  malayalamFont?: string;
}

/**
 * Utility to reliably trigger print across both direct browser windows and iframe preview environments.
 */
export const printDocument = (
  elementId: string, 
  title: string = '', 
  optionsOrMargins: string | ExtendedPrintOptions = '1.2cm 1.5cm 1.2cm 1.5cm'
) => {
  if (typeof window === 'undefined') return;

  const originalTitle = document.title;
  if (title) document.title = title;

  const options: ExtendedPrintOptions = typeof optionsOrMargins === 'string'
    ? { pageMargins: optionsOrMargins }
    : optionsOrMargins;

  const pageMargins = options.pageMargins || '1.2cm 1.5cm 1.2cm 1.5cm';
  const bodyFontSize = options.bodyFontSize || options.fontSize || '11pt';
  const headingFontSize = options.headingFontSize || '15pt';
  const subheadingFontSize = options.subheadingFontSize || '13pt';
  const lineHeight = options.lineHeight || '1.4';
  const engFont = options.englishFont || 'Times New Roman';
  const malFont = options.malayalamFont || 'Mandaram';
  const fontStack = `'${engFont}', '${malFont}', 'Mandaram', 'Manjari', 'Noto Sans Malayalam', sans-serif`;

  const showIframePrintHelp = () => {
    const existingHelp = document.getElementById('iframe-print-help-banner');
    if (existingHelp) existingHelp.remove();

    const banner = document.createElement('div');
    banner.id = 'iframe-print-help-banner';
    banner.style.position = 'fixed';
    banner.style.bottom = '24px';
    banner.style.right = '24px';
    banner.style.zIndex = '99999';
    banner.style.maxWidth = '380px';
    banner.style.padding = '16px';
    banner.style.background = '#ffffff';
    banner.style.color = '#1e293b';
    banner.style.border = '1px solid #e2e8f0';
    banner.style.borderRadius = '12px';
    banner.style.boxShadow = '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)';
    banner.style.fontFamily = 'system-ui, -apple-system, sans-serif';
    banner.style.fontSize = '14px';
    banner.style.lineHeight = '1.5';
    
    banner.innerHTML = `
      <div style="display: flex; align-items: flex-start; gap: 12px;">
        <div style="background: #eff6ff; color: #2563eb; padding: 6px; border-radius: 8px; display: flex; align-items: center; justify-content: center; shrink: 0;">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 3h6v6"></path><path d="M10 14 21 3"></path><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path></svg>
        </div>
        <div style="flex: 1;">
          <div style="font-weight: 600; margin-bottom: 4px; color: #0f172a;">Print Preview Guide</div>
          <div style="color: #64748b; font-size: 13px;">Since this app is running in a preview frame, for best printing results, click the <strong>"Open in new tab"</strong> button at the top-right of your screen, then print.</div>
          <button id="close-print-help" style="margin-top: 10px; background: #f1f5f9; border: none; color: #475569; padding: 4px 10px; border-radius: 6px; font-size: 11px; font-weight: 500; cursor: pointer; transition: background 0.2s;">Got it</button>
        </div>
      </div>
    `;
    document.body.appendChild(banner);

    const closeBtn = banner.querySelector('#close-print-help');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => banner.remove());
    }

    setTimeout(() => {
      if (banner && document.body.contains(banner)) {
        banner.remove();
      }
    }, 12000);
  };

  const isIframe = window.self !== window.top;
  if (isIframe) {
    showIframePrintHelp();
    try {
      const url = new URL(window.location.href);
      url.searchParams.set('print', 'true');
      const newWindow = window.open(url.toString(), '_blank');
      if (newWindow) {
        return;
      }
    } catch (e) {
      console.warn("Failed to open print tab, falling back to standard print:", e);
    }
  }

  const element = document.getElementById(elementId);
  if (!element) {
    try {
      window.focus();
      window.print();
    } catch (e) {
      console.warn("Standard print failed:", e);
    }
    if (title) {
      setTimeout(() => { document.title = originalTitle; }, 1000);
    }
    return;
  }

  // Preserve form input values in DOM
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

  // 1. Gather all ancestors of the target element up to the body
  const ancestors: HTMLElement[] = [];
  let current: HTMLElement | null = element.parentElement;
  while (current && current !== document.body) {
    ancestors.push(current);
    current = current.parentElement;
  }

  // 2. Apply print preservation classes
  element.classList.add('print-target-element');
  ancestors.forEach((el) => el.classList.add('print-ancestor-element'));
  document.body.classList.add('print-active-state');

  // 3. Inject CSS style block targeting print mode
  const styleEl = document.createElement('style');
  styleEl.id = 'dynamic-print-style-rules';
  styleEl.innerHTML = `
    @media print {
      @page {
        size: A4 portrait;
        margin: ${pageMargins} !important;
      }
      
      /* Hide all direct children of body except the ancestor line leading to our target */
      body > *:not(.print-ancestor-element):not(.print-target-element) {
        display: none !important;
      }
      
      /* Hide all sibling elements of the ancestor line */
      .print-ancestor-element > *:not(.print-ancestor-element):not(.print-target-element) {
        display: none !important;
      }
      
      /* Make sure the ancestor line is displayed with no layout or border constraints */
      .print-ancestor-element {
        display: block !important;
        background: transparent !important;
        border: none !important;
        padding: 0 !important;
        margin: 0 !important;
        box-shadow: none !important;
        overflow: visible !important;
        height: auto !important;
        width: 100% !important;
      }

      /* Force display and clean print formatting for the print target element */
      .print-target-element {
        display: block !important;
        position: absolute !important;
        top: 0 !important;
        left: 0 !important;
        width: 100% !important;
        background: #ffffff !important;
        color: #000000 !important;
        padding: 0 !important;
        margin: 0 !important;
        border: none !important;
        box-shadow: none !important;
        font-size: ${bodyFontSize} !important;
        line-height: ${lineHeight} !important;
        font-family: ${fontStack} !important;
      }

      .print-target-element * {
        font-family: ${fontStack} !important;
      }

      .print-target-element h1,
      .print-target-element h2,
      .print-target-element .print-main-heading {
        font-size: ${headingFontSize} !important;
      }

      .print-target-element h3,
      .print-target-element h4,
      .print-target-element th,
      .print-target-element .print-sub-heading {
        font-size: ${subheadingFontSize} !important;
      }

      .print-target-element p,
      .print-target-element td,
      .print-target-element li,
      .print-target-element span {
        font-size: ${bodyFontSize} !important;
      }
      
      /* Hide all buttons, toolbars, modal footers/headers, and custom non-printable sections */
      .no-print, .print\\:hidden, button, [class*="DialogHeader"], [class*="DialogFooter"], nav, header, footer, aside {
        display: none !important;
      }
      
      /* Custom override for table styles to ensure they display with borders on paper */
      table {
        width: 100% !important;
        border-collapse: collapse !important;
      }
      
      input, textarea {
        border: none !important;
        background: transparent !important;
        resize: none !important;
      }
    }
  `;
  document.head.appendChild(styleEl);

  // 4. Trigger print
  try {
    window.focus();
    window.print();
  } catch (e) {
    console.error("Print execution failed:", e);
    showIframePrintHelp();
  }

  // 5. Cleanup style and classes asynchronously after printing is finished or cancelled
  let cleaned = false;
  const cleanup = () => {
    if (cleaned) return;
    cleaned = true;

    element.classList.remove('print-target-element');
    ancestors.forEach((el) => el.classList.remove('print-ancestor-element'));
    document.body.classList.remove('print-active-state');
    
    const targetStyle = document.getElementById('dynamic-print-style-rules');
    if (targetStyle) targetStyle.remove();
    
    if (title) {
      document.title = originalTitle;
    }
  };

  // Add listener for afterprint event
  window.addEventListener('afterprint', cleanup, { once: true });
  
  // Safe fallback timeout (2000ms) to clean up in case browser doesn't support or fire afterprint
  setTimeout(cleanup, 2000);
};

/**
 * Utility to copy the inner content of a report with its formatting as Rich HTML.
 * This can be pasted directly into editors like e-Office, Word, or Gmail while preserving styles, headings, and tables.
 */
export const copyRichHtml = async (elementId: string, options?: ExtendedPrintOptions): Promise<boolean> => {
  if (typeof window === 'undefined') return false;

  const element = document.getElementById(elementId);
  if (!element) {
    console.error(`Element with id ${elementId} not found`);
    return false;
  }

  const bodyFontSize = options?.bodyFontSize || options?.fontSize || '11pt';
  const headingFontSize = options?.headingFontSize || '15pt';
  const subheadingFontSize = options?.subheadingFontSize || '13pt';
  const lineHeight = options?.lineHeight || '1.4';
  const engFont = options?.englishFont || 'Times New Roman';
  const malFont = options?.malayalamFont || 'Mandaram';
  const fontStack = `'${engFont}', '${malFont}', 'Mandaram', 'Manjari', 'Noto Sans Malayalam', sans-serif`;

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
      th, td { border: 1px solid #000000 !important; padding: 6px 10px !important; text-align: left; vertical-align: top; font-size: ${bodyFontSize} !important; }
      th { background-color: #f2f2f2 !important; font-weight: bold !important; font-size: ${subheadingFontSize} !important; }
      h1, h2, .print-main-heading { font-size: ${headingFontSize} !important; font-weight: bold !important; }
      h3, h4, .print-sub-heading { font-size: ${subheadingFontSize} !important; font-weight: bold !important; }
      p, div { margin: 0 0 10px 0; font-size: ${bodyFontSize} !important; }
      body { font-family: ${fontStack} !important; font-size: ${bodyFontSize} !important; line-height: ${lineHeight} !important; color: #000000 !important; }
      * { font-family: ${fontStack} !important; }
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
  const fullHtml = `<!DOCTYPE html><html><head><meta charset="utf-8">${styles}</head><body><div style="background: white; color: black; font-family: ${fontStack}; font-size: ${bodyFontSize}; line-height: ${lineHeight};">${contentHtml}</div></body></html>`;

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


