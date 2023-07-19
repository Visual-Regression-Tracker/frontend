import {
  FormControl,
  InputLabel,
  Select,
  type SelectChangeEvent,
} from "@mui/material";
import React from "react";
import { useTestRunState } from "../../contexts";
import {
  type GridFilterInputValueProps,
  getGridStringOperators,
} from "@mui/x-data-grid";

const TagInputComponent = (props: GridFilterInputValueProps) => {
  const { item, applyValue } = props;
  const { testRuns } = useTestRunState();

  const handleFilterChange = (event: SelectChangeEvent) => {
    applyValue({ ...item, value: event.target.value });
  };

  const filterOptions: Array<string> = Array.from(
    new Set(
      testRuns
        .map((item) => item.os)
        .concat(testRuns.map((item) => item.browser))
        .concat(testRuns.map((item) => item.device))
        .concat(testRuns.map((item) => item.viewport))
        .concat(testRuns.map((item) => item.customTags)),
    ),
  );

  return (
    <FormControl variant="standard" fullWidth>
      <InputLabel shrink id="tagFilter">
        Value
      </InputLabel>
      <Select
        variant="standard"
        id="tagFilter"
        native
        displayEmpty
        value={item.value}
        onChange={handleFilterChange}
      >
        <option aria-label="All" value="" />
        {filterOptions.map(
          (item) =>
            item && (
              <option key={item} value={item}>
                {item}
              </option>
            ),
        )}
      </Select>
    </FormControl>
  );
};

export const TagFilterOperators = getGridStringOperators()
  .filter((operator) => operator.value === "contains")
  .map((operator) => ({
    ...operator,
    InputComponent: TagInputComponent,
  }));
