import type { IgnoreArea } from "../../types/ignoreArea";

export interface SolidMaskRequest {
  baselineUrl: string;
  imageUrl: string;
  ignoreAreas?: Pick<IgnoreArea, "x" | "y" | "width" | "height">[];
}

export type SolidMaskUnavailable =
  "transparent" | "size mismatch" | "too large";

export type SolidMaskResult =
  | { mask: Uint8Array; solidPixels: number; diff: Blob }
  | { unavailable: SolidMaskUnavailable };

let worker: Worker | undefined;
let cancelRunning: (() => void) | undefined;

const aborted = () => new DOMException("Superseded", "AbortError");

function dropWorker() {
  worker?.terminate();
  worker = undefined;
}

// one worker at a time: a newer request terminates the older computation
export function computeSolidMask(
  request: SolidMaskRequest,
  signal?: AbortSignal,
): Promise<SolidMaskResult> {
  cancelRunning?.();
  return new Promise<SolidMaskResult>((resolve, reject) => {
    if (signal?.aborted) {
      reject(aborted());
      return;
    }
    const current = (worker ??= new Worker(
      new URL("./solidMask.worker.ts", import.meta.url),
      { type: "module" },
    ));
    const settle = (finish: () => void) => {
      if (worker !== current || cancelRunning !== cancel) {
        return;
      }
      cancelRunning = undefined;
      signal?.removeEventListener("abort", cancel);
      finish();
    };
    const cancel = () =>
      settle(() => {
        dropWorker();
        reject(aborted());
      });
    current.onmessage = ({
      data,
    }: MessageEvent<SolidMaskResult | { error: string }>) =>
      settle(() =>
        "error" in data ? reject(new Error(data.error)) : resolve(data),
      );
    current.onmessageerror = () =>
      settle(() => reject(new Error("Cannot read the worker's answer")));
    current.onerror = (event) =>
      settle(() => {
        dropWorker();
        reject(new Error(event.message || "The image worker could not start"));
      });
    cancelRunning = cancel;
    signal?.addEventListener("abort", cancel);
    current.postMessage(request);
  });
}
