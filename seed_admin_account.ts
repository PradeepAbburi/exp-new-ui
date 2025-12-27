import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, doc, setDoc } from 'firebase/firestore';

const firebaseConfig = {
    apiKey: "AIzaSyC4jFJ3jCXd7Q5nydQaBSQWaVKvFhTkmJs",
    authDomain: "expertene-59771.firebaseapp.com",
    projectId: "expertene-59771",
    storageBucket: "expertene-59771.firebasestorage.app",
    messagingSenderId: "284086686035",
    appId: "1:284086686035:web:f7f79f6730d430db7091a6",
    measurementId: "G-0GQ6P1ML29",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

async function seedAdmin() {
    const email = "admin@expertene.com";
    const password = "Vortex@expertene";
    const username = "admin";

    try {
        console.log(`Creating admin user: ${email}...`);
        const cred = await createUserWithEmailAndPassword(auth, email, password);
        console.log(`User created in Firebase Auth. UID: ${cred.user.uid}`);

        await setDoc(doc(db, "users", cred.user.uid), {
            id: cred.user.uid,
            email,
            username,
            password: "", // Not stored in Firestore
            isProfileComplete: true,
            displayName: "System Admin",
            avatarUrl: null,
            bannerUrl: null,
            firstName: "System",
            lastName: "Admin",
            profileImageUrl: null,
            bio: "Platform Administrator",
            createdAt: new Date(),
            updatedAt: new Date(),
        });
        console.log("Admin profile created in Firestore.");
        process.exit(0);
    } catch (error: any) {
        if (error.code === 'auth/email-already-in-use') {
            console.log("Admin user already exists in Firebase Auth.");
            process.exit(0);
        }
        console.error("Error creating admin user:", error);
        process.exit(1);
    }
}

seedAdmin();
