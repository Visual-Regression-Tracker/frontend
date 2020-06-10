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
import { TestVariation } from "../types";

interface IProps {
  items: TestVariation[];
  queryState: [string, React.Dispatch<React.SetStateAction<string>>];
  osState: [string, React.Dispatch<React.SetStateAction<string>>];
  deviceState: [string, React.Dispatch<React.SetStateAction<string>>];
  browserState: [string, React.Dispatch<React.SetStateAction<string>>];
  viewportState: [string, React.Dispatch<React.SetStateAction<string>>];
}

export const TestVariationFilters: React.FunctionComponent<IProps> = ({
  items,
  queryState,
  osState,
  deviceState,
  browserState,
  viewportState,
}) => {
  const [query, setQuery] = queryState;
  const [os, setOs] = osState;
  const [device, setDevice] = deviceState;
  const [browser, setBrowser] = browserState;
  const [viewport, setViewport] = viewportState;

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

  return (
    <React.Fragment>
      <Grid container spacing={2} alignItems="flex-end">
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
      </Grid>
    </React.Fragment>
  );
};
