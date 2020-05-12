import React, { FunctionComponent } from "react";
import { MenuItem, Select } from "@material-ui/core";
import {
  useProjectState,
} from "../contexts/project.context";
import { useHistory } from "react-router-dom";

const ProjectSelect: FunctionComponent<{
  selectedId: string | undefined;
}> = ({ selectedId }) => {
  const history = useHistory();
  const projectState = useProjectState();

  const handleProjectSelect = (
    event: React.ChangeEvent<{ value: unknown }>
  ) => {
    const newSelectedProject = projectState.projectList.find(
      (p) => p.id === (event.target.value as string)
    );
    if (newSelectedProject) {
      history.push(newSelectedProject.id);
    }
  };

  return (
    <Select
      id="project-select"
      value={selectedId}
      onChange={handleProjectSelect}
    >
      {projectState.projectList.map((project) => (
        <MenuItem key={project.id} value={project.id}>
          {project.name}
        </MenuItem>
      ))}
    </Select>
  );
};

export default ProjectSelect;
