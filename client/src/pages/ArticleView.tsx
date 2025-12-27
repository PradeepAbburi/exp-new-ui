import { useEffect, useState } from "react";
import { useRoute } from "wouter";
import { useArticle, useLikeArticle, useBookmarkArticle, useViewArticle } from "@/hooks/use-articles";
import { Sidebar } from "@/components/Sidebar";
import { Loader2, Calendar, User as UserIcon, Heart, Bookmark, MessageCircle } from "lucide-react";
import { format } from "date-fns";
import SyntaxHighlighter from "react-syntax-highlighter";
import { atomOneDark } from "react-syntax-highlighter/dist/esm/styles/hljs";
import { clsx } from "clsx";
import ReactMarkdown from "react-markdown";
import * as Popover from "@radix-ui/react-popover";
import { useDeleteArticle, useArchiveArticle } from "@/hooks/use-articles";
import { Comments } from "@/components/Comments";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { MoreVertical, Edit, Archive, Trash2, ArrowLeft, Globe, Flag, Lock, Eye } from "lucide-react";

export default function ArticleView() {
  const [match, params] = useRoute("/article/:id");
  const { data: articleData, isLoading } = useArticle(params?.id || "");
  const article = articleData as any;
  const { mutate: likeArticle, isPending: isLiking } = useLikeArticle();
  const { mutate: bookmarkArticle, isPending: isBookmarking } = useBookmarkArticle();
  const { mutate: viewArticle } = useViewArticle();
  const { user } = useAuth();
  const [location, setLocation] = useLocation();
  const { mutate: deleteArticle } = useDeleteArticle();
  const { mutate: archiveArticle } = useArchiveArticle();

  const [unlocked, setUnlocked] = useState(false);
  const [keyInput, setKeyInput] = useState("");
  const [showError, setShowError] = useState(false);
  const [translatedContent, setTranslatedContent] = useState<any[] | null>(null);
  const [isTranslating, setIsTranslating] = useState(false);

  const handleBack = () => {
    // Naive back, could be improved with history state if available but wouter doesn't give previous path easily.
    // Default to home if no clear previous context, or use standard browser back?
    // Using window.history.back() often better for UX if it stays in app
    window.history.back();
  };

  const handleTranslate = async (lang: string) => {
    try {
      setIsTranslating(true);
      const res = await fetch(`/api/articles/${article.id}/translate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetLanguage: lang })
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setTranslatedContent(data.translatedContent);
    } catch (e) {
      alert("Translation failed");
    } finally {
      setIsTranslating(false);
    }
  };

  const handleReport = async () => {
    const reason = prompt("Why are you reporting this article?");
    if (!reason) return;

    try {
      const res = await fetch(`/api/articles/${article.id}/report`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason })
      });
      if (!res.ok) throw new Error();
      alert("Report submitted for review.");
    } catch (e) {
      alert("Failed to submit report");
    }
  };


  const isOwner = user && article && (user.id === article.authorId);

  const handleDelete = () => {
    if (confirm("Are you sure you want to delete this article?")) {
      deleteArticle(article.id, {
        onSuccess: () => setLocation('/')
      });
    }
  };

  const handleArchive = () => {
    archiveArticle({ id: article.id, archive: !article.isArchived });
  };

  useEffect(() => {
    if (article?.id) {
      viewArticle(article.id);
    }
  }, [article?.id]);

  // Check localStorage for saved access on mount
  useEffect(() => {
    if (article?.id && article?.accessKey && !article.isPublic && !isOwner) {
      const storageKey = `article_access_${article.id}_${btoa(article.accessKey).substring(0, 8)}`;
      const savedAccess = localStorage.getItem(storageKey);
      if (savedAccess === 'granted') {
        setUnlocked(true);
      }
    }
  }, [article?.id, article?.accessKey, article?.isPublic, isOwner]);

  const handleUnlock = () => {
    if (keyInput === article.accessKey) {
      setUnlocked(true);
      setShowError(false);
      // Save access to localStorage with a key that includes the access key hash
      // If author changes the access key, the hash changes and user will be prompted again
      const storageKey = `article_access_${article.id}_${btoa(article.accessKey).substring(0, 8)}`;
      localStorage.setItem(storageKey, 'granted');
    } else {
      setShowError(true);
      setTimeout(() => setShowError(false), 2000);
    }
  };

  if (isLoading) return <div className="min-h-screen flex items-center justify-center bg-background"><Loader2 className="w-8 h-8 text-primary animate-spin" /></div>;
  if (!article) return <div className="min-h-screen flex items-center justify-center bg-background text-muted-foreground">Article not found</div>;

  const isLocked = !article.isPublic && !isOwner && !unlocked;

  if (isLocked) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <Sidebar />
        <main className="md:pl-20 lg:pl-64 min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
          {/* Decorative background elements */}
          <div className="absolute top-1/4 -left-20 w-80 h-80 bg-primary/5 rounded-full blur-[100px] animate-pulse" />
          <div className="absolute bottom-1/4 -right-20 w-80 h-80 bg-secondary/5 rounded-full blur-[100px] animate-pulse" />

          <div className="max-w-md w-full bg-card border border-border/50 rounded-3xl p-8 shadow-2xl text-center relative z-10 backdrop-blur-sm animate-in fade-in zoom-in-95 duration-500">
            <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center mx-auto mb-8 shadow-inner ring-1 ring-primary/10">
              <Lock className="w-10 h-10 text-primary animate-pulse" />
            </div>
            <h2 className="text-3xl font-display font-bold mb-3 tracking-tight">Private Access</h2>
            <p className="text-muted-foreground mb-10 text-pretty">
              This article is protected by its author. Please enter the unique access key to unlock the content.
            </p>

            <div className="space-y-5">
              <div className="relative group">
                <input
                  type="password"
                  value={keyInput}
                  onChange={(e) => setKeyInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleUnlock()}
                  placeholder="Enter access key..."
                  className={clsx(
                    "w-full bg-muted border px-5 py-4 rounded-2xl outline-none focus:ring-2 ring-primary/20 transition-all font-mono tracking-widest text-center",
                    showError ? "border-red-500/50 shake" : "border-border group-hover:border-primary/50"
                  )}
                />
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-primary/30 to-transparent scale-x-0 group-focus-within:scale-x-100 transition-transform duration-500" />
              </div>

              {showError && (
                <div className="py-2 px-4 rounded-lg bg-red-500/10 border border-red-500/20 animate-in fade-in slide-in-from-top-2">
                  <p className="text-xs text-red-500 font-bold uppercase tracking-wider">Invalid Key</p>
                </div>
              )}

              <button
                onClick={handleUnlock}
                className="w-full btn-primary py-4 rounded-2xl font-bold shadow-lg shadow-primary/20 transition-all active:scale-95 group overflow-hidden relative"
              >
                <span className="relative z-10 flex items-center justify-center gap-2">
                  Unlock Now
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-shimmer" />
              </button>

              <button
                onClick={() => setLocation('/')}
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors py-2"
              >
                Return to Discovery
              </button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <main className="md:pl-20 lg:pl-64 min-h-screen pb-20 md:pb-0">
        <div className="max-w-4xl mx-auto py-6 md:py-10">

          {/* Header */}
          <div className="mb-8 md:mb-10 text-center">
            {/* Banner Image */}
            {article.coverImage && (
              <div className="mb-6 md:mb-8">
                <div className="-mx-4 md:mx-0 md:rounded-3xl overflow-hidden shadow-2xl aspect-[4/1]">
                  <img src={article.coverImage} alt={article.title} className="w-full h-full object-cover" />
                </div>
              </div>
            )}

            {/* Action Buttons Row - Below Banner */}
            <div className="px-4 md:px-8 mb-6 flex items-center justify-between">
              {/* Back Button */}
              <button onClick={handleBack} className="p-2 bg-card hover:bg-muted rounded-full transition-colors text-foreground border border-border shadow-sm">
                <ArrowLeft className="w-5 h-5" />
              </button>

              {/* Action Buttons for non-owner */}
              {!isOwner && (
                <div className="flex gap-2">
                  <Popover.Root>
                    <Popover.Trigger asChild>
                      <button className="p-2 bg-card hover:bg-muted rounded-full transition-colors text-foreground border border-border shadow-sm" title="Translate">
                        <Globe className="w-5 h-5" />
                      </button>
                    </Popover.Trigger>
                    <Popover.Portal>
                      <Popover.Content className="w-40 bg-card border border-border rounded-xl shadow-xl p-1 z-50 flex flex-col animate-in fade-in zoom-in-95 duration-200" sideOffset={5} align="end">
                        {["English", "Spanish", "French", "German", "Chinese"].map((lang) => (
                          <button key={lang} onClick={() => handleTranslate(lang)} className="px-3 py-2 text-sm text-foreground hover:bg-muted rounded-lg transition-colors w-full text-left">
                            {lang}
                          </button>
                        ))}
                        <Popover.Arrow className="fill-card border-t border-border" />
                      </Popover.Content>
                    </Popover.Portal>
                  </Popover.Root>
                  <button onClick={handleReport} className="p-2 bg-card hover:bg-muted rounded-full transition-colors text-destructive hover:bg-destructive/10 border border-border shadow-sm" title="Report">
                    <Flag className="w-5 h-5" />
                  </button>
                </div>
              )}
            </div>

            <div className="px-4 md:px-8 pointer-events-auto">
              <h1 className="text-3xl md:text-5xl font-display font-bold text-foreground mb-4 md:mb-6 leading-tight">
                {article.title}
              </h1>

              <div className="flex items-center justify-center gap-6 text-muted-foreground">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-muted overflow-hidden">
                    {article.author.avatarUrl ? (
                      <img src={article.author.avatarUrl} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-muted">
                        <UserIcon className="w-4 h-4" />
                      </div>
                    )}
                  </div>
                  <span className="font-medium text-foreground">{article.author.displayName || article.author.username}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="w-4 h-4" />
                  <span>{(() => {
                    try {
                      if (!article.createdAt) return "";
                      const date = 'toDate' in (article.createdAt as any)
                        ? (article.createdAt as any).toDate()
                        : new Date(article.createdAt);
                      return format(date, "MMMM d, yyyy");
                    } catch (e) {
                      return "";
                    }
                  })()}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Eye className="w-4 h-4" />
                  <span>{article.views || 0}</span>
                </div>
                {isOwner && (
                  <Popover.Root>
                    <Popover.Trigger asChild>
                      <button className="p-2 hover:bg-muted rounded-full transition-colors text-muted-foreground hover:text-foreground">
                        <MoreVertical className="w-5 h-5" />
                      </button>
                    </Popover.Trigger>
                    <Popover.Portal>
                      <Popover.Content className="w-40 bg-card border border-border rounded-xl shadow-xl p-1 z-50 flex flex-col animate-in fade-in zoom-in-95 duration-200" sideOffset={5} align="start">
                        <button onClick={() => setLocation(`/editor/${article.id}`)} className="flex items-center gap-2 px-3 py-2 text-sm text-foreground hover:bg-muted rounded-lg transition-colors w-full text-left">
                          <Edit className="w-4 h-4" /> Edit
                        </button>
                        <button onClick={handleArchive} className="flex items-center gap-2 px-3 py-2 text-sm text-foreground hover:bg-muted rounded-lg transition-colors w-full text-left">
                          <Archive className="w-4 h-4" /> {article.isArchived ? "Restore" : "Archive"}
                        </button>
                        <div className="h-px bg-border my-1" />
                        <button onClick={handleDelete} className="flex items-center gap-2 px-3 py-2 text-sm text-destructive hover:bg-destructive/10 rounded-lg transition-colors w-full text-left">
                          <Trash2 className="w-4 h-4" /> Delete
                        </button>
                        <Popover.Arrow className="fill-card border-t border-border" />
                      </Popover.Content>
                    </Popover.Portal>
                  </Popover.Root>
                )}
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="px-4 md:px-8">
            {isTranslating && (
              <div className="flex items-center gap-2 text-primary mb-4 animate-pulse">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm font-medium">Translating...</span>
              </div>
            )}
            <article className="prose prose-invert prose-lg max-w-none space-y-8">
              {Array.isArray(translatedContent || article.content) && (translatedContent || article.content).map((block: any) => (
                <div key={block.id}>
                  {block.type === 'text' && (
                    <div className="text-lg text-gray-300 [&>h1]:text-3xl [&>h1]:font-bold [&>h1]:my-4 [&>h1]:text-foreground [&>h2]:text-2xl [&>h2]:font-bold [&>h2]:my-3 [&>h2]:text-foreground [&>h3]:text-xl [&>h3]:font-bold [&>h3]:my-2 [&>h3]:text-foreground [&>p]:mb-4 [&>p]:leading-loose">
                      <ReactMarkdown>
                        {block.content}
                      </ReactMarkdown>
                    </div>
                  )}
                  {/* Media Support (Image & Video) */}
                  {((block.type === 'image' || block.type === 'media') && block.content) && (
                    <div className="my-8 rounded-2xl overflow-hidden shadow-lg bg-card/50">
                      {(() => {
                        const url = block.content;
                        const isVideo = url.match(/\.(mp4|webm|ogg|mov)$/i) || url.includes('youtube.com') || url.includes('youtu.be') || url.includes('vimeo.com');

                        if (isVideo) {
                          if (url.includes('youtube.com') || url.includes('youtu.be')) {
                            let videoId = '';
                            if (url.includes('youtu.be')) videoId = url.split('/').pop() || '';
                            else videoId = new URL(url).searchParams.get('v') || '';
                            return (
                              <div className="aspect-video w-full">
                                <iframe className="w-full h-full" src={`https://www.youtube.com/embed/${videoId}`} allowFullScreen title="YouTube video player" />
                              </div>
                            );
                          }
                          if (url.includes('vimeo.com')) {
                            const videoId = url.split('/').pop();
                            return (
                              <div className="aspect-video w-full">
                                <iframe className="w-full h-full" src={`https://player.vimeo.com/video/${videoId}`} allowFullScreen title="Vimeo video player" />
                              </div>
                            );
                          }
                          return <video src={url} controls className="w-full h-auto rounded-lg" />;
                        }
                        return <img src={url} alt="" className="w-full h-auto object-cover" />;
                      })()}
                    </div>
                  )}
                  {block.type === 'code' && (
                    <div className="my-8 rounded-xl overflow-hidden shadow-xl">
                      <SyntaxHighlighter language="javascript" style={atomOneDark} customStyle={{ padding: '2rem' }}>
                        {block.content}
                      </SyntaxHighlighter>
                    </div>
                  )}
                  {block.type === 'document' && block.content && (
                    <a href={block.content} target="_blank" rel="noopener noreferrer" className="block p-4 rounded-xl bg-card border border-border hover:border-primary transition-colors flex items-center gap-4">
                      <div className="w-12 h-12 bg-primary/20 rounded-lg flex items-center justify-center shrink-0">
                        <span className="font-bold text-primary text-xs">DOC</span>
                      </div>
                      <div>
                        <p className="font-medium text-foreground truncate">Document Attachment</p>
                        <p className="text-sm text-muted-foreground">Click to view or download</p>
                      </div>
                    </a>
                  )}
                </div>
              ))}
            </article>

            {/* Social Interaction Bar */}
            <div className="mt-24 pt-6 border-t-2 border-border/30">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-8">
                  <button
                    onClick={() => likeArticle(article.id)}
                    disabled={isLiking}
                    className={clsx(
                      "flex items-center gap-2.5 text-sm font-medium transition-all group",
                      (article as any).isLiked ? "text-red-500" : "text-muted-foreground hover:text-red-500"
                    )}
                  >
                    <Heart className={clsx("w-5 h-5 transition-transform group-hover:scale-110", (article as any).isLiked && "fill-current")} />
                    <span>{(article as any).likeCount || 0} {(article as any).likeCount === 1 ? 'Like' : 'Likes'}</span>
                  </button>

                  <button className="flex items-center gap-2.5 text-sm font-medium text-muted-foreground hover:text-primary transition-all group">
                    <MessageCircle className="w-5 h-5 transition-transform group-hover:scale-110" />
                    <span>Comment</span>
                  </button>
                </div>

                <button
                  onClick={() => bookmarkArticle(article.id)}
                  disabled={isBookmarking}
                  className={clsx(
                    "flex items-center gap-2.5 text-sm font-medium transition-all group",
                    (article as any).isBookmarked ? "text-primary" : "text-muted-foreground hover:text-primary"
                  )}
                >
                  <Bookmark className={clsx("w-5 h-5 transition-transform group-hover:scale-110", (article as any).isBookmarked && "fill-current")} />
                  <span className="hidden sm:inline">{(article as any).isBookmarked ? 'Saved' : 'Save'}</span>
                </button>
              </div>
            </div>

            {/* Comments Section */}
            <Comments articleId={article.id} />

          </div>
        </div>
      </main>
    </div>
  );
}
