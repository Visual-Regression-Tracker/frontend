import { TestRun } from "../types";

// Mirrors the backend; siblings differ only on the axis the project groups by.
const GROUP_BY_AXES = [
  "customTags",
  "os",
  "device",
  "browser",
  "viewport",
] as const;

type GroupByAxis = (typeof GROUP_BY_AXES)[number];

export const resolveGroupByAxis = (value?: string): GroupByAxis =>
  value && (GROUP_BY_AXES as readonly string[]).includes(value)
    ? (value as GroupByAxis)
    : "customTags";

/** Blind to status on purpose: the details dialog applies its own status rules. */
export const isSibling = (
  a: TestRun,
  b: TestRun,
  groupBy: GroupByAxis,
): boolean =>
  a.name === b.name &&
  a.branchName === b.branchName &&
  GROUP_BY_AXES.every((axis) => axis === groupBy || a[axis] === b[axis]);
