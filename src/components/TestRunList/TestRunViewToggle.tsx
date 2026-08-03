import React from "react";
import { ToggleButton, ToggleButtonGroup } from "@mui/material";
import { ViewList, ViewModule } from "@mui/icons-material";

export type TestRunView = "table" | "grid";

export const TestRunViewToggle: React.FunctionComponent<{
  view: TestRunView;
  onChange: (view: TestRunView) => void;
}> = ({ view, onChange }) => (
  <ToggleButtonGroup
    exclusive
    size="small"
    value={view}
    onChange={(event, next: TestRunView | null) => next && onChange(next)}
  >
    <ToggleButton
      value="table"
      aria-label="Table view"
      data-testid="tableViewToggle"
    >
      <ViewList fontSize="small" />
    </ToggleButton>
    <ToggleButton
      value="grid"
      aria-label="Grid view"
      data-testid="gridViewToggle"
    >
      <ViewModule fontSize="small" />
    </ToggleButton>
  </ToggleButtonGroup>
);
