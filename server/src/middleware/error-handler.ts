import { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import { HttpError } from "../lib/http-error";

export const notFound = (_req: Request, _res: Response, next: NextFunction) => {
  next(new HttpError(404, "Route not found"));
};

export const errorHandler = (error: unknown, _req: Request, res: Response, _next: NextFunction) => {
  if (error instanceof ZodError) {
    return res.status(400).json({
      message: "Invalid request data",
      issues: error.issues.map((issue) => ({
        path: issue.path.join("."),
        message: issue.message,
      })),
    });
  }

  if (error instanceof HttpError) {
    const { status, message } = error;
    return res.status(status).json({ message });
  }

  console.error(error);
  return res.status(500).json({ message: "Internal server error" });
};
