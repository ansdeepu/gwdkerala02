// src/app/dashboard/gw-investigation/print/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useDataStore } from "@/hooks/use-data-store";
import { getFirestore, doc, getDoc } from "firebase/firestore";
import { app } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Loader2, AlertCircle, ArrowLeft } from "lucide-react";
import InvestigationReportViewer, { type InvestigationReportDocType } from "@/components/investigation/InvestigationReportViewer";
import type { DataEntryFormData } from "@/lib/schemas";

export default function GWInvestigationPrintPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = searchParams?.get("id");
  const docTypeParam = (searchParams?.get("docType") as InvestigationReportDocType) || "investigation_report";
  const siteIndexParam = parseInt(searchParams?.get("siteIndex") || "0", 10);
  const returnPath = searchParams?.get("returnPath") || "/dashboard/gw-investigation";

  const { allFileEntries, isLoading: isDataStoreLoading } = useDataStore();
  const [entry, setEntry] = useState<DataEntryFormData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const loadEntryData = async () => {
      setIsLoading(true);
      setError(null);

      // 1. Check Session Storage for draft changes from form
      try {
        if (typeof window !== "undefined") {
          const draftKey = id ? `gw_report_draft_${id}` : "gw_report_draft_current";
          const draftData = window.sessionStorage.getItem(draftKey);
          if (draftData) {
            const parsed = JSON.parse(draftData);
            if (parsed && (parsed.fileNo || parsed.applicantName || parsed.siteDetails)) {
              if (isMounted) {
                setEntry(parsed);
                setIsLoading(false);
                return;
              }
            }
          }
        }
      } catch (e) {
        console.warn("Could not read draft from sessionStorage", e);
      }

      // 2. Check allFileEntries from data store
      if (allFileEntries && allFileEntries.length > 0 && id) {
        const found = allFileEntries.find(
          (e) => e.id === id || e.fileNo?.toLowerCase() === id.toLowerCase()
        );
        if (found) {
          if (isMounted) {
            setEntry(found);
            setIsLoading(false);
            return;
          }
        }
      }

      // 3. Directly fetch from Firestore by ID if available
      if (id && id !== "new") {
        try {
          const db = getFirestore(app);
          // Try fetching directly by doc ID
          const docRef = doc(db, "fileEntries", id);
          const snap = await getDoc(docRef);
          if (snap.exists() && isMounted) {
            setEntry({ id: snap.id, ...snap.data() } as DataEntryFormData);
            setIsLoading(false);
            return;
          }
        } catch (err: any) {
          console.warn("Direct Firestore fetch error:", err);
        }
      }

      // 4. Fallback if still loading store
      if (isDataStoreLoading) {
        return; // wait for store to finish
      }

      if (isMounted) {
        if (!entry) {
          setError(`Could not find investigation record with ID/File No: "${id || "N/A"}".`);
        }
        setIsLoading(false);
      }
    };

    loadEntryData();

    return () => {
      isMounted = false;
    };
  }, [id, allFileEntries, isDataStoreLoading]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3 text-muted-foreground">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm font-medium">Loading Investigation Report...</p>
      </div>
    );
  }

  if (error || !entry) {
    return (
      <div className="max-w-xl mx-auto my-12 p-6 bg-card border rounded-xl shadow-xs space-y-4 text-center">
        <div className="mx-auto w-12 h-12 rounded-full bg-destructive/10 text-destructive flex items-center justify-center">
          <AlertCircle className="h-6 w-6" />
        </div>
        <h2 className="text-lg font-bold text-foreground">Report Not Available</h2>
        <p className="text-sm text-muted-foreground">
          {error || "Unable to load the requested investigation document."}
        </p>
        <div className="pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push(returnPath)}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Return Back
          </Button>
        </div>
      </div>
    );
  }

  return (
    <InvestigationReportViewer
      entry={entry}
      initialDocType={docTypeParam}
      initialSiteIndex={isNaN(siteIndexParam) ? 0 : siteIndexParam}
      returnPath={returnPath}
    />
  );
}
