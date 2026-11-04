import type { ComponentProps } from "react";
import { screen, waitFor, within } from "@testing-library/react";
import { renderWithProviders } from "../../_test/render";
import {
  A_DE,
  A_EN,
  B_EN,
  groupsFor,
  toolbarProps,
} from "../../_test/testRunListFixture";
import { TAG_FIELDS } from "../../_helpers/testRunTags.helper";
import { NOISE_ANALYSIS_NOISE } from "../../_test/test.data.helper";
import { run } from "../../_helpers/testRun.fixture";
import { TestRun } from "../../types";
import { TestStatus } from "../../types/testStatus";
import { TestRunTable } from "./TestRunTable";

type Props = ComponentProps<typeof TestRunTable>;

const propsFor = (
  runs: TestRun[],
  { grouped = false, ...overrides }: Partial<Props> = {},
): Props => {
  return {
    groups: groupsFor(runs, grouped),
    grouped,
    tagFieldsFor: (count) =>
      grouped && count > 1
        ? TAG_FIELDS.filter((field) => field !== "customTags")
        : TAG_FIELDS,
    selectedIds: [],
    onSelectionChange: vi.fn(),
    loading: false,
    paginationModel: { page: 0, pageSize: 10 },
    onPaginationModelChange: vi.fn(),
    sortModel: [{ field: "status", sort: "desc" }],
    onSortModelChange: vi.fn(),
    toolbarProps: toolbarProps("table"),
    onOpen: vi.fn(),
    ...overrides,
  };
};

const renderTable = (props: Props) =>
  renderWithProviders(<TestRunTable {...props} />);

const dataRows = () => screen.getAllByRole("row").slice(1);
const rowOf = (name: string) =>
  screen.getByText(name).closest<HTMLElement>('[role="row"]') as HTMLElement;
const tickRow = (name: string) =>
  within(rowOf(name)).getByRole("checkbox", { name: /select row/i });

describe("TestRunTable", () => {
  it("shows a run per row with its tags and status", async () => {
    renderTable(propsFor([A_EN, B_EN]));

    await waitFor(() => expect(dataRows()).toHaveLength(2));
    const row = rowOf("Screen A");
    expect(within(row).getByText("en")).toBeInTheDocument();
    expect(within(row).getByText("unresolved")).toBeInTheDocument();
    expect(screen.queryByTestId("groupCount")).not.toBeInTheDocument();
  });

  it("shows the noise hint of an unresolved run in a Noise column next to its status", async () => {
    const noisy = run({
      id: "noisy",
      name: "Screen N",
      noiseAnalysis: NOISE_ANALYSIS_NOISE,
    });
    const settled = run({
      id: "settled",
      name: "Screen S",
      status: TestStatus.approved,
      noiseAnalysis: NOISE_ANALYSIS_NOISE,
    });
    renderTable(propsFor([noisy, settled]));

    await waitFor(() => expect(dataRows()).toHaveLength(2));
    const headers = screen
      .getAllByRole("columnheader")
      .map((header) => header.textContent);
    expect(headers.indexOf("Noise")).toBe(headers.indexOf("Status") + 1);
    expect(
      within(rowOf("Screen N")).getByText("Likely noise"),
    ).toBeInTheDocument();
    expect(
      within(rowOf("Screen S")).queryByTestId("noise-hint-chip"),
    ).not.toBeInTheDocument();
  });

  it("shows a group as one row with its run count, status mix and the tags it shares", async () => {
    renderTable(propsFor([A_EN, A_DE, B_EN], { grouped: true }));

    await waitFor(() => expect(dataRows()).toHaveLength(2));
    const row = rowOf("Screen A");
    expect(within(row).getByTestId("groupCount")).toHaveTextContent("2");
    expect(
      within(row).getByTitle("1 unresolved · 1 approved"),
    ).toBeInTheDocument();
    expect(within(row).queryByText("en")).not.toBeInTheDocument();
    expect(within(rowOf("Screen B")).getByText("en")).toBeInTheDocument();
  });

  it("opens the run of a clicked row", async () => {
    const props = propsFor([A_EN, B_EN]);
    const { user } = renderTable(props);

    await user.click(await screen.findByText("Screen B"));

    expect(props.onOpen).toHaveBeenCalledWith("b-en");
  });

  it("reports every run of a group whose row is ticked", async () => {
    const props = propsFor([A_EN, A_DE, B_EN], { grouped: true });
    const { user } = renderTable(props);
    await waitFor(() => expect(dataRows()).toHaveLength(2));

    await user.click(tickRow("Screen A"));

    expect(props.onSelectionChange).toHaveBeenCalledWith(["a-en", "a-de"]);
  });

  it("ticks a group's row only once every run of it is ticked", async () => {
    const runs = [A_EN, A_DE, B_EN];
    const { rerender } = renderTable(
      propsFor(runs, { grouped: true, selectedIds: ["a-en"] }),
    );
    await waitFor(() => expect(dataRows()).toHaveLength(2));
    expect(tickRow("Screen A")).not.toBeChecked();

    rerender(
      <TestRunTable
        {...propsFor(runs, { grouped: true, selectedIds: ["a-en", "a-de"] })}
      />,
    );

    await waitFor(() => expect(tickRow("Screen A")).toBeChecked());
    expect(tickRow("Screen B")).not.toBeChecked();
  });

  it("reports every shown run when the header box selects all", async () => {
    const props = propsFor([A_EN, B_EN]);
    const { user } = renderTable(props);
    await waitFor(() => expect(dataRows()).toHaveLength(2));

    await user.click(screen.getByRole("checkbox", { name: "Select all rows" }));

    const [[ids]] = vi.mocked(props.onSelectionChange).mock.calls;
    expect([...ids].sort((a, b) => a.localeCompare(b))).toEqual([
      "a-en",
      "b-en",
    ]);
  });

  it("reports a click on a column header as the new sort", async () => {
    const props = propsFor([A_EN, B_EN]);
    const { user } = renderTable(props);
    await waitFor(() => expect(dataRows()).toHaveLength(2));

    await user.click(screen.getByRole("columnheader", { name: /Name/ }));

    expect(props.onSortModelChange).toHaveBeenCalledWith(
      [{ field: "name", sort: "asc" }],
      expect.anything(),
    );
  });

  it("reports a click on the Noise header as a descending sort", async () => {
    const props = propsFor([A_EN, B_EN]);
    const { user } = renderTable(props);
    await waitFor(() => expect(dataRows()).toHaveLength(2));

    await user.click(screen.getByRole("columnheader", { name: /Noise/ }));

    expect(props.onSortModelChange).toHaveBeenCalledWith(
      [{ field: "noise", sort: "desc" }],
      expect.anything(),
    );
  });

  it("follows a change of density after it first rendered", async () => {
    const densityClass = () =>
      document.querySelector(".MuiDataGrid-root")?.className ?? "";
    const { rerender } = renderTable(propsFor([A_EN]));
    await waitFor(() => expect(densityClass()).toContain("densityStandard"));

    rerender(
      <TestRunTable
        {...propsFor([A_EN], {
          toolbarProps: { ...toolbarProps("table"), density: "compact" },
        })}
      />,
    );

    await waitFor(() => expect(densityClass()).toContain("densityCompact"));
  });
});
