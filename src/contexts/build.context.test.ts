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
        },
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

  it("delete counts a listed build out of the total once", () => {
    const listed = {
      ...initial,
      buildList: [build("b1"), build("b2")],
      total: 12,
    };

    const once = buildReducer(listed, { type: "delete", payload: "b1" });
    const twice = buildReducer(once, { type: "delete", payload: "b1" });

    expect(once.total).toBe(11);
    expect(twice).toBe(once);
  });

  it("delete of a build the list does not hold changes nothing", () => {
    const listed = { ...initial, buildList: [build("b1")], total: 12 };

    expect(buildReducer(listed, { type: "delete", payload: "b9" })).toBe(
      listed,
    );
  });

  it("delete keeps the selected build as it is", () => {
    const state = buildReducer(
      { ...initial, buildList: [build("b1")], selectedBuild: build("b1") },
      { type: "delete", payload: "b1" },
    );

    expect(state.selectedBuild).toEqual(build("b1"));
  });

  describe("add", () => {
    const listOf = (n: number) =>
      Array.from({ length: n }, (_, i) => build(`b${i + 1}`));

    it("puts the new build first on the first page and drops the last one", () => {
      const state = buildReducer(
        { ...initial, buildList: listOf(10), total: 10, take: 10, skip: 0 },
        { type: "add", payload: build("new") },
      );

      expect(state.buildList).toHaveLength(10);
      expect(state.buildList[0].id).toBe("new");
      expect(state.buildList[9].id).toBe("b9");
      expect(state.total).toBe(11);
    });

    it("keeps every build while the first page is not full", () => {
      const state = buildReducer(
        { ...initial, buildList: [build("b1")], total: 1 },
        { type: "add", payload: build("b2") },
      );

      expect(state.buildList.map((b) => b.id)).toEqual(["b2", "b1"]);
      expect(state.total).toBe(2);
    });

    it("leaves the list alone on a later page but counts the build", () => {
      const list = listOf(10);
      const state = buildReducer(
        { ...initial, buildList: list, total: 20, take: 10, skip: 10 },
        { type: "add", payload: build("new") },
      );

      expect(state.buildList).toEqual(list);
      expect(state.total).toBe(21);
    });

    it("leaves the list alone while a search is active but counts the build", () => {
      const list = listOf(3);
      const state = buildReducer(
        { ...initial, buildList: list, total: 3, search: "ci-1" },
        { type: "add", payload: build("new") },
      );

      expect(state.buildList).toEqual(list);
      expect(state.total).toBe(4);
    });
  });

  it("add changes nothing when the build is already listed", () => {
    const before = { ...initial, buildList: [build("b1")], total: 1 };

    const state = buildReducer(before, { type: "add", payload: build("b1") });

    expect(state).toBe(before);
  });

  it("get keeps the search the page was fetched with", () => {
    const state = buildReducer(
      { ...initial, search: "old" },
      {
        type: "get",
        payload: { data: [], take: 10, skip: 0, total: 0 },
        search: "ci-1",
      },
    );

    expect(state.search).toBe("ci-1");
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

    it("returns the same state when no updated build is listed or selected", () => {
      const state = {
        ...initial,
        buildList: [build("b1")],
        selectedBuild: build("b1"),
      };

      expect(
        buildReducer(state, {
          type: "update",
          payload: [build("b9")],
        }),
      ).toBe(state);
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

    it("clears the selection when the build cannot be loaded", async () => {
      const dispatch = vi.fn();
      vi.spyOn(buildsService, "getDetails").mockRejectedValue("Not found");

      await selectBuild(dispatch, "b1");

      expect(dispatch).toHaveBeenCalledTimes(1);
      expect(dispatch).toHaveBeenCalledWith({ type: "select" });
    });

    it("drops the answer once it is no longer current", async () => {
      const dispatch = vi.fn();
      vi.spyOn(buildsService, "getDetails").mockResolvedValue(build("b1"));

      await selectBuild(dispatch, "b1", () => false);

      expect(dispatch).not.toHaveBeenCalled();
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
