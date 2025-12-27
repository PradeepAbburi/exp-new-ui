import { useState, useEffect } from "react";
import { useCreateArticle } from "@/hooks/use-articles";
import { Sidebar } from "@/components/Sidebar";
import { Editor, type Block } from "@/components/Editor";
import { useAuth } from "@/hooks/use-auth";
import { Redirect, useLocation } from "wouter";
import { Loader2, ArrowLeft, Save, Globe, Lock, ChevronDown, PenTool } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function Write() {
  const { user, isLoading } = useAuth();
  const { mutate: createArticle, isPending } = useCreateArticle();
  const { toast } = useToast();
  const [_, setLocation] = useLocation();

  const [title, setTitle] = useState("");
  const [coverImage, setCoverImage] = useState("");
  const [blocks, setBlocks] = useState<Block[]>([{ id: '1', type: 'text', content: '' }]);
  const [tags, setTags] = useState<string[]>([]);
  const [isPublic, setIsPublic] = useState(true); // Default to Public
  const [accessKey, setAccessKey] = useState("");
  const [isInitializing, setIsInitializing] = useState(true);
  const [progress, setProgress] = useState(0);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showExitDialog, setShowExitDialog] = useState(false);

  // Track changes to content
  useEffect(() => {
    const hasContent = title.trim() !== '' ||
      coverImage !== '' ||
      blocks.some(b => b.content !== '') ||
      tags.length > 0;
    setHasUnsavedChanges(hasContent);
  }, [title, coverImage, blocks, tags]);

  // Warn before leaving page with unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

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

  if (isLoading || isInitializing) {
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
            Gathering your creative tools...
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

  if (!user) return <Redirect to="/login" />;

  const handlePublish = async () => {
    if (!title.trim()) {
      toast({ title: "Missing Title", description: "Please add a title to your page.", variant: "destructive" });
      return;
    }

    if (!isPublic && !accessKey.trim()) {
      toast({ title: "Password Required", description: "Private pages require an access password to be secure.", variant: "destructive" });
      return;
    }

    createArticle({
      title,
      coverImage,
      content: blocks,
      isPublic,
      accessKey,
      tags,
      authorId: user.id
    }, {
      onSuccess: (data) => {
        setHasUnsavedChanges(false); // Clear unsaved changes flag
        toast({ title: "Success!", description: isPublic ? "Page published successfully." : "Draft saved successfully." });
        setLocation(`/article/${data.id}`);
      },
      onError: () => {
        toast({ title: "Error", description: "Failed to save Page.", variant: "destructive" });
      }
    });
  };

  const handleBack = () => {
    if (hasUnsavedChanges) {
      setShowExitDialog(true);
    } else {
      history.back();
    }
  };

  const handleDiscard = () => {
    setShowExitDialog(false);
    history.back(); // Go back
  };

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <main className="md:pl-20 lg:pl-64 min-h-screen pb-20 md:pb-0">
        {/* Top Bar */}
        <div className="sticky top-0 z-40 bg-background/80 backdrop-blur-md border-b border-border px-3 sm:px-6 lg:px-8 py-3 sm:py-4">
          <div className="flex items-center justify-between gap-2 sm:gap-4 flex-wrap">
            <div className="flex items-center gap-2 sm:gap-4">
              <button onClick={handleBack} className="lg:hidden p-2 -ml-2">
                <ArrowLeft className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>
              <span className="text-muted-foreground font-medium text-xs sm:text-sm hidden sm:block">
                {isPublic ? "Publishing as Public" : "Saving as Private"}
              </span>
            </div>

            <div className="flex items-center gap-2 sm:gap-4">
              <DropdownMenu.Root>
                <DropdownMenu.Trigger asChild>
                  <button className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 rounded-lg border border-border bg-card hover:bg-muted text-xs sm:text-sm font-medium transition-colors">
                    {isPublic ? <Globe className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary" /> : <Lock className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-muted-foreground" />}
                    <span className="hidden xs:inline">{isPublic ? "Public" : "Private"}</span>
                    <ChevronDown className="w-3 h-3 opacity-50" />
                  </button>
                </DropdownMenu.Trigger>
                <DropdownMenu.Content align="end" className="w-[calc(100vw-2rem)] sm:w-72 max-w-sm bg-card border border-border rounded-xl shadow-xl p-3 z-50 animate-in fade-in zoom-in-95 duration-200">
                  <DropdownMenu.Item onClick={() => setIsPublic(true)} className="flex items-center gap-2 px-3 py-2 text-sm text-foreground hover:bg-muted rounded-lg cursor-pointer outline-none mb-1">
                    <Globe className="w-4 h-4 text-primary shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="font-bold">Public</p>
                      <p className="text-[10px] text-muted-foreground">Visible to everyone in discovery</p>
                    </div>
                  </DropdownMenu.Item>
                  <DropdownMenu.Item onClick={() => setIsPublic(false)} className="flex items-center gap-2 px-3 py-2 text-sm text-foreground hover:bg-muted rounded-lg cursor-pointer outline-none mb-2">
                    <Lock className="w-4 h-4 text-muted-foreground shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="font-bold">Private</p>
                      <p className="text-[10px] text-muted-foreground">Only accessible via Key</p>
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
                          className="flex-1 bg-muted px-2 py-1.5 rounded text-xs border border-transparent focus:border-primary outline-none font-mono min-w-0"
                        />
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            toast({ title: "Password Set", description: "This Page will be protected by your password." });
                          }}
                          className="p-1 px-2 bg-primary/20 text-primary text-[10px] font-bold rounded hover:bg-primary/30 transition-colors shrink-0"
                        >
                          Save
                        </button>
                      </div>
                      <p className="text-[9px] text-muted-foreground mt-2">Viewers will need this exact password to unlock the Page.</p>
                    </div>
                  )}
                </DropdownMenu.Content>
              </DropdownMenu.Root>

              <button
                onClick={handlePublish}
                disabled={isPending}
                className="btn-primary px-3 sm:px-6 py-2 rounded-xl font-semibold flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm"
              >
                {isPending ? <Loader2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 animate-spin" /> : <Save className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
                <span className="hidden xs:inline">{isPublic ? "Publish" : "Save"}</span>
                <span className="xs:hidden">Save</span>
              </button>
            </div>
          </div>
        </div>

        <div className="py-6 sm:py-10">
          <Editor
            title={title}
            onTitleChange={setTitle}
            coverImage={coverImage}
            onCoverImageChange={setCoverImage}
            initialBlocks={blocks}
            onChange={setBlocks}
            tags={tags}
            onTagsChange={setTags}
          />
        </div>
      </main>

      <AlertDialog open={showExitDialog} onOpenChange={setShowExitDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Unsaved Changes</AlertDialogTitle>
            <AlertDialogDescription>
              You have unsaved changes. Are you sure you want to discard them and leave?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDiscard} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Discard Changes
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
