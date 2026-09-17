"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { QRCodeSVG } from "qrcode.react";
import { 
  Smartphone, 
  Download, 
  ExternalLink, 
  CheckCircle2, 
  ShieldCheck, 
  Copy, 
  Check, 
  QrCode, 
  Info,
  Sparkles,
  Layers
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const APK_GOOGLE_DRIVE_VIEW_URL = "https://drive.google.com/file/d/1MTHcjeT2PNO-ExZWoGzvP7pjpaj5AAN_/view?usp=drivesdk";
const PACKAGE_NAME = "app.vercel.gwdkerala.twa";
const SHA256_FINGERPRINT = "18:E1:0D:A3:00:9B:30:B6:7F:0D:BE:90:27:61:FC:A3:57:76:FF:EB:B4:E9:96:29:EB:E9:D9:A2:B2:75:73:8C";

export default function AndroidAppDownloadCard() {
  const { toast } = useToast();
  const [copiedLink, setCopiedLink] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [activeQrTab, setActiveQrTab] = useState<"apk" | "web">("apk");
  const [currentUrl, setCurrentUrl] = useState("https://gwdkerala02.vercel.app");

  useEffect(() => {
    if (typeof window !== "undefined") {
      setCurrentUrl(window.location.origin);

      // Check if running in standalone mode (already installed)
      if (window.matchMedia("(display-mode: standalone)").matches) {
        setIsInstalled(true);
      }

      // Listen for PWA install prompt
      const handleBeforeInstallPrompt = (e: Event) => {
        e.preventDefault();
        setDeferredPrompt(e);
      };

      window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      return () => {
        window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      };
    }
  }, []);

  const handleInstallPWA = async () => {
    if (!deferredPrompt) {
      toast({
        title: "PWA Install",
        description: "To install via Chrome on Android, tap the three dots (⋮) menu in Chrome and select 'Install app' or 'Add to Home Screen'.",
      });
      return;
    }
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setIsInstalled(true);
      toast({
        title: "Installation Started",
        description: "GWD Kerala app is being installed to your home screen.",
      });
    }
    setDeferredPrompt(null);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(APK_GOOGLE_DRIVE_VIEW_URL);
    setCopiedLink(true);
    toast({
      title: "Link Copied",
      description: "Google Drive APK download link copied to clipboard.",
    });
    setTimeout(() => setCopiedLink(false), 2500);
  };

  return (
    <Card className="lg:col-span-2 shadow-sm border-emerald-500/20 bg-gradient-to-br from-card via-card to-emerald-950/5">
      <CardHeader className="pb-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                <Smartphone className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-lg flex items-center gap-2">
                  Android App & Mobile Access
                  <Badge variant="outline" className="border-emerald-500/30 text-emerald-700 dark:text-emerald-300 bg-emerald-500/10 text-[11px] font-medium">
                    Official TWA Package
                  </Badge>
                </CardTitle>
                <CardDescription>
                  Download the official Android APK or install directly to your smartphone for fast full-screen field operations.
                </CardDescription>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopyLink}
              className="h-8 gap-1.5 text-xs shrink-0"
            >
              {copiedLink ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
              <span>{copiedLink ? "Link Copied" : "Copy APK Link"}</span>
            </Button>
            <Button
              size="sm"
              className="h-8 gap-1.5 text-xs bg-emerald-600 hover:bg-emerald-700 text-white shrink-0"
              onClick={() => window.open(APK_GOOGLE_DRIVE_VIEW_URL, "_blank")}
            >
              <Download className="h-3.5 w-3.5" />
              <span>Download APK (2.1 MB)</span>
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-5">
        {/* Top Info Banner */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Main Download & Action Panel */}
          <div className="md:col-span-2 space-y-4">
            <div className="p-4 rounded-xl border bg-muted/40 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-3">
                <div>
                  <h4 className="font-semibold text-sm text-foreground flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                    GWD Dashboard for Android
                  </h4>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Package: <code className="font-mono text-[11px] bg-muted px-1.5 py-0.5 rounded">{PACKAGE_NAME}</code>
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground border">
                    Size: 2.1 MB
                  </span>
                  <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 flex items-center gap-1">
                    <ShieldCheck className="h-3 w-3" /> Signed Release
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-2.5 pt-1">
                <Button
                  className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2 font-medium"
                  onClick={() => window.open(APK_GOOGLE_DRIVE_VIEW_URL, "_blank")}
                >
                  <Download className="h-4 w-4" />
                  Download APK via Google Drive
                  <ExternalLink className="h-3.5 w-3.5 opacity-80" />
                </Button>

                {deferredPrompt && !isInstalled && (
                  <Button
                    variant="outline"
                    className="border-emerald-600/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 gap-2"
                    onClick={handleInstallPWA}
                  >
                    <Smartphone className="h-4 w-4 text-emerald-600" />
                    Install Directly to Device
                  </Button>
                )}

                {isInstalled && (
                  <div className="flex items-center gap-1.5 text-xs text-emerald-700 dark:text-emerald-400 font-medium px-3 py-2 bg-emerald-50 dark:bg-emerald-950/40 rounded-lg border border-emerald-200 dark:border-emerald-800">
                    <CheckCircle2 className="h-4 w-4" />
                    Running in App Mode (Installed)
                  </div>
                )}
              </div>

              <p className="text-[11.5px] text-muted-foreground leading-relaxed">
                TWA (Trusted Web Activity) provides native Android performance while automatically keeping all features, district data, and offline capabilities continuously synchronized with cloud releases.
              </p>
            </div>

            {/* Quick Installation Steps */}
            <div className="space-y-2 p-3.5 rounded-xl border bg-card/60">
              <h5 className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <Info className="h-3.5 w-3.5 text-primary" />
                How to Install the APK on Android:
              </h5>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs pt-1">
                <div className="p-2.5 rounded-lg bg-muted/50 border space-y-1">
                  <span className="font-bold text-primary block">Step 1</span>
                  <p className="text-muted-foreground text-[11px] leading-snug">
                    Tap <strong>Download APK</strong> and save <code>GWD Dashboard.apk</code> from Google Drive to your device.
                  </p>
                </div>
                <div className="p-2.5 rounded-lg bg-muted/50 border space-y-1">
                  <span className="font-bold text-primary block">Step 2</span>
                  <p className="text-muted-foreground text-[11px] leading-snug">
                    Open the downloaded file. If prompted, toggle <em>&quot;Allow from this source&quot;</em> in Android Security settings.
                  </p>
                </div>
                <div className="p-2.5 rounded-lg bg-muted/50 border space-y-1">
                  <span className="font-bold text-primary block">Step 3</span>
                  <p className="text-muted-foreground text-[11px] leading-snug">
                    Tap <strong>Install</strong>. Once installed, launch the app from your home screen for pure full-screen mode!
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* QR Code Panel for Quick Phone Scan */}
          <div className="flex flex-col items-center justify-between p-4 rounded-xl border bg-muted/20 text-center space-y-3">
            <div className="space-y-1 w-full">
              <div className="flex items-center justify-center gap-1.5 text-xs font-semibold text-foreground">
                <QrCode className="h-4 w-4 text-emerald-600" />
                Scan to Open on Phone
              </div>
              <p className="text-[11px] text-muted-foreground">
                Scan with any Android camera or QR scanner
              </p>
            </div>

            {/* QR Tab Switcher */}
            <div className="flex rounded-lg bg-muted p-0.5 text-[11px] font-medium w-full">
              <button
                type="button"
                className={`flex-1 py-1 px-2 rounded-md transition-all ${
                  activeQrTab === "apk" 
                    ? "bg-background text-foreground shadow-xs font-semibold" 
                    : "text-muted-foreground hover:text-foreground"
                }`}
                onClick={() => setActiveQrTab("apk")}
              >
                Download APK
              </button>
              <button
                type="button"
                className={`flex-1 py-1 px-2 rounded-md transition-all ${
                  activeQrTab === "web" 
                    ? "bg-background text-foreground shadow-xs font-semibold" 
                    : "text-muted-foreground hover:text-foreground"
                }`}
                onClick={() => setActiveQrTab("web")}
              >
                Open Web Portal
              </button>
            </div>

            {/* QR Code Graphic */}
            <div className="p-3 bg-white rounded-xl shadow-xs border flex items-center justify-center">
              <QRCodeSVG
                value={activeQrTab === "apk" ? APK_GOOGLE_DRIVE_VIEW_URL : currentUrl}
                size={140}
                level="M"
                includeMargin={false}
              />
            </div>

            <span className="text-[11px] text-muted-foreground font-medium truncate max-w-[200px]">
              {activeQrTab === "apk" ? "Google Drive Direct Link" : currentUrl.replace(/^https?:\/\//, "")}
            </span>
          </div>
        </div>

        {/* Technical Verification Details */}
        <div className="pt-3 border-t flex flex-wrap items-center justify-between gap-2 text-[11px] text-muted-foreground">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-semibold text-foreground flex items-center gap-1">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" /> Digital Asset Links:
            </span>
            <span className="inline-flex items-center gap-1 font-mono text-[10.5px] bg-muted px-2 py-0.5 rounded border">
              <Layers className="h-3 w-3 text-primary" /> /.well-known/assetlinks.json (Active)
            </span>
            <span className="text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 px-2 py-0.5 rounded-full font-medium">
              ✓ Fullscreen TWA Verified
            </span>
          </div>
          <span className="text-[10.5px]">
            SHA-256: <span className="font-mono">{SHA256_FINGERPRINT.slice(0, 20)}...</span>
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
