import { useCallback, useRef } from "react";
import {
  OptionsObject,
  SnackbarKey,
  SnackbarMessage,
  useSnackbar,
} from "notistack";

/** Top-centre, clear of the approve/reject bar; a confirmation replaces the last one, errors never do. */
export const useDialogSnackbar = () => {
  const { enqueueSnackbar, closeSnackbar } = useSnackbar();
  const lastConfirmation = useRef<SnackbarKey | null>(null);

  const enqueue = useCallback(
    (message: SnackbarMessage, options?: OptionsObject) => {
      const isConfirmation = options?.variant !== "error";
      if (isConfirmation && lastConfirmation.current !== null) {
        closeSnackbar(lastConfirmation.current);
      }

      // shorter than a screen's review; errors keep the default to be read, and a toast with an action keeps its own time
      const isShort = isConfirmation && !options?.action;
      const key = enqueueSnackbar(message, {
        anchorOrigin: { vertical: "top", horizontal: "center" },
        ...(isShort ? { autoHideDuration: 2000 } : {}),
        ...options,
      });

      if (isConfirmation) {
        lastConfirmation.current = key;
      }
      return key;
    },
    [enqueueSnackbar, closeSnackbar],
  );

  return { enqueueSnackbar: enqueue, closeSnackbar };
};
