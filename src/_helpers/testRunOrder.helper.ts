import { TestRun } from "../types";

export const byDiffDesc = (a: TestRun, b: TestRun): number =>
  (b.diffPercent ?? 0) - (a.diffPercent ?? 0);

export const orderByIds = (
  runs: TestRun[],
  ids?: readonly (string | number)[],
): TestRun[] => {
  if (!ids) {
    return runs;
  }
  // looked up by id, not scanned: a linear search per run costs seconds on a build of thousands
  const positionById = new Map(ids.map((id, position) => [id, position]));
  return runs
    .filter((run) => positionById.has(run.id))
    .sort((a, b) => positionById.get(a.id)! - positionById.get(b.id)!);
};
