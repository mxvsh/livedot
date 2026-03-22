import { useNavigate } from "@tanstack/react-router";
import { Avatar, Dropdown, Separator } from "@heroui/react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Logout01Icon,
  Settings01Icon,
  UserIcon,
  HelpCircleIcon,
} from "@hugeicons/core-free-icons";
import { useAuthStore } from "@/stores/auth";

function getInitials(username: string) {
  return username.slice(0, 2).toUpperCase();
}

export default function Navbar() {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();

  return (
    <nav className="border-b border-border bg-surface/80 backdrop-blur-xl">
      <div className="max-w-2xl mx-auto px-4 flex items-center justify-between h-14">
        <div className="flex items-center gap-2">
          <img src="/logo.png" alt="Logo" className="h-6 rounded-md" />
          <span className="text-lg font-semibold text-foreground font-chillax">livedot</span>
        </div>

        <Dropdown>
          <Dropdown.Trigger className="rounded-full cursor-pointer">
            <Avatar>
              <Avatar.Fallback>{user ? getInitials(user.username) : "?"}</Avatar.Fallback>
            </Avatar>
          </Dropdown.Trigger>
          <Dropdown.Popover placement="bottom end">
            {user && (
              <div className="px-3 pt-3 pb-1">
                <div className="flex items-center gap-2">
                  <Avatar size="sm">
                    <Avatar.Fallback>{getInitials(user.username)}</Avatar.Fallback>
                  </Avatar>
                  <div className="flex flex-col gap-0">
                    <p className="text-sm leading-5 font-medium">{user.username}</p>
                    <p className="text-xs leading-none text-muted">Administrator</p>
                  </div>
                </div>
              </div>
            )}
            <Dropdown.Menu
              onAction={async (key) => {
                if (key === "logout") {
                  await logout();
                  navigate({ to: "/login" });
                }
              }}
            >
              <Dropdown.Section>
                <Dropdown.Item id="profile" textValue="Profile">
                  <HugeiconsIcon icon={UserIcon} size={16} />
                  Profile
                </Dropdown.Item>
                <Dropdown.Item id="settings" textValue="Settings">
                  <HugeiconsIcon icon={Settings01Icon} size={16} />
                  Settings
                </Dropdown.Item>
                <Dropdown.Item id="help" textValue="Help">
                  <HugeiconsIcon icon={HelpCircleIcon} size={16} />
                  Help
                </Dropdown.Item>
              </Dropdown.Section>
              <Separator />
              <Dropdown.Section>
                <Dropdown.Item id="logout" textValue="Logout" className="text-danger">
                  <HugeiconsIcon icon={Logout01Icon} size={16} />
                  Logout
                </Dropdown.Item>
              </Dropdown.Section>
            </Dropdown.Menu>
          </Dropdown.Popover>
        </Dropdown>
      </div>
    </nav>
  );
}
