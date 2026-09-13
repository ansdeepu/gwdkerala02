// src/lib/googleDriveConstants.ts

export const DEFAULT_DRIVE_FOLDER_NAME = "GWD_Site_Media";
export const E_TENDER_DRIVE_FOLDER_NAME = "GWD_e-Tender";
export const STAFF_PHOTOS_DRIVE_FOLDER_NAME = "GWD_Staff_Photos";

export const GOOGLE_APPS_SCRIPT_CODE = `/**
 * =========================================================================
 * GROUND WATER DEPARTMENT, KERALA (keralagwd@gmail.com)
 * Google Drive Automated File Receiver for Dashboard
 * Supports:
 *  - Staff Photos: GWD_Staff_Photos / [Office Location]
 *  - e-Tender Detailed Estimates: GWD_e-Tender / [Sub-Office]
 *  - Site Media: GWD_Site_Media / [Office Location] / [File No - Site Name]
 * =========================================================================
 * 
 * Instructions:
 * 1. Open https://script.google.com while signed in as keralagwd@gmail.com
 * 2. Click "New Project" and replace all contents with this script.
 * 3. Click "Deploy" -> "New deployment"
 * 4. Select type: "Web app"
 * 5. Configuration:
 *    - Description: "GWD Kerala Drive Upload Receiver"
 *    - Execute as: "Me (keralagwd@gmail.com)"
 *    - Who has access: "Anyone" (allows department staff to upload without password)
 * 6. Click "Deploy", Authorize access when prompted.
 * 7. Copy the "Web app URL" and paste it into Settings -> Google Drive!
 */

function doGet(e) {
  return ContentService.createTextOutput(JSON.stringify({
    status: "active",
    account: "keralagwd@gmail.com",
    service: "GWD Kerala Google Drive File Receiver",
    timestamp: new Date().toISOString()
  })).setMimeType(ContentService.MimeType.JSON);
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
    var officeLocation = cleanName(data.officeLocation || "General");
    var mediaType = data.type || "document";

    // 1. Identify destination Root Folder
    // A) Staff Photos: GWD_Staff_Photos
    // B) Tender Estimates: GWD_e-Tender
    // C) Site Media: GWD_Site_Media
    var isStaffPhoto = (
      data.rootFolder === "GWD_Staff_Photos" || 
      data.type === "staff_photo" || 
      data.type === "staff" || 
      fileName.indexOf("Staff_") === 0
    );
    var isTenderEstimate = (
      data.rootFolder === "GWD_e-Tender" || 
      data.type === "tender_estimate" || 
      fileName.indexOf("Detailed_Estimate_") === 0
    );

    var rootFolderName = "GWD_Site_Media";
    if (isStaffPhoto) {
      rootFolderName = "GWD_Staff_Photos";
    } else if (isTenderEstimate) {
      rootFolderName = "GWD_e-Tender";
    } else if (data.rootFolder) {
      rootFolderName = cleanName(data.rootFolder);
    }

    var rootFolders = DriveApp.getFoldersByName(rootFolderName);
    var rootFolder = rootFolders.hasNext() ? rootFolders.next() : DriveApp.createFolder(rootFolderName);

    // 2. Sub-office / Office Location folder (e.g., Thiruvananthapuram, Kollam, Kottayam, Directorate TVM)
    var officeFolders = rootFolder.getFoldersByName(officeLocation);
    var officeFolder = officeFolders.hasNext() ? officeFolders.next() : rootFolder.createFolder(officeLocation);

    // 3. Target folder determination:
    // For Staff Photos & Tender Estimates:
    // Files sit directly under: My Drive > [Root Folder] > [Office Location]
    // Example: GWD_Staff_Photos / Kollam / Staff_PEN_Name_photo.jpg
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
        var siteFolders = officeFolder.getFoldersByName(siteFolderName);
        targetFolder = siteFolders.hasNext() ? siteFolders.next() : officeFolder.createFolder(siteFolderName);
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
      folderPath: folderPath
    })).setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: err.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

function cleanName(name) {
  if (!name) return "";
  return String(name).replace(/[/\\\\?%*:|"<>]/g, "_").trim();
}
`;
