import { useEffect } from "react";
import { screen, waitFor } from "@testing-library/react";
import { renderWithProviders } from "../../_test/render";
import { SeedTestRuns } from "../../_test/SeedTestRuns";
import { projectsService, testRunService } from "../../services";
import {
  selectProject,
  useProjectDispatch,
  useProjectState,
} from "../../contexts";
import { Project, TestRun, TestStatus } from "../../types";
import {
  TEST_PROJECT,
  TEST_USER,
  testRunMock,
} from "../../_test/test.data.helper";
import { ApproveRejectButtons } from "./ApproveRejectButtons";
import { NO_FAILURES } from "../../_test/bulkResult";

const UNRESOLVED: TestRun = {
  ...testRunMock,
  id: "unresolved-id",
  status: TestStatus.unresolved,
  merge: false,
};

const siblingOf = (run: TestRun, changes: Partial<TestRun>): TestRun => ({
  ...run,
  id: "sibling-id",
  status: TestStatus.unresolved,
  customTags: "other tags",
  ...changes,
});

// waits until the project is selected and loaded, so a not-shown check cannot pass early
const SelectProject = ({ id }: { id: string }) => {
  const dispatch = useProjectDispatch();
  const { projectList, selectedProjectId } = useProjectState();
  useEffect(() => selectProject(dispatch, id), [dispatch, id]);
  return projectList.length > 0 && selectedProjectId === id ? (
    <div data-testid="project-ready" />
  ) : null;
};

const projectReady = () => screen.findByTestId("project-ready");

// the buttons are named by their tooltip ("Hotkey: A"), so find them by text
const approveButton = () => screen.getByText("Approve", { selector: "button" });
const rejectButton = () => screen.getByText("Reject", { selector: "button" });

const renderButtons = async ({
  testRun = UNRESOLVED,
  project = { ...TEST_PROJECT, bulkApproveVariations: true },
  testRuns = [testRun],
  afterApprove = vi.fn(),
  afterReject = vi.fn(),
  onOpenVariations = vi.fn(),
}: {
  testRun?: TestRun;
  project?: Project;
  testRuns?: TestRun[];
  afterApprove?: () => void;
  afterReject?: () => void;
  onOpenVariations?: (mode: "approve" | "reject") => void;
} = {}) => {
  vi.spyOn(projectsService, "getAll").mockResolvedValue([project]);
  const ui = (run: TestRun) => (
    <>
      <SeedTestRuns testRuns={testRuns} />
      <SelectProject id={project.id} />
      <ApproveRejectButtons
        testRun={run}
        afterApprove={afterApprove}
        afterReject={afterReject}
        onOpenVariations={onOpenVariations}
      />
    </>
  );
  const result = renderWithProviders(ui(testRun), { user: TEST_USER });
  await projectReady();
  return {
    ...result,
    afterApprove,
    afterReject,
    onOpenVariations,
    showTestRun: (run: TestRun) => result.rerender(ui(run)),
    giveCallbacks: (callbacks: {
      afterApprove?: () => void;
      afterReject?: () => void;
    }) =>
      result.rerender(
        <>
          <SeedTestRuns testRuns={testRuns} />
          <SelectProject id={project.id} />
          <ApproveRejectButtons
            testRun={testRun}
            afterApprove={callbacks.afterApprove ?? afterApprove}
            afterReject={callbacks.afterReject ?? afterReject}
            onOpenVariations={onOpenVariations}
          />
        </>,
      ),
  };
};

describe("ApproveRejectButtons", () => {
  describe("approve", () => {
    it("approves the test run by its id", async () => {
      const approveBulk = vi
        .spyOn(testRunService, "approveBulk")
        .mockResolvedValue(NO_FAILURES);
      const { user, afterApprove, afterReject } = await renderButtons();

      await user.click(approveButton());

      await waitFor(() =>
        expect(approveBulk).toHaveBeenCalledWith([UNRESOLVED.id], false),
      );
      expect(approveBulk).toHaveBeenCalledTimes(1);
      expect(await screen.findByText("Approved")).toBeVisible();
      expect(afterApprove).toHaveBeenCalledTimes(1);
      expect(afterReject).not.toHaveBeenCalled();
    });

    it("approves a merge into the target branch and says so", async () => {
      const mergeRun = { ...UNRESOLVED, merge: true };
      const approveBulk = vi
        .spyOn(testRunService, "approveBulk")
        .mockResolvedValue(NO_FAILURES);
      const { user } = await renderButtons({ testRun: mergeRun });

      expect(
        screen.getByText(`merge into: ${mergeRun.baselineBranchName}`),
      ).toBeVisible();
      await user.click(approveButton());

      await waitFor(() =>
        expect(approveBulk).toHaveBeenCalledWith([mergeRun.id], true),
      );
    });

    it("does not mention a merge for an ordinary run", async () => {
      await renderButtons();

      expect(screen.queryByText(/merge into/)).not.toBeInTheDocument();
    });

    it("shows the error and does not carry on when approving fails", async () => {
      vi.spyOn(testRunService, "approveBulk").mockRejectedValue(
        "Cannot approve",
      );
      const { user, afterApprove } = await renderButtons();

      await user.click(approveButton());

      expect(await screen.findByText("Cannot approve")).toBeVisible();
      expect(afterApprove).not.toHaveBeenCalled();
      expect(screen.queryByText("Approved")).not.toBeInTheDocument();
    });

    it("shows the reason and does not carry on when the backend refuses the run", async () => {
      vi.spyOn(testRunService, "approveBulk").mockResolvedValue({
        succeeded: [],
        failed: [{ id: UNRESOLVED.id, message: "Baseline is locked" }],
      });
      const { user, afterApprove } = await renderButtons();

      await user.click(approveButton());

      expect(await screen.findByText("Baseline is locked")).toBeVisible();
      expect(afterApprove).not.toHaveBeenCalled();
      expect(screen.queryByText("Approved")).not.toBeInTheDocument();
    });

    it("approves with the hotkey a", async () => {
      const approveBulk = vi
        .spyOn(testRunService, "approveBulk")
        .mockResolvedValue(NO_FAILURES);
      const { user, afterApprove } = await renderButtons();

      await user.keyboard("a");

      await waitFor(() =>
        expect(approveBulk).toHaveBeenCalledWith([UNRESOLVED.id], false),
      );
      expect(approveBulk).toHaveBeenCalledTimes(1);
      await waitFor(() => expect(afterApprove).toHaveBeenCalledTimes(1));
    });

    it("follows the test run it is given when the hotkey is pressed", async () => {
      const approveBulk = vi
        .spyOn(testRunService, "approveBulk")
        .mockResolvedValue(NO_FAILURES);
      const next = { ...UNRESOLVED, id: "next-id", merge: true };
      const { user, showTestRun } = await renderButtons();

      showTestRun(next);
      await user.keyboard("a");

      await waitFor(() =>
        expect(approveBulk).toHaveBeenCalledWith(["next-id"], true),
      );
    });

    it("carries on with the latest after-approve when the hotkey is pressed", async () => {
      vi.spyOn(testRunService, "approveBulk").mockResolvedValue(NO_FAILURES);
      const latest = vi.fn();
      const { user, afterApprove, giveCallbacks } = await renderButtons();

      giveCallbacks({ afterApprove: latest });
      await user.keyboard("a");

      await waitFor(() => expect(latest).toHaveBeenCalledTimes(1));
      expect(afterApprove).not.toHaveBeenCalled();
    });
  });

  describe("reject", () => {
    it("rejects the test run by its id", async () => {
      const rejectBulk = vi
        .spyOn(testRunService, "rejectBulk")
        .mockResolvedValue(NO_FAILURES);
      const { user, afterApprove, afterReject } = await renderButtons();

      await user.click(rejectButton());

      await waitFor(() =>
        expect(rejectBulk).toHaveBeenCalledWith([UNRESOLVED.id]),
      );
      expect(rejectBulk).toHaveBeenCalledTimes(1);
      expect(await screen.findByText("Rejected")).toBeVisible();
      expect(afterReject).toHaveBeenCalledTimes(1);
      expect(afterApprove).not.toHaveBeenCalled();
    });

    it("shows the error and does not carry on when rejecting fails", async () => {
      vi.spyOn(testRunService, "rejectBulk").mockRejectedValue("Cannot reject");
      const { user, afterReject } = await renderButtons();

      await user.click(rejectButton());

      expect(await screen.findByText("Cannot reject")).toBeVisible();
      expect(afterReject).not.toHaveBeenCalled();
      expect(screen.queryByText("Rejected")).not.toBeInTheDocument();
    });

    it("shows the reason and does not carry on when the backend refuses the run", async () => {
      vi.spyOn(testRunService, "rejectBulk").mockResolvedValue({
        succeeded: [],
        failed: [{ id: UNRESOLVED.id, message: "Run was deleted" }],
      });
      const { user, afterReject } = await renderButtons();

      await user.click(rejectButton());

      expect(await screen.findByText("Run was deleted")).toBeVisible();
      expect(afterReject).not.toHaveBeenCalled();
      expect(screen.queryByText("Rejected")).not.toBeInTheDocument();
    });

    it("rejects with the hotkey x", async () => {
      const rejectBulk = vi
        .spyOn(testRunService, "rejectBulk")
        .mockResolvedValue(NO_FAILURES);
      const { user, afterReject } = await renderButtons();

      await user.keyboard("x");

      await waitFor(() =>
        expect(rejectBulk).toHaveBeenCalledWith([UNRESOLVED.id]),
      );
      expect(rejectBulk).toHaveBeenCalledTimes(1);
      await waitFor(() => expect(afterReject).toHaveBeenCalledTimes(1));
    });

    it("carries on with the latest after-reject when the hotkey is pressed", async () => {
      vi.spyOn(testRunService, "rejectBulk").mockResolvedValue(NO_FAILURES);
      const latest = vi.fn();
      const { user, afterReject, giveCallbacks } = await renderButtons();

      giveCallbacks({ afterReject: latest });
      await user.keyboard("x");

      await waitFor(() => expect(latest).toHaveBeenCalledTimes(1));
      expect(afterReject).not.toHaveBeenCalled();
    });
  });

  it("does not react to other keys", async () => {
    const approveBulk = vi.spyOn(testRunService, "approveBulk");
    const rejectBulk = vi.spyOn(testRunService, "rejectBulk");
    const { user } = await renderButtons();

    await user.keyboard("bcz");

    expect(approveBulk).not.toHaveBeenCalled();
    expect(rejectBulk).not.toHaveBeenCalled();
  });

  describe("variations buttons", () => {
    const SIBLING = siblingOf(UNRESOLVED, {});
    const variationButtons = () => ({
      approve: screen.queryByText("Approve variations"),
      reject: screen.queryByText("Reject variations"),
    });

    it("offers to approve or reject the variations of a screen", async () => {
      const onOpenVariations = vi.fn();
      const { user } = await renderButtons({
        testRuns: [UNRESOLVED, SIBLING],
        onOpenVariations,
      });

      await user.click(screen.getByText("Approve variations"));
      expect(onOpenVariations).toHaveBeenLastCalledWith("approve");

      await user.click(screen.getByText("Reject variations"));
      expect(onOpenVariations).toHaveBeenLastCalledWith("reject");
      expect(onOpenVariations).toHaveBeenCalledTimes(2);
    });

    it("does not approve or reject anything by itself when opening variations", async () => {
      const approveBulk = vi.spyOn(testRunService, "approveBulk");
      const rejectBulk = vi.spyOn(testRunService, "rejectBulk");
      const { user } = await renderButtons({ testRuns: [UNRESOLVED, SIBLING] });

      await user.click(screen.getByText("Approve variations"));

      expect(approveBulk).not.toHaveBeenCalled();
      expect(rejectBulk).not.toHaveBeenCalled();
    });

    it("counts a new sibling as still to review", async () => {
      await renderButtons({
        testRuns: [
          UNRESOLVED,
          siblingOf(UNRESOLVED, { status: TestStatus.new }),
        ],
      });

      expect(screen.getByText("Approve variations")).toBeVisible();
    });

    it("hides them when the project does not allow bulk approval of variations", async () => {
      await renderButtons({
        project: { ...TEST_PROJECT, bulkApproveVariations: false },
        testRuns: [UNRESOLVED, SIBLING],
      });

      expect(variationButtons().approve).not.toBeInTheDocument();
      expect(variationButtons().reject).not.toBeInTheDocument();
    });

    it("hides them when the run is not unresolved", async () => {
      const newRun = { ...UNRESOLVED, status: TestStatus.new };
      await renderButtons({
        testRun: newRun,
        testRuns: [newRun, SIBLING],
      });

      expect(variationButtons().approve).not.toBeInTheDocument();
    });

    it("hides them when there is no sibling at all", async () => {
      await renderButtons({ testRuns: [UNRESOLVED] });

      expect(variationButtons().approve).not.toBeInTheDocument();
    });

    it("hides them when the siblings are already reviewed", async () => {
      await renderButtons({
        testRuns: [
          UNRESOLVED,
          siblingOf(UNRESOLVED, { status: TestStatus.approved }),
        ],
      });

      expect(variationButtons().approve).not.toBeInTheDocument();
    });

    it("hides them when the other run differs on an axis that is not grouped by", async () => {
      await renderButtons({
        testRuns: [
          UNRESOLVED,
          siblingOf(UNRESOLVED, { device: "other device" }),
        ],
      });

      expect(variationButtons().approve).not.toBeInTheDocument();
    });

    it("groups by the axis the project is set to", async () => {
      await renderButtons({
        project: {
          ...TEST_PROJECT,
          bulkApproveVariations: true,
          bulkApproveGroupBy: "device",
        },
        testRuns: [
          UNRESOLVED,
          siblingOf(UNRESOLVED, {
            customTags: UNRESOLVED.customTags,
            device: "other device",
          }),
        ],
      });

      expect(screen.getByText("Approve variations")).toBeVisible();
    });
  });
});
