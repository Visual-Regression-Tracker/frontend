import React from "react";
import { Toolbar, Box } from "@material-ui/core";
import {
  GridToolbarDensitySelector,
  GridToolbarFilterButton,
} from "@material-ui/data-grid";
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
