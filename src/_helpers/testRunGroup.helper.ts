import { TestRun } from "../types";

// Test-variation axes, mirroring the backend. A sibling shares the screen name
// and every axis except the one the project groups by (bulkApproveGroupBy).
export const GROUP_BY_AXES = [
  "customTags",
  "os",
  "device",
  "browser",
  "viewport",
] as const;

export type GroupByAxis = (typeof GROUP_BY_AXES)[number];

export interface TestRunGroup {
  key: string;
  runs: TestRun[];
  representative: TestRun;
}

export const resolveGroupByAxis = (value?: string): GroupByAxis =>
  value && (GROUP_BY_AXES as readonly string[]).includes(value)
    ? (value as GroupByAxis)
    : "customTags";

const fixedAxes = (groupBy: GroupByAxis): GroupByAxis[] =>
  GROUP_BY_AXES.filter((axis) => axis !== groupBy);

/**
 * Same variation family: the two runs would share a baseline were it not for the
 * axis the project groups by. Deliberately blind to status, because the details
 * dialog uses this to find siblings still worth reviewing and applies its own
 * status rules on top.
 */
export const isSibling = (
  a: TestRun,
  b: TestRun,
  groupBy: GroupByAxis,
): boolean =>
  a.name === b.name &&
  a.branchName === b.branchName &&
  fixedAxes(groupBy).every((axis) => a[axis] === b[axis]);

// Status is part of the key, unlike in isSibling: a group is a set of runs that
// needs one decision, so half-reviewed families must not collapse into one card.
const groupKey = (run: TestRun, groupBy: GroupByAxis): string =>
  JSON.stringify([
    run.name,
    run.branchName,
    run.status,
    ...fixedAxes(groupBy).map((axis) => run[axis] ?? ""),
  ]);

const byDiffDesc = (a: TestRun, b: TestRun): number =>
  (b.diffPercent ?? 0) - (a.diffPercent ?? 0);

/**
 * Collapses runs that differ only along the group-by axis into one group each,
 * keeping the order the runs arrived in. Within a group the biggest diff comes
 * first and represents the group, since it shows the most.
 */
export const groupTestRuns = (
  runs: TestRun[],
  groupBy: GroupByAxis,
): TestRunGroup[] => {
  const byKey = new Map<string, TestRun[]>();

  runs.forEach((run) => {
    const key = groupKey(run, groupBy);
    byKey.set(key, [...(byKey.get(key) ?? []), run]);
  });

  return Array.from(byKey.entries()).map(([key, groupRuns]) => {
    const sorted = [...groupRuns].sort(
      (a, b) =>
        byDiffDesc(a, b) ||
        String(a[groupBy] ?? "").localeCompare(String(b[groupBy] ?? "")),
    );
    return { key, runs: sorted, representative: sorted[0] };
  });
};

export const singleRunGroups = (runs: TestRun[]): TestRunGroup[] =>
  runs.map((run) => ({ key: run.id, runs: [run], representative: run }));
