import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Flower2, Plus, BarChart3, BookHeart } from "lucide-react";
import { Language } from "@/lib/tracker-store";

interface Props {
  language: Language;
}

const TEXT = {
  es: {
    title: "¡Bienvenida a Bloom! 🌸",
    description: "Estamos muy felices de que estés aquí. Te mostramos rápidamente cómo funciona tu nuevo espacio:",
    step1Title: "Registra tus movimientos",
    step1Desc: "Usa el formulario principal para anotar lo que gastas o recibes cada día.",
    step2Title: "Revisa tus resúmenes",
    step2Desc: "Las gráficas y paneles te ayudarán a ver en qué se va tu dinero y si estás dentro de tu presupuesto.",
    step3Title: "Escribe en tu diario",
    step3Desc: "Anota cómo te sientes o qué compraste hoy. Es tu espacio personal.",
    start: "Comenzar",
  },
  en: {
    title: "Welcome to Bloom! 🌸",
    description: "We are so happy you are here. Here's a quick tour of your new space:",
    step1Title: "Log your transactions",
    step1Desc: "Use the main form to write down what you spend or receive every day.",
    step2Title: "Check your summaries",
    step2Desc: "Charts and panels will help you see where your money goes and if you are on budget.",
    step3Title: "Write in your journal",
    step3Desc: "Write down how you feel or what you bought today. It's your personal space.",
    start: "Get started",
  },
} as const;

export const Onboarding = ({ language }: Props) => {
  const [open, setOpen] = useState(false);
  const t = TEXT[language];

  useEffect(() => {
    const hasSeen = localStorage.getItem("bloom.onboarded.v1");
    if (!hasSeen) {
      setOpen(true);
    }
  }, []);

  const handleClose = () => {
    localStorage.setItem("bloom.onboarded.v1", "true");
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-[425px] rounded-3xl border-border bg-card" onInteractOutside={(e) => e.preventDefault()} onEscapeKeyDown={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="font-serif text-2xl flex items-center gap-2">
            <Flower2 className="h-6 w-6 text-primary" />
            {t.title}
          </DialogTitle>
          <DialogDescription className="text-base text-foreground/80 mt-2">
            {t.description}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="flex items-start gap-3">
            <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Plus className="h-4 w-4" />
            </div>
            <div>
              <p className="font-semibold">{t.step1Title}</p>
              <p className="text-sm text-muted-foreground">{t.step1Desc}</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
              <BarChart3 className="h-4 w-4" />
            </div>
            <div>
              <p className="font-semibold">{t.step2Title}</p>
              <p className="text-sm text-muted-foreground">{t.step2Desc}</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
              <BookHeart className="h-4 w-4" />
            </div>
            <div>
              <p className="font-semibold">{t.step3Title}</p>
              <p className="text-sm text-muted-foreground">{t.step3Desc}</p>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button onClick={handleClose} className="w-full rounded-full h-11 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold">
            {t.start}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
