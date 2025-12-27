import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useUpdateUser } from "@/hooks/use-users";
import { Sidebar } from "@/components/Sidebar";
import { Loader2, User, Mail, Shield, Trash2, Camera, Save, ArrowLeft, Palette } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ImageCropper } from "@/components/ImageCropper";
import { useLocation } from "wouter";

export default function Settings() {
    const { user, isLoading: authLoading, logout } = useAuth();
    const { mutate: updateUser, isPending } = useUpdateUser();
    const { toast } = useToast();
    const [, setLocation] = useLocation();

    const [formData, setFormData] = useState({
        displayName: user?.displayName || "",
        bio: user?.bio || "",
        avatarUrl: user?.avatarUrl || "",
        bannerUrl: user?.bannerUrl || "",
        buyMeACoffeeUrl: user?.buyMeACoffeeUrl || "",
    });

    const [cropperOpen, setCropperOpen] = useState(false);
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const [activeCropType, setActiveCropType] = useState<"avatar" | "banner" | null>(null);
    const [isLocalProcessing, setIsLocalProcessing] = useState(false);
    const [themeColor, setThemeColor] = useState(localStorage.getItem('theme-color') || '189 100% 35%');

    const hexToHSL = (hex: string) => {
        let r = 0, g = 0, b = 0;
        if (hex.length === 4) {
            r = parseInt("0x" + hex[1] + hex[1]);
            g = parseInt("0x" + hex[2] + hex[2]);
            b = parseInt("0x" + hex[3] + hex[3]);
        } else if (hex.length === 7) {
            r = parseInt("0x" + hex[1] + hex[2]);
            g = parseInt("0x" + hex[3] + hex[4]);
            b = parseInt("0x" + hex[5] + hex[6]);
        }
        r /= 255;
        g /= 255;
        b /= 255;
        const cmin = Math.min(r, g, b), cmax = Math.max(r, g, b), delta = cmax - cmin;
        let h = 0, s = 0, l = 0;

        if (delta === 0) h = 0;
        else if (cmax === r) h = ((g - b) / delta) % 6;
        else if (cmax === g) h = (b - r) / delta + 2;
        else h = (r - g) / delta + 4;

        h = Math.round(h * 60);
        if (h < 0) h += 360;
        l = (cmax + cmin) / 2;
        s = delta === 0 ? 0 : delta / (1 - Math.abs(2 * l - 1));
        s = +(s * 100).toFixed(1);
        l = +(l * 100).toFixed(1);

        return `${h} ${s}% ${l}%`;
    };

    const handleThemeChange = (colorHsl: string) => {
        setThemeColor(colorHsl);
        localStorage.setItem('theme-color', colorHsl);
        document.documentElement.style.setProperty('--primary', colorHsl);
        document.documentElement.style.setProperty('--ring', colorHsl);
    };

    if (authLoading) return <div className="min-h-screen bg-background flex items-center justify-center"><Loader2 className="w-8 h-8 text-primary animate-spin" /></div>;


    if (!user) {
        setLocation("/");
        return null;
    }

    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();
        updateUser(formData, {
            onSuccess: () => {
                toast({ title: "Settings Saved", description: "Your profile has been updated successfully." });
            },
            onError: (err) => {
                toast({ title: "Error", description: err.message, variant: "destructive" });
            }
        });
    };

    const handleFileSelect = (type: "avatar" | "banner") => (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = () => {
                setSelectedImage(reader.result as string);
                setActiveCropType(type);
                setCropperOpen(true);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleCropComplete = async (blob: Blob) => {
        if (!activeCropType) return;
        setIsLocalProcessing(true);

        try {
            const reader = new FileReader();
            reader.onloadend = () => {
                const base64data = reader.result as string;
                setFormData(prev => ({
                    ...prev,
                    [activeCropType === "avatar" ? "avatarUrl" : "bannerUrl"]: base64data
                }));
                setIsLocalProcessing(false);
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
            <main className="md:pl-20 lg:pl-64 min-h-screen pb-20 md:pb-0">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
                    <div className="flex items-center gap-4 mb-8">
                        <button onClick={() => history.back()} className="p-2 hover:bg-muted rounded-full transition-colors">
                            <ArrowLeft className="w-6 h-6" />
                        </button>
                        <h1 className="text-4xl font-display font-bold text-foreground">Settings</h1>
                    </div>

                    <form onSubmit={handleSave} className="space-y-8">
                        {/* Profile Section */}
                        <div className="bg-card border border-border rounded-3xl overflow-hidden shadow-xl">
                            <div className="relative h-48 bg-gradient-to-br from-primary/20 to-secondary/20 group">
                                {formData.bannerUrl ? (
                                    <img src={formData.bannerUrl} alt="Banner" className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-primary/20">
                                        <Shield className="w-20 h-20" />
                                    </div>
                                )}
                                <label className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity z-10">
                                    <div className="flex flex-col items-center gap-2 text-white">
                                        <Camera className="w-8 h-8" />
                                        <span className="text-sm font-bold">Change Banner</span>
                                    </div>
                                    <input type="file" className="hidden" accept="image/*" onChange={handleFileSelect("banner")} />
                                </label>
                            </div>

                            <div className="px-8 pb-8">
                                <div className="relative -mt-16 mb-6 inline-block group">
                                    <div className="w-32 h-32 rounded-full border-4 border-card bg-muted overflow-hidden shadow-2xl relative">
                                        {formData.avatarUrl ? (
                                            <img src={formData.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                                                <User className="w-12 h-12" />
                                            </div>
                                        )}
                                        {(isLocalProcessing) && (
                                            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                                <Loader2 className="w-8 h-8 text-white animate-spin" />
                                            </div>
                                        )}
                                    </div>
                                    <label className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity z-10">
                                        <Camera className="w-6 h-6 text-white" />
                                        <input type="file" className="hidden" accept="image/*" onChange={handleFileSelect("avatar")} />
                                    </label>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Display Name</label>
                                        <div className="relative">
                                            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                            <input
                                                className="w-full bg-muted border border-border rounded-xl pl-10 pr-4 py-3 outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                                                placeholder="Public name"
                                                value={formData.displayName}
                                                onChange={(e) => setFormData(p => ({ ...p, displayName: e.target.value }))}
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Account Email</label>
                                        <div className="relative opacity-60">
                                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                            <input
                                                className="w-full bg-muted border border-border rounded-xl pl-10 pr-4 py-3 outline-none cursor-not-allowed"
                                                value={user.email || ""}
                                                disabled
                                            />
                                        </div>
                                    </div>

                                    <div className="col-span-full space-y-2">
                                        <label className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Bio</label>
                                        <textarea
                                            className="w-full bg-muted border border-border rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all min-h-[120px] resize-none"
                                            placeholder="Tell the community about yourself..."
                                            value={formData.bio}
                                            onChange={(e) => setFormData(p => ({ ...p, bio: e.target.value }))}
                                        />
                                    </div>

                                    <div className="col-span-full space-y-2">
                                        <label className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Buy Me a Coffee Link</label>
                                        <div className="relative">
                                            <input
                                                className="w-full bg-muted border border-border rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                                                placeholder="https://buymeacoffee.com/yourname"
                                                value={formData.buyMeACoffeeUrl}
                                                onChange={(e) => setFormData(p => ({ ...p, buyMeACoffeeUrl: e.target.value }))}
                                            />
                                        </div>
                                        <p className="text-xs text-muted-foreground">Add your link to receive appreciation from readers.</p>
                                    </div>
                                </div>
                            </div>
                        </div>



                        {/* Appearance Section */}
                        <div className="bg-card border border-border rounded-3xl p-8 space-y-6">
                            <h2 className="text-xl font-bold flex items-center gap-2">
                                <Palette className="w-5 h-5" /> Appearance
                            </h2>
                            <div>
                                <label className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-4 block">Accent Color</label>
                                <div className="flex flex-wrap gap-4">
                                    {[
                                        { name: 'Expertene Teal', value: '189 100% 35%', bg: '#0097B2' },
                                        { name: 'Ocean Blue', value: '221 83% 53%', bg: '#3b82f6' },
                                        { name: 'Sunset Orange', value: '24 95% 53%', bg: '#f97316' },
                                        { name: 'Royal Purple', value: '262 83% 58%', bg: '#a855f7' },
                                        { name: 'Forest Green', value: '142 76% 36%', bg: '#16a34a' },
                                        { name: 'Rose Red', value: '346 87% 43%', bg: '#e11d48' },
                                    ].map(theme => (
                                        <button
                                            key={theme.name}
                                            type="button"
                                            onClick={() => handleThemeChange(theme.value)}
                                            className={`w-12 h-12 rounded-full border-2 transition-all hover:scale-110 focus:scale-110 ${themeColor === theme.value ? 'border-primary ring-2 ring-primary ring-offset-2' : 'border-border'}`}
                                            style={{ backgroundColor: theme.bg }}
                                            title={theme.name}
                                        />
                                    ))}

                                    {/* Custom Color Picker */}
                                    <div className="relative group w-12 h-12">
                                        <div className="w-full h-full rounded-full border-2 border-dashed border-muted-foreground flex items-center justify-center cursor-pointer hover:border-primary transition-colors overflow-hidden">
                                            <span className="text-xs font-bold text-muted-foreground bg-gradient-to-br from-red-500 via-green-500 to-blue-500 bg-clip-text text-transparent">Custom</span>
                                        </div>
                                        <input
                                            type="color"
                                            className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                                            onChange={(e) => handleThemeChange(hexToHSL(e.target.value))}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Danger Zone */}
                        <div className="bg-destructive/5 border border-destructive/20 rounded-3xl p-8">
                            <h2 className="text-xl font-bold text-destructive mb-2 flex items-center gap-2">
                                <Shield className="w-5 h-5" /> Danger Zone
                            </h2>
                            <p className="text-muted-foreground text-sm mb-6">
                                Be careful! These actions are permanent and cannot be undone.
                            </p>

                            <div className="flex flex-col md:flex-row gap-4">
                                <button
                                    type="button"
                                    onClick={() => logout(undefined, { onSuccess: () => setLocation('/login') })}
                                    className="px-6 py-3 rounded-xl border border-destructive/20 text-destructive font-bold hover:bg-destructive hover:text-white transition-all flex items-center justify-center gap-2"
                                >
                                    <Trash2 className="w-4 h-4" /> Sign Out
                                </button>
                            </div>
                        </div>

                        {/* Bottom Actions */}
                        <div className="sticky bottom-24 md:bottom-8 z-30 flex justify-end">
                            <button
                                type="submit"
                                disabled={isPending}
                                className="btn-primary px-8 py-4 rounded-2xl font-bold shadow-xl shadow-primary/20 flex items-center gap-2 transform active:scale-[0.98] transition-all"
                            >
                                {isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                                Save All Changes
                            </button>
                        </div>
                    </form>
                </div>

                <ImageCropper
                    isOpen={cropperOpen}
                    onClose={() => setCropperOpen(false)}
                    imageSrc={selectedImage}
                    onCropComplete={handleCropComplete}
                    aspectRatio={activeCropType === 'banner' ? 4 : 1}
                />
            </main>
        </div>
    );
}
