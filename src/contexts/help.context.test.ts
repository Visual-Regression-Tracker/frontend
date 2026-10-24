import { reducer, setHelpSteps } from "./help.context";
import { LOGIN_PAGE_STEPS } from "../constants";

describe("help reducer", () => {
  it("setSteps replaces the help steps", () => {
    const state = reducer(
      { helpSteps: [{ target: "#old", content: "old" }] },
      { type: "setSteps", payload: LOGIN_PAGE_STEPS },
    );

    expect(state).toEqual({ helpSteps: LOGIN_PAGE_STEPS });
  });

  it("setSteps can clear the help steps", () => {
    const state = reducer(
      { helpSteps: LOGIN_PAGE_STEPS },
      { type: "setSteps", payload: [] },
    );

    expect(state.helpSteps).toEqual([]);
  });

  it("does not change the state for an unknown action", () => {
    const before = { helpSteps: [] };

    expect(reducer(before, { type: "nope" } as never)).toBe(before);
  });
});

describe("setHelpSteps", () => {
  it("dispatches setSteps with the steps", () => {
    const dispatch = vi.fn();

    setHelpSteps(dispatch, LOGIN_PAGE_STEPS);

    expect(dispatch).toHaveBeenCalledWith({
      type: "setSteps",
      payload: LOGIN_PAGE_STEPS,
    });
  });
});
