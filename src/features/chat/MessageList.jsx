import { Fragment, useLayoutEffect, useEffect, useRef, useState } from "react";
import { MessageRow } from "./MessageRow";
import { formatDayLabel } from "@/lib/format";
import { Skeleton } from "@/components/ui/skeleton";

// ─── Loading State ────────────────────────────────────────────────────────────
function MessagesSkeleton() {
  return (
    <div className="space-y-3 px-4 py-6">
      {[38, 60, 45, 70, 30, 55, 80].map((w, i) => (
        <div key={i} className={i % 3 === 2 ? "flex justify-end" : "flex gap-2"}>
          {i % 3 !== 2 && <Skeleton className="size-7 shrink-0 rounded-full mt-auto" />}
          <Skeleton
            className="h-9 rounded-2xl"
            style={{ width: `${w * 2.8}px`, maxWidth: "72%" }}
          />
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

  useLayoutEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    const isInitialLoad = prevLength.current === 0 && messages.length > 0;
    const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 200;
    const newMessages = messages.length > prevLength.current;

    if (isInitialLoad) {
      bottomRef.current?.scrollIntoView({ block: "end", behavior: "auto" });
    } else if (newMessages && !isFetchingNextPage) {
      const lastMessage = messages[messages.length - 1];
      const isMyNewMessage = lastMessage?.isMine || lastMessage?.senderId === meId;

      // Auto-scroll to bottom if already near bottom, OR if the user just sent a message
      if (atBottom || isMyNewMessage) {
        bottomRef.current?.scrollIntoView({ block: "end", behavior: "smooth" });
      }
    }
    
    prevLength.current = messages.length;
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
