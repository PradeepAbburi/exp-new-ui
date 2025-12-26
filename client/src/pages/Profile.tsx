import { useRoute } from "wouter";
import { useUserProfile, useFollowUser } from "@/hooks/use-users";
import { Sidebar } from "@/components/Sidebar";
import { Loader2, UserPlus, Calendar } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { format } from "date-fns";

export default function Profile() {
  const [match, params] = useRoute("/profile/:username");
  const { data: profileUser, isLoading } = useUserProfile(params?.username || "");
  const { user: currentUser } = useAuth();
  const { mutate: follow, isPending: isFollowing } = useFollowUser();

  if (isLoading) return <div className="min-h-screen bg-background flex items-center justify-center"><Loader2 className="w-8 h-8 text-primary animate-spin" /></div>;
  if (!profileUser) return <div className="min-h-screen bg-background flex items-center justify-center text-muted-foreground">User not found</div>;

  const isOwnProfile = currentUser?.id === profileUser.id;

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <main className="lg:pl-64 min-h-screen">
        {/* Banner */}
        <div className="h-64 bg-gradient-to-r from-primary/20 to-secondary relative">
          <div className="absolute inset-0 bg-black/20" />
        </div>

        <div className="max-w-5xl mx-auto px-4 md:px-8 relative -mt-20">
          <div className="flex flex-col md:flex-row items-end md:items-center gap-6 mb-8">
            <div className="w-40 h-40 rounded-full border-4 border-background bg-card overflow-hidden shadow-2xl shrink-0">
               {profileUser.avatarUrl ? (
                 <img src={profileUser.avatarUrl} alt={profileUser.username} className="w-full h-full object-cover" />
               ) : (
                 <div className="w-full h-full bg-muted" />
               )}
            </div>
            
            <div className="flex-1 pb-4">
               <h1 className="text-3xl font-bold font-display text-white mb-1">
                 {profileUser.displayName || profileUser.username}
               </h1>
               <p className="text-white/80">@{profileUser.username}</p>
            </div>

            <div className="pb-4">
              {!isOwnProfile && (
                <button 
                  onClick={() => follow(profileUser.id)}
                  disabled={isFollowing}
                  className="btn-primary px-6 py-2 rounded-xl flex items-center gap-2 font-medium"
                >
                  <UserPlus className="w-4 h-4" />
                  Follow
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
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
              <div className="bg-card border border-border rounded-2xl p-8 text-center text-muted-foreground">
                <p>Recent activity will appear here.</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
