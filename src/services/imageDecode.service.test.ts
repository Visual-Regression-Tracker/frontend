import { stubFetch } from "../_test/fetch.helper";
import {
  decodeImage,
  encodePng,
  fetchImage,
  readImageSize,
} from "./imageDecode.service";

const pixels = new Uint8ClampedArray([1, 2, 3, 255]);

function stubCanvas(context: object | null) {
  const close = vi.fn();
  const createImageBitmap = vi.fn().mockResolvedValue({
    width: 1,
    height: 1,
    close,
  });
  vi.stubGlobal("createImageBitmap", createImageBitmap);
  vi.stubGlobal(
    "OffscreenCanvas",
    class {
      getContext = () => context;
    },
  );
  return { createImageBitmap, close };
}

afterEach(() => vi.unstubAllGlobals());

describe("fetchImage", () => {
  it("returns the fetched bytes", async () => {
    const fetchMock = stubFetch("png");

    const blob = await fetchImage("/a.png");

    expect(await blob.text()).toBe('"png"');
    expect(fetchMock).toHaveBeenCalledWith("/a.png");
  });

  it("fails on an error response", async () => {
    stubFetch({}, { status: 404 });

    await expect(fetchImage("/a.png")).rejects.toThrow(
      "Cannot load /a.png: 404",
    );
  });
});

describe("readImageSize", () => {
  it("reads a PNG's size from its header alone", async () => {
    const header = new Uint8Array(40);
    header.set([137, 80, 78, 71, 13, 10, 26, 10]);
    new DataView(header.buffer).setUint32(16, 3);
    new DataView(header.buffer).setUint32(20, 2);

    await expect(readImageSize(new Blob([header]))).resolves.toEqual({
      width: 3,
      height: 2,
    });
  });
});

describe("decodeImage", () => {
  it("decodes without colour or alpha conversion", async () => {
    const drawImage = vi.fn();
    const { createImageBitmap, close } = stubCanvas({
      drawImage,
      getImageData: () => ({ data: pixels }),
    });
    const blob = new Blob(["png"]);

    await expect(decodeImage(blob)).resolves.toEqual({
      data: pixels,
      width: 1,
      height: 1,
    });
    expect(createImageBitmap).toHaveBeenCalledWith(blob, {
      colorSpaceConversion: "none",
      premultiplyAlpha: "none",
    });
    expect(drawImage).toHaveBeenCalledWith(expect.anything(), 0, 0);
    expect(close).toHaveBeenCalled();
  });

  it("fails without a 2d context", async () => {
    stubCanvas(null);

    await expect(decodeImage(new Blob(["png"]))).rejects.toThrow(
      "No 2d context",
    );
  });
});

describe("encodePng", () => {
  it("puts the pixels on a canvas and encodes it as PNG", async () => {
    const encoded = new Blob(["encoded"]);
    const putImageData = vi.fn();
    const convertToBlob = vi.fn().mockResolvedValue(encoded);
    stubCanvas({ putImageData, canvas: { convertToBlob } });
    vi.stubGlobal(
      "ImageData",
      class {
        constructor(
          readonly data: Uint8ClampedArray,
          readonly width: number,
          readonly height: number,
        ) {}
      },
    );

    await expect(
      encodePng({ data: pixels, width: 1, height: 1 }),
    ).resolves.toBe(encoded);
    expect(putImageData).toHaveBeenCalledWith(
      { data: pixels, width: 1, height: 1 },
      0,
      0,
    );
    expect(convertToBlob).toHaveBeenCalledWith({ type: "image/png" });
  });
});
