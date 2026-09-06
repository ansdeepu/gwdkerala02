// src/hooks/use-data-store.tsx
"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode, useMemo, useRef } from 'react';
import { getFirestore, collection, onSnapshot, query, Timestamp, DocumentData, orderBy, getDocs, type QuerySnapshot, where, deleteDoc, doc, addDoc, updateDoc, serverTimestamp, writeBatch, collectionGroup, setDoc } from 'firebase/firestore';
import { app } from '@/lib/firebase';
import { useAuth, type UserProfile } from './useAuth';
import type { DataEntryFormData } from '@/lib/schemas/DataEntrySchema';
import type { ArsEntry } from './useArsEntries';
import type { StaffMember, LsgConstituencyMap, Designation, Bidder as MasterBidder, DepartmentVehicle, HiredVehicle, RigCompressor, OfficeAddress, GwdRateItem } from '@/lib/schemas';
import { designationOptions, DEFAULT_GWD_RATE_ITEMS } from '@/lib/schemas';
import type { AgencyApplication } from './useAgencyApplications';
import { toast } from './use-toast';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import type { E_tender } from './useE_tenders';
import { SUPER_ADMIN_EMAIL } from '@/lib/config';
import { formatDistrictLocation } from '@/lib/utils';

const db = getFirestore(app);

/**
 * Robustly converts Firestore documents or data objects to JS objects.
 */
const processFirestoreData = (data: any): any => {
    if (data === null || data === undefined) return data;
    if (data instanceof Timestamp) return data.toDate();
    if (Array.isArray(data)) return data.map(processFirestoreData);
    if (typeof data === 'object' && !(data instanceof Date)) {
        const processed: Record<string, any> = {};
        for (const key in data) {
            if (Object.prototype.hasOwnProperty.call(data, key)) {
                processed[key] = processFirestoreData(data[key]);
            }
        }
        return processed;
    }
    return data;
};

const processFirestoreDoc = <T,>(docSnap: any): T => {
    const data = typeof docSnap.data === 'function' ? docSnap.data() : docSnap;
    if (!data) return {} as T;
    const processed = processFirestoreData(data);
    const id = docSnap.id || (processed as any).id || (processed as any).uid;
    return { ...processed, id: id, uid: id } as T;
};

const normalizeFileNo = (fn?: string | null): string => {
    if (!fn) return '';
    return fn.trim().toUpperCase()
        .replace(/^[A-Z]{2,}[A-Z0-9_\-\s]*\//, '')
        .replace(/\s+/g, '');
};

const matchFileNo = (fn1?: string | null, fn2?: string | null): boolean => {
    if (!fn1 || !fn2) return false;
    const n1 = normalizeFileNo(fn1);
    const n2 = normalizeFileNo(fn2);
    if (!n1 || !n2) return false;
    if (n1 === n2) return true;
    
    const parts1 = n1.split('/');
    const parts2 = n2.split('/');
    if (parts1[0] === parts2[0] && parts1[0].length > 0) {
        if (parts1.length === 1 || parts2.length === 1) return true;
        const y1 = parts1[1];
        const y2 = parts2[1];
        if (y1 === y2 || y1.slice(-2) === y2.slice(-2)) return true;
    }
    return false;
};

const isTenderCancelledOrRetender = (status?: string | null): boolean => {
    if (!status) return false;
    const s = status.trim().toLowerCase();
    return s === 'tender cancelled' || 
           s === 'cancelled' || 
           s === 'retender' || 
           s === 're-tender' ||
           s.includes('cancelled') ||
           s.includes('retender');
};

const isFinalSiteStatus = (status?: string | null): boolean => {
    if (!status) return false;
    return [
        "Work Completed",
        "Work Failed",
        "Work Cancelled",
        "Refund Pending",
        "Bill Prepared",
        "Payment Completed",
        "Utilization Certificate Issued",
        "Completed"
    ].includes(status);
};

const getResolvedWorkStatus = (
    site: any,
    fileNo: string | undefined,
    idx: number,
    tenders: E_tender[]
): string | null => {
    // 1. Terminal / Final Outcomes (Highest Priority)
    if (site.dateOfCompletion && String(site.dateOfCompletion).trim() !== '') {
        return "Work Completed";
    }
    const activeCondition = site.drillingConditions || site.developingConditions || site.schemeConditions;
    if (activeCondition === 'Failed' || activeCondition === 'Collapsed') {
        return "Work Failed";
    }
    if (activeCondition === 'Cancelled') {
        return "Work Cancelled";
    }
    if (activeCondition === 'Refund') {
        return "Refund Pending";
    }
    if (isFinalSiteStatus(site.workStatus)) {
        return null;
    }

    // 2. Physical Execution Stage
    const hasStarted = site.startDate && String(site.startDate).trim() !== '';
    const hasActualDrilling = (Number(site.totalDepth) > 0) || (site.dateOfDrilling && String(site.dateOfDrilling).trim() !== '');
    if (hasStarted || hasActualDrilling) {
        return "Work in Progress";
    }
    if (site.workStatus === "Work in Progress" || site.workStatus === "Work Initiated") {
        return null;
    }

    // 3. e-Tender / Rig Allotment Stage
    const siteId = site.id || (fileNo ? `${fileNo}_${idx}` : undefined);
    const normTenderNo = site.tenderNo?.trim().toUpperCase();

    const matchingTenders = (tenders || []).filter(tender => {
        // 1. Direct tender number match
        if (normTenderNo && normTenderNo !== '_CLEAR_' && normTenderNo !== 'QUOTATION' && tender.eTenderNo && tender.eTenderNo.trim().toUpperCase() === normTenderNo) {
            return true;
        }
        // 2. Explicit selection in tender
        if (siteId && Array.isArray(tender.selectedSiteIds) && tender.selectedSiteIds.includes(siteId)) {
            return true;
        }
        // 3. Linked sites in tender
        if (Array.isArray(tender.linkedSites) && tender.linkedSites.some(ls => 
            (siteId && ls.siteId === siteId) ||
            (matchFileNo(ls.fileNo, fileNo) && ls.nameOfSite === site.nameOfSite)
        )) {
            return true;
        }
        // 4. File number match
        if (fileNo && (
            matchFileNo(tender.fileNo, fileNo) ||
            matchFileNo(tender.fileNo2, fileNo) ||
            matchFileNo(tender.fileNo3, fileNo) ||
            matchFileNo(tender.fileNo4, fileNo)
        )) {
            return true;
        }
        return false;
    });

    if (matchingTenders.length > 0) {
        matchingTenders.sort((a, b) => {
            const timeA = a.tenderDate instanceof Date ? a.tenderDate.getTime() : (a.tenderDate ? new Date(a.tenderDate as any).getTime() : 0);
            const timeB = b.tenderDate instanceof Date ? b.tenderDate.getTime() : (b.tenderDate ? new Date(b.tenderDate as any).getTime() : 0);
            return timeB - timeA;
        });

        const latestTender = matchingTenders[0];
        const ts = latestTender.presentStatus;

        if (ts === "Work Order Issued" || ts === "Supply Order Issued") {
            return "Work Order Issued";
        }
        if (ts === "Selection Notice Issued") {
            return "Selection Notice Issued";
        }
        if (!isTenderCancelledOrRetender(ts)) {
            return "Tendered";
        }
    } else if (normTenderNo && normTenderNo !== '_CLEAR_' && normTenderNo !== 'QUOTATION') {
        return "Tendered";
    }

    // 4. Department Rig Allotted
    if (site.siteConditions === 'Accessible to Dept. Rig') {
        return "Department Rig Allotted";
    }

    // 5. TS Pending
    const tsAmt = Number(site.tsAmount) || 0;
    if (!tsAmt || tsAmt === 0) {
        return "TS Pending";
    }

    // 6. Baseline State - Under Process
    return "Under Process";
};

export type RateDescriptionId = 'tenderFee' | 'emd' | 'performanceGuarantee' | 'additionalPerformanceGuarantee' | 'stampPaper';

export interface RateHistoryItem {
    description: string;
    rate?: string;
    orderNo?: string;
    orderDate?: Date;
    effectiveDate: Date;
    effectiveTo?: Date;
    updatedAt: Date;
    structuredData?: any;
}

export interface RateDescriptionDetail {
    description: string;
    rate?: string;
    orderNo?: string;
    orderDate?: Date;
    effectiveDate?: Date;
    effectiveTo?: Date;
    history?: RateHistoryItem[];
    structuredData?: any;
}

export const defaultRateDescriptions: Record<RateDescriptionId, string> = {
    tenderFee: "For Works:\n- Up to Rs 1 Lakh: No Fee\n- Over 1 Lakh up to 10 Lakhs: Rs 500\n- Over 10 Lakhs up to 50 Lakhs: Rs 2500\n- Over 50 Lakhs up to 1 Crore: Rs 5000\n- Above 1 Crore: Rs 10000\n\nFor Purchase:\n- Up to Rs 1 Lakh: No Fee\n- Over 1 Lakh up to 10 Lakhs: Rs 800\n- Over 10 Lakhs up to 25 Lakhs: Rs 1600\n- Above 25 Lakhs: Rs 3000",
    emd: "For Works:\n- Up to Rs. 2 Crore: 2.5% of the project cost, subject to a maximum of Rs. 50,000\n- Above Rs. 2 Crore up to Rs. 5 Crore: Rs. 1 Lakh\n- Above Rs. 5 Crore up to Rs. 10 Crore: Rs. 2 Lakh\n- Above Rs. 10 Crore: Rs. 5 Lakh\n\nFor Purchase:\n- Up to 2 Crore: 1.00% of the project cost\n- Above 2 Crore: No EMD",
    performanceGuarantee: "Performance Guarantee, the amount collected at the time of executing contract agreement will be 5% of the contract value (agreed PAC) and the deposit will be retained till the expiry of Defect Liability Period.",
    additionalPerformanceGuarantee: "Additional Performance Guarantee is the additional amount to be deposited for unbalanced price ie, for works quoted below estimate rate. Government decided to do away with additional performance guarantee for all works quoted below upto 10% of the estimate rate. Additional performance guarantee will be required if works quoted between 11% to 25% below estimate rate.",
    stampPaper: "For agreements or memorandums, stamp duty shall be ₹100 for every ₹1,00,000 (or part) of the contract amount, subject to a minimum of ₹200.",
};

const COLLECTIONS = {
    DEPARTMENT: 'departmentVehicles',
    HIRED: 'hiredVehicles',
    RIG_COMPRESSOR: 'rigCompressors',
};

interface DataStoreContextType {
    selectedOffice: string | null;
    setSelectedOffice: (office: string | null) => void;
    allUsers: UserProfile[];
    allFileEntries: DataEntryFormData[];
    allArsEntries: ArsEntry[];
    allStaffMembers: StaffMember[];
    allAgencyApplications: AgencyApplication[];
    allLsgConstituencyMaps: LsgConstituencyMap[];
    allRateDescriptions: Record<RateDescriptionId, string>;
    allRateDescriptionDetails: Record<RateDescriptionId, RateDescriptionDetail>;
    allGwdRates: GwdRateItem[];
    allBidders: MasterBidder[];
    allE_tenders: E_tender[];
    allDepartmentVehicles: DepartmentVehicle[];
    allHiredVehicles: HiredVehicle[];
    allRigCompressors: RigCompressor[];
    allOfficeAddresses: OfficeAddress[];
    allSanctionedStrength: Record<string, number>;
    searchTerms: Record<string, string>;
    setModuleSearchTerm: (module: string, term: string) => void;
    clearAllSearchTerms: () => void;
    updateSanctionedStrength: (designation: string, count: number) => Promise<void>;
    officeAddress: OfficeAddress | null;
    isLoading: boolean;
    refetchRateDescriptions: () => void;
    deleteArsEntry: (id: string) => Promise<void>;
    addDepartmentVehicle: (data: DepartmentVehicle) => Promise<void>;
    updateDepartmentVehicle: (data: DepartmentVehicle) => Promise<void>;
    deleteDepartmentVehicle: (id: string, name: string) => Promise<void>;
    addHiredVehicle: (data: HiredVehicle) => Promise<void>;
    updateHiredVehicle: (data: HiredVehicle) => Promise<void>;
    deleteHiredVehicle: (id: string, name: string) => Promise<void>;
    addRigCompressor: (data: RigCompressor) => Promise<void>;
    updateRigCompressor: (data: RigCompressor) => Promise<void>;
    deleteRigCompressor: (id: string, name: string) => Promise<void>;
}

const DataStoreContext = createContext<DataStoreContextType | undefined>(undefined);

export function DataStoreProvider({ children, user }: { children: ReactNode, user: UserProfile | null }) {
    const [selectedOffice, setSelectedOffice] = useState<string | null>(null);
    const [allUsers, setAllUsers] = useState<UserProfile[]>([]);
    const [rawFileEntries, setRawFileEntries] = useState<DataEntryFormData[]>([]);
    const [rawArsEntries, setRawArsEntries] = useState<ArsEntry[]>([]);
    const [allStaffMembers, setAllStaffMembers] = useState<StaffMember[]>([]);
    const [allAgencyApplications, setAllAgencyApplications] = useState<AgencyApplication[]>([]);
    const [allLsgConstituencyMaps, setAllLsgConstituencyMaps] = useState<LsgConstituencyMap[]>([]);
    const [allRateDescriptions, setAllRateDescriptions] = useState<Record<RateDescriptionId, string>>(defaultRateDescriptions);
    const [allRateDescriptionDetails, setAllRateDescriptionDetails] = useState<Record<RateDescriptionId, RateDescriptionDetail>>({} as Record<RateDescriptionId, RateDescriptionDetail>);
    const [allGwdRates, setAllGwdRates] = useState<GwdRateItem[]>([]);
    const [allBidders, setAllBidders] = useState<MasterBidder[]>([]);
    const [allE_tenders, setAllE_tenders] = useState<E_tender[]>([]);
    const [allDepartmentVehicles, setAllDepartmentVehicles] = useState<DepartmentVehicle[]>([]);
    const [allHiredVehicles, setAllHiredVehicles] = useState<HiredVehicle[]>([]);
    const [allRigCompressors, setAllRigCompressors] = useState<RigCompressor[]>([]);
    const [globalOfficeAddresses, setGlobalOfficeAddresses] = useState<OfficeAddress[]>([]);
    const [officeAddress, setOfficeAddress] = useState<OfficeAddress | null>(null);
    const [allSanctionedStrength, setAllSanctionedStrength] = useState<Record<string, number>>({});
    
    // Persistent search term state
    const [searchTerms, setSearchTerms] = useState<Record<string, string>>({});

    const [loadingStates, setLoadingStates] = useState({
        users: true, files: true, ars: true, staff: true, agencies: true, lsg: true, rates: true, gwdRates: true, bidders: true, eTenders: true,
        departmentVehicles: true, hiredVehicles: true, rigCompressors: true, officeAddress: true, sanctionedStrength: true,
    });
    
    const setModuleSearchTerm = useCallback((module: string, term: string) => {
        setSearchTerms(prev => ({ ...prev, [module]: term }));
    }, []);

    const clearAllSearchTerms = useCallback(() => {
        setSearchTerms({});
    }, []);

    const refetchRateDescriptions = useCallback(() => setLoadingStates(prev => ({...prev, rates: true})), []);

     const deleteArsEntry = useCallback(async (id: string) => {
        if (!user || (user.role !== 'admin' && user.role !== 'superAdmin')) {
            toast({ title: "Permission Denied", description: "You don't have permission to delete entries.", variant: "destructive" });
            return;
        }
        const officeLoc = user.role === 'superAdmin' ? selectedOffice : user.officeLocation;
        if (!officeLoc) throw new Error("An office location must be selected.");
        const collectionPath = `offices/${officeLoc.toLowerCase()}/arsEntries`;
        await deleteDoc(doc(db, collectionPath, id));
    }, [user, selectedOffice]);

    const updateSanctionedStrength = useCallback(async (designation: string, count: number) => {
        if (!user) throw new Error("User must be logged in.");
        const officeLoc = user.role === 'superAdmin' ? selectedOffice : user.officeLocation;
        if (!officeLoc) throw new Error("An office location must be selected.");
        
        const docRef = doc(db, `offices/${officeLoc.toLowerCase()}/sanctionedStrength`, designation);
        await setDoc(docRef, { count, updatedAt: serverTimestamp() });
    }, [user, selectedOffice]);

    useEffect(() => {
        if (!user) {
            setAllRateDescriptions(defaultRateDescriptions);
            setAllGwdRates([]);
            setAllBidders([]);
            setGlobalOfficeAddresses([]);
            setLoadingStates(prev => ({ ...prev, rates: false, gwdRates: false, bidders: false, officeAddress: false }));
            return;
        }
        
        const globalCollections: Record<string, { setter: React.Dispatch<React.SetStateAction<any>>, loaderKey: keyof typeof loadingStates, queryFn: () => any }> = {
            rateDescriptions: { setter: setAllRateDescriptions, loaderKey: 'rates', queryFn: () => query(collection(db, 'rateDescriptions')) },
            gwdRates: { setter: setAllGwdRates, loaderKey: 'gwdRates', queryFn: () => query(collection(db, 'gwdRates'), orderBy('order', 'asc')) },
            officeAddresses: { setter: setGlobalOfficeAddresses, loaderKey: 'officeAddress', queryFn: () => query(collection(db, 'officeAddresses')) },
        };

        const unsubscribes = Object.entries(globalCollections).map(([collectionName, { setter, loaderKey, queryFn }]) => {
            setLoadingStates(prev => ({ ...prev, [loaderKey]: true }));
            
            return onSnapshot(queryFn(), (snapshot: QuerySnapshot<DocumentData>) => {
                if (collectionName === 'rateDescriptions') {
                    const descriptions: Partial<Record<RateDescriptionId, string>> = {};
                    const details: Record<RateDescriptionId, RateDescriptionDetail> = {} as Record<RateDescriptionId, RateDescriptionDetail>;

                    snapshot.docs.forEach(docSnap => {
                        const data = docSnap.data();
                        const id = docSnap.id as RateDescriptionId;
                        let desc = data.description || '';
                        
                        // If stored description in Firestore is the legacy text (15%), automatically update in memory to new standard
                        if (id === 'additionalPerformanceGuarantee' && (desc.includes('15%') || !desc.includes('10%'))) {
                            desc = defaultRateDescriptions.additionalPerformanceGuarantee;
                        }

                        descriptions[id] = desc;
                        
                        details[id] = {
                            description: desc,
                            rate: data.rate || '',
                            orderNo: data.orderNo || '',
                            orderDate: data.orderDate instanceof Timestamp ? data.orderDate.toDate() : undefined,
                            effectiveDate: data.effectiveDate instanceof Timestamp ? data.effectiveDate.toDate() : undefined,
                            effectiveTo: data.effectiveTo instanceof Timestamp ? data.effectiveTo.toDate() : undefined,
                            structuredData: data.structuredData || null,
                            history: Array.isArray(data.history) ? data.history.map((h: any) => ({
                                ...h,
                                orderDate: h.orderDate instanceof Timestamp ? h.orderDate.toDate() : (h.orderDate ? new Date(h.orderDate) : undefined),
                                effectiveDate: h.effectiveDate instanceof Timestamp ? h.effectiveDate.toDate() : (h.effectiveDate ? new Date(h.effectiveDate) : new Date()),
                                effectiveTo: h.effectiveTo instanceof Timestamp ? h.effectiveTo.toDate() : (h.effectiveTo ? new Date(h.effectiveTo) : undefined),
                                updatedAt: h.updatedAt instanceof Timestamp ? h.updatedAt.toDate() : (h.updatedAt ? new Date(h.updatedAt) : new Date()),
                            })) : []
                        };
                    });

                    // Ensure all default rate IDs have entries in details
                    (Object.keys(defaultRateDescriptions) as RateDescriptionId[]).forEach(id => {
                        if (!details[id] || !details[id].description) {
                            details[id] = {
                                description: defaultRateDescriptions[id],
                                rate: '',
                                orderNo: '',
                                history: []
                            };
                        }
                    });

                    setAllRateDescriptions((prev: Record<RateDescriptionId, string>) => ({ ...defaultRateDescriptions, ...prev, ...descriptions }));
                    setAllRateDescriptionDetails(prev => ({ ...prev, ...details }));
                } else {
                    const data = snapshot.docs.map(doc => processFirestoreDoc(doc));
                    setter(data);
                }
                setLoadingStates(prev => ({...prev, [loaderKey]: false}));
            }, (error) => {
                console.error(`Error fetching global collection ${collectionName}:`, error);
                setLoadingStates(prev => ({...prev, [loaderKey]: false}));
            });
        });

        return () => unsubscribes.forEach(unsub => unsub());
    }, [user]);

    useEffect(() => {
      if (!user) {
          setOfficeAddress(null);
          return;
      }
      const isSuperAdminUser = user.role === 'superAdmin';
      const officeLocation = isSuperAdminUser ? selectedOffice : user.officeLocation;
  
      if (!officeLocation) {
          setOfficeAddress(null);
          return;
      }
  
      const globalOffice = globalOfficeAddresses.find(oa => (oa.officeLocation || '').toLowerCase() === officeLocation.toLowerCase());
      const subOfficeCollectionPath = `offices/${officeLocation.toLowerCase()}/officeAddresses`;
      
      const unsubscribe = onSnapshot(query(collection(db, subOfficeCollectionPath)), (snapshot) => {
          if (!snapshot.empty) {
              const bestDocSnap = snapshot.docs.reduce((prev, curr) => {
                  return Object.keys(curr.data()).length > Object.keys(prev.data()).length ? curr : prev;
              }, snapshot.docs[0]);

              const subOfficeDoc = processFirestoreDoc<OfficeAddress>(bestDocSnap);
              setOfficeAddress({
                  ...subOfficeDoc,
                  officeLocation: formatDistrictLocation(officeLocation || subOfficeDoc.officeLocation),
                  officeCode: globalOffice?.officeCode || subOfficeDoc.officeCode || '',
              });
          } else {
              if (globalOffice) setOfficeAddress({ ...globalOffice, officeLocation: formatDistrictLocation(globalOffice.officeLocation || officeLocation), officeName: '', id: globalOffice.id });
              else setOfficeAddress(null);
          }
      });
  
      return () => unsubscribe();
    }, [user, selectedOffice, globalOfficeAddresses]);

    useEffect(() => {
        if (!user) {
            setRawFileEntries([]); setRawArsEntries([]); setAllStaffMembers([]);
            setAllAgencyApplications([]); setAllE_tenders([]); setAllDepartmentVehicles([]);
            setAllHiredVehicles([]); setAllRigCompressors([]); setAllLsgConstituencyMaps([]);
            setAllSanctionedStrength({}); setAllBidders([]);
            setAllUsers([]);
            setLoadingStates(prev => ({ ...prev, users: false, files: false, ars: false, staff: false, agencies: false, eTenders: false, departmentVehicles: false, hiredVehicles: false, rigCompressors: false, lsg: false, sanctionedStrength: false, bidders: false }));
            return;
        }
        
        const isSuperAdminUser = user.role === 'superAdmin';
        const officeToQuery = isSuperAdminUser ? selectedOffice : user.officeLocation;

        const officeScopedCollections: Record<string, { setter: React.Dispatch<React.SetStateAction<any>>, loaderKey: keyof typeof loadingStates, needsSpecialSort?: boolean }> = {
            fileEntries: { setter: setRawFileEntries, loaderKey: 'files' },
            arsEntries: { setter: setRawArsEntries, loaderKey: 'ars' },
            staffMembers: { setter: setAllStaffMembers, loaderKey: 'staff', needsSpecialSort: true },
            agencyApplications: { setter: setAllAgencyApplications, loaderKey: 'agencies' },
            eTenders: { setter: setAllE_tenders, loaderKey: 'eTenders', needsSpecialSort: true },
            departmentVehicles: { setter: setAllDepartmentVehicles, loaderKey: 'departmentVehicles' },
            hiredVehicles: { setter: setAllHiredVehicles, loaderKey: 'hiredVehicles' },
            rigCompressors: { setter: setAllRigCompressors, loaderKey: 'rigCompressors' },
            localSelfGovernments: { setter: setAllLsgConstituencyMaps, loaderKey: 'lsg' },
            bidders: { setter: setAllBidders, loaderKey: 'bidders' },
            users: { setter: setAllUsers, loaderKey: 'users' },
            sanctionedStrength: { setter: setAllSanctionedStrength, loaderKey: 'sanctionedStrength' },
        };

        const unsubscribes = Object.entries(officeScopedCollections).map(([collectionName, { setter, loaderKey, needsSpecialSort }]) => {
            setLoadingStates(prev => ({...prev, [loaderKey]: true}));
            let q;
            
            // SPECIAL CASE: For Super Admin, always listen to the global users collection
            // to populate the OfficeSwitcher and allow global user management across all screens.
            if (isSuperAdminUser && collectionName === 'users') {
                q = query(collection(db, 'users'));
            } else if (officeToQuery) {
                const path = `offices/${officeToQuery.toLowerCase()}/${collectionName}`;
                q = collectionName === 'bidders' ? query(collection(db, path), orderBy("order")) : query(collection(db, path));
            } else if (isSuperAdminUser && !officeToQuery) {
                // This branch is for "All Offices" view for non-users collections
                q = query(collectionGroup(db, collectionName));
            } else {
                setter([]); setLoadingStates(prev => ({...prev, [loaderKey]: false})); return () => {};
            }
            
            return onSnapshot(q, (snapshot: QuerySnapshot<DocumentData>) => {
                if (collectionName === 'sanctionedStrength') {
                    const strengthData = snapshot.docs.reduce((acc, docSnap) => {
                        const data = docSnap.data();
                        acc[docSnap.id] = data.count || 0;
                        return acc;
                    }, {} as Record<string, number>);
                    setter(strengthData);
                } else {
                    const dataRaw = snapshot.docs.map(docSnap => {
                        const processedData = processFirestoreDoc({ id: docSnap.id, data: () => docSnap.data() }) as any;
                        const pathSegments = (docSnap.ref.path || '').split('/');
                        const officeIdIndex = pathSegments.indexOf('offices');
                        if (officeIdIndex > -1 && pathSegments.length > officeIdIndex + 1) processedData.officeLocationFromPath = pathSegments[officeIdIndex + 1];
                        return processedData;
                    });

                    let data = dataRaw;
                    if (collectionName === 'users') {
                        const uniqueUsers = new Map<string, any>();
                        dataRaw.forEach((item: any) => { const uid = item.uid || item.id; if (!uniqueUsers.has(uid)) uniqueUsers.set(uid, { ...item, uid }); });
                        data = Array.from(uniqueUsers.values());
                    }
                    
                    if (needsSpecialSort && collectionName === 'staffMembers' && designationOptions) {
                        const dOptions = [...designationOptions];
                        const designationSortOrder = dOptions.reduce((acc, curr, index) => ({ ...acc, [curr]: index }), {} as Record<string, number>);
                        (data as StaffMember[]).sort((a, b) => {
                            const orderA = a.designation ? (designationSortOrder[a.designation] ?? dOptions.length) : dOptions.length;
                            const orderB = b.designation ? (designationSortOrder[b.designation] ?? dOptions.length) : dOptions.length;
                            return orderA !== orderB ? orderA - orderB : (a.name || '').localeCompare(b.name || '');
                        });
                    } else if (needsSpecialSort && collectionName === 'eTenders') {
                        (data as E_tender[]).sort((a, b) => (b.tenderDate instanceof Date ? b.tenderDate.getTime() : 0) - (a.tenderDate instanceof Date ? a.tenderDate.getTime() : 0));
                    }
                    setter(data); 
                }
                setLoadingStates(prev => ({...prev, [loaderKey]: false}));
            }, (error) => {
                 if (error.code === 'permission-denied') errorEmitter.emit('permission-error', new FirestorePermissionError({ path: `offices/.../${collectionName}`, operation: 'list' }));
                 else { console.error(`Error fetching ${collectionName}:`, error); toast({ title: `Error Loading ${collectionName}`, description: error.message, variant: "destructive" }); }
                 setLoadingStates(prev => ({...prev, [loaderKey]: false}));
            });
        });

        return () => unsubscribes.forEach(unsub => unsub());
    }, [user, selectedOffice]);

    // --- Dynamic Work Status Resolution for Cancelled / Retendered / Active e-Tenders ---
    const allFileEntries = useMemo(() => {
        if (!rawFileEntries.length || !allE_tenders.length) return rawFileEntries;

        return rawFileEntries.map(entry => {
            if (!entry.siteDetails || entry.siteDetails.length === 0) return entry;

            let entryModified = false;
            const updatedSites = entry.siteDetails.map((site, idx) => {
                const resolvedStatus = getResolvedWorkStatus(site, entry.fileNo, idx, allE_tenders);
                if (resolvedStatus && resolvedStatus !== site.workStatus) {
                    entryModified = true;
                    return { ...site, workStatus: resolvedStatus };
                }
                return site;
            });

            if (entryModified) {
                let resolvedFileStatus = entry.fileStatus;
                const hasTendered = updatedSites.some(s => s.workStatus === "Tendered" || s.workStatus === "Selection Notice Issued" || s.workStatus === "Work Order Issued");
                if (hasTendered && ["File Under Process", "Pending", "Technical Sanction", "Rig Accessibility Inspection"].includes(entry.fileStatus || '')) {
                    resolvedFileStatus = "Tender Process";
                }
                return { ...entry, siteDetails: updatedSites, fileStatus: resolvedFileStatus };
            }
            return entry;
        });
    }, [rawFileEntries, allE_tenders]);

    const allArsEntries = useMemo(() => {
        if (!rawArsEntries.length || !allE_tenders.length) return rawArsEntries;

        return rawArsEntries.map(ars => {
            const normTenderNo = ars.arsTenderNo?.trim().toUpperCase();
            const matchingTenders = allE_tenders.filter(tender => {
                if (normTenderNo && tender.eTenderNo && tender.eTenderNo.trim().toUpperCase() === normTenderNo) return true;
                if (ars.fileNo && (
                    matchFileNo(tender.fileNo, ars.fileNo) ||
                    matchFileNo(tender.fileNo2, ars.fileNo) ||
                    matchFileNo(tender.fileNo3, ars.fileNo) ||
                    matchFileNo(tender.fileNo4, ars.fileNo)
                )) return true;
                return false;
            });

            if (!matchingTenders.length) return ars;

            matchingTenders.sort((a, b) => {
                const timeA = a.tenderDate instanceof Date ? a.tenderDate.getTime() : (a.tenderDate ? new Date(a.tenderDate as any).getTime() : 0);
                const timeB = b.tenderDate instanceof Date ? b.tenderDate.getTime() : (b.tenderDate ? new Date(b.tenderDate as any).getTime() : 0);
                return timeB - timeA;
            });

            const latestTender = matchingTenders[0];
            const ts = latestTender.presentStatus;
            if (isTenderCancelledOrRetender(ts)) {
                if (!isFinalSiteStatus(ars.arsStatus as any) && ars.arsStatus !== 'Under Process') {
                    return { ...ars, arsStatus: 'Under Process' };
                }
            } else if (ts === "Work Order Issued" || ts === "Supply Order Issued") {
                if (!isFinalSiteStatus(ars.arsStatus as any)) {
                    return { ...ars, arsStatus: 'Work Order Issued' };
                }
            } else if (ts === "Selection Notice Issued") {
                if (!isFinalSiteStatus(ars.arsStatus as any)) {
                    return { ...ars, arsStatus: 'Selection Notice Issued' };
                }
            } else {
                if (!isFinalSiteStatus(ars.arsStatus as any) && !["Work Order Issued", "Selection Notice Issued", "Work in Progress"].includes(ars.arsStatus as any)) {
                    if (ars.arsStatus !== 'Tendered') {
                        return { ...ars, arsStatus: 'Tendered' };
                    }
                }
            }
            return ars;
        });
    }, [rawArsEntries, allE_tenders]);

    // Persistent Firestore Auto-Sync: Updates database documents where work status needs sync with e-Tenders
    const syncedDocIdsRef = useRef<Set<string>>(new Set());
    useEffect(() => {
        if (!user) return;
        if (!rawFileEntries.length || !allE_tenders.length) return;

        const officeToQuery = user.role === 'superAdmin' ? selectedOffice : user.officeLocation;
        if (!officeToQuery) return;

        rawFileEntries.forEach(entry => {
            if (!entry.id || !entry.siteDetails || entry.siteDetails.length === 0) return;
            if (syncedDocIdsRef.current.has(entry.id)) return;

            let needsDbUpdate = false;
            let resolvedFileStatus = entry.fileStatus;
            const updatedSites = entry.siteDetails.map((site, idx) => {
                const resolvedStatus = getResolvedWorkStatus(site, entry.fileNo, idx, allE_tenders);
                if (resolvedStatus && resolvedStatus !== site.workStatus && (resolvedStatus === "Under Process" || resolvedStatus === "Tendered" || resolvedStatus === "Work Order Issued" || resolvedStatus === "Selection Notice Issued")) {
                    needsDbUpdate = true;
                    return { ...site, workStatus: resolvedStatus };
                }
                return site;
            });

            const hasTendered = updatedSites.some(s => s.workStatus === "Tendered" || s.workStatus === "Selection Notice Issued" || s.workStatus === "Work Order Issued");
            if (hasTendered && ["File Under Process", "Pending", "Technical Sanction", "Rig Accessibility Inspection"].includes(entry.fileStatus || '')) {
                resolvedFileStatus = "Tender Process";
                needsDbUpdate = true;
            }

            if (needsDbUpdate) {
                syncedDocIdsRef.current.add(entry.id);
                const targetOffice = (entry.officeLocationFromPath || officeToQuery).toLowerCase();
                const docRef = doc(db, `offices/${targetOffice}/fileEntries`, entry.id);
                const payload: any = {
                    siteDetails: updatedSites,
                    updatedAt: serverTimestamp()
                };
                if (resolvedFileStatus !== entry.fileStatus) {
                    payload.fileStatus = resolvedFileStatus;
                }
                updateDoc(docRef, payload).catch(err => {
                    console.error(`Failed to auto-update Firestore for file ${entry.fileNo}:`, err);
                    syncedDocIdsRef.current.delete(entry.id);
                });
            }
        });
    }, [rawFileEntries, allE_tenders, user, selectedOffice]);

    const isLoading = Object.values(loadingStates).some(Boolean);

    const addDepartmentVehicle = useCallback(async (data: DepartmentVehicle) => {
        if (!user) throw new Error("User must be logged in.");
        const officeLoc = user.role === 'superAdmin' ? selectedOffice : user.officeLocation;
        if (!officeLoc) throw new Error("Office location required.");
        const collectionPath = `offices/${officeLoc.toLowerCase()}/${COLLECTIONS.DEPARTMENT}`;
        const payload = { ...data, createdAt: serverTimestamp(), updatedAt: serverTimestamp() };
        if ('id' in payload) delete (payload as any).id;
        await addDoc(collection(db, collectionPath), payload);
    }, [user, selectedOffice]);

    const updateDepartmentVehicle = useCallback(async (data: DepartmentVehicle) => {
        if (!user) throw new Error("User must be logged in.");
        const officeLoc = user.role === 'superAdmin' ? selectedOffice : user.officeLocation;
        if (!officeLoc || !data.id) throw new Error("Missing office or ID.");
        const docRef = doc(db, `offices/${officeLoc.toLowerCase()}/${COLLECTIONS.DEPARTMENT}`, data.id);
        const payload = { ...data, updatedAt: serverTimestamp() };
        if ('id' in payload) delete (payload as any).id;
        await updateDoc(docRef, payload);
    }, [user, selectedOffice]);

    const deleteDepartmentVehicle = useCallback(async (id: string, name: string) => {
        if (!user) throw new Error("User must be logged in.");
        const officeLoc = user.role === 'superAdmin' ? selectedOffice : user.officeLocation;
        if (!officeLoc) throw new Error("Office location required.");
        const docRef = doc(db, `offices/${officeLoc.toLowerCase()}/${COLLECTIONS.DEPARTMENT}`, id);
        deleteDoc(docRef).then(() => toast({ title: 'Item Deleted', description: `${name} removed.` }))
            .catch(error => {
                if (error.code === 'permission-denied') errorEmitter.emit('permission-error', new FirestorePermissionError({ path: docRef.path, operation: 'delete' }));
                else toast({ title: "Error Deleting Item", description: error.message, variant: "destructive" });
            });
    }, [user, selectedOffice]);
    
    const addHiredVehicle = useCallback(async (data: HiredVehicle) => {
        if (!user) throw new Error("User must be logged in.");
        const officeLoc = user.role === 'superAdmin' ? selectedOffice : user.officeLocation;
        if (!officeLoc) throw new Error("Office location required.");
        const collectionPath = `offices/${officeLoc.toLowerCase()}/${COLLECTIONS.HIRED}`;
        const payload = { ...data, createdAt: serverTimestamp(), updatedAt: serverTimestamp() };
        if ('id' in payload) delete (payload as any).id;
        await addDoc(collection(db, collectionPath), payload);
    }, [user, selectedOffice]);

    const updateHiredVehicle = useCallback(async (data: HiredVehicle) => {
        if (!user) throw new Error("User must be logged in.");
        const officeLoc = user.role === 'superAdmin' ? selectedOffice : user.officeLocation;
        if (!officeLoc || !data.id) throw new Error("Missing office or ID.");
        const docRef = doc(db, `offices/${officeLoc.toLowerCase()}/${COLLECTIONS.HIRED}`, data.id);
        const payload = { ...data, updatedAt: serverTimestamp() };
        if ('id' in payload) delete (payload as any).id;
        await updateDoc(docRef, payload);
    }, [user, selectedOffice]);

    const deleteHiredVehicle = useCallback(async (id: string, name: string) => {
        if (!user) throw new Error("User must be logged in.");
        const officeLoc = user.role === 'superAdmin' ? selectedOffice : user.officeLocation;
        if (!officeLoc) throw new Error("Office location required.");
        const docRef = doc(db, `offices/${officeLoc.toLowerCase()}/${COLLECTIONS.HIRED}`, id);
        deleteDoc(docRef).then(() => toast({ title: 'Item Deleted', description: `${name} removed.` }))
            .catch(error => {
                if (error.code === 'permission-denied') errorEmitter.emit('permission-error', new FirestorePermissionError({ path: docRef.path, operation: 'delete' }));
                else toast({ title: "Error Deleting Item", description: error.message, variant: "destructive" });
            });
    }, [user, selectedOffice]);

    const addRigCompressor = useCallback(async (data: RigCompressor) => {
        if (!user) throw new Error("User must be logged in.");
        const officeLoc = user.role === 'superAdmin' ? selectedOffice : user.officeLocation;
        if (!officeLoc) throw new Error("Office location required.");
        const collectionPath = `offices/${officeLoc.toLowerCase()}/${COLLECTIONS.RIG_COMPRESSOR}`;
        const payload = { ...data, createdAt: serverTimestamp(), updatedAt: serverTimestamp() };
        if ('id' in payload) delete (payload as any).id;
        await addDoc(collection(db, collectionPath), payload);
    }, [user, selectedOffice]);

    const updateRigCompressor = useCallback(async (data: RigCompressor) => {
        if (!user) throw new Error("User must be logged in.");
        const officeLoc = user.role === 'superAdmin' ? selectedOffice : user.officeLocation;
        if (!officeLoc || !data.id) throw new Error("Missing office or ID.");
        const docRef = doc(db, `offices/${officeLoc.toLowerCase()}/${COLLECTIONS.RIG_COMPRESSOR}`, data.id);
        const payload = { ...data, updatedAt: serverTimestamp() };
        if ('id' in payload) delete (payload as any).id;
        await updateDoc(docRef, payload);
    }, [user, selectedOffice]);

    const deleteRigCompressor = useCallback(async (id: string, name: string) => {
        if (!user) throw new Error("User must be logged in.");
        const officeLoc = user.role === 'superAdmin' ? selectedOffice : user.officeLocation;
        if (!officeLoc) throw new Error("Office location required.");
        const docRef = doc(db, `offices/${officeLoc.toLowerCase()}/${COLLECTIONS.RIG_COMPRESSOR}`, id);
        deleteDoc(docRef).then(() => toast({ title: 'Item Deleted', description: `${name} removed.` }))
            .catch(error => {
                if (error.code === 'permission-denied') errorEmitter.emit('permission-error', new FirestorePermissionError({ path: docRef.path, operation: 'delete' }));
                else toast({ title: "Error Deleting Item", description: error.message, variant: "destructive" });
            });
    }, [user, selectedOffice]);

    return (
        <DataStoreContext.Provider value={{
            selectedOffice, setSelectedOffice, allUsers, allFileEntries, allArsEntries, allStaffMembers, allAgencyApplications, allLsgConstituencyMaps, allRateDescriptions,
            allRateDescriptionDetails, allGwdRates,
            allBidders, allE_tenders, allDepartmentVehicles, allHiredVehicles, allRigCompressors, 
            allSanctionedStrength, updateSanctionedStrength, allOfficeAddresses: globalOfficeAddresses, officeAddress, isLoading,
            searchTerms, setModuleSearchTerm, clearAllSearchTerms,
            refetchRateDescriptions, deleteArsEntry, 
            addDepartmentVehicle, updateDepartmentVehicle, deleteDepartmentVehicle, 
            addHiredVehicle, updateHiredVehicle, deleteHiredVehicle, 
            addRigCompressor, updateRigCompressor, deleteRigCompressor,
        }}>{children}</DataStoreContext.Provider>
    );
}

export function useDataStore() {
    const context = useContext(DataStoreContext);
    if (!context) throw new Error('useDataStore must be used within a DataStoreProvider');
    return context;
}
