import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';

const firebaseConfig = {
    apiKey: "AIzaSyC4jFJ3jCXd7Q5nydQaBSQWaVKvFhTkmJs",
    authDomain: "expertene-59771.firebaseapp.com",
    projectId: "expertene-59771",
    storageBucket: "expertene-59771.firebasestorage.app",
    messagingSenderId: "284086686035",
    appId: "1:284086686035:web:f7f79f6730d430db7091a6",
    measurementId: "G-0GQ6P1ML29",
};

const app = initializeApp(firebaseConfig, 'debug-app');
const db = getFirestore(app);

async function listAllUsers() {
    try {
        console.log("Fetching all users from Firestore...");
        const snapshot = await getDocs(collection(db, 'users'));
        console.log(`Total users found: ${snapshot.size}`);
        snapshot.docs.forEach(doc => {
            const data = doc.data();
            console.log(`- ID: ${doc.id}, Email: ${data.email}, Username: ${data.username}`);
        });
        process.exit(0);
    } catch (error) {
        console.error("Error fetching users:", error);
        process.exit(1);
    }
}

listAllUsers();
