import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { type InsertArticle } from "@shared/schema";
import { auth } from "@/lib/firebase";

// ============================================
// ARTICLES HOOKS (SERVER API)
// ============================================

export function useArticles(view?: 'public' | 'feed' | 'mine' | 'bookmarks') {
  return useQuery({
    queryKey: ['articles', view],
    queryFn: async () => {
      const userId = auth.currentUser?.uid;
      const headers: Record<string, string> = {};
      if (userId) headers['x-user-id'] = userId;

      const url = view ? `${api.articles.list.path}?view=${view}` : api.articles.list.path;
      const res = await fetch(url, { headers });
      if (!res.ok) {
        if (res.status === 401 && view === 'public') return []; // Should not happen for public
        throw new Error('Failed to fetch articles');
      }
      return res.json();
    }
  });
}

export function useUserArticles(userId: string) {
  return useQuery({
    queryKey: ['articles', 'user', userId],
    queryFn: async () => {
      if (!userId) return [];
      const currentUserId = auth.currentUser?.uid;

      // If viewing own profile, use 'mine' view to see everything including drafts
      if (currentUserId === userId) {
        const res = await fetch(`${api.articles.list.path}?view=mine`, {
          headers: { 'x-user-id': currentUserId }
        });
        if (!res.ok) return [];
        return res.json();
      }

      // Otherwise fetch public list and filter
      const headers: Record<string, string> = {};
      if (currentUserId) headers['x-user-id'] = currentUserId;

      const res = await fetch(api.articles.list.path, { headers });
      if (!res.ok) return [];
      const all: any[] = await res.json();
      return all.filter(a => a.authorId === userId);
    },
    enabled: !!userId
  });
}

export function useArticle(id: string) {
  return useQuery({
    queryKey: ['articles', id],
    queryFn: async () => {
      if (!id) return null;
      const currentUserId = auth.currentUser?.uid;
      const headers: Record<string, string> = {};
      if (currentUserId) headers['x-user-id'] = currentUserId;

      const res = await fetch(buildUrl(api.articles.get.path, { id }), { headers });
      if (!res.ok) return null;
      return res.json();
    },
    enabled: !!id,
  });
}

export function useCreateArticle() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: any) => {
      const user = auth.currentUser;
      if (!user) throw new Error("Not authenticated");

      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        "x-user-id": user.uid
      };

      // Add profile hydration headers
      if (user.displayName) headers['x-user-name'] = user.displayName;
      if (user.email) headers['x-user-email'] = user.email;
      if (user.photoURL) headers['x-user-avatar'] = user.photoURL;

      const res = await fetch(api.articles.create.path, {
        method: "POST",
        headers,
        body: JSON.stringify(data)
      });
      if (!res.ok) throw new Error("Failed to create article");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.articles.list.path] });
      queryClient.invalidateQueries({ queryKey: ['articles'] });
      queryClient.invalidateQueries({ queryKey: ['articles', 'user'] });
    },
  });
}

export function useUpdateArticle() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: any) => {
      const userId = auth.currentUser?.uid;
      if (!userId) throw new Error("Not authenticated");

      const res = await fetch(buildUrl(api.articles.update.path, { id }), {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": userId
        },
        body: JSON.stringify(updates)
      });
      if (!res.ok) throw new Error("Failed to update article");
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [api.articles.list.path] });
      queryClient.invalidateQueries({ queryKey: ['articles'] });
      queryClient.invalidateQueries({ queryKey: ['articles', String(data.id || data.articleId)] });
    },
  });
}

export function useDeleteArticle() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const userId = auth.currentUser?.uid;
      if (!userId) throw new Error("Not authenticated");
      const res = await fetch(buildUrl(api.articles.delete.path, { id }), {
        method: "DELETE",
        headers: { "x-user-id": userId }
      });
      if (!res.ok) throw new Error("Failed to delete");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.articles.list.path] });
      queryClient.invalidateQueries({ queryKey: ['articles'] });
      queryClient.invalidateQueries({ queryKey: ['articles', 'user'] });
    },
  });
}

export function useLikeArticle() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const userId = auth.currentUser?.uid;
      if (!userId) throw new Error("Not authenticated");

      const res = await fetch(buildUrl(api.articles.like.path, { id }), {
        method: "POST",
        headers: { "x-user-id": userId }
      });
      if (!res.ok) throw new Error("Failed to like");
      return res.json();
    },
    onMutate: async (id) => {
      // Optimistic Update
      await queryClient.cancelQueries({ queryKey: ['articles'] });

      // Update individual article cache
      const previousArticle = queryClient.getQueryData(['articles', id]);
      queryClient.setQueryData(['articles', id], (old: any) => {
        if (!old) return old;
        const newLiked = !old.isLiked;
        return {
          ...old,
          isLiked: newLiked,
          likeCount: newLiked ? (old.likeCount || 0) + 1 : (old.likeCount || 0) - 1
        };
      });

      // Update all lists containing this article
      queryClient.setQueriesData({ queryKey: ['articles'] }, (old: any) => {
        if (!Array.isArray(old)) return old;
        return old.map((article: any) => {
          if (article.id === Number(id) || article.id === id) {
            const newLiked = !article.isLiked;
            return {
              ...article,
              isLiked: newLiked,
              likeCount: newLiked ? (article.likeCount || 0) + 1 : (article.likeCount || 0) - 1
            };
          }
          return article;
        });
      });

      return { previousArticle };
    },
    onError: (err, id, context: any) => {
      if (context?.previousArticle) {
        queryClient.setQueryData(['articles', id], context.previousArticle);
      }
      queryClient.invalidateQueries({ queryKey: ['articles'] });
    },
    onSettled: (_, __, id) => {
      queryClient.invalidateQueries({ queryKey: ['articles', id] });
      queryClient.invalidateQueries({ queryKey: ['articles'] });
    }
  });
}

export function useBookmarkArticle() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const userId = auth.currentUser?.uid;
      if (!userId) throw new Error("Not authenticated");

      const res = await fetch(buildUrl(api.articles.bookmark.path, { id }), {
        method: "POST",
        headers: { "x-user-id": userId }
      });
      if (!res.ok) throw new Error("Failed to bookmark");
      return res.json();
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ['articles'] });

      // Update individual article cache
      const previousArticle = queryClient.getQueryData(['articles', id]);
      queryClient.setQueryData(['articles', id], (old: any) => {
        if (!old) return old;
        return { ...old, isBookmarked: !old.isBookmarked };
      });

      // Update all lists
      queryClient.setQueriesData({ queryKey: ['articles'] }, (old: any) => {
        if (!Array.isArray(old)) return old;
        return old.map((article: any) => {
          if (article.id === Number(id) || article.id === id) {
            // For bookmarks list, we technically should remove it if unbookmarked,
            // but keeping it with isBookmarked=false and letting invalidation handle removal is safer for index stability during animation.
            return { ...article, isBookmarked: !article.isBookmarked };
          }
          return article;
        });
      });

      return { previousArticle };
    },
    onError: (err, id, context: any) => {
      if (context?.previousArticle) {
        queryClient.setQueryData(['articles', id], context.previousArticle);
      }
      queryClient.invalidateQueries({ queryKey: ['articles'] });
    },
    onSettled: (_, __, id) => {
      queryClient.invalidateQueries({ queryKey: ['articles', id] });
      queryClient.invalidateQueries({ queryKey: ['articles'] });
    }
  });
}

export function useArchiveArticle() {
  const mutation = useUpdateArticle();
  return useMutation({
    mutationFn: async ({ id, archive }: { id: string | number, archive: boolean }) => {
      return mutation.mutateAsync({ id, isArchived: archive });
    }
  });
}

export function useViewArticle() {
  return useMutation({
    mutationFn: async (id: string | number) => {
      await fetch(buildUrl(api.articles.view.path, { id }), { method: 'POST' });
    }
  });
}

export function useArticleHistory(id: string) {
  return useQuery({
    queryKey: ['article-history', id],
    queryFn: async () => [],
    enabled: !!id
  });
}
