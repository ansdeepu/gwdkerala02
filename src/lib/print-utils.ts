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
 * Utility to copy the inner content of an official document or table.
 * Strips outer card container borders/shadows and formats clean, standardized
 * HTML markup perfect for e-Office Draft Editor, MS Word, and Excel pasting.
 */
export const copyOfficialTable = async (elementId: string, options?: ExtendedPrintOptions): Promise<boolean> => {
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

  // Clean top-level container: remove card borders, outer shadows, background colors from root container
  clone.style.border = 'none';
  clone.style.boxShadow = 'none';
  clone.style.background = 'transparent';
  clone.style.padding = '0';
  clone.style.margin = '0 auto';

  // Inline style transformer for e-Office / CKEditor / MS Word pasting
  const allElements = clone.querySelectorAll('*');
  allElements.forEach((el) => {
    const htmlEl = el as HTMLElement;
    const tagName = htmlEl.tagName.toLowerCase();

    // Remove outer document card wrapper borders / shadows if applied on nested child containers
    if (htmlEl.classList.contains('shadow-lg') || htmlEl.classList.contains('shadow-md') || htmlEl.classList.contains('shadow-xl') || htmlEl.classList.contains('shadow')) {
      htmlEl.style.boxShadow = 'none';
    }

    // Preserve text alignment inline & as HTML attribute for e-Office editor
    if (htmlEl.classList.contains('text-right') || htmlEl.classList.contains('sm:text-right')) {
      htmlEl.style.textAlign = 'right';
      htmlEl.setAttribute('align', 'right');
    } else if (htmlEl.classList.contains('text-center') || htmlEl.classList.contains('sm:text-center')) {
      htmlEl.style.textAlign = 'center';
      htmlEl.setAttribute('align', 'center');
    } else if (htmlEl.classList.contains('text-justify')) {
      htmlEl.style.textAlign = 'justify';
      htmlEl.setAttribute('align', 'justify');
    } else if (htmlEl.classList.contains('text-left')) {
      htmlEl.style.textAlign = 'left';
      htmlEl.setAttribute('align', 'left');
    }

    // Preserve font weight & decoration inline
    if (htmlEl.classList.contains('font-bold') || htmlEl.classList.contains('font-semibold') || htmlEl.classList.contains('font-extrabold')) {
      htmlEl.style.fontWeight = 'bold';
    }
    if (htmlEl.classList.contains('italic')) {
      htmlEl.style.fontStyle = 'italic';
    }
    if (htmlEl.classList.contains('underline')) {
      htmlEl.style.textDecoration = 'underline';
    }

    // Convert Tailwind border classes to explicit inline styles
    if (htmlEl.classList.contains('border-none') || htmlEl.classList.contains('border-0')) {
      htmlEl.style.border = 'none';
    } else if (htmlEl.classList.contains('border') || htmlEl.classList.contains('border-black')) {
      htmlEl.style.border = '1px solid #000000';
    }
    if (htmlEl.classList.contains('border-b')) {
      htmlEl.style.borderBottom = '1px solid #000000';
    }
    if (htmlEl.classList.contains('border-t')) {
      htmlEl.style.borderTop = '1px solid #000000';
    }
    if (htmlEl.classList.contains('border-l')) {
      htmlEl.style.borderLeft = '1px solid #000000';
    }
    if (htmlEl.classList.contains('border-r')) {
      htmlEl.style.borderRight = '1px solid #000000';
    }

    // Convert Tailwind width & layout classes (including arbitrary w-[...]) to inline styles & attributes
    htmlEl.classList.forEach((cls) => {
      if (cls.startsWith('w-[')) {
        const customWidth = cls.substring(3, cls.length - 1);
        htmlEl.style.width = customWidth;
        if (tagName === 'td' || tagName === 'th' || tagName === 'table') {
          htmlEl.setAttribute('width', customWidth);
        }
      } else if (cls === 'w-full') {
        htmlEl.style.width = '100%';
        if (tagName === 'td' || tagName === 'th' || tagName === 'table') htmlEl.setAttribute('width', '100%');
      } else if (cls === 'w-1/2') {
        htmlEl.style.width = '50%';
        if (tagName === 'td' || tagName === 'th') htmlEl.setAttribute('width', '50%');
      } else if (cls === 'w-1/3') {
        htmlEl.style.width = '33.33%';
        if (tagName === 'td' || tagName === 'th') htmlEl.setAttribute('width', '33.33%');
      } else if (cls === 'w-2/3') {
        htmlEl.style.width = '66.66%';
        if (tagName === 'td' || tagName === 'th') htmlEl.setAttribute('width', '66.66%');
      } else if (cls === 'w-1/4') {
        htmlEl.style.width = '25%';
        if (tagName === 'td' || tagName === 'th') htmlEl.setAttribute('width', '25%');
      } else if (cls === 'w-3/4') {
        htmlEl.style.width = '75%';
        if (tagName === 'td' || tagName === 'th') htmlEl.setAttribute('width', '75%');
      } else if (cls === 'w-12') {
        htmlEl.style.width = '8%';
        if (tagName === 'td' || tagName === 'th') htmlEl.setAttribute('width', '8%');
      } else if (cls === 'w-24') {
        htmlEl.style.width = '15%';
        if (tagName === 'td' || tagName === 'th') htmlEl.setAttribute('width', '15%');
      } else if (cls === 'w-28') {
        htmlEl.style.width = '18%';
        if (tagName === 'td' || tagName === 'th') htmlEl.setAttribute('width', '18%');
      } else if (cls === 'w-32') {
        htmlEl.style.width = '20%';
        if (tagName === 'td' || tagName === 'th') htmlEl.setAttribute('width', '20%');
      } else if (cls === 'w-36') {
        htmlEl.style.width = '22%';
        if (tagName === 'td' || tagName === 'th') htmlEl.setAttribute('width', '22%');
      } else if (cls === 'w-48') {
        htmlEl.style.width = '28%';
        if (tagName === 'td' || tagName === 'th') htmlEl.setAttribute('width', '28%');
      }
    });

    // Tables inline styling
    if (tagName === 'table') {
      htmlEl.style.width = '100%';
      htmlEl.style.maxWidth = '100%';
      htmlEl.style.borderCollapse = 'collapse';
      htmlEl.setAttribute('width', '100%');

      const isBorderless = htmlEl.classList.contains('border-none') || htmlEl.classList.contains('border-0') || htmlEl.style.border === 'none' || htmlEl.getAttribute('border') === '0';
      if (isBorderless) {
        htmlEl.style.border = 'none';
        htmlEl.setAttribute('border', '0');
      } else {
        htmlEl.style.border = '1px solid #000000';
        htmlEl.setAttribute('border', '1');
      }
    }

    // Table cells inline styling
    if (tagName === 'th' || tagName === 'td') {
      const parentTable = htmlEl.closest('table');
      const isBorderlessTable = parentTable ? (parentTable.classList.contains('border-none') || parentTable.classList.contains('border-0') || parentTable.style.border === 'none' || parentTable.getAttribute('border') === '0') : false;

      htmlEl.style.verticalAlign = 'top';
      if (htmlEl.style.width) {
        htmlEl.setAttribute('width', htmlEl.style.width);
      }
      if (!isBorderlessTable) {
        if (!htmlEl.style.border || htmlEl.style.border === 'none') {
          htmlEl.style.border = '1px solid #000000';
        }
        if (!htmlEl.style.padding) {
          htmlEl.style.padding = '5px 8px';
        }
      } else {
        htmlEl.style.border = 'none';
      }

      if (tagName === 'th') {
        htmlEl.style.backgroundColor = '#f2f2f2';
        htmlEl.style.fontWeight = 'bold';
      }
    }
  });

  const contentHtml = clone.innerHTML;
  const contentText = clone.innerText || clone.textContent || '';

  // Standard CSS styles to wrap the HTML with so alignment, tables, borders, and margins are preserved when pasted
  const styles = `
    <style>
      table { width: 100%; border-collapse: collapse; margin: 10px 0; }
      th, td { padding: 5px 8px; text-align: left; vertical-align: top; font-size: ${bodyFontSize}; }
      th { background-color: #f2f2f2; font-weight: bold; font-size: ${subheadingFontSize}; }
      h1, h2, .print-main-heading { font-size: ${headingFontSize}; font-weight: bold; }
      h3, h4, .print-sub-heading { font-size: ${subheadingFontSize}; font-weight: bold; }
      p, div { margin: 0 0 8px 0; font-size: ${bodyFontSize}; }
      body { font-family: ${fontStack}; font-size: ${bodyFontSize}; line-height: ${lineHeight}; color: #000000; background: transparent; }
      * { font-family: ${fontStack}; }
      .text-right { text-align: right; }
      .text-center { text-align: center; }
      .text-justify { text-align: justify; }
      .font-bold { font-weight: bold; }
      .italic { font-style: italic; }
      .underline { text-decoration: underline; }
      .flex { display: flex; }
      .justify-between { justify-content: space-between; }
      .w-full { width: 100%; }
    </style>
  `;

  // Wrap inside standard HTML template for clipboard pasting
  const fullHtml = `<!DOCTYPE html><html><head><meta charset="utf-8">${styles}</head><body><div style="background: transparent; color: black; font-family: ${fontStack}; font-size: ${bodyFontSize}; line-height: ${lineHeight};">${contentHtml}</div></body></html>`;

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
    console.error('Failed to copy official table:', err);
    try {
      // Fallback: copy as plain text
      await navigator.clipboard.writeText(contentText);
      return true;
    } catch {
      return false;
    }
  }
};

export const copyRichHtml = copyOfficialTable;


