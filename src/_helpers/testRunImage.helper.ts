import { TestRun } from "../types";
import { staticService } from "../services";

export const imageFor = (run: TestRun, showDiff: boolean): string =>
  staticService.getImage(
    showDiff && run.diffName ? run.diffName : run.imageName,
  );

/** Grids draw the small ingest copy: full-size files cost megabytes per dialog open. */
export const thumbnailFor = (run: TestRun, showDiff: boolean): string => {
  const wantsDiff = showDiff && !!run.diffName;
  const thumbnail = wantsDiff ? run.diffThumbnailName : run.imageThumbnailName;
  return thumbnail
    ? staticService.getImage(thumbnail)
    : imageFor(run, showDiff);
};

/** Both images have loaded, and they are not the same size. */
export const imageSizesDiffer = (
  testRun: Pick<TestRun, "baselineName" | "imageName">,
  currentImage: HTMLImageElement | undefined,
  baselineImage: HTMLImageElement | undefined,
): boolean =>
  !!(
    testRun.baselineName &&
    testRun.imageName &&
    currentImage &&
    baselineImage &&
    (currentImage.height !== baselineImage.height ||
      currentImage.width !== baselineImage.width)
  );

type LoadStatus = "loaded" | "loading" | "failed";

export const failedComparisonImages = (
  testRun: Pick<TestRun, "baselineName" | "imageName">,
  currentStatus: LoadStatus,
  baselineStatus: LoadStatus,
): ("baseline" | "checkpoint")[] => [
  ...(testRun.baselineName && baselineStatus === "failed"
    ? (["baseline"] as const)
    : []),
  ...(testRun.imageName && currentStatus === "failed"
    ? (["checkpoint"] as const)
    : []),
];
