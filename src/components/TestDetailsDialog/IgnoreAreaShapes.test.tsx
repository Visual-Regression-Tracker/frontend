import type Konva from "konva";
import { render } from "@testing-library/react";
import { IgnoreArea } from "../../types/ignoreArea";
import { MIN_RECT_SIDE_PIXEL } from "../Rectangle";
import { IgnoreAreaShapes } from "./IgnoreAreaShapes";

type RectangleProps = {
  shapeProps: Konva.NodeConfig;
  isSelected?: boolean;
  onSelect?: () => void;
  onChange?: (config: Konva.RectConfig) => void;
};

const shown = vi.hoisted(() => ({ rects: [] as RectangleProps[] }));

vi.mock("../Rectangle", () => ({
  MIN_RECT_SIDE_PIXEL: 5,
  default: (props: RectangleProps) => {
    shown.rects.push(props);
    return null;
  },
}));

const FIRST: IgnoreArea = { id: "a", x: 1, y: 2, width: 30, height: 40 };
const SECOND: IgnoreArea = { id: "b", x: 50, y: 5, width: 6, height: 7 };
const TEMP: IgnoreArea = { id: "t", x: 9, y: 9, width: 9, height: 9 };

const renderShapes = (readOnly: boolean) => {
  shown.rects = [];
  const setSelectedRectId = vi.fn();
  const setIgnoreAreas = vi.fn();
  render(
    <IgnoreAreaShapes
      ignoreAreas={[FIRST, SECOND]}
      tempIgnoreAreas={[TEMP]}
      readOnly={readOnly}
      selectedRectId={SECOND.id}
      setSelectedRectId={setSelectedRectId}
      setIgnoreAreas={setIgnoreAreas}
      stageWidth={100}
      stageHeight={80}
    />,
  );
  return { setSelectedRectId, setIgnoreAreas };
};

describe("IgnoreAreaShapes", () => {
  it("shows the saved and the uploaded areas without taking the pointer when read only", () => {
    renderShapes(true);

    expect(shown.rects).toHaveLength(3);
    for (const rect of shown.rects) {
      expect(rect.shapeProps.listening).toBe(false);
      expect(rect.onChange).toBeUndefined();
    }
  });

  it("marks the selected area and selects an area on click while editing", () => {
    const { setSelectedRectId } = renderShapes(false);
    const [first, second, temp] = shown.rects;

    expect(first.isSelected).toBe(false);
    expect(second.isSelected).toBe(true);
    expect(temp.shapeProps.listening).toBe(false);

    first.onSelect?.();

    expect(setSelectedRectId).toHaveBeenCalledWith(FIRST.id);
  });

  it("rounds a changed area and keeps it inside the image", () => {
    const { setIgnoreAreas } = renderShapes(false);

    shown.rects[1].onChange?.({ x: 90.4, y: 2.6, width: 20.2, height: 4.5 });

    expect(setIgnoreAreas).toHaveBeenCalledWith([
      FIRST,
      { ...SECOND, x: 90, y: 3, width: 10, height: 5 },
    ]);
  });

  it("falls back to the origin and the minimum side for missing values", () => {
    const { setIgnoreAreas } = renderShapes(false);

    shown.rects[0].onChange?.({});

    expect(setIgnoreAreas).toHaveBeenCalledWith([
      {
        ...FIRST,
        x: 0,
        y: 0,
        width: MIN_RECT_SIDE_PIXEL,
        height: MIN_RECT_SIDE_PIXEL,
      },
      SECOND,
    ]);
  });
});
