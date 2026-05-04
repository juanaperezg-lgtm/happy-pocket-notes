import jwt from "jsonwebtoken";
import { env } from "../config/env";

export interface AuthTokenPayload {
  sub: string;
  email: string;
  type?: "access" | "refresh";
}

export const signToken = (payload: AuthTokenPayload) =>
  jwt.sign({ ...payload, type: "access" }, env.JWT_SECRET as jwt.Secret, {
    expiresIn: "15m",
  } as jwt.SignOptions);

export const signRefreshToken = (payload: AuthTokenPayload) =>
  jwt.sign({ ...payload, type: "refresh" }, env.JWT_SECRET as jwt.Secret, {
    expiresIn: "30d",
  } as jwt.SignOptions);

export const verifyToken = (token: string, type: "access" | "refresh" = "access") => {
  const decoded = jwt.verify(token, env.JWT_SECRET) as AuthTokenPayload;
  if (decoded.type !== type && decoded.type !== undefined) throw new Error("Invalid token type");
  return decoded;
};
