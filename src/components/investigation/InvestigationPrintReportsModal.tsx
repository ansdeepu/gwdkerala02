// src/components/investigation/InvestigationPrintReportsModal.tsx
"use client";

import React from "react";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import InvestigationReportViewer, { type InvestigationReportDocType } from "./InvestigationReportViewer";
import type { DataEntryFormData } from "@/lib/schemas";

export type { InvestigationReportDocType };

interface InvestigationPrintReportsModalProps {
  isOpen: boolean;
  onClose: () => void;
  entry: DataEntryFormData | null;
  initialDocType?: InvestigationReportDocType;
  initialSiteIndex?: number;
  onSaveOverrides?: (updatedEntry: DataEntryFormData) => Promise<void> | void;
}

export default function InvestigationPrintReportsModal({
  isOpen,
  onClose,
  entry,
  initialDocType = "investigation_report",
  initialSiteIndex = 0,
  onSaveOverrides,
}: InvestigationPrintReportsModalProps) {
  if (!isOpen || !entry) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent 
        onPointerDownOutside={(e) => e.preventDefault()} 
        className="max-w-[98vw] w-[1400px] h-[95vh] max-h-[95vh] flex flex-col p-0 overflow-hidden bg-slate-100 dark:bg-slate-950"
      >
        <DialogTitle className="sr-only">Investigation and Feasibility Reports</DialogTitle>
        <DialogDescription className="sr-only">Print or customize official reports</DialogDescription>
        <div className="flex-1 overflow-y-auto">
          <InvestigationReportViewer
            entry={entry}
            initialDocType={initialDocType}
            initialSiteIndex={initialSiteIndex}
            returnPath="/dashboard/gw-investigation"
            onSaveOverrides={onSaveOverrides}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
