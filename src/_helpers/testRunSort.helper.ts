import type { GridSortModel } from "@mui/x-data-grid";
import { TagField, TestRun } from "../types";
import { SORT_FIELDS, TestRunSort } from "../types/testRunSort";
import { noiseScoreOf } from "./noiseHint.helper";
import { byAttention } from "./testRunStatus.helper";
import { tagsOf } from "./testRunTags.helper";

const byName = (a: TestRun, b: TestRun): number => a.name.localeCompare(b.name);

// ascending runs ok to new: descending puts needs-attention first in both views
const bySettled = (a: TestRun, b: TestRun): number => -byAttention(a, b);

// runs without a score go last in both directions, so only the scored ones flip
const byScore = (
  scoreA: number | null,
  scoreB: number | null,
  direction: TestRunSort["direction"],
): number => {
  if (scoreA === null || scoreB === null) {
    return Number(scoreA === null) - Number(scoreB === null);
  }
  return direction === "asc" ? scoreA - scoreB : scoreB - scoreA;
};

// flip only the chosen field: negating the tie-break too would reverse names
export const comparatorFor = (
  sort: TestRunSort,
  tagFieldsOf: (run: TestRun) => TagField[],
) => {
  const tagKeys = new Map<TestRun, string>();
  const tagKey = (run: TestRun): string => {
    let key = tagKeys.get(run);
    if (key === undefined) {
      key = tagsOf(run, tagFieldsOf(run));
      tagKeys.set(run, key);
    }
    return key;
  };
  const noiseScores = new Map<TestRun, number | null>();
  const noiseScore = (run: TestRun): number | null => {
    let score = noiseScores.get(run);
    if (score === undefined) {
      score = noiseScoreOf(run);
      noiseScores.set(run, score);
    }
    return score;
  };
  const ascendingBy = (a: TestRun, b: TestRun): number => {
    if (sort.field === "status") {
      return bySettled(a, b);
    }
    if (sort.field === "name") {
      return byName(a, b);
    }
    return tagKey(a).localeCompare(tagKey(b));
  };

  return (a: TestRun, b: TestRun): number => {
    if (sort.field === "noise") {
      return (
        byScore(noiseScore(a), noiseScore(b), sort.direction) || byName(a, b)
      );
    }
    const ascending = ascendingBy(a, b);
    const primary = sort.direction === "asc" ? ascending : -ascending;
    const tieBreak = sort.field === "name" ? byAttention(a, b) : byName(a, b);

    return primary || tieBreak;
  };
};

// the grid only reports header clicks; the order itself is ours
export const sortOfModel = (model: GridSortModel): TestRunSort | undefined => {
  const [item] = model;
  const field = SORT_FIELDS.find((candidate) => candidate === item?.field);
  if (!item?.sort || !field) {
    return undefined;
  }
  return { field, direction: item.sort };
};
