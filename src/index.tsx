import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";

import "./index.css";

// bundled, so screenshots do not depend on a font CDN
import "@fontsource-variable/inter";

// After a redeploy old chunks are gone: reload at most once a minute, so a chunk that is really missing cannot loop
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
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
);
