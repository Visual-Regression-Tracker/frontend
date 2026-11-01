import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
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
