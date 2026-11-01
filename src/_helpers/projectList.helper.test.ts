import { TEST_PROJECT } from "../_test/test.data.helper";
import {
  RECENT_PROJECTS_LIMIT,
  groupProjects,
  matchesProjectQuery,
  readRecentProjectIds,
  rememberRecentProject,
} from "./projectList.helper";

const project = (id: string, name: string, mainBranchName = "master") => ({
  ...TEST_PROJECT,
  id,
  name,
  mainBranchName,
});

const ALPHA = project("a-id", "Alpha");
const BETA = project("b-id", "Beta", "main");
const GAMMA = project("c-id", "Gamma");
const DELTA = project("d-id", "Delta");

describe("matchesProjectQuery", () => {
  it("matches every project when nothing is typed", () => {
    expect(matchesProjectQuery(ALPHA, "  ")).toBe(true);
  });

  it("matches the name in any case", () => {
    expect(matchesProjectQuery(ALPHA, "lph")).toBe(true);
    expect(matchesProjectQuery(ALPHA, "ALP")).toBe(true);
    expect(matchesProjectQuery(ALPHA, "beta")).toBe(false);
  });

  it("matches the id and the main branch too", () => {
    expect(matchesProjectQuery(ALPHA, "a-id")).toBe(true);
    expect(matchesProjectQuery(BETA, "main")).toBe(true);
  });
});

describe("groupProjects", () => {
  const projects = [GAMMA, DELTA, BETA, ALPHA];

  it("lists everything by name when nothing is favourite or recent", () => {
    expect(groupProjects(projects, [], [])).toEqual({
      favorites: [],
      recent: [],
      others: [ALPHA, BETA, DELTA, GAMMA],
    });
  });

  it("puts favourites first by name, then recent ones as opened, then the rest", () => {
    const groups = groupProjects(
      projects,
      [GAMMA.id, BETA.id],
      [DELTA.id, BETA.id],
    );

    expect(groups.favorites).toEqual([BETA, GAMMA]);
    expect(groups.recent).toEqual([DELTA]);
    expect(groups.others).toEqual([ALPHA]);
  });

  it("skips ids of projects that are gone", () => {
    expect(groupProjects([ALPHA], ["gone"], ["gone-too"])).toEqual({
      favorites: [],
      recent: [],
      others: [ALPHA],
    });
  });
});

describe("recent projects", () => {
  afterEach(() => localStorage.clear());

  it("has none for a user who opened nothing", () => {
    expect(readRecentProjectIds("user-1")).toEqual([]);
  });

  it("keeps the last opened first, once, per user", () => {
    rememberRecentProject("user-1", "a");
    rememberRecentProject("user-1", "b");
    const ids = rememberRecentProject("user-1", "a");

    expect(ids).toEqual(["a", "b"]);
    expect(readRecentProjectIds("user-1")).toEqual(["a", "b"]);
    expect(readRecentProjectIds("user-2")).toEqual([]);
  });

  it(`keeps only the last ${RECENT_PROJECTS_LIMIT}`, () => {
    ["1", "2", "3", "4", "5", "6"].forEach((id) =>
      rememberRecentProject("user-1", id),
    );

    expect(readRecentProjectIds("user-1")).toEqual(["6", "5", "4", "3", "2"]);
  });

  it("reads nothing from a value it did not write", () => {
    localStorage.setItem("recentProjects:user-1", "not json");

    expect(readRecentProjectIds("user-1")).toEqual([]);
  });

  it("still answers when storage cannot be written", () => {
    const setItem = vi
      .spyOn(Storage.prototype, "setItem")
      .mockImplementation(() => {
        throw new Error("QuotaExceededError");
      });

    expect(rememberRecentProject("user-1", "a")).toEqual(["a"]);
    setItem.mockRestore();
  });
});
