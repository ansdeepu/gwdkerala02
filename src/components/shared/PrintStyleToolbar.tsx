"use client";

import React from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SlidersHorizontal, Type, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";

export interface PrintStyleSettings {
  topMargin: string;         // in cm, e.g. "1.2"
  bottomMargin: string;      // in cm, e.g. "1.2"
  leftMargin: string;        // in cm, e.g. "1.5"
  rightMargin: string;       // in cm, e.g. "1.5"
  lineSpacing: string;       // e.g. "1.4"
  fontSize?: string;         // Alias / fallback for bodyFontSize e.g. "11pt"
  bodyFontSize?: string;     // Remaining Content / Body Font Size e.g. "11pt"
  headingFontSize?: string;  // Main Heading Font Size e.g. "15pt"
  subheadingFontSize?: string;// Sub Headings Font Size e.g. "13pt"
  malayalamFont: string;     // e.g. "Mandaram"
  englishFont: string;       // e.g. "Times New Roman"
}

export const DEFAULT_PRINT_STYLES: PrintStyleSettings = {
  topMargin: "1.2",
  bottomMargin: "1.2",
  leftMargin: "1.5",
  rightMargin: "1.5",
  lineSpacing: "1.4",
  fontSize: "11pt",
  bodyFontSize: "11pt",
  headingFontSize: "15pt",
  subheadingFontSize: "13pt",
  malayalamFont: "Mandaram",
  englishFont: "Times New Roman",
};

export const MALAYALAM_FONT_OPTIONS = [
  { label: "Mandaram (e-Office Draft)", value: "Mandaram" },
  { label: "Manjari", value: "Manjari" },
  { label: "Noto Sans Malayalam", value: "Noto Sans Malayalam" },
  { label: "Gayathri", value: "Gayathri" },
  { label: "Chilanka", value: "Chilanka" },
  { label: "Anek Malayalam", value: "Anek Malayalam" },
  { label: "Rachana", value: "Rachana" },
  { label: "Meera", value: "Meera" },
  { label: "Suruma", value: "Suruma" },
  { label: "System Default", value: "sans-serif" },
];

export const ENGLISH_FONT_OPTIONS = [
  { label: "Times New Roman", value: "Times New Roman" },
  { label: "Arial", value: "Arial" },
  { label: "Inter", value: "Inter" },
  { label: "Georgia", value: "Georgia" },
  { label: "Calibri", value: "Calibri" },
  { label: "Courier New", value: "Courier New" },
  { label: "System Sans", value: "sans-serif" },
];

export const LINE_SPACING_OPTIONS = [
  { label: "1.0 (Single)", value: "1.0" },
  { label: "1.15 (Tight)", value: "1.15" },
  { label: "1.25 (Compact)", value: "1.25" },
  { label: "1.4 (Standard)", value: "1.4" },
  { label: "1.5 (Medium)", value: "1.5" },
  { label: "1.6 (Relaxed)", value: "1.6" },
  { label: "1.8 (Wide)", value: "1.8" },
  { label: "2.0 (Double)", value: "2.0" },
];

export const HEADING_FONT_SIZE_OPTIONS = [
  { label: "12 pt", value: "12pt" },
  { label: "13 pt", value: "13pt" },
  { label: "14 pt", value: "14pt" },
  { label: "15 pt (Standard Title)", value: "15pt" },
  { label: "16 pt (Large Title)", value: "16pt" },
  { label: "18 pt (Extra Large)", value: "18pt" },
  { label: "20 pt", value: "20pt" },
];

export const SUBHEADING_FONT_SIZE_OPTIONS = [
  { label: "10 pt", value: "10pt" },
  { label: "11 pt", value: "11pt" },
  { label: "12 pt (Compact)", value: "12pt" },
  { label: "13 pt (Standard)", value: "13pt" },
  { label: "14 pt (Large)", value: "14pt" },
  { label: "15 pt", value: "15pt" },
];

export const BODY_FONT_SIZE_OPTIONS = [
  { label: "8 pt (Micro)", value: "8pt" },
  { label: "9 pt (Small)", value: "9pt" },
  { label: "10 pt (Compact)", value: "10pt" },
  { label: "11 pt (Standard Body)", value: "11pt" },
  { label: "12 pt (Large Body)", value: "12pt" },
  { label: "13 pt", value: "13pt" },
];

export function getPrintContainerStyle(settings: PrintStyleSettings): React.CSSProperties & Record<string, string> {
  const malFont = settings.malayalamFont || "Mandaram";
  const engFont = settings.englishFont || "Times New Roman";
  const bodySize = settings.bodyFontSize || settings.fontSize || "11pt";
  const headingSize = settings.headingFontSize || "15pt";
  const subheadingSize = settings.subheadingFontSize || "13pt";
  const fontStack = `'${engFont}', '${malFont}', 'Mandaram', 'Manjari', 'Noto Sans Malayalam', sans-serif`;

  return {
    paddingTop: `${settings.topMargin ?? "1.2"}cm`,
    paddingBottom: `${settings.bottomMargin ?? "1.2"}cm`,
    paddingLeft: `${settings.leftMargin ?? "1.5"}cm`,
    paddingRight: `${settings.rightMargin ?? "1.5"}cm`,
    fontSize: bodySize,
    lineHeight: settings.lineSpacing || "1.4",
    fontFamily: fontStack,
    "--print-font-family": fontStack,
    "--print-body-font-size": bodySize,
    "--print-heading-font-size": headingSize,
    "--print-subheading-font-size": subheadingSize,
    "--print-line-height": settings.lineSpacing || "1.4",
  };
}

export function getPageMarginsCss(settings: PrintStyleSettings): string {
  const top = settings.topMargin ? `${settings.topMargin}cm` : "1.2cm";
  const right = settings.rightMargin ? `${settings.rightMargin}cm` : "1.5cm";
  const bottom = settings.bottomMargin ? `${settings.bottomMargin}cm` : "1.2cm";
  const left = settings.leftMargin ? `${settings.leftMargin}cm` : "1.5cm";
  return `${top} ${right} ${bottom} ${left}`;
}

interface PrintStyleToolbarProps {
  settings: PrintStyleSettings;
  onSettingsChange: (newSettings: PrintStyleSettings) => void;
  hasMalayalam?: boolean;
  hasEnglish?: boolean;
  className?: string;
  triggerVariant?: "outline" | "default" | "secondary" | "ghost";
  triggerSize?: "default" | "sm" | "xs";
  buttonText?: string;
}

export function PrintStyleToolbar({
  settings,
  onSettingsChange,
  hasMalayalam = true,
  hasEnglish = true,
  className,
  triggerVariant = "outline",
  triggerSize = "sm",
  buttonText = "Page & Font Settings",
}: PrintStyleToolbarProps) {
  const updateField = (key: keyof PrintStyleSettings, value: string) => {
    onSettingsChange({
      ...settings,
      [key]: value,
    });
  };

  const handleReset = () => {
    onSettingsChange(DEFAULT_PRINT_STYLES);
  };

  return (
    <div className={cn("inline-flex items-center", className)}>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant={triggerVariant}
            size={triggerSize === "xs" ? "sm" : triggerSize}
            className={cn(
              "gap-1.5 shadow-xs text-xs font-medium border-slate-300 hover:bg-slate-50 text-slate-700",
              triggerSize === "xs" && "h-7 text-[11px] px-2"
            )}
          >
            <SlidersHorizontal className="h-3.5 w-3.5 text-primary" />
            <span>{buttonText}</span>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[340px] sm:w-[380px] p-4 space-y-4 shadow-xl border-slate-200" align="end">
          <div className="flex items-center justify-between border-b pb-2">
            <div className="flex items-center gap-1.5 font-semibold text-xs text-slate-900">
              <Type className="h-4 w-4 text-primary" />
              <span>Page Margins, Spacing & Fonts</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleReset}
              className="h-6 text-[11px] px-2 text-muted-foreground hover:text-slate-900"
              title="Reset to default margins and fonts"
            >
              <RotateCcw className="mr-1 h-3 w-3" /> Reset
            </Button>
          </div>

          {/* Margins Section */}
          <div className="space-y-1.5">
            <Label className="text-[11px] font-semibold text-slate-700 uppercase tracking-wider">
              Page Margins (cm)
            </Label>
            <div className="grid grid-cols-4 gap-2">
              <div>
                <Label className="text-[10px] text-muted-foreground">Top</Label>
                <Input
                  type="number"
                  step="0.1"
                  min="0"
                  max="5"
                  value={settings.topMargin}
                  onChange={(e) => updateField("topMargin", e.target.value)}
                  className="h-7 text-xs bg-background"
                />
              </div>
              <div>
                <Label className="text-[10px] text-muted-foreground">Bottom</Label>
                <Input
                  type="number"
                  step="0.1"
                  min="0"
                  max="5"
                  value={settings.bottomMargin}
                  onChange={(e) => updateField("bottomMargin", e.target.value)}
                  className="h-7 text-xs bg-background"
                />
              </div>
              <div>
                <Label className="text-[10px] text-muted-foreground">Left</Label>
                <Input
                  type="number"
                  step="0.1"
                  min="0"
                  max="5"
                  value={settings.leftMargin}
                  onChange={(e) => updateField("leftMargin", e.target.value)}
                  className="h-7 text-xs bg-background"
                />
              </div>
              <div>
                <Label className="text-[10px] text-muted-foreground">Right</Label>
                <Input
                  type="number"
                  step="0.1"
                  min="0"
                  max="5"
                  value={settings.rightMargin}
                  onChange={(e) => updateField("rightMargin", e.target.value)}
                  className="h-7 text-xs bg-background"
                />
              </div>
            </div>
          </div>

          {/* Font Sizes & Line Spacing Section */}
          <div className="space-y-2 pt-1 border-t">
            <Label className="text-[11px] font-semibold text-slate-700 uppercase tracking-wider">
              Font Sizes & Spacing
            </Label>
            
            <div className="grid grid-cols-2 gap-2.5">
              {/* Main Heading Font Size */}
              <div className="space-y-1">
                <Label className="text-[10.5px] font-medium text-slate-700">Main Heading</Label>
                <Select
                  value={settings.headingFontSize || "15pt"}
                  onValueChange={(val) => updateField("headingFontSize", val)}
                >
                  <SelectTrigger className="h-7 text-xs bg-background">
                    <SelectValue placeholder="Main Heading" />
                  </SelectTrigger>
                  <SelectContent>
                    {HEADING_FONT_SIZE_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value} className="text-xs">
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Sub Headings Font Size */}
              <div className="space-y-1">
                <Label className="text-[10.5px] font-medium text-slate-700">Sub Headings</Label>
                <Select
                  value={settings.subheadingFontSize || "13pt"}
                  onValueChange={(val) => updateField("subheadingFontSize", val)}
                >
                  <SelectTrigger className="h-7 text-xs bg-background">
                    <SelectValue placeholder="Sub Headings" />
                  </SelectTrigger>
                  <SelectContent>
                    {SUBHEADING_FONT_SIZE_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value} className="text-xs">
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Body / Content Font Size */}
              <div className="space-y-1">
                <Label className="text-[10.5px] font-medium text-slate-700">Body & Table Content</Label>
                <Select
                  value={settings.bodyFontSize || settings.fontSize || "11pt"}
                  onValueChange={(val) => {
                    onSettingsChange({
                      ...settings,
                      bodyFontSize: val,
                      fontSize: val,
                    });
                  }}
                >
                  <SelectTrigger className="h-7 text-xs bg-background">
                    <SelectValue placeholder="Body Font Size" />
                  </SelectTrigger>
                  <SelectContent>
                    {BODY_FONT_SIZE_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value} className="text-xs">
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Line Spacing */}
              <div className="space-y-1">
                <Label className="text-[10.5px] font-medium text-slate-700">Line Spacing</Label>
                <Select value={settings.lineSpacing} onValueChange={(val) => updateField("lineSpacing", val)}>
                  <SelectTrigger className="h-7 text-xs bg-background">
                    <SelectValue placeholder="Line Spacing" />
                  </SelectTrigger>
                  <SelectContent>
                    {LINE_SPACING_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value} className="text-xs">
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Font Type Selection */}
          <div className="space-y-2.5 pt-1 border-t">
            {hasMalayalam && (
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <Label className="text-[11px] font-semibold text-slate-700">
                    Malayalam Font (മലയാളം ഫോണ്ട്)
                  </Label>
                  <span className="text-[9px] text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded font-medium">
                    Malayalam Content
                  </span>
                </div>
                <Select value={settings.malayalamFont} onValueChange={(val) => updateField("malayalamFont", val)}>
                  <SelectTrigger className="h-8 text-xs bg-background">
                    <SelectValue placeholder="Select Malayalam Font" />
                  </SelectTrigger>
                  <SelectContent>
                    {MALAYALAM_FONT_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value} className="text-xs">
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {hasEnglish && (
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <Label className="text-[11px] font-semibold text-slate-700">
                    English Font
                  </Label>
                  <span className="text-[9px] text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded font-medium">
                    English Content
                  </span>
                </div>
                <Select value={settings.englishFont} onValueChange={(val) => updateField("englishFont", val)}>
                  <SelectTrigger className="h-8 text-xs bg-background">
                    <SelectValue placeholder="Select English Font" />
                  </SelectTrigger>
                  <SelectContent>
                    {ENGLISH_FONT_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value} className="text-xs">
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
