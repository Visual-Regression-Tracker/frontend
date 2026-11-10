import { run } from "./testRun.fixture";
import { DEFAULT_SORT } from "../components/TestRunList/TestRunGridToolbar";
import { TestRun, TestStatus } from "../types";
import { comparatorFor, sortOfModel } from "./testRunSort.helper";

const ids = (runs: TestRun[]) => runs.map((item) => item.id);

const okA = run({ id: "ok-a", name: "A", status: TestStatus.ok });
const newB = run({ id: "new-b", name: "B", status: TestStatus.new });
const newA = run({ id: "new-a", name: "A", status: TestStatus.new });
const failedC = run({ id: "failed-c", name: "C", status: TestStatus.failed });

describe("comparatorFor", () => {
  it("puts the runs needing attention first when status is descending", () => {
    const sorted = [okA, failedC, newB, newA].sort(
      comparatorFor({ field: "status", direction: "desc" }),
    );

    expect(ids(sorted)).toEqual(["new-a", "new-b", "failed-c", "ok-a"]);
  });

  it("flips only the status on ascending, keeping names in order", () => {
    const sorted = [newB, failedC, okA, newA].sort(
      comparatorFor({ field: "status", direction: "asc" }),
    );

    expect(ids(sorted)).toEqual(["ok-a", "failed-c", "new-a", "new-b"]);
  });

  it("breaks a tie in name by attention, in both directions", () => {
    const comparator = (direction: "asc" | "desc") =>
      comparatorFor({ field: "name", direction });

    expect(ids([okA, newB, newA].sort(comparator("asc")))).toEqual([
      "new-a",
      "ok-a",
      "new-b",
    ]);
    expect(ids([okA, newB, newA].sort(comparator("desc")))).toEqual([
      "new-b",
      "new-a",
      "ok-a",
    ]);
  });

  it("sorts by the tags, then by name", () => {
    const de = run({ id: "de", name: "B", customTags: "de", os: "" });
    const en = run({ id: "en", name: "A", customTags: "en", os: "" });
    const enToo = run({ id: "en-too", name: "0", customTags: "en", os: "" });

    const sorted = [en, de, enToo].sort(
      comparatorFor({ field: "tags", direction: "asc" }),
    );

    expect(ids(sorted)).toEqual(["de", "en-too", "en"]);
  });
});

describe("comparatorFor by default", () => {
  it("keeps the default sort as it was", () => {
    const sorted = [okA, failedC, newB, newA].sort(comparatorFor(DEFAULT_SORT));

    expect(ids(sorted)).toEqual(["new-a", "new-b", "failed-c", "ok-a"]);
  });
});

describe("sortOfModel", () => {
  it("reads the clicked column and direction", () => {
    expect(sortOfModel([{ field: "tags", sort: "asc" }])).toEqual({
      field: "tags",
      direction: "asc",
    });
  });

  it("gives nothing for no sort, a cleared sort or a column it cannot sort", () => {
    expect(sortOfModel([])).toBeUndefined();
    expect(sortOfModel([{ field: "name", sort: null }])).toBeUndefined();
    expect(sortOfModel([{ field: "id", sort: "asc" }])).toBeUndefined();
    expect(sortOfModel([{ field: "noise", sort: "desc" }])).toBeUndefined();
  });
});
