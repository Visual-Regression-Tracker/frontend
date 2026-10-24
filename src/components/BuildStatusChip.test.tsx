import React from "react";
import { render } from "@testing-library/react";
import type { ChipProps } from "@mui/material";
import { BuildStatus } from "../types/buildStatus";
import { BuildStatusChip } from "./BuildStatusChip";

// MUI's class names are not a contract, the props handed to the Chip are
const chipProps = vi.hoisted(() => [] as ChipProps[]);

vi.mock("@mui/material", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@mui/material")>();
  return {
    ...actual,
    Chip: (props: ChipProps) => {
      chipProps.push(props);
      return <actual.Chip {...props} />;
    },
  };
});

describe("BuildStatusChip", () => {
  beforeEach(() => {
    chipProps.length = 0;
  });

  test("passed", () => {
    const item = render(<BuildStatusChip status={BuildStatus.passed} />);
    expect(item.getByText("passed")).toBeInTheDocument();
  });

  test.each([
    [BuildStatus.passed, "primary", "outlined"],
    [BuildStatus.unresolved, "secondary", undefined],
    [BuildStatus.failed, "secondary", "outlined"],
  ])("%s is a small chip coloured %s, variant %s", (status, color, variant) => {
    const item = render(<BuildStatusChip status={status} />);

    expect(item.getByText(status)).toBeInTheDocument();
    expect(chipProps[chipProps.length - 1]).toMatchObject({
      label: status,
      color,
      variant,
      size: "small",
    });
  });

  test("an unknown status has neither colour nor variant", () => {
    render(<BuildStatusChip status={"other" as BuildStatus} />);

    const props = chipProps[chipProps.length - 1];
    expect(props.color).toBeUndefined();
    expect(props.variant).toBeUndefined();
  });
});
