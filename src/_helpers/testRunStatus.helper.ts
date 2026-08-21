import { TestRun, TestStatus } from "../types";

// the enum runs from new to ok, so a lower rank is the more pressing status
const STATUS_ORDER = Object.values(TestStatus);

export const statusRank = (status: TestStatus): number =>
  STATUS_ORDER.indexOf(status);

/** The statuses themselves, most pressing first. */
export const statusesByAttention = (statuses: TestStatus[]): TestStatus[] =>
  [...statuses].sort((a, b) => statusRank(a) - statusRank(b));

/** Needs-attention-first: what is left to review comes before what is settled. */
export const byAttention = (a: TestRun, b: TestRun): number =>
  statusRank(a.status) - statusRank(b.status);

// Nothing to see through: a new run has no baseline behind it at all, and an ok
// one matched the baseline it has — which is also why neither carries a diff.
// Everything else does differ from its baseline, including an approved run,
// which keeps the diff it was approved with, and a dimension mismatch, where
// the fade is the only way left to compare.
const NOTHING_TO_COMPARE: TestStatus[] = [TestStatus.new, TestStatus.ok];

/**
 * Whether looking at the checkpoint against its baseline still tells the
 * reviewer something — what the fade and the difference blend are for.
 */
export const canCompareToBaseline = (testRun: TestRun): boolean =>
  !!testRun.baselineName && !NOTHING_TO_COMPARE.includes(testRun.status);
