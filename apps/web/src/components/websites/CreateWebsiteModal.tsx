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
import { PlusSignIcon, Add01Icon } from "@hugeicons/core-free-icons";
import { api } from "@/lib/api";

interface Props {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: () => void;
}

export default function CreateWebsiteModal({ isOpen, onOpenChange, onCreated }: Props) {
  const [creating, setCreating] = useState(false);

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
      await api.createWebsite(name, url);
      onCreated();
      onOpenChange(false);
    } finally {
      setCreating(false);
    }
  }

  return (
    <Modal isOpen={isOpen} onOpenChange={onOpenChange}>
      <Modal.Backdrop>
        <Modal.Container>
          <Modal.Dialog className="sm:max-w-[400px]">
            <Modal.CloseTrigger />
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
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}
