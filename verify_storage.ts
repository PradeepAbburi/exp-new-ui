
import { api } from "./shared/routes";
import { storage } from "./server/storage";

async function verify() {
    console.log("Verifying storage...");

    // 1. Create a user
    const user = await storage.createLocalUser("test@test.com", "testuser", "pass");
    console.log("User created:", user.id);

    // 2. Create an article
    const article = await storage.createArticle({
        title: "Test Article",
        content: [],
        authorId: user.id,
        isPublic: true,
        tags: [],
        coverImage: "",
        accessKey: ""
    });
    console.log("Article created:", article.id);

    // 3. Fetch articles
    const articles = await storage.getArticles('public');
    console.log("Articles found:", articles.length);

    if (articles.length > 0 && articles[0].id === article.id) {
        console.log("SUCCESS: Storage is working and persisting (in memory at least)");
    } else {
        console.error("FAILURE: Article not found");
    }
}

verify().catch(console.error);
