import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
} from "@material-ui/core";
import { ValidatorForm } from "react-material-ui-form-validator";

interface IProps {
  open: boolean;
  title: string;
  content: React.ReactNode;
  submitButtonText: string;
  onSubmit: () => void;
  onCancel: () => void;
}

export const BaseModal: React.FunctionComponent<IProps> = ({
  open,
  title,
  submitButtonText,
  content,
  onSubmit,
  onCancel,
}) => {
  return (
    <Dialog
      open={open}
      onClose={onCancel}
      aria-labelledby="form-dialog-title"
      fullWidth
    >
      <DialogTitle id="form-dialog-title">{title}</DialogTitle>
      <ValidatorForm onSubmit={onSubmit} instantValidate>
        <DialogContent>{content}</DialogContent>
        <DialogActions>
          <Button onClick={onCancel} color="primary">
            Cancel
          </Button>
          <Button
            type="submit"
            color="primary"
            data-testId="submitButton"
          >
            {submitButtonText}
          </Button>
        </DialogActions>
      </ValidatorForm>
    </Dialog>
  );
};
