import React from "react";
import { act, screen } from "@testing-library/react";
import { useNavigate } from "react-router-dom";
import { renderWithProviders } from "../_test/render";
import { run } from "../_helpers/testRun.fixture";
import { testRunService } from "../services";
import { TestRun } from "../types";
import { useTestRunState } from ".";

// the provider follows the testId in the URL; the reducer has its own tests
const deferred = () => {
  let resolve!: (testRun: TestRun) => void;
  let reject!: (reason: string) => void;
  const promise = new Promise<TestRun>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
};

const SelectedTestRun = () => {
  const { selectedTestRun } = useTestRunState();
  const navigate = useNavigate();

  return (
    <>
      <output data-testid="selectedTestRun">
        {selectedTestRun?.id ?? "none"}
      </output>
      <button onClick={() => navigate("/?testId=t2")}>Open t2</button>
    </>
  );
};

const selected = () => screen.getByTestId("selectedTestRun");

describe("TestRunProvider", () => {
  it("selects the run the URL names, not one whose answer came in late", async () => {
    const first = deferred();
    const second = deferred();
    vi.spyOn(testRunService, "getDetails").mockImplementation((id) =>
      id === "t1" ? first.promise : second.promise,
    );
    const { user } = renderWithProviders(<SelectedTestRun />, {
      route: "/?testId=t1",
    });

    await user.click(screen.getByRole("button", { name: "Open t2" }));
    await act(async () => second.resolve(run({ id: "t2" })));
    await act(async () => first.resolve(run({ id: "t1" })));

    expect(selected()).toHaveTextContent("t2");
  });

  it("closes the run when the one the URL names cannot be loaded", async () => {
    const second = deferred();
    vi.spyOn(testRunService, "getDetails").mockImplementation((id) =>
      id === "t1" ? Promise.resolve(run({ id: "t1" })) : second.promise,
    );
    const { user } = renderWithProviders(<SelectedTestRun />, {
      route: "/?testId=t1",
    });
    expect(await screen.findByText("t1")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Open t2" }));
    await act(async () => second.reject("Not found"));

    expect(selected()).toHaveTextContent("none");
  });
});
