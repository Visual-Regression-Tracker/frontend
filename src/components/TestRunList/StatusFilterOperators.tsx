import React from "react";
import {
  FormControl,
  InputLabel,
  Select,
  SelectChangeEvent,
} from "@mui/material";
import { useTestRunState } from "../../contexts";
import {
  getGridStringOperators,
  GridFilterItem,
  GridCellParams,
  GridFilterOperator,
  GridFilterInputValueProps
} from "@mui/x-data-grid";
import { TestStatus } from "../../types";

const StatusInputComponent = ({ item, applyValue }: GridFilterInputValueProps) => {
  const { testRuns } = useTestRunState();

  const handleFilterChange = (event: SelectChangeEvent<HTMLSelectElement>) => {
    applyValue({
      ...item,
      value: event.target.value as string,
    });
  };

  const filterOptions: Array<TestStatus> = Array.from(
    new Set(testRuns.map((item) => item.status)),
  );

  return (
    <FormControl variant="standard" fullWidth>
      <InputLabel shrink id="statusFilter">
        Value
      </InputLabel>
      <Select
        variant="standard"
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
export const StatusFilterOperators: GridFilterOperator[]  = [
  ...getGridStringOperators()
    .filter((operator) => operator.value === "equals")
    .map((operator) => ({
      ...operator,
      InputComponent: StatusInputComponent,
    })),
  {
    label: "not",
    value: "not",
    getApplyFilterFn: (filterItem: GridFilterItem) => {
      if (!filterItem.field || !filterItem.value || !filterItem.operator) {
        return null;
      }

      return (params: GridCellParams): boolean =>
        params.value !== filterItem.value;
    },
    InputComponent: StatusInputComponent,
    InputComponentProps: {
      type: "string",
    },
  },
];
