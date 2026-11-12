import { useState } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { run } from "../_helpers/testRun.fixture";
import { TestStatus } from "../types";
import { BuildStatusCounters } from "./BuildStatusCounters";

describe("BuildStatusCounters", () => {
  it("names each status present by its label with the count", () => {
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
    expect(
      screen.queryByRole("button", { name: /^Failed/ }),
    ).not.toBeInTheDocument();
  });

  it("keeps a picked status at zero so it can be turned off", async () => {
    const onStatusesChange = vi.fn();
    render(
      <BuildStatusCounters
        testRuns={[run({ id: "a", status: TestStatus.ok })]}
        statuses={[TestStatus.failed]}
        onStatusesChange={onStatusesChange}
      />,
    );

    await userEvent.click(screen.getByRole("button", { name: "Failed 0" }));

    expect(onStatusesChange).toHaveBeenCalledWith([]);
  });

  it("moves focus to All when a picked status at zero is turned off", async () => {
    const Counters = () => {
      const [statuses, setStatuses] = useState([TestStatus.failed]);
      return (
        <BuildStatusCounters
          testRuns={[run({ id: "a", status: TestStatus.ok })]}
          statuses={statuses}
          onStatusesChange={setStatuses}
        />
      );
    };
    render(<Counters />);

    screen.getByRole("button", { name: "Failed 0" }).focus();
    await userEvent.keyboard("{Enter}");

    expect(
      screen.queryByRole("button", { name: /^Failed/ }),
    ).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "All 1" })).toHaveFocus();
  });

  it("always shows All, even with no runs", () => {
    render(
      <BuildStatusCounters
        testRuns={[]}
        statuses={[]}
        onStatusesChange={() => undefined}
      />,
    );

    expect(
      screen.getAllByRole("button").map((chip) => chip.textContent),
    ).toEqual(["All 0"]);
  });
});
