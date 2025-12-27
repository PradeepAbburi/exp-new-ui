import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { auth } from "@/lib/firebase";
import { api, buildUrl } from "@shared/routes";

export interface Comment {
    id: number;
    articleId: string;
    userId: string;
    content: string;
    parentId?: number | null;
    createdAt: string;
    author: {
        username: string;
        displayName: string;
        avatarUrl: string | null;
    };
}

export function useComments(articleId: string) {
    return useQuery({
        queryKey: ['comments', articleId],
        queryFn: async () => {
            if (!articleId) return [];
            const res = await fetch(buildUrl(api.comments.list.path, { articleId }));
            if (!res.ok) throw new Error("Failed to fetch comments");
            return res.json() as Promise<Comment[]>;
        },
        enabled: !!articleId
    });
}

export function useAddComment() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ articleId, content, parentId }: { articleId: string, content: string, parentId?: number, userId?: string }) => {
            const userId = auth.currentUser?.uid;
            if (!userId) throw new Error("Must be logged in");

            const res = await fetch(buildUrl(api.comments.create.path, { articleId }), {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "x-user-id": userId
                },
                body: JSON.stringify({ content, parentId })
            });

            if (!res.ok) throw new Error("Failed to post comment");
            return res.json();
        },
        onSuccess: (_, { articleId }) => {
            queryClient.invalidateQueries({ queryKey: ['comments', articleId] });
        }
    });
}

export function useDeleteComment() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (commentId: string) => {
            const userId = auth.currentUser?.uid;
            if (!userId) throw new Error("Must be logged in");

            const res = await fetch(buildUrl(api.comments.delete.path, { id: commentId }), {
                method: "DELETE",
                headers: {
                    "x-user-id": userId
                }
            });
            if (!res.ok) throw new Error("Failed to delete comment");
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['comments'] });
        }
    });
}
