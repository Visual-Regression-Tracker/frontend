import {
  calculateScale,
  clampScale,
  MAX_SCALE,
  MIN_SCALE,
} from "./scale.helper";

describe("clampScale", () => {
  it("allows zooming between a tenth and ten times", () => {
    expect(MIN_SCALE).toBeCloseTo(0.1);
    expect(MAX_SCALE).toBe(10);
  });

  it.each([
    [-5, MIN_SCALE],
    [0, MIN_SCALE],
    [0.05, MIN_SCALE],
    [0.1, 0.1],
    [0.5, 0.5],
    [1, 1],
    [9.99, 9.99],
    [10, 10],
    [10.01, MAX_SCALE],
    [1000, MAX_SCALE],
    [Infinity, MAX_SCALE],
    [-Infinity, MIN_SCALE],
  ])("turns %s into %s", (scale, expected) => {
    expect(clampScale(scale)).toBe(expected);
  });
});

describe("calculateScale", () => {
  it.each([
    // width, height, containerWidth, containerHeight, expected
    ["leaves an image that fits as it is", 100, 100, 200, 200, 1],
    [
      "leaves an image the exact size of the container as it is",
      100,
      50,
      100,
      50,
      1,
    ],
    ["shrinks an image that is too wide", 200, 100, 100, 100, 0.5],
    ["shrinks an image that is too tall", 100, 200, 100, 100, 0.5],
    ["follows the tighter side when both are too big", 400, 100, 200, 25, 0.25],
    ["follows the width when it is the tighter side", 400, 200, 100, 150, 0.25],
    ["never enlarges a small image in a big container", 10, 10, 1000, 1000, 1],
  ])(
    "%s",
    (_name, width, height, containerWidth, containerHeight, expected) => {
      expect(
        calculateScale(width, height, containerWidth, containerHeight),
      ).toBe(expected);
    },
  );
});
