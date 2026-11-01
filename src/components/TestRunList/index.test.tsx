import type { ReactNode } from "react";
import { act, screen, waitFor, within } from "@testing-library/react";
import { useNavigate } from "react-router-dom";
import { renderWithProviders } from "../../_test/render";
import { run } from "../../_helpers/testRun.fixture";
import {
  updateTestRun,
  useTestRunDispatch,
  useTestRunState,
} from "../../contexts";
import { buildsService, testRunService } from "../../services";
import { Build, TestRun, TestStatus } from "../../types";
import { TEST_RUN_SHOW_DIFF_KEY } from "../../constants";
import { TestDetailsDialog } from "../TestDetailsDialog";
import TestRunList from "./index";
import { NO_FAILURES } from "../../_test/bulkResult";
import { CurrentSearch } from "../../_test/location";

// Konva needs the native canvas package, which jsdom has not got
vi.mock(
  "../TestDetailsDialog/DrawArea",
  () => import("../../_test/FakeDrawArea"),
);

const RUNS_BY_BUILD = {
  "build-a": [run({ id: "a1", buildId: "build-a", name: "Screen A" })],
  "build-b": [run({ id: "b1", buildId: "build-b", name: "Screen B" })],
};

const deferred = <T,>() => {
  const result = {} as { promise: Promise<T>; resolve: (value: T) => void };
  result.promise = new Promise<T>((resolve) => {
    result.resolve = resolve;
  });
  return result;
};

const OpenBuildB = () => {
  const navigate = useNavigate();
  return (
    <button
      onClick={() => {
        navigate("/?buildId=build-b");
      }}
    >
      Open B
    </button>
  );
};

// the tooltip's label sits on a span around the (possibly disabled) button
const actionButton = (label: string): HTMLButtonElement => {
  const button = screen.getByLabelText(label).querySelector("button");
  if (!button) {
    throw new Error(`no button in "${label}"`);
  }
  return button;
};

describe("TestRunList", () => {
  beforeEach(() => {
    vi.spyOn(buildsService, "getDetails").mockImplementation(
      async (id) => ({ id, ciBuildId: `ci-${id}` }) as Build,
    );
    vi.spyOn(testRunService, "getList").mockImplementation(
      async (buildId) =>
        RUNS_BY_BUILD[buildId as keyof typeof RUNS_BY_BUILD] ?? [],
    );
  });

  it("drops the selection when another build is opened", async () => {
    const { user } = renderWithProviders(
      <>
        <OpenBuildB />
        <TestRunList />
      </>,
      { route: "/?buildId=build-a" },
    );
    await user.click(await screen.findByRole("button", { name: "Grid view" }));
    await user.click(
      await screen.findByRole("checkbox", { name: "Select Screen A" }),
    );
    expect(actionButton("Delete selected cards.")).toBeEnabled();

    await user.click(screen.getByRole("button", { name: "Open B" }));

    expect(
      await screen.findByRole("checkbox", { name: "Select Screen B" }),
    ).not.toBeChecked();
    expect(actionButton("Delete selected cards.")).toBeDisabled();
  });

  it("shows only the opened build's runs when an older answer arrives last", async () => {
    const answerA = deferred<TestRun[]>();
    const answerB = deferred<TestRun[]>();
    vi.spyOn(testRunService, "getList").mockImplementation((buildId) =>
      buildId === "build-a" ? answerA.promise : answerB.promise,
    );
    const { user } = renderWithProviders(
      <>
        <OpenBuildB />
        <TestRunList />
      </>,
      { route: "/?buildId=build-a" },
    );
    await waitFor(() =>
      expect(testRunService.getList).toHaveBeenCalledWith("build-a"),
    );
    await user.click(screen.getByRole("button", { name: "Open B" }));
    await waitFor(() =>
      expect(testRunService.getList).toHaveBeenCalledWith("build-b"),
    );

    await act(async () => {
      answerB.resolve(RUNS_BY_BUILD["build-b"]);
      await answerB.promise;
    });
    await act(async () => {
      answerA.resolve(RUNS_BY_BUILD["build-a"]);
      await answerA.promise;
    });

    expect(screen.queryByText("Screen A")).not.toBeInTheDocument();
    expect(await screen.findByText("Screen B")).toBeInTheDocument();
  });
});

type User = ReturnType<typeof renderWithProviders>["user"];

const renderList = (runs: TestRun[], extra: ReactNode = null) => {
  vi.spyOn(buildsService, "getDetails").mockImplementation(
    async (id) => ({ id, ciBuildId: `ci-${id}` }) as Build,
  );
  vi.spyOn(testRunService, "getList").mockResolvedValue(runs);

  return renderWithProviders(
    <>
      {extra}
      <TestRunList />
    </>,
    { route: "/?buildId=build-a" },
  );
};

const NavigationOrder = () => {
  const { filteredSortedTestRunIds } = useTestRunState();
  return (
    <output data-testid="navigationOrder">
      {(filteredSortedTestRunIds ?? []).join(",")}
    </output>
  );
};

const ApproveButtons = ({ runs }: { runs: TestRun[] }) => {
  const dispatch = useTestRunDispatch();
  return (
    <>
      {runs.map((item) => (
        <button
          key={item.id}
          onClick={() =>
            updateTestRun(dispatch, [{ ...item, status: TestStatus.approved }])
          }
        >
          {`Approve ${item.id}`}
        </button>
      ))}
    </>
  );
};

const groupSwitch = () => screen.getByLabelText("Group variations");
const navigationOrder = () => screen.getByTestId("navigationOrder").textContent;
const dataRows = () => screen.getAllByRole("row").slice(1);
const rowOf = (name: string) =>
  screen.getByText(name).closest<HTMLElement>('[role="row"]') as HTMLElement;
const tickRow = (name: string) =>
  // the box's label flips to "Unselect row" once it is ticked
  within(rowOf(name)).getByRole("checkbox", { name: /select row/i });

const A_EN = run({ id: "a-en", name: "Screen A", customTags: "en" });
const A_DE = run({ id: "a-de", name: "Screen A", customTags: "de" });
const B_EN = run({ id: "b-en", name: "Screen B", customTags: "en" });

describe("TestRunList grouping", () => {
  it("lists every run on its own until grouping is switched on", async () => {
    const { user } = renderList([A_EN, A_DE, B_EN]);

    await waitFor(() => expect(dataRows()).toHaveLength(3));
    expect(groupSwitch()).not.toBeChecked();
    expect(screen.queryByTestId("groupCount")).not.toBeInTheDocument();

    await user.click(groupSwitch());

    await waitFor(() => expect(dataRows()).toHaveLength(2));
    expect(screen.getByTestId("groupCount")).toHaveTextContent("2");
  });

  it("selects every run of a group when its table row is ticked", async () => {
    vi.spyOn(testRunService, "removeBulk").mockResolvedValue(NO_FAILURES);
    const { user } = renderList([A_EN, B_EN, A_DE]);
    await screen.findByText("Screen B");
    await user.click(groupSwitch());
    await waitFor(() => expect(dataRows()).toHaveLength(2));
    expect(actionButton("Delete selected rows.")).toBeDisabled();

    await user.click(tickRow("Screen A"));

    expect(tickRow("Screen A")).toBeChecked();
    expect(tickRow("Screen B")).not.toBeChecked();
    await user.click(actionButton("Delete selected rows."));
    expect(
      screen.getByText("Are you sure you want to delete 2 items?"),
    ).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Delete" }));
    expect(testRunService.removeBulk).toHaveBeenCalledWith(["a-en", "a-de"]);
  });

  it("leaves only the runs a bulk action failed on ticked", async () => {
    vi.spyOn(testRunService, "removeBulk").mockResolvedValue({
      succeeded: ["a-en"],
      failed: [{ id: "b-en", message: "Run is in use" }],
    });
    const { user } = renderList([A_EN, B_EN]);
    await waitFor(() => expect(dataRows()).toHaveLength(2));
    await user.click(tickRow("Screen A"));
    await user.click(tickRow("Screen B"));

    await user.click(actionButton("Delete selected rows."));
    await user.click(screen.getByRole("button", { name: "Delete" }));

    expect(
      await screen.findByText(
        "Deleted 1 of 2 test runs. 1 failed: Run is in use",
      ),
    ).toBeInTheDocument();
    // the closing dialog keeps the page out of the accessibility tree
    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
    );
    expect(tickRow("Screen A")).not.toBeChecked();
    expect(tickRow("Screen B")).toBeChecked();
  });

  it("selects every run of a group when its card is ticked", async () => {
    const { user } = renderList([A_EN, B_EN, A_DE]);
    await user.click(await screen.findByRole("button", { name: "Grid view" }));
    await user.click(groupSwitch());
    await screen.findByTestId("groupCount");

    await user.click(screen.getByRole("checkbox", { name: "Select Screen A" }));

    expect(screen.getByTestId("gridSelectionCount")).toHaveTextContent(
      "1 card selected",
    );
    await user.click(actionButton("Delete selected cards."));
    expect(
      screen.getByText("Are you sure you want to delete 2 items?"),
    ).toBeInTheDocument();
  });

  it("publishes the groups expanded as the navigation order", async () => {
    const approved = run({
      id: "a-de",
      name: "Screen A",
      customTags: "de",
      status: TestStatus.approved,
    });
    const bDe = run({ id: "b-de", name: "Screen B", customTags: "de" });
    const { user } = renderList(
      [B_EN, approved, A_EN, bDe],
      <NavigationOrder />,
    );

    await waitFor(() => expect(navigationOrder()).toBe("a-en,b-en,b-de,a-de"));

    await user.click(groupSwitch());

    await waitFor(() => expect(navigationOrder()).toBe("a-en,a-de,b-de,b-en"));
  });

  it("keeps a header sort shown on every click, as the rows always follow one", async () => {
    const { user } = renderList([A_EN, B_EN]);
    await waitFor(() => expect(dataRows()).toHaveLength(2));
    const nameHeader = screen.getByRole("columnheader", { name: /Name/ });

    await user.click(nameHeader);
    await user.click(nameHeader);
    await user.click(nameHeader);

    await waitFor(() =>
      expect(nameHeader).toHaveAttribute("aria-sort", "ascending"),
    );
  });

  it("sorts grouped rows by the tags their column shows, not the grouped axis", async () => {
    const runs = [
      run({ id: "b-aa", name: "Screen B", customTags: "aa" }),
      run({ id: "b-ab", name: "Screen B", customTags: "ab" }),
      run({ id: "a-zz", name: "Screen A", customTags: "zz" }),
      run({ id: "a-zy", name: "Screen A", customTags: "zy" }),
    ];
    const { user } = renderList(runs);
    await waitFor(() => expect(dataRows()).toHaveLength(4));
    await user.click(groupSwitch());
    await waitFor(() => expect(dataRows()).toHaveLength(2));

    await user.click(screen.getByRole("columnheader", { name: /Tags/ }));

    await waitFor(() =>
      expect(
        dataRows().map(
          (row) => within(row).queryByText(/^Screen/)?.textContent,
        ),
      ).toEqual(["Screen A", "Screen B"]),
    );
  });

  it("publishes the grouped table in the order its header sort shows", async () => {
    const aEn = run({
      id: "a-en",
      name: "Screen A",
      customTags: "en",
      status: TestStatus.approved,
    });
    const aDe = run({
      id: "a-de",
      name: "Screen A",
      customTags: "de",
      status: TestStatus.approved,
    });
    const { user } = renderList([aEn, aDe, B_EN], <NavigationOrder />);
    await waitFor(() => expect(dataRows()).toHaveLength(3));
    await user.click(groupSwitch());
    await waitFor(() => expect(navigationOrder()?.split(",")[0]).toBe("b-en"));

    await user.click(screen.getByRole("columnheader", { name: /Name/ }));

    await waitFor(() =>
      expect(navigationOrder()?.split(",").at(-1)).toBe("b-en"),
    );
    expect(
      navigationOrder()
        ?.split(",")
        .slice(0, 2)
        .sort((a, b) => a.localeCompare(b)),
    ).toEqual(["a-de", "a-en"]);
  });

  it("publishes the groups expanded in the card view too", async () => {
    const approved = run({
      id: "a-de",
      name: "Screen A",
      customTags: "de",
      status: TestStatus.approved,
    });
    const { user } = renderList([approved, B_EN, A_EN], <NavigationOrder />);
    await user.click(await screen.findByRole("button", { name: "Grid view" }));
    await user.click(groupSwitch());

    await waitFor(() => expect(navigationOrder()).toBe("a-en,a-de,b-en"));
  });
});

describe("TestRunList show diff", () => {
  afterEach(() => localStorage.removeItem(TEST_RUN_SHOW_DIFF_KEY));

  const showDiffSwitch = () => screen.getByLabelText("Show diff");

  it("remembers that the diff was turned off", async () => {
    const first = renderList([A_EN]);
    await first.user.click(
      await screen.findByRole("button", { name: "Grid view" }),
    );
    expect(showDiffSwitch()).toBeChecked();

    await first.user.click(showDiffSwitch());

    expect(showDiffSwitch()).not.toBeChecked();
    expect(localStorage.getItem(TEST_RUN_SHOW_DIFF_KEY)).toBe("false");
    first.unmount();

    const second = renderList([A_EN]);
    await second.user.click(
      await screen.findByRole("button", { name: "Grid view" }),
    );
    expect(showDiffSwitch()).not.toBeChecked();
  });
});

describe("TestRunList and the details dialog", () => {
  const U1 = run({ id: "u1", name: "U1" });
  const U2 = run({ id: "u2", name: "U2" });
  const U3 = run({ id: "u3", name: "U3" });
  const O1 = run({ id: "o1", name: "O1", status: TestStatus.ok });

  it("keeps the arrow order while the dialog is open when a run is approved elsewhere", async () => {
    vi.spyOn(testRunService, "getDetails").mockImplementation(async (id) => {
      const found = [U1, U2, U3, O1].find((item) => item.id === id);
      if (!found) {
        throw new Error(`no run ${id}`);
      }
      return found;
    });
    const { user } = renderList(
      [U1, U2, U3, O1],
      <>
        <CurrentSearch />
        <ApproveButtons runs={[U1]} />
        <TestDetailsDialog />
      </>,
    );
    await user.click(await screen.findByText("U1"));
    expect(await screen.findByText(/Step 1\/4:/)).toBeInTheDocument();

    await user.click(screen.getByText("Approve u1"));
    await user.keyboard("{ArrowRight}");

    await waitFor(() =>
      expect(screen.getByTestId("search")).toHaveTextContent(/testId=u2$/),
    );
    expect(await screen.findByText(/Step 2\/4:/)).toBeInTheDocument();
  });

  it("walks the table's order when the run was opened by a link", async () => {
    vi.spyOn(buildsService, "getDetails").mockImplementation((id) =>
      Promise.resolve({ id, ciBuildId: `ci-${id}` } as Build),
    );
    // the API's order differs from the table's (needs attention first, by name)
    vi.spyOn(testRunService, "getList").mockResolvedValue([O1, U2, U1]);
    vi.spyOn(testRunService, "getDetails").mockResolvedValue(U1);
    const { user } = renderWithProviders(
      <>
        <CurrentSearch />
        <TestDetailsDialog />
        <TestRunList />
      </>,
      { route: "/?buildId=build-a&testId=u1" },
    );
    expect(await screen.findByText(/Step 1\/3:/)).toBeInTheDocument();

    await user.keyboard("{ArrowRight}");

    await waitFor(() =>
      expect(screen.getByTestId("search")).toHaveTextContent(/testId=u2$/),
    );
  });
});

describe("TestRunList density", () => {
  const densityClass = () =>
    document.querySelector(".MuiDataGrid-root")?.className ?? "";
  const cardImageHeight = () =>
    getComputedStyle(screen.getAllByRole("img")[0]).height;

  it("applies to the table", async () => {
    const { user } = renderList([A_EN]);
    await waitFor(() => expect(densityClass()).toContain("densityStandard"));

    await user.click(screen.getByRole("button", { name: "Compact density" }));
    await waitFor(() => expect(densityClass()).toContain("densityCompact"));

    await user.click(
      screen.getByRole("button", { name: "Comfortable density" }),
    );
    await waitFor(() => expect(densityClass()).toContain("densityComfortable"));
  });

  it("applies to the cards, and is kept when the view changes", async () => {
    const { user } = renderList([A_EN]);
    await user.click(await screen.findByRole("button", { name: "Grid view" }));
    await screen.findByTestId("testRunCard");
    expect(cardImageHeight()).toBe("160px");

    await user.click(screen.getByRole("button", { name: "Compact density" }));
    expect(cardImageHeight()).toBe("110px");

    await user.click(
      screen.getByRole("button", { name: "Comfortable density" }),
    );
    expect(cardImageHeight()).toBe("240px");

    await user.click(screen.getByRole("button", { name: "Table view" }));
    await waitFor(() => expect(densityClass()).toContain("densityComfortable"));
  });
});

describe("TestRunList filters and pages", () => {
  const TWELVE = Array.from({ length: 12 }, (_, index) =>
    run({
      id: `run-${index + 1}`,
      name: `Screen ${String(index + 1).padStart(2, "0")}`,
    }),
  );

  const pick = async (user: User, field: string, option: string) => {
    await user.click(screen.getByRole("combobox", { name: field }));
    await user.click(await screen.findByRole("option", { name: option }));
  };

  // each still matches every run, so only the reset brings the first page back
  const FILTERS: Array<{ name: string; apply: (user: User) => Promise<void> }> =
    [
      {
        name: "name",
        apply: async (user) => {
          await user.type(screen.getByTestId("testRunNameFilter"), "Screen");
        },
      },
      { name: "status", apply: (user) => pick(user, "Status", "unresolved") },
      { name: "tags", apply: (user) => pick(user, "Tag", "en_US") },
    ];

  const onSecondPage = async (user: User) => {
    await screen.findByText("Screen 01");
    await user.click(screen.getByRole("button", { name: "Go to next page" }));
    await screen.findByText("Screen 11");
    expect(screen.queryByText("Screen 01")).not.toBeInTheDocument();
  };

  it.each(FILTERS)(
    "goes back to the first page of the table when the $name filter changes",
    async ({ apply }) => {
      const { user } = renderList(TWELVE);
      await onSecondPage(user);

      await apply(user);

      expect(await screen.findByText("Screen 01")).toBeInTheDocument();
      expect(screen.queryByText("Screen 11")).not.toBeInTheDocument();
    },
  );

  it.each(FILTERS)(
    "goes back to the first page of the cards when the $name filter changes",
    async ({ apply }) => {
      const { user } = renderList(TWELVE);
      await user.click(
        await screen.findByRole("button", { name: "Grid view" }),
      );
      await onSecondPage(user);

      await apply(user);

      expect(await screen.findByText("Screen 01")).toBeInTheDocument();
      expect(screen.queryByText("Screen 11")).not.toBeInTheDocument();
    },
  );
});

describe("TestRunList status filter", () => {
  const OPEN_A = run({ id: "open-a", name: "Screen A" });
  const OPEN_B = run({ id: "open-b", name: "Screen B" });
  const DONE = run({
    id: "done",
    name: "Screen C",
    status: TestStatus.approved,
  });

  // the list stays open between picks, so it is opened once
  const pick = async (user: User, ...options: string[]) => {
    await user.click(screen.getByRole("combobox", { name: "Status" }));
    for (const option of options) {
      await user.click(await screen.findByRole("option", { name: option }));
    }
    await user.keyboard("{Escape}");
  };

  // the chip a selected status leaves in the filter, not the one in a row
  const filterChip = (status: string) =>
    screen.queryByRole("button", { name: status });

  it("drops unresolved from the filter once its last run is approved", async () => {
    const { user } = renderList(
      [OPEN_A, DONE],
      <ApproveButtons runs={[OPEN_A]} />,
    );
    await screen.findByText("Screen A");
    await pick(user, "unresolved", "approved");
    expect(filterChip("unresolved")).toBeInTheDocument();
    expect(filterChip("approved")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Approve open-a" }));

    await waitFor(() => expect(filterChip("unresolved")).toBeNull());
    expect(filterChip("approved")).toBeInTheDocument();
  });

  it("shows every run again when the dropped status was the only filter", async () => {
    const { user } = renderList(
      [OPEN_A, DONE],
      <ApproveButtons runs={[OPEN_A]} />,
    );
    await screen.findByText("Screen C");
    await pick(user, "unresolved");
    await waitFor(() =>
      expect(screen.queryByText("Screen C")).not.toBeInTheDocument(),
    );

    await user.click(screen.getByRole("button", { name: "Approve open-a" }));

    expect(await screen.findByText("Screen C")).toBeInTheDocument();
    expect(screen.getByText("Screen A")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Any status")).toBeInTheDocument();
  });

  it("keeps unresolved in the filter while another run is unresolved", async () => {
    const { user } = renderList(
      [OPEN_A, OPEN_B, DONE],
      <ApproveButtons runs={[OPEN_A]} />,
    );
    await screen.findByText("Screen A");
    await pick(user, "unresolved", "approved");

    await user.click(screen.getByRole("button", { name: "Approve open-a" }));

    await waitFor(() =>
      expect(within(rowOf("Screen A")).getByText("approved")).toBeVisible(),
    );
    expect(filterChip("unresolved")).toBeInTheDocument();
  });
});
