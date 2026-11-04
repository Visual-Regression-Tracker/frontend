import { Toolbar, Box } from "@mui/material";
import type { ToolbarPropsOverrides } from "@mui/x-data-grid";
import { AnalyseNoiseButton } from "./AnalyseNoiseButton";
import { BulkOperation } from "./BulkOperation";
import {
  DiffToggle,
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
    noiseHintAvailable: boolean;
    view: TestRunView;
    onViewChange: (view: TestRunView) => void;
    density: TestRunDensity;
    onDensityChange: (density: TestRunDensity) => void;
    grouped: boolean;
    onGroupedChange: (grouped: boolean) => void;
    groupByAxis: GroupByAxis;
    // only the card view has the switch, so the table leaves it out
    diffToggle?: DiffToggle;
    onProcessed: (failedIds: string[]) => void;
  }
}

export const TestRunListToolbar = ({
  selectedIds,
  rows,
  noiseHintAvailable,
  onProcessed,
  ...controls
}: ToolbarPropsOverrides) => (
  <Toolbar variant="dense">
    <TestRunListControls {...controls} />
    <Box
      sx={{
        marginLeft: "auto",
        display: "flex",
        alignItems: "center",
        gap: 1,
      }}
    >
      {noiseHintAvailable && <AnalyseNoiseButton runs={rows} />}
      <BulkOperation
        selectedIds={selectedIds}
        rows={rows}
        selectionNoun={controls.view === "grid" ? "cards" : "rows"}
        onProcessed={onProcessed}
      />
    </Box>
  </Toolbar>
);
