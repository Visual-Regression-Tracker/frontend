import type { RawImage } from "./solidMask.helper";

const PIXELMATCH_ALPHA = 0.1;
const KEPT = [255, 0, 0] as const;

const PNG_SIGNATURE = [137, 80, 78, 71, 13, 10, 26, 10];
export const PNG_HEADER_BYTES = 24;

// Drawn like the backend's pixelmatch diff (faded grey baseline, red changes), so the two views read the same.
export function renderNoiselessDiff(
  { data, width, height }: RawImage,
  mask: Uint8Array,
): RawImage {
  const out = new Uint8ClampedArray(width * height * 4);
  for (let i = 0; i < mask.length; i++) {
    const o = i * 4;
    if (mask[i]) {
      out.set(KEPT, o);
    } else {
      const luma =
        data[o] * 0.29889531 +
        data[o + 1] * 0.58662247 +
        data[o + 2] * 0.11448223;
      out.fill(
        255 + (luma - 255) * PIXELMATCH_ALPHA * (data[o + 3] / 255),
        o,
        o + 3,
      );
    }
    out[o + 3] = 255;
  }
  return { data: out, width, height };
}

export function pngSize(
  header: Uint8Array,
): { width: number; height: number } | null {
  if (
    header.length < PNG_HEADER_BYTES ||
    PNG_SIGNATURE.some((byte, i) => header[i] !== byte)
  ) {
    return null;
  }
  const view = new DataView(header.buffer, header.byteOffset);
  return { width: view.getUint32(16), height: view.getUint32(20) };
}
