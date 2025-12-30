import { pgTable, text, serial, integer, boolean, timestamp, jsonb, varchar } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { users } from "./models/auth.js";


export * from "./models/auth.js";

export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertUser = z.infer<typeof insertUserSchema>;

// === ARTICLES ===
export const articles = pgTable("articles", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  content: jsonb("content").notNull(),
  coverImage: text("cover_image"),
  isPublic: boolean("is_public").default(false),
  isArchived: boolean("is_archived").default(false),
  authorId: varchar("author_id").references(() => users.id).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  accessKey: text("access_key"),
  views: integer("views").default(0),
});

export const insertArticleSchema = createInsertSchema(articles).omit({ id: true, createdAt: true, updatedAt: true }).passthrough().extend({
  coverImage: z.string().nullable().optional()
});

// === SOCIAL ===
export const likes = pgTable("likes", {
  id: serial("id").primaryKey(),
  articleId: integer("article_id").references(() => articles.id).notNull(),
  userId: varchar("user_id").references(() => users.id).notNull(),
});

export const bookmarks = pgTable("bookmarks", {
  id: serial("id").primaryKey(),
  articleId: integer("article_id").references(() => articles.id).notNull(),
  userId: varchar("user_id").references(() => users.id).notNull(),
});

export const follows = pgTable("follows", {
  id: serial("id").primaryKey(),
  followerId: varchar("follower_id").references(() => users.id).notNull(),
  followingId: varchar("following_id").references(() => users.id).notNull(),
});

export const comments = pgTable("comments", {
  id: serial("id").primaryKey(),
  articleId: text("article_id").notNull(), // Text to support Firestore string IDs
  userId: varchar("user_id").references(() => users.id).notNull(),
  content: text("content").notNull(),
  parentId: integer("parent_id"), // Added for nested replies
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertCommentSchema = createInsertSchema(comments).omit({ id: true, createdAt: true });
export type Comment = typeof comments.$inferSelect & { author?: any; likeCount?: number; isLiked?: boolean };
export type InsertComment = z.infer<typeof insertCommentSchema>;

// Comment Likes
export const commentLikes = pgTable("comment_likes", {
  id: serial("id").primaryKey(),
  commentId: integer("comment_id").references(() => comments.id).notNull(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});


// === RELATIONS ===
export const usersRelations = relations(users, ({ many }) => ({
  articles: many(articles),
  likes: many(likes),
  bookmarks: many(bookmarks),
  followers: many(follows, { relationName: "followers" }),
  following: many(follows, { relationName: "following" }),
}));

export const articlesRelations = relations(articles, ({ one, many }) => ({
  author: one(users, {
    fields: [articles.authorId],
    references: [users.id],
  }),
  likes: many(likes),
  bookmarks: many(bookmarks),
  followers: many(follows, { relationName: "followers" }), // This seems wrong in original but leaving as is to minimize diff
}));

export const followsRelations = relations(follows, ({ one }) => ({
  follower: one(users, {
    fields: [follows.followerId],
    references: [users.id],
    relationName: "following"
  }),
  following: one(users, {
    fields: [follows.followingId],
    references: [users.id],
    relationName: "followers"
  }),
}));

// === TYPES ===
// User is exported from models/auth
export type Article = typeof articles.$inferSelect;
export type InsertArticle = z.infer<typeof insertArticleSchema>;
export type Like = typeof likes.$inferSelect;
export type Bookmark = typeof bookmarks.$inferSelect;
export type Follow = typeof follows.$inferSelect;

// Firestore/Client adapted types
export interface ClientArticle {
  id: string; // Firestore ID is string
  title: string;
  content: any[];
  coverImage?: string | null;
  isPublic: boolean;
  authorId: string;
  createdAt: Date;
  updatedAt: Date;
  accessKey?: string | null;
  author: {
    id: string;
    username: string;
    displayName?: string;
    avatarUrl?: string | null;
    buyMeACoffeeUrl?: string | null;
  };
  likeCount?: number;
  isLiked?: boolean;
}
