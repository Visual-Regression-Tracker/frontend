import { type ReactNode, useRef, useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  IconButton,
} from "@mui/material";
import { Close } from "@mui/icons-material";
import { ValidatedForm } from "./ValidatedForm";

interface IProps {
  open: boolean;
  title: string;
  content: ReactNode;
  submitButtonText: string;
  submitColor?: "primary" | "error";
  size?: "sm" | "md";
  onSubmit: () => void | Promise<unknown>;
  onCancel: () => void;
}

export const BaseModal = ({
  open,
  title,
  submitButtonText,
  submitColor = "primary",
  size = "sm",
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
      maxWidth={size}
      fullWidth
    >
      <DialogTitle id="form-dialog-title">{title}</DialogTitle>
      <IconButton
        aria-label="Close dialog"
        onClick={onCancel}
        size="small"
        sx={{
          position: "absolute",
          top: 12,
          right: 16,
          color: "text.secondary",
        }}
      >
        <Close fontSize="small" />
      </IconButton>
      <ValidatedForm onSubmit={handleSubmit}>
        <DialogContent>{content}</DialogContent>
        <DialogActions>
          <Button onClick={onCancel} color="inherit">
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
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
