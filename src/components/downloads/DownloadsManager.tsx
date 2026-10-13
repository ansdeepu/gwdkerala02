"use client";

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, Upload, Download, Trash2 } from 'lucide-react';
import { getGoogleDriveScriptUrl } from '@/lib/googleDriveUploadClient';

export function DownloadsManager() {
  const { user } = useAuth();
  const [files, setFiles] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  
  const isSuperAdmin = user?.role === 'superAdmin';

  const fetchFiles = useCallback(async () => {
    setIsLoading(true);
    try {
      const scriptUrl = await getGoogleDriveScriptUrl();
      const res = await fetch('/api/drive-upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'listFolderMedia',
          rootFolder: 'Downloads',
          officeLocation: 'General', // Defaulting as discussed
          customScriptUrl: scriptUrl,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setFiles(data.files || []);
      }
    } catch (err) {
      console.error('Failed to fetch files:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFiles();
  }, [fetchFiles]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const base64Data = (event.target?.result as string).split(',')[1];
        const scriptUrl = await getGoogleDriveScriptUrl();
        const res = await fetch('/api/drive-upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            base64Data,
            fileName: file.name,
            mimeType: file.type,
            rootFolder: 'Downloads',
            officeLocation: 'General',
            customScriptUrl: scriptUrl,
          }),
        });
        const data = await res.json();
        if (data.success) {
          fetchFiles();
        } else {
          alert('Upload failed: ' + (data.error || 'Unknown error'));
        }
        setIsUploading(false);
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error('Upload error:', err);
      setIsUploading(false);
    }
  };

  return (
    <div>
      {isSuperAdmin && (
        <div className="mb-4">
          <input
            type="file"
            onChange={handleUpload}
            className="hidden"
            id="file-upload"
          />
          <Button asChild disabled={isUploading}>
            <label htmlFor="file-upload" className="cursor-pointer">
              {isUploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
              {isUploading ? 'Uploading...' : 'Upload Document'}
            </label>
          </Button>
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center p-4"><Loader2 className="h-8 w-8 animate-spin" /></div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>File Name</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {files.map((file) => (
              <TableRow key={file.id}>
                <TableCell>{file.title}</TableCell>
                <TableCell>
                  <Button variant="ghost" size="sm" asChild>
                    <a href={file.viewUrl} target="_blank" rel="noopener noreferrer">
                      <Download className="h-4 w-4" />
                    </a>
                  </Button>
                  {isSuperAdmin && (
                    <Button variant="ghost" size="sm" className="text-destructive">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
