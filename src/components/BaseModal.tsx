import { type ReactNode, useRef, useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
} from "@mui/material";
import { ValidatedForm } from "./ValidatedForm";

interface IProps {
  open: boolean;
  title: string;
  content: ReactNode;
  submitButtonText: string;
  submitColor?: "primary" | "error";
  onSubmit: () => void | Promise<unknown>;
  onCancel: () => void;
}

export const BaseModal = ({
  open,
  title,
  submitButtonText,
  submitColor = "primary",
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
      <ValidatedForm onSubmit={handleSubmit}>
        <DialogContent>{content}</DialogContent>
        <DialogActions>
          <Button onClick={onCancel} color="primary">
            Cancel
          </Button>
          <Button
            type="submit"
            color={submitColor}
            data-testid="submitButton"
            disabled={submitting}
          >
            {submitButtonText}
          </Button>
        </DialogActions>
      </ValidatedForm>
    </Dialog>
  );
};
