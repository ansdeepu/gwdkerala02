"use client";

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, Upload, Download, Trash2, RefreshCw, FileText, ExternalLink, AlertCircle, CheckCircle2 } from 'lucide-react';
import { getGoogleDriveScriptUrl } from '@/lib/googleDriveUploadClient';
import { UploadDocumentDialog } from './UploadDocumentDialog';

function readFileAsBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const result = reader.result as string;
        const base64 = result.includes(',') ? result.split(',')[1] : result;
        resolve(base64);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = () => reject(new Error('Failed to read selected file'));
    reader.readAsDataURL(file);
  });
}

export function DownloadsManager() {
  const { user } = useAuth();
  const [files, setFiles] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const isSuperAdmin = user?.role === 'superAdmin';

  const fetchFiles = useCallback(async () => {
    setIsLoading(true);
    setStatusMessage(null);
    try {
      const scriptUrl = await getGoogleDriveScriptUrl();
      const res = await fetch('/api/drive-upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'listFolderMedia',
          rootFolder: 'Upload',
          officeLocation: 'General',
          subFolder: 'General - General',
          customScriptUrl: scriptUrl,
        }),
      });

      if (!res.ok) {
        throw new Error(`Server returned HTTP ${res.status}`);
      }

      const data = await res.json();
      if (data.success) {
        // Filter out any diagnostic test files that were created during upload pipeline testing
        const testFileNames = ['doc1.txt', 'sample_doc.txt', 'hello.txt', 'test_doc.txt'];
        const cleanFiles = (data.files || []).filter(
          (f: any) => !testFileNames.includes((f.title || '').trim().toLowerCase())
        );
        setFiles(cleanFiles);
      } else {
        console.warn('Could not list folder media:', data.error);
        setFiles([]);
      }
    } catch (err: any) {
      console.error('Failed to fetch files from Google Drive:', err);
      setStatusMessage({
        type: 'error',
        text: 'Unable to connect to Google Drive (keralagwd@gmail.com). Please check your connection or retry.',
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFiles();
  }, [fetchFiles]);

  const handleUpload = async (file: File, fileName: string): Promise<boolean> => {
    setIsUploading(true);
    setStatusMessage(null);

    try {
      // 1. Read file as base64 safely via Promise
      const base64Data = await readFileAsBase64(file);
      const scriptUrl = await getGoogleDriveScriptUrl();

      // 2. Call backend proxy route
      const res = await fetch('/api/drive-upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          base64Data,
          fileName,
          mimeType: file.type || 'application/octet-stream',
          rootFolder: 'Upload',
          officeLocation: 'General',
          skipSubFolder: true,
          subFolder: 'General - General',
          customScriptUrl: scriptUrl,
        }),
      });

      if (!res.ok) {
        const errorText = await res.text();
        let message = `Upload failed (Status ${res.status})`;
        try {
          const parsed = JSON.parse(errorText);
          if (parsed.error) message = parsed.error;
        } catch {
          if (errorText.length > 0) message = errorText.slice(0, 150);
        }
        throw new Error(message);
      }

      const data = await res.json();

      if (data.success) {
        setStatusMessage({
          type: 'success',
          text: `Document "${fileName}" was successfully uploaded to Google Drive.`,
        });
        await fetchFiles();
        return true;
      } else {
        throw new Error(data.error || 'Google Drive upload returned an unsuccessful response.');
      }
    } catch (err: any) {
      console.error('Document upload error:', err);
      const msg = err?.message || 'Failed to communicate with Google Drive service. Please check your network and try again.';
      setStatusMessage({
        type: 'error',
        text: msg,
      });
      alert(`Upload error: ${msg}`);
      return false;
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (file: any) => {
    if (!confirm(`Are you sure you want to delete "${file.title}"?`)) return;

    setDeletingId(file.id);
    try {
      const scriptUrl = await getGoogleDriveScriptUrl();
      // Pass dummy base64Data to bypass validation in GAS
      const res = await fetch('/api/drive-delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileId: file.id,
          base64Data: "R1dF", 
          customScriptUrl: scriptUrl,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setStatusMessage({
          type: 'success',
          text: `"${file.title}" has been deleted.`,
        });
        await fetchFiles();
      } else {
        alert('Delete failed: ' + (data.error || 'Unknown error'));
      }
    } catch (err: any) {
      console.error('Delete error:', err);
      alert('Delete error: ' + (err?.message || 'Failed to delete file.'));
    } finally {
      setDeletingId(null);
    }
  };

  const handleRename = async (file: any, newName: string) => {
    try {
      const scriptUrl = await getGoogleDriveScriptUrl();
      const res = await fetch('/api/drive-upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'renameFile',
          fileId: file.id,
          newName: newName,
          customScriptUrl: scriptUrl,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setStatusMessage({ type: 'success', text: `Renamed to "${data.newName}".` });
        await fetchFiles();
      } else {
        alert('Rename failed: ' + data.error);
      }
    } catch (err: any) {
      alert('Rename error: ' + err.message);
    }
  };

  return (
    <div className="space-y-4">
      {statusMessage && (
        <div
          className={`p-3 text-sm rounded-lg flex items-center justify-between border ${
            statusMessage.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800'
              : 'bg-rose-50 text-rose-800 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800'
          }`}
        >
          <div className="flex items-center gap-2">
            {statusMessage.type === 'success' ? (
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
            ) : (
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-600 dark:text-rose-400" />
            )}
            <span>{statusMessage.text}</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setStatusMessage(null)}
            className="h-6 px-2 text-xs"
          >
            Dismiss
          </Button>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          {isSuperAdmin && (
            <Button onClick={() => setIsDialogOpen(true)} className="gap-2">
              <Upload className="h-4 w-4" />
              Upload Document
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={fetchFiles}
            disabled={isLoading}
            className="gap-1.5 text-xs"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        <p className="text-xs text-muted-foreground">
          Storage: <strong>Upload</strong> folder in <code>keralagwd@gmail.com</code>
        </p>
      </div>

      {isSuperAdmin && (
        <UploadDocumentDialog
          open={isDialogOpen}
          onOpenChange={setIsDialogOpen}
          onUpload={handleUpload}
          isUploading={isUploading}
        />
      )}

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3 border rounded-xl bg-card">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading documents from Google Drive...</p>
        </div>
      ) : files.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3 border rounded-xl bg-card text-center px-4">
          <FileText className="h-10 w-10 text-muted-foreground/40" />
          <div>
            <h3 className="font-semibold text-sm">No documents found</h3>
            <p className="text-xs text-muted-foreground mt-1 max-w-sm">
              {isSuperAdmin
                ? 'No documents have been uploaded to the "Upload" folder yet. Click "Upload Document" to add official files.'
                : 'No official documents have been uploaded yet. Check back later.'}
            </p>
          </div>
          {isSuperAdmin && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsDialogOpen(true)}
              className="mt-2 gap-1.5"
            >
              <Upload className="h-3.5 w-3.5" />
              Upload First Document
            </Button>
          )}
        </div>
      ) : (
        <div className="border rounded-xl bg-card overflow-hidden shadow-xs">
          <Table>
            <TableHeader className="bg-muted/40">
              <TableRow>
                <TableHead className="w-[50px]">#</TableHead>
                <TableHead>Document Name</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {files.map((file, idx) => (
                <TableRow key={file.id || idx}>
                  <TableCell className="font-mono text-xs text-muted-foreground">
                    {idx + 1}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-primary shrink-0" />
                      <span className="font-medium text-sm text-foreground">
                        {file.title || 'Untitled Document'}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      {file.viewUrl && (
                        <Button
                          variant="ghost"
                          size="sm"
                          asChild
                          className="h-8 px-2 text-xs gap-1"
                        >
                          <a
                            href={file.viewUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            title="Preview Document in Google Drive"
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                            <span className="hidden sm:inline">Preview</span>
                          </a>
                        </Button>
                      )}
                      {file.downloadUrl && (
                        <Button
                          variant="outline"
                          size="sm"
                          asChild
                          className="h-8 px-2.5 text-xs gap-1 border-primary/30 text-primary hover:bg-primary/5"
                        >
                          <a
                            href={file.downloadUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            title="Download Official Document"
                          >
                            <Download className="h-3.5 w-3.5" />
                            <span>Download</span>
                          </a>
                        </Button>
                      )}
                      {isSuperAdmin && (
                        <>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              const newName = prompt("Enter new name:", file.title);
                              if (newName && newName !== file.title) handleRename(file, newName);
                            }}
                            className="h-8 px-2 text-xs"
                            title="Rename Document"
                          >
                            <FileText className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(file)}
                            disabled={deletingId === file.id}
                            className="h-8 px-2 text-xs text-destructive hover:bg-destructive/10"
                            title="Delete Document"
                          >
                            {deletingId === file.id ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <Trash2 className="h-3.5 w-3.5" />
                            )}
                          </Button>
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
