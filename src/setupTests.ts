// jest-dom adds DOM matchers such as toBeInTheDocument
// https://github.com/testing-library/jest-dom
import "@testing-library/jest-dom/vitest";

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
