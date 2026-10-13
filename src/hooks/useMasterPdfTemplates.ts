"use client";

import { useState, useEffect, useCallback } from "react";
import {
  collection,
  doc,
  getDocs,
  setDoc,
  deleteDoc,
  updateDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { v4 as uuidv4 } from "uuid";
import { PDFDocument } from "pdf-lib";

export interface MasterPdfTemplate {
  id: string;
  name: string;
  module: "rig_registration" | "general" | string;
  moduleLabel?: string;
  description?: string;
  fileName: string;
  fileSize: number;
  base64Pdf: string;
  isActive: boolean;
  version: number;
  createdAt: string;
  uploadedBy: string;
  updatedAt: string;
  acroFieldCount?: number;
  acroFields?: string[];
  isChunked?: boolean;
  chunkCount?: number;
}

export interface ModuleOption {
  id: string;
  label: string;
  defaultName: string;
  description: string;
  pageRoute: string;
  pageName: string;
  badge?: string;
  applicableDocuments: string[];
}

// Only modules corresponding to pages displayed on the left panel
export const MODULE_OPTIONS: ModuleOption[] = [
  {
    id: "deposit_works",
    label: "Deposit Works",
    defaultName: "Official Deposit Works Sanction & Estimation Form",
    description: "Public & Government deposit works documentation, estimates, AS/TS sanction letters, and site inspection formats",
    pageRoute: "/dashboard/file-room",
    pageName: "Deposit Works",
    badge: "Left Panel Page",
    applicableDocuments: [
      "Work Estimation Format",
      "Administrative Sanction (AS) Form",
      "Technical Sanction (TS) Sheet",
      "Site Feasibility & Inspection Report",
    ],
  },
  {
    id: "collectors_deposit_works",
    label: "Collector's Deposit Works",
    defaultName: "Collector's Priority Works Sanction Order Format",
    description: "District Collector revenue fund priority works sanctions, emergency drinking water approvals, and administrative approvals",
    pageRoute: "/dashboard/collectors-deposit-works",
    pageName: "Collector's Deposit Works",
    badge: "Left Panel Page",
    applicableDocuments: [
      "Collector Sanction Order",
      "Emergency Drinking Water Proposal",
      "Priority Works Estimation Form",
      "Administrative Approval Order",
    ],
  },
  {
    id: "private_deposit_works",
    label: "Private Deposit Works",
    defaultName: "Private Deposit Works Application & Agreement Form",
    description: "Private deposit works applications, applicant agreements, beneficiary undertakings, and estimates",
    pageRoute: "/dashboard/private-deposit-works",
    pageName: "Private Deposit Works",
    badge: "Left Panel Page",
    applicableDocuments: [
      "Applicant Agreement Deed",
      "Private Well Drilling Application",
      "Remittance & Estimation Sheet",
      "Field Officer Inspection Format",
    ],
  },
  {
    id: "plan_fund_works",
    label: "Plan Fund Works",
    defaultName: "Plan Fund Works Administrative Sanction & Technical Format",
    description: "State plan scheme works, GWBDWS budget allocations, site estimates, and scheme execution documents",
    pageRoute: "/dashboard/plan-fund-works",
    pageName: "Plan Fund Works",
    badge: "Left Panel Page",
    applicableDocuments: [
      "Plan Scheme Proposal Format",
      "Budget Allocation Order",
      "TS & Estimation Sheet",
      "Scheme Handover Report",
    ],
  },
  {
    id: "ars",
    label: "ARS",
    defaultName: "ARS Feasibility & Technical Inspection Form",
    description: "Rainwater harvesting feasibility assessments, artificial recharge well designs, and technical inspection sheets",
    pageRoute: "/dashboard/ars",
    pageName: "ARS",
    badge: "Left Panel Page",
    applicableDocuments: [
      "ARS Feasibility Report",
      "Technical Inspection Sheet",
      "Roof Catchment Assessment Form",
      "Sub-surface Recharge Design Format",
    ],
  },
  {
    id: "rig_registration",
    label: "Rig Registration",
    defaultName: "Official Rig Registration Application Form (5 Pages)",
    description: "Official 5-page application form and renewal formats for drilling agencies, rig vehicles, and mechanical specifications",
    pageRoute: "/dashboard/agency-registration",
    pageName: "Rig Registration",
    badge: "Left Panel Page",
    applicableDocuments: [
      "Rig Registration Form (5 Pages)",
      "Rig Registration Renewal Form",
      "Owner & Partner Credentials",
      "Rig & Compressor Specifications",
      "Inspection & Payment Counterfoil",
    ],
  },
  {
    id: "e_tender",
    label: "e-Tender",
    defaultName: "Official e-Tender Notice & Work Order Format",
    description: "e-Tender notices, schedule of quantities, bidder pre-qualification formats, contractor agreements, and work orders",
    pageRoute: "/dashboard/e-tender",
    pageName: "e-Tender",
    badge: "Left Panel Page",
    applicableDocuments: [
      "Notice Inviting Tender (NIT)",
      "Schedule of Quantities (BOQ)",
      "Contractor Agreement Deed",
      "Official Work Order Format",
    ],
  },
  {
    id: "gw_investigation",
    label: "GW Investigation",
    defaultName: "Groundwater Investigation & Site Feasibility Report Format",
    description: "Hydrogeological survey reports, site feasibility reports, geophysical sounding data sheets, and yield recommendations",
    pageRoute: "/dashboard/gw-investigation",
    pageName: "GW Investigation",
    badge: "Left Panel Page",
    applicableDocuments: [
      "Site Feasibility Inspection Sheet",
      "Resistivity Sounding Data Sheet",
      "Investigation Recommendation Certificate",
      "Hydrogeological Assessment Report",
    ],
  },
  {
    id: "logging_pumping_test",
    label: "Logging & Pumping Test",
    defaultName: "Borehole Geophysical Logging & Pumping Test Format",
    description: "Electrical resistivity / gamma borehole logging sheets, step drawdown tests, and aquifer yield determination formats",
    pageRoute: "/dashboard/logging-pumping-test",
    pageName: "Logging & Pumping Test",
    badge: "Left Panel Page",
    applicableDocuments: [
      "Geophysical Log Chart",
      "Step Drawdown Test Sheet",
      "Constant Rate Pumping Test Form",
      "Aquifer Parameter Calculation Sheet",
    ],
  },
  {
    id: "vehicles",
    label: "Vehicle & Rig",
    defaultName: "Departmental Vehicle & Drilling Rig Log Book Format",
    description: "Departmental vehicle fleet maintenance registers, rig movement log books, fitness inspection sheets, and fuel vouchers",
    pageRoute: "/dashboard/vehicles",
    pageName: "Vehicle & Rig",
    badge: "Left Panel Page",
    applicableDocuments: [
      "Vehicle Movement Log Book",
      "Rig Operation & Hours Register",
      "Fitness & Maintenance Inspection Sheet",
      "Fuel & Consumables Voucher",
    ],
  },
  {
    id: "reports",
    label: "Reports",
    defaultName: "District Groundwater Department Official Report Template",
    description: "Official consolidated district reports, physical & financial achievement reports, and government returns",
    pageRoute: "/dashboard/reports",
    pageName: "Reports",
    badge: "Left Panel Page",
    applicableDocuments: [
      "Consolidated District Monthly Return",
      "Physical Achievement Report",
      "Financial Abstract Format",
      "Executive Summary Presentation",
    ],
  },
  {
    id: "progress_report",
    label: "Progress Reports",
    defaultName: "Monthly Progress Report (MPR) Format",
    description: "Monthly progress reports (MPR), target vs achievement matrices, and scheme completion abstracts",
    pageRoute: "/dashboard/progress-report",
    pageName: "Progress Reports",
    badge: "Left Panel Page",
    applicableDocuments: [
      "Monthly Progress Report Format",
      "District Performance Review Sheet",
      "Scheme Completion Certificate",
      "Quarterly Progress Summary",
    ],
  },
  {
    id: "gwd_rates",
    label: "GWD Rates",
    defaultName: "Groundwater Department Approved Schedule of Rates (SOR)",
    description: "Government approved schedule of rates, drilling unit costs, investigation charges, and machinery hire rate charts",
    pageRoute: "/dashboard/gwd-rates",
    pageName: "GWD Rates",
    badge: "Left Panel Page",
    applicableDocuments: [
      "Official Schedule of Rates (SOR)",
      "Machine Hire Charge Chart",
      "Investigation Fee Schedule",
      "Revision Notification Order",
    ],
  },
  {
    id: "establishment",
    label: "Establishment",
    defaultName: "Establishment & Service Register Official Format",
    description: "Departmental service records, staff duty postings, increment sanction sheets, and establishment circulars",
    pageRoute: "/dashboard/establishment",
    pageName: "Establishment",
    badge: "Left Panel Page",
    applicableDocuments: [
      "Staff Duty Roster",
      "Service Verification Format",
      "Internal Office Order",
      "Charge Handover Report",
    ],
  },
];

const LOCAL_STORAGE_KEY = "gwd_master_pdf_templates_cache";

function getLocalCachedTemplates(): MasterPdfTemplate[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (e) {
    console.warn("Failed to parse local cached master PDF templates:", e);
    return [];
  }
}

function saveLocalCachedTemplates(templates: MasterPdfTemplate[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(templates));
  } catch (e) {
    console.warn("Failed to save local cached master PDF templates:", e);
  }
}

export function useMasterPdfTemplates() {
  const [templates, setTemplates] = useState<MasterPdfTemplate[]>(() => getLocalCachedTemplates());
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchTemplates = useCallback(async () => {
    setIsLoading(true);
    let list: MasterPdfTemplate[] = [];
    let firestoreSuccess = false;

    if (!user) {
      list = getLocalCachedTemplates();
      setTemplates(list);
      setIsLoading(false);
      return;
    }

    try {
      const colRef = collection(db, "masterPdfTemplates");
      const snap = await getDocs(colRef);
      for (const d of snap.docs) {
        const val = d.data() as MasterPdfTemplate;
        let completeBase64 = val.base64Pdf || "";

        // If template was chunked due to large file size, assemble all chunks
        if (val.isChunked && val.chunkCount && val.chunkCount > 0) {
          try {
            const chunksCol = collection(db, "masterPdfTemplates", d.id, "chunks");
            const chunksSnap = await getDocs(chunksCol);
            const chunksList: { index: number; data: string }[] = [];
            chunksSnap.forEach((cDoc) => {
              const cData = cDoc.data();
              chunksList.push({ index: cData.index ?? 0, data: cData.data || "" });
            });
            chunksList.sort((a, b) => a.index - b.index);
            if (chunksList.length > 0) {
              completeBase64 = chunksList.map((c) => c.data).join("");
            }
          } catch (chunkErr) {
            console.warn("Could not load chunks for template:", d.id, chunkErr);
          }
        }

        list.push({ ...val, base64Pdf: completeBase64, id: d.id });
      }
      firestoreSuccess = true;
    } catch {
      // If Firestore permission is restricted or offline, seamlessly fallback to local cache
      list = getLocalCachedTemplates();
    }

    if (firestoreSuccess && list.length > 0) {
      saveLocalCachedTemplates(list);
    } else if (list.length === 0) {
      list = getLocalCachedTemplates();
    }

    // Sort by active first, then date descending
    list.sort((a, b) => {
      if (a.isActive && !b.isActive) return -1;
      if (!a.isActive && b.isActive) return 1;
      return new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime();
    });

    setTemplates(list);
    setIsLoading(false);
  }, [user]);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  const uploadTemplate = async (
    file: File,
    name: string,
    module: string,
    description: string = ""
  ) => {
    if (!file) throw new Error("No PDF file selected");
    if (!file.name.toLowerCase().endsWith(".pdf")) {
      throw new Error("Only .pdf files are supported");
    }

    // Convert file to base64
    const base64Pdf = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const res = reader.result as string;
        resolve(res);
      };
      reader.onerror = (err) => reject(err);
      reader.readAsDataURL(file);
    });

    // Analyze AcroForm interactive fields
    let acroFieldCount = 0;
    let acroFields: string[] = [];
    try {
      const base64Clean = base64Pdf.includes(",") ? base64Pdf.split(",")[1] : base64Pdf;
      const binaryString = window.atob(base64Clean);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      const parsedDoc = await PDFDocument.load(bytes.buffer);
      const form = parsedDoc.getForm();
      const detectedFields = form.getFields();
      acroFieldCount = detectedFields.length;
      acroFields = detectedFields.map((f) => f.getName());
    } catch (e) {
      console.warn("Could not inspect AcroForm fields on upload:", e);
    }

    const id = uuidv4();
    const now = new Date().toISOString();
    const docName = name.trim() || file.name.replace(/\.pdf$/i, "");
    const existingForModuleAndName = templates.filter(
      (t) => t.module === module && t.name.toLowerCase() === docName.toLowerCase()
    );
    const newVersion = existingForModuleAndName.length + 1;

    // Check if chunking is needed (Firestore doc limit is ~1MB)
    const isLarge = base64Pdf.length > 700000;
    const CHUNK_SIZE = 500000;
    const chunks: string[] = [];
    if (isLarge) {
      for (let i = 0; i < base64Pdf.length; i += CHUNK_SIZE) {
        chunks.push(base64Pdf.substring(i, i + CHUNK_SIZE));
      }
    }

    const templateDoc: MasterPdfTemplate = {
      id,
      name: docName,
      module,
      description: description.trim(),
      fileName: file.name,
      fileSize: file.size,
      base64Pdf,
      isActive: true,
      version: newVersion,
      createdAt: now,
      uploadedBy: user?.name || user?.email || "Super Admin",
      updatedAt: now,
      acroFieldCount,
      acroFields,
      isChunked: isLarge,
      chunkCount: isLarge ? chunks.length : 0,
    };

    // Update local list first: only deactivate templates with same module and same document name
    const updatedList = templates.map((t) =>
      t.module === module && t.name.toLowerCase() === docName.toLowerCase()
        ? { ...t, isActive: false, updatedAt: now }
        : t
    );
    updatedList.unshift(templateDoc);
    setTemplates(updatedList);
    saveLocalCachedTemplates(updatedList);

    // Try persisting to Firestore in background
    try {
      for (const t of existingForModuleAndName) {
        if (t.isActive) {
          await updateDoc(doc(db, "masterPdfTemplates", t.id), {
            isActive: false,
            updatedAt: now,
          }).catch(() => {});
        }
      }

      if (isLarge) {
        // Save metadata without huge base64 string
        const { base64Pdf: _, ...metaOnly } = templateDoc;
        await setDoc(doc(db, "masterPdfTemplates", id), { ...metaOnly, base64Pdf: "" });
        // Save chunks in subcollection
        for (let i = 0; i < chunks.length; i++) {
          await setDoc(doc(db, "masterPdfTemplates", id, "chunks", `chunk_${i}`), {
            index: i,
            data: chunks[i],
          });
        }
      } else {
        await setDoc(doc(db, "masterPdfTemplates", id), templateDoc).catch(() => {});
      }
    } catch (e) {
      console.warn("Firestore sync warning:", e);
    }

    toast({
      title: "Master PDF Template Uploaded",
      description: `"${templateDoc.name}" is now the active template for this document type.`,
    });

    return templateDoc;
  };

  const setActiveTemplate = async (id: string, module: string) => {
    const now = new Date().toISOString();
    const targetTpl = templates.find((t) => t.id === id);
    if (!targetTpl) return;
    const targetName = targetTpl.name.toLowerCase();

    // Update local state first: activate target, deactivate others with same module and name
    const updatedList = templates.map((t) => {
      if (t.module === module && t.name.toLowerCase() === targetName) {
        return { ...t, isActive: t.id === id, updatedAt: now };
      }
      return t;
    });
    setTemplates(updatedList);
    saveLocalCachedTemplates(updatedList);

    // Sync Firestore in background
    try {
      const sameNameTemplates = templates.filter(
        (t) => t.module === module && t.name.toLowerCase() === targetName
      );
      for (const t of sameNameTemplates) {
        await updateDoc(doc(db, "masterPdfTemplates", t.id), {
          isActive: t.id === id,
          updatedAt: now,
        }).catch(() => {});
      }
    } catch (e) {
      console.warn("Firestore sync warning:", e);
    }

    toast({
      title: "Active Template Updated",
      description: `"${targetTpl.name}" is now active for this document type.`,
    });
  };

  const resetToOfficialDefaults = async (module: string) => {
    const now = new Date().toISOString();
    
    // Update local state first
    const updatedList = templates.map((t) => {
      if (t.module === module) {
        return { ...t, isActive: false, updatedAt: now };
      }
      return t;
    });
    setTemplates(updatedList);
    saveLocalCachedTemplates(updatedList);

    // Sync Firestore in background
    try {
      const moduleTemplates = templates.filter((t) => t.module === module);
      for (const t of moduleTemplates) {
        if (t.isActive) {
          await updateDoc(doc(db, "masterPdfTemplates", t.id), {
            isActive: false,
            updatedAt: now,
          }).catch(() => {});
        }
      }
    } catch (e) {
      console.warn("Firestore sync warning:", e);
    }

    toast({
      title: "Reset to Official Defaults",
      description: `Restored standard built-in 5-page template for ${module === "rig_registration" ? "Rig Registration" : "Rig Renewal"}.`,
    });
  };

  const deleteTemplate = async (id: string) => {
    const updatedList = templates.filter((t) => t.id !== id);
    setTemplates(updatedList);
    saveLocalCachedTemplates(updatedList);

    try {
      await deleteDoc(doc(db, "masterPdfTemplates", id)).catch(() => {});
    } catch (e) {
      console.warn("Firestore delete warning:", e);
    }

    toast({
      title: "Template Deleted",
      description: "Master PDF template removed.",
    });
  };

  const getActiveTemplateForModule = (module: string): MasterPdfTemplate | undefined => {
    return (
      templates.find((t) => t.module === module && t.isActive) ||
      (module === "rig_renewal"
        ? templates.find((t) => (t.module === "rig_registration" || t.module === "rig_renewal") && t.isActive)
        : undefined)
    );
  };

  return {
    templates,
    isLoading,
    fetchTemplates,
    uploadTemplate,
    setActiveTemplate,
    resetToOfficialDefaults,
    deleteTemplate,
    getActiveTemplateForModule,
  };
}
