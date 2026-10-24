import * as React from "react";
import { Project, ProjectDto } from "../types";
import { projectsService } from "../services";
import { useSnackbar } from "notistack";
import { useUserState } from "./user.context";
import { DEFAULT_PROJECT_EDIT_STATE } from "../constants";
import {
  readRecentProjectIds,
  rememberRecentProject,
} from "../_helpers/projectList.helper";

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

interface ISelectAction {
  type: "select";
  payload: string;
}

interface IFavoritesAction {
  type: "favorites";
  payload: string[];
}

interface IFavoriteAction {
  type: "favorite";
  payload: { id: string; favorite: boolean };
}

interface IRecentAction {
  type: "recent";
  payload: string[];
}

interface ISetProjectEditState {
  type: "setProjectEditState";
  payload: ProjectDto;
}

type IAction =
  | ISetProjectEditState
  | IRequestAction
  | IGetction
  | ISelectAction
  | ICreateAction
  | IDeleteAction
  | IUpdateAction
  | IFavoritesAction
  | IFavoriteAction
  | IRecentAction;
type Dispatch = (action: IAction) => void;
type State = {
  selectedProjectId: string | null;
  projectEditState: ProjectDto;
  projectList: Project[];
  // the signed-in user's own, kept by the API
  favoriteProjectIds: string[];
  // opened last first, kept in this browser
  recentProjectIds: string[];
};
type ProjectProviderProps = {
  children: React.ReactNode;
};

const ProjectStateContext = React.createContext<State | undefined>(undefined);
const ProjectDispatchContext = React.createContext<Dispatch | undefined>(
  undefined,
);

export function projectReducer(state: State, action: IAction): State {
  switch (action.type) {
    case "get":
      return {
        ...state,
        projectList: action.payload,
      };

    case "select":
      return {
        ...state,
        selectedProjectId: action.payload,
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
        favoriteProjectIds: state.favoriteProjectIds.filter(
          (id) => id !== action.payload,
        ),
      };

    case "favorites":
      return {
        ...state,
        favoriteProjectIds: action.payload,
      };

    case "favorite": {
      const others = state.favoriteProjectIds.filter(
        (id) => id !== action.payload.id,
      );
      return {
        ...state,
        favoriteProjectIds: action.payload.favorite
          ? [...others, action.payload.id]
          : others,
      };
    }

    case "recent":
      return {
        ...state,
        recentProjectIds: action.payload,
      };

    case "setProjectEditState":
      return {
        ...state,
        projectEditState: action.payload,
      };

    default:
      return state;
  }
}

function useProjectState() {
  const context = React.useContext(ProjectStateContext);

  if (context === undefined) {
    throw Error("must be used within a ProjectProvider");
  }

  return context;
}

function useProjectDispatch() {
  const context = React.useContext(ProjectDispatchContext);

  if (context === undefined) {
    throw Error("must be used within a ProjectProvider");
  }

  return context;
}

function getProjectList(dispatch: Dispatch): Promise<Project[]> {
  dispatch({
    type: "request",
  });

  return projectsService.getAll().then((projects) => {
    dispatch({
      type: "get",
      payload: projects,
    });
    return projects;
  });
}

function selectProject(dispatch: Dispatch, id: string) {
  dispatch({
    type: "select",
    payload: id,
  });
}

function createProject(dispatch: Dispatch, project: ProjectDto) {
  dispatch({
    type: "request",
  });

  return projectsService.create(project).then((project: Project) => {
    dispatch({
      type: "create",
      payload: project,
    });
    return project;
  });
}

function updateProject(dispatch: Dispatch, project: ProjectDto) {
  dispatch({
    type: "request",
  });

  return projectsService.update(project).then((project: Project) => {
    dispatch({
      type: "update",
      payload: project,
    });
    return project;
  });
}

function deleteProject(dispatch: Dispatch, id: string) {
  dispatch({
    type: "request",
  });

  return projectsService.remove(id).then((project) => {
    dispatch({
      type: "delete",
      payload: id,
    });
    return project;
  });
}

// the star shows at once and goes back if the API refuses it
function toggleFavoriteProject(
  dispatch: Dispatch,
  id: string,
  favorite: boolean,
): Promise<void> {
  dispatch({ type: "favorite", payload: { id, favorite } });

  const save = favorite
    ? projectsService.addFavorite(id)
    : projectsService.removeFavorite(id);

  return save.catch((err) => {
    dispatch({ type: "favorite", payload: { id, favorite: !favorite } });
    throw err;
  });
}

function setProjectEditState(dispatch: Dispatch, project?: ProjectDto) {
  dispatch({
    type: "setProjectEditState",
    payload: project ?? DEFAULT_PROJECT_EDIT_STATE,
  });
}

function ProjectProvider({ children }: ProjectProviderProps) {
  const initialState: State = {
    selectedProjectId: null,
    projectList: [],
    projectEditState: DEFAULT_PROJECT_EDIT_STATE,
    favoriteProjectIds: [],
    recentProjectIds: [],
  };

  const { loggedIn, user } = useUserState();
  const userId = loggedIn ? user?.id : undefined;
  const [state, dispatch] = React.useReducer(projectReducer, initialState);
  const { enqueueSnackbar } = useSnackbar();

  React.useEffect(() => {
    if (loggedIn) {
      getProjectList(dispatch).catch((err) =>
        enqueueSnackbar(err, {
          variant: "error",
        }),
      );
    }
  }, [enqueueSnackbar, loggedIn]);

  // An API older than this frontend has no favourites and answers 404: the
  // lists work without them rather than greeting every login with an error.
  React.useEffect(() => {
    if (!userId) {
      dispatch({ type: "favorites", payload: [] });
      dispatch({ type: "recent", payload: [] });
      return;
    }
    let ignore = false;
    dispatch({ type: "recent", payload: readRecentProjectIds(userId) });
    projectsService
      .getFavorites()
      .then((ids) => {
        if (!ignore) {
          dispatch({ type: "favorites", payload: ids });
        }
      })
      .catch(() => {
        if (!ignore) {
          dispatch({ type: "favorites", payload: [] });
        }
      });
    return () => {
      ignore = true;
    };
  }, [userId]);

  // a project counts as opened once it is selected, whichever page did it
  React.useEffect(() => {
    if (userId && state.selectedProjectId) {
      dispatch({
        type: "recent",
        payload: rememberRecentProject(userId, state.selectedProjectId),
      });
    }
  }, [userId, state.selectedProjectId]);

  return (
    <ProjectStateContext.Provider value={state}>
      <ProjectDispatchContext.Provider value={dispatch}>
        {children}
      </ProjectDispatchContext.Provider>
    </ProjectStateContext.Provider>
  );
}

export {
  ProjectProvider,
  useProjectState,
  useProjectDispatch,
  createProject,
  updateProject,
  getProjectList,
  deleteProject,
  selectProject,
  setProjectEditState,
  toggleFavoriteProject,
};
