import cors from "cors";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import { env } from "./config/env";
import { authRoutes } from "./routes/auth.routes";
import { trackerRoutes } from "./routes/tracker.routes";
import { errorHandler, notFound } from "./middleware/error-handler";

export const app = express();

app.use(helmet());
app.use(
  cors({
    origin: env.CORS_ORIGIN.split(",").map((item: string) => item.trim()),
  }),
);
app.use(express.json({ limit: "1mb" }));
app.use(morgan("dev"));

app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
  });
});

app.use("/api/auth", authRoutes);
app.use("/api", trackerRoutes);

app.use(notFound);
app.use(errorHandler);
