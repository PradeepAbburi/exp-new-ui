import { useState } from "react";
import { useRoute, Link } from "wouter";
import { useUserProfile, useFollowUser, useUpdateUser } from "@/hooks/use-users";
import { useUserArticles, useDeleteArticle } from "@/hooks/use-articles";
import { useUpload } from "@/hooks/use-upload";
import { Sidebar } from "@/components/Sidebar";
import { ArticleCard } from "@/components/ArticleCard";
import { Loader2, UserPlus, Calendar, Camera, Trash2, Edit, Settings } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import clsx from "clsx";

import { ImageCropper } from "@/components/ImageCropper";
import { FollowListModal } from "@/components/FollowListModal";

export default function Profile() {
  const [match, params] = useRoute("/profile/:username");
  const { data: profileUser, isLoading } = useUserProfile(params?.username || "");
  const { user: currentUser } = useAuth();
  const { mutate: follow, isPending: isFollowing } = useFollowUser();
  const { uploadFile, isUploading } = useUpload();
  const { mutate: updateUser } = useUpdateUser();
  const { toast } = useToast();

  const [cropperOpen, setCropperOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [activeCropType, setActiveCropType] = useState<"avatar" | "banner" | null>(null);
  const [isLocalProcessing, setIsLocalProcessing] = useState(false);

  // Follow list modal state
  const [followModalOpen, setFollowModalOpen] = useState(false);
  const [followModalType, setFollowModalType] = useState<"followers" | "following">("followers");

  // Fetch articles for this user
  const { data: articles, isLoading: isLoadingArticles } = useUserArticles(profileUser?.id || "");
  const { mutate: deleteArticle, isPending: isDeleting } = useDeleteArticle();

  if (isLoading) return <div className="min-h-screen bg-background flex items-center justify-center"><Loader2 className="w-8 h-8 text-primary animate-spin" /></div>;
  if (!currentUser) {
    // Redirect to login if not authenticated
    window.location.href = '/login';
    return <div className="min-h-screen bg-background flex items-center justify-center"><Loader2 className="w-8 h-8 text-primary animate-spin" /></div>;
  }
  if (!profileUser) return <div className="min-h-screen bg-background flex items-center justify-center text-muted-foreground">User not found</div>;

  const isOwnProfile = currentUser?.id === profileUser.id;

  const handleFileSelect = (type: "avatar" | "banner") => (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && isOwnProfile) {
      const reader = new FileReader();
      reader.onload = () => {
        setSelectedImage(reader.result as string);
        setActiveCropType(type);
        setCropperOpen(true);
      };
      reader.readAsDataURL(file);
    }
    // Reset input so same file can be selected again
    e.target.value = "";
  };

  const handleCropComplete = async (blob: Blob) => {
    if (!activeCropType) return;
    setIsLocalProcessing(true);

    try {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64data = reader.result as string;
        const updates = activeCropType === "avatar"
          ? { avatarUrl: base64data }
          : { bannerUrl: base64data };

        // @ts-ignore
        updateUser(updates, {
          onSuccess: () => {
            toast({ title: "Updated", description: `${activeCropType === "avatar" ? "Profile picture" : "Banner"} updated!` });
            setIsLocalProcessing(false);
          },
          onError: () => {
            setIsLocalProcessing(false);
          }
        });
      };
      reader.readAsDataURL(blob);
    } catch (e) {
      console.error(e);
      setIsLocalProcessing(false);
      toast({ title: "Error", description: "Failed to process image", variant: "destructive" });
    }
    setActiveCropType(null);
  };

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <main className="md:pl-20 lg:pl-64 min-h-screen pb-20 md:pb-0 transition-all duration-300">
        <div className="w-full aspect-[4/1] bg-gradient-to-br from-primary/30 via-secondary/20 to-primary/40 relative group overflow-hidden border-b border-border">
          {profileUser.bannerUrl ? (
            <>
              <img src={profileUser.bannerUrl} alt="Banner" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black/10 group-hover:bg-black/20 transition-colors" />
            </>
          ) : (
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          )}

          {isOwnProfile && (
            <label className="absolute bottom-4 right-4 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full cursor-pointer transition-colors opacity-0 group-hover:opacity-100 z-10">
              <Camera className="w-5 h-5" />
              <input type="file" className="hidden" accept="image/*" onChange={handleFileSelect("banner")} disabled={isUploading || isLocalProcessing} />
            </label>
          )}
        </div>

        <div className="max-w-5xl mx-auto px-4 md:px-8 relative -mt-20">
          <div className="flex flex-col items-center gap-6 mb-8">
            <div className="relative group">
              <div className="w-40 h-40 rounded-full border-4 border-background bg-card overflow-hidden shadow-2xl shrink-0 relative">
                {profileUser.avatarUrl ? (
                  <img src={profileUser.avatarUrl} alt={profileUser.username} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-primary/30 to-secondary/30 flex items-center justify-center">
                    <span className="text-4xl font-bold text-primary">{(profileUser.displayName || profileUser.username || "U").charAt(0).toUpperCase()}</span>
                  </div>
                )}
              </div>
              {isOwnProfile && (
                <label className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity z-10">
                  <Camera className="w-8 h-8 text-white" />
                  <input type="file" className="hidden" accept="image/*" onChange={handleFileSelect("avatar")} disabled={isUploading} />
                </label>
              )}
              {(isUploading || isLocalProcessing) && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full z-20">
                  <Loader2 className="w-8 h-8 text-white animate-spin" />
                </div>
              )}
            </div>

            <div className="pb-4 flex flex-col items-center gap-4 w-full">
              <div className="flex gap-6 px-6 py-3 bg-white/5 backdrop-blur-md rounded-2xl border border-white/10">
                <div className="text-center">
                  <p className="text-xl font-bold text-white leading-none">{profileUser.stats?.posts || 0}</p>
                  <p className="text-[10px] uppercase tracking-wider text-white/60 font-bold mt-1">Posts</p>
                </div>
                <div className="w-px h-8 bg-white/10" />
                <button
                  onClick={() => {
                    setFollowModalType("followers");
                    setFollowModalOpen(true);
                  }}
                  className="text-center hover:bg-white/5 px-3 rounded-lg transition-colors cursor-pointer"
                >
                  <p className="text-xl font-bold text-white leading-none">{profileUser.stats?.followers || 0}</p>
                  <p className="text-[10px] uppercase tracking-wider text-white/60 font-bold mt-1">Followers</p>
                </button>
                <div className="w-px h-8 bg-white/10" />
                <button
                  onClick={() => {
                    setFollowModalType("following");
                    setFollowModalOpen(true);
                  }}
                  className="text-center hover:bg-white/5 px-3 rounded-lg transition-colors cursor-pointer"
                >
                  <p className="text-xl font-bold text-white leading-none">{profileUser.stats?.following || 0}</p>
                  <p className="text-[10px] uppercase tracking-wider text-white/60 font-bold mt-1">Following</p>
                </button>
              </div>

              <div className="bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 px-8 py-4 text-center w-full max-w-md">
                <h1 className="text-2xl font-bold font-display text-white mb-1">
                  {profileUser.displayName || profileUser.username}
                </h1>
                <p className="text-white/60 font-medium text-sm">@{profileUser.username}</p>
              </div>

              {!isOwnProfile && (
                <button
                  onClick={() => follow({ targetId: profileUser.id, isFollowing: profileUser.isFollowing })}
                  disabled={isFollowing}
                  className={clsx(
                    "px-8 py-3 rounded-2xl flex items-center gap-2 font-bold transition-all transform active:scale-95 shadow-lg",
                    profileUser.isFollowing
                      ? "bg-muted text-foreground border border-border hover:bg-muted/80"
                      : "bg-primary text-white hover:bg-primary/90 shadow-primary/20"
                  )}
                >
                  <UserPlus className={clsx("w-4 h-4", profileUser.isFollowing && "rotate-45")} />
                  {profileUser.isFollowing ? "Following" : "Follow"}
                </button>
              )}

              {isOwnProfile && (
                <Link href="/account">
                  <button className="md:hidden px-8 py-3 rounded-2xl flex items-center gap-2 font-bold transition-all transform active:scale-95 shadow-lg bg-white/10 border border-white/20 text-white hover:bg-white/20">
                    <Settings className="w-4 h-4" />
                    Settings
                  </button>
                </Link>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pb-10">
            <div className="md:col-span-1 space-y-6">
              <div className="bg-card border border-border rounded-2xl p-6">
                <h3 className="font-bold text-lg mb-4">About</h3>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  {profileUser.bio || "No bio yet."}
                </p>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="w-4 h-4" />
                  <span>Joined {profileUser.createdAt && format(new Date(profileUser.createdAt), 'MMMM yyyy')}</span>
                </div>
              </div>
            </div>

            <div className="md:col-span-2">
              <h3 className="font-bold text-2xl mb-6 font-display">Articles</h3>
              {isLoadingArticles ? (
                <div className="flex justify-center py-10"><Loader2 className="w-8 h-8 text-primary animate-spin" /></div>
              ) : articles && articles.length > 0 ? (
                <div className="grid gap-6">
                  {articles.filter((a: any) => !a.isArchived).map((article: any) => (
                    <div key={article.id} className="relative group">
                      <ArticleCard article={{ ...article, author: profileUser }} />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-card border border-border rounded-2xl p-10 text-center text-muted-foreground">
                  <p>No articles published yet.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <ImageCropper
          isOpen={cropperOpen}
          onClose={() => setCropperOpen(false)}
          imageSrc={selectedImage}
          onCropComplete={handleCropComplete}
          aspectRatio={activeCropType === 'banner' ? 4 : 1}
        />

        <FollowListModal
          isOpen={followModalOpen}
          onClose={() => setFollowModalOpen(false)}
          userId={profileUser.id}
          type={followModalType}
          currentUserId={currentUser?.id}
        />
      </main>
    </div>
  );
}
