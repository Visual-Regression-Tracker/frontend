import { act, renderHook } from "@testing-library/react";
import { run } from "../../_helpers/testRun.fixture";
import { TestRun, TestStatus } from "../../types";
import {
  NOISE_ANALYSIS_CHANGE,
  NOISE_ANALYSIS_NOISE,
  NOISE_ANALYSIS_PENDING,
} from "../../_test/test.data.helper";
import { useTestRunFilters } from "./useTestRunFilters";

const ids = (runs: TestRun[]) => runs.map((item) => item.id);

// only os and custom tags, so the options stay short
const tagged = (overrides: Partial<TestRun>) =>
  run({ device: "", browser: "", viewport: "", ...overrides });

const HOME_EN = tagged({
  id: "home-en",
  name: "Home page",
  os: "iOS",
  customTags: "en",
});
const HOME_DE = tagged({
  id: "home-de",
  name: "Home page",
  os: "Android",
  customTags: "de",
  status: TestStatus.approved,
});
const LOGIN_EN = tagged({
  id: "login-en",
  name: "Login",
  os: "Android",
  customTags: "en",
  status: TestStatus.ok,
});
const RUNS = [HOME_EN, HOME_DE, LOGIN_EN];

const renderFilters = (runs: TestRun[] = RUNS) =>
  renderHook(({ testRuns }) => useTestRunFilters(testRuns), {
    initialProps: { testRuns: runs },
  });

describe("useTestRunFilters", () => {
  it("keeps every run until a filter is set", () => {
    const { result } = renderFilters();

    expect(result.current.filteredRows).toEqual(RUNS);
    expect(result.current.name).toBe("");
    expect(result.current.statuses).toEqual([]);
    expect(result.current.tags).toEqual([]);
  });

  it("matches the name ignoring case and surrounding spaces", () => {
    const { result } = renderFilters();

    act(() => result.current.onNameChange("  HOME "));

    expect(ids(result.current.filteredRows)).toEqual(["home-en", "home-de"]);
  });

  it("keeps the runs with any of the picked statuses", () => {
    const { result } = renderFilters();

    act(() =>
      result.current.onStatusesChange([TestStatus.ok, TestStatus.approved]),
    );

    expect(ids(result.current.filteredRows)).toEqual(["home-de", "login-en"]);
  });

  it("keeps a run with any picked tag of a field and one of every picked field", () => {
    const { result } = renderFilters();

    act(() => result.current.onTagsChange(["en", "de"]));
    expect(ids(result.current.filteredRows)).toEqual([
      "home-en",
      "home-de",
      "login-en",
    ]);

    act(() => result.current.onTagsChange(["en", "Android"]));
    expect(ids(result.current.filteredRows)).toEqual(["login-en"]);
  });

  describe("a tag value that several fields share", () => {
    const ON_DEVICE = tagged({
      id: "on-device",
      os: "iOS",
      device: "chrome",
      customTags: "",
    });
    const IN_BROWSER = tagged({
      id: "in-browser",
      os: "Android",
      browser: "chrome",
      customTags: "",
    });
    const ELSEWHERE = tagged({
      id: "elsewhere",
      os: "iOS",
      device: "pixel",
      browser: "firefox",
      customTags: "",
    });
    const SHARED = [ON_DEVICE, IN_BROWSER, ELSEWHERE];

    it("keeps a run that has it in any of those fields", () => {
      const { result } = renderFilters(SHARED);

      act(() => result.current.onTagsChange(["chrome"]));

      expect(ids(result.current.filteredRows)).toEqual([
        "on-device",
        "in-browser",
      ]);
    });

    it("still needs one of every other picked field", () => {
      const { result } = renderFilters(SHARED);

      act(() => result.current.onTagsChange(["chrome", "iOS"]));

      expect(ids(result.current.filteredRows)).toEqual(["on-device"]);
    });

    it("is offered among the tags of the first field that has it", () => {
      const { result } = renderFilters(SHARED);

      expect(result.current.tagOptions).toEqual([
        "Android",
        "iOS",
        "chrome",
        "pixel",
        "firefox",
      ]);
    });
  });

  it("offers the statuses and tags that still return runs under the other filters", () => {
    const { result } = renderFilters();

    expect(result.current.statusOptions).toEqual([
      TestStatus.unresolved,
      TestStatus.approved,
      TestStatus.ok,
    ]);
    // by field (os before custom tags), then alphabetically
    expect(result.current.tagOptions).toEqual(["Android", "iOS", "de", "en"]);

    act(() => result.current.onNameChange("login"));

    expect(result.current.statusOptions).toEqual([TestStatus.ok]);
    expect(result.current.tagOptions).toEqual(["Android", "en"]);
  });

  it("keeps a picked status and tag on offer though no run left matches it", () => {
    const { result } = renderFilters();

    act(() => {
      result.current.onNameChange("login");
      result.current.onStatusesChange([TestStatus.unresolved]);
      result.current.onTagsChange(["de"]);
    });

    expect(result.current.statusOptions).toContain(TestStatus.unresolved);
    expect(result.current.tagOptions).toContain("de");
  });

  it("adds a tag on its first toggle and removes it on the second", () => {
    const { result } = renderFilters();

    act(() => result.current.toggleTag("en"));
    act(() => result.current.toggleTag("iOS"));
    expect(result.current.tags).toEqual(["en", "iOS"]);

    act(() => result.current.toggleTag("en"));
    expect(result.current.tags).toEqual(["iOS"]);
  });

  it("clears every filter on reset", () => {
    const { result } = renderFilters();
    act(() => {
      result.current.onNameChange("home");
      result.current.onStatusesChange([TestStatus.approved]);
      result.current.onTagsChange(["de"]);
    });

    act(() => result.current.onReset());

    expect(result.current.name).toBe("");
    expect(result.current.statuses).toEqual([]);
    expect(result.current.tags).toEqual([]);
    expect(result.current.filteredRows).toEqual(RUNS);
  });

  it("drops a picked status and tag once no run has them", () => {
    const { result, rerender } = renderFilters();
    act(() => {
      result.current.onStatusesChange([
        TestStatus.unresolved,
        TestStatus.approved,
      ]);
      result.current.onTagsChange(["iOS", "de"]);
    });

    rerender({
      testRuns: [
        { ...HOME_EN, status: TestStatus.approved, os: "Android" },
        HOME_DE,
        LOGIN_EN,
      ],
    });

    expect(result.current.statuses).toEqual([TestStatus.approved]);
    expect(result.current.tags).toEqual(["de"]);
  });

  it("keeps the picks while the build has no runs, as while it loads", () => {
    const { result, rerender } = renderFilters();
    act(() => {
      result.current.onStatusesChange([TestStatus.unresolved]);
      result.current.onTagsChange(["iOS"]);
    });
    const statuses = result.current.statuses;

    rerender({ testRuns: [] });
    rerender({ testRuns: RUNS });

    expect(result.current.statuses).toBe(statuses);
    expect(result.current.tags).toEqual(["iOS"]);
  });
});

describe("useTestRunFilters by noise hint", () => {
  const LIKELY_NOISE = run({
    id: "noise",
    noiseAnalysis: NOISE_ANALYSIS_NOISE,
  });
  const LIKELY_CHANGE = run({
    id: "change",
    noiseAnalysis: NOISE_ANALYSIS_CHANGE,
  });
  const PENDING = run({ id: "pending", noiseAnalysis: NOISE_ANALYSIS_PENDING });
  const UNANALYSED = run({ id: "unanalysed", noiseAnalysis: null });
  const UNKNOWN = run({
    id: "unknown",
    noiseAnalysis: { ...NOISE_ANALYSIS_NOISE, verdict: "unknown" },
  });
  const APPROVED = run({
    id: "approved",
    status: TestStatus.approved,
    noiseAnalysis: NOISE_ANALYSIS_NOISE,
  });
  const HINTED = [
    LIKELY_NOISE,
    LIKELY_CHANGE,
    PENDING,
    UNANALYSED,
    UNKNOWN,
    APPROVED,
  ];

  it("keeps every run until a hint is picked", () => {
    const { result } = renderFilters(HINTED);

    expect(result.current.noiseHints).toEqual([]);
    expect(result.current.filteredRows).toEqual(HINTED);
  });

  it.each([
    ["Likely noise", ["noise"]],
    ["Likely change", ["change"]],
    ["Not analysed", ["pending", "unanalysed", "unknown", "approved"]],
  ] as const)("keeps the runs matching %s", (hint, expected) => {
    const { result } = renderFilters(HINTED);

    act(() => result.current.onNoiseHintsChange?.([hint]));

    expect(ids(result.current.filteredRows)).toEqual(expected);
  });

  it("keeps the runs matching any of several hints", () => {
    const { result } = renderFilters(HINTED);

    act(() =>
      result.current.onNoiseHintsChange?.(["Likely noise", "Likely change"]),
    );

    expect(ids(result.current.filteredRows)).toEqual(["noise", "change"]);
  });

  it("combines with the status filter", () => {
    const { result } = renderFilters(HINTED);

    act(() => {
      result.current.onNoiseHintsChange?.(["Likely noise"]);
      result.current.onStatusesChange([TestStatus.approved]);
    });

    expect(result.current.filteredRows).toEqual([]);
  });

  it("clears the hint on reset", () => {
    const { result } = renderFilters(HINTED);
    act(() => result.current.onNoiseHintsChange?.(["Likely change"]));

    act(() => result.current.onReset());

    expect(result.current.noiseHints).toEqual([]);
    expect(result.current.filteredRows).toEqual(HINTED);
  });

  it("ignores a picked hint while the analysis is unavailable", () => {
    const { result, rerender } = renderHook(
      ({ available }) => useTestRunFilters(HINTED, available),
      { initialProps: { available: true } },
    );
    act(() => result.current.onNoiseHintsChange?.(["Likely change"]));

    rerender({ available: false });

    expect(result.current.noiseHints).toEqual([]);
    expect(result.current.filteredRows).toEqual(HINTED);

    rerender({ available: true });

    expect(ids(result.current.filteredRows)).toEqual(["change"]);
  });

  it("offers no way to pick a hint while the analysis is unavailable", () => {
    const { result } = renderHook(() => useTestRunFilters(HINTED, false));

    expect(result.current.onNoiseHintsChange).toBeUndefined();
  });
});
