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
