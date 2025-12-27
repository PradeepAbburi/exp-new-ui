import { useArticles } from "@/hooks/use-articles";
import { Sidebar } from "@/components/Sidebar";
import { ArticleCard } from "@/components/ArticleCard";
import { Loader2, Bookmark } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { Redirect } from "wouter";

export default function Bookmarks() {
    const { user, isLoading: authLoading } = useAuth();
    const { data: articles, isLoading } = useArticles("bookmarks");

    if (authLoading) return (
        <div className="flex items-center justify-center min-h-screen bg-background">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
    );

    if (!user) return <Redirect to="/login" />;

    return (
        <div className="min-h-screen bg-background">
            <Sidebar />
            <main className="md:pl-20 lg:pl-64 min-h-screen pb-20 md:pb-0 transition-all duration-300">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
                    <div className="mb-10 flex items-center gap-3">
                        <Bookmark className="w-8 h-8 text-primary" />
                        <h1 className="text-4xl font-display font-bold text-foreground">
                            Bookmarks
                        </h1>
                    </div>

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
                                    <p className="text-muted-foreground text-lg">You haven't bookmarked any articles yet.</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
