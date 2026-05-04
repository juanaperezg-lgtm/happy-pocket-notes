import { Language, TrackerSettings, fmtMoney } from "@/lib/tracker-store";
import { Wallet, Sparkles, TrendingUp } from "lucide-react";

interface Props {
  language: Language;
  settings: TrackerSettings;
  income: number;
  spent: number;
  budget: number;
  entries: number;
}

const TEXT = {
  es: {
    spent: "Gastos del periodo",
    remaining: "Presupuesto disponible",
    planned: "de",
    entries: "Movimientos del periodo",
    tracked: "momentos registrados",
    net: "neto",
  },
  en: {
    spent: "Spent this period",
    remaining: "Remaining budget",
    planned: "of",
    entries: "Entries this period",
    tracked: "moments tracked",
    net: "net",
  },
} as const;

export const SummaryCards = ({ language, settings, income, spent, budget, entries }: Props) => {
  const t = TEXT[language];
  const remaining = Math.max(budget - spent, 0);
  const pct = Math.min((spent / Math.max(budget, 1)) * 100, 100);
  const net = income - spent;

  return (
    <div className="grid gap-4 md:grid-cols-3">
      <div className="cozy-card gradient-rose p-6 text-primary-foreground">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium opacity-90">{t.spent}</span>
          <Wallet className="h-5 w-5 opacity-90" />
        </div>
        <div className="mt-3 font-serif text-4xl">-{fmtMoney(spent, settings)}</div>
        <div className="mt-4 h-2 rounded-full bg-primary-foreground/25 overflow-hidden">
          <div className="h-full bg-primary-foreground/90 rounded-full transition-all" style={{ width: `${pct}%` }} />
        </div>
      </div>

      <div className="cozy-card gradient-sage p-6 text-secondary-foreground">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium opacity-80">{t.remaining}</span>
          <Sparkles className="h-5 w-5 opacity-80" />
        </div>
        <div className="mt-3 font-serif text-4xl">{fmtMoney(remaining, settings)}</div>
        <p className="mt-4 text-sm opacity-75">{t.planned} {fmtMoney(budget, settings)}</p>
      </div>

      <div className="cozy-card gradient-warm p-6">
        <div className="flex items-center justify-between text-foreground/70">
          <span className="text-sm font-medium">{t.entries}</span>
          <TrendingUp className="h-5 w-5" />
        </div>
        <div className="mt-3 font-serif text-4xl text-foreground">{entries}</div>
        <p className="mt-4 text-sm text-muted-foreground">
          {income > 0 ? `${fmtMoney(income, settings)} in · ` : ""}{t.tracked} · {net >= 0 ? "+" : ""}{fmtMoney(net, settings)} {t.net}
        </p>
      </div>
    </div>
  );
};
