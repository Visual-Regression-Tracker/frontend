import { useState } from "react";
import { Button } from "@mui/material";
import {
  closeSnackbar,
  OptionsObject,
  ProviderContext,
  SnackbarKey,
} from "notistack";
import { ReviewDecision, testRunService } from "../services";
import { DismissNotificationButton } from "./DismissNotificationButton";

const UNDO_HIDE_DURATION = 6000;

interface UndoOptions {
  ids: string[];
  decision: ReviewDecision;
  undoneText: string;
  enqueueSnackbar: ProviderContext["enqueueSnackbar"];
  onUndone?: () => void;
}

const RUN_PREFIX = /^Test run \S+: /;

const withoutRunPrefix = (message: string) => {
  if (typeof message !== "string" || !RUN_PREFIX.test(message)) {
    return message;
  }
  const rest = message.replace(RUN_PREFIX, "");
  return rest.charAt(0).toUpperCase() + rest.slice(1);
};

export const revertDecision = ({
  ids,
  decision,
  undoneText,
  enqueueSnackbar,
  onUndone,
}: UndoOptions) =>
  testRunService
    .revert(ids, decision)
    .then(() => {
      onUndone?.();
      enqueueSnackbar(undoneText, { variant: "info" });
    })
    .catch((err: string) =>
      enqueueSnackbar(withoutRunPrefix(err), { variant: "error" }),
    );

const UndoSnackbarAction = ({
  snackbarKey,
  ids,
  decision,
  undoneText,
  enqueueSnackbar,
  onUndone,
}: UndoOptions & { snackbarKey: SnackbarKey }) => {
  // the toast stays clickable while it fades out
  const [undoing, setUndoing] = useState(false);

  const undo = () => {
    setUndoing(true);
    closeSnackbar(snackbarKey);
    void revertDecision({
      ids,
      decision,
      undoneText,
      enqueueSnackbar,
      onUndone,
    });
  };

  return (
    <>
      <Button color="inherit" size="small" onClick={undo} disabled={undoing}>
        Undo
      </Button>
      <DismissNotificationButton snackbarKey={snackbarKey} />
    </>
  );
};

export const undoSnackbarOptions = (options: UndoOptions): OptionsObject =>
  options.ids.length === 0
    ? {}
    : {
        autoHideDuration: UNDO_HIDE_DURATION,
        action: (key) => <UndoSnackbarAction snackbarKey={key} {...options} />,
      };
