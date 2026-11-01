import { Toolbar, Box } from "@mui/material";
import type { ToolbarPropsOverrides } from "@mui/x-data-grid";
import { BulkOperation } from "./BulkOperation";
import {
  TestRunDensity,
  TestRunListControls,
  TestRunView,
} from "./TestRunListControls";
import { TestRun } from "../../types";
import { GroupByAxis } from "../../_helpers/testRunGroup.helper";

declare module "@mui/x-data-grid" {
  interface ToolbarPropsOverrides {
    selectedIds: string[];
    rows: TestRun[];
    selectionNoun: "rows" | "cards";
    view: TestRunView;
    onViewChange: (view: TestRunView) => void;
    density: TestRunDensity;
    onDensityChange: (density: TestRunDensity) => void;
    grouped: boolean;
    onGroupedChange: (grouped: boolean) => void;
    groupByAxis: GroupByAxis;
    showDiff: boolean;
    onShowDiffChange: (showDiff: boolean) => void;
    onProcessed: (failedIds: string[]) => void;
  }
}

export const DataGridCustomToolbar = ({
  selectedIds,
  rows,
  selectionNoun,
  view,
  onViewChange,
  density,
  onDensityChange,
  grouped,
  onGroupedChange,
  groupByAxis,
  showDiff,
  onShowDiffChange,
  onProcessed,
}: ToolbarPropsOverrides) => (
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
        selectionNoun={selectionNoun}
        onProcessed={onProcessed}
      />
    </Box>
  </Toolbar>
);
