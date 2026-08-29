import { useState } from "react";
import { toast } from "sonner";
import { ArrowRight, Lock, Mail, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAppStore } from "@/store/useAppStore";
import { loginWithPassword, registerUser } from "@/services/api";
import { passwordScore, SCORE_LABELS } from "@/lib/format";

export function AuthScreen({ initialMode = "login" }) {
  const [mode, setMode] = useState(initialMode); // 'login' | 'register'
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
    <div className="relative flex min-h-screen w-full items-center justify-center bg-[#09090b] text-[#f4f4f5] p-4 sm:p-8 overflow-hidden select-none">
      {/* Premium ambient glows */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 overflow-hidden"
      >
        <div className="absolute left-1/4 top-[-200px] h-[500px] w-[800px] rounded-full bg-gradient-to-tr from-indigo-500/10 via-purple-500/5 to-transparent blur-[120px]" />
        <div className="absolute bottom-[-150px] right-[-100px] h-[400px] w-[600px] rounded-full bg-gradient-to-br from-blue-500/5 via-violet-500/3 to-transparent blur-[100px]" />
      </div>

      <div className="relative z-10 w-full max-w-md space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2.5">
          <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-zinc-900/60 border border-zinc-800/40 p-2 shadow-inner select-none pointer-events-none">
            <img src="/Logo.svg" alt="Fieldchat Logo" className="size-full object-contain" />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-foreground">Fieldchat</h1>
          <p className="text-xs text-muted-foreground">
            A quiet space for real-time messaging
          </p>
        </div>

        {/* Auth Form Card */}
        <div className="rounded-2xl border border-zinc-800/60 bg-zinc-900/30 p-6 md:p-8 shadow-2xl backdrop-blur-md">
          {/* Mode Switcher Tabs */}
          <div className="mb-6 grid grid-cols-2 gap-1 rounded-lg bg-zinc-950/60 p-1 border border-zinc-800/40">
            <button
              type="button"
              onClick={() => setMode("login")}
              className={`rounded-md py-1.5 text-xs font-medium transition-all cursor-pointer ${
                mode === "login"
                  ? "bg-zinc-800 text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => setMode("register")}
              className={`rounded-md py-1.5 text-xs font-medium transition-all cursor-pointer ${
                mode === "register"
                  ? "bg-zinc-800 text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Register
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
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
                  className="pl-9 text-xs bg-zinc-950/20 border-zinc-800/80 focus:border-zinc-700"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
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
                  className="pl-9 text-xs bg-zinc-950/20 border-zinc-800/80 focus:border-zinc-700"
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
                            : "bg-zinc-800"
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

            <Button type="submit" disabled={loading} className="w-full mt-2 gap-2 text-xs py-2 cursor-pointer">
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
        <div className="flex items-center justify-center gap-1.5 text-[10px] text-muted-foreground/50">
          <ShieldCheck className="size-3.5" />
          <span>Encrypted token authentication via FastAPI</span>
        </div>
      </div>
    </div>
  );
}
