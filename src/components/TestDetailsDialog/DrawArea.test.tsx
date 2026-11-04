import type { Dispatch, ReactNode, SetStateAction } from "react";
import { fireEvent, screen } from "@testing-library/react";
import { renderWithProviders } from "../../_test/render";
import { IgnoreArea } from "../../types/ignoreArea";
import type { NoiseRegion } from "../../types";
import { theme } from "../../theme";
import { DrawArea } from "./DrawArea";

// Konva needs native canvas under Node, so the stage is a stand-in: only container() is used
vi.mock("react-konva", async () => {
  const { forwardRef, useImperativeHandle, useRef, createElement } =
    await import("react");
  const Stage = forwardRef<unknown, { children?: ReactNode }>(
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
  const Layer = ({ children }: { children?: ReactNode }) =>
    createElement("div", null, children);
  const Rect = (props: object) =>
    createElement("div", {
      "data-testid": "rect",
      "data-props": JSON.stringify(props),
    });
  return { Stage, Layer, Image: Nothing, Rect, Transformer: Nothing };
});

const AREA: IgnoreArea = { id: "area", x: 1, y: 2, width: 30, height: 40 };
const image = Object.assign(document.createElement("img"), {
  width: 100,
  height: 80,
});
const stageState = () =>
  [{ x: 0, y: 0 }, vi.fn()] as [
    { x: number; y: number },
    Dispatch<SetStateAction<{ x: number; y: number }>>,
  ];

const drawArea = (
  deleteIgnoreArea: (id: string) => void,
  hintAreas?: NoiseRegion[],
) => (
  <DrawArea
    imageName="image.png"
    imageState={[image, "loaded"]}
    ignoreAreas={[AREA]}
    tempIgnoreAreas={[]}
    hintAreas={hintAreas}
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

  describe("hint areas", () => {
    const REGIONS: NoiseRegion[] = [
      { x: 10, y: 20, width: 30, height: 40, weight: 0.9 },
      { x: 50, y: 5, width: 6, height: 7, weight: 0.2 },
    ];
    const rects = () =>
      screen
        .queryAllByTestId("rect")
        .map(
          (rect) =>
            JSON.parse(rect.dataset.props ?? "{}") as Record<string, unknown>,
        );
    const hintRects = () =>
      rects().filter((rect) => rect.stroke === theme.palette.hint.main);

    it("draws each region in the hint colour without taking the pointer or editing", () => {
      renderWithProviders(drawArea(vi.fn(), REGIONS));

      expect(hintRects()).toEqual([
        expect.objectContaining({
          x: 10,
          y: 20,
          width: 30,
          height: 40,
          listening: false,
          fill: theme.palette.hint.main,
        }),
        expect.objectContaining({ x: 50, y: 5, width: 6, height: 7 }),
      ]);
      expect(hintRects().some((rect) => rect.draggable)).toBe(false);
    });

    it("draws nothing extra without regions", () => {
      renderWithProviders(drawArea(vi.fn()));

      expect(hintRects()).toEqual([]);
      expect(rects()).toHaveLength(1);
    });
  });
});
