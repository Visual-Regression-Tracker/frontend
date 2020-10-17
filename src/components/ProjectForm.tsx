import React from "react";
import { TextField } from "@material-ui/core";

interface IProps {
  projectState: [
    {
      id: string;
      name: string;
      mainBranchName: string;
    },
    React.Dispatch<
      React.SetStateAction<{
        id: string;
        name: string;
        mainBranchName: string;
      }>
    >
  ];
}

export const ProjectForm: React.FunctionComponent<IProps> = ({
  projectState,
}) => {
  const [project, setProject] = projectState;

  return (
    <React.Fragment>
      <TextField
        autoFocus
        margin="dense"
        id="name"
        label="Project name"
        type="text"
        fullWidth
        value={project.name}
        onChange={(event) =>
          setProject({
            ...project,
            name: event.target.value,
          })
        }
      />
      <TextField
        margin="dense"
        id="branchName"
        label="Main branch"
        type="text"
        fullWidth
        value={project.mainBranchName}
        onChange={(event) =>
          setProject({
            ...project,
            mainBranchName: event.target.value,
          })
        }
      />
    </React.Fragment>
  );
};
