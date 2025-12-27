import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useLocation, Link } from "wouter";
import { Loader2, PenTool, Mail, ArrowLeft, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "@/lib/firebase";

export default function Login() {
  const { user, isLoading, localLogin, localSignup, googleLogin } = useAuth();
  const { toast } = useToast();
  const [isSignup, setIsSignup] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showEmailVerification, setShowEmailVerification] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    username: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (user) {
      if (!window.location.pathname.includes('complete-profile') && !user.isProfileComplete) {
        setLocation("/complete-profile");
      } else {
        setLocation("/");
      }
    }
  }, [user, setLocation]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  if (user) return null;

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
        setShowEmailVerification(true);
        toast({
          title: "Check Your Email!",
          description: "We've sent you a verification link. Click it to complete signup.",
        });
      } else {
        await localLogin({
          email: formData.email,
          password: formData.password,
        });
        toast({
          title: "Success",
          description: "Logged in successfully!",
        });
      }
    } catch (error: any) {
      if (error.code === 'auth/invalid-credential' || error.code === 'auth/wrong-password') {
        setShowForgotPassword(true);
      }
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Authentication failed",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!formData.email) {
      toast({
        title: "Email Required",
        description: "Please enter your email address first.",
        variant: "destructive",
      });
      return;
    }

    try {
      await sendPasswordResetEmail(auth, formData.email);
      toast({
        title: "Email Sent!",
        description: "Check your email for a password reset link.",
      });
      setShowForgotPassword(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send reset email. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen w-full lg:grid lg:grid-cols-2 bg-background">
      {/* Left Panel - Image & Branding (Desktop) */}
      <div className="hidden lg:flex flex-col justify-center relative bg-zinc-900 text-white overflow-hidden">
        <div className="absolute inset-0 bg-black/20 z-0">
          <img
            src="https://images.unsplash.com/photo-1455390582262-044cdead277a?q=80&w=2073&auto=format&fit=crop"
            className="w-full h-full object-cover opacity-60 mix-blend-overlay"
            alt="Writing Online"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-[#0097B2]/40 via-[#0097B2]/20 to-black/60" />
        </div>

        {/* Central Glass Card */}
        <div className="relative z-10 flex flex-col items-center justify-center h-full p-12">
          <div className="p-10 rounded-3xl bg-white/5 backdrop-blur-2xl border border-white/10 shadow-2xl flex flex-col items-center text-center max-w-md animate-in zoom-in-95 duration-700 slide-in-from-bottom-5">
            <div className="w-24 h-24 rounded-2xl overflow-hidden shadow-2xl bg-black mb-6 ring-4 ring-white/10">
              <img src="/logo.jpg" alt="Logo" className="w-full h-full object-cover" />
            </div>
            <h2 className="text-4xl font-display font-medium mb-4 tracking-tight">Expertene</h2>
            <p className="text-lg text-gray-300 leading-relaxed">
              "Writing online reimagined. Join the community of experts and share your voice."
            </p>
          </div>
        </div>
      </div>

      {/* Right Panel - Login Form */}
      <div className="flex items-center justify-center px-6 py-12 lg:p-8 relative">
        <Link href="/">
          <a className="absolute top-14 left-6 lg:top-16 lg:left-12 flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors group">
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Back
          </a>
        </Link>
        <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">

          {/* Mobile Logo Only */}
          <div className="flex flex-col items-center text-center lg:hidden">
            <div className="w-20 h-20 rounded-2xl overflow-hidden shadow-xl border border-border">
              <img src="/logo.jpg" alt="Expertene" className="w-full h-full object-cover" />
            </div>
          </div>

          <div className="flex flex-col space-y-2 text-center">
            <h1 className="text-2xl font-semibold tracking-tight">
              {isSignup ? "Create an account" : "Welcome back"}
            </h1>
            <p className="text-sm text-muted-foreground">
              {isSignup ? "Enter your email below to create your account" : "Enter your email below to login to your account"}
            </p>
          </div>

          <div className="grid gap-6">
            {/* Tabs */}
            <div className="flex gap-2 p-1 bg-muted rounded-lg">
              <button
                onClick={() => setIsSignup(false)}
                className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-all ${!isSignup
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
                  }`}
                data-testid="button-login-tab"
              >
                Login
              </button>
              <button
                onClick={() => setIsSignup(true)}
                className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-all ${isSignup
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
                  }`}
                data-testid="button-signup-tab"
              >
                Sign Up
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {isSignup && (
                <div className="grid gap-1">
                  <label className="text-sm font-medium leading-none">Username</label>
                  <Input
                    type="text"
                    placeholder="johndoe"
                    value={formData.username}
                    onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
                    disabled={isSubmitting}
                    data-testid="input-username"
                  />
                </div>
              )}

              <div className="grid gap-1">
                <label className="text-sm font-medium leading-none">Email</label>
                <Input
                  type="email"
                  placeholder="name@example.com"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  disabled={isSubmitting}
                  data-testid="input-email"
                />
              </div>

              <div className="grid gap-1">
                <label className="text-sm font-medium leading-none">Password</label>
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                    disabled={isSubmitting}
                    data-testid="input-password"
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
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
                  "Sign In"
                )}
              </Button>
            </form>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
              </div>
            </div>

            <Button
              type="button"
              onClick={async () => {
                try {
                  await googleLogin();
                  toast({ title: "Success", description: "Logged in with Google!" });
                } catch (e: any) {
                  toast({ title: "Error", description: e.message || "Google Login failed", variant: "destructive" });
                }
              }}
              variant="outline"
              className="w-full flex items-center gap-2"
              data-testid="button-google-oauth"
            >
              <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" className="w-4 h-4" />
              Google
            </Button>
          </div>

          {showEmailVerification && (
            <div className="p-5 bg-primary/10 border border-primary/20 rounded-xl space-y-3 animate-in fade-in slide-in-from-top-2 duration-500">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                  <Mail className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-sm mb-1">Verification Email Sent!</h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    We've sent a verification link to <span className="font-medium text-foreground">{formData.email}</span>.
                    Click the link in your email to verify your account.
                  </p>
                </div>
              </div>
              <button
                onClick={async () => {
                  try {
                    // Resend verification email logic
                    const { sendEmailVerification } = await import("firebase/auth");
                    if (auth.currentUser) {
                      await sendEmailVerification(auth.currentUser);
                      toast({
                        title: "Email Resent!",
                        description: "Check your inbox for the new verification link.",
                      });
                    }
                  } catch (error) {
                    toast({
                      title: "Error",
                      description: "Failed to resend email. Please try again.",
                      variant: "destructive",
                    });
                  }
                }}
                className="w-full py-2 px-4 text-xs font-medium text-primary hover:text-primary/80 bg-primary/5 hover:bg-primary/10 rounded-lg transition-colors"
              >
                Resend Verification Email
              </button>
            </div>
          )}

          {showForgotPassword && !isSignup && (
            <div className="text-center">
              <button
                onClick={handleForgotPassword}
                className="text-sm text-muted-foreground hover:text-primary underline underline-offset-4"
              >
                Forgot your password?
              </button>
            </div>
          )}

          <p className="px-8 text-center text-sm text-muted-foreground">
            By clicking continue, you agree to our{" "}
            <a href="#" className="underline underline-offset-4 hover:text-primary">
              Terms of Service
            </a>{" "}
            and{" "}
            <a href="#" className="underline underline-offset-4 hover:text-primary">
              Privacy Policy
            </a>
            .
          </p>
        </div>
      </div>
    </div>
  );
}
