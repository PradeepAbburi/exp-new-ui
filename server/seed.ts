import { db } from "./db";
import { users, articles, type InsertUser } from "@shared/schema";
import { storage } from "./storage";
import { authStorage } from "./replit_integrations/auth";

async function seed() {
  const existingUsers = await db.select().from(users).limit(1);
  if (existingUsers.length > 0) {
    console.log("Database already seeded");
    return;
  }

  console.log("Seeding database...");

  // Create a demo user
  const demoUser = await authStorage.upsertUser({
    id: "demo-user-123", // Fixed ID for consistency
    email: "demo@example.com",
    username: "demouser",
    firstName: "Demo",
    lastName: "User",
    profileImageUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=demo",
    isProfileComplete: true,
    bio: "I am a demo user who loves writing articles.",
  } as InsertUser);

  // Create articles
  await storage.createArticle({
    title: "Welcome to the Platform",
    content: [
      { type: "heading", content: "Getting Started" },
      { type: "paragraph", content: "This is a block-based editor. You can add text, headings, images, and more." },
      { type: "code", content: "console.log('Hello World');", language: "javascript" }
    ],
    authorId: demoUser.id,
    isPublic: true,
    coverImage: "https://images.unsplash.com/photo-1499750310159-5254f4cc1555?w=800&auto=format&fit=crop",
  });

  await storage.createArticle({
    title: "Markdown Features",
    content: [
      { type: "heading", content: "Rich Text Support" },
      { type: "paragraph", content: "We support various blocks like tables, documents, and media." }
    ],
    authorId: demoUser.id,
    isPublic: true,
  });

  console.log("Seeding complete!");
  process.exit(0);
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
