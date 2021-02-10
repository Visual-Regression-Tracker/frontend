import React from "react";
import { Typography, IconButton } from "@material-ui/core";
import { BaseComponentProps } from "@material-ui/data-grid";
import { deleteTestRun, useTestRunDispatch } from "../../contexts";
import { BaseModal } from "../BaseModal";
import { useSnackbar } from "notistack";
import { Delete } from "@material-ui/icons";

export const BulkDeleteButton: React.FunctionComponent<BaseComponentProps> = (
  props: BaseComponentProps
) => {
  const { enqueueSnackbar } = useSnackbar();
  const testRunDispatch = useTestRunDispatch();
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
          Promise.all(
            Object.keys(rows).map((id: string) =>
              deleteTestRun(testRunDispatch, id)
            )
          )
            .then(() => {
              toggleDeleteDialogOpen();
              enqueueSnackbar(`${count} items deleted`, {
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
