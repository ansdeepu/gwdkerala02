const admin = require('firebase-admin');

// Initialize with the projectId from firebaseConfig
admin.initializeApp({
  projectId: 'gwd-kerala-bc80e'
});

const db = admin.firestore();

const targetFiles = [
  '170/2026', '957/2026', '812/2026', '587/2026', '557/2026',
  '600/2026', '709/2026', '389/2026', '377/2025', '1572/2025', '1695/2025'
];

async function checkData() {
  console.log("=== CHECKING FIRESTORE DATA FOR USER RECOVERY ===");
  
  // We need to find offices. Let's list offices.
  const officesSnap = await db.collection('offices').listDocuments();
  const officeIds = officesSnap.map(doc => doc.id);
  console.log("Found offices:", officeIds);
  
  for (const officeId of officeIds) {
    console.log(`\n--- Office: ${officeId} ---`);
    
    // Check pending updates
    const pendingCollRef = db.collection(`offices/${officeId}/pendingUpdates`);
    for (const fileNo of targetFiles) {
      const q = await pendingCollRef.where('fileNo', '==', fileNo).get();
      if (!q.empty) {
        console.log(`Found pending update for file ${fileNo}:`);
        q.forEach(doc => {
          const data = doc.data();
          console.log(`  - Update ID: ${doc.id}`);
          console.log(`    Status: ${data.status}`);
          console.log(`    Submitted by: ${data.submittedByName} (${data.submittedByUid})`);
          if (data.submittedAt) {
             console.log(`    Submitted at: ${data.submittedAt.toDate().toISOString()}`);
          }
          console.log(`    Updated Site Details:`, JSON.stringify(data.updatedSiteDetails, null, 2));
        });
      }
    }
    
    // Check active file entries
    const fileEntriesCollRef = db.collection(`offices/${officeId}/fileEntries`);
    for (const fileNo of targetFiles) {
      const q = await fileEntriesCollRef.where('fileNo', '==', fileNo).get();
      if (!q.empty) {
        console.log(`Found active file entry for ${fileNo}:`);
        q.forEach(doc => {
          const data = doc.data();
          console.log(`  - Doc ID: ${doc.id}`);
          console.log(`    File Status: ${data.fileStatus}`);
          if (data.siteDetails) {
            data.siteDetails.forEach(site => {
              console.log(`    Site Name: ${site.nameOfSite}`);
              console.log(`      Work Status: ${site.workStatus}`);
              console.log(`      Completion Date: ${site.dateOfCompletion || 'N/A'}`);
              console.log(`      Drilling Details:`, site.drillingDetails || site.drillingRemarks || 'N/A');
            });
          }
        });
      }
    }
  }
}

checkData()
  .then(() => console.log("\n=== FINISHED CHECKING ==="))
  .catch(err => {
    console.error("Error checking Firestore data:", err);
  });
