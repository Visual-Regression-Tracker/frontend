import {
  addBuild,
  buildReducer,
  deleteBuild,
  selectBuild,
  updateBuild,
} from "./build.context";
import { buildsService } from "../services";
import { Build } from "../types";

type State = Parameters<typeof buildReducer>[0];

const build = (id: string, overrides: Partial<Build> = {}) =>
  ({ id, ciBuildId: `ci-${id}`, ...overrides }) as Build;

const initial: State = {
  buildList: [],
  take: 10,
  skip: 0,
  total: 0,
  loading: false,
};

describe("buildReducer", () => {
  it("select keeps the chosen build", () => {
    const state = buildReducer(initial, {
      type: "select",
      payload: build("b1"),
    });

    expect(state.selectedBuild).toEqual(build("b1"));
  });

  it("select without a build clears the selection", () => {
    const state = buildReducer(
      { ...initial, selectedBuild: build("b1") },
      { type: "select" },
    );

    expect(state.selectedBuild).toBeUndefined();
  });

  it("request starts loading, forgets the error and keeps the list", () => {
    const state = buildReducer(
      { ...initial, buildList: [build("b1")], total: 1, error: "boom" },
      { type: "request" },
    );

    expect(state).toMatchObject({
      loading: true,
      error: undefined,
      buildList: [build("b1")],
      total: 1,
    });
  });

  it("reset empties the list, starts loading and forgets the error", () => {
    const state = buildReducer(
      { ...initial, buildList: [build("b1")], total: 1, error: "boom" },
      { type: "reset" },
    );

    expect(state).toMatchObject({
      buildList: [],
      total: 0,
      loading: true,
      error: undefined,
    });
  });

  it("failure stops loading and keeps the reason", () => {
    const state = buildReducer(
      { ...initial, loading: true, buildList: [build("b1")] },
      { type: "failure", payload: "boom" },
    );

    expect(state).toMatchObject({
      loading: false,
      error: "boom",
      buildList: [build("b1")],
    });
  });

  it("get stores the page with its paging and stops loading", () => {
    const state = buildReducer(
      { ...initial, loading: true },
      {
        type: "get",
        payload: {
          data: [build("b1"), build("b2")],
          take: 25,
          skip: 50,
          total: 120,
        } as never,
      },
    );

    expect(state).toMatchObject({
      buildList: [build("b1"), build("b2")],
      take: 25,
      skip: 50,
      total: 120,
      loading: false,
    });
  });

  it("delete drops the build with that id", () => {
    const state = buildReducer(
      { ...initial, buildList: [build("b1"), build("b2")] },
      { type: "delete", payload: "b1" },
    );

    expect(state.buildList).toEqual([build("b2")]);
  });

  // NOTE: the selected build stays selected even after it is deleted from the list
  it("delete keeps the selected build as it is", () => {
    const state = buildReducer(
      { ...initial, buildList: [build("b1")], selectedBuild: build("b1") },
      { type: "delete", payload: "b1" },
    );

    expect(state.selectedBuild).toEqual(build("b1"));
  });

  it("add puts the new build first", () => {
    const state = buildReducer(
      { ...initial, buildList: [build("b1")] },
      { type: "add", payload: build("b2") },
    );

    expect(state.buildList.map((b) => b.id)).toEqual(["b2", "b1"]);
  });

  // NOTE: add does not de-duplicate, unlike the test run reducer
  it("add lists a build twice when it is already there", () => {
    const state = buildReducer(
      { ...initial, buildList: [build("b1")] },
      { type: "add", payload: build("b1") },
    );

    expect(state.buildList.map((b) => b.id)).toEqual(["b1", "b1"]);
  });

  describe("update", () => {
    it("replaces the listed builds that come back updated", () => {
      const state = buildReducer(
        { ...initial, buildList: [build("b1"), build("b2")] },
        { type: "update", payload: [build("b2", { branchName: "new" })] },
      );

      expect(state.buildList).toEqual([
        build("b1"),
        build("b2", { branchName: "new" }),
      ]);
    });

    it("ignores updated builds that are not listed", () => {
      const state = buildReducer(
        { ...initial, buildList: [build("b1")] },
        { type: "update", payload: [build("b9")] },
      );

      expect(state.buildList).toEqual([build("b1")]);
    });

    it("refreshes the selected build when it is among the updated", () => {
      const state = buildReducer(
        { ...initial, selectedBuild: build("b1") },
        { type: "update", payload: [build("b1", { branchName: "new" })] },
      );

      expect(state.selectedBuild).toEqual(build("b1", { branchName: "new" }));
    });

    it("keeps the selected build when it is not among the updated", () => {
      const state = buildReducer(
        { ...initial, selectedBuild: build("b1") },
        { type: "update", payload: [build("b2")] },
      );

      expect(state.selectedBuild).toEqual(build("b1"));
    });

    it("leaves the selection empty when nothing was selected", () => {
      const state = buildReducer(initial, {
        type: "update",
        payload: [build("b1")],
      });

      expect(state.selectedBuild).toBeUndefined();
    });
  });

  it("does not change the state for an unknown action", () => {
    const state = buildReducer(initial, { type: "nope" } as never);

    expect(state).toBe(initial);
  });

  it("does not change the state it was given", () => {
    const frozen = Object.freeze({
      ...initial,
      buildList: Object.freeze([build("b1")]) as Build[],
    });

    expect(() =>
      buildReducer(frozen, { type: "add", payload: build("b2") }),
    ).not.toThrow();
  });
});

describe("build action creators", () => {
  describe("deleteBuild", () => {
    it("removes the build through the service, then dispatches delete and answers the build", async () => {
      const dispatch = vi.fn();
      const remove = vi
        .spyOn(buildsService, "remove")
        .mockResolvedValue(build("b1"));

      const result = await deleteBuild(dispatch, "b1");

      expect(remove).toHaveBeenCalledWith("b1");
      expect(dispatch).toHaveBeenCalledWith({ type: "delete", payload: "b1" });
      expect(result).toEqual(build("b1"));
    });

    it("does not dispatch when the service fails", async () => {
      const dispatch = vi.fn();
      vi.spyOn(buildsService, "remove").mockRejectedValue("boom");

      await expect(deleteBuild(dispatch, "b1")).rejects.toBe("boom");

      expect(dispatch).not.toHaveBeenCalled();
    });
  });

  describe("selectBuild", () => {
    it("clears the selection without calling the service when there is no id", () => {
      const dispatch = vi.fn();
      const getDetails = vi.spyOn(buildsService, "getDetails");

      expect(selectBuild(dispatch)).toBeUndefined();

      expect(dispatch).toHaveBeenCalledWith({ type: "select" });
      expect(getDetails).not.toHaveBeenCalled();
    });

    it("loads the build and selects it", async () => {
      const dispatch = vi.fn();
      const getDetails = vi
        .spyOn(buildsService, "getDetails")
        .mockResolvedValue(build("b1"));

      await selectBuild(dispatch, "b1");

      expect(getDetails).toHaveBeenCalledWith("b1");
      expect(dispatch).toHaveBeenCalledWith({
        type: "select",
        payload: build("b1"),
      });
    });
  });

  it("addBuild dispatches add with the build", () => {
    const dispatch = vi.fn();

    addBuild(dispatch, build("b1"));

    expect(dispatch).toHaveBeenCalledWith({
      type: "add",
      payload: build("b1"),
    });
  });

  it("updateBuild dispatches update with the builds", () => {
    const dispatch = vi.fn();

    updateBuild(dispatch, [build("b1")]);

    expect(dispatch).toHaveBeenCalledWith({
      type: "update",
      payload: [build("b1")],
    });
  });
});
