import { stubFetch } from "../_test/fetch.helper";
import { decodeImage } from "./imageDecode.service";

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

describe("decodeImage", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("decodes the fetched bytes without colour or alpha conversion", async () => {
    const fetchMock = stubFetch();
    const drawImage = vi.fn();
    const { createImageBitmap, close } = stubCanvas({
      drawImage,
      getImageData: () => ({ data: pixels }),
    });

    await expect(decodeImage("/a.png")).resolves.toEqual({
      data: pixels,
      width: 1,
      height: 1,
    });
    expect(fetchMock).toHaveBeenCalledWith("/a.png");
    expect(createImageBitmap).toHaveBeenCalledWith(expect.any(Blob), {
      colorSpaceConversion: "none",
      premultiplyAlpha: "none",
    });
    expect(drawImage).toHaveBeenCalledWith(expect.anything(), 0, 0);
    expect(close).toHaveBeenCalled();
  });

  it("fails on an error response", async () => {
    stubFetch({}, { status: 404 });

    await expect(decodeImage("/a.png")).rejects.toThrow(
      "Cannot load /a.png: 404",
    );
  });

  it("fails without a 2d context", async () => {
    stubFetch();
    stubCanvas(null);

    await expect(decodeImage("/a.png")).rejects.toThrow("No 2d context");
  });
});
