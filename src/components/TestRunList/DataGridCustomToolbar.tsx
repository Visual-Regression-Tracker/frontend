import React from "react";
import { Toolbar, Box } from "@mui/material";
import { BulkOperation } from "./BulkOperation";
import {
  TestRunDensity,
  TestRunListControls,
  TestRunView,
} from "./TestRunListControls";
import { TestRun } from "../../types";
import { GroupByAxis } from "../../_helpers/testRunGroup.helper";

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
    groupByAxis: GroupByAxis;
    showDiff: boolean;
    onShowDiffChange: (showDiff: boolean) => void;
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
  groupByAxis: GroupByAxis;
  showDiff: boolean;
  onShowDiffChange: (showDiff: boolean) => void;
}> = ({
  selectedIds,
  rows,
  view,
  onViewChange,
  density,
  onDensityChange,
  grouped,
  onGroupedChange,
  groupByAxis,
  showDiff,
  onShowDiffChange,
}) => (
  <Toolbar variant="dense">
    <TestRunListControls
      view={view}
      onViewChange={onViewChange}
      density={density}
      onDensityChange={onDensityChange}
      grouped={grouped}
      onGroupedChange={onGroupedChange}
      groupByAxis={groupByAxis}
      showDiff={showDiff}
      onShowDiffChange={onShowDiffChange}
    />
    <Box marginLeft="auto">
      <BulkOperation
        selectedIds={selectedIds}
        rows={rows}
        selectionNoun="rows"
      />
    </Box>
  </Toolbar>
);
