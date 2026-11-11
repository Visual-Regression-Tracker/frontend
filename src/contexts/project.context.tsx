import {
  type ReactNode,
  createContext,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useReducer,
} from "react";
import { staleGuard } from "../_helpers/staleGuard";
import { Project, ProjectDto } from "../types";
import {
  projectReducer,
  type ProjectAction,
  type ProjectState,
} from "./project.reducer";
import { projectsService } from "../services";
import { useSnackbar } from "notistack";
import { useUserState } from "./user.context";
import { DEFAULT_PROJECT_EDIT_STATE } from "../constants";
import { noiseAnalysisAvailable } from "../_helpers/noiseHint.helper";

type Dispatch = (action: ProjectAction) => void;
type ProjectProviderProps = {
  children: ReactNode;
};

const ProjectStateContext = createContext<ProjectState | undefined>(undefined);
const ProjectDispatchContext = createContext<Dispatch | undefined>(undefined);

function useProjectState() {
  const context = useContext(ProjectStateContext);

  if (context === undefined) {
    throw Error("must be used within a ProjectProvider");
  }

  return context;
}

function useSelectedProject(): Project | undefined {
  const { projectList, selectedProjectId } = useProjectState();
  return useMemo(
    () => projectList.find((project) => project.id === selectedProjectId),
    [projectList, selectedProjectId],
  );
}

function useProjectMissing(projectId: string | undefined): boolean {
  const { projectList, loading, loadFailed } = useProjectState();
  return (
    !loading &&
    !loadFailed &&
    !!projectId &&
    !projectList.some((project) => project.id === projectId)
  );
}

function useNoiseAnalysisAvailable(projectId?: string): boolean {
  const { projectList, selectedProjectId } = useProjectState();
  const id = projectId ?? selectedProjectId;
  const project = useMemo(
    () => projectList.find((item) => item.id === id),
    [projectList, id],
  );
  const imageComparison = project?.imageComparison;
  const noiseAnalysisConfig = project?.noiseAnalysisConfig;
  return useMemo(
    () =>
      !!imageComparison &&
      noiseAnalysisAvailable({
        imageComparison,
        noiseAnalysisConfig: noiseAnalysisConfig ?? "",
      }),
    [imageComparison, noiseAnalysisConfig],
  );
}

function useProjectDispatch() {
  const context = useContext(ProjectDispatchContext);

  if (context === undefined) {
    throw Error("must be used within a ProjectProvider");
  }

  return context;
}

function getProjectList(dispatch: Dispatch): Promise<Project[]> {
  dispatch({
    type: "request",
  });

  return projectsService.getAll().then(
    (projects) => {
      dispatch({
        type: "get",
        payload: projects,
      });
      return projects;
    },
    (err) => {
      dispatch({ type: "failure" });
      throw err;
    },
  );
}

function selectProject(dispatch: Dispatch, id: string) {
  dispatch({
    type: "select",
    payload: id,
  });
}

function createProject(dispatch: Dispatch, project: ProjectDto) {
  return projectsService.create(project).then((project: Project) => {
    dispatch({
      type: "create",
      payload: project,
    });
    return project;
  });
}

function updateProject(dispatch: Dispatch, project: ProjectDto) {
  return projectsService.update(project).then((project: Project) => {
    dispatch({
      type: "update",
      payload: project,
    });
    return project;
  });
}

function deleteProject(dispatch: Dispatch, id: string) {
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

  return save.catch((err: string) => {
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

function ProjectProvider({ children }: Readonly<ProjectProviderProps>) {
  const { loggedIn, user } = useUserState();
  const initialState: ProjectState = {
    selectedProjectId: null,
    projectList: [],
    projectEditState: DEFAULT_PROJECT_EDIT_STATE,
    favoriteProjectIds: [],
    // a signed-in user's list is on its way from the first render
    loading: loggedIn,
    loadFailed: false,
  };

  const userId = loggedIn ? user?.id : undefined;
  const [state, dispatch] = useReducer(projectReducer, initialState);
  const { enqueueSnackbar } = useSnackbar();

  // a layout effect, so a login shows the loading state, not an empty list
  useLayoutEffect(() => {
    if (loggedIn) {
      getProjectList(dispatch).catch((err: string) =>
        enqueueSnackbar(err, {
          variant: "error",
        }),
      );
    }
  }, [enqueueSnackbar, loggedIn]);

  // An API older than this frontend has no favourites and answers 404; the lists work without them
  useEffect(() => {
    if (!userId) {
      dispatch({ type: "favorites", payload: [] });
      return;
    }
    const guard = staleGuard();
    projectsService
      .getFavorites()
      .then((ids) => {
        if (guard.isCurrent()) {
          dispatch({ type: "favorites", payload: ids });
        }
      })
      .catch(() => {
        if (guard.isCurrent()) {
          dispatch({ type: "favorites", payload: [] });
        }
      });
    return guard.cancel;
  }, [userId]);

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
  useSelectedProject,
  useProjectMissing,
  useNoiseAnalysisAvailable,
  useProjectDispatch,
  createProject,
  updateProject,
  getProjectList,
  deleteProject,
  selectProject,
  setProjectEditState,
  toggleFavoriteProject,
};
