import { useCallback, useEffect, useMemo, useState } from "react";
import { apiRequest } from "@/lib/api";

export type ExpenseCategory = "food" | "transport" | "health" | "home" | "personal";
export type IncomeCategory = "salary" | "freelance" | "gift" | "other";
export type Category = ExpenseCategory | IncomeCategory;
export type TransactionKind = "expense" | "income";
export type Language = "es" | "en";

export const EXPENSE_CATEGORIES: { id: ExpenseCategory; label: { es: string; en: string }; emoji: string; color: string }[] = [
  { id: "food", label: { es: "Comida", en: "Food" }, emoji: "🍰", color: "hsl(var(--cat-food))" },
  { id: "transport", label: { es: "Transporte", en: "Transport" }, emoji: "🚲", color: "hsl(var(--cat-transport))" },
  { id: "health", label: { es: "Salud", en: "Health" }, emoji: "🌿", color: "hsl(var(--cat-health))" },
  { id: "home", label: { es: "Hogar", en: "Home" }, emoji: "🏡", color: "hsl(var(--cat-home))" },
  { id: "personal", label: { es: "Personal", en: "Personal" }, emoji: "💝", color: "hsl(var(--cat-personal))" },
];

export const INCOME_CATEGORIES: { id: IncomeCategory; label: { es: string; en: string }; emoji: string; color: string }[] = [
  { id: "salary", label: { es: "Salario", en: "Salary" }, emoji: "💼", color: "hsl(var(--sage))" },
  { id: "freelance", label: { es: "Freelance", en: "Freelance" }, emoji: "🧾", color: "hsl(var(--accent))" },
  { id: "gift", label: { es: "Regalo", en: "Gift" }, emoji: "🎁", color: "hsl(var(--rose))" },
  { id: "other", label: { es: "Otro", en: "Other" }, emoji: "✨", color: "hsl(var(--secondary))" },
];

export const CATEGORIES = EXPENSE_CATEGORIES;

export interface Transaction {
  id: string;
  amount: number;
  kind: TransactionKind;
  category: Category;
  date: string;
  note?: string;
}

export type Expense = Transaction & { kind: "expense"; category: ExpenseCategory };

interface LegacyExpense {
  id: string;
  amount: number;
  category: ExpenseCategory;
  date: string;
  note?: string;
}

export interface JournalEntry {
  id: string;
  date: string;
  text: string;
}

export interface TrackerSettings {
  language: Language;
  locale: string;
  currency: string;
}

interface AuthUser {
  id: string;
  email: string;
}

interface BootstrapPayload {
  transactions: Transaction[];
  journal: JournalEntry[];
  budget: number;
  settings: TrackerSettings;
  categoryBudgets: Partial<Record<ExpenseCategory, number>>;
}

const TX_KEY = "bloom.transactions.v2";
const LEGACY_EXP_KEY = "bloom.expenses.v1";
const JRN_KEY = "bloom.journal.v1";
const BUDGET_KEY = "bloom.budget.v1";
const SETTINGS_KEY = "bloom.settings.v1";
const CAT_BUDGET_KEY = "bloom.category-budgets.v1";
const AUTH_TOKEN_KEY = "bloom.auth.token.v1";
const MIGRATION_KEY = "bloom.migrated.v1";

type CategoryBudgets = Partial<Record<ExpenseCategory, number>>;

const defaultSettings = (): TrackerSettings => ({
  language: "es",
  locale: "es-CO",
  currency: "COP",
});

const load = <T>(key: string, fallback: T): T => {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
};

const save = <T>(key: string, value: T) => {
  localStorage.setItem(key, JSON.stringify(value));
};

const normalizeAmount = (value: unknown) => {
  if (typeof value !== "number" || !Number.isFinite(value)) return 0;
  return Math.max(0, Number(value.toFixed(2)));
};

const isExpenseCategory = (value: string): value is ExpenseCategory =>
  EXPENSE_CATEGORIES.some((category) => category.id === value);

const normalizeTransactions = (rows: unknown[]): Transaction[] =>
  rows
    .filter((row): row is Transaction => {
      if (!row || typeof row !== "object") return false;
      const candidate = row as Partial<Transaction>;
      return (
        typeof candidate.id === "string" &&
        typeof candidate.date === "string" &&
        (candidate.kind === "expense" || candidate.kind === "income") &&
        typeof candidate.category === "string"
      );
    })
    .map((row) => ({
      id: row.id,
      amount: normalizeAmount(row.amount),
      kind: row.kind,
      category: row.category,
      date: row.date,
      note: typeof row.note === "string" ? row.note : undefined,
    }));

const normalizeLegacyExpenses = (rows: unknown[]): Transaction[] =>
  rows
    .filter((row): row is LegacyExpense => {
      if (!row || typeof row !== "object") return false;
      const candidate = row as Partial<LegacyExpense>;
      return (
        typeof candidate.id === "string" &&
        typeof candidate.date === "string" &&
        typeof candidate.category === "string" &&
        isExpenseCategory(candidate.category)
      );
    })
    .map((row) => ({
      id: row.id,
      amount: normalizeAmount(row.amount),
      kind: "expense" as const,
      category: row.category,
      date: row.date,
      note: typeof row.note === "string" ? row.note : undefined,
    }));

const normalizeJournal = (rows: unknown[]): JournalEntry[] =>
  rows
    .filter((row): row is JournalEntry => {
      if (!row || typeof row !== "object") return false;
      const candidate = row as Partial<JournalEntry>;
      return typeof candidate.id === "string" && typeof candidate.date === "string" && typeof candidate.text === "string";
    })
    .map((row) => ({ id: row.id, date: row.date, text: row.text.trim() }))
    .filter((row) => row.text.length > 0);

const normalizeCategoryBudgets = (value: unknown): CategoryBudgets => {
  if (!value || typeof value !== "object") return {};
  const raw = value as Record<string, unknown>;
  const next: CategoryBudgets = {};
  for (const category of EXPENSE_CATEGORIES) {
    const amount = normalizeAmount(raw[category.id]);
    if (amount > 0) next[category.id] = amount;
  }
  return next;
};

const makeDemoData = (): { transactions: Transaction[]; journal: JournalEntry[] } => {
  const today = new Date();
  const iso = (d: Date) => d.toISOString().slice(0, 10);
  const offset = (n: number) => {
    const d = new Date(today);
    d.setDate(d.getDate() - n);
    return iso(d);
  };

  return {
    transactions: [
      { id: "d1", amount: 12500, kind: "expense", category: "food", date: offset(0), note: "Café y pan" },
      { id: "d2", amount: 42000, kind: "expense", category: "transport", date: offset(1), note: "Pasajes" },
      { id: "d3", amount: 56000, kind: "expense", category: "home", date: offset(2), note: "Mercado" },
      { id: "d4", amount: 24000, kind: "expense", category: "health", date: offset(4), note: "Farmacia" },
      { id: "d5", amount: 2600000, kind: "income", category: "salary", date: offset(5), note: "Pago quincenal" },
    ],
    journal: [
      { id: "j1", date: offset(0), text: "Hoy alcancé a registrar todo el día y me sentí más tranquila." },
      { id: "j2", date: offset(3), text: "Noté que transporte está subiendo, voy a revisarlo esta semana." },
    ],
  };
};

const loadLocalSnapshot = () => {
  const tx = normalizeTransactions(load<unknown[]>(TX_KEY, []));
  const legacy = normalizeLegacyExpenses(load<unknown[]>(LEGACY_EXP_KEY, []));
  const transactions = tx.length > 0 ? tx : legacy;
  return {
    transactions,
    journal: normalizeJournal(load<unknown[]>(JRN_KEY, [])),
    budget: normalizeAmount(load(BUDGET_KEY, 0)),
    settings: { ...defaultSettings(), ...load(SETTINGS_KEY, defaultSettings()) },
    categoryBudgets: normalizeCategoryBudgets(load(CAT_BUDGET_KEY, {})),
  };
};

const persistLocalSnapshot = (payload: BootstrapPayload) => {
  save(TX_KEY, payload.transactions);
  save(JRN_KEY, payload.journal);
  save(BUDGET_KEY, payload.budget);
  save(SETTINGS_KEY, payload.settings);
  save(CAT_BUDGET_KEY, payload.categoryBudgets);
};

export function useTracker() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [journal, setJournal] = useState<JournalEntry[]>([]);
  const [budget, setBudget] = useState<number>(0);
  const [settings, setSettings] = useState<TrackerSettings>(defaultSettings);
  const [categoryBudgets, setCategoryBudgets] = useState<CategoryBudgets>({});
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  const applyBootstrap = useCallback((payload: BootstrapPayload) => {
    const safePayload: BootstrapPayload = {
      transactions: normalizeTransactions(payload.transactions),
      journal: normalizeJournal(payload.journal),
      budget: normalizeAmount(payload.budget),
      settings: { ...defaultSettings(), ...payload.settings },
      categoryBudgets: normalizeCategoryBudgets(payload.categoryBudgets),
    };
    setTransactions(safePayload.transactions);
    setJournal(safePayload.journal);
    setBudget(safePayload.budget);
    setSettings(safePayload.settings);
    setCategoryBudgets(safePayload.categoryBudgets);
    persistLocalSnapshot(safePayload);
  }, []);

  const fetchBootstrap = useCallback(async (authToken: string) => {
    const payload = await apiRequest<BootstrapPayload>("/bootstrap", { token: authToken });
    applyBootstrap(payload);
    return payload;
  }, [applyBootstrap]);

  const maybeMigrateLocalData = useCallback(
    async (authToken: string, remotePayload: BootstrapPayload) => {
      const alreadyMigrated = localStorage.getItem(MIGRATION_KEY) === "true";
      const remoteHasData =
        remotePayload.transactions.length > 0 ||
        remotePayload.journal.length > 0 ||
        remotePayload.budget > 0 ||
        Object.keys(remotePayload.categoryBudgets).length > 0;
      if (alreadyMigrated || remoteHasData) return;

      const local = loadLocalSnapshot();
      const hasLocalData =
        local.transactions.length > 0 ||
        local.journal.length > 0 ||
        local.budget > 0 ||
        Object.keys(local.categoryBudgets).length > 0;
      if (!hasLocalData) return;

      await Promise.all(
        local.transactions.map((item) =>
          apiRequest<Transaction>("/transactions", {
            method: "POST",
            token: authToken,
            body: {
              kind: item.kind,
              category: item.category,
              amount: item.amount,
              date: item.date,
              note: item.note,
            },
          }),
        ),
      );

      await Promise.all(
        local.journal.map((entry) =>
          apiRequest<JournalEntry>("/journal", {
            method: "POST",
            token: authToken,
            body: {
              date: entry.date,
              text: entry.text,
            },
          }),
        ),
      );

      await apiRequest("/settings", {
        method: "PUT",
        token: authToken,
        body: {
          language: local.settings.language,
          locale: local.settings.locale,
          currency: local.settings.currency,
          budget: local.budget,
          categoryBudgets: local.categoryBudgets,
        },
      });

      localStorage.setItem(MIGRATION_KEY, "true");
      await fetchBootstrap(authToken);
    },
    [fetchBootstrap],
  );

  useEffect(() => {
    const bootstrap = async () => {
      const storedToken = localStorage.getItem(AUTH_TOKEN_KEY);
      if (!storedToken) {
        const local = loadLocalSnapshot();
        applyBootstrap({
          transactions: local.transactions,
          journal: local.journal,
          budget: local.budget,
          settings: local.settings,
          categoryBudgets: local.categoryBudgets,
        });
        setReady(true);
        return;
      }

      try {
        const me = await apiRequest<AuthUser>("/auth/me", { token: storedToken });
        setToken(storedToken);
        setUser(me);
        const payload = await fetchBootstrap(storedToken);
        await maybeMigrateLocalData(storedToken, payload);
      } catch {
        localStorage.removeItem(AUTH_TOKEN_KEY);
        setToken(null);
        setUser(null);
      } finally {
        setReady(true);
      }
    };

    void bootstrap();
  }, [applyBootstrap, fetchBootstrap, maybeMigrateLocalData]);

  const login = useCallback(async (email: string, password: string) => {
    const response = await apiRequest<{ token: string; user: AuthUser }>("/auth/login", {
      method: "POST",
      body: { email, password },
    });
    localStorage.setItem(AUTH_TOKEN_KEY, response.token);
    setToken(response.token);
    setUser(response.user);
    const payload = await fetchBootstrap(response.token);
    await maybeMigrateLocalData(response.token, payload);
  }, [fetchBootstrap, maybeMigrateLocalData]);

  const register = useCallback(async (email: string, password: string) => {
    const response = await apiRequest<{ token: string; user: AuthUser }>("/auth/register", {
      method: "POST",
      body: { email, password },
    });
    localStorage.setItem(AUTH_TOKEN_KEY, response.token);
    setToken(response.token);
    setUser(response.user);
    const payload = await fetchBootstrap(response.token);
    await maybeMigrateLocalData(response.token, payload);
  }, [fetchBootstrap, maybeMigrateLocalData]);

  const logout = useCallback(() => {
    localStorage.removeItem(AUTH_TOKEN_KEY);
    setToken(null);
    setUser(null);
  }, []);

  const requireToken = useCallback(() => {
    if (!token) {
      throw new Error("No active session");
    }
    return token;
  }, [token]);

  const addTransaction = useCallback(async (tx: Omit<Transaction, "id">) => {
    const authToken = requireToken();
    const created = await apiRequest<Transaction>("/transactions", {
      method: "POST",
      token: authToken,
      body: tx,
    });
    setTransactions((prev) => [created, ...prev]);
  }, [requireToken]);

  const updateTransaction = useCallback(async (id: string, tx: Omit<Transaction, "id">) => {
    const authToken = requireToken();
    const updated = await apiRequest<Transaction>(`/transactions/${id}`, {
      method: "PUT",
      token: authToken,
      body: tx,
    });
    setTransactions((prev) => prev.map((item) => (item.id === id ? updated : item)));
  }, [requireToken]);

  const removeTransaction = useCallback(async (id: string) => {
    const authToken = requireToken();
    await apiRequest<void>(`/transactions/${id}`, {
      method: "DELETE",
      token: authToken,
    });
    setTransactions((prev) => prev.filter((item) => item.id !== id));
  }, [requireToken]);

  const addJournal = useCallback(async (entry: Omit<JournalEntry, "id">) => {
    const authToken = requireToken();
    const created = await apiRequest<JournalEntry>("/journal", {
      method: "POST",
      token: authToken,
      body: entry,
    });
    setJournal((prev) => [created, ...prev]);
  }, [requireToken]);

  const removeJournal = useCallback(async (id: string) => {
    const authToken = requireToken();
    await apiRequest<void>(`/journal/${id}`, {
      method: "DELETE",
      token: authToken,
    });
    setJournal((prev) => prev.filter((item) => item.id !== id));
  }, [requireToken]);

  const updateServerSettings = useCallback(
    async (payload: Partial<TrackerSettings> & { budget?: number; categoryBudgets?: CategoryBudgets }) => {
      const authToken = requireToken();
      const next = await apiRequest<{
        language: Language;
        locale: string;
        currency: string;
        budget: number;
        categoryBudgets: CategoryBudgets;
      }>("/settings", {
        method: "PUT",
        token: authToken,
        body: payload,
      });
      setSettings({ language: next.language, locale: next.locale, currency: next.currency });
      setBudget(next.budget);
      setCategoryBudgets(normalizeCategoryBudgets(next.categoryBudgets));
    },
    [requireToken],
  );

  const updateBudget = useCallback(async (nextBudget: number) => {
    await updateServerSettings({ budget: normalizeAmount(nextBudget) });
  }, [updateServerSettings]);

  const updateCategoryBudget = useCallback(async (category: ExpenseCategory, amount: number) => {
    const nextValue = normalizeAmount(amount);
    const nextBudgets = { ...categoryBudgets };
    if (nextValue <= 0) {
      delete nextBudgets[category];
    } else {
      nextBudgets[category] = nextValue;
    }
    await updateServerSettings({ categoryBudgets: nextBudgets });
  }, [categoryBudgets, updateServerSettings]);

  const updateSettings = useCallback(async (nextSettings: Partial<TrackerSettings>) => {
    await updateServerSettings(nextSettings);
  }, [updateServerSettings]);

  const replaceData = useCallback(async (next: { transactions: Transaction[]; journal: JournalEntry[]; budget?: number; categoryBudgets?: CategoryBudgets }) => {
    const authToken = requireToken();

    await Promise.all(transactions.map((tx) => apiRequest<void>(`/transactions/${tx.id}`, { method: "DELETE", token: authToken })));
    await Promise.all(journal.map((entry) => apiRequest<void>(`/journal/${entry.id}`, { method: "DELETE", token: authToken })));

    const safeTx = normalizeTransactions(next.transactions);
    const safeJournal = normalizeJournal(next.journal);
    const safeBudget = normalizeAmount(next.budget ?? budget);
    const safeCategoryBudgets = normalizeCategoryBudgets(next.categoryBudgets ?? categoryBudgets);

    await Promise.all(
      safeTx.map((tx) =>
        apiRequest("/transactions", {
          method: "POST",
          token: authToken,
          body: {
            kind: tx.kind,
            category: tx.category,
            amount: tx.amount,
            date: tx.date,
            note: tx.note,
          },
        }),
      ),
    );

    await Promise.all(
      safeJournal.map((entry) =>
        apiRequest("/journal", {
          method: "POST",
          token: authToken,
          body: {
            date: entry.date,
            text: entry.text,
          },
        }),
      ),
    );

    await updateServerSettings({
      language: settings.language,
      locale: settings.locale,
      currency: settings.currency,
      budget: safeBudget,
      categoryBudgets: safeCategoryBudgets,
    });

    const payload = await fetchBootstrap(authToken);
    applyBootstrap(payload);
  }, [applyBootstrap, budget, categoryBudgets, fetchBootstrap, journal, requireToken, settings.currency, settings.language, settings.locale, transactions, updateServerSettings]);

  const loadDemoData = useCallback(async () => {
    const demo = makeDemoData();
    await replaceData({
      transactions: demo.transactions,
      journal: demo.journal,
      budget,
      categoryBudgets,
    });
  }, [budget, categoryBudgets, replaceData]);

  const expenses = useMemo(
    () => transactions.filter((tx): tx is Expense => tx.kind === "expense" && isExpenseCategory(tx.category)),
    [transactions],
  );

  return {
    ready,
    authenticated: Boolean(token && user),
    user,
    transactions,
    expenses,
    journal,
    budget,
    settings,
    categoryBudgets,
    login,
    register,
    logout,
    addTransaction,
    updateTransaction,
    removeTransaction,
    addJournal,
    removeJournal,
    updateBudget,
    updateCategoryBudget,
    updateSettings,
    replaceData,
    loadDemoData,
  };
}

export const fmtMoney = (n: number, settings?: Partial<TrackerSettings>) =>
  new Intl.NumberFormat(settings?.locale ?? "es-CO", {
    style: "currency",
    currency: settings?.currency ?? "COP",
    maximumFractionDigits: 0,
  }).format(n);
