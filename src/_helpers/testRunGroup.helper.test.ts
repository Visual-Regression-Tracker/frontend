import { TestRun } from "../types";
import { TestStatus } from "../types/testStatus";
import {
  groupTestRuns,
  isSibling,
  resolveGroupByAxis,
  singleRunGroups,
} from "./testRunGroup.helper";

// built here rather than taken from test.data.helper: that module does not
// type check, and spelling the axes out keeps the grouping inputs obvious
const BASE: TestRun = {
  id: "run",
  buildId: "build",
  imageName: "image.png",
  diffName: "diff.png",
  diffPercent: 1,
  diffTollerancePercent: 0,
  status: TestStatus.unresolved,
  testVariationId: "variation",
  name: "Screen A",
  baselineName: "baseline.png",
  os: "iOS",
  browser: "safari",
  viewport: "375x812",
  device: "iPhone",
  customTags: "en_US",
  ignoreAreas: "[]",
  tempIgnoreAreas: "[]",
  branchName: "main",
  baselineBranchName: "main",
  merge: false,
};

const run = (overrides: Partial<TestRun>): TestRun => ({
  ...BASE,
  ...overrides,
});

describe("resolveGroupByAxis", () => {
  it("falls back to customTags", () => {
    expect(resolveGroupByAxis(undefined)).toBe("customTags");
    expect(resolveGroupByAxis("nonsense")).toBe("customTags");
  });

  it("keeps a known axis", () => {
    expect(resolveGroupByAxis("viewport")).toBe("viewport");
  });
});

describe("groupTestRuns", () => {
  it("groups runs that differ only on the group by axis", () => {
    const groups = groupTestRuns(
      [
        run({ id: "en", customTags: "en_US" }),
        run({ id: "de", customTags: "de_DE" }),
      ],
      "customTags",
    );

    expect(groups).toHaveLength(1);
    expect(groups[0].runs.map((r) => r.id).sort()).toEqual(["de", "en"]);
  });

  it("keeps runs apart when they differ on a fixed axis", () => {
    const groups = groupTestRuns(
      [
        run({ id: "phone", customTags: "en_US", device: "iPhone" }),
        run({ id: "pad", customTags: "de_DE", device: "iPad" }),
      ],
      "customTags",
    );

    expect(groups).toHaveLength(2);
  });

  it("keeps runs apart when the name or the branch differs", () => {
    const groups = groupTestRuns(
      [
        run({ id: "a", name: "Screen A" }),
        run({ id: "b", name: "Screen B" }),
        run({ id: "c", name: "Screen A", branchName: "other" }),
      ],
      "customTags",
    );

    expect(groups).toHaveLength(3);
  });

  it("keeps statuses apart, so a group needs one decision", () => {
    const groups = groupTestRuns(
      [
        run({ id: "todo", customTags: "en_US", status: TestStatus.unresolved }),
        run({ id: "done", customTags: "de_DE", status: TestStatus.approved }),
      ],
      "customTags",
    );

    expect(groups).toHaveLength(2);
  });

  it("represents a group by its biggest diff", () => {
    const groups = groupTestRuns(
      [
        run({ id: "small", customTags: "en_US", diffPercent: 0.2 }),
        run({ id: "big", customTags: "de_DE", diffPercent: 7 }),
        run({ id: "mid", customTags: "fr_FR", diffPercent: 3 }),
      ],
      "customTags",
    );

    expect(groups[0].representative.id).toBe("big");
    expect(groups[0].runs.map((r) => r.id)).toEqual(["big", "mid", "small"]);
  });

  it("honours a different group by axis", () => {
    const runs = [
      run({ id: "ios", os: "iOS", customTags: "en_US" }),
      run({ id: "android", os: "Android", customTags: "en_US" }),
    ];

    expect(groupTestRuns(runs, "os")).toHaveLength(1);
    expect(groupTestRuns(runs, "customTags")).toHaveLength(2);
  });

  it("keeps the order the runs came in", () => {
    const groups = groupTestRuns(
      [run({ id: "b", name: "Screen B" }), run({ id: "a", name: "Screen A" })],
      "customTags",
    );

    expect(groups.map((group) => group.representative.id)).toEqual(["b", "a"]);
  });
});

describe("singleRunGroups", () => {
  it("wraps every run in its own group", () => {
    const groups = singleRunGroups([run({ id: "a" }), run({ id: "b" })]);

    expect(groups.map((group) => group.runs.length)).toEqual([1, 1]);
    expect(groups.map((group) => group.representative.id)).toEqual(["a", "b"]);
  });
});

describe("isSibling", () => {
  it("ignores the group by axis and compares the rest", () => {
    const base = run({ id: "a", customTags: "en_US" });

    expect(
      isSibling(base, run({ id: "b", customTags: "de_DE" }), "customTags"),
    ).toBe(true);
    expect(
      isSibling(base, run({ id: "c", browser: "firefox" }), "customTags"),
    ).toBe(false);
  });

  it("does not look at the status", () => {
    const base = run({ id: "a", customTags: "en_US" });
    const approved = run({
      id: "b",
      customTags: "de_DE",
      status: TestStatus.approved,
    });

    expect(isSibling(base, approved, "customTags")).toBe(true);
  });
});
