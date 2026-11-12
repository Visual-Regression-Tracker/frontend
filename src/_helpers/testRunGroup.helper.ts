import { TagField, TestRun, TestStatus } from "../types";
import { byAttention, statusesByAttention } from "./testRunStatus.helper";
import { byDiffDesc } from "./testRunOrder.helper";
import { statusLabelInline } from "./statusLabel.helper";
import { TAG_FIELDS } from "./testRunTags.helper";
import { comparatorFor } from "./testRunSort.helper";
import type { TestRunSort } from "../types/testRunSort";

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
  tagFields: TagField[];
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

export const groupStatusSummary = (runs: TestRun[]): string => {
  const counts = new Map<TestStatus, number>();
  runs.forEach((run) =>
    counts.set(run.status, (counts.get(run.status) ?? 0) + 1),
  );

  if (counts.size < 2) {
    return "";
  }

  return statusesByAttention(Array.from(counts.keys()))
    .map((status) => `${counts.get(status)} ${statusLabelInline(status)}`)
    .join(" · ");
};

/** The run needing most attention represents the group: what is left to review. */
export const groupTestRuns = (
  runs: TestRun[],
  groupBy: GroupByAxis,
): TestRunGroup[] => {
  const axes = fixedAxes(groupBy);
  const byKey = new Map<string, TestRun[]>();

  runs.forEach((run) => {
    // the status is not part of the key, so approving doesn't regroup the list
    const key = JSON.stringify([
      run.name,
      run.branchName,
      ...axes.map((axis) => run[axis] ?? ""),
    ]);
    const bucket = byKey.get(key);
    if (bucket) {
      bucket.push(run);
    } else {
      byKey.set(key, [run]);
    }
  });

  return Array.from(byKey.entries()).map(([key, groupRuns]) => {
    const sorted = [...groupRuns].sort(
      (a, b) =>
        byAttention(a, b) ||
        byDiffDesc(a, b) ||
        String(a[groupBy] ?? "").localeCompare(String(b[groupBy] ?? "")),
    );
    // the grouped axis varies within a group, so it tags only a group of one
    const tagFields =
      sorted.length > 1
        ? TAG_FIELDS.filter((field) => field !== groupBy)
        : TAG_FIELDS;
    return { key, runs: sorted, representative: sorted[0], tagFields };
  });
};

export const singleRunGroups = (runs: TestRun[]): TestRunGroup[] =>
  runs.map((run) => ({
    key: run.id,
    runs: [run],
    representative: run,
    tagFields: TAG_FIELDS,
  }));

/** A group sorts by its representative, by the tags it shows. */
export const sortGroups = (
  groups: TestRunGroup[],
  sort: TestRunSort,
): TestRunGroup[] => {
  const tagFieldsOf = new Map(
    groups.map((group) => [group.representative, group.tagFields]),
  );
  const compare = comparatorFor(
    sort,
    (run) => tagFieldsOf.get(run) ?? TAG_FIELDS,
  );
  return [...groups].sort((a, b) =>
    compare(a.representative, b.representative),
  );
};
