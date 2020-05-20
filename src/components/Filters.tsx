import React from "react";
import {
  Grid,
  TextField,
  IconButton,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from "@material-ui/core";
import { Clear } from "@material-ui/icons";
import { TestRun } from "../types";

interface IProps {
  testRuns: TestRun[];
  queryState: [string, React.Dispatch<React.SetStateAction<string>>];
  osState: [string, React.Dispatch<React.SetStateAction<string>>];
  browserState: [string, React.Dispatch<React.SetStateAction<string>>];
  viewportState: [string, React.Dispatch<React.SetStateAction<string>>];
  testStatusState: [string, React.Dispatch<React.SetStateAction<string>>];
}

const Filters: React.FunctionComponent<IProps> = ({
  testRuns,
  queryState,
  osState,
  browserState,
  viewportState,
  testStatusState,
}) => {
  const [query, setQuery] = queryState;
  const [os, setOs] = osState;
  const [browser, setBrowser] = browserState;
  const [viewport, setViewport] = viewportState;
  const [testStatus, setTestStatus] = testStatusState;

  const osList = testRuns
    .map((t) => t.testVariation.os)
    .filter((v, i, array) => v && array.indexOf(v) === i);

  const browserList = testRuns
    .map((t) => t.testVariation.browser)
    .filter((v, i, array) => v && array.indexOf(v) === i);

  const viewportList = testRuns
    .map((t) => t.testVariation.viewport)
    .filter((v, i, array) => v && array.indexOf(v) === i);

  const testStatusList = testRuns
    .map((t) => t.status)
    .filter((v, i, array) => v && array.indexOf(v) === i);

  return (
    <React.Fragment>
      <Grid container spacing={2} alignItems='flex-end'>
        <Grid item xs>
          <TextField
            fullWidth
            label="Name"
            value={query}
            onChange={(event) => setQuery(event?.target.value)}
            InputProps={{
              endAdornment: (
                <IconButton onClick={() => setQuery("")}>
                  <Clear />
                </IconButton>
              ),
            }}
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
        {testStatusList.length > 0 && (
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
      </Grid>
    </React.Fragment>
  );
};

export default Filters;
