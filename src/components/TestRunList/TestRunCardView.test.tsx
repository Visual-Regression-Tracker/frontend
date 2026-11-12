import { type ComponentProps, useState } from "react";
import { screen, within } from "@testing-library/react";
import type { GridPaginationModel } from "@mui/x-data-grid";
import { renderWithProviders } from "../../_test/render";
import { A_DE, A_EN, B_EN, groupsFor } from "../../_test/testRunListFixture";
import { run } from "../../_helpers/testRun.fixture";
import { NOISE_ANALYSIS_CHANGE } from "../../_test/test.data.helper";
import { TestRun } from "../../types";
import { DEFAULT_SORT } from "./TestRunGridToolbar";
import { TestRunCardView } from "./TestRunCardView";

type Props = ComponentProps<typeof TestRunCardView>;

const propsFor = (
  runs: TestRun[],
  {
    grouped = false,
    ...overrides
  }: Partial<Props> & { grouped?: boolean } = {},
): Props => {
  return {
    groups: groupsFor(runs, grouped),
    selectedIds: [],
    loading: false,
    sort: DEFAULT_SORT,
    onSortChange: vi.fn(),
    paginationModel: { page: 0, pageSize: 10 },
    onPaginationModelChange: vi.fn(),
    activeTags: {
      os: [],
      browser: [],
      viewport: [],
      device: [],
      customTags: [],
    },
    noiseAvailable: true,
    onToggleAll: vi.fn(),
    onToggleGroup: vi.fn(),
    onToggleTag: vi.fn(),
    onOpen: vi.fn(),
    ...overrides,
  };
};

const renderCards = (props: Props) =>
  renderWithProviders(<TestRunCardView {...props} />);

// the pagination's own state, as the list keeps it
const Paged = (props: Omit<Props, "paginationModel">) => {
  const [paginationModel, setPaginationModel] = useState<GridPaginationModel>({
    page: 0,
    pageSize: 10,
  });
  return (
    <TestRunCardView
      {...props}
      paginationModel={paginationModel}
      onPaginationModelChange={setPaginationModel}
    />
  );
};

const TWELVE = Array.from({ length: 12 }, (_, index) =>
  run({
    id: `run-${index + 1}`,
    name: `Screen ${String(index + 1).padStart(2, "0")}`,
  }),
);

const cardNames = () =>
  screen.getAllByTestId("cardName").map((name) => name.textContent);
const thumbnail = () => screen.getByRole("img", { name: "Screen A" });

describe("TestRunCardView", () => {
  it("shows a card per run, variations included", () => {
    renderCards(propsFor([A_EN, A_DE, B_EN]));

    expect(cardNames()).toEqual(["Screen A", "Screen A", "Screen B"]);
    expect(screen.queryByTestId("groupCount")).not.toBeInTheDocument();
  });

  it("shows a card per group", () => {
    renderCards(propsFor([A_EN, A_DE, B_EN], { grouped: true }));

    expect(cardNames()).toEqual(["Screen A", "Screen B"]);
    expect(screen.getByTestId("groupCount")).toHaveTextContent("2");
  });

  it("leaves the noise hint off the cards when the analysis is not available", () => {
    renderCards(
      propsFor(
        [
          run({
            id: "u",
            name: "Screen A",
            noiseAnalysis: NOISE_ANALYSIS_CHANGE,
          }),
        ],
        { noiseAvailable: false },
      ),
    );

    expect(screen.queryByTestId("noise-hint-chip")).not.toBeInTheDocument();
  });

  it("shows the noise hint of an unresolved run on its card", () => {
    renderCards(
      propsFor([
        run({
          id: "hinted",
          name: "Screen H",
          noiseAnalysis: NOISE_ANALYSIS_CHANGE,
        }),
        B_EN,
      ]),
    );

    expect(screen.getAllByTestId("noise-hint-chip")).toHaveLength(1);
    expect(screen.getByTestId("noise-hint-chip")).toHaveTextContent(
      "Likely change",
    );
  });

  it("says so when the filters leave no run", () => {
    renderCards(propsFor([]));

    expect(screen.getByTestId("testRunGridEmpty")).toHaveTextContent(
      "No test runs match the filters",
    );
    expect(screen.queryByTestId("testRunGrid")).not.toBeInTheDocument();
  });

  it("shows a loading bar while the runs load", () => {
    renderCards(propsFor([A_EN], { loading: true }));

    expect(screen.getByRole("progressbar")).toBeInTheDocument();
  });

  it("counts the cards with a ticked run", () => {
    renderCards(
      propsFor([A_EN, A_DE, B_EN], {
        grouped: true,
        selectedIds: ["a-de", "b-en"],
      }),
    );

    expect(screen.getByTestId("gridSelectionCount")).toHaveTextContent(
      "2 cards selected",
    );
  });

  it("shows no count while nothing is ticked", () => {
    renderCards(propsFor([A_EN]));

    expect(screen.queryByTestId("gridSelectionCount")).not.toBeInTheDocument();
  });

  it("offers sorting as a labelled group rather than table columns", () => {
    renderCards(propsFor([A_EN]));

    const sortBy = screen.getByRole("group", { name: "Sort by" });
    expect(
      within(sortBy)
        .getAllByRole("button")
        .map((button) => button.textContent),
    ).toEqual(["Name", "Tags", "Status"]);
  });

  it("ticks all runs in the arrow order from the header box", async () => {
    const props = propsFor([B_EN, A_EN]);
    const { user } = renderCards(props);

    await user.click(screen.getByRole("checkbox", { name: "Select all runs" }));

    expect(props.onToggleAll).toHaveBeenCalledWith(["b-en", "a-en"]);
  });

  it("checks the header box only once every run is ticked", () => {
    const selectAll = () =>
      screen.getByRole("checkbox", { name: "Select all runs" });
    const { rerender } = renderCards(
      propsFor([A_EN, B_EN], { selectedIds: ["a-en"] }),
    );
    expect(selectAll()).not.toBeChecked();

    rerender(
      <TestRunCardView
        {...propsFor([A_EN, B_EN], {
          selectedIds: ["a-en", "b-en"],
        })}
      />,
    );

    expect(selectAll()).toBeChecked();
  });

  it("passes a tick on a card and a click on its image through", async () => {
    const props = propsFor([A_EN, A_DE], { grouped: true });
    const { user } = renderCards(props);

    await user.click(screen.getByRole("checkbox", { name: "Select Screen A" }));
    await user.click(thumbnail());

    expect(props.onToggleGroup).toHaveBeenCalledWith(["a-en", "a-de"]);
    expect(props.onOpen).toHaveBeenCalledWith("a-en");
  });

  it("reports a sort picked in the header", async () => {
    const props = propsFor([A_EN]);
    const { user } = renderCards(props);

    await user.click(screen.getByTestId("gridSort-name"));

    expect(props.onSortChange).toHaveBeenCalledWith({
      field: "name",
      direction: "asc",
    });
  });

  it("offers no noise sort", () => {
    renderCards(propsFor([A_EN]));

    expect(screen.queryByTestId("gridSort-noise")).not.toBeInTheDocument();
  });

  it("pages the cards and starts over on the first page when the page size changes", async () => {
    const { user } = renderWithProviders(<Paged {...propsFor(TWELVE)} />);
    expect(cardNames()).toHaveLength(10);

    await user.click(screen.getByRole("button", { name: "Go to next page" }));
    expect(cardNames()).toEqual(["Screen 11", "Screen 12"]);

    await user.click(screen.getByRole("combobox", { name: "Cards per page:" }));
    await user.click(await screen.findByRole("option", { name: "30" }));

    expect(cardNames()).toHaveLength(12);
    expect(screen.getByText("1–12 of 12")).toBeInTheDocument();
  });

  it("shows the last page when the cards no longer reach the page it is on", () => {
    renderCards(
      propsFor(TWELVE, { paginationModel: { page: 5, pageSize: 10 } }),
    );

    expect(cardNames()).toEqual(["Screen 11", "Screen 12"]);
  });

  it("shows the diff image of a card", () => {
    renderCards(propsFor([A_EN]));

    expect(thumbnail()).toHaveAttribute(
      "src",
      expect.stringContaining("a-en-diff.png"),
    );
  });

  it("shows the screenshot itself when the run has no diff", () => {
    renderCards(propsFor([{ ...A_EN, diffName: "" }]));

    expect(thumbnail()).toHaveAttribute(
      "src",
      expect.stringContaining("a-en.png"),
    );
  });

  it("marks only the cards that have a comment", () => {
    renderCards(
      propsFor([
        run({ id: "c", name: "Commented", comment: "Check the header" }),
        run({ id: "n", name: "Plain" }),
      ]),
    );

    expect(screen.getAllByTestId("comment-indicator")).toHaveLength(1);
    const card = screen
      .getByText("Commented")
      .closest<HTMLElement>('[data-testid="testRunCard"]') as HTMLElement;
    const indicator = within(card).getByTestId("comment-indicator");
    expect(indicator).toBeVisible();
    expect(indicator.parentElement).toContainElement(
      within(card).getByText("Unresolved"),
    );
    expect(indicator.parentElement).not.toContainElement(
      within(card).getByTestId("cardName"),
    );
  });
});
