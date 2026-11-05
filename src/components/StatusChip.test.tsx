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
    ["new", "info"],
    ["unresolved", "warning"],
    ["failed", "error"],
    ["approved", "success"],
    ["autoApproved", "success"],
    ["ok", "success"],
    ["passed", "success"],
    ["something else", "default"],
  ])("shows %s as an outlined small chip coloured %s", (status, color) => {
    render(<StatusChip status={status} />);

    expect(screen.getByText(status)).toBeInTheDocument();
    expect(lastChipProps()).toMatchObject({
      label: status,
      color,
      variant: "outlined",
      size: "small",
    });
  });

  it("shows a filled chip", () => {
    render(<StatusChip status="unresolved" variant="filled" />);

    expect(lastChipProps()).toMatchObject({
      color: "warning",
      variant: "filled",
    });
  });

  it("shows a dot and the text without a chip", () => {
    render(<StatusChip status="failed" variant="dot" />);

    expect(screen.getByText("failed")).toBeInTheDocument();
    expect(screen.getByTestId("status-dot")).toBeInTheDocument();
    expect(chipProps).toHaveLength(0);
  });

  it("renders an empty chip when there is no status", () => {
    render(<StatusChip status={undefined} />);

    expect(lastChipProps()).toMatchObject({
      label: undefined,
      color: "default",
    });
  });
});
