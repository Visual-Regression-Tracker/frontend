import React from "react";
import { render } from "@testing-library/react";
import { BuildStatus } from "../types/buildStatus";
import { BuildStatusChip } from "./BuildStatusChip";

describe("BuildStatusChip", () => {
  test("passed", () => {
    const item = render(<BuildStatusChip status={BuildStatus.passed} />);
    expect(item.getByText("passed")).toBeInTheDocument();
  });
});
