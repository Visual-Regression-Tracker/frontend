import React from "react";
import { PaginatedData, TestRun } from "../types";
import { testRunService } from "../services";

interface IRequestAction {
  type: "request";
  payload?: undefined;
}

interface IGetAction {
  type: "get";
  payload: PaginatedData<TestRun>;
}

interface ISelectAction {
  type: "select";
  payload: string | undefined;
}

interface IIndexAction {
  type: "index";
  payload: string | undefined;
}

interface IDeleteAction {
  type: "delete";
  payload: string;
}

interface IAddAction {
  type: "add";
  payload: TestRun;
}

interface IUpdateAction {
  type: "update";
  payload: TestRun;
}

interface IApproveAction {
  type: "approve";
  payload: TestRun;
}

interface IRejectAction {
  type: "reject";
  payload: TestRun;
}

type IAction =
  | IRequestAction
  | IIndexAction
  | IGetAction
  | IDeleteAction
  | IAddAction
  | IUpdateAction
  | IApproveAction
  | IRejectAction
  | ISelectAction;

type Dispatch = (action: IAction) => void;
type State = {
  selectedTestRunId: string | undefined;
  selectedTestRunIndex: number | undefined;
  testRuns: TestRun[];
  total: number;
  take: number;
  skip: number;
  loading: boolean;
};

type TestRunProviderProps = { children: React.ReactNode };

const TestRunStateContext = React.createContext<State | undefined>(undefined);
const TestRunDispatchContext = React.createContext<Dispatch | undefined>(
  undefined
);

const initialState: State = {
  selectedTestRunId: undefined,
  selectedTestRunIndex: undefined,
  testRuns: [],
  take: 10,
  skip: 0,
  total: 0,
  loading: false,
};

function testRunReducer(state: State, action: IAction): State {
  switch (action.type) {
    case "select":
      return {
        ...state,
        selectedTestRunId: action.payload,
      };
    case "index":
      return {
        ...state,
        selectedTestRunIndex: state.testRuns.findIndex(
          (t) => t.id === action.payload
        ),
      };
    case "request":
      return {
        ...state,
        testRuns: [],
        loading: true,
      };
    case "get":
      const { data, take, skip, total } = action.payload;
      return {
        ...state,
        testRuns: data,
        take,
        skip,
        total,
        loading: false,
      };
    case "delete":
      return {
        ...state,
        testRuns: state.testRuns.filter((p) => p.id !== action.payload),
      };
    case "add":
      return {
        ...state,
        testRuns: [...state.testRuns, action.payload],
      };
    case "update":
      return {
        ...state,
        testRuns: state.testRuns.map((t) => {
          if (t.id === action.payload.id) {
            return action.payload;
          }
          return t;
        }),
      };
    default:
      return state;
  }
}

function TestRunProvider({ children }: TestRunProviderProps) {
  const [state, dispatch] = React.useReducer(testRunReducer, initialState);

  React.useEffect(() => {
    setTestRunIndex(dispatch, state.selectedTestRunId);
  }, [state.selectedTestRunId, state.testRuns]);

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
    throw new Error("must be used within a TestRunProvider");
  }
  return context;
}

function useTestRunDispatch() {
  const context = React.useContext(TestRunDispatchContext);
  if (context === undefined) {
    throw new Error("must be used within a TestRunProvider");
  }
  return context;
}

async function getTestRunList(
  dispatch: Dispatch,
  buildId: string,
  page: number
): Promise<void> {
  dispatch({ type: "request" });

  return testRunService
    .getList(buildId, initialState.take, initialState.take * (page - 1))
    .then((response) => {
      dispatch({ type: "get", payload: response });
    });
}

async function deleteTestRun(dispatch: Dispatch, id: string) {
  return testRunService.remove(id).then((testRun) => {
    dispatch({ type: "delete", payload: id });
    return testRun;
  });
}

async function selectTestRun(dispatch: Dispatch, id: string | undefined) {
  dispatch({ type: "select", payload: id });
}

async function setTestRunIndex(dispatch: Dispatch, index: string | undefined) {
  dispatch({ type: "index", payload: index });
}

async function addTestRun(dispatch: Dispatch, testRun: TestRun) {
  dispatch({ type: "add", payload: testRun });
}

async function updateTestRun(dispatch: Dispatch, testRun: TestRun) {
  dispatch({ type: "update", payload: testRun });
}

export {
  TestRunProvider,
  useTestRunState,
  useTestRunDispatch,
  getTestRunList,
  deleteTestRun,
  selectTestRun,
  addTestRun,
  updateTestRun,
};
