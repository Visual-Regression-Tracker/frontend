import { screen, within } from "@testing-library/react";

export const toastOf = async (text: string): Promise<HTMLElement> =>
  (await screen.findByText(text)).closest(
    ".notistack-MuiContent",
  ) as HTMLElement;

// by text: an open dialog hides the toasts from the accessibility tree
export const undoIn = async (text: string): Promise<HTMLElement> =>
  within(await toastOf(text)).getByText("Undo", { selector: "button" });
