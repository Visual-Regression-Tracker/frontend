import {
  applyIgnoreAreas,
  isOpaque,
  MAX_MEASURED_PIXELS,
  solidMask,
} from "../../_helpers/solidMask.helper";
import { renderNoiselessDiff } from "../../_helpers/noiselessDiff.helper";
import {
  decodeImage,
  encodePng,
  fetchImage,
  readImageSize,
} from "../../services/imageDecode.service";
import type { SolidMaskRequest, SolidMaskResult } from "./solidMask.client";

async function compute({
  baselineUrl,
  imageUrl,
  ignoreAreas = [],
}: SolidMaskRequest): Promise<SolidMaskResult> {
  const blobs = await Promise.all([
    fetchImage(baselineUrl),
    fetchImage(imageUrl),
  ]);
  const [baselineSize, imageSize] = await Promise.all(blobs.map(readImageSize));
  if (baselineSize && imageSize) {
    if (
      baselineSize.width !== imageSize.width ||
      baselineSize.height !== imageSize.height
    ) {
      return { unavailable: "size mismatch" };
    }
    if (imageSize.width * imageSize.height > MAX_MEASURED_PIXELS) {
      return { unavailable: "too large" };
    }
  }
  const [baseline, image] = await Promise.all(blobs.map(decodeImage));
  if (!isOpaque(baseline) || !isOpaque(image)) {
    return { unavailable: "transparent" };
  }
  if (baseline.width !== image.width || baseline.height !== image.height) {
    return { unavailable: "size mismatch" };
  }
  const result = solidMask(
    applyIgnoreAreas(baseline, ignoreAreas),
    applyIgnoreAreas(image, ignoreAreas),
  );
  if (!result) {
    return { unavailable: "too large" };
  }
  return {
    mask: result.mask,
    solidPixels: result.measure.solidPixels,
    diff: await encodePng(renderNoiselessDiff(baseline, result.mask)),
  };
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
