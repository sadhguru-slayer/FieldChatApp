import {
  ArrowRight,
  Hash,
  Lock,
  MessageSquare,
  MoreHorizontal,
  Plus,
  Search,
  Send,
  Settings,
  Users,
} from "lucide-react";

export function LandingPage({ onLogin }) {
  return (
    <main className="relative min-h-[100dvh] overflow-hidden bg-[var(--color-background)] text-[var(--color-foreground)]">
      {/* Ambient background */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 overflow-hidden"
      >
        <div className="absolute left-1/2 top-[-320px] h-[650px] w-[900px] -translate-x-1/2 rounded-full bg-[var(--color-accent)]/[0.045] blur-[140px]" />
        <div className="absolute bottom-[-300px] left-[-200px] h-[550px] w-[550px] rounded-full bg-[var(--color-accent)]/[0.025] blur-[130px]" />

        <div
          className="absolute inset-0 opacity-[0.018]"
          style={{
            backgroundImage:
              "linear-gradient(var(--color-foreground) 1px, transparent 1px), linear-gradient(90deg, var(--color-foreground) 1px, transparent 1px)",
            backgroundSize: "72px 72px",
          }}
        />
      </div>

      {/* Navigation */}
      <header className="relative z-20 mx-auto flex w-full max-w-7xl items-center justify-between px-6 py-5 sm:px-8 lg:px-10">
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

        <nav className="hidden items-center gap-8 text-sm text-[var(--color-muted-foreground)] md:flex">
          <a
            href="#features"
            className="transition-colors hover:text-[var(--color-foreground)]"
          >
            Features
          </a>

          <a
            href="#security"
            className="transition-colors hover:text-[var(--color-foreground)]"
          >
            Security
          </a>
        </nav>

        <button
          type="button"
          onClick={onLogin}
          className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2 text-sm font-medium text-[var(--color-foreground)] shadow-sm transition-all hover:border-[var(--color-input)] hover:bg-[var(--color-elevated)] active:scale-[0.98]"
        >
          Log in
        </button>
      </header>

      {/* Hero */}
      <section className="relative z-10 mx-auto flex w-full max-w-7xl items-center px-6 pb-20 pt-14 sm:px-8 lg:min-h-[calc(100dvh-76px)] lg:px-10 lg:py-16">
        <div className="grid w-full items-center gap-14 lg:grid-cols-[0.85fr_1.15fr] lg:gap-16">
          {/* Hero copy */}
          <div className="max-w-xl">
            {/* Eyebrow */}
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-1.5 text-[11px] font-medium text-[var(--color-muted-foreground)] shadow-sm">
              <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-success)] shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
              Private team communication
            </div>

            <h1 className="text-[3.2rem] font-semibold leading-[0.98] tracking-[-0.055em] sm:text-[4.2rem] lg:text-[4.7rem]">
              Your team,
              <span className="block text-[var(--color-muted-foreground)]">
                always in the conversation.
              </span>
            </h1>

            <p className="mt-7 max-w-lg text-[15px] leading-7 text-[var(--color-muted-foreground)] sm:text-base">
              FieldChat keeps your team connected with focused conversations,
              direct messages, and groups — all in one private workspace.
            </p>

            {/* Actions */}
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={onLogin}
                className="group inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[var(--color-primary)] px-5 text-sm font-semibold text-[var(--color-primary-foreground)] shadow-[var(--shadow-soft)] transition-all hover:-translate-y-0.5 hover:opacity-90 active:translate-y-0"
              >
                Start chatting
                <ArrowRight
                  size={16}
                  className="transition-transform group-hover:translate-x-0.5"
                />
              </button>

              <button
                type="button"
                onClick={onLogin}
                className="inline-flex h-11 items-center justify-center rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-5 text-sm font-semibold text-[var(--color-foreground)] transition-all hover:border-[var(--color-input)] hover:bg-[var(--color-elevated)] active:scale-[0.98]"
              >
                Log in
              </button>
            </div>

            {/* Trust points */}
            <div className="mt-7 flex flex-wrap gap-x-5 gap-y-3 text-[11px] font-medium text-[var(--color-muted-foreground)]">
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
                Groups & DMs
              </span>
            </div>
          </div>

          {/* Chat application preview */}
          <div className="relative mx-auto w-full max-w-[700px]">
            {/* Product glow */}
            <div className="absolute -inset-8 rounded-[40px] bg-[var(--color-accent)]/[0.045] blur-[70px]" />

            {/* App shell */}
            <div className="relative overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[0_30px_90px_rgba(0,0,0,0.45)]">
              {/* App top bar */}
              <div className="flex h-12 items-center border-b border-[var(--color-border)] bg-[var(--color-sidebar)] px-4">
                <div className="flex items-center gap-2.5">
                  <img
                    src="/Logo.svg"
                    alt=""
                    className="h-6 w-6 rounded-full object-cover ring-1 ring-[var(--color-border)]"
                  />

                  <span className="text-xs font-semibold">
                    FieldChat
                  </span>
                </div>

                <div className="mx-auto hidden h-7 w-64 items-center rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 sm:flex">
                  <Search
                    size={12}
                    className="text-[var(--color-muted-foreground)]"
                  />
                  <span className="ml-2 text-[10px] text-[var(--color-muted-foreground)]">
                    Search messages
                  </span>
                </div>

                <button className="ml-auto rounded-lg p-1.5 text-[var(--color-muted-foreground)]">
                  <Settings size={15} />
                </button>
              </div>

              <div className="flex h-[430px]">
                {/* Workspace sidebar */}
                <aside className="hidden w-[190px] shrink-0 border-r border-[var(--color-border)] bg-[var(--color-sidebar)] p-3 sm:block">
                  {/* Workspace */}
                  <div className="mb-5 flex items-center justify-between px-1">
                    <span className="text-[11px] font-semibold">
                      Acme Team
                    </span>

                    <MoreHorizontal
                      size={14}
                      className="text-[var(--color-muted-foreground)]"
                    />
                  </div>

                  {/* Channels */}
                  <div className="mb-5">
                    <div className="mb-2 flex items-center justify-between px-1 text-[9px] font-semibold uppercase tracking-wider text-[var(--color-muted-foreground)]">
                      <span>Channels</span>
                      <Plus size={12} />
                    </div>

                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2 rounded-md bg-[var(--color-accent)]/10 px-2.5 py-2 text-[11px] font-medium text-[var(--color-foreground)]">
                        <Hash size={13} className="text-[var(--color-accent)]" />
                        general
                      </div>

                      <div className="flex items-center gap-2 rounded-md px-2.5 py-2 text-[11px] text-[var(--color-muted-foreground)]">
                        <Hash size={13} />
                        product
                      </div>

                      <div className="flex items-center gap-2 rounded-md px-2.5 py-2 text-[11px] text-[var(--color-muted-foreground)]">
                        <Hash size={13} />
                        design
                      </div>
                    </div>
                  </div>

                  {/* Direct messages */}
                  <div>
                    <div className="mb-2 flex items-center justify-between px-1 text-[9px] font-semibold uppercase tracking-wider text-[var(--color-muted-foreground)]">
                      <span>Direct messages</span>
                      <Plus size={12} />
                    </div>

                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2 rounded-md px-2.5 py-2 text-[11px] text-[var(--color-muted-foreground)]">
                        <span className="relative">
                          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[var(--color-secondary)] text-[8px] font-semibold">
                            AS
                          </span>
                          <span className="absolute -bottom-0.5 -right-0.5 h-1.5 w-1.5 rounded-full bg-[var(--color-success)] ring-2 ring-[var(--color-sidebar)]" />
                        </span>
                        Alex Smith
                      </div>

                      <div className="flex items-center gap-2 rounded-md px-2.5 py-2 text-[11px] text-[var(--color-muted-foreground)]">
                        <span className="relative">
                          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[var(--color-secondary)] text-[8px] font-semibold">
                            JD
                          </span>
                          <span className="absolute -bottom-0.5 -right-0.5 h-1.5 w-1.5 rounded-full bg-[var(--color-success)] ring-2 ring-[var(--color-sidebar)]" />
                        </span>
                        Jordan Davis
                      </div>
                    </div>
                  </div>
                </aside>

                {/* Conversation */}
                <div className="flex min-w-0 flex-1 flex-col">
                  {/* Conversation header */}
                  <div className="flex h-14 items-center justify-between border-b border-[var(--color-border)] px-5">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <Hash
                          size={14}
                          className="text-[var(--color-muted-foreground)]"
                        />
                        <span className="text-sm font-semibold">
                          general
                        </span>
                      </div>

                      <p className="mt-0.5 text-[9px] text-[var(--color-muted-foreground)]">
                        Team-wide conversation
                      </p>
                    </div>

                    <div className="flex -space-x-1.5">
                      <span className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-[var(--color-surface)] bg-zinc-700 text-[7px]">
                        AS
                      </span>
                      <span className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-[var(--color-surface)] bg-zinc-600 text-[7px]">
                        JD
                      </span>
                      <span className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-[var(--color-surface)] bg-zinc-500 text-[7px]">
                        MK
                      </span>
                    </div>
                  </div>

                  {/* Messages */}
                  <div className="flex flex-1 flex-col justify-end gap-5 overflow-hidden px-5 py-5">
                    {/* Message 1 */}
                    <div className="flex gap-3">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--color-secondary)] text-[9px] font-semibold">
                        AS
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-baseline gap-2">
                          <span className="text-[11px] font-semibold">
                            Alex Smith
                          </span>
                          <span className="text-[9px] text-[var(--color-muted-foreground)]">
                            10:42 AM
                          </span>
                        </div>

                        <div className="mt-1.5 max-w-[320px] rounded-2xl rounded-tl-md bg-[var(--color-bubble-in)] px-3.5 py-2.5 text-[11px] leading-5 text-[var(--color-bubble-in-foreground)]">
                          Hey team! Are we ready for today's launch?
                        </div>
                      </div>
                    </div>

                    {/* Message 2 */}
                    <div className="flex justify-end">
                      <div className="max-w-[320px]">
                        <div className="mb-1.5 flex justify-end text-[9px] text-[var(--color-muted-foreground)]">
                          You · 10:43 AM
                        </div>

                        <div className="rounded-2xl rounded-tr-md bg-[var(--color-bubble-out)] px-3.5 py-2.5 text-[11px] leading-5 text-[var(--color-bubble-out-foreground)] shadow-sm">
                          Almost! Just finishing the final review. 🚀
                        </div>

                        <div className="mt-1.5 flex justify-end">
                          <span className="rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-1.5 py-0.5 text-[8px] text-[var(--color-muted-foreground)]">
                            ✓✓
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Message 3 */}
                    <div className="flex gap-3">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--color-secondary)] text-[9px] font-semibold">
                        JD
                      </div>

                      <div>
                        <div className="flex items-baseline gap-2">
                          <span className="text-[11px] font-semibold">
                            Jordan Davis
                          </span>
                          <span className="text-[9px] text-[var(--color-muted-foreground)]">
                            10:44 AM
                          </span>
                        </div>

                        <div className="mt-1.5 max-w-[320px] rounded-2xl rounded-tl-md bg-[var(--color-bubble-in)] px-3.5 py-2.5 text-[11px] leading-5 text-[var(--color-bubble-in-foreground)]">
                          Perfect. I'll keep an eye on things from here.
                        </div>

                        <div className="mt-1.5 inline-flex rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-1.5 py-0.5 text-[8px]">
                          👍 2
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Typing */}
                  <div className="px-5 pb-2 text-[9px] text-[var(--color-muted-foreground)]">
                    Alex is typing...
                  </div>

                  {/* Composer */}
                  <div className="px-4 pb-4">
                    <div className="flex h-10 items-center gap-3 rounded-xl border border-[var(--color-input)] bg-[var(--color-card)] px-3 shadow-inner">
                      <Plus
                        size={15}
                        className="text-[var(--color-muted-foreground)]"
                      />

                      <span className="flex-1 text-[10px] text-[var(--color-muted-foreground)]">
                        Message #general
                      </span>

                      <Send
                        size={14}
                        className="text-[var(--color-accent)]"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Floating presence card */}
            <div className="absolute -bottom-5 -left-4 hidden items-center gap-2.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 shadow-[var(--shadow-soft)] sm:flex">
              <span className="h-2 w-2 rounded-full bg-[var(--color-success)] shadow-[0_0_8px_rgba(16,185,129,0.45)]" />

              <span className="text-[10px] font-medium text-[var(--color-muted-foreground)]">
                3 teammates online
              </span>
            </div>

            {/* Floating notification */}
            <div className="absolute -right-3 -top-4 hidden items-center gap-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 shadow-[var(--shadow-soft)] sm:flex">
              <MessageSquare
                size={13}
                className="text-[var(--color-accent)]"
              />

              <span className="text-[10px] font-medium">
                New message
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Bottom fade */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-[var(--color-background)] to-transparent" />
    </main>
  );
}
