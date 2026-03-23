import { Modal } from "@heroui/react";
import { HugeiconsIcon } from "@hugeicons/react";
import { CreditCardIcon } from "@hugeicons/core-free-icons";
import { useAuthStore } from "@/stores/auth";
import { planLabel, PLANS } from "@livedot/shared/plans";

interface Props {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function BillingModal({ isOpen, onOpenChange }: Props) {
  const { user } = useAuthStore();
  const plan = user?.plan ?? "free";

  return (
    <Modal isOpen={isOpen} onOpenChange={onOpenChange}>
      <Modal.Backdrop>
        <Modal.Container>
          <Modal.Dialog className="sm:max-w-[400px]">
            <Modal.CloseTrigger />
            <Modal.Header>
              <Modal.Icon className="bg-default text-foreground">
                <HugeiconsIcon icon={CreditCardIcon} size={20} />
              </Modal.Icon>
              <Modal.Heading>Billing</Modal.Heading>
            </Modal.Header>
            <Modal.Body>
              <div className="flex flex-col items-center text-center py-4 gap-3">
                <span className="text-xs font-medium uppercase tracking-wider px-2 py-0.5 rounded-md bg-white/[0.06] border border-white/[0.08] text-muted">
                  {planLabel(plan)}
                </span>
                <p className="text-sm text-muted">
                  Plan upgrades and billing management are coming soon.
                </p>
              </div>
            </Modal.Body>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}
