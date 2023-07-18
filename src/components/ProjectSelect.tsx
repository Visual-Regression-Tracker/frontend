import React, { FunctionComponent } from "react";
import { styled } from '@mui/material/styles';
import {
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  type SelectChangeEvent,
} from "@mui/material";
import {
  useProjectState,
  useProjectDispatch,
  selectProject,
} from "../contexts";

const PREFIX = 'ProjectSelect';

const classes = {
  formControl: `${PREFIX}-formControl`,
  input: `${PREFIX}-input`
};

// TODO jss-to-styled codemod: The Fragment root was replaced by div. Change the tag if needed.
const Root = styled('div')((
  {
    theme
  }
) => ({
  [`& .${classes.formControl}`]: {
    width: "100%",
  },

  [`& .${classes.input}`]: {
    margin: theme.spacing(1),
  }
}));

const ProjectSelect: FunctionComponent<{
  projectId?: string;
  onProjectSelect: (id: string) => void;
}> = ({ projectId, onProjectSelect }) => {

  const { projectList, selectedProjectId } = useProjectState();
  const projectDispatch = useProjectDispatch();

  React.useEffect(() => {
    if (projectId && projectId !== selectedProjectId) {
      selectProject(projectDispatch, projectId);
    }
  }, [projectId, selectedProjectId, projectDispatch]);

  return (
    <Root>
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
    </Root>
  );
};

export default ProjectSelect;
