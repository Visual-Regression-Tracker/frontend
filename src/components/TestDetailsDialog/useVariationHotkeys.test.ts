import { fireEvent } from "@testing-library/react";
import { renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useVariationHotkeys } from "./useVariationHotkeys";

const setup = (preview: { index: number; showDiff: boolean } | null) => {
  const props = {
    preview,
    step: vi.fn(),
    setPreviewDiff: vi.fn(),
    toggleShowDiff: vi.fn(),
  };
  renderHook(() => useVariationHotkeys(props));
  return props;
};

describe("useVariationHotkeys", () => {
  it("toggles the grid diff with D when no preview is open", () => {
    const props = setup(null);
    fireEvent.keyDown(window, { key: "d" });
    expect(props.toggleShowDiff).toHaveBeenCalledOnce();
    expect(props.setPreviewDiff).not.toHaveBeenCalled();
  });

  it("toggles the preview diff with D when a preview is open", () => {
    const props = setup({ index: 0, showDiff: true });
    fireEvent.keyDown(window, { key: "D" });
    expect(props.setPreviewDiff).toHaveBeenCalledWith(false);
    expect(props.toggleShowDiff).not.toHaveBeenCalled();
  });

  it("steps the preview with the arrows", () => {
    const props = setup({ index: 1, showDiff: true });
    fireEvent.keyDown(window, { key: "ArrowLeft" });
    fireEvent.keyDown(window, { key: "ArrowRight" });
    expect(props.step).toHaveBeenNthCalledWith(1, -1);
    expect(props.step).toHaveBeenNthCalledWith(2, 1);
  });

  it("ignores the arrows without a preview", () => {
    const props = setup(null);
    fireEvent.keyDown(window, { key: "ArrowRight" });
    expect(props.step).not.toHaveBeenCalled();
  });

  it("keeps swallowed keys from reaching the page behind", () => {
    setup(null);
    const behind = vi.fn();
    document.addEventListener("keydown", behind);
    fireEvent.keyDown(document.body, { key: "a" });
    document.removeEventListener("keydown", behind);
    expect(behind).not.toHaveBeenCalled();
  });

  it("lets other keys through", () => {
    setup(null);
    const behind = vi.fn();
    document.addEventListener("keydown", behind);
    fireEvent.keyDown(document.body, { key: "q" });
    document.removeEventListener("keydown", behind);
    expect(behind).toHaveBeenCalledOnce();
  });
});
