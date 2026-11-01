import {
  BulkResult,
  allSucceeded as allSucceededResult,
} from "../services/testRun.service";

export const NO_FAILURES: BulkResult = { succeeded: [], failed: [] };

export const allSucceeded = (ids: string[] | number[]): Promise<BulkResult> =>
  Promise.resolve(allSucceededResult(ids));
