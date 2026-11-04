import { getContrastRatio, type Palette } from "@mui/material/styles";
import { theme } from "./theme";
import { hintColor, statusColor } from "./status";
import { TestStatus } from "../types/testStatus";
import { BuildStatus } from "../types/buildStatus";

const schemes = ["light", "dark"] as const;
// the CSS-variables theme keeps one resolved palette per colour scheme
const { colorSchemes } = theme as unknown as {
  colorSchemes: Record<(typeof schemes)[number], { palette: Palette }>;
};
const statusKeys = ["success", "warning", "error", "info"] as const;

describe("theme", () => {
  it.each(schemes)(
    "keeps status text readable on paper in %s mode",
    (scheme) => {
      const palette = colorSchemes[scheme].palette;
      for (const key of statusKeys) {
        expect(
          getContrastRatio(palette[key].main, palette.background.paper),
        ).toBeGreaterThanOrEqual(4.5);
      }
    },
  );

  it.each(schemes)(
    "keeps the noise hint readable on paper in %s mode",
    (scheme) => {
      const palette = colorSchemes[scheme].palette;
      expect(
        getContrastRatio(palette.hint.main, palette.background.paper),
      ).toBeGreaterThanOrEqual(4.5);
    },
  );

  it.each(schemes)("keeps body text readable in %s mode", (scheme) => {
    const palette = colorSchemes[scheme].palette;
    expect(
      getContrastRatio(palette.text.primary, palette.background.default),
    ).toBeGreaterThanOrEqual(7);
    expect(
      getContrastRatio(palette.text.secondary, palette.background.paper),
    ).toBeGreaterThanOrEqual(4.5);
  });

  it.each(schemes)("keeps primary buttons readable in %s mode", (scheme) => {
    const { primary } = colorSchemes[scheme].palette;
    expect(
      getContrastRatio(primary.contrastText, primary.main),
    ).toBeGreaterThanOrEqual(4.5);
  });
});

describe("statusColor", () => {
  it.each([
    [TestStatus.new, "info"],
    [TestStatus.unresolved, "warning"],
    [TestStatus.failed, "error"],
    [TestStatus.ok, "success"],
    [TestStatus.approved, "success"],
    [TestStatus.autoApproved, "success"],
    [BuildStatus.passed, "success"],
    [BuildStatus.unresolved, "warning"],
    [BuildStatus.failed, "error"],
    [undefined, "default"],
    ["running", "default"],
  ])("gives %s the %s colour", (status, color) => {
    expect(statusColor(status)).toBe(color);
  });
});

describe("hintColor", () => {
  it.each([
    ["noise", "hint"],
    ["pending", "hint"],
    ["change", "info"],
  ] as const)("gives %s the %s colour", (hint, color) => {
    expect(hintColor(hint)).toBe(color);
  });
});

describe("infoWash", () => {
  it.each([
    ["light", "rgba(29, 78, 216, 0.12)"],
    ["dark", "rgba(114, 180, 242, 0.12)"],
  ] as const)(
    "is the soft tint of the info colour in %s mode",
    (scheme, wash) => {
      expect(colorSchemes[scheme].palette.infoWash).toBe(wash);
    },
  );
});
