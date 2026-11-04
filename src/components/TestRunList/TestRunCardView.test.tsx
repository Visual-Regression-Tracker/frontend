import { type ComponentProps, useState } from "react";
import { fireEvent, screen, waitFor } from "@testing-library/react";
import type { GridPaginationModel } from "@mui/x-data-grid";
import { renderWithProviders } from "../../_test/render";
import {
  A_DE,
  A_EN,
  B_EN,
  groupsFor,
  toolbarProps,
} from "../../_test/testRunListFixture";
import { run } from "../../_helpers/testRun.fixture";
import { TAG_FIELDS } from "../../_helpers/testRunTags.helper";
import { TEST_RUN_SHOW_DIFF_KEY } from "../../constants";
import { NOISE_ANALYSIS_CHANGE } from "../../_test/test.data.helper";
import { TestRun } from "../../types";
import { DEFAULT_SORT } from "./TestRunGridHeader";
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
    toolbarProps: toolbarProps("grid"),
    groups: groupsFor(runs, grouped),
    selectedIds: [],
    loading: false,
    sort: DEFAULT_SORT,
    onSortChange: vi.fn(),
    paginationModel: { page: 0, pageSize: 10 },
    onPaginationModelChange: vi.fn(),
    activeTags: [],
    tagFieldsFor: () => TAG_FIELDS,
    hotkeysEnabled: true,
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
const showDiffSwitch = () => screen.getByLabelText("Show diff");
const thumbnail = () => screen.getByRole("img", { name: "Screen A" });

describe("TestRunCardView", () => {
  afterEach(() => localStorage.removeItem(TEST_RUN_SHOW_DIFF_KEY));

  it("shows a card per group", () => {
    renderCards(propsFor([A_EN, A_DE, B_EN], { grouped: true }));

    expect(cardNames()).toEqual(["Screen A", "Screen B"]);
    expect(screen.getByTestId("groupCount")).toHaveTextContent("2");
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

    // the run left to review represents the group
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

  it("sorts by noise, changes first, from the header", async () => {
    const props = propsFor([A_EN]);
    const { user } = renderCards(props);

    await user.click(screen.getByTestId("gridSort-noise"));

    expect(props.onSortChange).toHaveBeenCalledWith({
      field: "noise",
      direction: "desc",
    });
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

  it("shows the diff until it is switched off, and remembers that", async () => {
    const { user, unmount } = renderCards(propsFor([A_EN]));
    expect(showDiffSwitch()).toBeChecked();
    expect(thumbnail()).toHaveAttribute(
      "src",
      expect.stringContaining("a-en-diff.png"),
    );

    await user.click(showDiffSwitch());

    expect(thumbnail()).toHaveAttribute(
      "src",
      expect.stringContaining("a-en.png"),
    );
    expect(localStorage.getItem(TEST_RUN_SHOW_DIFF_KEY)).toBe("false");
    unmount();

    renderCards(propsFor([A_EN]));
    expect(showDiffSwitch()).not.toBeChecked();
  });

  it("toggles the diff with d", async () => {
    renderCards(propsFor([A_EN]));

    fireEvent.keyDown(document.body, { key: "d", code: "KeyD" });

    await waitFor(() => expect(showDiffSwitch()).not.toBeChecked());
  });

  it("leaves d alone while hotkeys are off, as while a run is open", () => {
    renderCards(propsFor([A_EN], { hotkeysEnabled: false }));

    fireEvent.keyDown(document.body, { key: "d", code: "KeyD" });

    expect(showDiffSwitch()).toBeChecked();
  });
});
