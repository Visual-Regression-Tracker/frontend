import { act, renderHook } from "@testing-library/react";
import type Konva from "konva";
import { describe, expect, it, vi } from "vitest";
import { MIN_RECT_SIDE_PIXEL } from "../Rectangle";
import type { IgnoreArea } from "../../types/ignoreArea";
import { useIgnoreAreaDrawing } from "./useIgnoreAreaDrawing";

const pointer = (offsetX: number, offsetY: number) =>
  ({ evt: { offsetX, offsetY } }) as Konva.KonvaEventObject<MouseEvent>;

const area = (overrides: Partial<IgnoreArea> = {}): IgnoreArea => ({
  id: "a1",
  x: 10,
  y: 20,
  width: MIN_RECT_SIDE_PIXEL,
  height: MIN_RECT_SIDE_PIXEL,
  ...overrides,
});

const setup = ({
  isDrawMode = true,
  ignoreAreas = [] as IgnoreArea[],
  selectedRectId = undefined as string | undefined,
} = {}) => {
  const container = document.createElement("div");
  const props = {
    stageRef: { current: { container: () => container } as Konva.Stage },
    isDrawMode,
    setIsDrawMode: vi.fn(),
    ignoreAreas,
    setIgnoreAreas: vi.fn(),
    selectedRectId,
    setSelectedRectId: vi.fn(),
    stageWidth: 200,
    stageHeight: 100,
  };
  const { result } = renderHook(() => useIgnoreAreaDrawing(props));
  return { props, container, result };
};

describe("useIgnoreAreaDrawing", () => {
  it("makes the stage focusable on mouse down", () => {
    const { container, result } = setup({ isDrawMode: false });
    act(() => result.current.handleContentMousedown(pointer(1, 1)));
    expect(container.tabIndex).toBe(1);
  });

  it("starts no area outside draw mode", () => {
    const { props, result } = setup({ isDrawMode: false });
    act(() => result.current.handleContentMousedown(pointer(1, 1)));
    expect(props.setIgnoreAreas).not.toHaveBeenCalled();
  });

  it("starts the smallest area at the pointer in draw mode and selects it", () => {
    const existing = area({ id: "old" });
    const { props, result } = setup({ ignoreAreas: [existing] });
    act(() => result.current.handleContentMousedown(pointer(30, 40)));
    const [areas] = props.setIgnoreAreas.mock.calls[0] as [IgnoreArea[]];
    expect(areas[0]).toBe(existing);
    expect(areas[1]).toMatchObject({
      x: 30,
      y: 40,
      width: MIN_RECT_SIDE_PIXEL,
      height: MIN_RECT_SIDE_PIXEL,
    });
    expect(props.setSelectedRectId).toHaveBeenCalledWith(areas[1].id);
  });

  it("keeps a new area inside the image edge", () => {
    const { props, result } = setup();
    act(() => result.current.handleContentMousedown(pointer(200, 100)));
    const [areas] = props.setIgnoreAreas.mock.calls[0] as [IgnoreArea[]];
    expect(areas[0].x).toBe(200 - MIN_RECT_SIDE_PIXEL);
    expect(areas[0].y).toBe(100 - MIN_RECT_SIDE_PIXEL);
  });

  it("stretches the selected area to the pointer while drawing", () => {
    const other = area({ id: "other", x: 0, y: 0 });
    const { props, result } = setup({
      ignoreAreas: [other, area()],
      selectedRectId: "a1",
    });
    act(() => result.current.handleContentMouseMove(pointer(60, 70)));
    const [areas] = props.setIgnoreAreas.mock.calls[0] as [IgnoreArea[]];
    expect(areas[0]).toBe(other);
    expect(areas[1]).toMatchObject({ x: 10, y: 20, width: 50, height: 50 });
  });

  it("never shrinks the area below the minimum side", () => {
    const { props, result } = setup({
      ignoreAreas: [area()],
      selectedRectId: "a1",
    });
    act(() => result.current.handleContentMouseMove(pointer(0, 0)));
    const [areas] = props.setIgnoreAreas.mock.calls[0] as [IgnoreArea[]];
    expect(areas[0].width).toBe(MIN_RECT_SIDE_PIXEL);
    expect(areas[0].height).toBe(MIN_RECT_SIDE_PIXEL);
  });

  it("clamps the stretched area to the image", () => {
    const { props, result } = setup({
      ignoreAreas: [area()],
      selectedRectId: "a1",
    });
    act(() => result.current.handleContentMouseMove(pointer(900, 900)));
    const [areas] = props.setIgnoreAreas.mock.calls[0] as [IgnoreArea[]];
    expect(areas[0].x + areas[0].width).toBeLessThanOrEqual(200);
    expect(areas[0].y + areas[0].height).toBeLessThanOrEqual(100);
  });

  it("ignores moves outside draw mode", () => {
    const { props, result } = setup({
      isDrawMode: false,
      ignoreAreas: [area()],
      selectedRectId: "a1",
    });
    act(() => result.current.handleContentMouseMove(pointer(60, 70)));
    expect(props.setIgnoreAreas).not.toHaveBeenCalled();
  });

  it("leaves draw mode when the pointer is released after drawing", () => {
    const { props, result } = setup();
    act(() => result.current.handleContentMousedown(pointer(30, 40)));
    act(() => result.current.handleContentMouseup());
    expect(props.setIsDrawMode).toHaveBeenCalledWith(false);
  });
});
