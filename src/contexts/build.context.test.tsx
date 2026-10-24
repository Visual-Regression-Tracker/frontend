import React from "react";
import { act, screen } from "@testing-library/react";
import { useNavigate } from "react-router-dom";
import { renderWithProviders } from "../_test/render";
import { buildsService } from "../services";
import { Build } from "../types";
import { useBuildState } from ".";

// the provider follows the buildId in the URL; the reducer and the exported
// actions have their own tests
const deferred = () => {
  let resolve!: (build: Build) => void;
  let reject!: (reason: string) => void;
  const promise = new Promise<Build>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
};

const build = (id: string) => ({ id, ciBuildId: `ci-${id}` }) as Build;

const SelectedBuild = () => {
  const { selectedBuild } = useBuildState();
  const navigate = useNavigate();

  return (
    <>
      <output data-testid="selectedBuild">{selectedBuild?.id ?? "none"}</output>
      <button onClick={() => navigate("/?buildId=b2")}>Open b2</button>
    </>
  );
};

const selected = () => screen.getByTestId("selectedBuild");

describe("BuildProvider", () => {
  it("selects the build the URL names, not one whose answer came in late", async () => {
    const first = deferred();
    const second = deferred();
    vi.spyOn(buildsService, "getDetails").mockImplementation((id) =>
      id === "b1" ? first.promise : second.promise,
    );
    const { user } = renderWithProviders(<SelectedBuild />, {
      route: "/?buildId=b1",
    });

    await user.click(screen.getByRole("button", { name: "Open b2" }));
    await act(async () => second.resolve(build("b2")));
    await act(async () => first.resolve(build("b1")));

    expect(selected()).toHaveTextContent("b2");
  });

  it("closes the build when the one the URL names cannot be loaded", async () => {
    const second = deferred();
    vi.spyOn(buildsService, "getDetails").mockImplementation((id) =>
      id === "b1" ? Promise.resolve(build("b1")) : second.promise,
    );
    const { user } = renderWithProviders(<SelectedBuild />, {
      route: "/?buildId=b1",
    });
    expect(await screen.findByText("b1")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Open b2" }));
    await act(async () => second.reject("Not found"));

    expect(selected()).toHaveTextContent("none");
  });
});
