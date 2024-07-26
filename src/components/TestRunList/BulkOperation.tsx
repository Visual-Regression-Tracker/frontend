import React from "react";
import { Typography, IconButton, LinearProgress } from "@mui/material";
import {
  GridRowModel,
  GridRowId,
  useGridApiContext,
  gridRowSelectionStateSelector,
  gridExpandedSortedRowEntriesSelector,
} from "@mui/x-data-grid";
import { BaseModal } from "../BaseModal";
import { useSnackbar } from "notistack";
import {
  CloudDownload,
  Delete,
  LayersClear,
  ThumbDown,
  ThumbUp,
} from "@mui/icons-material";
import { staticService, testRunService } from "../../services";
import { TestStatus } from "../../types";
import { Tooltip } from "../Tooltip";
import { useTestRunState } from "../../contexts";

export const BulkOperation: React.FunctionComponent = () => {
  const apiRef = useGridApiContext();
  const { state } = apiRef.current;
  const rows = gridExpandedSortedRowEntriesSelector(
    state,
    apiRef.current.instanceId,
  );

  const selectedRows = gridRowSelectionStateSelector(state);
  const { testRuns } = useTestRunState();
  const { enqueueSnackbar } = useSnackbar();
  const [approveDialogOpen, setApproveDialogOpen] = React.useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = React.useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const [downloadDialogOpen, setDownloadDialogOpen] = React.useState(false);

  const [clearIgnoreDialogOpen, setClearIgnoreDialogOpen] =
    React.useState(false);

  const [isProcessing, setIsProcessing] = React.useState(false);
  const selectedIds: GridRowId[] = React.useMemo(
    () => Object.values(selectedRows),
    [selectedRows],
  );

  const isMerge: boolean = React.useMemo(
    () => !!rows.find((row: GridRowModel) => selectedIds.includes(row.id.toString()))?.model.merge,
    [selectedIds, rows],
  );

  // The ids of those rows that have status "new" or "resolved"
  const idsEligibleForApproveOrReject: string[] = React.useMemo(
    () =>
      rows
        .filter(
          (row: GridRowModel) =>
            selectedIds.includes(row.id.toString()) &&
            [TestStatus.new, TestStatus.unresolved].includes(
              row.model.status.toString(),
            ),
        )
        .map((row: GridRowModel) => row.id.toString()),
    [selectedIds, rows],
  );

  const toggleApproveDialogOpen = () => {
    setApproveDialogOpen(!approveDialogOpen);
  };

  const toggleRejectDialogOpen = () => {
    setRejectDialogOpen(!rejectDialogOpen);
  };

  const toggleDeleteDialogOpen = () => {
    setDeleteDialogOpen(!deleteDialogOpen);
  };

  const toggleDownloadDialogOpen = () => {
    setDownloadDialogOpen(!downloadDialogOpen);
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

    if (downloadDialogOpen) {
      return "Download";
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

    if (downloadDialogOpen) {
      return toggleDownloadDialogOpen();
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
      return testRunService.removeBulk(
        selectedIds.map((item: GridRowId) => item.toString()),
      );
    }

    if (downloadDialogOpen) {
      const images = testRuns
        .filter((testRun) => selectedIds.includes(testRun.id))
        .map((item) => ({
          filename: item.name,
          url: staticService.getImage(item.imageName),
        }));

      return staticService.downloadAsZip(images);
    }

    if (rejectDialogOpen) {
      return testRunService.rejectBulk(idsEligibleForApproveOrReject);
    }

    if (approveDialogOpen) {
      return testRunService.approveBulk(idsEligibleForApproveOrReject, isMerge);
    }

    return testRunService.updateIgnoreAreas({
      ids: selectedIds.map((item: GridRowId) => item.toString()),
      ignoreAreas: [],
    });
  };

  const dismissDialog = () => {
    if (deleteDialogOpen) {
      return toggleDeleteDialogOpen();
    }

    if (downloadDialogOpen) {
      return toggleDownloadDialogOpen();
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
    <React.Fragment>
      <Tooltip
        title="Approve unresolved in selected rows."
        aria-label="approve"
      >
        <span>
          <IconButton
            disabled={selectedRows.length === 0}
            onClick={toggleApproveDialogOpen}
            size="large"
          >
            <ThumbUp />
          </IconButton>
        </span>
      </Tooltip>
      <Tooltip title="Reject unresolved in selected rows." aria-label="reject">
        <span>
          <IconButton
            disabled={selectedRows.length === 0}
            onClick={toggleRejectDialogOpen}
            size="large"
          >
            <ThumbDown />
          </IconButton>
        </span>
      </Tooltip>
      <Tooltip title="Download images for selected rows." aria-label="download">
        <span>
          <IconButton
            disabled={selectedRows.length === 0}
            onClick={toggleDownloadDialogOpen}
            size="large"
          >
            <CloudDownload />
          </IconButton>
        </span>
      </Tooltip>
      <Tooltip title="Delete selected rows." aria-label="delete">
        <span>
          <IconButton
            disabled={selectedRows.length === 0}
            onClick={toggleDeleteDialogOpen}
            size="large"
          >
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
            disabled={selectedRows.length === 0}
            onClick={toggleClearIgnoreDialogOpen}
            size="large"
          >
            <LayersClear />
          </IconButton>
        </span>
      </Tooltip>
      <BaseModal
        open={
          deleteDialogOpen ||
          downloadDialogOpen ||
          approveDialogOpen ||
          rejectDialogOpen ||
          clearIgnoreDialogOpen
        }
        title={getTitle()}
        submitButtonText={submitButtonText()}
        onCancel={dismissDialog}
        content={
          <Typography>
            {`Are you sure you want to ${submitButtonText().toLowerCase()} ${selectedRows.length} items?`}
          </Typography>
        }
        onSubmit={() => {
          setIsProcessing(true);
          getBulkAction()
            .then(() => {
              setIsProcessing(false);
              enqueueSnackbar(`${selectedRows.length} test runs processed.`, {
                variant: "success",
              });
            })
            .catch((err) => {
              setIsProcessing(false);
              enqueueSnackbar(err, {
                variant: "error",
              });
            });
          closeModal();
        }}
      />
      {isProcessing && <LinearProgress />}
    </React.Fragment>
  );
};
