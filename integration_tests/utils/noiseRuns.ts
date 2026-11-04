import {
  NOISE_ANALYSIS_CHANGE,
  NOISE_ANALYSIS_NOISE,
  NOISE_ANALYSIS_PENDING,
  TEST_UNRESOLVED,
} from "~client/_test/test.data.helper";
import { withRegions } from "~client/_test/noiseRegions";
import type { NoiseSummary, TestRun } from "~client/types";

const unresolved = (
  id: string,
  name: string,
  noiseAnalysis: TestRun["noiseAnalysis"],
): TestRun => ({
  ...TEST_UNRESOLVED,
  id,
  name,
  ignoreAreas: "[]",
  tempIgnoreAreas: "[]",
  noiseAnalysis,
});

export const NOISE_CART = unresolved(
  "noise-cart",
  "Cart",
  NOISE_ANALYSIS_NOISE,
);
export const NOISE_LOGIN = unresolved(
  "noise-login",
  "Login",
  NOISE_ANALYSIS_NOISE,
);
export const NOISE_PRICING = unresolved(
  "noise-pricing",
  "Pricing",
  NOISE_ANALYSIS_NOISE,
);
export const CHANGE_CHECKOUT = unresolved(
  "change-checkout",
  "Checkout",
  NOISE_ANALYSIS_CHANGE,
);
export const PENDING_SEARCH = unresolved(
  "pending-search",
  "Search",
  NOISE_ANALYSIS_PENDING,
);
export const NOT_ANALYSED = unresolved("not-analysed", "Profile", null);

export const ANALYSED_RUNS = [
  NOISE_CART,
  NOISE_LOGIN,
  NOISE_PRICING,
  CHANGE_CHECKOUT,
];

export const RENDERER_CHANGE_SUMMARY: NoiseSummary = {
  unresolved: 5,
  analysed: 5,
  noiseLike: 5,
  byEnvironment: [
    { browser: "chrome", os: "Linux", device: "", unresolved: 5, noiseLike: 5 },
  ],
};

export const BLUR_REGIONS = [
  { x: 200, y: 150, width: 300, height: 120, weight: 0.6 },
  { x: 700, y: 400, width: 220, height: 90, weight: 0.4 },
];
export const DINOV2_REGIONS = [
  { x: 640, y: 80, width: 160, height: 160, weight: 0.5 },
];

export const withNoiseRegions = (run: TestRun): TestRun => ({
  ...run,
  noiseAnalysis: withRegions(
    NOISE_ANALYSIS_NOISE,
    BLUR_REGIONS,
    DINOV2_REGIONS,
  ),
});
