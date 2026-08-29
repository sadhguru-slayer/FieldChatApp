import { ArrowRight, Lock, MessageSquare, Users } from "lucide-react";

export function LandingPage({ onLogin }) {
  return (
    <main className="relative min-h-[100dvh] overflow-hidden bg-[var(--color-background)] text-[var(--color-foreground)]">
      {/* Ambient background */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 overflow-hidden"
      >
        <div className="absolute left-1/2 top-[-300px] h-[620px] w-[850px] -translate-x-1/2 rounded-full bg-[var(--color-accent)]/[0.045] blur-[130px]" />
        <div className="absolute bottom-[-260px] left-[-180px] h-[500px] w-[500px] rounded-full bg-[var(--color-accent)]/[0.025] blur-[120px]" />

        <div
          className="absolute inset-0 opacity-[0.014]"
          style={{
            backgroundImage:
              "linear-gradient(var(--color-foreground) 1px, transparent 1px), linear-gradient(90deg, var(--color-foreground) 1px, transparent 1px)",
            backgroundSize: "72px 72px",
          }}
        />
      </div>

      {/* Navigation */}
      <header className="relative z-10 mx-auto flex w-full max-w-7xl items-center justify-between px-6 py-6 sm:px-8 lg:px-10">
        <button
          type="button"
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className="group flex items-center gap-3"
        >
          <div className="relative">
            <div className="absolute -inset-1 rounded-full bg-[var(--color-accent)]/20 opacity-0 blur-md transition-opacity group-hover:opacity-100" />

            <img
              src="/Logo.svg"
              alt="FieldChat"
              className="relative h-9 w-9 rounded-full object-cover ring-1 ring-[var(--color-border)]"
            />
          </div>

          <span className="text-[17px] font-semibold tracking-[-0.02em]">
            FieldChat
          </span>
        </button>

        <button
          type="button"
          onClick={onLogin}
          className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2 text-sm font-medium text-[var(--color-foreground)] transition-all hover:border-[var(--color-input)] hover:bg-[var(--color-elevated)] active:scale-[0.98]"
        >
          Log in
        </button>
      </header>

      {/* Hero */}
      <section className="relative z-10 mx-auto flex min-h-[calc(100dvh-88px)] w-full max-w-7xl items-center px-6 py-16 sm:px-8 lg:px-10 lg:py-20">
        <div className="grid w-full items-center gap-16 lg:grid-cols-[0.92fr_1.08fr]">
          {/* Copy */}
          <div className="max-w-2xl">
            {/* Badge */}
            <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-3.5 py-1.5 text-[11px] font-medium text-[var(--color-muted-foreground)] shadow-sm">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[var(--color-success)] opacity-40" />
                <span className="relative h-1.5 w-1.5 rounded-full bg-[var(--color-success)]" />
              </span>
              PRIVATE TEAM COMMUNICATION
            </div>

            {/* Heading */}
            <h1 className="text-[3.35rem] font-semibold leading-[0.98] tracking-[-0.055em] sm:text-[4.4rem] lg:text-[5rem]">
              Your team,
              <span className="block text-[var(--color-muted-foreground)]">
                always in the conversation.
              </span>
            </h1>

            <p className="mt-7 max-w-xl text-[15px] leading-7 text-[var(--color-muted-foreground)] sm:text-[17px]">
              FieldChat brings direct messages, group conversations, and
              real-time collaboration into one focused workspace built for
              fast-moving teams.
            </p>

            {/* CTA */}
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={onLogin}
                className="group inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-[var(--color-primary)] px-6 text-sm font-semibold text-[var(--color-primary-foreground)] shadow-[var(--shadow-soft)] transition-all duration-200 hover:-translate-y-0.5 hover:opacity-90 active:translate-y-0"
              >
                Get started

                <ArrowRight
                  size={16}
                  className="transition-transform duration-200 group-hover:translate-x-0.5"
                />
              </button>

              <button
                type="button"
                onClick={onLogin}
                className="inline-flex h-12 items-center justify-center rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-6 text-sm font-semibold text-[var(--color-foreground)] transition-all duration-200 hover:-translate-y-0.5 hover:border-[var(--color-input)] hover:bg-[var(--color-elevated)] active:translate-y-0"
              >
                Log in
              </button>
            </div>

            {/* Product traits */}
            <div className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-3 text-[11px] font-medium text-[var(--color-muted-foreground)]">
              <span className="inline-flex items-center gap-2">
                <Lock size={13} />
                Private by design
              </span>

              <span className="hidden h-3 w-px bg-[var(--color-border)] sm:block" />

              <span className="inline-flex items-center gap-2">
                <MessageSquare size={13} />
                Real-time messaging
              </span>

              <span className="hidden h-3 w-px bg-[var(--color-border)] sm:block" />

              <span className="inline-flex items-center gap-2">
                <Users size={13} />
                Groups & direct messages
              </span>
            </div>
          </div>

          {/* Chat skeleton */}
          <div className="relative mx-auto w-full max-w-[620px]">
            {/* Product glow */}
            <div className="absolute -inset-10 rounded-[50px] bg-[var(--color-accent)]/[0.04] blur-[70px]" />

            {/* Window */}
            <div className="relative overflow-hidden rounded-[24px] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[0_30px_90px_rgba(0,0,0,0.45)]">
              {/* Window chrome */}
              <div className="flex h-12 items-center gap-2 border-b border-[var(--color-border)] bg-[var(--color-sidebar)] px-4">
                <span className="h-2.5 w-2.5 rounded-full bg-red-400/60" />
                <span className="h-2.5 w-2.5 rounded-full bg-yellow-400/60" />
                <span className="h-2.5 w-2.5 rounded-full bg-green-400/60" />

                <div className="ml-4 h-6 flex-1 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)]" />
              </div>

              <div className="flex min-h-[420px]">
                {/* Sidebar */}
                <div className="hidden w-[35%] shrink-0 border-r border-[var(--color-border)] bg-[var(--color-sidebar)] p-4 sm:block">
                  {/* Workspace */}
                  <div className="mb-6 flex items-center gap-2.5">
                    <img
                      src="/Logo.svg"
                      alt=""
                      className="h-6 w-6 rounded-full object-cover ring-1 ring-[var(--color-border)]"
                    />

                    <div className="h-2.5 w-20 rounded-full bg-[var(--color-foreground)]/10" />
                  </div>

                  {/* Sidebar heading */}
                  <div className="mb-3 flex items-center justify-between px-1">
                    <div className="h-2 w-14 rounded-full bg-[var(--color-muted-foreground)]/20" />
                    <div className="h-3 w-3 rounded bg-[var(--color-muted-foreground)]/10" />
                  </div>

                  {/* Channel skeletons */}
                  <div className="space-y-1.5">
                    <div className="rounded-lg border border-[var(--color-accent)]/10 bg-[var(--color-accent)]/[0.08] px-3 py-2.5">
                      <div className="h-2.5 w-20 rounded-full bg-[var(--color-accent)]/30" />
                    </div>

                    <div className="px-3 py-2.5">
                      <div className="h-2.5 w-16 rounded-full bg-[var(--color-muted-foreground)]/15" />
                    </div>

                    <div className="px-3 py-2.5">
                      <div className="h-2.5 w-24 rounded-full bg-[var(--color-muted-foreground)]/15" />
                    </div>
                  </div>

                  {/* DMs */}
                  <div className="mb-3 mt-6 flex items-center justify-between px-1">
                    <div className="h-2 w-20 rounded-full bg-[var(--color-muted-foreground)]/20" />
                    <div className="h-3 w-3 rounded bg-[var(--color-muted-foreground)]/10" />
                  </div>

                  <div className="space-y-2.5">
                    <div className="flex items-center gap-2.5 px-2">
                      <div className="relative">
                        <div className="h-6 w-6 rounded-full bg-[var(--color-secondary)]" />
                        <span className="absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full border-2 border-[var(--color-sidebar)] bg-[var(--color-success)]" />
                      </div>

                      <div className="h-2.5 w-20 rounded-full bg-[var(--color-muted-foreground)]/12" />
                    </div>

                    <div className="flex items-center gap-2.5 px-2">
                      <div className="relative">
                        <div className="h-6 w-6 rounded-full bg-[var(--color-secondary)]" />
                        <span className="absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full border-2 border-[var(--color-sidebar)] bg-[var(--color-success)]" />
                      </div>

                      <div className="h-2.5 w-16 rounded-full bg-[var(--color-muted-foreground)]/10" />
                    </div>

                    <div className="flex items-center gap-2.5 px-2">
                      <div className="h-6 w-6 rounded-full bg-[var(--color-secondary)]" />
                      <div className="h-2.5 w-24 rounded-full bg-[var(--color-muted-foreground)]/10" />
                    </div>
                  </div>
                </div>

                {/* Conversation */}
                <div className="flex min-w-0 flex-1 flex-col">
                  {/* Conversation header */}
                  <div className="flex h-14 items-center justify-between border-b border-[var(--color-border)] px-5">
                    <div>
                      <div className="h-3 w-24 rounded-full bg-[var(--color-foreground)]/15" />
                      <div className="mt-2 h-2 w-16 rounded-full bg-[var(--color-muted-foreground)]/10" />
                    </div>

                    <div className="flex -space-x-1.5">
                      <div className="h-6 w-6 rounded-full border-2 border-[var(--color-surface)] bg-[var(--color-secondary)]" />
                      <div className="h-6 w-6 rounded-full border-2 border-[var(--color-surface)] bg-[var(--color-secondary)]" />
                      <div className="h-6 w-6 rounded-full border-2 border-[var(--color-surface)] bg-[var(--color-secondary)]" />
                    </div>
                  </div>

                  {/* Messages */}
                  <div className="flex flex-1 flex-col justify-end gap-5 p-5">
                    {/* Incoming message */}
                    <div className="flex items-end gap-2.5">
                      <div className="h-7 w-7 shrink-0 rounded-full bg-[var(--color-secondary)]" />

                      <div className="rounded-2xl rounded-bl-md bg-[var(--color-bubble-in)] px-4 py-3">
                        <div className="h-2 w-28 rounded-full bg-[var(--color-bubble-in-foreground)]/10" />
                        <div className="mt-2 h-2 w-20 rounded-full bg-[var(--color-bubble-in-foreground)]/5" />
                      </div>
                    </div>

                    {/* Outgoing message */}
                    <div className="flex justify-end">
                      <div className="rounded-2xl rounded-br-md bg-[var(--color-bubble-out)] px-4 py-3 shadow-sm">
                        <div className="h-2 w-32 rounded-full bg-[var(--color-bubble-out-foreground)]/30" />
                        <div className="mt-2 h-2 w-20 rounded-full bg-[var(--color-bubble-out-foreground)]/20" />
                      </div>
                    </div>

                    {/* Incoming message */}
                    <div className="flex items-end gap-2.5">
                      <div className="h-7 w-7 shrink-0 rounded-full bg-[var(--color-secondary)]" />

                      <div className="rounded-2xl rounded-bl-md bg-[var(--color-bubble-in)] px-4 py-3">
                        <div className="h-2 w-36 rounded-full bg-[var(--color-bubble-in-foreground)]/10" />
                      </div>
                    </div>

                    {/* Short outgoing message */}
                    <div className="flex justify-end">
                      <div className="rounded-2xl rounded-br-md bg-[var(--color-bubble-out)] px-4 py-3">
                        <div className="h-2 w-24 rounded-full bg-[var(--color-bubble-out-foreground)]/25" />
                      </div>
                    </div>
                  </div>

                  {/* Composer */}
                  <div className="p-4">
                    <div className="flex h-11 items-center rounded-xl border border-[var(--color-input)] bg-[var(--color-card)] px-4 shadow-inner">
                      <div className="h-2 w-28 rounded-full bg-[var(--color-muted-foreground)]/10" />

                      <div className="ml-auto h-7 w-7 rounded-lg bg-[var(--color-accent)]/15" />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Floating presence */}
            <div className="absolute -bottom-5 -left-4 hidden items-center gap-2.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3.5 py-2.5 shadow-[var(--shadow-soft)] sm:flex">
              <span className="h-2 w-2 rounded-full bg-[var(--color-success)] shadow-[0_0_8px_rgba(16,185,129,0.45)]" />

              <div className="h-2 w-20 rounded-full bg-[var(--color-muted-foreground)]/15" />
            </div>
          </div>
        </div>
      </section>

      {/* Bottom fade */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-[var(--color-background)] to-transparent" />
    </main>
  );
}
