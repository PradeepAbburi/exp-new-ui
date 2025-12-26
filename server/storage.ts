import { db } from "./db";
import {
  articles,
  users,
  likes,
  bookmarks,
  follows,
  type User,
  type Article,
  type InsertArticle,
  type InsertUser
} from "@shared/schema";
import { eq, desc, and, sql } from "drizzle-orm";

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  updateUser(id: string, user: Partial<InsertUser>): Promise<User>;
  
  // Articles
  createArticle(article: InsertArticle): Promise<Article>;
  getArticle(id: number): Promise<Article | undefined>;
  getArticles(view?: string, userId?: string): Promise<(Article & { author: User, likeCount: number, isLiked: boolean })[]>;
  updateArticle(id: number, article: Partial<InsertArticle>): Promise<Article>;
  deleteArticle(id: number): Promise<void>;
  
  // Social
  toggleLike(articleId: number, userId: string): Promise<boolean>;
  toggleBookmark(articleId: number, userId: string): Promise<boolean>;
  toggleFollow(followerId: string, followingId: string): Promise<boolean>;
  
  getArticleLikes(articleId: number): Promise<number>;
  hasLiked(articleId: number, userId: string): Promise<boolean>;
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

  async getArticles(view: string = 'public', userId?: string): Promise<(Article & { author: User, likeCount: number, isLiked: boolean })[]> {
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
      if (userId) {
        const [like] = await db.select().from(likes).where(and(eq(likes.articleId, article.id), eq(likes.userId, userId)));
        isLiked = !!like;
      }
      return { ...article, author, likeCount: Number(likeCount.count), isLiked };
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
}

export const storage = new DatabaseStorage();
