// src/lib/googleDriveConstants.ts

export const DEFAULT_DRIVE_FOLDER_NAME = "GWD_Site_Media";
export const E_TENDER_DRIVE_FOLDER_NAME = "GWD_e-Tender";
export const STAFF_PHOTOS_DRIVE_FOLDER_NAME = "GWD_Staff_Photos";

export const GOOGLE_APPS_SCRIPT_CODE = `/**
 * =========================================================================
 * GROUND WATER DEPARTMENT, KERALA (keralagwd@gmail.com)
 * Google Drive Automated File Receiver & Storage Manager for Dashboard
 * Supports:
 *  - Staff Photos: GWD_Staff_Photos / [Office Location]
 *  - e-Tender Detailed Estimates: GWD_e-Tender / [Sub-Office]
 *  - Site Media: GWD_Site_Media / [Office Location] / [File No - Site Name]
 *  - Storage Quota Monitoring (used GB out of total GB)
 * =========================================================================
 * 
 * Instructions:
 * 1. Open https://script.google.com while signed in as keralagwd@gmail.com
 * 2. Click "New Project" (or edit existing) and replace all contents with this script.
 * 3. Click "Deploy" -> "New deployment" (or "Manage deployments" -> edit -> new version)
 * 4. Select type: "Web app"
 * 5. Configuration:
 *    - Description: "GWD Kerala Drive Upload & Storage Receiver"
 *    - Execute as: "Me (keralagwd@gmail.com)"
 *    - Who has access: "Anyone"
 * 6. Click "Deploy", Authorize access when prompted.
 * 7. Copy the "Web app URL" and paste it into Settings -> Google Drive!
 */

function doGet(e) {
  var quota = getStorageDetails();
  return ContentService.createTextOutput(JSON.stringify({
    status: "active",
    account: "keralagwd@gmail.com",
    service: "GWD Kerala Google Drive File Receiver",
    timestamp: new Date().toISOString(),
    storage: quota
  })).setMimeType(ContentService.MimeType.JSON);
}

function getStorageDetails() {
  var usedBytes = 0;
  var limitBytes = 0;
  try {
    usedBytes = DriveApp.getStorageUsed();
  } catch (e1) {
    usedBytes = 0;
  }
  try {
    limitBytes = DriveApp.getStorageLimit();
  } catch (e2) {
    limitBytes = 15 * 1024 * 1024 * 1024; // Default 15 GB
  }

  // Fallback if limitBytes is reported as 0 or undefined for standard Google accounts
  if (!limitBytes || limitBytes <= 0) {
    limitBytes = 15 * 1024 * 1024 * 1024;
  }

  var usedGB = (usedBytes / (1024 * 1024 * 1024));
  var limitGB = (limitBytes / (1024 * 1024 * 1024));
  var usedGBFixed = Number(usedGB.toFixed(2));
  var limitGBFixed = Number(limitGB.toFixed(2));
  var percentUsed = limitBytes > 0 ? Math.min(100, Math.round((usedBytes / limitBytes) * 100)) : 0;
  var freeBytes = Math.max(0, limitBytes - usedBytes);
  var freeGBFixed = Number((freeBytes / (1024 * 1024 * 1024)).toFixed(2));

  return {
    usedBytes: usedBytes,
    limitBytes: limitBytes,
    freeBytes: freeBytes,
    usedGB: usedGBFixed,
    limitGB: limitGBFixed,
    freeGB: freeGBFixed,
    percentUsed: percentUsed,
    displayText: usedGBFixed + " GB used out of " + limitGBFixed + " GB"
  };
}

function doPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) {
      return ContentService.createTextOutput(JSON.stringify({
        success: false,
        error: "No payload received"
      })).setMimeType(ContentService.MimeType.JSON);
    }

    var data = JSON.parse(e.postData.contents);

    // Handle storage quota check action
    if (data.action === "getStorageQuota" || data.action === "quota" || data.action === "status") {
      var storageInfo = getStorageDetails();
      return ContentService.createTextOutput(JSON.stringify({
        success: true,
        account: "keralagwd@gmail.com",
        storage: storageInfo
      })).setMimeType(ContentService.MimeType.JSON);
    }

    var rootFolderName = "GWD_Site_Media";
    var isStaffPhoto = (
      data.rootFolder === "GWD_Staff_Photos" || 
      data.type === "staff_photo" || 
      data.type === "staff" || 
      (data.fileName && data.fileName.indexOf("Staff_") === 0)
    );
    var isTenderEstimate = (
      data.rootFolder === "GWD_e-Tender" || 
      data.type === "tender_estimate" || 
      (data.fileName && data.fileName.indexOf("Detailed_Estimate_") === 0)
    );

    if (isStaffPhoto) {
      rootFolderName = "GWD_Staff_Photos";
    } else if (isTenderEstimate) {
      rootFolderName = "GWD_e-Tender";
    } else if (data.rootFolder) {
      rootFolderName = cleanName(data.rootFolder);
    }

    var officeLocation = cleanName(data.officeLocation || "General");

    // Handle explicit folder creation or retrieval (Option 1 & Option 3)
    if (data.action === "createFolder" || data.action === "getFolder") {
      var rFolder = getOrCreateFolder(DriveApp, rootFolderName);
      var oFolder = getOrCreateFolder(rFolder, officeLocation);
      var tgtFolder = oFolder;
      var fldPath = rootFolderName + "/" + officeLocation;

      var fNo = cleanName(data.fileNo || "");
      var sName = cleanName(data.siteName || "");
      var subF = cleanName(data.subFolder || "");

      var sFolderName = subF || fNo || "General";
      if (sName && sName.length > 0 && !subF) {
        sFolderName = (fNo ? fNo + " - " : "") + sName;
      }

      if (sFolderName && sFolderName !== "staff - staff" && sFolderName !== "General - General") {
        tgtFolder = getOrCreateFolder(oFolder, sFolderName);
        fldPath += "/" + sFolderName;
      }

      try {
        tgtFolder.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
      } catch (eShare) {}

      var fldId = tgtFolder.getId();
      var fldUrl = "https://drive.google.com/drive/folders/" + fldId;

      return ContentService.createTextOutput(JSON.stringify({
        success: true,
        action: "createFolder",
        folderId: fldId,
        folderUrl: fldUrl,
        folderName: tgtFolder.getName(),
        folderPath: fldPath,
        officeLocation: officeLocation
      })).setMimeType(ContentService.MimeType.JSON);
    }

    var base64Data = data.base64Data;
    if (!base64Data) {
      return ContentService.createTextOutput(JSON.stringify({
        success: false,
        error: "Missing base64 file data"
      })).setMimeType(ContentService.MimeType.JSON);
    }

    // Strip data URI prefix if present
    if (base64Data.indexOf(",") > -1) {
      base64Data = base64Data.split(",")[1];
    }

    var fileName = data.fileName || ("file_" + new Date().getTime());
    var mimeType = data.mimeType || "application/octet-stream";

    var rootFolder = getOrCreateFolder(DriveApp, rootFolderName);

    // 2. Sub-office / Office Location folder (e.g., Thiruvananthapuram, Kollam, Kottayam, Directorate TVM)
    // Matches case-insensitively so existing 'kollam' or 'Kollam' is reused seamlessly
    var officeFolder = getOrCreateFolder(rootFolder, officeLocation);

    // 3. Target folder determination:
    // For Staff Photos & Tender Estimates:
    // Files sit directly under: My Drive > [Root Folder] > [Office Location]
    var targetFolder = officeFolder;
    var folderPath = rootFolderName + "/" + officeLocation;

    var shouldSkipSubFolder = Boolean(data.skipSubFolder || isStaffPhoto || isTenderEstimate);

    if (!shouldSkipSubFolder && (data.subFolder || data.fileNo || data.siteName)) {
      var fileNo = cleanName(data.fileNo || "");
      var siteName = cleanName(data.siteName || "");
      var subFolder = cleanName(data.subFolder || "");
      
      var siteFolderName = subFolder || fileNo || "General";
      if (siteName && siteName.length > 0 && !subFolder) {
        siteFolderName = (fileNo ? fileNo + " - " : "") + siteName;
      }

      // Ignore dummy "staff - staff" or blank folders
      if (siteFolderName && siteFolderName !== "staff - staff" && siteFolderName !== "General - General") {
        targetFolder = getOrCreateFolder(officeFolder, siteFolderName);
        folderPath += "/" + siteFolderName;
      }
    }

    // 4. Decode base64 and create file
    var decoded = Utilities.base64Decode(base64Data);
    var blob = Utilities.newBlob(decoded, mimeType, fileName);
    var file = targetFolder.createFile(blob);

    // 5. Set sharing permission to "Anyone with the link can view"
    try {
      file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    } catch (shareErr) {
      // Continue even if organization policy restricts public link
    }

    var fileId = file.getId();
    var viewUrl = "https://drive.google.com/file/d/" + fileId + "/view?usp=drivesdk";
    var embedUrl = "https://drive.google.com/file/d/" + fileId + "/preview";
    var downloadUrl = "https://drive.google.com/uc?export=download&id=" + fileId;
    var thumbnailUrl = "https://drive.google.com/thumbnail?id=" + fileId + "&sz=w800";
    var directImageUrl = "https://lh3.googleusercontent.com/d/" + fileId;
    var folderId = targetFolder.getId();
    var folderUrl = "https://drive.google.com/drive/folders/" + folderId;

    return ContentService.createTextOutput(JSON.stringify({
      success: true,
      fileId: fileId,
      fileName: file.getName(),
      viewUrl: viewUrl,
      downloadUrl: downloadUrl,
      embedUrl: embedUrl,
      thumbnailUrl: thumbnailUrl,
      directImageUrl: directImageUrl,
      url: viewUrl,
      folderId: folderId,
      folderUrl: folderUrl,
      folderPath: folderPath,
      officeLocation: officeLocation
    })).setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: err.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

function getOrCreateFolder(parentFolder, name) {
  var targetName = cleanName(name);
  if (!targetName) return parentFolder;
  var folders = parentFolder.getFolders();
  while (folders.hasNext()) {
    var f = folders.next();
    if (f.getName().toLowerCase() === targetName.toLowerCase()) {
      return f;
    }
  }
  return parentFolder.createFolder(targetName);
}

function cleanName(name) {
  if (!name) return "";
  return String(name).replace(/[/\\\\?%*:|"<>]/g, "_").trim();
}
`;
