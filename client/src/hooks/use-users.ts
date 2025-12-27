import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { db, auth } from "@/lib/firebase";
import { collection, query, where, getDocs, addDoc, deleteDoc, doc, getCountFromServer, setDoc, getDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import { useAuth } from "./use-auth";

// ============================================
// USERS HOOKS
// ============================================

export function useCurrentUser() {
  const { user, isLoading } = useAuth();
  return { user, isLoading };
}

export function useUpdateUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (updates: any) => {
      const user = auth.currentUser;
      if (!user) throw new Error("Not authenticated");

      // Clean up undefined/null values
      const cleaned = Object.fromEntries(
        Object.entries(updates).filter(([_, v]) => v != null)
      );

      const userRef = doc(db, "users", user.uid);
      await updateDoc(userRef, {
        ...cleaned,
        updatedAt: serverTimestamp()
      });

      return { id: user.uid, ...cleaned };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
    },
  });
}

export function useUserProfile(username: string) {
  const { user: currentUser } = useAuth();
  return useQuery({
    queryKey: ['user', username, currentUser?.id],
    queryFn: async () => {
      if (!username) return null;

      const q = query(
        collection(db, 'users'),
        where('username', '==', username.toLowerCase())
      );

      const snapshot = await getDocs(q);

      if (snapshot.empty) return null;

      const userDoc = snapshot.docs[0];
      const userData = userDoc.data();
      const userId = userDoc.id;

      // Fetch stats
      const postsQuery = query(collection(db, 'articles'), where('authorId', '==', userId), where('isArchived', '==', false));
      const followersQuery = query(collection(db, 'follows'), where('followingId', '==', userId));
      const followingQuery = query(collection(db, 'follows'), where('followerId', '==', userId));

      const [postsCount, followersCount, followingCount] = await Promise.all([
        getCountFromServer(postsQuery),
        getCountFromServer(followersQuery),
        getCountFromServer(followingQuery)
      ]);

      // Check if current user is following
      let isFollowing = false;
      if (currentUser) {
        const followDoc = await getDoc(doc(db, 'follows', `${currentUser.id}_${userId}`));
        isFollowing = followDoc.exists();
      }

      return {
        id: userId,
        ...userData,
        // Normalize fields to ensure camelCase access in components
        avatarUrl: userData.avatarUrl || userData.avatar_url || userData.profileImageUrl || null,
        bannerUrl: userData.bannerUrl || userData.banner_url || null,
        displayName: userData.displayName || userData.display_name || null,
        createdAt: userData.createdAt?.toDate ? userData.createdAt.toDate() : new Date(),
        updatedAt: userData.updatedAt?.toDate ? userData.updatedAt.toDate() : new Date(),
        stats: {
          posts: postsCount.data().count,
          followers: followersCount.data().count,
          following: followingCount.data().count,
        },
        isFollowing
      } as any;
    },
    enabled: !!username,
  });
}

export function useFollowUser() {
  const queryClient = useQueryClient();
  const { user: currentUser } = useAuth();

  return useMutation({
    mutationFn: async ({ targetId, isFollowing }: { targetId: string, isFollowing: boolean }) => {
      if (!currentUser) throw new Error("Not authenticated");

      const followId = `${currentUser.id}_${targetId}`;
      const followRef = doc(db, "follows", followId);

      if (isFollowing) {
        await deleteDoc(followRef);
      } else {
        await setDoc(followRef, {
          followerId: currentUser.id,
          followingId: targetId,
          createdAt: serverTimestamp()
        });
      }

      return { targetId, isFollowing: !isFollowing };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user'] });
    },
  });
}

export function useRemoveFollower() {
  const queryClient = useQueryClient();
  const { user: currentUser } = useAuth();

  return useMutation({
    mutationFn: async (followerId: string) => {
      if (!currentUser) throw new Error("Not authenticated");

      const followId = `${followerId}_${currentUser.id}`;
      const followRef = doc(db, "follows", followId);

      await deleteDoc(followRef);
      return followerId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user'] });
      queryClient.invalidateQueries({ queryKey: ['follow-list'] });
    },
  });
}
