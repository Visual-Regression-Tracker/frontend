import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";

// Global styles to override some defaults
import "./index.css";

// bundled, so screenshots do not depend on a font CDN
import "@fontsource-variable/inter";

// After a redeploy an open tab asks for page chunks that are gone; reload to
// pick up the new build instead of leaving a blank page. At most once a
// minute, so a deploy that really lacks a chunk cannot reload forever
window.addEventListener("vite:preloadError", (event) => {
  const key = "vrt-chunk-reload-at";
  try {
    const last = Number(sessionStorage.getItem(key) ?? 0);
    if (Date.now() - last > 60_000) {
      sessionStorage.setItem(key, String(Date.now()));
      event.preventDefault();
      window.location.reload();
    }
  } catch {
    // storage blocked: let the error surface rather than risk a loop
  }
});

createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>,
);
