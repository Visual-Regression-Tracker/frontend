import { buildResult } from "~client/_test/statistics.fixture";
import type { BuildResult } from "~client/types";

export const STATISTICS_BUILDS: BuildResult[] = [
  buildResult(1, { ok: 18, approved: 2 }),
  buildResult(2, { ok: 14, approved: 4, new: 2 }),
  buildResult(3, { ok: 20 }),
  buildResult(4, { ok: 12, failed: 6, unresolved: 2 }),
  buildResult(5, { ok: 15, autoApproved: 3, unresolved: 2 }),
  buildResult(6, { ok: 19, approved: 1 }),
  buildResult(7, { ok: 10, approved: 5, autoApproved: 2, new: 3 }),
  buildResult(8, { ok: 16, unresolved: 4 }),
  buildResult(9, { ok: 20, approved: 2 }),
  buildResult(10, { ok: 8, failed: 12 }),
  buildResult(11, { ok: 17, approved: 3 }),
  buildResult(12, { ok: 21, new: 1 }),
];
