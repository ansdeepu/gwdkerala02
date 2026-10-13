"use client";

import React, { useState, useRef, useEffect } from "react";
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
import { FileUp, FileText, CheckCircle2, RotateCcw, Trash2, Eye, Download, ShieldCheck, Sparkles, ArrowLeft, RefreshCw, Layers, Check, Search, ListFilter, ExternalLink } from "lucide-react";
import { format } from "date-fns";
import { downloadPdfBytes, base64ToArrayBuffer } from "@/lib/pdf/acroFormPdfService";
import Link from "next/link";

interface SuperAdminTemplateManagerProps {
  isEmbeddedInSettings?: boolean;
}

export function SuperAdminTemplateManager({ isEmbeddedInSettings = false }: SuperAdminTemplateManagerProps) {
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
  const [selectedModule, setSelectedModule] = useState<string>("deposit_works");
  const [description, setDescription] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // Repository filter and search
  const [moduleFilter, setModuleFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Preview & Action dialogs
  const [previewTemplate, setPreviewTemplate] = useState<MasterPdfTemplate | null>(null);
  const [previewBlobUrl, setPreviewBlobUrl] = useState<string | null>(null);
  const [inspectingTemplate, setInspectingTemplate] = useState<MasterPdfTemplate | null>(null);
  const [deletingTemplateId, setDeletingTemplateId] = useState<string | null>(null);
  const [resettingModule, setResettingModule] = useState<string | null>(null);

  useEffect(() => {
    if (previewTemplate && previewTemplate.base64Pdf) {
      try {
        const buffer = base64ToArrayBuffer(previewTemplate.base64Pdf);
        const blob = new Blob([buffer], { type: "application/pdf" });
        const url = URL.createObjectURL(blob);
        setPreviewBlobUrl(url);
        return () => URL.revokeObjectURL(url);
      } catch (e) {
        console.error("Preview blob creation error:", e);
      }
    }
    setPreviewBlobUrl(null);
  }, [previewTemplate]);

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

  // Selected module lookup
  const currentModule = MODULE_OPTIONS.find((m) => m.id === selectedModule) || MODULE_OPTIONS[0];
  const activeTemplateForCurrentModule = templates.find((t) => t.module === selectedModule && t.isActive);

  // Filtered templates for repository
  const filteredTemplates = templates.filter((tpl) => {
    const matchesModule = moduleFilter === "all" || tpl.module === moduleFilter;
    const matchesSearch =
      !searchQuery.trim() ||
      tpl.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tpl.fileName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (tpl.description && tpl.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
      tpl.module.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesModule && matchesSearch;
  });

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
          <p className="text-sm text-blue-200/90 max-w-3xl">
            Upload and govern official Master PDF templates for the functional pages displayed on the left panel (
            <strong>Deposit Works</strong>, <strong>Collector&apos;s Deposit Works</strong>, <strong>Private Deposit Works</strong>, 
            <strong>Plan Fund Works</strong>, <strong>ARS</strong>, <strong>Rig Registration</strong>, <strong>e-Tender</strong>, 
            <strong>GW Investigation</strong>, <strong>Logging & Pumping Test</strong>, <strong>Vehicle & Rig</strong>, <strong>Reports</strong>, 
            <strong>Progress Reports</strong>, <strong>GWD Rates</strong>, and <strong>Establishment</strong>). 
            The active template is automatically enforced across all 14 district offices.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {!isEmbeddedInSettings && (
            <Button asChild variant="outline" size="sm" className="bg-white/10 hover:bg-white/20 text-white border-white/20 gap-1.5">
              <Link href="/dashboard/super-admin/profile">
                <ArrowLeft className="w-4 h-4" /> Back to Profile
              </Link>
            </Button>
          )}
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

      {/* Upload Form Card */}
      <Card className="max-w-4xl mx-auto border-slate-200 dark:border-slate-800 shadow-sm">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-2">
            <FileUp className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <CardTitle className="text-lg font-bold">Upload New Master PDF Template</CardTitle>
          </div>
          <CardDescription>
            Select the target page from the left panel navigation and browse the official PDF template.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleUpload} className="space-y-4">
            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="moduleSelect" className="font-semibold text-xs uppercase tracking-wider text-muted-foreground flex items-center justify-between">
                    <span>Applicable Module / Target Page <span className="text-red-500">*</span></span>
                    <span className="text-[11px] font-normal normal-case text-blue-600 dark:text-blue-400">Pages on Left Panel</span>
                  </Label>
                  <Select value={selectedModule} onValueChange={(val) => {
                    setSelectedModule(val);
                    const mod = MODULE_OPTIONS.find((m) => m.id === val);
                    if (mod && (!docName || MODULE_OPTIONS.some((m) => m.defaultName === docName))) {
                      setDocName(mod.defaultName);
                    }
                  }}>
                    <SelectTrigger id="moduleSelect" className="w-full h-auto py-2">
                      <SelectValue placeholder="Select Left Panel Page / Module" />
                    </SelectTrigger>
                    <SelectContent className="max-h-[380px]">
                      {MODULE_OPTIONS.map((m) => (
                        <SelectItem key={m.id} value={m.id} className="py-2">
                          <div className="flex flex-col gap-0.5 text-left">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-sm">{m.label}</span>
                              <Badge variant="outline" className="text-[10px] px-1.5 py-0 font-normal border-blue-200 text-blue-700 dark:border-blue-800 dark:text-blue-300">
                                {m.pageRoute}
                              </Badge>
                            </div>
                            <span className="text-xs text-muted-foreground truncate max-w-[300px]">
                              {m.description}
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="docName" className="font-semibold text-xs uppercase tracking-wider text-muted-foreground">
                    Document Name / Title <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="docName"
                    placeholder="e.g. Kerala GWD Official Master Form"
                    value={docName}
                    onChange={(e) => setDocName(e.target.value)}
                    required
                    className="h-10"
                  />
                </div>
              </div>

              {/* Contextual Box: Selected Module & Applicable Page Guidance */}
              {currentModule && (
                <div className="p-3.5 rounded-xl border border-blue-100 bg-blue-50/60 dark:border-blue-900/40 dark:bg-blue-950/20 space-y-2.5 transition-all">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold uppercase tracking-wider text-blue-950 dark:text-blue-200">
                        Target Left Panel Page:
                      </span>
                      <Badge className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium">
                        {currentModule.label}
                      </Badge>
                    </div>
                    <Link
                      href={currentModule.pageRoute}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-700 dark:text-blue-300 hover:underline bg-white dark:bg-slate-900 px-2.5 py-1 rounded-md border border-blue-200 dark:border-blue-800 shadow-2xs"
                    >
                      <span className="font-mono text-[11px]">{currentModule.pageRoute}</span>
                      <ExternalLink className="w-3 h-3" />
                    </Link>
                  </div>

                  <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                    {currentModule.description}
                  </p>
                </div>
              )}
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

      {/* Master Templates Repository Table */}
      <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
        <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3">
          <div>
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <FileText className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              Uploaded Master Templates Repository
            </CardTitle>
            <CardDescription>
              All registered templates across application modules. Custom templates govern forms on their respective pages.
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="font-mono text-xs">
              {templates.length} Total Registered
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filter Bar and Search */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pt-1">
            {/* Module Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full text-xs">
              <button
                type="button"
                onClick={() => setModuleFilter("all")}
                className={`px-3 py-1.5 rounded-full font-medium transition-all whitespace-nowrap text-xs border ${
                  moduleFilter === "all"
                    ? "bg-blue-600 text-white border-blue-600 shadow-2xs"
                    : "bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700"
                }`}
              >
                All Modules ({templates.length})
              </button>
              {MODULE_OPTIONS.map((m) => {
                const count = templates.filter((t) => t.module === m.id).length;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setModuleFilter(m.id)}
                    className={`px-2.5 py-1.5 rounded-full font-medium transition-all whitespace-nowrap text-xs flex items-center gap-1.5 border ${
                      moduleFilter === m.id
                        ? "bg-blue-600 text-white border-blue-600 shadow-2xs"
                        : "bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700"
                    }`}
                  >
                    <span>{m.label}</span>
                    {count > 0 && (
                      <span
                        className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                          moduleFilter === m.id ? "bg-white/20 text-white" : "bg-blue-100 text-blue-700 dark:bg-blue-900/60 dark:text-blue-300"
                        }`}
                      >
                        {count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Search Input */}
            <div className="relative min-w-[220px]">
              <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
              <Input
                placeholder="Search templates..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-8 text-xs"
              />
            </div>
          </div>

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
                The system is currently utilizing the built-in official vector AcroForm formats for all 14 districts across all modules. Upload custom master PDFs above whenever new official revisions are issued.
              </p>
            </div>
          ) : filteredTemplates.length === 0 ? (
            <div className="py-10 text-center space-y-2 border rounded-xl bg-slate-50/50 dark:bg-slate-900/40">
              <p className="text-sm font-semibold text-foreground">No templates matching filter criteria</p>
              <p className="text-xs text-muted-foreground">Try clearing search or selecting a different module filter.</p>
              <Button size="sm" variant="outline" onClick={() => { setModuleFilter("all"); setSearchQuery(""); }} className="text-xs">
                Clear Filters
              </Button>
            </div>
          ) : (
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50 dark:bg-slate-900/50">
                    <TableHead className="font-bold">Document Name</TableHead>
                    <TableHead className="font-bold">Applicable Module & Page</TableHead>
                    <TableHead className="font-bold">File Info</TableHead>
                    <TableHead className="font-bold">Uploaded By / Date</TableHead>
                    <TableHead className="font-bold text-center">Status</TableHead>
                    <TableHead className="font-bold text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTemplates.map((tpl) => {
                    const modOption = MODULE_OPTIONS.find((m) => m.id === tpl.module);
                    return (
                      <TableRow key={tpl.id} className={tpl.isActive ? "bg-blue-50/40 dark:bg-blue-950/20" : ""}>
                        <TableCell>
                          <div className="font-semibold text-foreground flex items-center gap-2">
                            <FileText className="w-4 h-4 text-blue-600 shrink-0" />
                            <span>{tpl.name}</span>
                          </div>
                          {tpl.description && <p className="text-xs text-muted-foreground mt-0.5">{tpl.description}</p>}
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <Badge variant="outline" className="text-xs font-semibold bg-slate-50 dark:bg-slate-900 border-slate-300 dark:border-slate-700">
                              {modOption?.label || tpl.module}
                            </Badge>
                            {modOption && (
                              <Link
                                href={modOption.pageRoute}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-1 text-[11px] text-blue-600 dark:text-blue-400 hover:underline"
                              >
                                <span className="truncate max-w-[170px]">{modOption.pageName}</span>
                                <ExternalLink className="w-2.5 h-2.5 shrink-0" />
                              </Link>
                            )}
                          </div>
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
                              onClick={() => setInspectingTemplate(tpl)}
                              title="Inspect Detected Form Fields"
                              className="h-8 w-8 p-0 text-indigo-600 hover:bg-indigo-50"
                            >
                              <ListFilter className="w-4 h-4" />
                            </Button>
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
                    );
                  })}
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
            {previewBlobUrl || previewTemplate?.base64Pdf ? (
              <iframe
                src={`${previewBlobUrl || previewTemplate?.base64Pdf}#toolbar=1`}
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

      {/* Form Fields Inspector Dialog */}
      <Dialog open={!!inspectingTemplate} onOpenChange={() => setInspectingTemplate(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col p-0">
          <DialogHeader className="p-4 border-b">
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <ListFilter className="w-4 h-4 text-indigo-600" />
              Detected AcroForm Fields ({inspectingTemplate?.acroFieldCount || inspectingTemplate?.acroFields?.length || 0})
            </DialogTitle>
            <DialogDescription className="text-xs">
              Template: <span className="font-semibold text-foreground">{inspectingTemplate?.name}</span> ({inspectingTemplate?.fileName})
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            <div className="p-3 bg-blue-50 dark:bg-blue-950/40 rounded-lg text-xs text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-900/50">
              <p className="font-semibold">How Auto-Population Works:</p>
              <p className="mt-0.5">
                The system maps database variables (Agency details, Owner/Partner credentials, Rig mechanical specs, Fees & Challan records) directly into these interactive fields.
              </p>
            </div>

            {inspectingTemplate?.acroFields && inspectingTemplate.acroFields.length > 0 ? (
              <div className="border rounded-lg overflow-hidden">
                <div className="grid grid-cols-12 bg-slate-100 dark:bg-slate-800 p-2 text-xs font-semibold text-muted-foreground border-b">
                  <div className="col-span-1">#</div>
                  <div className="col-span-6">Field Name in PDF</div>
                  <div className="col-span-5 text-right">Auto-Population Status</div>
                </div>
                <div className="divide-y max-h-96 overflow-y-auto">
                  {inspectingTemplate.acroFields.map((fName, idx) => (
                    <div key={idx} className="grid grid-cols-12 p-2 text-xs items-center hover:bg-slate-50 dark:hover:bg-slate-900/50">
                      <div className="col-span-1 text-muted-foreground font-mono">{idx + 1}</div>
                      <div className="col-span-6 font-mono font-medium truncate" title={fName}>
                        {fName}
                      </div>
                      <div className="col-span-5 text-right">
                        <Badge variant="outline" className="text-[10px] bg-emerald-50 text-emerald-700 border-emerald-200 gap-1">
                          <Check className="w-2.5 h-2.5" /> Mapped to DB
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="py-8 text-center text-sm text-muted-foreground border-2 border-dashed rounded-lg space-y-1">
                <p className="font-semibold">No Interactive AcroForm Fields Detected</p>
                <p className="text-xs max-w-sm mx-auto">
                  This PDF template has static / flat pages. The system will apply the high-resolution vector overlay on top of the stationery.
                </p>
              </div>
            )}
          </div>
          <DialogFooter className="p-3 border-t">
            <Button size="sm" onClick={() => setInspectingTemplate(null)}>
              Close
            </Button>
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
