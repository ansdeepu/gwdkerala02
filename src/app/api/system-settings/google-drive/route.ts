// src/app/api/system-settings/google-drive/route.ts
import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

declare global {
  // eslint-disable-next-line no-var
  var __googleDriveScriptUrl: string | undefined;
}

const CONFIG_PATH = path.join(process.cwd(), "google-drive-settings.json");
const TMP_CONFIG_PATH = "/tmp/google-drive-settings.json";

function readScriptUrl(): string | null {
  if (globalThis.__googleDriveScriptUrl) {
    return globalThis.__googleDriveScriptUrl;
  }

  // 1. Check /tmp
  try {
    if (fs.existsSync(TMP_CONFIG_PATH)) {
      const data = JSON.parse(fs.readFileSync(TMP_CONFIG_PATH, "utf-8"));
      if (data.scriptUrl) return data.scriptUrl.trim();
    }
  } catch (e) {}

  // 2. Check process.cwd()
  try {
    if (fs.existsSync(CONFIG_PATH)) {
      const data = JSON.parse(fs.readFileSync(CONFIG_PATH, "utf-8"));
      if (data.scriptUrl) return data.scriptUrl.trim();
    }
  } catch (e) {}

  // 3. Check environment
  if (process.env.GOOGLE_DRIVE_SCRIPT_URL) {
    return process.env.GOOGLE_DRIVE_SCRIPT_URL.trim();
  }

  return null;
}

export async function GET() {
  try {
    const scriptUrl = readScriptUrl();
    return NextResponse.json({ success: true, scriptUrl });
  } catch (err: any) {
    console.error("Error reading Google Drive settings:", err);
    return NextResponse.json({ success: false, error: err?.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { scriptUrl } = body;

    if (!scriptUrl || typeof scriptUrl !== "string") {
      return NextResponse.json({ success: false, error: "Missing or invalid scriptUrl" }, { status: 400 });
    }

    const trimmed = scriptUrl.trim();
    if (!trimmed.startsWith("https://script.google.com/macros/s/")) {
      return NextResponse.json({ 
        success: false, 
        error: "Invalid Google Apps Script URL format. URL must start with https://script.google.com/macros/s/" 
      }, { status: 400 });
    }

    const configData = {
      scriptUrl: trimmed,
      targetAccount: "keralagwd@gmail.com",
      updatedAt: new Date().toISOString(),
    };

    // 1. Set in-memory global
    globalThis.__googleDriveScriptUrl = trimmed;
    process.env.GOOGLE_DRIVE_SCRIPT_URL = trimmed;

    // 2. Write to /tmp (always writable in Cloud Run / Lambda container environments)
    try {
      fs.writeFileSync(TMP_CONFIG_PATH, JSON.stringify(configData, null, 2), "utf-8");
    } catch (tmpErr) {
      console.warn("Notice: could not write to /tmp:", tmpErr);
    }

    // 3. Attempt write to root project path (works in local dev, gracefully skips if read-only container)
    try {
      fs.writeFileSync(CONFIG_PATH, JSON.stringify(configData, null, 2), "utf-8");
    } catch (e) {
      // Container root is read-only (EROFS), which is completely fine since /tmp & memory cache are updated
    }

    return NextResponse.json({ success: true, scriptUrl: trimmed });
  } catch (err: any) {
    console.error("Error saving Google Drive settings:", err);
    return NextResponse.json({ success: false, error: err?.message || "Internal server error" }, { status: 500 });
  }
}

