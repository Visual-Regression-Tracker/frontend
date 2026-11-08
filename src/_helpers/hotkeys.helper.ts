import type { Options } from "react-hotkeys-hook";

// A checkbox only takes Space and a slider only the arrows, so neither blocks the letter hotkeys
export const isTypingTarget = (target: EventTarget | null): boolean => {
  if (!(target instanceof HTMLElement)) {
    return false;
  }
  if (target.isContentEditable) {
    return true;
  }
  if (target instanceof HTMLInputElement) {
    return target.type !== "checkbox" && target.type !== "range";
  }
  return (
    target instanceof HTMLTextAreaElement || target instanceof HTMLSelectElement
  );
};

const isSlider = (target: EventTarget | null): boolean =>
  target instanceof HTMLInputElement && target.type === "range";

const isSliderArrow = (event: KeyboardEvent): boolean =>
  isSlider(event.target) && event.key.startsWith("Arrow");

export const ownsEscape = (target: EventTarget | null): boolean =>
  isTypingTarget(target) || isSlider(target);

// confirmations portal out of the review dialog, which marks its paper data-review-dialog
export const isOutsideReviewDialog = (target: EventTarget | null): boolean => {
  if (!(target instanceof HTMLElement)) {
    return false;
  }
  const dialog = target.closest('[role="dialog"]');

  return !!dialog && !dialog.closest("[data-review-dialog]");
};

// useKey matches the typed character too, so hotkeys follow the keyboard layout
export const hotkeyMatching: Options = { useKey: true };

// The library skips every form field, the diff switch included; only fields being typed into are left out
export const hotkeyOptions: Options = {
  ...hotkeyMatching,
  enableOnFormTags: true,
  ignoreEventWhen: (event) =>
    isTypingTarget(event.target) ||
    isSliderArrow(event) ||
    isOutsideReviewDialog(event.target),
};
