import React from "react";
import { screen, waitFor } from "@testing-library/react";
import { useLocation } from "react-router-dom";
import { renderWithProviders } from "../../_test/render";
import { SeedTestRuns } from "../../_test/SeedTestRuns";
import { buildsService, testRunService } from "../../services";
import { TestRun } from "../../types";
import {
  TEST_BUILD_UNRESOLVED,
  TEST_USER,
  testRunMock,
} from "../../_test/test.data.helper";
import { TestDetailsDialog } from ".";

// Konva needs the native canvas package under Node, which jsdom has not got;
// navigation is all this is about, so the images are left out
vi.mock("./DrawArea", () => ({ DrawArea: () => null }));

// the dialog imports from "react-router", the render helper's router comes from
// "react-router-dom"; under Vitest those load as two copies of the library, so
// hand the dialog the copy the router belongs to
vi.mock("react-router", async () => import("react-router-dom"));

const run = (id: string): TestRun => ({
  ...testRunMock,
  id,
  name: `run ${id}`,
  buildId: TEST_BUILD_UNRESOLVED.id,
});

const FIRST = run("first");
const SECOND = run("second");
const LAST = run("last");
const RUNS = [FIRST, SECOND, LAST];

// the dialog navigates by changing the query string, so it is shown to assert on
const CurrentSearch: React.FunctionComponent = () => (
  <div data-testid="search">{useLocation().search}</div>
);

const searchOf = (testId: string) =>
  `?buildId=${TEST_BUILD_UNRESOLVED.id}&testId=${testId}`;

const renderDialog = async ({
  openRun,
  testRuns = RUNS,
}: {
  openRun: TestRun;
  testRuns?: TestRun[];
}) => {
  vi.spyOn(buildsService, "getDetails").mockResolvedValue(
    TEST_BUILD_UNRESOLVED,
  );
  vi.spyOn(testRunService, "getDetails").mockImplementation(async (id) => {
    const found = [...testRuns, openRun].find((item) => item.id === id);
    if (!found) {
      throw new Error(`no run ${id}`);
    }
    return found;
  });

  const result = renderWithProviders(
    <>
      <SeedTestRuns testRuns={testRuns} />
      <CurrentSearch />
      <TestDetailsDialog />
    </>,
    { route: `/${searchOf(openRun.id)}`, user: TEST_USER },
  );
  expect(await screen.findByText(openRun.name)).toBeVisible();
  // the build is what navigation builds its links from
  await waitFor(() =>
    expect(buildsService.getDetails).toHaveBeenCalledWith(
      TEST_BUILD_UNRESOLVED.id,
    ),
  );
  return result;
};

const currentSearch = () => screen.getByTestId("search").textContent;

describe("TestDetailsDialog", () => {
  describe("arrow keys", () => {
    it("go to the next run with the right arrow", async () => {
      const { user } = await renderDialog({ openRun: FIRST });

      await user.keyboard("{ArrowRight}");

      await waitFor(() => expect(currentSearch()).toBe(searchOf(SECOND.id)));
      expect(await screen.findByText(SECOND.name)).toBeVisible();
    });

    it("go to the previous run with the left arrow", async () => {
      const { user } = await renderDialog({ openRun: SECOND });

      await user.keyboard("{ArrowLeft}");

      await waitFor(() => expect(currentSearch()).toBe(searchOf(FIRST.id)));
    });

    it("stay on the first run instead of jumping to the last with the left arrow", async () => {
      const { user } = await renderDialog({ openRun: FIRST });

      await user.keyboard("{ArrowLeft}");

      expect(currentSearch()).toBe(searchOf(FIRST.id));
      expect(testRunService.getDetails).not.toHaveBeenCalledWith(LAST.id);
      expect(screen.getByText(FIRST.name)).toBeVisible();
    });

    it("stay on the last run with the right arrow", async () => {
      const { user } = await renderDialog({ openRun: LAST });

      await user.keyboard("{ArrowRight}");

      expect(currentSearch()).toBe(searchOf(LAST.id));
    });

    it("do not move when the open run is not in the list", async () => {
      const elsewhere = run("filtered out");
      const { user } = await renderDialog({ openRun: elsewhere });

      await user.keyboard("{ArrowLeft}");
      await user.keyboard("{ArrowRight}");

      expect(currentSearch()).toBe(searchOf(elsewhere.id));
      expect(testRunService.getDetails).toHaveBeenCalledTimes(1);
    });
  });
});
