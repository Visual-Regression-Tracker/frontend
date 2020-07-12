import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  TextField,
  DialogActions,
  Button,
} from "@material-ui/core";

interface IProps {
  open: boolean;
  title: string;
  submitButtonText: string;
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
  onSubmit: () => void;
  onCancel: () => void;
}

export const ProjectModal: React.FunctionComponent<IProps> = ({
  open,
  title,
  submitButtonText,
  projectState,
  onSubmit,
  onCancel,
}) => {
  const [project, setProject] = projectState;

  return (
    <Dialog open={open} onClose={onCancel} aria-labelledby="form-dialog-title">
      <DialogTitle id="form-dialog-title">{title}</DialogTitle>
      <DialogContent>
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
      </DialogContent>
      <DialogActions>
        <Button onClick={onCancel} color="primary">
          Cancel
        </Button>
        <Button onClick={onSubmit} color="primary">
          {submitButtonText}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
