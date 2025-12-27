
import fetch from 'node-fetch';

async function checkArticles() {
    try {
        const res = await fetch('http://localhost:5000/api/articles');
        if (res.ok) {
            const articles = await res.json() as any[];
            console.log("Count:", articles.length);
            if (articles.length > 0) {
                console.log("First Article Author:", JSON.stringify(articles[0].author, null, 2));
                articles.forEach((a: any) => {
                    console.log(`- Title: ${a.title}, Author: ${a.author?.username}, Public: ${a.isPublic}`);
                });
            }
        } else {
            console.error("Failed:", res.status);
        }
    } catch (e) {
        console.error(e);
    }
}

checkArticles();
