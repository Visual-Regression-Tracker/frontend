import { TestStatus } from "../types/testStatus";
import { run } from "./testRun.fixture";
import {
  groupStatusSummary,
  groupTestRuns,
  isSibling,
  resolveGroupByAxis,
  singleRunGroups,
  sortGroups,
} from "./testRunGroup.helper";

const sortedIds = (ids: string[]) =>
  [...ids].sort((a, b) => a.localeCompare(b));

describe("resolveGroupByAxis", () => {
  it("falls back to customTags", () => {
    expect(resolveGroupByAxis()).toBe("customTags");
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
    expect(sortedIds(groups[0].runs.map((r) => r.id))).toEqual(["de", "en"]);
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

  it("keeps a run with no device apart from one with an empty device, as isSibling does", () => {
    const missing = run({
      id: "missing",
      customTags: "en_US",
      device: null as unknown as string,
    });
    const empty = run({ id: "empty", customTags: "de_DE", device: "" });

    const groups = groupTestRuns([missing, empty], "customTags");

    expect(isSibling(missing, empty, "customTags")).toBe(false);
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

  it("groups runs whatever their statuses", () => {
    const groups = groupTestRuns(
      [
        run({ id: "todo", customTags: "en_US", status: TestStatus.unresolved }),
        run({ id: "done", customTags: "de_DE", status: TestStatus.approved }),
      ],
      "customTags",
    );

    expect(groups).toHaveLength(1);
    expect(sortedIds(groups[0].runs.map((r) => r.id))).toEqual([
      "done",
      "todo",
    ]);
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

  it("drops the grouped axis from the tags of a group, not of a lone run", () => {
    const [group, lone] = groupTestRuns(
      [
        run({ id: "a-en", name: "Screen A", customTags: "en" }),
        run({ id: "a-de", name: "Screen A", customTags: "de" }),
        run({ id: "b-en", name: "Screen B", customTags: "en" }),
      ],
      "customTags",
    );

    expect(group.tagFields).not.toContain("customTags");
    expect(lone.tagFields).toContain("customTags");
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

  it("words the statuses as the labels do", () => {
    expect(
      groupStatusSummary([
        run({ id: "a", status: TestStatus.ok }),
        run({ id: "b", status: TestStatus.autoApproved }),
      ]),
    ).toBe("1 auto-approved · 1 passed");
  });
});

describe("sortGroups", () => {
  it("places each group by its representative", () => {
    const groups = groupTestRuns(
      [
        run({ id: "b", name: "Screen B" }),
        run({
          id: "a-ok",
          name: "Screen A",
          customTags: "en",
          status: TestStatus.ok,
        }),
        run({
          id: "a-new",
          name: "Screen A",
          customTags: "de",
          status: TestStatus.new,
        }),
      ],
      "customTags",
    );

    const sorted = sortGroups(groups, { field: "status", direction: "desc" });

    expect(sorted.map((group) => group.representative.id)).toEqual([
      "a-new",
      "b",
    ]);
  });

  it("sorts a group by the tags it shows, not the grouped axis", () => {
    const groups = groupTestRuns(
      [
        run({ id: "b-aa", name: "Screen B", customTags: "aa" }),
        run({ id: "b-ab", name: "Screen B", customTags: "ab" }),
        run({ id: "a-zz", name: "Screen A", customTags: "zz" }),
        run({ id: "a-zy", name: "Screen A", customTags: "zy" }),
      ],
      "customTags",
    );

    const sorted = sortGroups(groups, { field: "tags", direction: "asc" });

    expect(sorted.map((group) => group.representative.name)).toEqual([
      "Screen A",
      "Screen B",
    ]);
  });
});
