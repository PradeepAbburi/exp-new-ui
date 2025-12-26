import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
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
      // Clean up undefined/null values
      const cleaned = Object.fromEntries(
        Object.entries(updates).filter(([_, v]) => v != null)
      );
      
      const validated = api.users.update.input.parse(cleaned);
      const res = await fetch(api.users.update.path, {
        method: api.users.update.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validated),
        credentials: "include",
      });

      if (!res.ok) {
        if (res.status === 400) {
          const error = api.users.update.responses[400].parse(await res.json());
          throw new Error(error.message);
        }
        throw new Error("Failed to update profile");
      }
      return api.users.update.responses[200].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.users.me.path] });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
    },
  });
}

export function useUserProfile(username: string) {
  return useQuery({
    queryKey: [api.users.get.path, username],
    queryFn: async () => {
      const url = buildUrl(api.users.get.path, { username });
      const res = await fetch(url, { credentials: "include" });
      
      if (res.status === 404) return null;
      if (!res.ok) throw new Error("Failed to fetch user");
      
      return api.users.get.responses[200].parse(await res.json());
    },
    enabled: !!username,
  });
}

export function useFollowUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (userId: number) => {
      const url = buildUrl(api.users.follow.path, { id: userId });
      const res = await fetch(url, {
        method: api.users.follow.method,
        credentials: "include",
      });

      if (!res.ok) throw new Error("Failed to follow user");
      return api.users.follow.responses[200].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.users.get.path] });
    },
  });
}
