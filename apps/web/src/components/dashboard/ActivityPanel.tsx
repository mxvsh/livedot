import { motion, AnimatePresence } from "motion/react";
import type { VisitorSession, ActivityEvent } from "@livedot/shared";

function DiceBearAvatar({ sessionId, size = 32 }: { sessionId: string; size?: number }) {
  return (
    <img
      src={`https://api.dicebear.com/9.x/adventurer/svg?seed=${encodeURIComponent(sessionId)}&backgroundColor=111111`}
      width={size}
      height={size}
      className="rounded-full shrink-0"
      style={{ width: size, height: size }}
    />
  );
}

function timeAgo(timestamp: number): string {
  const diff = Math.max(0, Date.now() - timestamp);
  if (diff < 60_000) return `${Math.floor(diff / 1000)}s ago`;
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
  return `${Math.floor(diff / 3_600_000)}h ago`;
}

function trimUrl(url: string): string {
  try {
    const u = new URL(url);
    return u.pathname + (u.search || "");
  } catch {
    return url;
  }
}

interface EventRowProps {
  event: ActivityEvent;
}

function EventRow({ event }: EventRowProps) {
  const dot = {
    join: "bg-[#96E421]",
    navigate: "bg-blue-400",
    leave: "bg-zinc-500",
    event: "bg-amber-400",
  }[event.type];

  const label = (() => {
    switch (event.type) {
      case "join":
        return (
          <>
            <span className="text-muted">joined</span>
            {event.pageUrl && (
              <span className="text-foreground/70 font-mono ml-1 truncate">
                {trimUrl(event.pageUrl)}
              </span>
            )}
          </>
        );
      case "navigate":
        return (
          <>
            <span className="text-muted">navigated to</span>
            <span className="text-foreground/70 font-mono ml-1 truncate">
              {trimUrl(event.pageUrl)}
            </span>
          </>
        );
      case "leave":
        return <span className="text-muted">left</span>;
      case "event":
        return (
          <>
            <span className="text-muted">clicked</span>
            <span className="text-amber-400/90 ml-1 truncate">{event.eventName}</span>
          </>
        );
    }
  })();

  return (
    <div className="flex items-start gap-2 px-3 py-1.5">
      <div className={`w-1.5 h-1.5 rounded-full mt-1 shrink-0 ${dot}`} />
      <div className="flex-1 min-w-0 text-xs flex items-baseline gap-1 flex-wrap">
        {label}
      </div>
      <span className="text-[10px] text-muted/60 shrink-0 mt-0.5">{timeAgo(event.timestamp)}</span>
    </div>
  );
}

interface Props {
  session: VisitorSession;
  events: ActivityEvent[];
  onClose: () => void;
}

export default function ActivityPanel({ session, events, onClose }: Props) {
  const shortId = session.sessionId.slice(0, 8);

  return (
    <motion.div
      initial={{ y: 12, scale: 0.97 }}
      animate={{ y: 0, scale: 1 }}
      exit={{ y: 12, scale: 0.97 }}
      transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
      className="fixed bottom-10 left-3 z-50 md:bottom-12 md:left-4"
      style={{ width: 272, willChange: "transform" }}
    >
      <div className="rounded-2xl border border-white/[0.08] bg-white/[0.04] backdrop-blur-2xl shadow-[0_8px_32px_rgba(0,0,0,0.4)] overflow-hidden" style={{ backfaceVisibility: "hidden" }}>
        {/* Header */}
        <div className="flex items-center gap-2.5 px-3 py-2.5 border-b border-white/[0.06]">
          <DiceBearAvatar sessionId={session.sessionId} size={28} />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-mono text-foreground/90 leading-tight">{shortId}</p>
            <p className="text-[10px] text-muted truncate leading-tight mt-0.5">
              {session.pageUrl ? trimUrl(session.pageUrl) : "unknown page"}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-muted/60 hover:text-foreground transition-colors text-base leading-none p-1 -mr-0.5"
          >
            ×
          </button>
        </div>

        {/* Event feed */}
        <div className="max-h-52 overflow-y-auto">
          <AnimatePresence initial={false}>
            {events.length === 0 ? (
              <p className="text-xs text-muted/50 text-center py-5">No activity yet</p>
            ) : (
              <div className="py-1">
                {events.map((e, i) => (
                  <motion.div
                    key={`${e.type}-${e.timestamp}-${i}`}
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <EventRow event={e} />
                  </motion.div>
                ))}
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}
