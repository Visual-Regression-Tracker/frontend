import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
} from "@material-ui/core";

interface IProps {
  open: boolean;
  title: string;
  content: React.ReactNode;
  submitButtonText: string;
  isDisabled :boolean;
  onSubmit: () => void;
  onCancel: () => void;
}

export const BaseModal: React.FunctionComponent<IProps> = ({
  open,
  title,
  submitButtonText,
  content,
  isDisabled,
  onSubmit,
  onCancel
}) => {
  return (
    <Dialog open={open} onClose={onCancel} aria-labelledby="form-dialog-title">
      <DialogTitle id="form-dialog-title">{title}</DialogTitle>
      <DialogContent>{content}</DialogContent>
      <DialogActions>
        <Button onClick={onCancel} color="primary">
          Cancel
        </Button>
        <Button onClick={onSubmit} color="primary"
         disabled={isDisabled}>
          {submitButtonText}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
