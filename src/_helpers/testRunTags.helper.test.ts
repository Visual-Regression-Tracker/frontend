import {
  runLabel,
  splitTags,
  tagItemsOf,
  tagValuesOf,
  tagsOf,
} from "./testRunTags.helper";
import { run } from "./testRun.fixture";

describe("splitTags", () => {
  it("splits the custom tags on commas", () => {
    expect(splitTags("Tag1,Tag2")).toEqual(["Tag1", "Tag2"]);
  });

  it("trims each tag and drops empty and repeated ones", () => {
    expect(splitTags(" Tag1 , ,Tag2,Tag1,")).toEqual(["Tag1", "Tag2"]);
  });

  it("keeps spaces and other separators inside a tag", () => {
    expect(splitTags("dark mode;beta|rc")).toEqual(["dark mode;beta|rc"]);
  });

  it("has no tags for an empty or missing value", () => {
    expect(splitTags("")).toEqual([]);
    expect(splitTags(null)).toEqual([]);
    expect(splitTags(undefined)).toEqual([]);
  });
});

describe("tagItemsOf", () => {
  it("splits only the custom tags", () => {
    expect(tagItemsOf("Tag1,Tag2", "customTags")).toEqual(["Tag1", "Tag2"]);
    expect(tagItemsOf("a,b", "device")).toEqual(["a,b"]);
  });

  it("has no tags for an empty field", () => {
    expect(tagItemsOf("", "os")).toEqual([]);
    expect(tagItemsOf(undefined, "customTags")).toEqual([]);
  });
});

describe("tagValuesOf", () => {
  it("lists each custom tag on its own", () => {
    expect(
      tagValuesOf(run({ customTags: "Tag1,Tag2" }), ["os", "customTags"]),
    ).toEqual(["iOS", "Tag1", "Tag2"]);
  });

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
