import { useNavigate } from "@tanstack/react-router";
import { Button, Card } from "@heroui/react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Delete02Icon,
  PencilEdit01Icon,
  ArrowRight01Icon,
  CodeSimpleIcon,
  LayoutGrid,
} from "@hugeicons/core-free-icons";
import type { Website } from "@/lib/api";
import WebsiteLiveCount from "./WebsiteLiveCount";

interface Props {
  website: Website;
  onSnippet: (website: Website) => void;
  onShare: (website: Website) => void;
  onEdit: (website: Website) => void;
  onDelete: (website: Website) => void;
}

export default function WebsiteCard({ website, onSnippet, onShare, onEdit, onDelete }: Props) {
  const navigate = useNavigate();

  return (
    <Card
      className="group cursor-pointer"
      onClick={() =>
        navigate({
          to: "/websites/$websiteId",
          params: { websiteId: website.id },
        })
      }
    >
      <Card.Header>
        <div className="flex items-center justify-between w-full">
          <div className="flex-1 min-w-0">
            <Card.Title>{website.name}</Card.Title>
            <Card.Description className="text-xs mt-1 flex items-center gap-2">
              {website.url && <span>{website.url}</span>}
            </Card.Description>
          </div>
          <div className="flex items-center ml-3 shrink-0">
            <WebsiteLiveCount websiteId={website.id} />
            <div className="w-4"/>
            <Button
              variant="ghost"
              className="text-muted hover:text-foreground"
              onPress={() => onSnippet(website)}
            >
              <HugeiconsIcon icon={CodeSimpleIcon} size={16} />
            </Button>
            <Button
              variant="ghost"
              className="text-muted hover:text-foreground"
              onPress={() => onShare(website)}
            >
              <HugeiconsIcon icon={LayoutGrid} size={16} />
            </Button>
            <Button
              variant="ghost"
              className="text-muted hover:text-foreground"
              onPress={() => onEdit(website)}
            >
              <HugeiconsIcon icon={PencilEdit01Icon} size={16} />
            </Button>
            <Button
              variant="ghost"
              className="text-muted hover:text-danger"
              onPress={() => onDelete(website)}
            >
              <HugeiconsIcon icon={Delete02Icon} size={16} />
            </Button>
            <span className="text-muted transition-transform duration-200 group-hover:translate-x-1">
              <HugeiconsIcon icon={ArrowRight01Icon} size={18} />
            </span>
          </div>
        </div>
      </Card.Header>
    </Card>
  );
}
