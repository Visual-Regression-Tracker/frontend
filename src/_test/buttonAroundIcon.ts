import { screen } from "@testing-library/react";

// for icon buttons that have no name of their own
export const buttonAroundIcon = (iconTestId: string): HTMLButtonElement => {
  const button = screen.getByTestId(iconTestId).closest("button");
  if (!button) {
    throw new Error(`no button around ${iconTestId}`);
  }
  return button;
};
