import type { Dispatch, SetStateAction } from "react";
import {
  GridLegacy as Grid,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Button,
  SelectChangeEvent,
} from "@mui/material";
import { TestRun, TestVariation } from "../types";
import { DebouncedTextField } from "./DebouncedTextField";
import { LOCATOR_RESET_FILTER } from "../constants/help";

const emptyFn = () => undefined;

const uniqueValues = (values: (string | null | undefined)[]): string[] =>
  values.filter(
    (value, index, array): value is string =>
      !!value && array.indexOf(value) === index,
  );

const FilterSelect = ({
  id,
  label,
  value,
  options,
  onChange,
  formControlId,
}: {
  id: string;
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
  formControlId?: string;
}) =>
  options.length > 0 && (
    <Grid item xs>
      <FormControl variant="standard" fullWidth id={formControlId}>
        <InputLabel shrink id={id}>
          {label}
        </InputLabel>
        <Select
          variant="standard"
          id={id}
          value={value}
          displayEmpty
          onChange={(event: SelectChangeEvent<string>) =>
            onChange(event.target.value)
          }
        >
          <MenuItem value="">
            <em>All</em>
          </MenuItem>
          {options.map((option) => (
            <MenuItem key={option} value={option}>
              {option}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    </Grid>
  );

interface IProps {
  items: TestRun[] | TestVariation[];
  queryState: [string, Dispatch<SetStateAction<string>>];
  osState: [string, Dispatch<SetStateAction<string>>];
  deviceState: [string, Dispatch<SetStateAction<string>>];
  browserState: [string, Dispatch<SetStateAction<string>>];
  viewportState: [string, Dispatch<SetStateAction<string>>];
  customTagsState: [string, Dispatch<SetStateAction<string>>];
  branchNameState?: [string, Dispatch<SetStateAction<string>>];
}

const Filters = ({
  items,
  queryState,
  osState,
  deviceState,
  browserState,
  viewportState,
  customTagsState,
  branchNameState,
}: IProps) => {
  const [query, setQuery] = queryState;
  const [os, setOs] = osState;
  const [device, setDevice] = deviceState;
  const [browser, setBrowser] = browserState;
  const [viewport, setViewport] = viewportState;
  const [customTags, setCustomTags] = customTagsState;

  const [branchName, setBranchName] = branchNameState || ["", emptyFn];

  const valuesOf = (
    field:
      "os" | "device" | "browser" | "viewport" | "customTags" | "branchName",
  ) =>
    uniqueValues(
      (items as (TestRun | TestVariation)[]).map((item) => item[field]),
    );

  return (
    <Grid container spacing={2} alignItems="flex-end">
      <Grid item xs>
        <DebouncedTextField
          variant="standard"
          fullWidth
          label="Name"
          value={query}
          minLength={2}
          debounceTimeout={300}
          onChange={setQuery}
        />
      </Grid>
      <FilterSelect
        id="filter_os"
        label="OS"
        value={os}
        options={valuesOf("os")}
        onChange={setOs}
      />
      <FilterSelect
        id="filter_device"
        label="Device"
        value={device}
        options={valuesOf("device")}
        onChange={setDevice}
      />
      <FilterSelect
        id="filter_browser"
        label="Browser"
        value={browser}
        options={valuesOf("browser")}
        onChange={setBrowser}
      />
      <FilterSelect
        id="filter_viewport"
        label="Viewport"
        value={viewport}
        options={valuesOf("viewport")}
        onChange={setViewport}
      />
      <FilterSelect
        id="filter_customTags"
        label="Custom Tags"
        value={customTags}
        options={valuesOf("customTags")}
        onChange={setCustomTags}
      />
      {branchNameState && (
        <FilterSelect
          id="filter_branchName"
          label="Branch"
          value={branchName}
          options={valuesOf("branchName")}
          onChange={setBranchName}
          formControlId={LOCATOR_RESET_FILTER}
        />
      )}
      <Grid item>
        <Button
          variant="contained"
          color="primary"
          onClick={() => {
            setQuery("");
            setOs("");
            setDevice("");
            setBrowser("");
            setViewport("");
            setCustomTags("");
            setBranchName("");
          }}
        >
          Reset
        </Button>
      </Grid>
    </Grid>
  );
};

export default Filters;
