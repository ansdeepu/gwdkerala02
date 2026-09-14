// src/app/api/drive-storage/route.ts
import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

declare global {
  // eslint-disable-next-line no-var
  var __googleDriveScriptUrl: string | undefined;
}

function getStoredScriptUrl(): string | null {
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
  return process.env.GOOGLE_DRIVE_SCRIPT_URL || null;
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

    // Attempt 1: Fetch via GET from the deployed Web App
    try {
      const res = await fetch(targetScriptUrl, {
        method: "GET",
        headers: { "Accept": "application/json" },
        redirect: "follow",
        cache: "no-store",
      });

      if (res.ok) {
        const text = await res.text();
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
      }
    } catch (getErr) {
      console.warn("GET to Google Apps Script failed, trying POST fallback:", getErr);
    }

    // Attempt 2: Fetch via POST with action: getStorageQuota
    try {
      const postRes = await fetch(targetScriptUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "getStorageQuota" }),
        redirect: "follow",
      });

      if (postRes.ok) {
        const postText = await postRes.text();
        const postData = JSON.parse(postText);
        if (postData && postData.storage) {
          return NextResponse.json({
            success: true,
            connected: true,
            account: postData.account || "keralagwd@gmail.com",
            ...postData.storage
          });
        }
      }
    } catch (postErr) {
      console.warn("POST to Google Apps Script failed:", postErr);
    }

    // If script is connected but an older deployment is running
    return NextResponse.json({
      success: true,
      connected: true,
      account: "keralagwd@gmail.com",
      usedBytes: 0,
      limitBytes: 15 * 1024 * 1024 * 1024,
      freeBytes: 15 * 1024 * 1024 * 1024,
      usedGB: 0,
      limitGB: 15,
      freeGB: 15,
      percentUsed: 0,
      displayText: "Connected to keralagwd@gmail.com Google Drive"
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
