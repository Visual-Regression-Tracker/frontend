import { FormControl, InputLabel, Select } from "@material-ui/core";
import React from "react";
import { useTestRunState } from "../../contexts";
import {
  type GridFilterInputValueProps,
  getGridStringOperators,
} from "@material-ui/data-grid";

const TagInputComponent = (props: GridFilterInputValueProps) => {
  const { item, applyValue } = props;
  const { testRuns } = useTestRunState();

  const handleFilterChange = (event: any) => {
    applyValue({ ...item, value: event.target.value as string });
  };

  const filterOptions: Array<string> = Array.from(
    new Set(
      testRuns
        .map((item) => item.os)
        .concat(testRuns.map((item) => item.browser))
        .concat(testRuns.map((item) => item.device))
        .concat(testRuns.map((item) => item.viewport))
        .concat(testRuns.map((item) => item.customTags))
    )
  );

  return (
    <FormControl fullWidth>
      <InputLabel shrink id="tagFilter">
        Value
      </InputLabel>
      <Select
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
            )
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
