### Implementation Plan: Downloads Page & Google Drive Integration

This plan outlines the addition of a 'Downloads' page to the application, allowing Super Admins to upload documents and Sub Office Admins to download them, with files stored in a 'Downloads' folder on the `keralagwd@gmail.com` Google Drive account.

### User Review & Critical Decisions

> [!IMPORTANT]
> To ensure documents are saved to the correct Drive account (`keralagwd@gmail.com`), you **must** select this account when the Google authorization prompt appears. If your browser defaults to another account, you must select "Switch account" within the Google consent window.

- **Confirmed Decision**: Implement a dedicated 'Downloads' page for both Super Admin and Sub Office Admin profiles.
- **Confirmed Decision**: Integrate Google Drive API for storage, requiring OAuth authorization with the `drive.file` scope.

### 1. Overview & Core Concept

- **What It Does**: Provides a centralized location for uploading and downloading official documents.
- **Workflow**:
    - **Super Admin**: Uploads files -> App saves to 'Downloads' folder in `keralagwd@gmail.com` Drive -> Files are listed.
    - **Sub Office Admin**: Browses the list -> Downloads files.

### 2. User Experience & Visual Design

- **Page Layout**: A table-based interface showing:
    - Document Name/Title
    - Upload Date
    - Download button (for all)
    - Delete button (Super Admin only)
- **Super Admin**: Includes a prominent "Upload Document" button that opens a file picker/uploader.
- **Sub Office Admin**: Only shows the list of documents with download functionality.

### 3. Technical Architecture & Data Strategy

- **Authentication**: Re-enable OAuth with `https://www.googleapis.com/auth/drive.file`.
- **Storage**: Files are managed via Google Drive API:
    - App will search for a folder named "Downloads".
    - If not found, it will be created automatically.
    - Files will be uploaded to this folder using the Drive `files.create` method.
- **State Management**: React state will be used to track the list of uploaded files fetched from Google Drive.

```
┌─────────────────────────────────┐
│         Frontend (UI)           │
│  (DownloadsPage.tsx)            │
└──────────────┬──────────────────┘
               │
┌──────────────▼──────────────────┐
│        Google Drive API         │
│  (List, Upload, Download, Delete)│
└─────────────────────────────────┘
```

### 4. Key Considerations

- **Account Management**: Authorization must be strictly linked to `keralagwd@gmail.com`.
- **Error Handling**: Graceful handling of Drive authorization failures or folder access issues.
