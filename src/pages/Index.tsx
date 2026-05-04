import { useMemo, useState } from "react";
import { useTracker, fmtMoney } from "@/lib/tracker-store";
import { SummaryCards } from "@/components/SummaryCards";
import { ExpenseForm } from "@/components/ExpenseForm";
import { JournalSection } from "@/components/JournalSection";
import { MonthlyChart } from "@/components/MonthlyChart";
import { HistoryList } from "@/components/HistoryList";
import { Flower2, Pencil } from "lucide-react";
import { Input } from "@/components/ui/input";
import { format } from "date-fns";

const Index = () => {
  const { ready, expenses, journal, budget, addExpense, removeExpense, addJournal, removeJournal, updateBudget } = useTracker();
  const [editBudget, setEditBudget] = useState(false);

  const now = new Date();
  const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  const monthExpenses = useMemo(
    () => expenses.filter((e) => e.date.startsWith(monthKey)),
    [expenses, monthKey]
  );
  const spent = monthExpenses.reduce((s, e) => s + e.amount, 0);

  if (!ready) return null;

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
        {/* Header */}
        <header className="mb-8 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-primary">
              <Flower2 className="h-6 w-6" />
              <span className="font-serif italic text-lg">Bloom</span>
            </div>
            <h1 className="mt-2 font-serif text-4xl sm:text-5xl">
              Hello, lovely.
            </h1>
            <p className="mt-2 text-muted-foreground">
              {format(now, "EEEE, MMMM d")} · A gentle space for your day.
            </p>
          </div>

          <div className="cozy-card px-4 py-3 flex items-center gap-3">
            <span className="text-xs uppercase tracking-wider text-muted-foreground">Monthly budget</span>
            {editBudget ? (
              <Input
                autoFocus
                type="number"
                value={budget}
                onChange={(e) => updateBudget(Number(e.target.value) || 0)}
                onBlur={() => setEditBudget(false)}
                className="h-8 w-24 rounded-full bg-background"
              />
            ) : (
              <button
                onClick={() => setEditBudget(true)}
                className="flex items-center gap-1.5 font-serif text-xl hover:text-primary transition"
              >
                {fmtMoney(budget)} <Pencil className="h-3.5 w-3.5 opacity-60" />
              </button>
            )}
          </div>
        </header>

        {/* Summary */}
        <SummaryCards spent={spent} budget={budget} entries={monthExpenses.length} />

        {/* Main grid */}
        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <ExpenseForm onAdd={addExpense} />
          <MonthlyChart expenses={monthExpenses} />
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <JournalSection entries={journal} onAdd={addJournal} onRemove={removeJournal} />
          <HistoryList expenses={expenses} onRemove={removeExpense} />
        </div>

        <footer className="mt-12 text-center text-xs text-muted-foreground">
          Made with care · Your data stays on your device 🌷
        </footer>
      </div>
    </div>
  );
};

export default Index;
