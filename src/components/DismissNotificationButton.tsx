import { IconButton } from "@mui/material";
import { Close } from "@mui/icons-material";
import { closeSnackbar, SnackbarKey } from "notistack";
import { TEST_ID } from "../constants/locators";

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
    data-testid={TEST_ID.dismissNotification}
  >
    <Close data-testid={TEST_ID.closeIcon} fontSize="small" />
  </IconButton>
);
