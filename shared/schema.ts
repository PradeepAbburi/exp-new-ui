import { pgTable, text, serial, integer, boolean, timestamp, jsonb, varchar } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { users } from "./models/auth";


export * from "./models/auth";

export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true, updatedAt: true });

// === ARTICLES ===
export const articles = pgTable("articles", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  content: jsonb("content").notNull(), 
  coverImage: text("cover_image"),
  isPublic: boolean("is_public").default(false),
  authorId: varchar("author_id").references(() => users.id).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertArticleSchema = createInsertSchema(articles).omit({ id: true, createdAt: true, updatedAt: true });

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
