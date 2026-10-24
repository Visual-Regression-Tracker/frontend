import { clampToImage } from "./ignoreArea.helper";

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
