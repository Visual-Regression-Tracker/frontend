import {
  type ReactNode,
  createContext,
  useContext,
  useEffect,
  useReducer,
} from "react";
import { Build, PaginatedData } from "../types";
import { buildsService } from "../services";
import { useLocation } from "react-router-dom";
import { getQueryParams } from "../_helpers/route.helpers";

interface IRequestAction {
  type: "request";
}

interface IResetAction {
  type: "reset";
}

interface IFailureAction {
  type: "failure";
  payload: string;
}

interface IGetAction {
  type: "get";
  payload: PaginatedData<Build>;
  search?: string;
}

interface ISelectAction {
  type: "select";
  payload?: Build;
}

interface IDeleteAction {
  type: "delete";
  payload: string;
}

interface IAddAction {
  type: "add";
  payload: Build;
}

interface IUpdateAction {
  type: "update";
  payload: Build[];
}

type IAction =
  | IRequestAction
  | IResetAction
  | IFailureAction
  | IGetAction
  | IDeleteAction
  | IAddAction
  | IUpdateAction
  | ISelectAction;
type Dispatch = (action: IAction) => void;
type State = {
  selectedBuild?: Build;
  buildList: Build[];
  total: number;
  take: number;
  skip: number;
  search?: string;
  loading: boolean;
  error?: string;
};
type BuildProviderProps = {
  children: ReactNode;
};

const BuildStateContext = createContext<State | undefined>(undefined);
const BuildDispatchContext = createContext<Dispatch | undefined>(undefined);

const initialState: State = {
  buildList: [],
  take: 10,
  skip: 0,
  total: 0,
  loading: false,
};

export function buildReducer(state: State, action: IAction): State {
  switch (action.type) {
    case "select":
      return {
        ...state,
        selectedBuild: action.payload,
      };

    // keeps the current items on screen so refetching does not flash the skeletons
    case "request":
      return {
        ...state,
        loading: true,
        error: undefined,
      };

    case "reset":
      return {
        ...state,
        buildList: [],
        total: 0,
        loading: true,
        error: undefined,
      };

    case "failure":
      return {
        ...state,
        loading: false,
        error: action.payload,
      };

    case "get":
      // eslint-disable-next-line no-case-declarations
      const { data, take, skip, total } = action.payload;

      return {
        ...state,
        buildList: data,
        take,
        skip,
        total,
        search: action.search,
        loading: false,
      };

    // the same delete arrives twice, from the request and from the socket
    case "delete":
      if (!state.buildList.some((b) => b.id === action.payload)) {
        return state;
      }
      return {
        ...state,
        buildList: state.buildList.filter((p) => p.id !== action.payload),
        total: Math.max(0, state.total - 1),
      };

    // a new build belongs on the first page of an unfiltered list only; the total counts it anywhere
    case "add":
      if (state.buildList.some((b) => b.id === action.payload.id)) {
        return state;
      }
      if (state.skip > 0 || state.search) {
        return { ...state, total: state.total + 1 };
      }
      return {
        ...state,
        buildList: [action.payload, ...state.buildList].slice(0, state.take),
        total: state.total + 1,
      };

    // keeps the state object when nothing on screen changed, or every build_updated event re-renders the list
    case "update": {
      const updatedById = new Map(action.payload.map((i) => [i.id, i]));
      const listed = state.buildList.some((b) => updatedById.has(b.id));
      const selectedUpdate = state.selectedBuild
        ? updatedById.get(state.selectedBuild.id)
        : undefined;
      if (!listed && !selectedUpdate) {
        return state;
      }
      return {
        ...state,
        selectedBuild: selectedUpdate ?? state.selectedBuild,
        buildList: listed
          ? state.buildList.map((b) => updatedById.get(b.id) ?? b)
          : state.buildList,
      };
    }

    default:
      return state;
  }
}

function BuildProvider({ children }: Readonly<BuildProviderProps>) {
  const [state, dispatch] = useReducer(buildReducer, initialState);
  const location = useLocation();
  const { buildId } = getQueryParams(location.search);

  useEffect(() => {
    // switching builds moves the URL faster than answers return; only the build the URL names now may be shown
    let ignore = false;
    // selectBuild handles its own failure
    void selectBuild(dispatch, buildId, () => !ignore);
    return () => {
      ignore = true;
    };
  }, [buildId]);

  return (
    <BuildStateContext.Provider value={state}>
      <BuildDispatchContext.Provider value={dispatch}>
        {children}
      </BuildDispatchContext.Provider>
    </BuildStateContext.Provider>
  );
}

function useBuildState() {
  const context = useContext(BuildStateContext);

  if (context === undefined) {
    throw Error("must be used within a BuildProvider");
  }

  return context;
}

function useBuildDispatch() {
  const context = useContext(BuildDispatchContext);

  if (context === undefined) {
    throw Error("must be used within a BuildProvider");
  }

  return context;
}

// builds this client is deleting: their build_deleted event is already reported by the delete itself
const ownDeletes = new Set<string>();

// true once per own delete: the event arrives after the answer or before it
function consumeOwnDelete(id: string) {
  return ownDeletes.delete(id);
}

function deleteBuild(dispatch: Dispatch, id: string) {
  ownDeletes.add(id);

  return buildsService
    .remove(id)
    .then((build) => {
      dispatch({
        type: "delete",
        payload: id,
      });
      return build;
    })
    .catch((err) => {
      ownDeletes.delete(id);
      throw err;
    });
}

function selectBuild(
  dispatch: Dispatch,
  id?: string,
  isCurrent: () => boolean = () => true,
) {
  if (!id) {
    dispatch({
      type: "select",
    });
  } else {
    return (
      buildsService
        .getDetails(id)
        .then((build) => {
          if (isCurrent()) {
            dispatch({
              type: "select",
              payload: build,
            });
          }
        })
        // a deleted build's link: close rather than keep the previous build open
        .catch(() => {
          if (isCurrent()) {
            dispatch({
              type: "select",
            });
          }
        })
    );
  }
}

function addBuild(dispatch: Dispatch, build: Build) {
  dispatch({
    type: "add",
    payload: build,
  });
}

function updateBuild(dispatch: Dispatch, builds: Build[]) {
  dispatch({
    type: "update",
    payload: builds,
  });
}

export {
  BuildProvider,
  useBuildState,
  useBuildDispatch,
  deleteBuild,
  consumeOwnDelete,
  selectBuild,
  addBuild,
  updateBuild,
};
