import { screen, waitFor, within } from "@testing-library/react";
import { renderWithProviders } from "../../_test/render";
import { SeedTestRuns } from "../../_test/SeedTestRuns";
import { staticService, testRunService } from "../../services";
import { TestRun, TestStatus } from "../../types";
import { testRunMock } from "../../_test/test.data.helper";
import { BulkOperation } from "./BulkOperation";
import { allSucceeded } from "../../_test/bulkResult";

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
const HIDDEN_RUN = run("hidden-run", TestStatus.new);
const SELECTED_WITH_HIDDEN = [NEW_RUN.id, HIDDEN_RUN.id];

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
  testRuns = rows,
  onProcessed = vi.fn(),
}: {
  selectedIds?: string[];
  rows?: TestRun[];
  testRuns?: TestRun[];
  onProcessed?: () => void;
} = {}) => ({
  onProcessed,
  ...renderWithProviders(
    <>
      <SeedTestRuns testRuns={testRuns} />
      <BulkOperation
        selectedIds={selectedIds}
        rows={rows}
        selectionNoun="rows"
        onProcessed={onProcessed}
      />
    </>,
  ),
});

const toastOf = async (text: string) =>
  (await screen.findByText(text)).closest(".notistack-MuiContent");

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
    it("asks for confirmation counting only the runs that will be approved", async () => {
      const approveBulk = vi.spyOn(testRunService, "approveBulk");
      const { user } = renderBulkOperation();

      await user.click(actionButton(APPROVE));

      const dialog = await screen.findByRole("dialog");
      expect(within(dialog).getByText("Approve Test Runs")).toBeVisible();
      expect(
        within(dialog).getByText(
          "Approve 2 of 3 selected test runs? The other 1 is already settled.",
        ),
      ).toBeVisible();
      expect(approveBulk).not.toHaveBeenCalled();
    });

    it("names the eligible and the selected runs when most were settled", async () => {
      const runs = Array.from({ length: 50 }, (_, i) =>
        run(`run-${i}`, i < 12 ? TestStatus.new : TestStatus.approved),
      );
      const approveBulk = vi
        .spyOn(testRunService, "approveBulk")
        .mockImplementation(allSucceeded);
      const { user } = renderBulkOperation({
        selectedIds: runs.map((r) => r.id),
        rows: runs,
      });

      await user.click(actionButton(APPROVE));
      expect(
        await screen.findByText(
          "Approve 12 of 50 selected test runs? The other 38 are already settled.",
        ),
      ).toBeVisible();
      await confirm(user);

      expect(await screen.findByText("12 test runs approved.")).toBeVisible();
      expect(approveBulk).toHaveBeenCalledWith(
        runs.slice(0, 12).map((r) => r.id),
        false,
      );
    });

    it("asks without the settled note when every selected run is eligible", async () => {
      const { user } = renderBulkOperation({
        selectedIds: [NEW_RUN.id, UNRESOLVED_RUN.id],
      });

      await user.click(actionButton(APPROVE));

      expect(await screen.findByText("Approve 2 test runs?")).toBeVisible();
    });

    it("approves only the selected new and unresolved runs", async () => {
      const approveBulk = vi
        .spyOn(testRunService, "approveBulk")
        .mockImplementation(allSucceeded);
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
      expect(await screen.findByText("2 test runs approved.")).toBeVisible();
      expect(onProcessed).toHaveBeenCalledTimes(1);
    });

    it("approves with merge when the selected runs are merges", async () => {
      const mergeRun = run("merge-run", TestStatus.unresolved, true);
      const approveBulk = vi
        .spyOn(testRunService, "approveBulk")
        .mockImplementation(allSucceeded);
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

    it("approves each run with its own merge flag in a mixed selection", async () => {
      const plainRun = run("plain-run", TestStatus.unresolved, false);
      const mergeRun = run("merge-run", TestStatus.unresolved, true);
      const approveBulk = vi
        .spyOn(testRunService, "approveBulk")
        .mockImplementation(allSucceeded);
      const { user, onProcessed } = renderBulkOperation({
        selectedIds: [plainRun.id, mergeRun.id],
        rows: [plainRun, mergeRun],
      });

      await user.click(actionButton(APPROVE));
      await confirm(user);

      await waitFor(() => expect(approveBulk).toHaveBeenCalledTimes(2));
      expect(approveBulk).toHaveBeenCalledWith([plainRun.id], false);
      expect(approveBulk).toHaveBeenCalledWith([mergeRun.id], true);
      await waitFor(() => expect(onProcessed).toHaveBeenCalledTimes(1));
    });

    it("tells the user how many were approved when some failed, and keeps those selected", async () => {
      const runs = Array.from({ length: 12 }, (_, i) =>
        run(`run-${i}`, TestStatus.new),
      );
      vi.spyOn(testRunService, "approveBulk").mockResolvedValue({
        succeeded: runs.slice(0, 10).map((r) => r.id),
        failed: [
          { id: "run-10", message: "Baseline is gone" },
          { id: "run-11", message: "Image is missing" },
        ],
      });
      const { user, onProcessed } = renderBulkOperation({
        selectedIds: runs.map((r) => r.id),
        rows: runs,
      });

      await user.click(actionButton(APPROVE));
      await confirm(user);

      const text = "Approved 10 of 12 test runs. 2 failed: Baseline is gone";
      expect(await toastOf(text)).toHaveClass("notistack-MuiContent-warning");
      expect(screen.queryByText("12 test runs approved.")).toBeNull();
      expect(onProcessed).toHaveBeenCalledTimes(1);
      expect(onProcessed).toHaveBeenCalledWith(["run-10", "run-11"]);
    });

    it("merges the results of the two approve calls of a mixed selection", async () => {
      const plainRun = run("plain-run", TestStatus.unresolved, false);
      const mergeRun = run("merge-run", TestStatus.unresolved, true);
      vi.spyOn(testRunService, "approveBulk").mockImplementation(
        (ids, merge) =>
          merge
            ? Promise.resolve({
                succeeded: [],
                failed: [{ id: String(ids[0]), message: "Merge conflict" }],
              })
            : allSucceeded(ids),
      );
      const { user, onProcessed } = renderBulkOperation({
        selectedIds: [plainRun.id, mergeRun.id],
        rows: [plainRun, mergeRun],
      });

      await user.click(actionButton(APPROVE));
      await confirm(user);

      expect(
        await screen.findByText(
          "Approved 1 of 2 test runs. 1 failed: Merge conflict",
        ),
      ).toBeVisible();
      expect(onProcessed).toHaveBeenCalledWith([mergeRun.id]);
    });

    it("reports the approved half when the other approve call fails outright", async () => {
      const plainRun = run("plain-run", TestStatus.unresolved, false);
      const mergeRun = run("merge-run", TestStatus.unresolved, true);
      vi.spyOn(testRunService, "approveBulk").mockImplementation(
        (ids, merge) =>
          merge ? Promise.reject("Server error") : allSucceeded(ids),
      );
      const { user, onProcessed } = renderBulkOperation({
        selectedIds: [plainRun.id, mergeRun.id],
        rows: [plainRun, mergeRun],
      });

      await user.click(actionButton(APPROVE));
      await confirm(user);

      expect(
        await screen.findByText(
          "Approved 1 of 2 test runs. 1 failed: Server error",
        ),
      ).toBeVisible();
      expect(onProcessed).toHaveBeenCalledWith([mergeRun.id]);
    });

    it("says nothing was approved when every run failed", async () => {
      vi.spyOn(testRunService, "approveBulk").mockResolvedValue({
        succeeded: [],
        failed: [
          { id: NEW_RUN.id, message: "Baseline is gone" },
          { id: UNRESOLVED_RUN.id, message: "Baseline is gone" },
        ],
      });
      const { user, onProcessed } = renderBulkOperation();

      await user.click(actionButton(APPROVE));
      await confirm(user);

      expect(
        await screen.findByText(
          "Approved 0 of 2 test runs. 2 failed: Baseline is gone",
        ),
      ).toBeVisible();
      expect(onProcessed).toHaveBeenCalledWith([NEW_RUN.id, UNRESOLVED_RUN.id]);
    });

    it("drops the whole selection when the server answers with an empty body", async () => {
      vi.stubGlobal(
        "fetch",
        vi.fn().mockResolvedValue(new Response("", { status: 201 })),
      );
      const { user, onProcessed } = renderBulkOperation();

      await user.click(actionButton(APPROVE));
      await confirm(user);

      expect(await screen.findByText("2 test runs approved.")).toBeVisible();
      expect(onProcessed).toHaveBeenCalledWith([]);
      vi.unstubAllGlobals();
    });

    it("approves nothing and says so when every selected run is settled", async () => {
      const approveBulk = vi.spyOn(testRunService, "approveBulk");
      const { user, onProcessed } = renderBulkOperation({
        selectedIds: [APPROVED_RUN.id],
      });

      await user.click(actionButton(APPROVE));
      await confirm(user);

      expect(await screen.findByText("0 test runs approved.")).toBeVisible();
      expect(onProcessed).toHaveBeenCalledWith([]);
      expect(approveBulk).not.toHaveBeenCalled();
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
      expect(screen.queryByText(/test runs approved/)).not.toBeInTheDocument();
    });
  });

  describe("reject", () => {
    it("rejects only the selected new and unresolved runs", async () => {
      const rejectBulk = vi
        .spyOn(testRunService, "rejectBulk")
        .mockImplementation(allSucceeded);
      const { user, onProcessed } = renderBulkOperation();

      await user.click(actionButton(REJECT));
      expect(
        await screen.findByText(
          "Reject 2 of 3 selected test runs? The other 1 is already settled.",
        ),
      ).toBeVisible();
      await confirm(user);

      await waitFor(() =>
        expect(rejectBulk).toHaveBeenCalledWith([
          NEW_RUN.id,
          UNRESOLVED_RUN.id,
        ]),
      );
      expect(await screen.findByText("2 test runs rejected.")).toBeVisible();
      expect(onProcessed).toHaveBeenCalledTimes(1);
    });

    it("tells the user how many were rejected when some failed", async () => {
      vi.spyOn(testRunService, "rejectBulk").mockResolvedValue({
        succeeded: [NEW_RUN.id],
        failed: [{ id: UNRESOLVED_RUN.id, message: "Run is locked" }],
      });
      const { user, onProcessed } = renderBulkOperation();

      await user.click(actionButton(REJECT));
      await confirm(user);

      expect(
        await toastOf("Rejected 1 of 2 test runs. 1 failed: Run is locked"),
      ).toHaveClass("notistack-MuiContent-warning");
      expect(onProcessed).toHaveBeenCalledWith([UNRESOLVED_RUN.id]);
    });
  });

  describe("delete", () => {
    it("deletes every selected run regardless of status", async () => {
      const removeBulk = vi
        .spyOn(testRunService, "removeBulk")
        .mockImplementation(allSucceeded);
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

    it("deletes and counts only the selected runs that are shown", async () => {
      const removeBulk = vi
        .spyOn(testRunService, "removeBulk")
        .mockImplementation(allSucceeded);
      const { user } = renderBulkOperation({
        selectedIds: SELECTED_WITH_HIDDEN,
        testRuns: [...ROWS, HIDDEN_RUN],
      });

      await user.click(actionButton(DELETE));
      expect(
        await screen.findByText("Are you sure you want to delete 1 items?"),
      ).toBeVisible();
      await confirm(user);

      await waitFor(() =>
        expect(removeBulk).toHaveBeenCalledWith([NEW_RUN.id]),
      );
      expect(await screen.findByText("1 test run processed.")).toBeVisible();
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

    it("tells the user how many were deleted when some failed", async () => {
      vi.spyOn(testRunService, "removeBulk").mockResolvedValue({
        succeeded: [NEW_RUN.id, UNRESOLVED_RUN.id],
        failed: [{ id: APPROVED_RUN.id, message: "Run is in use" }],
      });
      const { user, onProcessed } = renderBulkOperation();

      await user.click(actionButton(DELETE));
      await confirm(user);

      expect(
        await toastOf("Deleted 2 of 3 test runs. 1 failed: Run is in use"),
      ).toHaveClass("notistack-MuiContent-warning");
      expect(onProcessed).toHaveBeenCalledWith([APPROVED_RUN.id]);
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
          {
            filename: `${NEW_RUN.name} - OS - device - browser - viewport - customTags`,
            name: NEW_RUN.imageName,
          },
          {
            filename: `${UNRESOLVED_RUN.name} - OS - device - browser - viewport - customTags`,
            name: UNRESOLVED_RUN.imageName,
          },
          {
            filename: `${APPROVED_RUN.name} - OS - device - browser - viewport - customTags`,
            name: APPROVED_RUN.imageName,
          },
        ]),
      );
      expect(await screen.findByText("3 test runs processed.")).toBeVisible();
      expect(onProcessed).not.toHaveBeenCalled();
    });

    it("names each image by its test and the tags that set it apart", async () => {
      const downloadAsZip = vi
        .spyOn(staticService, "downloadAsZip")
        .mockResolvedValue();
      const chrome: TestRun = {
        ...run("chrome", TestStatus.new),
        name: "Home",
        os: "",
        device: "",
        browser: "chrome",
        viewport: "1280x720",
        customTags: "",
      };
      const firefox: TestRun = { ...chrome, id: "firefox", browser: "firefox" };
      const { user } = renderBulkOperation({
        selectedIds: [chrome.id, firefox.id],
        rows: [chrome, firefox],
      });

      await user.click(actionButton(DOWNLOAD));
      await confirm(user);

      await waitFor(() =>
        expect(downloadAsZip).toHaveBeenCalledWith([
          { filename: "Home - chrome - 1280x720", name: chrome.imageName },
          { filename: "Home - firefox - 1280x720", name: firefox.imageName },
        ]),
      );
    });

    it("zips only the selected runs that are shown", async () => {
      const downloadAsZip = vi
        .spyOn(staticService, "downloadAsZip")
        .mockResolvedValue();
      const { user } = renderBulkOperation({
        selectedIds: SELECTED_WITH_HIDDEN,
        testRuns: [...ROWS, HIDDEN_RUN],
      });

      await user.click(actionButton(DOWNLOAD));
      expect(
        await screen.findByText("Are you sure you want to download 1 items?"),
      ).toBeVisible();
      await confirm(user);

      await waitFor(() =>
        expect(downloadAsZip).toHaveBeenCalledWith([
          expect.objectContaining({ name: NEW_RUN.imageName }),
        ]),
      );
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

    it("clears only the selected runs that are shown", async () => {
      const updateIgnoreAreas = vi
        .spyOn(testRunService, "updateIgnoreAreas")
        .mockResolvedValue();
      const { user } = renderBulkOperation({
        selectedIds: SELECTED_WITH_HIDDEN,
        testRuns: [...ROWS, HIDDEN_RUN],
      });

      await user.click(actionButton(CLEAR_IGNORE));
      expect(
        await screen.findByText("Are you sure you want to clear 1 items?"),
      ).toBeVisible();
      await confirm(user);

      await waitFor(() =>
        expect(updateIgnoreAreas).toHaveBeenCalledWith({
          ids: [NEW_RUN.id],
          ignoreAreas: [],
        }),
      );
    });
  });
});
