import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { HttpError } from "../lib/http-error";
import { requireAuth } from "../middleware/auth";
import {
  amountToStorageCents,
  centsToStorageAmount,
  deserializeJournal,
  deserializeTransaction,
  serializeJournal,
  serializeTransaction,
} from "../utils/serializers";

const router = Router();
router.use(requireAuth);

const idSchema = z.object({
  id: z.string().uuid(),
});

const transactionSchema = z.object({
  kind: z.enum(["expense", "income"]),
  category: z.string().trim().min(1).max(80),
  amount: z.number().positive().max(1_000_000_000),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  note: z.string().trim().max(240).optional(),
});

const journalSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  text: z.string().trim().min(1).max(5000),
});

const settingsSchema = z.object({
  language: z.string().min(2).max(8).optional(),
  locale: z.string().min(2).max(20).optional(),
  currency: z.string().length(3).optional(),
  budget: z.number().nonnegative().max(1_000_000_000).optional(),
  categoryBudgets: z.record(z.string(), z.number().nonnegative().max(1_000_000_000)).optional(),
});

router.get("/bootstrap", async (req, res, next) => {
  try {
    const userId = req.auth?.sub;
    if (!userId) throw new HttpError(401, "Unauthorized");

    const [transactions, journals, settings] = await Promise.all([
      prisma.transaction.findMany({
        where: { userId },
        orderBy: [{ date: "desc" }, { createdAt: "desc" }],
      }),
      prisma.journalEntry.findMany({
        where: { userId },
        orderBy: [{ date: "desc" }, { createdAt: "desc" }],
      }),
      prisma.userSettings.findUnique({
        where: { userId },
      }),
    ]);

    return res.json({
      transactions: transactions.map(serializeTransaction),
      journal: journals.map(serializeJournal),
      budget: settings ? centsToStorageAmount(settings.monthlyBudgetCents) : 0,
      settings: {
        language: settings?.language ?? "es",
        locale: settings?.locale ?? "es-CO",
        currency: settings?.currency ?? "COP",
      },
      categoryBudgets: typeof settings?.categoryBudgets === "object" && settings.categoryBudgets ? settings.categoryBudgets : {},
    });
  } catch (error) {
    return next(error);
  }
});

router.get("/transactions", async (req, res, next) => {
  try {
    const userId = req.auth?.sub;
    if (!userId) throw new HttpError(401, "Unauthorized");

    const transactions = await prisma.transaction.findMany({
      where: { userId },
      orderBy: [{ date: "desc" }, { createdAt: "desc" }],
    });
    return res.json(transactions.map(serializeTransaction));
  } catch (error) {
    return next(error);
  }
});

router.post("/transactions", async (req, res, next) => {
  try {
    const userId = req.auth?.sub;
    if (!userId) throw new HttpError(401, "Unauthorized");

    const input = transactionSchema.parse(req.body);
    const transaction = await prisma.transaction.create({
      data: {
        userId,
        ...deserializeTransaction(input),
      },
    });
    return res.status(201).json(serializeTransaction(transaction));
  } catch (error) {
    return next(error);
  }
});

router.put("/transactions/:id", async (req, res, next) => {
  try {
    const userId = req.auth?.sub;
    if (!userId) throw new HttpError(401, "Unauthorized");

    const params = idSchema.parse(req.params);
    const input = transactionSchema.parse(req.body);

    const existing = await prisma.transaction.findFirst({
      where: { id: params.id, userId },
      select: { id: true },
    });
    if (!existing) throw new HttpError(404, "Transaction not found");

    const updated = await prisma.transaction.update({
      where: { id: params.id },
      data: deserializeTransaction(input),
    });
    return res.json(serializeTransaction(updated));
  } catch (error) {
    return next(error);
  }
});

router.delete("/transactions/:id", async (req, res, next) => {
  try {
    const userId = req.auth?.sub;
    if (!userId) throw new HttpError(401, "Unauthorized");

    const params = idSchema.parse(req.params);
    const existing = await prisma.transaction.findFirst({
      where: { id: params.id, userId },
      select: { id: true },
    });
    if (!existing) throw new HttpError(404, "Transaction not found");

    await prisma.transaction.delete({ where: { id: params.id } });
    return res.status(204).send();
  } catch (error) {
    return next(error);
  }
});

router.get("/journal", async (req, res, next) => {
  try {
    const userId = req.auth?.sub;
    if (!userId) throw new HttpError(401, "Unauthorized");

    const journals = await prisma.journalEntry.findMany({
      where: { userId },
      orderBy: [{ date: "desc" }, { createdAt: "desc" }],
    });
    return res.json(journals.map(serializeJournal));
  } catch (error) {
    return next(error);
  }
});

router.post("/journal", async (req, res, next) => {
  try {
    const userId = req.auth?.sub;
    if (!userId) throw new HttpError(401, "Unauthorized");

    const input = journalSchema.parse(req.body);
    const journal = await prisma.journalEntry.create({
      data: {
        userId,
        ...deserializeJournal(input),
      },
    });
    return res.status(201).json(serializeJournal(journal));
  } catch (error) {
    return next(error);
  }
});

router.delete("/journal/:id", async (req, res, next) => {
  try {
    const userId = req.auth?.sub;
    if (!userId) throw new HttpError(401, "Unauthorized");

    const params = idSchema.parse(req.params);
    const existing = await prisma.journalEntry.findFirst({
      where: { id: params.id, userId },
      select: { id: true },
    });
    if (!existing) throw new HttpError(404, "Journal entry not found");

    await prisma.journalEntry.delete({ where: { id: params.id } });
    return res.status(204).send();
  } catch (error) {
    return next(error);
  }
});

router.get("/settings", async (req, res, next) => {
  try {
    const userId = req.auth?.sub;
    if (!userId) throw new HttpError(401, "Unauthorized");

    const settings = await prisma.userSettings.findUnique({ where: { userId } });
    if (!settings) throw new HttpError(404, "Settings not found");

    return res.json({
      language: settings.language,
      locale: settings.locale,
      currency: settings.currency,
      budget: centsToStorageAmount(settings.monthlyBudgetCents),
      categoryBudgets: typeof settings.categoryBudgets === "object" && settings.categoryBudgets ? settings.categoryBudgets : {},
    });
  } catch (error) {
    return next(error);
  }
});

router.put("/settings", async (req, res, next) => {
  try {
    const userId = req.auth?.sub;
    if (!userId) throw new HttpError(401, "Unauthorized");

    const input = settingsSchema.parse(req.body);
    const settings = await prisma.userSettings.upsert({
      where: { userId },
      update: {
        language: input.language,
        locale: input.locale,
        currency: input.currency?.toUpperCase(),
        monthlyBudgetCents: input.budget !== undefined ? amountToStorageCents(input.budget) : undefined,
        categoryBudgets: input.categoryBudgets,
      },
      create: {
        userId,
        language: input.language ?? "es",
        locale: input.locale ?? "es-CO",
        currency: input.currency?.toUpperCase() ?? "COP",
        monthlyBudgetCents: amountToStorageCents(input.budget ?? 0),
        categoryBudgets: input.categoryBudgets ?? {},
      },
    });

    return res.json({
      language: settings.language,
      locale: settings.locale,
      currency: settings.currency,
      budget: centsToStorageAmount(settings.monthlyBudgetCents),
      categoryBudgets: typeof settings.categoryBudgets === "object" && settings.categoryBudgets ? settings.categoryBudgets : {},
    });
  } catch (error) {
    return next(error);
  }
});

export const trackerRoutes = router;
