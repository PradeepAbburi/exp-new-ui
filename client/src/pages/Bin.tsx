import { Sidebar } from "@/components/Sidebar";
import { Loader2, ArrowLeft, RotateCcw, Trash2, Clock, Info } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useArticles, useDeleteArticle, useArchiveArticle } from "@/hooks/use-articles";
import { Link } from "wouter";
import { formatDistanceToNow } from "date-fns";
import { useToast } from "@/hooks/use-toast";

export default function Bin() {
    const { user, isLoading: authLoading } = useAuth();
    const { data: articles, isLoading: articlesLoading } = useArticles("mine");
    const { mutate: deleteArticle, isPending: isDeleting } = useDeleteArticle();
    const { mutate: restoreArticle } = useArchiveArticle();
    const { toast } = useToast();

    if (authLoading) return <div className="min-h-screen bg-background flex items-center justify-center"><Loader2 className="w-8 h-8 text-primary animate-spin" /></div>;
    if (!user) return null;

    // Filter archived articles
    const archivedArticles = articles?.filter((a: any) => a.isArchived) || [];

    // Calculate if article is older than 30 days
    const isExpired = (date: Date) => {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        return date < thirtyDaysAgo;
    };

    const handleRestore = (articleId: string) => {
        restoreArticle({ id: articleId, archive: false }, {
            onSuccess: () => {
                toast({ title: "Article Restored", description: "Your article has been restored successfully." });
            }
        });
    };

    const handlePermanentDelete = (articleId: string, title: string) => {
        if (confirm(`Permanently delete "${title}"? This action cannot be undone.`)) {
            deleteArticle(articleId as any, {
                onSuccess: () => {
                    toast({ title: "Article Deleted", description: "Your article has been permanently deleted." });
                }
            });
        }
    };

    return (
        <div className="min-h-screen bg-background">
            <Sidebar />
            <main className="md:pl-20 lg:pl-64 min-h-screen pb-20 md:pb-0">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
                    <div className="flex items-center gap-4 mb-8">
                        <button onClick={() => history.back()} className="p-2 hover:bg-muted rounded-full transition-colors">
                            <ArrowLeft className="w-6 h-6" />
                        </button>
                        <div className="flex-1">
                            <h1 className="text-4xl font-display font-bold text-foreground">Bin</h1>
                            <p className="text-muted-foreground mt-2">Deleted articles are kept for 30 days before permanent deletion</p>
                        </div>
                    </div>

                    {/* Info Banner */}
                    <div className="bg-primary/10 border border-primary/20 rounded-2xl p-4 mb-8 flex items-start gap-3">
                        <Info className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-foreground">Articles in the bin will be automatically deleted after 30 days.</p>
                            <p className="text-xs text-muted-foreground mt-1">Restore them before they're permanently removed.</p>
                        </div>
                    </div>

                    {articlesLoading ? (
                        <div className="flex justify-center py-20">
                            <Loader2 className="w-8 h-8 text-primary animate-spin" />
                        </div>
                    ) : archivedArticles.length === 0 ? (
                        <div className="text-center py-20 bg-card/50 border border-dashed border-border rounded-3xl">
                            <Trash2 className="w-16 h-16 mx-auto mb-4 opacity-20" />
                            <p className="text-muted-foreground text-lg">Your bin is empty</p>
                            <p className="text-sm text-muted-foreground mt-1">Deleted articles will appear here</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {archivedArticles.map((article: any) => {
                                const deletedDate = article.updatedAt instanceof Date ? article.updatedAt : new Date(article.updatedAt);
                                const expired = isExpired(deletedDate);
                                const daysLeft = Math.max(0, 30 - Math.floor((Date.now() - deletedDate.getTime()) / (1000 * 60 * 60 * 24)));

                                return (
                                    <div key={article.id} className="bg-card border border-border rounded-2xl p-6 hover:border-primary/30 transition-all">
                                        <div className="flex items-start justify-between gap-4">
                                            <div className="flex-1 min-w-0">
                                                <h3 className="text-xl font-bold text-foreground mb-2 line-clamp-1">{article.title}</h3>
                                                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                                    <div className="flex items-center gap-1.5">
                                                        <Clock className="w-4 h-4" />
                                                        <span>Deleted {formatDistanceToNow(deletedDate, { addSuffix: true })}</span>
                                                    </div>
                                                    {expired ? (
                                                        <span className="text-destructive font-medium">Expired - Will be deleted soon</span>
                                                    ) : (
                                                        <span className="text-orange-500 font-medium">{daysLeft} days remaining</span>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-2 shrink-0">
                                                <button
                                                    onClick={() => handleRestore(article.id)}
                                                    className="flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary hover:bg-primary/20 rounded-xl transition-colors font-medium"
                                                >
                                                    <RotateCcw className="w-4 h-4" />
                                                    <span className="hidden sm:inline">Restore</span>
                                                </button>
                                                <button
                                                    onClick={() => handlePermanentDelete(article.id, article.title)}
                                                    disabled={isDeleting}
                                                    className="flex items-center gap-2 px-4 py-2 bg-destructive/10 text-destructive hover:bg-destructive/20 rounded-xl transition-colors font-medium"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                    <span className="hidden sm:inline">Delete Forever</span>
                                                </button>
                                            </div>
                                        </div>

                                        {/* Progress bar showing time remaining */}
                                        <div className="mt-4 w-full h-1.5 bg-muted rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-gradient-to-r from-orange-500 to-destructive transition-all"
                                                style={{ width: `${((30 - daysLeft) / 30) * 100}%` }}
                                            />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
