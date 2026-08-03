import React from "react";
import { Toolbar, Box } from "@mui/material";
import { BulkOperation } from "./BulkOperation";
import {
  TestRunDensity,
  TestRunListControls,
  TestRunView,
} from "./TestRunListControls";
import { TestRun } from "../../types";

// how the data grid learns the types of the props passed via slotProps.toolbar
declare module "@mui/x-data-grid" {
  interface ToolbarPropsOverrides {
    selectedIds: string[];
    rows: TestRun[];
    view: TestRunView;
    onViewChange: (view: TestRunView) => void;
    density: TestRunDensity;
    onDensityChange: (density: TestRunDensity) => void;
    grouped: boolean;
    onGroupedChange: (grouped: boolean) => void;
  }
}

export const DataGridCustomToolbar: React.FunctionComponent<{
  selectedIds: string[];
  rows: TestRun[];
  view: TestRunView;
  onViewChange: (view: TestRunView) => void;
  density: TestRunDensity;
  onDensityChange: (density: TestRunDensity) => void;
  grouped: boolean;
  onGroupedChange: (grouped: boolean) => void;
}> = ({
  selectedIds,
  rows,
  view,
  onViewChange,
  density,
  onDensityChange,
  grouped,
  onGroupedChange,
}) => (
  <Toolbar variant="dense">
    <TestRunListControls
      view={view}
      onViewChange={onViewChange}
      density={density}
      onDensityChange={onDensityChange}
      grouped={grouped}
      onGroupedChange={onGroupedChange}
    />
    <Box marginLeft="auto">
      <BulkOperation selectedIds={selectedIds} rows={rows} />
    </Box>
  </Toolbar>
);
