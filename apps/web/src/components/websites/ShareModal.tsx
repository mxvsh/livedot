import { useState } from "react";
import { Button, Modal } from "@heroui/react";
import { HugeiconsIcon } from "@hugeicons/react";
import { Share01Icon, CopyIcon, Tick02Icon } from "@hugeicons/core-free-icons";
import { api, type Website } from "@/lib/api";

interface Props {
  website: Website | null;
  onClose: () => void;
  onUpdated: () => void;
}

export default function ShareModal({ website, onClose, onUpdated }: Props) {
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [localToken, setLocalToken] = useState<string | null | undefined>(undefined);

  const shareToken = localToken !== undefined ? localToken : website?.shareToken;
  const isSharing = !!shareToken;
  const origin = window.location.origin;

  const mapEmbed = shareToken
    ? `<iframe src="${origin}/embed/map?website=${website?.id}&token=${shareToken}" width="100%" height="400" frameborder="0" style="border:0;border-radius:12px;"></iframe>`
    : "";

  const chartEmbed = shareToken
    ? `<iframe src="${origin}/embed/chart?website=${website?.id}&token=${shareToken}" width="100%" height="200" frameborder="0" style="border:0;border-radius:12px;"></iframe>`
    : "";

  async function toggleSharing() {
    if (!website) return;
    setLoading(true);
    try {
      if (isSharing) {
        await api.disableSharing(website.id);
        setLocalToken(null);
      } else {
        const { shareToken: newToken } = await api.enableSharing(website.id);
        setLocalToken(newToken);
      }
      onUpdated();
    } finally {
      setLoading(false);
    }
  }

  function handleCopy(text: string, key: string) {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  }

  return (
    <Modal
      isOpen={!!website}
      onOpenChange={(open) => {
        if (!open) {
          setCopied(null);
          setLocalToken(undefined);
          onClose();
        }
      }}
    >
      <Modal.Backdrop>
        <Modal.Container>
          <Modal.Dialog className="sm:max-w-[400px]">
            <Modal.CloseTrigger />
            <Modal.Header>
              <Modal.Icon className="bg-default text-foreground">
                <HugeiconsIcon icon={Share01Icon} size={20} />
              </Modal.Icon>
              <Modal.Heading>Embed Widget</Modal.Heading>
            </Modal.Header>
            <Modal.Body>
              {!isSharing ? (
                <div className="flex flex-col items-center text-center py-4 gap-3">
                  <p className="text-sm text-muted">
                    Enable sharing to get embeddable map and chart widgets for your website.
                  </p>
                  <Button onPress={toggleSharing} isDisabled={loading}>
                    {loading ? "Enabling..." : "Enable Sharing"}
                  </Button>
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <p className="text-xs font-medium text-foreground">Map Widget</p>
                      <button
                        onClick={() => handleCopy(mapEmbed, "map")}
                        className="text-muted hover:text-foreground transition-colors"
                      >
                        <HugeiconsIcon icon={copied === "map" ? Tick02Icon : CopyIcon} size={14} />
                      </button>
                    </div>
                    <pre className="bg-default rounded-xl p-3 text-[10px] font-mono text-foreground overflow-x-auto select-all leading-relaxed">
                      {mapEmbed}
                    </pre>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <p className="text-xs font-medium text-foreground">Chart Widget</p>
                      <button
                        onClick={() => handleCopy(chartEmbed, "chart")}
                        className="text-muted hover:text-foreground transition-colors"
                      >
                        <HugeiconsIcon icon={copied === "chart" ? Tick02Icon : CopyIcon} size={14} />
                      </button>
                    </div>
                    <pre className="bg-default rounded-xl p-3 text-[10px] font-mono text-foreground overflow-x-auto select-all leading-relaxed">
                      {chartEmbed}
                    </pre>
                  </div>

                  <p className="text-[10px] text-muted">
                    Customize with URL params: <code className="text-foreground/60">bg</code> (background color), <code className="text-foreground/60">accent</code> (chart color).
                  </p>
                </div>
              )}
            </Modal.Body>
            <Modal.Footer>
              <Button variant="outline" onPress={onClose} className="flex-1">
                Close
              </Button>
              {isSharing && (
                <Button variant="outline" className="flex-1 text-danger" onPress={toggleSharing} isDisabled={loading}>
                  {loading ? "Disabling..." : "Disable Sharing"}
                </Button>
              )}
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}
