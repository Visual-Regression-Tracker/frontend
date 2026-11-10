import type Konva from "konva";
import { render } from "@testing-library/react";
import Rectangle, { MIN_RECT_SIDE_PIXEL } from "./Rectangle";

type Props = Record<string, unknown>;
type Box = { x: number; y: number; width: number; height: number };

type Size = { width: number; height: number };

const konva = vi.hoisted(() => {
  const state: {
    rect: Props;
    transformer: Props | undefined;
    layer: Size | null;
    node: {
      scale: { x: number; y: number };
      position: { x: number; y: number };
      size: Size;
    };
    nodes: ReturnType<typeof vi.fn>;
  } = {
    rect: {},
    transformer: undefined,
    layer: { width: 100, height: 80 },
    node: {
      scale: { x: 1, y: 1 },
      position: { x: 0, y: 0 },
      size: { width: 10, height: 10 },
    },
    nodes: vi.fn(),
  };
  return state;
});

vi.mock("react-konva", async () => {
  const { forwardRef, useImperativeHandle } = await import("react");
  const layer = () =>
    konva.layer && { getSize: () => konva.layer, batchDraw: vi.fn() };
  const Rect = forwardRef<unknown, Props>((props, ref) => {
    konva.rect = props;
    const { node } = konva;
    useImperativeHandle(ref, () => ({
      width: () => node.size.width,
      height: () => node.size.height,
      x: () => node.position.x,
      y: () => node.position.y,
      scaleX: (value?: number) => {
        if (value === undefined) return node.scale.x;
        node.scale.x = value;
      },
      scaleY: (value?: number) => {
        if (value === undefined) return node.scale.y;
        node.scale.y = value;
      },
      getLayer: layer,
    }));
    return null;
  });
  const Transformer = forwardRef<unknown, Props>((props, ref) => {
    konva.transformer = props;
    useImperativeHandle(ref, () => ({ nodes: konva.nodes, getLayer: layer }));
    return null;
  });
  return { Rect, Transformer };
});

const SHAPE = { x: 1, y: 2, width: 30, height: 40 };

const rect = () =>
  konva.rect as Konva.RectConfig & {
    dragBoundFunc?: (pos: { x: number; y: number }) => {
      x: number;
      y: number;
    };
    onDragEnd?: (event: unknown) => void;
    onTransformEnd?: () => void;
    onMouseOver?: () => void;
    onMouseDown?: () => void;
    onMouseUp?: () => void;
    onMouseLeave?: () => void;
  };
const boundBox = (oldBox: Box, newBox: Box) =>
  (konva.transformer as { boundBoxFunc: (a: Box, b: Box) => Box }).boundBoxFunc(
    oldBox,
    newBox,
  );

const renderEditable = (onChange = vi.fn(), isSelected = false) => {
  render(
    <Rectangle
      shapeProps={SHAPE}
      isSelected={isSelected}
      onSelect={vi.fn()}
      onChange={onChange}
    />,
  );
  return onChange;
};

beforeEach(() => {
  konva.transformer = undefined;
  konva.layer = { width: 100, height: 80 };
  konva.node.scale = { x: 1, y: 1 };
  konva.node.position = { x: 0, y: 0 };
  konva.node.size = { width: 10, height: 10 };
});

describe("Rectangle", () => {
  it("is shown only, without drag or edit handlers, when it cannot change", () => {
    render(<Rectangle shapeProps={SHAPE} />);

    expect(rect()).toMatchObject({ ...SHAPE, draggable: false });
    expect(rect().onDragEnd).toBeUndefined();
    expect(rect().dragBoundFunc).toBeUndefined();
    expect(konva.transformer).toBeUndefined();
  });

  it("keeps a drag inside the layer", () => {
    renderEditable();

    expect(rect().draggable).toBe(true);
    expect(rect().dragBoundFunc?.({ x: -5, y: -1 })).toEqual({ x: 0, y: 0 });
    expect(rect().dragBoundFunc?.({ x: 500, y: 500 })).toEqual({
      x: 90,
      y: 70,
    });
    expect(rect().dragBoundFunc?.({ x: 20, y: 30 })).toEqual({ x: 20, y: 30 });
  });

  it("lets a drag go where it wants without a layer", () => {
    konva.layer = null;
    renderEditable();

    expect(rect().dragBoundFunc?.({ x: 500, y: -5 })).toEqual({
      x: 500,
      y: -5,
    });
  });

  it("reports where a drag ended", () => {
    const onChange = renderEditable();

    rect().onDragEnd?.({ target: { x: () => 7, y: () => 9 } });

    expect(onChange).toHaveBeenCalledWith({ ...SHAPE, x: 7, y: 9 });
  });

  it("folds the transformer's scale into the size, never below the minimum side", () => {
    const onChange = renderEditable();
    konva.node.position = { x: 3, y: 4 };
    konva.node.scale = { x: 2, y: 0.1 };

    rect().onTransformEnd?.();

    expect(onChange).toHaveBeenCalledWith({
      ...SHAPE,
      x: 3,
      y: 4,
      width: 20,
      height: MIN_RECT_SIDE_PIXEL,
    });
    expect(konva.node.scale).toEqual({ x: 1, y: 1 });
  });

  it("shows a pointer, grabbing and grab cursor while handled", () => {
    renderEditable();

    rect().onMouseOver?.();
    expect(document.body.style.cursor).toBe("pointer");
    rect().onMouseDown?.();
    expect(document.body.style.cursor).toBe("grabbing");
    rect().onMouseUp?.();
    expect(document.body.style.cursor).toBe("grab");
    rect().onMouseLeave?.();
    expect(document.body.style.cursor).toBe("default");
  });

  describe("when selected", () => {
    const OLD = { x: 0, y: 0, width: 20, height: 20 };

    it("attaches the transformer to the shape", () => {
      renderEditable(vi.fn(), true);

      expect(konva.nodes).toHaveBeenCalledTimes(1);
    });

    it("keeps a resize inside the layer", () => {
      renderEditable(vi.fn(), true);

      expect(boundBox(OLD, { x: 90, y: 70, width: 50, height: 50 })).toEqual({
        x: 90,
        y: 70,
        width: 10,
        height: 10,
      });
    });

    it("refuses a resize below the minimum side", () => {
      renderEditable(vi.fn(), true);

      expect(boundBox(OLD, { x: 0, y: 0, width: 2, height: 50 })).toBe(OLD);
    });

    it("takes a resize as it is without a layer", () => {
      konva.layer = null;
      renderEditable(vi.fn(), true);
      const box = { x: 500, y: 0, width: 50, height: 50 };

      expect(boundBox(OLD, box)).toBe(box);
    });
  });
});
