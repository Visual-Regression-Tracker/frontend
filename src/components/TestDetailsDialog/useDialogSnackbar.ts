import { useCallback, useRef } from "react";
import {
  OptionsObject,
  SnackbarKey,
  SnackbarMessage,
  useSnackbar,
} from "notistack";

// errors keep the default time to be read, and a toast with an action keeps its own
const withDefaults = (options?: OptionsObject): OptionsObject => ({
  anchorOrigin: { vertical: "top", horizontal: "center" },
  ...(options?.variant !== "error" &&
    !options?.action && { autoHideDuration: 2000 }),
  ...options,
});

/** Top-centre, clear of the approve/reject bar; a confirmation replaces the last one, errors never do. */
export const useDialogSnackbar = () => {
  const { enqueueSnackbar, closeSnackbar } = useSnackbar();
  const lastConfirmation = useRef<SnackbarKey>(undefined);

  const enqueue = useCallback(
    (message: SnackbarMessage, options?: OptionsObject) => {
      const isConfirmation = options?.variant !== "error";
      if (isConfirmation && lastConfirmation.current !== undefined) {
        closeSnackbar(lastConfirmation.current);
      }
      const key = enqueueSnackbar(message, withDefaults(options));
      if (isConfirmation) {
        lastConfirmation.current = key;
      }
      return key;
    },
    [enqueueSnackbar, closeSnackbar],
  );

  // news about an earlier action must not close the confirmation of a newer one
  const enqueueAside = useCallback(
    (message: SnackbarMessage, options?: OptionsObject) =>
      enqueueSnackbar(message, withDefaults(options)),
    [enqueueSnackbar],
  );

  return { enqueueSnackbar: enqueue, enqueueAside };
};

export type DialogEnqueue = ReturnType<
  typeof useDialogSnackbar
>["enqueueSnackbar"];
