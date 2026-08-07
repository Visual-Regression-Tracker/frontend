import { TestStatus } from "../types/testStatus";
import { run } from "./testRun.fixture";
import {
  groupStatusSummary,
  groupTestRuns,
  isSibling,
  resolveGroupByAxis,
  singleRunGroups,
} from "./testRunGroup.helper";

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

  // the group is an identity, not a review state: were the status part of it,
  // approving one locale would drop that run out of its group and reshuffle the
  // list mid-review, and a freshly added device (all runs new) would never join
  // the existing ones (all unresolved)
  it("groups runs whatever their statuses", () => {
    const groups = groupTestRuns(
      [
        run({ id: "todo", customTags: "en_US", status: TestStatus.unresolved }),
        run({ id: "done", customTags: "de_DE", status: TestStatus.approved }),
      ],
      "customTags",
    );

    expect(groups).toHaveLength(1);
    expect(groups[0].runs.map((r) => r.id).sort()).toEqual(["done", "todo"]);
  });

  it("represents a group by the run that needs attention most", () => {
    const groups = groupTestRuns(
      [
        run({
          id: "settled",
          customTags: "en_US",
          diffPercent: 9,
          status: TestStatus.approved,
        }),
        run({
          id: "todo",
          customTags: "de_DE",
          diffPercent: 1,
          status: TestStatus.unresolved,
        }),
      ],
      "customTags",
    );

    expect(groups[0].representative.id).toBe("todo");
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

describe("groupStatusSummary", () => {
  it("says nothing when every run of the group agrees", () => {
    expect(groupStatusSummary([run({ id: "a" }), run({ id: "b" })])).toBe("");
  });

  it("counts the statuses, the ones needing attention first", () => {
    expect(
      groupStatusSummary([
        run({ id: "a", status: TestStatus.approved }),
        run({ id: "b", status: TestStatus.unresolved }),
        run({ id: "c", status: TestStatus.unresolved }),
      ]),
    ).toBe("2 unresolved · 1 approved");
  });
});
