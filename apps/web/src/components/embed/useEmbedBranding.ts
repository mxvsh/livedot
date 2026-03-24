import { useEffect, useState } from "react";

export function useEmbedBranding(website: string, token: string, explicitBranding: boolean) {
  const [showBranding, setShowBranding] = useState(explicitBranding);

  useEffect(() => {
    if (!website || !token) {
      setShowBranding(false);
      return;
    }

    let cancelled = false;

    fetch(`/api/embed/meta?website=${encodeURIComponent(website)}&token=${encodeURIComponent(token)}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { branding?: boolean } | null) => {
        if (!cancelled) setShowBranding(Boolean(data?.branding) || explicitBranding);
      })
      .catch(() => {
        if (!cancelled) setShowBranding(explicitBranding);
      });

    return () => {
      cancelled = true;
    };
  }, [website, token, explicitBranding]);

  return showBranding;
}
