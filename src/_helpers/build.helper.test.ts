import {
  TEST_BUILD_PASSED,
  TEST_BUILD_UNRESOLVED,
} from "../_test/test.data.helper";
import { BuildStatus } from "../types/buildStatus";
import { buildSummary, hasLaterRun } from "./build.helper";

describe("hasLaterRun", () => {
  it("is false without a last run", () => {
    expect(hasLaterRun({ createdAt: "2026-11-04T10:00:00Z" })).toBe(false);
  });

  it("is false within a minute of the creation", () => {
    expect(
      hasLaterRun({
        createdAt: "2026-11-04T10:00:00Z",
        updatedAt: "2026-11-04T10:01:00Z",
      }),
    ).toBe(false);
  });

  it("is true when the last run is more than a minute later", () => {
    expect(
      hasLaterRun({
        createdAt: "2026-11-04T10:00:00Z",
        updatedAt: "2026-11-04T10:01:01Z",
      }),
    ).toBe(true);
  });
});

describe("buildSummary", () => {
  const base = {
    ...TEST_BUILD_PASSED,
    isRunning: false,
    unresolvedCount: 0,
    failedCount: 0,
    passedCount: 1,
  };

  it("says Running for a build in progress", () => {
    expect(buildSummary({ ...base, isRunning: true })).toBe("Running");
  });

  it("counts the unresolved runs of an unresolved build", () => {
    expect(
      buildSummary({
        ...TEST_BUILD_UNRESOLVED,
        isRunning: false,
        status: BuildStatus.unresolved,
        unresolvedCount: 4,
        failedCount: 0,
        passedCount: 7,
      }),
    ).toBe("11 runs · 4 unresolved");
  });

  it("counts the failed runs of a failed build", () => {
    expect(
      buildSummary({
        ...base,
        status: BuildStatus.failed,
        failedCount: 2,
        passedCount: 0,
      }),
    ).toBe("2 runs · 2 failed");
  });

  it("names the status of a passed build and uses the singular", () => {
    expect(buildSummary({ ...base, status: BuildStatus.passed })).toBe(
      "1 run · passed",
    );
  });
});
