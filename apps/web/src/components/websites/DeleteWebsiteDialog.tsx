import { AlertDialog, Button } from "@heroui/react";
import { HugeiconsIcon } from "@hugeicons/react";
import { Delete02Icon } from "@hugeicons/core-free-icons";
import { api, type Website } from "@/lib/api";

interface Props {
  website: Website | null;
  onClose: () => void;
  onDeleted: () => void;
}

export default function DeleteWebsiteDialog({ website, onClose, onDeleted }: Props) {
  async function handleDelete() {
    if (!website) return;
    await api.deleteWebsite(website.id);
    onClose();
    onDeleted();
  }

  return (
    <AlertDialog isOpen={!!website} onOpenChange={(open) => { if (!open) onClose(); }}>
      <AlertDialog.Backdrop>
        <AlertDialog.Container>
          <AlertDialog.Dialog>
            <AlertDialog.Header>
              <AlertDialog.Icon status="danger" />
              <AlertDialog.Heading>Delete Website</AlertDialog.Heading>
            </AlertDialog.Header>
            <AlertDialog.Body>
              <p className="text-sm text-muted">
                Are you sure you want to delete{" "}
                <strong className="text-foreground">{website?.name}</strong>? This action cannot
                be undone.
              </p>
            </AlertDialog.Body>
            <AlertDialog.Footer>
              <Button variant="outline" onPress={onClose} className="flex-1">
                Cancel
              </Button>
              <Button variant="danger" onPress={handleDelete} className="flex-1">
                <HugeiconsIcon icon={Delete02Icon} size={16} />
                Delete
              </Button>
            </AlertDialog.Footer>
          </AlertDialog.Dialog>
        </AlertDialog.Container>
      </AlertDialog.Backdrop>
    </AlertDialog>
  );
}
