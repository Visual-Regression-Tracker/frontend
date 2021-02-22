import React from "react";
import { TestRun } from "../types";
import { testRunService } from "../services";

interface IRequestAction {
  type: "request";
}

interface IGetAction {
  type: "get";
  payload: Array<TestRun>;
}

interface ISelectAction {
  type: "select";
  payload?: string;
}

interface IDeleteAction {
  type: "delete";
  payload: Array<string>;
}

interface IAddAction {
  type: "add";
  payload: Array<TestRun>;
}

interface IUpdateAction {
  type: "update";
  payload: Array<TestRun>;
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
  | IGetAction
  | IDeleteAction
  | IAddAction
  | IUpdateAction
  | IApproveAction
  | IRejectAction
  | ISelectAction;

type Dispatch = (action: IAction) => void;
type State = {
  selectedTestRunId?: string;
  selectedTestRunIndex?: number;
  testRuns: Array<TestRun>;
  loading: boolean;
};

type TestRunProviderProps = { children: React.ReactNode };

const TestRunStateContext = React.createContext<State | undefined>(undefined);
const TestRunDispatchContext = React.createContext<Dispatch | undefined>(
  undefined
);

const initialState: State = {
  testRuns: [],
  loading: false,
};

function testRunReducer(state: State, action: IAction): State {
  switch (action.type) {
    case "select":
      return {
        ...state,
        selectedTestRunId: action.payload,
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
      };
    default:
      return state;
  }
}

function TestRunProvider({ children }: TestRunProviderProps) {
  const [state, dispatch] = React.useReducer(testRunReducer, initialState);

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
  buildId: string
): Promise<void> {
  dispatch({ type: "request" });

  return testRunService.getList(buildId).then((response) => {
    dispatch({ type: "get", payload: response });
  });
}

async function deleteTestRun(dispatch: Dispatch, ids: Array<string>) {
  dispatch({ type: "delete", payload: ids });
}

async function selectTestRun(dispatch: Dispatch, id?: string) {
  dispatch({ type: "select", payload: id });
}

async function addTestRun(dispatch: Dispatch, testRuns: Array<TestRun>) {
  dispatch({ type: "add", payload: testRuns });
}

async function updateTestRun(dispatch: Dispatch, testRuns: Array<TestRun>) {
  dispatch({ type: "update", payload: testRuns });
}

export {
  TestRunProvider,
  useTestRunState,
  useTestRunDispatch,
  getTestRunList,
  selectTestRun,
  addTestRun,
  deleteTestRun,
  updateTestRun,
};
