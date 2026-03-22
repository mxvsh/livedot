import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { TanStackRouterVite } from "@tanstack/router-plugin/vite";
import path from "path";

function analyticsPlugin() {
  return {
    name: "analytics-inject",
    transformIndexHtml(html: string) {
      const tags: string[] = [];

      const umamiUrl = process.env.VITE_UMAMI_URL;
      const umamiId = process.env.VITE_UMAMI_WEBSITE_ID;
      if (umamiUrl && umamiId) {
        tags.push(`<script defer src="${umamiUrl}/script.js" data-website-id="${umamiId}"></script>`);
      }

      const livedotUrl = process.env.VITE_LIVEDOT_URL;
      const livedotId = process.env.VITE_LIVEDOT_WEBSITE_ID;
      if (livedotUrl && livedotId) {
        tags.push(`<script defer src="${livedotUrl}/t.js" data-website="${livedotId}"></script>`);
      }

      if (!tags.length) return html;
      return html.replace("</head>", `  ${tags.join("\n    ")}\n  </head>`);
    },
  };
}

export default defineConfig({
  plugins: [TanStackRouterVite(), react(), tailwindcss(), analyticsPlugin()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    port: 5173,
    proxy: {
      "/api": "http://localhost:5550",
      "/ws": { target: "http://localhost:5550", ws: true },
      "/t.js": "http://localhost:5550",
    },
  },
});
