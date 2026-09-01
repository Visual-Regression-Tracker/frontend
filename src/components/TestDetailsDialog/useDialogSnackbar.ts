import { useCallback, useRef } from "react";
import {
  OptionsObject,
  SnackbarKey,
  SnackbarMessage,
  useSnackbar,
} from "notistack";

/**
 * `useSnackbar` for the details dialog: anchored to the top, and showing one
 * confirmation at a time.
 *
 * The app anchors toasts bottom-centre, which on the test run list is the one
 * strip clear of both paginations. This dialog is fullscreen and puts its
 * approve/reject bar in exactly that spot, so a toast raised here would land on
 * the buttons the reviewer is about to press.
 *
 * Reviewing a screen now takes a couple of seconds and a toast lives five, so
 * approving one after another piled them up over the checkpoint's header.
 * Confirmations are interchangeable — the reviewer only needs to know the last
 * action went through — so a new one takes the place of the one before it.
 * Errors are never replaced: a failure must not be swallowed by whatever the
 * reviewer happens to do next.
 *
 * Callers may still override the anchor per message.
 */
export const useDialogSnackbar = () => {
  const { enqueueSnackbar, closeSnackbar } = useSnackbar();
  const lastConfirmation = useRef<SnackbarKey | null>(null);

  const enqueue = useCallback(
    (message: SnackbarMessage, options?: OptionsObject) => {
      const isConfirmation = options?.variant === "success";
      if (isConfirmation && lastConfirmation.current !== null) {
        // a no-op once that toast has timed out on its own
        closeSnackbar(lastConfirmation.current);
      }

      const key = enqueueSnackbar(message, {
        anchorOrigin: { vertical: "top", horizontal: "center" },
        // notistack's five seconds outlives the screen a confirmation belongs
        // to, so one sat over the header permanently. Errors keep the default:
        // they are worth reading, and there is no next screen waiting on them.
        ...(isConfirmation ? { autoHideDuration: 2000 } : {}),
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
