import type { RawImage } from "../../_helpers/solidMask.helper";
import { decodeImage } from "../../services/imageDecode.service";
import type { SolidMaskRequest } from "./solidMask.client";
import "./solidMask.worker";

vi.mock("../../services/imageDecode.service", () => ({
  decodeImage: vi.fn(),
}));

const grey = (
  width: number,
  height: number,
  level: number,
  alpha = 255,
): RawImage => {
  const data = new Uint8ClampedArray(width * height * 4).fill(level);
  for (let i = 3; i < data.length; i += 4) data[i] = alpha;
  return { data, width, height };
};

const image = (width: number, level: number, alpha = 255) =>
  grey(width, 1, level, alpha);

async function answerTo(
  baseline: RawImage,
  checkpoint: RawImage,
  ignoreAreas?: SolidMaskRequest["ignoreAreas"],
) {
  vi.mocked(decodeImage)
    .mockResolvedValueOnce(baseline)
    .mockResolvedValueOnce(checkpoint);
  return dispatch(ignoreAreas);
}

async function dispatch(ignoreAreas?: SolidMaskRequest["ignoreAreas"]) {
  const postMessage = vi
    .spyOn(self, "postMessage")
    .mockImplementation(() => {});
  const before = postMessage.mock.calls.length;
  self.onmessage?.(
    new MessageEvent("message", {
      data: { baselineUrl: "/b.png", imageUrl: "/i.png", ignoreAreas },
    }),
  );
  await vi.waitFor(() =>
    expect(postMessage.mock.calls.length).toBeGreaterThan(before),
  );
  return postMessage.mock.calls[before] as [unknown, unknown];
}

describe("solidMask worker", () => {
  it("posts the mask and transfers its buffer", async () => {
    const [result, options] = await answerTo(image(3, 200), image(3, 200));

    const { mask } = result as { mask: Uint8Array };
    expect(result).toEqual({ mask: new Uint8Array(3), solidPixels: 0 });
    expect(options).toEqual({ transfer: [mask.buffer] });
  });

  it("reports a semi-transparent image as unavailable", async () => {
    const [result] = await answerTo(image(3, 200), image(3, 200, 254));

    expect(result).toEqual({ unavailable: "transparent" });
  });

  it("reports images of different sizes as unavailable", async () => {
    const [result] = await answerTo(image(3, 200), image(4, 200));

    expect(result).toEqual({ unavailable: "size mismatch" });
  });

  it("posts the error when an image cannot be loaded", async () => {
    vi.mocked(decodeImage).mockRejectedValue(
      new Error("Cannot load /b.png: 404"),
    );

    const [result] = await dispatch();

    expect(result).toEqual({ error: "Cannot load /b.png: 404" });
  });

  it("leaves out changes inside ignore areas", async () => {
    const [all] = await answerTo(grey(20, 20, 200), grey(20, 20, 100));
    const [ignored] = await answerTo(grey(20, 20, 200), grey(20, 20, 100), [
      { x: 0, y: 0, width: 20, height: 20 },
    ]);

    expect(all).toMatchObject({ solidPixels: 400 });
    expect(ignored).toMatchObject({ solidPixels: 0 });
  });

  it("posts a non-Error failure as text", async () => {
    vi.mocked(decodeImage).mockRejectedValue("offline");

    const [result] = await dispatch();

    expect(result).toEqual({ error: "offline" });
  });
});
