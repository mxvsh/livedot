import "./index.css";

if (window.location.pathname.startsWith("/embed")) {
  document.documentElement.classList.add("embed");
} else {
  document.documentElement.classList.add("dark");
  document.documentElement.setAttribute("data-theme", "dark");
}

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider, createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";
import { api } from "./lib/api";

const router = createRouter({ routeTree });

if (!window.location.pathname.startsWith("/embed")) {
  api.getMeta().then(({ analytics }) => {
    if (analytics.umami) {
      const s = document.createElement("script");
      s.defer = true;
      s.src = `${analytics.umami.url}/script.js`;
      s.dataset.websiteId = analytics.umami.websiteId;
      document.head.appendChild(s);
    }
    if (analytics.livedot) {
      const s = document.createElement("script");
      s.defer = true;
      s.src = `${analytics.livedot.url}/t.js`;
      s.dataset.website = analytics.livedot.websiteId;
      document.head.appendChild(s);
    }
  });
}

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>
);
