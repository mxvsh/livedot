import { useWebSocket } from "@/hooks/useWebSocket";

interface Props {
  websiteId: string;
}

export default function WebsiteLiveCount({ websiteId }: Props) {
  const { count, connected } = useWebSocket(websiteId);

  return (
    <div className="flex items-center gap-1.5">
      <span
        className={`w-1.5 h-1.5 rounded-full ${
          connected ? "bg-success animate-pulse" : "bg-muted"
        }`}
      />
      <span className="text-xs font-mono text-muted tabular-nums">
        {count}
      </span>
    </div>
  );
}
