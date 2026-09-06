// src/app/dashboard/reports/page.tsx
"use client";

import React, { useState, useMemo, useEffect, useCallback } from "react";
import ReportTable from "@/components/reports/ReportTable";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { useFileEntries } from "@/hooks/useFileEntries";
import { usePageHeader } from "@/hooks/usePageHeader";
import { useRouter } from "next/navigation";
import PaginationControls from "@/components/shared/PaginationControls";
import { useAuth } from "@/hooks/useAuth";
import type { SiteWorkStatus, DataEntryFormData, ApplicationType } from '@/lib/schemas';
import { 
  applicationTypeDisplayMap,
  fileStatusOptions, 
  siteWorkStatusOptions, 
  applicationTypeOptions, 
  constituencyOptions,
  LOGGING_PUMPING_TEST_PURPOSE_OPTIONS,
} from '@/lib/schemas';
import { format, parseISO, startOfDay, endOfDay, isValid, parse } from "date-fns";
import {
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import ExcelJS from 'exceljs';
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useDataStore } from '@/hooks/use-data-store';
import { DebouncedSearchInput } from '@/components/shared/DebouncedSearchInput';
import { RotateCcw, Loader2, FileDown, Search, Layers, CheckCircle, CheckSquare, Square, Filter } from 'lucide-react';
import { Checkbox } from "@/components/ui/checkbox";
import { MultiSelectFilter } from "@/components/reports/MultiSelectFilter";
import { 
    PRIVATE_APPLICATION_TYPES, 
    COLLECTOR_APPLICATION_TYPES, 
    PLAN_FUND_APPLICATION_TYPES,
    PUBLIC_DEPOSIT_APPLICATION_TYPES 
} from '@/lib/schemas';

export interface FlattenedReportRow {
  fileNo: string; 
  applicantName: string; 
  fileFirstRemittanceDate: string;
  applicationType: string;
  sitePurpose: string;
  fileStatus: string; 
  siteName: string; 
  siteWorkStatus: string; 
  siteTotalExpenditure: string; 
  totalRemittance: string;
  balance: string;
  id?: string;
  [key: string]: any;
}

const ITEMS_PER_PAGE = 50;

type DataSource = 'all' | 'gwInvestigation' | 'loggingPumpingTest' | 'depositWorks' | 'collector' | 'private' | 'planFund' | 'ars';

const dataSourceOptions: { value: DataSource; label: string }[] = [
    { value: 'all', label: 'All Data Sources' },
    { value: 'gwInvestigation', label: 'GW Investigation' },
    { value: 'loggingPumpingTest', label: 'Logging & Pumping Test' },
    { value: 'depositWorks', label: 'Deposit Works (Public)' },
    { value: 'collector', label: "Collector's Deposit Works" },
    { value: 'private', label: 'Private Deposit Works' },
    { value: 'planFund', label: 'Plan Fund Works' },
    { value: 'ars', label: 'ARS' },
];

export interface ReportFieldDefinition {
  id: string;
  label: string;
  category: string;
  sources: string[];
}

export const reportFieldDefinitions: ReportFieldDefinition[] = [
  // 1. File & Applicant Details
  { id: 'fileNo', label: 'File No.', category: 'File & Applicant Details', sources: ['all', 'depositWorks', 'private', 'collector', 'planFund', 'gwInvestigation', 'loggingPumpingTest', 'ars'] },
  { id: 'applicantName', label: 'Applicant Name', category: 'File & Applicant Details', sources: ['all', 'depositWorks', 'private', 'collector', 'planFund', 'gwInvestigation', 'loggingPumpingTest', 'ars'] },
  { id: 'phoneNo', label: 'Primary Phone No.', category: 'File & Applicant Details', sources: ['all', 'depositWorks', 'private', 'collector', 'planFund', 'gwInvestigation', 'loggingPumpingTest'] },
  { id: 'secondaryMobileNo', label: 'Secondary Phone No.', category: 'File & Applicant Details', sources: ['all', 'depositWorks', 'private', 'collector', 'planFund', 'gwInvestigation', 'loggingPumpingTest'] },
  { id: 'emailId', label: 'Email Address', category: 'File & Applicant Details', sources: ['all', 'depositWorks', 'private', 'collector', 'planFund', 'gwInvestigation', 'loggingPumpingTest'] },
  { id: 'category', label: 'Applicant Category', category: 'File & Applicant Details', sources: ['all', 'depositWorks', 'private', 'collector', 'planFund', 'gwInvestigation', 'loggingPumpingTest'] },
  { id: 'applicationType', label: 'Application Type', category: 'File & Applicant Details', sources: ['all', 'depositWorks', 'private', 'collector', 'planFund', 'gwInvestigation', 'loggingPumpingTest', 'ars'] },
  { id: 'fileStatus', label: 'File Status', category: 'File & Applicant Details', sources: ['all', 'depositWorks', 'private', 'collector', 'planFund', 'gwInvestigation', 'loggingPumpingTest'] },
  { id: 'officeLocation', label: 'Office Location', category: 'File & Applicant Details', sources: ['all', 'depositWorks', 'private', 'collector', 'planFund', 'gwInvestigation', 'loggingPumpingTest'] },
  { id: 'remarks', label: 'File Remarks / Notes', category: 'File & Applicant Details', sources: ['all', 'depositWorks', 'private', 'collector', 'planFund', 'gwInvestigation', 'loggingPumpingTest', 'ars'] },

  // 2. Location & Administration
  { id: 'siteName', label: 'Site Name', category: 'Location & Administration', sources: ['all', 'depositWorks', 'private', 'collector', 'planFund', 'gwInvestigation', 'loggingPumpingTest', 'ars'] },
  { id: 'lsg', label: 'Local Self Govt. (LSG)', category: 'Location & Administration', sources: ['all', 'depositWorks', 'private', 'collector', 'planFund', 'gwInvestigation', 'loggingPumpingTest', 'ars'] },
  { id: 'constituency', label: 'Constituency (LAC)', category: 'Location & Administration', sources: ['all', 'depositWorks', 'private', 'collector', 'planFund', 'gwInvestigation', 'loggingPumpingTest', 'ars'] },
  { id: 'latitude', label: 'Latitude', category: 'Location & Administration', sources: ['depositWorks', 'private', 'collector', 'planFund', 'gwInvestigation', 'loggingPumpingTest', 'ars'] },
  { id: 'longitude', label: 'Longitude', category: 'Location & Administration', sources: ['depositWorks', 'private', 'collector', 'planFund', 'gwInvestigation', 'loggingPumpingTest', 'ars'] },
  { id: 'plotArea', label: 'Plot Area', category: 'Location & Administration', sources: ['depositWorks', 'private', 'collector', 'planFund'] },
  { id: 'supervisor', label: 'Assigned Supervisor', category: 'Location & Administration', sources: ['all', 'depositWorks', 'private', 'collector', 'planFund', 'gwInvestigation', 'loggingPumpingTest', 'ars'] },

  // 3. Financial, Remittance & Payment Details
  { id: 'estimateAmount', label: 'Estimate Amount (₹)', category: 'Financial & Remittance', sources: ['all', 'depositWorks', 'private', 'collector', 'planFund', 'gwInvestigation', 'loggingPumpingTest', 'ars'] },
  { id: 'totalRemittance', label: 'Total Remittance (₹)', category: 'Financial & Remittance', sources: ['all', 'depositWorks', 'private', 'collector', 'planFund', 'gwInvestigation', 'loggingPumpingTest', 'ars'] },
  { id: 'fileFirstRemittanceDate', label: 'Date of Remittance / Sanction', category: 'Financial & Remittance', sources: ['all', 'depositWorks', 'private', 'collector', 'planFund', 'gwInvestigation', 'loggingPumpingTest', 'ars'] },
  { id: 'remittanceAccount', label: 'Remitted Account Head', category: 'Financial & Remittance', sources: ['all', 'depositWorks', 'private', 'collector', 'planFund', 'gwInvestigation', 'loggingPumpingTest'] },
  { id: 'remittanceRemarks', label: 'Remittance Remarks', category: 'Financial & Remittance', sources: ['all', 'depositWorks', 'private', 'collector', 'planFund', 'gwInvestigation', 'loggingPumpingTest'] },
  { id: 'totalPaymentAllEntries', label: 'Total Payment Made (₹)', category: 'Financial & Remittance', sources: ['all', 'depositWorks', 'private', 'collector', 'planFund', 'gwInvestigation', 'loggingPumpingTest'] },
  { id: 'siteTotalExpenditure', label: 'Site Expenditure (₹)', category: 'Financial & Remittance', sources: ['all', 'depositWorks', 'private', 'collector', 'planFund', 'gwInvestigation', 'loggingPumpingTest', 'ars'] },
  { id: 'balance', label: 'Balance (₹)', category: 'Financial & Remittance', sources: ['all', 'depositWorks', 'private', 'collector', 'planFund', 'gwInvestigation', 'loggingPumpingTest', 'ars'] },
  { id: 'subsidyAmount', label: 'Subsidy Amount (₹)', category: 'Financial & Remittance', sources: ['depositWorks', 'private', 'collector', 'planFund'] },
  { id: 'tsAmount', label: 'TS Amount (₹)', category: 'Financial & Remittance', sources: ['depositWorks', 'private', 'collector', 'planFund', 'ars'] },
  { id: 'tenderNo', label: 'Tender No.', category: 'Financial & Remittance', sources: ['depositWorks', 'private', 'collector', 'planFund', 'ars'] },
  { id: 'contractorsPayment', label: 'Contractor Payment (₹)', category: 'Financial & Remittance', sources: ['depositWorks', 'private', 'collector', 'planFund'] },
  { id: 'gst', label: 'GST Amount (₹)', category: 'Financial & Remittance', sources: ['depositWorks', 'private', 'collector', 'planFund'] },
  { id: 'incomeTax', label: 'Income Tax (₹)', category: 'Financial & Remittance', sources: ['depositWorks', 'private', 'collector', 'planFund'] },
  { id: 'kbcwb', label: 'KBCWB Cess (₹)', category: 'Financial & Remittance', sources: ['depositWorks', 'private', 'collector', 'planFund'] },
  { id: 'refundToParty', label: 'Refund Amount (₹)', category: 'Financial & Remittance', sources: ['depositWorks', 'private', 'collector', 'planFund'] },

  // 4. Service & Work Status
  { id: 'sitePurpose', label: 'Service / Purpose', category: 'Service & Work Status', sources: ['all', 'depositWorks', 'private', 'collector', 'planFund', 'gwInvestigation', 'loggingPumpingTest', 'ars'] },
  { id: 'siteWorkStatus', label: 'Site Work Status', category: 'Service & Work Status', sources: ['all', 'depositWorks', 'private', 'collector', 'planFund', 'gwInvestigation', 'loggingPumpingTest', 'ars'] },
  { id: 'startDate', label: 'Work Start Date', category: 'Service & Work Status', sources: ['depositWorks', 'private', 'collector', 'planFund'] },
  { id: 'dateOfCompletion', label: 'Work Completion Date', category: 'Service & Work Status', sources: ['depositWorks', 'private', 'collector', 'planFund', 'gwInvestigation', 'loggingPumpingTest', 'ars'] },
  { id: 'siteConditions', label: 'Site Conditions / Accessibility', category: 'Service & Work Status', sources: ['depositWorks', 'private', 'collector', 'planFund'] },
  { id: 'accessibleRig', label: 'Accessible Rig Type', category: 'Service & Work Status', sources: ['depositWorks', 'private', 'collector', 'planFund'] },
  { id: 'workRemarks', label: 'Work Remarks / Notes', category: 'Service & Work Status', sources: ['all', 'depositWorks', 'private', 'collector', 'planFund', 'gwInvestigation', 'loggingPumpingTest', 'ars'] },

  // 5. Technical & Drilling Specifications
  { id: 'typeOfWell', label: 'Type of Well', category: 'Technical & Drilling Specifications', sources: ['gwInvestigation', 'loggingPumpingTest', 'depositWorks', 'private', 'collector', 'planFund'] },
  { id: 'diameter', label: 'Diameter (mm)', category: 'Technical & Drilling Specifications', sources: ['depositWorks', 'private', 'collector', 'planFund'] },
  { id: 'pilotDrillingDepth', label: 'Pilot Drilling Depth (m)', category: 'Technical & Drilling Specifications', sources: ['depositWorks', 'private', 'collector', 'planFund'] },
  { id: 'totalDepth', label: 'Total Depth (m)', category: 'Technical & Drilling Specifications', sources: ['depositWorks', 'private', 'collector', 'planFund', 'gwInvestigation', 'loggingPumpingTest'] },
  { id: 'yield', label: 'Yield / Discharge (LPH)', category: 'Technical & Drilling Specifications', sources: ['depositWorks', 'private', 'collector', 'planFund', 'gwInvestigation', 'loggingPumpingTest'] },
  { id: 'waterLevel', label: 'Static Water Level (m)', category: 'Technical & Drilling Specifications', sources: ['depositWorks', 'private', 'collector', 'planFund', 'gwInvestigation', 'loggingPumpingTest'] },
  { id: 'endCap', label: 'End Cap Details', category: 'Technical & Drilling Specifications', sources: ['depositWorks', 'private', 'collector', 'planFund'] },
  { id: 'zoneDetails', label: 'Water Bearing Zone Details', category: 'Technical & Drilling Specifications', sources: ['depositWorks', 'private', 'collector', 'planFund', 'gwInvestigation', 'loggingPumpingTest'] },
  { id: 'casingPipeUsed', label: 'Casing Pipe Used (m)', category: 'Technical & Drilling Specifications', sources: ['depositWorks', 'private', 'collector', 'planFund'] },
  { id: 'casing10kgPipe', label: 'Casing Pipe 10kg (m)', category: 'Technical & Drilling Specifications', sources: ['depositWorks', 'private', 'collector', 'planFund'] },
  { id: 'casing8kgPipe', label: 'Casing Pipe 8kg (m)', category: 'Technical & Drilling Specifications', sources: ['depositWorks', 'private', 'collector', 'planFund'] },
  { id: 'casing6kgPipe', label: 'Casing Pipe 6kg (m)', category: 'Technical & Drilling Specifications', sources: ['depositWorks', 'private', 'collector', 'planFund'] },
  { id: 'outerCasingPipe', label: 'Outer Casing Pipe (m)', category: 'Technical & Drilling Specifications', sources: ['depositWorks', 'private', 'collector', 'planFund'] },
  { id: 'outerCasingPressure', label: 'Outer Casing Pressure (kg/cm²)', category: 'Technical & Drilling Specifications', sources: ['depositWorks', 'private', 'collector', 'planFund'] },
  { id: 'innerCasingPipe', label: 'Inner Casing Pipe (m)', category: 'Technical & Drilling Specifications', sources: ['depositWorks', 'private', 'collector', 'planFund'] },
  { id: 'innerCasing6kgPipe', label: 'Inner Casing 6kg (m)', category: 'Technical & Drilling Specifications', sources: ['depositWorks', 'private', 'collector', 'planFund'] },
  { id: 'innerCasing4kgPipe', label: 'Inner Casing 4kg (m)', category: 'Technical & Drilling Specifications', sources: ['depositWorks', 'private', 'collector', 'planFund'] },
  { id: 'drillingRemarks', label: 'Drilling Remarks', category: 'Technical & Drilling Specifications', sources: ['depositWorks', 'private', 'collector', 'planFund'] },
  { id: 'drillingConditions', label: 'Drilling Conditions', category: 'Technical & Drilling Specifications', sources: ['depositWorks', 'private', 'collector', 'planFund'] },
  { id: 'developingConditions', label: 'Developing Conditions', category: 'Technical & Drilling Specifications', sources: ['depositWorks', 'private', 'collector', 'planFund'] },
  { id: 'schemeConditions', label: 'Scheme Conditions', category: 'Technical & Drilling Specifications', sources: ['depositWorks', 'private', 'collector', 'planFund'] },
  { id: 'developingRemarks', label: 'Developing Remarks', category: 'Technical & Drilling Specifications', sources: ['depositWorks', 'private', 'collector', 'planFund'] },

  // 6. Survey Details
  { id: 'surveyOB', label: 'Survey Overburden (m)', category: 'Survey Details', sources: ['depositWorks', 'private', 'collector', 'planFund'] },
  { id: 'surveyLocation', label: 'Survey Location', category: 'Survey Details', sources: ['depositWorks', 'private', 'collector', 'planFund'] },
  { id: 'surveyPlainPipe', label: 'Survey Plain Pipe (m)', category: 'Survey Details', sources: ['depositWorks', 'private', 'collector', 'planFund'] },
  { id: 'surveySlottedPipe', label: 'Survey Slotted Pipe (m)', category: 'Survey Details', sources: ['depositWorks', 'private', 'collector', 'planFund'] },
  { id: 'surveyRemarks', label: 'Survey Remarks', category: 'Survey Details', sources: ['depositWorks', 'private', 'collector', 'planFund'] },
  { id: 'surveyRecommendedDiameter', label: 'Survey Rec. Diameter', category: 'Survey Details', sources: ['depositWorks', 'private', 'collector', 'planFund'] },
  { id: 'surveyRecommendedTD', label: 'Survey Rec. Total Depth (m)', category: 'Survey Details', sources: ['depositWorks', 'private', 'collector', 'planFund'] },
  { id: 'surveyRecommendedOB', label: 'Survey Rec. Overburden (m)', category: 'Survey Details', sources: ['depositWorks', 'private', 'collector', 'planFund'] },
  { id: 'surveyRecommendedCasingPipe', label: 'Survey Rec. Casing Pipe (m)', category: 'Survey Details', sources: ['depositWorks', 'private', 'collector', 'planFund'] },
  { id: 'surveyRecommendedPlainPipe', label: 'Survey Rec. Plain Pipe (m)', category: 'Survey Details', sources: ['depositWorks', 'private', 'collector', 'planFund'] },
  { id: 'surveyRecommendedSlottedPipe', label: 'Survey Rec. Slotted Pipe (m)', category: 'Survey Details', sources: ['depositWorks', 'private', 'collector', 'planFund'] },
  { id: 'surveyRecommendedMsCasingPipe', label: 'Survey Rec. MS Casing Pipe (m)', category: 'Survey Details', sources: ['depositWorks', 'private', 'collector', 'planFund'] },

  // 7. Equipment, Scheme & Infrastructure
  { id: 'typeOfRig', label: 'Type of Rig Unit', category: 'Equipment, Scheme & Infrastructure', sources: ['depositWorks', 'private', 'collector', 'planFund'] },
  { id: 'contractorName', label: 'Contractor Name', category: 'Equipment, Scheme & Infrastructure', sources: ['depositWorks', 'private', 'collector', 'planFund'] },
  { id: 'pumpDetails', label: 'Pump Details', category: 'Equipment, Scheme & Infrastructure', sources: ['depositWorks', 'private', 'collector', 'planFund'] },
  { id: 'pumpingLineLength', label: 'Pumping Line Length (m)', category: 'Equipment, Scheme & Infrastructure', sources: ['depositWorks', 'private', 'collector', 'planFund'] },
  { id: 'deliveryLineLength', label: 'Delivery Line Length (m)', category: 'Equipment, Scheme & Infrastructure', sources: ['depositWorks', 'private', 'collector', 'planFund'] },
  { id: 'waterTankCapacity', label: 'Water Tank Capacity (L)', category: 'Equipment, Scheme & Infrastructure', sources: ['depositWorks', 'private', 'collector', 'planFund'] },
  { id: 'noOfTapConnections', label: 'Tap Connections Count', category: 'Equipment, Scheme & Infrastructure', sources: ['depositWorks', 'private', 'collector', 'planFund'] },
  { id: 'noOfBeneficiary', label: 'No. of Beneficiaries', category: 'Equipment, Scheme & Infrastructure', sources: ['depositWorks', 'private', 'collector', 'planFund', 'ars'] },
  { id: 'descriptionOfWork', label: 'Description of Work', category: 'Equipment, Scheme & Infrastructure', sources: ['loggingPumpingTest', 'depositWorks', 'private', 'collector', 'planFund'] },
  { id: 'schemeRemarks', label: 'Scheme Remarks', category: 'Equipment, Scheme & Infrastructure', sources: ['depositWorks', 'private', 'collector', 'planFund'] },
  { id: 'implementationRemarks', label: 'Implementation Remarks', category: 'Equipment, Scheme & Infrastructure', sources: ['depositWorks', 'private', 'collector', 'planFund'] },

  // 8. Investigation Details
  { id: 'nameOfInvestigator', label: 'Investigator Name', category: 'Investigation Details', sources: ['gwInvestigation', 'loggingPumpingTest'] },
  { id: 'dateOfInvestigation', label: 'Investigation Date', category: 'Investigation Details', sources: ['gwInvestigation', 'loggingPumpingTest'] },
  { id: 'feasibility', label: 'Feasibility (Yes/No)', category: 'Investigation Details', sources: ['gwInvestigation'] },
  { id: 'vesRequired', label: 'VES Required', category: 'Investigation Details', sources: ['gwInvestigation'] },
  { id: 'vesInvestigator', label: 'VES Investigator', category: 'Investigation Details', sources: ['gwInvestigation'] },
  { id: 'vesDate', label: 'VES Date', category: 'Investigation Details', sources: ['gwInvestigation'] },
  { id: 'hydrogeologicalRemarks', label: 'Hydrogeological Remarks', category: 'Investigation Details', sources: ['gwInvestigation'] },
  { id: 'geophysicalRemarks', label: 'Geophysical Remarks', category: 'Investigation Details', sources: ['gwInvestigation'] },

  // 9. ARS Details
  { id: 'arsBlock', label: 'ARS Block', category: 'ARS Details', sources: ['ars'] },
  { id: 'arsPanchayath', label: 'ARS Panchayath', category: 'ARS Details', sources: ['ars'] },
  { id: 'arsTypeOfScheme', label: 'ARS Scheme Type', category: 'ARS Details', sources: ['ars'] },
  { id: 'arsNumberOfStructures', label: 'ARS No. of Structures', category: 'ARS Details', sources: ['ars'] },
  { id: 'arsStorageCapacity', label: 'ARS Storage Capacity (m³)', category: 'ARS Details', sources: ['ars'] },
  { id: 'arsNumberOfFillings', label: 'ARS No. of Fillings', category: 'ARS Details', sources: ['ars'] },
  { id: 'arsAsTsDetails', label: 'ARS AS/TS Details', category: 'ARS Details', sources: ['ars'] },
  { id: 'arsSanctionedDate', label: 'ARS Sanctioned Date', category: 'ARS Details', sources: ['ars'] },
  { id: 'arsTenderNo', label: 'ARS Tender No', category: 'ARS Details', sources: ['ars'] },
  { id: 'arsTenderedAmount', label: 'ARS Tendered Amount (₹)', category: 'ARS Details', sources: ['ars'] },
  { id: 'arsAwardedAmount', label: 'ARS Awarded Amount (₹)', category: 'ARS Details', sources: ['ars'] },
  { id: 'arsContractorName', label: 'ARS Contractor Name', category: 'ARS Details', sources: ['ars'] },
  { id: 'arsStatus', label: 'ARS Status', category: 'ARS Details', sources: ['ars'] },
];

const DEFAULT_EXPORT_FIELDS = ['fileNo', 'applicantName', 'siteName', 'fileFirstRemittanceDate', 'applicationType', 'fileStatus', 'sitePurpose', 'siteWorkStatus', 'totalRemittance', 'siteTotalExpenditure', 'balance'];

const safeParseDate = (dateValue: any): Date | null => {
  if (!dateValue) return null;
  if (dateValue instanceof Date && isValid(dateValue)) {
    return dateValue;
  }
  if (typeof dateValue === 'object' && dateValue !== null) {
    if (typeof (dateValue as any).toDate === 'function') {
      const parsed = (dateValue as any).toDate();
      if (isValid(parsed)) return parsed;
    }
    if (typeof (dateValue as any).seconds === 'number') {
      const parsed = new Date((dateValue as any).seconds * 1000);
      if (isValid(parsed)) return parsed;
    }
  }
  if (typeof dateValue === 'string' && dateValue.trim() !== '') {
    const trimmed = dateValue.trim();
    let parsed = parseISO(trimmed);
    if (isValid(parsed)) return parsed;
    parsed = parse(trimmed, 'yyyy-MM-dd', new Date());
    if (isValid(parsed)) return parsed;
    parsed = parse(trimmed, 'dd/MM/yyyy', new Date());
    if (isValid(parsed)) return parsed;
    parsed = parse(trimmed, 'dd-MM-yyyy', new Date());
    if (isValid(parsed)) return parsed;
  }
  return null;
};

const isAll = (filterArr: string[] | string) => {
  if (!filterArr) return true;
  if (typeof filterArr === 'string') return filterArr === 'all';
  return filterArr.length === 0 || filterArr.includes('all');
};

export default function ReportsPage() {
  const { setHeader } = usePageHeader();
  const { allRigCompressors, officeAddress, allFileEntries, allArsEntries, allLsgConstituencyMaps } = useDataStore();
  
  useEffect(() => {
    setHeader('Reports', 'Generate custom reports by applying a combination of filters.');
  }, [setHeader]);

  const router = useRouter(); 
  const { fileEntries, isLoading: entriesLoading, getFileEntry } = useFileEntries();
  const { user, isLoading: authIsLoading } = useAuth();
  const [filteredReportRows, setFilteredReportRows] = useState<FlattenedReportRow[]>([]);
  const { toast } = useToast();

  const [dataSourceFilter, setDataSourceFilter] = useState<DataSource>("all");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState("");
  const [dateFilterType, setDateFilterType] = useState<"remittance" | "completion" | "payment" | "all">("all");
  const [currentPage, setCurrentPage] = useState(1);
  
  // Multi-select filters
  const [statusFilter, setStatusFilter] = useState<string[]>(["all"]); 
  const [serviceTypeFilter, setServiceTypeFilter] = useState<string[]>(["all"]); 
  const [workCategoryFilter, setWorkCategoryFilter] = useState<string[]>(["all"]);
  const [applicationTypeFilter, setApplicationTypeFilter] = useState<string[]>(["all"]);
  const [typeOfRigFilter, setTypeOfRigFilter] = useState<string[]>(["all"]);
  const [constituencyFilter, setConstituencyFilter] = useState<string[]>(["all"]);
  const [applicantNameFilter, setApplicantNameFilter] = useState<string[]>(["all"]);
  const [lsgFilter, setLsgFilter] = useState<string[]>(["all"]);

  const [currentDate, setCurrentDate] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState<string | null>(null);

  const [viewItem, setViewItem] = useState<DataEntryFormData | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);

  // Export Customization state
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);
  const [selectedExportFields, setSelectedExportFields] = useState<string[]>(DEFAULT_EXPORT_FIELDS);
  const [exportFieldSearch, setExportFieldSearch] = useState("");

  useEffect(() => {
    const now = new Date();
    setCurrentDate(format(now, 'dd/MM/yyyy'));
    setCurrentTime(format(now, 'hh:mm:ss a'));
  }, []);

  const uniqueApplicationTypeOptions = useMemo(() => [...new Set(applicationTypeOptions)], []);

  const dynamicConstituencies = useMemo(() => {
    const set = new Set<string>();
    allFileEntries?.forEach(entry => {
      if (entry.constituency) set.add(entry.constituency);
      entry.siteDetails?.forEach(site => {
        if (site.constituency) set.add(site.constituency);
      });
    });
    allArsEntries?.forEach(entry => {
      if (entry.constituency) set.add(entry.constituency);
    });
    constituencyOptions.forEach(c => set.add(c));
    return Array.from(set).filter(Boolean).sort();
  }, [allFileEntries, allArsEntries]);

  const dynamicLsgs = useMemo(() => {
    const set = new Set<string>();
    allFileEntries?.forEach(entry => {
      entry.siteDetails?.forEach(site => {
        if (site.localSelfGovt) set.add(site.localSelfGovt);
      });
    });
    allArsEntries?.forEach(entry => {
      if (entry.localSelfGovt) set.add(entry.localSelfGovt);
    });
    allLsgConstituencyMaps?.forEach(m => {
      if (m.name) set.add(m.name);
    });
    return Array.from(set).filter(Boolean).sort();
  }, [allFileEntries, allArsEntries, allLsgConstituencyMaps]);

  const matchesDataSource = useCallback((entry: DataEntryFormData, source: DataSource): boolean => {
    if (source === 'all') return true;
    
    const hasInvestigationPurpose = !!entry.siteDetails?.some(site => site.purpose === 'GW Investigation');
    const hasLoggingPumpingPurpose = !!entry.siteDetails?.some(site => site.purpose && LOGGING_PUMPING_TEST_PURPOSE_OPTIONS.includes(site.purpose as any));
    const appType = entry.applicationType as any;

    if (source === 'gwInvestigation') return hasInvestigationPurpose && !hasLoggingPumpingPurpose;
    if (source === 'loggingPumpingTest') return hasLoggingPumpingPurpose && !hasInvestigationPurpose;
    if (source === 'depositWorks') return (PUBLIC_DEPOSIT_APPLICATION_TYPES as any).includes(appType) || (!appType && !hasInvestigationPurpose && !hasLoggingPumpingPurpose);
    if (source === 'collector') return (COLLECTOR_APPLICATION_TYPES as any).includes(appType);
    if (source === 'private') return (PRIVATE_APPLICATION_TYPES as any).includes(appType);
    if (source === 'planFund') return (PLAN_FUND_APPLICATION_TYPES as any).includes(appType);
    if (source === 'ars') return false;
    
    return false;
  }, []);

  const applicantOptions = useMemo(() => {
      let pool: (DataEntryFormData | any)[] = [];
      if (dataSourceFilter === 'ars') {
          pool = allArsEntries.map(() => ({ applicantName: 'ARS Scheme' }));
      } else {
          pool = fileEntries.filter(e => matchesDataSource(e, dataSourceFilter));
      }
      const names = pool.map(e => e.applicantName).filter(Boolean);
      return Array.from(new Set(names)).sort((a, b) => a.localeCompare(b));
  }, [fileEntries, allArsEntries, dataSourceFilter, matchesDataSource]);

  const rigOptions = useMemo(() => {
    const allUnits = (allRigCompressors || []);
    const activeInternal = allUnits.filter(r => !r.isExternal && r.status !== 'Garaged').map(r => r.typeOfRigUnit || '').filter(Boolean);
    const activeExternal = allUnits.filter(r => r.isExternal && r.status !== 'Garaged').map(r => `${r.typeOfRigUnit} - ${r.externalOffice || 'Unknown'}`).filter(val => val && !val.startsWith('undefined'));
    const privateOptions = ["Private Rig - DTH", "Private Rig - Rotary", "Private Rig - Calyx"];
    const garaged = allUnits.filter(r => r.status === 'Garaged').map(r => {
        const base = r.isExternal ? `${r.typeOfRigUnit} - ${r.externalOffice || 'Unknown'}` : (r.typeOfRigUnit || '');
        return `${base} (Garaged)`;
    }).filter(val => val && !val.startsWith('undefined') && val !== ' (Garaged)');

    return [...Array.from(new Set(activeInternal)).sort(), ...Array.from(new Set(activeExternal)).sort(), ...privateOptions, ...Array.from(new Set(garaged)).sort()];
  }, [allRigCompressors]);

  const availableServiceOptions = useMemo(() => {
    const DEPOSIT_PURPOSES = ["BWC", "TWC", "FPW", "BW Dev", "TW Dev", "FPW Dev", "MWSS", "MWSS Ext", "Pumping Scheme", "MWSS Pump Reno", "HPS", "HPR"];
    const PRIVATE_PURPOSES = ["BWC", "TWC", "FPW", "BW Dev", "TW Dev", "FPW Dev"];
    const INVESTIGATION_PURPOSES = ["GW Investigation", "VES"];
    const LOGGING_PUMPING_PURPOSES = ["Geological logging", "Geophysical Logging", "Industry Pumping test", "MWSS Pumping test", "Pumping Test Others"];
    const ARS_PURPOSES = ["Dugwell Recharge", "Borewell Recharge", "Recharge Pit", "Check Dam", "Sub-Surface Dyke", "Pond Renovation", "Percolation Ponds"];

    let options: string[] = [];
    switch (dataSourceFilter) {
      case 'gwInvestigation': options = [...INVESTIGATION_PURPOSES]; break;
      case 'loggingPumpingTest': options = [...LOGGING_PUMPING_PURPOSES]; break;
      case 'depositWorks':
      case 'collector':
      case 'planFund': options = [...DEPOSIT_PURPOSES]; break;
      case 'private': options = [...PRIVATE_PURPOSES]; break;
      case 'ars': options = [...ARS_PURPOSES]; break;
      default:
        options = Array.from(new Set([
          ...DEPOSIT_PURPOSES,
          ...INVESTIGATION_PURPOSES,
          ...LOGGING_PUMPING_PURPOSES,
          ...ARS_PURPOSES
        ]));
    }
    return options.sort();
  }, [dataSourceFilter]);

  useEffect(() => {
    setServiceTypeFilter(["all"]);
    setApplicantNameFilter(["all"]);
    setApplicationTypeFilter(["all"]);
    setWorkCategoryFilter(["all"]);
    setTypeOfRigFilter(["all"]);
    setStatusFilter(["all"]);
    setLsgFilter(["all"]);
    setConstituencyFilter(["all"]);
  }, [dataSourceFilter]);

  const applyFilters = useCallback(() => {
    let currentFileEntries = fileEntries.filter(e => matchesDataSource(e, dataSourceFilter));
    let currentArsEntries: any[] = [];
    
    if (dataSourceFilter === 'all' || dataSourceFilter === 'ars') {
        currentArsEntries = allArsEntries;
    }

    const lowerSearchTerm = searchTerm.toLowerCase();

    const fromDate = startDate ? startOfDay(parse(startDate, "yyyy-MM-dd", new Date())) : null;
    const toDate = endDate ? endOfDay(parse(endDate, "yyyy-MM-dd", new Date())) : null;

    const checkDateInRange = (targetValue: any): boolean => {
        if (!targetValue) return false;
        const d = safeParseDate(targetValue);
        if (!d || !isValid(d)) return false;
        if (fromDate && d < fromDate) return false;
        if (toDate && d > toDate) return false;
        return true;
    };

    const filterByDate = (entries: any[], isArsPool: boolean) => {
        if (!startDate && !endDate) return entries;

        return entries.filter(entry => {
            if (isArsPool) {
                if (dateFilterType === 'remittance') return checkDateInRange(entry.arsSanctionedDate);
                if (dateFilterType === 'completion') return checkDateInRange(entry.dateOfCompletion);
                return checkDateInRange(entry.arsSanctionedDate) || checkDateInRange(entry.dateOfCompletion);
            }

            if (dateFilterType === "remittance") {
                return entry.remittanceDetails?.some((rd: any) => checkDateInRange(rd.dateOfRemittance)) ?? false;
            }
            if (dateFilterType === "completion") {
                return entry.siteDetails?.some((sd: any) => checkDateInRange(sd.dateOfCompletion)) ?? false;
            }
            if (dateFilterType === "payment") {
                return entry.paymentDetails?.some((pd: any) => checkDateInRange(pd.dateOfPayment)) ?? false;
            }

            // dateFilterType === "all"
            const matchRemittance = entry.remittanceDetails?.some((rd: any) => checkDateInRange(rd.dateOfRemittance)) ?? false;
            const matchCompletion = entry.siteDetails?.some((sd: any) => checkDateInRange(sd.dateOfCompletion)) ?? false;
            const matchPayment = entry.paymentDetails?.some((pd: any) => checkDateInRange(pd.dateOfPayment)) ?? false;
            const matchInvestigation = entry.siteDetails?.some((sd: any) => checkDateInRange(sd.dateOfInvestigation) || checkDateInRange(sd.vesDate)) ?? false;

            return matchRemittance || matchCompletion || matchPayment || matchInvestigation;
        });
    };

    currentFileEntries = filterByDate(currentFileEntries, false);
    currentArsEntries = filterByDate(currentArsEntries, true);

    const applyCommonFilters = (entries: any[], isArsPool: boolean) => {
        return entries.filter(entry => {
            if (!isAll(statusFilter) && !isArsPool && !statusFilter.includes(entry.fileStatus)) return false;
            
            if (!isAll(applicantNameFilter)) {
                const name = isArsPool ? 'ARS Scheme' : entry.applicantName;
                if (!applicantNameFilter.includes(name)) return false;
            }

            if (!isAll(applicationTypeFilter)) {
                if (isArsPool && !applicationTypeFilter.includes('ARS')) return false;
                if (!isArsPool && (!entry.applicationType || !applicationTypeFilter.includes(entry.applicationType))) return false;
            }

            if (!isAll(constituencyFilter)) {
                const match = isArsPool 
                    ? constituencyFilter.includes(entry.constituency) 
                    : (constituencyFilter.includes(entry.constituency) || entry.siteDetails?.some((sd: any) => constituencyFilter.includes(sd.constituency)));
                if (!match) return false;
            }

            if (!isAll(lsgFilter)) {
                const match = isArsPool
                    ? lsgFilter.includes(entry.localSelfGovt)
                    : entry.siteDetails?.some((sd: any) => lsgFilter.includes(sd.localSelfGovt));
                if (!match) return false;
            }

            if (!isAll(workCategoryFilter)) {
                const match = isArsPool ? workCategoryFilter.includes(entry.arsStatus) : entry.siteDetails?.some((sd: any) => workCategoryFilter.includes(sd.workStatus));
                if (!match) return false;
            }

            if (!isAll(serviceTypeFilter)) {
                const match = isArsPool ? serviceTypeFilter.includes(entry.arsTypeOfScheme) : entry.siteDetails?.some((sd: any) => serviceTypeFilter.includes(sd.purpose));
                if (!match) return false;
            }

            if (!isAll(typeOfRigFilter)) {
                if (isArsPool) return false;
                if (!entry.siteDetails?.some((site: any) => typeOfRigFilter.includes(site.typeOfRig))) return false;
            }
            
            if (lowerSearchTerm) {
                const searchableString = JSON.stringify(entry).toLowerCase();
                if (!searchableString.includes(lowerSearchTerm)) return false;
            }

            return true;
        });
    };

    currentFileEntries = applyCommonFilters(currentFileEntries, false);
    currentArsEntries = applyCommonFilters(currentArsEntries, true);

    const flattenedRows: FlattenedReportRow[] = [];

    const doesSiteMatchDateFilter = (site: any, entry: any) => {
        if (!startDate && !endDate) return true;

        if (dateFilterType === 'remittance') {
            return entry.remittanceDetails?.some((rd: any) => checkDateInRange(rd.dateOfRemittance)) ?? false;
        }
        if (dateFilterType === 'completion') {
            return checkDateInRange(site.dateOfCompletion);
        }
        if (dateFilterType === 'payment') {
            return entry.paymentDetails?.some((pd: any) => checkDateInRange(pd.dateOfPayment)) ?? false;
        }

        // dateFilterType === 'all'
        const matchRemittance = entry.remittanceDetails?.some((rd: any) => checkDateInRange(rd.dateOfRemittance)) ?? false;
        const matchCompletion = checkDateInRange(site.dateOfCompletion);
        const matchPayment = entry.paymentDetails?.some((pd: any) => checkDateInRange(pd.dateOfPayment)) ?? false;
        const matchInvestigation = checkDateInRange(site.dateOfInvestigation) || checkDateInRange(site.vesDate);

        return matchRemittance || matchCompletion || matchPayment || matchInvestigation;
    };

    currentFileEntries.forEach(entry => {
        const remittanceDate = entry.remittanceDetails?.[0]?.dateOfRemittance;
        const fileFirstRemittanceDate = remittanceDate ? format(new Date(remittanceDate), "dd/MM/yyyy") : "-";
        const totalRemittance = (Number(entry.totalRemittance) || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 });
        const balance = (Number(entry.overallBalance) || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 });

        if (entry.siteDetails && entry.siteDetails.length > 0) {
            entry.siteDetails.forEach(site => {
                if (!isAll(workCategoryFilter) && !workCategoryFilter.includes(site.workStatus)) return;
                if (!isAll(lsgFilter) && !lsgFilter.includes(site.localSelfGovt)) return;
                if (!isAll(constituencyFilter) && !constituencyFilter.includes(site.constituency)) return;
                if (!isAll(typeOfRigFilter) && !typeOfRigFilter.includes(site.typeOfRig)) return;
                if (!isAll(serviceTypeFilter) && !serviceTypeFilter.includes(site.purpose)) return;
                if (!doesSiteMatchDateFilter(site, entry)) return;

                flattenedRows.push({
                    fileNo: entry.fileNo || "-", 
                    applicantName: entry.applicantName || "-", 
                    phoneNo: entry.phoneNo || "-",
                    secondaryMobileNo: entry.secondaryMobileNo || "-",
                    emailId: entry.emailId || "-",
                    category: entry.category || "-",
                    fileFirstRemittanceDate, 
                    applicationType: entry.applicationType ? applicationTypeDisplayMap[entry.applicationType as ApplicationType] || entry.applicationType : "N/A",
                    fileStatus: entry.fileStatus || "-",
                    officeLocation: entry.officeLocation || officeAddress?.officeLocation || "-",
                    remarks: entry.remarks || "-",

                    siteName: site.nameOfSite || "-", 
                    lsg: site.localSelfGovt || 'N/A',
                    constituency: site.constituency || 'N/A',
                    latitude: site.latitude || 'N/A',
                    longitude: site.longitude || 'N/A',
                    plotArea: site.plotArea || 'N/A',
                    supervisor: site.supervisorName || 'N/A',

                    estimateAmount: entry.estimateAmount ? Number(entry.estimateAmount).toLocaleString('en-IN', { minimumFractionDigits: 2 }) : '0.00',
                    totalRemittance, 
                    remittanceAccount: entry.remittanceDetails?.[0]?.remittedAccount || 'N/A',
                    remittanceRemarks: entry.remittanceDetails?.map((r: any) => r.remittanceRemarks).filter(Boolean).join('; ') || 'N/A',
                    totalPaymentAllEntries: entry.totalPaymentAllEntries ? Number(entry.totalPaymentAllEntries).toLocaleString('en-IN', { minimumFractionDigits: 2 }) : '0.00',
                    siteTotalExpenditure: (Number(site.totalExpenditure) || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 }),
                    balance,
                    subsidyAmount: site.subsidyAmount || 'N/A',
                    tsAmount: site.tsAmount || 'N/A',
                    tenderNo: site.tenderNo || 'N/A',
                    contractorsPayment: entry.paymentDetails?.[0]?.contractorsPayment || 'N/A',
                    gst: entry.paymentDetails?.[0]?.gst || 'N/A',
                    incomeTax: entry.paymentDetails?.[0]?.incomeTax || 'N/A',
                    kbcwb: entry.paymentDetails?.[0]?.kbcwb || 'N/A',
                    refundToParty: entry.paymentDetails?.[0]?.refundToParty || 'N/A',

                    sitePurpose: site.purpose || "-", 
                    siteWorkStatus: site.workStatus || "-", 
                    startDate: site.startDate ? format(new Date(site.startDate), "dd/MM/yyyy") : 'N/A',
                    dateOfCompletion: site.dateOfCompletion ? format(new Date(site.dateOfCompletion), "dd/MM/yyyy") : 'N/A',
                    siteConditions: site.siteConditions || 'N/A',
                    accessibleRig: site.accessibleRig || 'N/A',
                    workRemarks: site.workRemarks || 'N/A',

                    typeOfWell: site.typeOfWell || 'N/A',
                    diameter: site.diameter || 'N/A',
                    pilotDrillingDepth: site.pilotDrillingDepth || 'N/A',
                    totalDepth: site.totalDepth || 'N/A',
                    yield: site.yieldDischarge || 'N/A',
                    waterLevel: site.waterLevel || 'N/A',
                    endCap: site.endCap || 'N/A',
                    zoneDetails: site.zoneDetails || 'N/A',
                    casingPipeUsed: site.casingPipeUsed || 'N/A',
                    casing10kgPipe: site.casing10kgPipe || 'N/A',
                    casing8kgPipe: site.casing8kgPipe || 'N/A',
                    casing6kgPipe: site.casing6kgPipe || 'N/A',
                    outerCasingPipe: site.outerCasingPipe || 'N/A',
                    outerCasingPressure: site.outerCasingPressure || 'N/A',
                    innerCasingPipe: site.innerCasingPipe || 'N/A',
                    innerCasing6kgPipe: site.innerCasing6kgPipe || 'N/A',
                    innerCasing4kgPipe: site.innerCasing4kgPipe || 'N/A',
                    drillingRemarks: site.drillingRemarks || 'N/A',
                    drillingConditions: site.drillingConditions || 'N/A',
                    developingConditions: site.developingConditions || 'N/A',
                    schemeConditions: site.schemeConditions || 'N/A',
                    developingRemarks: site.developingRemarks || 'N/A',

                    surveyOB: site.surveyOB || 'N/A',
                    surveyLocation: site.surveyLocation || 'N/A',
                    surveyPlainPipe: site.surveyPlainPipe || 'N/A',
                    surveySlottedPipe: site.surveySlottedPipe || 'N/A',
                    surveyRemarks: site.surveyRemarks || 'N/A',
                    surveyRecommendedDiameter: site.surveyRecommendedDiameter || 'N/A',
                    surveyRecommendedTD: site.surveyRecommendedTD || 'N/A',
                    surveyRecommendedOB: site.surveyRecommendedOB || 'N/A',
                    surveyRecommendedCasingPipe: site.surveyRecommendedCasingPipe || 'N/A',
                    surveyRecommendedPlainPipe: site.surveyRecommendedPlainPipe || 'N/A',
                    surveyRecommendedSlottedPipe: site.surveyRecommendedSlottedPipe || 'N/A',
                    surveyRecommendedMsCasingPipe: site.surveyRecommendedMsCasingPipe || 'N/A',

                    typeOfRig: site.typeOfRig || 'N/A',
                    contractorName: site.contractorName || 'N/A',
                    pumpDetails: site.pumpDetails || 'N/A',
                    pumpingLineLength: site.pumpingLineLength || 'N/A',
                    deliveryLineLength: site.deliveryLineLength || 'N/A',
                    waterTankCapacity: site.waterTankCapacity || 'N/A',
                    noOfTapConnections: site.noOfTapConnections || 'N/A',
                    noOfBeneficiary: site.noOfBeneficiary || 'N/A',
                    descriptionOfWork: site.descriptionOfWork || 'N/A',
                    schemeRemarks: site.schemeRemarks || 'N/A',
                    implementationRemarks: site.implementationRemarks || 'N/A',

                    nameOfInvestigator: site.nameOfInvestigator || 'N/A',
                    dateOfInvestigation: site.dateOfInvestigation ? format(new Date(site.dateOfInvestigation), "dd/MM/yyyy") : 'N/A',
                    feasibility: site.feasibility || 'N/A',
                    vesRequired: site.vesRequired || 'N/A',
                    vesInvestigator: site.vesInvestigator || 'N/A',
                    vesDate: site.vesDate ? format(new Date(site.vesDate), "dd/MM/yyyy") : 'N/A',
                    hydrogeologicalRemarks: site.hydrogeologicalRemarks || 'N/A',
                    geophysicalRemarks: site.geophysicalRemarks || 'N/A'
                });
            });
        } else {
            if (startDate || endDate) {
                const matchRemittance = entry.remittanceDetails?.some((rd: any) => checkDateInRange(rd.dateOfRemittance)) ?? false;
                const matchPayment = entry.paymentDetails?.some((pd: any) => checkDateInRange(pd.dateOfPayment)) ?? false;
                if (!matchRemittance && !matchPayment) return;
            }
            flattenedRows.push({
                fileNo: entry.fileNo || "-", 
                applicantName: entry.applicantName || "-", 
                phoneNo: entry.phoneNo || "-",
                secondaryMobileNo: entry.secondaryMobileNo || "-",
                emailId: entry.emailId || "-",
                category: entry.category || "-",
                fileFirstRemittanceDate, 
                applicationType: entry.applicationType ? applicationTypeDisplayMap[entry.applicationType as ApplicationType] || entry.applicationType : "-",
                fileStatus: entry.fileStatus || "-", 
                siteName: "-", 
                sitePurpose: "-", 
                siteWorkStatus: "-", 
                siteTotalExpenditure: "0.00", 
                totalRemittance, 
                balance, 
                remarks: entry.remarks || 'N/A'
            });
        }
    });

    currentArsEntries.forEach(entry => {
        if (startDate || endDate) {
            const matchSanction = checkDateInRange(entry.arsSanctionedDate);
            const matchCompletion = checkDateInRange(entry.dateOfCompletion);
            if (dateFilterType === 'remittance' && !matchSanction) return;
            if (dateFilterType === 'completion' && !matchCompletion) return;
            if (dateFilterType === 'all' && !matchSanction && !matchCompletion) return;
        }

        const dateStr = entry.arsSanctionedDate;
        const fileFirstRemittanceDate = dateStr ? format(new Date(dateStr), "dd/MM/yyyy") : "-";
        const totalExpenditure = (Number(entry.totalExpenditure) || 0);

        flattenedRows.push({
            fileNo: entry.fileNo || "-", 
            applicantName: "ARS Scheme", 
            fileFirstRemittanceDate, 
            applicationType: "ARS",
            fileStatus: entry.arsStatus || "-",
            siteName: entry.nameOfSite || "-", 
            sitePurpose: entry.arsTypeOfScheme || "ARS", 
            siteWorkStatus: entry.arsStatus || "-",
            siteTotalExpenditure: totalExpenditure.toLocaleString('en-IN', { minimumFractionDigits: 2 }),
            totalRemittance: (Number(entry.estimateAmount) || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 }),
            balance: ((Number(entry.estimateAmount) || 0) - totalExpenditure).toLocaleString('en-IN', { minimumFractionDigits: 2 }),
            id: entry.id,
            lsg: entry.localSelfGovt || 'N/A',
            constituency: entry.constituency || 'N/A',
            supervisor: entry.supervisorName || 'N/A',
            latitude: entry.latitude || 'N/A',
            longitude: entry.longitude || 'N/A',
            noOfBeneficiary: entry.noOfBeneficiary || 'N/A',
            arsBlock: entry.arsBlock || 'N/A',
            arsPanchayath: entry.localSelfGovt || 'N/A',
            arsTypeOfScheme: entry.arsTypeOfScheme || 'N/A',
            arsNumberOfStructures: entry.arsNumberOfStructures || 'N/A',
            arsStorageCapacity: entry.arsStorageCapacity || 'N/A',
            arsNumberOfFillings: entry.arsNumberOfFillings || 'N/A',
            arsAsTsDetails: entry.arsAsTsDetails || 'N/A',
            arsSanctionedDate: entry.arsSanctionedDate ? format(new Date(entry.arsSanctionedDate), "dd/MM/yyyy") : 'N/A',
            tsAmount: entry.tsAmount ? Number(entry.tsAmount).toLocaleString('en-IN', { minimumFractionDigits: 2 }) : 'N/A',
            arsTenderNo: entry.arsTenderNo || 'N/A',
            arsTenderedAmount: entry.arsTenderedAmount ? Number(entry.arsTenderedAmount).toLocaleString('en-IN', { minimumFractionDigits: 2 }) : 'N/A',
            arsAwardedAmount: entry.arsAwardedAmount ? Number(entry.arsAwardedAmount).toLocaleString('en-IN', { minimumFractionDigits: 2 }) : 'N/A',
            arsContractorName: entry.arsContractorName || 'N/A',
            arsStatus: entry.arsStatus || 'N/A',
            remarks: entry.workRemarks || 'N/A'
        });
    });
    
    setFilteredReportRows(flattenedRows);
  }, [fileEntries, allArsEntries, matchesDataSource, dataSourceFilter, searchTerm, statusFilter, serviceTypeFilter, workCategoryFilter, startDate, endDate, dateFilterType, applicationTypeFilter, typeOfRigFilter, constituencyFilter, applicantNameFilter, lsgFilter, officeAddress]);

  useEffect(() => {
    if (!entriesLoading && !authIsLoading) {
      applyFilters();
    }
  }, [entriesLoading, authIsLoading, applyFilters]);

  const handleResetFilters = () => {
    setDataSourceFilter("all"); 
    setStartDate(""); 
    setEndDate(""); 
    setSearchTerm(""); 
    setDateFilterType("all"); 
    setStatusFilter(["all"]); 
    setServiceTypeFilter(["all"]); 
    setWorkCategoryFilter(["all"]); 
    setApplicationTypeFilter(["all"]); 
    setTypeOfRigFilter(["all"]); 
    setConstituencyFilter(["all"]); 
    setApplicantNameFilter(["all"]); 
    setLsgFilter(["all"]);
    router.replace(`/dashboard/reports`, { scroll: false });
  };

  // Group fields by category for export modal
  const categorizedExportFields = useMemo(() => {
    const map: Record<string, ReportFieldDefinition[]> = {};
    reportFieldDefinitions.forEach(field => {
      if (!map[field.category]) {
        map[field.category] = [];
      }
      map[field.category].push(field);
    });
    return map;
  }, []);

  const filteredCategoriesForExport = useMemo(() => {
    if (!exportFieldSearch.trim()) return categorizedExportFields;
    const lower = exportFieldSearch.toLowerCase();
    const result: Record<string, ReportFieldDefinition[]> = {};
    
    Object.entries(categorizedExportFields).forEach(([category, fields]) => {
      const matchingFields = fields.filter(
        f => f.label.toLowerCase().includes(lower) || f.id.toLowerCase().includes(lower) || category.toLowerCase().includes(lower)
      );
      if (matchingFields.length > 0) {
        result[category] = matchingFields;
      }
    });
    return result;
  }, [categorizedExportFields, exportFieldSearch]);

  const toggleCategorySelection = (categoryFields: ReportFieldDefinition[]) => {
    const fieldIds = categoryFields.map(f => f.id);
    const allSelected = fieldIds.every(id => selectedExportFields.includes(id));

    if (allSelected) {
      setSelectedExportFields(prev => prev.filter(id => !fieldIds.includes(id)));
    } else {
      setSelectedExportFields(prev => Array.from(new Set([...prev, ...fieldIds])));
    }
  };

  const handleExportExcel = async () => {
    if (filteredReportRows.length === 0) {
        toast({ title: "No Data", description: "No records match the current filter criteria.", variant: "destructive" });
        return;
    }
    if (selectedExportFields.length === 0) {
        toast({ title: "No Fields Selected", description: "Please select at least one field to export.", variant: "destructive" });
        return;
    }

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Report");
    
    worksheet.addRow([`Ground Water Department, ${officeAddress?.officeLocation || 'Kollam'}`]).font = { bold: true, size: 14 };
    worksheet.addRow(["Custom Report Generated on: " + format(new Date(), 'dd/MM/yyyy HH:mm')]);
    worksheet.addRow([]);
    
    const activeFields = reportFieldDefinitions.filter(f => selectedExportFields.includes(f.id));
    const header = ["Sl. No.", ...activeFields.map(f => f.label)];
    const headerRow = worksheet.addRow(header);
    headerRow.font = { bold: true };
    headerRow.eachCell(cell => {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'F0F0F0' } };
      cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
    });

    filteredReportRows.forEach((row, index) => {
      const values: any[] = [index + 1];
      activeFields.forEach(field => {
        values.push(row[field.id] ?? 'N/A');
      });
      const newRow = worksheet.addRow(values);
      newRow.eachCell(cell => {
        cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
      });
    });

    worksheet.columns.forEach(column => column.width = 22);
    
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `GWD_Custom_Report_${format(new Date(), 'yyyyMMdd_HHmm')}.xlsx`;
    a.click();
    window.URL.revokeObjectURL(url);
    setIsExportDialogOpen(false);
  };

  const handleOpenViewDialog = (fileNo: string) => {
    const entryToView = getFileEntry(fileNo);
    if (entryToView) { setViewItem(entryToView); setIsViewDialogOpen(true); } 
    else { toast({ title: "Error", description: "File details not found in current cache.", variant: "destructive" }); }
  };

  if (entriesLoading || authIsLoading) {
    return <div className="flex h-[calc(100vh-10rem)] w-full items-center justify-center"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>;
  }

  const paginatedReportRows = filteredReportRows.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);
  const totalPages = Math.ceil(filteredReportRows.length / ITEMS_PER_PAGE);

  return (
    <div className="space-y-6">
      <Card className="shadow-lg no-print">
        <CardContent className="p-4 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 items-end">
                <div className="space-y-1.5">
                    <Label className="text-xs font-semibold flex items-center gap-1.5"><Layers className="h-3 w-3" />Data Source</Label>
                    <Select value={dataSourceFilter} onValueChange={(v) => setDataSourceFilter(v as DataSource)}>
                        <SelectTrigger className="h-9 text-xs"><SelectValue placeholder="Select Data Source" /></SelectTrigger>
                        <SelectContent>{dataSourceOptions.map(opt => <SelectItem key={opt.value} value={opt.value} className="text-xs">{opt.label}</SelectItem>)}</SelectContent>
                    </Select>
                </div>

                <MultiSelectFilter
                    label="Filter by Name of Applicant"
                    placeholder="All Applicants"
                    options={applicantOptions.map(name => ({ value: name, label: name }))}
                    selectedValues={applicantNameFilter}
                    onChange={setApplicantNameFilter}
                />

                <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">Date Type for Range</Label>
                    <Select value={dateFilterType} onValueChange={(v: any) => setDateFilterType(v)}>
                        <SelectTrigger className="h-9 text-xs"><SelectValue placeholder="Select Date Type" /></SelectTrigger>
                        <SelectContent className="text-xs">
                            <SelectItem value="all" className="text-xs">-- Clear Date Type --</SelectItem>
                            <SelectItem value="remittance" className="text-xs">Date of Remittance / Sanction</SelectItem>
                            <SelectItem value="completion" className="text-xs">Date of Completion</SelectItem>
                            <SelectItem value="payment" className="text-xs">Date of Payment</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">From Date</Label>
                    <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="h-9 text-xs"/>
                </div>

                <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">To Date</Label>
                    <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="h-9 text-xs"/>
                </div>

                <MultiSelectFilter
                    label="Service / Purpose"
                    placeholder="All Services"
                    options={availableServiceOptions.map(p => ({ value: p, label: p }))}
                    selectedValues={serviceTypeFilter}
                    onChange={setServiceTypeFilter}
                />

                <MultiSelectFilter
                    label="Application Type"
                    placeholder="All Application Types"
                    options={uniqueApplicationTypeOptions.map(o => ({ value: o, label: applicationTypeDisplayMap[o as ApplicationType] || o }))}
                    selectedValues={applicationTypeFilter}
                    onChange={setApplicationTypeFilter}
                />

                <MultiSelectFilter
                    label="Type of Rig (Site)"
                    placeholder="All Rig Types"
                    options={rigOptions.map(o => ({ value: o, label: o }))}
                    selectedValues={typeOfRigFilter}
                    onChange={setTypeOfRigFilter}
                />

                <MultiSelectFilter
                    label="File Status"
                    placeholder="All File Statuses"
                    options={fileStatusOptions.map(s => ({ value: s, label: s }))}
                    selectedValues={statusFilter}
                    onChange={setStatusFilter}
                />

                <MultiSelectFilter
                    label="Work Category (Site Status)"
                    placeholder="All Categories"
                    options={siteWorkStatusOptions.map(s => ({ value: s, label: s }))}
                    selectedValues={workCategoryFilter}
                    onChange={setWorkCategoryFilter}
                />

                <MultiSelectFilter
                    label="Local Self Govt."
                    placeholder="All LSGs"
                    options={dynamicLsgs.map(l => ({ value: l, label: l }))}
                    selectedValues={lsgFilter}
                    onChange={setLsgFilter}
                />

                <MultiSelectFilter
                    label="Constituency (LAC)"
                    placeholder="All Constituencies"
                    options={dynamicConstituencies.map(c => ({ value: c, label: c }))}
                    selectedValues={constituencyFilter}
                    onChange={setConstituencyFilter}
                />

                <div className="space-y-1.5 lg:col-span-2">
                    <Label className="text-xs font-semibold">Global Search</Label>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-10 pointer-events-none" />
                        <DebouncedSearchInput placeholder="Global search..." value={searchTerm} onSearchChange={setSearchTerm} className="pl-10 h-9 text-xs" />
                    </div>
                </div>

                <div className="lg:col-span-1 flex items-center gap-2">
                    <Button variant="secondary" onClick={handleResetFilters} size="sm" className="flex-1 text-xs"><RotateCcw className="mr-1.5 h-3.5 w-3.5" />Reset</Button>
                    <Button onClick={() => setIsExportDialogOpen(true)} size="sm" className="flex-1 text-xs bg-primary hover:bg-primary/90"><FileDown className="mr-1.5 h-3.5 w-3.5" />Export Excel</Button>
                </div>
            </div>
        </CardContent>
      </Card>

      <div className="print-only-block my-4 text-center">
        <p className="font-semibold text-sm text-foreground mb-1">GWD {officeAddress?.officeLocation || 'Kollam'} - Report</p>
        {(currentDate && currentTime) && (<p className="text-xs text-muted-foreground">Report generated on: {currentDate} at {currentTime}</p>)}
      </div>
      
      <Card className="card-for-print shadow-lg">
         <div className="relative max-h-[70vh] overflow-auto">
            <ReportTable data={paginatedReportRows} onViewDetailsClick={handleOpenViewDialog} currentPage={currentPage} itemsPerPage={ITEMS_PER_PAGE} />
          </div>
          <CardFooter className="p-4 border-t flex items-center justify-between">
              <div className="text-xs text-muted-foreground">
                Showing {filteredReportRows.length > 0 ? (currentPage - 1) * ITEMS_PER_PAGE + 1 : 0} to {Math.min(currentPage * ITEMS_PER_PAGE, filteredReportRows.length)} of {filteredReportRows.length} entries
              </div>
              {totalPages > 1 && <PaginationControls currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />}
          </CardFooter>
      </Card>

      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent onPointerDownOutside={(e) => e.preventDefault()} className="sm:max-w-4xl p-0 flex flex-col h-[90vh]">
          <DialogHeader className="p-6 pb-4 border-b">
            <DialogTitle>File Details: {viewItem?.fileNo}</DialogTitle>
          </DialogHeader>
          <div className="flex-1 min-h-0"><ScrollArea className="h-full px-6 py-4"><p className="text-sm italic text-muted-foreground">Use the Data Entry module for full interactive editing. Summary here is read-only.</p></ScrollArea></div>
          <DialogFooter className="p-6 pt-4 border-t"><DialogClose asChild><Button variant="secondary">Close</Button></DialogClose></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Customize Report Export Dialog */}
      <Dialog open={isExportDialogOpen} onOpenChange={setIsExportDialogOpen}>
        <DialogContent className="sm:max-w-4xl flex flex-col p-0 max-h-[90vh]">
          <DialogHeader className="p-6 pb-4 border-b">
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle className="text-lg font-bold flex items-center gap-2">
                  <Filter className="h-5 w-5 text-primary" /> Customize Report Export
                </DialogTitle>
                <DialogDescription className="text-xs mt-1">
                  Select full available fields to include in your customized Excel spreadsheet report ({selectedExportFields.length} of {reportFieldDefinitions.length} fields selected).
                </DialogDescription>
              </div>
            </div>
            
            {/* Action Bar & Search inside Modal */}
            <div className="mt-4 flex flex-wrap items-center gap-2 pt-2 border-t">
              <div className="relative flex-1 min-w-[220px]">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input 
                  placeholder="Search fields or categories..." 
                  value={exportFieldSearch} 
                  onChange={(e) => setExportFieldSearch(e.target.value)}
                  className="pl-8 h-8 text-xs" 
                />
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                className="h-8 text-xs gap-1"
                onClick={() => setSelectedExportFields(reportFieldDefinitions.map(f => f.id))}
              >
                <CheckSquare className="h-3.5 w-3.5" /> Select All ({reportFieldDefinitions.length})
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="h-8 text-xs gap-1"
                onClick={() => setSelectedExportFields(DEFAULT_EXPORT_FIELDS)}
              >
                Reset Default Fields
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="h-8 text-xs gap-1 text-destructive hover:text-destructive"
                onClick={() => setSelectedExportFields([])}
              >
                <Square className="h-3.5 w-3.5" /> Deselect All
              </Button>
            </div>
          </DialogHeader>

          <div className="flex-1 overflow-hidden p-0">
            <ScrollArea className="h-[55vh] px-6 py-4">
              <div className="space-y-6">
                {Object.entries(filteredCategoriesForExport).map(([category, fields]) => {
                  const categoryFieldIds = fields.map(f => f.id);
                  const isCategoryAllSelected = categoryFieldIds.every(id => selectedExportFields.includes(id));
                  const isCategorySomeSelected = categoryFieldIds.some(id => selectedExportFields.includes(id)) && !isCategoryAllSelected;

                  return (
                    <div key={category} className="space-y-2 border rounded-lg p-4 bg-card shadow-sm">
                      <div className="flex items-center justify-between pb-2 border-b">
                        <div 
                          className="flex items-center space-x-2 cursor-pointer select-none"
                          onClick={() => toggleCategorySelection(fields)}
                        >
                          <Checkbox 
                            id={`cat-${category}`}
                            checked={isCategoryAllSelected ? true : isCategorySomeSelected ? "indeterminate" : false}
                            onCheckedChange={() => toggleCategorySelection(fields)}
                          />
                          <Label htmlFor={`cat-${category}`} className="font-bold text-sm cursor-pointer text-foreground">
                            {category}
                          </Label>
                        </div>
                        <span className="text-[11px] font-medium text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                          {fields.filter(f => selectedExportFields.includes(f.id)).length} / {fields.length} selected
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 pt-1">
                        {fields.map((field) => {
                          const isSelected = selectedExportFields.includes(field.id);
                          return (
                            <div 
                              key={field.id} 
                              className={`flex items-center space-x-2.5 p-2 rounded-md border text-xs cursor-pointer transition-all ${
                                isSelected ? 'bg-primary/10 border-primary/40 font-medium text-primary' : 'bg-background hover:bg-muted/50 border-border text-muted-foreground'
                              }`}
                              onClick={() => {
                                if (isSelected) {
                                  setSelectedExportFields(prev => prev.filter(id => id !== field.id));
                                } else {
                                  setSelectedExportFields(prev => [...prev, field.id]);
                                }
                              }}
                            >
                              <Checkbox 
                                id={`export-field-${field.id}`}
                                checked={isSelected}
                                onCheckedChange={(checked) => {
                                  if (checked) {
                                    setSelectedExportFields(prev => [...prev, field.id]);
                                  } else {
                                    setSelectedExportFields(prev => prev.filter(id => id !== field.id));
                                  }
                                }}
                              />
                              <Label 
                                htmlFor={`export-field-${field.id}`} 
                                className="flex-1 cursor-pointer truncate font-medium text-xs text-foreground"
                              >
                                {field.label}
                              </Label>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}

                {Object.keys(filteredCategoriesForExport).length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <p className="text-sm">No fields matching &quot;{exportFieldSearch}&quot; found.</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>

          <DialogFooter className="p-4 border-t flex items-center justify-between bg-muted/20">
            <div className="text-xs font-semibold text-muted-foreground">
              Total Columns to Export: <span className="text-foreground font-bold">{selectedExportFields.length}</span>
            </div>
            <div className="flex items-center gap-2">
                <DialogClose asChild><Button variant="outline" size="sm">Cancel</Button></DialogClose>
                <Button onClick={handleExportExcel} size="sm" className="gap-1.5 bg-primary hover:bg-primary/90">
                    <CheckCircle className="h-4 w-4" /> Export Excel
                </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
