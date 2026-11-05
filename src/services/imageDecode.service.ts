import type { RawImage } from "../_helpers/solidMask.helper";

// Without these options colour chunks (gAMA, cHRM, iCCP) shift pixels away from the backend's decode.
export async function decodeImage(url: string): Promise<RawImage> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Cannot load ${url}: ${response.status}`);
  }
  const bitmap = await createImageBitmap(await response.blob(), {
    colorSpaceConversion: "none",
    premultiplyAlpha: "none",
  });
  const { width, height } = bitmap;
  const context = new OffscreenCanvas(width, height).getContext("2d", {
    willReadFrequently: true,
  });
  if (!context) {
    throw new Error("No 2d context on OffscreenCanvas");
  }
  context.drawImage(bitmap, 0, 0);
  bitmap.close();
  return {
    data: context.getImageData(0, 0, width, height).data,
    width,
    height,
  };
}
