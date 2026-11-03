import { runLabel, tagValuesOf, tagsOf } from "./testRunTags.helper";
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

describe("runLabel", () => {
  it("names the run with its tags, as one screen runs in several browsers", () => {
    expect(runLabel(run({ name: "Login" }))).toBe(
      `Login (${tagsOf(run(), ["os", "device", "browser", "viewport", "customTags"])})`,
    );
  });

  it("is just the name when the run has no tags", () => {
    expect(
      runLabel(
        run({
          name: "Login",
          os: "",
          device: "",
          browser: "",
          viewport: "",
          customTags: "",
        }),
      ),
    ).toBe("Login");
  });
});
