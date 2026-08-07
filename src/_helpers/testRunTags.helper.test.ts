import { tagValuesOf, tagsOf } from "./testRunTags.helper";
import { run } from "./testRun.fixture";

describe("tagValuesOf", () => {
  it("lists the value of each requested field", () => {
    expect(tagValuesOf(run(), ["os", "customTags"])).toEqual(["iOS", "en_US"]);
  });

  it("skips fields the run leaves empty", () => {
    expect(
      tagValuesOf(run({ device: "" }), ["os", "device", "customTags"]),
    ).toEqual(["iOS", "en_US"]);
  });
});

describe("tagsOf", () => {
  it("joins the values a card shows one by one", () => {
    expect(tagsOf(run(), ["os", "customTags"])).toBe(
      tagValuesOf(run(), ["os", "customTags"]).join(" · "),
    );
  });
});
