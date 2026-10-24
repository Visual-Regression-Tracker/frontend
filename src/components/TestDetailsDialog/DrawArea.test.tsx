import React from "react";
import { fireEvent, screen } from "@testing-library/react";
import { renderWithProviders } from "../../_test/render";
import { IgnoreArea } from "../../types/ignoreArea";
import { DrawArea } from "./DrawArea";

// Konva needs the native canvas package under Node, which jsdom has not got.
// The stage is stood in for by the element it lives in, which is all the
// keyboard handling here touches: stage.container().
vi.mock("react-konva", async () => {
  const { forwardRef, useImperativeHandle, useRef, createElement } =
    await import("react");
  const Stage = forwardRef<unknown, { children?: React.ReactNode }>(
    ({ children }, ref) => {
      const container = useRef<HTMLDivElement>(null);
      useImperativeHandle(ref, () => ({ container: () => container.current }));
      return createElement(
        "div",
        { ref: container, "data-testid": "stage" },
        children,
      );
    },
  );
  const Nothing = () => null;
  return { Stage, Layer: Nothing, Image: Nothing, Rect: Nothing };
});

const AREA: IgnoreArea = { id: "area", x: 1, y: 2, width: 30, height: 40 };
const image = Object.assign(document.createElement("img"), {
  width: 100,
  height: 80,
});
const stageState = () =>
  [{ x: 0, y: 0 }, vi.fn()] as [
    { x: number; y: number },
    React.Dispatch<React.SetStateAction<{ x: number; y: number }>>,
  ];

const drawArea = (deleteIgnoreArea: (id: string) => void) => (
  <DrawArea
    imageName="image.png"
    imageState={[image, "loaded"]}
    ignoreAreas={[AREA]}
    tempIgnoreAreas={[]}
    setIgnoreAreas={vi.fn()}
    selectedRectId={AREA.id}
    setSelectedRectId={vi.fn()}
    deleteIgnoreArea={deleteIgnoreArea}
    onStageClick={vi.fn()}
    stageScaleState={[1, vi.fn()]}
    stagePosState={stageState()}
    stageScrollPosState={stageState()}
    stageInitPosState={stageState()}
    stageOffsetState={stageState()}
    drawModeState={[false, vi.fn()]}
  />
);

describe("DrawArea", () => {
  // jsdom does not scroll, and the pane restores its scroll position on mount
  beforeAll(() => {
    Element.prototype.scrollTo = () => undefined;
  });
  afterAll(() => {
    delete (Element.prototype as Partial<Element>).scrollTo;
  });

  it("deletes the selected area with the Delete key", () => {
    const deleteIgnoreArea = vi.fn();
    renderWithProviders(drawArea(deleteIgnoreArea));

    fireEvent.keyDown(screen.getByTestId("stage"), { key: "Delete" });

    expect(deleteIgnoreArea).toHaveBeenCalledWith(AREA.id);
  });

  it("deletes with only the latest delete handler after re-renders", () => {
    const earlier = [vi.fn(), vi.fn(), vi.fn()];
    const latest = vi.fn();
    const { rerender } = renderWithProviders(drawArea(earlier[0]));
    rerender(drawArea(earlier[1]));
    rerender(drawArea(earlier[2]));
    rerender(drawArea(latest));

    fireEvent.keyDown(screen.getByTestId("stage"), { key: "Delete" });

    earlier.forEach((handler) => expect(handler).not.toHaveBeenCalled());
    expect(latest).toHaveBeenCalledTimes(1);
    expect(latest).toHaveBeenCalledWith(AREA.id);
  });

  it("leaves the area alone when a modifier is held", () => {
    const deleteIgnoreArea = vi.fn();
    renderWithProviders(drawArea(deleteIgnoreArea));

    fireEvent.keyDown(screen.getByTestId("stage"), {
      key: "Delete",
      ctrlKey: true,
    });

    expect(deleteIgnoreArea).not.toHaveBeenCalled();
  });
});
