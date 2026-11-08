import { type ComponentProps } from "react";
import { screen } from "@testing-library/react";
import { renderWithProviders } from "../../_test/render";
import { run } from "../../_helpers/testRun.fixture";
import { testRunService } from "../../services";
import { TestStatus } from "../../types/testStatus";
import { TestDetailsHeader } from "./TestDetailsHeader";
import { useDialogSnackbar } from "./useDialogSnackbar";

type Props = Omit<ComponentProps<typeof TestDetailsHeader>, "enqueueSnackbar">;

const Header = (props: Props) => {
  const { enqueueSnackbar } = useDialogSnackbar();
  return <TestDetailsHeader {...props} enqueueSnackbar={enqueueSnackbar} />;
};

const RUN = run({
  comment: "",
  name: "Cart",
  status: TestStatus.unresolved,
  diffPercent: 8.1234,
  diffTollerancePercent: 2,
});

const renderHeader = (overrides: Partial<Props> = {}) => {
  const props: Props = {
    testRun: RUN,
    currentRunIndex: 1,
    totalTestRunCount: 3,
    onPrevious: vi.fn(),
    onNext: vi.fn(),
    onClose: vi.fn(),
    ...overrides,
  };
  return { ...renderWithProviders(<Header {...props} />), props };
};

const previous = () => screen.getByLabelText("Previous run");
const next = () => screen.getByLabelText("Next run");
const writeComment = async (
  user: ReturnType<typeof renderHeader>["user"],
  text: string,
) => {
  await user.click(screen.getByRole("button", { name: "Comments" }));
  await user.type(await screen.findByTestId("comment"), text);
  await user.click(screen.getByRole("button", { name: "Save" }));
};

describe("TestDetailsHeader", () => {
  it("shows the position, name, status, diff and tolerance in one place", () => {
    renderHeader();

    expect(screen.getByTestId("step-position")).toHaveTextContent("2/3");
    expect(screen.getByRole("heading", { name: "Cart" })).toBeVisible();
    expect(screen.getByText("Unresolved")).toBeVisible();
    expect(screen.getByText("Diff 8.12% · tolerance 2%")).toBeVisible();
  });

  it("shows the full run name in a tooltip", async () => {
    const { user } = renderHeader();

    await user.hover(screen.getByRole("heading", { name: "Cart" }));

    expect(await screen.findByRole("tooltip")).toHaveTextContent("Cart");
  });

  it("shows the tags in one line", () => {
    renderHeader();

    expect(screen.getByText(RUN.os).parentElement?.textContent).toBe(
      [RUN.os, RUN.device, RUN.browser, RUN.viewport, RUN.customTags].join(
        " · ",
      ),
    );
  });

  it("shows the noise chip it is given", () => {
    renderHeader({ noiseHint: <span>Noise slot</span> });

    expect(screen.getByText("Noise slot")).toBeVisible();
  });

  it("closes", async () => {
    const { user, props } = renderHeader();

    await user.click(screen.getByRole("button", { name: "Close" }));

    expect(props.onClose).toHaveBeenCalledTimes(1);
  });

  describe("moving between runs", () => {
    it("asks for the next and previous run by button and arrow key", async () => {
      const { user, props } = renderHeader();

      await user.click(next());
      await user.keyboard("{ArrowRight}");
      await user.click(previous());
      await user.keyboard("{ArrowLeft}");

      expect(props.onNext).toHaveBeenCalledTimes(2);
      expect(props.onPrevious).toHaveBeenCalledTimes(2);
    });

    it("hides previous on the first run and next on the last", () => {
      const first = renderHeader({ currentRunIndex: 0 });
      expect(previous()).not.toBeVisible();
      expect(next()).toBeVisible();
      first.unmount();

      renderHeader({ currentRunIndex: 2 });

      expect(previous()).toBeVisible();
      expect(next()).not.toBeVisible();
    });
  });

  describe("comment", () => {
    it("saves the comment and confirms it", async () => {
      const update = vi.spyOn(testRunService, "update").mockResolvedValue(RUN);
      const { user } = renderHeader();

      await writeComment(user, "looks fine");

      expect(update).toHaveBeenCalledWith(RUN.id, { comment: "looks fine" });
      expect(await screen.findByText("Comment updated")).toBeVisible();
    });

    it("shows the error and keeps the comment open when saving fails", async () => {
      vi.spyOn(testRunService, "update").mockRejectedValue("Cannot comment");
      const { user } = renderHeader();

      await writeComment(user, "looks fine");

      expect(await screen.findByText("Cannot comment")).toBeVisible();
      expect(screen.getByTestId("comment")).toBeVisible();
    });
  });
});
