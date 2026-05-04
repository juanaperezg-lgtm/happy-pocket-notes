import { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
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
    invalidAmount: "Escribe un monto válido mayor a 0",
    invalidDate: "Fecha requerida",
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
    invalidAmount: "Please enter a valid amount greater than 0",
    invalidDate: "Date is required",
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

  const formSchema = z.object({
    amount: z.coerce.number().positive(t.invalidAmount),
    date: z.string().min(10, t.invalidDate),
    kind: z.enum(["expense", "income"]),
    category: z.string(),
    note: z.string().optional(),
  });

  type FormValues = z.infer<typeof formSchema>;

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      amount: undefined,
      date: today,
      kind: "expense",
      category: "food",
      note: "",
    },
  });

  const { handleSubmit, control, watch, reset, setValue } = form;
  const currentKind = watch("kind");
  const currentCategory = watch("category");
  const categoryOptions = currentKind === "expense" ? EXPENSE_CATEGORIES : INCOME_CATEGORIES;

  useEffect(() => {
    if (!editing) {
      reset({
        amount: undefined,
        date: today,
        kind: "expense",
        category: "food",
        note: "",
      });
      return;
    }
    reset({
      amount: editing.amount,
      date: editing.date,
      kind: editing.kind,
      category: editing.category,
      note: editing.note ?? "",
    });
  }, [editing, reset, today]);

  useEffect(() => {
    const options = currentKind === "expense" ? EXPENSE_CATEGORIES : INCOME_CATEGORIES;
    if (!options.some((c) => c.id === currentCategory)) {
      setValue("category", options[0].id);
    }
  }, [currentKind, currentCategory, setValue]);

  const submit = async (data: FormValues) => {
    const payload = {
      amount: Number(data.amount),
      kind: data.kind as TransactionKind,
      category: data.category as Category,
      date: data.date,
      note: data.note?.trim() || undefined,
    };
    try {
      if (editing) {
        await onUpdate(editing.id, payload);
        toast.success(t.successUpdate);
      } else {
        await onCreate(payload);
        toast.success(t.successCreate);
      }
      reset({ amount: undefined, date: today, kind: "expense", category: "food", note: "" });
    } catch {
      toast.error(t.saveError);
    }
  };

  return (
    <form onSubmit={handleSubmit(submit)} className="cozy-card p-6 space-y-4">
      <div>
        <h3 className="font-serif text-2xl">{editing ? t.titleEdit : t.titleCreate}</h3>
        <p className="text-sm text-muted-foreground">{t.subtitle}</p>
      </div>

      <div className="flex gap-2 rounded-full bg-muted/60 p-1">
        <button
          type="button"
          onClick={() => setValue("kind", "expense")}
          className={`flex-1 rounded-full px-4 py-2 text-sm font-medium transition ${
            currentKind === "expense" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"
          }`}
        >
          {t.kindExpense}
        </button>
        <button
          type="button"
          onClick={() => setValue("kind", "income")}
          className={`flex-1 rounded-full px-4 py-2 text-sm font-medium transition ${
            currentKind === "income" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"
          }`}
        >
          {t.kindIncome}
        </button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <Controller
          control={control}
          name="amount"
          render={({ field, fieldState }) => (
            <div className="space-y-1.5">
              <Label htmlFor="amount">{t.amount}</Label>
              <Input
                {...field}
                id="amount"
                type="number"
                step="0.01"
                placeholder="0.00"
                value={field.value ?? ""}
                className={`rounded-2xl bg-background ${fieldState.error ? "border-destructive focus-visible:ring-destructive" : ""}`}
              />
              {fieldState.error && <p className="text-xs text-destructive">{fieldState.error.message}</p>}
            </div>
          )}
        />
        <Controller
          control={control}
          name="date"
          render={({ field, fieldState }) => (
            <div className="space-y-1.5">
              <Label htmlFor="date">{t.date}</Label>
              <Input
                {...field}
                id="date"
                type="date"
                className={`rounded-2xl bg-background ${fieldState.error ? "border-destructive focus-visible:ring-destructive" : ""}`}
              />
              {fieldState.error && <p className="text-xs text-destructive">{fieldState.error.message}</p>}
            </div>
          )}
        />
      </div>

      <div className="space-y-1.5">
        <Label>{t.category}</Label>
        <div className="flex flex-wrap gap-2">
          {categoryOptions.map((c) => (
            <button
              type="button"
              key={c.id}
              onClick={() => setValue("category", c.id)}
              className={`px-3 py-2 rounded-full text-sm font-medium border transition-all ${
                currentCategory === c.id
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

      <Controller
        control={control}
        name="note"
        render={({ field }) => (
          <div className="space-y-1.5">
            <Label htmlFor="note">{t.note}</Label>
            <Textarea
              {...field}
              id="note"
              placeholder={t.placeholderNote}
              className="rounded-2xl bg-background resize-none"
              rows={2}
            />
          </div>
        )}
      />

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
