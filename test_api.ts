
// Node 18+ has global fetch

async function testPost() {
    console.log("Testing POST /api/articles...");
    const userId = "test_user_manual";
    const res = await fetch("http://localhost:5000/api/articles", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "x-user-id": userId,
            "x-user-name": "Test User",
            "x-user-email": "test@example.com"
        },
        body: JSON.stringify({
            title: "Manual Test Post",
            content: [{ id: "1", type: "text", content: "Hello world" }],
            isPublic: true,
            coverImage: null,
            accessKey: null,
            tags: ["test"]
        })
    });

    console.log("Status:", res.status);
    const data = await res.json();
    console.log("Response:", data);
}

testPost().catch(console.error);
