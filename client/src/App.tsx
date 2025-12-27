import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";

import Home from "@/pages/Home";
import Login from "@/pages/Login";
import CompleteProfile from "@/pages/CompleteProfile";
import Write from "@/pages/Write";
import ArticleView from "@/pages/ArticleView";
import Bookmarks from "@/pages/Bookmarks";
import Profile from "@/pages/Profile";
import EditArticle from "@/pages/EditArticle";
import Settings from "@/pages/Settings";
import Account from "@/pages/Account";
import Analytics from "@/pages/Analytics";
import Bin from "@/pages/Bin";
import EmailAction from "@/pages/EmailAction";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/login" component={Login} />
      <Route path="/auth/action" component={EmailAction} />
      <Route path="/complete-profile" component={CompleteProfile} />
      <Route path="/write" component={Write} />
      <Route path="/editor/:id" component={EditArticle} />
      <Route path="/article/:id" component={ArticleView} />
      <Route path="/bookmarks" component={Bookmarks} />
      <Route path="/settings" component={Settings} />
      <Route path="/account" component={Account} />
      <Route path="/analytics" component={Analytics} />
      <Route path="/bin" component={Bin} />
      <Route path="/profile/:username" component={Profile} />
      <Route component={NotFound} />
    </Switch>
  );
}

import { useEffect } from "react";

function App() {
  useEffect(() => {
    const themeColor = localStorage.getItem('theme-color');
    if (themeColor) {
      document.documentElement.style.setProperty('--primary', themeColor);
      document.documentElement.style.setProperty('--ring', themeColor);
    }
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
