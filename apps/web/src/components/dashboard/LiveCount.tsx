import { Surface } from "@heroui/react";

interface Props {
  count: number;
  connected: boolean;
}

export default function LiveCount({ count, connected }: Props) {
  return (
    <Surface
      className="flex items-center gap-2 rounded-xl px-3 py-1.5"
      variant="default"
    >
      <span
        className={`w-2 h-2 rounded-full ${
          connected ? "bg-[#96E421] animate-pulse" : "bg-muted"
        }`}
      />
      <span className="text-sm font-mono text-foreground tabular-nums">
        {count}
      </span>
      <span className="text-xs text-muted">
        {count === 1 ? "visitor" : "visitors"}
      </span>
    </Surface>
  );
}
