import { initializeApp, getApp } from 'firebase/app';
import { getFirestore, collection, doc, getDoc, getDocs, setDoc, updateDoc, deleteDoc, query, where, orderBy, limit, increment, serverTimestamp, Timestamp, addDoc, QuerySnapshot, DocumentData } from 'firebase/firestore';
import { IStorage } from './storage-interfaces.js';
import { type User, type Article, type InsertArticle, type InsertUser, type InsertComment, type Comment } from '../shared/schema.js';

// Firebase configuration (same as client)
const firebaseConfig = {
    apiKey: "AIzaSyC4jFJ3jCXd7Q5nydQaBSQWaVKvFhTkmJs",
    authDomain: "expertene-59771.firebaseapp.com",
    projectId: "expertene-59771",
    storageBucket: "expertene-59771.firebasestorage.app",
    messagingSenderId: "284086686035",
    appId: "1:284086686035:web:f7f79f6730d430db7091a6",
    measurementId: "G-0GQ6P1ML29",
};

import { getAuth, signInAnonymously } from 'firebase/auth';

// Initialize Firebase with robustness
let app;
let db: any;
let auth: any;

try {
    try {
        app = getApp('server-app');
    } catch {
        app = initializeApp(firebaseConfig, 'server-app');
    }

    db = getFirestore(app);
    auth = getAuth(app); // Assign auth here globally so we can use it in constructor

    console.log('✅ Firestore initialized successfully for server');
} catch (error) {
    console.error("❌ CRITICAL: Failed to initialize Firebase:", error);
    // We do not rethrow so the server can verify routes and show health check
}

// Helper to convert Firestore timestamps to Date
function convertTimestamp(data: any): any {
    if (!data) return data;
    const result = { ...data };
    if (result.createdAt && typeof result.createdAt.toDate === 'function') {
        result.createdAt = result.createdAt.toDate();
    }
    if (result.updatedAt && typeof result.updatedAt.toDate === 'function') {
        result.updatedAt = result.updatedAt.toDate();
    }
    return result;
}

export class FirestoreStorage implements IStorage {
    private readonly ready: Promise<void>;

    constructor() {
        this.ready = new Promise<void>((resolve) => {
            try {
                // Initialized in global scope above, but we ensure auth here
                if (auth && !auth.currentUser) {
                    signInAnonymously(auth).then((userCred) => {
                        console.log('✅ Storage ready: Authenticated as', userCred.user.uid);
                        resolve();
                    }).catch((err) => {
                        console.error('❌ Storage warning: Auth failed', err);
                        resolve(); // Resolve anyway to try public access
                    });
                } else {
                    resolve();
                }
            } catch (e) {
                console.error('❌ Storage init error:', e);
                resolve();
            }
        });
    }

    // ============================================
    // USERS
    // ============================================

    async getUser(id: string): Promise<User | undefined> {
        await this.ready;
        try {
            const docRef = doc(db, 'users', id);
            const docSnap = await getDoc(docRef);
            if (!docSnap.exists()) return undefined;

            const userData = docSnap.data();
            // Normalize avatar field names (handle avatarUrl, avatar_url, profileImageUrl variations)
            const normalizedUser = {
                ...userData,
                id: docSnap.id,
                avatarUrl: userData.avatarUrl || userData.avatar_url || userData.profileImageUrl || null,
                displayName: userData.displayName || userData.display_name || userData.username || null,
            };

            return convertTimestamp(normalizedUser) as User;
        } catch (error) {
            console.error(`[Firestore] getUser(${id}) failed:`, error);
            return undefined;
        }
    }

    async getUserByUsername(username: string): Promise<User | undefined> {
        await this.ready;
        const q = query(collection(db, 'users'), where('username', '==', username), limit(1));
        const snapshot = await getDocs(q);

        if (snapshot.empty) return undefined;
        const docSnap = snapshot.docs[0];
        return convertTimestamp({ id: docSnap.id, ...docSnap.data() }) as User;
    }

    async getUserByEmail(email: string): Promise<User | undefined> {
        await this.ready;
        const q = query(collection(db, 'users'), where('email', '==', email), limit(1));
        const snapshot = await getDocs(q);

        if (snapshot.empty) return undefined;
        const docSnap = snapshot.docs[0];
        return convertTimestamp({ id: docSnap.id, ...docSnap.data() }) as User;
    }

    async getAllUsers(): Promise<User[]> {
        await this.ready;
        const snapshot = await getDocs(collection(db, 'users'));
        return snapshot.docs.map(doc => convertTimestamp({ id: doc.id, ...doc.data() })) as User[];
    }

    async createLocalUser(email: string, username: string, passwordHash: string): Promise<User> {
        await this.ready;
        const userRef = doc(collection(db, 'users'));
        const user: any = {
            id: userRef.id,
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
            bio: null,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
        };

        await setDoc(userRef, user);
        return { ...user, createdAt: new Date(), updatedAt: new Date() } as User;
    }

    async updateUser(id: string, updates: Partial<InsertUser>): Promise<User> {
        await this.ready;
        const userRef = doc(db, 'users', id);
        await updateDoc(userRef, {
            ...updates,
            updatedAt: serverTimestamp()
        });

        const updated = await getDoc(userRef);
        return convertTimestamp({ id: updated.id, ...updated.data() }) as User;
    }

    async deleteUser(id: string): Promise<void> {
        await this.ready;
        await deleteDoc(doc(db, 'users', id));
    }

    async upsertUser(user: Partial<User> & { id: string }): Promise<User> {
        await this.ready;
        const userRef = doc(db, 'users', user.id);
        const docSnap = await getDoc(userRef);

        const userData: any = {
            ...user,
            updatedAt: serverTimestamp(),
            createdAt: docSnap.exists() ? docSnap.data()?.createdAt : serverTimestamp()
        };

        await setDoc(userRef, userData, { merge: true });
        const updated = await getDoc(userRef);
        return convertTimestamp({ id: updated.id, ...updated.data() }) as User;
    }

    async getUserStats(userId: string): Promise<{ posts: number, followers: number, following: number }> {
        await this.ready;
        try {
            const [articlesSnap, followersSnap, followingSnap] = await Promise.all([
                getDocs(query(collection(db, 'articles'), where('authorId', '==', userId))),
                getDocs(query(collection(db, 'follows'), where('followingId', '==', userId))),
                getDocs(query(collection(db, 'follows'), where('followerId', '==', userId)))
            ]);

            // Filter out archived articles in memory
            const nonArchivedArticles = articlesSnap.docs.filter(doc => !doc.data().isArchived);

            return {
                posts: nonArchivedArticles.length,
                followers: followersSnap.size,
                following: followingSnap.size
            };
        } catch (error) {
            console.error('[Firestore] Error in getUserStats:', error);
            return { posts: 0, followers: 0, following: 0 };
        }
    }

    // ============================================
    // ARTICLES
    // ============================================

    async createArticle(article: InsertArticle): Promise<Article> {
        await this.ready;
        // Get the next ID from a counter document
        const counterRef = doc(db, '_counters', 'articles');
        const counterSnap = await getDoc(counterRef);
        const nextId = counterSnap.exists() ? (counterSnap.data().count || 0) + 1 : 1;

        const newArticle: any = {
            ...article,
            id: nextId,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
            isPublic: article.isPublic ?? true,
            coverImage: article.coverImage ?? null,
            accessKey: article.accessKey ?? null,
            isArchived: article.isArchived ?? false,
            views: 0,
        };

        // Create article with numeric ID as part of the document
        const articleRef = doc(collection(db, 'articles'));
        await setDoc(articleRef, newArticle);

        // Update counter
        await setDoc(counterRef, { count: nextId }, { merge: true });

        return { ...newArticle, createdAt: new Date(), updatedAt: new Date() } as Article;
    }

    async getArticle(id: any): Promise<Article | undefined> {
        await this.ready;
        // Try fetching by document ID first (string IDs)
        try {
            const docRef = doc(db, 'articles', String(id));
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
                const data = convertTimestamp(docSnap.data());
                // Remove numeric id field and use document ID
                const { id: numericId, ...restData } = data as any;
                return { ...restData, id: docSnap.id } as Article;
            }
        } catch (error) {
            console.error('[Firestore] Error fetching article by document ID:', error);
        }

        // Fallback: Try to fetch by numeric ID
        try {
            const numericId = Number(id);
            if (!isNaN(numericId)) {
                const numericQuery = query(collection(db, 'articles'), where('id', '==', numericId), limit(1));
                const numericSnapshot = await getDocs(numericQuery);

                if (!numericSnapshot.empty) {
                    const data = convertTimestamp(numericSnapshot.docs[0].data());
                    const { id: _, ...restData } = data as any;
                    return { ...restData, id: numericSnapshot.docs[0].id } as Article;
                }
            }
        } catch (error) {
            console.error('[Firestore] Error fetching article by numeric ID:', error);
        }

        return undefined;
    }

    async getArticles(view: string = 'public', userId?: string): Promise<(Article & { author: User, likeCount: number, isLiked: boolean, isBookmarked: boolean })[]> {
        await this.ready;
        try {
            console.log(`[Firestore] getArticles called: view=${view}, userId=${userId}`);

            // Fetch all articles from Firestore (no complex queries to avoid index requirements)
            const snapshot = await getDocs(collection(db, 'articles'));
            console.log(`[Firestore] Found ${snapshot.size} total articles in Firestore`);

            // Get all articles and filter in memory - use document ID as primary ID
            let articles = snapshot.docs.map(doc => {
                const data = convertTimestamp(doc.data());
                // Create object without the old numeric id
                const { id: numericId, ...restData } = data as any;

                // Use Firestore document ID as the primary ID to ensure uniqueness
                return { ...restData, id: String(doc.id) } as any;
            });

            // Apply filters in memory
            if (view === 'public') {
                // Show ALL articles (public and private) but filter out archived ones
                // Private articles will show with a lock icon, passcode required to view content
                articles = articles.filter(a => !a.isArchived);
            } else if (view === 'mine' && userId) {
                articles = articles.filter(a => a.authorId === userId);
            } else if (view === 'feed' && userId) {
                // Show all non-archived articles in feed
                articles = articles.filter(a => !a.isArchived);
            }

            // Sort by createdAt in memory
            articles.sort((a, b) => {
                const dateA = a.createdAt instanceof Date ? a.createdAt.getTime() : 0;
                const dateB = b.createdAt instanceof Date ? b.createdAt.getTime() : 0;
                return dateB - dateA; // Descending order
            });

            console.log(`[Firestore] After filtering: ${articles.length} articles`);

            // Enrich with author and social data
            const enriched = await Promise.all(articles.map(async (article) => {
                const author = await this.getUser(article.authorId);
                const safeAuthor = author || {
                    id: article.authorId,
                    username: 'unknown_user',
                    displayName: 'Unknown User',
                    avatarUrl: null,
                    buyMeACoffeeUrl: null
                } as User;

                if (!author) {
                    console.log(`[Firestore] Author ${article.authorId} not found for article ${article.id}, using fallback`);
                }

                const likeCount = await this.getArticleLikes(article.id);
                const isLiked = userId ? await this.hasLiked(article.id, userId) : false;
                const isBookmarked = userId ? await this.hasBookmarked(article.id, userId) : false;

                // Filter for bookmarks view
                if (view === 'bookmarks' && !isBookmarked) return null;

                return { ...article, author: safeAuthor, likeCount, isLiked, isBookmarked };
            }));

            const result = enriched.filter(Boolean) as (Article & { author: User, likeCount: number, isLiked: boolean, isBookmarked: boolean })[];
            console.log(`[Firestore] Returning ${result.length} enriched articles`);
            return result;
        } catch (error) {
            console.error('[Firestore] Error in getArticles:', error);
            return [];
        }
    }

    async updateArticle(id: any, updates: Partial<InsertArticle>): Promise<Article> {
        await this.ready;

        // Try to update by Document ID first (standard path)
        try {
            const docRef = doc(db, 'articles', String(id));
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
                await updateDoc(docRef, {
                    ...updates,
                    updatedAt: serverTimestamp()
                });
                const updated = await getDoc(docRef);
                return convertTimestamp({ ...updated.data(), id: updated.id }) as Article;
            }
        } catch (e) {
            console.log(`[Firestore] Update by Doc ID failed, trying numeric ID fallback for ${id}`);
        }

        // Fallback: Query by numeric 'id' field
        const q = query(collection(db, 'articles'), where('id', '==', Number(id)), limit(1));
        const snapshot = await getDocs(q);
        if (snapshot.empty) throw new Error('Article not found');

        const docRef = snapshot.docs[0].ref;
        await updateDoc(docRef, {
            ...updates,
            updatedAt: serverTimestamp()
        });

        const updated = await getDoc(docRef);
        // Use doc.id to be consistent with getArticles
        const data = convertTimestamp(updated.data());
        const { id: _, ...rest } = data as any;
        return { ...rest, id: updated.id } as Article;
    }

    async deleteArticle(id: any): Promise<void> {
        await this.ready;

        // Try by Document ID first
        try {
            const docRef = doc(db, 'articles', String(id));
            // Check if exists before deleting to handle legacy numeric ID fallback gracefully?
            // Actually deleteDoc doesn't throw if not exists, but we want to ensure we target the right thing.
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                await deleteDoc(docRef);
                return;
            }
        } catch (e) {
            // ignore
        }

        // Fallback by numeric ID
        const q = query(collection(db, 'articles'), where('id', '==', Number(id)), limit(1));
        const snapshot = await getDocs(q);
        if (!snapshot.empty) {
            await deleteDoc(snapshot.docs[0].ref);
        }
    }

    async incrementView(id: any): Promise<void> {
        await this.ready;

        // Try by Document ID first
        try {
            const docRef = doc(db, 'articles', String(id));
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                await updateDoc(docRef, { views: increment(1) });
                return;
            }
        } catch (e) { }

        // Fallback
        const q = query(collection(db, 'articles'), where('id', '==', Number(id)), limit(1));
        const snapshot = await getDocs(q);
        if (!snapshot.empty) {
            await updateDoc(snapshot.docs[0].ref, {
                views: increment(1)
            });
        }
    }

    // ============================================
    // SOCIAL (Likes, Bookmarks, Follows)
    // ============================================

    async toggleLike(articleId: any, userId: string): Promise<boolean> {
        await this.ready;
        const q = query(collection(db, 'likes'), where('articleId', '==', articleId), where('userId', '==', userId), limit(1));
        const snapshot = await getDocs(q);

        if (!snapshot.empty) {
            await deleteDoc(snapshot.docs[0].ref);
            return false;
        } else {
            await addDoc(collection(db, 'likes'), { articleId, userId, createdAt: serverTimestamp() });
            return true;
        }
    }

    async toggleBookmark(articleId: any, userId: string): Promise<boolean> {
        await this.ready;
        const q = query(collection(db, 'bookmarks'), where('articleId', '==', articleId), where('userId', '==', userId), limit(1));
        const snapshot = await getDocs(q);

        if (!snapshot.empty) {
            await deleteDoc(snapshot.docs[0].ref);
            return false;
        } else {
            await addDoc(collection(db, 'bookmarks'), { articleId, userId, createdAt: serverTimestamp() });
            return true;
        }
    }

    async toggleFollow(followerId: string, followingId: string): Promise<boolean> {
        await this.ready;
        const q = query(collection(db, 'follows'), where('followerId', '==', followerId), where('followingId', '==', followingId), limit(1));
        const snapshot = await getDocs(q);

        if (!snapshot.empty) {
            await deleteDoc(snapshot.docs[0].ref);
            return false;
        } else {
            await addDoc(collection(db, 'follows'), { followerId, followingId, createdAt: serverTimestamp() });
            return true;
        }
    }

    async getArticleLikes(articleId: any): Promise<number> {
        await this.ready;
        const q = query(collection(db, 'likes'), where('articleId', '==', articleId));
        const snapshot = await getDocs(q);
        return snapshot.size;
    }

    async hasLiked(articleId: any, userId: string): Promise<boolean> {
        await this.ready;
        const q = query(collection(db, 'likes'), where('articleId', '==', articleId), where('userId', '==', userId), limit(1));
        const snapshot = await getDocs(q);
        return !snapshot.empty;
    }

    async hasBookmarked(articleId: any, userId: string): Promise<boolean> {
        await this.ready;
        const q = query(collection(db, 'bookmarks'), where('articleId', '==', articleId), where('userId', '==', userId), limit(1));
        const snapshot = await getDocs(q);
        return !snapshot.empty;
    }

    // ============================================
    // COMMENTS
    // ============================================

    async createComment(comment: InsertComment): Promise<Comment> {
        await this.ready;
        // Get the next ID from a counter document
        const counterRef = doc(db, '_counters', 'comments');
        const counterSnap = await getDoc(counterRef);
        const nextId = counterSnap.exists() ? (counterSnap.data().count || 0) + 1 : 1;

        const newComment: any = {
            ...comment,
            id: nextId,
            parentId: comment.parentId ?? null,
            createdAt: serverTimestamp(),
        };

        await addDoc(collection(db, 'comments'), newComment);

        // Update counter
        await setDoc(counterRef, { count: nextId }, { merge: true });

        return { ...newComment, createdAt: new Date() } as Comment;
    }

    async getComments(articleId: any): Promise<(Comment & { author: User })[]> {
        await this.ready;
        try {
            // Fetch all comments for this article without orderBy to avoid index
            const q = query(collection(db, 'comments'), where('articleId', '==', String(articleId)));
            const snapshot = await getDocs(q);

            const comments = await Promise.all(snapshot.docs.map(async (docSnap) => {
                const comment = convertTimestamp(docSnap.data()) as Comment;
                const author = await this.getUser(comment.userId);
                if (!author) return null;
                return { ...comment, author };
            }));

            // Sort in memory
            const filtered = comments.filter(Boolean) as (Comment & { author: User })[];
            filtered.sort((a, b) => {
                const dateA = a.createdAt instanceof Date ? a.createdAt.getTime() : 0;
                const dateB = b.createdAt instanceof Date ? b.createdAt.getTime() : 0;
                return dateB - dateA;
            });

            return filtered;
        } catch (error) {
            console.error('[Firestore] Error in getComments:', error);
            return [];
        }
    }

    async deleteComment(id: any): Promise<void> {
        await this.ready;
        const q = query(collection(db, 'comments'), where('id', '==', id), limit(1));
        const snapshot = await getDocs(q);
        if (!snapshot.empty) {
            await deleteDoc(snapshot.docs[0].ref);
        }
    }

    // ============================================
    // REPORTS
    // ============================================

    async createReport(articleId: any, reporterId: string, reason: string): Promise<void> {
        await this.ready;
        await addDoc(collection(db, 'reports'), {
            articleId,
            reporterId,
            reason,
            status: 'pending',
            createdAt: serverTimestamp()
        });
    }

    async getAllReports(): Promise<any[]> {
        await this.ready;
        const snapshot = await getDocs(collection(db, 'reports'));
        return snapshot.docs.map(doc => convertTimestamp({ id: doc.id, ...doc.data() }));
    }

    async updateReportStatus(reportId: string, status: string): Promise<void> {
        await this.ready;
        await updateDoc(doc(db, 'reports', reportId), { status });
    }

    async deleteReport(reportId: string): Promise<void> {
        await this.ready;
        await deleteDoc(doc(db, 'reports', reportId));
    }
}

export const storage = new FirestoreStorage();
