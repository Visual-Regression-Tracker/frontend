import { withRenderingNoiseOf } from "./utils";

describe("withRenderingNoiseOf", () => {
  it("carries the filter switch over to the new config", () => {
    expect(
      withRenderingNoiseOf('{"a":1}', '{"ignoreRenderingNoise":true}'),
    ).toBe('{"a":1,"ignoreRenderingNoise":true}');
  });

  it("keeps the new config when the previous one is corrupt", () => {
    expect(withRenderingNoiseOf('{"a":1}', "{oops")).toBe('{"a":1}');
  });
});
