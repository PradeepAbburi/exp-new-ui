import { useRoute } from "wouter";
import { useArticle } from "@/hooks/use-articles";
import { Sidebar } from "@/components/Sidebar";
import { Loader2, Calendar, User as UserIcon } from "lucide-react";
import { format } from "date-fns";
import SyntaxHighlighter from "react-syntax-highlighter";
import { atomOneDark } from "react-syntax-highlighter/dist/esm/styles/hljs";

export default function ArticleView() {
  const [match, params] = useRoute("/article/:id");
  const { data: article, isLoading } = useArticle(Number(params?.id));

  if (isLoading) return <div className="min-h-screen flex items-center justify-center bg-background"><Loader2 className="w-8 h-8 text-primary animate-spin" /></div>;
  if (!article) return <div className="min-h-screen flex items-center justify-center bg-background text-muted-foreground">Article not found</div>;

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <main className="lg:pl-64 min-h-screen">
        <div className="max-w-4xl mx-auto px-4 md:px-8 py-10">
          
          {/* Header */}
          <div className="mb-10 text-center">
            {article.coverImage && (
              <div className="w-full aspect-video rounded-3xl overflow-hidden mb-8 shadow-2xl">
                <img src={article.coverImage} alt={article.title} className="w-full h-full object-cover" />
              </div>
            )}
            
            <h1 className="text-4xl md:text-5xl font-display font-bold text-foreground mb-6 leading-tight">
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
                <span>{article.createdAt && format(new Date(article.createdAt), "MMMM d, yyyy")}</span>
              </div>
            </div>
          </div>

          {/* Content */}
          <article className="prose prose-invert prose-lg max-w-none space-y-8">
            {Array.isArray(article.content) && article.content.map((block: any) => (
              <div key={block.id}>
                {block.type === 'text' && (
                  <p className="whitespace-pre-wrap leading-loose text-lg text-gray-300">
                    {block.content}
                  </p>
                )}
                {block.type === 'image' && block.content && (
                  <div className="my-8 rounded-2xl overflow-hidden">
                    <img src={block.content} alt="" className="w-full h-auto" />
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
        </div>
      </main>
    </div>
  );
}
