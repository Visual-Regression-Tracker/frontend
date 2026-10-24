import { isTypingTarget } from "./hotkeys.helper";

const input = (type: string) => {
  const element = document.createElement("input");
  element.type = type;
  return element;
};

describe("isTypingTarget", () => {
  it.each(["text", "search", "number", "range", "radio"])(
    "is true for an input of type %s",
    (type) => {
      expect(isTypingTarget(input(type))).toBe(true);
    },
  );

  it.each(["textarea", "select"])("is true for a %s", (tag) => {
    expect(isTypingTarget(document.createElement(tag))).toBe(true);
  });

  it("is true for editable content", () => {
    const element = document.createElement("div");
    element.contentEditable = "true";
    // jsdom does not derive isContentEditable from the attribute
    Object.defineProperty(element, "isContentEditable", { value: true });

    expect(isTypingTarget(element)).toBe(true);
  });

  it("is false for a checkbox, which only takes Space", () => {
    expect(isTypingTarget(input("checkbox"))).toBe(false);
  });

  it.each(["button", "div", "body"])("is false for a %s", (tag) => {
    expect(isTypingTarget(document.createElement(tag))).toBe(false);
  });

  it("is false without an element", () => {
    expect(isTypingTarget(null)).toBe(false);
    expect(isTypingTarget(document)).toBe(false);
  });
});
