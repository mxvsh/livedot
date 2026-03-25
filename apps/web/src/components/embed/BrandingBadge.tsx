import type { ThemeColors } from "./useEmbedTheme";

interface Props {
  theme?: ThemeColors;
}

export default function BrandingBadge({ theme }: Props) {
  const bg = theme?.bg ?? "rgba(10, 10, 10, 0.78)";
  const border = theme?.border ?? "rgba(255, 255, 255, 0.12)";
  const text = theme?.text ?? "#fafafa";
  const textSecondary = theme?.brandingText ?? "rgba(255, 255, 255, 0.72)";

  return (
    <a
      href="https://livedot.dev"
      target="_blank"
      rel="noreferrer"
      aria-label="Powered by Livedot"
      style={{
        position: "absolute",
        left: 12,
        bottom: 12,
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        padding: "7px 10px",
        borderRadius: 999,
        background: bg,
        border: `1px solid ${border}`,
        backdropFilter: "blur(12px)",
        color: text,
        textDecoration: "none",
        boxShadow: "none",
      }}
    >
      <img
        src="/logo.svg"
        alt=""
        aria-hidden="true"
        style={{ width: 18, height: 18, borderRadius: 5, flexShrink: 0 }}
      />
      <span style={{ fontSize: 11, lineHeight: 1, color: textSecondary }}>Powered by</span>
      <span style={{ fontSize: 12, lineHeight: 1, fontWeight: 700, letterSpacing: "-0.02em" }}>{" "}livedot</span>
    </a>
  );
}
