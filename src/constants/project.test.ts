import {
  DEFAULT_NOISE_ANALYSIS_CONFIG,
  DEFAULT_NOISE_ANALYSIS_CONFIG_JSON,
  DEFAULT_PROJECT_EDIT_STATE,
} from "./project";

describe("noise analysis defaults", () => {
  it("serialise to the config string the API stores for a new project", () => {
    expect(DEFAULT_NOISE_ANALYSIS_CONFIG_JSON).toBe(
      '{"blur":{"enabled":false,"amplitudeThreshold":80,"solidShareMax":0.01},"dinov2":{"enabled":false,"distanceThreshold":0.15}}',
    );
    expect(JSON.parse(DEFAULT_NOISE_ANALYSIS_CONFIG_JSON)).toEqual(
      DEFAULT_NOISE_ANALYSIS_CONFIG,
    );
  });

  it("are what a new project starts with", () => {
    expect(DEFAULT_PROJECT_EDIT_STATE.noiseAnalysisConfig).toBe(
      DEFAULT_NOISE_ANALYSIS_CONFIG_JSON,
    );
  });
});
