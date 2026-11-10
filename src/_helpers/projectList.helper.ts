import { Project } from "../types";

interface ProjectGroups {
  favorites: Project[];
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

/** Favourites, then the rest, each by name. */
export const groupProjects = (
  projects: Project[],
  favoriteIds: string[],
): ProjectGroups => {
  const favoriteIdSet = new Set(favoriteIds);
  const sorted = [...projects].sort(byName);

  return {
    favorites: sorted.filter((project) => favoriteIdSet.has(project.id)),
    others: sorted.filter((project) => !favoriteIdSet.has(project.id)),
  };
};

interface ProjectSection {
  title: string;
  projects: Project[];
}

/** The groups as titled sections; `titled` is false when only "Other projects" would show. */
export const projectSections = (
  projects: Project[],
  favoriteIds: string[],
): { sections: ProjectSection[]; titled: boolean } => {
  const { favorites, others } = groupProjects(projects, favoriteIds);

  return {
    sections: [
      { title: "Favourites", projects: favorites },
      { title: "Other projects", projects: others },
    ],
    titled: favorites.length > 0,
  };
};
