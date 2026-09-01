import { useCallback } from "react";
import { OptionsObject, SnackbarMessage, useSnackbar } from "notistack";

/**
 * `useSnackbar`, but anchored to the top.
 *
 * The app anchors toasts bottom-centre, which on the test run list is the one
 * strip clear of both paginations. This dialog is fullscreen and puts its
 * approve/reject bar in exactly that spot, so a toast raised here lands on the
 * buttons — and since a toast lives five seconds while a screen now takes
 * about two to review, "Approve variations" stayed covered until the reviewer
 * dismissed it by hand, every single screen.
 *
 * Callers may still override the anchor per message.
 */
export const useDialogSnackbar = () => {
  const { enqueueSnackbar, closeSnackbar } = useSnackbar();

  const enqueue = useCallback(
    (message: SnackbarMessage, options?: OptionsObject) =>
      enqueueSnackbar(message, {
        anchorOrigin: { vertical: "top", horizontal: "center" },
        ...options,
      }),
    [enqueueSnackbar],
  );

  return { enqueueSnackbar: enqueue, closeSnackbar };
};
