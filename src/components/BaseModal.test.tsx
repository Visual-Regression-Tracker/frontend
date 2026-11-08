import { type ComponentProps } from "react";
import { act, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "../_test/render";
import { BaseModal } from "./BaseModal";

const renderModal = (onSubmit: () => void | Promise<unknown>) =>
  render(
    <BaseModal
      open
      title="Create thing"
      submitButtonText="Create"
      content={<p>Form</p>}
      onSubmit={onSubmit}
      onCancel={vi.fn()}
    />,
  );

describe("BaseModal", () => {
  test("holds the submit button until the submit settles", async () => {
    let resolve: () => void = () => {};
    const onSubmit = vi.fn(() => new Promise<void>((done) => (resolve = done)));
    renderModal(onSubmit);
    const user = userEvent.setup();

    await user.click(screen.getByRole("button", { name: "Create" }));

    expect(
      await screen.findByRole("button", { name: "Create" }),
    ).toBeDisabled();
    await act(async () => {
      resolve();
      await Promise.resolve();
    });
    expect(screen.getByRole("button", { name: "Create" })).toBeEnabled();
    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  test("lets the user submit again after a failure", async () => {
    const onSubmit = vi.fn().mockRejectedValueOnce("Offline");
    renderModal(onSubmit);
    const user = userEvent.setup();

    await user.click(screen.getByRole("button", { name: "Create" }));

    expect(await screen.findByRole("button", { name: "Create" })).toBeEnabled();
  });

  test("keeps the button enabled when the submit returns nothing", async () => {
    const onSubmit = vi.fn();
    renderModal(onSubmit);
    const user = userEvent.setup();

    await user.click(screen.getByRole("button", { name: "Create" }));
    await user.click(screen.getByRole("button", { name: "Create" }));

    expect(onSubmit).toHaveBeenCalledTimes(2);
    expect(screen.getByRole("button", { name: "Create" })).toBeEnabled();
  });
});

describe("BaseModal layout", () => {
  const renderPlain = (
    props: Partial<ComponentProps<typeof BaseModal>> = {},
  ) => {
    const onCancel = vi.fn();
    renderWithProviders(
      <BaseModal
        open
        title="Delete build"
        submitButtonText="Delete"
        content={<p>Sure?</p>}
        onSubmit={vi.fn()}
        onCancel={onCancel}
        {...props}
      />,
    );
    return onCancel;
  };

  test("titles the dialog", () => {
    renderPlain();

    expect(
      screen.getByRole("dialog", { name: "Delete build" }),
    ).toBeInTheDocument();
  });

  test("puts Cancel before the submit button", () => {
    renderPlain();

    const names = within(screen.getByRole("dialog"))
      .getAllByRole("button")
      .map((button) => button.textContent);

    expect(names.indexOf("Cancel")).toBeLessThan(names.indexOf("Delete"));
  });

  test("colours a destructive submit with the error colour", () => {
    renderPlain({ submitColor: "error" });

    expect(screen.getByRole("button", { name: "Delete" })).toHaveClass(
      "MuiButton-colorError",
    );
  });

  test("closes from the close button", async () => {
    const onCancel = renderPlain();

    await userEvent.click(screen.getByRole("button", { name: "Close dialog" }));

    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  test("a form is wider than a confirmation", () => {
    renderPlain({ size: "md" });

    expect(document.querySelector(".MuiDialog-paperWidthMd")).not.toBeNull();
  });
});
