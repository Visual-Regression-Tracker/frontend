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

interface IProps {
  items: TestRun[] | TestVariation[];
  queryState: [string, Dispatch<SetStateAction<string>>];
  osState: [string, Dispatch<SetStateAction<string>>];
  deviceState: [string, Dispatch<SetStateAction<string>>];
  browserState: [string, Dispatch<SetStateAction<string>>];
  viewportState: [string, Dispatch<SetStateAction<string>>];
  customTagsState: [string, Dispatch<SetStateAction<string>>];
  testStatusState?: [string, Dispatch<SetStateAction<string>>];
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
  testStatusState,
  branchNameState,
}: IProps) => {
  const [query, setQuery] = queryState;
  const [os, setOs] = osState;
  const [device, setDevice] = deviceState;
  const [browser, setBrowser] = browserState;
  const [viewport, setViewport] = viewportState;
  const [customTags, setCustomTags] = customTagsState;

  const [testStatus, setTestStatus] = testStatusState || ["", emptyFn];

  const [branchName, setBranchName] = branchNameState || ["", emptyFn];

  const osList = items
    .map((t) => t.os)
    .filter((v, i, array) => v && array.indexOf(v) === i);

  const deviceList = items
    .map((t) => t.device)
    .filter((v, i, array) => v && array.indexOf(v) === i);

  const browserList = items
    .map((t) => t.browser)
    .filter((v, i, array) => v && array.indexOf(v) === i);

  const viewportList = items
    .map((t) => t.viewport)
    .filter((v, i, array) => v && array.indexOf(v) === i);

  const customTagsList = items
    .map((t) => t.customTags)
    .filter((v, i, array) => v && array.indexOf(v) === i);

  const testStatusList =
    testStatusState &&
    items.some((i) => (i as TestRun).status) &&
    (items as TestRun[])
      .map((t) => t.status)
      .filter((v, i, array) => v && array.indexOf(v) === i);

  const branchNameList =
    branchNameState &&
    items
      .map((t) => t.branchName)
      .filter((v, i, array) => v && array.indexOf(v) === i);

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
      {osList.length > 0 && (
        <Grid item xs>
          <FormControl variant="standard" fullWidth>
            <InputLabel shrink id="filter_os">
              OS
            </InputLabel>
            <Select
              variant="standard"
              id="filter_os"
              value={os}
              displayEmpty
              onChange={(event: SelectChangeEvent<string>) =>
                setOs(event.target.value)
              }
            >
              <MenuItem value="">
                <em>All</em>
              </MenuItem>
              {osList.map((os) => (
                <MenuItem key={os} value={os}>
                  {os}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
      )}
      {deviceList.length > 0 && (
        <Grid item xs>
          <FormControl variant="standard" fullWidth>
            <InputLabel shrink id="filter_device">
              Device
            </InputLabel>
            <Select
              variant="standard"
              id="filter_device"
              value={device}
              displayEmpty
              onChange={(event: SelectChangeEvent<string>) =>
                setDevice(event.target.value)
              }
            >
              <MenuItem value="">
                <em>All</em>
              </MenuItem>
              {deviceList.map((device) => (
                <MenuItem key={device} value={device}>
                  {device}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
      )}
      {browserList.length > 0 && (
        <Grid item xs>
          <FormControl variant="standard" fullWidth>
            <InputLabel shrink id="filter_browser">
              Browser
            </InputLabel>
            <Select
              variant="standard"
              id="filter_browser"
              value={browser}
              displayEmpty
              onChange={(event: SelectChangeEvent<string>) =>
                setBrowser(event.target.value)
              }
            >
              <MenuItem value="">
                <em>All</em>
              </MenuItem>
              {browserList.map((item) => (
                <MenuItem key={item} value={item}>
                  {item}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
      )}
      {viewportList.length > 0 && (
        <Grid item xs>
          <FormControl variant="standard" fullWidth>
            <InputLabel shrink id="filter_viewport">
              Viewport
            </InputLabel>
            <Select
              variant="standard"
              id="filter_viewport"
              value={viewport}
              displayEmpty
              onChange={(event: SelectChangeEvent<string>) =>
                setViewport(event.target.value)
              }
            >
              <MenuItem value="">
                <em>All</em>
              </MenuItem>
              {viewportList.map((item) => (
                <MenuItem key={item} value={item}>
                  {item}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
      )}
      {customTagsList.length > 0 && (
        <Grid item xs>
          <FormControl variant="standard" fullWidth>
            <InputLabel shrink id="filter_customTags">
              Custom Tags
            </InputLabel>
            <Select
              variant="standard"
              id="filter_customTags"
              value={customTags}
              displayEmpty
              onChange={(event: SelectChangeEvent<string>) =>
                setCustomTags(event.target.value)
              }
            >
              <MenuItem value="">
                <em>All</em>
              </MenuItem>
              {customTagsList.map((item) => (
                <MenuItem key={item} value={item}>
                  {item}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
      )}
      {testStatusList && testStatusList.length > 0 && (
        <Grid item xs>
          <FormControl variant="standard" fullWidth>
            <InputLabel shrink id="filter_testStatus">
              Status
            </InputLabel>
            <Select
              variant="standard"
              id="filter_testStatus"
              value={testStatus}
              displayEmpty
              onChange={(event: SelectChangeEvent<string>) =>
                setTestStatus(event.target.value)
              }
            >
              <MenuItem value="">
                <em>All</em>
              </MenuItem>
              {testStatusList.map((item) => (
                <MenuItem key={item} value={item}>
                  {item}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
      )}
      {branchNameList && branchNameList.length > 0 && (
        <Grid item xs>
          <FormControl variant="standard" fullWidth id={LOCATOR_RESET_FILTER}>
            <InputLabel shrink id="filter_branchName">
              Branch
            </InputLabel>
            <Select
              variant="standard"
              id="filter_branchName"
              value={branchName}
              displayEmpty
              onChange={(event: SelectChangeEvent<string>) =>
                setBranchName(event.target.value)
              }
            >
              <MenuItem value="">
                <em>All</em>
              </MenuItem>
              {branchNameList.map((item) => (
                <MenuItem key={item} value={item}>
                  {item}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
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
            setTestStatus("");
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
