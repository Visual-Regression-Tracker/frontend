import { act, renderHook } from "@testing-library/react";
import { run } from "../../_helpers/testRun.fixture";
import { TestRun, TestStatus } from "../../types";
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

  it("offers the tags that still return runs under the other filters", () => {
    const { result } = renderFilters();

    expect(result.current.tagOptions.os).toEqual(["Android", "iOS"]);
    expect(result.current.tagOptions.customTags).toEqual(["de", "en"]);

    act(() => result.current.onNameChange("login"));

    expect(result.current.tagOptions.os).toEqual(["Android"]);
    expect(result.current.tagOptions.customTags).toEqual(["en"]);
  });

  it("does not narrow the tags of a field by the picks of the others", () => {
    const { result } = renderFilters();

    act(() => result.current.onTagFilterChange("os", ["Android"]));

    expect(result.current.tagOptions.os).toEqual(["Android", "iOS"]);
    expect(result.current.tagOptions.customTags).toEqual(["de", "en"]);
  });

  it("leaves the runs for the status counts unfiltered by status", () => {
    const { result } = renderFilters();

    act(() => {
      result.current.onNameChange("home");
      result.current.onTagFilterChange("customTags", ["de"]);
      result.current.onStatusesChange([TestStatus.ok]);
    });

    expect(result.current.filteredRows).toEqual([]);
    expect(ids(result.current.statusFacetRuns)).toEqual(["home-de"]);
  });

  it("counts statuses over every run while no name or tag is set", () => {
    const { result } = renderFilters();

    act(() => result.current.onStatusesChange([TestStatus.ok]));

    expect(result.current.statusFacetRuns).toEqual(RUNS);
  });

  it("keeps a picked tag on offer though no run left matches it", () => {
    const { result } = renderFilters();

    act(() => {
      result.current.onNameChange("login");
      result.current.onStatusesChange([TestStatus.unresolved]);
      result.current.onTagFilterChange("customTags", ["de"]);
    });

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
