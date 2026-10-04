"use client";

import React, { useState, useRef } from "react";
import { useMasterPdfTemplates, type MasterPdfTemplate, MODULE_OPTIONS } from "@/hooks/useMasterPdfTemplates";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { FileUp, FileText, CheckCircle2, RotateCcw, Trash2, Eye, Download, ShieldCheck, Sparkles, ArrowLeft, RefreshCw, Layers } from "lucide-react";
import { format } from "date-fns";
import { downloadPdfBytes, base64ToArrayBuffer } from "@/lib/pdf/acroFormPdfService";
import Link from "next/link";

export function SuperAdminTemplateManager() {
  const {
    templates,
    isLoading,
    uploadTemplate,
    setActiveTemplate,
    resetToOfficialDefaults,
    deleteTemplate,
    fetchTemplates,
  } = useMasterPdfTemplates();

  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Form state
  const [docName, setDocName] = useState("");
  const [selectedModule, setSelectedModule] = useState<string>("rig_registration");
  const [description, setDescription] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // Preview & Action dialogs
  const [previewTemplate, setPreviewTemplate] = useState<MasterPdfTemplate | null>(null);
  const [deletingTemplateId, setDeletingTemplateId] = useState<string | null>(null);
  const [resettingModule, setResettingModule] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (!file.name.toLowerCase().endsWith(".pdf")) {
        toast({
          title: "Invalid File Type",
          description: "Please select an official master PDF file (.pdf).",
          variant: "destructive",
        });
        return;
      }
      setSelectedFile(file);
      if (!docName.trim()) {
        const defaultMod = MODULE_OPTIONS.find((m) => m.id === selectedModule);
        setDocName(defaultMod ? defaultMod.defaultName : file.name.replace(/\.pdf$/i, ""));
      }
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      toast({
        title: "No File Selected",
        description: "Please browse and select a master PDF file to upload.",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);
    try {
      await uploadTemplate(selectedFile, docName, selectedModule, description);
      // Reset form
      setSelectedFile(null);
      setDocName("");
      setDescription("");
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (err: any) {
      toast({
        title: "Upload Failed",
        description: err.message || "Could not upload template.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (!bytes) return "0 KB";
    if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(1)} KB`;
    }
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const handleDownloadTemplate = (template: MasterPdfTemplate) => {
    try {
      const buffer = base64ToArrayBuffer(template.base64Pdf);
      downloadPdfBytes(new Uint8Array(buffer), template.fileName || `${template.name}.pdf`);
    } catch (err: any) {
      toast({
        title: "Download Failed",
        description: err.message || "Failed to download template.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-2 sm:p-4 font-sans">
      {/* Top Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white p-6 rounded-2xl shadow-md">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-blue-500/20 text-blue-300 rounded-lg border border-blue-400/30">
              <Layers className="w-5 h-5" />
            </span>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Super Admin Master PDF Template Manager</h1>
          </div>
          <p className="text-sm text-blue-200/90 max-w-2xl">
            Upload and govern official 5-Page Master PDF templates for New Rig Registration & Rig Renewal. 
            The active template is automatically enforced across all sub-offices in the system.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button asChild variant="outline" size="sm" className="bg-white/10 hover:bg-white/20 text-white border-white/20 gap-1.5">
            <Link href="/dashboard/super-admin/profile">
              <ArrowLeft className="w-4 h-4" /> Back to Profile
            </Link>
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => fetchTemplates()}
            className="bg-white/10 hover:bg-white/20 text-white border-white/20 gap-1.5"
          >
            <RefreshCw className="w-4 h-4" /> Refresh
          </Button>
        </div>
      </div>

      {/* Grid: Upload Form + Quick Reset Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Upload Form Card */}
        <Card className="lg:col-span-2 border-slate-200 dark:border-slate-800 shadow-sm">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-2">
              <FileUp className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              <CardTitle className="text-lg font-bold">Upload New Master PDF Template</CardTitle>
            </div>
            <CardDescription>
              Select the target module and browse your official 5-page template PDF.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleUpload} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="moduleSelect" className="font-semibold text-xs uppercase tracking-wider text-muted-foreground">
                    Applicable Module <span className="text-red-500">*</span>
                  </Label>
                  <Select value={selectedModule} onValueChange={(val) => {
                    setSelectedModule(val);
                    const mod = MODULE_OPTIONS.find((m) => m.id === val);
                    if (mod && (!docName || MODULE_OPTIONS.some((m) => m.defaultName === docName))) {
                      setDocName(mod.defaultName);
                    }
                  }}>
                    <SelectTrigger id="moduleSelect" className="w-full">
                      <SelectValue placeholder="Select Module" />
                    </SelectTrigger>
                    <SelectContent>
                      {MODULE_OPTIONS.map((m) => (
                        <SelectItem key={m.id} value={m.id}>
                          {m.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="docName" className="font-semibold text-xs uppercase tracking-wider text-muted-foreground">
                    Document Name / Title <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="docName"
                    placeholder="e.g. Kerala GWD Official Rig Registration Form (5 Pages)"
                    value={docName}
                    onChange={(e) => setDocName(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="pdfFileInput" className="font-semibold text-xs uppercase tracking-wider text-muted-foreground">
                  Browse Master PDF (.pdf) <span className="text-red-500">*</span>
                </Label>
                <div className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl p-4 sm:p-6 text-center hover:border-blue-500 dark:hover:border-blue-400 transition-colors bg-slate-50/50 dark:bg-slate-900/50">
                  <Input
                    ref={fileInputRef}
                    id="pdfFileInput"
                    type="file"
                    accept=".pdf,application/pdf"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <div className="flex flex-col items-center justify-center space-y-2">
                    <div className="p-3 bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 rounded-full">
                      <FileText className="w-6 h-6" />
                    </div>
                    {selectedFile ? (
                      <div className="space-y-1">
                        <p className="text-sm font-semibold text-emerald-600 dark:text-emerald-400 flex items-center justify-center gap-1.5">
                          <CheckCircle2 className="w-4 h-4" /> {selectedFile.name}
                        </p>
                        <p className="text-xs text-muted-foreground">{formatFileSize(selectedFile.size)}</p>
                      </div>
                    ) : (
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-foreground">
                          Click to browse or drag and drop official master PDF
                        </p>
                        <p className="text-xs text-muted-foreground">Supports .pdf files up to 25MB (5-Page Form)</p>
                      </div>
                    )}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                      className="mt-2 text-xs"
                    >
                      {selectedFile ? "Change Selected PDF" : "Browse PDF File"}
                    </Button>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description" className="font-semibold text-xs uppercase tracking-wider text-muted-foreground">
                  Version Notes / Remarks (Optional)
                </Label>
                <Input
                  id="description"
                  placeholder="e.g. Updated inspection format per 2026 government order"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              <div className="pt-2 flex justify-end">
                <Button type="submit" disabled={isUploading || !selectedFile} className="bg-blue-600 hover:bg-blue-700 text-white gap-2">
                  {isUploading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <FileUp className="w-4 h-4" />}
                  {isUploading ? "Uploading Master PDF..." : "Upload & Set as Active Template"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Module Defaults & Governance Card */}
        <Card className="border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                <CardTitle className="text-lg font-bold">Official Standard Defaults</CardTitle>
              </div>
              <CardDescription>
                One-click fallback to official built-in 5-page vector AcroForm templates.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div className="p-3.5 rounded-xl border bg-slate-50 dark:bg-slate-900/60 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-foreground">Rig Registration (5 Pages)</span>
                  <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-300">
                    Vector AcroForm
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  Pre-configured with 0% overlapping vector fields for Agency, Owner, Partners A/B/C, 3 Rigs, Inspection & Receipt.
                </p>
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full text-xs gap-1.5 border-amber-300 text-amber-800 hover:bg-amber-50 dark:border-amber-800 dark:text-amber-300"
                  onClick={() => setResettingModule("rig_registration")}
                >
                  <RotateCcw className="w-3.5 h-3.5" /> Reset to Built-in Default
                </Button>
              </div>

              <div className="p-3.5 rounded-xl border bg-slate-50 dark:bg-slate-900/60 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-foreground">Rig Renewal (5 Pages)</span>
                  <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300">
                    Vector AcroForm
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  Pre-configured with renewal validity checks, operator specs, fee records, and acknowledgment counterfoil.
                </p>
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full text-xs gap-1.5 border-amber-300 text-amber-800 hover:bg-amber-50 dark:border-amber-800 dark:text-amber-300"
                  onClick={() => setResettingModule("rig_renewal")}
                >
                  <RotateCcw className="w-3.5 h-3.5" /> Reset to Built-in Default
                </Button>
              </div>
            </CardContent>
          </div>
          <CardFooter className="pt-0 text-[11px] text-muted-foreground border-t p-4">
            Changes take effect immediately across all 14 district sub-offices in Kerala.
          </CardFooter>
        </Card>
      </div>

      {/* Master Templates Repository Table */}
      <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <div>
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <FileText className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              Uploaded Master Templates Repository
            </CardTitle>
            <CardDescription>
              All registered template versions. Only one template is active per module at any time.
            </CardDescription>
          </div>
          <Badge variant="secondary" className="font-mono text-xs">
            {templates.length} Registered
          </Badge>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="py-12 flex flex-col items-center justify-center space-y-3">
              <RefreshCw className="w-8 h-8 animate-spin text-blue-600" />
              <p className="text-sm text-muted-foreground">Loading master templates...</p>
            </div>
          ) : templates.length === 0 ? (
            <div className="py-12 text-center space-y-3 border-2 border-dashed rounded-xl">
              <Sparkles className="w-8 h-8 text-blue-500 mx-auto" />
              <p className="text-base font-semibold text-foreground">No Custom Master PDF Templates Uploaded Yet</p>
              <p className="text-xs text-muted-foreground max-w-md mx-auto">
                The system is currently utilizing the built-in official 5-page vector AcroForm templates for all sub-offices. Upload a custom master PDF above whenever new official revisions are issued.
              </p>
            </div>
          ) : (
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50 dark:bg-slate-900/50">
                    <TableHead className="font-bold">Document Name</TableHead>
                    <TableHead className="font-bold">Module</TableHead>
                    <TableHead className="font-bold">File Info</TableHead>
                    <TableHead className="font-bold">Uploaded By / Date</TableHead>
                    <TableHead className="font-bold text-center">Status</TableHead>
                    <TableHead className="font-bold text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {templates.map((tpl) => (
                    <TableRow key={tpl.id} className={tpl.isActive ? "bg-blue-50/40 dark:bg-blue-950/20" : ""}>
                      <TableCell>
                        <div className="font-semibold text-foreground flex items-center gap-2">
                          <FileText className="w-4 h-4 text-blue-600 shrink-0" />
                          <span>{tpl.name}</span>
                        </div>
                        {tpl.description && <p className="text-xs text-muted-foreground mt-0.5">{tpl.description}</p>}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs font-semibold">
                          {tpl.module === "rig_registration" ? "Rig Registration" : tpl.module === "rig_renewal" ? "Rig Renewal" : tpl.module}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <p className="text-xs font-medium text-foreground truncate max-w-[180px]">{tpl.fileName}</p>
                        <p className="text-[11px] text-muted-foreground">{formatFileSize(tpl.fileSize)} • v{tpl.version || 1}</p>
                      </TableCell>
                      <TableCell>
                        <p className="text-xs text-foreground">{tpl.uploadedBy}</p>
                        <p className="text-[11px] text-muted-foreground">
                          {tpl.createdAt ? format(new Date(tpl.createdAt), "dd MMM yyyy, hh:mm a") : "-"}
                        </p>
                      </TableCell>
                      <TableCell className="text-center">
                        {tpl.isActive ? (
                          <Badge className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1 text-[11px]">
                            <CheckCircle2 className="w-3 h-3" /> Active Template
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="text-[11px] text-muted-foreground">
                            Archived
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {!tpl.isActive && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setActiveTemplate(tpl.id, tpl.module)}
                              className="text-xs h-8 text-blue-600 hover:bg-blue-50 border-blue-200"
                            >
                              Make Active
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setPreviewTemplate(tpl)}
                            title="Preview PDF"
                            className="h-8 w-8 p-0"
                          >
                            <Eye className="w-4 h-4 text-slate-600" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDownloadTemplate(tpl)}
                            title="Download Master PDF"
                            className="h-8 w-8 p-0"
                          >
                            <Download className="w-4 h-4 text-slate-600" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setDeletingTemplateId(tpl.id)}
                            title="Delete Template"
                            className="h-8 w-8 p-0 text-red-600 hover:bg-red-50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* PDF Preview Dialog */}
      <Dialog open={!!previewTemplate} onOpenChange={() => setPreviewTemplate(null)}>
        <DialogContent className="max-w-5xl h-[90vh] flex flex-col p-0">
          <DialogHeader className="p-4 pb-2 border-b flex flex-row items-center justify-between">
            <div>
              <DialogTitle className="text-base font-bold flex items-center gap-2">
                <FileText className="w-4 h-4 text-blue-600" />
                {previewTemplate?.name}
              </DialogTitle>
              <DialogDescription className="text-xs">
                {previewTemplate?.fileName} ({formatFileSize(previewTemplate?.fileSize || 0)})
              </DialogDescription>
            </div>
          </DialogHeader>
          <div className="flex-1 w-full bg-slate-100 dark:bg-slate-950 p-2">
            {previewTemplate?.base64Pdf ? (
              <iframe
                src={previewTemplate.base64Pdf}
                className="w-full h-full rounded border border-slate-300 dark:border-slate-800"
                title="Master PDF Preview"
              />
            ) : (
              <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
                No preview available
              </div>
            )}
          </div>
          <DialogFooter className="p-3 border-t">
            <Button variant="outline" size="sm" onClick={() => setPreviewTemplate(null)}>
              Close Preview
            </Button>
            {previewTemplate && (
              <Button size="sm" onClick={() => handleDownloadTemplate(previewTemplate)} className="gap-1.5">
                <Download className="w-3.5 h-3.5" /> Download PDF
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Alert */}
      <AlertDialog open={!!deletingTemplateId} onOpenChange={() => setDeletingTemplateId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Master PDF Template?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to permanently delete this master PDF template? Sub-offices will revert to the official default vector template if no other active template exists.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700 text-white"
              onClick={async () => {
                if (deletingTemplateId) {
                  await deleteTemplate(deletingTemplateId);
                  setDeletingTemplateId(null);
                }
              }}
            >
              Delete Template
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reset to Defaults Confirmation Alert */}
      <AlertDialog open={!!resettingModule} onOpenChange={() => setResettingModule(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reset to Built-in Official Defaults?</AlertDialogTitle>
            <AlertDialogDescription>
              This will deactivate all custom uploaded master templates for{" "}
              <strong>{resettingModule === "rig_registration" ? "Rig Registration" : "Rig Renewal"}</strong>.
              All sub-offices will immediately use the official built-in 5-page vector AcroForm template.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-amber-600 hover:bg-amber-700 text-white"
              onClick={async () => {
                if (resettingModule) {
                  await resetToOfficialDefaults(resettingModule);
                  setResettingModule(null);
                }
              }}
            >
              Reset to Defaults
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
