import { CATEGORIES, Expense, Language, TrackerSettings, fmtMoney } from "@/lib/tracker-store";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

interface Props {
  language: Language;
  settings: TrackerSettings;
  title: string;
  expenses: Expense[];
}

const TEXT = {
  es: {
    subtitle: "Cómo se repartieron tus gastos",
    empty: "Aún no hay gastos en este periodo.",
    total: "Total",
  },
  en: {
    subtitle: "Where your spending bloomed",
    empty: "No expenses yet in this period.",
    total: "Total",
  },
} as const;

export const MonthlyChart = ({ language, settings, title, expenses }: Props) => {
  const t = TEXT[language];
  const data = CATEGORIES.map((c) => ({
    name: c.label[language],
    value: expenses.filter((e) => e.category === c.id).reduce((s, e) => s + e.amount, 0),
    color: c.color,
    emoji: c.emoji,
  })).filter((d) => d.value > 0);

  const total = data.reduce((s, d) => s + d.value, 0);

  return (
    <div className="cozy-card p-6">
      <h3 className="font-serif text-2xl">{title}</h3>
      <p className="text-sm text-muted-foreground">{t.subtitle}</p>

      {data.length === 0 ? (
        <div className="py-12 text-center text-muted-foreground italic">{t.empty}</div>
      ) : (
        <div className="mt-4 grid gap-4 sm:grid-cols-2 items-center">
          <div className="relative h-56">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={data} dataKey="value" innerRadius={55} outerRadius={85} paddingAngle={3} stroke="none">
                  {data.map((d, i) => (
                    <Cell key={i} fill={d.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(v: number) => fmtMoney(v, settings)}
                  contentStyle={{
                    borderRadius: 16,
                    border: "1px solid hsl(var(--border))",
                    background: "hsl(var(--card))",
                    fontFamily: "Nunito",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-xs uppercase tracking-wider text-muted-foreground">{t.total}</span>
              <span className="font-serif text-2xl">{fmtMoney(total, settings)}</span>
            </div>
          </div>

          <ul className="space-y-2">
            {data.map((d) => {
              const pct = ((d.value / total) * 100).toFixed(0);
              return (
                <li key={d.name} className="flex items-center justify-between rounded-2xl px-3 py-2 bg-muted/40">
                  <span className="flex items-center gap-2 text-sm">
                    <span className="h-3 w-3 rounded-full" style={{ background: d.color }} />
                    <span>{d.emoji} {d.name}</span>
                  </span>
                  <span className="text-sm font-semibold">
                    {fmtMoney(d.value, settings)} <span className="text-muted-foreground font-normal">· {pct}%</span>
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
};
