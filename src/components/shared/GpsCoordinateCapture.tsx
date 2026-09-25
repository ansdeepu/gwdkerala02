'use client';

import React from 'react';
import type { Control, FieldPath, FieldValues } from 'react-hook-form';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useHighAccuracyGps, GpsFixResult } from '@/hooks/useHighAccuracyGps';
import { Crosshair, Loader2, MapPin, ExternalLink, RefreshCw, X, CheckCircle2 } from 'lucide-react';

interface GpsCoordinateCaptureProps<TFieldValues extends FieldValues = FieldValues> {
  control: Control<TFieldValues>;
  setValue: (name: any, value: any, options?: any) => void;
  latFieldName?: FieldPath<TFieldValues>;
  lngFieldName?: FieldPath<TFieldValues>;
  isReadOnly?: boolean;
  className?: string;
  latLabel?: string;
  lngLabel?: string;
  latValue?: number | string | null;
  lngValue?: number | string | null;
}

export function GpsCoordinateCapture<TFieldValues extends FieldValues = FieldValues>({
  control,
  setValue,
  latFieldName = 'latitude' as FieldPath<TFieldValues>,
  lngFieldName = 'longitude' as FieldPath<TFieldValues>,
  isReadOnly = false,
  className = '',
  latLabel = 'Latitude',
  lngLabel = 'Longitude',
  latValue,
  lngValue,
}: GpsCoordinateCaptureProps<TFieldValues>) {
  const {
    isAcquiring,
    currentAccuracy,
    bestFix,
    elapsedSeconds,
    startCapture,
    forceLockNow,
    cancelCapture,
  } = useHighAccuracyGps({ targetAccuracyMeters: 10, maxTimeoutSeconds: 15 });

  const [lastLockedAccuracy, setLastLockedAccuracy] = React.useState<number | null>(null);

  const handleStartCapture = () => {
    startCapture((fix: GpsFixResult) => {
      setLastLockedAccuracy(fix.accuracy);
      setValue(latFieldName, fix.latitude, { shouldDirty: true, shouldValidate: true });
      setValue(lngFieldName, fix.longitude, { shouldDirty: true, shouldValidate: true });
    });
  };

  const handleClear = () => {
    setValue(latFieldName, undefined, { shouldDirty: true, shouldValidate: true });
    setValue(lngFieldName, undefined, { shouldDirty: true, shouldValidate: true });
    setLastLockedAccuracy(null);
  };

  return (
    <div className={`space-y-3 col-span-full ${className}`}>
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/40 pb-2">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-md bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/60">
            <Crosshair className="h-4 w-4" />
          </div>
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Geographical Coordinates (GPS)
            </span>
            <p className="text-[11px] text-muted-foreground">
              Field-grade satellite positioning (WGS-84 standard)
            </p>
          </div>
        </div>

        {/* Action controls */}
        <div className="flex items-center gap-2">
          {!isReadOnly && !isAcquiring && (
            <Button
              id="btn-capture-gps"
              type="button"
              variant="outline"
              size="sm"
              onClick={handleStartCapture}
              className="h-8 gap-1.5 border-emerald-600/40 bg-emerald-50/50 text-emerald-800 hover:bg-emerald-100 dark:bg-emerald-950/30 dark:text-emerald-300 dark:border-emerald-700 dark:hover:bg-emerald-900/50 text-xs font-medium shadow-2xs"
            >
              <Crosshair className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>Capture GPS</span>
            </Button>
          )}

          {isAcquiring && (
            <div className="flex items-center gap-1.5">
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-amber-50 text-amber-900 dark:bg-amber-950/50 dark:text-amber-300 border border-amber-300 dark:border-amber-700 text-xs animate-pulse">
                <Loader2 className="h-3.5 w-3.5 animate-spin text-amber-600 dark:text-amber-400" />
                <span>Acquiring... {currentAccuracy ? `(±${currentAccuracy}m)` : `(${elapsedSeconds}s)`}</span>
              </div>
              {bestFix && (
                <Button
                  id="btn-gps-lock-now"
                  type="button"
                  size="sm"
                  variant="secondary"
                  onClick={forceLockNow}
                  className="h-7 px-2 text-[11px] bg-amber-100 hover:bg-amber-200 text-amber-900 dark:bg-amber-900 dark:hover:bg-amber-800 dark:text-amber-100"
                >
                  Lock Now (±{bestFix.accuracy}m)
                </Button>
              )}
              <Button
                id="btn-gps-cancel"
                type="button"
                size="sm"
                variant="ghost"
                onClick={cancelCapture}
                className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
                title="Cancel acquisition"
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Lat & Long inputs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormField
          name={latFieldName}
          control={control}
          render={({ field }) => (
            <FormItem>
              <div className="flex items-center justify-between">
                <FormLabel className="text-xs font-medium">{latLabel}</FormLabel>
                {field.value && (
                  <span className="text-[10px] text-muted-foreground font-mono">
                    {field.value > 0 ? `${field.value}° N` : `${field.value}°`}
                  </span>
                )}
              </div>
              <FormControl>
                <div className="relative">
                  <Input
                    id={`input-${latFieldName}`}
                    type="number"
                    step="any"
                    placeholder="e.g. 8.524142"
                    {...field}
                    value={field.value ?? ''}
                    onChange={(e) => {
                      const val = e.target.value;
                      field.onChange(val === '' ? undefined : Number(val));
                    }}
                    readOnly={isReadOnly}
                    className="font-mono text-xs pr-8"
                  />
                  <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground/60 text-[10px] font-semibold">
                    °N
                  </div>
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          name={lngFieldName}
          control={control}
          render={({ field }) => (
            <FormItem>
              <div className="flex items-center justify-between">
                <FormLabel className="text-xs font-medium">{lngLabel}</FormLabel>
                {field.value && (
                  <span className="text-[10px] text-muted-foreground font-mono">
                    {field.value > 0 ? `${field.value}° E` : `${field.value}°`}
                  </span>
                )}
              </div>
              <FormControl>
                <div className="relative">
                  <Input
                    id={`input-${lngFieldName}`}
                    type="number"
                    step="any"
                    placeholder="e.g. 76.936615"
                    {...field}
                    value={field.value ?? ''}
                    onChange={(e) => {
                      const val = e.target.value;
                      field.onChange(val === '' ? undefined : Number(val));
                    }}
                    readOnly={isReadOnly}
                    className="font-mono text-xs pr-8"
                  />
                  <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground/60 text-[10px] font-semibold">
                    °E
                  </div>
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      {/* Coordinate status & preview footer */}
      <CoordinateFooter
        control={control as any}
        latFieldName={latFieldName}
        lngFieldName={lngFieldName}
        lastLockedAccuracy={lastLockedAccuracy}
        isReadOnly={isReadOnly}
        onClear={handleClear}
        onRecapture={handleStartCapture}
        isAcquiring={isAcquiring}
        propLat={latValue}
        propLng={lngValue}
      />
    </div>
  );
}

interface CoordinateFooterProps {
  control: Control<any>;
  latFieldName: string;
  lngFieldName: string;
  lastLockedAccuracy: number | null;
  isReadOnly: boolean;
  onClear: () => void;
  onRecapture: () => void;
  isAcquiring: boolean;
  propLat?: number | string | null;
  propLng?: number | string | null;
}

function CoordinateFooter({
  control,
  latFieldName,
  lngFieldName,
  lastLockedAccuracy,
  isReadOnly,
  onClear,
  onRecapture,
  isAcquiring,
  propLat,
  propLng,
}: CoordinateFooterProps) {
  // Watch current coordinates from form
  const rawLat = control._formValues?.[latFieldName] ?? propLat;
  const rawLng = control._formValues?.[lngFieldName] ?? propLng;

  const lat = typeof rawLat === 'number' ? rawLat : Number(rawLat);
  const lng = typeof rawLng === 'number' ? rawLng : Number(rawLng);

  const hasCoords = !isNaN(lat) && !isNaN(lng) && lat !== 0 && lng !== 0 && rawLat !== undefined && rawLng !== undefined && rawLat !== null && rawLng !== null;

  if (!hasCoords) {
    return (
      <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1">
        <span>Click <strong>Capture GPS</strong> when on-site to automatically fetch high-precision coordinates.</span>
      </div>
    );
  }

  const mapsUrl = `https://www.google.com/maps?q=${lat},${lng}`;

  return (
    <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
      <div className="flex items-center gap-2">
        {lastLockedAccuracy !== null ? (
          <Badge
            variant="outline"
            className={`text-[10px] h-5 px-1.5 font-medium ${
              lastLockedAccuracy <= 10
                ? 'bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800'
                : lastLockedAccuracy <= 25
                ? 'bg-amber-50 text-amber-700 border-amber-300 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800'
                : 'bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-800 dark:text-slate-300'
            }`}
          >
            <CheckCircle2 className="h-3 w-3 mr-1" />
            Accuracy: ±{lastLockedAccuracy}m
          </Badge>
        ) : (
          <Badge variant="outline" className="text-[10px] h-5 px-1.5 bg-slate-50 text-slate-700 dark:bg-slate-900 dark:text-slate-300">
            <MapPin className="h-3 w-3 mr-1 text-slate-500" />
            Coordinates Set
          </Badge>
        )}

        <span className="text-[11px] text-muted-foreground font-mono">
          {lat.toFixed(5)}, {lng.toFixed(5)}
        </span>
      </div>

      <div className="flex items-center gap-2">
        <a
          id="link-verify-maps"
          href={mapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-[11px] text-primary hover:underline font-medium"
          title="Open coordinate location on Google Maps satellite view"
        >
          <ExternalLink className="h-3 w-3" />
          <span>Verify on Map</span>
        </a>

        {!isReadOnly && !isAcquiring && (
          <>
            <button
              id="btn-gps-recapture"
              type="button"
              onClick={onRecapture}
              className="inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors"
              title="Recapture GPS coordinates"
            >
              <RefreshCw className="h-3 w-3" />
              <span>Recapture</span>
            </button>
            <button
              id="btn-gps-clear"
              type="button"
              onClick={onClear}
              className="inline-flex items-center gap-1 text-[11px] text-destructive/80 hover:text-destructive transition-colors ml-1"
              title="Clear coordinates"
            >
              <X className="h-3 w-3" />
              <span>Clear</span>
            </button>
          </>
        )}
      </div>
    </div>
  );
}
