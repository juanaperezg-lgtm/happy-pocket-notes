import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Flower2 } from "lucide-react";
import { toast } from "sonner";
import { Language } from "@/lib/tracker-store";

interface Props {
  language: Language;
  onLogin: (email: string, password: string) => Promise<void>;
  onRegister: (email: string, password: string) => Promise<void>;
}

const TEXT = {
  es: {
    title: "Bienvenida",
    subtitle: "Ingresa para sincronizar tus datos en la nube.",
    email: "Correo",
    password: "Contraseña",
    login: "Entrar",
    register: "Crear cuenta",
    switchToRegister: "¿Primera vez? Crea tu cuenta",
    switchToLogin: "¿Ya tienes cuenta? Inicia sesión",
    error: "No se pudo completar el acceso",
    invalidEmail: "Correo inválido",
    invalidPassword: "La contraseña debe tener al menos 8 caracteres",
  },
  en: {
    title: "Welcome",
    subtitle: "Sign in to sync your data in the cloud.",
    email: "Email",
    password: "Password",
    login: "Sign in",
    register: "Create account",
    switchToRegister: "First time? Create your account",
    switchToLogin: "Already have an account? Sign in",
    error: "We couldn't complete access",
    invalidEmail: "Invalid email",
    invalidPassword: "Password must be at least 8 characters",
  },
} as const;

export const AuthCard = ({ language, onLogin, onRegister }: Props) => {
  const t = TEXT[language];
  const [mode, setMode] = useState<"login" | "register">("login");
  const [busy, setBusy] = useState(false);

  const formSchema = z.object({
    email: z.string().email(t.invalidEmail),
    password: z.string().min(8, t.invalidPassword),
  });

  type FormValues = z.infer<typeof formSchema>;

  const { handleSubmit, control } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const submit = async (data: FormValues) => {
    setBusy(true);
    try {
      if (mode === "login") {
        await onLogin(data.email, data.password);
      } else {
        await onRegister(data.email, data.password);
      }
    } catch {
      toast.error(t.error);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto flex min-h-screen max-w-md items-center px-4 py-10">
        <form onSubmit={handleSubmit(submit)} className="cozy-card w-full space-y-5 p-6">
          <div className="text-center">
            <div className="mb-2 inline-flex items-center gap-2 text-primary">
              <Flower2 className="h-5 w-5" />
              <span className="font-serif italic text-lg">Bloom</span>
            </div>
            <h1 className="font-serif text-3xl">{t.title}</h1>
            <p className="mt-2 text-sm text-muted-foreground">{t.subtitle}</p>
          </div>

          <Controller
            control={control}
            name="email"
            render={({ field, fieldState }) => (
              <div className="space-y-1.5">
                <Label htmlFor="email">{t.email}</Label>
                <Input
                  {...field}
                  id="email"
                  type="email"
                  className={`rounded-2xl bg-background ${fieldState.error ? "border-destructive focus-visible:ring-destructive" : ""}`}
                />
                {fieldState.error && <p className="text-xs text-destructive">{fieldState.error.message}</p>}
              </div>
            )}
          />

          <Controller
            control={control}
            name="password"
            render={({ field, fieldState }) => (
              <div className="space-y-1.5">
                <Label htmlFor="password">{t.password}</Label>
                <Input
                  {...field}
                  id="password"
                  type="password"
                  className={`rounded-2xl bg-background ${fieldState.error ? "border-destructive focus-visible:ring-destructive" : ""}`}
                />
                {fieldState.error && <p className="text-xs text-destructive">{fieldState.error.message}</p>}
              </div>
            )}
          />

          <Button type="submit" disabled={busy} className="h-11 w-full rounded-full bg-primary hover:bg-primary/90">
            {mode === "login" ? t.login : t.register}
          </Button>

          <button
            type="button"
            onClick={() => setMode((current) => (current === "login" ? "register" : "login"))}
            className="w-full text-center text-sm text-muted-foreground hover:text-foreground transition"
          >
            {mode === "login" ? t.switchToRegister : t.switchToLogin}
          </button>
        </form>
      </div>
    </div>
  );
};
