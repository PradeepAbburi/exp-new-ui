import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { applyActionCode } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function EmailAction() {
    const [, setLocation] = useLocation();
    const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
    const [message, setMessage] = useState("");

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const mode = params.get("mode");
        const oobCode = params.get("oobCode");

        if (!mode || !oobCode) {
            setStatus("error");
            setMessage("Invalid verification link");
            return;
        }

        if (mode === "verifyEmail") {
            handleVerifyEmail(oobCode);
        } else if (mode === "resetPassword") {
            // Handle password reset
            setLocation(`/reset-password?oobCode=${oobCode}`);
        }
    }, []);

    const handleVerifyEmail = async (code: string) => {
        try {
            await applyActionCode(auth, code);
            setStatus("success");
            setMessage("Your email has been verified successfully!");

            // Redirect to home after 3 seconds
            setTimeout(() => {
                setLocation("/");
            }, 3000);
        } catch (error: any) {
            setStatus("error");
            setMessage(error.message || "Failed to verify email. The link may have expired.");
        }
    };

    return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-card border border-border rounded-2xl p-8 text-center shadow-xl">
                {status === "loading" && (
                    <>
                        <Loader2 className="w-16 h-16 text-primary animate-spin mx-auto mb-4" />
                        <h2 className="text-2xl font-bold mb-2">Verifying Email...</h2>
                        <p className="text-muted-foreground">Please wait while we verify your email address.</p>
                    </>
                )}

                {status === "success" && (
                    <>
                        <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-4">
                            <CheckCircle2 className="w-10 h-10 text-green-500" />
                        </div>
                        <h2 className="text-2xl font-bold mb-2 text-green-500">Email Verified!</h2>
                        <p className="text-muted-foreground mb-6">{message}</p>
                        <p className="text-sm text-muted-foreground">Redirecting you to the home page...</p>
                    </>
                )}

                {status === "error" && (
                    <>
                        <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4">
                            <XCircle className="w-10 h-10 text-red-500" />
                        </div>
                        <h2 className="text-2xl font-bold mb-2 text-red-500">Verification Failed</h2>
                        <p className="text-muted-foreground mb-6">{message}</p>
                        <Button onClick={() => setLocation("/login")} className="w-full">
                            Go to Login
                        </Button>
                    </>
                )}
            </div>
        </div>
    );
}
