import React from "react";
import { Toolbar, Box } from "@material-ui/core";
import {
  BaseComponentProps,
  DensitySelector,
  FilterToolbarButton,
} from "@material-ui/data-grid";
import { BulkOperation } from "./BulkOperation";

export const DataGridCustomToolbar: React.FunctionComponent<BaseComponentProps> = (
  props: BaseComponentProps
) => {
  return (
    <>
      <Toolbar variant="dense">
        <FilterToolbarButton />
        <DensitySelector />
        <Box marginLeft="auto">
          <BulkOperation {...props} />
        </Box>
      </Toolbar>
    </>
  );
};
