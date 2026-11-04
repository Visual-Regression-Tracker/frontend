import { isOpaque, solidMask } from "../../_helpers/solidMask.helper";
import { decodeImage } from "../../services/imageDecode.service";
import type { SolidMaskRequest, SolidMaskResult } from "./solidMask.client";

async function compute({
  baselineUrl,
  imageUrl,
}: SolidMaskRequest): Promise<SolidMaskResult> {
  const [baseline, image] = await Promise.all([
    decodeImage(baselineUrl),
    decodeImage(imageUrl),
  ]);
  if (!isOpaque(baseline) || !isOpaque(image)) {
    return { unavailable: "transparent" };
  }
  if (baseline.width !== image.width || baseline.height !== image.height) {
    return { unavailable: "size mismatch" };
  }
  const result = solidMask(baseline, image);
  return result
    ? { mask: result.mask, solidPixels: result.measure.solidPixels }
    : { unavailable: "too large" };
}

self.onmessage = ({ data }: MessageEvent<SolidMaskRequest>) => {
  compute(data).then(
    (result) =>
      self.postMessage(result, {
        transfer: "mask" in result ? [result.mask.buffer] : [],
      }),
    (error: unknown) =>
      self.postMessage({
        error: error instanceof Error ? error.message : String(error),
      }),
  );
};
