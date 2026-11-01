import { screen, waitFor } from "@testing-library/react";
import { renderWithProviders } from "../../_test/render";
import { SeedTestRuns } from "../../_test/SeedTestRuns";
import { buildsService, testRunService } from "../../services";
import { TestRun } from "../../types";
import { TestStatus } from "../../types/testStatus";
import { GO_TO_NEXT_KEY } from "../../constants";
import {
  TEST_BUILD_UNRESOLVED,
  TEST_USER,
  testRunMock,
} from "../../_test/test.data.helper";
import { TestDetailsDialog } from ".";
import { NO_FAILURES } from "../../_test/bulkResult";
import { CurrentSearch, currentSearch } from "../../_test/location";

// Konva needs native canvas under Node; a stand-in lets tests draw and delete ignore areas
vi.mock("./DrawArea", () => import("../../_test/FakeDrawArea"));

const run = (id: string): TestRun => ({
  ...testRunMock,
  id,
  name: `run ${id}`,
  buildId: TEST_BUILD_UNRESOLVED.id,
});

const FIRST = run("first");
const SECOND = run("second");
const LAST = run("last");
const RUNS = [FIRST, SECOND, LAST];

const searchOf = (testId: string) =>
  `?buildId=${TEST_BUILD_UNRESOLVED.id}&testId=${testId}`;

const renderDialog = async ({
  openRun,
  testRuns = RUNS,
  order,
}: {
  openRun: TestRun;
  testRuns?: TestRun[];
  order?: string[];
}) => {
  vi.spyOn(buildsService, "getDetails").mockResolvedValue(
    TEST_BUILD_UNRESOLVED,
  );
  vi.spyOn(testRunService, "getDetails").mockImplementation(async (id) => {
    const found = [...testRuns, openRun].find((item) => item.id === id);
    if (!found) {
      throw new Error(`no run ${id}`);
    }
    return found;
  });

  const result = renderWithProviders(
    <>
      <SeedTestRuns testRuns={testRuns} order={order} />
      <CurrentSearch />
      <TestDetailsDialog />
    </>,
    { route: `/${searchOf(openRun.id)}`, user: TEST_USER },
  );
  expect(await screen.findByText(openRun.name)).toBeVisible();
  // the build is what navigation builds its links from
  await waitFor(() =>
    expect(buildsService.getDetails).toHaveBeenCalledWith(
      TEST_BUILD_UNRESOLVED.id,
    ),
  );
  return result;
};

// the toolbar's arrows have no name of their own, only their icon
const arrowButton = (iconTestId: "NavigateNextIcon" | "NavigateBeforeIcon") => {
  const button = screen.getByTestId(iconTestId).closest("button");
  if (!button) {
    throw new Error(`no button around ${iconTestId}`);
  }
  return button;
};
const NOT_SAVED_TITLE = "You have not saved ignore areas";
const drawAnArea = () => screen.getByRole("button", { name: "Draw an area" });
const deleteTheArea = () =>
  screen.getByRole("button", { name: "Delete the selected area" });
// a tooltip names these two buttons after their hotkey, so they are found by text
const approveButton = () => screen.getByText("Approve", { selector: "button" });
const rejectButton = () => screen.getByText("Reject", { selector: "button" });
const discard = () => screen.getByRole("button", { name: "Discard" });
const closedSearch = `?buildId=${TEST_BUILD_UNRESOLVED.id}`;

describe("TestDetailsDialog", () => {
  describe("arrow keys", () => {
    it("go to the next run with the right arrow", async () => {
      const { user } = await renderDialog({ openRun: FIRST });

      await user.keyboard("{ArrowRight}");

      await waitFor(() => expect(currentSearch()).toBe(searchOf(SECOND.id)));
      expect(await screen.findByText(SECOND.name)).toBeVisible();
    });

    it("go to the previous run with the left arrow", async () => {
      const { user } = await renderDialog({ openRun: SECOND });

      await user.keyboard("{ArrowLeft}");

      await waitFor(() => expect(currentSearch()).toBe(searchOf(FIRST.id)));
    });

    it("stay on the first run instead of jumping to the last with the left arrow", async () => {
      const { user } = await renderDialog({ openRun: FIRST });

      await user.keyboard("{ArrowLeft}");

      expect(currentSearch()).toBe(searchOf(FIRST.id));
      expect(testRunService.getDetails).not.toHaveBeenCalledWith(LAST.id);
      expect(screen.getByText(FIRST.name)).toBeVisible();
    });

    it("stay on the last run with the right arrow", async () => {
      const { user } = await renderDialog({ openRun: LAST });

      await user.keyboard("{ArrowRight}");

      expect(currentSearch()).toBe(searchOf(LAST.id));
    });

    it("do not move when the open run is not in the list", async () => {
      const elsewhere = run("filtered out");
      const { user } = await renderDialog({ openRun: elsewhere });

      await user.keyboard("{ArrowLeft}");
      await user.keyboard("{ArrowRight}");

      expect(currentSearch()).toBe(searchOf(elsewhere.id));
      expect(testRunService.getDetails).toHaveBeenCalledTimes(1);
    });
  });

  describe("the published order", () => {
    const ORDER = [LAST.id, FIRST.id];

    it("is what the next button visits, not the loaded order", async () => {
      const { user } = await renderDialog({ openRun: LAST, order: ORDER });

      await user.click(arrowButton("NavigateNextIcon"));

      await waitFor(() => expect(currentSearch()).toBe(searchOf(FIRST.id)));
    });

    it("is what the previous button visits", async () => {
      const { user } = await renderDialog({ openRun: FIRST, order: ORDER });

      await user.click(arrowButton("NavigateBeforeIcon"));

      await waitFor(() => expect(currentSearch()).toBe(searchOf(LAST.id)));
    });

    it("is what the arrow keys visit", async () => {
      const { user } = await renderDialog({ openRun: LAST, order: ORDER });

      await user.keyboard("{ArrowRight}");
      await waitFor(() => expect(currentSearch()).toBe(searchOf(FIRST.id)));
      await screen.findByText(FIRST.name);
      await user.keyboard("{ArrowLeft}");

      await waitFor(() => expect(currentSearch()).toBe(searchOf(LAST.id)));
    });

    it("leaves out the runs the list has filtered out", async () => {
      const { user } = await renderDialog({ openRun: FIRST, order: ORDER });

      await user.keyboard("{ArrowRight}");

      expect(currentSearch()).toBe(searchOf(FIRST.id));
      expect(testRunService.getDetails).not.toHaveBeenCalledWith(SECOND.id);
    });

    it("is the loaded order while the list has published none", async () => {
      const { user } = await renderDialog({ openRun: SECOND });

      await user.click(arrowButton("NavigateNextIcon"));

      await waitFor(() => expect(currentSearch()).toBe(searchOf(LAST.id)));
    });
  });

  describe("unsaved ignore areas", () => {
    it("ask before Escape closes the dialog", async () => {
      const { user } = await renderDialog({ openRun: FIRST });
      await user.click(drawAnArea());

      await user.keyboard("{Escape}");

      expect(await screen.findByText(NOT_SAVED_TITLE)).toBeVisible();
      expect(currentSearch()).toBe(searchOf(FIRST.id));
    });

    it("ask before the right arrow goes to the next run", async () => {
      const { user } = await renderDialog({ openRun: FIRST });
      await user.click(drawAnArea());

      await user.keyboard("{ArrowRight}");

      expect(await screen.findByText(NOT_SAVED_TITLE)).toBeVisible();
      expect(currentSearch()).toBe(searchOf(FIRST.id));
      expect(testRunService.getDetails).not.toHaveBeenCalledWith(SECOND.id);
    });

    it("ask before the next button goes to the next run", async () => {
      const { user } = await renderDialog({ openRun: FIRST });
      await user.click(drawAnArea());

      await user.click(arrowButton("NavigateNextIcon"));

      expect(await screen.findByText(NOT_SAVED_TITLE)).toBeVisible();
      expect(currentSearch()).toBe(searchOf(FIRST.id));
    });

    it("do not ask when nothing was drawn", async () => {
      const { user } = await renderDialog({ openRun: FIRST });

      await user.keyboard("{ArrowRight}");

      await waitFor(() => expect(currentSearch()).toBe(searchOf(SECOND.id)));
      expect(screen.queryByText(NOT_SAVED_TITLE)).not.toBeInTheDocument();
    });

    it("go to the next run when the changes are discarded after the right arrow", async () => {
      const { user } = await renderDialog({ openRun: FIRST });
      await user.click(drawAnArea());
      await user.keyboard("{ArrowRight}");
      await screen.findByText(NOT_SAVED_TITLE);

      await user.click(discard());

      await waitFor(() => expect(currentSearch()).toBe(searchOf(SECOND.id)));
      expect(await screen.findByText(SECOND.name)).toBeVisible();
      await waitFor(() =>
        expect(screen.queryByText(NOT_SAVED_TITLE)).not.toBeInTheDocument(),
      );
    });

    it("close the dialog when the changes are discarded after Escape", async () => {
      const { user } = await renderDialog({ openRun: FIRST });
      await user.click(drawAnArea());
      await user.keyboard("{Escape}");
      await screen.findByText(NOT_SAVED_TITLE);

      await user.click(discard());

      await waitFor(() => expect(currentSearch()).toBe(closedSearch));
      await waitFor(() =>
        expect(screen.queryByText(FIRST.name)).not.toBeInTheDocument(),
      );
    });

    it("stay on the run when the prompt is cancelled", async () => {
      const { user } = await renderDialog({ openRun: FIRST });
      await user.click(drawAnArea());
      await user.keyboard("{ArrowRight}");
      await screen.findByText(NOT_SAVED_TITLE);

      await user.click(screen.getByRole("button", { name: "Cancel" }));

      await waitFor(() =>
        expect(screen.queryByText(NOT_SAVED_TITLE)).not.toBeInTheDocument(),
      );
      expect(currentSearch()).toBe(searchOf(FIRST.id));
      expect(screen.getByText(FIRST.name)).toBeVisible();
    });

    it("do not ask again on the run reached after discarding", async () => {
      const { user } = await renderDialog({ openRun: FIRST });
      await user.click(drawAnArea());
      await user.keyboard("{ArrowRight}");
      await screen.findByText(NOT_SAVED_TITLE);
      await user.click(discard());
      await screen.findByText(SECOND.name);
      await waitFor(() =>
        expect(screen.queryByText(NOT_SAVED_TITLE)).not.toBeInTheDocument(),
      );

      await user.keyboard("{ArrowRight}");

      await waitFor(() => expect(currentSearch()).toBe(searchOf(LAST.id)));
      expect(screen.queryByText(NOT_SAVED_TITLE)).not.toBeInTheDocument();
    });
  });

  describe("while the unsaved-areas prompt is open", () => {
    const UNRESOLVED = RUNS.map((item) => ({
      ...item,
      status: TestStatus.unresolved,
    }));

    it("A does not approve the run behind it", async () => {
      vi.spyOn(testRunService, "approveBulk").mockResolvedValue(NO_FAILURES);
      const { user } = await renderDialog({
        openRun: UNRESOLVED[0],
        testRuns: UNRESOLVED,
      });
      await user.click(drawAnArea());
      await user.keyboard("{ArrowRight}");
      await screen.findByText(NOT_SAVED_TITLE);

      await user.keyboard("a");

      expect(testRunService.approveBulk).not.toHaveBeenCalled();
    });

    it("X does not reject the run behind it", async () => {
      vi.spyOn(testRunService, "rejectBulk").mockResolvedValue(NO_FAILURES);
      const { user } = await renderDialog({
        openRun: UNRESOLVED[0],
        testRuns: UNRESOLVED,
      });
      await user.click(drawAnArea());
      await user.keyboard("{ArrowRight}");
      await screen.findByText(NOT_SAVED_TITLE);

      await user.keyboard("x");

      expect(testRunService.rejectBulk).not.toHaveBeenCalled();
    });

    it("the arrows do not change where Discard goes", async () => {
      const { user } = await renderDialog({ openRun: SECOND });
      await user.click(drawAnArea());
      await user.keyboard("{ArrowRight}");
      await screen.findByText(NOT_SAVED_TITLE);

      await user.keyboard("{ArrowLeft}");
      await user.click(discard());

      await waitFor(() => expect(currentSearch()).toBe(searchOf(LAST.id)));
    });
  });

  describe("the unsaved flag", () => {
    it("is set by drawing an area", async () => {
      const { user } = await renderDialog({ openRun: FIRST });

      await user.click(drawAnArea());
      await user.keyboard("{ArrowRight}");

      expect(await screen.findByText(NOT_SAVED_TITLE)).toBeVisible();
    });

    it("is cleared when the drawn area is deleted", async () => {
      const { user } = await renderDialog({ openRun: FIRST });
      await user.click(drawAnArea());
      expect(screen.getByTestId("ignoreAreaCount")).toHaveTextContent("1");

      await user.click(deleteTheArea());
      expect(screen.getByTestId("ignoreAreaCount")).toHaveTextContent("0");
      await user.keyboard("{ArrowRight}");

      await waitFor(() => expect(currentSearch()).toBe(searchOf(SECOND.id)));
      expect(screen.queryByText(NOT_SAVED_TITLE)).not.toBeInTheDocument();
    });

    it("stays set while an unsaved area is left after another is deleted", async () => {
      const { user } = await renderDialog({ openRun: FIRST });
      await user.click(drawAnArea());
      await user.click(drawAnArea());

      await user.click(deleteTheArea());
      expect(screen.getByTestId("ignoreAreaCount")).toHaveTextContent("1");
      await user.keyboard("{Escape}");

      expect(await screen.findByText(NOT_SAVED_TITLE)).toBeVisible();
    });
  });

  describe("go to the next after approve or reject", () => {
    const UNRESOLVED = RUNS.map((item) => ({
      ...item,
      status: TestStatus.unresolved,
    }));

    afterEach(() => {
      localStorage.removeItem(GO_TO_NEXT_KEY);
    });

    it("moves to the next run after Approve when it is on", async () => {
      localStorage.setItem(GO_TO_NEXT_KEY, "true");
      vi.spyOn(testRunService, "approveBulk").mockResolvedValue(NO_FAILURES);
      const { user } = await renderDialog({
        openRun: UNRESOLVED[0],
        testRuns: UNRESOLVED,
      });

      await user.click(approveButton());

      expect(testRunService.approveBulk).toHaveBeenCalledWith(
        [UNRESOLVED[0].id],
        false,
      );
      await waitFor(() => expect(currentSearch()).toBe(searchOf(SECOND.id)));
    });

    it("moves to the next run after Reject when it is on", async () => {
      localStorage.setItem(GO_TO_NEXT_KEY, "true");
      vi.spyOn(testRunService, "rejectBulk").mockResolvedValue(NO_FAILURES);
      const { user } = await renderDialog({
        openRun: UNRESOLVED[0],
        testRuns: UNRESOLVED,
      });

      await user.click(rejectButton());

      expect(testRunService.rejectBulk).toHaveBeenCalledWith([
        UNRESOLVED[0].id,
      ]);
      await waitFor(() => expect(currentSearch()).toBe(searchOf(SECOND.id)));
    });

    it("moves on in the published order", async () => {
      localStorage.setItem(GO_TO_NEXT_KEY, "true");
      vi.spyOn(testRunService, "approveBulk").mockResolvedValue(NO_FAILURES);
      const { user } = await renderDialog({
        openRun: UNRESOLVED[0],
        testRuns: UNRESOLVED,
        order: [FIRST.id, LAST.id],
      });

      await user.click(approveButton());

      await waitFor(() => expect(currentSearch()).toBe(searchOf(LAST.id)));
    });

    it("stays on the run after Approve and Reject when it is off", async () => {
      vi.spyOn(testRunService, "approveBulk").mockResolvedValue(NO_FAILURES);
      vi.spyOn(testRunService, "rejectBulk").mockResolvedValue(NO_FAILURES);
      const { user } = await renderDialog({
        openRun: UNRESOLVED[0],
        testRuns: UNRESOLVED,
      });

      await user.click(approveButton());
      await screen.findByText("Approved");
      await user.click(rejectButton());
      await screen.findByText("Rejected");

      expect(currentSearch()).toBe(searchOf(UNRESOLVED[0].id));
    });

    it("stays on the run when Approve fails", async () => {
      localStorage.setItem(GO_TO_NEXT_KEY, "true");
      vi.spyOn(testRunService, "approveBulk").mockRejectedValue(
        "Cannot approve",
      );
      const { user } = await renderDialog({
        openRun: UNRESOLVED[0],
        testRuns: UNRESOLVED,
      });

      await user.click(approveButton());

      expect(await screen.findByText("Cannot approve")).toBeVisible();
      expect(currentSearch()).toBe(searchOf(UNRESOLVED[0].id));
    });
  });
});
