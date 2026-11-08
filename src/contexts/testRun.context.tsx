import {
  type ReactNode,
  createContext,
  useContext,
  useEffect,
  useReducer,
} from "react";
import { staleGuard } from "../_helpers/staleGuard";
import { TestRun } from "../types";
import { useLocation } from "react-router-dom";
import { getQueryParams } from "../_helpers/route.helpers";
import { testRunService } from "../services";
import { GridRowId } from "@mui/x-data-grid";

type IAction =
  | { type: "request" }
  | { type: "failure" }
  | { type: "get"; payload: TestRun[] }
  | { type: "delete"; payload: string[] }
  | { type: "add"; payload: TestRun[] }
  | { type: "update"; payload: TestRun[] }
  | { type: "filterSort"; payload?: GridRowId[] }
  | {
      type: "markNoisePending";
      payload: {
        requestedAt: string;
        seen: ReadonlyMap<string, TestRun["noiseAnalysis"]>;
      };
    }
  | { type: "touched"; payload: boolean }
  | { type: "select"; payload?: TestRun };
type Dispatch = (action: IAction) => void;
type State = {
  selectedTestRun?: TestRun;
  filteredSortedTestRunIds?: GridRowId[];
  testRuns: TestRun[];
  // socket events can trail a delete, and must not bring the run back
  deletedIds?: ReadonlySet<string>;
  touched: boolean;
  loading: boolean;
};
type TestRunProviderProps = {
  children: ReactNode;
};

const TestRunStateContext = createContext<State | undefined>(undefined);
const TestRunDispatchContext = createContext<Dispatch | undefined>(undefined);

const initialState: State = {
  touched: false,
  testRuns: [],
  loading: false,
};

const sameOrder = (
  previous: GridRowId[] | undefined,
  next: GridRowId[] | undefined,
): boolean => {
  if (previous === next) {
    return true;
  }
  if (!previous || !next || previous.length !== next.length) {
    return false;
  }
  return previous.every((id, index) => id === next[index]);
};

export function testRunReducer(state: State, action: IAction): State {
  switch (action.type) {
    case "select":
      return {
        ...state,
        touched: false,
        selectedTestRun: action.payload,
      };

    case "filterSort":
      // a fresh array on every grid state change would re-render every reader
      if (sameOrder(state.filteredSortedTestRunIds, action.payload)) {
        return state;
      }
      return {
        ...state,
        filteredSortedTestRunIds: action.payload,
      };

    case "request":
      return {
        ...state,
        testRuns: [],
        deletedIds: undefined,
        filteredSortedTestRunIds: undefined,
        loading: true,
      };

    case "get":
      return {
        ...state,
        testRuns: action.payload,
        deletedIds: undefined,
        filteredSortedTestRunIds: undefined,
        loading: false,
      };

    case "failure":
      return {
        ...state,
        loading: false,
      };

    case "delete": {
      const deletedIds = new Set([
        ...(state.deletedIds ?? []),
        ...action.payload,
      ]);
      return {
        ...state,
        deletedIds,
        testRuns: state.testRuns.filter((p) => !deletedIds.has(p.id)),
      };
    }

    case "add": {
      const existingIds = new Set(state.testRuns.map((tr) => tr.id));
      const added = action.payload.filter(
        (i) => !existingIds.has(i.id) && !state.deletedIds?.has(i.id),
      );
      if (added.length === 0) {
        return state;
      }
      return {
        ...state,
        testRuns: [...state.testRuns, ...added],
      };
    }

    case "update": {
      const updatedById = new Map(
        action.payload
          .filter((i) => !state.deletedIds?.has(i.id))
          .map((i) => [i.id, i]),
      );
      // keep the testRuns reference stable: a new array invalidates every memo over a possibly huge list
      if (updatedById.size === 0) {
        return state;
      }
      const listedIds = new Set<string>();
      const updated = state.testRuns.map((t) => {
        listedIds.add(t.id);
        return updatedById.get(t.id) ?? t;
      });
      // an update can arrive for a run the list does not hold yet: add it
      const added = [...updatedById.values()].filter(
        (i) => !listedIds.has(i.id),
      );
      const selectedUpdate = state.selectedTestRun
        ? updatedById.get(state.selectedTestRun.id)
        : undefined;
      return {
        ...state,
        testRuns: [...updated, ...added],
        selectedTestRun: selectedUpdate ?? state.selectedTestRun,
      };
    }

    case "markNoisePending": {
      const { requestedAt, seen } = action.payload;
      const mark = (run: TestRun): TestRun =>
        seen.has(run.id) &&
        JSON.stringify(run.noiseAnalysis) === JSON.stringify(seen.get(run.id))
          ? { ...run, noiseAnalysis: { pending: true, requestedAt } }
          : run;
      return {
        ...state,
        testRuns: state.testRuns.map(mark),
        selectedTestRun: state.selectedTestRun && mark(state.selectedTestRun),
      };
    }

    case "touched":
      return {
        ...state,
        touched: action.payload,
      };

    default:
      return state;
  }
}

function TestRunProvider({ children }: Readonly<TestRunProviderProps>) {
  const [state, dispatch] = useReducer(testRunReducer, initialState);
  const location = useLocation();

  useEffect(() => {
    const { testId } = getQueryParams(location.search);
    const guard = staleGuard();

    if (!testId) {
      dispatch({
        type: "select",
      });
    } else {
      testRunService
        .getDetails(testId)
        .then((payload) => {
          if (guard.isCurrent()) {
            dispatch({
              type: "select",
              payload,
            });
          }
        })
        // a deleted run's link: close rather than keep the previous run open
        .catch(() => {
          if (guard.isCurrent()) {
            dispatch({
              type: "select",
            });
          }
        });
    }

    return guard.cancel;
  }, [location.search]);

  return (
    <TestRunStateContext.Provider value={state}>
      <TestRunDispatchContext.Provider value={dispatch}>
        {children}
      </TestRunDispatchContext.Provider>
    </TestRunStateContext.Provider>
  );
}

function useTestRunState() {
  const context = useContext(TestRunStateContext);

  if (context === undefined) {
    throw Error("must be used within a TestRunProvider");
  }

  return context;
}

function useTestRunDispatch() {
  const context = useContext(TestRunDispatchContext);

  if (context === undefined) {
    throw Error("must be used within a TestRunProvider");
  }

  return context;
}

function deleteTestRun(dispatch: Dispatch, ids: string[]) {
  dispatch({
    type: "delete",
    payload: ids,
  });
}

function addTestRun(dispatch: Dispatch, testRuns: TestRun[]) {
  dispatch({
    type: "add",
    payload: testRuns,
  });
}

function updateTestRun(dispatch: Dispatch, testRuns: TestRun[]) {
  dispatch({
    type: "update",
    payload: testRuns,
  });
}

function markNoisePending(
  dispatch: Dispatch,
  requestedAt: string,
  seen: ReadonlyMap<string, TestRun["noiseAnalysis"]>,
) {
  dispatch({ type: "markNoisePending", payload: { requestedAt, seen } });
}

export {
  TestRunProvider,
  markNoisePending,
  useTestRunState,
  useTestRunDispatch,
  addTestRun,
  deleteTestRun,
  updateTestRun,
};
