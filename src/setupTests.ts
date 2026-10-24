// jest-dom adds DOM matchers such as toBeInTheDocument
// https://github.com/testing-library/jest-dom
import "@testing-library/jest-dom/vitest";
import { configure } from "@testing-library/react";

// findBy/waitFor give up after 1s by default, which a busy CI runner exceeds
// while MUI renders a dialog
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
