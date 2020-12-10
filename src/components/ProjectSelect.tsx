import React, { FunctionComponent } from "react";
import {
  createStyles,
  FormControl,
  InputLabel,
  makeStyles,
  MenuItem,
  Select,
  Theme,
} from "@material-ui/core";
import { useProjectState } from "../contexts";

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    formControl: {
      margin: theme.spacing(1),
      minWidth: 120,
    },
    selectEmpty: {
      marginTop: theme.spacing(2),
    },
  })
);

const ProjectSelect: FunctionComponent<{
  onProjectSelect: (id: string) => void;
}> = ({ onProjectSelect }) => {
  const classes = useStyles();
  const { projectList, selectedProjectId } = useProjectState();

  return (
    <React.Fragment>
      {projectList.length > 0 && (
        <FormControl className={classes.formControl}>
          <InputLabel id="projectSelect" shrink>
            Project
          </InputLabel>
          <Select
            id="project-select"
            labelId="projectSelect"
            autoWidth
            displayEmpty
            className={classes.selectEmpty}
            value={selectedProjectId ?? ""}
            onChange={(event) => onProjectSelect(event.target.value as string)}
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
    </React.Fragment>
  );
};

export default ProjectSelect;
