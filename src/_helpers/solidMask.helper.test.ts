import {
  applyIgnoreAreas,
  isOpaque,
  MAX_MEASURED_PIXELS,
  RawImage,
  SOLID_PARAMS,
  solidMask,
} from "./solidMask.helper";

const blank = (width: number, height: number, grey = 200): RawImage => {
  const data = new Uint8ClampedArray(width * height * 4).fill(grey);
  for (let i = 3; i < data.length; i += 4) data[i] = 255;
  return { data, width, height };
};

const paint = (
  image: RawImage,
  pixels: [number, number][],
  grey: number,
): RawImage => {
  const data = Uint8ClampedArray.from(image.data);
  pixels.forEach(([x, y]) => {
    data.fill(grey, (y * image.width + x) * 4, (y * image.width + x) * 4 + 3);
  });
  return { ...image, data };
};

const square = (from: number, to: number): [number, number][] =>
  Array.from({ length: (to - from) ** 2 }, (_, i) => [
    from + (i % (to - from)),
    from + Math.floor(i / (to - from)),
  ]);

const solidAt = (mask: Uint8Array, width: number, x: number, y: number) =>
  mask[y * width + x];

describe("SOLID_PARAMS", () => {
  it("matches the backend's blur stage", () => {
    expect(SOLID_PARAMS).toEqual({ minChange: 6, keep: 0.9, sigma: 1 });
  });
});

describe("solidMask", () => {
  it("is empty for identical images", () => {
    const result = solidMask(blank(10, 10), blank(10, 10));

    expect(result?.measure).toEqual({
      amplitude: 0,
      solidPixels: 0,
      solidShare: 0,
    });
    expect(result?.mask).toEqual(new Uint8Array(100));
  });

  it("marks the inside of a changed block and leaves its edge", () => {
    const baseline = blank(20, 20);
    const result = solidMask(baseline, paint(baseline, square(5, 15), 100));

    expect(result).not.toBeNull();
    const mask = result?.mask ?? new Uint8Array();
    expect(solidAt(mask, 20, 10, 10)).toBe(1);
    expect(solidAt(mask, 20, 5, 5)).toBe(0);
    expect(solidAt(mask, 20, 2, 2)).toBe(0);
    expect(result?.measure.solidPixels).toBe(
      mask.reduce((sum, bit) => sum + bit, 0),
    );
    expect(result?.measure.solidShare).toBe(
      (result?.measure.solidPixels ?? 0) / 400,
    );
  });

  it("leaves a lone changed pixel, which blurring spreads out", () => {
    const baseline = blank(9, 9);

    const result = solidMask(baseline, paint(baseline, [[4, 4]], 0));

    expect(result?.measure.solidPixels).toBe(0);
    expect(result?.measure.amplitude).toBeGreaterThan(0);
  });

  it("leaves a block whose change is below the minimum", () => {
    const baseline = blank(20, 20);

    const result = solidMask(
      baseline,
      paint(baseline, square(5, 15), 200 - SOLID_PARAMS.minChange + 1),
    );

    expect(result?.measure.solidPixels).toBe(0);
  });

  it("ignores a colour change hidden by full transparency", () => {
    const baseline = blank(4, 4);
    baseline.data[3] = 0;
    const image = paint(baseline, [[0, 0]], 0);

    expect(solidMask(baseline, image)?.measure.amplitude).toBe(0);
  });

  it("rejects images of different sizes", () => {
    expect(() => solidMask(blank(4, 4), blank(4, 5))).toThrow(
      "Cannot blur-compare 4x4 with 4x5",
    );
  });

  it("gives up when the changed area is too large", () => {
    const width = 4001;
    const height = Math.ceil(MAX_MEASURED_PIXELS / width) + 1;
    const baseline = blank(width, height);
    const image = paint(
      baseline,
      [
        [0, 0],
        [width - 1, height - 1],
      ],
      0,
    );

    expect(solidMask(baseline, image)).toBeNull();
  });
});

describe("isOpaque", () => {
  it("is true when every pixel has full alpha", () => {
    expect(isOpaque(blank(3, 3))).toBe(true);
  });

  it("is false when any pixel is semi-transparent", () => {
    const image = blank(3, 3);
    image.data[4 * 8 + 3] = 254;

    expect(isOpaque(image)).toBe(false);
  });
});

describe("applyIgnoreAreas", () => {
  const alphaRow = (image: RawImage, y: number) =>
    Array.from(
      { length: image.width },
      (_, x) => image.data[(y * 4 + x) * 4 + 3],
    );

  it("zeroes the covered pixels, widened to whole pixels and clipped to the image", () => {
    const image = applyIgnoreAreas(blank(4, 4), [
      { x: 2.5, y: -1, width: 9, height: 1.2 },
    ]);

    expect(alphaRow(image, 0)).toEqual([255, 255, 0, 0]);
    expect(alphaRow(image, 1)).toEqual([255, 255, 255, 255]);
    expect(Array.from(image.data.subarray(8, 12))).toEqual([0, 0, 0, 0]);
  });

  it("skips areas outside the image or without size", () => {
    const image = applyIgnoreAreas(blank(4, 4), [
      { x: 5, y: 0, width: 2, height: 2 },
      { x: 1, y: 1, width: 0, height: 2 },
    ]);

    expect(isOpaque(image)).toBe(true);
  });
});
