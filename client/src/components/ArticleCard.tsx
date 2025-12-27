import { Link, useLocation } from "wouter";
import { formatDistanceToNow } from "date-fns";
import { Heart, Bookmark, MessageCircle, MoreVertical, Edit, Archive, Trash2, Lock, Eye } from "lucide-react";
import { type Article, type User } from "@shared/schema";
import { useLikeArticle, useBookmarkArticle, useDeleteArticle, useArchiveArticle } from "@/hooks/use-articles";
import { useAuth } from "@/hooks/use-auth";
import { clsx } from "clsx";
import { useState } from "react";
import * as Popover from "@radix-ui/react-popover";

interface ArticleCardProps {
  article: any;
}

export function ArticleCard({ article }: ArticleCardProps) {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { mutate: like, isPending: isLiking } = useLikeArticle();
  const { mutate: bookmark, isPending: isBookmarking } = useBookmarkArticle();
  const { mutate: deleteArticle, isPending: isDeleting } = useDeleteArticle();
  const { mutate: archiveArticle } = useArchiveArticle();

  // Check if current user is author (using id matching)
  // user.id from our DB, article.authorId from our DB.
  // We also try to match firebase uid if relevant, but our schema uses 'id' as uuid.
  const isOwner = user && (user.id === article.authorId);
  const isDraft = article.isPublic === false;

  const handleLike = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isLiking) return;
    like(article.id);
  };

  const handleBookmark = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isBookmarking) return;
    bookmark(article.id);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (confirm("Are you sure you want to delete this article?")) {
      deleteArticle(article.id);
    }
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setLocation(`/editor/${article.id}`);
  };

  const handleArchive = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    archiveArticle({ id: article.id, archive: !article.isArchived });
  };

  // Safe parsing of content to get a preview text
  // Hide preview for private articles if not owner
  const isLocked = !article.isPublic && !isOwner;
  const previewText = isLocked
    ? "This content is private. Enter the access key to view."
    : (Array.isArray(article.content)
      ? article.content.find((block: any) => block.type === 'text')?.content || ''
      : '');

  const isLiked = article.isLiked;
  const likeCount = article.likeCount || 0;

  return (
    <Link href={`/article/${article.id}`} className="group block h-full">
      <article className="bg-card rounded-2xl overflow-hidden border border-border/50 hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 h-full flex flex-col relative text-left">
        {/* Banner Area */}
        {article.coverImage ? (
          <div className="aspect-[4/1] w-full overflow-hidden relative">
            <img
              src={article.coverImage}
              alt={article.title}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
            {isDraft && (
              <div className="absolute top-2 left-2 z-10 bg-black/60 backdrop-blur-md text-white px-2 py-1 rounded-md text-xs font-bold flex items-center gap-1">
                <Lock className="w-3 h-3" /> Private
              </div>
            )}
          </div>
        ) : (
          <div className="aspect-[4/1] w-full bg-gradient-to-br from-primary/20 via-secondary/10 to-primary/30 flex items-center justify-center p-8 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
            <h4 className="text-lg font-bold text-white/50 text-center line-clamp-2 max-w-xs relative z-10">{article.title}</h4>
            {isDraft && (
              <div className="absolute top-2 left-2 z-10 bg-black/60 backdrop-blur-md text-white px-2 py-1 rounded-md text-xs font-bold flex items-center gap-1">
                <Lock className="w-3 h-3" /> Private
              </div>
            )}
          </div>
        )}

        <div className="p-6 flex flex-col flex-1 relative">
          {!article.coverImage && isDraft && (
            <div className="absolute top-6 right-12 bg-muted text-muted-foreground px-2 py-1 rounded-md text-xs font-bold flex items-center gap-1 border border-border">
              <Lock className="w-3 h-3" /> Private
            </div>
          )}
          <div className="flex items-center justify-between gap-3 mb-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-muted overflow-hidden ring-2 ring-background shadow-sm">
                {article.author?.avatarUrl ? (
                  <img src={article.author.avatarUrl} alt={article.author.username} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-primary/30 to-secondary/30 flex items-center justify-center">
                    <span className="text-[10px] font-bold text-primary">{(article.author?.displayName || article.author?.username || "A").charAt(0).toUpperCase()}</span>
                  </div>
                )}
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">{article.author.displayName || article.author.username}</p>
                <p className="text-xs text-muted-foreground">
                  {article.createdAt && (() => {
                    try {
                      const date = article.createdAt instanceof Date ? article.createdAt : new Date(article.createdAt);
                      return isNaN(date.getTime()) ? 'Recently' : formatDistanceToNow(date, { addSuffix: true });
                    } catch {
                      return 'Recently';
                    }
                  })()}
                </p>
              </div>
            </div>

            {isOwner && (
              <div
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
                onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); }}
                className="relative z-20"
              >
                <Popover.Root>
                  <Popover.Trigger asChild>
                    <button className="p-1.5 hover:bg-muted rounded-full transition-colors text-muted-foreground hover:text-foreground">
                      <MoreVertical className="w-4 h-4" />
                    </button>
                  </Popover.Trigger>
                  <Popover.Portal>
                    <Popover.Content className="w-40 bg-card border border-border rounded-xl shadow-xl p-1 z-50 flex flex-col animate-in fade-in zoom-in-95 duration-200" sideOffset={5} align="end">
                      <button onClick={handleEdit} className="flex items-center gap-2 px-3 py-2 text-sm text-foreground hover:bg-muted rounded-lg transition-colors w-full text-left">
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
              </div>
            )}
          </div>

          <h3 className="text-xl font-bold font-display mb-2 text-foreground group-hover:text-primary transition-colors line-clamp-2">
            {article.title}
          </h3>

          <p className="text-muted-foreground line-clamp-3 mb-6 flex-1 text-sm leading-relaxed">
            {previewText}
          </p>

          <div className="flex items-center justify-between pt-4 border-t border-border/50">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground" title="Views">
                <Eye className="w-4 h-4" />
                <span>{article.views || 0}</span>
              </div>

              <button
                onClick={handleLike}
                className={clsx(
                  "flex items-center gap-1.5 text-sm transition-colors",
                  article.isLiked ? "text-red-500" : "text-muted-foreground hover:text-red-500"
                )}
              >
                <Heart className={clsx("w-4 h-4", article.isLiked && "fill-current")} />
                <span>{article.likeCount || 0}</span>
              </button>

              <button className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
                <MessageCircle className="w-4 h-4" />
                <span>Comment</span>
              </button>
            </div>

            <button
              onClick={handleBookmark}
              className={clsx(
                "transition-colors",
                article.isBookmarked ? "text-primary" : "text-muted-foreground hover:text-primary"
              )}
            >
              <Bookmark className={clsx("w-4 h-4", article.isBookmarked && "fill-current")} />
            </button>
          </div>
        </div>
      </article>
    </Link>
  );
}
