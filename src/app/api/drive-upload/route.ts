// src/app/api/drive-upload/route.ts
import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { DEFAULT_GOOGLE_DRIVE_SCRIPT_URL } from "@/lib/config";

export const dynamic = 'force-dynamic';
export const maxDuration = 60; // 60 seconds timeout for video uploads

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

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { 
      action,
      base64Data: providedBase64, 
      fileName, 
      mimeType, 
      officeLocation, 
      fileNo, 
      siteName, 
      type, 
      customScriptUrl,
      rootFolder,
      skipSubFolder,
      subFolder
    } = body;

    const isFolderAction = action === "createFolder" || action === "getFolder";
    const isListAction = action === "listFolderMedia" || action === "listMedia" || action === "listFiles";

    // For folder creation, if base64Data is missing, create a small placeholder info blob
    // so older deployed Google Apps Scripts won't fail with 'Missing base64 file data'
    let effectiveBase64 = providedBase64;
    if (!effectiveBase64 && isFolderAction) {
      const placeholderText = `Ground Water Department, Kerala\nSite Folder Initialized\nFile No: ${fileNo || 'General'}\nSite: ${siteName || 'General'}\nOffice: ${officeLocation || 'General'}\nTimestamp: ${new Date().toISOString()}`;
      effectiveBase64 = Buffer.from(placeholderText).toString('base64');
    }

    if (!effectiveBase64 && !isFolderAction && !isListAction) {
      return NextResponse.json({ success: false, error: "Missing base64Data" }, { status: 400 });
    }

    // Determine the Google Apps Script Web App URL
    const targetScriptUrl = customScriptUrl || getStoredScriptUrl();

    if (!targetScriptUrl) {
      return NextResponse.json({
        success: false,
        requiresSetup: true,
        error: "Google Drive Web App URL for keralagwd@gmail.com has not been configured yet."
      }, { status: 400 });
    }

    // Forward to Google Apps Script
    // Using text/plain;charset=utf-8 ensures Google's 302/307 redirect proxy forwards the POST payload seamlessly
    const payloadString = JSON.stringify({
      action,
      base64Data: effectiveBase64,
      fileName: fileName || (isFolderAction ? "_folder_info.txt" : `file_${Date.now()}`),
      mimeType: mimeType || (isFolderAction ? "text/plain" : "application/octet-stream"),
      officeLocation,
      fileNo,
      siteName,
      type,
      rootFolder,
      skipSubFolder,
      subFolder,
    });

    const response = await fetch(targetScriptUrl, {
      method: "POST",
      headers: {
        "Content-Type": "text/plain;charset=utf-8",
      },
      body: payloadString,
      redirect: "follow",
    });

    const responseText = await response.text();

    const isHtml = responseText.toLowerCase().includes("<!doctype") || responseText.toLowerCase().includes("<html");
    const is404 = response.status === 404 || responseText.includes("ppConfig") || (isHtml && responseText.includes("404"));
    const isGoogleLogin = responseText.includes("accounts.google.com") || responseText.includes("ServiceLogin");

    if (is404) {
      return NextResponse.json({
        success: false,
        error: "Google Drive Web App URL is inactive, expired, or invalid (HTTP 404). Please open script.google.com, copy the active Web App URL from 'Deploy' > 'Manage deployments', and update Settings > Google Drive."
      }, { status: 502 });
    }

    if (isGoogleLogin) {
      return NextResponse.json({
        success: false,
        error: "Google Drive Web App requires authorization. Please open script.google.com, click 'Deploy' > 'Manage deployments', and ensure 'Who has access' is set to 'Anyone'."
      }, { status: 502 });
    }

    if (!response.ok) {
      return NextResponse.json({
        success: false,
        error: `Google Apps Script returned status ${response.status}: ${isHtml ? "Unexpected HTML response" : responseText.slice(0, 200)}`
      }, { status: 502 });
    }

    try {
      const result = JSON.parse(responseText);
      return NextResponse.json(result);
    } catch (parseError) {
      console.error("Non-JSON response from Google Apps Script:", responseText);

      let userError = "Google Apps Script returned an invalid response.";
      if (isHtml) {
        userError = "Google Apps Script returned an unexpected HTML page. Please verify your Web App deployment in script.google.com ('Who has access' must be 'Anyone').";
      }

      return NextResponse.json({
        success: false,
        error: userError,
        rawPreview: responseText.slice(0, 200)
      }, { status: 502 });
    }

  } catch (error: any) {
    console.error("Error in /api/drive-upload:", error);
    return NextResponse.json({
      success: false,
      error: error?.message || "Internal server error during Google Drive upload"
    }, { status: 500 });
  }
}
