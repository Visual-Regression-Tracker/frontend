import { vi } from "vitest";

vi.mock("react-dom/client", () => ({
  createRoot: () => ({ render: vi.fn() }),
}));
vi.mock("./App", () => ({ default: () => null }));

const KEY = "vrt-chunk-reload-at";
const reload = vi.fn();

function preloadError() {
  const event = new Event("vite:preloadError", { cancelable: true });
  window.dispatchEvent(event);
  return event;
}

describe("chunk reload guard", () => {
  beforeAll(async () => {
    document.body.innerHTML = '<div id="root"></div>';
    await import("./index");
  });

  beforeEach(() => {
    sessionStorage.clear();
    vi.stubGlobal("location", { ...window.location, reload });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("reloads once when a chunk is missing", () => {
    const event = preloadError();

    expect(reload).toHaveBeenCalledTimes(1);
    expect(event.defaultPrevented).toBe(true);
    expect(sessionStorage.getItem(KEY)).not.toBeNull();
  });

  it("does not reload again within a minute", () => {
    sessionStorage.setItem(KEY, String(Date.now()));

    const event = preloadError();

    expect(reload).not.toHaveBeenCalled();
    expect(event.defaultPrevented).toBe(false);
  });

  it("reloads again after a minute", () => {
    sessionStorage.setItem(KEY, String(Date.now() - 61_000));

    preloadError();

    expect(reload).toHaveBeenCalledTimes(1);
  });

  it("lets the error surface when storage is blocked", () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("blocked");
    });

    const event = preloadError();

    expect(reload).not.toHaveBeenCalled();
    expect(event.defaultPrevented).toBe(false);
  });
});
