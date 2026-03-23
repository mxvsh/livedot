import { useState, useEffect } from "react";
import { Button, Modal } from "@heroui/react";
import { HugeiconsIcon } from "@hugeicons/react";
import { CreditCardIcon } from "@hugeicons/core-free-icons";
import { useAuthStore } from "@/stores/auth";
import { planLabel, PLAN_META } from "@livedot/shared/plans";
import { api } from "@/lib/api";

interface Props {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

const PLAN_ORDER: Record<string, number> = { free: 0, pro: 1, max: 2, ce: 99 };
const UPGRADE_PLAN_IDS = ["pro", "max"];

function fmt(n: number) {
  return n.toLocaleString();
}

function PlanBadge({ plan }: { plan: string }) {
  const colors: Record<string, string> = {
    free: "bg-default text-muted",
    pro: "bg-accent/15 text-accent",
    max: "bg-yellow-500/15 text-yellow-400",
    ce: "bg-default text-muted",
  };
  return (
    <span className={`text-xs px-2 py-0.5 rounded-md font-medium ${colors[plan] ?? "bg-default text-muted"}`}>
      {planLabel(plan)}
    </span>
  );
}

export default function SubscriptionModal({ isOpen, onOpenChange }: Props) {
  const { user, cloud } = useAuthStore();
  const plan = user?.plan ?? "free";
  const planOrder = PLAN_ORDER[plan] ?? 0;

  const [usage, setUsage] = useState<{ eventsUsed: number; eventsLimit: number } | null>(null);
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isOpen) {
      setUsage(null);
      setError("");
      api.getUsage().then(setUsage).catch(() => {});
    }
  }, [isOpen]);

  async function handleUpgrade(planId: string) {
    setCheckoutLoading(planId);
    setError("");
    try {
      const { url } = await api.createCheckout(planId);
      window.location.href = url;
    } catch (err: any) {
      setError(err.message);
      setCheckoutLoading(null);
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
                <HugeiconsIcon icon={CreditCardIcon} size={20} />
              </Modal.Icon>
              <Modal.Heading>Subscription</Modal.Heading>
            </Modal.Header>
            <Modal.Body className="flex flex-col gap-4">
              {/* Current plan */}
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted">Current plan</p>
                <PlanBadge plan={plan} />
              </div>

              {/* Usage */}
              {!usage ? (
                <div className="flex justify-center py-2">
                  <div className="w-5 h-5 border-2 border-accent border-t-transparent rounded-full animate-spin" />
                </div>
              ) : (
                <div className="flex flex-col gap-1">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-muted">Events this month</span>
                    <span className="text-foreground font-medium">
                      {fmt(usage.eventsUsed)}
                      {usage.eventsLimit > 0 && <span className="text-muted"> / {fmt(usage.eventsLimit)}</span>}
                    </span>
                  </div>
                  {usage.eventsLimit > 0 && (
                    <>
                      <div className="h-1.5 rounded-full bg-default overflow-hidden">
                        <div
                          className="h-full rounded-full bg-accent transition-all"
                          style={{ width: `${Math.min(100, (usage.eventsUsed / usage.eventsLimit) * 100)}%` }}
                        />
                      </div>
                      <p className="text-xs text-muted mt-0.5">
                        {fmt(Math.max(0, usage.eventsLimit - usage.eventsUsed))} remaining this month
                      </p>
                    </>
                  )}
                  {usage.eventsLimit === 0 && (
                    <p className="text-xs text-muted">Unlimited (Community Edition)</p>
                  )}
                </div>
              )}

              {/* Upgrade plans */}
              {cloud && plan !== "ce" && planOrder < PLAN_ORDER.max && (
                <div className="flex flex-col gap-2">
                  <p className="text-xs text-muted">Upgrade</p>
                  {UPGRADE_PLAN_IDS.filter(id => PLAN_ORDER[id] > planOrder).map(id => {
                    const meta = PLAN_META[id];
                    return (
                    <div key={id} className="flex items-center justify-between rounded-xl bg-default p-3 gap-3">
                      <div className="flex flex-col gap-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-foreground">{meta.label}</span>
                          <span className="text-xs text-muted">{meta.price}</span>
                        </div>
                        <p className="text-xs text-muted">{meta.features.join(" · ")}</p>
                      </div>
                      <Button
                        size="sm"
                        isDisabled={checkoutLoading !== null}
                        onPress={() => handleUpgrade(id)}
                        className="shrink-0"
                      >
                        {checkoutLoading === id ? "Loading..." : "Upgrade"}
                      </Button>
                    </div>
                    );
                  })}
                </div>
              )}

              {error && <p className="text-danger text-xs">{error}</p>}
            </Modal.Body>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}
