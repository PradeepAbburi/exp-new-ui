
import fetch from 'node-fetch';

async function seed() {
    const userId = "seed_user_api";
    console.log("Seeding via API...");

    // 1. Create Article (User will be auto-created by middleware)
    try {
        const res = await fetch('http://localhost:5000/api/articles', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-user-id': userId
            },
            body: JSON.stringify({
                title: "Welcome to Article Forge (API Seeded)",
                content: [{ id: "1", type: "text", content: "This article confirms that the API and Storage are working correctly." }],
                isPublic: true,
                coverImage: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?q=80&w=2670&auto=format&fit=crop",
                accessKey: ""
            })
        });

        if (res.ok) {
            const data = await res.json();
            console.log("SUCCESS: Article created:", data);
        } else {
            console.error("FAILED to create article:", await res.text());
        }
    } catch (e) {
        console.error("Network error:", e);
    }
}

seed();
