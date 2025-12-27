
import { FilePersistedStorage } from "./server/storage";
import fs from "fs-extra";
import path from "path";

async function testPersistence() {
    console.log("Testing persistence...");
    const storage = new FilePersistedStorage();

    // Create user
    const user = await storage.createLocalUser("test@test.com", "tester", "pass");
    console.log("User created:", user.id);

    // Create article
    const article = await storage.createArticle({
        title: "Persistence Test",
        content: [],
        authorId: user.id,
        isPublic: true,
        coverImage: null,
        accessKey: null,
        views: 0
    });
    console.log("Article created:", article.id);

    // Check file existence
    const filePath = path.join(process.cwd(), 'server', 'data', 'storage.json');
    if (fs.existsSync(filePath)) {
        console.log("Storage file exists.");
        const data = fs.readJsonSync(filePath);
        console.log("Articles in file:", data.articles.length);
        if (data.articles.length > 0 && data.articles[0].title === "Persistence Test") {
            console.log("SUCCESS: Article persisted correctly.");
        } else {
            console.log("FAILURE: Article not found in file data.");
        }
    } else {
        console.log("FAILURE: Storage file NOT created.");
    }
}

testPersistence().catch(console.error);
