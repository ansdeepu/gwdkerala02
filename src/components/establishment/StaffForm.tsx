
// src/components/establishment/StaffForm.tsx
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Form,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { MalayalamInput } from "@/components/ui/malayalam-input-helper";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn, formatCase } from "@/lib/utils";
import { 
  Loader2, 
  Save, 
  X, 
  ImageUp, 
  Unplug, 
  Expand, 
  UserCheck, 
  Info,
  Camera,
  Upload,
  Link as LinkIcon,
  HardDrive,
  CheckCircle2,
  Settings2,
  Trash2,
  ExternalLink,
  ImagePlus,
  RefreshCw,
  Eye,
  User as UserIcon,
} from "lucide-react";
import { StaffMemberFormDataSchema, type StaffMemberFormData, designationOptions, staffStatusOptions, type StaffStatusType, designationMalayalamOptions, bloodGroupOptions } from "@/lib/schemas";
import type { StaffMember, OfficeAddress } from "@/lib/schemas";
import React, { useState, useEffect, useMemo, useRef } from "react";
import Image from "next/image";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { format, isValid, parseISO, parse } from "date-fns";
import { ScrollArea } from "../ui/scroll-area";
import { Checkbox } from "../ui/checkbox";
import { useAuth, type UserProfile } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { SUPER_ADMIN_EMAIL } from "@/lib/config";
import { uploadStaffPhotoToGoogleDrive, getGoogleDriveScriptUrl, compressImage } from "@/lib/googleDriveUploadClient";
import GoogleDriveSetupDialog from "@/components/shared/GoogleDriveSetupDialog";

interface StaffFormProps {
  onSubmit: (data: StaffMemberFormData) => Promise<void>;
  initialData?: StaffMember | null;
  isSubmitting: boolean;
  onCancel: () => void;
  isViewer?: boolean;
  allOfficeAddresses: OfficeAddress[];
  allUsers: UserProfile[];
}

const extractDriveFileId = (url: string): string | null => {
  if (!url) return null;
  const match = url.match(/\/d\/([a-zA-Z0-9_-]+)/) || 
                url.match(/[?&]id=([a-zA-Z0-9_-]+)/) || 
                url.match(/googleusercontent\.com\/d\/([a-zA-Z0-9_-]+)/);
  if (match && match[1]) return match[1];
  return null;
};

const getPhotoDisplayUrl = (url?: string | null): string | null => {
  if (!url || typeof url !== 'string') return null;
  const trimmed = url.trim();
  if (!trimmed) return null;
  if (trimmed.startsWith('data:image/')) return trimmed;
  const driveId = extractDriveFileId(trimmed);
  if (driveId) {
    return `https://drive.google.com/thumbnail?id=${driveId}&sz=w800`;
  }
  return trimmed;
};

const isValidPhotoSource = (url?: string | null): boolean => {
  if (!url || typeof url !== 'string') return false;
  const trimmed = url.trim();
  if (!trimmed) return false;
  if (trimmed.startsWith('data:image/')) return true;
  try {
    const newUrl = new URL(trimmed);
    return newUrl.protocol === 'http:' || newUrl.protocol === 'https:';
  } catch (_) {
    return false;
  }
};

const toDateOrNull = (value: any): Date | null => {
    if (value === null || value === undefined || value === '') return null;
    if (value instanceof Date && !isNaN(value.getTime())) return value;
    if (typeof value === 'object' && value !== null && typeof value.seconds === 'number') {
        return new Date(value.seconds * 1000 + (value.nanoseconds || 0) / 1e6);
    }
    if (typeof value === 'string') {
        const trimmed = value.trim();
        // Try ISO
        let d = parseISO(trimmed);
        if (isValid(d)) return d;
        
        // Try dd/MM/yyyy
        d = parse(trimmed, 'dd/MM/yyyy', new Date());
        if (isValid(d)) return d;

        // Try dd-MM-yyyy
        d = parse(trimmed, 'dd-MM-yyyy', new Date());
        if (isValid(d)) return d;
        
        // Try native fallback
        const fallback = new Date(trimmed);
        if (isValid(fallback)) return fallback;
    }
    return null;
 };

const getField = (data: any, key: string): any => {
    if (!data) return undefined;
    
    if (data[key] !== undefined && data[key] !== null) return data[key];
    
    const mappings: Record<string, string[]> = {
        'name': ['name', 'Name', 'Full Name'],
        'nameMalayalam': ['nameMalayalam', 'NameMalayalam', 'Name (Malayalam)', 'Name malayalam'],
        'designation': ['designation', 'Designation', 'Roles/Responsibilities', 'roles', 'Post'],
        'designationMalayalam': ['designationMalayalam', 'DesignationMalayalam', 'Designation (Malayalam)', 'Designation malayalam', 'Post (Malayalam)'],
        'pen': ['pen', 'PEN'],
        'bloodGroup': ['bloodGroup', 'Blood Group', 'bloodgroup'],
        'email': ['email', 'Email', 'Email ID'],
        'phoneNo': ['phoneNo', 'PhoneNo', 'PhoneNumber', 'Phone', 'phone'],
        'status': ['status', 'Status'],
        'photoUrl': ['photoUrl', 'PhotoUrl', 'Photo', 'photo'],
        'officeLocation': ['officeLocation', 'OfficeLocation', 'Office', 'location'],
        'targetOffice': ['targetOffice', 'TargetOffice'],
        'serviceStartDate': ['serviceStartDate', 'ServiceStartDate', 'Period of Service From', 'dateOfJoining', 'service_start_date'],
        'serviceEndDate': ['serviceEndDate', 'ServiceEndDate', 'Period of Service To', 'service_end_date'],
    };

    if (mappings[key]) {
        for (const altKey of mappings[key]) {
            if (data[altKey] !== undefined && data[altKey] !== null) return data[altKey];
        }
    }

    const searchKey = key.toLowerCase();
    const foundKey = Object.keys(data).find(k => k.toLowerCase() === searchKey);
    if (foundKey) return data[foundKey];

    return undefined;
};

const districtsOrder = [
    "Directorate TVM",
    "Thiruvananthapuram", "Kollam", "Pathanamthitta", "Alappuzha", "Kottayam", 
    "Idukki", "Ernakulam", "Thrissur", "Palakkad", "Malappuram", "Kozhikode", 
    "Wayanad", "Kannur", "Kasaragod",
    "Lab TVM", "Lab EKM", "Lab KKD"
];

const formatDateForInput = (date: Date | string | null | undefined): string => {
    if (!date) return "";
    const dateObj = toDateOrNull(date);
    if (!dateObj || !isValid(dateObj)) return "";
    return format(dateObj, 'yyyy-MM-dd');
};

export default function StaffForm({ onSubmit, initialData, isSubmitting, onCancel, isViewer = false, allOfficeAddresses, allUsers }: StaffFormProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageLoadError, setImageLoadError] = useState(false);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);

  // Media Gallery Upload State
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{ percent: number; statusText: string; fileSizeMB?: string } | null>(null);
  const [hasDriveConfig, setHasDriveConfig] = useState(false);
  const [isSetupDialogOpen, setIsSetupDialogOpen] = useState(false);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [manualUrl, setManualUrl] = useState("");

  const isSuperAdmin = user?.role === 'superAdmin' || user?.email === SUPER_ADMIN_EMAIL;

  useEffect(() => {
    getGoogleDriveScriptUrl().then((url) => setHasDriveConfig(!!url));
  }, []);

  const formDesignationOptions = useMemo(() => {
    if (user?.role === 'superAdmin') {
        return designationOptions;
    }
    const subOfficeStartIndex = designationOptions.indexOf("Executive Engineer");
    if (subOfficeStartIndex !== -1) {
        return ["Executive Engineer", ...designationOptions.slice(subOfficeStartIndex)];
    }

    return designationOptions;
  }, [user]);

  const formDesignationMalayalamOptions = useMemo(() => {
    if (user?.role === 'superAdmin') {
        return designationMalayalamOptions;
    }
    const subOfficeStartIndex = designationMalayalamOptions.indexOf("എക്സിക്യൂട്ടീവ് എഞ്ചിനീയർ");
     if (subOfficeStartIndex !== -1) {
        return ["എക്സിക്യൂട്ടീവ് എഞ്ചിനീയർ", ...designationMalayalamOptions.slice(subOfficeStartIndex + 1)];
    }
    return designationMalayalamOptions;
  }, [user]);

  const defaultValues = useMemo((): StaffMemberFormData => {
    const rawData = initialData || {};
    
    const normalize = (val: any) => {
        if (val === null || val === undefined) return "";
        return String(val).trim();
    };

    const designationValue = normalize(getField(rawData, 'designation'));
    const designationMalayalamValue = normalize(getField(rawData, 'designationMalayalam'));
    const statusValue = normalize(getField(rawData, 'status')) as StaffStatusType;
    
    const currentTarget = normalize(getField(rawData, 'targetOffice'));
    const currentOffice = normalize(getField(rawData, 'officeLocation') || getField(rawData, 'officeLocationFromPath'));
    let officeLocationValue = currentTarget || currentOffice;
    
    // Normalize and Match Dropdown values for casing compatibility
    const lowerVal = officeLocationValue.toLowerCase().trim();
    if (lowerVal === 'directorate' || lowerVal === 'directorate tvm') {
        officeLocationValue = 'Directorate TVM';
    } else {
        const match = districtsOrder.find(d => d.toLowerCase() === lowerVal);
        if (match) {
            officeLocationValue = match;
        }
    }

    const userForStaff = allUsers.find(u => 
        u.staffId && initialData?.id && 
        String(u.staffId).trim().toLowerCase() === String(initialData.id).trim().toLowerCase()
    );
    const email = normalize(getField(rawData, 'email') || userForStaff?.email);

    const dob = getField(rawData, 'dateOfBirth') ? toDateOrNull(getField(rawData, 'dateOfBirth')) : null;
    const serviceStartDate = getField(rawData, 'serviceStartDate') ? toDateOrNull(getField(rawData, 'serviceStartDate')) : null;
    const serviceEndDate = getField(rawData, 'serviceEndDate') ? toDateOrNull(getField(rawData, 'serviceEndDate')) : null;
    
    return {
        name: normalize(getField(rawData, 'name')),
        nameMalayalam: normalize(getField(rawData, 'nameMalayalam')),
        designation: formDesignationOptions.find(o => o.toLowerCase().trim() === designationValue.toLowerCase()) as any,
        designationMalayalam: formDesignationMalayalamOptions.find(o => o.toLowerCase().trim() === designationMalayalamValue.toLowerCase()) as any,
        pen: normalize(getField(rawData, 'pen')),
        bloodGroup: getField(rawData, 'bloodGroup') || null,
        email,
        dateOfBirth: dob,
        serviceStartDate: serviceStartDate,
        serviceEndDate: serviceEndDate,
        phoneNo: normalize(getField(rawData, 'phoneNo')),
        roles: normalize(getField(rawData, 'roles')),
        photoUrl: normalize(getField(rawData, 'photoUrl')),
        status: staffStatusOptions.find(o => o.toLowerCase().trim() === statusValue.toLowerCase()) as StaffStatusType || 'Active',
        remarks: normalize(getField(rawData, 'remarks')),
        officeLocation: officeLocationValue,
        createUserAccount: false,
    };
  }, [initialData, allUsers, formDesignationOptions, formDesignationMalayalamOptions]);

  const form = useForm<StaffMemberFormData>({
    resolver: zodResolver(StaffMemberFormDataSchema),
    defaultValues
  });
  
  const { watch, control, handleSubmit, reset } = form;
  
  useEffect(() => {
    reset(defaultValues);
  }, [defaultValues, reset]);

  const watchedPhotoUrl = watch("photoUrl");
  const watchedStatus = watch("status");
  
  const userAccountExists = useMemo(() => {
    if (!initialData?.id) return false;
    return allUsers.some(user => 
        String(user.staffId).trim().toLowerCase() === String(initialData.id).trim().toLowerCase()
    );
  }, [initialData, allUsers]);

  const showUserCreation = !isViewer && !userAccountExists;
  
  useEffect(() => {
    const rawUrl = watchedPhotoUrl ? String(watchedPhotoUrl).trim() : "";
    if (rawUrl && isValidPhotoSource(rawUrl)) {
      const displayUrl = getPhotoDisplayUrl(rawUrl);
      setImagePreview(displayUrl || rawUrl);
      setImageLoadError(false);
    } else {
      setImagePreview(null); 
      setImageLoadError(false);
    }
  }, [watchedPhotoUrl]);

  const handleFileSelected = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const file = files[0];

    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid File Type",
        description: "Please select an image file (.jpg, .jpeg, .png, .webp).",
        variant: "destructive",
      });
      return;
    }

    const MAX_FILE_SIZE_MB = 25;
    if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
      const sizeMb = (file.size / (1024 * 1024)).toFixed(1);
      toast({
        title: "File Size Limit Exceeded",
        description: `Photo size (${sizeMb} MB) exceeds maximum allowed limit of ${MAX_FILE_SIZE_MB} MB. Please upload a smaller photo.`,
        variant: "destructive",
      });
      return;
    }

    setImageLoadError(false);
    setIsUploading(true);
    const sizeMb = (file.size / (1024 * 1024)).toFixed(1);
    setUploadProgress({ percent: 10, statusText: "Preparing photo...", fileSizeMB: sizeMb });

    const staffName = form.getValues("name") || initialData?.name || "";
    const staffPen = form.getValues("pen") || initialData?.pen || "";
    const officeLocation = form.getValues("officeLocation") || user?.officeLocation || "Directorate TVM";

    try {
      const result = await uploadStaffPhotoToGoogleDrive({
        file,
        officeLocation,
        pen: staffPen,
        staffName,
        onProgress: (percent, statusText) => {
          setUploadProgress({ percent, statusText, fileSizeMB: sizeMb });
        },
      });

      if (result.success && (result.directImageUrl || result.viewUrl || result.url || result.thumbnailUrl)) {
        const chosenUrl = result.directImageUrl || result.viewUrl || result.url || result.thumbnailUrl || "";
        form.setValue("photoUrl", chosenUrl, { shouldValidate: true, shouldDirty: true });
        const displayUrl = getPhotoDisplayUrl(chosenUrl) || chosenUrl;
        setImagePreview(displayUrl);
        setImageLoadError(false);
        setShowUrlInput(false);
        toast({
          title: "Photo Uploaded",
          description: `Staff photo saved to Google Drive (${officeLocation} folder).`,
        });
      } else {
        // Fallback: compress client-side to lightweight data URI so user is never blocked
        console.warn("Drive upload fallback:", result.error);
        const compressed = await compressImage(file, 800, 0.82);
        const dataUri = `data:${compressed.mimeType};base64,${compressed.base64Data}`;
        form.setValue("photoUrl", dataUri, { shouldValidate: true, shouldDirty: true });
        setImagePreview(dataUri);
        setImageLoadError(false);
        setShowUrlInput(false);
        toast({
          title: result.requiresSetup ? "Photo Saved Locally" : "Photo Attached",
          description: result.error ? `${result.error} Photo saved locally.` : "Photo compressed and attached.",
        });
      }
    } catch (err: any) {
      console.error("Staff photo upload error:", err);
      try {
        const compressed = await compressImage(file, 800, 0.82);
        const dataUri = `data:${compressed.mimeType};base64,${compressed.base64Data}`;
        form.setValue("photoUrl", dataUri, { shouldValidate: true, shouldDirty: true });
        setImagePreview(dataUri);
        setImageLoadError(false);
        setShowUrlInput(false);
        toast({
          title: "Photo Attached",
          description: "Photo compressed and attached to profile.",
        });
      } catch (fallbackErr) {
        toast({
          title: "Upload Failed",
          description: err?.message || "Failed to process photo.",
          variant: "destructive",
        });
      }
    } finally {
      setIsUploading(false);
      setTimeout(() => setUploadProgress(null), 2500);
      if (fileInputRef.current) fileInputRef.current.value = '';
      if (cameraInputRef.current) cameraInputRef.current.value = '';
    }
  };

  const handleApplyManualUrl = () => {
    const trimmed = manualUrl.trim();
    if (!trimmed) {
      form.setValue("photoUrl", "", { shouldValidate: true, shouldDirty: true });
      setImagePreview(null);
      setImageLoadError(false);
      setShowUrlInput(false);
      return;
    }
    if (!isValidPhotoSource(trimmed)) {
      toast({
        title: "Invalid URL",
        description: "Please enter a valid HTTP/HTTPS image URL.",
        variant: "destructive",
      });
      return;
    }
    form.setValue("photoUrl", trimmed, { shouldValidate: true, shouldDirty: true });
    const displayUrl = getPhotoDisplayUrl(trimmed) || trimmed;
    setImagePreview(displayUrl);
    setImageLoadError(false);
    setShowUrlInput(false);
    toast({
      title: "URL Applied",
      description: "Photo link updated.",
    });
  };

  const handleRemovePhoto = () => {
    form.setValue("photoUrl", "", { shouldValidate: true, shouldDirty: true });
    setImagePreview(null);
    setImageLoadError(false);
    setManualUrl("");
  };

  const handleFormSubmitInternal = (data: StaffMemberFormData) => {
    if (isViewer) return;
    const formattedData = {
        ...data,
        name: formatCase(data.name) ?? data.name,
    };
    onSubmit(formattedData);
  };

  const visibleStatusOptions = useMemo(() => {
    return staffStatusOptions.filter(o => o !== 'Pending Transfer');
  }, []);

  const isTransferring = watchedStatus === 'Transferred' || watchedStatus === 'Pending Transfer';
  
  const sortedOfficeOptions = useMemo(() => {
    return districtsOrder.map(location => ({
        id: location.toLowerCase().replace(/\s+/g, '-'),
        officeLocation: location
    }));
  }, []);


  return (
    <Form {...form}>
      <form onSubmit={handleSubmit(handleFormSubmitInternal)} className="flex flex-col h-full overflow-hidden">
        <ScrollArea className="flex-1 pr-6 -mr-6">
          <div className="space-y-6 pb-4">
            {/* Identity Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. John Doe" {...field} value={field.value ?? ''} readOnly={isViewer} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="nameMalayalam"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name (in Malayalam)</FormLabel>
                    <FormControl>
                      <MalayalamInput
                        placeholder="e.g. ജോൺ ഡോ"
                        value={field.value || ""}
                        onChange={field.onChange}
                        englishValue={form.watch('name') || ""}
                        disabled={isViewer}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="designation"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Designation</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value || ""} disabled={isViewer || isSubmitting}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select designation" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {formDesignationOptions.map(option => (
                          <SelectItem key={option} value={option}>{option}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="designationMalayalam"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Designation (in Malayalam)</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value || ""} disabled={isViewer || isSubmitting}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select Malayalam designation" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="max-h-80">
                        {formDesignationMalayalamOptions.map(option => (
                          <SelectItem key={option} value={option}>{option}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="pen"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>PEN</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. 123456" {...field} value={field.value ?? ''} readOnly={isViewer} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
               <FormField
                control={form.control}
                name="bloodGroup"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Blood Group</FormLabel>
                    <Select onValueChange={(val) => field.onChange(val === '_clear_' ? null : val)} value={field.value || ""}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select Group" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                         <SelectItem value="_clear_">-- Clear --</SelectItem>
                        {bloodGroupOptions.map(option => (
                          <SelectItem key={option} value={option}>{option}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
               <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="e.g. john.doe@kerala.gov.in" {...field} value={field.value || ""} readOnly={isViewer || userAccountExists} className={cn(userAccountExists && "bg-muted/50")} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
               <FormField
                control={form.control}
                name="phoneNo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone Number</FormLabel>
                    <FormControl>
                      <Input type="tel" placeholder="e.g. 9876543210" {...field} value={field.value || ""} readOnly={isViewer} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Service & Essential Details */}
            <div className="pt-4 border-t">
              <h4 className="text-sm font-bold text-primary mb-4 flex items-center gap-2">
                <Info className="h-4 w-4" /> Service & Professional Details
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <FormField
                    control={form.control}
                    name="serviceStartDate"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>Period of Service (From)</FormLabel>
                        <FormControl>
                        <Input type="date" {...field} value={formatDateForInput(field.value)} onChange={(e) => field.onChange(e.target.value ? new Date(e.target.value) : null)} readOnly={isViewer}/>
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="serviceEndDate"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>Period of Service (To)</FormLabel>
                        <FormControl>
                        <Input type="date" {...field} value={formatDateForInput(field.value)} onChange={(e) => field.onChange(e.target.value ? new Date(e.target.value) : null)} readOnly={isViewer}/>
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="dateOfBirth"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>Date of Birth</FormLabel>
                        <FormControl>
                        <Input type="date" {...field} value={formatDateForInput(field.value)} onChange={(e) => field.onChange(e.target.value ? new Date(e.target.value) : null)} readOnly={isViewer}/>
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>Status</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value || ""} disabled={isViewer || isSubmitting}>
                        <FormControl>
                            <SelectTrigger>
                            <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                            {visibleStatusOptions.map(option => (
                            <SelectItem key={option} value={option}>{option}</SelectItem>
                            ))}
                            {field.value === 'Pending Transfer' && (
                                <SelectItem value="Pending Transfer">Pending Transfer</SelectItem>
                            )}
                        </SelectContent>
                        </Select>
                        <FormMessage />
                    </FormItem>
                    )}
                />
              </div>
            </div>

            {/* Staff Photo Section with Google Drive Media Gallery Logic */}
            <div className="pt-4 border-t space-y-3">
              {/* Hidden file & camera inputs */}
              <input
                type="file"
                ref={cameraInputRef}
                accept="image/*"
                capture="user"
                onChange={(e) => handleFileSelected(e.target.files)}
                className="hidden"
                disabled={isViewer || isUploading || isSubmitting}
              />
              <input
                type="file"
                ref={fileInputRef}
                accept="image/*"
                onChange={(e) => handleFileSelected(e.target.files)}
                className="hidden"
                disabled={isViewer || isUploading || isSubmitting}
              />

              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <FormLabel className="text-sm font-semibold text-foreground">Staff Photo</FormLabel>
                  <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                    Max: 25MB
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {hasDriveConfig ? (
                    <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 text-xs font-medium border border-emerald-200/60 dark:border-emerald-800/40">
                      <HardDrive className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                      <span>Drive: keralagwd</span>
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 text-xs font-medium border border-amber-200/60 dark:border-amber-800/40">
                      <HardDrive className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
                      <span>Drive Ready</span>
                    </div>
                  )}

                  {isSuperAdmin && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsSetupDialogOpen(true)}
                      className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
                      title="Configure Google Drive App Script"
                    >
                      <Settings2 className="h-3.5 w-3.5 mr-1" />
                      Config
                    </Button>
                  )}
                </div>
              </div>

              {/* Upload Progress Indicator */}
              {isUploading && uploadProgress && (
                <div className="p-3 bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800/50 rounded-lg space-y-2 animate-in fade-in duration-200">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-blue-900 dark:text-blue-200 flex items-center gap-1.5">
                      <Loader2 className="h-3.5 w-3.5 animate-spin text-blue-600 dark:text-blue-400" />
                      {uploadProgress.statusText}
                    </span>
                    <span className="font-semibold text-blue-700 dark:text-blue-300">
                      {Math.round(uploadProgress.percent)}%
                    </span>
                  </div>
                  <div className="w-full bg-blue-100 dark:bg-blue-900/50 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-blue-600 dark:bg-blue-500 h-2 rounded-full transition-all duration-300 ease-out"
                      style={{ width: `${Math.max(5, uploadProgress.percent)}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-blue-700/80 dark:text-blue-300/80 pt-0.5">
                    <span>
                      Archive: GWD_Staff_Photos / {form.getValues("officeLocation") || user?.officeLocation || "General"}
                    </span>
                    {uploadProgress.fileSizeMB && <span>Size: {uploadProgress.fileSizeMB} MB</span>}
                  </div>
                </div>
              )}

              {/* Main Photo Control Area */}
              <FormField
                control={form.control}
                name="photoUrl"
                render={({ field }) => (
                  <FormItem className="space-y-3">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-3.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30">
                      {/* Photo Thumbnail / Preview */}
                      <Dialog open={isImageModalOpen} onOpenChange={setIsImageModalOpen}>
                        <DialogTrigger asChild>
                          <button
                            type="button"
                            className={cn(
                              "relative h-24 w-24 rounded-lg border-2 border-dashed border-slate-300 dark:border-slate-700 flex items-center justify-center bg-white dark:bg-slate-950 shrink-0 overflow-hidden group shadow-sm transition-all",
                              imagePreview && !imageLoadError && "border-solid border-primary/30 hover:ring-2 hover:ring-primary/40 cursor-pointer"
                            )}
                            onClick={() => imagePreview && !imageLoadError && setIsImageModalOpen(true)}
                            disabled={!imagePreview || imageLoadError}
                            aria-label={imagePreview ? "View larger photo" : "Staff photo preview"}
                          >
                            {imagePreview && !imageLoadError ? (
                              <>
                                <Image
                                  src={imagePreview}
                                  alt="Staff photo preview"
                                  className="object-cover h-full w-full group-hover:scale-105 transition-transform duration-200"
                                  width={96}
                                  height={96}
                                  onError={() => setImageLoadError(true)}
                                  unoptimized={true}
                                  referrerPolicy="no-referrer"
                                />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                                  <Eye className="h-5 w-5 drop-shadow" />
                                </div>
                              </>
                            ) : (
                              <div className="h-full w-full flex flex-col items-center justify-center p-2 text-center text-muted-foreground">
                                {imageLoadError ? (
                                  <Unplug className="h-8 w-8 text-destructive mb-1" />
                                ) : (
                                  <UserIcon className="h-8 w-8 text-slate-400 dark:text-slate-600 mb-0.5" />
                                )}
                                <span className="text-[10px] leading-tight text-slate-500">
                                  {imageLoadError ? "Error" : "No Photo"}
                                </span>
                              </div>
                            )}
                          </button>
                        </DialogTrigger>

                        {imagePreview && !imageLoadError && (
                          <DialogContent className="p-2 border-0 bg-transparent shadow-none max-w-[90vw] flex justify-center">
                            <div className="flex flex-col items-center max-h-[85vh] overflow-hidden bg-slate-950/90 p-4 rounded-xl backdrop-blur-md">
                              <Image
                                src={imagePreview}
                                alt="Staff photo enlarged"
                                width={800}
                                height={800}
                                className="max-w-full max-h-[75vh] object-contain rounded-lg shadow-2xl"
                                unoptimized={true}
                                referrerPolicy="no-referrer"
                              />
                              <div className="mt-3 text-xs text-slate-300 font-medium flex items-center gap-3">
                                <span>{form.getValues("name") || "Staff Photo"}</span>
                                {form.getValues("pen") && <span>(PEN: {form.getValues("pen")})</span>}
                              </div>
                            </div>
                          </DialogContent>
                        )}
                      </Dialog>

                      {/* Photo Actions & Status Details */}
                      <div className="flex-1 space-y-2 min-w-0">
                        {imagePreview && !imageLoadError ? (
                          <div className="space-y-2">
                            <div className="flex items-center gap-1.5 text-xs text-emerald-700 dark:text-emerald-300 font-medium">
                              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                              <span className="truncate">Photo attached to staff profile</span>
                            </div>

                            <p className="text-xs text-muted-foreground truncate">
                              {watchedPhotoUrl?.includes('drive.google.com') || watchedPhotoUrl?.includes('googleusercontent.com') ? (
                                <span className="inline-flex items-center gap-1 text-slate-600 dark:text-slate-400">
                                  <HardDrive className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                                  Stored in Google Drive (keralagwd@gmail.com)
                                </span>
                              ) : watchedPhotoUrl?.startsWith('data:image') ? (
                                <span>Locally attached & compressed</span>
                              ) : (
                                <span>URL: {watchedPhotoUrl}</span>
                              )}
                            </p>

                            {!isViewer && (
                              <div className="flex flex-wrap items-center gap-2 pt-1">
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  className="h-8 text-xs font-medium"
                                  onClick={() => cameraInputRef.current?.click()}
                                  disabled={isUploading || isSubmitting}
                                >
                                  <Camera className="h-3.5 w-3.5 mr-1.5 text-slate-600" />
                                  Retake
                                </Button>
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  className="h-8 text-xs font-medium"
                                  onClick={() => fileInputRef.current?.click()}
                                  disabled={isUploading || isSubmitting}
                                >
                                  <Upload className="h-3.5 w-3.5 mr-1.5 text-slate-600" />
                                  Upload New
                                </Button>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 text-xs text-destructive hover:text-destructive hover:bg-destructive/10"
                                  onClick={handleRemovePhoto}
                                  disabled={isUploading || isSubmitting}
                                >
                                  <Trash2 className="h-3.5 w-3.5 mr-1.5" />
                                  Remove
                                </Button>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="space-y-2">
                            <p className="text-xs text-muted-foreground">
                              Capture directly via device camera, upload a photo file, or link an image URL.
                            </p>

                            {!isViewer && (
                              <div className="flex flex-wrap items-center gap-2">
                                <Button
                                  type="button"
                                  variant="default"
                                  size="sm"
                                  className="h-8 text-xs font-medium bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm"
                                  onClick={() => cameraInputRef.current?.click()}
                                  disabled={isUploading || isSubmitting}
                                >
                                  <Camera className="h-3.5 w-3.5 mr-1.5" />
                                  Capture Photo
                                </Button>

                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  className="h-8 text-xs font-medium bg-background hover:bg-slate-100 dark:hover:bg-slate-800"
                                  onClick={() => fileInputRef.current?.click()}
                                  disabled={isUploading || isSubmitting}
                                >
                                  <Upload className="h-3.5 w-3.5 mr-1.5 text-slate-600 dark:text-slate-300" />
                                  Upload Photo
                                </Button>

                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 text-xs font-medium text-muted-foreground hover:text-foreground"
                                  onClick={() => {
                                    setManualUrl(field.value || "");
                                    setShowUrlInput(!showUrlInput);
                                  }}
                                  disabled={isUploading || isSubmitting}
                                >
                                  <LinkIcon className="h-3.5 w-3.5 mr-1.5" />
                                  {showUrlInput ? "Hide Link" : "Add Link"}
                                </Button>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Manual URL Input Box if toggled */}
                    {showUrlInput && !isViewer && (
                      <div className="p-3 bg-slate-100 dark:bg-slate-900 border rounded-lg space-y-2 animate-in fade-in slide-in-from-top-1 duration-150">
                        <div className="flex items-center justify-between">
                          <label className="text-xs font-medium text-foreground">Direct Image URL</label>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
                            onClick={() => setShowUrlInput(false)}
                          >
                            <X className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                        <div className="flex gap-2">
                          <Input
                            placeholder="https://example.com/staff-photo.jpg"
                            value={manualUrl}
                            onChange={(e) => setManualUrl(e.target.value)}
                            className="h-8 text-xs bg-white dark:bg-slate-950"
                          />
                          <Button
                            type="button"
                            size="sm"
                            className="h-8 text-xs px-3"
                            onClick={handleApplyManualUrl}
                          >
                            Apply
                          </Button>
                        </div>
                      </div>
                    )}

                    {imageLoadError && watchedPhotoUrl && watchedPhotoUrl.trim() !== "" && (
                      <div className="flex items-center justify-between text-xs text-destructive bg-destructive/10 border border-destructive/20 rounded-md p-2 mt-1">
                        <span className="flex items-center gap-1.5">
                          <Unplug className="h-3.5 w-3.5 shrink-0" />
                          Unable to load image from source. Please upload a new photo or check the link.
                        </span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-6 px-2 text-xs text-destructive hover:bg-destructive/20 ml-2 shrink-0"
                          onClick={handleRemovePhoto}
                        >
                          Clear
                        </Button>
                      </div>
                    )}

                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start pt-4 border-t">
              <FormField
                control={form.control}
                name="roles"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Roles/Responsibilities</FormLabel>
                    <FormControl>
                      <Textarea placeholder="e.g., Section Clerk, Field Supervisor" className="resize-y min-h-[100px]" {...field} value={field.value || ""} readOnly={isViewer}/>
                    </FormControl>
                    <FormDescription>(Optional)</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="remarks"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Remarks</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Any additional remarks about the staff member." className="resize-y min-h-[100px]" {...field} value={field.value || ""} readOnly={isViewer}/>
                    </FormControl>
                    <FormDescription>(Optional)</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {isTransferring && (
                <div className="pt-4 border-t space-y-4">
                    <FormField
                        control={form.control}
                        name="officeLocation"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Transfer to Office</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value || ""} disabled={isViewer || isSubmitting}>
                                    <FormControl><SelectTrigger><SelectValue placeholder="Select destination office" /></SelectTrigger></FormControl>
                                    <SelectContent className="max-h-80">
                                        {sortedOfficeOptions.map(office => (
                                            <SelectItem key={office.id} value={office.officeLocation}>
                                                {office.officeLocation}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <FormDescription className="text-xs">
                                    {user?.role === 'superAdmin' 
                                        ? "Select the destination office. Click 'Save Changes' to update the request, or use the 'Approve' button in the table to complete the move." 
                                        : "Select the destination office. This request will be sent to the Super Admin for final approval."
                                    }
                                </FormDescription>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>
            )}
          </div>
        </ScrollArea>
        
        <div className="flex flex-col sm:flex-row justify-between items-center pt-6 mt-auto gap-4 border-t shrink-0">
          <div className="flex-1 w-full sm:w-auto">
            {showUserCreation ? (
              <div className="p-3 rounded-md bg-primary/10 border border-primary/20">
                <FormField
                  control={form.control}
                  name="createUserAccount"
                  render={({ field }) => (
                      <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                      <FormControl>
                          <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          disabled={isViewer || isSubmitting}
                          />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                          <FormLabel className="font-semibold text-primary">
                          Create User Account
                          </FormLabel>
                          <FormDescription className="text-xs text-primary/80">
                          This will create a user account with the default password: <strong>123456</strong>
                          </FormDescription>
                      </div>
                      </FormItem>
                  )}
                  />
              </div>
            ) : (
                initialData && userAccountExists && !isViewer && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <UserCheck className="h-4 w-4 text-green-600" />
                        <span>User account already exists.</span>
                    </div>
                )
            )}
          </div>
          <div className="flex justify-end space-x-3 w-full sm:w-auto">
            <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
                <X className="mr-2 h-4 w-4" /> Cancel
            </Button>
            {!isViewer && (
                <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                {initialData?.id ? "Save Changes" : "Add Staff Member"}
                </Button>
            )}
          </div>
        </div>
      </form>

      {/* Google Drive Setup Dialog */}
      <GoogleDriveSetupDialog 
        open={isSetupDialogOpen} 
        onOpenChange={(open) => {
          setIsSetupDialogOpen(open);
          if (!open) {
            getGoogleDriveScriptUrl().then((url) => setHasDriveConfig(!!url));
          }
        }} 
      />
    </Form>
  );
}
