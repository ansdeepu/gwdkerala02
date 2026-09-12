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
  error?: string;
  requiresSetup?: boolean;
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

export async function saveGoogleDriveScriptUrl(scriptUrl: string): Promise<{ success: boolean; error?: string }> {
  try {
    const trimmed = scriptUrl.trim();
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
 * Uploads a file (photo or video) to Google Drive under keralagwd@gmail.com.
 * Automatically saves into: GWD_Site_Media / [officeLocation] / [fileNo - siteName]
 */
export async function uploadMediaToGoogleDrive(options: DriveUploadOptions): Promise<DriveUploadResult> {
  const { file, officeLocation = "General", fileNo = "General", siteName = "", type, customScriptUrl, onProgress } = options;

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
        officeLocation,
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
    }
    return data;
  } catch (netErr: any) {
    console.error("Network error during tender estimate upload:", netErr);
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
};

export default googleDriveUploadClient;


