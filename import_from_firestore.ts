import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs } from "firebase/firestore";
import { storage } from "./server/storage";

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

async function importArticlesFromFirestore() {
    console.log("🔄 Starting Firestore import...");

    try {
        // Fetch articles from Firestore
        const articlesSnapshot = await getDocs(collection(db, "articles"));
        console.log(`📚 Found ${articlesSnapshot.size} articles in Firestore`);

        if (articlesSnapshot.empty) {
            console.log("⚠️  No articles found in Firestore");
            return;
        }

        let imported = 0;
        let skipped = 0;

        for (const doc of articlesSnapshot.docs) {
            const data = doc.data();

            // Check if author exists in local storage
            const author = await storage.getUser(data.authorId);
            if (!author) {
                console.log(`⚠️  Skipping article "${data.title}" - author ${data.authorId} not found in local storage`);
                skipped++;
                continue;
            }

            // Create article in local storage
            try {
                await storage.createArticle({
                    title: data.title || "Untitled",
                    content: data.content || [],
                    authorId: data.authorId,
                    isPublic: data.isPublic ?? true,
                    coverImage: data.coverImage || null,
                    accessKey: data.accessKey || null,
                    isArchived: data.isArchived ?? false,
                });

                console.log(`✅ Imported: "${data.title}"`);
                imported++;
            } catch (error) {
                console.error(`❌ Failed to import "${data.title}":`, error);
                skipped++;
            }
        }

        console.log(`\n✨ Import complete!`);
        console.log(`   Imported: ${imported}`);
        console.log(`   Skipped: ${skipped}`);

    } catch (error) {
        console.error("❌ Error importing from Firestore:", error);
    }

    process.exit(0);
}

// Run the import
importArticlesFromFirestore();
