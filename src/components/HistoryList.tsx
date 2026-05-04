import { useMemo, useState } from "react";
import {
  CATEGORIES,
  Category,
  INCOME_CATEGORIES,
  Language,
  TrackerSettings,
  Transaction,
  fmtMoney,
} from "@/lib/tracker-store";
import { Input } from "@/components/ui/input";
import { format, parseISO } from "date-fns";
import { Trash2, Filter, Pencil } from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface Props {
  transactions: Transaction[];
  language: Language;
  settings: TrackerSettings;
  onEdit: (tx: Transaction) => void;
  onRemove: (id: string) => Promise<void> | void;
}

const TEXT = {
  es: {
    title: "Historial",
    empty: "Aún no hay movimientos.",
    all: "Todo",
    expense: "Gasto",
    income: "Ingreso",
    from: "Desde",
    to: "Hasta",
    deleteTitle: "Eliminar movimiento",
    deleteDescription: "Esta acción no se puede deshacer.",
    deleteConfirm: "Eliminar",
    deleteCancel: "Cancelar",
    deleteError: "No se pudo eliminar el movimiento",
  },
  en: {
    title: "History",
    empty: "No transactions yet.",
    all: "All",
    expense: "Expense",
    income: "Income",
    from: "From",
    to: "To",
    deleteTitle: "Delete transaction",
    deleteDescription: "This action cannot be undone.",
    deleteConfirm: "Delete",
    deleteCancel: "Cancel",
    deleteError: "We couldn't delete the transaction",
  },
} as const;

export const HistoryList = ({ transactions, language, settings, onEdit, onRemove }: Props) => {
  const t = TEXT[language];
  const [cat, setCat] = useState<Category | "all">("all");
  const [kind, setKind] = useState<"all" | "expense" | "income">("all");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return transactions
      .filter((e) => (kind === "all" ? true : e.kind === kind))
      .filter((e) => (cat === "all" ? true : e.category === cat))
      .filter((e) => (from ? e.date >= from : true))
      .filter((e) => (to ? e.date <= to : true))
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [transactions, cat, from, to, kind]);

  const allCategories = [...CATEGORIES, ...INCOME_CATEGORIES];
  const catMeta = (id: Category) => allCategories.find((c) => c.id === id)!;

  return (
    <div className="cozy-card p-6 space-y-5">
      <div className="flex items-center gap-2">
        <Filter className="h-5 w-5 text-primary" />
        <h3 className="font-serif text-2xl">{t.title}</h3>
      </div>

      <div className="space-y-3">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setKind("all")}
            className={`px-3 py-1.5 rounded-full text-sm border transition ${
              kind === "all" ? "bg-primary/10 border-primary text-foreground" : "bg-background border-border text-muted-foreground"
            }`}
          >
            {t.all}
          </button>
          <button
            onClick={() => setKind("expense")}
            className={`px-3 py-1.5 rounded-full text-sm border transition ${
              kind === "expense" ? "bg-primary/10 border-primary text-foreground" : "bg-background border-border text-muted-foreground"
            }`}
          >
            {t.expense}
          </button>
          <button
            onClick={() => setKind("income")}
            className={`px-3 py-1.5 rounded-full text-sm border transition ${
              kind === "income" ? "bg-primary/10 border-primary text-foreground" : "bg-background border-border text-muted-foreground"
            }`}
          >
            {t.income}
          </button>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setCat("all")}
            className={`px-3 py-1.5 rounded-full text-sm border transition ${
              cat === "all" ? "bg-primary/10 border-primary text-foreground" : "bg-background border-border text-muted-foreground"
            }`}
          >
            {t.all}
          </button>
          {allCategories.map((c) => (
            <button
              key={c.id}
              onClick={() => setCat(c.id)}
              className={`px-3 py-1.5 rounded-full text-sm border transition ${
                cat === c.id ? "bg-primary/10 border-primary text-foreground" : "bg-background border-border text-muted-foreground"
              }`}
            >
              {c.emoji} {c.label[language]}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="rounded-2xl bg-background w-full sm:w-44" placeholder={t.from} />
          <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="rounded-2xl bg-background w-full sm:w-44" placeholder={t.to} />
        </div>
      </div>

      <ul className="space-y-2 max-h-[460px] overflow-y-auto pr-1">
        {filtered.length === 0 && (
          <li className="text-sm text-muted-foreground italic py-6 text-center">{t.empty}</li>
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
                  <p className="font-medium truncate">{e.note || c.label[language]}</p>
                  <span className={`font-serif text-lg whitespace-nowrap ${e.kind === "income" ? "text-emerald-700" : ""}`}>
                    {e.kind === "income" ? "+" : "-"}{fmtMoney(e.amount, settings)}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  {format(parseISO(e.date), "MMM d, yyyy")} · {c.label[language]}
                </p>
              </div>
              <button
                onClick={() => onEdit(e)}
                className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-foreground transition"
                aria-label="Edit"
              >
                <Pencil className="h-4 w-4" />
              </button>
              <button
                onClick={() => setPendingDeleteId(e.id)}
                className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition"
                aria-label="Delete"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </li>
          );
        })}
      </ul>

      <AlertDialog open={pendingDeleteId !== null} onOpenChange={(open) => !open && setPendingDeleteId(null)}>
        <AlertDialogContent className="rounded-3xl border-border bg-card">
          <AlertDialogHeader>
            <AlertDialogTitle>{t.deleteTitle}</AlertDialogTitle>
            <AlertDialogDescription>{t.deleteDescription}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-full">{t.deleteCancel}</AlertDialogCancel>
            <AlertDialogAction
              className="rounded-full bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (pendingDeleteId) {
                  void onRemove(pendingDeleteId).catch(() => {
                    toast.error(t.deleteError);
                  });
                }
                setPendingDeleteId(null);
              }}
            >
              {t.deleteConfirm}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
