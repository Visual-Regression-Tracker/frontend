import { type ComponentProps } from "react";
import { screen, waitFor } from "@testing-library/react";
import { renderWithProviders } from "../../_test/render";
import { buttonAroundIcon } from "../../_test/buttonAroundIcon";
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
    currentRunIndex: 1,
    totalTestRunCount: 3,
    zoomControls: <button>Zoom slot</button>,
    onPrevious: vi.fn(),
    onNext: vi.fn(),
    onOpenVariations: vi.fn(),
    ...overrides,
  };
  return { ...renderWithProviders(<TestDetailsFooter {...props} />), props };
};

const previous = () => buttonAroundIcon("NavigateBeforeIcon");
const next = () => buttonAroundIcon("NavigateNextIcon");
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

  describe("moving between runs", () => {
    it("asks for the next and previous run by button and arrow key", async () => {
      const { user, props } = renderFooter();

      await user.click(next());
      await user.keyboard("{ArrowRight}");
      await user.click(previous());
      await user.keyboard("{ArrowLeft}");

      expect(props.onNext).toHaveBeenCalledTimes(2);
      expect(props.onPrevious).toHaveBeenCalledTimes(2);
    });

    it("hides previous on the first run and next on the last", () => {
      const first = renderFooter({ currentRunIndex: 0 });
      expect(previous()).not.toBeVisible();
      expect(next()).toBeVisible();
      first.unmount();

      renderFooter({ currentRunIndex: 2 });

      expect(previous()).toBeVisible();
      expect(next()).not.toBeVisible();
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
