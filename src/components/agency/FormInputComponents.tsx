"use client";

import React from "react";
import { Upload, X } from "lucide-react";

// Pin Code Box Grid (6 digits)
export function PinCodeGrid({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  const inputRefs = React.useRef<(HTMLInputElement | null)[]>([]);
  const rawStr = String(value || "");
  const chars = Array.from({ length: 6 }).map((_, i) => rawStr[i] || "");

  const handleCharChange = (idx: number, newChar: string) => {
    if (newChar.length > 1) {
      const sanitized = newChar.replace(/\D/g, "").slice(0, 6);
      onChange(sanitized);
      const nextIdx = Math.min(sanitized.length, 5);
      inputRefs.current[nextIdx]?.focus();
      return;
    }
    const currentChars = [...chars];
    currentChars[idx] = newChar;
    const result = currentChars.join("").trimEnd();
    onChange(result);

    if (newChar && idx < 5) {
      inputRefs.current[idx + 1]?.focus();
    }
  };

  const handleKeyDown = (idx: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace") {
      if (!chars[idx] && idx > 0) {
        e.preventDefault();
        const currentChars = [...chars];
        currentChars[idx - 1] = "";
        onChange(currentChars.join("").trimEnd());
        inputRefs.current[idx - 1]?.focus();
      } else if (chars[idx]) {
        // clear current char
        const currentChars = [...chars];
        currentChars[idx] = "";
        onChange(currentChars.join("").trimEnd());
      } else if (idx > 0) {
        inputRefs.current[idx - 1]?.focus();
      }
    } else if (e.key === "ArrowLeft" && idx > 0) {
      inputRefs.current[idx - 1]?.focus();
    } else if (e.key === "ArrowRight" && idx < 5) {
      inputRefs.current[idx + 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pasted) {
      onChange(pasted);
      const nextIdx = Math.min(pasted.length, 5);
      inputRefs.current[nextIdx]?.focus();
    }
  };

  return (
    <div className="inline-flex shrink-0 items-center border border-black bg-white">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="w-5 h-6 border-r border-black last:border-r-0 flex items-center justify-center">
          <input
            ref={(el) => {
              inputRefs.current[i] = el;
            }}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={chars[i]}
            onChange={(e) => handleCharChange(i, e.target.value)}
            onKeyDown={(e) => handleKeyDown(i, e)}
            onPaste={handlePaste}
            className="w-full h-full text-center text-xs font-mono font-bold focus:outline-none focus:bg-yellow-50 bg-transparent"
          />
        </div>
      ))}
    </div>
  );
}

// PAN Number Grid (10 digits)
export function PanGrid({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  const inputRefs = React.useRef<(HTMLInputElement | null)[]>([]);
  const rawStr = String(value || "").toUpperCase();
  const chars = Array.from({ length: 10 }).map((_, i) => rawStr[i] || "");

  const handleCharChange = (idx: number, newChar: string) => {
    if (newChar.length > 1) {
      const sanitized = newChar.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 10);
      onChange(sanitized);
      const nextIdx = Math.min(sanitized.length, 9);
      inputRefs.current[nextIdx]?.focus();
      return;
    }
    const currentChars = [...chars];
    currentChars[idx] = newChar.toUpperCase();
    const result = currentChars.join("").trimEnd();
    onChange(result);

    if (newChar && idx < 9) {
      inputRefs.current[idx + 1]?.focus();
    }
  };

  const handleKeyDown = (idx: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace") {
      if (!chars[idx] && idx > 0) {
        e.preventDefault();
        const currentChars = [...chars];
        currentChars[idx - 1] = "";
        onChange(currentChars.join("").trimEnd());
        inputRefs.current[idx - 1]?.focus();
      } else if (chars[idx]) {
        const currentChars = [...chars];
        currentChars[idx] = "";
        onChange(currentChars.join("").trimEnd());
      } else if (idx > 0) {
        inputRefs.current[idx - 1]?.focus();
      }
    } else if (e.key === "ArrowLeft" && idx > 0) {
      inputRefs.current[idx - 1]?.focus();
    } else if (e.key === "ArrowRight" && idx < 9) {
      inputRefs.current[idx + 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 10);
    if (pasted) {
      onChange(pasted);
      const nextIdx = Math.min(pasted.length, 9);
      inputRefs.current[nextIdx]?.focus();
    }
  };

  return (
    <div className="inline-flex shrink-0 items-center border border-black bg-white">
      {Array.from({ length: 10 }).map((_, i) => (
        <div key={i} className="w-5 h-6 border-r border-black last:border-r-0 flex items-center justify-center">
          <input
            ref={(el) => {
              inputRefs.current[i] = el;
            }}
            type="text"
            maxLength={1}
            value={chars[i]}
            onChange={(e) => handleCharChange(i, e.target.value)}
            onKeyDown={(e) => handleKeyDown(i, e)}
            onPaste={handlePaste}
            className="w-full h-full text-center text-xs font-mono font-bold focus:outline-none focus:bg-yellow-50 uppercase bg-transparent"
          />
        </div>
      ))}
    </div>
  );
}

// Photo Box Component with upload option
export function PhotoBox({
  photoUrl,
  onPhotoChange,
}: {
  photoUrl?: string;
  onPhotoChange?: (url: string) => void;
}) {
  return (
    <div className="w-24 sm:w-28 h-32 sm:h-36 border border-black flex flex-col items-center justify-center relative bg-gray-50 text-center p-1 group shrink-0 self-start sm:self-auto">
      {photoUrl ? (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={photoUrl} alt="Photo" className="w-full h-full object-cover" />
          {onPhotoChange && (
            <button
              type="button"
              onClick={() => onPhotoChange("")}
              className="absolute top-1 right-1 bg-red-600 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity print:hidden"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </>
      ) : (
        <>
          <span className="text-xs font-bold text-gray-700">ഫോട്ടോ</span>
          <span className="text-[9px] text-gray-500 mt-0.5">(Photo)</span>
          {onPhotoChange && (
            <label className="mt-2 text-[10px] text-blue-600 cursor-pointer underline flex items-center gap-0.5 print:hidden">
              <Upload className="w-2.5 h-2.5" /> അപ്‌ലോഡ്
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    const reader = new FileReader();
                    reader.onload = (ev) => onPhotoChange(ev.target?.result as string);
                    reader.readAsDataURL(file);
                  }
                }}
              />
            </label>
          )}
        </>
      )}
    </div>
  );
}

// Inline Form Underline Text Input
export function FormLineInput({
  value,
  onChange,
  className = "",
  placeholder = "",
  width = "flex-1 min-w-0",
}: {
  value: string | undefined | null;
  onChange: (v: string) => void;
  className?: string;
  placeholder?: string;
  width?: string;
}) {
  return (
    <input
      type="text"
      value={value ?? ""}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      title={value ? String(value) : ""}
      className={`${width} min-w-0 bg-transparent border-b border-dotted border-black px-1 text-xs sm:text-sm font-semibold focus:outline-none focus:border-solid focus:border-blue-600 focus:bg-blue-50/50 print:border-black print:border-b ${className}`}
    />
  );
}

// Helper to format ISO, Date, timestamp or YYYY-MM-DD dates to dd/mm/yyyy
export function formatToDDMMYYYY(val: any): string {
  if (!val) return "";
  if (val instanceof Date) {
    if (isNaN(val.getTime())) return "";
    const dd = String(val.getDate()).padStart(2, "0");
    const mm = String(val.getMonth() + 1).padStart(2, "0");
    const yyyy = val.getFullYear();
    return `${dd}/${mm}/${yyyy}`;
  }
  if (typeof val === "object" && typeof val.toDate === "function") {
    try {
      const d = val.toDate();
      const dd = String(d.getDate()).padStart(2, "0");
      const mm = String(d.getMonth() + 1).padStart(2, "0");
      const yyyy = d.getFullYear();
      return `${dd}/${mm}/${yyyy}`;
    } catch {
      // ignore
    }
  }
  if (typeof val === "object" && typeof val.seconds === "number") {
    const d = new Date(val.seconds * 1000);
    const dd = String(d.getDate()).padStart(2, "0");
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const yyyy = d.getFullYear();
    return `${dd}/${mm}/${yyyy}`;
  }
  if (typeof val === "string") {
    const trimmed = val.trim();
    if (!trimmed) return "";

    // Check if already dd/mm/yyyy
    const ddmmyyyyMatch = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (ddmmyyyyMatch) {
      const [_, dd, mm, yyyy] = ddmmyyyyMatch;
      return `${dd.padStart(2, "0")}/${mm.padStart(2, "0")}/${yyyy}`;
    }

    // Check yyyy-mm-dd or yyyy/mm/dd
    const isoMatch = trimmed.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
    if (isoMatch) {
      const [_, yyyy, mm, dd] = isoMatch;
      return `${dd.padStart(2, "0")}/${mm.padStart(2, "0")}/${yyyy}`;
    }

    // Check dd-mm-yyyy
    const dashMatch = trimmed.match(/^(\d{1,2})-(\d{1,2})-(\d{4})$/);
    if (dashMatch) {
      const [_, dd, mm, yyyy] = dashMatch;
      return `${dd.padStart(2, "0")}/${mm.padStart(2, "0")}/${yyyy}`;
    }

    // If Date.parse works
    const parsed = new Date(trimmed);
    if (!isNaN(parsed.getTime()) && trimmed.includes("-")) {
      const dd = String(parsed.getDate()).padStart(2, "0");
      const mm = String(parsed.getMonth() + 1).padStart(2, "0");
      const yyyy = parsed.getFullYear();
      return `${dd}/${mm}/${yyyy}`;
    }
    return trimmed;
  }
  return String(val);
}

// Dedicated Underlined Date Input for Forms (dd/mm/yyyy format)
export function FormDateInput({
  value,
  onChange,
  className = "",
  placeholder = "dd/mm/yyyy",
  width = "w-28",
}: {
  value: string | undefined | null;
  onChange: (v: string) => void;
  className?: string;
  placeholder?: string;
  width?: string;
}) {
  const displayVal = formatToDDMMYYYY(value);

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const formatted = formatToDDMMYYYY(e.target.value);
    if (formatted && formatted !== e.target.value) {
      onChange(formatted);
    }
  };

  return (
    <input
      type="text"
      value={displayVal}
      onChange={(e) => onChange(e.target.value)}
      onBlur={handleBlur}
      placeholder={placeholder}
      maxLength={10}
      title="Date format: dd/mm/yyyy"
      className={`${width} min-w-0 bg-transparent border-b border-dotted border-black px-1 text-xs sm:text-sm font-semibold text-center focus:outline-none focus:border-solid focus:border-blue-600 focus:bg-blue-50/50 print:border-black print:border-b ${className}`}
    />
  );
}
