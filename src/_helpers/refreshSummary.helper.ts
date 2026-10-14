import { RefreshSummary } from "../services/testRun.service";

const screenshots = (count: number): string =>
  count === 1 ? "1 screenshot" : `${count} screenshots`;

/**
 * What a refresh did, in a sentence. Worth spelling out: most of a build is
 * usually already on its current baseline, so a refresh that changes nothing is
 * the normal outcome and has to read as an answer rather than as a failure.
 */
export const describeRefresh = (summary: RefreshSummary): string => {
  if (summary.compared === 0) {
    return summary.unchanged > 0
      ? "Every screenshot is already on its current baseline."
      : "Nothing to re-compare.";
  }

  const outcome =
    summary.resolved === 0
      ? "none of them changed"
      : `${summary.resolved} no longer ${
          summary.resolved === 1 ? "differs" : "differ"
        }`;

  return `Re-compared ${screenshots(summary.compared)}, ${outcome}.`;
};
