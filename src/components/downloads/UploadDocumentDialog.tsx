"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Upload, FileText, AlertCircle } from 'lucide-react';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpload: (file: File, fileName: string) => Promise<boolean>;
  isUploading: boolean;
}

export function UploadDocumentDialog({ open, onOpenChange, onUpload, isUploading }: Props) {
  const [fileName, setFileName] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);

  const getFileExtension = (name: string) => {
    const idx = name.lastIndexOf('.');
    return idx > 0 ? name.substring(idx) : '';
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    if (e.target.files && e.target.files.length > 0) {
      const selectedFile = e.target.files[0];
      
      // Maximum 25MB check
      if (selectedFile.size > 25 * 1024 * 1024) {
        setError(`File size (${(selectedFile.size / (1024 * 1024)).toFixed(1)} MB) exceeds the 25 MB limit.`);
        setFile(null);
        return;
      }

      setFile(selectedFile);
      const ext = getFileExtension(selectedFile.name);
      const nameWithoutExt = ext ? selectedFile.name.substring(0, selectedFile.name.lastIndexOf('.')) : selectedFile.name;
      setFileName(nameWithoutExt);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !fileName.trim()) return;

    setError(null);
    const ext = getFileExtension(file.name);
    let finalName = fileName.trim();
    if (ext && !finalName.toLowerCase().endsWith(ext.toLowerCase())) {
      finalName = `${finalName}${ext}`;
    }

    const success = await onUpload(file, finalName);
    if (success) {
      onOpenChange(false);
      setFileName('');
      setFile(null);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(1)} KB`;
    }
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <Dialog open={open} onOpenChange={(val) => { if (!isUploading) onOpenChange(val); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5 text-primary" />
            Upload Document
          </DialogTitle>
          <DialogDescription>
            Upload official files to the <strong>Upload</strong> folder in Google Drive (keralagwd@gmail.com).
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {error && (
            <div className="p-3 text-xs rounded-md bg-destructive/10 text-destructive border border-destructive/20 flex items-start gap-2">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="doc-file" className="text-xs font-semibold">
              Select Document File *
            </Label>
            <Input
              id="doc-file"
              type="file"
              onChange={handleFileChange}
              disabled={isUploading}
              className="cursor-pointer text-xs"
            />
            {file && (
              <div className="flex items-center justify-between text-[11px] text-muted-foreground bg-muted/40 px-2 py-1 rounded">
                <span className="flex items-center gap-1 truncate max-w-[280px]">
                  <FileText className="h-3.5 w-3.5 text-primary shrink-0" />
                  {file.name}
                </span>
                <span className="shrink-0 font-mono">{formatFileSize(file.size)}</span>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="doc-name" className="text-xs font-semibold">
              Document Title / Name *
            </Label>
            <Input
              id="doc-name"
              value={fileName}
              onChange={(e) => setFileName(e.target.value)}
              placeholder="e.g. Kerala GWD Official Master Form"
              disabled={isUploading}
            />
            {file && (
              <p className="text-[11px] text-muted-foreground">
                Will be saved as: <strong>{fileName.trim() || 'Untitled'}{getFileExtension(file.name)}</strong>
              </p>
            )}
          </div>

          <DialogFooter className="gap-2 sm:gap-0 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isUploading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isUploading || !file || !fileName.trim()}
              className="gap-1.5"
            >
              {isUploading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4" />
                  Upload
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
