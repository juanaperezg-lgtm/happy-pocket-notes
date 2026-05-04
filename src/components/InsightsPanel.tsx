import { CATEGORIES, ExpenseCategory, Language, TrackerSettings, fmtMoney } from "@/lib/tracker-store";
import { AlertTriangle, BarChart3 } from "lucide-react";

interface Props {
  language: Language;
  settings: TrackerSettings;
  periodSpent: number;
  periodIncome: number;
  currentMonthSpent: number;
  previousMonthSpent: number;
  categorySpent: Partial<Record<ExpenseCategory, number>>;
  categoryBudgets: Partial<Record<ExpenseCategory, number>>;
}

const TEXT = {
  es: {
    title: "Reportes útiles",
    comparison: "Comparación mensual",
    up: "más que el mes anterior",
    down: "menos que el mes anterior",
    same: "igual que el mes anterior",
    noPrev: "No hay datos del mes anterior para comparar.",
    summary: "Resumen del periodo",
    alerts: "Alertas por categoría",
    noAlerts: "Todo va dentro del presupuesto por categoría.",
    overBy: "excedido por",
  },
  en: {
    title: "Practical reports",
    comparison: "Month over month",
    up: "more than last month",
    down: "less than last month",
    same: "same as last month",
    noPrev: "No previous month data to compare.",
    summary: "Period summary",
    alerts: "Category alerts",
    noAlerts: "Everything is within category budgets.",
    overBy: "over by",
  },
} as const;

export const InsightsPanel = ({
  language,
  settings,
  periodSpent,
  periodIncome,
  currentMonthSpent,
  previousMonthSpent,
  categorySpent,
  categoryBudgets,
}: Props) => {
  const t = TEXT[language];
  const delta = currentMonthSpent - previousMonthSpent;
  const deltaPct = previousMonthSpent > 0 ? Math.abs((delta / previousMonthSpent) * 100) : 0;

  const alerts = CATEGORIES
    .map((c) => {
      const limit = categoryBudgets[c.id];
      const spent = categorySpent[c.id] ?? 0;
      if (!limit || spent <= limit) return null;
      return { id: c.id, label: c.label[language], emoji: c.emoji, over: spent - limit };
    })
    .filter((item): item is NonNullable<typeof item> => item !== null)
    .sort((a, b) => b.over - a.over);

  return (
    <div className="cozy-card p-6 space-y-5">
      <div className="flex items-center gap-2">
        <BarChart3 className="h-5 w-5 text-primary" />
        <h3 className="font-serif text-2xl">{t.title}</h3>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-2xl border border-border/50 bg-background p-4">
          <p className="text-sm text-muted-foreground">{t.summary}</p>
          <p className="mt-2 font-serif text-xl">+{fmtMoney(periodIncome, settings)}</p>
          <p className="font-serif text-xl">-{fmtMoney(periodSpent, settings)}</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {periodIncome - periodSpent >= 0 ? "+" : ""}{fmtMoney(periodIncome - periodSpent, settings)}
          </p>
        </div>

        <div className="rounded-2xl border border-border/50 bg-background p-4">
          <p className="text-sm text-muted-foreground">{t.comparison}</p>
          {previousMonthSpent <= 0 ? (
            <p className="mt-3 text-sm text-muted-foreground italic">{t.noPrev}</p>
          ) : (
            <p className="mt-2 text-sm">
              <span className="font-semibold">{deltaPct.toFixed(0)}%</span>{" "}
              {delta > 0 ? t.up : delta < 0 ? t.down : t.same}
            </p>
          )}
          <p className="mt-2 font-serif text-lg">{fmtMoney(currentMonthSpent, settings)}</p>
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-sm font-semibold">{t.alerts}</p>
        {alerts.length === 0 ? (
          <p className="text-sm text-muted-foreground italic">{t.noAlerts}</p>
        ) : (
          alerts.map((alert) => (
            <div key={alert.id} className="flex items-center justify-between rounded-2xl border border-destructive/25 bg-destructive/5 px-3 py-2">
              <span className="text-sm">
                <AlertTriangle className="mr-1 inline h-4 w-4 text-destructive" />
                {alert.emoji} {alert.label}
              </span>
              <span className="text-sm font-semibold text-destructive">
                {t.overBy} {fmtMoney(alert.over, settings)}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
