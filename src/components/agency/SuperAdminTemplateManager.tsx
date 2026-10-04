"use client";

import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Upload, FileText, CheckCircle2, RotateCcw, Download, ShieldCheck, AlertCircle } from "lucide-react";
import { toast } from "@/hooks/use-toast";

export function SuperAdminTemplateManager() {
  const [regTemplateUploaded, setRegTemplateUploaded] = useState(false);
  const [renewalTemplateUploaded, setRenewalTemplateUploaded] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setRegTemplateUploaded(!!localStorage.getItem("custom_rig_reg_pdf_template"));
      setRenewalTemplateUploaded(!!localStorage.getItem("custom_rig_renewal_pdf_template"));
    }
  }, [open]);

  const handleFileUpload = (type: "registration" | "renewal", e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith(".pdf") && file.type !== "application/pdf") {
      toast({
        title: "അസാധുവായ ഫയൽ",
        description: "ദയവായി സാധുവായ ഒരു PDF ഫയൽ തിരഞ്ഞെടുക്കുക (.pdf).",
        variant: "destructive",
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      try {
        const result = reader.result as string;
        const base64 = result.includes(";base64,") ? result.split(";base64,")[1] : result;
        const storageKey = type === "registration" ? "custom_rig_reg_pdf_template" : "custom_rig_renewal_pdf_template";
        localStorage.setItem(storageKey, base64);

        if (type === "registration") setRegTemplateUploaded(true);
        if (type === "renewal") setRenewalTemplateUploaded(true);

        toast({
          title: "മാസ്റ്റർ PDF ടെംപ്ലേറ്റ് അപ്‌ലോഡ് ചെയ്തു",
          description: "സബ് ഓഫീസ് അഡ്മിൻമാർക്ക് ഈ പുതിയ മാസ്റ്റർ PDF ഫോമിൽ നേരിട്ട് എഡിറ്റ് ചെയ്യാം.",
        });
      } catch (err: any) {
        toast({
          title: "അപ്‌ലോഡ് പരാജയപ്പെട്ടു",
          description: err.message || "ഫയൽ പ്രോസസ്സ് ചെയ്യാൻ സാധിച്ചില്ല.",
          variant: "destructive",
        });
      }
    };
    reader.readAsDataURL(file);
  };

  const handleResetTemplate = (type: "registration" | "renewal") => {
    const storageKey = type === "registration" ? "custom_rig_reg_pdf_template" : "custom_rig_renewal_pdf_template";
    localStorage.removeItem(storageKey);
    if (type === "registration") setRegTemplateUploaded(false);
    if (type === "renewal") setRenewalTemplateUploaded(false);

    toast({
      title: "ഡിഫോൾട്ട് ടെംപ്ലേറ്റ് പുനഃസ്ഥാപിച്ചു",
      description: "ഔദ്യോഗിക ഡിഫോൾട്ട് മാസ്റ്റർ PDF ഫോം സജീവമാക്കി.",
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          size="sm"
          variant="outline"
          className="border-indigo-300 dark:border-indigo-700 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 gap-1.5 font-medium text-xs shadow-sm"
        >
          <ShieldCheck className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
          മാസ്റ്റർ PDF ടെംപ്ലേറ്റ് മാനേജർ (Super Admin)
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl bg-white dark:bg-gray-900 border text-gray-900 dark:text-gray-100">
        <DialogHeader>
          <DialogTitle className="text-base font-bold flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-indigo-600" />
            സൂപ്പർ അഡ്മിൻ മാസ്റ്റർ PDF ടെംപ്ലേറ്റ് മാനേജ്‌മെന്റ്
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-2 text-sm">
          <div className="p-3 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 rounded-md text-xs text-blue-800 dark:text-blue-300 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-blue-600" />
            <div>
              <p className="font-semibold">സൂപ്പർ അഡ്മിൻ നേരിട്ട് അപ്‌ലോഡ് ചെയ്യുന്ന മാസ്റ്റർ PDF:</p>
              <p className="text-[11px] mt-0.5 text-blue-700 dark:text-blue-400">
                സൂപ്പർ അഡ്മിൻ ഇവിടെ അപ്‌ലോഡ് ചെയ്യുന്ന ഒറിജിനൽ മാസ്റ്റർ PDF ഫയലിലേക്ക് സബ് ഓഫീസ് അഡ്മിൻമാർക്ക് നേരിട്ട് വിവരങ്ങൾ ടൈപ്പ് ചെയ്യാനും എഡിറ്റ് ചെയ്യാനും സാധിക്കും (AcroForm Fillable PDF). ഓവർലാപ്പിംഗ് പൂർണ്ണമായും ഇല്ലാതാകും.
              </p>
            </div>
          </div>

          {/* Section 1: Rig Registration Template */}
          <div className="p-3.5 border rounded-lg bg-gray-50 dark:bg-gray-800/60 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-emerald-600" />
                <span className="font-semibold text-xs sm:text-sm">1. പുതിയ രജിസ്ട്രേഷൻ അപേക്ഷാ ഫോറം (5 പേജ്)</span>
              </div>
              {regTemplateUploaded ? (
                <span className="text-[11px] bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300 px-2 py-0.5 rounded-full flex items-center gap-1 font-medium">
                  <CheckCircle2 className="w-3 h-3" /> കസ്റ്റം മാസ്റ്റർ PDF സജീവം
                </span>
              ) : (
                <span className="text-[11px] bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300 px-2 py-0.5 rounded-full font-medium">
                  ഡിഫോൾട്ട് ഫോം
                </span>
              )}
            </div>

            <div className="flex items-center gap-2 flex-wrap pt-1">
              <label className="cursor-pointer">
                <input
                  type="file"
                  accept="application/pdf,.pdf"
                  className="hidden"
                  onChange={(e) => handleFileUpload("registration", e)}
                />
                <Button size="sm" type="button" className="bg-indigo-600 hover:bg-indigo-700 text-white gap-1.5 text-xs">
                  <Upload className="w-3.5 h-3.5" /> പുതിയ മാസ്റ്റർ PDF അപ്‌ലോഡ് ചെയ്യുക
                </Button>
              </label>

              {regTemplateUploaded && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleResetTemplate("registration")}
                  className="text-xs text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 gap-1 border-red-200"
                >
                  <RotateCcw className="w-3 h-3" /> ഡിഫോൾട്ടിലേക്ക് മാറ്റുക
                </Button>
              )}
            </div>
          </div>

          {/* Section 2: Rig Renewal Template */}
          <div className="p-3.5 border rounded-lg bg-gray-50 dark:bg-gray-800/60 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-emerald-600" />
                <span className="font-semibold text-xs sm:text-sm">2. രജിസ്ട്രേഷൻ പുതുക്കൽ അപേക്ഷാ ഫോറം (5 പേജ്)</span>
              </div>
              {renewalTemplateUploaded ? (
                <span className="text-[11px] bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300 px-2 py-0.5 rounded-full flex items-center gap-1 font-medium">
                  <CheckCircle2 className="w-3 h-3" /> കസ്റ്റം മാസ്റ്റർ PDF സജീവം
                </span>
              ) : (
                <span className="text-[11px] bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300 px-2 py-0.5 rounded-full font-medium">
                  ഡിഫോൾട്ട് ഫോം
                </span>
              )}
            </div>

            <div className="flex items-center gap-2 flex-wrap pt-1">
              <label className="cursor-pointer">
                <input
                  type="file"
                  accept="application/pdf,.pdf"
                  className="hidden"
                  onChange={(e) => handleFileUpload("renewal", e)}
                />
                <Button size="sm" type="button" className="bg-indigo-600 hover:bg-indigo-700 text-white gap-1.5 text-xs">
                  <Upload className="w-3.5 h-3.5" /> പുതിയ മാസ്റ്റർ PDF അപ്‌ലോഡ് ചെയ്യുക
                </Button>
              </label>

              {renewalTemplateUploaded && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleResetTemplate("renewal")}
                  className="text-xs text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 gap-1 border-red-200"
                >
                  <RotateCcw className="w-3 h-3" /> ഡിഫോൾട്ടിലേക്ക് മാറ്റുക
                </Button>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
