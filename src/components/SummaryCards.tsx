import { fmtMoney } from "@/lib/tracker-store";
import { Wallet, Sparkles, TrendingUp } from "lucide-react";

interface Props {
  spent: number;
  budget: number;
  entries: number;
}

export const SummaryCards = ({ spent, budget, entries }: Props) => {
  const remaining = Math.max(budget - spent, 0);
  const pct = Math.min((spent / Math.max(budget, 1)) * 100, 100);

  return (
    <div className="grid gap-4 md:grid-cols-3">
      <div className="cozy-card gradient-rose p-6 text-primary-foreground">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium opacity-90">Spent this month</span>
          <Wallet className="h-5 w-5 opacity-90" />
        </div>
        <div className="mt-3 font-serif text-4xl">{fmtMoney(spent)}</div>
        <div className="mt-4 h-2 rounded-full bg-primary-foreground/25 overflow-hidden">
          <div className="h-full bg-primary-foreground/90 rounded-full transition-all" style={{ width: `${pct}%` }} />
        </div>
      </div>

      <div className="cozy-card gradient-sage p-6 text-secondary-foreground">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium opacity-80">Remaining budget</span>
          <Sparkles className="h-5 w-5 opacity-80" />
        </div>
        <div className="mt-3 font-serif text-4xl">{fmtMoney(remaining)}</div>
        <p className="mt-4 text-sm opacity-75">of {fmtMoney(budget)} planned</p>
      </div>

      <div className="cozy-card gradient-warm p-6">
        <div className="flex items-center justify-between text-foreground/70">
          <span className="text-sm font-medium">Entries this month</span>
          <TrendingUp className="h-5 w-5" />
        </div>
        <div className="mt-3 font-serif text-4xl text-foreground">{entries}</div>
        <p className="mt-4 text-sm text-muted-foreground">little moments tracked</p>
      </div>
    </div>
  );
};
