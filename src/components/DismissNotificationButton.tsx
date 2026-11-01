import { IconButton } from "@mui/material";
import { Close } from "@mui/icons-material";
import { closeSnackbar, SnackbarKey } from "notistack";

export const DismissNotificationButton = ({
  snackbarKey,
}: {
  snackbarKey: SnackbarKey;
}) => (
  <IconButton
    size="small"
    color="inherit"
    aria-label="Dismiss notification"
    onClick={() => closeSnackbar(snackbarKey)}
    data-testid="dismissNotification"
  >
    <Close data-testid="CloseIcon" fontSize="small" />
  </IconButton>
);
