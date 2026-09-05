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
        if (typeof window !== "undefined") {
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
      if (typeof window !== "undefined") {
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
 * Uploads a file (photo or video) to Google Drive under keralagwd@gmail.com.
 * Automatically saves into: GWD_Site_Media / [officeLocation] / [fileNo - siteName]
 */
export async function uploadMediaToGoogleDrive(options: DriveUploadOptions): Promise<DriveUploadResult> {
  const { file, officeLocation = "General", fileNo = "General", siteName = "", type, customScriptUrl } = options;

  // 1. Get or determine script URL
  const scriptUrl = customScriptUrl || (await getGoogleDriveScriptUrl()) || undefined;

  // 2. Video file size check (Google Apps Script / server proxy limit)
  const MAX_VIDEO_SIZE_MB = 25;
  if (type === "video" && file.size > MAX_VIDEO_SIZE_MB * 1024 * 1024) {
    const fileSizeMB = (file.size / (1024 * 1024)).toFixed(1);
    return {
      success: false,
      error: `Video size (${fileSizeMB} MB) exceeds maximum upload limit of ${MAX_VIDEO_SIZE_MB} MB. Please select or record a shorter video.`
    };
  }

  // 3. Prepare payload
  let base64Data = "";
  let mimeType = file.type || (type === "image" ? "image/jpeg" : "video/mp4");

  try {
    if (type === "image") {
      const compressed = await compressImage(file);
      base64Data = compressed.base64Data;
      mimeType = compressed.mimeType;
    } else {
      // For video
      const converted = await fileToBase64(file);
      base64Data = converted.base64Data;
      mimeType = converted.mimeType;
    }
  } catch (prepErr: any) {
    return {
      success: false,
      error: prepErr?.message || "Failed to prepare media file for upload."
    };
  }

  // 4. Send to API route with safety checks
  try {
    const response = await fetch("/api/drive-upload", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        base64Data,
        fileName: file.name,
        mimeType,
        officeLocation,
        fileNo,
        siteName,
        type,
        customScriptUrl: scriptUrl,
      }),
    });

    const responseText = await response.text();
    let data: DriveUploadResult;
    try {
      data = JSON.parse(responseText);
    } catch (e) {
      return {
        success: false,
        error: responseText.includes("413") || responseText.toLowerCase().includes("payload too large")
          ? "File size exceeds server payload limits. Please choose a smaller file."
          : `Server returned non-JSON response: ${responseText.slice(0, 150)}...`
      };
    }
    return data;
  } catch (netErr: any) {
    console.error("Network error during drive upload fetch:", netErr);
    return {
      success: false,
      error: netErr?.message === "Failed to fetch"
        ? "Network connection interrupted or file size exceeded server limits. Please check network connection or reduce file size."
        : (netErr?.message || "Failed to communicate with Google Drive upload service.")
    };
  }
}
