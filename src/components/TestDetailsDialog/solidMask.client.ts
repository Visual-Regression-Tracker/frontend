import type { IgnoreArea } from "../../types/ignoreArea";

export interface SolidMaskRequest {
  baselineUrl: string;
  imageUrl: string;
  ignoreAreas?: Pick<IgnoreArea, "x" | "y" | "width" | "height">[];
}

export type SolidMaskResult =
  | { mask: Uint8Array; solidPixels: number }
  | { unavailable: "transparent" | "size mismatch" | "too large" };

export function computeSolidMask(
  request: SolidMaskRequest,
): Promise<SolidMaskResult> {
  let worker: Worker | undefined;
  return new Promise<SolidMaskResult>((resolve, reject) => {
    worker = new Worker(new URL("./solidMask.worker.ts", import.meta.url), {
      type: "module",
    });
    worker.onmessage = ({
      data,
    }: MessageEvent<SolidMaskResult | { error: string }>) =>
      "error" in data ? reject(new Error(data.error)) : resolve(data);
    worker.onmessageerror = () =>
      reject(new Error("Cannot read the worker's answer"));
    worker.onerror = (event) => reject(new Error(event.message));
    worker.postMessage(request);
  }).finally(() => worker?.terminate());
}
