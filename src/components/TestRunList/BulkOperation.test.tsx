import React from "react";
import { screen, waitFor, within } from "@testing-library/react";
import { renderWithProviders } from "../../_test/render";
import { SeedTestRuns } from "../../_test/SeedTestRuns";
import { staticService, testRunService } from "../../services";
import { TestRun, TestStatus } from "../../types";
import { testRunMock } from "../../_test/test.data.helper";
import { BulkOperation } from "./BulkOperation";

const run = (id: string, status: TestStatus, merge = false): TestRun => ({
  ...testRunMock,
  id,
  name: `name of ${id}`,
  imageName: `${id}.png`,
  status,
  merge,
});

const NEW_RUN = run("new-run", TestStatus.new);
const UNRESOLVED_RUN = run("unresolved-run", TestStatus.unresolved);
const APPROVED_RUN = run("approved-run", TestStatus.approved);
const NOT_SELECTED_RUN = run("not-selected-run", TestStatus.unresolved);
const ROWS = [NEW_RUN, UNRESOLVED_RUN, APPROVED_RUN, NOT_SELECTED_RUN];
const SELECTED = [NEW_RUN.id, UNRESOLVED_RUN.id, APPROVED_RUN.id];

// the tooltip's label sits on a span around the (possibly disabled) button
const actionButton = (label: string): HTMLButtonElement => {
  const button = screen.getByLabelText(label).querySelector("button");
  if (!button) {
    throw new Error(`no button in "${label}"`);
  }
  return button;
};

const APPROVE = "Approve unresolved in selected rows.";
const REJECT = "Reject unresolved in selected rows.";
const DOWNLOAD = "Download images for selected rows.";
const DELETE = "Delete selected rows.";
const CLEAR_IGNORE = "Clear ignore areas for selected rows.";

const renderBulkOperation = ({
  selectedIds = SELECTED,
  rows = ROWS,
  onProcessed = vi.fn(),
}: {
  selectedIds?: string[];
  rows?: TestRun[];
  onProcessed?: () => void;
} = {}) => ({
  onProcessed,
  ...renderWithProviders(
    <>
      <SeedTestRuns testRuns={rows} />
      <BulkOperation
        selectedIds={selectedIds}
        rows={rows}
        selectionNoun="rows"
        onProcessed={onProcessed}
      />
    </>,
  ),
});

const confirm = async (user: ReturnType<typeof renderBulkOperation>["user"]) =>
  user.click(await screen.findByTestId("submitButton"));

describe("BulkOperation", () => {
  it("disables every action while nothing is selected", () => {
    renderBulkOperation({ selectedIds: [] });

    [APPROVE, REJECT, DOWNLOAD, DELETE, CLEAR_IGNORE].forEach((label) =>
      expect(actionButton(label)).toBeDisabled(),
    );
  });

  it("enables every action when something is selected", () => {
    renderBulkOperation();

    [APPROVE, REJECT, DOWNLOAD, DELETE, CLEAR_IGNORE].forEach((label) =>
      expect(actionButton(label)).toBeEnabled(),
    );
  });

  it("names the selection by the noun it is given", () => {
    renderWithProviders(
      <BulkOperation
        selectedIds={SELECTED}
        rows={ROWS}
        selectionNoun="cards"
        onProcessed={vi.fn()}
      />,
    );

    expect(screen.getByLabelText("Delete selected cards.")).toBeInTheDocument();
  });

  describe("approve", () => {
    it("asks for confirmation counting every selected item", async () => {
      const approveBulk = vi.spyOn(testRunService, "approveBulk");
      const { user } = renderBulkOperation();

      await user.click(actionButton(APPROVE));

      const dialog = await screen.findByRole("dialog");
      expect(within(dialog).getByText("Approve Test Runs")).toBeVisible();
      expect(
        within(dialog).getByText("Are you sure you want to approve 3 items?"),
      ).toBeVisible();
      expect(approveBulk).not.toHaveBeenCalled();
    });

    it("approves only the selected new and unresolved runs", async () => {
      const approveBulk = vi
        .spyOn(testRunService, "approveBulk")
        .mockResolvedValue();
      const { user, onProcessed } = renderBulkOperation();

      await user.click(actionButton(APPROVE));
      await confirm(user);

      await waitFor(() =>
        expect(approveBulk).toHaveBeenCalledWith(
          [NEW_RUN.id, UNRESOLVED_RUN.id],
          false,
        ),
      );
      expect(approveBulk).toHaveBeenCalledTimes(1);
      expect(await screen.findByText("3 test runs processed.")).toBeVisible();
      expect(onProcessed).toHaveBeenCalledTimes(1);
    });

    it("approves with merge when the selected runs are merges", async () => {
      const mergeRun = run("merge-run", TestStatus.unresolved, true);
      const approveBulk = vi
        .spyOn(testRunService, "approveBulk")
        .mockResolvedValue();
      const { user } = renderBulkOperation({
        selectedIds: [mergeRun.id],
        rows: [mergeRun, NEW_RUN],
      });

      await user.click(actionButton(APPROVE));
      await confirm(user);

      await waitFor(() =>
        expect(approveBulk).toHaveBeenCalledWith([mergeRun.id], true),
      );
    });

    it("does not call the service when cancelled", async () => {
      const approveBulk = vi.spyOn(testRunService, "approveBulk");
      const { user, onProcessed } = renderBulkOperation();

      await user.click(actionButton(APPROVE));
      await user.click(await screen.findByRole("button", { name: "Cancel" }));

      await waitFor(() =>
        expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
      );
      expect(approveBulk).not.toHaveBeenCalled();
      expect(onProcessed).not.toHaveBeenCalled();
    });

    it("keeps the selection and shows the error when the request fails", async () => {
      vi.spyOn(testRunService, "approveBulk").mockRejectedValue(
        "Server says no",
      );
      const { user, onProcessed } = renderBulkOperation();

      await user.click(actionButton(APPROVE));
      await confirm(user);

      expect(await screen.findByText("Server says no")).toBeVisible();
      expect(onProcessed).not.toHaveBeenCalled();
      expect(screen.queryByText(/test runs processed/)).not.toBeInTheDocument();
    });
  });

  describe("reject", () => {
    it("rejects only the selected new and unresolved runs", async () => {
      const rejectBulk = vi
        .spyOn(testRunService, "rejectBulk")
        .mockResolvedValue();
      const { user, onProcessed } = renderBulkOperation();

      await user.click(actionButton(REJECT));
      expect(
        await screen.findByText("Are you sure you want to reject 3 items?"),
      ).toBeVisible();
      await confirm(user);

      await waitFor(() =>
        expect(rejectBulk).toHaveBeenCalledWith([
          NEW_RUN.id,
          UNRESOLVED_RUN.id,
        ]),
      );
      expect(await screen.findByText("3 test runs processed.")).toBeVisible();
      expect(onProcessed).toHaveBeenCalledTimes(1);
    });
  });

  describe("delete", () => {
    it("deletes every selected run regardless of status", async () => {
      const removeBulk = vi
        .spyOn(testRunService, "removeBulk")
        .mockResolvedValue();
      const { user, onProcessed } = renderBulkOperation();

      await user.click(actionButton(DELETE));
      const dialog = await screen.findByRole("dialog");
      expect(within(dialog).getByText("Delete Test Runs")).toBeVisible();
      expect(
        within(dialog).getByText("Are you sure you want to delete 3 items?"),
      ).toBeVisible();
      await confirm(user);

      await waitFor(() => expect(removeBulk).toHaveBeenCalledWith(SELECTED));
      expect(onProcessed).toHaveBeenCalledTimes(1);
    });

    it("does not delete when cancelled", async () => {
      const removeBulk = vi.spyOn(testRunService, "removeBulk");
      const { user } = renderBulkOperation();

      await user.click(actionButton(DELETE));
      await user.click(await screen.findByRole("button", { name: "Cancel" }));

      await waitFor(() =>
        expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
      );
      expect(removeBulk).not.toHaveBeenCalled();
    });
  });

  describe("download", () => {
    it("zips the images of the selected runs and keeps the selection", async () => {
      const downloadAsZip = vi
        .spyOn(staticService, "downloadAsZip")
        .mockResolvedValue();
      const { user, onProcessed } = renderBulkOperation();

      await user.click(actionButton(DOWNLOAD));
      expect(
        await screen.findByText("Are you sure you want to download 3 items?"),
      ).toBeVisible();
      await confirm(user);

      await waitFor(() =>
        expect(downloadAsZip).toHaveBeenCalledWith([
          { filename: NEW_RUN.name, name: NEW_RUN.imageName },
          { filename: UNRESOLVED_RUN.name, name: UNRESOLVED_RUN.imageName },
          { filename: APPROVED_RUN.name, name: APPROVED_RUN.imageName },
        ]),
      );
      expect(await screen.findByText("3 test runs processed.")).toBeVisible();
      // a download changes nothing, so the ticks stay
      expect(onProcessed).not.toHaveBeenCalled();
    });
  });

  describe("clear ignore areas", () => {
    it("clears the ignore areas of every selected run", async () => {
      const updateIgnoreAreas = vi
        .spyOn(testRunService, "updateIgnoreAreas")
        .mockResolvedValue();
      const { user, onProcessed } = renderBulkOperation();

      await user.click(actionButton(CLEAR_IGNORE));
      const dialog = await screen.findByRole("dialog");
      expect(
        within(dialog).getByText("Clear Ignore Area For Selected Items"),
      ).toBeVisible();
      expect(
        within(dialog).getByText("Are you sure you want to clear 3 items?"),
      ).toBeVisible();
      await confirm(user);

      await waitFor(() =>
        expect(updateIgnoreAreas).toHaveBeenCalledWith({
          ids: SELECTED,
          ignoreAreas: [],
        }),
      );
      expect(onProcessed).toHaveBeenCalledTimes(1);
    });
  });
});
