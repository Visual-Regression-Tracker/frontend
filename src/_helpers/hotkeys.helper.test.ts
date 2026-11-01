import {
  hotkeyOptions,
  isOutsideReviewDialog,
  isTypingTarget,
} from "./hotkeys.helper";

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

const dialogWithButton = (attributes: Record<string, string> = {}) => {
  const dialog = document.createElement("div");
  dialog.setAttribute("role", "dialog");
  Object.entries(attributes).forEach(([name, value]) =>
    dialog.setAttribute(name, value),
  );
  const button = document.createElement("button");
  dialog.append(button);
  return { dialog, button };
};

describe("isOutsideReviewDialog", () => {
  it("is true inside a confirmation dialog", () => {
    expect(isOutsideReviewDialog(dialogWithButton().button)).toBe(true);
  });

  it("is true inside a confirmation opened from the review dialog", () => {
    const { dialog: review } = dialogWithButton({ "data-review-dialog": "" });
    const { dialog: confirmation, button } = dialogWithButton();
    document.body.append(review, confirmation);

    expect(isOutsideReviewDialog(button)).toBe(true);

    review.remove();
    confirmation.remove();
  });

  it("is false inside the review dialog", () => {
    const { button } = dialogWithButton({ "data-review-dialog": "" });

    expect(isOutsideReviewDialog(button)).toBe(false);
  });

  it("is false inside something the review dialog holds", () => {
    const { dialog, button } = dialogWithButton({ "data-review-dialog": "" });
    const inner = document.createElement("div");
    inner.setAttribute("role", "dialog");
    inner.append(button);
    dialog.append(inner);

    expect(isOutsideReviewDialog(button)).toBe(false);
  });

  it.each(["button", "div", "body"])(
    "is false for a %s outside any dialog",
    (tag) => {
      expect(isOutsideReviewDialog(document.createElement(tag))).toBe(false);
    },
  );

  it("is false without an element", () => {
    expect(isOutsideReviewDialog(null)).toBe(false);
    expect(isOutsideReviewDialog(document)).toBe(false);
  });
});

describe("hotkeyOptions", () => {
  const keyOn = (target: EventTarget) => {
    const event = new KeyboardEvent("keydown", { key: "d" });
    Object.defineProperty(event, "target", { value: target });
    return event;
  };

  it("lets the hotkeys through on form fields", () => {
    expect(hotkeyOptions.enableOnFormTags).toBe(true);
  });

  it("ignores a key typed into a text field", () => {
    expect(hotkeyOptions.ignoreEventWhen?.(keyOn(input("text")))).toBe(true);
  });

  it("ignores a key pressed in a confirmation dialog", () => {
    expect(
      hotkeyOptions.ignoreEventWhen?.(keyOn(dialogWithButton().button)),
    ).toBe(true);
  });

  it("takes a key pressed in the review dialog", () => {
    const { button } = dialogWithButton({ "data-review-dialog": "" });

    expect(hotkeyOptions.ignoreEventWhen?.(keyOn(button))).toBe(false);
  });

  it("takes a key pressed on a focused switch", () => {
    expect(hotkeyOptions.ignoreEventWhen?.(keyOn(input("checkbox")))).toBe(
      false,
    );
  });
});
