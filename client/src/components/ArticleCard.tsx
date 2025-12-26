import { Link } from "wouter";
import { formatDistanceToNow } from "date-fns";
import { Heart, Bookmark, MessageCircle } from "lucide-react";
import { type Article, type User } from "@shared/schema";
import { useLikeArticle, useBookmarkArticle } from "@/hooks/use-articles";
import { clsx } from "clsx";

interface ArticleCardProps {
  article: Article & { author: User; likeCount?: number; isLiked?: boolean };
}

export function ArticleCard({ article }: ArticleCardProps) {
  const { mutate: like, isPending: isLiking } = useLikeArticle();
  const { mutate: bookmark, isPending: isBookmarking } = useBookmarkArticle();

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

  // Safe parsing of content to get a preview text
  const previewText = Array.isArray(article.content) 
    ? article.content.find((block: any) => block.type === 'text')?.content || ''
    : '';

  return (
    <Link href={`/article/${article.id}`} className="group block">
      <article className="bg-card rounded-2xl overflow-hidden border border-border/50 hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 h-full flex flex-col">
        {article.coverImage && (
          <div className="aspect-video w-full overflow-hidden">
            <img 
              src={article.coverImage} 
              alt={article.title} 
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          </div>
        )}
        
        <div className="p-6 flex flex-col flex-1">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 rounded-full bg-muted overflow-hidden">
              {article.author.avatarUrl ? (
                <img src={article.author.avatarUrl} alt={article.author.username} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-primary/20" />
              )}
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">{article.author.displayName || article.author.username}</p>
              <p className="text-xs text-muted-foreground">
                {article.createdAt && formatDistanceToNow(new Date(article.createdAt), { addSuffix: true })}
              </p>
            </div>
          </div>

          <h3 className="text-xl font-bold font-display mb-2 text-foreground group-hover:text-primary transition-colors line-clamp-2">
            {article.title}
          </h3>
          
          <p className="text-muted-foreground line-clamp-3 mb-6 flex-1 text-sm leading-relaxed">
            {previewText}
          </p>

          <div className="flex items-center justify-between pt-4 border-t border-border/50">
            <div className="flex items-center gap-4">
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
              className="text-muted-foreground hover:text-primary transition-colors"
            >
              <Bookmark className="w-4 h-4" />
            </button>
          </div>
        </div>
      </article>
    </Link>
  );
}
