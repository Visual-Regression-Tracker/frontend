import React from "react";
import { Typography, IconButton, LinearProgress } from "@mui/material";
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
import { TestRun, TestStatus } from "../../types";
import { Tooltip } from "../Tooltip";
import { useTestRunState } from "../../contexts";

export const BulkOperation: React.FunctionComponent<{
  selectedIds: string[];
  rows: TestRun[];
  // what the view calls the things you tick: rows in the table, cards in the grid
  selectionNoun: "rows" | "cards";
}> = ({ selectedIds, rows, selectionNoun }) => {
  const { testRuns } = useTestRunState();
  const { enqueueSnackbar } = useSnackbar();
  const [approveDialogOpen, setApproveDialogOpen] = React.useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = React.useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const [downloadDialogOpen, setDownloadDialogOpen] = React.useState(false);

  const [clearIgnoreDialogOpen, setClearIgnoreDialogOpen] =
    React.useState(false);

  const [isProcessing, setIsProcessing] = React.useState(false);

  const isMerge: boolean = React.useMemo(
    () => !!rows.find((row) => selectedIds.includes(row.id))?.merge,
    [selectedIds, rows],
  );

  // The ids of those rows that have status "new" or "resolved"
  const idsEligibleForApproveOrReject: string[] = React.useMemo(
    () =>
      rows
        .filter(
          (row) =>
            selectedIds.includes(row.id) &&
            [TestStatus.new, TestStatus.unresolved].includes(row.status),
        )
        .map((row) => row.id),
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
      return testRunService.removeBulk(selectedIds);
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
      ids: selectedIds,
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
        title={`Approve unresolved in selected ${selectionNoun}.`}
        aria-label="approve"
      >
        <span>
          <IconButton
            disabled={selectedIds.length === 0}
            onClick={toggleApproveDialogOpen}
            size="large"
          >
            <ThumbUp />
          </IconButton>
        </span>
      </Tooltip>
      <Tooltip
        title={`Reject unresolved in selected ${selectionNoun}.`}
        aria-label="reject"
      >
        <span>
          <IconButton
            disabled={selectedIds.length === 0}
            onClick={toggleRejectDialogOpen}
            size="large"
          >
            <ThumbDown />
          </IconButton>
        </span>
      </Tooltip>
      <Tooltip
        title={`Download images for selected ${selectionNoun}.`}
        aria-label="download"
      >
        <span>
          <IconButton
            disabled={selectedIds.length === 0}
            onClick={toggleDownloadDialogOpen}
            size="large"
          >
            <CloudDownload />
          </IconButton>
        </span>
      </Tooltip>
      <Tooltip title={`Delete selected ${selectionNoun}.`} aria-label="delete">
        <span>
          <IconButton
            disabled={selectedIds.length === 0}
            onClick={toggleDeleteDialogOpen}
            size="large"
          >
            <Delete />
          </IconButton>
        </span>
      </Tooltip>
      <Tooltip
        title={`Clear ignore areas for selected ${selectionNoun}.`}
        aria-label="clear ignore area"
      >
        <span>
          <IconButton
            disabled={selectedIds.length === 0}
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
            {`Are you sure you want to ${submitButtonText().toLowerCase()} ${
              selectedIds.length
            } items?`}
          </Typography>
        }
        onSubmit={() => {
          setIsProcessing(true);
          getBulkAction()
            .then(() => {
              setIsProcessing(false);
              enqueueSnackbar(`${selectedIds.length} test runs processed.`, {
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
