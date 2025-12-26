import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useUpdateUser } from "@/hooks/use-users";
import { useUpload } from "@/hooks/use-upload";
import { Redirect } from "wouter";
import { Loader2, Upload, Camera } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function CompleteProfile() {
  const { user, isLoading } = useAuth();
  const { mutate: updateUser, isPending } = useUpdateUser();
  const { uploadFile, isUploading: isFileUploading } = useUpload();
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    username: user?.username || "",
    displayName: user?.displayName || "",
    bio: "",
    avatarUrl: user?.avatarUrl || "",
  });

  if (isLoading) return <div className="min-h-screen bg-background flex items-center justify-center"><Loader2 className="w-8 h-8 text-primary animate-spin" /></div>;
  if (!user) return <Redirect to="/login" />;
  if (user.isProfileComplete) return <Redirect to="/" />;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.username) {
      toast({ title: "Error", description: "Username is required", variant: "destructive" });
      return;
    }

    updateUser(
      { ...formData, isProfileComplete: true },
      {
        onSuccess: () => {
          toast({ title: "Welcome!", description: "Your profile is ready." });
          window.location.href = "/";
        },
        onError: (err) => {
          toast({ title: "Error", description: err.message, variant: "destructive" });
        }
      }
    );
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const res = await uploadFile(file);
      if (res) {
        setFormData(prev => ({ ...prev, avatarUrl: res.uploadURL }));
      }
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-card border border-border rounded-3xl p-8 shadow-2xl">
        <h1 className="text-3xl font-display font-bold text-foreground mb-2">Complete Your Profile</h1>
        <p className="text-muted-foreground mb-8">Tell us a bit about yourself before you start writing.</p>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Avatar Upload */}
          <div className="flex justify-center mb-8">
            <div className="relative group cursor-pointer">
              <div className="w-32 h-32 rounded-full overflow-hidden bg-muted border-4 border-card ring-2 ring-border group-hover:ring-primary transition-all">
                {formData.avatarUrl ? (
                  <img src={formData.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                    <Camera className="w-10 h-10" />
                  </div>
                )}
              </div>
              <input 
                type="file" 
                className="absolute inset-0 opacity-0 cursor-pointer" 
                accept="image/*"
                onChange={handleAvatarUpload}
                disabled={isFileUploading}
              />
              {isFileUploading && (
                <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center">
                  <Loader2 className="w-8 h-8 text-white animate-spin" />
                </div>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Username</label>
            <input
              value={formData.username}
              onChange={(e) => setFormData(p => ({ ...p, username: e.target.value }))}
              className="input-field"
              placeholder="@username"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Display Name</label>
            <input
              value={formData.displayName}
              onChange={(e) => setFormData(p => ({ ...p, displayName: e.target.value }))}
              className="input-field"
              placeholder="John Doe"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Bio</label>
            <textarea
              value={formData.bio}
              onChange={(e) => setFormData(p => ({ ...p, bio: e.target.value }))}
              className="input-field min-h-[100px] resize-none"
              placeholder="Tell us your story..."
            />
          </div>

          <button
            type="submit"
            disabled={isPending || isFileUploading}
            className="w-full btn-primary h-12 rounded-xl font-semibold text-lg flex items-center justify-center gap-2"
          >
            {isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : "Complete Profile"}
          </button>
        </form>
      </div>
    </div>
  );
}
