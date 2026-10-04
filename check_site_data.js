const { initializeApp } = require('firebase/app');
const { getAuth, signInWithEmailAndPassword } = require('firebase/auth');
const { getFirestore, collection, getDocs, doc, getDoc, query, where } = require('firebase/firestore');

const firebaseConfig = {
  apiKey: "AIzaSyAySb23iBvJgo6jjXqSavfGTKrOHiuVZRc",
  authDomain: "gwd-kerala-bc80e.firebaseapp.com",
  projectId: "gwd-kerala-bc80e",
  storageBucket: "gwd-kerala-bc80e.firebasestorage.app",
  messagingSenderId: "845907959817",
  appId: "1:845907959817:web:695feb71edb1067cf198d8"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const targetFiles = [
  '170/2026', '957/2026', '812/2026', '587/2026', '557/2026',
  '600/2026', '709/2026', '389/2026', '377/2025', '1572/2025', '1695/2025',
  'A59', '407/2025', 'A36', '2592/2024', '263/2024', 'A21', '1320/2026', '2623/2023', '662/2026', '918/2026', '931/2025', 'A35', 'A30'
];

async function inspectSites() {
  await signInWithEmailAndPassword(auth, 'gwdklm@gmail.com', '123456');
  console.log("Logged in to Firebase successfully as gwdklm@gmail.com");

  const office = 'kollam';
  
  console.log(`\n=== CHECKING offices/${office}/fileEntries ===`);
  const filesSnap = await getDocs(collection(db, `offices/${office}/fileEntries`));
  console.log(`Total file entries in ${office}: ${filesSnap.docs.length}`);

  let foundCount = 0;
  filesSnap.forEach(d => {
    const data = d.data();
    if (targetFiles.includes(data.fileNo)) {
      foundCount++;
      console.log(`\n-----------------------------------------`);
      console.log(`File No: ${data.fileNo} (Doc ID: ${d.id})`);
      console.log(`Applicant: ${data.applicantName}`);
      console.log(`File Status: ${data.fileStatus}`);
      console.log(`Remarks: ${data.remarks || 'None'}`);
      console.log(`Sites Count: ${data.siteDetails ? data.siteDetails.length : 0}`);
      if (data.siteDetails) {
        data.siteDetails.forEach((site, sIdx) => {
          console.log(`  Site #${sIdx + 1}: ${site.nameOfSite}`);
          console.log(`    Work Status: ${site.workStatus}`);
          console.log(`    Completion Date: ${site.dateOfCompletion || 'N/A'}`);
          console.log(`    Drilling Depth: ${site.drillingDetails?.totalDepth || site.totalDepth || 'N/A'}`);
          console.log(`    Casing 10kg: ${site.casing10kgPipe || 'N/A'}, Casing 8kg: ${site.casing8kgPipe || 'N/A'}, Casing 6kg: ${site.casing6kgPipe || 'N/A'}`);
          console.log(`    Supervisor: ${site.supervisorName || site.supervisorUid || 'N/A'}`);
          console.log(`    Drilling Remarks: ${site.drillingRemarks || site.workRemarks || 'N/A'}`);
        });
      }
    }
  });
  console.log(`\nMatched ${foundCount} files out of ${targetFiles.length} targets.`);

  console.log(`\n=== CHECKING offices/${office}/pendingUpdates ===`);
  const pendingSnap = await getDocs(collection(db, `offices/${office}/pendingUpdates`));
  console.log(`Total pendingUpdates docs: ${pendingSnap.docs.length}`);
  pendingSnap.forEach(d => {
    const data = d.data();
    console.log(`ID: ${d.id} | FileNo: ${data.fileNo} | Status: ${data.status} | SubmittedBy: ${data.submittedByName} | At: ${data.submittedAt?.toDate?.() || data.submittedAt}`);
  });
}

inspectSites().then(() => process.exit(0)).catch(e => { console.error("Error:", e); process.exit(1); });
