// src/app/api/drive-storage/route.ts
import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { DEFAULT_GOOGLE_DRIVE_SCRIPT_URL } from "@/lib/config";

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

declare global {
  // eslint-disable-next-line no-var
  var __googleDriveScriptUrl: string | undefined;
}

function getStoredScriptUrl(): string {
  if (globalThis.__googleDriveScriptUrl) {
    return globalThis.__googleDriveScriptUrl;
  }
  try {
    if (fs.existsSync("/tmp/google-drive-settings.json")) {
      const data = JSON.parse(fs.readFileSync("/tmp/google-drive-settings.json", "utf-8"));
      if (data.scriptUrl) return data.scriptUrl.trim();
    }
  } catch (e) {}
  try {
    const configPath = path.join(process.cwd(), "google-drive-settings.json");
    if (fs.existsSync(configPath)) {
      const data = JSON.parse(fs.readFileSync(configPath, "utf-8"));
      if (data.scriptUrl) return data.scriptUrl.trim();
    }
  } catch (e) {}
  return process.env.GOOGLE_DRIVE_SCRIPT_URL || DEFAULT_GOOGLE_DRIVE_SCRIPT_URL;
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const customScriptUrl = searchParams.get("scriptUrl");
    const targetScriptUrl = customScriptUrl || getStoredScriptUrl();

    if (!targetScriptUrl) {
      return NextResponse.json({
        success: false,
        connected: false,
        requiresSetup: true,
        account: "keralagwd@gmail.com",
        error: "Google Drive has not been configured yet."
      });
    }

    let lastErrorText = "";
    let is404 = false;
    let isGoogleLogin = false;

    // Attempt 1: Fetch via GET from the deployed Web App
    try {
      const res = await fetch(targetScriptUrl, {
        method: "GET",
        headers: { "Accept": "application/json" },
        redirect: "follow",
        cache: "no-store",
      });

      const text = await res.text();
      is404 = res.status === 404 || text.includes("ppConfig") || (text.includes("<!DOCTYPE") && text.includes("404"));
      isGoogleLogin = text.includes("accounts.google.com") || text.includes("ServiceLogin");

      if (res.ok && !is404 && !isGoogleLogin) {
        try {
          const data = JSON.parse(text);
          if (data && data.storage) {
            return NextResponse.json({
              success: true,
              connected: true,
              account: data.account || "keralagwd@gmail.com",
              ...data.storage
            });
          }
          if (data && data.status === "active") {
            return NextResponse.json({
              success: true,
              connected: true,
              account: data.account || "keralagwd@gmail.com",
              usedBytes: 0,
              limitBytes: 15 * 1024 * 1024 * 1024,
              freeBytes: 15 * 1024 * 1024 * 1024,
              usedGB: 0,
              limitGB: 15,
              freeGB: 15,
              percentUsed: 0,
              displayText: "Connected to Google Drive"
            });
          }
        } catch (jsonErr) {
          // Continue to POST fallback
        }
      } else {
        lastErrorText = text;
      }
    } catch (getErr: any) {
      console.warn("GET to Google Apps Script failed, trying POST fallback:", getErr);
      lastErrorText = getErr?.message || "";
    }

    if (is404) {
      return NextResponse.json({
        success: false,
        connected: false,
        requiresSetup: true,
        account: "keralagwd@gmail.com",
        error: "Google Drive Web App URL is inactive or expired (HTTP 404). Please copy the latest Web App URL from script.google.com and update Settings."
      });
    }

    if (isGoogleLogin) {
      return NextResponse.json({
        success: false,
        connected: false,
        requiresSetup: true,
        account: "keralagwd@gmail.com",
        error: "Google Drive Web App requires permissions. Ensure 'Who has access' is set to 'Anyone' in script.google.com."
      });
    }

    // Attempt 2: Fetch via POST with action: getStorageQuota
    try {
      const postRes = await fetch(targetScriptUrl, {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify({ action: "getStorageQuota" }),
        redirect: "follow",
      });

      const postText = await postRes.text();
      const postIs404 = postRes.status === 404 || postText.includes("ppConfig");
      if (postIs404) {
        return NextResponse.json({
          success: false,
          connected: false,
          requiresSetup: true,
          account: "keralagwd@gmail.com",
          error: "Google Drive Web App URL is inactive or expired (HTTP 404)."
        });
      }

      if (postRes.ok) {
        try {
          const postData = JSON.parse(postText);
          if (postData && postData.storage) {
            return NextResponse.json({
              success: true,
              connected: true,
              account: postData.account || "keralagwd@gmail.com",
              ...postData.storage
            });
          }
        } catch (e) {}
      }
    } catch (postErr) {
      console.warn("POST to Google Apps Script failed:", postErr);
    }

    return NextResponse.json({
      success: false,
      connected: false,
      requiresSetup: true,
      account: "keralagwd@gmail.com",
      error: "Could not connect to Google Apps Script. Please verify your Web App URL in Settings."
    });

  } catch (error: any) {
    console.error("Error checking Drive storage quota:", error);
    return NextResponse.json({
      success: false,
      connected: false,
      error: error?.message || "Could not retrieve Google Drive storage details."
    }, { status: 500 });
  }
}
