import "@testing-library/jest-dom/vitest";
import { configure } from "@testing-library/react";

// findBy/waitFor's 1s default is exceeded on a busy CI runner while MUI renders a dialog
configure({ asyncUtilTimeout: 5000 });

// jsdom has no matchMedia; MUI's useMediaQuery and the colour mode read it
if (!window.matchMedia) {
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => undefined,
      removeListener: () => undefined,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
      dispatchEvent: () => false,
    }),
  });
}
