import { screen, waitFor, within } from "@testing-library/react";
import { run } from "../../_helpers/testRun.fixture";
import { projectsService, testRunService } from "../../services";
import { TestStatus } from "../../types";
import { TEST_PROJECT, TEST_USER } from "../../_test/test.data.helper";
import { NO_FAILURES } from "../../_test/bulkResult";
import {
  dataRows,
  NavigationOrder,
  navigationOrder,
  renderList,
  rowOf,
  SelectProject,
  tickRow,
  type User,
} from "../../_test/renderTestRunList";

const A_EN = run({ id: "a-en", name: "Screen A", customTags: "en" });
const A_DE = run({ id: "a-de", name: "Screen A", customTags: "de" });
const B_EN = run({ id: "b-en", name: "Screen B", customTags: "en" });

const groupSwitch = () =>
  screen.getByRole("switch", { name: "Group variations" });
const groupVariations = (user: User) => user.click(groupSwitch());
const rowNames = () =>
  dataRows().map((row) => within(row).queryByText(/^Screen/)?.textContent);

describe("TestRunList grouping", () => {
  it("collapses a screen's variations into one row once switched on", async () => {
    const { user } = renderList([A_EN, A_DE, B_EN]);
    await waitFor(() => expect(dataRows()).toHaveLength(3));
    expect(screen.queryByTestId("groupCount")).not.toBeInTheDocument();

    await groupVariations(user);

    await waitFor(() => expect(dataRows()).toHaveLength(2));
    expect(groupSwitch()).toBeChecked();
    expect(
      within(rowOf("Screen A")).getByTestId("groupCount"),
    ).toHaveTextContent("2");
  });

  it("starts ungrouped again the next time the list opens", async () => {
    const first = renderList([A_EN, A_DE]);
    await first.user.click(
      await screen.findByRole("switch", { name: "Group variations" }),
    );
    first.unmount();

    renderList([A_EN, A_DE]);

    await waitFor(() => expect(dataRows()).toHaveLength(2));
    expect(groupSwitch()).not.toBeChecked();
  });

  it("groups by the project's variation axis", async () => {
    vi.spyOn(projectsService, "getAll").mockResolvedValue([
      { ...TEST_PROJECT, bulkApproveGroupBy: "viewport" },
    ]);
    const { user } = renderList(
      [
        run({ id: "a-s", name: "Screen A", viewport: "320x640" }),
        run({ id: "a-l", name: "Screen A", viewport: "1280x800" }),
        run({ id: "a-de", name: "Screen A", customTags: "de" }),
      ],
      <SelectProject />,
      TEST_USER,
    );
    await screen.findByTestId("project-ready");
    await waitFor(() => expect(dataRows()).toHaveLength(3));

    await groupVariations(user);

    await waitFor(() => expect(dataRows()).toHaveLength(2));
    expect(screen.getByTestId("groupCount")).toHaveTextContent("2");
  });

  it("selects every run of a group when its table row is ticked", async () => {
    vi.spyOn(testRunService, "removeBulk").mockResolvedValue(NO_FAILURES);
    const { user } = renderList([A_EN, B_EN, A_DE]);
    await screen.findByText("Screen B");
    await groupVariations(user);
    await waitFor(() => expect(dataRows()).toHaveLength(2));

    await user.click(tickRow("Screen A"));

    expect(tickRow("Screen A")).toBeChecked();
    expect(tickRow("Screen B")).not.toBeChecked();
    await user.click(screen.getByRole("button", { name: "Delete…" }));
    expect(screen.getByText("Delete 2 test runs?")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Delete" }));
    expect(testRunService.removeBulk).toHaveBeenCalledWith(["a-en", "a-de"]);
  });

  it("selects every run of a group when its card is ticked", async () => {
    const { user } = renderList([A_EN, B_EN, A_DE]);
    await user.click(await screen.findByRole("button", { name: "Grid view" }));
    await groupVariations(user);
    await screen.findByTestId("groupCount");

    await user.click(screen.getByRole("checkbox", { name: "Select Screen A" }));

    expect(screen.getByTestId("gridSelectionCount")).toHaveTextContent(
      "1 card selected",
    );
    await user.click(screen.getByRole("button", { name: "Delete…" }));
    expect(screen.getByText("Delete 2 test runs?")).toBeInTheDocument();
  });

  it("publishes the groups expanded as the navigation order", async () => {
    const approved = { ...A_DE, status: TestStatus.approved };
    const bDe = run({ id: "b-de", name: "Screen B", customTags: "de" });
    const { user } = renderList(
      [B_EN, approved, A_EN, bDe],
      <NavigationOrder />,
    );
    await waitFor(() => expect(navigationOrder()).toBe("a-en,b-en,b-de,a-de"));

    await groupVariations(user);

    await waitFor(() => expect(navigationOrder()).toBe("a-en,a-de,b-de,b-en"));
  });

  it("publishes the groups expanded in the card view too", async () => {
    const approved = { ...A_DE, status: TestStatus.approved };
    const { user } = renderList([approved, B_EN, A_EN], <NavigationOrder />);
    await user.click(await screen.findByRole("button", { name: "Grid view" }));

    await groupVariations(user);

    await waitFor(() => expect(navigationOrder()).toBe("a-en,a-de,b-en"));
  });

  it("sorts grouped rows by the tags their column shows, not the grouped axis", async () => {
    const { user } = renderList([
      run({ id: "b-aa", name: "Screen B", customTags: "aa" }),
      run({ id: "b-ab", name: "Screen B", customTags: "ab" }),
      run({ id: "a-zz", name: "Screen A", customTags: "zz" }),
      run({ id: "a-zy", name: "Screen A", customTags: "zy" }),
    ]);
    await waitFor(() => expect(dataRows()).toHaveLength(4));
    await groupVariations(user);
    await waitFor(() => expect(dataRows()).toHaveLength(2));

    await user.click(screen.getByRole("columnheader", { name: /Tags/ }));

    await waitFor(() => expect(rowNames()).toEqual(["Screen A", "Screen B"]));
  });

  it("places a group by its representative when the header sort changes", async () => {
    const approvedEn = { ...A_EN, status: TestStatus.approved };
    const approvedDe = { ...A_DE, status: TestStatus.approved };
    const { user } = renderList(
      [approvedEn, approvedDe, B_EN],
      <NavigationOrder />,
    );
    await waitFor(() => expect(dataRows()).toHaveLength(3));
    await groupVariations(user);
    await waitFor(() => expect(rowNames()).toEqual(["Screen B", "Screen A"]));

    await user.click(screen.getByRole("columnheader", { name: /Name/ }));

    await waitFor(() => expect(rowNames()).toEqual(["Screen A", "Screen B"]));
    expect(navigationOrder()?.split(",").at(-1)).toBe("b-en");
  });

  it("clears the selection when grouping is switched, so no unticked row stays selected", async () => {
    const { user } = renderList([A_EN, A_DE, B_EN]);
    await waitFor(() => expect(dataRows()).toHaveLength(3));
    expect(within(dataRows()[0]).getByText("Screen A")).toBeInTheDocument();
    await user.click(
      within(dataRows()[0]).getByRole("checkbox", { name: /select row/i }),
    );
    expect(screen.getByText("1 selected")).toBeVisible();

    await groupVariations(user);

    await waitFor(() => expect(dataRows()).toHaveLength(2));
    expect(screen.queryByText("1 selected")).not.toBeInTheDocument();
    expect(tickRow("Screen A")).not.toBeChecked();
  });
});
