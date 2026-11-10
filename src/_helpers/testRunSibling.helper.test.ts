import { TestStatus } from "../types/testStatus";
import { run } from "./testRun.fixture";
import { isSibling, resolveGroupByAxis } from "./testRunSibling.helper";

describe("resolveGroupByAxis", () => {
  it("falls back to customTags", () => {
    expect(resolveGroupByAxis()).toBe("customTags");
    expect(resolveGroupByAxis("nonsense")).toBe("customTags");
  });

  it("keeps a known axis", () => {
    expect(resolveGroupByAxis("viewport")).toBe("viewport");
  });
});

describe("isSibling", () => {
  it("ignores the group by axis and compares the rest", () => {
    const base = run({ id: "a", customTags: "en_US" });

    expect(
      isSibling(base, run({ id: "b", customTags: "de_DE" }), "customTags"),
    ).toBe(true);
    expect(
      isSibling(base, run({ id: "c", browser: "firefox" }), "customTags"),
    ).toBe(false);
  });

  it("does not look at the status", () => {
    const base = run({ id: "a", customTags: "en_US" });
    const approved = run({
      id: "b",
      customTags: "de_DE",
      status: TestStatus.approved,
    });

    expect(isSibling(base, approved, "customTags")).toBe(true);
  });
});
