import { Link, useLocation } from "wouter";
import { 
  Home, 
  PenTool, 
  BookOpen, 
  Bookmark, 
  User, 
  LogOut,
  LayoutGrid
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import clsx from "clsx";

export function Sidebar() {
  const [location] = useLocation();
  const { user, logout } = useAuth();

  if (!user) return null;

  const navItems = [
    { label: "Home", icon: Home, href: "/" },
    { label: "My Feed", icon: LayoutGrid, href: "/feed" },
    { label: "Bookmarks", icon: Bookmark, href: "/bookmarks" },
    { label: "My Articles", icon: BookOpen, href: "/my-articles" },
    { label: "Write", icon: PenTool, href: "/write" },
  ];

  return (
    <aside className="fixed left-0 top-0 h-screen w-20 lg:w-64 bg-card border-r border-border flex flex-col z-50">
      <div className="p-6 flex items-center justify-center lg:justify-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shrink-0">
          <PenTool className="w-6 h-6 text-primary-foreground" />
        </div>
        <span className="hidden lg:block font-display font-bold text-xl tracking-tight">
          Inkwell
        </span>
      </div>

      <nav className="flex-1 px-4 py-8 space-y-2">
        {navItems.map((item) => {
          const isActive = location === item.href;
          return (
            <Link key={item.href} href={item.href} className={clsx(
              "flex items-center gap-4 px-3 py-3 rounded-xl transition-all duration-200 group",
              isActive 
                ? "bg-primary/10 text-primary font-medium" 
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}>
              <item.icon className={clsx(
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
          <div className="w-10 h-10 rounded-full bg-muted-foreground/20 overflow-hidden shrink-0">
             {user.avatarUrl ? (
               <img src={user.avatarUrl} alt={user.username} className="w-full h-full object-cover" />
             ) : (
               <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                 <User className="w-5 h-5" />
               </div>
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
          onClick={() => logout()}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
        >
          <LogOut className="w-5 h-5" />
          <span className="hidden lg:block font-medium">Log Out</span>
        </button>
      </div>
    </aside>
  );
}
