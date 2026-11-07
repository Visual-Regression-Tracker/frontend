import { screen, waitFor, within } from "@testing-library/react";
import { rejectWithMessage } from "../../_helpers/service.helpers";
import { renderWithProviders } from "../../_test/render";
import { toastOf, undoIn } from "../../_test/toast";
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

const actionButton = (name: string): HTMLElement =>
  screen.getByRole("button", { name });

const APPROVE = "Approve";
const REJECT = "Reject";
const DOWNLOAD = "Download zip";
const DELETE = "Delete…";
const CLEAR_IGNORE = "Clear ignore areas…";

const renderBulkOperation = ({
  selectedIds = SELECTED,
  rows = ROWS,
  testRuns = rows,
  onProcessed = vi.fn(),
  onSelectAll = vi.fn(),
  onClear = vi.fn(),
}: {
  selectedIds?: string[];
  rows?: TestRun[];
  testRuns?: TestRun[];
  onProcessed?: () => void;
  onSelectAll?: () => void;
  onClear?: () => void;
} = {}) => ({
  onProcessed,
  ...renderWithProviders(
    <>
      <SeedTestRuns testRuns={testRuns} />
      <BulkOperation
        selectedIds={selectedIds}
        rows={rows}
        onSelectAll={onSelectAll}
        onClear={onClear}
        onProcessed={onProcessed}
      />
    </>,
  ),
});

const confirm = async (user: ReturnType<typeof renderBulkOperation>["user"]) =>
  user.click(await screen.findByTestId("submitButton"));

describe("BulkOperation", () => {
  it("shows no selection bar while nothing is selected", () => {
    renderBulkOperation({ selectedIds: [] });

    expect(screen.queryByRole("toolbar")).toBeNull();
  });

  it("offers every action when something is selected", () => {
    renderBulkOperation();

    [APPROVE, REJECT, DOWNLOAD, DELETE, CLEAR_IGNORE].forEach((label) =>
      expect(actionButton(label)).toBeEnabled(),
    );
  });

  it("counts the selected runs that are shown and offers to select all under the filter", async () => {
    const onSelectAll = vi.fn();
    const { user } = renderBulkOperation({
      selectedIds: SELECTED_WITH_HIDDEN,
      onSelectAll,
    });

    expect(screen.getByText("1 selected")).toBeVisible();
    await user.click(screen.getByRole("button", { name: "Select all 4" }));

    expect(onSelectAll).toHaveBeenCalledTimes(1);
  });

  it("clears the selection from the close button", async () => {
    const onClear = vi.fn();
    const { user } = renderBulkOperation({ onClear });

    await user.click(screen.getByRole("button", { name: "Clear selection" }));

    expect(onClear).toHaveBeenCalledTimes(1);
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
          merge ? rejectWithMessage("Server error") : allSucceeded(ids),
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

    it("shows the failures as an error when the server broke off", async () => {
      vi.spyOn(testRunService, "approveBulk").mockResolvedValue({
        succeeded: [NEW_RUN.id],
        failed: [{ id: UNRESOLVED_RUN.id, message: "Internal error" }],
      });
      const { user } = renderBulkOperation();

      await user.click(actionButton(APPROVE));
      await confirm(user);

      expect(
        await toastOf("Approved 1 of 2 test runs. 1 failed: Internal error"),
      ).toHaveClass("notistack-MuiContent-error");
    });

    it("names the run another editor got to first", async () => {
      vi.spyOn(testRunService, "approveBulk").mockResolvedValue({
        succeeded: [NEW_RUN.id],
        failed: [
          {
            id: UNRESOLVED_RUN.id,
            message: `Test run ${UNRESOLVED_RUN.id} is already approved`,
          },
        ],
      });
      const { user } = renderBulkOperation();

      await user.click(actionButton(APPROVE));
      await confirm(user);

      expect(
        await screen.findByText(
          'Approved 1 of 2 test runs. 1 failed: Test run "name of unresolved-run (OS · device · browser · viewport · customTags)" is already approved',
        ),
      ).toBeVisible();
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

  describe("undo", () => {
    it("reverts the approved runs from the toast and says so", async () => {
      vi.spyOn(testRunService, "approveBulk").mockImplementation(allSucceeded);
      const revert = vi
        .spyOn(testRunService, "revert")
        .mockResolvedValue(undefined);
      const { user, onProcessed } = renderBulkOperation();

      await user.click(actionButton(APPROVE));
      await confirm(user);
      await user.click(await undoIn("2 test runs approved."));

      expect(revert).toHaveBeenCalledWith(
        [NEW_RUN.id, UNRESOLVED_RUN.id],
        "approve",
      );
      expect(revert).toHaveBeenCalledTimes(1);
      expect(await toastOf("2 test runs restored.")).toHaveClass(
        "notistack-MuiContent-info",
      );
      expect(onProcessed).toHaveBeenCalledTimes(1);
    });

    it("reverts the runs of both approve calls of a mixed selection", async () => {
      const mergeRun = run("merge-run", TestStatus.unresolved, true);
      vi.spyOn(testRunService, "approveBulk").mockImplementation(allSucceeded);
      const revert = vi
        .spyOn(testRunService, "revert")
        .mockResolvedValue(undefined);
      const { user } = renderBulkOperation({
        selectedIds: [NEW_RUN.id, mergeRun.id],
        rows: [NEW_RUN, mergeRun],
      });

      await user.click(actionButton(APPROVE));
      await confirm(user);
      await user.click(await undoIn("2 test runs approved."));

      expect(revert).toHaveBeenCalledWith([NEW_RUN.id, mergeRun.id], "approve");
    });

    it("reverts only the runs that went through when some failed", async () => {
      vi.spyOn(testRunService, "rejectBulk").mockResolvedValue({
        succeeded: [NEW_RUN.id],
        failed: [{ id: UNRESOLVED_RUN.id, message: "Run is locked" }],
      });
      const revert = vi
        .spyOn(testRunService, "revert")
        .mockResolvedValue(undefined);
      const { user } = renderBulkOperation();

      await user.click(actionButton(REJECT));
      await confirm(user);
      await user.click(
        await undoIn("Rejected 1 of 2 test runs. 1 failed: Run is locked"),
      );

      expect(revert).toHaveBeenCalledWith([NEW_RUN.id], "reject");
      expect(await screen.findByText("1 test run restored.")).toBeVisible();
    });

    it("reverts only this user's approvals when another editor got to a run first", async () => {
      const lost = `Test run ${UNRESOLVED_RUN.id} was changed by someone else meanwhile`;
      vi.spyOn(testRunService, "approveBulk").mockResolvedValue({
        succeeded: [NEW_RUN.id],
        failed: [{ id: UNRESOLVED_RUN.id, message: lost }],
      });
      const revert = vi
        .spyOn(testRunService, "revert")
        .mockResolvedValue(undefined);
      const { user } = renderBulkOperation();

      await user.click(actionButton(APPROVE));
      await confirm(user);
      const text =
        'Approved 1 of 2 test runs. 1 failed: Test run "name of unresolved-run (OS · device · browser · viewport · customTags)" was changed by someone else meanwhile';
      expect(await toastOf(text)).toHaveClass("notistack-MuiContent-warning");
      await user.click(await undoIn(text));

      expect(revert).toHaveBeenCalledWith([NEW_RUN.id], "approve");
      expect(revert).toHaveBeenCalledTimes(1);
    });

    it("offers no undo when every run failed", async () => {
      vi.spyOn(testRunService, "approveBulk").mockResolvedValue({
        succeeded: [],
        failed: [
          { id: NEW_RUN.id, message: "Baseline is gone" },
          { id: UNRESOLVED_RUN.id, message: "Baseline is gone" },
        ],
      });
      const { user } = renderBulkOperation();

      await user.click(actionButton(APPROVE));
      await confirm(user);

      const toast = await toastOf(
        "Approved 0 of 2 test runs. 2 failed: Baseline is gone",
      );
      expect(
        within(toast).queryByText("Undo", { selector: "button" }),
      ).not.toBeInTheDocument();
    });

    it("shows why the backend refused to undo", async () => {
      vi.spyOn(testRunService, "rejectBulk").mockImplementation(allSucceeded);
      vi.spyOn(testRunService, "revert").mockRejectedValue(
        "Test run was changed after the rejection",
      );
      const { user } = renderBulkOperation();

      await user.click(actionButton(REJECT));
      await confirm(user);
      await user.click(await undoIn("2 test runs rejected."));

      expect(
        await toastOf("Test run was changed after the rejection"),
      ).toHaveClass("notistack-MuiContent-error");
    });

    it("offers no undo for a delete", async () => {
      vi.spyOn(testRunService, "removeBulk").mockImplementation(allSucceeded);
      const { user } = renderBulkOperation();

      await user.click(actionButton(DELETE));
      await confirm(user);

      const toast = await toastOf("3 test runs processed.");
      expect(
        within(toast).queryByText("Undo", { selector: "button" }),
      ).not.toBeInTheDocument();
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
