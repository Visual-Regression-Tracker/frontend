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

export const TestRunListToolbar = ({
  selectedIds,
  rows,
  onProcessed,
  ...controls
}: ToolbarPropsOverrides) => (
  <Toolbar variant="dense">
    <TestRunListControls {...controls} />
    <Box marginLeft="auto">
      <BulkOperation
        selectedIds={selectedIds}
        rows={rows}
        selectionNoun={controls.view === "grid" ? "cards" : "rows"}
        onProcessed={onProcessed}
      />
    </Box>
  </Toolbar>
);
