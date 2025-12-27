import { Sidebar } from "@/components/Sidebar";
import { Loader2, ArrowLeft, TrendingUp, Users, FileText, Heart, MessageCircle, Bookmark, Eye, Settings } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useArticles } from "@/hooks/use-articles";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { collection, query, where, getCountFromServer } from "firebase/firestore";
import { db } from "@/lib/firebase";

export default function Analytics() {
    const { user, isLoading: authLoading } = useAuth();
    const { data: articles, isLoading: articlesLoading } = useArticles("mine");

    // Fetch follower and following counts
    const { data: socialStats, isLoading: socialStatsLoading } = useQuery({
        queryKey: ['social-stats', user?.id],
        queryFn: async () => {
            if (!user?.id) return { followers: 0, following: 0 };

            const followersQuery = query(collection(db, 'follows'), where('followingId', '==', user.id));
            const followingQuery = query(collection(db, 'follows'), where('followerId', '==', user.id));

            const [followersCount, followingCount] = await Promise.all([
                getCountFromServer(followersQuery),
                getCountFromServer(followingQuery)
            ]);

            return {
                followers: followersCount.data().count,
                following: followingCount.data().count
            };
        },
        enabled: !!user?.id
    });

    if (authLoading) return <div className="min-h-screen bg-background flex items-center justify-center"><Loader2 className="w-8 h-8 text-primary animate-spin" /></div>;
    if (!user) return null;

    const totalPosts = articles?.filter((a: any) => !a.isArchived).length || 0;
    const totalLikes = articles?.reduce((sum: number, article: any) => sum + (article.likeCount || 0), 0) || 0;
    const totalViews = articles?.reduce((sum: number, article: any) => sum + (article.viewCount || 0), 0) || 0;

    const isLoading = articlesLoading || socialStatsLoading;

    return (
        <div className="min-h-screen bg-background">
            <Sidebar />
            <main className="md:pl-20 lg:pl-64 min-h-screen pb-20 md:pb-0">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
                    <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center gap-4">
                            <button onClick={() => history.back()} className="p-2 hover:bg-muted rounded-full transition-colors">
                                <ArrowLeft className="w-6 h-6" />
                            </button>
                            <h1 className="text-4xl font-display font-bold text-foreground">Analytics</h1>
                        </div>
                        <Link href="/account">
                            <button className="flex items-center gap-2 px-4 py-2 bg-muted hover:bg-muted/80 rounded-xl transition-colors font-medium">
                                <Settings className="w-4 h-4" />
                                Account
                            </button>
                        </Link>
                    </div>

                    {isLoading ? (
                        <div className="flex justify-center py-20">
                            <Loader2 className="w-8 h-8 text-primary animate-spin" />
                        </div>
                    ) : (
                        <div className="space-y-8">
                            {/* Overview Stats */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                <div className="bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 rounded-3xl p-6 hover:shadow-xl hover:shadow-primary/10 transition-all">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="w-12 h-12 bg-primary/20 rounded-2xl flex items-center justify-center">
                                            <Users className="w-6 h-6 text-primary" />
                                        </div>
                                        <TrendingUp className="w-5 h-5 text-primary/60" />
                                    </div>
                                    <h3 className="text-3xl font-bold text-foreground mb-1">{socialStats?.followers || 0}</h3>
                                    <p className="text-sm text-muted-foreground font-medium">Followers</p>
                                </div>

                                <div className="bg-gradient-to-br from-secondary/10 to-secondary/5 border border-secondary/20 rounded-3xl p-6 hover:shadow-xl hover:shadow-secondary/10 transition-all">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="w-12 h-12 bg-secondary/20 rounded-2xl flex items-center justify-center">
                                            <Users className="w-6 h-6 text-secondary" />
                                        </div>
                                        <TrendingUp className="w-5 h-5 text-secondary/60" />
                                    </div>
                                    <h3 className="text-3xl font-bold text-foreground mb-1">{socialStats?.following || 0}</h3>
                                    <p className="text-sm text-muted-foreground font-medium">Following</p>
                                </div>

                                <div className="bg-gradient-to-br from-blue-500/10 to-blue-500/5 border border-blue-500/20 rounded-3xl p-6 hover:shadow-xl hover:shadow-blue-500/10 transition-all">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="w-12 h-12 bg-blue-500/20 rounded-2xl flex items-center justify-center">
                                            <FileText className="w-6 h-6 text-blue-500" />
                                        </div>
                                        <TrendingUp className="w-5 h-5 text-blue-500/60" />
                                    </div>
                                    <h3 className="text-3xl font-bold text-foreground mb-1">{totalPosts}</h3>
                                    <p className="text-sm text-muted-foreground font-medium">Total Posts</p>
                                </div>

                                <div className="bg-gradient-to-br from-green-500/10 to-green-500/5 border border-green-500/20 rounded-3xl p-6 hover:shadow-xl hover:shadow-green-500/10 transition-all">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="w-12 h-12 bg-green-500/20 rounded-2xl flex items-center justify-center">
                                            <Heart className="w-6 h-6 text-green-500" />
                                        </div>
                                        <TrendingUp className="w-5 h-5 text-green-500/60" />
                                    </div>
                                    <h3 className="text-3xl font-bold text-foreground mb-1">{totalLikes}</h3>
                                    <p className="text-sm text-muted-foreground font-medium">Total Likes</p>
                                </div>
                            </div>

                            {/* Posts Analytics */}
                            <div className="bg-card border border-border rounded-3xl p-8 shadow-xl">
                                <h2 className="text-2xl font-bold mb-6">Post Performance</h2>

                                {articles && articles.length > 0 ? (
                                    <div className="space-y-4">
                                        {articles.filter((a: any) => !a.isArchived).map((article: any) => (
                                            <Link key={article.id} href={`/article/${article.id}`}>
                                                <div className="p-5 bg-muted/30 hover:bg-muted/50 border border-border/50 hover:border-primary/30 rounded-2xl transition-all cursor-pointer group">
                                                    <h3 className="font-bold text-lg mb-3 group-hover:text-primary transition-colors line-clamp-1">{article.title}</h3>
                                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                                                                <Eye className="w-4 h-4 text-primary" />
                                                            </div>
                                                            <div>
                                                                <p className="text-xs text-muted-foreground">Views</p>
                                                                <p className="font-bold">{article.viewCount || 0}</p>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-8 h-8 bg-red-500/10 rounded-lg flex items-center justify-center">
                                                                <Heart className="w-4 h-4 text-red-500" />
                                                            </div>
                                                            <div>
                                                                <p className="text-xs text-muted-foreground">Likes</p>
                                                                <p className="font-bold">{article.likeCount || 0}</p>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-8 h-8 bg-green-500/10 rounded-lg flex items-center justify-center">
                                                                <MessageCircle className="w-4 h-4 text-green-500" />
                                                            </div>
                                                            <div>
                                                                <p className="text-xs text-muted-foreground">Comments</p>
                                                                <p className="font-bold">{article.commentCount || 0}</p>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                                                                <Bookmark className="w-4 h-4 text-primary" />
                                                            </div>
                                                            <div>
                                                                <p className="text-xs text-muted-foreground">Saves</p>
                                                                <p className="font-bold">{article.bookmarkCount || 0}</p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </Link>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-12 text-muted-foreground">
                                        <FileText className="w-16 h-16 mx-auto mb-4 opacity-20" />
                                        <p>No posts yet. Start writing to see analytics!</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
