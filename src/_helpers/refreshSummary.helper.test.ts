import { describeRefresh } from "./refreshSummary.helper";

const summary = (partial: Partial<Parameters<typeof describeRefresh>[0]>) => ({
  compared: 0,
  unchanged: 0,
  skipped: 0,
  resolved: 0,
  reopened: 0,
  ...partial,
});

describe("describeRefresh", () => {
  it("says what moved", () => {
    expect(describeRefresh(summary({ compared: 7, resolved: 3 }))).toBe(
      "Re-compared 7 screenshots, 3 no longer differ.",
    );
  });

  it("speaks of one screenshot in the singular", () => {
    expect(describeRefresh(summary({ compared: 1, resolved: 1 }))).toBe(
      "Re-compared 1 screenshot, 1 no longer differs.",
    );
  });

  it("says so when the refresh pushed a screen the other way", () => {
    expect(
      describeRefresh(summary({ compared: 12, resolved: 9, reopened: 1 })),
    ).toBe("Re-compared 12 screenshots, 9 no longer differ, 1 now differs.");
  });

  // the button must not read as if it could only ever help
  it("reports a screen that broke even when nothing was put right", () => {
    expect(describeRefresh(summary({ compared: 3, reopened: 2 }))).toBe(
      "Re-compared 3 screenshots, 2 now differ.",
    );
  });

  // a baseline moved but the screen still differs from it: the refresh did
  // something, and saying "nothing changed" would be the wrong half of it
  it("separates having compared from having resolved", () => {
    expect(describeRefresh(summary({ compared: 4, resolved: 0 }))).toBe(
      "Re-compared 4 screenshots, none of them changed.",
    );
  });

  it("answers plainly when the build is already up to date", () => {
    expect(describeRefresh(summary({ unchanged: 40 }))).toBe(
      "Every screenshot is already on its current baseline.",
    );
  });

  it("does not claim a baseline is current when nothing was eligible", () => {
    expect(describeRefresh(summary({ skipped: 12 }))).toBe(
      "Nothing to re-compare.",
    );
  });
});
