'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';

export interface GpsFixResult {
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: number;
}

export interface UseHighAccuracyGpsOptions {
  targetAccuracyMeters?: number; // Desired accuracy threshold (default: 10m)
  maxTimeoutSeconds?: number;    // Maximum time to acquire target accuracy (default: 15s)
}

export function useHighAccuracyGps(options: UseHighAccuracyGpsOptions = {}) {
  const { targetAccuracyMeters = 10, maxTimeoutSeconds = 15 } = options;
  const { toast } = useToast();

  const [status, setStatus] = useState<'idle' | 'acquiring' | 'locked' | 'error'>('idle');
  const [currentAccuracy, setCurrentAccuracy] = useState<number | null>(null);
  const [bestFix, setBestFix] = useState<GpsFixResult | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const watchIdRef = useRef<number | null>(null);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const timeoutDeadlineRef = useRef<NodeJS.Timeout | null>(null);
  const bestFixRef = useRef<GpsFixResult | null>(null);
  const onCompleteRef = useRef<((fix: GpsFixResult) => void) | null>(null);

  const clearAllWatchers = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    if (timeoutDeadlineRef.current) {
      clearTimeout(timeoutDeadlineRef.current);
      timeoutDeadlineRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      clearAllWatchers();
    };
  }, [clearAllWatchers]);

  const lockFix = useCallback((fix: GpsFixResult, reason: 'target_met' | 'best_effort' | 'manual') => {
    clearAllWatchers();
    setBestFix(fix);
    bestFixRef.current = fix;
    setStatus('locked');
    setErrorMessage(null);

    if (onCompleteRef.current) {
      onCompleteRef.current(fix);
    }

    if (reason === 'target_met') {
      toast({
        title: 'High-Accuracy GPS Locked',
        description: `Coordinates captured within ±${fix.accuracy.toFixed(1)}m precision.`,
      });
    } else if (reason === 'best_effort') {
      toast({
        title: 'GPS Captured (Best Available)',
        description: `Coordinates locked at ±${fix.accuracy.toFixed(1)}m accuracy.`,
      });
    } else if (reason === 'manual') {
      toast({
        title: 'GPS Position Locked',
        description: `Accepted current reading at ±${fix.accuracy.toFixed(1)}m accuracy.`,
      });
    }
  }, [clearAllWatchers, toast]);

  const startCapture = useCallback((onSuccess?: (fix: GpsFixResult) => void) => {
    if (typeof window === 'undefined' || !navigator.geolocation) {
      const msg = 'Geolocation is not supported by your browser or device.';
      setErrorMessage(msg);
      setStatus('error');
      toast({ title: 'GPS Error', description: msg, variant: 'destructive' });
      return;
    }

    clearAllWatchers();
    onCompleteRef.current = onSuccess || null;
    bestFixRef.current = null;
    setBestFix(null);
    setCurrentAccuracy(null);
    setErrorMessage(null);
    setElapsedSeconds(0);
    setStatus('acquiring');

    const startTime = Date.now();
    timerIntervalRef.current = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTime) / 1000);
      setElapsedSeconds(elapsed);
    }, 500);

    // Timeout fallback: if maxTimeoutSeconds passes, lock onto the best fix achieved so far
    timeoutDeadlineRef.current = setTimeout(() => {
      if (bestFixRef.current) {
        lockFix(bestFixRef.current, 'best_effort');
      } else {
        clearAllWatchers();
        const msg = 'GPS acquisition timed out. Please ensure you have an unobstructed view of the sky and location services are turned on.';
        setErrorMessage(msg);
        setStatus('error');
        toast({ title: 'GPS Timeout', description: msg, variant: 'destructive' });
      }
    }, maxTimeoutSeconds * 1000);

    try {
      watchIdRef.current = navigator.geolocation.watchPosition(
        (pos) => {
          const { latitude, longitude, accuracy } = pos.coords;
          const roundedLat = Number(latitude.toFixed(6));
          const roundedLng = Number(longitude.toFixed(6));
          const currentFix: GpsFixResult = {
            latitude: roundedLat,
            longitude: roundedLng,
            accuracy: Math.round(accuracy * 10) / 10,
            timestamp: pos.timestamp,
          };

          setCurrentAccuracy(currentFix.accuracy);

          // Update best fix if none yet or if current fix has better (lower) accuracy
          if (!bestFixRef.current || currentFix.accuracy < bestFixRef.current.accuracy) {
            bestFixRef.current = currentFix;
            setBestFix(currentFix);
          }

          // If target accuracy (e.g. <= 10m) is reached, lock immediately!
          if (currentFix.accuracy <= targetAccuracyMeters) {
            lockFix(currentFix, 'target_met');
          }
        },
        (error) => {
          clearAllWatchers();
          let msg = 'Failed to acquire GPS location.';
          if (error.code === error.PERMISSION_DENIED) {
            msg = 'Location permission was denied. Please allow location access in your browser/device settings.';
          } else if (error.code === error.POSITION_UNAVAILABLE) {
            msg = 'GPS signal is unavailable. Please verify device GPS is enabled and you have satellite reception.';
          } else if (error.code === error.TIMEOUT) {
            msg = 'GPS request timed out. Please try again in an open area.';
          }
          setErrorMessage(msg);
          setStatus('error');
          toast({ title: 'GPS Location Error', description: msg, variant: 'destructive' });
        },
        {
          enableHighAccuracy: true,
          timeout: maxTimeoutSeconds * 1000,
          maximumAge: 0,
        }
      );
    } catch (err) {
      clearAllWatchers();
      const msg = 'Unexpected error starting GPS acquisition.';
      setErrorMessage(msg);
      setStatus('error');
      toast({ title: 'GPS Error', description: msg, variant: 'destructive' });
    }
  }, [clearAllWatchers, lockFix, maxTimeoutSeconds, targetAccuracyMeters, toast]);

  const forceLockNow = useCallback(() => {
    if (bestFixRef.current) {
      lockFix(bestFixRef.current, 'manual');
    }
  }, [lockFix]);

  const cancelCapture = useCallback(() => {
    clearAllWatchers();
    setStatus('idle');
    setCurrentAccuracy(null);
  }, [clearAllWatchers]);

  return {
    status,
    isAcquiring: status === 'acquiring',
    isLocked: status === 'locked',
    currentAccuracy,
    bestFix,
    elapsedSeconds,
    errorMessage,
    startCapture,
    forceLockNow,
    cancelCapture,
  };
}
