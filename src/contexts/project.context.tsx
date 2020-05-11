import * as React from "react";
import { Project } from "../types";
import { projectsService } from "../services";
import { useAuthState } from "./auth.context";

interface IRequestAction {
  type: "request";
  payload?: undefined;
}

interface ISuccessAction {
  type: "success";
  payload: Project[];
}

interface ISelectAction {
  type: "select";
  payload: Project;
}

type IAction = IRequestAction | ISuccessAction | ISelectAction;

type Dispatch = (action: IAction) => void;
type State = { projectList: Project[]; selectedProject: Project | undefined };

type ProjectProviderProps = { children: React.ReactNode };

const ProjectStateContext = React.createContext<State | undefined>(undefined);
const ProjectDispatchContext = React.createContext<Dispatch | undefined>(
  undefined
);

const localStorageSelectedProjectKey = "selectedProject";
const localStorageSelectedProject = localStorage.getItem(
  localStorageSelectedProjectKey
);
const initialState: State = {
  projectList: [],
  selectedProject: localStorageSelectedProject
    ? JSON.parse(localStorageSelectedProject)
    : undefined,
};

function projectReducer(state: State, action: IAction): State {
  switch (action.type) {
    case "success":
      return {
        ...state,
        projectList: action.payload,
      };
    case "select":
      return {
        ...state,
        selectedProject: action.payload,
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
      dispatch({ type: "success", payload: projects });

      // select first project if non was before
      !localStorageSelectedProject &&
        projects.length > 0 &&
        selectProject(dispatch, projects[0]);
    })
    .catch((error) => {
      console.log(error.toString());
    });
}

async function selectProject(dispatch: Dispatch, project: Project) {
  dispatch({ type: "select", payload: project });
  localStorage.setItem(localStorageSelectedProjectKey, JSON.stringify(project));
}

export {
  ProjectProvider,
  useProjectState,
  useProjectDispatch,
  //   getProjectList,
  selectProject,
};
