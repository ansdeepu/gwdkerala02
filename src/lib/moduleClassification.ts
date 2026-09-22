// src/lib/moduleClassification.ts

import { 
  COLLECTOR_APPLICATION_TYPES, 
  PRIVATE_APPLICATION_TYPES, 
  PLAN_FUND_APPLICATION_TYPES,
  PUBLIC_DEPOSIT_APPLICATION_TYPES,
  LOGGING_PUMPING_TEST_PURPOSE_OPTIONS,
} from './schemas/DataEntrySchema';

export type FileModuleCategory =
  | 'public_deposit'
  | 'collectors_deposit'
  | 'private_deposit'
  | 'plan_fund'
  | 'gw_investigation'
  | 'logging_pumping_test'
  | 'ars';

export const MODULE_NAMES: Record<FileModuleCategory, string> = {
  public_deposit: 'Deposit Works',
  collectors_deposit: "Collector's Deposit Works",
  private_deposit: 'Private Deposit Works',
  plan_fund: 'Plan Fund Works',
  gw_investigation: 'GW Investigation',
  logging_pumping_test: 'Logging & Pumping Test',
  ars: 'ARS',
};

export const isWorksModuleCategory = (category: FileModuleCategory): boolean => {
  return (
    category === 'public_deposit' ||
    category === 'collectors_deposit' ||
    category === 'private_deposit' ||
    category === 'plan_fund'
  );
};

export const getModuleCategoryFromData = (
  entry: any, 
  workTypeContext?: string | null
): FileModuleCategory => {
  if (!entry) {
    if (workTypeContext === 'ars') return 'ars';
    if (workTypeContext === 'loggingPumpingTest') return 'logging_pumping_test';
    if (workTypeContext === 'gwInvestigation') return 'gw_investigation';
    if (workTypeContext === 'collector') return 'collectors_deposit';
    if (workTypeContext === 'private') return 'private_deposit';
    if (workTypeContext === 'planFund') return 'plan_fund';
    return 'public_deposit';
  }

  // Check explicit workType / workTypeContext
  const wt = workTypeContext || entry.workTypeContext || entry.workType || entry.typeOfWork;
  if (wt === 'ars') return 'ars';
  if (wt === 'loggingPumpingTest') return 'logging_pumping_test';
  if (wt === 'gwInvestigation') return 'gw_investigation';
  if (wt === 'collector') return 'collectors_deposit';
  if (wt === 'private') return 'private_deposit';
  if (wt === 'planFund') return 'plan_fund';
  if (wt === 'public') return 'public_deposit';

  // Check string indicators on entry
  const ptStr = (entry.pageType || entry.typeOfPage || entry.module || entry.category || '').toString().trim().toLowerCase();
  if (ptStr === 'gw investigation' || ptStr === 'gw_investigation' || ptStr.includes('investigation')) return 'gw_investigation';
  if (ptStr === 'logging & pumping test' || ptStr === 'logging_pumping_test' || ptStr.includes('logging') || ptStr.includes('pumping')) return 'logging_pumping_test';
  if (ptStr === 'ars' || ptStr.includes('ars')) return 'ars';
  if (ptStr.includes('collector')) return 'collectors_deposit';
  if (ptStr.includes('private')) return 'private_deposit';
  if (ptStr.includes('plan fund')) return 'plan_fund';

  // 1. ARS detection
  if (
    entry.arsTypeOfScheme || 
    entry.arsStatus || 
    entry.isArs || 
    entry.asNo || 
    entry.nameOfScheme
  ) {
    return 'ars';
  }

  // 3. Purpose-based checks (Logging & Pumping vs Investigation)
  const hasLoggingPumpingPurpose = entry.siteDetails?.some(
    (site: any) => site.purpose && (LOGGING_PUMPING_TEST_PURPOSE_OPTIONS as readonly string[]).includes(site.purpose)
  );
  const hasInvestigationPurpose = entry.siteDetails?.some(
    (site: any) => site.purpose === 'GW Investigation'
  );
  const isInvestigationCategory = ['Govt', 'Private', 'Complaints'].includes(entry.category);

  if (hasLoggingPumpingPurpose && !hasInvestigationPurpose) {
    return 'logging_pumping_test';
  }

  if (
    (isInvestigationCategory || hasInvestigationPurpose) && 
    !hasLoggingPumpingPurpose
  ) {
    return 'gw_investigation';
  }

  // 4. Works application types
  if (entry.applicationType) {
    if ((COLLECTOR_APPLICATION_TYPES as readonly string[]).includes(entry.applicationType)) {
      return 'collectors_deposit';
    }
    if ((PRIVATE_APPLICATION_TYPES as readonly string[]).includes(entry.applicationType)) {
      return 'private_deposit';
    }
    if ((PLAN_FUND_APPLICATION_TYPES as readonly string[]).includes(entry.applicationType)) {
      return 'plan_fund';
    }
    if ((PUBLIC_DEPOSIT_APPLICATION_TYPES as readonly string[]).includes(entry.applicationType)) {
      return 'public_deposit';
    }
  }

  return 'public_deposit';
};

export const cleanFileNo = (fileNo?: string | null): string => {
  if (!fileNo) return '';
  return fileNo.replace(/^[a-zA-Z]{2,}[a-zA-Z\s\/\\-]*?(?=\d)/, '').trim().toUpperCase();
};

export interface FileConflictResult {
  conflict: boolean;
  conflictingDocId?: string;
  conflictingModule?: string;
  errorMessage?: string;
}

/**
 * Checks if a given file number violates the uniqueness rules:
 * - Mutually unique among Works modules (Deposit, Collector, Private, Plan Fund).
 * - Unique within GW Investigation.
 * - Unique within Logging & Pumping Test.
 * - Unique within ARS.
 * - But a file number CAN exist across Works, GW Investigation, Logging & Pumping Test, and ARS.
 */
export const checkFileNumberConflict = (
  targetFileNo: string,
  targetCategory: FileModuleCategory,
  currentDocId: string | null | undefined,
  existingDocs: Array<{ id: string; fileNo?: string; [key: string]: any }>
): FileConflictResult => {
  const cleanedTarget = cleanFileNo(targetFileNo);
  if (!cleanedTarget) return { conflict: false };

  const isTargetWorks = isWorksModuleCategory(targetCategory);

  for (const doc of existingDocs) {
    if (currentDocId && doc.id === currentDocId) continue;
    
    const docCleaned = cleanFileNo(doc.fileNo);
    if (!docCleaned || docCleaned !== cleanedTarget) continue;

    const docCategory = getModuleCategoryFromData(doc);

    if (isTargetWorks) {
      if (isWorksModuleCategory(docCategory)) {
        const moduleName = MODULE_NAMES[docCategory];
        return {
          conflict: true,
          conflictingDocId: doc.id,
          conflictingModule: moduleName,
          errorMessage: `File No. "${targetFileNo}" is already present in ${moduleName}. A file number must be unique among Deposit Works, Collector's Deposit Works, Private Deposit Works, and Plan Fund Works.`,
        };
      }
    } else {
      if (docCategory === targetCategory) {
        const moduleName = MODULE_NAMES[docCategory];
        return {
          conflict: true,
          conflictingDocId: doc.id,
          conflictingModule: moduleName,
          errorMessage: `File No. "${targetFileNo}" is already present in ${moduleName}.`,
        };
      }
    }
  }

  return { conflict: false };
};

/**
 * Matches a user-selected re-appropriation Page Type with a FileModuleCategory.
 */
export const matchPageTypeWithModuleCategory = (
  pageType: string | null | undefined,
  category: FileModuleCategory
): boolean => {
  if (!pageType) return true;
  const pt = pageType.trim().toLowerCase();
  if (pt === 'gw investigation' || pt.includes('investigation')) {
    return category === 'gw_investigation';
  }
  if (pt === 'logging & pumping test' || pt.includes('logging') || pt.includes('pumping')) {
    return category === 'logging_pumping_test';
  }
  if (pt === 'ars' || pt.includes('ars')) {
    return category === 'ars';
  }
  if (pt === 'deposit work' || pt.includes('deposit') || pt.includes('plan fund') || pt.includes('works')) {
    return isWorksModuleCategory(category);
  }
  return true;
};

/**
 * Finds a target file entry matching a reference file number, respecting the specified module / pageType.
 * Prevents cross-module file number collisions (e.g. File 906/2025 existing as both a Deposit Work and a GW Investigation).
 */
export const findTargetFileEntry = (
  refFileNo: string | null | undefined,
  pageType: string | null | undefined,
  allFileEntries: any[] = [],
  allArsEntries: any[] = []
): any => {
  if (!refFileNo) return null;
  const normRef = refFileNo.trim().toLowerCase();
  const cleanedRef = cleanFileNo(refFileNo);

  const isMatch = (e: any) => {
    if (!e || !e.fileNo) return false;
    const f = e.fileNo.trim().toLowerCase();
    if (f === normRef) return true;
    if (cleanedRef && cleanFileNo(e.fileNo) === cleanedRef) return true;
    return false;
  };

  const pt = (pageType || '').trim().toLowerCase();

  // 1. If pageType is ARS
  if (pt === 'ars' || pt.includes('ars')) {
    const foundArs = allArsEntries.find(isMatch);
    if (foundArs) return foundArs;
  }

  // 2. If pageType is GW Investigation, Logging & Pumping, or Deposit Work
  if (pageType && pageType.trim()) {
    const filteredFiles = allFileEntries.filter(entry => {
      const cat = getModuleCategoryFromData(entry);
      return matchPageTypeWithModuleCategory(pageType, cat);
    });
    const found = filteredFiles.find(isMatch);
    if (found) return found;

    // If pageType was explicitly specified and matched no file in that module, return null to avoid cross-module collision
    return null;
  }

  // 3. Fallback: if not found in specified category or pageType was not provided
  const foundFile = allFileEntries.find(isMatch);
  if (foundFile) return foundFile;

  const foundArs = allArsEntries.find(isMatch);
  if (foundArs) return foundArs;

  return null;
};
