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
