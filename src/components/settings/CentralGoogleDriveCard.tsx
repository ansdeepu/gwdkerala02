// src/components/settings/CentralGoogleDriveCard.tsx
"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { SUPER_ADMIN_EMAIL } from "@/lib/config";
import { GOOGLE_APPS_SCRIPT_CODE } from "@/lib/googleDriveConstants";
import { 
  getGoogleDriveScriptUrl, 
  saveGoogleDriveScriptUrl, 
  getGoogleDriveStorageQuota, 
  testGoogleDriveConnection, 
  type DriveStorageQuota 
} from "@/lib/googleDriveUploadClient";
import GoogleDriveSetupDialog from "@/components/shared/GoogleDriveSetupDialog";
import { 
  Cloud, 
  HardDrive, 
  CheckCircle2, 
  AlertCircle, 
  Copy, 
  Check, 
  ExternalLink, 
  RefreshCw, 
  Loader2, 
  Settings2, 
  Building2, 
  ShieldCheck, 
  FolderCheck,
  Radio,
  FileCheck2
} from "lucide-react";

interface CentralGoogleDriveCardProps {
  className?: string;
  allowEdit?: boolean;
}

export default function CentralGoogleDriveCard({ className, allowEdit = true }: CentralGoogleDriveCardProps) {
  const { user } = useAuth();
  const { toast } = useToast();

  const [scriptUrl, setScriptUrl] = useState<string>("");
  const [inputUrl, setInputUrl] = useState<string>("");
  const [isEditingUrl, setIsEditingUrl] = useState(false);
  const [storageQuota, setStorageQuota] = useState<DriveStorageQuota | null>(null);
  const [isLoadingQuota, setIsLoadingQuota] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [isCopied, setIsCopied] = useState(false);
  const [isSetupDialogOpen, setIsSetupDialogOpen] = useState(false);

  const isSuperAdmin = 
    user?.role === 'superAdmin' || 
    user?.email === 'keralagwd@gmail.com' || 
    user?.email === SUPER_ADMIN_EMAIL;

  const canConfigure = isSuperAdmin && allowEdit;

  const loadDriveSettings = useCallback(async () => {
    setIsLoadingQuota(true);
    try {
      const url = await getGoogleDriveScriptUrl();
      if (url) {
        setScriptUrl(url);
        setInputUrl(url);
        const quota = await getGoogleDriveStorageQuota(url);
        setStorageQuota(quota);
      } else {
        setScriptUrl("");
        setInputUrl("");
        setStorageQuota(null);
      }
    } catch (err) {
      console.warn("Could not load Google Drive settings:", err);
    } finally {
      setIsLoadingQuota(false);
    }
  }, []);

  useEffect(() => {
    if (isSuperAdmin) {
      loadDriveSettings();
    }
  }, [isSuperAdmin, loadDriveSettings]);

  if (!isSuperAdmin) {
    return null;
  }

  const handleCopyScript = () => {
    navigator.clipboard.writeText(GOOGLE_APPS_SCRIPT_CODE);
    setIsCopied(true);
    toast({
      title: "Google Apps Script Copied",
      description: "Code copied to clipboard. Deploy as Web App on keralagwd@gmail.com.",
    });
    setTimeout(() => setIsCopied(false), 3000);
  };

  const handleTestConnection = async (urlToTest?: string) => {
    const targetUrl = urlToTest || inputUrl || scriptUrl;
    if (!targetUrl) {
      toast({
        title: "Missing URL",
        description: "Please enter a valid Google Apps Script Web App URL first.",
        variant: "destructive",
      });
      return;
    }

    setIsTesting(true);
    setTestResult(null);
    try {
      const result = await testGoogleDriveConnection(targetUrl);
      setTestResult(result);
      if (result.success) {
        toast({
          title: "Connection Successful",
          description: result.message || "Successfully connected to keralagwd@gmail.com Google Drive!",
        });
        const quota = await getGoogleDriveStorageQuota(targetUrl);
        setStorageQuota(quota);
      } else {
        toast({
          title: "Connection Failed",
          description: result.message || "Could not reach Google Apps Script Web App.",
          variant: "destructive",
        });
      }
    } catch (err: any) {
      const msg = err?.message || "Connection test failed";
      setTestResult({ success: false, message: msg });
      toast({
        title: "Test Error",
        description: msg,
        variant: "destructive",
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleSaveUrl = async () => {
    if (!inputUrl.trim()) {
      toast({
        title: "URL Required",
        description: "Please enter the deployed Google Apps Script Web App URL.",
        variant: "destructive",
      });
      return;
    }

    if (!inputUrl.trim().startsWith("https://script.google.com/macros/s/")) {
      toast({
        title: "Invalid URL Format",
        description: "URL must start with https://script.google.com/macros/s/",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);
    try {
      const res = await saveGoogleDriveScriptUrl(inputUrl.trim());
      if (res.success) {
        setScriptUrl(inputUrl.trim());
        setIsEditingUrl(false);
        toast({
          title: "Google Drive Connected Successfully",
          description: "All 14 District Offices & Labs are now automatically connected to keralagwd@gmail.com Google Drive.",
        });
        loadDriveSettings();
      } else {
        toast({
          title: "Save Failed",
          description: res.error || "Could not save Google Drive configuration.",
          variant: "destructive",
        });
      }
    } catch (err: any) {
      toast({
        title: "Save Error",
        description: err?.message || "An error occurred while saving.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-primary/10 text-primary border border-primary/20">
              <Cloud className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <CardTitle className="text-lg">Statewide Google Drive Cloud Storage</CardTitle>
                <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 text-xs font-mono">
                  keralagwd@gmail.com
                </Badge>
              </div>
              <CardDescription className="text-xs">
                Centralized cloud media repository for all 14 District Offices & Labs (Direct uploads up to 25 MB)
              </CardDescription>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {canConfigure && (
              <>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setIsSetupDialogOpen(true)}
                  className="h-8 text-xs gap-1.5"
                >
                  <Settings2 className="h-3.5 w-3.5" />
                  Deployment Guide
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => loadDriveSettings()}
                  disabled={isLoadingQuota}
                  className="h-8 w-8 p-0"
                  title="Refresh Quota"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${isLoadingQuota ? 'animate-spin' : ''}`} />
                </Button>
              </>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Connection Status Banner */}
        <div className="p-4 rounded-xl border bg-muted/30 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <span className="text-xs font-semibold text-muted-foreground">Status:</span>
              {scriptUrl ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                  Active & Connected Statewide
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
                  <AlertCircle className="h-3.5 w-3.5 text-amber-600" />
                  {canConfigure ? "Setup Required (Super Admin)" : "Waiting for Super Admin Configuration"}
                </span>
              )}
            </div>

            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="font-medium">Direct Upload Limit:</span>
              <Badge variant="secondary" className="font-semibold text-xs">25 MB / file</Badge>
            </div>
          </div>

          {/* Sub-office Broadcast Notice */}
          <div className="flex items-start gap-2.5 p-3 rounded-lg bg-background/80 border text-xs text-muted-foreground">
            <Radio className="h-4 w-4 text-primary shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              <strong className="text-foreground">Automatic Multi-Office Routing: </strong>
              When configured here by the Super Admin, all field supervisors, investigators, and officers in{" "}
              <strong>all 14 District Offices & 3 Regional Labs</strong> are connected automatically. All site photos, work videos, staff photos, and tender files sync directly into{" "}
              <code className="text-primary font-semibold">keralagwd@gmail.com</code> partitioned under each district&apos;s folder.
            </p>
          </div>
        </div>

        {/* Quota & Usage Bar */}
        {scriptUrl && (
          <div className="p-4 rounded-xl border bg-card/70 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <HardDrive className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  <h4 className="text-sm font-semibold text-foreground">
                    Google Drive Storage Capacity
                  </h4>
                </div>
                <p className="text-xs text-muted-foreground">
                  Statewide storage consumed in <code>keralagwd@gmail.com</code>
                </p>
              </div>
              <div className="text-right flex items-baseline sm:flex-col sm:items-end gap-2 sm:gap-0">
                <span className="text-base sm:text-lg font-bold text-foreground">
                  {storageQuota?.displayText || `${storageQuota?.usedGB ?? '0.00'} GB / ${storageQuota?.limitGB ?? '15.00'} GB`}
                </span>
                <span className="text-[11px] font-medium text-muted-foreground">
                  {storageQuota?.freeGB !== undefined ? `${storageQuota.freeGB} GB available free` : '15 GB standard capacity'}
                </span>
              </div>
            </div>

            <div className="space-y-1.5">
              <Progress
                value={storageQuota ? Math.max(1, storageQuota.percentUsed ?? 0) : 2}
                className="h-2.5 bg-muted rounded-full"
              />
              <div className="flex justify-between items-center text-[11px] text-muted-foreground pt-0.5">
                <span className="font-medium">0 GB</span>
                <span className="font-semibold text-primary">
                  {storageQuota?.percentUsed !== undefined ? `${storageQuota.percentUsed}% Used` : "Active"}
                </span>
                <span className="font-medium">{storageQuota?.limitGB ? `${storageQuota.limitGB} GB Total` : '15 GB Total'}</span>
              </div>
            </div>
          </div>
        )}

        {/* Super Admin Configuration Area */}
        {canConfigure && (
          <div className="p-4 rounded-xl border border-primary/20 bg-primary/5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-primary" />
                <h4 className="text-sm font-bold text-foreground">
                  Super Admin Web App Endpoint Configuration
                </h4>
              </div>
              {!isEditingUrl && scriptUrl && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setIsEditingUrl(true)}
                  className="h-7 text-xs"
                >
                  Change Endpoint URL
                </Button>
              )}
            </div>

            {(!scriptUrl || isEditingUrl) ? (
              <div className="space-y-3 pt-1">
                <div className="space-y-1.5">
                  <Label htmlFor="scriptUrlInput" className="text-xs font-semibold">
                    Google Apps Script Web App URL:
                  </Label>
                  <Input
                    id="scriptUrlInput"
                    placeholder="https://script.google.com/macros/s/AKfycb.../exec"
                    value={inputUrl}
                    onChange={(e) => setInputUrl(e.target.value)}
                    className="font-mono text-xs bg-background"
                  />
                  <p className="text-[11px] text-muted-foreground">
                    Deployed on <code>keralagwd@gmail.com</code> with Execute as &quot;Me&quot; and Who has access &quot;Anyone&quot;.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <Button
                    size="sm"
                    onClick={handleSaveUrl}
                    disabled={isSaving || !inputUrl.trim()}
                    className="h-8 text-xs gap-1.5"
                  >
                    {isSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
                    Save & Broadcast Statewide
                  </Button>

                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleTestConnection(inputUrl)}
                    disabled={isTesting || !inputUrl.trim()}
                    className="h-8 text-xs gap-1.5"
                  >
                    {isTesting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
                    Test Connection
                  </Button>

                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={handleCopyScript}
                    className="h-8 text-xs gap-1.5"
                  >
                    {isCopied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                    {isCopied ? "Script Copied!" : "Copy Apps Script Code"}
                  </Button>

                  {isEditingUrl && scriptUrl && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setInputUrl(scriptUrl);
                        setIsEditingUrl(false);
                      }}
                      className="h-8 text-xs text-muted-foreground"
                    >
                      Cancel
                    </Button>
                  )}
                </div>

                {testResult && (
                  <div className={`p-3 rounded-lg text-xs flex items-center gap-2 ${testResult.success ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300' : 'bg-red-50 text-red-800 border border-red-200 dark:bg-red-950/50 dark:text-red-300'}`}>
                    {testResult.success ? <CheckCircle2 className="h-4 w-4 shrink-0" /> : <AlertCircle className="h-4 w-4 shrink-0" />}
                    <span>{testResult.message}</span>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 rounded-lg bg-background border text-xs">
                <div className="space-y-0.5 truncate max-w-lg">
                  <span className="text-[11px] text-muted-foreground block font-medium">Active Web App URL:</span>
                  <span className="font-mono text-foreground font-medium truncate block">
                    {scriptUrl.slice(0, 60)}...{scriptUrl.slice(-10)}
                  </span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleTestConnection()}
                    disabled={isTesting}
                    className="h-7 text-xs gap-1"
                  >
                    {isTesting ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
                    Test
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => window.open('https://drive.google.com', '_blank', 'noopener,noreferrer')}
                    className="h-7 text-xs gap-1"
                  >
                    <ExternalLink className="h-3 w-3" />
                    Open Drive
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* List of Connected District Folders */}
        <div className="pt-2 border-t space-y-2">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span className="font-semibold flex items-center gap-1.5">
              <FolderCheck className="h-3.5 w-3.5 text-primary" />
              Connected Sub-Offices & Labs:
            </span>
            <span className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
              14 Districts + 3 Regional Labs Active
            </span>
          </div>

          <div className="flex flex-wrap gap-1.5 text-[11px]">
            {[
              "Thiruvananthapuram", "Kollam", "Pathanamthitta", "Alappuzha",
              "Kottayam", "Idukki", "Ernakulam", "Thrissur",
              "Palakkad", "Malappuram", "Kozhikode", "Wayanad",
              "Kannur", "Kasaragod", "Lab TVM", "Lab EKM", "Lab KKD"
            ].map((district) => (
              <span
                key={district}
                className="inline-flex items-center px-2 py-0.5 rounded-md bg-muted text-muted-foreground border text-[10.5px] font-medium"
              >
                <CheckCircle2 className="h-2.5 w-2.5 mr-1 text-emerald-600" />
                {district}
              </span>
            ))}
          </div>
        </div>
      </CardContent>

      <GoogleDriveSetupDialog
        open={isSetupDialogOpen}
        onOpenChange={setIsSetupDialogOpen}
        onConfigured={(url) => {
          setScriptUrl(url);
          setInputUrl(url);
          loadDriveSettings();
        }}
      />
    </Card>
  );
}
