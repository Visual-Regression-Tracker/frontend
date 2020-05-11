import React, { FunctionComponent } from "react";
import { MenuItem, Select } from "@material-ui/core";
import {
  useProjectState,
  useProjectDispatch,
  selectProject,
} from "../contexts/project.context";
import { Project } from "../types";

const ProjectSelect: FunctionComponent = () => {
  const projectState = useProjectState();
  const projectDispatch = useProjectDispatch();

  const [selectedProject, setSelectedProject] = React.useState<
    Project | undefined
  >(projectState.selectedProject);

  React.useEffect(() => {
    setSelectedProject(projectState.selectedProject);
  }, [projectState.selectedProject]);

  const handleProjectSelect = (
    event: React.ChangeEvent<{ value: unknown }>
  ) => {
    const newSelectedProject = projectState.projectList.find(
      (p) => p.id === (event.target.value as string)
    );
    if (newSelectedProject) {
      selectProject(projectDispatch, newSelectedProject);
    }
  };

  return (
    <Select
      id="project-select"
      value={selectedProject?.id}
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
