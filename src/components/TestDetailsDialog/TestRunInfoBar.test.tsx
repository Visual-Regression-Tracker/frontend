import { type ComponentProps } from "react";
import { screen } from "@testing-library/react";
import { renderWithProviders } from "../../_test/render";
import { run } from "../../_helpers/testRun.fixture";
import { TestRunInfoBar } from "./TestRunInfoBar";

type Props = ComponentProps<typeof TestRunInfoBar>;

const renderBar = (overrides: Partial<Props> = {}) => {
  const props: Props = {
    testRun: run(),
    sizes: null,
    ignoreAreasToolbar: <button>Toolbar slot</button>,
    ...overrides,
  };
  return renderWithProviders(<TestRunInfoBar {...props} />);
};

describe("TestRunInfoBar", () => {
  it("shows the toolbar it is given", () => {
    renderBar();

    expect(screen.getByRole("button", { name: "Toolbar slot" })).toBeVisible();
  });

  describe("image size warning", () => {
    it("names both sizes when the image and the baseline differ", () => {
      renderBar({ sizes: { baseline: "1280×800", checkpoint: "1280×812" } });

      expect(
        screen.getByText(
          "Image sizes differ: baseline 1280×800, checkpoint 1280×812. Cannot calculate diff.",
        ),
      ).toBeVisible();
    });

    it("is quiet when they are the same size", () => {
      renderBar();

      expect(screen.queryByText(/Image sizes differ/)).not.toBeInTheDocument();
    });
  });

  describe("VLM analysis", () => {
    it("is absent without a description", () => {
      renderBar();

      expect(screen.queryByText("✦ VLM analysis")).not.toBeInTheDocument();
    });

    it("shows the description, which More and Less fold", async () => {
      const { user } = renderBar({
        testRun: run({ vlmDescription: "The cart badge moved 4px left." }),
      });
      expect(screen.getByText("✦ VLM analysis")).toBeVisible();
      const text = screen.getByText("The cart badge moved 4px left.");
      expect(text).not.toHaveStyle({ whiteSpace: "pre-wrap" });

      await user.click(screen.getByRole("button", { name: "More" }));
      expect(text).toHaveStyle({ whiteSpace: "pre-wrap" });

      await user.click(screen.getByRole("button", { name: "Less" }));
      expect(text).not.toHaveStyle({ whiteSpace: "pre-wrap" });
    });

    it("folds again for the next run", async () => {
      const first = run({ id: "a", vlmDescription: "First run text." });
      const { user, rerender } = renderBar({ testRun: first });
      await user.click(screen.getByRole("button", { name: "More" }));

      rerender(
        <TestRunInfoBar
          testRun={run({ id: "b", vlmDescription: "Second run text." })}
          sizes={null}
          ignoreAreasToolbar={null}
        />,
      );

      expect(screen.getByRole("button", { name: "More" })).toBeVisible();
    });
  });
});
