import { storage } from "./server/storage";

async function main() {
    console.log("Calling getArticles('public')...");
    const articles = await storage.getArticles('public');
    console.log("Result length:", articles.length);
    if (articles.length > 0) {
        console.log("First article author:", articles[0].author.username);
    } else {
        console.log("No articles returned.");
        // Check raw articles map
        // @ts-ignore
        console.log("Raw articles map size:", storage.articles.size);
        // @ts-ignore
        for (const [id, a] of storage.articles) {
            console.log(`Article ID ${id}: isPublic=${a.isPublic}, authorId=${a.authorId}`);
            // @ts-ignore
            const author = await storage.getUser(a.authorId);
            console.log(`  Author lookup result: ${author ? author.username : "NOT FOUND"}`);
        }
    }
}

main().catch(console.error);
