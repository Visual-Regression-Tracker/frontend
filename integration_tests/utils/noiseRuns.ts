import {
  NOISE_ANALYSIS_CHANGE,
  NOISE_ANALYSIS_NOISE,
  NOISE_ANALYSIS_PENDING,
  TEST_PROJECT,
  TEST_UNRESOLVED,
} from "~client/_test/test.data.helper";
import { DEFAULT_NOISE_ANALYSIS_CONFIG } from "~client/constants/project";
import type { TestRun } from "~client/types";

export const PROJECT_WITHOUT_NOISE = {
  ...TEST_PROJECT,
  noiseAnalysisConfig: JSON.stringify({
    ...DEFAULT_NOISE_ANALYSIS_CONFIG,
    blur: { ...DEFAULT_NOISE_ANALYSIS_CONFIG.blur, enabled: false },
    dinov2: { ...DEFAULT_NOISE_ANALYSIS_CONFIG.dinov2, enabled: false },
  }),
};

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
export const NOISE_SETTINGS = unresolved(
  "noise-settings",
  "Settings",
  NOISE_ANALYSIS_NOISE,
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
