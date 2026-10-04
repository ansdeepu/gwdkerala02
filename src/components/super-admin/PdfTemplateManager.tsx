"use client";

import React, { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { FileText, Upload, CheckCircle, RefreshCw, Eye, RotateCcw, Download, X, Printer } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { PdfCanvasViewer } from "@/components/shared/PdfCanvasViewer";

export function PdfTemplateManager() {
  const [regUploading, setRegUploading] = useState(false);
  const [renewalUploading, setRenewalUploading] = useState(false);
  const [regTemplateName, setRegTemplateName] = useState("rig-registration-template.pdf (Official Default)");
  const [renewalTemplateName, setRenewalTemplateName] = useState("rig-renewal-template.pdf (Official Default)");
  const [hasCustomReg, setHasCustomReg] = useState(false);
  const [hasCustomRenewal, setHasCustomRenewal] = useState(false);

  // PDF Preview State
  const [previewPdfUrl, setPreviewPdfUrl] = useState<string | null>(null);
  const [previewTitle, setPreviewTitle] = useState<string>("");

  const regInputRef = useRef<HTMLInputElement | null>(null);
  const renewalInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const customReg = localStorage.getItem("custom_rig_reg_pdf_template");
      const customRegName = localStorage.getItem("custom_rig_reg_pdf_template_name");
      if (customReg) {
        setHasCustomReg(true);
        setRegTemplateName(customRegName || "Custom Rig Registration Template.pdf");
      }

      const customRenewal = localStorage.getItem("custom_rig_renewal_pdf_template");
      const customRenewalName = localStorage.getItem("custom_rig_renewal_pdf_template_name");
      if (customRenewal) {
        setHasCustomRenewal(true);
        setRenewalTemplateName(customRenewalName || "Custom Rig Renewal Template.pdf");
      }
    }
  }, []);

  const handleUploadTemplate = async (
    type: "registration" | "renewal",
    file: File
  ) => {
    if (!file) return;
    if (!file.name.toLowerCase().endsWith(".pdf")) {
      toast({
        title: "Invalid File",
        description: "Please upload a valid .pdf file only.",
        variant: "destructive",
      });
      return;
    }

    if (type === "registration") setRegUploading(true);
    else setRenewalUploading(true);

    try {
      const buffer = await file.arrayBuffer();
      const bytes = new Uint8Array(buffer);
      let binary = "";
      for (let i = 0; i < bytes.byteLength; i++) {
        binary += String.fromCharCode(bytes[i]);
      }
      const base64 = btoa(binary);

      if (type === "registration") {
        localStorage.setItem("custom_rig_reg_pdf_template", base64);
        localStorage.setItem("custom_rig_reg_pdf_template_name", file.name);
        setRegTemplateName(file.name);
        setHasCustomReg(true);
      } else {
        localStorage.setItem("custom_rig_renewal_pdf_template", base64);
        localStorage.setItem("custom_rig_renewal_pdf_template_name", file.name);
        setRenewalTemplateName(file.name);
        setHasCustomRenewal(true);
      }

      toast({
        title: "Template Uploaded Successfully",
        description: `${file.name} saved as the active master template.`,
      });
    } catch (err: any) {
      console.error("Upload error:", err);
      toast({
        title: "Upload Failed",
        description: err.message || "Failed to save file.",
        variant: "destructive",
      });
    } finally {
      if (type === "registration") setRegUploading(false);
      else setRenewalUploading(false);
    }
  };

  const handleResetToDefault = (type: "registration" | "renewal") => {
    if (type === "registration") {
      localStorage.removeItem("custom_rig_reg_pdf_template");
      localStorage.removeItem("custom_rig_reg_pdf_template_name");
      setRegTemplateName("rig-registration-template.pdf (Official Default)");
      setHasCustomReg(false);
      toast({
        title: "Official Default Restored",
        description: "Restored built-in default registration template.",
      });
    } else {
      localStorage.removeItem("custom_rig_renewal_pdf_template");
      localStorage.removeItem("custom_rig_renewal_pdf_template_name");
      setRenewalTemplateName("rig-renewal-template.pdf (Official Default)");
      setHasCustomRenewal(false);
      toast({
        title: "Official Default Restored",
        description: "Restored built-in default renewal template.",
      });
    }
  };

  const handlePreview = (type: "registration" | "renewal") => {
    const isReg = type === "registration";
    const storageKey = isReg ? "custom_rig_reg_pdf_template" : "custom_rig_renewal_pdf_template";
    const title = isReg ? "Rig Registration Application Form Master PDF" : "Rig Renewal Application Form Master PDF";
    setPreviewTitle(title);

    const customBase64 = typeof window !== "undefined" ? localStorage.getItem(storageKey) : null;
    if (customBase64) {
      try {
        const binary = atob(customBase64);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) {
          bytes[i] = binary.charCodeAt(i);
        }
        const blob = new Blob([bytes], { type: "application/pdf" });
        const url = URL.createObjectURL(blob);
        setPreviewPdfUrl(url);
        return;
      } catch (e) {
        console.error("Error creating blob from custom base64:", e);
      }
    }

    // Fallback to server static default PDF file
    const defaultUrl = isReg ? "/templates/rig-registration-template.pdf" : "/templates/rig-renewal-template.pdf";
    setPreviewPdfUrl(defaultUrl);
  };

  return (
    <Card className="border-indigo-100 dark:border-indigo-900/50 shadow-sm">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300">
            <FileText className="h-6 w-6" />
          </div>
          <div>
            <CardTitle className="text-xl font-bold">
              Master PDF Templates (Rig Registration & Renewal)
            </CardTitle>
            <CardDescription>
              Upload and manage official 5-page master PDF templates for all district offices.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Hidden File Inputs */}
        <input
          ref={regInputRef}
          type="file"
          accept="application/pdf,.pdf"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleUploadTemplate("registration", f);
            e.target.value = "";
          }}
        />
        <input
          ref={renewalInputRef}
          type="file"
          accept="application/pdf,.pdf"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleUploadTemplate("renewal", f);
            e.target.value = "";
          }}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Template 1: Rig Registration Form */}
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-bold text-base flex items-center gap-2">
                  <FileText className="h-4 w-4 text-blue-600" />
                  1. Rig Registration Application Form
                </h3>
                <p className="text-xs text-gray-500 mt-1">
                  Drilling Agency / Rig New Registration Application Form (5 Pages)
                </p>
              </div>
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-100 dark:bg-emerald-950 dark:text-emerald-300 px-2.5 py-0.5 rounded-full">
                <CheckCircle className="w-3 h-3" /> Active
              </span>
            </div>

            <div className="p-3 bg-white dark:bg-slate-900 rounded-lg border text-xs space-y-1">
              <p className="font-medium text-gray-700 dark:text-gray-300">
                Current File: <code className="text-blue-600 dark:text-blue-400 font-bold">{regTemplateName}</code>
              </p>
              <p className="text-[11px] text-gray-500">Format: 5-Page A4 Printable Standard PDF Template</p>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <Button
                size="sm"
                variant="outline"
                type="button"
                className="flex-1 min-w-[130px] gap-1.5 text-xs"
                onClick={() => handlePreview("registration")}
              >
                <Eye className="w-3.5 h-3.5 text-blue-600" /> Preview / Download
              </Button>

              <Button
                size="sm"
                type="button"
                className="gap-1.5 text-xs bg-blue-600 hover:bg-blue-700 text-white shrink-0 font-medium"
                disabled={regUploading}
                onClick={() => regInputRef.current?.click()}
              >
                {regUploading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                {regUploading ? "Uploading..." : "Change PDF"}
              </Button>

              {hasCustomReg && (
                <Button
                  size="sm"
                  type="button"
                  variant="ghost"
                  className="gap-1 text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
                  onClick={() => handleResetToDefault("registration")}
                  title="Reset to official built-in default template"
                >
                  <RotateCcw className="w-3 h-3" /> Reset
                </Button>
              )}
            </div>
          </div>

          {/* Template 2: Rig Renewal Form */}
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-bold text-base flex items-center gap-2">
                  <FileText className="h-4 w-4 text-emerald-600" />
                  2. Rig Renewal Application Form
                </h3>
                <p className="text-xs text-gray-500 mt-1">
                  Drilling Agency / Rig Renewal Application Form (5 Pages)
                </p>
              </div>
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-100 dark:bg-emerald-950 dark:text-emerald-300 px-2.5 py-0.5 rounded-full">
                <CheckCircle className="w-3 h-3" /> Active
              </span>
            </div>

            <div className="p-3 bg-white dark:bg-slate-900 rounded-lg border text-xs space-y-1">
              <p className="font-medium text-gray-700 dark:text-gray-300">
                Current File: <code className="text-emerald-600 dark:text-emerald-400 font-bold">{renewalTemplateName}</code>
              </p>
              <p className="text-[11px] text-gray-500">Format: 5-Page A4 Printable Standard PDF Template</p>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <Button
                size="sm"
                variant="outline"
                type="button"
                className="flex-1 min-w-[130px] gap-1.5 text-xs"
                onClick={() => handlePreview("renewal")}
              >
                <Eye className="w-3.5 h-3.5 text-emerald-600" /> Preview / Download
              </Button>

              <Button
                size="sm"
                type="button"
                className="gap-1.5 text-xs bg-emerald-600 hover:bg-emerald-700 text-white shrink-0 font-medium"
                disabled={renewalUploading}
                onClick={() => renewalInputRef.current?.click()}
              >
                {renewalUploading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                {renewalUploading ? "Uploading..." : "Change PDF"}
              </Button>

              {hasCustomRenewal && (
                <Button
                  size="sm"
                  type="button"
                  variant="ghost"
                  className="gap-1 text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
                  onClick={() => handleResetToDefault("renewal")}
                  title="Reset to official built-in default template"
                >
                  <RotateCcw className="w-3 h-3" /> Reset
                </Button>
              )}
            </div>
          </div>
        </div>
      </CardContent>

      {/* PDF Master Template Preview Dialog */}
      <Dialog open={!!previewPdfUrl} onOpenChange={(open) => !open && setPreviewPdfUrl(null)}>
        <DialogContent className="max-w-5xl h-[92vh] flex flex-col p-0 gap-0 overflow-hidden bg-slate-900 text-white border-none">
          <div className="p-3.5 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-indigo-400" />
              <div>
                <h2 className="text-sm font-bold">{previewTitle}</h2>
                <p className="text-[11px] text-slate-400">Master Blank PDF Form Template Preview</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {previewPdfUrl && (
                <>
                  <a href={previewPdfUrl} download={`${previewTitle.replace(/\s+/g, "_")}.pdf`}>
                    <Button size="sm" variant="outline" className="gap-1.5 text-xs bg-slate-800 text-slate-100 hover:bg-slate-700 border-slate-700">
                      <Download className="w-3.5 h-3.5 text-emerald-400" /> Download PDF
                    </Button>
                  </a>
                  <Button
                    size="sm"
                    className="gap-1.5 text-xs bg-indigo-600 hover:bg-indigo-700 text-white font-semibold"
                    onClick={() => {
                      const iframe = document.getElementById("master-template-preview-iframe") as HTMLIFrameElement;
                      if (iframe && iframe.contentWindow) {
                        iframe.contentWindow.print();
                      }
                    }}
                  >
                    <Printer className="w-3.5 h-3.5" /> Print
                  </Button>
                </>
              )}
              <Button size="icon" variant="ghost" className="text-slate-400 hover:text-white" onClick={() => setPreviewPdfUrl(null)}>
                <X className="w-5 h-5" />
              </Button>
            </div>
          </div>
          {previewPdfUrl && (
            <div className="flex-1 bg-slate-800 overflow-hidden">
              <PdfCanvasViewer
                pdfData={previewPdfUrl}
                title={previewTitle}
                onDownload={() => {
                  const a = document.createElement('a');
                  a.href = previewPdfUrl;
                  a.download = `${previewTitle.replace(/\s+/g, '_')}.pdf`;
                  a.click();
                }}
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Card>
  );
}
