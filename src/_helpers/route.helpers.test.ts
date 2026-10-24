import {
  buildProjectPageUrl,
  buildTestRunLocation,
  getQueryParams,
} from "./route.helpers";

describe("buildProjectPageUrl", () => {
  it.each([
    ["p1", "/p1"],
    ["some-project-id", "/some-project-id"],
    ["", "/"],
  ])("builds the page of project %j as %j", (projectId, expected) => {
    expect(buildProjectPageUrl(projectId)).toBe(expected);
  });
});

describe("buildTestRunLocation", () => {
  it.each([
    ["no build", undefined, undefined, ""],
    ["no build but a test run", undefined, "t1", ""],
    ["an empty build", "", "t1", ""],
    ["a build only", "b1", undefined, "buildId=b1"],
    ["an empty test run", "b1", "", "buildId=b1"],
    ["a build and a test run", "b1", "t1", "buildId=b1&testId=t1"],
  ])("searches for %s", (_name, buildId, testRunId, search) => {
    expect(buildTestRunLocation(buildId, testRunId)).toEqual({ search });
  });

  it("asks for no build at all when called without arguments", () => {
    expect(buildTestRunLocation()).toEqual({ search: "" });
  });
});

describe("getQueryParams", () => {
  it.each([
    ["an empty query", "", {}],
    ["a lone question mark", "?", {}],
    ["a build", "?buildId=b1", { buildId: "b1" }],
    ["a test run", "?testId=t1", { testId: "t1" }],
    [
      "a build and a test run",
      "?buildId=b1&testId=t1",
      { buildId: "b1", testId: "t1" },
    ],
    [
      "a query without the question mark",
      "buildId=b1&testId=t1",
      { buildId: "b1", testId: "t1" },
    ],
    ["params it does not know", "?foo=bar&buildId=b1", { buildId: "b1" }],
    ["encoded values", "?buildId=a%20b%26c", { buildId: "a b&c" }],
  ])("reads %s", (_name, query, expected) => {
    expect({ ...getQueryParams(query) }).toEqual(expected);
  });

  it("answers undefined for the params that are missing", () => {
    expect(getQueryParams("")).toEqual({
      buildId: undefined,
      testId: undefined,
    });
  });

  // NOTE: qs gives an array for a repeated param, but the result is typed as a string
  it("hands back an array when a param is repeated", () => {
    expect(getQueryParams("?buildId=b1&buildId=b2").buildId).toEqual([
      "b1",
      "b2",
    ]);
  });

  it("round-trips what buildTestRunLocation builds", () => {
    const { search } = buildTestRunLocation("b1", "t1");

    expect(getQueryParams(search)).toEqual({ buildId: "b1", testId: "t1" });
  });
});
