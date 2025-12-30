import { setupApp } from "../server/app_factory.js";

let appPromise: Promise<any> | null = null;

export default async function handler(req: any, res: any) {
    if (!appPromise) {
        appPromise = setupApp().then(({ app }) => app);
    }
    const app = await appPromise;
    app(req, res);
}
