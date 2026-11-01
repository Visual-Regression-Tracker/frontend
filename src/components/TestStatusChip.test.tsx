import { render, screen } from "@testing-library/react";
import type { ChipProps } from "@mui/material";
import { TestStatus } from "../types/testStatus";
import TestStatusChip from "./TestStatusChip";

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

const lastChipProps = () => chipProps[chipProps.length - 1];

describe("TestStatusChip", () => {
  beforeEach(() => {
    chipProps.length = 0;
  });

  it.each([
    [TestStatus.new, "info"],
    [TestStatus.unresolved, "warning"],
    [TestStatus.failed, "error"],
    [TestStatus.approved, "success"],
    [TestStatus.autoApproved, "success"],
    [TestStatus.ok, "success"],
  ])("shows %s as an outlined small chip coloured %s", (status, color) => {
    render(<TestStatusChip status={status} />);

    expect(screen.getByText(status)).toBeInTheDocument();
    expect(lastChipProps()).toMatchObject({
      label: status,
      color,
      variant: "outlined",
      size: "small",
    });
  });

  it("shows an unknown status as it is, in the neutral colour", () => {
    render(<TestStatusChip status="something else" />);

    expect(screen.getByText("something else")).toBeInTheDocument();
    expect(lastChipProps().color).toBe("default");
  });

  it("renders an empty chip when there is no status", () => {
    render(<TestStatusChip status={undefined} />);

    expect(lastChipProps()).toMatchObject({
      label: undefined,
      color: "default",
    });
  });
});
