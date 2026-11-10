import { TEST_PROJECT } from "../_test/test.data.helper";
import {
  groupProjects,
  matchesProjectQuery,
  projectSections,
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

  it("lists everything by name when nothing is favourite", () => {
    expect(groupProjects(projects, [])).toEqual({
      favorites: [],
      others: [ALPHA, BETA, DELTA, GAMMA],
    });
  });

  it("puts favourites first by name, then the rest by name", () => {
    expect(groupProjects(projects, [GAMMA.id, BETA.id])).toEqual({
      favorites: [BETA, GAMMA],
      others: [ALPHA, DELTA],
    });
  });

  it("skips ids of projects that are gone", () => {
    expect(groupProjects([ALPHA], ["gone"])).toEqual({
      favorites: [],
      others: [ALPHA],
    });
  });
});

describe("projectSections", () => {
  it("titles the two groups in order", () => {
    const { sections, titled } = projectSections(
      [ALPHA, BETA, GAMMA],
      [BETA.id],
    );

    expect(sections).toEqual([
      { title: "Favourites", projects: [BETA] },
      { title: "Other projects", projects: [ALPHA, GAMMA] },
    ]);
    expect(titled).toBe(true);
  });

  it("is not titled when everything is in Other projects", () => {
    expect(projectSections([ALPHA, BETA], []).titled).toBe(false);
  });
});
