interface Props {
  count: number;
  connected: boolean;
}

export default function LiveCount({ count, connected }: Props) {
  return (
    <div className="flex items-center gap-2 bg-zinc-800/60 rounded-lg px-3 py-1.5">
      <span
        className={`w-2 h-2 rounded-full ${
          connected ? "bg-emerald-400 animate-pulse" : "bg-zinc-500"
        }`}
      />
      <span className="text-sm font-mono text-white tabular-nums">
        {count}
      </span>
      <span className="text-xs text-zinc-400">
        {count === 1 ? "visitor" : "visitors"}
      </span>
    </div>
  );
}
