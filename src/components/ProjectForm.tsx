import React from "react";
import { TextValidator } from "react-material-ui-form-validator";

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
      <TextValidator
        name="projectName"
        validators={["required", "isAtLeastTwoDigits"]}
        errorMessages={["Required field.", "Enter at least two characters."]}
        margin="dense"
        id="name"
        label="Project name"
        type="text"
        fullWidth
        value={project.name}
        onChange={(event) => {
          setProject({
            ...project,
            name: (event.target as HTMLInputElement).value,
          });
        }}
      />
      <TextValidator
        name="mainBranchName"
        validators={["isAtLeastTwoDigits"]}
        errorMessages={["Enter at least two characters."]}
        margin="dense"
        id="branchName"
        label="Main branch"
        type="text"
        fullWidth
        value={project.mainBranchName}
        onChange={(event) => {
          setProject({
            ...project,
            mainBranchName: (event.target as HTMLInputElement).value,
          });
        }}
      />
    </React.Fragment>
  );
};
