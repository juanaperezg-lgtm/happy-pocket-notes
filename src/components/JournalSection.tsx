import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { JournalEntry, Language } from "@/lib/tracker-store";
import { format, parseISO } from "date-fns";
import { BookHeart, Trash2 } from "lucide-react";
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
  language: Language;
  entries: JournalEntry[];
  onAdd: (e: { date: string; text: string }) => Promise<void> | void;
  onRemove: (id: string) => Promise<void> | void;
}

const TEXT = {
  es: {
    title: "Notas del día",
    placeholder: "¿Qué hiciste, viste o compraste hoy? Escribe con calma...",
    save: "Guardar nota",
    saved: "Guardado en tu diario 🌸",
    saveError: "No se pudo guardar la nota",
    empty: "Aún no hay notas, tu diario te espera.",
    deleteTitle: "Eliminar nota",
    deleteDescription: "Esta nota se eliminará de forma permanente.",
    deleteConfirm: "Eliminar",
    deleteCancel: "Cancelar",
    deleteError: "No se pudo eliminar la nota",
  },
  en: {
    title: "Today's notes",
    placeholder: "What did you do, see, or buy today? Write freely...",
    save: "Save note",
    saved: "Saved to your journal 🌸",
    saveError: "We couldn't save the note",
    empty: "No notes yet — your journal is waiting.",
    deleteTitle: "Delete note",
    deleteDescription: "This note will be permanently deleted.",
    deleteConfirm: "Delete",
    deleteCancel: "Cancel",
    deleteError: "We couldn't delete the note",
  },
} as const;

export const JournalSection = ({ language, entries, onAdd, onRemove }: Props) => {
  const t = TEXT[language];
  const today = new Date().toISOString().slice(0, 10);
  const [date, setDate] = useState(today);
  const [text, setText] = useState("");
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    try {
      await onAdd({ date, text: text.trim() });
      setText("");
      toast.success(t.saved);
    } catch {
      toast.error(t.saveError);
    }
  };

  const sorted = [...entries].sort((a, b) => b.date.localeCompare(a.date));

  return (
    <div className="cozy-card p-6 space-y-5">
      <div className="flex items-center gap-2">
        <BookHeart className="h-5 w-5 text-primary" />
        <h3 className="font-serif text-2xl">{t.title}</h3>
      </div>

      <form onSubmit={submit} className="space-y-3">
        <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="rounded-2xl bg-background w-full sm:w-48" />
        <Textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={t.placeholder}
          rows={4}
          className="rounded-2xl bg-background resize-none"
        />
        <Button type="submit" className="rounded-full bg-secondary text-secondary-foreground hover:bg-secondary/80">
          {t.save}
        </Button>
      </form>

      <div className="space-y-3 pt-2">
        {sorted.length === 0 && (
          <p className="text-sm text-muted-foreground italic">{t.empty}</p>
        )}
        {sorted.map((j) => (
          <div key={j.id} className="group rounded-2xl bg-accent/40 p-4 border border-border/40">
            <div className="flex items-start justify-between gap-3">
              <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {format(parseISO(j.date), "EEEE, MMM d")}
              </div>
              <button
                onClick={(e) => {
                  e.preventDefault();
                  setPendingDeleteId(j.id);
                }}
                className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition"
                aria-label="Delete note"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
            <p className="mt-2 text-sm leading-relaxed text-foreground/85 whitespace-pre-wrap">{j.text}</p>
          </div>
        ))}
      </div>

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
