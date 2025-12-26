import { useState } from "react";
import { useCreateArticle } from "@/hooks/use-articles";
import { Sidebar } from "@/components/Sidebar";
import { Editor, type Block } from "@/components/Editor";
import { useAuth } from "@/hooks/use-auth";
import { Redirect, useLocation } from "wouter";
import { Loader2, ArrowLeft, Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function Write() {
  const { user, isLoading } = useAuth();
  const { mutate: createArticle, isPending } = useCreateArticle();
  const { toast } = useToast();
  const [_, setLocation] = useLocation();

  const [title, setTitle] = useState("");
  const [coverImage, setCoverImage] = useState("");
  const [blocks, setBlocks] = useState<Block[]>([{ id: '1', type: 'text', content: '' }]);
  const [isPublic, setIsPublic] = useState(false);

  if (isLoading) return null;
  if (!user) return <Redirect to="/login" />;

  const handlePublish = async () => {
    if (!title.trim()) {
      toast({ title: "Missing Title", description: "Please add a title to your story.", variant: "destructive" });
      return;
    }

    createArticle({
      title,
      coverImage,
      content: blocks,
      isPublic,
      authorId: user.id
    }, {
      onSuccess: (data) => {
        toast({ title: "Success!", description: "Article published successfully." });
        setLocation(`/article/${data.id}`);
      },
      onError: () => {
        toast({ title: "Error", description: "Failed to publish article.", variant: "destructive" });
      }
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <main className="lg:pl-64 min-h-screen">
        {/* Top Bar */}
        <div className="sticky top-0 z-40 bg-background/80 backdrop-blur-md border-b border-border px-8 py-4 flex items-center justify-between">
           <div className="flex items-center gap-4">
             <button onClick={() => history.back()} className="lg:hidden p-2 -ml-2">
               <ArrowLeft className="w-6 h-6" />
             </button>
             <span className="text-muted-foreground font-medium">Drafting...</span>
           </div>

           <div className="flex items-center gap-4">
             <div className="flex items-center gap-2 mr-4">
                <input 
                  type="checkbox" 
                  id="public" 
                  checked={isPublic} 
                  onChange={(e) => setIsPublic(e.target.checked)}
                  className="rounded border-input bg-card text-primary focus:ring-primary"
                />
                <label htmlFor="public" className="text-sm font-medium cursor-pointer">Public Post</label>
             </div>
             
             <button
               onClick={handlePublish}
               disabled={isPending}
               className="btn-primary px-6 py-2 rounded-xl font-semibold flex items-center gap-2"
             >
               {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
               Publish
             </button>
           </div>
        </div>

        <div className="px-4 md:px-8 py-10">
          <Editor 
            title={title}
            onTitleChange={setTitle}
            coverImage={coverImage}
            onCoverImageChange={setCoverImage}
            initialBlocks={blocks}
            onChange={setBlocks}
          />
        </div>
      </main>
    </div>
  );
}
