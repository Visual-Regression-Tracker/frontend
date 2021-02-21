import { FormControl, InputLabel, Select } from "@material-ui/core";
import React from "react";
import { useTestRunState } from "../../contexts";
import {
  FilterInputValueProps,
  getStringOperators,
} from "@material-ui/data-grid";
import { TestStatus } from "../../types";

const StatusInputComponent = (props: FilterInputValueProps) => {
  const { item, applyValue } = props;
  const { testRuns } = useTestRunState();

  const handleFilterChange = (event: any) => {
    applyValue({ ...item, value: event.target.value as string });
  };

  const filterOptions: Array<TestStatus> = Array.from(
    new Set(testRuns.map((item) => item.status))
  );

  return (
    <FormControl fullWidth>
      <InputLabel shrink id="statusFilter">
        Value
      </InputLabel>
      <Select
        id="statusFilter"
        native
        displayEmpty
        value={item.value}
        onChange={handleFilterChange}
      >
        <option aria-label="All" value="" />
        {filterOptions.map((item) => (
          <option key={item} value={item}>
            {item}
          </option>
        ))}
      </Select>
    </FormControl>
  );
};

export const StatusFilterOperators = getStringOperators()
  .filter((operator) => operator.value === "equals")
  .map((operator) => ({
    ...operator,
    InputComponent: StatusInputComponent,
  }));
