import { useState } from "react";
import { Button, Modal } from "@heroui/react";
import { HugeiconsIcon } from "@hugeicons/react";
import { Share01Icon, CopyIcon, Tick02Icon } from "@hugeicons/core-free-icons";
import { planLabel } from "@livedot/shared/plans";
import { api, type Website } from "@/lib/api";
import { useAuthStore } from "@/stores/auth";

interface Props {
  website: Website | null;
  onClose: () => void;
  onUpdated: () => void;
}

type EmbedTab = "map" | "chart" | "live";

const embedPreviewImages: Record<EmbedTab, { src: string; alt: string }> = {
  map: {
    src: "/images/widget-map.png",
    alt: "Map widget placeholder preview",
  },
  chart: {
    src: "/images/widget-chart.png",
    alt: "Chart widget placeholder preview",
  },
  live: {
    src: "/images/widget-live.png",
    alt: "Live count widget placeholder preview",
  },
};

export default function ShareModal({ website, onClose, onUpdated }: Props) {
  const user = useAuthStore((state) => state.user);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [localToken, setLocalToken] = useState<string | null | undefined>(undefined);
  const [brandingOptIn, setBrandingOptIn] = useState(false);
  const [activeTab, setActiveTab] = useState<EmbedTab>("map");

  const shareToken = localToken !== undefined ? localToken : website?.shareToken;
  const isSharing = !!shareToken;
  const isFreePlan = user?.plan === "free";
  const showBrandingNotice = isFreePlan;
  const origin = window.location.origin;
  const brandingParam = !isFreePlan && brandingOptIn ? "&branding=1" : "";

  const mapEmbed = shareToken
    ? `<iframe src="${origin}/embed/map?website=${website?.id}&token=${shareToken}${brandingParam}" width="100%" height="400" frameborder="0" style="border:0;border-radius:12px;"></iframe>`
    : "";

  const chartEmbed = shareToken
    ? `<iframe src="${origin}/embed/chart?website=${website?.id}&token=${shareToken}&scale=0.9${brandingParam}" width="260" height="128" frameborder="0" style="border:0;overflow:hidden;"></iframe>`
    : "";

  const liveEmbed = shareToken
    ? `<iframe src="${origin}/embed/live?website=${website?.id}&token=${shareToken}&scale=0.85${brandingParam}" width="260" height="84" frameborder="0" style="border:0;overflow:hidden;"></iframe>`
    : "";

  const embeds = {
    map: {
      title: "Map Widget",
      description: "A full live world map with active visitors.",
      snippet: mapEmbed,
      height: "400px",
      width: "100%",
    },
    chart: {
      title: "Chart Widget",
      description: "A compact traffic trend chart with the live count.",
      snippet: chartEmbed,
      height: "128px",
      width: "260px",
    },
    live: {
      title: "Live Count Widget",
      description: "Just the live dot and current visitor count.",
      snippet: liveEmbed,
      height: "84px",
      width: "260px",
    },
  } satisfies Record<EmbedTab, { title: string; description: string; snippet: string; height: string; width: string }>;

  const activeEmbed = embeds[activeTab];

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
          setBrandingOptIn(false);
          setActiveTab("map");
          onClose();
        }
      }}
    >
      <Modal.Backdrop>
        <Modal.Container>
          <Modal.Dialog className="sm:max-w-[400px]">
            <Modal.CloseTrigger />
            <Modal.Header>
              {/*<Modal.Icon className="bg-default text-foreground">
                <HugeiconsIcon icon={Share01Icon} size={20} />
              </Modal.Icon>*/}
              {/*<Modal.Heading>Embed Widget</Modal.Heading>*/}
            </Modal.Header>
            <Modal.Body>
              {!isSharing ? (
                <div className="flex flex-col items-center text-center py-4 gap-3">
                  <p className="text-sm text-muted">
                    Enable sharing to get embeddable map and chart widgets for your website.
                  </p>
                  {showBrandingNotice && (
                    <p className="text-xs text-muted max-w-[24rem]">
                      Free plan embeds include a Livedot branding badge in the bottom-left corner.
                    </p>
                  )}
                  <Button onPress={toggleSharing} isDisabled={loading}>
                    {loading ? "Enabling..." : "Enable Sharing"}
                  </Button>
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  {!isFreePlan && (
                    <label className="flex items-start gap-3 rounded-xl border border-white/8 bg-default px-3 py-2.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={brandingOptIn}
                        onChange={(e) => setBrandingOptIn(e.target.checked)}
                        className="mt-0.5 h-4 w-4 accent-[var(--accent)]"
                      />
                      <span className="text-[11px] leading-relaxed text-muted">
                        Enable branding
                      </span>
                    </label>
                  )}

                    <div>
                      <div className="flex justify-center">
                      <div className="inline-flex rounded-full bg-surface-secondary p-1">
                        {(["map", "chart", "live"] as EmbedTab[]).map((tab) => (
                          <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            data-selected={activeTab === tab}
                            className="relative rounded-full px-3 py-1.5 text-xs font-medium text-muted transition-colors data-[selected=true]:bg-accent data-[selected=true]:text-accent-foreground"
                          >
                            {embeds[tab].title.replace(" Widget", "")}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-white/8 bg-default p-4">
                    <div className="mb-4 overflow-hidden rounded-xl border border-white/8 bg-surface-secondary">
                      <img
                        src={embedPreviewImages[activeTab].src}
                        alt={embedPreviewImages[activeTab].alt}
                        className={`w-full object-cover ${
                          activeTab === "map" ? "aspect-[16/9]" : activeTab === "chart" ? "aspect-[2/1]" : "aspect-[5/2]"
                        }`}
                      />
                    </div>
                    <div className="flex items-start justify-between gap-4 mb-3">
                      <div>
                        <p className="text-sm font-medium text-foreground">{activeEmbed.title}</p>
                        <p className="mt-1 text-xs text-muted">{activeEmbed.description}</p>
                        <p className="mt-2 text-[10px] uppercase tracking-[0.18em] text-muted/70">
                          Suggested embed size {activeEmbed.width} × {activeEmbed.height}
                        </p>
                      </div>
                      <button
                        onClick={() => handleCopy(activeEmbed.snippet, activeTab)}
                        className="text-muted hover:text-foreground transition-colors"
                      >
                        <HugeiconsIcon icon={copied === activeTab ? Tick02Icon : CopyIcon} size={14} />
                      </button>
                    </div>

                    <pre className="rounded-xl bg-surface-secondary px-3 py-3 text-[10px] font-mono text-foreground overflow-x-auto select-all leading-relaxed">
                      {activeEmbed.snippet}
                    </pre>
                  </div>
                  <p className="text-[10px] text-muted">
                    Need embed options or docs?{" "}
                    <a
                      href="https://livedot.dev/help"
                      target="_blank"
                      rel="noreferrer"
                      className="text-foreground underline underline-offset-2"
                    >
                      Learn more
                    </a>
                  </p>
                  {activeTab === "chart" && (
                    <p className="text-[10px] text-muted">
                      Chart widget supports <code className="text-foreground/60">scale</code> too, for example <code className="text-foreground/60">scale=0.8</code>.
                    </p>
                  )}
                </div>
              )}
            </Modal.Body>
            <Modal.Footer>
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
