import React from "react";
import { Toolbar, Box } from "@mui/material";
import {
  GridToolbarDensitySelector,
  GridToolbarFilterButton,
} from "@mui/x-data-grid";
import { BulkOperation } from "./BulkOperation";

export const DataGridCustomToolbar: React.FunctionComponent = () => {
  return (
    <>
      <Toolbar variant="dense">
        <GridToolbarFilterButton />
        <GridToolbarDensitySelector />
        <Box marginLeft="auto">
          <BulkOperation />
        </Box>
      </Toolbar>
    </>
  );
};
