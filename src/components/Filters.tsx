import React from "react";
import {
  Grid,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Button,
} from "@material-ui/core";
import { TestRun, TestVariation } from "../types";
import { DebounceInput } from "react-debounce-input";

interface IProps {
  items: (TestRun | TestVariation)[];
  queryState: [string, React.Dispatch<React.SetStateAction<string>>];
  osState: [string, React.Dispatch<React.SetStateAction<string>>];
  deviceState: [string, React.Dispatch<React.SetStateAction<string>>];
  browserState: [string, React.Dispatch<React.SetStateAction<string>>];
  viewportState: [string, React.Dispatch<React.SetStateAction<string>>];
  testStatusState?: [string, React.Dispatch<React.SetStateAction<string>>];
}

const Filters: React.FunctionComponent<IProps> = ({
  items,
  queryState,
  osState,
  deviceState,
  browserState,
  viewportState,
  testStatusState,
}) => {
  const [query, setQuery] = queryState;
  const [os, setOs] = osState;
  const [device, setDevice] = deviceState;
  const [browser, setBrowser] = browserState;
  const [viewport, setViewport] = viewportState;
  const [testStatus, setTestStatus] = testStatusState
    ? testStatusState
    : [null, () => {}];

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

  const testStatusList =
    items.some((i) => (i as TestRun).status) &&
    (items as TestRun[])
      .map((t) => t.status)
      .filter((v, i, array) => v && array.indexOf(v) === i);

  return (
    <React.Fragment>
      <Grid container spacing={2} alignItems="flex-end">
        <Grid item xs>
          <DebounceInput
            fullWidth
            label="Name"
            element={TextField}
            minLength={2}
            debounceTimeout={300}
            onChange={(event) => setQuery(event?.target.value)}
          />
        </Grid>
        {osList.length > 0 && (
          <Grid item xs>
            <FormControl fullWidth>
              <InputLabel shrink id="filter_os">
                OS
              </InputLabel>
              <Select
                id="filter_os"
                value={os}
                displayEmpty
                onChange={(event) => setOs(event.target.value as string)}
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
            <FormControl fullWidth>
              <InputLabel shrink id="filter_device">
                Device
              </InputLabel>
              <Select
                id="filter_device"
                value={device}
                displayEmpty
                onChange={(event) => setDevice(event.target.value as string)}
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
            <FormControl fullWidth>
              <InputLabel shrink id="filter_browser">
                Browser
              </InputLabel>
              <Select
                id="filter_browser"
                value={browser}
                displayEmpty
                onChange={(event) => setBrowser(event.target.value as string)}
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
            <FormControl fullWidth>
              <InputLabel shrink id="filter_viewport">
                Viewport
              </InputLabel>
              <Select
                id="filter_viewport"
                value={viewport}
                displayEmpty
                onChange={(event) => setViewport(event.target.value as string)}
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
        {testStatusList && testStatusList.length > 0 && (
          <Grid item xs>
            <FormControl fullWidth>
              <InputLabel shrink id="filter_testStatus">
                Status
              </InputLabel>
              <Select
                id="filter_testStatus"
                value={testStatus}
                displayEmpty
                onChange={(event) =>
                  setTestStatus(event.target.value as string)
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
              setTestStatus("");
            }}
          >
            Reset
          </Button>
        </Grid>
      </Grid>
    </React.Fragment>
  );
};

export default Filters;
