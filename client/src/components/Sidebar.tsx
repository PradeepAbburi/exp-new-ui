import { Link, useLocation } from "wouter";
import {
  Home,
  PenTool,
  Bookmark,
  User,
  LogOut,
  Settings,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import clsx from "clsx";

export function Sidebar() {
  const [location, setLocation] = useLocation();
  const { user, logout } = useAuth();

  if (!user) return null;

  const navItems = [
    { label: "Home", icon: Home, href: "/" },
    { label: "Write", icon: PenTool, href: "/write" },
    { label: "Bookmarks", icon: Bookmark, href: "/bookmarks" },
    { label: "Settings", icon: Settings, href: "/account" }, // Updated to /account
  ];

  // Mobile navigation - exclude Settings for cleaner layout
  const mobileNavItems = navItems.filter(item => item.label !== "Settings");

  return (
    <>
      {/* Desktop Sidebar - Hidden on mobile */}
      <aside className="fixed left-0 top-0 h-screen w-20 lg:w-64 bg-card border-r border-border hidden md:flex flex-col z-50">
        <div className="p-6 flex items-center justify-center lg:justify-start gap-3">
          <div className="w-10 h-10 rounded-xl overflow-hidden shrink-0">
            <img src="/logo.jpg" alt="Logo" className="w-full h-full object-cover" />
          </div>
          <span className="hidden lg:block font-display font-normal text-xl tracking-tight">
            expertene
          </span>
        </div>

        <nav className="flex-1 px-4 py-8 space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location === item.href;
            return (
              <Link key={item.href} href={item.href} className={clsx(
                "flex items-center gap-4 px-3 py-3 rounded-xl transition-all duration-200 group",
                isActive
                  ? "bg-primary/10 text-primary font-medium"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}>
                <Icon className={clsx(
                  "w-6 h-6 transition-colors",
                  isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
                )} />
                <span className="hidden lg:block">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-border mt-auto">
          <Link href={`/profile/${user.username}`} className="flex items-center gap-3 p-2 rounded-xl hover:bg-muted mb-2 transition-colors group">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/30 to-secondary/30 overflow-hidden shrink-0 border border-primary/20 flex items-center justify-center">
              {user.avatarUrl ? (
                <img src={user.avatarUrl || undefined} alt={user.username || "User"} className="w-full h-full object-cover" />
              ) : (
                <span className="font-bold text-primary">{(user.displayName || user.username || "A").charAt(0).toUpperCase()}</span>
              )}
            </div>
            <div className="hidden lg:block overflow-hidden">
              <p className="font-medium truncate text-foreground group-hover:text-primary transition-colors">
                {user.displayName || user.username}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                View Profile
              </p>
            </div>
          </Link>

          <button
            onClick={() => logout(undefined, { onSuccess: () => setLocation('/login') })}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
          >
            <LogOut className="w-5 h-5" />
            <span className="hidden lg:block font-medium">Log Out</span>
          </button>
        </div>
      </aside>

      {/* Mobile Bottom Navigation - Visible only on mobile */}
      <nav className="fixed bottom-0 left-0 right-0 h-16 bg-card/80 backdrop-blur-lg border-t border-border md:hidden flex items-center justify-around px-2 z-50">
        {mobileNavItems.map((item, index) => {
          const Icon = item.icon;
          const isActive = location === item.href;

          return (
            <Link key={item.href} href={item.href} className={clsx(
              "flex flex-col items-center justify-center gap-1 transition-all duration-200 flex-1 h-full",
              isActive ? "text-primary" : "text-muted-foreground"
            )}>
              <Icon className="w-5 h-5" />
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          );
        })}

        <Link href={`/profile/${user.username}`} className={clsx(
          "flex flex-col items-center justify-center gap-1 transition-all duration-200 flex-1 h-full",
          location.startsWith('/profile') ? "text-primary scale-110" : "text-muted-foreground"
        )}>
          <div className={clsx(
            "w-6 h-6 rounded-full border overflow-hidden",
            location.startsWith('/profile') ? "border-primary" : "border-border"
          )}>
            {user.avatarUrl ? (
              <img src={user.avatarUrl} alt="" className="w-full h-full object-cover" />
            ) : (
              <User className="w-full h-full p-1" />
            )}
          </div>
          <span className="text-[10px] font-medium">Profile</span>
        </Link>
      </nav>
    </>
  );
}
