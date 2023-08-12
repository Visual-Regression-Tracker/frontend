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
  undefined
);

const initialState: State = {
  touched: false,
  testRuns: [],
  loading: false,
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

    case "delete":
      return {
        ...state,
        testRuns: state.testRuns.filter((p) => !action.payload.includes(p.id)),
      };

    case "add":
      return {
        ...state,
        testRuns: [
          ...state.testRuns,
          ...action.payload.filter(
            // remove duplicates
            (i) => !state.testRuns.find((tr) => tr.id === i.id)
          ),
        ],
      };

    case "update":
      return {
        ...state,
        testRuns: state.testRuns.map((t) => {
          const item = action.payload.find((i) => i.id === t.id);

          if (item) {
            return item;
          }

          return t;
        }),
        selectedTestRun:
          action.payload.find((i) => i.id === state.selectedTestRun?.id) ??
          state.selectedTestRun,
      };

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
