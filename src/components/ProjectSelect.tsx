import { Fragment, useEffect, useMemo } from "react";
import { Autocomplete, Box, ListSubheader, TextField } from "@mui/material";
import {
  useProjectState,
  useSelectedProject,
  useProjectDispatch,
  selectProject,
} from "../contexts";
import {
  groupProjects,
  matchesProjectQuery,
} from "../_helpers/projectList.helper";
import { Project } from "../types";

const ProjectSelect = ({
  projectId,
  onProjectSelect,
}: {
  projectId?: string;
  onProjectSelect: (id: string) => void;
}) => {
  const {
    projectList,
    selectedProjectId,
    favoriteProjectIds,
    recentProjectIds,
  } = useProjectState();
  const projectDispatch = useProjectDispatch();

  useEffect(() => {
    if (projectId && projectId !== selectedProjectId) {
      selectProject(projectDispatch, projectId);
    }
  }, [projectId, selectedProjectId, projectDispatch]);

  const { options, groupOf } = useMemo(() => {
    const groups = groupProjects(
      projectList,
      favoriteProjectIds,
      recentProjectIds,
    );
    const groupOf = new Map<string, string>([
      ...groups.favorites.map((p) => [p.id, "Favourites"] as const),
      ...groups.recent.map((p) => [p.id, "Recently opened"] as const),
      ...groups.others.map((p) => [p.id, "Other projects"] as const),
    ]);
    const options = [...groups.favorites, ...groups.recent, ...groups.others];
    if (groups.favorites.length + groups.recent.length === 0) {
      groupOf.clear();
    }

    return { options, groupOf };
  }, [projectList, favoriteProjectIds, recentProjectIds]);

  const selected = useSelectedProject();

  if (projectList.length === 0) {
    return null;
  }

  return (
    <Autocomplete<Project, false, true>
      id="project-select"
      options={options}
      // never cleared; before the first selection the field takes null
      disableClearable
      value={selected ?? (null as unknown as Project)}
      onChange={(_, project) => onProjectSelect(project.id)}
      getOptionLabel={(project) => project.name}
      isOptionEqualToValue={(option, value) => option.id === value.id}
      // always grouping: toggling groupBy while the list is open breaks it
      groupBy={(project) => groupOf.get(project.id) ?? ""}
      renderGroup={(params) =>
        params.group ? (
          <li key={params.key}>
            <ListSubheader component="div">{params.group}</ListSubheader>
            <Box component="ul" sx={{ p: 0 }}>
              {params.children}
            </Box>
          </li>
        ) : (
          <Fragment key={params.key}>{params.children}</Fragment>
        )
      }
      filterOptions={(projects, { inputValue }) =>
        projects.filter((project) => matchesProjectQuery(project, inputValue))
      }
      noOptionsText="No projects match"
      slotProps={{ popper: { sx: { minWidth: 280 } } }}
      sx={{ mx: 1, mb: 1 }}
      renderInput={(params) => (
        <TextField
          {...params}
          variant="standard"
          label="Project"
          placeholder="Select project"
          slotProps={{ inputLabel: { shrink: true } }}
        />
      )}
    />
  );
};

export default ProjectSelect;
