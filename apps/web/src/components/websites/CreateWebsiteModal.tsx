import { useState } from "react";
import {
  Button,
  Form,
  Input,
  Label,
  Modal,
  TextField,
  FieldError,
} from "@heroui/react";
import { HugeiconsIcon } from "@hugeicons/react";
import { PlusSignIcon, Add01Icon, CodeIcon } from "@hugeicons/core-free-icons";
import { api, type Website } from "@/lib/api";

interface Props {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: () => void;
}

export default function CreateWebsiteModal({ isOpen, onOpenChange, onCreated }: Props) {
  const [creating, setCreating] = useState(false);
  const [created, setCreated] = useState<Website | null>(null);
  const [copied, setCopied] = useState(false);

  const snippet = created
    ? `<script defer src="${window.location.origin}/t.js" data-website="${created.id}"></script>`
    : "";

  function handleClose(open: boolean) {
    if (!open) {
      setCreated(null);
      setCopied(false);
    }
    onOpenChange(open);
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setCreating(true);
    const formData = new FormData(e.currentTarget);
    const name = formData.get("name")?.toString().trim();
    const url = formData.get("url")?.toString().trim() || "";
    if (!name) {
      setCreating(false);
      return;
    }
    try {
      const website = await api.createWebsite(name, url);
      onCreated();
      setCreated(website);
    } finally {
      setCreating(false);
    }
  }

  function handleCopy() {
    navigator.clipboard.writeText(snippet);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <Modal isOpen={isOpen} onOpenChange={handleClose}>
      <Modal.Backdrop>
        <Modal.Container>
          <Modal.Dialog className="sm:max-w-[500px]">
            <Modal.CloseTrigger />
            {!created ? (
              <>
                <Modal.Header>
                  <Modal.Icon className="bg-default text-foreground">
                    <HugeiconsIcon icon={Add01Icon} size={20} />
                  </Modal.Icon>
                  <Modal.Heading>New Website</Modal.Heading>
                </Modal.Header>
                <Modal.Body>
                  <Form
                    id="create-website-form"
                    className="flex flex-col gap-4"
                    onSubmit={handleSubmit}
                  >
                    <TextField variant="secondary" isRequired name="name" className="w-full">
                      <Label>Website name</Label>
                      <Input placeholder="My Website" autoFocus className="ring-inset" />
                      <FieldError />
                    </TextField>
                    <TextField variant="secondary" name="url" className="w-full">
                      <Label>URL</Label>
                      <Input placeholder="https://example.com" className="ring-inset" />
                      <FieldError />
                    </TextField>
                  </Form>
                </Modal.Body>
                <Modal.Footer>
                  <Button variant="outline" slot="close" className="flex-1">
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    form="create-website-form"
                    isDisabled={creating}
                    className="flex-1"
                  >
                    <HugeiconsIcon icon={PlusSignIcon} size={16} />
                    {creating ? "Creating..." : "Create"}
                  </Button>
                </Modal.Footer>
              </>
            ) : (
              <>
                <Modal.Header>
                  <Modal.Icon className="bg-default text-foreground">
                    <HugeiconsIcon icon={CodeIcon} size={20} />
                  </Modal.Icon>
                  <Modal.Heading>Tracking Script</Modal.Heading>
                </Modal.Header>
                <Modal.Body>
                  <p className="text-sm text-muted mb-3">
                    Add this snippet to <strong className="text-foreground">{created.name}</strong>'s HTML:
                  </p>
                  <pre className="bg-default rounded-xl p-4 text-xs font-mono text-foreground overflow-x-auto select-all">
                    {snippet}
                  </pre>
                </Modal.Body>
                <Modal.Footer>
                  <Button variant="outline" onPress={() => handleClose(false)} className="flex-1">
                    Done
                  </Button>
                  <Button className="flex-1" onPress={handleCopy}>
                    {copied ? "Copied!" : "Copy"}
                  </Button>
                </Modal.Footer>
              </>
            )}
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}
