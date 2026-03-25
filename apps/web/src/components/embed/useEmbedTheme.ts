import { useEffect, useState } from "react";

export type EmbedTheme = "dark" | "light" | "system";
export type ResolvedTheme = "dark" | "light";

export interface ThemeColors {
  bg: string;
  border: string;
  text: string;
  textSecondary: string;
  textMuted: string;
  brandingBg: string;
  brandingBorder: string;
  brandingText: string;
}

const DARK: ThemeColors = {
  bg: "rgba(10, 10, 10, 0.85)",
  border: "rgba(255, 255, 255, 0.1)",
  text: "#fafafa",
  textSecondary: "rgba(255, 255, 255, 0.8)",
  textMuted: "#a1a1aa",
  brandingBg: "rgba(255, 255, 255, 0.06)",
  brandingBorder: "rgba(255, 255, 255, 0.08)",
  brandingText: "rgba(255, 255, 255, 0.72)",
};

const LIGHT: ThemeColors = {
  bg: "rgba(255, 255, 255, 0.85)",
  border: "rgba(0, 0, 0, 0.1)",
  text: "#1a1a1a",
  textSecondary: "rgba(0, 0, 0, 0.7)",
  textMuted: "#71717a",
  brandingBg: "rgba(0, 0, 0, 0.04)",
  brandingBorder: "rgba(0, 0, 0, 0.08)",
  brandingText: "rgba(0, 0, 0, 0.55)",
};

function getSystemTheme(): ResolvedTheme {
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function useEmbedTheme(theme: EmbedTheme): ThemeColors {
  const [resolved, setResolved] = useState<ResolvedTheme>(
    theme === "system" ? getSystemTheme() : theme,
  );

  useEffect(() => {
    if (theme !== "system") {
      setResolved(theme);
      return;
    }

    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    setResolved(mq.matches ? "dark" : "light");

    const handler = (e: MediaQueryListEvent) => setResolved(e.matches ? "dark" : "light");
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, [theme]);

  return resolved === "dark" ? DARK : LIGHT;
}
