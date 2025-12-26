import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Redirect } from "wouter";
import { Loader2, PenTool } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

export default function Login() {
  const { user, isLoading, localLogin, localSignup } = useAuth();
  const { toast } = useToast();
  const [isSignup, setIsSignup] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    username: "",
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  if (user) {
    return <Redirect to={user.isProfileComplete ? "/" : "/complete-profile"} />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (isSignup) {
        if (!formData.username) {
          toast({
            title: "Error",
            description: "Username is required",
            variant: "destructive",
          });
          setIsSubmitting(false);
          return;
        }
        await localSignup({
          email: formData.email,
          password: formData.password,
          username: formData.username,
        });
        toast({
          title: "Success",
          description: "Account created successfully!",
        });
        setTimeout(() => {
          window.location.href = "/complete-profile";
        }, 1000);
      } else {
        await localLogin({
          email: formData.email,
          password: formData.password,
        });
        toast({
          title: "Success",
          description: "Logged in successfully!",
        });
        setTimeout(() => {
          window.location.href = "/";
        }, 1000);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Authentication failed",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/10 rounded-full blur-[100px] pointer-events-none" />

      <div className="relative z-10 w-full max-w-md bg-card/50 backdrop-blur-xl border border-white/5 p-8 rounded-3xl shadow-2xl">
        <div className="flex flex-col items-center text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center mb-6 shadow-lg shadow-primary/20">
            <PenTool className="w-8 h-8 text-primary-foreground" />
          </div>
          <h1 className="text-3xl font-display font-bold text-foreground mb-2">Inkwell</h1>
          <p className="text-muted-foreground">A beautiful place to write and share your stories.</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b border-white/10">
          <button
            onClick={() => setIsSignup(false)}
            className={`flex-1 py-2 text-sm font-semibold transition-colors ${
              !isSignup
                ? "text-primary border-b-2 border-primary"
                : "text-muted-foreground hover:text-foreground"
            }`}
            data-testid="button-login-tab"
          >
            Login
          </button>
          <button
            onClick={() => setIsSignup(true)}
            className={`flex-1 py-2 text-sm font-semibold transition-colors ${
              isSignup
                ? "text-primary border-b-2 border-primary"
                : "text-muted-foreground hover:text-foreground"
            }`}
            data-testid="button-signup-tab"
          >
            Sign Up
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4 mb-6">
          {isSignup && (
            <div>
              <label className="text-sm text-foreground mb-1 block">Username</label>
              <Input
                type="text"
                placeholder="Choose a username"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                disabled={isSubmitting}
                data-testid="input-username"
              />
            </div>
          )}

          <div>
            <label className="text-sm text-foreground mb-1 block">Email</label>
            <Input
              type="email"
              placeholder="your@email.com"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              disabled={isSubmitting}
              data-testid="input-email"
            />
          </div>

          <div>
            <label className="text-sm text-foreground mb-1 block">Password</label>
            <Input
              type="password"
              placeholder="••••••••"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              disabled={isSubmitting}
              data-testid="input-password"
            />
          </div>

          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full"
            data-testid={isSignup ? "button-signup-submit" : "button-login-submit"}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                {isSignup ? "Creating account..." : "Logging in..."}
              </>
            ) : isSignup ? (
              "Create Account"
            ) : (
              "Login"
            )}
          </Button>
        </form>

        {/* Divider */}
        <div className="relative mb-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-white/10" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-card/50 px-2 text-muted-foreground">Or continue with</span>
          </div>
        </div>

        {/* Google OAuth */}
        <button
          onClick={() => (window.location.href = "/api/login")}
          className="w-full flex items-center justify-center gap-3 bg-white text-black font-semibold py-4 rounded-xl hover:bg-gray-100 transition-colors shadow-lg shadow-white/5 mb-4"
          data-testid="button-google-oauth"
        >
          <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" className="w-6 h-6" />
          Continue with Google
        </button>

        <p className="text-center text-xs text-muted-foreground">
          By continuing, you agree to our Terms of Service and Privacy Policy.
        </p>
      </div>
    </div>
  );
}
