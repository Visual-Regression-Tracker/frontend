import React, { useEffect } from "react";
import { act, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
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

// BuildList imports from "react-router", the render helper's router comes from
// "react-router-dom"; under Vitest those load as two copies of the library, so
// hand BuildList the copy the router belongs to
vi.mock("react-router", async () => import("react-router-dom"));

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

    // the list loads on its own when the project is selected; searching is
    // what comes after
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

    // NOTE: unlike the name filters (Filters, TestRunFilters), this search sets
    // no minLength, so a single character is searched for. Pinned as it is.
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

      // nothing is left over to search for when the pause is over
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
});
