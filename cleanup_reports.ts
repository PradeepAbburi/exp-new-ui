import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, deleteDoc, doc } from 'firebase/firestore';

const firebaseConfig = {
    apiKey: "AIzaSyC4jFJ3jCXd7Q5nydQaBSQWaVKvFhTkmJs",
    authDomain: "expertene-59771.firebaseapp.com",
    projectId: "expertene-59771",
    storageBucket: "expertene-59771.firebasestorage.app",
    messagingSenderId: "284086686035",
    appId: "1:284086686035:web:f7f79f6730d430db7091a6",
    measurementId: "G-0GQ6P1ML29",
};

const app = initializeApp(firebaseConfig, 'cleanup-app');
const db = getFirestore(app);

async function cleanupReports() {
    try {
        console.log("Fetching all reports...");
        const snapshot = await getDocs(collection(db, 'reports'));

        if (snapshot.empty) {
            console.log("No reports found to delete.");
            process.exit(0);
        }

        console.log(`Found ${snapshot.size} reports. Deleting...`);

        const deletePromises = snapshot.docs.map(document => {
            console.log(`Deleting report ${document.id} (Article: ${document.data().articleId}, Reason: ${document.data().reason})`);
            return deleteDoc(doc(db, 'reports', document.id));
        });

        await Promise.all(deletePromises);
        console.log("All reports deleted successfully.");
        process.exit(0);
    } catch (error) {
        console.error("Error cleaning up reports:", error);
        process.exit(1);
    }
}

cleanupReports();
