import { TestRun } from "../types";
import { staticService } from "../services";

/**
 * What a thumbnail shows. The diff is the informative picture, but a run only
 * has one once it has been compared, and the reviewer may want the plain
 * screenshot instead. Shared so the grid and the variations dialog cannot
 * disagree about what "show diff" means.
 */
export const imageFor = (run: TestRun, showDiff: boolean): string =>
  staticService.getImage(
    showDiff && run.diffName ? run.diffName : run.imageName,
  );

/**
 * What a *grid* should draw: the small copy the API made at ingest, falling
 * back to the full-size picture for runs from before those existed.
 *
 * The grids lay these out a hundred-odd pixels wide. Handing them the
 * full-size file and letting CSS shrink it cost roughly 7 MB and 68 requests
 * every time the variations dialog opened — the single largest thing left in
 * that flow once the backend stopped recomputing signatures.
 */
export const thumbnailFor = (run: TestRun, showDiff: boolean): string => {
  const wantsDiff = showDiff && !!run.diffName;
  const thumbnail = wantsDiff ? run.diffThumbnailName : run.imageThumbnailName;
  return thumbnail
    ? staticService.getImage(thumbnail)
    : imageFor(run, showDiff);
};
