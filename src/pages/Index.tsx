import { useMemo, useState } from "react";
import { useTracker, fmtMoney, Transaction } from "@/lib/tracker-store";
import { SummaryCards } from "@/components/SummaryCards";
import { ExpenseForm } from "@/components/ExpenseForm";
import { JournalSection } from "@/components/JournalSection";
import { MonthlyChart } from "@/components/MonthlyChart";
import { HistoryList } from "@/components/HistoryList";
import { Flower2, Pencil } from "lucide-react";
import { Input } from "@/components/ui/input";
import { SettingsPanel } from "@/components/SettingsPanel";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { InsightsPanel } from "@/components/InsightsPanel";
import { AuthCard } from "@/components/AuthCard";
import { addMonths, endOfWeek, format, startOfWeek } from "date-fns";
import { toast } from "sonner";

type Period = "day" | "week" | "month";

const TEXT = {
  es: {
    hello: "Hola, hermosa.",
    subtitle: "Un espacio suave para registrar tu día.",
    monthlyBudget: "Presupuesto mensual",
    periodDay: "Día",
    periodWeek: "Semana",
    periodMonth: "Mes",
    chartTitleDay: "Gastos del día",
    chartTitleWeek: "Gastos de la semana",
    chartTitleMonth: "Gastos del mes",
    footer: "Hecho con cariño · Tus datos se sincronizan con tu cuenta 🌷",
  },
  en: {
    hello: "Hello, lovely.",
    subtitle: "A gentle space for your day.",
    monthlyBudget: "Monthly budget",
    periodDay: "Day",
    periodWeek: "Week",
    periodMonth: "Month",
    chartTitleDay: "Day spending",
    chartTitleWeek: "Week spending",
    chartTitleMonth: "Month spending",
    footer: "Made with care · Your data syncs with your account 🌷",
  },
} as const;

const Index = () => {
  const {
    ready,
    authenticated,
    user,
    transactions,
    expenses,
    journal,
    budget,
    settings,
    categoryBudgets,
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
    login,
    register,
    logout,
  } = useTracker();
  const [editBudget, setEditBudget] = useState(false);
  const [budgetDraft, setBudgetDraft] = useState("");
  const [period, setPeriod] = useState<Period>("month");
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);

  const t = TEXT[settings.language];
  const now = new Date();
  const todayKey = now.toISOString().slice(0, 10);
  const weekStart = format(startOfWeek(now, { weekStartsOn: 1 }), "yyyy-MM-dd");
  const weekEnd = format(endOfWeek(now, { weekStartsOn: 1 }), "yyyy-MM-dd");
  const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const prevMonthDate = addMonths(now, -1);
  const prevMonthKey = `${prevMonthDate.getFullYear()}-${String(prevMonthDate.getMonth() + 1).padStart(2, "0")}`;

  const periodTransactions = useMemo(
    () =>
      transactions.filter((tx) => {
        if (period === "day") return tx.date === todayKey;
        if (period === "week") return tx.date >= weekStart && tx.date <= weekEnd;
        return tx.date.startsWith(monthKey);
      }),
    [transactions, period, todayKey, weekStart, weekEnd, monthKey],
  );

  const periodExpenses = useMemo(
    () => periodTransactions.filter((tx) => tx.kind === "expense"),
    [periodTransactions],
  );
  const periodSpent = periodExpenses.reduce((s, e) => s + e.amount, 0);
  const periodIncome = periodTransactions.filter((tx) => tx.kind === "income").reduce((s, tx) => s + tx.amount, 0);

  const currentMonthSpent = useMemo(
    () => expenses.filter((e) => e.date.startsWith(monthKey)).reduce((s, e) => s + e.amount, 0),
    [expenses, monthKey],
  );
  const previousMonthSpent = useMemo(
    () => expenses.filter((e) => e.date.startsWith(prevMonthKey)).reduce((s, e) => s + e.amount, 0),
    [expenses, prevMonthKey],
  );

  const categorySpent = useMemo(() => {
    return periodExpenses.reduce((acc, tx) => {
      acc[tx.category] = (acc[tx.category] ?? 0) + tx.amount;
      return acc;
    }, {} as Record<string, number>);
  }, [periodExpenses]);

  if (!ready) return null;
  if (!authenticated) {
    return <AuthCard language={settings.language} onLogin={login} onRegister={register} />;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
        <header className="mb-8 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-primary">
              <Flower2 className="h-6 w-6" />
              <span className="font-serif italic text-lg">Bloom</span>
            </div>
            <h1 className="mt-2 font-serif text-4xl sm:text-5xl">
              {t.hello}
            </h1>
            <p className="mt-2 text-muted-foreground">
              {new Intl.DateTimeFormat(settings.locale, { weekday: "long", month: "long", day: "numeric" }).format(now)} · {t.subtitle}
            </p>
          </div>

          <div className="cozy-card px-4 py-3 flex items-center gap-3">
            <span className="text-xs uppercase tracking-wider text-muted-foreground">{t.monthlyBudget}</span>
            {editBudget ? (
              <Input
                autoFocus
                type="number"
                value={budgetDraft}
                onChange={(e) => setBudgetDraft(e.target.value)}
                onBlur={() => {
                  setEditBudget(false);
                  void updateBudget(Number(budgetDraft) || 0).catch(() => {
                    toast.error(settings.language === "es" ? "No se pudo actualizar el presupuesto" : "We couldn't update the budget");
                  });
                }}
                className="h-8 w-28 rounded-full bg-background"
              />
            ) : (
              <button
                onClick={() => {
                  setBudgetDraft(String(budget));
                  setEditBudget(true);
                }}
                className="flex items-center gap-1.5 font-serif text-xl hover:text-primary transition"
              >
                {fmtMoney(budget, settings)} <Pencil className="h-3.5 w-3.5 opacity-60" />
              </button>
            )}
          </div>
        </header>

        <Tabs value={period} onValueChange={(value) => setPeriod(value as Period)} className="mb-5">
          <TabsList className="rounded-full bg-muted/60 p-1">
            <TabsTrigger value="day" className="rounded-full px-5">{t.periodDay}</TabsTrigger>
            <TabsTrigger value="week" className="rounded-full px-5">{t.periodWeek}</TabsTrigger>
            <TabsTrigger value="month" className="rounded-full px-5">{t.periodMonth}</TabsTrigger>
          </TabsList>
        </Tabs>

        <SummaryCards
          language={settings.language}
          settings={settings}
          income={periodIncome}
          spent={periodSpent}
          budget={budget}
          entries={periodTransactions.length}
        />

        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <ExpenseForm
            language={settings.language}
            editing={editingTx}
            onCreate={addTransaction}
            onUpdate={updateTransaction}
            onCancelEdit={() => setEditingTx(null)}
          />
          <MonthlyChart
            language={settings.language}
            settings={settings}
            title={period === "day" ? t.chartTitleDay : period === "week" ? t.chartTitleWeek : t.chartTitleMonth}
            expenses={periodExpenses}
          />
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <InsightsPanel
            language={settings.language}
            settings={settings}
            periodSpent={periodSpent}
            periodIncome={periodIncome}
            currentMonthSpent={currentMonthSpent}
            previousMonthSpent={previousMonthSpent}
            categorySpent={categorySpent}
            categoryBudgets={categoryBudgets}
          />
          <SettingsPanel
            language={settings.language}
            settings={settings}
            transactions={transactions}
            journal={journal}
            budget={budget}
            categoryBudgets={categoryBudgets}
            onUpdateSettings={updateSettings}
            onUpdateCategoryBudget={updateCategoryBudget}
            onReplaceData={replaceData}
            onLoadDemo={loadDemoData}
            onLogout={logout}
            userEmail={user?.email}
          />
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <JournalSection language={settings.language} entries={journal} onAdd={addJournal} onRemove={removeJournal} />
          <HistoryList
            transactions={periodTransactions}
            language={settings.language}
            settings={settings}
            onEdit={(tx) => setEditingTx(tx)}
            onRemove={removeTransaction}
          />
        </div>

        <footer className="mt-12 text-center text-xs text-muted-foreground">
          {t.footer}
        </footer>
      </div>
    </div>
  );
};

export default Index;
