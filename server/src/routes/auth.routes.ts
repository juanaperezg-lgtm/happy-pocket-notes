import { Router } from "express";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { HttpError } from "../lib/http-error";
import { signToken } from "../lib/jwt";
import { requireAuth } from "../middleware/auth";

const router = Router();

const registerSchema = z.object({
  email: z.string().email().transform((value) => value.trim().toLowerCase()),
  password: z.string().min(8),
});

router.post("/register", async (req, res, next) => {
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

router.post("/login", async (req, res, next) => {
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

export const authRoutes = router;
