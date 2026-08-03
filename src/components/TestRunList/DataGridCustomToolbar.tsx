import React from "react";
import { Toolbar, Box } from "@mui/material";
import { GridToolbarDensitySelector } from "@mui/x-data-grid";
import { BulkOperation } from "./BulkOperation";
import { TestRunView, TestRunViewToggle } from "./TestRunViewToggle";
import { TestRun } from "../../types";

// how the data grid learns the types of the props passed via slotProps.toolbar
declare module "@mui/x-data-grid" {
  interface ToolbarPropsOverrides {
    selectedIds: string[];
    rows: TestRun[];
    view: TestRunView;
    onViewChange: (view: TestRunView) => void;
  }
}

export const DataGridCustomToolbar: React.FunctionComponent<{
  selectedIds: string[];
  rows: TestRun[];
  view: TestRunView;
  onViewChange: (view: TestRunView) => void;
}> = ({ selectedIds, rows, view, onViewChange }) => (
  <React.Fragment>
    <Toolbar variant="dense">
      <GridToolbarDensitySelector />
      <Box marginLeft={1}>
        <TestRunViewToggle view={view} onChange={onViewChange} />
      </Box>
      <Box marginLeft="auto">
        <BulkOperation selectedIds={selectedIds} rows={rows} />
      </Box>
    </Toolbar>
  </React.Fragment>
);
