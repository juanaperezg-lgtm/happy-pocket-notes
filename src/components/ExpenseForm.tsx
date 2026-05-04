import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { CATEGORIES, Category } from "@/lib/tracker-store";
import { toast } from "sonner";
import { Plus } from "lucide-react";

interface Props {
  onAdd: (e: { amount: number; category: Category; date: string; note?: string }) => void;
}

export const ExpenseForm = ({ onAdd }: Props) => {
  const today = new Date().toISOString().slice(0, 10);
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState<Category>("food");
  const [date, setDate] = useState(today);
  const [note, setNote] = useState("");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const n = parseFloat(amount);
    if (!n || n <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }
    onAdd({ amount: n, category, date, note: note.trim() || undefined });
    setAmount("");
    setNote("");
    toast.success("Expense added with love 💕");
  };

  return (
    <form onSubmit={submit} className="cozy-card p-6 space-y-4">
      <div>
        <h3 className="font-serif text-2xl">Log an expense</h3>
        <p className="text-sm text-muted-foreground">A gentle record of today's little spends.</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="amount">Amount</Label>
          <Input id="amount" type="number" step="0.01" placeholder="0.00" value={amount} onChange={(e) => setAmount(e.target.value)} className="rounded-2xl bg-background" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="date">Date</Label>
          <Input id="date" type="date" value={date} onChange={(e) => setDate(e.target.value)} className="rounded-2xl bg-background" />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label>Category</Label>
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((c) => (
            <button
              type="button"
              key={c.id}
              onClick={() => setCategory(c.id)}
              className={`px-3 py-2 rounded-full text-sm font-medium border transition-all ${
                category === c.id
                  ? "border-primary bg-primary/10 text-foreground shadow-sm"
                  : "border-border bg-background text-muted-foreground hover:border-primary/40"
              }`}
            >
              <span className="mr-1">{c.emoji}</span>
              {c.label}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="note">Note (optional)</Label>
        <Textarea id="note" value={note} onChange={(e) => setNote(e.target.value)} placeholder="What did you treat yourself to?" className="rounded-2xl bg-background resize-none" rows={2} />
      </div>

      <Button type="submit" className="w-full rounded-full h-11 bg-primary hover:bg-primary/90">
        <Plus className="h-4 w-4 mr-1" /> Add expense
      </Button>
    </form>
  );
};
