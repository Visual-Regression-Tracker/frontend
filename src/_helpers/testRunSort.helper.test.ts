import { run } from "./testRun.fixture";
import { DEFAULT_SORT } from "../components/TestRunList/TestRunGridToolbar";
import { TAG_FIELDS } from "./testRunTags.helper";
import { TagField, TestRun, TestStatus } from "../types";
import { comparatorFor, sortOfModel } from "./testRunSort.helper";
import {
  NOISE_ANALYSIS_CHANGE,
  NOISE_ANALYSIS_NOISE,
  NOISE_ANALYSIS_PENDING,
} from "../_test/test.data.helper";

const ids = (runs: TestRun[]) => runs.map((item) => item.id);
const allTags = () => TAG_FIELDS;

const okA = run({ id: "ok-a", name: "A", status: TestStatus.ok });
const newB = run({ id: "new-b", name: "B", status: TestStatus.new });
const newA = run({ id: "new-a", name: "A", status: TestStatus.new });
const failedC = run({ id: "failed-c", name: "C", status: TestStatus.failed });

describe("comparatorFor", () => {
  it("puts the runs needing attention first when status is descending", () => {
    const sorted = [okA, failedC, newB, newA].sort(
      comparatorFor({ field: "status", direction: "desc" }, allTags),
    );

    expect(ids(sorted)).toEqual(["new-a", "new-b", "failed-c", "ok-a"]);
  });

  it("flips only the status on ascending, keeping names in order", () => {
    const sorted = [newB, failedC, okA, newA].sort(
      comparatorFor({ field: "status", direction: "asc" }, allTags),
    );

    expect(ids(sorted)).toEqual(["ok-a", "failed-c", "new-a", "new-b"]);
  });

  it("breaks a tie in name by attention, in both directions", () => {
    const comparator = (direction: "asc" | "desc") =>
      comparatorFor({ field: "name", direction }, allTags);

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

  it("sorts by the tags the given fields show, then by name", () => {
    const de = run({ id: "de", name: "B", customTags: "de", os: "" });
    const en = run({ id: "en", name: "A", customTags: "en", os: "" });
    const enToo = run({ id: "en-too", name: "0", customTags: "en", os: "" });
    const tagFieldsOf = vi.fn((): TagField[] => ["os", "customTags"]);

    const sorted = [en, de, enToo].sort(
      comparatorFor({ field: "tags", direction: "asc" }, tagFieldsOf),
    );

    expect(ids(sorted)).toEqual(["de", "en-too", "en"]);
    // each run's tags are read once, however often it is compared
    expect(tagFieldsOf).toHaveBeenCalledTimes(3);
  });
});

describe("comparatorFor by noise", () => {
  const noise = run({
    id: "noise",
    name: "Z",
    noiseAnalysis: NOISE_ANALYSIS_NOISE,
  });
  const change = run({
    id: "change",
    name: "Y",
    noiseAnalysis: NOISE_ANALYSIS_CHANGE,
  });
  const none = run({ id: "none", name: "X", noiseAnalysis: null });
  const pending = run({
    id: "pending",
    name: "A",
    noiseAnalysis: NOISE_ANALYSIS_PENDING,
  });
  const approved = run({
    id: "approved",
    name: "B",
    status: TestStatus.approved,
    noiseAnalysis: NOISE_ANALYSIS_CHANGE,
  });
  const unknown = run({
    id: "unknown",
    name: "C",
    noiseAnalysis: { ...NOISE_ANALYSIS_NOISE, verdict: "unknown", score: 0 },
  });
  const all = [none, noise, pending, approved, change, unknown];
  const sortedBy = (direction: "asc" | "desc") =>
    ids([...all].sort(comparatorFor({ field: "noise", direction }, allTags)));

  it("puts the likely changes first when descending", () => {
    expect(sortedBy("desc").slice(0, 2)).toEqual(["change", "noise"]);
  });

  it("puts the likely noise first when ascending", () => {
    expect(sortedBy("asc").slice(0, 2)).toEqual(["noise", "change"]);
  });

  it("keeps runs without a hint last in both directions, ordered by name", () => {
    const withoutHint = ["pending", "approved", "unknown", "none"];

    expect(sortedBy("desc").slice(2)).toEqual(withoutHint);
    expect(sortedBy("asc").slice(2)).toEqual(withoutHint);
  });

  it("keeps the default sort as it was", () => {
    const sorted = [okA, failedC, newB, newA].sort(
      comparatorFor(DEFAULT_SORT, allTags),
    );

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

  it("reads the noise column", () => {
    expect(sortOfModel([{ field: "noise", sort: "desc" }])).toEqual({
      field: "noise",
      direction: "desc",
    });
  });

  it("gives nothing for no sort, a cleared sort or a column it cannot sort", () => {
    expect(sortOfModel([])).toBeUndefined();
    expect(sortOfModel([{ field: "name", sort: null }])).toBeUndefined();
    expect(sortOfModel([{ field: "id", sort: "asc" }])).toBeUndefined();
  });
});
