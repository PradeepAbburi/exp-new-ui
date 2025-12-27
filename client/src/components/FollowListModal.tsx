import { X, UserPlus, UserMinus } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { collection, query, where, getDocs, getDoc, doc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useFollowUser, useRemoveFollower } from "@/hooks/use-users";
import { Link } from "wouter";
import { Loader2 } from "lucide-react";
import clsx from "clsx";

interface FollowListModalProps {
    isOpen: boolean;
    onClose: () => void;
    userId: string;
    type: "followers" | "following";
    currentUserId?: string;
}

export function FollowListModal({ isOpen, onClose, userId, type, currentUserId }: FollowListModalProps) {
    const { mutate: followUser, isPending } = useFollowUser();
    const { mutate: removeFollower, isPending: isRemoving } = useRemoveFollower();

    const { data: users, isLoading, refetch } = useQuery({
        queryKey: ['follow-list', userId, type, currentUserId],
        queryFn: async () => {
            const followsQuery = type === "followers"
                ? query(collection(db, 'follows'), where('followingId', '==', userId))
                : query(collection(db, 'follows'), where('followerId', '==', userId));

            const snapshot = await getDocs(followsQuery);

            const userIds = snapshot.docs.map(d =>
                type === "followers" ? d.data().followerId : d.data().followingId
            );

            if (userIds.length === 0) return [];

            const usersData = await Promise.all(
                userIds.map(async (uid) => {
                    const userDoc = await getDoc(doc(db, 'users', uid));
                    if (!userDoc.exists()) return null;

                    // Check if current user is following this user
                    let isFollowing = false;
                    if (currentUserId && currentUserId !== uid) {
                        const followDoc = await getDoc(doc(db, 'follows', `${currentUserId}_${uid}`));
                        isFollowing = followDoc.exists();
                    }

                    return {
                        id: uid,
                        ...userDoc.data(),
                        isFollowing
                    };
                })
            );

            return usersData.filter(u => u !== null);
        },
        enabled: isOpen
    });

    const handleFollowToggle = (targetUserId: string, isCurrentlyFollowing: boolean) => {
        followUser({ targetId: targetUserId, isFollowing: isCurrentlyFollowing }, {
            onSuccess: () => {
                refetch(); // Refresh the list after follow/unfollow
            }
        });
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

            <div className="relative bg-card border border-border rounded-3xl shadow-2xl w-full max-w-md mx-4 max-h-[80vh] flex flex-col">
                <div className="flex items-center justify-between p-6 border-b border-border">
                    <h2 className="text-2xl font-bold">
                        {type === "followers" ? "Followers" : "Following"}
                    </h2>
                    <button onClick={onClose} className="p-2 hover:bg-muted rounded-full transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6">
                    {isLoading ? (
                        <div className="flex justify-center py-12">
                            <Loader2 className="w-8 h-8 text-primary animate-spin" />
                        </div>
                    ) : users && users.length > 0 ? (
                        <div className="space-y-3">
                            {users.map((user: any) => (
                                <div key={user.id} className="flex items-center gap-3 p-3 bg-muted/30 hover:bg-muted/50 rounded-xl transition-colors">
                                    <Link href={`/profile/${user.username}`} className="flex items-center gap-3 flex-1 min-w-0">
                                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary/30 to-secondary/30 overflow-hidden shrink-0">
                                            {user.avatarUrl ? (
                                                <img src={user.avatarUrl} alt={user.username} className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-primary font-bold">
                                                    {(user.displayName || user.username || "U").charAt(0).toUpperCase()}
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-bold text-foreground truncate">{user.displayName || user.username}</p>
                                            <p className="text-sm text-muted-foreground truncate">@{user.username}</p>
                                        </div>
                                    </Link>

                                    {currentUserId === userId && type === "followers" ? (
                                        <button
                                            onClick={() => removeFollower(user.id, { onSuccess: () => refetch() })}
                                            disabled={isRemoving}
                                            className="px-3 py-1.5 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500/20 text-sm font-medium shrink-0"
                                        >
                                            Remove
                                        </button>
                                    ) : (
                                        currentUserId && currentUserId !== user.id && (
                                            <button
                                                onClick={() => handleFollowToggle(user.id, user.isFollowing)}
                                                disabled={isPending}
                                                className={clsx(
                                                    "px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 text-sm font-medium shrink-0",
                                                    user.isFollowing
                                                        ? "bg-muted text-foreground hover:bg-muted/80"
                                                        : "bg-primary text-white hover:bg-primary/90"
                                                )}
                                            >
                                                {user.isFollowing ? (
                                                    <>
                                                        <UserMinus className="w-3.5 h-3.5" />
                                                        Following
                                                    </>
                                                ) : (
                                                    <>
                                                        <UserPlus className="w-3.5 h-3.5" />
                                                        Follow
                                                    </>
                                                )}
                                            </button>
                                        )
                                    )}
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-12 text-muted-foreground">
                            <p>No {type === "followers" ? "followers" : "following"} yet</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
