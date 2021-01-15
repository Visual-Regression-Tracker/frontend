import React from "react";
import { TextField } from "@material-ui/core";
import { useState } from "react";

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
  const [nameTouched, setNameTouched] = useState(false);
  const [mainBranchNameTouched, setMainBranchNameTouched] = useState(false);

  const isTextboxNameValid = project.name.length > 1;
  const isTextboxMainBranchNameValid = project.mainBranchName.length > 1;

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
        error={!isTextboxNameValid && nameTouched}
        helperText={
          !isTextboxNameValid && nameTouched
            ? "Enter at least 2 character."
            : ""
        }
        onChange={(event) => {
          setProject({
            ...project,
            name: event.target.value,
          });
          setNameTouched(true);
        }}
      />
      <TextField
        margin="dense"
        id="branchName"
        label="Main branch"
        type="text"
        fullWidth
        value={project.mainBranchName}
        error={!isTextboxMainBranchNameValid && mainBranchNameTouched}
        helperText={
          !isTextboxMainBranchNameValid && mainBranchNameTouched
            ? "Enter at least 2 character."
            : ""
        }
        onChange={(event) => {
          setProject({
            ...project,
            mainBranchName: event.target.value,
          });
          setMainBranchNameTouched(true);
        }}
      />
    </React.Fragment>
  );
};
