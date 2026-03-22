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
import { PencilEdit01Icon } from "@hugeicons/core-free-icons";
import { api, type Website } from "@/lib/api";

interface Props {
  website: Website | null;
  onClose: () => void;
  onEdited: () => void;
}

export default function EditWebsiteModal({ website, onClose, onEdited }: Props) {
  const [editing, setEditing] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!website) return;
    setEditing(true);
    const formData = new FormData(e.currentTarget);
    const name = formData.get("name")?.toString().trim();
    const url = formData.get("url")?.toString().trim() || "";
    if (!name) {
      setEditing(false);
      return;
    }
    try {
      await api.updateWebsite(website.id, name, url);
      onEdited();
      onClose();
    } finally {
      setEditing(false);
    }
  }

  return (
    <Modal isOpen={!!website} onOpenChange={(open) => { if (!open) onClose(); }}>
      <Modal.Backdrop>
        <Modal.Container>
          <Modal.Dialog className="sm:max-w-[400px]">
            <Modal.CloseTrigger />
            <Modal.Header>
              <Modal.Icon className="bg-default text-foreground">
                <HugeiconsIcon icon={PencilEdit01Icon} size={20} />
              </Modal.Icon>
              <Modal.Heading>Edit Website</Modal.Heading>
            </Modal.Header>
            <Modal.Body>
              <Form
                id="edit-website-form"
                className="flex flex-col gap-4"
                onSubmit={handleSubmit}
              >
                <TextField variant="secondary" isRequired name="name" defaultValue={website?.name} className="w-full">
                  <Label>Website name</Label>
                  <Input autoFocus className="ring-inset" />
                  <FieldError />
                </TextField>
                <TextField variant="secondary" name="url" defaultValue={website?.url} className="w-full">
                  <Label>URL</Label>
                  <Input placeholder="https://example.com" className="ring-inset" />
                  <FieldError />
                </TextField>
              </Form>
            </Modal.Body>
            <Modal.Footer>
              <Button variant="outline" onPress={onClose} className="flex-1">
                Cancel
              </Button>
              <Button
                type="submit"
                form="edit-website-form"
                isDisabled={editing}
                className="flex-1"
              >
                {editing ? "Saving..." : "Save"}
              </Button>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}
