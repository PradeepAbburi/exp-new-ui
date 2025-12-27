import { useArticles } from "@/hooks/use-articles";
import { Sidebar } from "@/components/Sidebar";
import { ArticleCard } from "@/components/ArticleCard";
import { LandingPage } from "@/components/LandingPage";
import { Loader2, Search } from "lucide-react";
import { useState, useMemo } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Redirect } from "wouter";

import { collection, query, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useQuery } from "@tanstack/react-query";
import { User as UserIcon, FileText, ArrowRight } from "lucide-react";
import { Link } from "wouter";

export default function Home() {
  const { user, isLoading: authLoading } = useAuth();
  const { data: articles, isLoading } = useArticles("public");
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch users for the profiles search
  const { data: users, isLoading: usersLoading } = useQuery({
    queryKey: ['users-search'],
    queryFn: async () => {
      const snap = await getDocs(query(collection(db, "users")));
      return snap.docs.map(d => ({
        id: d.id,
        ...d.data(),
        avatarUrl: d.data().avatarUrl || d.data().avatar_url || null,
        displayName: d.data().displayName || d.data().display_name || d.data().username,
      }));
    }
  });

  const filteredArticles = useMemo(() => articles?.filter((article: any) => {
    const titleMatch = article.title.toLowerCase().includes(searchQuery.toLowerCase());
    const contentText = Array.isArray(article.content)
      ? article.content.map((b: any) => b.content).join(' ').toLowerCase()
      : '';
    const contentMatch = contentText.includes(searchQuery.toLowerCase());
    return titleMatch || contentMatch;
  }), [articles, searchQuery]);

  const filteredUsers = useMemo(() => users?.filter((u: any) => {
    const nameMatch = u.displayName?.toLowerCase().includes(searchQuery.toLowerCase());
    const userMatch = u.username?.toLowerCase().includes(searchQuery.toLowerCase());
    return nameMatch || userMatch;
  }), [users, searchQuery]);

  if (authLoading) return <div className="min-h-screen bg-background flex items-center justify-center"><Loader2 className="w-8 h-8 text-primary animate-spin" /></div>;
  // Removed: if (!user) return <LandingPage />; - Now showing articles to everyone
  if (user && !user.isProfileComplete) return <Redirect to="/complete-profile" />;

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <main className="md:pl-20 lg:pl-64 min-h-screen pb-20 md:pb-0 transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="flex-1">
              <h1 className="text-4xl font-display font-bold text-foreground mb-4">
                Discover
              </h1>
              <p className="text-muted-foreground text-lg">
                Explore the latest pages, ideas, and expertise.
              </p>
            </div>

            <div className="relative w-full md:w-96 group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
              <input
                type="text"
                placeholder="Search pages or profiles..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-card border border-border rounded-2xl pl-12 pr-4 py-3.5 outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all shadow-sm text-lg"
              />
            </div>
          </div>

          {(isLoading || usersLoading) ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} className="aspect-[4/3] bg-card/50 rounded-3xl animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="space-y-10">
              {/* Profile Results - Only show when searching */}
              {searchQuery && filteredUsers && filteredUsers.length > 0 && (
                <section className="animate-in fade-in slide-in-from-bottom-3 duration-500">
                  <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-4 px-1">Profiles</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    {filteredUsers.map((u: any) => (
                      <Link key={u.id} href={`/profile/${u.username}`} className="group p-3 bg-card border border-border rounded-2xl hover:border-primary/40 hover:shadow-lg transition-all flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full overflow-hidden bg-muted border border-border group-hover:border-primary/40 transition-colors">
                          {u.avatarUrl ? (
                            <img src={u.avatarUrl} alt={u.username} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-primary font-bold text-sm">
                              {u.displayName?.charAt(0)}
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold truncate text-sm text-foreground group-hover:text-primary transition-colors">{u.displayName}</p>
                          <p className="text-[10px] text-muted-foreground truncate">@{u.username}</p>
                        </div>
                        <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                      </Link>
                    ))}
                  </div>
                </section>
              )}

              {/* Page Results */}
              <section className="animate-in fade-in slide-in-from-bottom-4 duration-700">
                {searchQuery && <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-4 px-1">Pages</h2>}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredArticles?.map((article: any) => (
                    <ArticleCard key={article.id} article={article} />
                  ))}
                </div>
                {filteredArticles?.length === 0 && (
                  <div className="col-span-full py-20 text-center bg-card/50 border border-dashed border-border rounded-3xl">
                    <FileText className="w-16 h-16 mx-auto mb-4 opacity-20" />
                    <p className="text-muted-foreground text-lg">
                      {searchQuery ? `No stories found matching "${searchQuery}"` : "No stories yet. Be the first to write!"}
                    </p>
                  </div>
                )}
              </section>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
