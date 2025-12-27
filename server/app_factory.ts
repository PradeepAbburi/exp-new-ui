import "dotenv/config";
import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { createServer } from "http";

declare module "http" {
    interface IncomingMessage {
        rawBody: unknown;
    }
}

export function log(message: string, source = "express") {
    const formattedTime = new Date().toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        second: "2-digit",
        hour12: true,
    });

    console.log(`${formattedTime} [${source}] ${message}`);
}

export async function setupApp() {
    const app = express();
    const httpServer = createServer(app);

    app.use(
        express.json({
            limit: '50mb',
            verify: (req, _res, buf) => {
                req.rawBody = buf;
            },
        }),
    );
    app.use(express.urlencoded({ extended: true, limit: '50mb' }));

    const corsCallback = (req: any, callback: any) => {
        const allowedOrigins = [
            'http://localhost:5000',
            'https://expertene-ui.vercel.app',
            'https://article-forge-rho.vercel.app',
            // Add any other vercel domains here
        ];
        const origin = req.header('Origin');
        if (allowedOrigins.indexOf(origin) !== -1 || !origin) {
            callback(null, { origin: true, credentials: true });
        } else {
            callback(null, { origin: false });
        }
    };

    // We need to import cors dynamically or use require because it might not be a top-level import in this file previously
    // But better to add it as import at the top. 
    // Since I cannot change imports easily with this replace block if they are far away, I will assume I can just use app.use directly if I had imported it.
    // Wait, I need to add import. I'll use a separate edit for import or just use require if safe. 
    // Let's rely on adding the import in a previous step or just use a simple middleware for now?
    // No, standard cors package is better.
    // I will add the import to the top of the file in a separate replace call if needed, or assume I can rewrite the whole file for safety?
    // Actually, I'll just add a manual CORS middleware for simplicity and robustness without external deps issues in this specific file scope.

    app.use((req, res, next) => {
        const allowedOrigins = ['http://localhost:5000', 'https://expertene-ui.vercel.app', 'https://article-forge-rho.vercel.app'];
        const origin = req.headers.origin;
        if (origin && allowedOrigins.includes(origin as string)) {
            res.setHeader('Access-Control-Allow-Origin', origin as string);
        }
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
        res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type,x-user-id');
        res.setHeader('Access-Control-Allow-Credentials', 'true');
        next();
    });

    app.use((req, res, next) => {
        const start = Date.now();
        const path = req.path;
        let capturedJsonResponse: Record<string, any> | undefined = undefined;

        const originalResJson = res.json;
        res.json = function (bodyJson, ...args) {
            capturedJsonResponse = bodyJson;
            return originalResJson.apply(res, [bodyJson, ...args]);
        };

        res.on("finish", () => {
            const duration = Date.now() - start;
            if (path.startsWith("/api")) {
                let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
                if (capturedJsonResponse) {
                    logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
                }

                log(logLine);
            }
        });

        next();
    });

    await registerRoutes(httpServer, app);

    app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
        const status = err.status || err.statusCode || 500;
        const message = err.message || "Internal Server Error";

        res.status(status).json({ message });
        throw err;
    });

    return { app, httpServer };
}
