// src/hooks/useE_tenders.ts
"use client";

import { useCallback } from 'react';
import { getFirestore, collection, doc, addDoc, updateDoc, deleteDoc, serverTimestamp, getDoc, getDocs, type DocumentData, Timestamp } from 'firebase/firestore';
import { app } from '@/lib/firebase';
import { useAuth } from './useAuth';
import type { E_tenderFormData } from '@/lib/schemas/eTenderSchema';
import { toast } from './use-toast';
import { useDataStore } from './use-data-store';
import { SUPER_ADMIN_EMAIL } from '@/lib/config';
import { calculateWorkCommencementDate } from '@/lib/holidayUtils';
import { normalizeFileNo, matchFileNo, isTenderCancelledOrRetender, isSiteTargetedByTender, getResolvedWorkStatus } from '@/lib/tenderUtils';

const db = getFirestore(app);

export type E_tender = E_tenderFormData & {
  id: string;
  createdAt?: Date;
  updatedAt?: Date;
};

const processDoc = (docSnap: DocumentData): E_tender => {
    const data = docSnap.data();
    
    // Helper function to recursively process any value
    const processValue = (value: any): any => {
        if (value instanceof Timestamp) {
            return value.toDate();
        }
        if (Array.isArray(value)) {
            return value.map(processValue); // Recurse for items in array
        }
        if (value !== null && typeof value === 'object' && !(value instanceof Date)) {
            // It's a plain object (a map in Firestore terms)
            const nestedObject: { [key: string]: any } = {};
            for (const key in value) {
                if (Object.prototype.hasOwnProperty.call(value, key)) {
                    nestedObject[key] = processValue(value[key]);
                }
            }
            return nestedObject;
        }
        // Return primitives, Dates, or null as is
        return value;
    };

    // Process the document data
    const convertedData = processValue(data);

    // Add the document ID to the final object
    if (docSnap.id) {
        convertedData.id = docSnap.id;
    }

    // Auto-transition status from 'Tender Preparation' to 'Tender Process' when system time reaches Date & Time of Publishing
    if (convertedData.presentStatus === 'Tender Preparation' && convertedData.dateTimeOfPublishing) {
        const pubDate = new Date(convertedData.dateTimeOfPublishing);
        if (!isNaN(pubDate.getTime()) && pubDate.getTime() <= Date.now()) {
            convertedData.presentStatus = 'Tender Process';
        }
    }
    
    return convertedData as E_tender;
};

// Helper function to recursively remove `undefined` values, replacing them with `null`.
const sanitizeDataForFirestore = (data: any): any => {
    if (data === undefined) {
        return null;
    }
    if (Array.isArray(data)) {
        return data.map(item => sanitizeDataForFirestore(item));
    }
    if (data && typeof data === 'object' && !(data instanceof Date) && !(data instanceof Timestamp)) {
        const sanitized: { [key: string]: any } = {};
        for (const key in data) {
            if (Object.prototype.hasOwnProperty.call(data, key)) {
                const value = data[key];
                sanitized[key] = sanitizeDataForFirestore(value);
            }
        }
        return sanitized;
    }
    return data;
};

// Helper function to sync tender details with matching file entries & ARS entries
async function syncTenderWithSiteDetails(officeLocation: string, tenderData: Partial<E_tender>) {
    if (!officeLocation) return;
    const officePath = officeLocation.toLowerCase();

    const eTenderNo = tenderData.eTenderNo?.trim() || '';
    const selectedSiteIds = Array.isArray(tenderData.selectedSiteIds) ? tenderData.selectedSiteIds : [];
    const linkedSites = Array.isArray(tenderData.linkedSites) ? tenderData.linkedSites : [];

    const targetFileNos = [
        tenderData.fileNo,
        tenderData.fileNo2,
        tenderData.fileNo3,
        tenderData.fileNo4
    ]
        .filter((fn): fn is string => typeof fn === 'string' && fn.trim().length > 0)
        .map(fn => fn.trim().toUpperCase());

    if (!eTenderNo && targetFileNos.length === 0) return;

    const matchFileNo = (fileNoInDb?: string | null, searchNo?: string | null): boolean => {
        if (!fileNoInDb || !searchNo) return false;
        const dbClean = fileNoInDb.trim().toUpperCase();
        const searchClean = searchNo.trim().toUpperCase();
        if (!searchClean) return false;
        if (dbClean === searchClean) return true;

        const stripOfficePrefix = (str: string) => str.replace(/^[A-Z][A-Z0-9_]*\//, '');
        const dbNoPrefix = stripOfficePrefix(dbClean);
        const searchNoPrefix = stripOfficePrefix(searchClean);

        return dbNoPrefix === searchNoPrefix;
    };

    const presentStatusStr = (tenderData.presentStatus as string) || '';
    const isTenderCancelled = presentStatusStr === "Tender Cancelled" || 
                              presentStatusStr === "Cancelled" || 
                              presentStatusStr === "Retender" || 
                              presentStatusStr === "Re-tender";

    try {
        // 1. Sync fileEntries
        const fileEntriesRef = collection(db, `offices/${officePath}/fileEntries`);
        const fileSnap = await getDocs(fileEntriesRef);

        let updatedFileCount = 0;

        for (const docSnap of fileSnap.docs) {
            const entryData = docSnap.data();
            const entryFileNo = entryData.fileNo;
            const siteDetails = entryData.siteDetails || [];

            const isFileNoMatch = targetFileNos.some(targetNo => matchFileNo(entryFileNo, targetNo));
            const hasMatchingTenderNoInSites = siteDetails.some((site: any) => 
                eTenderNo && site.tenderNo && site.tenderNo.trim().toUpperCase() === eTenderNo.toUpperCase()
            );

            if (isFileNoMatch || hasMatchingTenderNoInSites) {
                let siteModified = false;
                const updatedSites = siteDetails.map((site: any, idx: number) => {
                    const newSite = { ...site };
                    const siteId = site.id || `${entryFileNo}_${idx}`;

                    // Explicit check: Is this site targeted by this tender?
                    const isTargetedSite = !isTenderCancelled && isSiteTargetedByTender(site, entryFileNo, idx, tenderData as E_tender);

                    const isCurrentlyLinkedToThisTender = Boolean(
                        eTenderNo && site.tenderNo && site.tenderNo.trim().toUpperCase() === eTenderNo.toUpperCase()
                    );

                    const isStaleTenderStatus = isFileNoMatch && !isTargetedSite && (site.workStatus === "Tendered" || site.workStatus === "Selection Notice Issued" || site.workStatus === "Work Order Issued");

                    if (!isTargetedSite && !isCurrentlyLinkedToThisTender && !isStaleTenderStatus && !hasMatchingTenderNoInSites) {
                        return newSite;
                    }

                    let changed = false;

                    if (isTenderCancelled) {
                        // ON CANCELLATION OR DELETION: Remove tender links and revert to proper pre-tender status
                        if (isCurrentlyLinkedToThisTender || isStaleTenderStatus) {
                            delete newSite.tenderNo;
                            delete newSite.contractorName;
                            delete newSite.quotedPercentage;
                            changed = true;
                        }

                        if (isTargetedSite || isCurrentlyLinkedToThisTender || isStaleTenderStatus) {
                            if (!["Work Completed", "Work Failed", "Work Cancelled", "Refund Pending", "Bill Prepared", "Payment Completed", "Utilization Certificate Issued"].includes(newSite.workStatus)) {
                                const computedStatus = getResolvedWorkStatus(newSite, entryFileNo, idx, []) || "Under Process";
                                if (newSite.workStatus !== computedStatus) {
                                    newSite.workStatus = computedStatus;
                                    changed = true;
                                }
                            }
                            delete newSite.previousWorkStatus;
                        }
                    } else if (!isTargetedSite && (isCurrentlyLinkedToThisTender || isStaleTenderStatus)) {
                        // ON UNLINKING A SITE: Remove tender link and return status back to pre-tender status
                        delete newSite.tenderNo;
                        delete newSite.contractorName;
                        delete newSite.quotedPercentage;
                        changed = true;

                        if (!["Work Completed", "Work Failed", "Work Cancelled", "Refund Pending", "Bill Prepared", "Payment Completed", "Utilization Certificate Issued"].includes(newSite.workStatus)) {
                            const computedStatus = getResolvedWorkStatus(newSite, entryFileNo, idx, []) || "Under Process";
                            if (newSite.workStatus !== computedStatus) {
                                newSite.workStatus = computedStatus;
                                changed = true;
                            }
                        }
                        delete newSite.previousWorkStatus;
                    } else if (isTargetedSite) {
                        // ON ACTIVE TENDER TARGET SITE: Store previous status and update work status
                        if (eTenderNo && newSite.tenderNo !== eTenderNo) {
                            newSite.tenderNo = eTenderNo;
                            changed = true;
                        }

                        if (tenderData.presentStatus) {
                            // Backup original status before moving to tender stage
                            if (!newSite.previousWorkStatus && newSite.workStatus && newSite.workStatus !== "Tendered" && newSite.workStatus !== "Tender Process") {
                                newSite.previousWorkStatus = newSite.workStatus;
                            }

                            const tenderStatus = tenderData.presentStatus;
                            let nextWorkStatus = newSite.workStatus;

                            if (tenderStatus === "Work Order Issued" || tenderStatus === "Supply Order Issued") {
                                if (!["Work Completed", "Bill Prepared", "Payment Completed", "Utilization Certificate Issued"].includes(newSite.workStatus)) {
                                    // Default site's Start Date after 4th day of Work Order Date (skipping Sundays and Public Holidays) if blank
                                    if (!newSite.startDate || String(newSite.startDate).trim() === '') {
                                        const calculatedStart = calculateWorkCommencementDate(tenderData.dateWorkOrder);
                                        if (calculatedStart) {
                                            newSite.startDate = calculatedStart;
                                            changed = true;
                                        }
                                    }

                                    if (newSite.startDate && String(newSite.startDate).trim() !== '') {
                                        nextWorkStatus = "Work in Progress";
                                    } else {
                                        nextWorkStatus = "Work Order Issued";
                                    }
                                }
                            } else if (tenderStatus === "Selection Notice Issued") {
                                if (!["Work Completed", "Bill Prepared", "Payment Completed", "Utilization Certificate Issued"].includes(newSite.workStatus)) {
                                    nextWorkStatus = "Selection Notice Issued";
                                }
                            } else if ((tenderStatus as string) === "Tender Cancelled" || (tenderStatus as string) === "Cancelled" || (tenderStatus as string) === "Retender") {
                                if (!["Work Completed", "Bill Prepared", "Payment Completed", "Utilization Certificate Issued"].includes(newSite.workStatus)) {
                                    nextWorkStatus = "Under Process";
                                }
                            } else {
                                if (!["Work Completed", "Bill Prepared", "Payment Completed", "Utilization Certificate Issued"].includes(newSite.workStatus)) {
                                    nextWorkStatus = "Tendered";
                                }
                            }

                            if (nextWorkStatus !== newSite.workStatus) {
                                newSite.workStatus = nextWorkStatus;
                                changed = true;
                            }
                        }
                    }

                    if (changed) siteModified = true;
                    return newSite;
                });

                const hasAnyActiveTenderInSites = updatedSites.some((s: any) => Boolean(s.tenderNo && s.tenderNo.trim().length > 0));
                let newFileStatus = entryData.fileStatus;
                let fileStatusChanged = false;
                const updatePayload: any = {};

                if (isTenderCancelled || !hasAnyActiveTenderInSites) {
                    // When tender cancelled or all sites in file unlinked from any active tender: revert file status
                    if (entryData.previousFileStatus) {
                        newFileStatus = entryData.previousFileStatus;
                        fileStatusChanged = true;
                    } else if (newFileStatus === "Tender Process" || newFileStatus === "Work Initiated") {
                        newFileStatus = "Technical Sanction";
                        fileStatusChanged = true;
                    }
                    updatePayload.previousFileStatus = null;
                } else {
                    if (!entryData.previousFileStatus && entryData.fileStatus && entryData.fileStatus !== "Tender Process" && entryData.fileStatus !== "Work Initiated") {
                        // Store previous file status
                        updatePayload.previousFileStatus = entryData.fileStatus;
                    }

                    if (tenderData.presentStatus === "Work Order Issued" || tenderData.presentStatus === "Supply Order Issued") {
                        if (!["Fully Completed", "Partially Completed", "Payments", "Bill Preparation", "File Closed"].includes(newFileStatus)) {
                            newFileStatus = "Work Initiated";
                            fileStatusChanged = true;
                        }
                    } else if (tenderData.presentStatus) {
                        if (["Pending", "File Under Process", "Technical Sanction", "Rig Accessibility Inspection"].includes(newFileStatus) || !newFileStatus) {
                            newFileStatus = "Tender Process";
                            fileStatusChanged = true;
                        }
                    }
                }

                if (siteModified || fileStatusChanged) {
                    updatePayload.siteDetails = updatedSites;
                    updatePayload.fileStatus = newFileStatus;
                    updatePayload.lastSavedType = 'auto';
                    updatePayload.updatedAt = serverTimestamp();

                    await updateDoc(docSnap.ref, updatePayload);
                    updatedFileCount++;
                }
            }
        }

        // 2. Sync ARS entries
        const arsEntriesRef = collection(db, `offices/${officePath}/arsEntries`);
        const arsSnap = await getDocs(arsEntriesRef);

        for (const docSnap of arsSnap.docs) {
            const arsData = docSnap.data();
            const arsFileNo = arsData.fileNo;
            const isArsMatch = targetFileNos.some(targetNo => matchFileNo(arsFileNo, targetNo)) ||
                (eTenderNo && arsData.arsTenderNo && arsData.arsTenderNo.trim().toUpperCase() === eTenderNo.toUpperCase());

            if (isArsMatch) {
                let arsChanged = false;
                const updatePayload: any = {};

                if (isTenderCancelled) {
                    if (arsData.arsTenderNo) {
                        updatePayload.arsTenderNo = null;
                        arsChanged = true;
                    }
                    if (arsData.arsStatus !== "Under Process") {
                        updatePayload.arsStatus = "Under Process";
                        updatePayload.previousArsStatus = null;
                        arsChanged = true;
                    }
                } else {
                    if (eTenderNo && arsData.arsTenderNo !== eTenderNo) {
                        updatePayload.arsTenderNo = eTenderNo;
                        arsChanged = true;
                    }

                    if (tenderData.presentStatus) {
                        if (!arsData.previousArsStatus && arsData.arsStatus && arsData.arsStatus !== "Tendered") {
                            updatePayload.previousArsStatus = arsData.arsStatus;
                        }

                        const tenderStatus = tenderData.presentStatus;
                        let targetArsStatus = arsData.arsStatus;
                        if (tenderStatus === "Work Order Issued" || tenderStatus === "Supply Order Issued") {
                            targetArsStatus = "Work Order Issued";
                        } else if (tenderStatus === "Selection Notice Issued") {
                            targetArsStatus = "Selection Notice Issued";
                        } else if ((tenderStatus as string) === "Tender Cancelled" || (tenderStatus as string) === "Cancelled" || (tenderStatus as string) === "Retender") {
                            targetArsStatus = "Under Process";
                        } else {
                            if (["Proposal Submitted", "AS & TS Issued"].includes(arsData.arsStatus) || !arsData.arsStatus) {
                                targetArsStatus = "Tendered";
                            }
                        }

                        if (targetArsStatus !== arsData.arsStatus) {
                            updatePayload.arsStatus = targetArsStatus;
                            arsChanged = true;
                        }
                    }
                }

                if (arsChanged) {
                    updatePayload.updatedAt = serverTimestamp();
                    await updateDoc(docSnap.ref, updatePayload);
                }
            }
        }

        if (updatedFileCount > 0) {
            toast({
                title: isTenderCancelled ? "Tender Cancelled - Reverted Status" : "Site Details Updated",
                description: isTenderCancelled 
                    ? `Reverted ${updatedFileCount} site/file status(es) back to their pre-tender stage.`
                    : `Updated ${updatedFileCount} linked site detail(s) with tender number and status.`
            });
        }
    } catch (err) {
        console.error("Error auto-updating site details for tender:", err);
    }
}

export function useE_tenders() {
    const { user } = useAuth();
    const { allE_tenders, isLoading: dataStoreLoading, selectedOffice } = useDataStore();
    
    const addTender = useCallback(async (tenderData: Omit<E_tender, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
        if (!user) throw new Error("User must be logged in to add a tender.");
        if (!user.officeLocation) throw new Error("User has no office location.");
        const collectionPath = `offices/${user.officeLocation.toLowerCase()}/eTenders`;
        const payload = { ...tenderData, officeLocation: user.officeLocation, createdAt: serverTimestamp(), updatedAt: serverTimestamp() };
        if ('id' in payload) {
            delete (payload as any).id;
        }
        const sanitizedPayload = sanitizeDataForFirestore(payload);
        const docRef = await addDoc(collection(db, collectionPath), sanitizedPayload);
        
        // Auto-sync site details in matching file entries
        await syncTenderWithSiteDetails(user.officeLocation, tenderData);

        return docRef.id;
    }, [user]);

    const updateTender = useCallback(async (id: string, tenderData: Partial<E_tender>) => {
        if (!user) throw new Error("User must be logged in to update a tender.");
        if (!user.officeLocation) throw new Error("User has no office location.");
        const collectionPath = `offices/${user.officeLocation.toLowerCase()}/eTenders`;
        const docRef = doc(db, collectionPath, id);
        const payload = { ...tenderData, updatedAt: serverTimestamp() };
        if ('id' in payload) delete (payload as any).id;
        const sanitizedPayload = sanitizeDataForFirestore(payload);
        await updateDoc(docRef, sanitizedPayload);

        // Fetch the full merged tender before syncing site details to ensure complete context
        let fullTender: Partial<E_tender> = tenderData;
        try {
            const updatedDocSnap = await getDoc(docRef);
            if (updatedDocSnap.exists()) {
                fullTender = { id, ...updatedDocSnap.data() } as Partial<E_tender>;
            }
        } catch (err) {
            console.error("Could not fetch full tender for sync, using partial:", err);
        }

        // Auto-sync site details in matching file entries
        await syncTenderWithSiteDetails(user.officeLocation, fullTender);
    }, [user]);

    const deleteTender = useCallback(async (id: string) => {
        if (!user || !['admin', 'engineer', 'scientist'].includes(user.role)) {
            toast({ title: "Permission Denied", description: "You don't have permission to delete tenders.", variant: "destructive" });
            return;
        }
        if (!user.officeLocation) throw new Error("User has no office location.");
        const collectionPath = `offices/${user.officeLocation.toLowerCase()}/eTenders`;
        const docRef = doc(db, collectionPath, id);

        // Fetch tender details before deleting so we can clean up linked sites
        let tenderData = allE_tenders.find(t => t.id === id);
        if (!tenderData) {
            try {
                const snap = await getDoc(docRef);
                if (snap.exists()) {
                    tenderData = processDoc(snap) as E_tender;
                }
            } catch (err) {
                console.error("Could not fetch tender prior to deletion:", err);
            }
        }

        if (tenderData) {
            try {
                await syncTenderWithSiteDetails(user.officeLocation, {
                    ...tenderData,
                    presentStatus: "Tender Cancelled"
                });
            } catch (syncErr) {
                console.error("Error unlinking tender from sites:", syncErr);
            }
        }

        await deleteDoc(docRef);
    }, [user, allE_tenders]);
    
    const getTender = useCallback(async (id: string): Promise<E_tender | null> => {
        // If data store is still loading, wait a bit or try to find in list
        // This prevents eager redirects if data is just about to arrive.
        if (dataStoreLoading) {
            // Wait up to 2 seconds for data store to initialize
            for (let i = 0; i < 20; i++) {
                const found = allE_tenders.find(t => t.id === id);
                if (found) return found;
                if (!dataStoreLoading) break;
                await new Promise(resolve => setTimeout(resolve, 100));
            }
        }

        // First, try to find the tender in the already-loaded list. This is the most reliable.
        const tenderFromList = allE_tenders.find(t => t.id === id);
        if (tenderFromList) {
            return tenderFromList;
        }
    
        // If not in the list (e.g., race condition or direct access), fallback to a direct fetch.
        if (!user) return null;
    
        const isSuperAdmin = user.role === 'superAdmin';
        const officeToQuery = isSuperAdmin ? selectedOffice : user.officeLocation;
    
        // If there's no specific office to query, we can't fetch a single doc.
        if (!officeToQuery) {
            return null;
        }
    
        try {
            const collectionPath = `offices/${officeToQuery.toLowerCase()}/eTenders`;
            const docRef = doc(db, collectionPath, id);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                return processDoc(docSnap);
            }
            return null;
        } catch (error) {
            console.error("Error fetching tender by ID:", error);
            return null;
        }
    }, [user, selectedOffice, allE_tenders, dataStoreLoading]);

    const resyncTender = useCallback(async (tenderData: Partial<E_tender>) => {
        if (!user || !user.officeLocation) return;
        await syncTenderWithSiteDetails(user.officeLocation, tenderData);
    }, [user]);

    return { 
        tenders: allE_tenders, 
        isLoading: dataStoreLoading, 
        addTender, 
        updateTender, 
        deleteTender, 
        getTender, 
        resyncTender,
    };
}
