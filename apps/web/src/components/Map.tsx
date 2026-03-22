import { useEffect, useRef } from "react";
import maplibregl from "maplibre-gl";
import type { VisitorSession } from "@latty/shared";

interface Props {
  sessions: VisitorSession[];
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

function sessionsToGeoJSON(
  sessions: VisitorSession[]
): GeoJSON.FeatureCollection {
  return {
    type: "FeatureCollection",
    features: sessions.map((s) => ({
      type: "Feature" as const,
      geometry: {
        type: "Point" as const,
        coordinates: [s.lng, s.lat],
      },
      properties: {
        sessionId: s.sessionId,
        pageUrl: s.pageUrl,
      },
    })),
  };
}

export default function Map({ sessions }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const sourceReady = useRef(false);
  const pendingSessions = useRef<VisitorSession[]>(sessions);

  // Keep pending sessions in sync
  pendingSessions.current = sessions;

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
      // Use whatever sessions we have right now (may have arrived before map loaded)
      map.addSource("visitors", {
        type: "geojson",
        data: sessionsToGeoJSON(pendingSessions.current),
      });

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

      sourceReady.current = true;
    });

    mapRef.current = map;
    return () => {
      sourceReady.current = false;
      map.remove();
    };
  }, []);

  // Update data whenever sessions change
  useEffect(() => {
    if (!mapRef.current || !sourceReady.current) return;
    const source = mapRef.current.getSource("visitors") as
      | maplibregl.GeoJSONSource
      | undefined;
    if (source) {
      source.setData(sessionsToGeoJSON(sessions));
    }
  }, [sessions]);

  return (
    <div
      ref={containerRef}
      className="w-full h-full"
      style={{ background: "#0a0a0a" }}
    />
  );
}
