// src/app/api/system-settings/google-drive/route.ts
import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const CONFIG_PATH = path.join(process.cwd(), "google-drive-settings.json");

export async function GET() {
  try {
    if (fs.existsSync(CONFIG_PATH)) {
      const content = fs.readFileSync(CONFIG_PATH, "utf-8");
      const data = JSON.parse(content);
      if (data.scriptUrl) {
        return NextResponse.json({ success: true, scriptUrl: data.scriptUrl });
      }
    }

    if (process.env.GOOGLE_DRIVE_SCRIPT_URL) {
      return NextResponse.json({ success: true, scriptUrl: process.env.GOOGLE_DRIVE_SCRIPT_URL });
    }

    return NextResponse.json({ success: true, scriptUrl: null });
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

    fs.writeFileSync(CONFIG_PATH, JSON.stringify(configData, null, 2), "utf-8");
    process.env.GOOGLE_DRIVE_SCRIPT_URL = trimmed;

    return NextResponse.json({ success: true, scriptUrl: trimmed });
  } catch (err: any) {
    console.error("Error saving Google Drive settings:", err);
    return NextResponse.json({ success: false, error: err?.message || "Internal server error" }, { status: 500 });
  }
}
