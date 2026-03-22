import { useNavigate, useLocation } from "@tanstack/react-router";
import { motion } from "motion/react";
import { Button, Tooltip } from "@heroui/react";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowLeft02Icon, Logout01Icon } from "@hugeicons/core-free-icons";
import { api } from "@/lib/api";
import AnimatedNumber from "@/components/AnimatedNumber";

interface Props {
  websiteName?: string;
  count?: number;
  connected?: boolean;
}

export default function Dock({ websiteName, count, connected }: Props) {
  const navigate = useNavigate();
  const location = useLocation();
  const isHome = location.pathname === "/";
  const isWebsite = location.pathname.startsWith("/websites/");

  return (
    <div className="fixed bottom-3 left-1/2 z-50 -translate-x-1/2 max-w-[calc(100vw-1.5rem)] md:bottom-4 md:max-w-none">
      <motion.div
        initial={{ opacity: 0, y: 72 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          duration: 0.5,
          delay: 0.15,
          ease: [0.22, 1, 0.36, 1],
        }}
        className="flex items-center gap-1 rounded-2xl border border-border bg-surface/90 px-2 py-2 shadow-xl backdrop-blur-xl"
      >
        {isWebsite && (
          <>
            {count !== undefined && (
              <>
                <div className="flex items-center gap-1.5 px-2">
                  <span
                    className={`w-2 h-2 rounded-full ${
                      connected ? "bg-success animate-pulse" : "bg-muted"
                    }`}
                  />
                  <AnimatedNumber value={count} className="text-sm text-foreground tabular-nums" />
                  <span className="text-sm text-muted">
                    {count === 1 ? "visitor" : "visitors"}
                  </span>
                </div>
              </>
            )}
          </>
        )}

        {isHome && (
          <>
            <span className="text-sm font-semibold text-foreground px-2">
              Latty
            </span>
            <div className="w-px h-5 bg-separator mx-1" />
            <Button
              variant="ghost"
              onPress={async () => {
                await api.logout();
                navigate({ to: "/login" });
              }}
              className="text-sm text-muted"
            >
              <HugeiconsIcon icon={Logout01Icon} size={16} />
              Logout
            </Button>
          </>
        )}
      </motion.div>
    </div>
  );
}
