import { render, screen } from "@testing-library/react";
import { run } from "../_helpers/testRun.fixture";
import { TestStatus } from "../types";
import { BuildStatusCounters } from "./BuildStatusCounters";

describe("BuildStatusCounters", () => {
  it("names each status by its label with the count", () => {
    render(
      <BuildStatusCounters
        testRuns={[
          run({ id: "a", status: TestStatus.ok }),
          run({ id: "b", status: TestStatus.autoApproved }),
          run({ id: "c", status: TestStatus.ok }),
        ]}
        statuses={[]}
        onStatusesChange={() => undefined}
      />,
    );

    expect(screen.getByRole("button", { name: "Passed 2" })).toBeVisible();
    expect(
      screen.getByRole("button", { name: "Auto-approved 1" }),
    ).toBeVisible();
    expect(screen.getByRole("button", { name: "Failed 0" })).toHaveAttribute(
      "aria-disabled",
      "true",
    );
  });
});
