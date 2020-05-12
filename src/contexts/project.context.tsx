import * as React from "react";
import { Project } from "../types";
import { projectsService } from "../services";
import { useAuthState } from "./auth.context";

interface IRequestAction {
  type: "request";
  payload?: undefined;
}

interface IGetction {
  type: "get";
  payload: Project[];
}

interface ICreateAction {
  type: "create";
  payload: Project;
}

interface IDeleteAction {
  type: "delete";
  payload: string;
}

type IAction = IRequestAction | IGetction | ICreateAction | IDeleteAction;

type Dispatch = (action: IAction) => void;
type State = { projectList: Project[] };

type ProjectProviderProps = { children: React.ReactNode };

const ProjectStateContext = React.createContext<State | undefined>(undefined);
const ProjectDispatchContext = React.createContext<Dispatch | undefined>(
  undefined
);

const initialState: State = {
  projectList: [],
};

function projectReducer(state: State, action: IAction): State {
  switch (action.type) {
    case "get":
      return {
        ...state,
        projectList: action.payload,
      };
    case "create":
      return {
        ...state,
        projectList: [action.payload, ...state.projectList],
      };
    case "delete":
      return {
        ...state,
        projectList: state.projectList.filter((p) => p.id !== action.payload),
      };
    default:
      return state;
  }
}

function ProjectProvider({ children }: ProjectProviderProps) {
  const [state, dispatch] = React.useReducer(projectReducer, initialState);
  const { loggedIn } = useAuthState();

  React.useEffect(() => {
    if (loggedIn) {
      getProjectList(dispatch);
    }
  }, [loggedIn]);

  return (
    <ProjectStateContext.Provider value={state}>
      <ProjectDispatchContext.Provider value={dispatch}>
        {children}
      </ProjectDispatchContext.Provider>
    </ProjectStateContext.Provider>
  );
}

function useProjectState() {
  const context = React.useContext(ProjectStateContext);
  if (context === undefined) {
    throw new Error("must be used within a ProjectProvider");
  }
  return context;
}

function useProjectDispatch() {
  const context = React.useContext(ProjectDispatchContext);
  if (context === undefined) {
    throw new Error("must be used within a ProjectProvider");
  }
  return context;
}

async function getProjectList(dispatch: Dispatch) {
  dispatch({ type: "request" });

  projectsService
    .getAll()
    .then((projects) => {
      dispatch({ type: "get", payload: projects });
    })
    .catch((error) => {
      console.log(error.toString());
    });
}

async function createProject(dispatch: Dispatch, project: { name: string }) {
  dispatch({ type: "request" });

  projectsService
    .create(project)
    .then((project: Project) => {
      dispatch({ type: "create", payload: project });
    })
    .catch((error) => {
      console.log(error.toString());
    });
}

async function deleteProject(dispatch: Dispatch, id: string) {
  dispatch({ type: "request" });

  projectsService
    .remove(id)
    .then((isDeleted) => {
      if (isDeleted) {
        dispatch({ type: "delete", payload: id });
      }
    })
    .catch((error) => {
      console.log(error.toString());
    });
}

export {
  ProjectProvider,
  useProjectState,
  useProjectDispatch,
  createProject,
  getProjectList,
  deleteProject,
};
