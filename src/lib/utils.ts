import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const getInitials = (name?: string) => {
  if (!name || name.trim() === '') return 'U';
  return name
    .trim()
    .split(/[\s-]+/)
    .filter(Boolean)
    .map(n => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
};

export const formatCase = (str: string | null | undefined): string | null | undefined => {
  if (!str || str.trim().length === 0) return str;
  
  const isAllUpperCase = str === str.toUpperCase() && str !== str.toLowerCase();
  
  // List of small words to keep in lowercase unless they are the first word.
  const lowerCaseWords = new Set(['a', 'an', 'the', 'and', 'but', 'or', 'for', 'nor', 'on', 'at', 'to', 'from', 'by', 'of', 'in', 'with']);

  // Abbreviations and acronyms that must strictly remain UPPERCASE
  const uppercaseAcronyms = new Set([
    'MLA', 'SDF', 'MPLAD', 'LSGD', 'PWD', 'GWD', 'DTH', 'ARS', 'DRW',
    'ARWSS', 'PMKSY', 'SC', 'ST', 'MGNREGS', 'GST', 'PAC', 'EMD', 'KWA',
    'KL', 'KM', 'MM', 'HP', 'KW', 'LED', 'PVC', 'GI', 'MS', 'SS', 'RC', 'NIT'
  ]);

  let formatted = str;

  if (isAllUpperCase) {
    formatted = str
      .split(' ')
      .map((word, index) => {
        const cleanWord = word.replace(/[^a-zA-Z]/g, '').toUpperCase();
        if (uppercaseAcronyms.has(cleanWord)) {
          return word.toUpperCase();
        }

        // Check hyphenated parts (e.g. MLA-SDF)
        if (word.includes('-')) {
          return word.split('-').map(part => {
            const cleanPart = part.replace(/[^a-zA-Z]/g, '').toUpperCase();
            if (uppercaseAcronyms.has(cleanPart)) return part.toUpperCase();
            const lower = part.toLowerCase();
            return part.charAt(0).toUpperCase() + lower.slice(1);
          }).join('-');
        }

        const lowerWord = word.toLowerCase();
        if (word.length > 0) {
          if (index > 0 && lowerCaseWords.has(lowerWord)) {
            return lowerWord;
          }
          return word.charAt(0).toUpperCase() + lowerWord.slice(1);
        }
        return '';
      })
      .join(' ');
  }

  // Ensure standard acronyms are preserved regardless of input casing
  return formatted
    .replace(/\bMla\s*-\s*Sdf\b/gi, 'MLA - SDF')
    .replace(/\bMla-Sdf\b/gi, 'MLA - SDF')
    .replace(/\bMla\b/gi, 'MLA')
    .replace(/\bSdf\b/gi, 'SDF')
    .replace(/\bMplad\b/gi, 'MPLAD')
    .replace(/\bLsgd\b/gi, 'LSGD');
};

export const KERALA_DISTRICTS = [
  "Directorate TVM", "Thiruvananthapuram", "Kollam", "Pathanamthitta",
  "Alappuzha", "Kottayam", "Idukki", "Ernakulam", "Thrissur", "Palakkad",
  "Malappuram", "Kozhikode", "Wayanad", "Kannur", "Kasaragod",
  "Lab TVM", "Lab EKM", "Lab KKD"
];

export function formatDistrictLocation(loc?: string | null): string {
  if (!loc) return '';
  const trimmed = loc.trim();
  const match = KERALA_DISTRICTS.find(d => d.toLowerCase() === trimmed.toLowerCase());
  if (match) return match;
  return trimmed
    .split(' ')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');
}

export const DISTRICT_MALAYALAM_MAP: Record<string, string> = {
  'thiruvananthapuram': 'തിരുവനന്തപുരം',
  'tvm': 'തിരുവനന്തപുരം',
  'kollam': 'കൊല്ലം',
  'klm': 'കൊല്ലം',
  'pathanamthitta': 'പത്തനംതിട്ട',
  'pta': 'പത്തനംതിട്ട',
  'alappuzha': 'ആലപ്പുഴ',
  'alp': 'ആലപ്പുഴ',
  'kottayam': 'കോട്ടയം',
  'ktm': 'കോട്ടയം',
  'idukki': 'ഇടുക്കി',
  'idk': 'ഇടുക്കി',
  'ernakulam': 'എറണാകുളം',
  'ekm': 'എറണാകുളം',
  'thrissur': 'തൃശ്ശൂർ',
  'tsr': 'തൃശ്ശൂർ',
  'palakkad': 'പാലക്കാട്',
  'pkd': 'പാലക്കാട്',
  'malappuram': 'മലപ്പുറം',
  'mpm': 'മലപ്പുറം',
  'kozhikode': 'കോഴിക്കോട്',
  'kkd': 'കോഴിക്കോട്',
  'wayanad': 'വയനാട്',
  'wyd': 'വയനാട്',
  'kannur': 'കണ്ണൂർ',
  'knr': 'കണ്ണൂർ',
  'kasaragod': 'കാസർഗോഡ്',
  'ksg': 'കാസർഗോഡ്',
  'directorate tvm': 'തിരുവനന്തപുരം',
  'lab tvm': 'തിരുവനന്തപുരം',
  'lab ekm': 'എറണാകുളം',
  'lab kkd': 'കോഴിക്കോട്'
};

export function getDistrictMalayalam(location?: string | null): string {
  if (!location) return 'കൊല്ലം';
  const locLower = location.trim().toLowerCase();
  if (DISTRICT_MALAYALAM_MAP[locLower]) {
    return DISTRICT_MALAYALAM_MAP[locLower];
  }
  return location;
}

export function checkIsSiteDataChanged(initialData: any, currentValues: any): boolean {
  if (!initialData) return true;
  
  // Check if initialData was empty (adding a new site)
  const isNewSite = !initialData.id && !initialData.nameOfSite && !initialData.name;
  
  if (isNewSite) {
    return Boolean(
      (currentValues?.nameOfSite && currentValues.nameOfSite.trim() !== '') ||
      (currentValues?.name && currentValues.name.trim() !== '') ||
      (currentValues?.location && currentValues.location.trim() !== '') ||
      (currentValues?.purpose && currentValues.purpose.trim() !== '') ||
      (currentValues?.typeOfWell && currentValues.typeOfWell.trim() !== '') ||
      (currentValues?.workStatus && currentValues.workStatus !== 'Under Process') ||
      (currentValues?.workImages && currentValues.workImages.length > 0) ||
      (currentValues?.workVideos && currentValues.workVideos.length > 0)
    );
  }

  if (!currentValues) return false;

  const ignoreKeys = new Set(['index', 'fileNo', 'officeLocation', 'district', 'office', 'currentFileNo']);
  const allKeys = new Set([
    ...Object.keys(initialData || {}),
    ...Object.keys(currentValues || {})
  ]);

  for (const key of allKeys) {
    if (ignoreKeys.has(key)) continue;

    let initVal = initialData[key];
    let currVal = currentValues[key];

    // Normalize null / undefined / empty string
    if (initVal === null || initVal === undefined) initVal = '';
    if (currVal === null || currVal === undefined) currVal = '';

    // Arrays
    if (Array.isArray(currVal) || Array.isArray(initVal)) {
      const arrInit = Array.isArray(initVal) ? initVal : [];
      const arrCurr = Array.isArray(currVal) ? currVal : [];
      if (arrInit.length !== arrCurr.length) return true;
      if (JSON.stringify(arrInit) !== JSON.stringify(arrCurr)) return true;
      continue;
    }

    // Objects
    if (typeof currVal === 'object' || typeof initVal === 'object') {
      if (JSON.stringify(initVal) !== JSON.stringify(currVal)) return true;
      continue;
    }

    // Primitive values
    if (String(initVal).trim() !== String(currVal).trim()) {
      return true;
    }
  }

  return false;
}
