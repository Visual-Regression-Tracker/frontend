import {
  firstError,
  isEmail,
  max,
  min,
  minLength,
  required,
} from "./validation";

describe("validation rules", () => {
  it.each([
    ["text", true],
    ["", false],
    [undefined, false],
    [null, false],
    [Number.NaN, false],
  ])("required accepts %j: %s", (value, valid) => {
    expect(required("Required").isValid(value)).toBe(valid);
  });

  it.each([
    ["ab", true],
    ["abc", true],
    ["a", false],
    ["", false],
    [undefined, false],
  ])("minLength(2) accepts %j: %s", (value, valid) => {
    expect(minLength(2, "Too short").isValid(value)).toBe(valid);
  });

  it.each([
    ["user@example.com", true],
    ["first.last+tag@mail.example.org", true],
    ["", true],
    [undefined, true],
    ["user", false],
    ["user@example", false],
    ["user @example.com", false],
    ["@example.com", false],
  ])("isEmail accepts %j: %s", (value, valid) => {
    expect(isEmail("Invalid").isValid(value)).toBe(valid);
  });

  it.each([
    [0, true],
    [0.7, true],
    [1, true],
    ["0.5", true],
    ["", true],
    [null, true],
    [-0.5, false],
    [1.5, false],
    [Number.NaN, true],
  ])("min(0) and max(1) together accept %j: %s", (value, valid) => {
    const rules = [min(0, "Too low"), max(1, "Too high")];
    expect(rules.every((rule) => rule.isValid(value))).toBe(valid);
  });
});

describe("firstError", () => {
  const rules = [
    required("Required"),
    min(1, "At least 1"),
    max(10, "At most 10"),
  ];

  it("gives the message of the first rule that fails", () => {
    expect(firstError(-5, rules, true)).toBe("At least 1");
    expect(firstError(50, rules, true)).toBe("At most 10");
  });

  it("gives nothing for a valid value", () => {
    expect(firstError(5, rules, true)).toBeUndefined();
  });

  it("checks required only on submit", () => {
    expect(firstError("", rules, false)).toBeUndefined();
    expect(firstError("", rules, true)).toBe("Required");
  });
});
