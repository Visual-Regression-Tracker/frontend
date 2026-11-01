import { useEffect } from "react";
import { act, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CurrentSearch } from "../../_test/location";
import type { MockInstance } from "vitest";
import { renderWithProviders } from "../../_test/render";
import { selectProject, useProjectDispatch } from "../../contexts";
import { buildsService } from "../../services";
import {
  TEST_BUILD_FAILED,
  TEST_BUILD_PASSED,
} from "../../_test/test.data.helper";
import { Build } from "../../types";
import BuildList from "./index";

const PROJECT_ID = "project-1";

const OpenProject = () => {
  const dispatch = useProjectDispatch();
  useEffect(() => {
    selectProject(dispatch, PROJECT_ID);
  }, [dispatch]);
  return <BuildList />;
};

const searchInput = () => screen.getByRole("textbox", { name: "Search build" });

describe("BuildList", () => {
  let getList: MockInstance<typeof buildsService.getList>;

  beforeAll(() => {
    // jsdom has no Element.scrollTo, which the list uses to go back to the top
    Element.prototype.scrollTo = () => undefined;
  });

  beforeEach(() => {
    getList = vi.spyOn(buildsService, "getList").mockResolvedValue({
      data: [TEST_BUILD_PASSED],
      total: 1,
      skip: 0,
      take: 10,
    });
  });

  it("loads the first page of the selected project's builds", async () => {
    renderWithProviders(<OpenProject />);

    expect(await screen.findByText("#2")).toBeVisible();
    expect(getList).toHaveBeenCalledWith(PROJECT_ID, 10, 0, "", undefined);
  });

  describe("build search", () => {
    let user: ReturnType<typeof userEvent.setup>;

    beforeEach(() => {
      vi.useFakeTimers({ shouldAdvanceTime: true });
      user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    const elapse = (ms: number) =>
      act(async () => {
        await vi.advanceTimersByTimeAsync(ms);
      });

    const renderSettled = async () => {
      renderWithProviders(<OpenProject />);
      await waitFor(() => expect(getList).toHaveBeenCalledTimes(1));
      await screen.findByText("#2");
      getList.mockClear();
    };

    it("shows what is typed at once but searches only after the typing pauses", async () => {
      await renderSettled();

      await user.type(searchInput(), "ci-12");

      expect(searchInput()).toHaveValue("ci-12");
      expect(getList).not.toHaveBeenCalled();

      await elapse(200);
      expect(getList).not.toHaveBeenCalled();

      await elapse(150);
      expect(getList).toHaveBeenCalledTimes(1);
      expect(getList).toHaveBeenCalledWith(
        PROJECT_ID,
        10,
        0,
        "ci-12",
        undefined,
      );
    });

    it("searches for the typed ci build id from the first page", async () => {
      await renderSettled();

      await user.type(searchInput(), "ci-12{Enter}");

      await waitFor(() =>
        expect(getList).toHaveBeenLastCalledWith(
          PROJECT_ID,
          10,
          0,
          "ci-12",
          undefined,
        ),
      );
    });

    it("searches for a single character too", async () => {
      await renderSettled();

      await user.type(searchInput(), "a");
      await elapse(400);

      expect(getList).toHaveBeenCalledTimes(1);
      expect(getList).toHaveBeenCalledWith(PROJECT_ID, 10, 0, "a", undefined);
    });

    it("searches again with no query when the input is emptied", async () => {
      await renderSettled();
      await user.type(searchInput(), "ci-12{Enter}");
      await waitFor(() => expect(getList).toHaveBeenCalledTimes(1));
      getList.mockClear();

      await user.clear(searchInput());
      await elapse(400);

      expect(getList).toHaveBeenCalledTimes(1);
      expect(getList).toHaveBeenCalledWith(PROJECT_ID, 10, 0, "", undefined);
    });

    it("searches at once when Enter is pressed", async () => {
      await renderSettled();

      await user.type(searchInput(), "ci-12{Enter}");

      await waitFor(() => expect(getList).toHaveBeenCalledTimes(1));
      expect(getList).toHaveBeenCalledWith(
        PROJECT_ID,
        10,
        0,
        "ci-12",
        undefined,
      );

      await elapse(400);
      expect(getList).toHaveBeenCalledTimes(1);
    });

    it("searches at once when the input loses focus", async () => {
      await renderSettled();

      await user.type(searchInput(), "ci-12");
      await user.tab();

      await waitFor(() => expect(getList).toHaveBeenCalledTimes(1));
      expect(getList).toHaveBeenCalledWith(
        PROJECT_ID,
        10,
        0,
        "ci-12",
        undefined,
      );

      await elapse(400);
      expect(getList).toHaveBeenCalledTimes(1);
    });

    it("tells which search found no builds", async () => {
      await renderSettled();
      getList.mockResolvedValue({ data: [], total: 0, skip: 0, take: 10 });

      await user.type(searchInput(), "nope{Enter}");

      expect(await screen.findByText('No builds match "nope"')).toBeVisible();
    });
  });

  describe("answers arriving out of order", () => {
    type Page = Awaited<ReturnType<typeof buildsService.getList>>;

    const deferred = () => {
      let resolve!: (page: Page) => void;
      let reject!: (reason: string) => void;
      const promise = new Promise<Page>((res, rej) => {
        resolve = res;
        reject = rej;
      });
      return { promise, resolve, reject };
    };

    const page = (build: Build): Page => ({
      data: [build],
      total: 1,
      skip: 0,
      take: 10,
    });

    const InProject = ({ projectId }: { projectId: string }) => {
      const dispatch = useProjectDispatch();
      useEffect(() => {
        selectProject(dispatch, projectId);
      }, [dispatch, projectId]);
      return <BuildList />;
    };

    it("shows the project switched to, not a late answer for the previous one", async () => {
      const first = deferred();
      const second = deferred();
      getList
        .mockReturnValueOnce(first.promise)
        .mockReturnValueOnce(second.promise);
      const { rerender } = renderWithProviders(
        <InProject projectId="project-a" />,
      );
      await waitFor(() => expect(getList).toHaveBeenCalledTimes(1));

      rerender(<InProject projectId="project-b" />);
      await waitFor(() => expect(getList).toHaveBeenCalledTimes(2));
      expect(getList).toHaveBeenLastCalledWith(
        "project-b",
        10,
        0,
        "",
        undefined,
      );

      await act(async () => second.resolve(page(TEST_BUILD_PASSED)));
      await act(async () => first.resolve(page(TEST_BUILD_FAILED)));

      expect(screen.getByText("#2")).toBeVisible();
      expect(screen.queryByText("#1")).not.toBeInTheDocument();
    });

    it("ignores a late failure of the previous project's request", async () => {
      const first = deferred();
      const second = deferred();
      getList
        .mockReturnValueOnce(first.promise)
        .mockReturnValueOnce(second.promise);
      const { rerender } = renderWithProviders(
        <InProject projectId="project-a" />,
      );
      await waitFor(() => expect(getList).toHaveBeenCalledTimes(1));

      rerender(<InProject projectId="project-b" />);
      await waitFor(() => expect(getList).toHaveBeenCalledTimes(2));

      await act(async () => second.resolve(page(TEST_BUILD_PASSED)));
      await act(async () => first.reject("Project A is gone"));

      expect(screen.getByText("#2")).toBeVisible();
      expect(screen.queryByText("Project A is gone")).not.toBeInTheDocument();
    });
  });

  describe("deleting and selecting builds", () => {
    type Page = Awaited<ReturnType<typeof buildsService.getList>>;
    type User = ReturnType<typeof userEvent.setup>;

    const makeBuild = (n: number): Build => ({
      ...TEST_BUILD_PASSED,
      id: `build-${n}`,
      number: n,
      ciBuildId: `ci-${n}`,
    });
    const label = (n: number) => `#${n} ci-${n}`;
    const builds = (from: number, to: number) =>
      Array.from({ length: to - from + 1 }, (_, i) => makeBuild(from + i));
    const pageOf = (data: Build[], total: number, skip = 0): Page => ({
      data,
      total,
      skip,
      take: 10,
    });

    const WithLocation = () => (
      <>
        <OpenProject />
        <CurrentSearch />
      </>
    );

    const rowCheckboxes = () =>
      screen
        .getAllByRole("checkbox")
        .filter((box) => !box.getAttribute("aria-label"))
        .map((box) => box as HTMLInputElement);
    const confirm = async (user: User, title: string) => {
      const dialog = await screen.findByRole("dialog", { name: title });
      await user.click(within(dialog).getByTestId("submitButton"));
    };
    // the row's menu button only shows on hover in a browser; a click does not care
    const openRowMenu = async (user: User, row: number, item: string) => {
      await user.click(screen.getAllByTestId("MoreVertIcon")[row]);
      await user.click(await screen.findByRole("menuitem", { name: item }));
    };

    describe("bulk delete", () => {
      it("reports both the deleted and the failed builds, refetches and clears the selection", async () => {
        getList.mockResolvedValue(pageOf(builds(1, 3), 3));
        const remove = vi
          .spyOn(buildsService, "remove")
          .mockImplementation((id) =>
            id === "build-2"
              ? Promise.reject("Build is locked")
              : Promise.resolve(makeBuild(1)),
          );
        const { user } = renderWithProviders(<OpenProject />);
        await screen.findByText(label(1));

        await user.click(
          screen.getByRole("checkbox", { name: "Select all (3)" }),
        );
        expect(rowCheckboxes().every((box) => box.checked)).toBe(true);
        await user.click(screen.getByTestId("buildDeleteSelected"));
        expect(
          await screen.findByText(
            "Are you sure you want to delete 3 build(s)?",
          ),
        ).toBeVisible();

        getList.mockClear();
        getList.mockResolvedValue(pageOf([makeBuild(2)], 1));
        await confirm(user, "Delete Builds");

        expect(await screen.findByText("2 build(s) deleted")).toBeVisible();
        expect(screen.getByText("Failed to delete 1 build(s)")).toBeVisible();
        expect(remove).toHaveBeenCalledTimes(3);
        expect(remove).toHaveBeenCalledWith("build-1");
        expect(remove).toHaveBeenCalledWith("build-2");
        expect(remove).toHaveBeenCalledWith("build-3");

        await waitFor(() =>
          expect(getList).toHaveBeenCalledWith(
            PROJECT_ID,
            10,
            0,
            "",
            undefined,
          ),
        );
        await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
        expect(rowCheckboxes().every((box) => !box.checked)).toBe(true);
        expect(
          screen.getByRole("checkbox", { name: "Select all (1)" }),
        ).not.toBeChecked();
      });
    });

    describe("deleting from the build's menu", () => {
      it("goes back a page when the last build of the last page is deleted", async () => {
        getList.mockImplementation((_project, _take, skip) =>
          Promise.resolve(
            skip === 0
              ? pageOf(builds(1, 10), 11)
              : pageOf([makeBuild(11)], 11, 10),
          ),
        );
        const remove = vi
          .spyOn(buildsService, "remove")
          .mockResolvedValue(makeBuild(11));
        const { user } = renderWithProviders(<OpenProject />);
        await screen.findByText(label(1));

        await user.click(screen.getByRole("button", { name: "Go to page 2" }));
        expect(await screen.findByText(label(11))).toBeVisible();
        expect(getList).toHaveBeenLastCalledWith(
          PROJECT_ID,
          10,
          10,
          "",
          undefined,
        );

        getList.mockClear();
        await openRowMenu(user, 0, "Delete");
        await confirm(user, "Delete Build");

        expect(await screen.findByText("Build #11 deleted")).toBeVisible();
        expect(remove).toHaveBeenCalledWith("build-11");
        await waitFor(() =>
          expect(getList).toHaveBeenCalledWith(
            PROJECT_ID,
            10,
            0,
            "",
            undefined,
          ),
        );
        expect(await screen.findByText(label(1))).toBeVisible();
        expect(screen.getByRole("button", { name: "page 1" })).toHaveAttribute(
          "aria-current",
          "page",
        );
      });

      it("stays on the page when it still has builds after the delete", async () => {
        getList.mockImplementation((_project, _take, skip) =>
          Promise.resolve(
            skip === 0
              ? pageOf(builds(1, 10), 12)
              : pageOf([makeBuild(11), makeBuild(12)], 12, 10),
          ),
        );
        vi.spyOn(buildsService, "remove").mockResolvedValue(makeBuild(11));
        const { user } = renderWithProviders(<OpenProject />);
        await screen.findByText(label(1));
        await user.click(screen.getByRole("button", { name: "Go to page 2" }));
        await screen.findByText(label(11));

        getList.mockClear();
        await openRowMenu(user, 0, "Delete");
        await confirm(user, "Delete Build");

        await waitFor(() =>
          expect(getList).toHaveBeenCalledWith(
            PROJECT_ID,
            10,
            10,
            "",
            undefined,
          ),
        );
      });

      it("shows no build as selected when the open build is deleted", async () => {
        vi.spyOn(buildsService, "getDetails").mockResolvedValue(
          TEST_BUILD_PASSED,
        );
        getList.mockResolvedValue(pageOf([TEST_BUILD_PASSED], 1));
        vi.spyOn(buildsService, "remove").mockResolvedValue(TEST_BUILD_PASSED);
        const { user } = renderWithProviders(<WithLocation />, {
          route: `/?buildId=${TEST_BUILD_PASSED.id}`,
        });
        await screen.findByText("#2");
        expect(screen.getByTestId("search")).toHaveTextContent(
          `?buildId=${TEST_BUILD_PASSED.id}`,
        );

        await openRowMenu(user, 0, "Delete");
        await confirm(user, "Delete Build");

        await waitFor(() =>
          expect(screen.getByTestId("search")).toBeEmptyDOMElement(),
        );
      });

      it("drops the deleted build from the selection", async () => {
        getList.mockResolvedValue(pageOf(builds(1, 3), 3));
        vi.spyOn(buildsService, "remove").mockResolvedValue(makeBuild(2));
        const { user } = renderWithProviders(<OpenProject />);
        await screen.findByText(label(1));

        await user.click(rowCheckboxes()[0]);
        await user.click(rowCheckboxes()[1]);

        getList.mockResolvedValue(pageOf([makeBuild(1), makeBuild(3)], 2));
        await openRowMenu(user, 1, "Delete");
        await confirm(user, "Delete Build");
        expect(await screen.findByText("Build #2 deleted")).toBeVisible();
        await waitFor(() =>
          expect(screen.queryByText(label(2))).not.toBeInTheDocument(),
        );

        await user.click(screen.getByTestId("buildDeleteSelected"));
        expect(
          await screen.findByText(
            "Are you sure you want to delete 1 build(s)?",
          ),
        ).toBeVisible();
      });

      it("keeps the open build when another build is deleted", async () => {
        vi.spyOn(buildsService, "getDetails").mockResolvedValue(makeBuild(1));
        getList.mockResolvedValue(pageOf(builds(1, 2), 2));
        vi.spyOn(buildsService, "remove").mockResolvedValue(makeBuild(2));
        const { user } = renderWithProviders(<WithLocation />, {
          route: "/?buildId=build-1",
        });
        await screen.findByText(label(2));

        await openRowMenu(user, 1, "Delete");
        await confirm(user, "Delete Build");

        expect(await screen.findByText("Build #2 deleted")).toBeVisible();
        expect(screen.getByTestId("search")).toHaveTextContent(
          "?buildId=build-1",
        );
      });
    });

    describe("select all", () => {
      const TOTAL = 25;
      // the list shows a page of ten; only the select-all request takes all
      const answerSelectAll = (all: Page) =>
        getList.mockImplementation((_project, take) =>
          Promise.resolve(take === TOTAL ? all : pageOf(builds(1, 10), TOTAL)),
        );

      it("asks for every build and ticks them all", async () => {
        answerSelectAll(pageOf(builds(1, TOTAL), TOTAL));
        const { user } = renderWithProviders(<OpenProject />);
        await screen.findByText(label(1));
        getList.mockClear();

        await user.click(
          screen.getByRole("checkbox", { name: "Select all (25)" }),
        );

        await waitFor(() =>
          expect(
            screen.getByRole("checkbox", { name: "Clear selection" }),
          ).toBeChecked(),
        );
        expect(getList).toHaveBeenCalledTimes(1);
        expect(getList).toHaveBeenCalledWith(PROJECT_ID, 25, 0, "");
        expect(rowCheckboxes()).toHaveLength(10);
        expect(rowCheckboxes().every((box) => box.checked)).toBe(true);
        await user.click(screen.getByTestId("buildDeleteSelected"));
        expect(
          await screen.findByText(
            "Are you sure you want to delete 25 build(s)?",
          ),
        ).toBeVisible();
      });

      it("asks for the builds the search matched", async () => {
        answerSelectAll(pageOf(builds(1, TOTAL), TOTAL));
        const { user } = renderWithProviders(<OpenProject />);
        await screen.findByText(label(1));

        await user.type(searchInput(), "ci-{Enter}");
        await waitFor(() =>
          expect(getList).toHaveBeenLastCalledWith(
            PROJECT_ID,
            10,
            0,
            "ci-",
            undefined,
          ),
        );
        await screen.findByText(label(1));
        getList.mockClear();

        await user.click(
          screen.getByRole("checkbox", { name: "Select all (25)" }),
        );

        await waitFor(() =>
          expect(
            screen.getByRole("checkbox", { name: "Clear selection" }),
          ).toBeChecked(),
        );
        expect(getList).toHaveBeenCalledWith(PROJECT_ID, 25, 0, "ci-");
      });

      it("ignores an answer that arrives after the search changed", async () => {
        let resolveAll!: (page: Page) => void;
        getList.mockImplementation((_project, take, _skip, query) => {
          if (take === TOTAL) {
            return new Promise<Page>((resolve) => {
              resolveAll = resolve;
            });
          }
          return Promise.resolve(
            query ? pageOf(builds(1, 3), 3) : pageOf(builds(1, 10), TOTAL),
          );
        });
        const { user } = renderWithProviders(<OpenProject />);
        await screen.findByText(label(1));

        await user.click(
          screen.getByRole("checkbox", { name: "Select all (25)" }),
        );
        await waitFor(() => expect(resolveAll).toBeDefined());

        await user.type(searchInput(), "ci-{Enter}");
        await waitFor(() =>
          expect(
            screen.getByRole("checkbox", { name: "Select all (3)" }),
          ).toBeInTheDocument(),
        );
        await act(async () => resolveAll(pageOf(builds(1, TOTAL), TOTAL)));

        expect(
          screen.getByRole("checkbox", { name: "Select all (3)" }),
        ).not.toBeChecked();
        expect(rowCheckboxes().every((box) => !box.checked)).toBe(true);
        expect(
          screen.queryByRole("checkbox", { name: "Clear selection" }),
        ).toBeNull();
      });
    });

    describe("editing the CI build id", () => {
      const editCiBuildId = async (user: User, value: string) => {
        await openRowMenu(user, 0, "Edit CI Build");
        const dialog = await screen.findByRole("dialog", {
          name: "Edit CI Build ID",
        });
        await user.type(within(dialog).getByTestId("newCiBuildId"), value);
        await user.click(within(dialog).getByTestId("submitButton"));
      };

      it("shows the error as a toast when saving fails", async () => {
        getList.mockResolvedValue(pageOf([makeBuild(1)], 1));
        const update = vi
          .spyOn(buildsService, "update")
          .mockRejectedValue("CI build id is taken");
        const { user } = renderWithProviders(<OpenProject />);
        await screen.findByText(label(1));

        await editCiBuildId(user, "ci-new");

        expect(await screen.findByText("CI build id is taken")).toBeVisible();
        expect(update).toHaveBeenCalledWith("build-1", { ciBuildId: "ci-new" });
      });
    });
  });
});
