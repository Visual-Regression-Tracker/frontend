import { act, fireEvent, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useWheelZoom } from "./useWheelZoom";

const ORIGIN = { x: 0, y: 0 };

const setup = (stageScale = 1) => {
  const container = document.createElement("div");
  document.body.appendChild(container);
  const scrollTo = vi.fn();
  container.scrollTo = scrollTo;
  const setStageScale = vi.fn();
  const setScrollPos = vi.fn();
  const rendered = renderHook(() =>
    useWheelZoom({
      containerRef: { current: container },
      stageScale,
      setStageScale,
      stagePos: ORIGIN,
      scrollPos: ORIGIN,
      setScrollPos,
      reattachKey: null,
    }),
  );
  return { container, scrollTo, setStageScale, setScrollPos, ...rendered };
};

describe("useWheelZoom", () => {
  let frames: FrameRequestCallback[];

  beforeEach(() => {
    frames = [];
    vi.spyOn(globalThis, "requestAnimationFrame").mockImplementation((cb) => {
      frames.push(cb);
      return frames.length;
    });
    vi.spyOn(globalThis, "cancelAnimationFrame").mockImplementation(() => {});
  });

  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("scrolls the container to the saved position", () => {
    const { scrollTo } = setup();
    expect(scrollTo).toHaveBeenCalledWith(0, 0);
  });

  it("is not zooming until a wheel turn starts an animation", () => {
    const { result, container } = setup();
    expect(result.current.isZooming()).toBe(false);
    fireEvent.wheel(container, { deltaY: -100 });
    expect(result.current.isZooming()).toBe(true);
  });

  it("zooms in towards a larger scale on wheel up", () => {
    const { container, setStageScale } = setup();
    fireEvent.wheel(container, { deltaY: -100 });
    act(() => frames[0](16));
    expect(setStageScale).toHaveBeenCalledOnce();
    expect(setStageScale.mock.calls[0][0]).toBeGreaterThan(1);
  });

  it("zooms out towards a smaller scale on wheel down", () => {
    const { container, setStageScale } = setup();
    fireEvent.wheel(container, { deltaY: 100 });
    act(() => frames[0](16));
    expect(setStageScale.mock.calls[0][0]).toBeLessThan(1);
  });

  it("keeps the point under the cursor fixed while scrolling", () => {
    const { container, setScrollPos } = setup();
    vi.spyOn(container, "getBoundingClientRect").mockReturnValue(
      new DOMRect(0, 0, 400, 300),
    );
    fireEvent.wheel(container, { deltaY: -100, clientX: 100, clientY: 50 });
    act(() => frames[0](16));
    const [scrollTo] = setScrollPos.mock.calls[0] as [{ x: number; y: number }];
    const scale = 1 + (1.04 - 1) * (1 - Math.exp(-(1000 / 60) / 140));
    expect(scrollTo.x).toBeCloseTo(100 * scale - 100);
    expect(scrollTo.y).toBeCloseTo(50 * scale - 50);
  });

  it("stops animating once the scale has settled", () => {
    const { result, container } = setup();
    fireEvent.wheel(container, { deltaY: -100 });
    act(() => frames[0](16));
    for (let i = 1; i < 200 && frames[i]; i += 1) {
      act(() => frames[i](16 * (i + 1)));
    }
    expect(result.current.isZooming()).toBe(false);
  });

  it("stops listening once unmounted", () => {
    const { container, unmount } = setup();
    unmount();
    fireEvent.wheel(container, { deltaY: -100 });
    expect(frames).toHaveLength(0);
  });
});
