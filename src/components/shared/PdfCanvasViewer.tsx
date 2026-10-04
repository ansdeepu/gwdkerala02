"use client";

import React, { useState } from "react";
import { Loader2, Download, Printer, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PdfCanvasViewerProps {
  pdfData: string; // Base64 or Blob URL or relative path
  title?: string;
  onDownload?: () => void;
  onPrint?: () => void;
}

export function PdfCanvasViewer({ pdfData, title, onDownload, onPrint }: PdfCanvasViewerProps) {
  const [loading, setLoading] = useState(true);

  // Format pdf source for iframe/embed
  const getPdfSrc = () => {
    if (!pdfData) return "";
    if (
      pdfData.startsWith("blob:") ||
      pdfData.startsWith("http://") ||
      pdfData.startsWith("https://") ||
      pdfData.startsWith("/") ||
      pdfData.startsWith("data:application/pdf")
    ) {
      return pdfData;
    }
    // Raw Base64 string
    return `data:application/pdf;base64,${pdfData}`;
  };

  const pdfSrc = getPdfSrc();

  const handleDownload = () => {
    if (onDownload) {
      onDownload();
      return;
    }
    if (!pdfSrc) return;
    const a = document.createElement("a");
    a.href = pdfSrc;
    a.download = title ? `${title}.pdf` : "document.pdf";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handlePrint = () => {
    if (onPrint) {
      onPrint();
      return;
    }
    if (!pdfSrc) return;
    const printWindow = window.open(pdfSrc, "_blank");
    if (printWindow) {
      printWindow.focus();
      printWindow.print();
    }
  };

  return (
    <div className="flex flex-col h-full w-full bg-slate-100 dark:bg-slate-950 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-800">
      {title && (
        <div className="flex items-center justify-between px-4 py-2.5 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 shrink-0">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-blue-600" />
            <span className="font-semibold text-sm text-foreground">{title}</span>
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={handleDownload} className="text-xs h-8 gap-1.5">
              <Download className="w-3.5 h-3.5" /> Download PDF
            </Button>
            <Button size="sm" onClick={handlePrint} className="bg-blue-600 hover:bg-blue-700 text-white text-xs h-8 gap-1.5">
              <Printer className="w-3.5 h-3.5" /> Print PDF
            </Button>
          </div>
        </div>
      )}

      <div className="relative flex-1 w-full min-h-[500px] h-full bg-slate-200 dark:bg-slate-900">
        {loading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-100/80 dark:bg-slate-950/80 z-10">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600 mb-2" />
            <p className="text-xs text-muted-foreground">Loading PDF document...</p>
          </div>
        )}

        {pdfSrc ? (
          <iframe
            src={pdfSrc}
            className="w-full h-full min-h-[500px] border-0"
            title={title || "PDF Document Viewer"}
            onLoad={() => setLoading(false)}
          />
        ) : (
          <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
            No PDF Document to display
          </div>
        )}
      </div>
    </div>
  );
}
