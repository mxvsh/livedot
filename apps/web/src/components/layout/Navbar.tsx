import { useNavigate } from "@tanstack/react-router";
import { Button } from "@heroui/react";
import { HugeiconsIcon } from "@hugeicons/react";
import { Logout01Icon } from "@hugeicons/core-free-icons";
import { useAuthStore } from "@/stores/auth";

export default function Navbar() {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();

  return (
    <nav className="border-b border-border bg-surface/80 backdrop-blur-xl">
      <div className="max-w-2xl mx-auto px-4 flex items-center justify-between h-14">
        <div className="flex items-center gap-2">
          <img src="/logo.png" alt="Logo" className="h-5 rounded-md" />
          <span className="text-sm font-semibold text-foreground">Livedot</span>
        </div>
        <div className="flex items-center gap-3">
          {user && (
            <span className="text-xs text-muted">{user.username}</span>
          )}
          <Button
            variant="ghost"
            size="sm"
            onPress={async () => {
              await logout();
              navigate({ to: "/login" });
            }}
            className="text-muted"
          >
            <HugeiconsIcon icon={Logout01Icon} size={14} />
            Logout
          </Button>
        </div>
      </div>
    </nav>
  );
}
