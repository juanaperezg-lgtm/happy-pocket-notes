import { NextFunction, Request, Response } from "express";
import { HttpError } from "../lib/http-error";
import { verifyToken } from "../lib/jwt";

export const requireAuth = (req: Request, _res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return next(new HttpError(401, "Missing or invalid authorization header"));
  }

  const token = authHeader.slice("Bearer ".length).trim();
  try {
    req.auth = verifyToken(token, "access");
    return next();
  } catch {
    return next(new HttpError(401, "Invalid or expired token"));
  }
};
