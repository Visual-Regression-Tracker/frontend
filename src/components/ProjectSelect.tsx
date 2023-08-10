import React, { FunctionComponent } from "react";
import { makeStyles, createStyles } from '@mui/styles';
import {
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  type Theme,
  type SelectChangeEvent,
} from "@mui/material";
import {
  useProjectState,
  useProjectDispatch,
  selectProject,
} from "../contexts";

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    formControl: {
      width: "100%",
    },
    input: {
      margin: theme.spacing(1),
    },
  }),
);

const ProjectSelect: FunctionComponent<{
  projectId?: string;
  onProjectSelect: (id: string) => void;
}> = ({ projectId, onProjectSelect }) => {
  const classes = useStyles();
  const { projectList, selectedProjectId } = useProjectState();
  const projectDispatch = useProjectDispatch();

  React.useEffect(() => {
    if (projectId && projectId !== selectedProjectId) {
      selectProject(projectDispatch, projectId);
    }
  }, [projectId, selectedProjectId, projectDispatch]);

  return (
    <>
      {projectList.length > 0 && (
        <FormControl variant="standard" className={classes.formControl}>
          <InputLabel id="projectSelect" shrink>
            Project
          </InputLabel>
          <Select
            variant="standard"
            id="project-select"
            labelId="projectSelect"
            className={classes.input}
            displayEmpty
            value={selectedProjectId ?? ""}
            onChange={(event: SelectChangeEvent<HTMLInputElement>) =>
              onProjectSelect(event.target.value as string)
            }
          >
            <MenuItem value="" disabled>
              <em>Select project</em>
            </MenuItem>
            {projectList.map((project) => (
              <MenuItem key={project.id} value={project.id}>
                {project.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      )}
    </>
  );
};

export default ProjectSelect;
