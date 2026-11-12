import { act, screen, waitFor, within } from "@testing-library/react";
import { useNavigate } from "react-router-dom";
import { renderWithProviders } from "../../_test/render";
import { run } from "../../_helpers/testRun.fixture";
import { updateTestRun, useTestRunDispatch } from "../../contexts";
import { buildsService, projectsService, testRunService } from "../../services";
import { TestRun, TestStatus } from "../../types";
import { ImageComparison } from "../../types/imageComparison";
import {
  NOISE_ANALYSIS_CHANGE,
  NOISE_ANALYSIS_NOISE,
  TEST_PROJECT,
  TEST_USER,
} from "../../_test/test.data.helper";
import { TestDetailsDialog } from "../TestDetailsDialog";
import TestRunList from "./index";
import { useSharedTestRunFilters } from "./TestRunFiltersContext";
import { NO_FAILURES } from "../../_test/bulkResult";
import { CurrentSearch } from "../../_test/location";
import {
  build,
  dataRows,
  NavigationOrder,
  navigationOrder,
  renderList,
  rowOf,
  SelectProject,
  tickRow,
  type User,
} from "../../_test/renderTestRunList";
import { detailsFrom } from "../../_test/detailsFrom";

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

const actionButton = (name: string): HTMLElement =>
  screen.getByRole("button", { name });
const selectionBar = () => screen.queryByRole("toolbar", { name: "Selection" });

describe("TestRunList", () => {
  beforeEach(() => {
    vi.spyOn(buildsService, "getDetails").mockImplementation((id) =>
      Promise.resolve(build(id)),
    );
    vi.spyOn(testRunService, "getList").mockImplementation((buildId) =>
      Promise.resolve(
        RUNS_BY_BUILD[buildId as keyof typeof RUNS_BY_BUILD] ?? [],
      ),
    );
  });

  it("asks to select a build when none is open", () => {
    renderWithProviders(<TestRunList />);

    expect(screen.getByText("Select a build")).toBeVisible();
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
    expect(actionButton("Delete…")).toBeEnabled();

    await user.click(screen.getByRole("button", { name: "Open B" }));

    expect(
      await screen.findByRole("checkbox", { name: "Select Screen B" }),
    ).not.toBeChecked();
    expect(selectionBar()).toBeNull();
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

const StatusFilterButtons = () => {
  const { statuses, onStatusesChange } = useSharedTestRunFilters();
  return (
    <>
      {[TestStatus.unresolved, TestStatus.approved].map((status) => (
        <button
          key={status}
          onClick={() =>
            onStatusesChange(
              statuses.includes(status)
                ? statuses.filter((item) => item !== status)
                : [...statuses, status],
            )
          }
        >
          {`Filter ${status}`}
        </button>
      ))}
      <output data-testid="statusFilter">{statuses.join(",")}</output>
    </>
  );
};

const A_EN = run({ id: "a-en", name: "Screen A", customTags: "en" });
const A_DE = run({ id: "a-de", name: "Screen A", customTags: "de" });
const B_EN = run({ id: "b-en", name: "Screen B", customTags: "en" });

describe("TestRunList selection and order", () => {
  it("lists every variation on its own row, with grouping off", async () => {
    renderList([A_EN, A_DE, B_EN]);

    await waitFor(() => expect(dataRows()).toHaveLength(3));
    expect(
      screen.getByRole("switch", { name: "Group variations" }),
    ).not.toBeChecked();
  });

  it("deletes the runs ticked in the table", async () => {
    vi.spyOn(testRunService, "removeBulk").mockResolvedValue(NO_FAILURES);
    const { user } = renderList([A_EN, B_EN, A_DE]);
    await waitFor(() => expect(dataRows()).toHaveLength(3));
    expect(selectionBar()).toBeNull();

    await user.click(tickRow("Screen B"));

    await user.click(actionButton("Delete…"));
    expect(screen.getByText("Delete 1 test run?")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Delete" }));
    expect(testRunService.removeBulk).toHaveBeenCalledWith(["b-en"]);
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

    await user.click(actionButton("Delete…"));
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

  it("selects a run when its card is ticked", async () => {
    const { user } = renderList([A_EN, B_EN, A_DE]);
    await user.click(await screen.findByRole("button", { name: "Grid view" }));

    await user.click(
      await screen.findByRole("checkbox", { name: "Select Screen B" }),
    );

    expect(screen.getByTestId("gridSelectionCount")).toHaveTextContent(
      "1 card selected",
    );
    await user.click(actionButton("Delete…"));
    expect(screen.getByText("Delete 1 test run?")).toBeInTheDocument();
  });

  it("publishes the table's order as the navigation order", async () => {
    const approved = run({
      id: "a-de",
      name: "Screen A",
      customTags: "de",
      status: TestStatus.approved,
    });
    const bDe = run({ id: "b-de", name: "Screen B", customTags: "de" });
    renderList([B_EN, approved, A_EN, bDe], <NavigationOrder />);

    await waitFor(() => expect(navigationOrder()).toBe("a-en,b-en,b-de,a-de"));
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

  it("publishes the table in the order its header sort shows", async () => {
    const aEn = run({
      id: "a-en",
      name: "Screen A",
      customTags: "en",
      status: TestStatus.approved,
    });
    const { user } = renderList([aEn, B_EN], <NavigationOrder />);
    await waitFor(() => expect(navigationOrder()).toBe("b-en,a-en"));

    await user.click(screen.getByRole("columnheader", { name: /Name/ }));

    await waitFor(() => expect(navigationOrder()).toBe("a-en,b-en"));
  });

  it("publishes the cards' order as the navigation order", async () => {
    const approved = run({
      id: "a-de",
      name: "Screen A",
      customTags: "de",
      status: TestStatus.approved,
    });
    const { user } = renderList([approved, B_EN, A_EN], <NavigationOrder />);
    await user.click(await screen.findByRole("button", { name: "Grid view" }));

    await waitFor(() => expect(navigationOrder()).toBe("a-en,b-en,a-de"));
  });
});

describe("TestRunList and the details dialog", () => {
  const U1 = run({ id: "u1", name: "U1" });
  const U2 = run({ id: "u2", name: "U2" });
  const U3 = run({ id: "u3", name: "U3" });
  const O1 = run({ id: "o1", name: "O1", status: TestStatus.ok });

  it("keeps the arrow order while the dialog is open when a run is approved elsewhere", async () => {
    vi.spyOn(testRunService, "getDetails").mockImplementation(
      detailsFrom([U1, U2, U3, O1]),
    );
    const { user } = renderList(
      [U1, U2, U3, O1],
      <>
        <CurrentSearch />
        <ApproveButtons runs={[U1]} />
        <TestDetailsDialog />
      </>,
    );
    await user.click(await screen.findByText("U1"));
    expect(await screen.findByText("1/4")).toBeInTheDocument();

    await user.click(screen.getByText("Approve u1"));
    await user.keyboard("{ArrowRight}");

    await waitFor(() =>
      expect(screen.getByTestId("search")).toHaveTextContent(/testId=u2$/),
    );
    expect(await screen.findByText("2/4")).toBeInTheDocument();
  });

  it("walks the table's order when the run was opened by a link", async () => {
    vi.spyOn(buildsService, "getDetails").mockImplementation((id) =>
      Promise.resolve(build(id)),
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
    expect(await screen.findByText("1/3")).toBeInTheDocument();

    await user.keyboard("{ArrowRight}");

    await waitFor(() =>
      expect(screen.getByTestId("search")).toHaveTextContent(/testId=u2$/),
    );
  });
});

describe("TestRunList filters and pages", () => {
  const TWELVE = Array.from({ length: 12 }, (_, index) =>
    run({
      id: `run-${index + 1}`,
      name: `Screen ${String(index + 1).padStart(2, "0")}`,
    }),
  );

  const pickTag = async (user: User, field: string, option: string) => {
    await user.click(
      document.getElementById(`filter-chip-${field}`) as HTMLElement,
    );
    await user.click(
      await screen.findByRole("menuitemcheckbox", { name: option }),
    );
    await user.keyboard("{Escape}");
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
      {
        name: "status",
        apply: (user) =>
          user.click(screen.getByRole("button", { name: "Filter unresolved" })),
      },
      { name: "tags", apply: (user) => pickTag(user, "customTags", "en_US") },
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
      const { user } = renderList(TWELVE, <StatusFilterButtons />);
      await onSecondPage(user);

      await apply(user);

      expect(await screen.findByText("Screen 01")).toBeInTheDocument();
      expect(screen.queryByText("Screen 11")).not.toBeInTheDocument();
    },
  );

  it.each(FILTERS)(
    "goes back to the first page of the cards when the $name filter changes",
    async ({ apply }) => {
      const { user } = renderList(TWELVE, <StatusFilterButtons />);
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

  const pick = (user: User, ...statuses: string[]) =>
    statuses.reduce(
      (done, status) =>
        done.then(() =>
          user.click(screen.getByRole("button", { name: `Filter ${status}` })),
        ),
      Promise.resolve(),
    );

  const filterChip = (status: string) =>
    screen.queryByText(new RegExp(`(^|,)${status}(,|$)`), {
      selector: "[data-testid=statusFilter]",
    });

  it("drops unresolved from the filter once its last run is approved", async () => {
    const { user } = renderList(
      [OPEN_A, DONE],
      <>
        <ApproveButtons runs={[OPEN_A]} />
        <StatusFilterButtons />
      </>,
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
      <>
        <ApproveButtons runs={[OPEN_A]} />
        <StatusFilterButtons />
      </>,
    );
    await screen.findByText("Screen C");
    await pick(user, "unresolved");
    await waitFor(() =>
      expect(screen.queryByText("Screen C")).not.toBeInTheDocument(),
    );

    await user.click(screen.getByRole("button", { name: "Approve open-a" }));

    expect(await screen.findByText("Screen C")).toBeInTheDocument();
    expect(screen.getByText("Screen A")).toBeInTheDocument();
    expect(screen.getByTestId("statusFilter")).toBeEmptyDOMElement();
  });

  it("keeps unresolved in the filter while another run is unresolved", async () => {
    const { user } = renderList(
      [OPEN_A, OPEN_B, DONE],
      <>
        <ApproveButtons runs={[OPEN_A]} />
        <StatusFilterButtons />
      </>,
    );
    await screen.findByText("Screen A");
    await pick(user, "unresolved", "approved");

    await user.click(screen.getByRole("button", { name: "Approve open-a" }));

    await waitFor(() =>
      expect(within(rowOf("Screen A")).getByText("Approved")).toBeVisible(),
    );
    expect(filterChip("unresolved")).toBeInTheDocument();
  });
});

describe("TestRunList noise hint", () => {
  const renderWith = async (project: Partial<typeof TEST_PROJECT>) => {
    vi.spyOn(projectsService, "getAll").mockResolvedValue([
      { ...TEST_PROJECT, ...project },
    ]);
    const rendered = renderList(
      [
        run({ id: "n", name: "Screen N", noiseAnalysis: NOISE_ANALYSIS_NOISE }),
        run({
          id: "c",
          name: "Screen C",
          noiseAnalysis: NOISE_ANALYSIS_CHANGE,
        }),
      ],
      <SelectProject />,
      TEST_USER,
    );
    await screen.findByTestId("project-ready");
    await screen.findByText("Screen N");
    return rendered;
  };

  it("offers the Noise column but neither a noise filter nor a noise sort", async () => {
    const { user } = await renderWith({});

    expect(
      screen.getByRole("columnheader", { name: /Noise/ }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /^Noise/ }),
    ).not.toBeInTheDocument();

    await user.click(await screen.findByRole("button", { name: "Grid view" }));

    expect(await screen.findByTestId("gridSort-status")).toBeInTheDocument();
    expect(screen.queryByTestId("gridSort-noise")).not.toBeInTheDocument();
  });

  it("leaves the Noise column out for a VLM project", async () => {
    await renderWith({ imageComparison: ImageComparison.vlm });

    expect(
      screen.queryByRole("columnheader", { name: /Noise/ }),
    ).not.toBeInTheDocument();
  });
});
