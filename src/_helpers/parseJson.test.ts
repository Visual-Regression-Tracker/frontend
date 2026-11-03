import { parseJson } from "./parseJson";

describe("parseJson", () => {
  it("parses valid JSON", () => {
    expect(parseJson('{"a":1}', {})).toEqual({ a: 1 });
  });

  it("returns the fallback for null", () => {
    expect(parseJson(null, false)).toBe(false);
  });

  it("returns the fallback for corrupt JSON", () => {
    expect(parseJson("{oops", false)).toBe(false);
  });
});
