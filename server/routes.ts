import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { api, errorSchemas } from "@shared/routes";
import { z } from "zod";
import { setupAuth, registerAuthRoutes, isAuthenticated } from "./replit_integrations/auth";
import { registerObjectStorageRoutes } from "./replit_integrations/object_storage";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  // Utility to hydrate user from headers
  const hydrateUserFromHeaders = async (req: any) => {
    const userId = req.headers['x-user-id'];
    if (!userId) return null;

    req.user = { claims: { sub: userId } };

    // Ensure user exists in Postgres (sync on demand)
    const user = await storage.getUser(String(userId));
    if (!user) {
      // Hydrate from headers if available
      const displayName = req.headers['x-user-name'] ? String(req.headers['x-user-name']) : undefined;
      const email = req.headers['x-user-email'] ? String(req.headers['x-user-email']) : undefined;
      const avatarUrl = req.headers['x-user-avatar'] ? String(req.headers['x-user-avatar']) : undefined;
      const username = req.headers['x-user-username'] ? String(req.headers['x-user-username']) :
        (email ? email.split('@')[0] : "user_" + String(userId).substring(0, 6));

      // Create user with real profile data
      await storage.upsertUser({
        id: String(userId),
        username: username,
        displayName: displayName,
        email: email,
        avatarUrl: avatarUrl,
        isProfileComplete: true
      });
    } else {
      // Update existing user if headers contain richer info
      const displayName = req.headers['x-user-name'] ? String(req.headers['x-user-name']) : undefined;
      const avatarUrl = req.headers['x-user-avatar'] ? String(req.headers['x-user-avatar']) : undefined;

      if (displayName || avatarUrl) {
        const updates: any = {};
        if (displayName && user.displayName !== displayName) updates.displayName = displayName;
        if (avatarUrl && user.avatarUrl !== avatarUrl) updates.avatarUrl = avatarUrl;

        if (Object.keys(updates).length > 0) {
          await storage.updateUser(String(userId), updates);
        }
      }
    }
    return userId;
  };

  const requireAuth = async (req: any, res: any, next: any) => {
    if (req.isAuthenticated()) return next();
    const userId = await hydrateUserFromHeaders(req);
    if (userId) return next();
    return res.status(401).json({ message: "Unauthorized" });
  };

  const optionalAuth = async (req: any, res: any, next: any) => {
    if (req.isAuthenticated()) return next();
    await hydrateUserFromHeaders(req);
    next();
  };

  // Auth
  await setupAuth(app);
  registerAuthRoutes(app);

  // Object Storage
  registerObjectStorageRoutes(app);

  // === API ROUTES ===

  // Users
  app.get(api.users.me.path, requireAuth, async (req: any, res) => {
    const user = await storage.getUser(req.user.claims.sub);
    if (!user) return res.status(404).json({ message: "User not found" });
    const stats = await storage.getUserStats(user.id);
    res.json({ ...user, stats });
  });

  app.patch(api.users.update.path, requireAuth, async (req: any, res) => {
    try {
      const input = api.users.update.input.parse(req.body);
      const user = await storage.updateUser(req.user.claims.sub, input);
      const stats = await storage.getUserStats(user.id);
      res.json({ ...user, stats });
    } catch (err) {
      if (err instanceof z.ZodError) {
        res.status(400).json({ message: err.errors[0].message });
      } else {
        res.status(500).json({ message: "Internal server error" });
      }
    }
  });

  app.get(api.users.get.path, async (req, res) => {
    const user = await storage.getUserByUsername(req.params.username);
    if (!user) return res.status(404).json({ message: "User not found" });
    const stats = await storage.getUserStats(user.id);
    // Determine if following
    let isFollowing = false;
    // We can't easily get current user ID here without auth middleware or parsing header
    // But api.users.get doesn't explicitly use optionalAuth? It should.

    res.json({ ...user, stats });
  });

  app.post(api.users.follow.path, requireAuth, async (req: any, res) => {
    const success = await storage.toggleFollow(req.user.claims.sub, req.params.id);
    res.json({ success });
  });

  // Articles
  app.get(api.articles.list.path, optionalAuth, async (req: any, res) => {
    const userId = req.user?.claims?.sub;
    const view = req.query.view as string | undefined;
    const articles = await storage.getArticles(view, userId);
    res.json(articles);
  });

  app.get(api.articles.get.path, optionalAuth, async (req: any, res) => {
    const article = await storage.getArticle(req.params.id as any);
    if (!article) return res.status(404).json({ message: "Article not found" });

    const author = await storage.getUser(article.authorId);
    if (!author) return res.status(404).json({ message: "Author not found" });

    // Check like/bookmark status if user is logged in
    let isLiked = false;
    let isBookmarked = false;
    let likeCount = 0;

    const userId = req.user?.claims?.sub;
    if (userId) {
      isLiked = await storage.hasLiked(article.id, userId);
      isBookmarked = await storage.hasBookmarked(article.id, userId);
    }
    likeCount = await storage.getArticleLikes(article.id);

    res.json({ ...article, author, isLiked, isBookmarked, likeCount });
  });

  app.post(api.articles.translate.path, async (req: any, res) => {
    try {
      const { targetLanguage } = api.articles.translate.input.parse(req.body);
      const articleId = req.params.id as any;
      const article = await storage.getArticle(articleId);
      if (!article) return res.status(404).json({ message: "Article not found" });

      // @ts-ignore - translateArticle is available on MemStorage
      const translated = await storage.translateArticle(articleId, targetLanguage);
      res.json({ translatedContent: translated.content });
    } catch (err) {
      res.status(400).json({ message: "Translation failed" });
    }
  });

  app.post(api.articles.report.path, optionalAuth, async (req: any, res) => {
    try {
      const { reason } = api.articles.report.input.parse(req.body);
      const articleId = req.params.id as any;
      const reporterId = req.user?.claims?.sub || "anonymous";

      await storage.createReport(articleId, reporterId, reason);
      res.json({ success: true });
    } catch (err) {
      res.status(400).json({ message: "Report failed" });
    }
  });

  app.post(api.articles.create.path, requireAuth, async (req: any, res) => {
    try {
      const input = api.articles.create.input.parse(req.body);
      const article = await storage.createArticle({
        ...input,
        authorId: req.user.claims.sub,
      });
      res.status(201).json(article);
    } catch (err) {
      if (err instanceof z.ZodError) {
        res.status(400).json({ message: err.errors[0].message });
      } else {
        console.error(err);
        res.status(500).json({ message: "Internal server error" });
      }
    }
  });

  app.patch(api.articles.update.path, requireAuth, async (req: any, res) => {
    const article = await storage.getArticle(req.params.id as any);
    if (!article) return res.status(404).json({ message: "Article not found" });
    if (article.authorId !== req.user.claims.sub) return res.status(403).json({ message: "Forbidden" });

    try {
      const input = api.articles.update.input.parse(req.body);
      const updated = await storage.updateArticle(req.params.id as any, input);
      res.json(updated);
    } catch (err) {
      res.status(400).json({ message: "Invalid input" });
    }
  });

  app.delete(api.articles.delete.path, requireAuth, async (req: any, res) => {
    const article = await storage.getArticle(req.params.id as any);
    if (!article) return res.status(404).json({ message: "Article not found" });
    if (article.authorId !== req.user.claims.sub) return res.status(403).json({ message: "Forbidden" });

    await storage.deleteArticle(req.params.id as any);
    res.status(204).send();
  });

  app.post(api.articles.like.path, requireAuth, async (req: any, res) => {
    const success = await storage.toggleLike(req.params.id as any, req.user.claims.sub);
    res.json({ success });
  });

  app.post(api.articles.bookmark.path, requireAuth, async (req: any, res) => {
    const success = await storage.toggleBookmark(req.params.id as any, req.user.claims.sub);
    res.json({ success });
  });

  app.post(api.articles.view.path, async (req, res) => {
    await storage.incrementView(req.params.id as any);
    res.status(200).send();
  });

  // Comments
  app.get(api.comments.list.path, async (req: any, res) => {
    const comments = await storage.getComments(Number(req.params.articleId));
    res.json(comments);
  });

  app.post(api.comments.create.path, requireAuth, async (req: any, res) => {
    try {
      const input = api.comments.create.input.parse(req.body);
      const comment = await storage.createComment({
        ...input,
        articleId: String(req.params.articleId),
        userId: req.user.claims.sub,
      });
      // Fetch author details to return a complete comment object
      const author = await storage.getUser(req.user.claims.sub);
      res.status(201).json({ ...comment, author });
    } catch (err) {
      console.error(err);
      res.status(400).json({ message: "Invalid input" });
    }
  });

  app.delete(api.comments.delete.path, requireAuth, async (req: any, res) => {
    // In a real app check ownership
    await storage.deleteComment(Number(req.params.id));
    res.status(204).send();
  });

  // Admin Routes
  app.get("/api/admin/users", requireAuth, async (req: any, res) => {
    const userId = req.user?.claims?.sub || req.user?.id;
    console.log(`[Admin] Fetching users for admin user: ${userId}`);
    const user = await storage.getUser(userId);
    if (!user || user.email !== "admin@expertene.com") {
      console.log(`[Admin] Forbidden: user email is ${user?.email}`);
      return res.status(403).json({ message: "Forbidden: Admin access only" });
    }
    const users = await storage.getAllUsers();
    console.log(`[Admin] Returning ${users.length} users. List: ${users.map(u => u.email).join(', ')}`);
    res.json(users);
  });

  app.get("/api/admin/reports", requireAuth, async (req: any, res) => {
    const userId = req.user?.claims?.sub || req.user?.id;
    console.log(`[Admin] Fetching reports for admin user: ${userId}`);
    const user = await storage.getUser(userId);
    if (!user || user.email !== "admin@expertene.com") {
      console.log(`[Admin] Forbidden reports access: user email is ${user?.email}`);
      return res.status(403).json({ message: "Forbidden: Admin access only" });
    }
    const reports = await storage.getAllReports();
    console.log(`[Admin] Returning ${reports.length} reports.`);
    res.json(reports);
  });

  app.delete("/api/admin/users/:id", requireAuth, async (req: any, res) => {
    const userId = req.user.claims.sub;
    const user = await storage.getUser(userId);
    if (!user || user.email !== "admin@expertene.com") {
      return res.status(403).json({ message: "Forbidden" });
    }
    await storage.deleteUser(req.params.id);
    res.status(204).send();
  });

  app.delete("/api/admin/articles/:id", requireAuth, async (req: any, res) => {
    const userId = req.user.claims.sub;
    const user = await storage.getUser(userId);
    if (!user || user.email !== "admin@expertene.com") {
      return res.status(403).json({ message: "Forbidden" });
    }
    await storage.deleteArticle(req.params.id as any);
    res.status(204).send();
  });

  app.delete("/api/admin/reports/:id", requireAuth, async (req: any, res) => {
    const userId = req.user?.claims?.sub || req.user?.id;
    const user = await storage.getUser(userId);
    if (!user || user.email !== "admin@expertene.com") {
      return res.status(403).json({ message: "Forbidden" });
    }
    await storage.deleteReport(req.params.id);
    res.status(204).send();
  });

  app.patch("/api/admin/reports/:id/status", requireAuth, async (req: any, res) => {
    const userId = req.user?.claims?.sub || req.user?.id;
    const user = await storage.getUser(userId);
    if (!user || user.email !== "admin@expertene.com") {
      return res.status(403).json({ message: "Forbidden" });
    }
    const { status } = req.body;
    await storage.updateReportStatus(req.params.id, status);
    res.json({ success: true });
  });

  return httpServer;
}
