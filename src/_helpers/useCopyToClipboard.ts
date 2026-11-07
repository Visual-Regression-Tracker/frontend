import { useSnackbar } from "notistack";

export const useCopyToClipboard = () => {
  const { enqueueSnackbar } = useSnackbar();

  return (text: string, copiedMessage: string, failedMessage: string) => {
    Promise.resolve()
      .then(() => navigator.clipboard.writeText(text))
      .then(
        () => enqueueSnackbar(copiedMessage, { variant: "success" }),
        () => enqueueSnackbar(failedMessage, { variant: "error" }),
      );
  };
};
