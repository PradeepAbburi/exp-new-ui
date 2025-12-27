import { db } from "./db";
import {
  articles,
  users,
  likes,
  bookmarks,
  follows,
  comments,
  type User,
  type Article,
  type InsertArticle,
  type InsertUser,
  type InsertComment,
  type Comment
} from "@shared/schema";
import { eq, desc, and, sql } from "drizzle-orm";

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  updateUser(id: string, user: Partial<InsertUser>): Promise<User>;
  upsertUser(user: Partial<User> & { id: string }): Promise<User>;
  createLocalUser(email: string, username: string, passwordHash: string): Promise<User>;

  // Articles
  // Articles
  createArticle(article: InsertArticle): Promise<Article>;
  getArticle(id: any): Promise<Article | undefined>;
  getArticles(view?: string, userId?: string): Promise<(Article & { author: User, likeCount: number, isLiked: boolean, isBookmarked: boolean })[]>;
  updateArticle(id: any, article: Partial<InsertArticle>): Promise<Article>;
  deleteArticle(id: any): Promise<void>;
  incrementView(id: any): Promise<void>;

  // Social
  toggleLike(articleId: any, userId: string): Promise<boolean>;
  toggleBookmark(articleId: any, userId: string): Promise<boolean>;
  toggleFollow(followerId: string, followingId: string): Promise<boolean>;

  getArticleLikes(articleId: any): Promise<number>;
  hasLiked(articleId: any, userId: string): Promise<boolean>;
  hasBookmarked(articleId: any, userId: string): Promise<boolean>;
  getUserStats(userId: string): Promise<{ posts: number, followers: number, following: number }>;

  // Comments
  createComment(comment: InsertComment): Promise<Comment>;
  getComments(articleId: any): Promise<(Comment & { author: User })[]>;
  deleteComment(id: any): Promise<void>;

  // Reports
  createReport(articleId: any, reporterId: string, reason: string): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }


  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async getUserStats(userId: string): Promise<{ posts: number, followers: number, following: number }> {
    const [posts] = await db.select({ count: sql<number>`count(*)` }).from(articles).where(eq(articles.authorId, userId));
    const [followers] = await db.select({ count: sql<number>`count(*)` }).from(follows).where(eq(follows.followingId, userId));
    const [following] = await db.select({ count: sql<number>`count(*)` }).from(follows).where(eq(follows.followerId, userId));
    return {
      posts: Number(posts.count),
      followers: Number(followers.count),
      following: Number(following.count),
    };
  }


  async createLocalUser(email: string, username: string, passwordHash: string): Promise<User> {
    const [user] = await db.insert(users).values({
      email,
      username,
      password: passwordHash,
      isProfileComplete: false,
      displayName: username,
      avatarUrl: null,
      bannerUrl: null,
      firstName: null,
      lastName: null,
      profileImageUrl: null,
      bio: null
    }).returning();
    return user;
  }

  async upsertUser(user: Partial<User> & { id: string }): Promise<User> {
    // For simple update if exists, or insert. 
    // Since this is likely not fully supported in all Drizzle adapters without specific syntax, 
    // and we might be using MemStorage, I'll allow a basic implementation or cast.
    // Assuming Postgres/SQLite:
    /* 
    await db.insert(users).values(user).onConflictDoUpdate({ target: users.id, set: user }); 
    */
    // Fallback to update for now to satisfy interface without complex upsert logic if db adapter is unknown.
    // Actually, let's just throw or implement basic.
    throw new Error("Upsert not fully implemented in DatabaseStorage");
  }

  async updateUser(id: string, updates: Partial<InsertUser>): Promise<User> {
    const [updated] = await db
      .update(users)
      .set(updates)
      .where(eq(users.id, id))
      .returning();
    return updated;
  }

  async createArticle(article: InsertArticle): Promise<Article> {
    const [newArticle] = await db.insert(articles).values(article).returning();
    return newArticle;
  }

  async getArticle(id: number): Promise<Article | undefined> {
    const [article] = await db.select().from(articles).where(eq(articles.id, id));
    return article;
  }

  async getArticles(view: string = 'public', userId?: string): Promise<(Article & { author: User, likeCount: number, isLiked: boolean, isBookmarked: boolean })[]> {
    let conditions = [];
    if (view === 'public') {
      conditions.push(eq(articles.isPublic, true));
    } else if (view === 'mine' && userId) {
      conditions.push(eq(articles.authorId, userId));
    } else if (view === 'feed' && userId) {
      // In a real app, join with follows. For now just public.
      conditions.push(eq(articles.isPublic, true));
    } else if (view === 'bookmarks' && userId) {
      // Join with bookmarks
      const bookmarked = await db.select({ articleId: bookmarks.articleId }).from(bookmarks).where(eq(bookmarks.userId, userId));
      const ids = bookmarked.map(b => b.articleId);
      if (ids.length > 0) {
        conditions.push(sql`${articles.id} IN ${ids}`);
      } else {
        return [];
      }
    }

    const results = await db.select({
      article: articles,
      author: users,
    })
      .from(articles)
      .innerJoin(users, eq(articles.authorId, users.id))
      .where(and(...conditions))
      .orderBy(desc(articles.createdAt));

    // Enhance with likes (inefficient N+1 but fine for MVP)
    const enhanced = await Promise.all(results.map(async ({ article, author }) => {
      const [likeCount] = await db.select({ count: sql<number>`count(*)` }).from(likes).where(eq(likes.articleId, article.id));
      let isLiked = false;
      let isBookmarked = false;
      if (userId) {
        const [like] = await db.select().from(likes).where(and(eq(likes.articleId, article.id), eq(likes.userId, userId)));
        isLiked = !!like;
        const [bookmark] = await db.select().from(bookmarks).where(and(eq(bookmarks.articleId, article.id), eq(bookmarks.userId, userId)));
        isBookmarked = !!bookmark;
      }
      return { ...article, author, likeCount: Number(likeCount.count), isLiked, isBookmarked };
    }));

    return enhanced;
  }

  async updateArticle(id: number, updates: Partial<InsertArticle>): Promise<Article> {
    const [updated] = await db
      .update(articles)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(articles.id, id))
      .returning();
    return updated;
  }

  async deleteArticle(id: number): Promise<void> {
    await db.delete(articles).where(eq(articles.id, id));
  }

  async incrementView(id: number): Promise<void> {
    await db.update(articles).set({ views: sql`${articles.views} + 1` }).where(eq(articles.id, id));
  }

  async toggleLike(articleId: number, userId: string): Promise<boolean> {
    const [existing] = await db.select().from(likes).where(and(eq(likes.articleId, articleId), eq(likes.userId, userId)));
    if (existing) {
      await db.delete(likes).where(eq(likes.id, existing.id));
      return false;
    } else {
      await db.insert(likes).values({ articleId, userId });
      return true;
    }
  }

  async toggleBookmark(articleId: number, userId: string): Promise<boolean> {
    const [existing] = await db.select().from(bookmarks).where(and(eq(bookmarks.articleId, articleId), eq(bookmarks.userId, userId)));
    if (existing) {
      await db.delete(bookmarks).where(eq(bookmarks.id, existing.id));
      return false;
    } else {
      await db.insert(bookmarks).values({ articleId, userId });
      return true;
    }
  }

  async toggleFollow(followerId: string, followingId: string): Promise<boolean> {
    const [existing] = await db.select().from(follows).where(and(eq(follows.followerId, followerId), eq(follows.followingId, followingId)));
    if (existing) {
      await db.delete(follows).where(eq(follows.id, existing.id));
      return false;
    } else {
      await db.insert(follows).values({ followerId, followingId });
      return true;
    }
  }

  async getArticleLikes(articleId: number): Promise<number> {
    const [result] = await db.select({ count: sql<number>`count(*)` }).from(likes).where(eq(likes.articleId, articleId));
    return Number(result.count);
  }

  async hasLiked(articleId: number, userId: string): Promise<boolean> {
    const [existing] = await db.select().from(likes).where(and(eq(likes.articleId, articleId), eq(likes.userId, userId)));
    return !!existing;
  }

  async hasBookmarked(articleId: number, userId: string): Promise<boolean> {
    const [existing] = await db.select().from(bookmarks).where(and(eq(bookmarks.articleId, articleId), eq(bookmarks.userId, userId)));
    return !!existing;
  }

  async createComment(comment: InsertComment): Promise<Comment> {
    const [newComment] = await db.insert(comments).values(comment).returning();
    return newComment;
  }

  async getComments(articleId: number): Promise<(Comment & { author: User })[]> {
    const results = await db.select({
      comment: comments,
      author: users,
    })
      .from(comments)
      .innerJoin(users, eq(comments.userId, users.id))
      .where(eq(comments.articleId, String(articleId)))
      .orderBy(desc(comments.createdAt));

    return results.map(r => ({ ...r.comment, author: r.author }));
  }

  async deleteComment(id: number): Promise<void> {
    await db.delete(comments).where(eq(comments.id, id));
  }

  async createReport(articleId: number, reporterId: string, reason: string): Promise<void> {
    // Drizzle implementation would involve inserting into a 'reports' table
    throw new Error("createReport not implemented in DatabaseStorage");
  }

  async translateArticle(articleId: number, targetLanguage: string): Promise<Article> {
    // Drizzle implementation would involve calling an external translation service or storing translations
    throw new Error("translateArticle not implemented in DatabaseStorage");
  }
}

export class MemStorage implements IStorage {
  protected users: Map<string, User> = new Map();
  protected articles: Map<number, Article> = new Map();
  protected likes: Map<number, { articleId: number, userId: string }[]> = new Map();
  protected bookmarks: Map<number, { articleId: number, userId: string }[]> = new Map();
  protected comments: Map<number, Comment> = new Map();
  protected follows: { followerId: string, followingId: string }[] = [];
  protected reports: { articleId: number, reporterId: string, reason: string, createdAt: Date }[] = [];
  protected articleIdCounter = 1;
  protected commentIdCounter = 1;

  // Optional hook for persistence in subclasses
  protected async save() { }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(u => u.username === username);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(u => u.email === email);
  }

  async getUserStats(userId: string): Promise<{ posts: number, followers: number, following: number }> {
    const posts = Array.from(this.articles.values()).filter(a => a.authorId === userId).length;
    const followers = this.follows.filter(f => f.followingId === userId).length;
    const following = this.follows.filter(f => f.followerId === userId).length;
    return { posts, followers, following };
  }

  async createLocalUser(email: string, username: string, passwordHash: string): Promise<User> {
    const id = (Math.random() * 10000).toString(); // simple ID gen
    const user: User = {
      id,
      email,
      username,
      password: passwordHash,
      isProfileComplete: false,
      firstName: null,
      lastName: null,
      profileImageUrl: null,
      bio: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      displayName: null,
      avatarUrl: null,
      bannerUrl: null,
    };
    this.users.set(id, user);
    return user;
  }

  async updateUser(id: string, updates: Partial<InsertUser>): Promise<User> {
    const user = this.users.get(id);
    if (!user) throw new Error("User not found");
    const updatedUser = { ...user, ...updates } as User;
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async upsertUser(user: Partial<User> & { id: string }): Promise<User> {
    const existing = this.users.get(user.id);
    const updated = { ...(existing || {}), ...user } as User;
    if (!updated.createdAt) updated.createdAt = new Date();
    updated.updatedAt = new Date();
    this.users.set(user.id, updated);
    return updated;
  }

  async createArticle(article: InsertArticle): Promise<Article> {
    const id = this.articleIdCounter++;
    const newArticle: Article = {
      ...article,
      id,
      createdAt: new Date(),
      updatedAt: new Date(),
      isPublic: article.isPublic ?? true,
      coverImage: article.coverImage ?? null,
      accessKey: article.accessKey ?? null,
      views: 0,
    };
    this.articles.set(id, newArticle);
    return newArticle;
  }

  async getArticle(id: number): Promise<Article | undefined> {
    return this.articles.get(id);
  }

  async getArticles(view: string = 'public', userId?: string): Promise<(Article & { author: User, likeCount: number, isLiked: boolean, isBookmarked: boolean })[]> {
    let result = Array.from(this.articles.values());
    console.log(`[Storage] getArticles: total=${result.length}, view=${view}, userId=${userId}`);

    // Filter by view
    if (view === 'mine' && userId) {
      result = result.filter(a => a.authorId === userId);
    } else if (view === 'bookmarks' && userId) {
      // Filter in the mapping stage
    }

    const promises = result.map(async (article) => {
      const author = await this.getUser(article.authorId);
      if (!author) {
        console.log(`[Storage] getArticles: article ${article.id} excluded because author ${article.authorId} not found`);
        return null!;
      }

      const likeCount = await this.getArticleLikes(article.id);
      const isLiked = userId ? await this.hasLiked(article.id, userId) : false;
      const isBookmarked = userId ? await this.hasBookmarked(article.id, userId) : false;

      // Post-filtering for bookmarks view
      if (view === 'bookmarks' && userId && !isBookmarked) {
        return null!;
      }

      return { ...article, author, likeCount, isLiked, isBookmarked };
    });

    const enriched = await Promise.all(promises);
    const finalResult = enriched.filter(Boolean);
    console.log(`[Storage] getArticles: final count=${finalResult.length}`);
    return finalResult;
  }

  async updateArticle(id: number, updates: Partial<InsertArticle>): Promise<Article> {
    const article = this.articles.get(id);
    if (!article) throw new Error("Article not found");
    const updated = { ...article, ...updates, updatedAt: new Date() } as Article;
    this.articles.set(id, updated);
    await this.save();
    return updated;
  }

  async deleteArticle(id: number): Promise<void> {
    this.articles.delete(id);
    await this.save();
  }

  async incrementView(id: number): Promise<void> {
    const article = this.articles.get(id);
    if (article) {
      article.views = (article.views || 0) + 1;
      this.articles.set(id, article);
      await this.save();
    }
  }

  async toggleLike(articleId: number, userId: string): Promise<boolean> {
    const articleLikes = this.likes.get(articleId) || [];
    const index = articleLikes.findIndex(l => l.userId === userId);
    if (index >= 0) {
      articleLikes.splice(index, 1);
      this.likes.set(articleId, articleLikes);
      await this.save();
      return false;
    } else {
      articleLikes.push({ articleId, userId });
      this.likes.set(articleId, articleLikes);
      await this.save();
      return true;
    }
  }

  async toggleBookmark(articleId: number, userId: string): Promise<boolean> {
    const articleBookmarks = this.bookmarks.get(articleId) || [];
    const index = articleBookmarks.findIndex(b => b.userId === userId);
    if (index >= 0) {
      articleBookmarks.splice(index, 1);
      this.bookmarks.set(articleId, articleBookmarks);
      await this.save();
      return false;
    } else {
      articleBookmarks.push({ articleId, userId });
      this.bookmarks.set(articleId, articleBookmarks);
      await this.save();
      return true;
    }
  }

  async toggleFollow(followerId: string, followingId: string): Promise<boolean> {
    // simplify
    return true;
  }

  async getArticleLikes(articleId: number): Promise<number> {
    return (this.likes.get(articleId) || []).length;
  }

  async hasLiked(articleId: number, userId: string): Promise<boolean> {
    const articleLikes = this.likes.get(articleId) || [];
    return articleLikes.some(l => l.userId === userId);
  }

  async hasBookmarked(articleId: number, userId: string): Promise<boolean> {
    const articleBookmarks = this.bookmarks.get(articleId) || [];
    return articleBookmarks.some(b => b.userId === userId);
  }

  async createComment(comment: InsertComment): Promise<Comment> {
    const id = this.commentIdCounter++;
    const newComment: Comment = {
      ...comment,
      id,
      parentId: comment.parentId ?? null,
      createdAt: new Date(),
    };
    this.comments.set(id, newComment);
    await this.save();
    return newComment;
  }

  async getComments(articleId: number): Promise<(Comment & { author: User })[]> {
    const allComments = Array.from(this.comments.values());
    const validComments = allComments.filter(c => Number(c.articleId) === articleId);

    return Promise.all(validComments.map(async (c) => {
      const author = await this.getUser(c.userId);
      if (!author) return null!;
      return { ...c, author };
    })).then(res => res.filter(Boolean));
  }

  async deleteComment(id: number): Promise<void> {
    this.comments.delete(id);
    await this.save();
  }

  async createReport(articleId: number, reporterId: string, reason: string): Promise<void> {
    this.reports.push({ articleId, reporterId, reason, createdAt: new Date() });
    await this.save();
  }

  async translateArticle(articleId: number, targetLanguage: string): Promise<Article> {
    const article = this.articles.get(articleId);
    if (!article) throw new Error("Article not found");

    // Realistic mock: prepend language code to all text content
    const content = (article.content as any[]) || [];
    const translatedContent = content.map((block: any) => {
      if (block.type === 'text') {
        return { ...block, content: `[${targetLanguage.substring(0, 2).toUpperCase()}] ${block.content}` };
      }
      return block;
    });

    return { ...article, content: translatedContent };
  }
}

import fs from 'fs-extra';
import path from 'path';

// ... (MemStorage implementation)

/**
 * A version of MemStorage that persists to a JSON file.
 * This is useful for "local" development without a database, ensuring data survives restarts/reloads.
 */
export class FilePersistedStorage extends MemStorage {
  private dataFile = path.join(process.cwd(), 'server', 'data', 'storage.json');

  constructor() {
    super();
    this.loadSync();
  }

  private loadSync() {
    try {
      if (fs.pathExistsSync(this.dataFile)) {
        const data = fs.readJsonSync(this.dataFile);

        // Rehydrate Maps
        if (data.users) this.users = new Map(data.users);
        if (data.articles) this.articles = new Map(data.articles.map((a: any) => [a.id, { ...a, createdAt: new Date(a.createdAt), updatedAt: new Date(a.updatedAt) }]));
        if (data.likes) this.likes = new Map(data.likes);
        if (data.bookmarks) this.bookmarks = new Map(data.bookmarks);
        if (data.comments) this.comments = new Map(data.comments.map((c: any) => [c.id, { ...c, createdAt: new Date(c.createdAt) }]));
        if (data.follows) this.follows = data.follows;
        if (data.reports) this.reports = data.reports;

        // Restore counters or fallback to max id + 1
        if (data.articleIdCounter) {
          this.articleIdCounter = data.articleIdCounter;
        } else {
          const maxId = Array.from(this.articles.keys()).reduce((a, b) => Math.max(a, b), 0);
          this.articleIdCounter = maxId + 1;
        }

        if (data.commentIdCounter) {
          this.commentIdCounter = data.commentIdCounter;
        } else {
          const maxId = Array.from(this.comments.keys()).reduce((a, b) => Math.max(a, b), 0);
          this.commentIdCounter = maxId + 1;
        }

        console.log("Loaded storage from file (sync).");
      } else {
        console.log("No storage file found, starting fresh.");
      }
    } catch (err) {
      console.error("Failed to load storage file:", err);
    }
  }

  // private async save() ... (keep async for save is fine, or make sync to be safe?)
  // keeping save async is better for perf, but load MUST be sync or awaited before valid usage.
  protected async save() {
    try {
      await fs.ensureDir(path.dirname(this.dataFile));
      const data = {
        users: Array.from(this.users.entries()),
        articles: Array.from(this.articles.values()), // Saved as array of objects
        likes: Array.from(this.likes.entries()),
        bookmarks: Array.from(this.bookmarks.entries()),
        comments: Array.from(this.comments.values()), // Saved as array of objects
        follows: this.follows,
        reports: this.reports,
        articleIdCounter: this.articleIdCounter,
        commentIdCounter: this.commentIdCounter
      };
      await fs.writeJson(this.dataFile, data, { spaces: 2 });
      console.log(`Saved storage to file: ${this.dataFile}`);
    } catch (err) {
      console.error("Failed to save storage file:", err);
    }
  }

  // Override mutators to trigger save
  async createLocalUser(email: string, username: string, passwordHash: string): Promise<User> {
    console.log("Creating local user and saving...");
    const res = await super.createLocalUser(email, username, passwordHash);
    await this.save();
    return res;
  }
  async updateUser(id: string, updates: Partial<InsertUser>): Promise<User> {
    const res = await super.updateUser(id, updates);
    await this.save();
    return res;
  }
  async upsertUser(user: Partial<User> & { id: string }): Promise<User> {
    const res = await super.upsertUser(user);
    await this.save();
    return res;
  }
  async createArticle(article: InsertArticle): Promise<Article> {
    console.log("Creating article and saving...");
    const res = await super.createArticle(article);
    await this.save();
    return res;
  }
  async updateArticle(id: number, updates: Partial<InsertArticle>): Promise<Article> {
    const res = await super.updateArticle(id, updates);
    await this.save();
    return res;
  }
  async deleteArticle(id: number): Promise<void> {
    await super.deleteArticle(id);
    await this.save();
  }
  async toggleLike(articleId: number, userId: string): Promise<boolean> {
    const res = await super.toggleLike(articleId, userId);
    await this.save();
    return res;
  }
  async createComment(comment: InsertComment): Promise<Comment> {
    const res = await super.createComment(comment);
    await this.save();
    return res;
  }
  async deleteComment(id: number): Promise<void> {
    await super.deleteComment(id);
    await this.save();
  }
}

// Use Firestore for all data storage
import { storage as firestoreStorage } from './firestore-storage';
export const storage = firestoreStorage;
