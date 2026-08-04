import { TestRun } from "../types";
import { TestStatus } from "../types/testStatus";
import { tagValuesOf, tagsOf } from "./testRunTags.helper";

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

describe("tagValuesOf", () => {
  it("lists the value of each requested field", () => {
    expect(tagValuesOf(BASE, ["os", "customTags"])).toEqual(["iOS", "en_US"]);
  });

  it("skips fields the run leaves empty", () => {
    expect(
      tagValuesOf({ ...BASE, device: "" }, ["os", "device", "customTags"]),
    ).toEqual(["iOS", "en_US"]);
  });
});

describe("tagsOf", () => {
  it("joins the values a card shows one by one", () => {
    expect(tagsOf(BASE, ["os", "customTags"])).toBe(
      tagValuesOf(BASE, ["os", "customTags"]).join(" · "),
    );
  });
});
