import cors from "cors";
import express from "express";
import helmet from "helmet";
import pinoHttp from "pino-http";
import cookieParser from "cookie-parser";
import path from "path";
import { env } from "./config/env";
import { authRoutes } from "./routes/auth.routes";
import { trackerRoutes } from "./routes/tracker.routes";
import { errorHandler, notFound } from "./middleware/error-handler";
import { logger } from "./lib/logger";
import { globalLimiter } from "./middleware/rate-limit";

export const app = express();

app.use(helmet({ contentSecurityPolicy: false }));
app.use(
  cors({
    origin: env.CORS_ORIGIN ? env.CORS_ORIGIN.split(",").map((item: string) => item.trim()) : "*",
    credentials: true,
  }),
);
app.use(express.json({ limit: "1mb" }));
app.use(cookieParser());
app.use(pinoHttp({ logger, autoLogging: process.env.NODE_ENV !== 'test' }));
app.use("/api", globalLimiter);

app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
  });
});

app.use("/api/auth", authRoutes);
app.use("/api", trackerRoutes);

// Serve static frontend files (PWA)
app.use(express.static(path.join(process.cwd(), "dist")));

// Fallback to index.html for client-side routing
app.use((req, res, next) => {
  if (req.method === "GET" && !req.path.startsWith("/api")) {
    res.sendFile(path.join(process.cwd(), "dist", "index.html"));
  } else {
    next();
  }
});

app.use(notFound);
app.use(errorHandler);
