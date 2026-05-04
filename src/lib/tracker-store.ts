import { useEffect, useState, useCallback } from "react";

export type Category = "food" | "transport" | "health" | "home" | "personal";

export const CATEGORIES: { id: Category; label: string; emoji: string; color: string }[] = [
  { id: "food", label: "Food", emoji: "🍰", color: "hsl(var(--cat-food))" },
  { id: "transport", label: "Transport", emoji: "🚲", color: "hsl(var(--cat-transport))" },
  { id: "health", label: "Health", emoji: "🌿", color: "hsl(var(--cat-health))" },
  { id: "home", label: "Home", emoji: "🏡", color: "hsl(var(--cat-home))" },
  { id: "personal", label: "Personal", emoji: "💝", color: "hsl(var(--cat-personal))" },
];

export interface Expense {
  id: string;
  amount: number;
  category: Category;
  date: string; // ISO yyyy-mm-dd
  note?: string;
}

export interface JournalEntry {
  id: string;
  date: string;
  text: string;
}

const EXP_KEY = "bloom.expenses.v1";
const JRN_KEY = "bloom.journal.v1";
const BUDGET_KEY = "bloom.budget.v1";

function load<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const v = localStorage.getItem(key);
    return v ? (JSON.parse(v) as T) : fallback;
  } catch {
    return fallback;
  }
}

function save<T>(key: string, value: T) {
  localStorage.setItem(key, JSON.stringify(value));
}

const seed = (): { expenses: Expense[]; journal: JournalEntry[] } => {
  const today = new Date();
  const iso = (d: Date) => d.toISOString().slice(0, 10);
  const offset = (n: number) => {
    const d = new Date(today);
    d.setDate(d.getDate() - n);
    return iso(d);
  };
  return {
    expenses: [
      { id: "1", amount: 12.5, category: "food", date: offset(0), note: "Morning latte & pastry" },
      { id: "2", amount: 28, category: "transport", date: offset(1), note: "Train ticket" },
      { id: "3", amount: 45, category: "personal", date: offset(2), note: "New journal & pens" },
      { id: "4", amount: 62, category: "home", date: offset(3), note: "Fresh flowers & candles" },
      { id: "5", amount: 18, category: "health", date: offset(5), note: "Yoga class" },
      { id: "6", amount: 34, category: "food", date: offset(6), note: "Farmers market" },
    ],
    journal: [
      { id: "j1", date: offset(0), text: "Slow morning with a good book and warm tea. Felt grateful for the quiet." },
      { id: "j2", date: offset(2), text: "Treated myself to a small stationery haul — the new journal smells lovely." },
    ],
  };
};

export function useTracker() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [journal, setJournal] = useState<JournalEntry[]>([]);
  const [budget, setBudget] = useState<number>(800);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const hasData = localStorage.getItem(EXP_KEY);
    if (!hasData) {
      const s = seed();
      save(EXP_KEY, s.expenses);
      save(JRN_KEY, s.journal);
      setExpenses(s.expenses);
      setJournal(s.journal);
    } else {
      setExpenses(load(EXP_KEY, []));
      setJournal(load(JRN_KEY, []));
    }
    setBudget(load(BUDGET_KEY, 800));
    setReady(true);
  }, []);

  const addExpense = useCallback((e: Omit<Expense, "id">) => {
    setExpenses((prev) => {
      const next = [{ ...e, id: crypto.randomUUID() }, ...prev];
      save(EXP_KEY, next);
      return next;
    });
  }, []);

  const removeExpense = useCallback((id: string) => {
    setExpenses((prev) => {
      const next = prev.filter((x) => x.id !== id);
      save(EXP_KEY, next);
      return next;
    });
  }, []);

  const addJournal = useCallback((e: Omit<JournalEntry, "id">) => {
    setJournal((prev) => {
      const next = [{ ...e, id: crypto.randomUUID() }, ...prev];
      save(JRN_KEY, next);
      return next;
    });
  }, []);

  const removeJournal = useCallback((id: string) => {
    setJournal((prev) => {
      const next = prev.filter((x) => x.id !== id);
      save(JRN_KEY, next);
      return next;
    });
  }, []);

  const updateBudget = useCallback((n: number) => {
    setBudget(n);
    save(BUDGET_KEY, n);
  }, []);

  return { ready, expenses, journal, budget, addExpense, removeExpense, addJournal, removeJournal, updateBudget };
}

export const fmtMoney = (n: number) =>
  new Intl.NumberFormat(undefined, { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);
