import jwt from "jsonwebtoken";
import { env } from "../config/env";

export interface AuthTokenPayload {
  sub: string;
  email: string;
}

export const signToken = (payload: AuthTokenPayload) =>
  jwt.sign(payload, env.JWT_SECRET as jwt.Secret, {
    expiresIn: env.JWT_EXPIRES_IN,
  } as jwt.SignOptions);

export const verifyToken = (token: string) => jwt.verify(token, env.JWT_SECRET) as AuthTokenPayload;
