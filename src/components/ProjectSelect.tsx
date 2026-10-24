import React, { FunctionComponent } from "react";
import { Autocomplete, Box, ListSubheader, TextField } from "@mui/material";
import {
  useProjectState,
  useProjectDispatch,
  selectProject,
} from "../contexts";
import {
  groupProjects,
  matchesProjectQuery,
} from "../_helpers/projectList.helper";
import { Project } from "../types";

const ProjectSelect: FunctionComponent<{
  projectId?: string;
  onProjectSelect: (id: string) => void;
}> = ({ projectId, onProjectSelect }) => {
  const {
    projectList,
    selectedProjectId,
    favoriteProjectIds,
    recentProjectIds,
  } = useProjectState();
  const projectDispatch = useProjectDispatch();

  React.useEffect(() => {
    if (projectId && projectId !== selectedProjectId) {
      selectProject(projectDispatch, projectId);
    }
  }, [projectId, selectedProjectId, projectDispatch]);

  // the same order as the project list: favourites, recently opened, the rest
  const { options, groupOf } = React.useMemo(() => {
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
    // with nothing starred or opened the list is one run without a heading
    if (groups.favorites.length + groups.recent.length === 0) {
      groupOf.clear();
    }

    return { options, groupOf };
  }, [projectList, favoriteProjectIds, recentProjectIds]);

  const selected = projectList.find(
    (project) => project.id === selectedProjectId,
  );

  if (projectList.length === 0) {
    return null;
  }

  return (
    <Autocomplete<Project, false, true>
      id="project-select"
      options={options}
      // the selection is changed, never cleared; until the first one there is
      // nothing to show, which the field takes as null
      disableClearable
      value={selected ?? (null as unknown as Project)}
      onChange={(_, project) => onProjectSelect(project.id)}
      getOptionLabel={(project) => project.name}
      isOptionEqualToValue={(option, value) => option.id === value.id}
      // always grouping: switching groupBy on while the list is open (the
      // first project picked becomes a recent one) breaks the list
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
          <React.Fragment key={params.key}>{params.children}</React.Fragment>
        )
      }
      filterOptions={(projects, { inputValue }) =>
        projects.filter((project) => matchesProjectQuery(project, inputValue))
      }
      noOptionsText="No projects match"
      // a long name reads in the list, not cut off at the field's width
      slotProps={{ popper: { sx: { minWidth: 280 } } }}
      // no top margin: the label sits at the top, where the select this
      // replaced had it, and the field keeps its inset below and at the sides
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
