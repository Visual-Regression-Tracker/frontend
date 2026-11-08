import { pngSize, renderNoiselessDiff } from "./noiselessDiff.helper";

describe("renderNoiselessDiff", () => {
  it("paints kept pixels red over the faded grey baseline", () => {
    const baseline = {
      data: new Uint8ClampedArray([0, 0, 0, 255, 255, 255, 255, 255]),
      width: 2,
      height: 1,
    };

    const { data, width, height } = renderNoiselessDiff(
      baseline,
      Uint8Array.from([1, 0]),
    );

    expect([width, height]).toEqual([2, 1]);
    expect(Array.from(data)).toEqual([255, 0, 0, 255, 255, 255, 255, 255]);
  });

  it("fades a black unchanged pixel like pixelmatch does", () => {
    const { data } = renderNoiselessDiff(
      { data: new Uint8ClampedArray([0, 0, 0, 255]), width: 1, height: 1 },
      new Uint8Array(1),
    );

    expect(Array.from(data)).toEqual([230, 230, 230, 255]);
  });
});

describe("pngSize", () => {
  const header = (signature = 137) => {
    const bytes = new Uint8Array(24);
    bytes.set([signature, 80, 78, 71, 13, 10, 26, 10]);
    const view = new DataView(bytes.buffer);
    view.setUint32(16, 1280);
    view.setUint32(20, 800);
    return bytes;
  };

  it("reads the size from the IHDR chunk", () => {
    expect(pngSize(header())).toEqual({ width: 1280, height: 800 });
  });

  it("is null for something that is not a PNG", () => {
    expect(pngSize(header(0))).toBeNull();
    expect(pngSize(header().subarray(0, 10))).toBeNull();
  });
});
