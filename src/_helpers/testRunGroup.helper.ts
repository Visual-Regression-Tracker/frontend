import { TestRun, TestStatus } from "../types";

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

// The key is an identity, and the status is not part of it — same as isSibling.
// Were it, approving one locale would drop that run out of its group and
// reshuffle the list mid-review, and a freshly added device (every run new)
// would never join the runs already there (every run unresolved).
const groupKey = (run: TestRun, groupBy: GroupByAxis): string =>
  JSON.stringify([
    run.name,
    run.branchName,
    ...fixedAxes(groupBy).map((axis) => run[axis] ?? ""),
  ]);

const STATUS_ORDER = Object.values(TestStatus);

// the enum runs from new to ok, so a lower index is the more pressing status
const byAttention = (a: TestRun, b: TestRun): number =>
  STATUS_ORDER.indexOf(a.status) - STATUS_ORDER.indexOf(b.status);

const byDiffDesc = (a: TestRun, b: TestRun): number =>
  (b.diffPercent ?? 0) - (a.diffPercent ?? 0);

/**
 * The statuses of a mixed group, the most pressing first, e.g.
 * "2 unresolved · 1 approved". Empty when every run agrees, since the group's
 * own chip already says it.
 */
export const groupStatusSummary = (runs: TestRun[]): string => {
  const counts = new Map<TestStatus, number>();
  runs.forEach((run) =>
    counts.set(run.status, (counts.get(run.status) ?? 0) + 1),
  );

  if (counts.size < 2) {
    return "";
  }

  return STATUS_ORDER.filter((status) => counts.has(status))
    .map((status) => `${counts.get(status)} ${status}`)
    .join(" · ");
};

/**
 * Collapses runs that differ only along the group-by axis into one group each,
 * keeping the order the runs arrived in. The run needing attention most
 * represents the group, the biggest diff among equals, so the card shows what
 * is left to review rather than what is already settled.
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
        byAttention(a, b) ||
        byDiffDesc(a, b) ||
        String(a[groupBy] ?? "").localeCompare(String(b[groupBy] ?? "")),
    );
    return { key, runs: sorted, representative: sorted[0] };
  });
};

export const singleRunGroups = (runs: TestRun[]): TestRunGroup[] =>
  runs.map((run) => ({ key: run.id, runs: [run], representative: run }));
