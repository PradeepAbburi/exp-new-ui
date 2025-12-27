
import fs from 'fs-extra';
import path from 'path';

async function testFs() {
    const file = path.join(process.cwd(), 'server', 'data', 'test.json');
    console.log("Writing to", file);
    try {
        await fs.ensureDir(path.dirname(file));
        await fs.writeJson(file, { hello: "world" });
        console.log("Write success");
        const read = await fs.readJson(file);
        console.log("Read:", read);
    } catch (e) {
        console.error("FS Error:", e);
    }
}

testFs();
