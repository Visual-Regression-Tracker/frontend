import { useEffect, useState } from "react";
import { parseIgnoreAreas } from "../../_helpers/ignoreArea.helper";
import { staticService } from "../../services";
import type { TestRun } from "../../types";
import {
  computeSolidMask,
  type SolidMaskUnavailable,
} from "./solidMask.client";

export type NoiselessView =
  | { status: "idle" }
  | { status: "computing" }
  | { status: "ready"; url: string }
  | { status: "unavailable"; reason: SolidMaskUnavailable }
  | { status: "failed"; message: string };

type Settled = Exclude<NoiselessView, { status: "idle" | "computing" }>;

export const UNAVAILABLE_HINT: Record<SolidMaskUnavailable, string> = {
  transparent: "Not available for images with semi-transparent pixels",
  "size mismatch": "Not available for images of different sizes",
  "too large": "Not available for images this large",
};

type Run = Pick<
  TestRun,
  "baselineName" | "imageName" | "diffName" | "ignoreAreas" | "tempIgnoreAreas"
>;

export function useNoiselessDiff(
  { baselineName, imageName, diffName, ignoreAreas, tempIgnoreAreas }: Run,
  active: boolean,
): NoiselessView {
  const [settled, setSettled] = useState<{ key: string; view: Settled }>();
  const key = JSON.stringify([
    baselineName,
    imageName,
    ignoreAreas,
    tempIgnoreAreas,
  ]);
  // a failure is retried the next time the mode is selected; another run's image is freed
  if (
    settled &&
    (settled.key !== key || (!active && settled.view.status === "failed"))
  ) {
    setSettled(undefined);
  }
  const current = settled?.key === key ? settled.view : undefined;
  const needed = active && !!diffName && !!baselineName && !current;
  const url = settled?.view.status === "ready" ? settled.view.url : undefined;

  useEffect(() => {
    if (!needed || !baselineName) {
      return;
    }
    const controller = new AbortController();
    computeSolidMask(
      {
        baselineUrl: staticService.getImageDownloadUrl(baselineName),
        imageUrl: staticService.getImageDownloadUrl(imageName),
        // the backend's blur stage leaves out both kinds
        ignoreAreas: parseIgnoreAreas(ignoreAreas).concat(
          parseIgnoreAreas(tempIgnoreAreas),
        ),
      },
      controller.signal,
    ).then(
      (result) =>
        setSettled({
          key,
          view:
            "diff" in result
              ? {
                  status: "ready",
                  url: URL.createObjectURL(result.diff),
                }
              : { status: "unavailable", reason: result.unavailable },
        }),
      (error: unknown) => {
        if (!controller.signal.aborted) {
          setSettled({
            key,
            view: {
              status: "failed",
              message: error instanceof Error ? error.message : String(error),
            },
          });
        }
      },
    );
    return () => controller.abort();
  }, [needed, key, baselineName, imageName, ignoreAreas, tempIgnoreAreas]);

  useEffect(() => {
    if (url) {
      return () => URL.revokeObjectURL(url);
    }
  }, [url]);

  if (current) {
    return current;
  }
  return needed ? { status: "computing" } : { status: "idle" };
}
