import { RefreshSummary } from "../services/testRun.service";

const screenshots = (count: number): string =>
  count === 1 ? "1 screenshot" : `${count} screenshots`;

const differ = (count: number): string => (count === 1 ? "differs" : "differ");

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

  const clauses: string[] = [];
  if (summary.resolved > 0) {
    clauses.push(`${summary.resolved} no longer ${differ(summary.resolved)}`);
  }
  // A refresh can push a screen the other way too: its baseline moved and it no
  // longer matches. Leaving that out would make the button read as if it could
  // only ever help.
  if (summary.reopened > 0) {
    clauses.push(`${summary.reopened} now ${differ(summary.reopened)}`);
  }

  const outcome =
    clauses.length > 0 ? clauses.join(", ") : "none of them changed";

  return `Re-compared ${screenshots(summary.compared)}, ${outcome}.`;
};
