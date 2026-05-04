import { useRef } from "react";
import {
  CATEGORIES,
  Category,
  ExpenseCategory,
  Language,
  TrackerSettings,
  Transaction,
  TransactionKind,
  fmtMoney,
} from "@/lib/tracker-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Download, FileUp, Settings2, WandSparkles } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

interface Props {
  language: Language;
  settings: TrackerSettings;
  transactions: Transaction[];
  journal: { id: string; date: string; text: string }[];
  budget: number;
  categoryBudgets: Partial<Record<ExpenseCategory, number>>;
  onUpdateSettings: (next: Partial<TrackerSettings>) => Promise<void> | void;
  onUpdateCategoryBudget: (category: ExpenseCategory, amount: number) => Promise<void> | void;
  onReplaceData: (next: {
    transactions: Transaction[];
    journal: { id: string; date: string; text: string }[];
    budget?: number;
    categoryBudgets?: Partial<Record<ExpenseCategory, number>>;
  }) => Promise<void> | void;
  onLoadDemo: () => Promise<void> | void;
  onLogout: () => void;
  userEmail?: string;
}

const TEXT = {
  es: {
    title: "Configuración y respaldo",
    language: "Idioma",
    currency: "Moneda",
    categoryBudgets: "Presupuesto por categoría",
    exportJson: "Exportar JSON",
    exportCsv: "Exportar CSV",
    importBackup: "Importar respaldo",
    loadDemo: "Cargar datos demo",
    imported: "Respaldo importado correctamente",
    importError: "No pudimos leer ese archivo",
    exported: "Archivo descargado",
    demoLoaded: "Datos demo cargados",
    actionError: "No se pudo completar la acción",
    logout: "Cerrar sesión",
    langEs: "Español",
    langEn: "English",
  },
  en: {
    title: "Settings and backups",
    language: "Language",
    currency: "Currency",
    categoryBudgets: "Category budgets",
    exportJson: "Export JSON",
    exportCsv: "Export CSV",
    importBackup: "Import backup",
    loadDemo: "Load demo data",
    imported: "Backup imported successfully",
    importError: "We couldn't read that file",
    exported: "File downloaded",
    demoLoaded: "Demo data loaded",
    actionError: "We couldn't complete the action",
    logout: "Log out",
    langEs: "Español",
    langEn: "English",
  },
} as const;

const CURRENCIES = [
  { code: "COP", locale: "es-CO" },
  { code: "USD", locale: "en-US" },
  { code: "MXN", locale: "es-MX" },
  { code: "EUR", locale: "es-ES" },
];

const isKind = (value: string): value is TransactionKind => value === "expense" || value === "income";
const isCategory = (value: string): value is Category =>
  [...CATEGORIES.map((c) => c.id), "salary", "freelance", "gift", "other"].includes(value as Category);

const downloadBlob = (fileName: string, content: string, type: string) => {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  a.click();
  URL.revokeObjectURL(url);
};

const escapeCsv = (value: string) => {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
};

const parseCsvLine = (line: string): string[] => {
  const fields: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === "," && !inQuotes) {
      fields.push(current);
      current = "";
    } else {
      current += ch;
    }
  }
  fields.push(current);
  return fields.map((item) => item.trim());
};

export const SettingsPanel = ({
  language,
  settings,
  transactions,
  journal,
  budget,
  categoryBudgets,
  onUpdateSettings,
  onUpdateCategoryBudget,
  onReplaceData,
  onLoadDemo,
  onLogout,
  userEmail,
}: Props) => {
  const t = TEXT[language];
  const fileInputRef = useRef<HTMLInputElement>(null);

  const exportJson = () => {
    const payload = JSON.stringify(
      {
        transactions,
        journal,
        budget,
        categoryBudgets,
        settings,
        exportedAt: new Date().toISOString(),
      },
      null,
      2,
    );
    downloadBlob("happy-pocket-notes-backup.json", payload, "application/json");
    toast.success(t.exported);
  };

  const exportCsv = () => {
    const rows = [
      "date,kind,category,amount,note",
      ...transactions.map((tx) =>
        [tx.date, tx.kind, tx.category, tx.amount.toFixed(2), escapeCsv(tx.note ?? "")].join(","),
      ),
    ];
    downloadBlob("happy-pocket-notes-transactions.csv", rows.join("\n"), "text/csv;charset=utf-8");
    toast.success(t.exported);
  };

  const onImportFile = async (file: File) => {
    try {
      const content = await file.text();
      if (file.name.toLowerCase().endsWith(".json")) {
        const parsed = JSON.parse(content) as {
          transactions?: Transaction[];
          journal?: { id: string; date: string; text: string }[];
          budget?: number;
          categoryBudgets?: Partial<Record<ExpenseCategory, number>>;
        };
        await onReplaceData({
          transactions: Array.isArray(parsed.transactions) ? parsed.transactions : [],
          journal: Array.isArray(parsed.journal) ? parsed.journal : [],
          budget: parsed.budget,
          categoryBudgets: parsed.categoryBudgets,
        });
      } else if (file.name.toLowerCase().endsWith(".csv")) {
        const lines = content.split(/\r?\n/).filter((line) => line.trim().length > 0);
        const tx = lines
          .slice(1)
          .map(parseCsvLine)
          .map((cols) => ({
            id: crypto.randomUUID(),
            date: cols[0],
            kind: cols[1],
            category: cols[2],
            amount: Number(cols[3]),
            note: cols[4] || undefined,
          }))
          .filter((row) => typeof row.date === "string" && row.date.length >= 10 && isKind(row.kind) && isCategory(row.category) && Number.isFinite(row.amount));

        await onReplaceData({ transactions: tx, journal, budget, categoryBudgets });
      } else {
        throw new Error("Unsupported file type");
      }
      toast.success(t.imported);
    } catch {
      toast.error(t.importError);
    }
  };

  return (
    <div className="cozy-card p-6 space-y-5">
      <div className="flex items-center gap-2">
        <Settings2 className="h-5 w-5 text-primary" />
        <h3 className="font-serif text-2xl">{t.title}</h3>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label>{t.language}</Label>
          <Select
            value={settings.language}
            onValueChange={(next: Language) => {
              if (next === "es") {
                void onUpdateSettings({ language: "es", locale: "es-CO" }).catch(() => toast.error(t.actionError));
              }
              if (next === "en") {
                void onUpdateSettings({ language: "en", locale: "en-US" }).catch(() => toast.error(t.actionError));
              }
            }}
          >
            <SelectTrigger className="rounded-2xl bg-background">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="es">{t.langEs}</SelectItem>
              <SelectItem value="en">{t.langEn}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label>{t.currency}</Label>
          <Select
            value={settings.currency}
            onValueChange={(currency) => {
              const found = CURRENCIES.find((item) => item.code === currency);
              if (!found) return;
              void onUpdateSettings({ currency: found.code, locale: found.locale }).catch(() => toast.error(t.actionError));
            }}
          >
            <SelectTrigger className="rounded-2xl bg-background">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CURRENCIES.map((item) => (
                <SelectItem key={item.code} value={item.code}>
                  {item.code} · {fmtMoney(125000, { currency: item.code, locale: item.locale })}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-sm font-semibold">{t.categoryBudgets}</p>
        <div className="grid gap-2 sm:grid-cols-2">
          {CATEGORIES.map((category) => (
            <div key={category.id} className="rounded-2xl bg-background border border-border/50 px-3 py-2">
              <Label className="text-xs text-muted-foreground">{category.emoji} {category.label[language]}</Label>
              <Input
                type="number"
                min="0"
                value={categoryBudgets[category.id] ?? ""}
                onChange={(e) => {
                  void onUpdateCategoryBudget(category.id, Number(e.target.value) || 0).catch(() => toast.error(t.actionError));
                }}
                className="mt-1 h-9 rounded-xl bg-card"
                placeholder="0"
              />
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="outline" className="rounded-full" onClick={exportJson}>
          <Download className="mr-1 h-4 w-4" /> {t.exportJson}
        </Button>
        <Button type="button" variant="outline" className="rounded-full" onClick={exportCsv}>
          <Download className="mr-1 h-4 w-4" /> {t.exportCsv}
        </Button>
        <Button type="button" variant="outline" className="rounded-full" onClick={() => fileInputRef.current?.click()}>
          <FileUp className="mr-1 h-4 w-4" /> {t.importBackup}
        </Button>
        <Button
          type="button"
          className="rounded-full bg-secondary text-secondary-foreground hover:bg-secondary/80"
          onClick={() => {
            void onLoadDemo()
              .then(() => toast.success(t.demoLoaded))
              .catch(() => toast.error(t.actionError));
          }}
        >
          <WandSparkles className="mr-1 h-4 w-4" /> {t.loadDemo}
        </Button>
        <Button type="button" variant="ghost" className="rounded-full ml-auto" onClick={onLogout}>
          {t.logout}
        </Button>
      </div>
      {userEmail && <p className="text-xs text-muted-foreground">{userEmail}</p>}

      <input
        ref={fileInputRef}
        type="file"
        accept=".json,.csv"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (!file) return;
          void onImportFile(file);
          e.target.value = "";
        }}
      />
    </div>
  );
};
