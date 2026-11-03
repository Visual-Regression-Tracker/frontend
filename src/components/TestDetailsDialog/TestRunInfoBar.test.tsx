import { type ComponentProps } from "react";
import { screen } from "@testing-library/react";
import { renderWithProviders } from "../../_test/render";
import { run } from "../../_helpers/testRun.fixture";
import { testRunService } from "../../services";
import { TestRunInfoBar } from "./TestRunInfoBar";
import { useDialogSnackbar } from "./useDialogSnackbar";

type Props = Omit<ComponentProps<typeof TestRunInfoBar>, "enqueueSnackbar">;

const Bar = (props: Props) => {
  const { enqueueSnackbar } = useDialogSnackbar();
  return <TestRunInfoBar {...props} enqueueSnackbar={enqueueSnackbar} />;
};

const RUN = run({ comment: "" });

const renderBar = (overrides: Partial<Props> = {}) => {
  const props: Props = {
    testRun: RUN,
    sizeMismatch: false,
    ignoreAreasToolbar: <button>Toolbar slot</button>,
    ...overrides,
  };
  return { ...renderWithProviders(<Bar {...props} />), props };
};

const sizeWarning = () => screen.queryByTestId("WarningRoundedIcon");
const writeComment = async (
  user: ReturnType<typeof renderBar>["user"],
  text: string,
) => {
  await user.click(screen.getByRole("button", { name: "Comments" }));
  await user.type(await screen.findByTestId("comment"), text);
  await user.click(screen.getByRole("button", { name: "Save" }));
};

describe("TestRunInfoBar", () => {
  it("shows the run's attributes and the toolbar it is given", () => {
    renderBar();

    expect(screen.getByText(RUN.os)).toBeVisible();
    expect(screen.getByText(RUN.viewport)).toBeVisible();
    expect(screen.getByRole("button", { name: "Toolbar slot" })).toBeVisible();
  });

  describe("image size warning", () => {
    it("warns when the image and the baseline differ in size", () => {
      renderBar({ sizeMismatch: true });

      expect(sizeWarning()).toBeInTheDocument();
    });

    it("is quiet when they are the same size", () => {
      renderBar();

      expect(sizeWarning()).not.toBeInTheDocument();
    });
  });

  describe("comment", () => {
    it("saves the comment and confirms it", async () => {
      const update = vi.spyOn(testRunService, "update").mockResolvedValue(RUN);
      const { user } = renderBar();

      await writeComment(user, "looks fine");

      expect(update).toHaveBeenCalledWith(RUN.id, { comment: "looks fine" });
      expect(await screen.findByText("Comment updated")).toBeVisible();
    });

    it("shows the error and keeps the comment open when saving fails", async () => {
      vi.spyOn(testRunService, "update").mockRejectedValue("Cannot comment");
      const { user } = renderBar();

      await writeComment(user, "looks fine");

      expect(await screen.findByText("Cannot comment")).toBeVisible();
      expect(screen.getByTestId("comment")).toBeVisible();
    });
  });
});
