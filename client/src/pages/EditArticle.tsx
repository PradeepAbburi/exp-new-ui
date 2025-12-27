import { useEffect, useState } from "react";
import { useArticle, useUpdateArticle, useArticleHistory } from "@/hooks/use-articles";
import { Sidebar } from "@/components/Sidebar";
import { Editor, type Block } from "@/components/Editor";
import { useAuth } from "@/hooks/use-auth";
import { Redirect, useRoute, useLocation } from "wouter";
import { Loader2, ArrowLeft, Save, Globe, Lock, ChevronDown, Share2, Copy, History, User, PenTool } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import * as Popover from "@radix-ui/react-popover";
import { format } from "date-fns";

export default function EditArticle() {
    const { user, isLoading: authLoading } = useAuth();
    const [match, params] = useRoute("/editor/:id");
    const id = params?.id || "";

    const { data: articleData, isLoading: articleLoading } = useArticle(id);
    const article = articleData as any;
    const { data: historyLogs } = useArticleHistory(id);
    const { mutate: updateArticle, isPending } = useUpdateArticle();
    const { toast } = useToast();
    const [_, setLocation] = useLocation();

    const [title, setTitle] = useState("");
    const [coverImage, setCoverImage] = useState("");
    const [blocks, setBlocks] = useState<Block[] | null>(null);
    const [tags, setTags] = useState<string[]>([]);
    const [isPublic, setIsPublic] = useState(false);
    const [accessKey, setAccessKey] = useState("");
    const [isInitializing, setIsInitializing] = useState(true);
    const [progress, setProgress] = useState(0);

    useEffect(() => {
        const timer = setTimeout(() => setIsInitializing(false), 1500);
        const interval = setInterval(() => {
            setProgress(prev => Math.min(prev + (100 / 15), 100)); // Smooth progress bar
        }, 100);
        return () => {
            clearTimeout(timer);
            clearInterval(interval);
        };
    }, []);

    useEffect(() => {
        if (article && blocks === null) {
            setTitle(article.title);
            setCoverImage(article.coverImage || "");
            setBlocks(Array.isArray(article.content) ? article.content : []);
            setTags(article.tags || []);
            setIsPublic(article.isPublic || false);
            setAccessKey(article.accessKey || "");
        }
    }, [article, blocks]);

    if (authLoading || articleLoading || blocks === null || isInitializing) {
        return (
            <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 relative overflow-hidden">
                {/* Decorative background elements */}
                <div className="absolute top-1/4 -left-20 w-80 h-80 bg-primary/5 rounded-full blur-[100px] animate-pulse" />
                <div className="absolute bottom-1/4 -right-20 w-80 h-80 bg-secondary/5 rounded-full blur-[100px] animate-pulse" />

                <div className="relative mb-8 transform scale-125">
                    <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center shadow-2xl ring-1 ring-primary/20">
                        <PenTool className="w-10 h-10 text-primary" />
                    </div>
                    <div className="absolute -inset-4 bg-primary/20 rounded-full blur-2xl animate-pulse -z-10" />
                </div>

                <div className="flex flex-col items-center max-w-xs w-full">
                    <h2 className="text-3xl font-display font-bold text-foreground mb-3 tracking-tight">
                        Opening Editor
                    </h2>
                    <p className="text-muted-foreground font-medium mb-8 text-center animate-pulse">
                        Retrieving your story...
                    </p>

                    <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden mb-4 border border-border/50">
                        <div
                            className="h-full bg-primary transition-all duration-300 ease-out shadow-[0_0_10px_rgba(var(--primary),0.5)]"
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                    <div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em]">
                        <Loader2 className="w-3 h-3 animate-spin text-primary" />
                        Initializing Workspace
                    </div>
                </div>
            </div>
        );
    }
    if (!article) return <div className="min-h-screen bg-background flex items-center justify-center font-display text-xl font-bold">Page not found</div>;

    const isOwner = user?.id === article.authorId;

    // Only authors can access the editor for now
    if (!isOwner) {
        return <Redirect to={`/article/${id}`} />;
    }

    const handleSave = async () => {
        if (!title.trim()) {
            toast({ title: "Missing Title", description: "Please add a title.", variant: "destructive" });
            return;
        }

        updateArticle({
            id,
            title,
            coverImage,
            content: blocks!,
            isPublic,
            accessKey
        } as any, {
            onSuccess: () => {
                toast({ title: "Saved", description: isPublic ? "Page updated." : "Draft updated." });
            },
            onError: () => {
                toast({ title: "Error", description: "Failed to update page.", variant: "destructive" });
            }
        });
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        toast({ title: "Copied Link", description: "Link copied to clipboard." });
    };

    const origin = window.location.origin;

    return (
        <div className="min-h-screen bg-background">
            <Sidebar />
            <main className="lg:pl-64 min-h-screen">
                <div className="sticky top-0 z-40 bg-background/80 backdrop-blur-md border-b border-border px-8 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button onClick={() => history.back()} className="lg:hidden p-2 -ml-2">
                            <ArrowLeft className="w-6 h-6" />
                        </button>
                        <span className="text-muted-foreground font-medium">
                            {isPublic ? "Editing Public Post" : "Editing Draft"}
                        </span>
                    </div>

                    <div className="flex items-center gap-3">
                        {/* Edit History Popover */}
                        <Popover.Root>
                            <Popover.Trigger asChild>
                                <button className="p-2 rounded-lg border border-border bg-card hover:bg-muted text-foreground transition-colors" title="Edit History">
                                    <History className="w-4 h-4" />
                                </button>
                            </Popover.Trigger>
                            <Popover.Portal>
                                <Popover.Content className="w-80 bg-card border border-border rounded-xl shadow-xl p-4 z-50 animate-in fade-in zoom-in-95 duration-200 overflow-hidden flex flex-col max-h-[400px]" sideOffset={5} align="end">
                                    <h3 className="font-bold mb-3 text-sm flex items-center gap-2">
                                        <History className="w-4 h-4" /> Edit History
                                    </h3>

                                    <div className="flex-1 overflow-y-auto pr-1 space-y-4">
                                        {!historyLogs || historyLogs.length === 0 ? (
                                            <p className="text-xs text-muted-foreground py-4 text-center">No history recorded yet.</p>
                                        ) : (
                                            historyLogs.map((log: any) => (
                                                <div key={log.id} className="border-l-2 border-primary/20 pl-3 py-1 space-y-1">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-5 h-5 rounded-full bg-muted overflow-hidden flex-shrink-0">
                                                            {log.editorAvatar ? (
                                                                <img src={log.editorAvatar} alt="" className="w-full h-full object-cover" />
                                                            ) : (
                                                                <div className="w-full h-full flex items-center justify-center">
                                                                    <User className="w-3 h-3 text-muted-foreground" />
                                                                </div>
                                                            )}
                                                        </div>
                                                        <span className="text-xs font-bold truncate flex-1">{log.editorName}</span>
                                                        <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                                                            {format(log.timestamp, "MMM d, h:mm a")}
                                                        </span>
                                                    </div>
                                                    <p className="text-[10px] text-muted-foreground line-clamp-1 italic">
                                                        "{log.title || 'Untitled'}"
                                                    </p>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                    <Popover.Arrow className="fill-card border-t border-border" />
                                </Popover.Content>
                            </Popover.Portal>
                        </Popover.Root>

                        <DropdownMenu.Root>
                            <DropdownMenu.Trigger asChild>
                                <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border bg-card hover:bg-muted text-sm font-medium transition-colors">
                                    {isPublic ? <Globe className="w-4 h-4 text-primary" /> : <Lock className="w-4 h-4 text-muted-foreground" />}
                                    {isPublic ? "Public" : "Private (Password Protected)"}
                                    <ChevronDown className="w-3 h-3 opacity-50" />
                                </button>
                            </DropdownMenu.Trigger>
                            <DropdownMenu.Content align="end" className="w-64 bg-card border border-border rounded-xl shadow-xl p-3 z-50 animate-in fade-in zoom-in-95 duration-200">
                                <DropdownMenu.Item onClick={() => setIsPublic(true)} className="flex items-center gap-2 px-3 py-2 text-sm text-foreground hover:bg-muted rounded-lg cursor-pointer outline-none mb-1">
                                    <Globe className="w-4 h-4 text-primary" />
                                    <div>
                                        <p className="font-bold">Public</p>
                                        <p className="text-[10px] text-muted-foreground">Visible to everyone in discovery</p>
                                    </div>
                                </DropdownMenu.Item>
                                <DropdownMenu.Item onClick={() => setIsPublic(false)} className="flex items-center gap-2 px-3 py-2 text-sm text-foreground hover:bg-muted rounded-lg cursor-pointer outline-none mb-2">
                                    <Lock className="w-4 h-4 text-muted-foreground" />
                                    <div>
                                        <p className="font-bold">Private</p>
                                        <p className="text-[10px] text-muted-foreground">Only accessible via Password</p>
                                    </div>
                                </DropdownMenu.Item>
                                {!isPublic && (
                                    <div className="pt-2 border-t border-border mt-1">
                                        <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2 block">Set Page Password</label>
                                        <div className="flex gap-2">
                                            <input
                                                type="text"
                                                placeholder="Enter password..."
                                                value={accessKey}
                                                onChange={(e) => setAccessKey(e.target.value)}
                                                className="flex-1 bg-muted px-2 py-1.5 rounded text-xs border border-transparent focus:border-primary outline-none font-mono"
                                            />
                                            <button
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    toast({ title: "Password Set", description: "Remember to save your changes." });
                                                }}
                                                className="p-1 px-2 bg-primary/20 text-primary text-[10px] font-bold rounded hover:bg-primary/30 transition-colors"
                                            >
                                                Save
                                            </button>
                                        </div>
                                        <p className="text-[9px] text-muted-foreground mt-2">Viewers will need this exact password to unlock the page.</p>
                                    </div>
                                )}
                            </DropdownMenu.Content>
                        </DropdownMenu.Root>

                        <button
                            onClick={handleSave}
                            disabled={isPending}
                            className="btn-primary px-6 py-2 rounded-xl font-semibold flex items-center gap-2"
                        >
                            {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                            {isPublic ? "Update" : "Save changes"}
                        </button>
                    </div>
                </div>

                <div className="py-10">
                    <Editor
                        key={id}
                        title={title}
                        onTitleChange={setTitle}
                        coverImage={coverImage}
                        onCoverImageChange={setCoverImage}
                        initialBlocks={blocks!}
                        onChange={(newBlocks) => setBlocks(newBlocks)}
                        tags={tags}
                        onTagsChange={setTags}
                    />
                </div>
            </main>
        </div>
    );
}
