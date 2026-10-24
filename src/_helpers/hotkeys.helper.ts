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
