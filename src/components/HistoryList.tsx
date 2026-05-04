import { useMemo, useState } from "react";
import { CATEGORIES, Category, Expense, fmtMoney } from "@/lib/tracker-store";
import { Input } from "@/components/ui/input";
import { format, parseISO } from "date-fns";
import { Trash2, Filter } from "lucide-react";

interface Props {
  expenses: Expense[];
  onRemove: (id: string) => void;
}

export const HistoryList = ({ expenses, onRemove }: Props) => {
  const [cat, setCat] = useState<Category | "all">("all");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const filtered = useMemo(() => {
    return expenses
      .filter((e) => (cat === "all" ? true : e.category === cat))
      .filter((e) => (from ? e.date >= from : true))
      .filter((e) => (to ? e.date <= to : true))
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [expenses, cat, from, to]);

  const catMeta = (id: Category) => CATEGORIES.find((c) => c.id === id)!;

  return (
    <div className="cozy-card p-6 space-y-5">
      <div className="flex items-center gap-2">
        <Filter className="h-5 w-5 text-primary" />
        <h3 className="font-serif text-2xl">History</h3>
      </div>

      <div className="space-y-3">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setCat("all")}
            className={`px-3 py-1.5 rounded-full text-sm border transition ${
              cat === "all" ? "bg-primary/10 border-primary text-foreground" : "bg-background border-border text-muted-foreground"
            }`}
          >
            All
          </button>
          {CATEGORIES.map((c) => (
            <button
              key={c.id}
              onClick={() => setCat(c.id)}
              className={`px-3 py-1.5 rounded-full text-sm border transition ${
                cat === c.id ? "bg-primary/10 border-primary text-foreground" : "bg-background border-border text-muted-foreground"
              }`}
            >
              {c.emoji} {c.label}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="rounded-2xl bg-background w-full sm:w-44" placeholder="From" />
          <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="rounded-2xl bg-background w-full sm:w-44" placeholder="To" />
        </div>
      </div>

      <ul className="space-y-2 max-h-[460px] overflow-y-auto pr-1">
        {filtered.length === 0 && (
          <li className="text-sm text-muted-foreground italic py-6 text-center">Nothing here yet.</li>
        )}
        {filtered.map((e) => {
          const c = catMeta(e.category);
          return (
            <li key={e.id} className="group flex items-center gap-3 rounded-2xl bg-background border border-border/50 p-3">
              <div className="h-10 w-10 rounded-full flex items-center justify-center text-lg" style={{ background: c.color }}>
                {c.emoji}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline justify-between gap-2">
                  <p className="font-medium truncate">{e.note || c.label}</p>
                  <span className="font-serif text-lg whitespace-nowrap">{fmtMoney(e.amount)}</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  {format(parseISO(e.date), "MMM d, yyyy")} · {c.label}
                </p>
              </div>
              <button
                onClick={() => onRemove(e.id)}
                className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition"
                aria-label="Delete"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
};
