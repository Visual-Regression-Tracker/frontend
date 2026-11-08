import { screen } from "@testing-library/react";
import { renderWithProviders } from "../../_test/render";
import { ZoomControls } from "./ZoomControls";

const renderControls = (scale = 1) => {
  const handlers = {
    onScaleChange: vi.fn(),
    onOriginalSize: vi.fn(),
    onFit: vi.fn(),
  };
  const result = renderWithProviders(
    <ZoomControls scale={scale} {...handlers} />,
  );
  return { ...result, ...handlers };
};

describe("ZoomControls", () => {
  it("shows the zoom as a percentage, not as a button", () => {
    renderControls(1.5);

    expect(screen.getByText("150%")).toBeVisible();
    expect(screen.queryByRole("button", { name: "150%" })).toBeNull();
  });

  it("zooms in and out by a step", async () => {
    const { user, onScaleChange } = renderControls(1);

    await user.click(screen.getByRole("button", { name: "Zoom in" }));
    await user.click(screen.getByRole("button", { name: "Zoom out" }));

    expect(onScaleChange).toHaveBeenNthCalledWith(1, 1.2);
    expect(onScaleChange).toHaveBeenNthCalledWith(2, 1 / 1.2);
  });

  it("goes to the original size and fits into the screen", async () => {
    const { user, onOriginalSize, onFit } = renderControls();

    await user.click(screen.getByRole("button", { name: "Original size" }));
    await user.click(screen.getByRole("button", { name: "Fit into screen" }));

    expect(onOriginalSize).toHaveBeenCalledTimes(1);
    expect(onFit).toHaveBeenCalledTimes(1);
  });
});
