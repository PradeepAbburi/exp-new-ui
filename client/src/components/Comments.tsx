import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useComments, useAddComment, useDeleteComment, type Comment } from "@/hooks/use-comments";
import { formatDistanceToNow } from "date-fns";
import { Trash2, Send, User as UserIcon, MessageCircle, Reply, X } from "lucide-react";
import { Link } from "wouter";

interface CommentsProps {
    articleId: string;
}

export function Comments({ articleId }: CommentsProps) {
    const { user } = useAuth();
    const { data: comments, isLoading } = useComments(articleId);
    const { mutate: addComment, isPending: isAdding } = useAddComment();
    const { mutate: deleteComment } = useDeleteComment();
    const [content, setContent] = useState("");
    const [replyingTo, setReplyingTo] = useState<Comment | null>(null);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!content.trim() || isAdding || !user) return;

        addComment({
            articleId,
            content: replyingTo ? `@${replyingTo.author.username} ${content}` : content,
            parentId: replyingTo?.id || undefined
        }, {
            onSuccess: () => {
                setContent("");
                setReplyingTo(null);
            }
        });
    };

    if (isLoading) return <div className="py-8 text-center text-muted-foreground animate-pulse">Loading discussion...</div>;

    // Organise comments into top-level and replies
    const mainComments = comments?.filter(c => !c.parentId) || [];
    const replies = comments?.filter(c => c.parentId) || [];

    return (
        <div className="pt-20 pb-12 border-t border-border/50 max-w-4xl mx-auto px-4 md:px-8" id="comments">
            <h3 className="text-2xl font-bold mb-8 flex items-center gap-2">
                <MessageCircle className="w-6 h-6" />
                Discussion ({comments?.length || 0})
            </h3>

            {/* Input */}
            {user ? (
                <div className="mb-10">
                    {replyingTo && (
                        <div className="flex items-center justify-between px-4 py-2 bg-primary/10 rounded-t-xl border-t border-x border-primary/20">
                            <span className="text-xs font-medium text-primary">
                                Replying to <span className="font-bold">@{replyingTo.author.username}</span>
                            </span>
                            <button onClick={() => setReplyingTo(null)} className="text-primary hover:text-primary/70">
                                <X className="w-3 h-3" />
                            </button>
                        </div>
                    )}
                    <form onSubmit={handleSubmit} className="flex gap-4 items-start">
                        <div className="w-10 h-10 rounded-full bg-muted overflow-hidden shrink-0 mt-1">
                            {user.avatarUrl ? (
                                <img src={user.avatarUrl || undefined} alt={user.username || 'User'} className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center bg-primary/10 text-primary font-bold">
                                    {user.username ? user.username.charAt(0).toUpperCase() : 'U'}
                                </div>
                            )}
                        </div>
                        <div className="flex-1 relative">
                            <textarea
                                value={content}
                                onChange={(e) => setContent(e.target.value)}
                                placeholder={replyingTo ? "Write a reply..." : "What are your thoughts? (Use @ to mention)"}
                                className={`w-full bg-card border border-border ${replyingTo ? 'rounded-b-xl' : 'rounded-xl'} p-4 min-h-[100px] outline-none focus:border-primary transition-colors text-base resize-y`}
                            />
                            <button
                                type="submit"
                                disabled={!content.trim() || isAdding}
                                className="absolute bottom-4 right-4 p-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 transition-colors"
                            >
                                <Send className="w-4 h-4" />
                            </button>
                        </div>
                    </form>
                </div>
            ) : (
                <div className="mb-10 p-6 bg-muted/30 rounded-xl text-center">
                    <p className="text-muted-foreground mb-4">Log in to join the discussion.</p>
                    <Link href="/login" className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-bold">
                        Log In
                    </Link>
                </div>
            )}

            {/* List */}
            <div className="space-y-8">
                {mainComments.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8 italic">No comments yet. Be the first to share your thoughts!</p>
                ) : (
                    mainComments.map((comment) => {
                        const commentReplies = replies.filter(r => r.parentId === comment.id);
                        return (
                            <CommentWithReplies
                                key={comment.id}
                                comment={comment}
                                replies={commentReplies}
                                user={user}
                                onDelete={deleteComment}
                                onReply={setReplyingTo}
                            />
                        );
                    })
                )}
            </div>
        </div>
    );
}

function CommentWithReplies({ comment, replies, user, onDelete, onReply }: {
    comment: Comment,
    replies: Comment[],
    user: any,
    onDelete: (id: string) => void,
    onReply: (comment: Comment) => void
}) {
    const [showReplies, setShowReplies] = useState(false);
    const replyCount = replies.length;

    return (
        <div className="space-y-4">
            <CommentItem
                comment={comment}
                user={user}
                onDelete={onDelete}
                onReply={onReply}
            />

            {/* Show/Hide Replies Button */}
            {replyCount > 0 && (
                <div className="ml-8 md:ml-12">
                    <button
                        onClick={() => setShowReplies(!showReplies)}
                        className="flex items-center gap-2 text-xs font-medium text-primary hover:text-primary/80 transition-colors py-1 px-2 hover:bg-primary/5 rounded-lg"
                    >
                        <MessageCircle className="w-3.5 h-3.5" />
                        {showReplies ? 'Hide' : 'Show'} {replyCount} {replyCount === 1 ? 'reply' : 'replies'}
                    </button>
                </div>
            )}

            {/* Replies */}
            {showReplies && replyCount > 0 && (
                <div className="ml-8 md:ml-12 space-y-4 border-l-2 border-border/30 pl-4 md:pl-6 animate-in fade-in slide-in-from-top-2 duration-300">
                    {replies.map(reply => (
                        <CommentItem
                            key={reply.id}
                            comment={reply}
                            user={user}
                            onDelete={onDelete}
                            onReply={onReply}
                            isReply
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

function CommentItem({ comment, user, onDelete, onReply, isReply = false }: {
    comment: Comment,
    user: any,
    onDelete: (id: string) => void,
    onReply: (comment: Comment) => void,
    isReply?: boolean
}) {
    return (
        <div className={`flex gap-3 md:gap-4 group animate-in fade-in slide-in-from-bottom-2 duration-500 ${isReply ? 'scale-95 origin-left' : ''}`}>
            <Link href={`/profile/${comment.author.username}`} className={`${isReply ? 'w-8 h-8' : 'w-10 h-10'} rounded-full bg-muted overflow-hidden shrink-0 border border-transparent hover:border-primary transition-colors cursor-pointer`}>
                {comment.author.avatarUrl ? (
                    <img src={comment.author.avatarUrl || undefined} alt={comment.author.username || 'User'} className="w-full h-full object-cover" />
                ) : (
                    <div className="w-full h-full flex items-center justify-center bg-primary/10 text-primary font-bold text-xs">
                        {(comment.author.displayName || comment.author.username || 'U').charAt(0).toUpperCase()}
                    </div>
                )}
            </Link>
            <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                    <Link href={`/profile/${comment.author.username}`} className="font-bold text-sm hover:text-primary transition-colors cursor-pointer line-clamp-1">
                        {comment.author.displayName || comment.author.username}
                    </Link>
                    <span className="text-[10px] md:text-xs text-muted-foreground whitespace-nowrap">• {(() => {
                        try {
                            const date = 'toDate' in (comment.createdAt as any)
                                ? (comment.createdAt as any).toDate()
                                : new Date(comment.createdAt);
                            return formatDistanceToNow(date, { addSuffix: true });
                        } catch (e) {
                            return "";
                        }
                    })()}</span>

                    <div className="ml-auto flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {user && (
                            <button
                                onClick={() => onReply(comment)}
                                className="p-1 px-2 text-[10px] font-bold text-muted-foreground hover:text-primary hover:bg-primary/10 rounded transition-all flex items-center gap-1"
                            >
                                <Reply className="w-3 h-3" />
                                Reply
                            </button>
                        )}
                        {user && user.id === comment.userId && (
                            <button
                                onClick={() => {
                                    if (confirm('Delete comment?')) onDelete(String(comment.id));
                                }}
                                className="p-1 text-muted-foreground hover:text-destructive transition-all"
                            >
                                <Trash2 className="w-3.5 h-3.5" />
                            </button>
                        )}
                    </div>
                </div>
                <div className={`text-sm md:text-base text-foreground/90 whitespace-pre-wrap leading-relaxed ${isReply ? 'text-sm' : ''}`}>
                    {comment.content.split(/(@\w+)/g).map((part, i) =>
                        part.startsWith('@') ? <span key={i} className="text-primary font-medium hover:underline cursor-pointer">{part}</span> : part
                    )}
                </div>
            </div>
        </div>
    );
}
