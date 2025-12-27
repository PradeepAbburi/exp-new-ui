
import fs from 'fs-extra';
import path from 'path';

const storageFile = path.join(process.cwd(), 'server', 'data', 'storage.json');

async function cleanStorage() {
    if (await fs.pathExists(storageFile)) {
        console.log("Found storage file, deleting...");
        await fs.remove(storageFile);
        console.log("Storage file deleted. Server restart required.");
    } else {
        console.log("No storage file found.");
    }
}

cleanStorage();
