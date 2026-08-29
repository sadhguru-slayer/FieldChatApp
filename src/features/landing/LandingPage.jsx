import { ArrowRight, Lock, MessageSquare, Users } from "lucide-react";

export function LandingPage({ onLogin }) {
  return (
    <main className="relative min-h-[100dvh] overflow-hidden bg-[var(--color-background)] text-[var(--color-foreground)]">
      {/* Background glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 overflow-hidden"
      >
        <div className="absolute left-1/2 top-[-280px] h-[600px] w-[800px] -translate-x-1/2 rounded-full bg-indigo-500/10 blur-[120px]" />
        <div className="absolute bottom-[-250px] left-[-150px] h-[500px] w-[500px] rounded-full bg-indigo-600/5 blur-[100px]" />
      </div>

      {/* Navigation */}
      <header className="relative z-10 mx-auto flex w-full max-w-7xl items-center justify-between px-6 py-6 sm:px-8 lg:px-10">
        <button
          type="button"
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className="flex items-center gap-3"
        >
          <img
            src="/Logo.svg"
            alt="FieldChat"
            className="h-9 w-9 object-contain"
          />

          <span className="text-lg font-semibold tracking-tight">
            FieldChat
          </span>
        </button>

        <button
          type="button"
          onClick={onLogin}
          className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2 text-sm font-medium text-zinc-200 transition hover:border-white/20 hover:bg-white/[0.07]"
        >
          Log in
        </button>
      </header>

      {/* Hero */}
      <section className="relative z-10 mx-auto flex min-h-[calc(100dvh-88px)] w-full max-w-7xl items-center px-6 py-16 sm:px-8 lg:px-10 lg:py-24">
        <div className="grid w-full items-center gap-16 lg:grid-cols-[1.1fr_0.9fr]">
          {/* Copy */}
          <div className="max-w-3xl">
            <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-indigo-400/20 bg-indigo-500/10 px-3.5 py-1.5 text-xs font-medium text-indigo-300">
              <span className="h-1.5 w-1.5 rounded-full bg-indigo-400 shadow-[0_0_10px_rgba(129,140,248,0.8)]" />
              Private team communication
            </div>

            <h1 className="text-5xl font-semibold leading-[1.02] tracking-[-0.04em] text-white sm:text-6xl lg:text-7xl">
              Conversations that
              <span className="block bg-gradient-to-r from-white via-zinc-200 to-indigo-300 bg-clip-text text-transparent">
                move your team forward.
              </span>
            </h1>

            <p className="mt-7 max-w-2xl text-base leading-7 text-zinc-400 sm:text-lg">
              FieldChat brings direct messages, group conversations and
              real-time collaboration into one focused workspace built for
              fast-moving teams.
            </p>

            {/* CTA */}
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={onLogin}
                className="group inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-white px-6 text-sm font-semibold text-zinc-950 shadow-[0_8px_30px_rgba(0,0,0,0.3)] transition hover:bg-zinc-100 active:scale-[0.98]"
              >
                Get started
                <ArrowRight
                  size={16}
                  className="transition-transform group-hover:translate-x-0.5"
                />
              </button>

              <button
                type="button"
                onClick={onLogin}
                className="inline-flex h-12 items-center justify-center rounded-xl border border-white/10 bg-white/[0.03] px-6 text-sm font-semibold text-zinc-200 transition hover:border-white/20 hover:bg-white/[0.07] active:scale-[0.98]"
              >
                Log in
              </button>
            </div>

            <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3 text-xs text-zinc-500">
              <span className="inline-flex items-center gap-2">
                <Lock size={13} />
                Private by design
              </span>

              <span className="inline-flex items-center gap-2">
                <MessageSquare size={13} />
                Real-time messaging
              </span>

              <span className="inline-flex items-center gap-2">
                <Users size={13} />
                Groups & direct messages
              </span>
            </div>
          </div>

          {/* Product preview */}
          <div className="relative mx-auto w-full max-w-[520px]">
            <div className="absolute -inset-8 rounded-[40px] bg-indigo-500/10 blur-3xl" />

            <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-[#121215]/90 shadow-[0_25px_80px_rgba(0,0,0,0.55)] backdrop-blur-xl">
              {/* Fake window header */}
              <div className="flex items-center gap-2 border-b border-white/[0.07] px-5 py-4">
                <span className="h-2.5 w-2.5 rounded-full bg-red-400/70" />
                <span className="h-2.5 w-2.5 rounded-full bg-yellow-400/70" />
                <span className="h-2.5 w-2.5 rounded-full bg-green-400/70" />

                <div className="ml-4 h-7 flex-1 rounded-lg bg-white/[0.04]" />
              </div>

              <div className="flex min-h-[420px]">
                {/* Fake sidebar */}
                <div className="hidden w-[34%] border-r border-white/[0.06] p-4 sm:block">
                  <div className="mb-5 flex items-center gap-2">
                    <img
                      src="/Logo.svg"
                      alt=""
                      className="h-6 w-6 object-contain"
                    />
                    <div className="h-3 w-20 rounded bg-white/10" />
                  </div>

                  <div className="space-y-2">
                    <div className="rounded-xl bg-indigo-500/15 p-3">
                      <div className="h-2.5 w-20 rounded bg-indigo-300/30" />
                      <div className="mt-2 h-2 w-14 rounded bg-white/10" />
                    </div>

                    <div className="p-3">
                      <div className="h-2.5 w-16 rounded bg-white/10" />
                      <div className="mt-2 h-2 w-12 rounded bg-white/5" />
                    </div>

                    <div className="p-3">
                      <div className="h-2.5 w-24 rounded bg-white/10" />
                      <div className="mt-2 h-2 w-16 rounded bg-white/5" />
                    </div>
                  </div>
                </div>

                {/* Fake chat */}
                <div className="flex flex-1 flex-col">
                  <div className="border-b border-white/[0.06] px-5 py-4">
                    <div className="h-3 w-28 rounded bg-white/15" />
                    <div className="mt-2 h-2 w-16 rounded bg-white/5" />
                  </div>

                  <div className="flex flex-1 flex-col justify-end gap-4 p-5">
                    <div className="flex items-end gap-2">
                      <div className="h-7 w-7 shrink-0 rounded-full bg-zinc-700" />
                      <div className="rounded-2xl rounded-bl-md bg-[#222226] px-4 py-3">
                        <div className="h-2 w-28 rounded bg-white/10" />
                        <div className="mt-2 h-2 w-20 rounded bg-white/5" />
                      </div>
                    </div>

                    <div className="flex justify-end">
                      <div className="rounded-2xl rounded-br-md bg-indigo-500 px-4 py-3">
                        <div className="h-2 w-32 rounded bg-white/30" />
                        <div className="mt-2 h-2 w-20 rounded bg-white/20" />
                      </div>
                    </div>

                    <div className="flex items-end gap-2">
                      <div className="h-7 w-7 shrink-0 rounded-full bg-zinc-700" />
                      <div className="rounded-2xl rounded-bl-md bg-[#222226] px-4 py-3">
                        <div className="h-2 w-36 rounded bg-white/10" />
                      </div>
                    </div>
                  </div>

                  <div className="p-4">
                    <div className="flex h-11 items-center rounded-xl border border-white/[0.08] bg-white/[0.03] px-4">
                      <div className="h-2 w-28 rounded bg-white/10" />
                      <div className="ml-auto h-7 w-7 rounded-lg bg-indigo-500/30" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Bottom fade */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-[#09090b] to-transparent" />
    </main>
  );
}
