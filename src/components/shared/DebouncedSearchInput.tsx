// src/components/shared/DebouncedSearchInput.tsx
"use client";

import React, { useState, useEffect, useRef, useTransition, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface DebouncedSearchInputProps extends Omit<React.ComponentProps<typeof Input>, "onChange" | "value"> {
  value: string;
  onSearchChange: (value: string) => void;
  debounceMs?: number;
  showClearButton?: boolean;
}

export function DebouncedSearchInput({
  value,
  onSearchChange,
  debounceMs = 250,
  className,
  showClearButton = true,
  ...props
}: DebouncedSearchInputProps) {
  // Local state for instant input responsiveness (zero latency)
  const [localValue, setLocalValue] = useState<string>(value || "");
  const [, startTransition] = useTransition();
  const lastEmittedValueRef = useRef<string>(value || "");
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const onSearchChangeRef = useRef(onSearchChange);

  // Keep callback ref up to date
  useEffect(() => {
    onSearchChangeRef.current = onSearchChange;
  }, [onSearchChange]);

  // Sync with external value changes ONLY if changed from outside (e.g. parent reset/clear)
  useEffect(() => {
    if (value !== lastEmittedValueRef.current) {
      setLocalValue(value || "");
      lastEmittedValueRef.current = value || "";
    }
  }, [value]);

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const nextVal = e.target.value;
    // 1. Immediately update local UI - 60fps instant keystroke feedback
    setLocalValue(nextVal);

    // 2. Clear previous debounce timer
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    // 3. Debounce the heavy parent filter calculation using non-blocking transition
    timerRef.current = setTimeout(() => {
      lastEmittedValueRef.current = nextVal;
      startTransition(() => {
        onSearchChangeRef.current(nextVal);
      });
    }, debounceMs);
  }, [debounceMs]);

  const handleClear = useCallback(() => {
    setLocalValue("");
    lastEmittedValueRef.current = "";
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    startTransition(() => {
      onSearchChangeRef.current("");
    });
  }, []);

  return (
    <div className="relative w-full flex items-center">
      <Input
        {...props}
        className={cn(showClearButton && localValue ? "pr-8" : "", className)}
        value={localValue}
        onChange={handleChange}
      />
      {showClearButton && localValue ? (
        <button
          type="button"
          onClick={handleClear}
          tabIndex={-1}
          aria-label="Clear search"
          className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground rounded-full hover:bg-muted/80 transition-colors z-20 cursor-pointer"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      ) : null}
    </div>
  );
}

