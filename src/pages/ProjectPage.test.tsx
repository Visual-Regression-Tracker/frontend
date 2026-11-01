import { Route, Routes } from "react-router-dom";
import { screen, within } from "@testing-library/react";
import { createFakeSocket, renderWithProviders } from "../_test/render";
import { run } from "../_helpers/testRun.fixture";
import { buildsService, projectsService, testRunService } from "../services";
import {
  TEST_BUILD_FAILED,
  TEST_PROJECT,
  TEST_USER,
} from "../_test/test.data.helper";
import { Build, TestRun, TestStatus } from "../types";
import { BuildStatus } from "../types/buildStatus";
import ProjectPage from "./ProjectPage";
import { CurrentSearch, currentSearch } from "../_test/location";

// the dialog's canvas needs a native module jsdom does not have
vi.mock("../components/TestDetailsDialog/DrawArea", () => ({
  DrawArea: () => null,
}));

const OTHER_PROJECT_ID = "another-project";

const build = (number: number, changes: Partial<Build> = {}): Build => ({
  ...TEST_BUILD_FAILED,
  id: `build-${number}`,
  number,
  ciBuildId: `ci-${number}`,
  ...changes,
});

const OPEN_BUILD = build(1);

const testRun = (name: string, changes: Partial<TestRun> = {}): TestRun =>
  run({
    id: name,
    name,
    buildId: OPEN_BUILD.id,
    status: TestStatus.unresolved,
    ...changes,
  });

const area = (id: string) => {
  const element = document.getElementById(id);
  if (!element) {
    throw new Error(`no #${id} on the page`);
  }
  return within(element);
};

const buildListArea = () => area("build-list");

const buildItem = (label: string) => {
  const item = buildListArea().getByText(label).closest("[role=button]");
  if (!(item instanceof HTMLElement)) {
    throw new Error(`no list item for ${label}`);
  }
  return within(item);
};

const buildLabels = () =>
  buildListArea()
    .getAllByText(/^#\d+ ci-\d+$/)
    .map((item) => item.textContent);

const testRunNames = () =>
  area("test-run-list")
    .queryAllByText(/^Screen /)
    .map((item) => item.textContent);

const testRunRow = (name: string) => {
  const row = area("test-run-list").getByText(name).closest("[role=row]");
  if (!(row instanceof HTMLElement)) {
    throw new Error(`no row for ${name}`);
  }
  return within(row);
};

const renderProjectPage = async ({
  builds = [OPEN_BUILD],
  testRuns = [testRun("Screen A"), testRun("Screen B")],
  openRun,
}: { builds?: Build[]; testRuns?: TestRun[]; openRun?: TestRun } = {}) => {
  vi.spyOn(projectsService, "getAll").mockResolvedValue([TEST_PROJECT]);
  vi.spyOn(projectsService, "getFavorites").mockResolvedValue([]);
  vi.spyOn(buildsService, "getList").mockResolvedValue({
    data: builds,
    total: builds.length,
    skip: 0,
    take: 10,
  });
  vi.spyOn(buildsService, "getDetails").mockResolvedValue(OPEN_BUILD);
  vi.spyOn(testRunService, "getList").mockResolvedValue(testRuns);
  vi.spyOn(testRunService, "getDetails").mockImplementation((id) => {
    const found = testRuns.find((item) => item.id === id);

    return found
      ? Promise.resolve(found)
      : Promise.reject(new Error(`no run ${id}`));
  });

  const socket = createFakeSocket();
  const result = renderWithProviders(
    <>
      <CurrentSearch />
      <Routes>
        <Route path="/:projectId" element={<ProjectPage />} />
      </Routes>
    </>,
    {
      user: TEST_USER,
      route: `/${TEST_PROJECT.id}?buildId=${OPEN_BUILD.id}${
        openRun ? `&testId=${openRun.id}` : ""
      }`,
      socket,
    },
  );

  await screen.findByText(`#${OPEN_BUILD.number} ${OPEN_BUILD.ciBuildId}`, {
    selector: "[role=button] *",
  });
  await area("test-run-list").findByText(testRuns[0].name);
  // the handlers close over the open build and project, so they re-register
  await vi.waitFor(() => expect(socket.listening()).toHaveLength(7));
  if (openRun) {
    await screen.findByRole("heading", { name: /^Step \d+\/\d+:/ });
  }

  return { socket, ...result };
};

describe("ProjectPage live updates", () => {
  beforeAll(() => {
    // jsdom has no Element.scrollTo, which the build list uses to go back to the top
    Element.prototype.scrollTo = () => undefined;
  });

  describe("test runs of the open build", () => {
    it("shows a changed status on the row", async () => {
      const { socket } = await renderProjectPage();
      expect(testRunRow("Screen A").getByText("unresolved")).toBeVisible();

      socket.emit("testRun_updated", [
        testRun("Screen A", { status: TestStatus.approved }),
      ]);

      expect(testRunRow("Screen A").getByText("approved")).toBeVisible();
      expect(testRunRow("Screen B").getByText("unresolved")).toBeVisible();
    });

    it("adds a row for a created test run", async () => {
      const { socket } = await renderProjectPage();

      socket.emit("testRun_created", [testRun("Screen C")]);

      expect(testRunNames()).toEqual(
        expect.arrayContaining(["Screen A", "Screen B", "Screen C"]),
      );
      expect(testRunNames()).toHaveLength(3);
    });

    it("removes the row of a deleted test run", async () => {
      const { socket } = await renderProjectPage();

      socket.emit("testRun_deleted", [testRun("Screen A")]);

      expect(testRunNames()).toEqual(["Screen B"]);
    });

    it("ignores events for another build", async () => {
      const { socket } = await renderProjectPage();
      const elsewhere = { buildId: "another-build" };

      socket.emit("testRun_updated", [
        testRun("Screen A", { ...elsewhere, status: TestStatus.approved }),
      ]);
      socket.emit("testRun_created", [testRun("Screen C", elsewhere)]);
      socket.emit("testRun_deleted", [testRun("Screen B", elsewhere)]);

      expect(testRunNames()).toEqual(
        expect.arrayContaining(["Screen A", "Screen B"]),
      );
      expect(testRunNames()).toHaveLength(2);
      expect(testRunRow("Screen A").getByText("unresolved")).toBeVisible();
    });
  });

  describe("builds of the selected project", () => {
    it("puts a created build first in the list", async () => {
      const { socket } = await renderProjectPage();

      socket.emit("build_created", build(2));

      expect(buildLabels()).toEqual(["#2 ci-2", "#1 ci-1"]);
    });

    it("ignores a created build of another project", async () => {
      const { socket } = await renderProjectPage();

      socket.emit("build_created", build(2, { projectId: OTHER_PROJECT_ID }));

      expect(buildLabels()).toEqual(["#1 ci-1"]);
    });

    it("shows a changed status on the build's chip", async () => {
      const { socket } = await renderProjectPage({
        builds: [OPEN_BUILD, build(2)],
      });
      expect(buildItem("#2 ci-2").getByText("failed")).toBeVisible();

      socket.emit("build_updated", [build(2, { status: BuildStatus.passed })]);

      expect(buildItem("#2 ci-2").getByText("passed")).toBeVisible();
      expect(buildItem("#1 ci-1").getByText("failed")).toBeVisible();
    });
  });

  describe("something deleted elsewhere while it is open", () => {
    const stepHeading = () =>
      screen.queryByRole("heading", { name: /^Step \d+\/\d+:/ });

    it("closes the dialog of a deleted test run and says so", async () => {
      const open = testRun("Screen A");
      const { socket } = await renderProjectPage({
        testRuns: [open, testRun("Screen B")],
        openRun: open,
      });
      expect(currentSearch()).toBe(
        `?buildId=${OPEN_BUILD.id}&testId=${open.id}`,
      );

      socket.emit("testRun_deleted", [open]);

      expect(
        await screen.findByText("This test run was deleted"),
      ).toBeVisible();
      await vi.waitFor(() => expect(stepHeading()).not.toBeInTheDocument());
      expect(currentSearch()).toBe(`?buildId=${OPEN_BUILD.id}`);
      expect(testRunNames()).toEqual(["Screen B"]);
    });

    it("keeps the dialog open when another test run is deleted", async () => {
      const open = testRun("Screen A");
      const { socket } = await renderProjectPage({
        testRuns: [open, testRun("Screen B")],
        openRun: open,
      });

      socket.emit("testRun_deleted", [testRun("Screen B")]);

      await vi.waitFor(() => expect(testRunNames()).toEqual(["Screen A"]));
      expect(stepHeading()).toBeInTheDocument();
      expect(screen.queryByText("This test run was deleted")).toBeNull();
      expect(currentSearch()).toBe(
        `?buildId=${OPEN_BUILD.id}&testId=${open.id}`,
      );
    });

    it("deselects a deleted build and says so", async () => {
      const { socket } = await renderProjectPage({
        builds: [OPEN_BUILD, build(2)],
      });
      expect(currentSearch()).toBe(`?buildId=${OPEN_BUILD.id}`);

      socket.emit("build_deleted", OPEN_BUILD);

      expect(await screen.findByText("This build was deleted")).toBeVisible();
      expect(currentSearch()).toBe("");
      expect(buildLabels()).toEqual(["#2 ci-2"]);
    });

    it("keeps the build when another build is deleted", async () => {
      const { socket } = await renderProjectPage({
        builds: [OPEN_BUILD, build(2)],
      });

      socket.emit("build_deleted", build(2));

      await vi.waitFor(() => expect(buildLabels()).toEqual(["#1 ci-1"]));
      expect(screen.queryByText("This build was deleted")).toBeNull();
      expect(currentSearch()).toBe(`?buildId=${OPEN_BUILD.id}`);
    });
  });
});

describe("ProjectPage build count", () => {
  beforeAll(() => {
    Element.prototype.scrollTo = () => undefined;
  });

  it("counts a created build in the total", async () => {
    const { socket } = await renderProjectPage();
    expect(
      buildListArea().getByRole("checkbox", { name: "Select all (1)" }),
    ).toBeInTheDocument();

    socket.emit("build_created", build(2));

    expect(
      buildListArea().getByRole("checkbox", { name: "Select all (2)" }),
    ).toBeInTheDocument();
  });
});

describe("ProjectPage deleting the open build", () => {
  beforeAll(() => {
    Element.prototype.scrollTo = () => undefined;
  });

  it("says the build was deleted once when this client deleted it", async () => {
    const { socket, user } = await renderProjectPage({
      builds: [OPEN_BUILD, build(2)],
    });
    // the server's event can arrive before this client's answer does
    const answer: { deleted?: (value: Build) => void } = {};
    vi.spyOn(buildsService, "remove").mockReturnValue(
      new Promise<Build>((resolve) => {
        answer.deleted = resolve;
      }),
    );

    await user.click(buildListArea().getAllByTestId("MoreVertIcon")[0]);
    await user.click(await screen.findByRole("menuitem", { name: "Delete" }));
    const dialog = await screen.findByRole("dialog", { name: "Delete Build" });
    await user.click(within(dialog).getByTestId("submitButton"));

    socket.emit("build_deleted", OPEN_BUILD);
    answer.deleted?.(OPEN_BUILD);

    expect(await screen.findByText("Build #1 deleted")).toBeVisible();
    expect(screen.queryByText("This build was deleted")).toBeNull();
  });
});
