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

export interface MasterPdfTemplate {
  id: string;
  name: string;
  module: "rig_registration" | "rig_renewal" | "general" | string;
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
}

export const MODULE_OPTIONS = [
  { id: "rig_registration", label: "Rig Registration (5 Pages)", defaultName: "New Rig Registration Master PDF" },
  { id: "rig_renewal", label: "Rig Renewal (5 Pages)", defaultName: "Rig Renewal Master PDF" },
] as const;

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
      snap.forEach((d) => {
        const val = d.data() as MasterPdfTemplate;
        list.push({ ...val, id: d.id });
      });
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

    const id = uuidv4();
    const now = new Date().toISOString();
    const existingForModule = templates.filter((t) => t.module === module);
    const newVersion = existingForModule.length + 1;

    const templateDoc: MasterPdfTemplate = {
      id,
      name: name.trim() || file.name.replace(/\.pdf$/i, ""),
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
    };

    // Update local list first
    const updatedList = templates.map((t) => (t.module === module ? { ...t, isActive: false, updatedAt: now } : t));
    updatedList.unshift(templateDoc);
    setTemplates(updatedList);
    saveLocalCachedTemplates(updatedList);

    // Try persisting to Firestore in background
    try {
      for (const t of existingForModule) {
        if (t.isActive) {
          await updateDoc(doc(db, "masterPdfTemplates", t.id), {
            isActive: false,
            updatedAt: now,
          }).catch(() => {});
        }
      }
      await setDoc(doc(db, "masterPdfTemplates", id), templateDoc).catch(() => {});
    } catch (e) {
      console.warn("Firestore sync warning:", e);
    }

    toast({
      title: "Master PDF Template Uploaded",
      description: `"${templateDoc.name}" is now the active template for ${module === "rig_registration" ? "Rig Registration" : "Rig Renewal"}.`,
    });

    return templateDoc;
  };

  const setActiveTemplate = async (id: string, module: string) => {
    const now = new Date().toISOString();
    
    // Update local state first
    const updatedList = templates.map((t) => {
      if (t.module === module) {
        return { ...t, isActive: t.id === id, updatedAt: now };
      }
      return t;
    });
    setTemplates(updatedList);
    saveLocalCachedTemplates(updatedList);

    // Sync Firestore in background
    try {
      const moduleTemplates = templates.filter((t) => t.module === module);
      for (const t of moduleTemplates) {
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
      description: "All sub-offices will now use this active master PDF template.",
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
    return templates.find((t) => t.module === module && t.isActive);
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
