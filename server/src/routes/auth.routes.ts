import { Router } from "express";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { HttpError } from "../lib/http-error";
import { signToken, signRefreshToken, verifyToken } from "../lib/jwt";
import { requireAuth } from "../middleware/auth";
import { authLimiter } from "../middleware/rate-limit";

const router = Router();

const registerSchema = z.object({
  email: z.string().email().transform((value) => value.trim().toLowerCase()),
  password: z.string().min(8),
});

router.post("/register", authLimiter, async (req, res, next) => {
  try {
    const input = registerSchema.parse(req.body);

    const existing = await prisma.user.findUnique({
      where: { email: input.email },
      select: { id: true },
    });
    if (existing) {
      throw new HttpError(409, "Email already in use");
    }

    const passwordHash = await bcrypt.hash(input.password, 12);
    const user = await prisma.user.create({
      data: {
        email: input.email,
        passwordHash,
        settings: {
          create: {},
        },
      },
      include: { settings: true },
    });

    const token = signToken({ sub: user.id, email: user.email });
    const refreshToken = signRefreshToken({ sub: user.id, email: user.email });
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });

    return res.status(201).json({
      token,
      user: {
        id: user.id,
        email: user.email,
        settings: user.settings,
      },
    });
  } catch (error) {
    return next(error);
  }
});

router.post("/login", authLimiter, async (req, res, next) => {
  try {
    const input = registerSchema.parse(req.body);
    const user = await prisma.user.findUnique({
      where: { email: input.email },
      include: { settings: true },
    });
    if (!user) throw new HttpError(401, "Invalid credentials");

    const validPassword = await bcrypt.compare(input.password, user.passwordHash);
    if (!validPassword) throw new HttpError(401, "Invalid credentials");

    const token = signToken({ sub: user.id, email: user.email });
    const refreshToken = signRefreshToken({ sub: user.id, email: user.email });
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });

    return res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        settings: user.settings,
      },
    });
  } catch (error) {
    return next(error);
  }
});

router.get("/me", requireAuth, async (req, res, next) => {
  try {
    const userId = req.auth?.sub;
    if (!userId) throw new HttpError(401, "Unauthorized");

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { settings: true },
    });
    if (!user) throw new HttpError(404, "User not found");

    return res.json({
      id: user.id,
      email: user.email,
      settings: user.settings,
    });
  } catch (error) {
    return next(error);
  }
});

router.post("/refresh", async (req, res, next) => {
  try {
    const refreshToken = req.cookies.refreshToken;
    if (!refreshToken) throw new HttpError(401, "No refresh token");

    const decoded = verifyToken(refreshToken, "refresh");
    const user = await prisma.user.findUnique({ where: { id: decoded.sub } });
    if (!user) throw new HttpError(401, "User not found");

    const token = signToken({ sub: user.id, email: user.email });
    const newRefreshToken = signRefreshToken({ sub: user.id, email: user.email });

    res.cookie("refreshToken", newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });

    return res.json({ token });
  } catch (error) {
    res.clearCookie("refreshToken");
    return next(new HttpError(401, "Invalid refresh token"));
  }
});

router.post("/logout", (req, res) => {
  res.clearCookie("refreshToken");
  return res.json({ message: "Logged out" });
});

export const authRoutes = router;
