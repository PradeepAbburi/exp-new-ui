import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useUpdateUser } from "@/hooks/use-users";
import { Sidebar } from "@/components/Sidebar";
import { Loader2, User, Mail, Key, Save, ArrowLeft, BarChart3, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Link, useLocation } from "wouter";
import { auth } from "@/lib/firebase";
import { sendPasswordResetEmail } from "firebase/auth";

export default function Account() {
    const { user, isLoading: authLoading, logout } = useAuth();
    const [, setLocation] = useLocation();
    const { mutate: updateUser, isPending } = useUpdateUser();
    const { toast } = useToast();

    const [formData, setFormData] = useState({
        displayName: user?.displayName || "",
        username: user?.username || "",
    });

    const [isResettingPassword, setIsResettingPassword] = useState(false);

    if (authLoading) return <div className="min-h-screen bg-background flex items-center justify-center"><Loader2 className="w-8 h-8 text-primary animate-spin" /></div>;
    if (!user) return null;

    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();
        updateUser(formData, {
            onSuccess: () => {
                toast({ title: "Account Updated", description: "Your account settings have been saved successfully." });
            },
            onError: (err) => {
                toast({ title: "Error", description: err.message, variant: "destructive" });
            }
        });
    };

    const handlePasswordReset = async () => {
        if (!user.email) {
            toast({ title: "Error", description: "No email associated with this account", variant: "destructive" });
            return;
        }

        setIsResettingPassword(true);
        try {
            await sendPasswordResetEmail(auth, user.email);
            toast({ title: "Email Sent", description: "Password reset link has been sent to your email." });
        } catch (error: any) {
            toast({ title: "Error", description: error.message, variant: "destructive" });
        } finally {
            setIsResettingPassword(false);
        }
    };

    return (
        <div className="min-h-screen bg-background">
            <Sidebar />
            <main className="md:pl-20 lg:pl-64 min-h-screen pb-20 md:pb-0">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
                    <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center gap-4">
                            <button onClick={() => history.back()} className="p-2 hover:bg-muted rounded-full transition-colors">
                                <ArrowLeft className="w-6 h-6" />
                            </button>
                            <h1 className="text-4xl font-display font-bold text-foreground">Account Settings</h1>
                        </div>
                        <div className="flex items-center gap-2">
                            <Link href="/bin">
                                <button className="flex items-center gap-2 px-4 py-2 bg-muted hover:bg-muted/80 rounded-xl transition-colors font-medium">
                                    <Trash2 className="w-4 h-4" />
                                    <span className="hidden sm:inline">Bin</span>
                                </button>
                            </Link>
                            <Link href="/analytics">
                                <button className="flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary hover:bg-primary/20 rounded-xl transition-colors font-medium">
                                    <BarChart3 className="w-4 h-4" />
                                    <span className="hidden sm:inline">Analytics</span>
                                </button>
                            </Link>
                        </div>
                    </div>

                    <form onSubmit={handleSave} className="space-y-6">
                        {/* Account Information */}
                        <div className="bg-card border border-border rounded-3xl p-8 shadow-xl">
                            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                                <User className="w-6 h-6 text-primary" />
                                Account Information
                            </h2>

                            <div className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Display Name</label>
                                    <div className="relative">
                                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                        <input
                                            className="w-full bg-muted border border-border rounded-xl pl-10 pr-4 py-3 outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                                            placeholder="Your display name"
                                            value={formData.displayName}
                                            onChange={(e) => setFormData(p => ({ ...p, displayName: e.target.value }))}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Username</label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">@</span>
                                        <input
                                            className="w-full bg-muted border border-border rounded-xl pl-8 pr-4 py-3 outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                                            placeholder="username"
                                            value={formData.username}
                                            onChange={(e) => setFormData(p => ({ ...p, username: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '') }))}
                                        />
                                    </div>
                                    <p className="text-xs text-muted-foreground">Only lowercase letters, numbers, and underscores</p>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Email Address</label>
                                    <div className="relative opacity-60">
                                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                        <input
                                            className="w-full bg-muted border border-border rounded-xl pl-10 pr-4 py-3 outline-none cursor-not-allowed"
                                            value={user.email || ""}
                                            disabled
                                        />
                                    </div>
                                    <p className="text-xs text-muted-foreground">Email cannot be changed for security reasons</p>
                                </div>
                            </div>
                        </div>

                        {/* Password Section */}
                        <div className="bg-card border border-border rounded-3xl p-8 shadow-xl">
                            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                                <Key className="w-6 h-6 text-primary" />
                                Password
                            </h2>

                            <button
                                type="button"
                                onClick={handlePasswordReset}
                                disabled={isResettingPassword}
                                className="px-6 py-3 bg-muted hover:bg-muted/80 border border-border rounded-xl font-medium transition-colors flex items-center gap-2"
                            >
                                {isResettingPassword ? <Loader2 className="w-4 h-4 animate-spin" /> : <Key className="w-4 h-4" />}
                                Send Password Reset Email
                            </button>
                            <p className="text-xs text-muted-foreground mt-2">You'll receive an email with instructions to reset your password</p>
                        </div>

                        {/* Save Button */}
                        <div className="flex justify-end gap-4">
                            <button
                                type="button"
                                onClick={() => logout(undefined, { onSuccess: () => setLocation('/login') })}
                                className="px-6 py-3 border border-destructive/20 text-destructive hover:bg-destructive hover:text-white rounded-xl font-bold transition-all"
                            >
                                Sign Out
                            </button>
                            <button
                                type="submit"
                                disabled={isPending}
                                className="btn-primary px-8 py-3 rounded-xl font-bold shadow-lg shadow-primary/20 flex items-center gap-2"
                            >
                                {isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                                Save Changes
                            </button>
                        </div>
                    </form>
                </div>
            </main>
        </div>
    );
}
