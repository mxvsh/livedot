import { useEffect, useRef } from "react";
import maplibregl from "maplibre-gl";
import type { VisitorSession } from "@livedot/shared";

interface Props {
  sessions: VisitorSession[];
  selectedSessionId?: string | null;
  onSessionSelect?: (sessionId: string | null) => void;
}

const DARK_STYLE = {
  version: 8 as const,
  name: "Dark",
  sources: {
    "carto-dark": {
      type: "raster" as const,
      tiles: [
        "https://a.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}@2x.png",
        "https://b.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}@2x.png",
        "https://c.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}@2x.png",
      ],
      tileSize: 256,
      attribution: "&copy; CARTO &copy; OpenStreetMap contributors",
    },
  },
  layers: [
    {
      id: "carto-dark-layer",
      type: "raster" as const,
      source: "carto-dark",
      minzoom: 0,
      maxzoom: 20,
    },
  ],
};

const MAX_AVATARS = 30;
const AVATAR_SHOW_ZOOM = 2;
const AVATAR_PX = 48;
const NO_MATCH_FILTER: maplibregl.FilterSpecification = ["==", ["get", "sessionId"], ""];

function sessionsToGeoJSON(sessions: VisitorSession[]): GeoJSON.FeatureCollection {
  return {
    type: "FeatureCollection",
    features: sessions.map((s) => ({
      type: "Feature" as const,
      geometry: { type: "Point" as const, coordinates: [s.lng, s.lat] },
      properties: { sessionId: s.sessionId, pageUrl: s.pageUrl },
    })),
  };
}

function avatarUrl(sessionId: string) {
  return `https://api.dicebear.com/9.x/thumbs/svg?seed=${encodeURIComponent(sessionId)}&backgroundColor=111111`;
}

async function loadAvatarToMap(map: maplibregl.Map, sessionId: string): Promise<boolean> {
  try {
    const img = new Image(AVATAR_PX, AVATAR_PX);
    img.crossOrigin = "anonymous";

    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = reject;
      img.src = avatarUrl(sessionId);
    });

    const canvas = document.createElement("canvas");
    canvas.width = AVATAR_PX;
    canvas.height = AVATAR_PX;
    const ctx = canvas.getContext("2d")!;
    const r = AVATAR_PX / 2;

    // Circular clip + dark background
    ctx.beginPath();
    ctx.arc(r, r, r, 0, Math.PI * 2);
    ctx.fillStyle = "#111111";
    ctx.fill();
    ctx.clip();
    ctx.drawImage(img, 0, 0, AVATAR_PX, AVATAR_PX);

    const imageId = `avatar-${sessionId}`;
    if (map.hasImage(imageId)) return true;

    map.addImage(imageId, {
      data: new Uint8ClampedArray(ctx.getImageData(0, 0, AVATAR_PX, AVATAR_PX).data),
      width: AVATAR_PX,
      height: AVATAR_PX,
    });
    return true;
  } catch {
    return false;
  }
}

export default function Map({ sessions, selectedSessionId, onSessionSelect }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const sourceReady = useRef(false);
  const pendingSessions = useRef<VisitorSession[]>(sessions);
  const onSessionSelectRef = useRef(onSessionSelect);
  const selectedSessionIdRef = useRef(selectedSessionId);
  const loadedAvatarsRef = useRef(new Set<string>());

  pendingSessions.current = sessions;
  onSessionSelectRef.current = onSessionSelect;
  selectedSessionIdRef.current = selectedSessionId;

  useEffect(() => {
    if (!containerRef.current) return;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: DARK_STYLE,
      center: [0, 20],
      zoom: 1.8,
      attributionControl: false,
      maxZoom: 12,
      minZoom: 1,
    });

    map.on("load", () => {
      map.addSource("visitors", {
        type: "geojson",
        data: sessionsToGeoJSON(pendingSessions.current),
      });

      // --- Glow layers (always visible) ---
      map.addLayer({
        id: "visitors-glow",
        type: "circle",
        source: "visitors",
        paint: {
          "circle-radius": 18,
          "circle-color": "#00ffcc",
          "circle-opacity": 0.12,
          "circle-blur": 1,
        },
      });

      map.addLayer({
        id: "visitors-mid",
        type: "circle",
        source: "visitors",
        paint: {
          "circle-radius": 8,
          "circle-color": "#00ffcc",
          "circle-opacity": 0.25,
          "circle-blur": 0.6,
        },
      });

      map.addLayer({
        id: "visitors-dot",
        type: "circle",
        source: "visitors",
        paint: {
          "circle-radius": 3,
          "circle-color": "#00ffcc",
          "circle-opacity": 0.9,
        },
      });

      // --- Selected ring (behind avatar) ---
      const initFilter: maplibregl.FilterSpecification = selectedSessionIdRef.current
        ? ["==", ["get", "sessionId"], selectedSessionIdRef.current]
        : NO_MATCH_FILTER;

      map.addLayer({
        id: "visitors-selected-ring",
        type: "circle",
        source: "visitors",
        filter: initFilter,
        paint: {
          "circle-radius": 22,
          "circle-color": "#ffffff",
          "circle-opacity": 0.1,
          "circle-blur": 0.4,
        },
      });

      // --- Avatar symbol layer (GPU-rendered, moves with map) ---
      map.addLayer({
        id: "visitor-avatars",
        type: "symbol",
        source: "visitors",
        minzoom: AVATAR_SHOW_ZOOM,
        layout: {
          "icon-image": ["concat", "avatar-", ["get", "sessionId"]],
          "icon-size": [
            "case",
            ["==", ["get", "sessionId"], selectedSessionIdRef.current || ""],
            0.7,
            0.55,
          ],
          "icon-allow-overlap": true,
          "icon-ignore-placement": true,
        },
      });

      // --- Click handlers ---
      const clickLayers = ["visitor-avatars", "visitors-dot"];
      for (const layer of clickLayers) {
        map.on("click", layer, (e) => {
          const sid = e.features?.[0]?.properties?.sessionId as string | undefined;
          if (sid) onSessionSelectRef.current?.(sid);
          e.originalEvent.stopPropagation();
        });
        map.on("mouseenter", layer, () => {
          map.getCanvas().style.cursor = "pointer";
        });
        map.on("mouseleave", layer, () => {
          map.getCanvas().style.cursor = "";
        });
      }

      map.on("click", (e) => {
        const features = map.queryRenderedFeatures(e.point, { layers: clickLayers });
        if (features.length === 0) onSessionSelectRef.current?.(null);
      });

      sourceReady.current = true;
    });

    mapRef.current = map;
    return () => {
      sourceReady.current = false;
      loadedAvatarsRef.current.clear();
      map.remove();
    };
  }, []);

  // Sync GeoJSON source + load new avatars
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !sourceReady.current) return;

    const source = map.getSource("visitors") as maplibregl.GeoJSONSource | undefined;
    source?.setData(sessionsToGeoJSON(sessions));

    // Load avatars for top N most recent sessions
    const topSessions = [...sessions]
      .sort((a, b) => b.lastSeen - a.lastSeen)
      .slice(0, MAX_AVATARS);

    for (const s of topSessions) {
      if (!loadedAvatarsRef.current.has(s.sessionId)) {
        loadedAvatarsRef.current.add(s.sessionId);
        loadAvatarToMap(map, s.sessionId);
      }
    }
  }, [sessions]);

  // Update selected styling
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !sourceReady.current) return;

    const selId = selectedSessionId || "";

    map.setFilter("visitors-selected-ring", selectedSessionId
      ? ["==", ["get", "sessionId"], selectedSessionId]
      : NO_MATCH_FILTER);

    map.setLayoutProperty("visitor-avatars", "icon-size", [
      "case",
      ["==", ["get", "sessionId"], selId],
      0.7,
      0.55,
    ]);
  }, [selectedSessionId]);

  return (
    <div
      ref={containerRef}
      className="w-full h-full"
      style={{ background: "#0a0a0a" }}
    />
  );
}
