import React, { FunctionComponent } from "react";
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
    <>
      {projectList.length > 0 && (
        <FormControl variant="standard" sx={{width: "100%"}}>
          <InputLabel id="projectSelect" shrink>
            Project
          </InputLabel>
          <Select
            variant="standard"
            id="project-select"
            labelId="projectSelect"
            displayEmpty
            sx={{m: "16px"}}
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
