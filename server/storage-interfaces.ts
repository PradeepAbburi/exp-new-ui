import {
    type User,
    type Article,
    type InsertArticle,
    type InsertUser,
    type InsertComment,
    type Comment
} from "@shared/schema";

export interface IStorage {
    // Users
    getUser(id: string): Promise<User | undefined>;
    getUserByUsername(username: string): Promise<User | undefined>;
    getUserByEmail(email: string): Promise<User | undefined>;
    getAllUsers(): Promise<User[]>;
    updateUser(id: string, user: Partial<InsertUser>): Promise<User>;
    upsertUser(user: Partial<User> & { id: string }): Promise<User>;
    createLocalUser(email: string, username: string, passwordHash: string): Promise<User>;
    deleteUser(id: string): Promise<void>;

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
    getAllReports(): Promise<any[]>;
    deleteReport(reportId: string): Promise<void>;
    updateReportStatus(reportId: string, status: string): Promise<void>;

    // Translation
    translateArticle?(articleId: number, targetLanguage: string): Promise<Article>;
}
