import { ArrowRight, ShieldCheck, MessageSquare, Lock } from "lucide-react";

export function LandingPage({ onLogin, onGetStarted }) {
  return (
    <main className="relative w-full h-[100dvh] overflow-hidden bg-[#09090b] text-[#f4f4f5] flex flex-col justify-between p-6 sm:p-8 md:p-10 select-none">
      {/* Premium ambient glows */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 overflow-hidden"
      >
        <div className="absolute left-1/4 top-[-200px] h-[500px] w-[800px] rounded-full bg-gradient-to-tr from-indigo-500/10 via-purple-500/5 to-transparent blur-[120px]" />
        <div className="absolute bottom-[-150px] right-[-100px] h-[400px] w-[600px] rounded-full bg-gradient-to-br from-blue-500/5 via-violet-500/3 to-transparent blur-[100px]" />
      </div>

      {/* Header */}
      <header className="relative z-10 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="flex size-8 items-center justify-center rounded-xl bg-zinc-900/60 border border-zinc-800/40 p-1.5 shadow-inner">
            <img src="/Logo.svg" alt="Fieldchat Logo" className="size-full object-contain" />
          </div>
          <span className="text-sm font-semibold tracking-tight text-foreground">Fieldchat</span>
        </div>

        <button
          type="button"
          onClick={onLogin}
          className="text-xs text-muted-foreground hover:text-foreground transition-colors font-medium cursor-pointer"
        >
          Sign In
        </button>
      </header>

      {/* Main Content Area: Flex center to guarantee fitting */}
      <div className="relative z-10 flex-1 flex flex-col lg:flex-row items-center justify-center gap-8 lg:gap-16 max-w-5xl mx-auto w-full min-h-0 py-4">
        
        {/* Left Column: Minimal typographic intro */}
        <div className="space-y-5 lg:max-w-md text-center lg:text-left">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight bg-gradient-to-r from-zinc-50 via-zinc-200 to-zinc-400 bg-clip-text text-transparent leading-none">
            Chat, <br />
            simply.
          </h1>

          <p className="text-xs sm:text-sm text-zinc-400 max-w-xs mx-auto lg:mx-0 leading-relaxed">
            A quiet space for real-time messaging. Direct, private, and distraction-free.
          </p>

          <div className="flex justify-center lg:justify-start gap-3 pt-2">
            <button
              onClick={onGetStarted}
              className="group px-5 py-2.5 bg-zinc-50 text-zinc-950 font-semibold text-xs rounded-xl hover:bg-zinc-200 transition-all flex items-center gap-1.5 cursor-pointer shadow-md"
            >
              Get Started
              <ArrowRight size={13} className="transition-transform group-hover:translate-x-0.5" />
            </button>
            <button
              onClick={onLogin}
              className="px-5 py-2.5 border border-zinc-800 bg-zinc-900/40 text-zinc-300 font-medium text-xs rounded-xl hover:bg-zinc-900 transition-all cursor-pointer"
            >
              Log In
            </button>
          </div>
        </div>

        {/* Right Column: Zen Interactive chat preview */}
        <div className="w-full max-w-[360px] md:max-w-[400px] shrink-0 min-h-0 flex flex-col justify-center">
          <div className="rounded-2xl border border-zinc-800/50 bg-zinc-900/20 p-5 md:p-6 shadow-2xl backdrop-blur-md relative overflow-hidden">
            {/* Live badge */}
            <div className="absolute top-4 right-4 flex items-center gap-1.5 bg-zinc-900/60 border border-zinc-800/40 rounded-full px-2 py-0.5 text-[9px] text-muted-foreground">
              <span className="size-1.5 rounded-full bg-success shadow-[0_0_6px_rgba(16,185,129,0.5)]" />
              <span>Live Sync</span>
            </div>

            {/* Conversation list preview */}
            <div className="space-y-4 pt-3">
              {/* Message 1 (Incoming) */}
              <div className="flex gap-2.5">
                <div className="flex size-6 shrink-0 items-center justify-center rounded-lg bg-zinc-800 text-[10px] text-zinc-300 font-medium select-none">
                  A
                </div>
                <div className="rounded-2xl rounded-tl-md bg-zinc-800/40 border border-zinc-800/30 px-3.5 py-2 text-xs max-w-[85%] text-zinc-300">
                  <span className="block text-[10px] font-semibold text-zinc-400 mb-0.5">Alice</span>
                  Are the messages fast?
                </div>
              </div>

              {/* Message 2 (Outgoing) */}
              <div className="flex justify-end">
                <div className="rounded-2xl rounded-br-md bg-indigo-600/80 px-3.5 py-2 text-xs max-w-[85%] text-white shadow-lg">
                  Sub-millisecond WebSocket delivery.
                </div>
              </div>

              {/* Message 3 (Incoming) */}
              <div className="flex gap-2.5">
                <div className="flex size-6 shrink-0 items-center justify-center rounded-lg bg-zinc-800 text-[10px] text-zinc-300 font-medium select-none">
                  A
                </div>
                <div className="rounded-2xl rounded-tl-md bg-zinc-800/40 border border-zinc-800/30 px-3.5 py-2 text-xs max-w-[85%] text-zinc-300">
                  <span className="block text-[10px] font-semibold text-zinc-400 mb-0.5">Alice</span>
                  And private?
                </div>
              </div>

              {/* Message 4 (Outgoing) */}
              <div className="flex justify-end">
                <div className="rounded-2xl rounded-br-md bg-indigo-600/80 px-3.5 py-2 text-xs max-w-[85%] text-white shadow-lg">
                  Completely. No telemetry, no noise.
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Footer */}
      <footer className="relative z-10 flex items-center justify-center gap-1.5 text-[9px] text-muted-foreground/40 shrink-0">
        <ShieldCheck className="size-3.5" />
        <span>FastAPI Token Security • Real-Time WebSockets</span>
      </footer>
    </main>
  );
}
