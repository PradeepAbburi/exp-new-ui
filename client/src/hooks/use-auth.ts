import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { User } from "@shared/models/auth";
import { auth, db } from "@/lib/firebase";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  type User as FirebaseUser
} from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";

export function useAuth() {
  const queryClient = useQueryClient();
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);

  // Listen for Firebase auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setFirebaseUser(user);
      setIsLoadingAuth(false);
      // Invalidate the user query to re-fetch profile from Firestore when auth state changes
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
    });
    return () => unsubscribe();
  }, [queryClient]);

  // Fetch user profile from Firestore
  const { data: user, isLoading: isLoadingProfile } = useQuery<User | null>({
    queryKey: ["/api/auth/user", firebaseUser?.uid],
    queryFn: async () => {
      if (!firebaseUser) return null;

      const userDocRef = doc(db, "users", firebaseUser.uid);
      const userDoc = await getDoc(userDocRef);

      if (userDoc.exists()) {
        const userData = userDoc.data();
        if (!userData) return null;
        return {
          ...userData,
          id: firebaseUser.uid,
          avatarUrl: userData.avatarUrl || userData.avatar_url || userData.profileImageUrl || null,
          bannerUrl: userData.bannerUrl || userData.banner_url || null,
          displayName: userData.displayName || userData.display_name || null,
          createdAt: userData.createdAt?.toDate ? userData.createdAt.toDate() : new Date(userData.createdAt),
          updatedAt: userData.updatedAt?.toDate ? userData.updatedAt.toDate() : new Date(userData.updatedAt),
        } as User;
      } else {
        // "Heal" the account: User exists in Auth but missing in Firestore (e.g. failed signup)
        console.warn("User profile missing in Firestore, creating default profile...");

        const newUser = {
          id: firebaseUser.uid,
          email: firebaseUser.email,
          username: firebaseUser.email?.split('@')[0] || "user",
          firstName: null,
          lastName: null,
          displayName: null,
          profileImageUrl: null,
          avatarUrl: null,
          bannerUrl: null,
          bio: null,
          isProfileComplete: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        } as any;

        // Try to save this missing profile
        try {
          await setDoc(userDocRef, newUser);
          return newUser;
        } catch (err) {
          console.error("Failed to auto-create missing profile (likely permission error):", err);
          // Return it anyway so the UI doesn't crash, but next refresh might fail again 
          // if permissions aren't fixed.
          return newUser;
        }
      }
    },
    enabled: !isLoadingAuth, // Only fetch if auth initialization is done
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      await signOut(auth);
    },
    onSuccess: () => {
      queryClient.setQueryData(["/api/auth/user"], null);
    },
  });

  const loginMutation = useMutation({
    mutationFn: async ({ email, password }: { email: string; password: string }) => {
      try {
        const cred = await signInWithEmailAndPassword(auth, email, password);
        return {};
      } catch (error: any) {
        console.error("Login Error Details:", error);
        console.error("Error Code:", error.code);
        console.error("Error Message:", error.message);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
    },
  });

  const signupMutation = useMutation({
    mutationFn: async ({
      email,
      username,
      password,
    }: {
      email: string;
      username: string;
      password: string;
    }) => {
      try {
        const cred = await createUserWithEmailAndPassword(auth, email, password);

        // Create user document in Firestore
        const newUser = {
          id: cred.user.uid,
          email: email,
          username: username,
          password: "",
          firstName: null,
          lastName: null,
          displayName: null,
          profileImageUrl: null,
          avatarUrl: null,
          bannerUrl: null,
          bio: null,
          isProfileComplete: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        try {
          await setDoc(doc(db, "users", cred.user.uid), newUser);
        } catch (dbError: any) {
          console.error("Firestore Profile Creation Failed (likely permission rules):", dbError);
          // Swallow this error so the user isn't blocked from "logging in"
          // The auth account is already created successfully at this point.
        }

        // Send email verification
        try {
          const { sendEmailVerification } = await import("firebase/auth");
          await sendEmailVerification(cred.user);
          console.log("Verification email sent successfully");
        } catch (emailError) {
          console.error("Failed to send verification email:", emailError);
          // Don't throw - signup was successful even if email fails
        }

        return newUser as User;
      } catch (error: any) {
        console.error("Signup Error Details:", error);
        console.error("Error Code:", error.code);
        console.error("Error Message:", error.message);
        throw error;
      }
    },
    onSuccess: (userData) => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
    },
  });

  const googleLoginMutation = useMutation({
    mutationFn: async () => {
      try {
        const { GoogleAuthProvider, signInWithPopup } = await import("firebase/auth");
        const provider = new GoogleAuthProvider();
        const cred = await signInWithPopup(auth, provider);

        // Check if user exists in Firestore, if not create
        const userDocRef = doc(db, "users", cred.user.uid);
        const userDoc = await getDoc(userDocRef);

        if (!userDoc.exists()) {
          const newUser = {
            id: cred.user.uid,
            email: cred.user.email,
            username: cred.user.displayName?.replace(/\s+/g, '').toLowerCase() || cred.user.email?.split('@')[0],
            password: "",
            firstName: cred.user.displayName?.split(' ')[0] || null,
            lastName: cred.user.displayName?.split(' ').slice(1).join(' ') || null,
            displayName: cred.user.displayName || null,
            profileImageUrl: cred.user.photoURL,
            avatarUrl: cred.user.photoURL,
            bannerUrl: null,
            bio: null,
            isProfileComplete: true, // Google users usually have minimal needed info
            createdAt: new Date(),
            updatedAt: new Date(),
          };

          try {
            await setDoc(userDocRef, newUser);
          } catch (dbErr) {
            console.error("Firestore Profile Creation Ignored (Permission Error):", dbErr);
          }

          return newUser as User;
        }

        const existingUser = userDoc.data() as User;

        // Ensure Google users have isProfileComplete set to true
        if (!existingUser.isProfileComplete) {
          try {
            await setDoc(userDocRef, { isProfileComplete: true }, { merge: true });
            return { ...existingUser, isProfileComplete: true } as User;
          } catch (updateErr) {
            console.error("Failed to update isProfileComplete:", updateErr);
          }
        }

        return existingUser;
      } catch (error: any) {
        console.error("Google Login Error:", error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
    },
  });

  return {
    user: user ?? null,
    isLoading: isLoadingAuth || isLoadingProfile,
    isAuthenticated: !!user,
    logout: logoutMutation.mutate,
    isLoggingOut: logoutMutation.isPending,
    localLogin: loginMutation.mutateAsync,
    localSignup: signupMutation.mutateAsync,
    googleLogin: googleLoginMutation.mutateAsync,
  };
}
