// src/lib/searchUtils.ts
import { format, isValid, parseISO } from "date-fns";
import type { DataEntryFormData } from "@/lib/schemas";

/**
 * Safely parse date representations (Date instance, Firestore timestamp object, ISO string, etc.)
 */
const safeParseDate = (dateValue: any): Date | null => {
  if (!dateValue) return null;
  if (dateValue instanceof Date && isValid(dateValue)) return dateValue;
  if (typeof dateValue === 'string') {
    const parsed = parseISO(dateValue);
    if (isValid(parsed)) return parsed;
    const direct = new Date(dateValue);
    if (isValid(direct)) return direct;
  }
  if (typeof dateValue === 'object' && dateValue.toDate && typeof dateValue.toDate === 'function') {
    const parsed = dateValue.toDate();
    if (isValid(parsed)) return parsed;
  }
  return null;
};

/**
 * Extract all possible text and formatted date/amount representations from an arbitrary value or nested object.
 */
export function extractSearchableStrings(data: any): string[] {
  const result: string[] = [];

  const traverse = (item: any) => {
    if (item === null || item === undefined) return;

    if (typeof item === 'string' || typeof item === 'number' || typeof item === 'boolean') {
      const strVal = String(item).trim();
      if (strVal) {
        result.push(strVal);
      }

      // If item is a number or can be parsed as a number, generate multiple amount / number representations
      if (typeof item === 'number' || (!isNaN(Number(item)) && strVal !== '' && !strVal.startsWith('0') && strVal.length < 15)) {
        const num = Number(item);
        if (!isNaN(num)) {
          result.push(
            String(num),
            num.toFixed(0),
            num.toFixed(2),
            num.toLocaleString('en-IN'),
            num.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
            `₹${num.toLocaleString('en-IN')}`,
            `₹${num.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
          );
        }
      }

      // Check if it represents an ISO date or standard date format
      if (typeof item === 'string' && item.length >= 8 && (item.includes('-') || item.includes('/'))) {
        const parsedDate = safeParseDate(item);
        if (parsedDate) {
          addDateFormats(parsedDate, result);
        }
      }
      return;
    }

    if (item instanceof Date) {
      if (isValid(item)) {
        addDateFormats(item, result);
      }
      return;
    }

    if (typeof item === 'object') {
      // Check if it's a Firestore Timestamp object with .toDate()
      if (typeof item.toDate === 'function') {
        const parsedDate = item.toDate();
        if (isValid(parsedDate)) {
          addDateFormats(parsedDate, result);
        }
        return;
      }

      // Array or plain object
      if (Array.isArray(item)) {
        for (const element of item) {
          traverse(element);
        }
      } else {
        for (const key of Object.keys(item)) {
          // Avoid internal binary/huge data fields or circular refs if any
          if (key === 'previewUrl' || key === 'base64') continue;
          traverse(item[key]);
        }
      }
    }
  };

  traverse(data);
  return result;
}

function addDateFormats(d: Date, target: string[]) {
  try {
    target.push(
      format(d, 'dd/MM/yyyy'),
      format(d, 'd/M/yyyy'),
      format(d, 'dd-MM-yyyy'),
      format(d, 'yyyy-MM-dd'),
      format(d, 'dd MMM yyyy'),
      format(d, 'dd MMMM yyyy'),
      format(d, 'MMM yyyy'),
      format(d, 'MMMM yyyy'),
      format(d, 'yyyy')
    );
  } catch {
    // Ignore any unexpected date format exceptions
  }
}

/**
 * Checks if a DataEntryFormData matches the given search query across ALL fields in the entry.
 * Supports multi-token searching where each keyword must match somewhere in the entry's data.
 */
export function matchesAllDataSearch(entry: DataEntryFormData, searchTerm: string): boolean {
  if (!searchTerm || !searchTerm.trim()) return true;

  const rawTokens = searchTerm.trim().toLowerCase().split(/\s+/).filter(Boolean);
  if (rawTokens.length === 0) return true;

  // Extract all searchable strings from the entire entry object (including all nested sites, remittances, payments, etc.)
  const allStrings = extractSearchableStrings(entry);
  const unifiedSearchableBlob = allStrings.join(' ').toLowerCase();

  // Every token entered by the user must appear in the searchable content
  return rawTokens.every(token => unifiedSearchableBlob.includes(token));
}
