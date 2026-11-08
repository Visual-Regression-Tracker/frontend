import type { Project, ProjectDto } from "../types";

export type ProjectAction =
  | { type: "setProjectEditState"; payload: ProjectDto }
  | { type: "request" }
  | { type: "failure" }
  | { type: "get"; payload: Project[] }
  | { type: "select"; payload: string }
  | { type: "create"; payload: Project }
  | { type: "delete"; payload: string }
  | { type: "update"; payload: Project }
  | { type: "favorites"; payload: string[] }
  | { type: "favorite"; payload: { id: string; favorite: boolean } }
  | { type: "recent"; payload: string[] };
export type ProjectState = {
  selectedProjectId: string | null;
  projectEditState: ProjectDto;
  projectList: Project[];
  // the signed-in user's own, kept by the API
  favoriteProjectIds: string[];
  // opened last first, kept in this browser
  recentProjectIds: string[];
  loading: boolean;
};

export function projectReducer(
  state: ProjectState,
  action: ProjectAction,
): ProjectState {
  switch (action.type) {
    case "request":
      return {
        ...state,
        loading: true,
      };

    case "failure":
      return {
        ...state,
        loading: false,
      };

    case "get":
      return {
        ...state,
        projectList: action.payload,
        loading: false,
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
