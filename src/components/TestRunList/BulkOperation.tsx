import React from "react";
import { Typography, IconButton, LinearProgress } from "@mui/material";
import {
  type GridRowModel,
  type GridRowId,
  type GridSelectionModel,
  useGridApiRef,
  gridSelectionStateSelector,
  gridVisibleSortedRowEntriesSelector,
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
import { testRunService } from "../../services";
import { TestStatus } from "../../types";
import { head } from "lodash";
import { Tooltip } from "../Tooltip";

export const BulkOperation: React.FunctionComponent = () => {
  const apiRef = useGridApiRef();
  const state = apiRef.current.state;
  const rows = gridVisibleSortedRowEntriesSelector(state).map((row) => {
    return [row.id, row.model];
  });
  const selection = gridSelectionStateSelector(state);

  const { enqueueSnackbar } = useSnackbar();
  const [approveDialogOpen, setApproveDialogOpen] = React.useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = React.useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const [downloadDialogOpen, setDownloadDialogOpen] = React.useState(false);
  const [clearIgnoreDialogOpen, setClearIgnoreDialogOpen] =
    React.useState(false);
  const [isProcessing, setIsProcessing] = React.useState(false);
  const ids: GridRowId[] = React.useMemo(
    () => Object.values(selection),
    [selection],
  );
  const isMerge: boolean = React.useMemo(
    () =>
      !!head(
        rows.filter((value: GridRowModel) => ids.includes(value.id.toString())),
      ),
    [ids],
  );

  const idsEligibleForApproveOrReject: string[] = React.useMemo(
    () =>
      rows
        .filter(
          (value: GridRowModel) =>
            ids.includes(value.id.toString()) &&
            [TestStatus.new, TestStatus.unresolved].includes(
              value.status.toString(),
            ),
        )
        .map((value: GridRowModel) => value.id.toString()),
    // eslint-disable-next-line
    [ids],
  );

  const selectedRows: GridSelectionModel = gridSelectionStateSelector(state);
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
      return testRunService.removeBulk(ids);
    }
    if (downloadDialogOpen) {
      const urlsToDownload: { download: string; filename: string }[] = [];
      ids.forEach((id) => {
        testRunService.getDetails(id.toString()).then((e) => {
          urlsToDownload.push({
            download: "static/imageUploads/" + e.imageName,
            filename: e.name,
          });
          //Call getFile function only when all images names are pushed into the array.
          if (urlsToDownload.length === ids.length) {
            testRunService.getFiles(urlsToDownload);
          }
        });
      });
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
    <>
      <Tooltip
        title="Approve unresolved in selected rows."
        aria-label="approve"
      >
        <span>
          <IconButton
            disabled={count === 0}
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
            disabled={count === 0}
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
            disabled={count === 0}
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
            disabled={count === 0}
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
            disabled={count === 0}
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
    </>
  );
};
