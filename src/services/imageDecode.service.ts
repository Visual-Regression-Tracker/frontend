import type { RawImage } from "../_helpers/solidMask.helper";
import { PNG_HEADER_BYTES, pngSize } from "../_helpers/noiselessDiff.helper";

export async function fetchImage(url: string): Promise<Blob> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Cannot load ${url}: ${response.status}`);
  }
  return response.blob();
}

export async function readImageSize(blob: Blob) {
  return pngSize(
    new Uint8Array(await blob.slice(0, PNG_HEADER_BYTES).arrayBuffer()),
  );
}

function context2d(width: number, height: number) {
  const context = new OffscreenCanvas(width, height).getContext("2d", {
    willReadFrequently: true,
  });
  if (!context) {
    throw new Error("No 2d context on OffscreenCanvas");
  }
  return context;
}

// Without these options colour chunks (gAMA, cHRM, iCCP) shift pixels away from the backend's decode.
export async function decodeImage(blob: Blob): Promise<RawImage> {
  const bitmap = await createImageBitmap(blob, {
    colorSpaceConversion: "none",
    premultiplyAlpha: "none",
  });
  const { width, height } = bitmap;
  const context = context2d(width, height);
  context.drawImage(bitmap, 0, 0);
  bitmap.close();
  return {
    data: context.getImageData(0, 0, width, height).data,
    width,
    height,
  };
}

export function encodePng({
  data,
  width,
  height,
}: RawImage & { data: Uint8ClampedArray<ArrayBuffer> }): Promise<Blob> {
  const context = context2d(width, height);
  context.putImageData(new ImageData(data, width, height), 0, 0);
  return context.canvas.convertToBlob({ type: "image/png" });
}
