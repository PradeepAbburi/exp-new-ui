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
  // Auth
  await setupAuth(app);
  registerAuthRoutes(app);
  
  // Object Storage
  registerObjectStorageRoutes(app);

  // === API ROUTES ===

  // Users
  app.get(api.users.me.path, isAuthenticated, async (req: any, res) => {
    const user = await storage.getUser(req.user.claims.sub);
    res.json(user);
  });

  app.patch(api.users.update.path, isAuthenticated, async (req: any, res) => {
    try {
      const input = api.users.update.input.parse(req.body);
      const user = await storage.updateUser(req.user.claims.sub, input);
      res.json(user);
    } catch (err) {
      if (err instanceof z.ZodError) {
        res.status(400).json({ message: err.errors[0].message });
      } else {
        res.status(500).json({ message: "Internal server error" });
      }
    }
  });

  app.get(api.users.get.path, async (req, res) => {
    // Note: This matches /api/users/:username, but req.params.username in express
    // api.users.get.path is /api/users/:username
    // In express, we use :username.
    // Wait, shared/routes.ts has /api/users/:username.
    const user = await storage.getUserByUsername(req.params.username);
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
  });

  app.post(api.users.follow.path, isAuthenticated, async (req: any, res) => {
    const success = await storage.toggleFollow(req.user.claims.sub, req.params.id);
    res.json({ success });
  });

  // Articles
  app.get(api.articles.list.path, async (req: any, res) => {
    const userId = req.isAuthenticated() ? req.user?.claims?.sub : undefined;
    const view = req.query.view as string | undefined;
    const articles = await storage.getArticles(view, userId);
    res.json(articles);
  });

  app.get(api.articles.get.path, async (req: any, res) => {
    const article = await storage.getArticle(Number(req.params.id));
    if (!article) return res.status(404).json({ message: "Article not found" });
    
    // Get author
    const author = await storage.getUser(article.authorId);
    if (!author) return res.status(404).json({ message: "Author not found" });

    res.json({ ...article, author });
  });

  app.post(api.articles.create.path, isAuthenticated, async (req: any, res) => {
    try {
      const input = api.articles.create.input.parse(req.body);
      const article = await storage.createArticle({
        ...input,
        authorId: req.user.claims.sub,
        createdAt: new Date(),
        updatedAt: new Date(),
        // Default other fields if needed, mostly handled by db defaults
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

  app.patch(api.articles.update.path, isAuthenticated, async (req: any, res) => {
    const article = await storage.getArticle(Number(req.params.id));
    if (!article) return res.status(404).json({ message: "Article not found" });
    if (article.authorId !== req.user.claims.sub) return res.status(403).json({ message: "Forbidden" });

    try {
      const input = api.articles.update.input.parse(req.body);
      const updated = await storage.updateArticle(Number(req.params.id), input);
      res.json(updated);
    } catch (err) {
       res.status(400).json({ message: "Invalid input" });
    }
  });

  app.delete(api.articles.delete.path, isAuthenticated, async (req: any, res) => {
    const article = await storage.getArticle(Number(req.params.id));
    if (!article) return res.status(404).json({ message: "Article not found" });
    if (article.authorId !== req.user.claims.sub) return res.status(403).json({ message: "Forbidden" });

    await storage.deleteArticle(Number(req.params.id));
    res.status(204).send();
  });

  app.post(api.articles.like.path, isAuthenticated, async (req: any, res) => {
    const success = await storage.toggleLike(Number(req.params.id), req.user.claims.sub);
    res.json({ success });
  });

  app.post(api.articles.bookmark.path, isAuthenticated, async (req: any, res) => {
    const success = await storage.toggleBookmark(Number(req.params.id), req.user.claims.sub);
    res.json({ success });
  });

  return httpServer;
}
