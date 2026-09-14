// src/components/shared/MediaManager.tsx
"use client";

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  ImagePlus,
  Video,
  PlusCircle,
  Pencil,
  Trash2,
  ChevronLeft,
  ChevronRight,
  X,
  Camera,
  Upload,
  Link as LinkIcon,
  Loader2,
  HardDrive,
  ExternalLink,
  Play,
  Settings2,
  CheckCircle2,
} from 'lucide-react';
import Image from 'next/image';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { SUPER_ADMIN_EMAIL } from '@/lib/config';
import { uploadMediaToGoogleDrive, getGoogleDriveScriptUrl, compressImage, fileToBase64 } from '@/lib/googleDriveUploadClient';
import GoogleDriveSetupDialog from '@/components/shared/GoogleDriveSetupDialog';

interface MediaManagerProps {
  title: string;
  type: 'image' | 'video';
  fields: any[];
  append: (item: any) => void;
  remove: (index: number) => void;
  update: (index: number, item: any) => void;
  isReadOnly: boolean;
  officeLocation?: string;
  fileNo?: string;
  siteName?: string;
}

export default function MediaManager({
  title,
  type,
  fields,
  append,
  remove,
  update,
  isReadOnly,
  officeLocation: propOfficeLocation,
  fileNo: propFileNo,
  siteName: propSiteName,
}: MediaManagerProps) {
  const { user } = useAuth();
  const { toast } = useToast();

  const [isMediaModalOpen, setIsMediaModalOpen] = useState(false);
  const [editingMedia, setEditingMedia] = useState<{ index: number; data: any } | null>(null);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatusText, setUploadStatusText] = useState('');
  const [uploadProgress, setUploadProgress] = useState<{
    percent: number;
    statusText: string;
    fileName: string;
    fileSizeMB: string;
    currentIndex: number;
    totalFiles: number;
  } | null>(null);
  const [isSetupDialogOpen, setIsSetupDialogOpen] = useState(false);
  const [hasDriveConfig, setHasDriveConfig] = useState<boolean | null>(null);

  // Hidden inputs for file browsing and direct mobile camera capture
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const cameraInputRef = useRef<HTMLInputElement | null>(null);

  // Determine effective office location, file number, and site name
  const effectiveOffice = propOfficeLocation || (user as any)?.officeLocation || 'General';
  const effectiveFileNo = propFileNo || 'General';
  const effectiveSiteName = propSiteName || '';

  const isSuperAdmin = 
    user?.role === 'superAdmin' || 
    user?.role === 'admin' || 
    user?.email === 'keralagwd@gmail.com' || 
    user?.email === 'ss.deepu@gmail.com' || 
    user?.email === SUPER_ADMIN_EMAIL;

  // Check if Google Drive is configured
  const checkDriveConfig = useCallback(async () => {
    const url = await getGoogleDriveScriptUrl();
    setHasDriveConfig(!!url);
  }, []);

  useEffect(() => {
    checkDriveConfig();
  }, [checkDriveConfig]);

  const handleAddClick = () => {
    setEditingMedia(null);
    setIsMediaModalOpen(true);
  };

  const handleEditClick = (index: number, data: any) => {
    setEditingMedia({ index, data });
    setIsMediaModalOpen(true);
  };

  const handleMediaSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    e.stopPropagation();
    const formData = new FormData(e.currentTarget);
    const url = (formData.get('url') as string)?.trim();
    const description = (formData.get('description') as string)?.trim();

    if (!url) return;

    if (editingMedia) {
      update(editingMedia.index, { ...editingMedia.data, url, description });
    } else {
      append({
        id: uuidv4(),
        url,
        description,
        storageType: 'link',
        createdAt: new Date().toISOString(),
      });
    }
    setIsMediaModalOpen(false);
  };

  // Helper to extract Google Drive file ID from various Drive URL formats
  const extractDriveFileId = (url: string): string | null => {
    if (!url) return null;
    const match = url.match(/\/d\/([a-zA-Z0-9_-]+)/) || 
                  url.match(/[?&]id=([a-zA-Z0-9_-]+)/) || 
                  url.match(/googleusercontent\.com\/d\/([a-zA-Z0-9_-]+)/);
    if (match && match[1]) return match[1];
    return null;
  };

  const getEmbedUrl = (url: string) => {
    if (!url) return null;
    if (url.includes('youtube.com') || url.includes('youtu.be')) {
      const id = url.split('v=')[1]?.split('&')[0] || url.split('/').pop();
      return `https://www.youtube.com/embed/${id}`;
    }
    if (url.includes('vimeo.com')) {
      const id = url.split('/').pop();
      return `https://player.vimeo.com/video/${id}`;
    }
    const driveId = extractDriveFileId(url);
    if (driveId) {
      return `https://drive.google.com/file/d/${driveId}/preview`;
    }
    return null;
  };

  const getMediaThumbnail = (field: any) => {
    const url = field.url || '';
    if (type === 'video') {
      if (url.includes('youtube.com') || url.includes('youtu.be')) {
        const id = url.split('v=')[1]?.split('&')[0] || url.split('/').pop();
        return `https://img.youtube.com/vi/${id}/hqdefault.jpg`;
      }
      const driveId = field.driveFileId || extractDriveFileId(url) || extractDriveFileId(field.driveViewUrl || '');
      if (driveId) {
        return `https://drive.google.com/thumbnail?id=${driveId}&sz=w800`;
      }
      return null;
    }

    // Image thumbnail
    if (field.driveThumbnailUrl) return field.driveThumbnailUrl;
    const driveId = field.driveFileId || extractDriveFileId(url) || extractDriveFileId(field.driveViewUrl || '');
    if (driveId) {
      return `https://drive.google.com/thumbnail?id=${driveId}&sz=w800`;
    }
    return url;
  };

  // Helper for saving photo/video directly as base64 data URL
  const saveMediaDirectly = async (file: File) => {
    const MAX_LIMIT = 25 * 1024 * 1024;
    if (file.size > MAX_LIMIT) {
      const sizeMb = (file.size / (1024 * 1024)).toFixed(1);
      toast({
        title: "File Exceeds 25MB Limit",
        description: `"${file.name}" (${sizeMb} MB) exceeds the maximum allowed limit of 25MB.`,
        variant: "destructive",
      });
      return;
    }

    if (type === 'image') {
      // Compress with 960px max dimension and 0.65 quality to keep size ~30-50KB to respect Firestore's 1MB limit
      const compressed = await compressImage(file, 960, 0.65);
      const dataUrl = `data:${compressed.mimeType};base64,${compressed.base64Data}`;
      append({
        id: uuidv4(),
        url: dataUrl,
        fileName: file.name,
        description: "",
        storageType: 'direct',
        createdAt: new Date().toISOString(),
      });
      toast({
        title: "Photo Attached to Site Record",
        description: `${file.name} saved directly with optimized compression.`,
      });
    } else {
      // Video files in base64 exceed Firestore's 1MB document limit
      if (file.size > 750 * 1024) {
        toast({
          title: "Google Drive Setup Required for Videos",
          description: `Videos cannot be saved directly into the database because of the 1MB document size limit. Please configure Google Drive in Settings or add a link to YouTube/Google Drive.`,
          variant: "destructive",
          duration: 8000,
        });
        setIsSetupDialogOpen(true);
        return;
      }
      const converted = await fileToBase64(file);
      const dataUrl = `data:${converted.mimeType};base64,${converted.base64Data}`;
      append({
        id: uuidv4(),
        url: dataUrl,
        fileName: file.name,
        description: "",
        storageType: 'direct',
        createdAt: new Date().toISOString(),
      });
      toast({
        title: "Video Attached to Site Record",
        description: `${file.name} saved directly to record media.`,
      });
    }
  };

  // Process file upload(s) to Google Drive or direct record storage
  const handleFilesSelected = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;

    const filesArray = Array.from(fileList);

    // 1. Strict 25MB check across all selected photos and videos
    const MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024;
    for (const file of filesArray) {
      if (file.size > MAX_FILE_SIZE_BYTES) {
        const sizeMb = (file.size / (1024 * 1024)).toFixed(1);
        toast({
          title: "File Exceeds 25MB Limit",
          description: `"${file.name}" (${sizeMb} MB) exceeds maximum allowed size of 25MB. Please choose files up to 25MB.`,
          variant: "destructive",
        });
        if (fileInputRef.current) fileInputRef.current.value = '';
        if (cameraInputRef.current) cameraInputRef.current.value = '';
        return;
      }
    }

    setIsUploading(true);
    const firstFile = filesArray[0];
    const initialSizeMB = (firstFile.size / (1024 * 1024)).toFixed(1);
    setUploadProgress({
      percent: 5,
      statusText: `Preparing 1 of ${filesArray.length}: ${firstFile.name}...`,
      fileName: firstFile.name,
      fileSizeMB: initialSizeMB,
      currentIndex: 1,
      totalFiles: filesArray.length,
    });

    try {
      for (let i = 0; i < filesArray.length; i++) {
        const file = filesArray[i];
        const currentFileName = file.name;
        const currentSizeMB = (file.size / (1024 * 1024)).toFixed(1);
        const currentIndex = i + 1;

        setUploadStatusText(`Processing ${currentIndex} of ${filesArray.length}: ${currentFileName}...`);
        setUploadProgress({
          percent: 10,
          statusText: `Preparing ${type === 'image' ? 'photo' : 'video'} ${currentIndex} of ${filesArray.length}...`,
          fileName: currentFileName,
          fileSizeMB: currentSizeMB,
          currentIndex,
          totalFiles: filesArray.length,
        });

        // If drive is configured, attempt Drive upload
        if (hasDriveConfig) {
          const result = await uploadMediaToGoogleDrive({
            file,
            officeLocation: effectiveOffice,
            fileNo: effectiveFileNo,
            siteName: effectiveSiteName,
            type,
            onProgress: (percent, statusText) => {
              setUploadProgress({
                percent,
                statusText,
                fileName: currentFileName,
                fileSizeMB: currentSizeMB,
                currentIndex,
                totalFiles: filesArray.length,
              });
            },
          });

          if (result.success && (result.url || result.viewUrl || result.directImageUrl)) {
            // Successfully uploaded to Google Drive!
            append({
              id: uuidv4(),
              url: result.url || result.directImageUrl || result.viewUrl,
              driveFileId: result.fileId,
              driveViewUrl: result.viewUrl,
              driveThumbnailUrl: result.thumbnailUrl,
              fileName: result.fileName || file.name,
              description: "",
              storageType: 'drive',
              createdAt: new Date().toISOString(),
            });

            toast({
              title: `${type === 'image' ? 'Photo' : 'Video'} Uploaded to Google Drive`,
              description: `Saved in keralagwd@gmail.com Drive under ${effectiveOffice} folder.`,
            });
            continue;
          }
        }

        // Seamless fallback: Save media directly to site record
        await saveMediaDirectly(file);
      }
    } catch (err: any) {
      console.error("Upload error:", err);
      // Even on error, attempt direct fallback for first file if not yet saved
      try {
        if (filesArray[0]) {
          await saveMediaDirectly(filesArray[0]);
        }
      } catch (fallbackErr) {
        toast({
          title: "Upload Error",
          description: err?.message || "An error occurred during file selection.",
          variant: "destructive",
        });
      }
    } finally {
      setIsUploading(false);
      setUploadStatusText('');
      setTimeout(() => setUploadProgress(null), 3000);
      // Reset file inputs so the same file can be chosen again if needed
      if (fileInputRef.current) fileInputRef.current.value = '';
      if (cameraInputRef.current) cameraInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-3">
      {/* Hidden inputs for native camera & file explorer */}
      <input
        type="file"
        ref={cameraInputRef}
        accept={type === 'image' ? 'image/*' : 'video/*'}
        capture="environment"
        onChange={(e) => handleFilesSelected(e.target.files)}
        className="hidden"
      />
      <input
        type="file"
        ref={fileInputRef}
        accept={type === 'image' ? 'image/*' : 'video/*'}
        multiple={type === 'image'}
        onChange={(e) => handleFilesSelected(e.target.files)}
        className="hidden"
      />

      {/* Header bar with primary action buttons */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <h4 className="font-semibold text-sm flex items-center gap-2">
            {type === 'image' ? <ImagePlus className="h-4 w-4 text-primary" /> : <Video className="h-4 w-4 text-primary" />}
            {title}
          </h4>
          <span className="text-[11px] text-muted-foreground font-normal px-2 py-0.5 rounded bg-muted/60 border hidden sm:inline">
            Max: 25MB
          </span>
          <button
            type="button"
            onClick={() => {
              if (isSuperAdmin) {
                setIsSetupDialogOpen(true);
              } else {
                toast({
                  title: "Google Drive Media Archive",
                  description: hasDriveConfig 
                    ? "Site media is automatically uploaded to keralagwd@gmail.com Google Drive."
                    : "Centralized Google Drive media archive is managed by State Super Admin (keralagwd@gmail.com).",
                });
              }
            }}
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium border bg-background hover:bg-muted transition-colors text-muted-foreground"
            title={isSuperAdmin ? "Configure Google Drive Archive" : "Google Drive Archive (keralagwd@gmail.com)"}
          >
            <HardDrive className="h-3 w-3 text-primary" />
            <span className="hidden sm:inline">Drive:</span>
            {hasDriveConfig ? (
              <span className="text-green-600 font-semibold flex items-center gap-0.5">
                <CheckCircle2 className="h-2.5 w-2.5" /> keralagwd
              </span>
            ) : isSuperAdmin ? (
              <span className="text-amber-600 font-semibold flex items-center gap-0.5">
                <Settings2 className="h-2.5 w-2.5" /> Setup
              </span>
            ) : (
              <span className="text-amber-600 font-semibold flex items-center gap-0.5">
                State HQ
              </span>
            )}
          </button>
        </div>

        {!isReadOnly && (
          <div className="flex items-center gap-1.5 flex-wrap">
            {/* Direct Camera Capture */}
            <Button
              type="button"
              variant="default"
              size="sm"
              onClick={() => cameraInputRef.current?.click()}
              disabled={isUploading}
              className="h-8 text-xs gap-1.5"
            >
              <Camera className="h-3.5 w-3.5" />
              {type === 'image' ? 'Capture Photo' : 'Record Video'}
            </Button>

            {/* File Explorer Upload */}
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="h-8 text-xs gap-1.5"
            >
              <Upload className="h-3.5 w-3.5" />
              Upload {type === 'image' ? 'Photos' : 'Video'}
            </Button>

            {/* URL Link Fallback */}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAddClick}
              disabled={isUploading}
              className="h-8 text-xs gap-1.5"
            >
              <LinkIcon className="h-3.5 w-3.5" />
              Add Link
            </Button>
          </div>
        )}
      </div>

      {/* Uploading progress notification with animated progress bar */}
      {(isUploading || uploadProgress) && (
        <div className="p-3.5 rounded-xl border border-primary/30 bg-primary/5 space-y-2.5 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="h-8 w-8 rounded-lg bg-primary/15 flex items-center justify-center text-primary shrink-0">
                {uploadProgress?.percent === 100 ? (
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                ) : (
                  <Loader2 className="h-5 w-5 animate-spin text-primary" />
                )}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-xs font-semibold text-foreground truncate">
                    {uploadProgress ? (
                      <>
                        Uploading {type === 'image' ? 'Photo' : 'Video'} ({uploadProgress.currentIndex}/{uploadProgress.totalFiles}): {uploadProgress.fileName}
                      </>
                    ) : (
                      uploadStatusText || "Uploading to Google Drive..."
                    )}
                  </p>
                  {uploadProgress?.fileSizeMB && (
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-muted text-muted-foreground font-mono">
                      {uploadProgress.fileSizeMB} MB
                    </span>
                  )}
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 font-medium border border-amber-200/50">
                    Max 25MB
                  </span>
                </div>
                <p className="text-[11px] text-primary/80 truncate mt-0.5">
                  {uploadProgress?.statusText || uploadStatusText || "Processing upload..."}
                </p>
              </div>
            </div>
            <div className="text-right shrink-0">
              <span className="text-sm font-bold text-primary">
                {uploadProgress ? `${uploadProgress.percent}%` : '...'}
              </span>
            </div>
          </div>

          {/* Animated Progress Bar Track */}
          <div className="w-full bg-primary/20 rounded-full h-2.5 overflow-hidden">
            <div
              className="bg-primary h-2.5 rounded-full transition-all duration-300 ease-out"
              style={{ width: `${uploadProgress?.percent ?? 25}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-[10px] text-muted-foreground">
            <span className="truncate">
              Archiving under: <code>GWD_Site_Media / {effectiveOffice} / {effectiveFileNo}</code>
            </span>
            <span className="shrink-0 font-medium text-emerald-700 dark:text-emerald-400">
              keralagwd@gmail.com Drive
            </span>
          </div>
        </div>
      )}

      {/* Grid of media items */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {fields.map((field, index) => {
          const thumb = getMediaThumbnail(field);
          const isDriveMedia = field.storageType === 'drive' || !!field.driveFileId || (field.url && field.url.includes('drive.google.com'));

          return (
            <div key={field.id || index} className="flex flex-col gap-1 group">
              <div className="relative aspect-square rounded-lg border overflow-hidden bg-muted">
                <button
                  type="button"
                  onClick={() => setLightboxIndex(index)}
                  className="w-full h-full flex items-center justify-center hover:opacity-85 transition-opacity relative"
                >
                  {type === 'image' ? (
                    thumb ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img
                        src={thumb}
                        alt={field.description || 'Site Photo'}
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                        onError={(e) => {
                          // Fallback to original url or placeholder
                          const target = e.currentTarget;
                          if (field.url && target.src !== field.url) {
                            target.src = field.url;
                          }
                        }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-secondary">
                        <ImagePlus className="h-8 w-8 text-muted-foreground" />
                      </div>
                    )
                  ) : (
                    <div className="w-full h-full relative flex items-center justify-center bg-black/40">
                      {thumb ? (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img
                          src={thumb}
                          alt={field.description || 'Site Video'}
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-secondary">
                          <Video className="h-10 w-10 text-muted-foreground" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-black/30 flex items-center justify-center group-hover:bg-black/40 transition-colors">
                        <div className="h-10 w-10 rounded-full bg-white/90 text-primary flex items-center justify-center shadow-lg transform group-hover:scale-110 transition-transform">
                          <Play className="h-5 w-5 ml-0.5 fill-primary" />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Drive Badge */}
                  {isDriveMedia && (
                    <span className="absolute bottom-1.5 left-1.5 px-1.5 py-0.5 rounded text-[9px] font-semibold bg-black/70 text-white flex items-center gap-1 backdrop-blur-sm">
                      <HardDrive className="h-2.5 w-2.5 text-blue-400" /> Drive
                    </span>
                  )}
                </button>

                {!isReadOnly && (
                  <div className="absolute top-1 right-1 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      type="button"
                      variant="secondary"
                      size="icon"
                      className="h-7 w-7 shadow-sm"
                      onClick={() => handleEditClick(index, field)}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="h-7 w-7 shadow-sm"
                      onClick={() => remove(index)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                )}
              </div>

              {field.description ? (
                <p className="text-xs font-semibold text-primary/80 line-clamp-2 px-1 py-1 rounded">
                  {field.description}
                </p>
              ) : (
                field.fileName && (
                  <p className="text-[11px] text-muted-foreground truncate px-1">
                    {field.fileName}
                  </p>
                )
              )}
            </div>
          );
        })}

        {/* Empty state with direct capture drop zone */}
        {fields.length === 0 && (
          <div
            onClick={() => {
              if (!isReadOnly) fileInputRef.current?.click();
            }}
            className={`col-span-full py-8 px-4 border-2 border-dashed rounded-lg flex flex-col items-center justify-center text-center text-muted-foreground bg-muted/20 ${
              !isReadOnly ? 'cursor-pointer hover:bg-muted/40 hover:border-primary/50 transition-all' : ''
            }`}
          >
            <div className="p-3 rounded-full bg-primary/10 text-primary mb-2">
              {type === 'image' ? <Camera className="h-6 w-6" /> : <Video className="h-6 w-6" />}
            </div>
            <p className="text-xs font-semibold text-foreground">
              {!isReadOnly
                ? `Click to upload ${type === 'image' ? 'site photos' : 'site videos'} or use buttons above`
                : `No ${type}s added yet.`}
            </p>
            <p className="text-[11px] text-amber-700 dark:text-amber-400 font-medium mt-0.5">
              Maximum allowed size: up to 25MB per {type === 'image' ? 'photo' : 'video'}
            </p>
            <p className="text-[11px] text-muted-foreground mt-1 flex items-center gap-1">
              <HardDrive className="h-3 w-3" />
              {hasDriveConfig ? (
                <>Saved to <strong>keralagwd@gmail.com</strong> Google Drive ({effectiveOffice} folder)</>
              ) : (
                <>Direct site media attachment (Google Drive sync available)</>
              )}
            </p>
          </div>
        )}
      </div>

      {/* Manual Link Input / Edit Description Dialog */}
      <Dialog open={isMediaModalOpen} onOpenChange={setIsMediaModalOpen}>
        <DialogContent onPointerDownOutside={(e) => e.preventDefault()} className="max-w-md p-0 overflow-hidden">
          <DialogHeader className="p-6 pb-4 border-b">
            <DialogTitle>
              {editingMedia ? 'Edit' : 'Add'} {type === 'image' ? 'Image' : 'Video'} {editingMedia?.data?.storageType === 'drive' ? 'Details' : 'Link'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleMediaSubmit} className="p-6 space-y-4">
            <div className="space-y-2">
              <Label>Media Link (URL)</Label>
              <Input
                name="url"
                defaultValue={editingMedia?.data?.url || ''}
                placeholder={type === 'image' ? 'https://... (Google Drive, Postimages, Direct URL)' : 'https://... (YouTube, Google Drive, Vimeo)'}
                required
              />
              <p className="text-[11px] text-muted-foreground">
                Tip: You can paste a YouTube link, Google Drive link, or direct image URL.
              </p>
            </div>
            <div className="space-y-2">
              <Label>Description / Caption (Optional)</Label>
              <Textarea
                name="description"
                defaultValue={editingMedia?.data?.description || ''}
                placeholder="e.g., Borewell drilling in progress, casing pipe installation..."
                className="min-h-[100px]"
              />
            </div>
            <DialogFooter className="pt-4 border-t">
              <Button type="button" variant="outline" onClick={() => setIsMediaModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">Save</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Lightbox Modal */}
      <Dialog open={lightboxIndex !== null} onOpenChange={() => setLightboxIndex(null)}>
        <DialogContent className="max-w-5xl p-0 overflow-hidden bg-black/95 border-none">
          <div className="relative flex flex-col h-[85vh]">
            <div className="flex-1 relative flex items-center justify-center p-4">
              {lightboxIndex !== null && fields[lightboxIndex] && (
                <>
                  {type === 'image' ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={fields[lightboxIndex].url}
                      alt={fields[lightboxIndex].description || 'Full Photo'}
                      className="max-h-[72vh] max-w-full object-contain shadow-2xl rounded"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-full max-w-4xl aspect-video bg-black flex flex-col items-center justify-center overflow-hidden rounded-lg shadow-2xl relative">
                      {(() => {
                        const item = fields[lightboxIndex];
                        const videoUrl = item.url || '';
                        const driveId = item.driveFileId || extractDriveFileId(videoUrl) || extractDriveFileId(item.driveViewUrl || '');
                        const isExternalEmbed = videoUrl.includes('youtube.com') || videoUrl.includes('youtu.be') || videoUrl.includes('vimeo.com');

                        if (driveId) {
                          return (
                            <iframe
                              src={`https://drive.google.com/file/d/${driveId}/preview`}
                              className="w-full h-full border-none"
                              allowFullScreen
                              allow="autoplay; fullscreen; encrypted-media; picture-in-picture"
                              title={item.description || item.fileName || 'Google Drive Video'}
                            />
                          );
                        }

                        if (isExternalEmbed) {
                          const embedUrl = getEmbedUrl(videoUrl);
                          return (
                            <iframe
                              src={embedUrl || videoUrl}
                              className="w-full h-full border-none"
                              allowFullScreen
                              allow="autoplay; fullscreen; encrypted-media; picture-in-picture"
                              title={item.description || 'Video Player'}
                            />
                          );
                        }

                        return (
                          <div className="w-full h-full relative flex items-center justify-center bg-black">
                            <video
                              src={videoUrl}
                              controls
                              playsInline
                              preload="metadata"
                              className="w-full h-full max-h-[75vh] object-contain"
                              key={videoUrl}
                            >
                              Your browser does not support the video tag.
                            </video>
                          </div>
                        );
                      })()}
                    </div>
                  )}
                </>
              )}

              {fields.length > 1 && (
                <>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute left-4 h-12 w-12 rounded-full bg-white/10 hover:bg-white/20 text-white"
                    onClick={() => setLightboxIndex((prev) => (prev! - 1 + fields.length) % fields.length)}
                  >
                    <ChevronLeft className="h-8 w-8" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-4 h-12 w-12 rounded-full bg-white/10 hover:bg-white/20 text-white"
                    onClick={() => setLightboxIndex((prev) => (prev! + 1) % fields.length)}
                  >
                    <ChevronRight className="h-8 w-8" />
                  </Button>
                </>
              )}
            </div>

            {lightboxIndex !== null && fields[lightboxIndex] && (
              <div className="p-4 bg-black/85 text-white border-t border-white/10 flex items-center justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">
                    {fields[lightboxIndex].description || fields[lightboxIndex].fileName || `${title} (${lightboxIndex + 1} of ${fields.length})`}
                  </p>
                  <p className="text-xs text-white/60">
                    Saved in Google Drive: <code>{effectiveOffice}</code> folder
                  </p>
                </div>
                {(fields[lightboxIndex].driveViewUrl || fields[lightboxIndex].url) && (
                  <a
                    href={fields[lightboxIndex].driveViewUrl || fields[lightboxIndex].url}
                    target="_blank"
                    rel="noreferrer"
                    className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold bg-white/10 hover:bg-white/20 text-white transition-colors"
                  >
                    <ExternalLink className="h-3.5 w-3.5" /> Open in Google Drive
                  </a>
                )}
              </div>
            )}

            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute top-3 right-3 text-white/70 hover:text-white bg-black/40 rounded-full"
              onClick={() => setLightboxIndex(null)}
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Google Drive Setup Modal */}
      <GoogleDriveSetupDialog
        open={isSetupDialogOpen}
        onOpenChange={setIsSetupDialogOpen}
        onConfigured={() => {
          setHasDriveConfig(true);
        }}
      />
    </div>
  );
}
