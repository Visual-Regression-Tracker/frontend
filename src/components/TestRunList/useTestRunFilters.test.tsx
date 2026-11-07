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
    expect(result.current.tagFilters.os).toEqual([]);
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

    act(() => result.current.onTagFilterChange("customTags", ["en", "de"]));
    expect(ids(result.current.filteredRows)).toEqual([
      "home-en",
      "home-de",
      "login-en",
    ]);

    act(() => {
      result.current.onTagFilterChange("customTags", ["en"]);
      result.current.onTagFilterChange("os", ["Android"]);
    });
    expect(ids(result.current.filteredRows)).toEqual(["login-en"]);
  });

  it("filters a value only in the field it was picked for", () => {
    const onDevice = tagged({ id: "on-device", device: "chrome" });
    const inBrowser = tagged({ id: "in-browser", browser: "chrome" });
    const { result } = renderFilters([onDevice, inBrowser]);

    act(() => result.current.onTagFilterChange("browser", ["chrome"]));

    expect(ids(result.current.filteredRows)).toEqual(["in-browser"]);
    expect(result.current.tagOptions.device).toEqual(["chrome"]);
  });

  it("offers the statuses and tags that still return runs under the other filters", () => {
    const { result } = renderFilters();

    expect(result.current.statusOptions).toEqual([
      TestStatus.unresolved,
      TestStatus.approved,
      TestStatus.ok,
    ]);
    expect(result.current.tagOptions.os).toEqual(["Android", "iOS"]);
    expect(result.current.tagOptions.customTags).toEqual(["de", "en"]);

    act(() => result.current.onNameChange("login"));

    expect(result.current.statusOptions).toEqual([TestStatus.ok]);
    expect(result.current.tagOptions.os).toEqual(["Android"]);
    expect(result.current.tagOptions.customTags).toEqual(["en"]);
  });

  it("narrows the statuses by the picked tags but not the tags by each other", () => {
    const { result } = renderFilters();

    act(() => result.current.onTagFilterChange("os", ["Android"]));

    expect(result.current.statusOptions).toEqual([
      TestStatus.approved,
      TestStatus.ok,
    ]);
    expect(result.current.tagOptions.os).toEqual(["Android", "iOS"]);
  });

  it("keeps a picked status and tag on offer though no run left matches it", () => {
    const { result } = renderFilters();

    act(() => {
      result.current.onNameChange("login");
      result.current.onStatusesChange([TestStatus.unresolved]);
      result.current.onTagFilterChange("customTags", ["de"]);
    });

    expect(result.current.statusOptions).toContain(TestStatus.unresolved);
    expect(result.current.tagOptions.customTags).toContain("de");
  });

  it("adds a tag on its first toggle and removes it on the second", () => {
    const { result } = renderFilters();

    act(() => result.current.toggleTag("customTags", "en"));
    act(() => result.current.toggleTag("customTags", "de"));
    expect(result.current.tagFilters.customTags).toEqual(["en", "de"]);

    act(() => result.current.toggleTag("customTags", "en"));
    expect(result.current.tagFilters.customTags).toEqual(["de"]);
  });

  it("clears every filter on reset", () => {
    const { result } = renderFilters();
    act(() => {
      result.current.onNameChange("home");
      result.current.onStatusesChange([TestStatus.approved]);
      result.current.onTagFilterChange("customTags", ["de"]);
    });

    act(() => result.current.onReset());

    expect(result.current.name).toBe("");
    expect(result.current.statuses).toEqual([]);
    expect(result.current.tagFilters.customTags).toEqual([]);
    expect(result.current.hasActiveFilters).toBe(false);
    expect(result.current.filteredRows).toEqual(RUNS);
  });

  it("drops a picked status and tag once no run has them", () => {
    const { result, rerender } = renderFilters();
    act(() => {
      result.current.onStatusesChange([
        TestStatus.unresolved,
        TestStatus.approved,
      ]);
      result.current.onTagFilterChange("os", ["iOS"]);
      result.current.onTagFilterChange("customTags", ["de"]);
    });

    rerender({
      testRuns: [
        { ...HOME_EN, status: TestStatus.approved, os: "Android" },
        HOME_DE,
        LOGIN_EN,
      ],
    });

    expect(result.current.statuses).toEqual([TestStatus.approved]);
    expect(result.current.tagFilters.os).toEqual([]);
    expect(result.current.tagFilters.customTags).toEqual(["de"]);
  });

  it("keeps the picks while the build has no runs, as while it loads", () => {
    const { result, rerender } = renderFilters();
    act(() => {
      result.current.onStatusesChange([TestStatus.unresolved]);
      result.current.onTagFilterChange("os", ["iOS"]);
    });
    const statuses = result.current.statuses;

    rerender({ testRuns: [] });
    rerender({ testRuns: RUNS });

    expect(result.current.statuses).toBe(statuses);
    expect(result.current.tagFilters.os).toEqual(["iOS"]);
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
