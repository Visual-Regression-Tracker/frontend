import { type ComponentProps } from "react";
import { screen, within } from "@testing-library/react";
import { renderWithProviders } from "../../_test/render";
import { buttonAroundIcon } from "../../_test/buttonAroundIcon";
import { IgnoreAreasToolbar } from "./IgnoreAreasToolbar";

type Props = ComponentProps<typeof IgnoreAreasToolbar>;

const renderToolbar = (overrides: Partial<Props> = {}) => {
  const props: Props = {
    areaKind: "Ignore Areas",
    onAreaKindChange: vi.fn(),
    isDrawMode: false,
    onDrawModeChange: vi.fn(),
    hasSelection: true,
    hasAreas: true,
    touched: true,
    onDelete: vi.fn(),
    onClear: vi.fn(),
    onApplyToBuild: vi.fn(),
    onSave: vi.fn(),
    onCancel: vi.fn(),
    ...overrides,
  };
  return { ...renderWithProviders(<IgnoreAreasToolbar {...props} />), props };
};

const drawMode = () => buttonAroundIcon("AddIcon");
const deleteArea = () => buttonAroundIcon("DeleteIcon");
const clearAreas = () => buttonAroundIcon("LayersClearIcon");
const applyToBuild = () => buttonAroundIcon("CollectionsIcon");
const save = () => buttonAroundIcon("SaveIcon");
const APPLY_TITLE = "Apply selected ignore area to all images in this build.";

describe("IgnoreAreasToolbar", () => {
  describe("what can be done", () => {
    it("allows every action on a selected area with unsaved changes", () => {
      renderToolbar();

      for (const button of [drawMode, deleteArea, clearAreas, applyToBuild]) {
        expect(button()).toBeEnabled();
      }
      expect(save()).toBeEnabled();
    });

    it("names every button for what it does", () => {
      renderToolbar();

      for (const name of [
        "Draw",
        "Delete selected",
        "Clear all",
        "Apply selected to whole build…",
        "Save",
        "Cancel",
      ]) {
        expect(screen.getByRole("button", { name })).toBeEnabled();
      }
    });

    it("only clears when there are areas but none is selected", () => {
      renderToolbar({ hasSelection: false });

      expect(clearAreas()).toBeEnabled();
      expect(deleteArea()).toBeDisabled();
      expect(applyToBuild()).toBeDisabled();
    });

    it("neither deletes, clears nor applies without areas", () => {
      renderToolbar({ hasAreas: false });

      expect(deleteArea()).toBeDisabled();
      expect(clearAreas()).toBeDisabled();
      expect(applyToBuild()).toBeDisabled();
      expect(drawMode()).toBeEnabled();
    });

    it("has nothing to save without unsaved changes", () => {
      renderToolbar({ touched: false });

      expect(save()).toBeDisabled();
    });
  });

  it("switches draw mode on and off", async () => {
    const off = renderToolbar({ isDrawMode: false });
    expect(drawMode()).toHaveAttribute("aria-pressed", "false");
    await off.user.click(drawMode());
    expect(off.props.onDrawModeChange).toHaveBeenCalledWith(true);
    off.unmount();

    const on = renderToolbar({ isDrawMode: true });
    expect(drawMode()).toHaveAttribute("aria-pressed", "true");
    await on.user.click(drawMode());

    expect(on.props.onDrawModeChange).toHaveBeenCalledWith(false);
  });

  it("deletes, clears and saves", async () => {
    const { user, props } = renderToolbar();

    await user.click(deleteArea());
    await user.click(clearAreas());
    await user.click(save());

    expect(props.onDelete).toHaveBeenCalledTimes(1);
    expect(props.onClear).toHaveBeenCalledTimes(1);
    expect(props.onSave).toHaveBeenCalledTimes(1);
  });

  it("switches to the compare area", async () => {
    const { user, props } = renderToolbar();

    await user.click(screen.getByRole("button", { name: "Compare area" }));

    expect(props.onAreaKindChange).toHaveBeenCalledWith("Compare Area");
  });

  it("shows the chosen kind of area", () => {
    renderToolbar({ areaKind: "Compare Area" });

    expect(
      screen.getByRole("button", { name: "Compare area" }),
    ).toHaveAttribute("aria-pressed", "true");
    expect(
      screen.getByRole("button", { name: "Ignore areas" }),
    ).toHaveAttribute("aria-pressed", "false");
  });

  it("cancels the editing", async () => {
    const { user, props } = renderToolbar();

    await user.click(screen.getByRole("button", { name: "Cancel" }));

    expect(props.onCancel).toHaveBeenCalledTimes(1);
  });

  describe("applying the selected area to the build", () => {
    it("applies once confirmed", async () => {
      const { user, props } = renderToolbar();

      await user.click(applyToBuild());
      const dialog = await screen.findByRole("dialog", { name: APPLY_TITLE });
      expect(props.onApplyToBuild).not.toHaveBeenCalled();
      await user.click(within(dialog).getByRole("button", { name: "Yes" }));

      expect(props.onApplyToBuild).toHaveBeenCalledTimes(1);
      await vi.waitFor(() =>
        expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
      );
    });

    it("applies nothing when cancelled", async () => {
      const { user, props } = renderToolbar();

      await user.click(applyToBuild());
      const dialog = await screen.findByRole("dialog", { name: APPLY_TITLE });
      expect(
        within(dialog).getByText(
          "All images in the current build will be re-compared with new ignore area taken into account. Are you sure?",
        ),
      ).toBeVisible();
      await user.click(within(dialog).getByRole("button", { name: "Cancel" }));

      await vi.waitFor(() =>
        expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
      );
      expect(props.onApplyToBuild).not.toHaveBeenCalled();
    });
  });
});
