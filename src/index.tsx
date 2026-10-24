import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";

// Global styles to override some defaults
import "./index.css";

// bundled, so screenshots do not depend on a font CDN
import "@fontsource-variable/inter";

// After a redeploy an open tab asks for page chunks that are gone; reload
// once to pick up the new build instead of leaving a blank page
window.addEventListener("vite:preloadError", (event) => {
  const key = "vrt-chunk-reload";
  if (sessionStorage.getItem(key) !== "done") {
    sessionStorage.setItem(key, "done");
    event.preventDefault();
    window.location.reload();
  }
});
window.addEventListener("load", () =>
  sessionStorage.removeItem("vrt-chunk-reload"),
);

createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>,
);
