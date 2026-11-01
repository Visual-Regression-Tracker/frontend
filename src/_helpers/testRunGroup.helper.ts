import { TestRun, TestStatus } from "../types";
import { byAttention, statusesByAttention } from "./testRunStatus.helper";

// Mirrors the backend; siblings differ only on the axis the project groups by.
const GROUP_BY_AXES = [
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

/** Blind to status on purpose: the details dialog applies its own status rules. */
export const isSibling = (
  a: TestRun,
  b: TestRun,
  groupBy: GroupByAxis,
): boolean =>
  a.name === b.name &&
  a.branchName === b.branchName &&
  fixedAxes(groupBy).every((axis) => a[axis] === b[axis]);

// The status is not part of the key, so approving doesn't regroup the list.
const groupKey = (run: TestRun, groupBy: GroupByAxis): string =>
  JSON.stringify([
    run.name,
    run.branchName,
    ...fixedAxes(groupBy).map((axis) => run[axis] ?? ""),
  ]);

const byDiffDesc = (a: TestRun, b: TestRun): number =>
  (b.diffPercent ?? 0) - (a.diffPercent ?? 0);

export const groupStatusSummary = (runs: TestRun[]): string => {
  const counts = new Map<TestStatus, number>();
  runs.forEach((run) =>
    counts.set(run.status, (counts.get(run.status) ?? 0) + 1),
  );

  if (counts.size < 2) {
    return "";
  }

  return statusesByAttention(Array.from(counts.keys()))
    .map((status) => `${counts.get(status)} ${status}`)
    .join(" · ");
};

/** The run needing most attention represents the group: what is left to review. */
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
