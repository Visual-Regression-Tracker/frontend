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
} from "@material-ui/core";
import { MoreVert } from "@material-ui/icons";
import { useHistory } from "react-router-dom";
import { TestRun } from "../types";
import TestStatusChip from "./TestStatusChip";
import { buildTestRunLocation } from "../_helpers/route.helpers";
import {
  useTestRunState,
  useTestRunDispatch,
  deleteTestRun,
  selectTestRun,
} from "../contexts/testRun.context";

const TestRunList: React.FunctionComponent<{
  items: TestRun[];
}> = ({ items }) => {
  const { selectedTestRunId } = useTestRunState();
  const testRunDispatch = useTestRunDispatch();
  const history = useHistory();
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const [selectedTestRun, setSelectedTestRun] = React.useState<
    TestRun | undefined
  >(undefined);

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

  return (
    <React.Fragment>
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
                    selectTestRun(testRunDispatch, test.id)
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
          <MenuItem
            onClick={() => {
              deleteTestRun(testRunDispatch, selectedTestRun.id);
              handleClose();
            }}
          >
            Delete
          </MenuItem>
        </Menu>
      )}
    </React.Fragment>
  );
};

export default TestRunList;
