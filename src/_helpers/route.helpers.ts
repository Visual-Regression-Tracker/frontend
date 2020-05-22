import { TestRun } from "../types"

export const buildTestRunLocation = (testRun: TestRun) => ({
    search: `buildId=${testRun.buildId}&testId=${testRun.id}`,
})