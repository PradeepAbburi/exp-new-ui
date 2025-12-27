import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useLocation, Redirect } from "wouter";
import { Sidebar } from "@/components/Sidebar";
import { Loader2, CheckCircle } from "lucide-react";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";

export default function CompleteProfile() {
  const { user } = useAuth();
  const [_, navigate] = useLocation();
  const { toast } = useToast();
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [isVerified, setIsVerified] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Check verification status from URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('verified') === 'true') {
      setIsVerified(true);
      toast({
        title: "Email Verified!",
        description: "Your email has been successfully verified.",
      });
    }
  }, [toast]);

  const handleComplete = async () => {
    if (!user || !displayName.trim()) {
      toast({
        title: "Missing Information",
        description: "Please enter your display name.",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);
    try {
      await updateDoc(doc(db, "users", user.id), {
        displayName: displayName.trim(),
        bio: bio.trim() || null,
        isProfileComplete: true,
        emailVerified: true,
        updatedAt: new Date(),
      });

      toast({
        title: "Profile Complete!",
        description: "Welcome to Article Forge!",
      });

      navigate("/");
    } catch (error) {
      console.error("Profile update error:", error);
      toast({
        title: "Error",
        description: "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (!user) return <Redirect to="/login" />;

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <main className="md:pl-20 lg:pl-64 min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="bg-card border border-border rounded-3xl p-8 shadow-2xl">
            {isVerified && (
              <div className="flex items-center gap-3 bg-green-500/10 border border-green-500/20 rounded-xl p-4 mb-6">
                <CheckCircle className="w-5 h-5 text-green-500" />
                <p className="text-sm text-green-500 font-medium">Email verified successfully!</p>
              </div>
            )}

            <h1 className="text-3xl font-bold mb-2">Complete Your Profile</h1>
            <p className="text-muted-foreground mb-8">Tell us a bit about yourself</p>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-2">Display Name *</label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Your name"
                  className="w-full px-4 py-3 bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Bio (optional)</label>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Tell us about yourself..."
                  rows={4}
                  className="w-full px-4 py-3 bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary transition-all resize-none"
                />
              </div>

              <button
                onClick={handleComplete}
                disabled={isSaving || !displayName.trim()}
                className="w-full bg-primary text-white py-3 rounded-xl font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Complete Profile"
                )}
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
