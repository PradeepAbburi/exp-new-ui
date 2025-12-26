import { useAuth } from "@/hooks/use-auth";
import { Redirect } from "wouter";
import { Loader2, PenTool } from "lucide-react";

export default function Login() {
  const { user, isLoading } = useAuth();

  if (isLoading) return <div className="min-h-screen bg-background flex items-center justify-center"><Loader2 className="w-8 h-8 text-primary animate-spin" /></div>;
  if (user) return <Redirect to="/" />;

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/10 rounded-full blur-[100px] pointer-events-none" />
      
      <div className="relative z-10 w-full max-w-md bg-card/50 backdrop-blur-xl border border-white/5 p-8 rounded-3xl shadow-2xl">
        <div className="flex flex-col items-center text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center mb-6 shadow-lg shadow-primary/20">
            <PenTool className="w-8 h-8 text-primary-foreground" />
          </div>
          <h1 className="text-3xl font-display font-bold text-foreground mb-2">Welcome to Inkwell</h1>
          <p className="text-muted-foreground">A beautiful place to write and share your stories.</p>
        </div>

        <button
          onClick={() => window.location.href = "/api/login"}
          className="w-full flex items-center justify-center gap-3 bg-white text-black font-semibold py-4 rounded-xl hover:bg-gray-100 transition-colors shadow-lg shadow-white/5 mb-4"
        >
          <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" className="w-6 h-6" />
          Continue with Google
        </button>
        
        <p className="text-center text-xs text-muted-foreground mt-6">
          By continuing, you agree to our Terms of Service and Privacy Policy.
        </p>
      </div>
    </div>
  );
}
