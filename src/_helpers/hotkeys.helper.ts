import type { Options } from "react-hotkeys-hook";

// Keys pressed in a field that is typed into, or whose value the keys move,
// belong to that field, not to the page's hotkeys. A checkbox only takes
// Space, so a switch that keeps focus after a click does not hold them back.
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

// For the hotkeys of a view with form controls in it: the library would skip
// every form field, the diff switch among them, so they are let through and
// only the fields being typed into are left out.
export const hotkeyOptions: Options = {
  enableOnFormTags: true,
  ignoreEventWhen: (event) => isTypingTarget(event.target),
};
