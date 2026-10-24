import { clampToImage, invertIgnoreArea } from "./ignoreArea.helper";

const withoutIds = (areas: ReturnType<typeof invertIgnoreArea>) =>
  areas.map(({ x, y, width, height }) => ({ x, y, width, height }));

const area = { id: "keep", x: 20, y: 10, width: 30, height: 40 };

describe("invertIgnoreArea", () => {
  it("answers nothing when there is no area to invert", () => {
    expect(invertIgnoreArea(100, 100)).toEqual([]);
    expect(invertIgnoreArea(100, 100, undefined)).toEqual([]);
  });

  it("covers the image around the area with eight rectangles", () => {
    // 100 x 100 image with the area at x 20..50, y 10..50
    expect(withoutIds(invertIgnoreArea(100, 100, area))).toEqual([
      // top row: left, middle, right
      { x: 0, y: 0, width: 20, height: 10 },
      { x: 20, y: 0, width: 30, height: 10 },
      { x: 50, y: 0, width: 50, height: 10 },
      // middle row: left and right of the area
      { x: 0, y: 10, width: 20, height: 40 },
      { x: 50, y: 10, width: 50, height: 40 },
      // bottom row: left, middle, right
      { x: 0, y: 50, width: 20, height: 50 },
      { x: 20, y: 50, width: 30, height: 50 },
      { x: 50, y: 50, width: 50, height: 50 },
    ]);
  });

  it("covers everything but the area", () => {
    const rectangles = invertIgnoreArea(100, 80, area);
    const covered = rectangles.reduce((sum, r) => sum + r.width * r.height, 0);

    expect(covered).toBe(100 * 80 - area.width * area.height);
  });

  it("gives every rectangle its own id, none of them the area's", () => {
    const ids = invertIgnoreArea(100, 100, area).map((r) => r.id);

    expect(new Set(ids).size).toBe(8);
    expect(ids).not.toContain("keep");
  });

  it("gives new ids on every call", () => {
    const first = invertIgnoreArea(100, 100, area).map((r) => r.id);
    const second = invertIgnoreArea(100, 100, area).map((r) => r.id);

    expect(first.filter((id) => second.includes(id))).toEqual([]);
  });

  it("leaves zero-sized rectangles for an area in the corner", () => {
    const rectangles = withoutIds(
      invertIgnoreArea(100, 100, {
        id: "a",
        x: 0,
        y: 0,
        width: 100,
        height: 100,
      }),
    );

    expect(rectangles.every((r) => r.width === 0 || r.height === 0)).toBe(true);
  });

  // NOTE: an area reaching past the image is not clipped, it yields negative sizes
  it("yields negative sizes for an area reaching past the image", () => {
    const rectangles = withoutIds(
      invertIgnoreArea(100, 100, {
        id: "a",
        x: 80,
        y: 80,
        width: 50,
        height: 50,
      }),
    );

    expect(rectangles.some((r) => r.width < 0 || r.height < 0)).toBe(true);
  });
});

describe("clampToImage", () => {
  const area = { id: "1", x: 10, y: 20, width: 30, height: 40 };

  it("leaves an area inside the image as it is", () => {
    expect(clampToImage(area, 100, 100)).toEqual(area);
  });

  it("leaves an area that touches the borders as it is", () => {
    const full = { ...area, x: 0, y: 0, width: 100, height: 50 };

    expect(clampToImage(full, 100, 50)).toEqual(full);
  });

  it("pulls the right and bottom edges back onto the borders", () => {
    expect(
      clampToImage({ ...area, x: 80, y: 30, width: 50, height: 40 }, 100, 50),
    ).toEqual({ ...area, x: 80, y: 30, width: 20, height: 20 });
  });

  it("pulls the left and top edges back onto the borders, keeping the others", () => {
    expect(
      clampToImage({ ...area, x: -15, y: -5, width: 40, height: 30 }, 100, 50),
    ).toEqual({ ...area, x: 0, y: 0, width: 25, height: 25 });
  });

  it("trims an area wider and taller than the image to the image", () => {
    expect(
      clampToImage(
        { ...area, x: -10, y: -10, width: 200, height: 200 },
        100,
        50,
      ),
    ).toEqual({ ...area, x: 0, y: 0, width: 100, height: 50 });
  });

  it("keeps the fields it does not know about", () => {
    const box = { x: 90, y: 0, width: 20, height: 10, rotation: 0 };

    expect(clampToImage(box, 100, 50)).toEqual({ ...box, width: 10 });
  });
});
