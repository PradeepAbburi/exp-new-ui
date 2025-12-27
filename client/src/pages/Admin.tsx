import { useAuth } from "@/hooks/use-auth";
import { Sidebar } from "@/components/Sidebar";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, Users, FileText, AlertTriangle, ShieldCheck, Trash2, Search, CheckCircle, ExternalLink, MoreVertical, RefreshCw } from "lucide-react";
import { Redirect, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuLabel,
    DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { format } from "date-fns";
import { useState, useMemo } from "react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

export default function Admin() {
    const { user, isLoading: authLoading } = useAuth();
    const queryClient = useQueryClient();
    const { toast } = useToast();
    const [searchQuery, setSearchQuery] = useState("");

    const { data: users, isLoading: usersLoading, refetch: refetchUsers } = useQuery<any[]>({
        queryKey: ['/api/admin/users'],
        enabled: !!user && user.email === "admin@expertene.com",
    });

    const { data: reports, isLoading: reportsLoading, refetch: refetchReports } = useQuery<any[]>({
        queryKey: ['/api/admin/reports'],
        enabled: !!user && user.email === "admin@expertene.com",
    });

    // Mutations
    const deleteUserMutation = useMutation({
        mutationFn: async (userId: string) => {
            await apiRequest("DELETE", `/api/admin/users/${userId}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
            toast({ title: "User Deleted", description: "The user has been successfully removed." });
        },
        onError: (err: any) => {
            toast({ title: "Error", description: err.message, variant: "destructive" });
        }
    });

    const deleteArticleMutation = useMutation({
        mutationFn: async ({ articleId, reportId }: { articleId: string, reportId: string }) => {
            await apiRequest("DELETE", `/api/admin/articles/${articleId}`);
            await apiRequest("DELETE", `/api/admin/reports/${reportId}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['/api/admin/reports'] });
            toast({ title: "Article Removed", description: "The reported article has been deleted." });
        },
        onError: (err: any) => {
            toast({ title: "Error", description: err.message, variant: "destructive" });
        }
    });

    const dismissReportMutation = useMutation({
        mutationFn: async (reportId: string) => {
            await apiRequest("DELETE", `/api/admin/reports/${reportId}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['/api/admin/reports'] });
            toast({ title: "Report Dismissed", description: "The report has been cleared." });
        },
        onError: (err: any) => {
            toast({ title: "Error", description: err.message, variant: "destructive" });
        }
    });

    const updateReportStatusMutation = useMutation({
        mutationFn: async ({ reportId, status }: { reportId: string, status: string }) => {
            await apiRequest("PATCH", `/api/admin/reports/${reportId}/status`, { status });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['/api/admin/reports'] });
            toast({ title: "Status Updated", description: "The report status has been updated." });
        },
        onError: (err: any) => {
            toast({ title: "Error", description: err.message, variant: "destructive" });
        }
    });

    const filteredUsers = useMemo(() => {
        if (!users) return [];
        return users.filter(u =>
            u.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            u.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            u.displayName?.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [users, searchQuery]);

    const stats = useMemo(() => {
        return {
            totalUsers: users?.length || 0,
            activeReports: reports?.filter(r => r.status !== 'resolved').length || 0,
            resolvedReports: reports?.filter(r => r.status === 'resolved').length || 0
        };
    }, [users, reports]);

    if (authLoading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin" /></div>;
    if (!user || user.email !== "admin@expertene.com") return <Redirect to="/" />;

    return (
        <div className="min-h-screen bg-background">
            <Sidebar />
            <main className="md:pl-20 lg:pl-64 min-h-screen pb-20 md:pb-0">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
                    <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                            <h1 className="text-3xl font-display font-bold flex items-center gap-3 text-foreground">
                                <ShieldCheck className="w-8 h-8 text-primary" />
                                Admin Console
                            </h1>
                            <p className="text-muted-foreground mt-2 font-medium tracking-tight">Platform administration, moderation, and oversight.</p>
                        </div>

                        <div className="flex items-center gap-3">
                            <Button variant="outline" size="icon" onClick={() => { refetchUsers(); refetchReports(); }} className="rounded-xl">
                                <RefreshCw className={`w-4 h-4 ${(usersLoading || reportsLoading) ? 'animate-spin' : ''}`} />
                            </Button>
                            <div className="relative w-full md:w-64">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                <input
                                    type="text"
                                    placeholder="Search users..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full bg-card border border-border rounded-xl pl-10 pr-4 py-2 text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all placeholder:text-muted-foreground/50"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                        <Card className="bg-card/50 backdrop-blur-sm border-primary/10 shadow-sm transition-all hover:shadow-md hover:border-primary/20">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-xs font-bold text-muted-foreground uppercase flex items-center gap-2 tracking-widest">
                                    <Users className="w-4 h-4 text-primary" /> Total Users
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-4xl font-black tracking-tighter">{stats.totalUsers}</div>
                                <div className="text-xs text-muted-foreground mt-1">Registered accounts on platform</div>
                            </CardContent>
                        </Card>

                        <Card className="bg-card/50 backdrop-blur-sm border-orange-500/10 shadow-sm transition-all hover:shadow-md hover:border-orange-500/20">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-xs font-bold text-muted-foreground uppercase flex items-center gap-2 tracking-widest">
                                    <AlertTriangle className="w-4 h-4 text-orange-500" /> Pending Reports
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-4xl font-black tracking-tighter text-orange-500">{stats.activeReports}</div>
                                <div className="text-xs text-muted-foreground mt-1">Require immediate attention</div>
                            </CardContent>
                        </Card>

                        <Card className="bg-card/50 backdrop-blur-sm border-green-500/10 shadow-sm transition-all hover:shadow-md hover:border-green-500/20">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-xs font-bold text-muted-foreground uppercase flex items-center gap-2 tracking-widest">
                                    <CheckCircle className="w-4 h-4 text-green-500" /> Resolved Cases
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-4xl font-black tracking-tighter text-green-500">{stats.resolvedReports}</div>
                                <div className="text-xs text-muted-foreground mt-1">In the last system cycle</div>
                            </CardContent>
                        </Card>
                    </div>

                    <Tabs defaultValue="users" className="space-y-6">
                        <TabsList className="bg-muted/30 p-1 rounded-xl w-full md:w-auto">
                            <TabsTrigger value="users" className="rounded-lg px-8 py-2 data-[state=active]:bg-background data-[state=active]:shadow-sm">User Directory</TabsTrigger>
                            <TabsTrigger value="reports" className="rounded-lg px-8 py-2 data-[state=active]:bg-background data-[state=active]:shadow-sm">Reports Queue</TabsTrigger>
                        </TabsList>

                        <TabsContent value="users" className="space-y-4">
                            <div className="bg-card border border-border rounded-3xl overflow-hidden shadow-sm">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left">
                                        <thead>
                                            <tr className="bg-muted/20 border-b border-border">
                                                <th className="px-6 py-5 text-xs font-black uppercase tracking-widest text-muted-foreground">User Identity</th>
                                                <th className="px-6 py-5 text-xs font-black uppercase tracking-widest text-muted-foreground">Engagement</th>
                                                <th className="px-6 py-5 text-xs font-black uppercase tracking-widest text-muted-foreground">Status</th>
                                                <th className="px-6 py-5 text-xs font-black uppercase tracking-widest text-muted-foreground text-right">Operations</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-border">
                                            {usersLoading ? (
                                                <tr><td colSpan={4} className="p-20 text-center"><Loader2 className="w-10 h-10 animate-spin mx-auto text-primary/20" /></td></tr>
                                            ) : filteredUsers.length === 0 ? (
                                                <tr><td colSpan={4} className="p-20 text-center text-muted-foreground font-medium italic">No subjects matching your criteria.</td></tr>
                                            ) : filteredUsers.map((u: any) => (
                                                <tr key={u.id} className="hover:bg-muted/10 transition-colors group">
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-4">
                                                            <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center font-black text-primary text-sm overflow-hidden shrink-0 border border-primary/5">
                                                                {u.avatarUrl ? <img src={u.avatarUrl} className="w-full h-full object-cover" /> : u.username?.[0]?.toUpperCase()}
                                                            </div>
                                                            <div className="max-w-[180px] md:max-w-none">
                                                                <div className="font-bold text-sm text-foreground flex items-center gap-2">
                                                                    {u.displayName || u.username}
                                                                    {u.email === "admin@expertene.com" && <Badge className="text-[8px] h-3 px-1.5 uppercase font-black bg-primary/20 text-primary hover:bg-primary/30 border-none">Main Admin</Badge>}
                                                                </div>
                                                                <div className="text-xs text-muted-foreground/70 font-medium truncate">{u.email}</div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="flex flex-col">
                                                            <span className="text-xs font-bold text-foreground">{u.createdAt ? format(new Date(u.createdAt), "MMM d, yyyy") : "N/A"}</span>
                                                            <span className="text-[10px] text-muted-foreground uppercase font-black tracking-tighter">Registration Date</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        {u.isProfileComplete ? (
                                                            <Badge variant="outline" className="text-[10px] font-bold bg-green-500/5 text-green-500 border-green-500/20 px-3">VERIFIED</Badge>
                                                        ) : (
                                                            <Badge variant="outline" className="text-[10px] font-bold bg-yellow-500/5 text-yellow-500 border-yellow-500/20 px-3">PENDING</Badge>
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-4 text-right">
                                                        <div className="flex items-center justify-end gap-1 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <Link href={`/profile/${u.username}`}>
                                                                <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:text-primary transition-all">
                                                                    <ExternalLink className="w-4 h-4" />
                                                                </Button>
                                                            </Link>
                                                            {u.email !== "admin@expertene.com" && (
                                                                <DropdownMenu>
                                                                    <DropdownMenuTrigger asChild>
                                                                        <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:text-foreground">
                                                                            <MoreVertical className="w-4 h-4" />
                                                                        </Button>
                                                                    </DropdownMenuTrigger>
                                                                    <DropdownMenuContent align="end" className="w-48 rounded-xl">
                                                                        <DropdownMenuLabel className="text-[10px] uppercase font-black tracking-widest text-muted-foreground">Admin Actions</DropdownMenuLabel>
                                                                        <DropdownMenuSeparator />
                                                                        <DropdownMenuItem className="text-destructive focus:bg-destructive/10 focus:text-destructive gap-2 cursor-pointer" onSelect={() => {
                                                                            if (confirm(`Terminate user ${u.username}? This cannot be undone.`)) {
                                                                                deleteUserMutation.mutate(u.id);
                                                                            }
                                                                        }}>
                                                                            <Trash2 className="w-3.5 h-3.5" /> Permanently Delete
                                                                        </DropdownMenuItem>
                                                                    </DropdownMenuContent>
                                                                </DropdownMenu>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </TabsContent>

                        <TabsContent value="reports" className="space-y-4">
                            {reportsLoading ? (
                                <div className="py-20 text-center"><Loader2 className="w-12 h-12 animate-spin mx-auto text-primary/10" /></div>
                            ) : reports?.length === 0 ? (
                                <div className="py-20 text-center bg-card border border-dashed border-border rounded-3xl">
                                    <CheckCircle className="w-16 h-16 mx-auto mb-6 text-green-500/20" />
                                    <h3 className="text-lg font-bold">Clear Skies</h3>
                                    <p className="text-muted-foreground mt-2 max-w-xs mx-auto">No pending reports found in the moderation queue. Platform health is optimal.</p>
                                </div>
                            ) : (
                                <div className="grid gap-4">
                                    {reports?.sort((a, b) => (a.status === 'pending' ? -1 : 1)).map((r: any) => (
                                        <Card key={r.id} className={`border-l-4 transition-all hover:shadow-md ${r.status === 'resolved' ? 'border-l-green-500 bg-muted/20' : r.status === 'investigating' ? 'border-l-blue-500 bg-blue-50/10' : 'border-l-orange-500 bg-orange-50/10'}`}>
                                            <CardContent className="p-6">
                                                <div className="flex flex-col md:flex-row justify-between items-start gap-6">
                                                    <div className="space-y-4 flex-1">
                                                        <div className="flex items-center gap-3">
                                                            <div className={`p-2 rounded-xl ${r.status === 'resolved' ? 'bg-green-500/10 text-green-500' : 'bg-orange-500/10 text-orange-500'}`}>
                                                                <AlertTriangle className="w-5 h-5" />
                                                            </div>
                                                            <div>
                                                                <div className="flex items-center gap-2">
                                                                    <p className="text-sm font-black uppercase tracking-widest">Article Infraction</p>
                                                                    <Badge className={`text-[9px] font-black uppercase tracking-tight py-0 px-2 ${r.status === 'resolved' ? 'bg-green-500/10 text-green-500 border-green-500/20' : r.status === 'investigating' ? 'bg-blue-500/10 text-blue-500 border-blue-500/20' : 'bg-orange-500/10 text-orange-500 border-orange-500/20'}`}>
                                                                        {r.status || 'pending'}
                                                                    </Badge>
                                                                </div>
                                                                <p className="text-[10px] text-muted-foreground font-bold font-mono">CASE_ID: {r.id}</p>
                                                            </div>
                                                        </div>

                                                        <div className="bg-background/80 p-4 rounded-2xl border border-border/50">
                                                            <p className="text-xs uppercase font-black text-muted-foreground mb-1 tracking-wider">Report Details</p>
                                                            <p className="text-sm text-foreground font-medium italic">"{r.reason}"</p>
                                                        </div>

                                                        <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
                                                            <div className="flex flex-col">
                                                                <span className="text-[9px] uppercase font-black text-muted-foreground tracking-widest">Reporter</span>
                                                                <span className="text-xs font-bold text-foreground">{r.reporterId}</span>
                                                            </div>
                                                            <div className="flex flex-col">
                                                                <span className="text-[9px] uppercase font-black text-muted-foreground tracking-widest">Target Article</span>
                                                                <span className="text-xs font-bold text-primary font-mono">{r.articleId}</span>
                                                            </div>
                                                            <div className="flex flex-col">
                                                                <span className="text-[9px] uppercase font-black text-muted-foreground tracking-widest">Timestamp</span>
                                                                <span className="text-xs font-bold text-foreground">{r.createdAt ? format(new Date(r.createdAt), "PPp") : "UNK"}</span>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="flex flex-col gap-2 w-full md:w-auto self-stretch md:justify-center border-t md:border-t-0 md:border-l border-border md:pl-6 pt-4 md:pt-0">
                                                        <div className="flex gap-2 mb-2">
                                                            <Link href={`/article/${r.articleId}`}>
                                                                <Button size="sm" variant="secondary" className="flex-1 rounded-xl gap-2 font-bold text-xs uppercase tracking-tight">
                                                                    <ExternalLink className="w-3.5 h-3.5" /> View Content
                                                                </Button>
                                                            </Link>
                                                        </div>

                                                        <DropdownMenu>
                                                            <DropdownMenuTrigger asChild>
                                                                <Button size="sm" variant="outline" className="w-full rounded-xl gap-2 font-bold text-xs uppercase tracking-tight">
                                                                    Change Status
                                                                </Button>
                                                            </DropdownMenuTrigger>
                                                            <DropdownMenuContent className="w-48 rounded-xl shadow-xl border-border">
                                                                <DropdownMenuItem onSelect={() => updateReportStatusMutation.mutate({ reportId: r.id, status: 'pending' })} className="text-xs font-bold gap-2">
                                                                    <div className="w-2 h-2 rounded-full bg-orange-500" /> Mark as Pending
                                                                </DropdownMenuItem>
                                                                <DropdownMenuItem onSelect={() => updateReportStatusMutation.mutate({ reportId: r.id, status: 'investigating' })} className="text-xs font-bold gap-2">
                                                                    <div className="w-2 h-2 rounded-full bg-blue-500" /> Start Investigating
                                                                </DropdownMenuItem>
                                                                <DropdownMenuItem onSelect={() => updateReportStatusMutation.mutate({ reportId: r.id, status: 'resolved' })} className="text-xs font-bold gap-2 text-green-500">
                                                                    <div className="w-2 h-2 rounded-full bg-green-500" /> Resolve (Dismiss)
                                                                </DropdownMenuItem>
                                                            </DropdownMenuContent>
                                                        </DropdownMenu>

                                                        <Button
                                                            size="sm"
                                                            variant="destructive"
                                                            className="w-full rounded-xl gap-2 font-bold text-xs uppercase tracking-tight shadow-sm active:scale-95 transition-all"
                                                            disabled={deleteArticleMutation.isPending}
                                                            onClick={() => {
                                                                if (confirm("Executing high-level moderation: Delete article and purge report?")) {
                                                                    deleteArticleMutation.mutate({ articleId: r.articleId, reportId: r.id });
                                                                }
                                                            }}
                                                        >
                                                            <Trash2 className="w-3.5 h-3.5" /> Purge Content
                                                        </Button>

                                                        {r.status !== 'resolved' && (
                                                            <Button
                                                                size="sm"
                                                                variant="ghost"
                                                                className="w-full text-muted-foreground hover:text-foreground text-[10px] font-black uppercase tracking-widest"
                                                                onClick={() => dismissReportMutation.mutate(r.id)}
                                                            >
                                                                Quick Dismiss
                                                            </Button>
                                                        )}
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            )}
                        </TabsContent>
                    </Tabs>
                </div>
            </main>
        </div>
    );
}
