import {
  createProject,
  deleteProject,
  getProjectList,
  projectReducer,
  selectProject,
  setProjectEditState,
  updateProject,
} from "./project.context";
import { projectsService } from "../services";
import { DEFAULT_PROJECT_EDIT_STATE } from "../constants";
import { Project, ProjectDto } from "../types";

type State = Parameters<typeof projectReducer>[0];

const project = (id: string, overrides: Partial<Project> = {}) =>
  ({ id, name: `Project ${id}`, ...overrides }) as Project;

const initial: State = {
  selectedProjectId: null,
  projectList: [],
  projectEditState: DEFAULT_PROJECT_EDIT_STATE,
};

describe("projectReducer", () => {
  it("get replaces the project list", () => {
    const state = projectReducer(
      { ...initial, projectList: [project("p1")] },
      { type: "get", payload: [project("p2"), project("p3")] },
    );

    expect(state.projectList).toEqual([project("p2"), project("p3")]);
  });

  it("select keeps the chosen project id", () => {
    const state = projectReducer(initial, { type: "select", payload: "p1" });

    expect(state.selectedProjectId).toBe("p1");
  });

  it("create puts the new project first", () => {
    const state = projectReducer(
      { ...initial, projectList: [project("p1")] },
      { type: "create", payload: project("p2") },
    );

    expect(state.projectList.map((p) => p.id)).toEqual(["p2", "p1"]);
  });

  it("update replaces the project with the same id", () => {
    const state = projectReducer(
      { ...initial, projectList: [project("p1"), project("p2")] },
      { type: "update", payload: project("p2", { name: "Renamed" }) },
    );

    expect(state.projectList).toEqual([
      project("p1"),
      project("p2", { name: "Renamed" }),
    ]);
  });

  it("update ignores a project that is not listed", () => {
    const state = projectReducer(
      { ...initial, projectList: [project("p1")] },
      { type: "update", payload: project("p9") },
    );

    expect(state.projectList).toEqual([project("p1")]);
  });

  it("delete drops the project with that id", () => {
    const state = projectReducer(
      { ...initial, projectList: [project("p1"), project("p2")] },
      { type: "delete", payload: "p1" },
    );

    expect(state.projectList).toEqual([project("p2")]);
  });

  // NOTE: the selected project id stays set after that project is deleted
  it("delete keeps the selected project id as it is", () => {
    const state = projectReducer(
      { ...initial, selectedProjectId: "p1", projectList: [project("p1")] },
      { type: "delete", payload: "p1" },
    );

    expect(state.selectedProjectId).toBe("p1");
  });

  it("setProjectEditState stores the project being edited", () => {
    const editing: ProjectDto = {
      ...DEFAULT_PROJECT_EDIT_STATE,
      id: "p1",
      name: "Edited",
    };

    const state = projectReducer(initial, {
      type: "setProjectEditState",
      payload: editing,
    });

    expect(state.projectEditState).toEqual(editing);
  });

  it("request does not change the state", () => {
    expect(projectReducer(initial, { type: "request" })).toBe(initial);
  });

  it("does not change the state for an unknown action", () => {
    expect(projectReducer(initial, { type: "nope" } as never)).toBe(initial);
  });
});

describe("project action creators", () => {
  describe("getProjectList", () => {
    it("dispatches request, then get with the projects, and answers them", async () => {
      const dispatch = vi.fn();
      vi.spyOn(projectsService, "getAll").mockResolvedValue([project("p1")]);

      const promise = getProjectList(dispatch);

      expect(dispatch).toHaveBeenCalledTimes(1);
      expect(dispatch).toHaveBeenLastCalledWith({ type: "request" });
      await expect(promise).resolves.toEqual([project("p1")]);
      expect(dispatch).toHaveBeenLastCalledWith({
        type: "get",
        payload: [project("p1")],
      });
    });

    it("dispatches only request when the service fails", async () => {
      const dispatch = vi.fn();
      vi.spyOn(projectsService, "getAll").mockRejectedValue("boom");

      await expect(getProjectList(dispatch)).rejects.toBe("boom");

      expect(dispatch.mock.calls).toEqual([[{ type: "request" }]]);
    });
  });

  it("selectProject dispatches select with the id", () => {
    const dispatch = vi.fn();

    selectProject(dispatch, "p1");

    expect(dispatch).toHaveBeenCalledWith({ type: "select", payload: "p1" });
  });

  it("createProject creates through the service, then dispatches create", async () => {
    const dispatch = vi.fn();
    const create = vi
      .spyOn(projectsService, "create")
      .mockResolvedValue(project("p1"));

    const result = await createProject(dispatch, DEFAULT_PROJECT_EDIT_STATE);

    expect(create).toHaveBeenCalledWith(DEFAULT_PROJECT_EDIT_STATE);
    expect(result).toEqual(project("p1"));
    expect(dispatch.mock.calls).toEqual([
      [{ type: "request" }],
      [{ type: "create", payload: project("p1") }],
    ]);
  });

  it("updateProject updates through the service, then dispatches update", async () => {
    const dispatch = vi.fn();
    const update = vi
      .spyOn(projectsService, "update")
      .mockResolvedValue(project("p1", { name: "Renamed" }));

    const result = await updateProject(dispatch, DEFAULT_PROJECT_EDIT_STATE);

    expect(update).toHaveBeenCalledWith(DEFAULT_PROJECT_EDIT_STATE);
    expect(result).toEqual(project("p1", { name: "Renamed" }));
    expect(dispatch.mock.calls).toEqual([
      [{ type: "request" }],
      [{ type: "update", payload: project("p1", { name: "Renamed" }) }],
    ]);
  });

  it("deleteProject deletes through the service, then dispatches delete with the id", async () => {
    const dispatch = vi.fn();
    const remove = vi
      .spyOn(projectsService, "remove")
      .mockResolvedValue(project("p1"));

    const result = await deleteProject(dispatch, "p1");

    expect(remove).toHaveBeenCalledWith("p1");
    expect(result).toEqual(project("p1"));
    expect(dispatch.mock.calls).toEqual([
      [{ type: "request" }],
      [{ type: "delete", payload: "p1" }],
    ]);
  });

  it.each([
    ["create", createProject, "create"],
    ["update", updateProject, "update"],
  ] as const)(
    "%sProject dispatches only request when the service fails",
    async (_name, action, method) => {
      const dispatch = vi.fn();
      vi.spyOn(projectsService, method).mockRejectedValue("boom");

      await expect(action(dispatch, DEFAULT_PROJECT_EDIT_STATE)).rejects.toBe(
        "boom",
      );

      expect(dispatch.mock.calls).toEqual([[{ type: "request" }]]);
    },
  );

  describe("setProjectEditState", () => {
    it("dispatches the project given", () => {
      const dispatch = vi.fn();
      const editing: ProjectDto = { ...DEFAULT_PROJECT_EDIT_STATE, id: "p1" };

      setProjectEditState(dispatch, editing);

      expect(dispatch).toHaveBeenCalledWith({
        type: "setProjectEditState",
        payload: editing,
      });
    });

    it("dispatches the default edit state when given no project", () => {
      const dispatch = vi.fn();

      setProjectEditState(dispatch);

      expect(dispatch).toHaveBeenCalledWith({
        type: "setProjectEditState",
        payload: DEFAULT_PROJECT_EDIT_STATE,
      });
    });
  });
});
