import type { Options } from "react-hotkeys-hook";

// A checkbox only takes Space, so a switch that keeps focus after a click must not block hotkeys
export const isTypingTarget = (target: EventTarget | null): boolean => {
  if (!(target instanceof HTMLElement)) {
    return false;
  }
  if (target.isContentEditable) {
    return true;
  }
  if (target instanceof HTMLInputElement) {
    return target.type !== "checkbox";
  }
  return (
    target instanceof HTMLTextAreaElement || target instanceof HTMLSelectElement
  );
};

// Confirmations render in their own portal and take focus; the review dialog marks its paper with data-review-dialog
export const isOutsideReviewDialog = (target: EventTarget | null): boolean => {
  if (!(target instanceof HTMLElement)) {
    return false;
  }
  const dialog = target.closest('[role="dialog"]');

  return !!dialog && !dialog.closest("[data-review-dialog]");
};

// The library skips every form field, the diff switch included; only fields being typed into are left out
export const hotkeyOptions: Options = {
  enableOnFormTags: true,
  ignoreEventWhen: (event) =>
    isTypingTarget(event.target) || isOutsideReviewDialog(event.target),
};
