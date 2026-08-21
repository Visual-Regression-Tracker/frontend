import { TestStatus } from "../types";
import { run } from "./testRun.fixture";
import { canCompareToBaseline } from "./testRunStatus.helper";

describe("canCompareToBaseline", () => {
  it("compares a run that is still under review", () => {
    expect(canCompareToBaseline(run({ status: TestStatus.unresolved }))).toBe(
      true,
    );
  });

  // dimensions that differ leave no diff to look at, so fading between the two
  // is the only comparison there is
  it("compares a run whose diff could not be produced", () => {
    expect(
      canCompareToBaseline(
        run({ status: TestStatus.unresolved, diffName: "" }),
      ),
    ).toBe(true);
  });

  // reviewing what was approved is exactly when the fade earns its place
  it.each([TestStatus.approved, TestStatus.autoApproved])(
    "keeps comparing an %s run against the baseline it differs from",
    (status) => {
      expect(canCompareToBaseline(run({ status }))).toBe(true);
    },
  );

  it("has nothing to compare once the run matched its baseline", () => {
    expect(canCompareToBaseline(run({ status: TestStatus.ok }))).toBe(false);
  });

  it("has nothing to compare on a new run", () => {
    expect(canCompareToBaseline(run({ status: TestStatus.new }))).toBe(false);
  });

  it("has nothing to compare without a baseline", () => {
    expect(canCompareToBaseline(run({ baselineName: "" }))).toBe(false);
  });
});
