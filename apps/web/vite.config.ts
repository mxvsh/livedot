import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { TanStackRouterVite } from "@tanstack/router-plugin/vite";
import path from "path";

function umamiPlugin() {
  return {
    name: "umami-inject",
    transformIndexHtml(html: string) {
      const url = process.env.VITE_UMAMI_URL;
      const id = process.env.VITE_UMAMI_WEBSITE_ID;
      if (!url || !id) return html;
      const tag = `<script defer src="${url}/script.js" data-website-id="${id}"></script>`;
      return html.replace("</head>", `  ${tag}\n  </head>`);
    },
  };
}

export default defineConfig({
  plugins: [TanStackRouterVite(), react(), tailwindcss(), umamiPlugin()],
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
