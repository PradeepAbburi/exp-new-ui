import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs } from "firebase/firestore";

// Mock DATABASE_URL if missing to pass db.ts check
if (!process.env.DATABASE_URL) {
    process.env.DATABASE_URL = "postgres://dummy:dummy@localhost:5432/dummy";
}

// Dynamic import to ensure env var is set before db.ts runs
const { FilePersistedStorage } = await import("./server/storage");
const storage = new FilePersistedStorage();

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

async function importFromFirestore() {
    console.log("🔄 Starting Firestore import...");

    try {
        // 1. Import Users
        console.log("👤 Importing users...");
        const usersSnapshot = await getDocs(collection(db, "users"));
        console.log(`Expected users: ${usersSnapshot.size}`);

        for (const doc of usersSnapshot.docs) {
            const data = doc.data();
            const userId = doc.id;

            // Check if user exists
            const existing = await storage.getUser(userId);
            if (!existing) {
                // We need to bypass the standard createLocalUser which generates a new ID
                // We'll use upsertUser if available or manually inject into the map if we were inside the class
                // Since we are external, we have to use the public API.
                // FilePersistedStorage.upsertUser is available.

                await storage.upsertUser({
                    id: userId,
                    username: data.username || `user_${userId.substring(0, 6)}`,
                    email: data.email || `${userId}@placeholder.com`,
                    displayName: data.displayName || data.username,
                    avatarUrl: data.avatarUrl || data.photoURL,
                    isProfileComplete: true,
                    // Add other fields as necessary from Firestore schema
                });
                console.log(`   + Imported user: ${data.username} (${userId})`);
            } else {
                console.log(`   . User exists: ${existing.username}`);
            }
        }


        // 2. Import Articles
        console.log("\n📚 Importing articles...");
        const articlesSnapshot = await getDocs(collection(db, "articles"));
        console.log(`Found ${articlesSnapshot.size} articles in Firestore`);

        if (articlesSnapshot.empty) {
            console.log("⚠️  No articles found in Firestore");
            return;
        }

        let imported = 0;
        let skipped = 0;

        for (const doc of articlesSnapshot.docs) {
            const data = doc.data();

            // Check if article already exists (by comparing title for now, or we could just add it)
            // Ideally we'd keep the ID but createArticle generates one. 
            // For now, let's just create it.

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
importFromFirestore();
