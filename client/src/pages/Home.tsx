import { useArticles } from "@/hooks/use-articles";
import { Sidebar } from "@/components/Sidebar";
import { ArticleCard } from "@/components/ArticleCard";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { Redirect } from "wouter";

export default function Home() {
  const { user, isLoading: authLoading } = useAuth();
  const { data: articles, isLoading } = useArticles("public");

  if (authLoading) return <div className="min-h-screen bg-background flex items-center justify-center"><Loader2 className="w-8 h-8 text-primary animate-spin" /></div>;
  if (!user) return <Redirect to="/login" />;
  if (!user.isProfileComplete) return <Redirect to="/complete-profile" />;

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <main className="lg:pl-64 min-h-screen">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="mb-10">
            <h1 className="text-4xl font-display font-bold text-foreground mb-4">
              Discover
            </h1>
            <p className="text-muted-foreground text-lg">
              Explore the latest stories, ideas, and expertise.
            </p>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} className="aspect-[4/3] bg-card/50 rounded-2xl animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {articles?.map((article) => (
                <ArticleCard key={article.id} article={article} />
              ))}
              {articles?.length === 0 && (
                <div className="col-span-full py-20 text-center">
                  <p className="text-muted-foreground">No articles found yet.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
