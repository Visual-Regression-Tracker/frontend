import React from "react";
import {
  Typography,
  IconButton,
  Tooltip,
  LinearProgress,
} from "@material-ui/core";
import {
  GridRowData,
  GridSelectionState,
  useGridSlotComponentProps,
} from "@material-ui/data-grid";
import { BaseModal } from "../BaseModal";
import { useSnackbar } from "notistack";
import { Delete, LayersClear, ThumbDown, ThumbUp } from "@material-ui/icons";
import { testRunService } from "../../services";
import { TestStatus } from "../../types";
import { head } from "lodash";

export const BulkOperation: React.FunctionComponent = () => {
  const props = useGridSlotComponentProps();
  const { enqueueSnackbar } = useSnackbar();
  const [approveDialogOpen, setApproveDialogOpen] = React.useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = React.useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const [clearIgnoreDialogOpen, setClearIgnoreDialogOpen] = React.useState(
    false
  );
  const [isProcessing, setIsProcessing] = React.useState(false);
  const ids: string[] = React.useMemo(
    () => Object.keys(props.state.selection),
    [props.state.selection]
  );
  const isMerge: boolean = React.useMemo(
    () =>
      !!head(
        props.rows.filter((value: GridRowData) =>
          ids.includes(value.id.toString())
        )
      )?.merge,
    // eslint-disable-next-line
    [ids]
  );
  const idsEligibleForApproveOrReject: string[] = React.useMemo(
    () =>
      props.rows
        .filter(
          (value: GridRowData) =>
            ids.includes(value.id.toString()) &&
            [TestStatus.new, TestStatus.unresolved].includes(
              value.status.toString()
            )
        )
        .map((value: GridRowData) => value.id.toString()),
    // eslint-disable-next-line
    [ids]
  );

  const selectedRows: GridSelectionState = props.state.selection;
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
  const toggleClearIgnoreDialogOpen = () => {
    setClearIgnoreDialogOpen(!clearIgnoreDialogOpen);
  };

  const getTitle = () => {
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
    if (clearIgnoreDialogOpen) {
      return toggleClearIgnoreDialogOpen();
    }
  };

  const getBulkAction = () => {
    if (deleteDialogOpen) {
      return testRunService.removeBulk(ids);
    }
    if (rejectDialogOpen) {
      return testRunService.rejectBulk(idsEligibleForApproveOrReject);
    }
    if (approveDialogOpen) {
      return testRunService.approveBulk(idsEligibleForApproveOrReject, isMerge);
    }
    return testRunService.updateIgnoreAreas({
      ids,
      ignoreAreas: [],
    });
  };

  const dismissDialog = () => {
    if (deleteDialogOpen) {
      return toggleDeleteDialogOpen();
    }
    if (approveDialogOpen) {
      return toggleApproveDialogOpen();
    }
    if (clearIgnoreDialogOpen) {
      return toggleClearIgnoreDialogOpen();
    }
    return toggleRejectDialogOpen();
  };

  return (
    <>
      <Tooltip
        title="Approve unresolved in selected rows."
        aria-label="approve"
      >
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
      <Tooltip
        title="Clear ignore areas for selected rows."
        aria-label="clear ignore area"
      >
        <span>
          <IconButton
            disabled={count === 0}
            onClick={toggleClearIgnoreDialogOpen}
          >
            <LayersClear />
          </IconButton>
        </span>
      </Tooltip>

      <BaseModal
        open={
          deleteDialogOpen ||
          approveDialogOpen ||
          rejectDialogOpen ||
          clearIgnoreDialogOpen
        }
        title={getTitle()}
        submitButtonText={submitButtonText()}
        onCancel={dismissDialog}
        content={
          <Typography>
            {`Are you sure you want to ${submitButtonText().toLowerCase()} ${count} items?`}
          </Typography>
        }
        onSubmit={() => {
          setIsProcessing(true);
          getBulkAction()
            .then(() => {
              setIsProcessing(false);
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
      {isProcessing && <LinearProgress />}
    </>
  );
};
