import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword, updatePassword } from 'firebase/auth';

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

async function resetAdminPassword() {
    const email = "admin@expertene.com";
    const newPassword = "Vortex@expertene";

    // Note: To update password with Client SDK, we usually need to be logged in.
    // Since we don't know the current password, we should try using firebase-admin if available.
    console.log("Password reset via Client SDK requires current password. Attempting to use Firebase Admin...");
}

resetAdminPassword();
