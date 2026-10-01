// src/app/api/drive-delete/route.ts
import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { DEFAULT_GOOGLE_DRIVE_SCRIPT_URL } from "@/lib/config";

export const dynamic = 'force-dynamic';

function getStoredScriptUrl(): string {
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

export async function POST(req: NextRequest) {
  try {
    const { fileId, customScriptUrl } = await req.json();
    if (!fileId) return NextResponse.json({ success: false, error: "Missing fileId" }, { status: 400 });

    const targetScriptUrl = customScriptUrl || getStoredScriptUrl();
    if (!targetScriptUrl) {
      return NextResponse.json({
        success: false,
        error: "Google Drive Web App URL for keralagwd@gmail.com has not been configured."
      }, { status: 400 });
    }

    // Forward the delete action to Google Apps Script
    const response = await fetch(targetScriptUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "deleteFile", fileId }),
      redirect: "follow",
    });

    const responseText = await response.text();
    if (!response.ok) {
      return NextResponse.json({
        success: false,
        error: `Google Apps Script returned status ${response.status}: ${responseText.slice(0, 200)}`
      }, { status: 502 });
    }

    try {
      const result = JSON.parse(responseText);
      return NextResponse.json(result);
    } catch (parseError) {
      return NextResponse.json({
        success: false,
        error: "Invalid response from Google Drive."
      }, { status: 502 });
    }

  } catch (error: any) {
    console.error("Error in /api/drive-delete:", error);
    return NextResponse.json({
      success: false,
      error: error?.message || "Internal server error during Google Drive deletion"
    }, { status: 500 });
  }
}
