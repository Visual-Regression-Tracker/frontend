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
    .catch((err: string) => enqueueSnackbar(err, { variant: "error" }));

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
