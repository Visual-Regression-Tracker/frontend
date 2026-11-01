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
