import { useState } from "react";
import { toast } from "sonner";
import { ArrowRight, Lock, Mail, ShieldCheck, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAppStore } from "@/store/useAppStore";
import { loginWithPassword, registerUser } from "@/services/api";
import { passwordScore, SCORE_LABELS } from "@/lib/format";

export function AuthScreen() {
  const [mode, setMode] = useState("login"); // 'login' | 'register'
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const signIn = useAppStore((s) => s.signIn);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Please enter email and password");
      return;
    }

    setLoading(true);
    try {
      if (mode === "register") {
        await registerUser({ email, password });
        toast.success("Account created successfully! Logging you in...");
      }
      
      const tokens = await loginWithPassword({ email, password });
      signIn(tokens);
      toast.success("Welcome back to Fieldchat");
    } catch (err) {
      toast.error(err.message || "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  const score = passwordScore(password);

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-background p-4 sm:p-8">
      {/* Dynamic Zinc Glow Effect */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-zinc-800/20 via-background to-background pointer-events-none" />

      <div className="relative z-10 w-full max-w-md space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="mx-auto grid size-12 place-items-center rounded-2xl bg-zinc-900 border border-zinc-800 shadow-md text-foreground">
            <Sparkles className="size-6 text-zinc-100" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Fieldchat</h1>
          <p className="text-xs text-muted-foreground">
            Fast, calm, professional team messaging
          </p>
        </div>

        {/* Auth Form Card */}
        <div className="rounded-xl border border-border bg-surface/90 p-6 shadow-soft backdrop-blur-md">
          {/* Mode Switcher Tabs */}
          <div className="mb-6 grid grid-cols-2 gap-1 rounded-lg bg-elevated/70 p-1">
            <button
              type="button"
              onClick={() => setMode("login")}
              className={`rounded-md py-1.5 text-xs font-medium transition-all ${
                mode === "login"
                  ? "bg-background text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => setMode("register")}
              className={`rounded-md py-1.5 text-xs font-medium transition-all ${
                mode === "register"
                  ? "bg-background text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Register
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
                <Input
                  type="email"
                  required
                  placeholder="name@organization.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-9 text-xs"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
                <Input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-9 text-xs"
                />
              </div>
              {mode === "register" && password && (
                <div className="pt-1 space-y-1">
                  <div className="flex h-1.5 gap-1">
                    {[1, 2, 3, 4].map((level) => (
                      <div
                        key={level}
                        className={`h-full flex-1 rounded-full transition-all ${
                          score >= level
                            ? score >= 3
                              ? "bg-success"
                              : "bg-amber-500"
                            : "bg-muted"
                        }`}
                      />
                    ))}
                  </div>
                  <p className="text-[10px] text-muted-foreground">
                    Strength: <span className="font-medium text-foreground">{SCORE_LABELS[score]}</span>
                  </p>
                </div>
              )}
            </div>

            <Button type="submit" disabled={loading} className="w-full mt-2 gap-2 text-xs">
              {loading ? (
                "Processing..."
              ) : (
                <>
                  {mode === "login" ? "Sign In to Account" : "Create New Account"}
                  <ArrowRight className="size-4" />
                </>
              )}
            </Button>
          </form>
        </div>

        {/* Footer info */}
        <div className="flex items-center justify-center gap-1.5 text-[11px] text-muted-foreground">
          <ShieldCheck className="size-3.5" />
          <span>Encrypted token authentication via FastAPI</span>
        </div>
      </div>
    </div>
  );
}
