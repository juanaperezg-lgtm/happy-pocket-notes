import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { JournalEntry } from "@/lib/tracker-store";
import { format, parseISO } from "date-fns";
import { BookHeart, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface Props {
  entries: JournalEntry[];
  onAdd: (e: { date: string; text: string }) => void;
  onRemove: (id: string) => void;
}

export const JournalSection = ({ entries, onAdd, onRemove }: Props) => {
  const today = new Date().toISOString().slice(0, 10);
  const [date, setDate] = useState(today);
  const [text, setText] = useState("");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    onAdd({ date, text: text.trim() });
    setText("");
    toast.success("Saved to your journal 🌸");
  };

  const sorted = [...entries].sort((a, b) => b.date.localeCompare(a.date));

  return (
    <div className="cozy-card p-6 space-y-5">
      <div className="flex items-center gap-2">
        <BookHeart className="h-5 w-5 text-primary" />
        <h3 className="font-serif text-2xl">Today's notes</h3>
      </div>

      <form onSubmit={submit} className="space-y-3">
        <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="rounded-2xl bg-background w-full sm:w-48" />
        <Textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="What did you do, see, or buy today? Write freely..."
          rows={4}
          className="rounded-2xl bg-background resize-none"
        />
        <Button type="submit" className="rounded-full bg-secondary text-secondary-foreground hover:bg-secondary/80">
          Save note
        </Button>
      </form>

      <div className="space-y-3 pt-2">
        {sorted.length === 0 && (
          <p className="text-sm text-muted-foreground italic">No notes yet — your journal is waiting.</p>
        )}
        {sorted.map((j) => (
          <div key={j.id} className="group rounded-2xl bg-accent/40 p-4 border border-border/40">
            <div className="flex items-start justify-between gap-3">
              <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {format(parseISO(j.date), "EEEE, MMM d")}
              </div>
              <button
                onClick={() => onRemove(j.id)}
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
    </div>
  );
};
