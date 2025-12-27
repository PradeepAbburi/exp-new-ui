import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import fs from 'fs';

// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyC4jFJ3jCXd7Q5nydQaBSQWaVKvFhTkmJs",
    authDomain: "expertene-59771.firebaseapp.com",
    projectId: "expertene-59771",
    storageBucket: "expertene-59771.firebasestorage.app",
    messagingSenderId: "284086686035",
    appId: "1:284086686035:web:f7f79f6730d430db7091a6",
    measurementId: "G-0GQ6P1ML29",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function checkFirestoreData() {
    let output = '🔍 Checking Firestore data...\n\n';

    const collections = ['users', 'articles', 'likes', 'bookmarks', 'follows', 'comments'];

    for (const collectionName of collections) {
        try {
            const snapshot = await getDocs(collection(db, collectionName));
            output += `📁 ${collectionName}: ${snapshot.size} documents\n`;

            if (snapshot.size > 0) {
                snapshot.docs.forEach((doc, index) => {
                    if (index < 10) { // Show first 10 only
                        output += `   ${index + 1}. ID: ${doc.id}\n`;
                        const data = doc.data();
                        if (collectionName === 'articles') {
                            output += `      Title: ${data.title || 'N/A'}\n`;
                            output += `      Author: ${data.authorId || 'N/A'}\n`;
                            output += `      Public: ${data.isPublic}\n`;
                            output += `      Archived: ${data.isArchived}\n`;
                            output += `      Has ID field: ${data.id !== undefined}\n`;
                        } else if (collectionName === 'users') {
                            output += `      Username: ${data.username || 'N/A'}\n`;
                            output += `      Email: ${data.email || 'N/A'}\n`;
                        }
                    }
                });
            }
            output += '\n';
        } catch (error: any) {
            output += `❌ Error reading ${collectionName}: ${error.message}\n\n`;
        }
    }

    console.log(output);
    fs.writeFileSync('firestore_check.txt', output);
    console.log('\n✅ Output saved to firestore_check.txt');
    process.exit(0);
}

checkFirestoreData();
