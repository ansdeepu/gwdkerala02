// src/lib/googleDriveUploadClient.ts
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";

export interface DriveUploadOptions {
  file: File;
  officeLocation?: string;
  fileNo?: string;
  siteName?: string;
  type: 'image' | 'video';
  customScriptUrl?: string;
  onProgress?: (percent: number, statusText: string) => void;
}

export interface DriveUploadResult {
  success: boolean;
  fileId?: string;
  fileName?: string;
  viewUrl?: string;
  embedUrl?: string;
  thumbnailUrl?: string;
  directImageUrl?: string;
  url?: string;
  folderPath?: string;
  folderUrl?: string;
  error?: string;
  requiresSetup?: boolean;
  isLocalStorage?: boolean;
}

// In-memory cache for the script URL to avoid redundant reads
let cachedScriptUrl: string | null = null;
const LOCAL_STORAGE_KEY = "gwd_google_drive_script_url";

export async function getGoogleDriveScriptUrl(): Promise<string | null> {
  if (cachedScriptUrl) return cachedScriptUrl;

  // 1. Try localStorage if in browser
  if (typeof window !== "undefined") {
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (stored && stored.startsWith("https://script.google.com/macros/s/")) {
        cachedScriptUrl = stored.trim();
      }
    } catch (e) {}
  }

  // 2. Fetch from backend system settings API
  try {
    const res = await fetch("/api/system-settings/google-drive");
    if (res.ok) {
      const text = await res.text();
      let data: any = null;
      try { data = JSON.parse(text); } catch (e) {}
      if (data?.success && data?.scriptUrl) {
        cachedScriptUrl = data.scriptUrl.trim();
        if (typeof window !== "undefined" && cachedScriptUrl) {
          try {
            localStorage.setItem(LOCAL_STORAGE_KEY, cachedScriptUrl);
          } catch (e) {}
        }
        return cachedScriptUrl;
      }
    }
  } catch (apiErr) {
    console.warn("Could not fetch googleDrive settings from API:", apiErr);
  }

  // 3. Fallback: try Firestore
  try {
    const docRef = doc(db, "systemSettings", "googleDrive");
    const snap = await getDoc(docRef);
    if (snap.exists() && snap.data()?.scriptUrl) {
      cachedScriptUrl = snap.data().scriptUrl.trim();
      if (typeof window !== "undefined" && cachedScriptUrl) {
        try {
          localStorage.setItem(LOCAL_STORAGE_KEY, cachedScriptUrl);
        } catch (e) {}
      }
      return cachedScriptUrl;
    }
  } catch (err) {
    // Firestore security rules may block unconfigured collections
    console.warn("Could not fetch googleDrive settings from Firestore:", err);
  }

  return cachedScriptUrl;
}

export interface DriveStorageQuota {
  success: boolean;
  connected: boolean;
  requiresSetup?: boolean;
  account: string;
  usedBytes?: number;
  limitBytes?: number;
  freeBytes?: number;
  usedGB?: number;
  limitGB?: number;
  freeGB?: number;
  percentUsed?: number;
  displayText?: string;
  error?: string;
}

export async function getGoogleDriveStorageQuota(customScriptUrl?: string): Promise<DriveStorageQuota> {
  try {
    const urlParam = customScriptUrl ? `?scriptUrl=${encodeURIComponent(customScriptUrl)}` : '';
    const res = await fetch(`/api/drive-storage${urlParam}`, { cache: "no-store" });
    if (res.ok) {
      const data = await res.json();
      return data;
    }
    return {
      success: false,
      connected: false,
      account: "keralagwd@gmail.com",
      error: `Server responded with status ${res.status}`
    };
  } catch (err: any) {
    return {
      success: false,
      connected: false,
      account: "keralagwd@gmail.com",
      error: err?.message || "Could not retrieve storage information"
    };
  }
}

export async function saveGoogleDriveScriptUrl(scriptUrl: string): Promise<{ success: boolean; error?: string }> {
  try {
    const trimmed = (scriptUrl || "").trim();
    if (!trimmed.startsWith("https://script.google.com/macros/s/")) {
      return {
        success: false,
        error: "Invalid URL. The Web App URL must start with 'https://script.google.com/macros/s/'"
      };
    }

    // 1. Save to server backend
    const res = await fetch("/api/system-settings/google-drive", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ scriptUrl: trimmed }),
    });

    const text = await res.text();
    let data: any = {};
    try { data = JSON.parse(text); } catch (e) {}

    if (!res.ok || !data.success) {
      return {
        success: false,
        error: data?.error || `Failed to save configuration (Status ${res.status})`
      };
    }

    // Update in-memory and local storage cache
    cachedScriptUrl = trimmed;
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(LOCAL_STORAGE_KEY, trimmed);
      } catch (e) {}
    }

    // 2. Also attempt Firestore sync in background (non-blocking if security rules differ)
    try {
      const docRef = doc(db, "systemSettings", "googleDrive");
      await setDoc(docRef, {
        scriptUrl: trimmed,
        targetAccount: "keralagwd@gmail.com",
        updatedAt: serverTimestamp(),
      }, { merge: true });
    } catch (fsErr) {
      console.warn("Note: Firestore systemSettings rule pending in Firebase console, saved via server API:", fsErr);
    }

    return { success: true };
  } catch (err: any) {
    console.error("Failed to save googleDrive script URL:", err);
    return {
      success: false,
      error: err?.message || "Failed to save configuration."
    };
  }
}

/**
 * Compresses an image file client-side using HTML5 Canvas.
 * Reduces 5-10MB mobile camera photos to ~150-300KB in milliseconds.
 */
export async function compressImage(file: File, maxDimension = 1920, quality = 0.82): Promise<{ base64Data: string; mimeType: string }> {
  return new Promise((resolve, reject) => {
    // If SVG or GIF, don't compress through canvas
    if (file.type === 'image/gif' || file.type === 'image/svg+xml') {
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = reader.result as string;
        resolve({ base64Data: dataUrl.split(',')[1] || '', mimeType: file.type });
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          // Fallback to original
          const dataUrl = reader.result as string;
          resolve({ base64Data: dataUrl.split(',')[1] || '', mimeType: file.type });
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve({
          base64Data: compressedDataUrl.split(',')[1] || '',
          mimeType: 'image/jpeg',
        });
      };
      img.onerror = () => {
        const dataUrl = reader.result as string;
        resolve({ base64Data: dataUrl.split(',')[1] || '', mimeType: file.type });
      };
      img.src = e.target?.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Converts a video or binary file to base64.
 */
export async function fileToBase64(file: File): Promise<{ base64Data: string; mimeType: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      const base64Data = dataUrl.split(',')[1] || '';
      resolve({ base64Data, mimeType: file.type || 'application/octet-stream' });
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Helper to upload JSON payload with live progress reporting via XMLHttpRequest.
 */
function postJsonWithProgress(
  url: string,
  payload: any,
  onProgress?: (percent: number, statusText: string) => void,
  startPercent = 25,
  maxPercent = 90,
  uploadingText = "Uploading to Google Drive..."
): Promise<any> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined" || typeof XMLHttpRequest === "undefined") {
      fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
        .then(res => res.json())
        .then(resolve)
        .catch(reject);
      return;
    }

    const xhr = new XMLHttpRequest();
    xhr.open("POST", url, true);
    xhr.setRequestHeader("Content-Type", "application/json");

    if (onProgress) {
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable && event.total > 0) {
          const ratio = event.loaded / event.total;
          const current = Math.round(startPercent + ratio * (maxPercent - startPercent));
          onProgress(Math.min(current, maxPercent), uploadingText);
        }
      };
    }

    xhr.onload = () => {
      try {
        const data = JSON.parse(xhr.responseText);
        resolve(data);
      } catch (e) {
        if (xhr.status === 413 || xhr.responseText.toLowerCase().includes("payload too large")) {
          resolve({
            success: false,
            error: "File size exceeds server payload limits. Maximum allowed file size is 25MB."
          });
        } else {
          resolve({
            success: false,
            error: `Server returned non-JSON response (Status ${xhr.status}): ${xhr.responseText.slice(0, 150)}...`
          });
        }
      }
    };

    xhr.onerror = () => {
      reject(new Error("Network connection interrupted during upload. Please check your connection."));
    };

    xhr.ontimeout = () => {
      reject(new Error("Upload timed out. Please verify your connection."));
    };

    xhr.send(JSON.stringify(payload));
  });
}

/**
 * Strict Office Location Normalization (Option 3):
 * Maps all district variations, casing, and Malayalam scripts into standard lowercase office directory names
 * (matching existing Drive folders like 'kollam').
 */
export function normalizeOfficeLocation(office?: string | null, fallback?: string | null): string {
  const raw = (office || fallback || "").trim();
  if (!raw || raw.toLowerCase() === "general") {
    return (fallback && fallback.toLowerCase() !== "general") ? normalizeOfficeLocation(fallback) : "kollam";
  }

  const lower = raw.toLowerCase();

  if (lower.includes("kollam") || lower.includes("കൊല്ലം") || lower.includes("klm")) return "kollam";
  if (lower.includes("thiruvananthapuram") || lower.includes("തിരുവനന്തപുരം") || lower.includes("tvm")) return "thiruvananthapuram";
  if (lower.includes("pathanamthitta") || lower.includes("പത്തനംതിട്ട") || lower.includes("pta")) return "pathanamthitta";
  if (lower.includes("alappuzha") || lower.includes("ആലപ്പുഴ") || lower.includes("alp")) return "alappuzha";
  if (lower.includes("kottayam") || lower.includes("കോട്ടയം") || lower.includes("ktm")) return "kottayam";
  if (lower.includes("idukki") || lower.includes("ഇടുക്കി") || lower.includes("idk")) return "idukki";
  if (lower.includes("ernakulam") || lower.includes("എറണാകുളം") || lower.includes("ekm")) return "ernakulam";
  if (lower.includes("thrissur") || lower.includes("തൃശ്ശൂർ") || lower.includes("tsr")) return "thrissur";
  if (lower.includes("palakkad") || lower.includes("പാലക്കാട്") || lower.includes("pkd")) return "palakkad";
  if (lower.includes("malappuram") || lower.includes("മലപ്പുറം") || lower.includes("mpm")) return "malappuram";
  if (lower.includes("kozhikode") || lower.includes("കോഴിക്കോട്") || lower.includes("kkd")) return "kozhikode";
  if (lower.includes("wayanad") || lower.includes("വയനാട്") || lower.includes("wyd")) return "wayanad";
  if (lower.includes("kannur") || lower.includes("കണ്ണൂർ") || lower.includes("knr")) return "kannur";
  if (lower.includes("kasaragod") || lower.includes("കാസർഗോഡ്") || lower.includes("ksd")) return "kasaragod";
  if (lower.includes("directorate") || lower.includes("ഡയറക്ടറേറ്റ്")) return "Directorate TVM";

  return cleanDriveName(raw);
}

export function cleanDriveName(name?: string | null): string {
  if (!name) return "";
  return String(name).replace(/[/\\?%*:|"<>]/g, "_").trim();
}

export interface CreateFolderOptions {
  officeLocation?: string;
  fileNo?: string;
  siteName?: string;
  subFolder?: string;
  rootFolder?: string;
  customScriptUrl?: string;
}

export interface CreateFolderResult {
  success: boolean;
  folderId?: string;
  folderUrl?: string;
  folderName?: string;
  folderPath?: string;
  officeLocation?: string;
  driveSearchUrl?: string;
  error?: string;
}

/**
 * Creates or retrieves a designated site folder directly in Google Drive under keralagwd@gmail.com (Option 1).
 * Follows structure: GWD_Site_Media / [officeLocation] / [fileNo - siteName]
 */
export async function createOrGetDriveFolder(options: CreateFolderOptions): Promise<CreateFolderResult> {
  const { officeLocation, fileNo = "General", siteName = "", customScriptUrl, rootFolder = "GWD_Site_Media" } = options;

  const resolvedOffice = normalizeOfficeLocation(officeLocation);
  const cleanFile = cleanDriveName(fileNo);
  const cleanSite = cleanDriveName(siteName);
  const folderName = cleanSite ? `${cleanFile} - ${cleanSite}` : cleanFile;

  const scriptUrl = customScriptUrl || (await getGoogleDriveScriptUrl()) || undefined;

  // Placeholder info content for backward compatibility with older deployed scripts
  const placeholderText = `Ground Water Department, Kerala\nSite Folder: ${folderName}\nOffice: ${resolvedOffice}\nFile No: ${fileNo}\nSite: ${siteName}\nInitialized on: ${new Date().toLocaleString('en-IN')}`;
  let base64Data = "";
  try {
    if (typeof window !== "undefined") {
      base64Data = btoa(unescape(encodeURIComponent(placeholderText)));
    } else {
      base64Data = Buffer.from(placeholderText).toString("base64");
    }
  } catch (e) {
    base64Data = "R1dEIFNpdGUgRm9sZGVyIEluaXRpYWxpemVk";
  }

  try {
    const res = await fetch("/api/drive-upload", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "createFolder",
        officeLocation: resolvedOffice,
        fileNo,
        siteName,
        rootFolder,
        base64Data,
        fileName: "_folder_info.txt",
        mimeType: "text/plain",
        customScriptUrl: scriptUrl,
      }),
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      return {
        success: false,
        folderName,
        officeLocation: resolvedOffice,
        error: data.error || `Server error (${res.status})`,
        driveSearchUrl: `https://drive.google.com/drive/u/0/search?q=${encodeURIComponent('"' + folderName + '"')}`
      };
    }

    const folderUrl = data.folderUrl || (data.folderId ? `https://drive.google.com/drive/folders/${data.folderId}` : undefined);
    const driveSearchUrl = folderUrl || `https://drive.google.com/drive/u/0/search?q=${encodeURIComponent('"' + folderName + '"')}`;

    return {
      success: true,
      folderId: data.folderId,
      folderUrl: folderUrl || driveSearchUrl,
      folderName: data.folderName || folderName,
      folderPath: data.folderPath || `${rootFolder}/${resolvedOffice}/${folderName}`,
      officeLocation: resolvedOffice,
      driveSearchUrl,
    };
  } catch (err: any) {
    return {
      success: false,
      folderName,
      officeLocation: resolvedOffice,
      error: err?.message || "Failed to create Google Drive folder.",
      driveSearchUrl: `https://drive.google.com/drive/u/0/search?q=${encodeURIComponent('"' + folderName + '"')}`
    };
  }
}

/**
 * Uploads a file (photo or video) to Google Drive under keralagwd@gmail.com.
 * Automatically saves into: GWD_Site_Media / [officeLocation] / [fileNo - siteName]
 */
export async function uploadMediaToGoogleDrive(options: DriveUploadOptions): Promise<DriveUploadResult> {
  const { file, officeLocation = "kollam", fileNo = "General", siteName = "", type, customScriptUrl, onProgress } = options;
  const resolvedOffice = normalizeOfficeLocation(officeLocation);

  // 1. Strict 25MB file size check for both photos and videos
  const MAX_FILE_SIZE_MB = 25;
  if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
    const fileSizeMB = (file.size / (1024 * 1024)).toFixed(1);
    return {
      success: false,
      error: `File size (${fileSizeMB} MB) exceeds maximum upload limit of ${MAX_FILE_SIZE_MB} MB. Please select or compress your file.`
    };
  }

  // 2. Get or determine script URL
  const scriptUrl = customScriptUrl || (await getGoogleDriveScriptUrl()) || undefined;

  // 3. Prepare payload with initial progress status
  let base64Data = "";
  let mimeType = file.type || (type === "image" ? "image/jpeg" : "video/mp4");

  try {
    if (type === "image") {
      onProgress?.(10, "Compressing and preparing photo...");
      const compressed = await compressImage(file);
      base64Data = compressed.base64Data;
      mimeType = compressed.mimeType;
      onProgress?.(25, "Starting photo upload to Google Drive...");
    } else {
      // For video
      onProgress?.(10, "Encoding video file...");
      const converted = await fileToBase64(file);
      base64Data = converted.base64Data;
      mimeType = converted.mimeType;
      onProgress?.(25, "Starting video upload to Google Drive...");
    }
  } catch (prepErr: any) {
    return {
      success: false,
      error: prepErr?.message || "Failed to prepare media file for upload."
    };
  }

  // 4. Send to API route with live progress reporting
  try {
    const data: DriveUploadResult = await postJsonWithProgress(
      "/api/drive-upload",
      {
        base64Data,
        fileName: file.name,
        mimeType,
        officeLocation: resolvedOffice,
        fileNo,
        siteName,
        type,
        customScriptUrl: scriptUrl,
      },
      onProgress,
      25,
      92,
      `Uploading ${type === "image" ? "photo" : "video"} to Google Drive (keralagwd@gmail.com)...`
    );

    if (data.success) {
      onProgress?.(100, "Upload completed successfully!");
    }
    return data;
  } catch (netErr: any) {
    console.error("Network error during drive upload fetch:", netErr);
    return {
      success: false,
      error: netErr?.message || "Failed to communicate with Google Drive upload service."
    };
  }
}

export interface TenderEstimateUploadOptions {
  file: File;
  officeLocation?: string;
  tenderNo?: string;
  customScriptUrl?: string;
  onProgress?: (percent: number, statusText: string) => void;
}

/**
 * Uploads a Detailed Estimate PDF directly into Google Drive under keralagwd@gmail.com.
 * Folder structure: My Drive > GWD_e-Tender > [Sub-Office (e.g. Kollam)] > [Detailed Estimate PDF]
 */
export async function uploadTenderEstimateToGoogleDrive(
  options: TenderEstimateUploadOptions
): Promise<DriveUploadResult> {
  const { file, officeLocation = "General", tenderNo, customScriptUrl, onProgress } = options;

  if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
    return {
      success: false,
      error: "Only PDF files (.pdf) are allowed for the Detailed Estimate."
    };
  }

  // Strict 25MB check for Detailed Estimate PDF
  const MAX_FILE_SIZE_MB = 25;
  if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
    const sizeMb = (file.size / (1024 * 1024)).toFixed(1);
    return {
      success: false,
      error: `PDF file size (${sizeMb} MB) exceeds maximum allowed limit of ${MAX_FILE_SIZE_MB} MB. Please upload a compressed PDF.`
    };
  }

  // 1. Get or determine script URL
  const scriptUrl = customScriptUrl || (await getGoogleDriveScriptUrl()) || undefined;

  // 2. Convert to base64 quickly
  let base64Data = "";
  let mimeType = "application/pdf";
  try {
    onProgress?.(12, "Reading and preparing Detailed Estimate PDF...");
    const converted = await fileToBase64(file);
    base64Data = converted.base64Data;
    mimeType = converted.mimeType || "application/pdf";
    onProgress?.(25, "Uploading PDF to Google Drive (keralagwd@gmail.com)...");
  } catch (prepErr: any) {
    return {
      success: false,
      error: prepErr?.message || "Failed to prepare PDF file for upload."
    };
  }

  // 3. Format filename: Detailed_Estimate_<tenderNo>_<originalName>
  const cleanTenderNo = tenderNo ? String(tenderNo).replace(/[/\\?%*:|"<>]/g, '_').trim() : 'Draft';
  const cleanOriginalName = String(file.name).replace(/[/\\?%*:|"<>]/g, '_').trim();
  const fileName = `Detailed_Estimate_${cleanTenderNo}_${cleanOriginalName}`;

  // Helper function for local server fallback upload
  const uploadToServerStorage = async (): Promise<DriveUploadResult> => {
    try {
      onProgress?.(60, "Storing Detailed Estimate PDF securely on server...");
      const serverRes = await fetch("/api/tender/upload-estimate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          base64Data,
          fileName: cleanOriginalName,
          officeLocation,
          tenderNo: cleanTenderNo,
        }),
      });
      const serverData = await serverRes.json();
      if (serverData.success) {
        onProgress?.(100, "Detailed Estimate PDF uploaded successfully!");
        return {
          success: true,
          url: serverData.url || serverData.viewUrl,
          viewUrl: serverData.viewUrl || serverData.url,
          fileName: serverData.fileName || fileName,
          fileId: serverData.fileId || '',
          isLocalStorage: true,
        };
      }
      return {
        success: false,
        error: serverData.error || "Failed to upload Detailed Estimate to server storage."
      };
    } catch (err: any) {
      return {
        success: false,
        error: err?.message || "Failed to upload to server storage."
      };
    }
  };

  // If no script URL is configured at all, go straight to server storage fallback
  if (!scriptUrl) {
    return await uploadToServerStorage();
  }

  try {
    const data: DriveUploadResult = await postJsonWithProgress(
      "/api/drive-upload",
      {
        base64Data,
        fileName,
        mimeType,
        officeLocation,
        rootFolder: "GWD_e-Tender",
        skipSubFolder: true,
        type: "document",
        customScriptUrl: scriptUrl,
      },
      onProgress,
      25,
      92,
      "Uploading Detailed Estimate to Google Drive..."
    );

    if (data.success) {
      onProgress?.(100, "Detailed Estimate PDF uploaded successfully!");
      return data;
    }

    // If Google Drive requires setup or returned an error, fallback to server storage
    console.warn("Google Drive upload failed or requires setup, falling back to server storage:", data.error);
    return await uploadToServerStorage();
  } catch (netErr: any) {
    console.warn("Network error during Google Drive upload, falling back to server storage:", netErr);
    return await uploadToServerStorage();
  }
}

export interface StaffPhotoUploadOptions {
  file: File;
  officeLocation?: string;
  pen?: string;
  staffName?: string;
  customScriptUrl?: string;
  onProgress?: (percent: number, statusText: string) => void;
}

/**
 * Uploads a Staff Member Photo directly into Google Drive under keralagwd@gmail.com.
 * Folder structure: My Drive > GWD_Staff_Photos > [Office Location (e.g. Kollam)] > [Staff_PEN_Name_photo.jpg]
 */
export async function uploadStaffPhotoToGoogleDrive(
  options: StaffPhotoUploadOptions
): Promise<DriveUploadResult> {
  const { file, officeLocation = "General", pen = "", staffName = "", customScriptUrl, onProgress } = options;

  if (!file.type.startsWith('image/')) {
    return {
      success: false,
      error: "Only image files (.jpg, .jpeg, .png, .webp) are allowed for staff photos."
    };
  }

  // Strict 25MB check
  const MAX_FILE_SIZE_MB = 25;
  if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
    const sizeMb = (file.size / (1024 * 1024)).toFixed(1);
    return {
      success: false,
      error: `Photo file size (${sizeMb} MB) exceeds maximum allowed limit of ${MAX_FILE_SIZE_MB} MB. Please select or compress your file.`
    };
  }

  // 1. Get or determine script URL
  const scriptUrl = customScriptUrl || (await getGoogleDriveScriptUrl()) || undefined;

  // 2. Compress image client-side to ~150-250KB for rapid upload
  let base64Data = "";
  let mimeType = "image/jpeg";
  try {
    onProgress?.(12, "Compressing staff photo...");
    const compressed = await compressImage(file, 1600, 0.85);
    base64Data = compressed.base64Data;
    mimeType = compressed.mimeType || "image/jpeg";
    onProgress?.(25, "Uploading photo to Google Drive (keralagwd@gmail.com)...");
  } catch (prepErr: any) {
    return {
      success: false,
      error: prepErr?.message || "Failed to compress staff photo for upload."
    };
  }

  // 3. Format filename: Staff_<pen>_<name>_photo.jpg
  const cleanPen = pen ? String(pen).replace(/[/\\?%*:|"<>]/g, '_').trim() : '';
  const cleanName = staffName ? String(staffName).replace(/[/\\?%*:|"<>]/g, '_').trim() : '';
  const fileName = `Staff_${cleanPen ? cleanPen + '_' : ''}${cleanName ? cleanName + '_' : ''}photo.jpg`;

  try {
    const data: DriveUploadResult = await postJsonWithProgress(
      "/api/drive-upload",
      {
        base64Data,
        fileName,
        mimeType,
        officeLocation,
        fileNo: "",
        siteName: "",
        subFolder: "",
        rootFolder: "GWD_Staff_Photos",
        skipSubFolder: true,
        type: "staff_photo",
        customScriptUrl: scriptUrl,
      },
      onProgress,
      25,
      92,
      `Uploading Staff Photo to Google Drive (keralagwd@gmail.com - GWD_Staff_Photos / ${officeLocation})...`
    );

    if (data.success) {
      onProgress?.(100, "Staff photo uploaded successfully!");
    }
    return data;
  } catch (netErr: any) {
    console.error("Network error during staff photo upload:", netErr);
    return {
      success: false,
      error: netErr?.message || "Failed to communicate with Google Drive upload service."
    };
  }
}

const googleDriveUploadClient = {
  getGoogleDriveScriptUrl,
  saveGoogleDriveScriptUrl,
  compressImage,
  fileToBase64,
  uploadMediaToGoogleDrive,
  uploadTenderEstimateToGoogleDrive,
  uploadStaffPhotoToGoogleDrive,
};

export default googleDriveUploadClient;


