import React from "react";
import { Typography, IconButton } from "@material-ui/core";
import { BaseComponentProps } from "@material-ui/data-grid";
import { BaseModal } from "../BaseModal";
import { useSnackbar } from "notistack";
import { Delete } from "@material-ui/icons";
import { testRunService } from "../../services";

export const BulkDeleteButton: React.FunctionComponent<BaseComponentProps> = (
  props: BaseComponentProps
) => {
  const { enqueueSnackbar } = useSnackbar();
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const rows: Record<React.ReactText, boolean> = props.state.selection;
  const count = Object.keys(rows).length;

  const toggleDeleteDialogOpen = () => {
    setDeleteDialogOpen(!deleteDialogOpen);
  };
  return (
    <>
      <IconButton disabled={count === 0} onClick={toggleDeleteDialogOpen}>
        <Delete />
      </IconButton>

      <BaseModal
        open={deleteDialogOpen}
        title={"Delete TestRuns"}
        submitButtonText={"Delete"}
        onCancel={toggleDeleteDialogOpen}
        content={
          <Typography>{`Are you sure you want to delete ${count} items?`}</Typography>
        }
        onSubmit={() => {
          enqueueSnackbar(
            "Wait for the confirmation message until BULK delete TestRuns is completed.",
            {
              variant: "info",
            }
          );
          toggleDeleteDialogOpen();

          Promise.all(
            Object.keys(rows).map((id: string) => testRunService.remove(id))
          )
            .then(() => {
              enqueueSnackbar(`${count} TestRuns deleted`, {
                variant: "success",
              });
            })
            .catch((err) =>
              enqueueSnackbar(err, {
                variant: "error",
              })
            );
        }}
      />
    </>
  );
};
