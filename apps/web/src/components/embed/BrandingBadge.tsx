export default function BrandingBadge() {
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
        background: "rgba(10, 10, 10, 0.78)",
        border: "1px solid rgba(255, 255, 255, 0.12)",
        backdropFilter: "blur(12px)",
        color: "#fafafa",
        textDecoration: "none",
        boxShadow: "0 10px 30px rgba(0, 0, 0, 0.28)",
      }}
    >
      <img
        src="/logo.svg"
        alt=""
        aria-hidden="true"
        style={{ width: 18, height: 18, borderRadius: 5, flexShrink: 0 }}
      />
      <span style={{ fontSize: 11, lineHeight: 1, color: "rgba(255, 255, 255, 0.72)" }}>Powered by</span>
      <span style={{ fontSize: 12, lineHeight: 1, fontWeight: 700, letterSpacing: "-0.02em" }}>livedot</span>
    </a>
  );
}
