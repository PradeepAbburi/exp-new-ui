import { Link } from "wouter";
import { ArrowRight, PenTool, Check, Globe, Zap, Shield, BarChart, Users, Star, Layout, Heart, Menu, X, Linkedin, Instagram } from "lucide-react";
import { useState } from "react";

export function LandingPage() {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    return (
        <div className="min-h-screen bg-background flex flex-col relative overflow-x-hidden text-foreground">
            {/* Background Grid */}


            {/* Navbar */}
            <nav className="border-b border-border/40 backdrop-blur-xl sticky top-0 z-50 bg-background/80">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
                    {/* Logo */}
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl overflow-hidden bg-black border border-white/10 shadow-lg">
                            <img src="/logo.jpg" alt="Logo" className="w-full h-full object-cover" />
                        </div>
                        <span className="text-2xl font-display font-normal tracking-tight hidden md:block">expertene</span>
                    </div>

                    {/* Subpages Links */}
                    <div className="hidden md:flex items-center gap-10 text-sm font-medium text-muted-foreground">
                        <a href="#features" className="hover:text-primary transition-colors">Features</a>
                        <a href="#community" className="hover:text-primary transition-colors">Community</a>
                        <a href="#pricing" className="hover:text-primary transition-colors">Pricing</a>
                    </div>

                    {/* Auth Buttons (Desktop) */}
                    <div className="hidden md:flex items-center gap-4">
                        <Link href="/login">
                            <a className="text-sm font-bold text-foreground hover:text-primary transition-colors">Log in</a>
                        </Link>
                        <Link href="/login">
                            <a className="bg-primary text-primary-foreground px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 hover:scale-105 active:scale-95">
                                Sign up
                            </a>
                        </Link>
                    </div>

                    {/* Mobile Menu Button */}
                    <button
                        className="md:hidden p-2 text-foreground"
                        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                    >
                        {isMobileMenuOpen ? <X /> : <Menu />}
                    </button>
                </div>

                {/* Mobile Menu Dropdown */}
                {isMobileMenuOpen && (
                    <div className="md:hidden absolute top-20 left-0 w-full bg-[#1a1a1a] border-b border-white/10 p-4 flex flex-col gap-4 animate-in slide-in-from-top-5 shadow-2xl">
                        <a href="#features" className="p-2 font-medium hover:text-primary" onClick={() => setIsMobileMenuOpen(false)}>Features</a>
                        <a href="#community" className="p-2 font-medium hover:text-primary" onClick={() => setIsMobileMenuOpen(false)}>Community</a>
                        <a href="#pricing" className="p-2 font-medium hover:text-primary" onClick={() => setIsMobileMenuOpen(false)}>Pricing</a>
                        <div className="h-px bg-border my-2" />
                        <div className="grid grid-cols-2 gap-4">
                            <Link href="/login">
                                <a className="p-2 font-bold text-center text-foreground hover:bg-muted rounded-xl border border-border transition-all">Log in</a>
                            </Link>
                            <Link href="/login">
                                <a className="p-2 font-bold text-center bg-primary text-primary-foreground rounded-xl shadow-lg shadow-primary/20 transition-all hover:bg-primary/90">Sign up</a>
                            </Link>
                        </div>
                    </div>
                )}
            </nav>

            {/* Hero Section */}
            <div className="flex-1 flex flex-col justify-center items-center text-center px-4 py-12 md:py-20 relative">
                {/* Background Grid */}
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />
                {/* Glow Effect */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/10 rounded-full blur-[120px] pointer-events-none animate-pulse" />

                <div className="relative z-10 max-w-4xl mx-auto">
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-bold mb-8 border border-primary/20 animate-in fade-in slide-in-from-bottom-4 duration-700">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                        </span>
                        The Future of Digital Writing
                    </div>

                    <h1 className="text-5xl md:text-7xl lg:text-8xl font-display font-bold mb-8 tracking-tight leading-[1.1] animate-in fade-in slide-in-from-bottom-6 duration-700 delay-100">
                        Craft your story, <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-primary/60">share your world.</span>
                    </h1>

                    <p className="text-xl md:text-2xl text-muted-foreground mb-12 max-w-2xl mx-auto leading-relaxed animate-in fade-in slide-in-from-bottom-8 duration-700 delay-200">
                        A minimalistic, distraction-free platform for writers and creators. Build your portfolio, grow your audience, and monetize your expertise.
                    </p>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-in fade-in slide-in-from-bottom-10 duration-700 delay-300">
                        <Link href="/login">
                            <a className="w-full sm:w-auto bg-primary text-white px-8 py-4 rounded-2xl text-lg font-bold hover:bg-primary/90 transition-all shadow-xl shadow-primary/25 flex items-center justify-center gap-2 hover:translate-y-[-2px]">
                                Start Writing for Free <ArrowRight className="w-5 h-5" />
                            </a>
                        </Link>
                        <Link href="/login">
                            <a className="w-full sm:w-auto px-8 py-4 rounded-2xl text-lg font-semibold text-foreground border border-border hover:bg-muted/50 transition-all flex items-center justify-center gap-2">
                                Explore Community
                            </a>
                        </Link>
                    </div>

                    <div className="mt-12 flex items-center justify-center gap-8 text-muted-foreground grayscale opacity-60">
                        <div className="flex items-center gap-2 text-sm font-bold"><Zap className="w-4 h-4" /> FAST</div>
                        <div className="flex items-center gap-2 text-sm font-bold"><Shield className="w-4 h-4" /> SECURE</div>
                        <div className="flex items-center gap-2 text-sm font-bold"><Globe className="w-4 h-4" /> GLOBAL</div>
                    </div>
                </div>
            </div>

            {/* Features Grid (Light weight) */}
            <div id="features" className="py-24 bg-[#1a1a1a] border-t border-white/5 relative">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16 max-w-2xl mx-auto">
                        <h2 className="text-3xl md:text-5xl font-display font-bold mb-6">Built for modern writers</h2>
                        <p className="text-xl text-muted-foreground">Everything you need to publish content that looks great on any device.</p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8">
                        {features.map((f, i) => (
                            <div key={i} className="p-8 rounded-3xl bg-background border border-border hover:border-primary/50 transition-colors group hover:shadow-2xl hover:shadow-primary/5">
                                <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary mb-6 group-hover:scale-110 transition-transform">
                                    {f.icon}
                                </div>
                                <h3 className="text-xl font-bold font-display mb-3">{f.title}</h3>
                                <p className="text-muted-foreground leading-relaxed">{f.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Detailed Feature 1 - Editor */}
            <div className="py-24 bg-[#252525] border-t border-white/5">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex flex-col md:flex-row items-center gap-16">
                        <div className="flex-1 order-2 md:order-1">
                            <div className="relative">
                                <div className="absolute -inset-4 bg-primary/20 rounded-[2rem] blur-2xl opacity-50" />
                                <div className="relative bg-card border border-border rounded-3xl p-2 aspect-[4/3] overflow-hidden shadow-2xl">
                                    <img src="https://images.unsplash.com/photo-1499750310159-529800cf2c58?q=80&w=2000" className="w-full h-full object-cover rounded-2xl opacity-90" alt="Editor" />
                                </div>
                            </div>
                        </div>
                        <div className="flex-1 order-1 md:order-2">
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold mb-6">
                                <PenTool className="w-3 h-3" /> DISTRACTION FREE
                            </div>
                            <h2 className="text-4xl md:text-5xl font-display font-bold mb-6">Focus on your craft.</h2>
                            <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
                                Our editor is designed to get out of your way. With Markdown support, real-time saving, and a clean interface, you can write without distractions.
                            </p>
                            <ul className="space-y-4 mb-8">
                                {["Clean, minimal interface", "Markdown support", "Auto-saving", "Rich media embeds"].map((item, i) => (
                                    <li key={i} className="flex items-center gap-3 text-muted-foreground">
                                        <span className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-primary"><Check className="w-3 h-3 font-bold" /></span>
                                        {item}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </div>
            </div>

            {/* Detailed Feature 2 - Analytics */}
            <div className="py-24 bg-[#1a1a1a] border-t border-white/5">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex flex-col md:flex-row items-center gap-16">
                        <div className="flex-1">
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 text-purple-500 text-xs font-bold mb-6">
                                <BarChart className="w-3 h-3" /> ANALYTICS
                            </div>
                            <h2 className="text-4xl md:text-5xl font-display font-bold mb-6">Know what works.</h2>
                            <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
                                Understand your audience with built-in analytics. Track views, likes, and engagement trends to grow your readership effectively.
                            </p>
                            <Link href="/login">
                                <a className="inline-flex items-center gap-2 text-primary font-bold hover:gap-3 transition-all">
                                    View Demo Analytics <ArrowRight className="w-4 h-4" />
                                </a>
                            </Link>
                        </div>
                        <div className="flex-1">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-background p-6 rounded-3xl border border-border shadow-xl">
                                    <div className="text-muted-foreground text-xs font-bold uppercase mb-2">Total Views</div>
                                    <div className="text-4xl font-display font-bold text-foreground">12.5k</div>
                                    <div className="text-green-500 text-xs font-bold mt-2">+24% this week</div>
                                </div>
                                <div className="bg-background p-6 rounded-3xl border border-border shadow-xl mt-8">
                                    <div className="text-muted-foreground text-xs font-bold uppercase mb-2">Engaged Time</div>
                                    <div className="text-4xl font-display font-bold text-foreground">4m 12s</div>
                                    <div className="text-green-500 text-xs font-bold mt-2">+12% this week</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Community Section */}
            <div id="community" className="py-24 bg-[#252525] border-t border-white/5 text-center relative overflow-hidden">
                <div className="absolute top-0 w-full h-full bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-primary/5 via-transparent to-transparent pointer-events-none" />
                <div className="max-w-4xl mx-auto px-4 relative z-10">
                    <h2 className="text-4xl md:text-5xl font-display font-bold mb-6">Join the Community</h2>
                    <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto">
                        Connect with thousands of writers, share your work, and get feedback. Expertene is more than a platform, it's a movement.
                    </p>
                    <div className="flex items-center justify-center gap-4">
                        <div className="flex -space-x-4">
                            {[1, 2, 3, 4].map(i => (
                                <div key={i} className="w-12 h-12 rounded-full border-2 border-background bg-muted overflow-hidden">
                                    <img src={`https://i.pravatar.cc/100?img=${i + 10}`} className="w-full h-full object-cover" alt="User" />
                                </div>
                            ))}
                        </div>
                        <div className="text-left pl-4">
                            <div className="font-bold text-foreground">10,000+ Writers</div>
                            <div className="text-xs text-muted-foreground">Writing daily</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Pricing Section */}
            <div id="pricing" className="py-24 border-t border-white/5 bg-[#151515]">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl font-display font-bold mb-4">Simple, transparent pricing</h2>
                        <p className="text-muted-foreground text-lg">Start for free, upgrade when you're ready.</p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
                        {/* Free Tier */}
                        <div className="bg-background border border-border rounded-3xl p-8 hover:border-primary/30 transition-colors relative">
                            <h3 className="text-lg font-bold text-muted-foreground mb-2">Starter</h3>
                            <div className="text-4xl font-display font-bold mb-6">$0 <span className="text-base font-normal text-muted-foreground">/mo</span></div>
                            <ul className="space-y-4 mb-8">
                                {["Unlimited Public Pages", "Basic Analytics", "Community Access", "Expertene Branding"].map((f, i) => (
                                    <li key={i} className="flex items-center gap-3 text-sm">
                                        <Check className="w-4 h-4 text-primary" /> {f}
                                    </li>
                                ))}
                            </ul>
                            <Link href="/login">
                                <a className="block w-full py-3 px-4 rounded-xl border border-border text-center font-bold hover:bg-muted transition-colors">Start for Free</a>
                            </Link>
                        </div>

                        {/* Pro Tier */}
                        <div className="bg-background border-2 border-primary rounded-3xl p-8 relative shadow-2xl shadow-primary/10 transform md:-translate-y-4">
                            <div className="absolute top-0 right-0 bg-primary text-white text-xs font-bold px-3 py-1 rounded-bl-xl rounded-tr-2xl">POPULAR</div>
                            <h3 className="text-lg font-bold text-primary mb-2">Pro</h3>
                            <div className="text-4xl font-display font-bold mb-6">$12 <span className="text-base font-normal text-muted-foreground">/mo</span></div>
                            <ul className="space-y-4 mb-8">
                                {["Everything in Starter", "Custom Domain", "Advanced Analytics", "Newsletter Integration", "Remove Branding"].map((f, i) => (
                                    <li key={i} className="flex items-center gap-3 text-sm font-medium">
                                        <Check className="w-4 h-4 text-primary" /> {f}
                                    </li>
                                ))}
                            </ul>
                            <Link href="/login">
                                <a className="block w-full py-3 px-4 rounded-xl bg-primary text-white text-center font-bold hover:bg-primary/90 transition-colors shadow-lg shadow-primary/25">Get Pro</a>
                            </Link>
                        </div>

                        {/* Enterprise Tier */}
                        <div className="bg-background border border-border rounded-3xl p-8 hover:border-primary/30 transition-colors relative">
                            <h3 className="text-lg font-bold text-foreground mb-2">Team</h3>
                            <div className="text-4xl font-display font-bold mb-6">$49 <span className="text-base font-normal text-muted-foreground">/mo</span></div>
                            <ul className="space-y-4 mb-8">
                                {["Everything in Pro", "Team Members", "Collaboration Tools", "API Access", "Priority Support"].map((f, i) => (
                                    <li key={i} className="flex items-center gap-3 text-sm text-muted-foreground">
                                        <Check className="w-4 h-4 text-muted-foreground" /> {f}
                                    </li>
                                ))}
                            </ul>
                            <Link href="/login">
                                <a className="block w-full py-3 px-4 rounded-xl border border-border text-center font-bold hover:bg-muted transition-colors">Contact Sales</a>
                            </Link>
                        </div>
                    </div>
                </div>
            </div>

            {/* Footer */}
            <footer className="py-12 border-t border-border bg-[#202020] text-center">
                <div className="max-w-7xl mx-auto px-4 flex flex-col items-center">
                    <div className="flex items-center gap-2 mb-6 opacity-80">
                        <div className="w-8 h-8 rounded-lg overflow-hidden bg-black border border-white/10">
                            <img src="/logo.jpg" alt="Logo" className="w-full h-full object-cover" />
                        </div>
                        <span className="text-lg font-display font-normal">expertene</span>
                    </div>
                    <div className="flex flex-wrap justify-center gap-8 text-sm text-muted-foreground mb-8">
                        <a href="#" className="hover:text-foreground">Product</a>
                        <a href="#" className="hover:text-foreground">Features</a>
                        <a href="#" className="hover:text-foreground">Pricing</a>
                        <a href="#" className="hover:text-foreground">About</a>
                        <a href="#" className="hover:text-foreground">Blog</a>
                    </div>
                    <p className="text-sm text-muted-foreground/60 mb-6">© 2025 Expertene. All rights reserved.</p>

                    {/* Socials */}
                    <div className="flex items-center justify-center gap-6">
                        <a href="https://www.linkedin.com/company/expertene/" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-[#0077b5] transition-colors bg-white/5 p-2 rounded-full hover:bg-white/10">
                            <Linkedin className="w-5 h-5" />
                        </a>
                        <a href="https://www.instagram.com/expertene?igsh=MXB2bG9qNnBwanR2Yg==" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-[#E1306C] transition-colors bg-white/5 p-2 rounded-full hover:bg-white/10">
                            <Instagram className="w-5 h-5" />
                        </a>
                    </div>
                </div>
            </footer>
        </div>
    );
}

const features = [
    {
        icon: <PenTool className="w-6 h-6" />,
        title: "Markdown Editor",
        desc: "Write smoothly with our block-based editor. Support for code, images, and rich formatting."
    },
    {
        icon: <Layout className="w-6 h-6" />,
        title: "Beautiful Themes",
        desc: "Choose from curated themes that make your content pop. Light, dark, and custom modes."
    },
    {
        icon: <Globe className="w-6 h-6" />,
        title: "Custom Domain",
        desc: "Connect your own domain to your profile. Build your personal brand with professional SEO."
    },
    {
        icon: <BarChart className="w-6 h-6" />,
        title: "Built-in Analytics",
        desc: "Track your views and growth without needing external tools or complicated setups."
    },
    {
        icon: <Heart className="w-6 h-6" />,
        title: "Community Driven",
        desc: "Get feedback, likes, and comments from a community of passionate writers and readers."
    },
    {
        icon: <Zap className="w-6 h-6" />,
        title: "Blazing Fast",
        desc: "Built on modern tech for instant load times. Your content is always accessible."
    }
];
