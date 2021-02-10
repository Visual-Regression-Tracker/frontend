import React from "react";
import { Toolbar, Box } from "@material-ui/core";
import { BaseComponentProps, DensitySelector } from "@material-ui/data-grid";
import { BulkDeleteButton } from "./BulkDeleteButton";

export const DataGridCustomToolbar: React.FunctionComponent<BaseComponentProps> = (
  props: BaseComponentProps
) => {
  return (
    <>
      <Toolbar variant="dense">
        <DensitySelector />
        <Box marginLeft="auto">
          <BulkDeleteButton {...props} />
        </Box>
      </Toolbar>
    </>
  );
};
