// src/lib/googleDriveConstants.ts

export const DEFAULT_DRIVE_FOLDER_NAME = "GWD_Site_Media";

export const GOOGLE_APPS_SCRIPT_CODE = `/**
 * =========================================================================
 * GROUND WATER DEPARTMENT, KERALA (keralagwd@gmail.com)
 * Google Drive Automated Media Receiver for Dashboard
 * =========================================================================
 * 
 * Instructions:
 * 1. Open https://script.google.com while signed in as keralagwd@gmail.com
 * 2. Click "New Project" and replace all contents with this script.
 * 3. Click "Deploy" -> "New deployment"
 * 4. Select type: "Web app"
 * 5. Configuration:
 *    - Description: "GWD Site Media Upload"
 *    - Execute as: "Me (keralagwd@gmail.com)"
 *    - Who has access: "Anyone" (allows department staff to upload without password)
 * 6. Click "Deploy", Authorize access when prompted.
 * 7. Copy the "Web app URL" and paste it into the Dashboard Media Gallery setup!
 */

function doGet(e) {
  return ContentService.createTextOutput(JSON.stringify({
    status: "active",
    account: "keralagwd@gmail.com",
    service: "GWD Kerala Google Drive Media Upload Receiver",
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

    // Strip data URI prefix if present (e.g., "data:image/jpeg;base64,")
    if (base64Data.indexOf(",") > -1) {
      base64Data = base64Data.split(",")[1];
    }

    var fileName = data.fileName || ("media_" + new Date().getTime());
    var mimeType = data.mimeType || "image/jpeg";
    var officeLocation = cleanName(data.officeLocation || "General");
    var fileNo = cleanName(data.fileNo || "General");
    var siteName = cleanName(data.siteName || "");
    var mediaType = data.type || "image";

    // 1. Root folder: GWD_Site_Media
    var rootFolderName = "GWD_Site_Media";
    var rootFolders = DriveApp.getFoldersByName(rootFolderName);
    var rootFolder = rootFolders.hasNext() ? rootFolders.next() : DriveApp.createFolder(rootFolderName);

    // 2. Office location folder (e.g., Kollam, Thiruvananthapuram)
    var officeFolders = rootFolder.getFoldersByName(officeLocation);
    var officeFolder = officeFolders.hasNext() ? officeFolders.next() : rootFolder.createFolder(officeLocation);

    // 3. Site folder (e.g., "1319_2026 - Taluk Hospital Punalur")
    var siteFolderName = fileNo;
    if (siteName && siteName.length > 0) {
      siteFolderName += " - " + siteName;
    }
    var siteFolders = officeFolder.getFoldersByName(siteFolderName);
    var targetFolder = siteFolders.hasNext() ? siteFolders.next() : officeFolder.createFolder(siteFolderName);

    // 4. Decode base64 and create file
    var decoded = Utilities.base64Decode(base64Data);
    var blob = Utilities.newBlob(decoded, mimeType, fileName);
    var file = targetFolder.createFile(blob);

    // 5. Set sharing permission to "Anyone with the link can view" so thumbnails and in-app streaming work
    try {
      file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    } catch (shareErr) {
      // Continue even if organization policy restricts public link
    }

    var fileId = file.getId();
    var viewUrl = "https://drive.google.com/file/d/" + fileId + "/view?usp=drivesdk";
    var embedUrl = "https://drive.google.com/file/d/" + fileId + "/preview";
    var thumbnailUrl = "https://drive.google.com/thumbnail?id=" + fileId + "&sz=w800";
    var directImageUrl = "https://lh3.googleusercontent.com/d/" + fileId;

    return ContentService.createTextOutput(JSON.stringify({
      success: true,
      fileId: fileId,
      fileName: file.getName(),
      viewUrl: viewUrl,
      embedUrl: embedUrl,
      thumbnailUrl: thumbnailUrl,
      directImageUrl: directImageUrl,
      url: mediaType === "video" ? viewUrl : directImageUrl,
      folderPath: rootFolderName + "/" + officeLocation + "/" + siteFolderName
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
