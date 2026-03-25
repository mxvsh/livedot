import type { ThemeColors } from "./useEmbedTheme";

interface Props {
  theme?: ThemeColors;
  variant?: "overlay" | "inline";
  size?: number;
}

const HREF = "https://livedot.dev?utm_source=embed&utm_medium=branding&utm_campaign=powered_by";

export default function BrandingBadge({ theme, variant = "overlay", size = 1 }: Props) {
  const bg = theme?.bg ?? "rgba(10, 10, 10, 0.78)";
  const border = theme?.border ?? "rgba(255, 255, 255, 0.12)";
  const text = theme?.text ?? "#fafafa";
  const brandingText = theme?.brandingText ?? "rgba(255, 255, 255, 0.72)";
  const brandingBg = theme?.brandingBg ?? "rgba(255, 255, 255, 0.06)";
  const brandingBorder = theme?.brandingBorder ?? "rgba(255, 255, 255, 0.08)";

  if (variant === "inline") {
    return (
      <a
        href={HREF}
        target="_blank"
        rel="noreferrer"
        aria-label="Powered by Livedot"
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 8 * size,
          padding: `0 ${10 * size}px`,
          height: 28 * size,
          borderRadius: 999,
          background: brandingBg,
          border: `1px solid ${brandingBorder}`,
          flexShrink: 0,
          textDecoration: "none",
        }}
      >
        <img
          src="/logo.svg"
          alt=""
          aria-hidden="true"
          style={{ width: 18 * size, height: 18 * size, borderRadius: 6 * size, display: "block" }}
        />
        <span style={{ fontSize: 11 * size, fontWeight: 600, color: brandingText, whiteSpace: "nowrap" }}>
          Powered by Livedot
        </span>
      </a>
    );
  }

  return (
    <a
      href={HREF}
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
      <span style={{ fontSize: 11, lineHeight: 1, color: brandingText }}>Powered by</span>
      <span style={{ fontSize: 12, lineHeight: 1, fontWeight: 700, letterSpacing: "-0.02em" }}> livedot</span>
    </a>
  );
}
