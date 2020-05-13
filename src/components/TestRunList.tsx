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
import { routes } from "../constants";

const TestRunList: React.FunctionComponent<{
  items: TestRun[];
  selectedId: string | undefined;
  handleRemove: (id: string) => {};
}> = ({ items, selectedId, handleRemove }) => {
  const history = useHistory();
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  return (
    <TableContainer>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Name</TableCell>
            <TableCell>OS</TableCell>
            <TableCell>Browser</TableCell>
            <TableCell>Viewport</TableCell>
            <TableCell>Status</TableCell>
            <TableCell></TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {items.map((test) => (
            <TableRow key={test.id} hover selected={test.id === selectedId}>
              <TableCell
                onClick={
                  () => {
                    history.push({
                      search: `buildId=${test.buildId}&testId=${test.id}`,
                    });
                  }
                  // () => history.push(`${routes.TEST_DETAILS_PAGE}/${test.id}`)
                }
              >
                <Typography>{test.testVariation.name}</Typography>
              </TableCell>
              <TableCell>
                <Typography>{test.testVariation.os}</Typography>
              </TableCell>
              <TableCell>
                <Typography>{test.testVariation.browser}</Typography>
              </TableCell>
              <TableCell>
                <Typography>{test.testVariation.viewport}</Typography>
              </TableCell>
              <TableCell>
                <Typography>{test.status}</Typography>
              </TableCell>
              <TableCell>
                <IconButton onClick={handleClick}>
                  <MoreVert />
                </IconButton>
                <Menu anchorEl={anchorEl} open={open} onClose={handleClose}>
                  <MenuItem
                    onClick={() =>
                      history.push(`${routes.TEST_DETAILS_PAGE}/${test.id}`)
                    }
                  >
                    Details
                  </MenuItem>
                  <MenuItem
                    onClick={() => {
                      handleRemove(test.id);
                      handleClose();
                    }}
                  >
                    Delete
                  </MenuItem>
                </Menu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default TestRunList;
