import React from "react";
import { TestRun } from "../types";
import { useLocation } from "react-router-dom";
import { getQueryParams } from "../_helpers/route.helpers";
import { testRunService } from "../services";
import { GridRowId } from "@mui/x-data-grid";

interface IRequestAction {
  type: "request";
}

interface IGetAction {
  type: "get";
  payload: TestRun[];
}

interface ISelectAction {
  type: "select";
  payload?: TestRun;
}

interface IDeleteAction {
  type: "delete";
  payload: string[];
}

interface IAddAction {
  type: "add";
  payload: TestRun[];
}

interface IUpdateAction {
  type: "update";
  payload: TestRun[];
}

interface IApproveAction {
  type: "approve";
  payload: TestRun;
}

interface IRejectAction {
  type: "reject";
  payload: TestRun;
}

interface IFilterSortAction {
  type: "filterSort";
  payload?: GridRowId[];
}

interface ITouchedAction {
  type: "touched";
  payload: boolean;
}

type IAction =
  | IRequestAction
  | IGetAction
  | IDeleteAction
  | IAddAction
  | IUpdateAction
  | IApproveAction
  | IRejectAction
  | IFilterSortAction
  | ITouchedAction
  | ISelectAction;
type Dispatch = (action: IAction) => void;
type State = {
  selectedTestRun?: TestRun;
  filteredSortedTestRunIds?: GridRowId[];
  testRuns: TestRun[];
  touched: boolean;
  loading: boolean;
};
type TestRunProviderProps = {
  children: React.ReactNode;
};

const TestRunStateContext = React.createContext<State | undefined>(undefined);
const TestRunDispatchContext = React.createContext<Dispatch | undefined>(
  undefined,
);

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

function testRunReducer(state: State, action: IAction): State {
  switch (action.type) {
    case "select":
      return {
        ...state,
        touched: false,
        selectedTestRun: action.payload,
      };

    case "filterSort":
      // The list republishes its order on every grid state change, and with
      // thousands of runs a fresh array re-renders everything reading this
      // context for nothing. Keep the previous one when the order is the same.
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
        loading: true,
      };

    case "get":
      return {
        ...state,
        testRuns: action.payload,
        loading: false,
      };

    case "delete": {
      const deletedIds = new Set(action.payload);
      return {
        ...state,
        testRuns: state.testRuns.filter((p) => !deletedIds.has(p.id)),
      };
    }

    case "add": {
      const existingIds = new Set(state.testRuns.map((tr) => tr.id));
      // remove duplicates
      const added = action.payload.filter((i) => !existingIds.has(i.id));
      if (added.length === 0) {
        return state;
      }
      return {
        ...state,
        testRuns: [...state.testRuns, ...added],
      };
    }

    case "update": {
      const updatedById = new Map(action.payload.map((i) => [i.id, i]));
      const selectedUpdate = state.selectedTestRun
        ? updatedById.get(state.selectedTestRun.id)
        : undefined;
      // keep the testRuns reference stable when nothing matched: replacing the
      // array invalidates every memo over a possibly huge run list
      if (
        !selectedUpdate &&
        !state.testRuns.some((t) => updatedById.has(t.id))
      ) {
        return state;
      }
      return {
        ...state,
        testRuns: state.testRuns.map((t) => updatedById.get(t.id) ?? t),
        selectedTestRun: selectedUpdate ?? state.selectedTestRun,
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

function TestRunProvider({ children }: TestRunProviderProps) {
  const [state, dispatch] = React.useReducer(testRunReducer, initialState);
  const location = useLocation();

  React.useEffect(() => {
    const { testId } = getQueryParams(location.search);

    if (!testId) {
      dispatch({
        type: "select",
      });
    } else {
      testRunService.getDetails(testId).then((payload) => {
        dispatch({
          type: "select",
          payload,
        });
      });
    }
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
  const context = React.useContext(TestRunStateContext);

  if (context === undefined) {
    throw Error("must be used within a TestRunProvider");
  }

  return context;
}

function useTestRunDispatch() {
  const context = React.useContext(TestRunDispatchContext);

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

export {
  TestRunProvider,
  useTestRunState,
  useTestRunDispatch,
  addTestRun,
  deleteTestRun,
  updateTestRun,
};
