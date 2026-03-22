import { useState } from "react";
import { Button, Modal } from "@heroui/react";
import { HugeiconsIcon } from "@hugeicons/react";
import { CodeIcon } from "@hugeicons/core-free-icons";
import type { Website } from "@/lib/api";

interface Props {
  website: Website | null;
  onClose: () => void;
}

export default function SnippetModal({ website, onClose }: Props) {
  const [copied, setCopied] = useState(false);

  const snippet = `<script defer src="${window.location.origin}/t.js" data-website="${website?.id}"></script>`;

  function handleCopy() {
    navigator.clipboard.writeText(snippet);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <Modal
      isOpen={!!website}
      onOpenChange={(open) => {
        if (!open) {
          setCopied(false);
          onClose();
        }
      }}
    >
      <Modal.Backdrop>
        <Modal.Container>
          <Modal.Dialog className="sm:max-w-[500px]">
            <Modal.CloseTrigger />
            <Modal.Header>
              <Modal.Icon className="bg-default text-foreground">
                <HugeiconsIcon icon={CodeIcon} size={20} />
              </Modal.Icon>
              <Modal.Heading>Tracking Script</Modal.Heading>
            </Modal.Header>
            <Modal.Body>
              <p className="text-sm text-muted mb-3">
                Add this snippet to your website's HTML:
              </p>
              <pre className="bg-default rounded-xl p-4 text-xs font-mono text-foreground overflow-x-auto select-all">
                {snippet}
              </pre>
            </Modal.Body>
            <Modal.Footer>
              <Button variant="outline" onPress={onClose} className="flex-1">
                Close
              </Button>
              <Button className="flex-1" onPress={handleCopy}>
                {copied ? "Copied!" : "Copy"}
              </Button>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}
