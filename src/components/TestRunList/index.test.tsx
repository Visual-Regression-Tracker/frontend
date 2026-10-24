import React from "react";
import { screen } from "@testing-library/react";
import { useNavigate } from "react-router-dom";
import { renderWithProviders } from "../../_test/render";
import { run } from "../../_helpers/testRun.fixture";
import { buildsService, testRunService } from "../../services";
import { Build } from "../../types";
import TestRunList from "./index";

// TestRunList imports from "react-router", the render helper's router comes
// from "react-router-dom"; under Vitest those load as two copies of the
// library, so hand TestRunList the copy the router belongs to
vi.mock("react-router", async () => import("react-router-dom"));

const RUNS_BY_BUILD = {
  "build-a": [run({ id: "a1", buildId: "build-a", name: "Screen A" })],
  "build-b": [run({ id: "b1", buildId: "build-b", name: "Screen B" })],
};

const OpenBuildB = () => {
  const navigate = useNavigate();
  return <button onClick={() => navigate("/?buildId=build-b")}>Open B</button>;
};

// the tooltip's label sits on a span around the (possibly disabled) button
const actionButton = (label: string): HTMLButtonElement => {
  const button = screen.getByLabelText(label).querySelector("button");
  if (!button) {
    throw new Error(`no button in "${label}"`);
  }
  return button;
};

describe("TestRunList", () => {
  beforeEach(() => {
    vi.spyOn(buildsService, "getDetails").mockImplementation(
      async (id) => ({ id, ciBuildId: `ci-${id}` }) as Build,
    );
    vi.spyOn(testRunService, "getList").mockImplementation(
      async (buildId) =>
        RUNS_BY_BUILD[buildId as keyof typeof RUNS_BY_BUILD] ?? [],
    );
  });

  it("drops the selection when another build is opened", async () => {
    const { user } = renderWithProviders(
      <>
        <OpenBuildB />
        <TestRunList />
      </>,
      { route: "/?buildId=build-a" },
    );
    await user.click(await screen.findByRole("button", { name: "Grid view" }));
    await user.click(
      await screen.findByRole("checkbox", { name: "Select Screen A" }),
    );
    expect(actionButton("Delete selected cards.")).toBeEnabled();

    await user.click(screen.getByRole("button", { name: "Open B" }));

    expect(
      await screen.findByRole("checkbox", { name: "Select Screen B" }),
    ).not.toBeChecked();
    expect(actionButton("Delete selected cards.")).toBeDisabled();
  });
});
