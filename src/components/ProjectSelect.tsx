import { Fragment, useEffect, useMemo } from "react";
import { Autocomplete, Box, ListSubheader, TextField } from "@mui/material";
import {
  useProjectState,
  useSelectedProject,
  useProjectDispatch,
  selectProject,
} from "../contexts";
import {
  matchesProjectQuery,
  projectSections,
} from "../_helpers/projectList.helper";
import { Project } from "../types";

const ProjectSelect = ({
  projectId,
  onProjectSelect,
  variant = "standard",
  flush = false,
}: {
  projectId?: string;
  onProjectSelect: (id: string) => void;
  variant?: "standard" | "outlined";
  flush?: boolean;
}) => {
  const { projectList, selectedProjectId, favoriteProjectIds } =
    useProjectState();
  const projectDispatch = useProjectDispatch();

  useEffect(() => {
    if (projectId && projectId !== selectedProjectId) {
      selectProject(projectDispatch, projectId);
    }
  }, [projectId, selectedProjectId, projectDispatch]);

  const { options, groupOf } = useMemo(() => {
    const { sections, titled } = projectSections(
      projectList,
      favoriteProjectIds,
    );
    const groupOf = new Map<string, string>(
      titled
        ? sections.flatMap(({ title, projects }) =>
            projects.map((p) => [p.id, title] as const),
          )
        : [],
    );
    const options = sections.flatMap(({ projects }) => projects);

    return { options, groupOf };
  }, [projectList, favoriteProjectIds]);

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
      sx={flush ? undefined : { mx: 1, mb: 1 }}
      renderInput={(params) => (
        <TextField
          {...params}
          variant={variant}
          label="Project"
          placeholder="Select project"
          slotProps={{
            ...params.slotProps,
            inputLabel: { ...params.slotProps.inputLabel, shrink: true },
          }}
        />
      )}
    />
  );
};

export default ProjectSelect;
