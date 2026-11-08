import { render, screen } from "@testing-library/react";
import type { ChipProps } from "@mui/material";
import { StatusChip } from "./StatusChip";

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

describe("StatusChip", () => {
  beforeEach(() => {
    chipProps.length = 0;
  });

  it.each([
    ["new", "New", "info"],
    ["unresolved", "Unresolved", "warning"],
    ["failed", "Failed", "error"],
    ["approved", "Approved", "success"],
    ["autoApproved", "Auto-approved", "success"],
    ["ok", "Passed", "success"],
    ["passed", "Passed", "success"],
    ["something else", "something else", "default"],
  ])(
    "shows %s as an outlined small chip labelled %s coloured %s",
    (status, label, color) => {
      render(<StatusChip status={status} />);

      expect(screen.getByText(label)).toBeInTheDocument();
      expect(lastChipProps()).toMatchObject({
        label,
        color,
        variant: "outlined",
        size: "small",
      });
    },
  );

  it("shows a filled chip", () => {
    render(<StatusChip status="unresolved" variant="filled" />);

    expect(lastChipProps()).toMatchObject({
      color: "warning",
      variant: "filled",
    });
  });

  it("shows a dot and the text without a chip", () => {
    render(<StatusChip status="failed" variant="dot" />);

    expect(screen.getByText("Failed")).toBeInTheDocument();
    expect(screen.getByTestId("status-dot")).toBeInTheDocument();
    expect(chipProps).toHaveLength(0);
  });

  it("renders an empty chip when there is no status", () => {
    render(<StatusChip status={undefined} />);

    expect(lastChipProps()).toMatchObject({
      label: "",
      color: "default",
    });
  });
});
