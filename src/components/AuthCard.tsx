import { FormEvent, useState } from "react";
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
  },
} as const;

export const AuthCard = ({ language, onLogin, onRegister }: Props) => {
  const t = TEXT[language];
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true);
    try {
      if (mode === "login") {
        await onLogin(email, password);
      } else {
        await onRegister(email, password);
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
        <form onSubmit={submit} className="cozy-card w-full space-y-5 p-6">
          <div className="text-center">
            <div className="mb-2 inline-flex items-center gap-2 text-primary">
              <Flower2 className="h-5 w-5" />
              <span className="font-serif italic text-lg">Bloom</span>
            </div>
            <h1 className="font-serif text-3xl">{t.title}</h1>
            <p className="mt-2 text-sm text-muted-foreground">{t.subtitle}</p>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="email">{t.email}</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="rounded-2xl bg-background"
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="password">{t.password}</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="rounded-2xl bg-background"
              minLength={8}
              required
            />
          </div>

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
