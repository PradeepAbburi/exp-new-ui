import { useUserArticles } from "@/hooks/use-articles";
import { Sidebar } from "@/components/Sidebar";
import { ArticleCard } from "@/components/ArticleCard";
import { Loader2, FileText, Eye, Heart } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { Redirect } from "wouter";

export default function MyArticles() {
  const { user } = useAuth();
  const { data: articles, isLoading } = useUserArticles(user?.id || "");

  if (!user) return <Redirect to="/login" />;

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <main className="md:pl-20 lg:pl-64 min-h-screen pb-20 md:pb-0 transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="mb-10">
            <h1 className="text-4xl font-display font-bold text-foreground mb-4">
              My Pages
            </h1>
          </div>

          {!isLoading && articles && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
              <div className="bg-card p-6 rounded-2xl border border-border shadow-sm flex flex-col">
                <span className="text-muted-foreground text-sm font-medium mb-2 flex items-center gap-2">
                  <FileText className="w-4 h-4" /> Total Pages
                </span>
                <span className="text-3xl font-bold font-display">{articles.length}</span>
              </div>
              <div className="bg-card p-6 rounded-2xl border border-border shadow-sm flex flex-col">
                <span className="text-muted-foreground text-sm font-medium mb-2 flex items-center gap-2">
                  <Eye className="w-4 h-4" /> Total Views
                </span>
                <span className="text-3xl font-bold font-display">
                  {articles.reduce((acc: number, curr: any) => acc + (curr.views || 0), 0)}
                </span>
              </div>
              <div className="bg-card p-6 rounded-2xl border border-border shadow-sm flex flex-col">
                <span className="text-muted-foreground text-sm font-medium mb-2 flex items-center gap-2">
                  <Heart className="w-4 h-4" /> Total Likes
                </span>
                <span className="text-3xl font-bold font-display">
                  {articles.reduce((acc: number, curr: any) => acc + (curr.likeCount || 0), 0)}
                </span>
              </div>
            </div>
          )}

          {isLoading ? (
            <div className="flex justify-center py-20">
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {articles?.map((article: any) => (
                <ArticleCard key={article.id} article={article} />
              ))}
              {articles?.length === 0 && (
                <div className="col-span-full py-20 text-center">
                  <p className="text-muted-foreground">You haven't written any Pages yet.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
