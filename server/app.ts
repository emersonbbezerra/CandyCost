import cors from "cors";
import express from "express";
import { setupAuth } from "./auth";
import { registerRoutes } from "./routes";
import { log, serveStatic, setupVite } from "./vite";

const app = express();

app.use(cors({
  origin: "http://localhost:3000",
  credentials: true,
}));

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Middleware para log de requisições API
app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson: any) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "...";
      }

      log(logLine);
    }
  });

  next();
});

export async function setupApp() {
  await setupAuth(app);
  if (app.get("env") !== "development") {
    serveStatic(app);
  }
  await registerRoutes(app);
  return app;
}


export async function setupViteIfDev(app: express.Express, server: any) {
  if (app.get("env") === "development") {
    await setupVite(app, server);
  }
}
