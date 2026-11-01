import { type ReactNode, useRef, useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
} from "@mui/material";
import { ValidatorForm } from "react-material-ui-form-validator";

interface IProps {
  open: boolean;
  title: string;
  content: ReactNode;
  submitButtonText: string;
  onSubmit: () => void | Promise<unknown>;
  onCancel: () => void;
}

export const BaseModal = ({
  open,
  title,
  submitButtonText,
  content,
  onSubmit,
  onCancel,
}: IProps) => {
  const [submitting, setSubmitting] = useState(false);
  // state lags a render behind; a second submit in between needs the ref
  const submittingRef = useRef(false);

  const handleSubmit = () => {
    if (submittingRef.current) {
      return;
    }
    const result = onSubmit();
    if (result instanceof Promise) {
      submittingRef.current = true;
      setSubmitting(true);
      const settle = () => {
        submittingRef.current = false;
        setSubmitting(false);
      };
      result.then(settle, settle);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onCancel}
      aria-labelledby="form-dialog-title"
      fullWidth
    >
      <DialogTitle id="form-dialog-title">{title}</DialogTitle>
      <ValidatorForm onSubmit={handleSubmit} instantValidate>
        <DialogContent>{content}</DialogContent>
        <DialogActions>
          <Button onClick={onCancel} color="primary">
            Cancel
          </Button>
          <Button
            type="submit"
            color="primary"
            data-testid="submitButton"
            disabled={submitting}
          >
            {submitButtonText}
          </Button>
        </DialogActions>
      </ValidatorForm>
    </Dialog>
  );
};
