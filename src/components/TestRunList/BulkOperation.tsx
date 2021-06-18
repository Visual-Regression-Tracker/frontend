import React from "react";
import { Typography, IconButton, Tooltip, LinearProgress } from "@material-ui/core";
import { BaseComponentProps, InternalRowsState, RowModel } from "@material-ui/data-grid";
import { BaseModal } from "../BaseModal";
import { useSnackbar } from "notistack";
import { Collections, Delete, LayersClear, ThumbDown, ThumbUp } from "@material-ui/icons";
import { testRunService } from "../../services";
import { TestStatus } from "../../types";
import { IgnoreArea } from "../../types/ignoreArea";

export const BulkOperation: React.FunctionComponent<BaseComponentProps> = (
  props: BaseComponentProps
) => {
  const { enqueueSnackbar } = useSnackbar();
  const [approveDialogOpen, setApproveDialogOpen] = React.useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = React.useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const [applyIgnoreDialogOpen, setApplyIgnoreDialogOpen] = React.useState(false);
  const [clearIgnoreDialogOpen, setClearIgnoreDialogOpen] = React.useState(false);
  const [isProcessing, setIsProcessing] = React.useState(false);

  const allRows: InternalRowsState = props.state.rows;
  const selectedRows: Record<React.ReactText, boolean> = props.state.selection;
  const count = Object.keys(selectedRows).length;

  const toggleApproveDialogOpen = () => {
    setApproveDialogOpen(!approveDialogOpen);
  };
  const toggleRejectDialogOpen = () => {
    setRejectDialogOpen(!rejectDialogOpen);
  };
  const toggleDeleteDialogOpen = () => {
    setDeleteDialogOpen(!deleteDialogOpen);
  };
  const toggleApplyIgnoreDialogOpen = () => {
    setApplyIgnoreDialogOpen(!applyIgnoreDialogOpen);
  };
  const toggleClearIgnoreDialogOpen = () => {
    setClearIgnoreDialogOpen(!clearIgnoreDialogOpen);
  };

  const getTitle = () => {
    if (applyIgnoreDialogOpen) {
      return "Apply Selected Ignore Area To All Images";
    }
    if (clearIgnoreDialogOpen) {
      return "Clear Ignore Area For Selected Items";
    }
    return submitButtonText() + " Test Runs";
  };

  const submitButtonText = (): string => {
    if (approveDialogOpen) {
      return "Approve";
    }
    if (rejectDialogOpen) {
      return "Reject";
    }
    if (deleteDialogOpen) {
      return "Delete";
    }
    if (applyIgnoreDialogOpen) {
      return "Apply";
    }
    if (clearIgnoreDialogOpen) {
      return "Clear";
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
    if (applyIgnoreDialogOpen) {
      return toggleApplyIgnoreDialogOpen();
    }
    if (clearIgnoreDialogOpen) {
      return toggleClearIgnoreDialogOpen();
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
    if (clearIgnoreDialogOpen) {
      testRunService.setIgnoreAreas(id, []);
    }
    if (applyIgnoreDialogOpen) {
      const testRun = testRunService.getTestRunDetails(id);
      let runningNumber = 0;
      allRows.allRows.forEach(async (eachRow) => {
        const ignoreAreaToSet: IgnoreArea[] = JSON.parse((await testRun).ignoreAreas);
        if (ignoreAreaToSet.length > 0) {
          //Add a running number to make id unique.
          ignoreAreaToSet.forEach((e) => {
            e.id = (Date.now() + (++runningNumber)).toString().slice(0, 13);
          });
          testRunService.setIgnoreAreas(eachRow.toString(), ignoreAreaToSet);
        }
      });
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
    if (applyIgnoreDialogOpen) {
      return toggleApplyIgnoreDialogOpen();
    }
    if (clearIgnoreDialogOpen) {
      return toggleClearIgnoreDialogOpen();
    }
    return toggleRejectDialogOpen();
  };

  const getProcessSuccessMessage = () => {
    if (applyIgnoreDialogOpen) {
      return "Selected image ignore area has been applied to all images.";
    }
    return `${count} test runs processed.`;
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
      <Tooltip title="Applies ignore area from selected image to all images in this build." aria-label="apply ignore area">
        <span>
          <IconButton disabled={count !== 1} onClick={toggleApplyIgnoreDialogOpen}>
            <Collections />
          </IconButton>
        </span>
      </Tooltip>
      <Tooltip title="Clear ignore areas for selected rows." aria-label="clear ignore area">
        <span>
          <IconButton disabled={count === 0} onClick={toggleClearIgnoreDialogOpen}>
            <LayersClear />
          </IconButton>
        </span>
      </Tooltip>

      <BaseModal
        open={deleteDialogOpen || approveDialogOpen || rejectDialogOpen || applyIgnoreDialogOpen || clearIgnoreDialogOpen}
        title={getTitle()}
        submitButtonText={submitButtonText()}
        onCancel={dismissDialog}
        content={
          <Typography>{applyIgnoreDialogOpen
            ? `Are you sure you want to apply ignore area to all images? Works well if images are of same resolution.`
            : `Are you sure you want to ${submitButtonText().toLowerCase()} ${count} items?`}</Typography>
        }
        onSubmit={() => {
          setIsProcessing(true);
          Promise.all(
            Object.keys(selectedRows).map((id: string) => processAction(id))
          )
            .then(() => {
              setIsProcessing(false);
              enqueueSnackbar(getProcessSuccessMessage(), {
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
      { isProcessing && <LinearProgress />}
    </>
  );
};
