import admin from 'firebase-admin';

// Initialize with project ID. This might work if environment has default credentials
try {
    admin.initializeApp({
        projectId: "expertene-59771"
    });
    console.log("Firebase Admin initialized.");
} catch (e) {
    console.warn("Firebase Admin already initialized or failed. Continuing...");
}

async function createOrResetAdmin() {
    const email = "admin@expertene.com";
    const password = "Vortex@expertene";
    const displayName = "System Admin";

    try {
        let user;
        try {
            user = await admin.auth().getUserByEmail(email);
            console.log("User already exists. Updating password...");
            await admin.auth().updateUser(user.uid, {
                password: password,
                displayName: displayName
            });
            console.log("Password updated successfully.");
        } catch (e: any) {
            if (e.code === 'auth/user-not-found') {
                console.log("User not found. Creating new user...");
                user = await admin.auth().createUser({
                    email: email,
                    password: password,
                    displayName: displayName,
                    emailVerified: true
                });
                console.log("User created successfully. UID:", user.uid);
            } else {
                throw e;
            }
        }

        // Also ensure profile exists in Firestore
        // Note: admin.firestore() uses the admin SDK firestore
        const db = admin.firestore();
        await db.collection('users').doc(user.uid).set({
            id: user.uid,
            email: email,
            username: "admin",
            password: "",
            isProfileComplete: true,
            displayName: displayName,
            avatarUrl: null,
            bannerUrl: null,
            firstName: "System",
            lastName: "Admin",
            profileImageUrl: null,
            bio: "Platform Administrator",
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        }, { merge: true });
        console.log("Firestore profile synchronized.");

        process.exit(0);
    } catch (error) {
        console.error("Error in createOrResetAdmin:", error);
        process.exit(1);
    }
}

createOrResetAdmin();
