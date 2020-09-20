import * as React from "react";
import { Project } from "../types";
import { projectsService } from "../services";

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

interface IUpdateAction {
  type: "update";
  payload: Project;
}

interface IDeleteAction {
  type: "delete";
  payload: string;
}

type IAction =
  | IRequestAction
  | IGetction
  | ICreateAction
  | IDeleteAction
  | IUpdateAction;

type Dispatch = (action: IAction) => void;
type State = { projectList: Project[] };

type ProjectProviderProps = { children: React.ReactNode };

const ProjectStateContext = React.createContext<State | undefined>(undefined);
const ProjectDispatchContext = React.createContext<Dispatch | undefined>(
  undefined
);

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
    case "update":
      return {
        ...state,
        projectList: state.projectList.map((p) => {
          if (p.id === action.payload.id) {
            return action.payload;
          }
          return p;
        }),
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
  const initialState: State = {
    projectList: [],
  };

  const [state, dispatch] = React.useReducer(projectReducer, initialState);

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

  return projectsService.getAll().then((projects) => {
    dispatch({ type: "get", payload: projects });
  });
}

async function createProject(
  dispatch: Dispatch,
  project: { name: string; mainBranchName: string }
) {
  dispatch({ type: "request" });

  return projectsService.create(project).then((project: Project) => {
    dispatch({ type: "create", payload: project });
    return project;
  });
}

async function updateProject(
  dispatch: Dispatch,
  project: { id: string; name: string; mainBranchName: string }
) {
  dispatch({ type: "request" });

  return projectsService.update(project).then((project: Project) => {
    dispatch({ type: "update", payload: project });
    return project;
  });
}

async function deleteProject(dispatch: Dispatch, id: string) {
  dispatch({ type: "request" });

  return projectsService.remove(id).then((project) => {
    dispatch({ type: "delete", payload: id });
    return project;
  });
}

export {
  ProjectProvider,
  useProjectState,
  useProjectDispatch,
  createProject,
  updateProject,
  getProjectList,
  deleteProject,
};
