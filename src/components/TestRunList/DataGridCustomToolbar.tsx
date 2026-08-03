import React from "react";
import { Toolbar, Box } from "@mui/material";
import { GridToolbarDensitySelector } from "@mui/x-data-grid";
import { BulkOperation } from "./BulkOperation";
import { TestRun } from "../../types";

// how the data grid learns the types of the props passed via slotProps.toolbar
declare module "@mui/x-data-grid" {
  interface ToolbarPropsOverrides {
    selectedIds: string[];
    rows: TestRun[];
  }
}

export const DataGridCustomToolbar: React.FunctionComponent<{
  selectedIds: string[];
  rows: TestRun[];
}> = ({ selectedIds, rows }) => (
  <React.Fragment>
    <Toolbar variant="dense">
      <GridToolbarDensitySelector />
      <Box marginLeft="auto">
        <BulkOperation selectedIds={selectedIds} rows={rows} />
      </Box>
    </Toolbar>
  </React.Fragment>
);
