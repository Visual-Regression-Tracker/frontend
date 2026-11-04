import type { RawImage } from "../../_helpers/solidMask.helper";
import { decodeImage } from "../../services/imageDecode.service";
import "./solidMask.worker";

vi.mock("../../services/imageDecode.service", () => ({
  decodeImage: vi.fn(),
}));

const image = (width: number, grey: number, alpha = 255): RawImage => {
  const data = new Uint8ClampedArray(width * 4).fill(grey);
  for (let i = 3; i < data.length; i += 4) data[i] = alpha;
  return { data, width, height: 1 };
};

async function answerTo(baseline: RawImage, checkpoint: RawImage) {
  vi.mocked(decodeImage)
    .mockResolvedValueOnce(baseline)
    .mockResolvedValueOnce(checkpoint);
  return dispatch();
}

async function dispatch() {
  const postMessage = vi
    .spyOn(self, "postMessage")
    .mockImplementation(() => {});
  self.onmessage?.(
    new MessageEvent("message", {
      data: { baselineUrl: "/b.png", imageUrl: "/i.png" },
    }),
  );
  await vi.waitFor(() => expect(postMessage).toHaveBeenCalled());
  return postMessage.mock.calls[0] as [unknown, unknown];
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
});
