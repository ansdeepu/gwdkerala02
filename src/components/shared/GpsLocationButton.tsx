// src/components/shared/GpsLocationButton.tsx
"use client";

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { MapPin, Loader2, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface GpsLocationButtonProps {
  onCoordinatesObtained: (lat: number, lng: number) => void;
  disabled?: boolean;
  variant?: "outline" | "secondary" | "default" | "ghost";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
  showLabel?: boolean;
}

export function GpsLocationButton({
  onCoordinatesObtained,
  disabled = false,
  variant = "outline",
  size = "sm",
  className = "",
  showLabel = true
}: GpsLocationButtonProps) {
  const [isLocating, setIsLocating] = useState(false);
  const [success, setSuccess] = useState(false);
  const { toast } = useToast();

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      toast({
        title: "GPS Not Supported",
        description: "Your browser or device does not support GPS Geolocation.",
        variant: "destructive"
      });
      return;
    }

    setIsLocating(true);
    setSuccess(false);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setIsLocating(false);
        const lat = Number(position.coords.latitude.toFixed(6));
        const lng = Number(position.coords.longitude.toFixed(6));
        const accuracy = Math.round(position.coords.accuracy);

        onCoordinatesObtained(lat, lng);
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);

        toast({
          title: "GPS Location Captured",
          description: `Lat: ${lat}, Lng: ${lng} (Accuracy: ±${accuracy}m)`,
        });
      },
      (error) => {
        setIsLocating(false);
        let errorMsg = "Unable to retrieve device location.";
        if (error.code === error.PERMISSION_DENIED) {
          errorMsg = "Location access was denied. Please enable GPS permissions in browser/device settings.";
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          errorMsg = "Location information is unavailable. Ensure device GPS is turned on.";
        } else if (error.code === error.TIMEOUT) {
          errorMsg = "Location request timed out. Please try again.";
        }

        toast({
          title: "GPS Error",
          description: errorMsg,
          variant: "destructive"
        });
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0
      }
    );
  };

  return (
    <Button
      type="button"
      variant={success ? "secondary" : variant}
      size={size}
      disabled={disabled || isLocating}
      onClick={handleGetLocation}
      className={`gap-1.5 transition-colors ${success ? 'text-emerald-700 dark:text-emerald-400 border-emerald-500/50' : ''} ${className}`}
      title="Capture current device GPS coordinates"
    >
      {isLocating ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
      ) : success ? (
        <CheckCircle className="h-3.5 w-3.5 text-emerald-600" />
      ) : (
        <MapPin className="h-3.5 w-3.5 text-primary" />
      )}
      {showLabel && (
        <span className="text-xs font-medium">
          {isLocating ? "Acquiring GPS..." : success ? "GPS Captured" : "Capture GPS"}
        </span>
      )}
    </Button>
  );
}
