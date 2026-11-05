import { screen } from "@testing-library/react";
import { renderWithProviders } from "../_test/render";
import { TEST_BUILD_PASSED } from "../_test/test.data.helper";
import { buildsService } from "../services";
import { BuildMenu } from "./BuildMenu";

const renderMenu = (build = TEST_BUILD_PASSED, onClose = vi.fn()) =>
  renderWithProviders(
    <BuildMenu
      build={build}
      anchorEl={document.body}
      onClose={onClose}
      onDeleted={vi.fn()}
    />,
  );

describe("BuildMenu", () => {
  it("lists edit and delete for a finished build", () => {
    renderMenu();

    expect(screen.getAllByRole("menuitem").map((i) => i.textContent)).toEqual([
      "Edit CI build id…",
      "Delete build…",
    ]);
  });

  it("puts Stop build first for a running build and stops it", async () => {
    const update = vi
      .spyOn(buildsService, "update")
      .mockResolvedValue({ ...TEST_BUILD_PASSED, isRunning: false });
    const onClose = vi.fn();
    const { user } = renderMenu(
      { ...TEST_BUILD_PASSED, isRunning: true },
      onClose,
    );

    expect(screen.getAllByRole("menuitem")[0]).toHaveTextContent("Stop build");
    await user.click(screen.getByRole("menuitem", { name: "Stop build" }));

    expect(update).toHaveBeenCalledWith(TEST_BUILD_PASSED.id, {
      isRunning: false,
    });
    expect(onClose).toHaveBeenCalled();
    expect(
      await screen.findByText(`${TEST_BUILD_PASSED.id} finished`),
    ).toBeVisible();
  });

  it("does not save a CI build id shorter than two characters", async () => {
    const update = vi.spyOn(buildsService, "update");
    const { user } = renderMenu();

    await user.click(
      screen.getByRole("menuitem", { name: "Edit CI build id…" }),
    );
    await user.type(screen.getByTestId("newCiBuildId"), "r");
    await user.click(screen.getByTestId("submitButton"));

    expect(
      await screen.findByText("Enter at least two characters."),
    ).toBeVisible();
    expect(update).not.toHaveBeenCalled();
  });
});
