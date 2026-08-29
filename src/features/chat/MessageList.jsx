import { Fragment, useLayoutEffect, useEffect, useRef, useState } from "react";
import { MessageRow } from "./MessageRow";
import { formatDayLabel } from "@/lib/format";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

// ─── Loading State ────────────────────────────────────────────────────────────
function MessagesSkeleton() {
  const SKELETON_ITEMS = [
    { type: "incoming", width: "52%", height: "h-10", avatar: true },
    { type: "incoming", width: "68%", height: "h-14", avatar: false },
    { type: "outgoing", width: "42%", height: "h-10", avatar: false },
    { type: "incoming", width: "58%", height: "h-10", avatar: true },
    { type: "outgoing", width: "64%", height: "h-14", avatar: false },
    { type: "incoming", width: "38%", height: "h-9", avatar: true },
    { type: "outgoing", width: "48%", height: "h-10", avatar: false },
  ];

  return (
    <div className="flex-1 space-y-3.5 px-4 py-6 overflow-hidden fc-fade-in flex flex-col justify-end">
      {SKELETON_ITEMS.map((item, i) => (
        <div
          key={i}
          className={cn(
            "flex items-end gap-2.5",
            item.type === "outgoing" ? "justify-end" : "justify-start"
          )}
        >
          {item.type === "incoming" && (
            <div className="size-7 shrink-0">
              {item.avatar && <Skeleton className="size-7 rounded-full bg-elevated/80" />}
            </div>
          )}

          <div
            className={cn(
              "rounded-2xl p-3 space-y-2 border border-border/20 shadow-2xs",
              item.type === "outgoing"
                ? "bg-accent/15 border-accent/20 rounded-br-xs"
                : "bg-surface/60 rounded-bl-xs"
            )}
            style={{ width: item.width, maxWidth: "75%" }}
          >
            <Skeleton className={cn("rounded-lg bg-elevated/70", item.height === "h-14" ? "h-3.5 w-full" : "h-3.5 w-3/4")} />
            {item.height === "h-14" && (
              <Skeleton className="h-3 w-1/2 rounded-lg bg-elevated/50" />
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Day Divider ──────────────────────────────────────────────────────────────
function DayDivider({ label }) {
  return (
    <div className="my-4 flex items-center justify-center">
      <span className="rounded-full bg-elevated/80 px-3 py-0.5 text-[11px] font-medium text-muted-foreground border border-border/40 backdrop-blur-sm shadow-xs">
        {label}
      </span>
    </div>
  );
}

// ─── Empty State ──────────────────────────────────────────────────────────────
function EmptyState({ isGroup }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-2 select-none">
      <span className="text-4xl opacity-20">💬</span>
      <p className="text-xs font-semibold text-foreground/70">No messages yet</p>
      <p className="text-[11px] text-muted-foreground">
        {isGroup ? "Say something to kick things off!" : "Send a message to start the conversation."}
      </p>
    </div>
  );
}

// ─── Main MessageList ─────────────────────────────────────────────────────────
const SAME_SENDER_GAP_MS = 5 * 60 * 1000; // 5 minutes

export function MessageList({
  messages = [],
  loading = false,
  meId,
  isGroup,
  fetchNextPage,
  hasNextPage,
  isFetchingNextPage,
  onReply,
  onOpenActions,
  onReact,
  onOpenReactionsDetail,
}) {
  const scrollRef = useRef(null);
  const bottomRef = useRef(null);
  const topRef = useRef(null);
  const prevLength = useRef(0);
  const isFetchingRef = useRef(isFetchingNextPage);

  useEffect(() => {
    isFetchingRef.current = isFetchingNextPage;
  }, [isFetchingNextPage]);

  // Single active action state across all messages
  const [activeActionMsgId, setActiveActionMsgId] = useState(null);
  const inactivityTimerRef = useRef(null);

  const handleToggleAction = (msgId) => {
    if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);

    if (activeActionMsgId === msgId) {
      setActiveActionMsgId(null);
    } else {
      setActiveActionMsgId(msgId);
      // Auto-clear active action highlight after 4.5 seconds of inactivity
      inactivityTimerRef.current = setTimeout(() => {
        setActiveActionMsgId(null);
      }, 4500);
    }
  };

  const prevLastMsgId = useRef(null);

  useLayoutEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    const isInitialLoad = prevLength.current === 0 && messages.length > 0;
    const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 200;
    const newMessages = messages.length > prevLength.current;
    
    const lastMessage = messages.length > 0 ? messages[messages.length - 1] : null;
    const addedAtBottom = lastMessage && lastMessage.id !== prevLastMsgId.current;

    if (isInitialLoad) {
      bottomRef.current?.scrollIntoView({ block: "end", behavior: "auto" });
    } else if (newMessages && addedAtBottom) {
      const isMyNewMessage = lastMessage?.isMine || lastMessage?.senderId === meId;
      // Auto-scroll to bottom if already near bottom, OR if the user just sent a message
      if (atBottom || isMyNewMessage) {
        bottomRef.current?.scrollIntoView({ block: "end", behavior: "smooth" });
      }
    }
    
    prevLength.current = messages.length;
    prevLastMsgId.current = lastMessage?.id || null;
  }, [messages.length, messages, isFetchingNextPage]);

  // Observer for top element to fetch next page
  useEffect(() => {
    if (!hasNextPage || !topRef.current) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingRef.current) {
          fetchNextPage();
        }
      },
      { root: scrollRef.current, rootMargin: "200px" }
    );
    observer.observe(topRef.current);
    return () => observer.disconnect();
  }, [hasNextPage, fetchNextPage]);

  const jumpTo = (id) => {
    const el = document.getElementById(`msg-${id}`);
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "center" });
    el.style.transition = "background 0.15s";
    el.style.background = "rgba(255,255,255,0.06)";
    setTimeout(() => (el.style.background = ""), 700);
  };

  if (loading) return <MessagesSkeleton />;
  if (!messages.length) return <EmptyState isGroup={isGroup} />;

  let lastDay = null;

  return (
    <div
      ref={scrollRef}
      onClick={() => setActiveActionMsgId(null)}
      className="scroll-slim flex-1 overflow-y-auto py-1"
      style={{ overscrollBehavior: "contain" }}
    >
      {/* Invisible element at the top to trigger infinite loading */}
      <div ref={topRef} className="h-1 w-full shrink-0" />

      {/* A small header padding */}
      <div className="h-2" />
      
      {isFetchingNextPage && (
        <div className="flex justify-center py-2">
          <span className="text-[10px] text-muted-foreground animate-pulse">Loading older messages...</span>
        </div>
      )}

      {messages.map((m, i) => {
        const day = formatDayLabel(m.createdAt);
        const showDay = day !== lastDay;
        lastDay = day;

        // Sender grouping logic
        const prev = messages[i - 1];
        const next = messages[i + 1];

        const prevSameGroup =
          prev &&
          prev.senderId === m.senderId &&
          prev.deletedForEveryone === false &&
          !showDay &&
          new Date(m.createdAt) - new Date(prev.createdAt) < SAME_SENDER_GAP_MS;

        const nextSameGroup =
          next &&
          next.senderId === m.senderId &&
          !formatDayLabel(next.createdAt) !== day &&
          new Date(next.createdAt) - new Date(m.createdAt) < SAME_SENDER_GAP_MS;

        const showAvatar = !nextSameGroup;
        const showName = !prevSameGroup;
        const mine = m.isMine || m.senderId === meId;

        return (
          <Fragment key={m.id || i}>
            {showDay && <DayDivider label={day} />}
            <div className={prevSameGroup ? "mt-px" : "mt-2"}>
              <MessageRow
                message={m}
                mine={mine}
                isGroup={isGroup}
                showAvatar={showAvatar}
                showName={showName}
                isActionActive={activeActionMsgId === m.id}
                onToggleAction={handleToggleAction}
                onReply={onReply}
                onOpenActions={onOpenActions}
                onReact={onReact}
                onOpenReactionsDetail={onOpenReactionsDetail}
                onJumpTo={jumpTo}
              />
            </div>
          </Fragment>
        );
      })}

      <div ref={bottomRef} className="h-4" />
    </div>
  );
}
