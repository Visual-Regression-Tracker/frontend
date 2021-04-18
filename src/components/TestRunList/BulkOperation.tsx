import React from "react";
import { Typography, IconButton, Tooltip } from "@material-ui/core";
import { BaseComponentProps, RowModel } from "@material-ui/data-grid";
import { BaseModal } from "../BaseModal";
import { useSnackbar } from "notistack";
import { Delete, ThumbDown, ThumbUp } from "@material-ui/icons";
import { testRunService } from "../../services";
import { TestStatus } from "../../types";

export const BulkOperation: React.FunctionComponent<BaseComponentProps> = (
  props: BaseComponentProps
) => {
  const { enqueueSnackbar } = useSnackbar();
  const [approveDialogOpen, setApproveDialogOpen] = React.useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = React.useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);

  const rows: Record<React.ReactText, boolean> = props.state.selection;
  const count = Object.keys(rows).length;

  const toggleApproveDialogOpen = () => {
    setApproveDialogOpen(!approveDialogOpen);
  };
  const toggleRejectDialogOpen = () => {
    setRejectDialogOpen(!rejectDialogOpen);
  };
  const toggleDeleteDialogOpen = () => {
    setDeleteDialogOpen(!deleteDialogOpen);
  };

  const getTitle = () => {
    return submitButtonText() + " Test Runs";
  };

  const submitButtonText = (): string => {
    if (deleteDialogOpen) {
      return "Delete";
    }
    if (approveDialogOpen) {
      return "Approve";
    }
    if (rejectDialogOpen) {
      return "Reject";
    }
    return "";
  };

  const closeModal = () => {
    if (deleteDialogOpen) {
      return toggleDeleteDialogOpen();
    }
    if (approveDialogOpen) {
      return toggleApproveDialogOpen();
    }
    if (rejectDialogOpen) {
      return toggleRejectDialogOpen();
    }
  };

  const isRowEligibleForApproveOrReject = (id: string) => {
    //Find the test status of the current row
    let currentRow: any = props.rows.find((value: RowModel) => value.id.toString().includes(id));
    let currentRowStatus = JSON.stringify(currentRow.status);
    //In line with how we can approve/reject only new and unresolved from details modal.
    return (currentRowStatus.includes(TestStatus.new) || currentRowStatus.includes(TestStatus.unresolved));
  };

  const processAction = (id: string) => {
    if (deleteDialogOpen) {
      testRunService.remove(id);
    }
    if (isRowEligibleForApproveOrReject(id)) {
      processApproveReject(id);
    }
  };

  const processApproveReject = (id: string) => {
    if (approveDialogOpen) {
      testRunService.approve(id, false);
    }
    if (rejectDialogOpen) {
      testRunService.reject(id);
    }
  };

  const dismissDialog = () => {
    if (deleteDialogOpen) {
      return toggleDeleteDialogOpen();
    }
    if (approveDialogOpen) {
      return toggleApproveDialogOpen();
    }
    return toggleRejectDialogOpen();
  };

  return (
    <>
      <Tooltip title="Approve unresolved in selected rows." aria-label="approve">
        <span>
          <IconButton disabled={count === 0} onClick={toggleApproveDialogOpen}>
            <ThumbUp />
          </IconButton>
        </span>
      </Tooltip>
      <Tooltip title="Reject unresolved in selected rows." aria-label="reject">
        <span>
          <IconButton disabled={count === 0} onClick={toggleRejectDialogOpen}>
            <ThumbDown />
          </IconButton>
        </span>
      </Tooltip>
      <Tooltip title="Delete selected rows." aria-label="delete">
        <span>
          <IconButton disabled={count === 0} onClick={toggleDeleteDialogOpen}>
            <Delete />
          </IconButton>
        </span>
      </Tooltip>

      <BaseModal
        open={deleteDialogOpen || approveDialogOpen || rejectDialogOpen}
        title={getTitle()}
        submitButtonText={submitButtonText()}
        onCancel={dismissDialog}
        content={
          <Typography>{`Are you sure you want to ${submitButtonText().toLowerCase()} ${count} items?`}</Typography>
        }
        onSubmit={() => {
          enqueueSnackbar(
            "Wait for the confirmation message until operation is completed.",
            {
              variant: "info",
            }
          );

          Promise.all(
            Object.keys(rows).map((id: string) => processAction(id))
          )
            .then(() => {
              enqueueSnackbar(`${count} test runs processed.`, {
                variant: "success",
              });
            })
            .catch((err) =>
              enqueueSnackbar(err, {
                variant: "error",
              })
            );
          closeModal();
        }}
      />
    </>
  );
};
