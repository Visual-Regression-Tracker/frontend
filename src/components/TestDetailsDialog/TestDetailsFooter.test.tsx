import { type ComponentProps } from "react";
import { screen, waitFor, within } from "@testing-library/react";
import { toastOf, undoIn } from "../../_test/toast";
import { renderWithProviders } from "../../_test/render";
import { run } from "../../_helpers/testRun.fixture";
import { NO_FAILURES } from "../../_test/bulkResult";
import { GO_TO_NEXT_KEY } from "../../constants";
import { testRunService } from "../../services";
import { TestStatus } from "../../types/testStatus";
import { TestDetailsFooter } from "./TestDetailsFooter";

type Props = ComponentProps<typeof TestDetailsFooter>;

const renderFooter = (overrides: Partial<Props> = {}) => {
  const props: Props = {
    testRun: run({ status: TestStatus.unresolved }),
    zoomControls: <button>Zoom slot</button>,
    onNext: vi.fn(),
    onOpenVariations: vi.fn(),
    ...overrides,
  };
  return { ...renderWithProviders(<TestDetailsFooter {...props} />), props };
};

// a tooltip names these after their hotkey, so they are found by text
const approve = () => screen.getByText("Approve", { selector: "button" });
const reject = () => screen.getByText("Reject", { selector: "button" });
const goToNext = () =>
  screen.getByRole("checkbox", { name: "Go to the next after Approve/Reject" });

describe("TestDetailsFooter", () => {
  afterEach(() => {
    localStorage.removeItem(GO_TO_NEXT_KEY);
  });

  it("shows the zoom controls it is given", () => {
    renderFooter();

    expect(screen.getByRole("button", { name: "Zoom slot" })).toBeVisible();
  });

  describe("review buttons", () => {
    it.each([TestStatus.unresolved, TestStatus.new])(
      "offers Approve and Reject for a %s run",
      (status) => {
        renderFooter({ testRun: run({ status }) });

        expect(approve()).toBeVisible();
        expect(reject()).toBeVisible();
      },
    );

    it.each([TestStatus.ok, TestStatus.approved, TestStatus.failed])(
      "offers neither for a %s run",
      (status) => {
        renderFooter({ testRun: run({ status }) });

        expect(
          screen.queryByText("Approve", { selector: "button" }),
        ).not.toBeInTheDocument();
        expect(
          screen.queryByText("Reject", { selector: "button" }),
        ).not.toBeInTheDocument();
      },
    );
  });

  describe("undo", () => {
    const undoButton = (name: string) => screen.getByRole("button", { name });

    it.each([
      [TestStatus.approved, "Undo approval", "approve"],
      [TestStatus.failed, "Undo rejection", "reject"],
    ] as const)(
      "reverts a %s run from the footer",
      async (status, name, decision) => {
        const revert = vi.spyOn(testRunService, "revert").mockResolvedValue();
        const testRun = run({ status });
        const { user } = renderFooter({ testRun });

        await user.click(undoButton(name));

        expect(revert).toHaveBeenCalledWith([testRun.id], decision);
        expect(await screen.findByText("Undone")).toBeVisible();
      },
    );

    it.each([TestStatus.autoApproved, TestStatus.ok, TestStatus.unresolved])(
      "offers no undo for a %s run",
      (status) => {
        renderFooter({ testRun: run({ status }) });

        expect(screen.queryByRole("button", { name: /^Undo/ })).toBeNull();
      },
    );

    it("shows why the backend refused the undo", async () => {
      vi.spyOn(testRunService, "revert").mockRejectedValue(
        "A later approval changed this baseline",
      );
      const { user } = renderFooter({
        testRun: run({ status: TestStatus.approved }),
      });

      await user.click(undoButton("Undo approval"));

      const toast = await toastOf("A later approval changed this baseline");
      expect(toast).toHaveClass("notistack-MuiContent-error");
    });

    it("drops the run id from the backend's reason", async () => {
      const testRun = run({ status: TestStatus.approved });
      vi.spyOn(testRunService, "revert").mockRejectedValue(
        `Test run ${testRun.id}: a later approval changed this baseline`,
      );
      const { user } = renderFooter({ testRun });

      await user.click(undoButton("Undo approval"));

      expect(
        await toastOf("A later approval changed this baseline"),
      ).toHaveClass("notistack-MuiContent-error");
    });

    it("keeps the undo in the toast when the dialog goes to the next run", async () => {
      localStorage.setItem(GO_TO_NEXT_KEY, "true");
      vi.spyOn(testRunService, "approveBulk").mockResolvedValue(NO_FAILURES);
      const { user } = renderFooter();

      await user.click(approve());

      expect(await undoIn("Approved")).toBeVisible();
    });

    it("keeps the undo in the toast with Go to the next on, since the footer undo waits for the status update", async () => {
      localStorage.setItem(GO_TO_NEXT_KEY, "true");
      vi.spyOn(testRunService, "approveBulk").mockResolvedValue(NO_FAILURES);
      const { user, props } = renderFooter({ onNext: vi.fn() });

      await user.click(approve());

      expect(await undoIn("Approved")).toBeVisible();
      expect(props.onNext).toHaveBeenCalledTimes(1);
    });

    it("leaves the undo to the footer when staying on the run", async () => {
      vi.spyOn(testRunService, "approveBulk").mockResolvedValue(NO_FAILURES);
      const { user } = renderFooter();

      await user.click(approve());

      const toast = await toastOf("Approved");
      expect(
        within(toast).queryByText("Undo", { selector: "button" }),
      ).toBeNull();
    });
  });

  describe("go to the next after Approve/Reject", () => {
    it("asks for the next run after Approve and Reject when ticked", async () => {
      localStorage.setItem(GO_TO_NEXT_KEY, "true");
      vi.spyOn(testRunService, "approveBulk").mockResolvedValue(NO_FAILURES);
      vi.spyOn(testRunService, "rejectBulk").mockResolvedValue(NO_FAILURES);
      const { user, props } = renderFooter();
      expect(goToNext()).toBeChecked();

      await user.click(approve());
      await waitFor(() => expect(props.onNext).toHaveBeenCalledTimes(1));
      await user.click(reject());

      await waitFor(() => expect(props.onNext).toHaveBeenCalledTimes(2));
    });

    it("stays on the run when not ticked", async () => {
      vi.spyOn(testRunService, "approveBulk").mockResolvedValue(NO_FAILURES);
      const { user, props } = renderFooter();
      expect(goToNext()).not.toBeChecked();

      await user.click(approve());
      await screen.findByText("Approved");

      expect(props.onNext).not.toHaveBeenCalled();
    });

    it("starts unticked when the stored choice is corrupt", () => {
      localStorage.setItem(GO_TO_NEXT_KEY, "{oops");

      renderFooter();

      expect(goToNext()).not.toBeChecked();
    });

    it("remembers the choice both ways", async () => {
      const { user } = renderFooter();

      await user.click(goToNext());
      expect(localStorage.getItem(GO_TO_NEXT_KEY)).toBe("true");
      await user.click(goToNext());

      expect(goToNext()).not.toBeChecked();
      expect(localStorage.getItem(GO_TO_NEXT_KEY)).toBe("false");
    });
  });
});
