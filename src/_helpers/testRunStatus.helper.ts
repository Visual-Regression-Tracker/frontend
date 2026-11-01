import { TestRun, TestStatus } from "../types";

// the enum runs from new to ok, so a lower rank is the more pressing status
const STATUS_ORDER = Object.values(TestStatus);

const statusRank = (status: TestStatus): number => STATUS_ORDER.indexOf(status);

export const statusesByAttention = (statuses: TestStatus[]): TestStatus[] =>
  [...statuses].sort((a, b) => statusRank(a) - statusRank(b));

export const byAttention = (a: TestRun, b: TestRun): number =>
  statusRank(a.status) - statusRank(b.status);

// A new run has no baseline, and an ok one matched it, so neither has a diff.
const NOTHING_TO_COMPARE: TestStatus[] = [TestStatus.new, TestStatus.ok];

export const canCompareToBaseline = (testRun: TestRun): boolean =>
  !!testRun.baselineName && !NOTHING_TO_COMPARE.includes(testRun.status);
