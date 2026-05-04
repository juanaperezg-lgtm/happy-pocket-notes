import { CATEGORIES, Expense, fmtMoney } from "@/lib/tracker-store";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

interface Props {
  expenses: Expense[];
}

export const MonthlyChart = ({ expenses }: Props) => {
  const data = CATEGORIES.map((c) => ({
    name: c.label,
    value: expenses.filter((e) => e.category === c.id).reduce((s, e) => s + e.amount, 0),
    color: c.color,
    emoji: c.emoji,
  })).filter((d) => d.value > 0);

  const total = data.reduce((s, d) => s + d.value, 0);

  return (
    <div className="cozy-card p-6">
      <h3 className="font-serif text-2xl">This month</h3>
      <p className="text-sm text-muted-foreground">Where your spending bloomed</p>

      {data.length === 0 ? (
        <div className="py-12 text-center text-muted-foreground italic">No expenses yet this month.</div>
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
                  formatter={(v: number) => fmtMoney(v)}
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
              <span className="text-xs uppercase tracking-wider text-muted-foreground">Total</span>
              <span className="font-serif text-2xl">{fmtMoney(total)}</span>
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
                    {fmtMoney(d.value)} <span className="text-muted-foreground font-normal">· {pct}%</span>
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
