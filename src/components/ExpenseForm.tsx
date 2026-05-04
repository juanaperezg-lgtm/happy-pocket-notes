import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  EXPENSE_CATEGORIES,
  INCOME_CATEGORIES,
  Category,
  Language,
  Transaction,
  TransactionKind,
} from "@/lib/tracker-store";
import { toast } from "sonner";
import { Pencil, Plus } from "lucide-react";

interface Props {
  language: Language;
  editing: Transaction | null;
  onCreate: (tx: { amount: number; category: Category; kind: TransactionKind; date: string; note?: string }) => Promise<void> | void;
  onUpdate: (id: string, tx: { amount: number; category: Category; kind: TransactionKind; date: string; note?: string }) => Promise<void> | void;
  onCancelEdit: () => void;
}

const TEXT = {
  es: {
    titleCreate: "Registrar movimiento",
    titleEdit: "Editar movimiento",
    subtitle: "Una forma suave de llevar tus finanzas del día.",
    amount: "Monto",
    date: "Fecha",
    category: "Categoría",
    note: "Nota (opcional)",
    placeholderNote: "¿Qué compraste o recibiste hoy?",
    submitCreate: "Guardar movimiento",
    submitEdit: "Actualizar movimiento",
    cancelEdit: "Cancelar edición",
    invalidAmount: "Escribe un monto válido",
    successCreate: "Movimiento guardado ✨",
    successUpdate: "Movimiento actualizado 🌸",
    saveError: "No se pudo guardar el movimiento",
    kindExpense: "Gasto",
    kindIncome: "Ingreso",
  },
  en: {
    titleCreate: "Log a transaction",
    titleEdit: "Edit transaction",
    subtitle: "A gentle way to track your daily money flow.",
    amount: "Amount",
    date: "Date",
    category: "Category",
    note: "Note (optional)",
    placeholderNote: "What did you buy or receive today?",
    submitCreate: "Save transaction",
    submitEdit: "Update transaction",
    cancelEdit: "Cancel edit",
    invalidAmount: "Please enter a valid amount",
    successCreate: "Transaction saved ✨",
    successUpdate: "Transaction updated 🌸",
    saveError: "We couldn't save the transaction",
    kindExpense: "Expense",
    kindIncome: "Income",
  },
} as const;

export const ExpenseForm = ({ language, editing, onCreate, onUpdate, onCancelEdit }: Props) => {
  const t = TEXT[language];
  const today = new Date().toISOString().slice(0, 10);
  const [amount, setAmount] = useState("");
  const [kind, setKind] = useState<TransactionKind>("expense");
  const [category, setCategory] = useState<Category>("food");
  const [date, setDate] = useState(today);
  const [note, setNote] = useState("");

  useEffect(() => {
    if (!editing) return;
    setAmount(String(editing.amount));
    setKind(editing.kind);
    setCategory(editing.category);
    setDate(editing.date);
    setNote(editing.note ?? "");
  }, [editing]);

  const resetForm = () => {
    setAmount("");
    setKind("expense");
    setCategory("food");
    setDate(today);
    setNote("");
  };

  useEffect(() => {
    const options = kind === "expense" ? EXPENSE_CATEGORIES : INCOME_CATEGORIES;
    if (!options.some((c) => c.id === category)) {
      setCategory(options[0].id);
    }
  }, [kind, category]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const n = parseFloat(amount);
    if (!n || n <= 0) {
      toast.error(t.invalidAmount);
      return;
    }

    const payload = { amount: n, kind, category, date, note: note.trim() || undefined };
    try {
      if (editing) {
        await onUpdate(editing.id, payload);
        toast.success(t.successUpdate);
      } else {
        await onCreate(payload);
        toast.success(t.successCreate);
      }
      resetForm();
    } catch {
      toast.error(t.saveError);
    }
  };

  const categoryOptions = kind === "expense" ? EXPENSE_CATEGORIES : INCOME_CATEGORIES;

  return (
    <form onSubmit={submit} className="cozy-card p-6 space-y-4">
      <div>
        <h3 className="font-serif text-2xl">{editing ? t.titleEdit : t.titleCreate}</h3>
        <p className="text-sm text-muted-foreground">{t.subtitle}</p>
      </div>

      <div className="flex gap-2 rounded-full bg-muted/60 p-1">
        <button
          type="button"
          onClick={() => setKind("expense")}
          className={`flex-1 rounded-full px-4 py-2 text-sm font-medium transition ${
            kind === "expense" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"
          }`}
        >
          {t.kindExpense}
        </button>
        <button
          type="button"
          onClick={() => setKind("income")}
          className={`flex-1 rounded-full px-4 py-2 text-sm font-medium transition ${
            kind === "income" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"
          }`}
        >
          {t.kindIncome}
        </button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="amount">{t.amount}</Label>
          <Input id="amount" type="number" step="0.01" placeholder="0.00" value={amount} onChange={(e) => setAmount(e.target.value)} className="rounded-2xl bg-background" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="date">{t.date}</Label>
          <Input id="date" type="date" value={date} onChange={(e) => setDate(e.target.value)} className="rounded-2xl bg-background" />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label>{t.category}</Label>
        <div className="flex flex-wrap gap-2">
          {categoryOptions.map((c) => (
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
              {c.label[language]}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="note">{t.note}</Label>
        <Textarea id="note" value={note} onChange={(e) => setNote(e.target.value)} placeholder={t.placeholderNote} className="rounded-2xl bg-background resize-none" rows={2} />
      </div>

      <div className="flex flex-wrap gap-2">
        <Button type="submit" className="flex-1 rounded-full h-11 bg-primary hover:bg-primary/90">
          {editing ? <Pencil className="mr-1 h-4 w-4" /> : <Plus className="mr-1 h-4 w-4" />}
          {editing ? t.submitEdit : t.submitCreate}
        </Button>
        {editing && (
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              onCancelEdit();
              resetForm();
            }}
            className="rounded-full h-11"
          >
            {t.cancelEdit}
          </Button>
        )}
      </div>
    </form>
  );
};
