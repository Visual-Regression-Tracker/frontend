import {
  addTestRun,
  deleteTestRun,
  testRunReducer,
  updateTestRun,
} from "./testRun.context";
import { run } from "../_helpers/testRun.fixture";

type State = Parameters<typeof testRunReducer>[0];

const initial: State = { touched: false, testRuns: [], loading: false };
const withRuns = (...ids: string[]): State => ({
  ...initial,
  testRuns: ids.map((id) => run({ id })),
});
const ids = (state: State) => state.testRuns.map((t) => t.id);

describe("testRunReducer", () => {
  describe("select", () => {
    it("keeps the chosen test run and resets touched", () => {
      const state = testRunReducer(
        { ...initial, touched: true },
        { type: "select", payload: run({ id: "t1" }) },
      );

      expect(state.selectedTestRun).toEqual(run({ id: "t1" }));
      expect(state.touched).toBe(false);
    });

    it("clears the selection when given no test run", () => {
      const state = testRunReducer(
        { ...initial, selectedTestRun: run({ id: "t1" }) },
        { type: "select" },
      );

      expect(state.selectedTestRun).toBeUndefined();
    });
  });

  describe("filterSort", () => {
    it("stores the new order", () => {
      const state = testRunReducer(initial, {
        type: "filterSort",
        payload: ["t2", "t1"],
      });

      expect(state.filteredSortedTestRunIds).toEqual(["t2", "t1"]);
    });

    it("keeps the very same state when the order is the same", () => {
      const before: State = { ...initial, filteredSortedTestRunIds: ["a", 2] };

      const state = testRunReducer(before, {
        type: "filterSort",
        payload: ["a", 2],
      });

      expect(state).toBe(before);
    });

    it("keeps the very same state when there was no order and still is none", () => {
      const state = testRunReducer(initial, { type: "filterSort" });

      expect(state).toBe(initial);
    });

    it.each([
      ["a different order", ["a", "b"], ["b", "a"]],
      ["a different length", ["a", "b"], ["a"]],
      ["no order any more", ["a"], undefined],
    ])("replaces the order for %s", (_name, previous, next) => {
      const state = testRunReducer(
        { ...initial, filteredSortedTestRunIds: previous },
        { type: "filterSort", payload: next },
      );

      expect(state.filteredSortedTestRunIds).toEqual(next);
    });

    it("stores an order when there was none", () => {
      const state = testRunReducer(initial, {
        type: "filterSort",
        payload: [],
      });

      expect(state.filteredSortedTestRunIds).toEqual([]);
    });
  });

  it("request empties the test runs and starts loading", () => {
    const state = testRunReducer(withRuns("t1"), { type: "request" });

    expect(state.testRuns).toEqual([]);
    expect(state.loading).toBe(true);
  });

  it("get stores the test runs and stops loading", () => {
    const state = testRunReducer(
      { ...initial, loading: true },
      { type: "get", payload: [run({ id: "t1" })] },
    );

    expect(ids(state)).toEqual(["t1"]);
    expect(state.loading).toBe(false);
  });

  it("failure stops loading and keeps the test runs", () => {
    const state = testRunReducer(
      { ...withRuns("t1"), loading: true },
      { type: "failure" },
    );

    expect(state.loading).toBe(false);
    expect(ids(state)).toEqual(["t1"]);
  });

  describe("delete", () => {
    it("drops the test runs with the given ids", () => {
      const state = testRunReducer(withRuns("t1", "t2", "t3"), {
        type: "delete",
        payload: ["t1", "t3"],
      });

      expect(ids(state)).toEqual(["t2"]);
    });

    it("ignores ids that are not listed", () => {
      const state = testRunReducer(withRuns("t1"), {
        type: "delete",
        payload: ["t9"],
      });

      expect(ids(state)).toEqual(["t1"]);
    });

    // NOTE: the selected test run stays selected after it is deleted from the list
    it("keeps the selected test run as it is", () => {
      const state = testRunReducer(
        { ...withRuns("t1"), selectedTestRun: run({ id: "t1" }) },
        { type: "delete", payload: ["t1"] },
      );

      expect(state.selectedTestRun).toEqual(run({ id: "t1" }));
    });
  });

  describe("add", () => {
    it("appends the new test runs after the existing ones", () => {
      const state = testRunReducer(withRuns("t1"), {
        type: "add",
        payload: [run({ id: "t2" }), run({ id: "t3" })],
      });

      expect(ids(state)).toEqual(["t1", "t2", "t3"]);
    });

    it("skips the test runs that are already listed", () => {
      const state = testRunReducer(withRuns("t1"), {
        type: "add",
        payload: [run({ id: "t1" }), run({ id: "t2" })],
      });

      expect(ids(state)).toEqual(["t1", "t2"]);
    });

    it("keeps the very same state when there is nothing new", () => {
      const before = withRuns("t1");

      const state = testRunReducer(before, {
        type: "add",
        payload: [run({ id: "t1" })],
      });

      expect(state).toBe(before);
    });

    it("keeps the very same state when adding nothing", () => {
      const before = withRuns("t1");

      expect(testRunReducer(before, { type: "add", payload: [] })).toBe(before);
    });
  });

  describe("update", () => {
    it("replaces the listed test runs that come back updated", () => {
      const state = testRunReducer(withRuns("t1", "t2"), {
        type: "update",
        payload: [run({ id: "t2", comment: "new" })],
      });

      expect(state.testRuns).toEqual([
        run({ id: "t1" }),
        run({ id: "t2", comment: "new" }),
      ]);
    });

    it("refreshes the selected test run when it is among the updated", () => {
      const state = testRunReducer(
        { ...withRuns("t1"), selectedTestRun: run({ id: "t1" }) },
        { type: "update", payload: [run({ id: "t1", comment: "new" })] },
      );

      expect(state.selectedTestRun).toEqual(run({ id: "t1", comment: "new" }));
    });

    it("refreshes the selected test run even when it is not in the list", () => {
      const state = testRunReducer(
        { ...withRuns("t1"), selectedTestRun: run({ id: "t9" }) },
        { type: "update", payload: [run({ id: "t9", comment: "new" })] },
      );

      expect(state.selectedTestRun).toEqual(run({ id: "t9", comment: "new" }));
      expect(ids(state)).toEqual(["t1"]);
    });

    it("keeps the selected test run when it is not among the updated", () => {
      const state = testRunReducer(
        { ...withRuns("t1", "t2"), selectedTestRun: run({ id: "t1" }) },
        { type: "update", payload: [run({ id: "t2", comment: "new" })] },
      );

      expect(state.selectedTestRun).toEqual(run({ id: "t1" }));
    });

    it("keeps the very same state when nothing matches", () => {
      const before = {
        ...withRuns("t1"),
        selectedTestRun: run({ id: "t1" }),
      };

      const state = testRunReducer(before, {
        type: "update",
        payload: [run({ id: "t9" })],
      });

      expect(state).toBe(before);
    });
  });

  it("touched stores the flag", () => {
    expect(
      testRunReducer(initial, { type: "touched", payload: true }).touched,
    ).toBe(true);
    expect(
      testRunReducer(
        { ...initial, touched: true },
        { type: "touched", payload: false },
      ).touched,
    ).toBe(false);
  });

  // NOTE: "approve" and "reject" are declared actions but the reducer ignores them
  it.each(["approve", "reject"] as const)(
    "does not change the state for %s",
    (type) => {
      const before = withRuns("t1");

      const state = testRunReducer(before, {
        type,
        payload: run({ id: "t1" }),
      });

      expect(state).toBe(before);
    },
  );

  it("does not change the state for an unknown action", () => {
    expect(testRunReducer(initial, { type: "nope" } as never)).toBe(initial);
  });
});

describe("test run action creators", () => {
  it("deleteTestRun dispatches delete with the ids", () => {
    const dispatch = vi.fn();

    deleteTestRun(dispatch, ["t1", "t2"]);

    expect(dispatch).toHaveBeenCalledWith({
      type: "delete",
      payload: ["t1", "t2"],
    });
  });

  it("addTestRun dispatches add with the test runs", () => {
    const dispatch = vi.fn();

    addTestRun(dispatch, [run({ id: "t1" })]);

    expect(dispatch).toHaveBeenCalledWith({
      type: "add",
      payload: [run({ id: "t1" })],
    });
  });

  it("updateTestRun dispatches update with the test runs", () => {
    const dispatch = vi.fn();

    updateTestRun(dispatch, [run({ id: "t1" })]);

    expect(dispatch).toHaveBeenCalledWith({
      type: "update",
      payload: [run({ id: "t1" })],
    });
  });
});
