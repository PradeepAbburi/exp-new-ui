import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, doc, updateDoc } from 'firebase/firestore';

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

async function migrateArticles() {
    console.log('🔄 Starting Firestore articles migration...\n');

    try {
        const snapshot = await getDocs(collection(db, 'articles'));
        console.log(`📚 Found ${snapshot.size} articles to check\n`);

        let updated = 0;
        let skipped = 0;
        let nextId = 1;

        // First, find the highest existing ID
        snapshot.docs.forEach(doc => {
            const data = doc.data();
            if (data.id && typeof data.id === 'number') {
                nextId = Math.max(nextId, data.id + 1);
            }
        });

        console.log(`Starting ID counter at: ${nextId}\n`);

        for (const docSnap of snapshot.docs) {
            const data = docSnap.data();
            const updates: any = {};
            let needsUpdate = false;

            // Add missing numeric ID field
            if (data.id === undefined) {
                updates.id = nextId++;
                needsUpdate = true;
                console.log(`  Adding ID ${updates.id} to article: "${data.title}"`);
            }

            // Add missing isArchived field
            if (data.isArchived === undefined) {
                updates.isArchived = false;
                needsUpdate = true;
                console.log(`  Adding isArchived=false to article: "${data.title}"`);
            }

            // Add missing views field
            if (data.views === undefined) {
                updates.views = 0;
                needsUpdate = true;
            }

            // Ensure dates exist
            if (!data.createdAt) {
                updates.createdAt = new Date();
                needsUpdate = true;
            }

            if (!data.updatedAt) {
                updates.updatedAt = new Date();
                needsUpdate = true;
            }

            if (needsUpdate) {
                await updateDoc(doc(db, 'articles', docSnap.id), updates);
                updated++;
                console.log(`  ✅ Updated article: "${data.title}"\n`);
            } else {
                skipped++;
            }
        }

        console.log(`\n✨ Migration complete!`);
        console.log(`   Updated: ${updated} articles`);
        console.log(`   Skipped: ${skipped} articles (already had all fields)`);

    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error('❌ Migration failed:', errorMessage);
    }

    process.exit(0);
}

migrateArticles();
