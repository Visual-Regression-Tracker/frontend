import { TestStatus } from "../types";
import { BuildStatus } from "../types/buildStatus";
import { statusLabel, statusLabelInline } from "./statusLabel.helper";

describe("statusLabel", () => {
  it.each([
    [TestStatus.new, "New"],
    [TestStatus.ok, "Passed"],
    [TestStatus.unresolved, "Unresolved"],
    [TestStatus.failed, "Failed"],
    [TestStatus.approved, "Approved"],
    [TestStatus.autoApproved, "Auto-approved"],
    [BuildStatus.passed, "Passed"],
    [BuildStatus.unresolved, "Unresolved"],
    [BuildStatus.failed, "Failed"],
  ])("labels %s as %s", (status, label) => {
    expect(statusLabel(status)).toBe(label);
  });

  it("falls back to the raw value for an unknown status", () => {
    expect(statusLabel("something else")).toBe("something else");
  });

  it("says nothing for a missing status", () => {
    expect(statusLabel(undefined)).toBe("");
  });
});

describe("statusLabelInline", () => {
  it("lowercases the label for use inside a sentence", () => {
    expect(statusLabelInline(TestStatus.autoApproved)).toBe("auto-approved");
  });
});
