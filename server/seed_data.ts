
import { storage } from "./storage";

async function seed() {
    console.log("Seeding data...");

    console.log("Seeding disabled.");
    // No default data created to keep environment clean as per user request.
}

seed().catch(console.error);
