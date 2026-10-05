const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs } = require('firebase/firestore');

const firebaseConfig = {
  apiKey: "AIzaSyAySb23iBvJgo6jjXqSavfGTKrOHiuVZRc",
  authDomain: "gwd-kerala-bc80e.firebaseapp.com",
  projectId: "gwd-kerala-bc80e",
  storageBucket: "gwd-kerala-bc80e.firebasestorage.app",
  messagingSenderId: "845907959817",
  appId: "1:845907959817:web:695feb71edb1067cf198d8"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function checkFile() {
    const offices = ['kollam', 'tvm', 'pathanamthitta', 'alappuzha', 'kottayam', 'idukki', 'ernakulam', 'thrissur', 'palakkad', 'malappuram', 'kozhikode', 'wayanad', 'kannur', 'kasaragod'];
    for (const office of offices) {
        try {
            const snap = await getDocs(collection(db, `offices/${office}/fileEntries`));
            snap.docs.forEach(docSnap => {
                const data = docSnap.data();
                console.log(`Office: ${office}, FileNo: ${data.fileNo}, ID: ${docSnap.id}`);
            });
        } catch (e) {}
    }
}

checkFile().then(() => process.exit(0)).catch(err => { console.error(err); process.exit(1); });
