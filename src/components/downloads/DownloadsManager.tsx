"use client";

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Loader2,
  Upload,
  Download,
  Trash2,
  RefreshCw,
  FileText,
  ExternalLink,
  AlertCircle,
  CheckCircle2,
  Pencil,
  ArrowUp,
  ArrowDown
} from 'lucide-react';
import { getGoogleDriveScriptUrl } from '@/lib/googleDriveUploadClient';
import { UploadDocumentDialog } from './UploadDocumentDialog';

const LOCAL_STORAGE_ORDER_KEY = "gwd_documents_order_arrangement";

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

  // Rename Dialog states
  const [renameTargetFile, setRenameTargetFile] = useState<any | null>(null);
  const [newTitle, setNewTitle] = useState('');
  const [isRenaming, setIsRenaming] = useState(false);

  const isSuperAdmin = user?.role === 'superAdmin';

  const applySavedOrder = (rawFiles: any[]) => {
    try {
      const savedOrderJson = localStorage.getItem(LOCAL_STORAGE_ORDER_KEY);
      if (!savedOrderJson) return rawFiles;
      const orderIds: string[] = JSON.parse(savedOrderJson);
      if (!Array.isArray(orderIds)) return rawFiles;

      const orderMap = new Map<string, number>();
      orderIds.forEach((id, index) => orderMap.set(id, index));

      return [...rawFiles].sort((a, b) => {
        const orderA = orderMap.has(a.id) ? (orderMap.get(a.id) as number) : 9999;
        const orderB = orderMap.has(b.id) ? (orderMap.get(b.id) as number) : 9999;
        return orderA - orderB;
      });
    } catch {
      return rawFiles;
    }
  };

  const saveOrderToStorage = (orderedFiles: any[]) => {
    try {
      const ids = orderedFiles.map((f) => f.id);
      localStorage.setItem(LOCAL_STORAGE_ORDER_KEY, JSON.stringify(ids));
    } catch (e) {
      console.warn("Could not persist document order arrangement:", e);
    }
  };

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
        // Filter out any internal diagnostic test files
        const testFileNames = ['doc1.txt', 'sample_doc.txt', 'hello.txt', 'test_doc.txt'];
        const cleanFiles = (data.files || []).filter(
          (f: any) => !testFileNames.includes((f.title || '').trim().toLowerCase())
        );
        const ordered = applySavedOrder(cleanFiles);
        setFiles(ordered);
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
      const base64Data = await readFileAsBase64(file);
      const scriptUrl = await getGoogleDriveScriptUrl();

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
      const res = await fetch('/api/drive-delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileId: file.id,
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

  const handleOpenRename = (file: any) => {
    setRenameTargetFile(file);
    setNewTitle(file.title || '');
  };

  const handleConfirmRename = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!renameTargetFile || !newTitle.trim()) return;

    const trimmedNewTitle = newTitle.trim();
    if (trimmedNewTitle === renameTargetFile.title) {
      setRenameTargetFile(null);
      return;
    }

    setIsRenaming(true);
    try {
      const scriptUrl = await getGoogleDriveScriptUrl();
      const res = await fetch('/api/drive-upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'renameFile',
          fileId: renameTargetFile.id,
          newName: trimmedNewTitle,
          customScriptUrl: scriptUrl,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setStatusMessage({
          type: 'success',
          text: `Document renamed to "${data.newName || trimmedNewTitle}".`,
        });
        setRenameTargetFile(null);
        await fetchFiles();
      } else {
        alert('Rename failed: ' + (data.error || 'Unknown error'));
      }
    } catch (err: any) {
      console.error('Rename error:', err);
      alert('Rename error: ' + (err?.message || 'Failed to rename file.'));
    } finally {
      setIsRenaming(false);
    }
  };

  // Arrangement: Move document Up or Down
  const handleMove = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= files.length) return;

    const updated = [...files];
    const [movedItem] = updated.splice(index, 1);
    updated.splice(targetIndex, 0, movedItem);

    setFiles(updated);
    saveOrderToStorage(updated);
    setStatusMessage({
      type: 'success',
      text: `Arrangement updated: "${movedItem.title}" moved ${direction}.`,
    });
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

      {/* Rename Document Dialog Modal */}
      <Dialog open={!!renameTargetFile} onOpenChange={(open) => { if (!open && !isRenaming) setRenameTargetFile(null); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
              <Pencil className="h-4 w-4 text-primary" />
              Rename Document
            </DialogTitle>
            <DialogDescription className="text-xs">
              Change the display title of this official document in Google Drive.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleConfirmRename} className="space-y-4 pt-1">
            <div className="space-y-1.5">
              <Label htmlFor="rename-input" className="text-xs font-semibold">
                Document Name *
              </Label>
              <Input
                id="rename-input"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="Enter new document title"
                disabled={isRenaming}
                autoFocus
              />
            </div>

            <DialogFooter className="gap-2 sm:gap-0 pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setRenameTargetFile(null)}
                disabled={isRenaming}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={isRenaming || !newTitle.trim() || newTitle.trim() === renameTargetFile?.title}
                className="gap-1.5"
              >
                {isRenaming ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save New Name'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

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
                {isSuperAdmin && <TableHead className="w-[80px] text-center">Arrange</TableHead>}
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

                  {/* Super Admin Move Up / Move Down buttons */}
                  {isSuperAdmin && (
                    <TableCell className="text-center p-1">
                      <div className="inline-flex items-center gap-0.5">
                        <Button
                          variant="ghost"
                          size="icon"
                          disabled={idx === 0}
                          onClick={() => handleMove(idx, 'up')}
                          className="h-7 w-7 text-muted-foreground hover:text-foreground"
                          title="Move Up"
                        >
                          <ArrowUp className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          disabled={idx === files.length - 1}
                          onClick={() => handleMove(idx, 'down')}
                          className="h-7 w-7 text-muted-foreground hover:text-foreground"
                          title="Move Down"
                        >
                          <ArrowDown className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  )}

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
                            onClick={() => handleOpenRename(file)}
                            className="h-8 px-2 text-xs text-muted-foreground hover:text-foreground gap-1"
                            title="Rename Document"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                            <span className="hidden sm:inline">Rename</span>
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
