export interface SolidMaskRequest {
  baselineUrl: string;
  imageUrl: string;
}

export type SolidMaskResult =
  | { mask: Uint8Array; solidPixels: number }
  | { unavailable: "transparent" | "size mismatch" | "too large" };

export function computeSolidMask(
  request: SolidMaskRequest,
): Promise<SolidMaskResult> {
  const worker = new Worker(new URL("./solidMask.worker.ts", import.meta.url), {
    type: "module",
  });
  return new Promise<SolidMaskResult>((resolve, reject) => {
    worker.onmessage = ({
      data,
    }: MessageEvent<SolidMaskResult | { error: string }>) =>
      "error" in data ? reject(new Error(data.error)) : resolve(data);
    worker.onerror = (event) => reject(new Error(event.message));
    worker.postMessage(request);
  }).finally(() => worker.terminate());
}
