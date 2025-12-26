import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { type InsertArticle } from "@shared/schema";

// ============================================
// ARTICLES HOOKS
// ============================================

export function useArticles(view?: 'public' | 'feed' | 'mine' | 'bookmarks') {
  return useQuery({
    queryKey: [api.articles.list.path, view],
    queryFn: async () => {
      const url = new URL(api.articles.list.path, window.location.origin);
      if (view) url.searchParams.set("view", view);
      
      const res = await fetch(url.toString(), { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch articles");
      
      return api.articles.list.responses[200].parse(await res.json());
    },
  });
}

export function useArticle(id: number) {
  return useQuery({
    queryKey: [api.articles.get.path, id],
    queryFn: async () => {
      const url = buildUrl(api.articles.get.path, { id });
      const res = await fetch(url, { credentials: "include" });
      
      if (res.status === 404) return null;
      if (!res.ok) throw new Error("Failed to fetch article");
      
      return api.articles.get.responses[200].parse(await res.json());
    },
    enabled: !!id,
  });
}

export function useCreateArticle() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: InsertArticle) => {
      const validated = api.articles.create.input.parse(data);
      const res = await fetch(api.articles.create.path, {
        method: api.articles.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validated),
        credentials: "include",
      });

      if (!res.ok) {
        if (res.status === 400) {
          const error = api.articles.create.responses[400].parse(await res.json());
          throw new Error(error.message);
        }
        throw new Error("Failed to create article");
      }
      return api.articles.create.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.articles.list.path] });
    },
  });
}

export function useUpdateArticle() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: number } & Partial<InsertArticle>) => {
      const validated = api.articles.update.input.parse(updates);
      const url = buildUrl(api.articles.update.path, { id });
      
      const res = await fetch(url, {
        method: api.articles.update.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validated),
        credentials: "include",
      });

      if (!res.ok) throw new Error("Failed to update article");
      return api.articles.update.responses[200].parse(await res.json());
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [api.articles.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.articles.get.path, data.id] });
    },
  });
}

export function useDeleteArticle() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const url = buildUrl(api.articles.delete.path, { id });
      const res = await fetch(url, {
        method: api.articles.delete.method,
        credentials: "include",
      });

      if (!res.ok) throw new Error("Failed to delete article");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.articles.list.path] });
    },
  });
}

export function useLikeArticle() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const url = buildUrl(api.articles.like.path, { id });
      const res = await fetch(url, {
        method: api.articles.like.method,
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to like article");
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: [api.articles.get.path, id] });
      queryClient.invalidateQueries({ queryKey: [api.articles.list.path] });
    },
  });
}

export function useBookmarkArticle() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const url = buildUrl(api.articles.bookmark.path, { id });
      const res = await fetch(url, {
        method: api.articles.bookmark.method,
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to bookmark article");
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: [api.articles.get.path, id] });
      queryClient.invalidateQueries({ queryKey: [api.articles.list.path] });
    },
  });
}
