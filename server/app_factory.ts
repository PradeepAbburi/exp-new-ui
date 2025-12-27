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

    // CORS Middleware
    app.use((req, res, next) => {
        const allowedOrigins = [
            'http://localhost:5000',
            'https://expertene-ui.vercel.app',
            'https://article-forge-rho.vercel.app',
            'https://expertene.tech',
            'https://www.expertene.tech'
        ];
        const origin = req.headers.origin;
        if (origin && allowedOrigins.includes(origin as string)) {
            res.setHeader('Access-Control-Allow-Origin', origin as string);
        }
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
        res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type,x-user-id');
        res.setHeader('Access-Control-Allow-Credentials', 'true');

        // Handle preflight requests
        if (req.method === 'OPTIONS') {
            res.sendStatus(200);
            return;
        }

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
