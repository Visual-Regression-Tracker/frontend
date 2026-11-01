import { RECENT_PROJECTS_KEY } from "../constants";
import { Project } from "../types";

export const RECENT_PROJECTS_LIMIT = 5;

export interface ProjectGroups {
  favorites: Project[];
  recent: Project[];
  others: Project[];
}

export const matchesProjectQuery = (project: Project, query: string) => {
  const needle = query.trim().toLowerCase();

  return (
    !needle ||
    [project.name, project.id, project.mainBranchName].some((value) =>
      value?.toLowerCase().includes(needle),
    )
  );
};

const byName = (a: Project, b: Project) => a.name.localeCompare(b.name);

/** Favourites by name, recent in opening order, the rest by name; each project appears once. */
export const groupProjects = (
  projects: Project[],
  favoriteIds: string[],
  recentIds: string[],
): ProjectGroups => {
  const byId = new Map(projects.map((project) => [project.id, project]));
  const favoriteIdSet = new Set(favoriteIds);

  const favorites = projects
    .filter((project) => favoriteIdSet.has(project.id))
    .sort(byName);
  const recent = recentIds
    .filter((id) => !favoriteIdSet.has(id))
    .map((id) => byId.get(id))
    .filter((project): project is Project => !!project);
  const shown = new Set([...favorites, ...recent].map((project) => project.id));
  const others = projects
    .filter((project) => !shown.has(project.id))
    .sort(byName);

  return { favorites, recent, others };
};

const storageKey = (userId: string) => `${RECENT_PROJECTS_KEY}:${userId}`;

// storage can be blocked or full (private windows); the list is a convenience, so it degrades to empty
export const readRecentProjectIds = (userId: string): string[] => {
  try {
    const ids: unknown = JSON.parse(
      localStorage.getItem(storageKey(userId)) ?? "[]",
    );

    return Array.isArray(ids)
      ? ids.filter((id): id is string => typeof id === "string")
      : [];
  } catch {
    return [];
  }
};

export const rememberRecentProject = (
  userId: string,
  projectId: string,
): string[] => {
  const ids = [
    projectId,
    ...readRecentProjectIds(userId).filter((id) => id !== projectId),
  ].slice(0, RECENT_PROJECTS_LIMIT);

  try {
    localStorage.setItem(storageKey(userId), JSON.stringify(ids));
  } catch {
    // kept for this session only
  }
  return ids;
};
