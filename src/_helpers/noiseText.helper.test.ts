import {
  NOISE_ANALYSIS_CHANGE,
  NOISE_ANALYSIS_NOISE,
} from "../_test/test.data.helper";
import { stagesText } from "./noiseText.helper";

const blur = {
  ...NOISE_ANALYSIS_NOISE.blur,
  verdict: "noise",
  score: 0.4,
} as const;

describe("stagesText", () => {
  it.each([
    ["no second stage", undefined, "Blur only: likely noise (0.40)"],
    [
      "a second stage that answered",
      NOISE_ANALYSIS_CHANGE.dinov2,
      "Blur: likely noise (0.40) · DINOv2: likely change (0.77)",
    ],
    [
      "a second stage that did not answer",
      { error: "dinov2 unavailable" },
      "Blur: likely noise (0.40) · DINOv2: did not answer",
    ],
    [
      "a second stage that is off",
      { skipped: "off" },
      "Blur: likely noise (0.40) · DINOv2: off in this project",
    ],
    [
      "a second stage that was not needed",
      { skipped: "blur sees a change" },
      "Blur: likely noise (0.40) · DINOv2: not needed, blur already sees a change",
    ],
  ])("reads %s", (_, dinov2, expected) => {
    expect(
      stagesText({ blur, dinov2 } as Parameters<typeof stagesText>[0]),
    ).toBe(expected);
  });

  it("says no verdict when blur has none", () => {
    expect(stagesText({})).toBe("Blur only: no verdict");
  });
});
