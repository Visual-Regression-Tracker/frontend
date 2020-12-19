import React from "react";
import {
  Typography,
  TableContainer,
  TableHead,
  TableCell,
  Table,
  TableRow,
  TableBody,
  IconButton,
  Menu,
  MenuItem,
  Button
} from "@material-ui/core";
import { MoreVert } from "@material-ui/icons";
import { useHistory } from "react-router-dom";
import { TestRun, TestStatus } from "../types";
import TestStatusChip from "./TestStatusChip";
import { buildTestRunLocation } from "../_helpers/route.helpers";
import {
  useTestRunState,
  useTestRunDispatch,
  deleteTestRun,
  selectTestRun,
  updateTestRun
} from "../contexts";
import { SkeletonList } from "./SkeletonList";
import { useSnackbar } from "notistack";
import { BaseModal } from "./BaseModal";
import { testRunService } from "../services";

const TestRunList: React.FunctionComponent<{
  items: TestRun[];
}> = ({ items }) => {
  const { enqueueSnackbar } = useSnackbar();
  const { selectedTestRunId, loading } = useTestRunState();
  const testRunDispatch = useTestRunDispatch();
  const history = useHistory();
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const [selectedTestRun, setSelectedTestRun] = React.useState<
    TestRun | undefined
  >(undefined);
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);

  const handleClick = (
    event: React.MouseEvent<HTMLElement>,
    testRun: TestRun
  ) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
    setSelectedTestRun(testRun);
  };

  const handleClose = () => {
    setSelectedTestRun(undefined);
  };

  const toggleDeleteDialogOpen = () => {
    setDeleteDialogOpen(!deleteDialogOpen);
  };

  const doesHaveUnapprovedImage = (): boolean => {
    let status = false;
    items.forEach((eachItem) => {
      if (eachItem.status === TestStatus.new || eachItem.status === TestStatus.unresolved) {
        status = true;
        return;
      }
    });
    return status;
  };

  const approveAll = () => {
    enqueueSnackbar("Wait for the confirmation message when approval is completed.", {
      variant: "info",
    });
    let lastItemToModify: TestRun | null = null;
    //Determine the last item to be modified.
    items.forEach((eachItem) => {
      if (!(eachItem.status === TestStatus.ok || eachItem.status === TestStatus.approved)) {
        lastItemToModify = eachItem;
      }
    });
    //Iterate through all unapproved and send message when last item to modify is encounterd.
    items.forEach((eachItem) => {
      if (!(eachItem.status === TestStatus.ok || eachItem.status === TestStatus.approved)) {
        testRunService
          .approve(eachItem.id, false)
          .then((testRun) => {
            updateTestRun(testRunDispatch, testRun);
            if (eachItem === lastItemToModify) {
              enqueueSnackbar("All approved", {
                variant: "success",
              });
            }
          })
          .catch((err) =>
            enqueueSnackbar(err, {
              variant: "error",
            })
          );
      }
    });
  };

  return (
    <React.Fragment>
      {items.length !== 0 && doesHaveUnapprovedImage() && <Button
        variant="contained"
        color="primary"
        onClick={() => {
          approveAll();
        }}
      >
        Approve All
          </Button>}
      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>OS</TableCell>
              <TableCell>Device</TableCell>
              <TableCell>Browser</TableCell>
              <TableCell>Viewport</TableCell>
              <TableCell>Status</TableCell>
              <TableCell></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {items.map((test) => (
              <TableRow
                key={test.id}
                hover
                selected={test.id === selectedTestRunId}
              >
                <TableCell
                  onClick={() => {
                    history.push(buildTestRunLocation(test));
                    selectTestRun(testRunDispatch, test.id);
                  }}
                >
                  <Typography>{test.name}</Typography>
                </TableCell>
                <TableCell>
                  <Typography>{test.os}</Typography>
                </TableCell>
                <TableCell>
                  <Typography>{test.device}</Typography>
                </TableCell>
                <TableCell>
                  <Typography>{test.browser}</Typography>
                </TableCell>
                <TableCell>
                  <Typography>{test.viewport}</Typography>
                </TableCell>
                <TableCell>
                  <TestStatusChip status={test.status} />
                </TableCell>
                <TableCell>
                  <IconButton onClick={(event) => handleClick(event, test)}>
                    <MoreVert />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      {loading && <SkeletonList />}
      {items.length === 0 && <Typography variant="h5">No test runs</Typography>}
      {selectedTestRun && (
        <Menu
          anchorEl={anchorEl}
          open={!!selectedTestRun}
          onClose={handleClose}
        >
          <MenuItem
            onClick={() => {
              history.push(buildTestRunLocation(selectedTestRun));
              handleClose();
            }}
          >
            Details
          </MenuItem>
          <MenuItem onClick={toggleDeleteDialogOpen}>Delete</MenuItem>
        </Menu>
      )}

      {selectedTestRun && (
        <BaseModal
          open={deleteDialogOpen}
          title={"Delete TestRun"}
          submitButtonText={"Delete"}
          onCancel={toggleDeleteDialogOpen}
          content={
            <Typography>{`Are you sure you want to delete: ${selectedTestRun.name}?`}</Typography>
          }
          onSubmit={() => {
            deleteTestRun(testRunDispatch, selectedTestRun.id)
              .then((testRun) => {
                enqueueSnackbar(`${selectedTestRun.name} deleted`, {
                  variant: "success",
                });
              })
              .catch((err) =>
                enqueueSnackbar(err, {
                  variant: "error",
                })
              );
            handleClose();
          }}
        />
      )}
    </React.Fragment>
  );
};

export default TestRunList;
